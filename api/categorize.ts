// api/categorize.ts — assigns one of 16 categories to a document.
//
// Flow:
//   1. Verify user owns the document (RLS via user-scoped client).
//   2. Build a small probe of the document content:
//      - PDFs: signed URL passed by reference (we DO NOT extract PDF text here;
//        for the V1 we use filename + content-type heuristics so we stay fast).
//      - Images: filename heuristic only (full vision parsing happens in /api/extract).
//   3. Ask LLM to pick the best category_key from the fixed taxonomy.
//   4. Update the row's category_key/category_confidence/status.
//   5. Insert an activity row.
//   6. Trigger /api/extract async (fire-and-forget).
//
// Returns 200 on success with the chosen category, even if the trigger of
// /api/extract failed — extraction is allowed to be retried later.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { llmCall, parseJsonResponse } from "./_llm";
import { authedUser, bearerToken, userClient, serviceClient } from "./_supabase";

const CATEGORY_DEFINITIONS = [
  { key: "cat_revenue",       label: "Revenue / income",                    examples: "invoices issued to customers, sales receipts" },
  { key: "cat_expenses",      label: "General business expenses",           examples: "office supplies, miscellaneous purchases, hosting fees" },
  { key: "cat_salaries",      label: "Salaries and payroll",                examples: "payslips, payroll reports, employee compensation" },
  { key: "cat_rent",          label: "Rent / lease",                        examples: "office rent invoices, lease agreements, property rental contracts" },
  { key: "cat_insurance",     label: "Insurance",                           examples: "insurance policies, premiums, claims" },
  { key: "cat_taxes",         label: "Taxes",                               examples: "tax returns, VAT statements, tax authority correspondence" },
  { key: "cat_depreciation",  label: "Depreciation",                        examples: "depreciation schedules, asset registers" },
  { key: "cat_travel",        label: "Travel",                              examples: "flight bookings, hotel invoices, train tickets, taxi receipts when traveling" },
  { key: "cat_office",        label: "Office supplies",                     examples: "stationery, printer ink, office furniture" },
  { key: "cat_marketing",     label: "Marketing",                           examples: "ad spend invoices, LinkedIn / Meta / Google Ads, design contractor invoices" },
  { key: "cat_software",      label: "Software & licenses",                 examples: "SaaS subscriptions, software licenses, hosting like AWS, Notion, Figma" },
  { key: "cat_consulting",    label: "Consulting / professional services",  examples: "consultant invoices, legal fees, accountant fees" },
  { key: "cat_vehicle",       label: "Vehicle costs",                       examples: "fuel receipts, vehicle insurance, repair invoices" },
  { key: "cat_telecom",       label: "Telecommunications",                  examples: "phone, internet, mobile data plans" },
  { key: "cat_entertainment", label: "Business entertainment / hospitality", examples: "client dinners, event hosting" },
  { key: "cat_other",         label: "Other / uncategorized",               examples: "anything that doesn't clearly match the categories above" },
];

const SYSTEM_PROMPT = `You are a financial document classifier. Given metadata about an uploaded business document, you assign exactly one category from the fixed list provided.

You output ONLY a JSON object of the form: {"category_key": "cat_xxx", "confidence": 0.0-1.0, "reason": "short reason"}

The category_key MUST be one of the keys in the provided category list. confidence must be between 0 and 1.`;

interface ClassifyResult {
  category_key: string;
  confidence: number;
  reason?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as { documentId?: string } | undefined;
  const documentId = body?.documentId;
  if (!documentId) {
    res.status(400).json({ error: "Missing documentId" });
    return;
  }

  // 1. Authenticate.
  let user;
  try {
    user = await authedUser(bearerToken(req));
  } catch (e) {
    res.status(401).json({ error: e instanceof Error ? e.message : "Unauthorized" });
    return;
  }

  const sb = userClient(bearerToken(req));
  const svc = serviceClient();

  // 2. Fetch the doc with user scope (RLS blocks foreign rows).
  const { data: doc, error: fetchErr } = await sb
    .from("ad_documents")
    .select("id, user_id, filename, ext, mime_type, status, storage_path")
    .eq("id", documentId)
    .single();
  if (fetchErr || !doc) {
    res.status(404).json({ error: fetchErr?.message ?? "Document not found" });
    return;
  }

  // Mark categorizing.
  await svc
    .from("ad_documents")
    .update({ status: "categorizing" })
    .eq("id", documentId);

  // 3. Build prompt. We use filename + ext for now; richer probes can come later.
  const userPrompt = `Document metadata:
- filename: ${doc.filename}
- file extension: ${doc.ext}
- mime type: ${doc.mime_type ?? "unknown"}

Available categories (pick exactly one):
${CATEGORY_DEFINITIONS.map((c) => `- ${c.key}: ${c.label} (${c.examples})`).join("\n")}

Return JSON only.`;

  let result: ClassifyResult;
  let provider: string;
  try {
    const llm = await llmCall({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      json: true,
      temperature: 0.1,
      maxTokens: 200,
    });
    provider = llm.provider;
    result = parseJsonResponse<ClassifyResult>(llm.text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    await svc
      .from("ad_documents")
      .update({ status: "failed", error_message: `categorize: ${message}` })
      .eq("id", documentId);
    res.status(502).json({ error: message });
    return;
  }

  // Validate result.
  const validKey = CATEGORY_DEFINITIONS.find((c) => c.key === result.category_key);
  if (!validKey) {
    await svc
      .from("ad_documents")
      .update({
        status: "failed",
        error_message: `categorize: invalid category_key ${result.category_key}`,
      })
      .eq("id", documentId);
    res.status(502).json({ error: `Invalid category_key: ${result.category_key}` });
    return;
  }
  const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0));

  // 4. Persist category.
  const { error: updateErr } = await svc
    .from("ad_documents")
    .update({
      category_key: result.category_key,
      category_confidence: confidence,
      status: "extracting",
      categorized_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", documentId);

  if (updateErr) {
    res.status(500).json({ error: updateErr.message });
    return;
  }

  // 5. Activity feed entry.
  await svc.from("ad_activities").insert({
    user_id: user.id,
    document_id: documentId,
    type: "categorized",
    message: `Categorized ${doc.filename} as ${validKey.label}`,
    metadata: { confidence, provider, reason: result.reason ?? null },
  });

  // 6. Trigger extract asynchronously. We don't await the response so the user
  // gets a fast 200 — extraction completes in its own request.
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host;
  if (host) {
    const extractUrl = `${proto}://${host}/api/extract`;
    fetch(extractUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization ?? "",
      },
      body: JSON.stringify({ documentId }),
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn("[categorize] extract trigger failed:", e);
    });
  }

  res.status(200).json({
    documentId,
    category_key: result.category_key,
    confidence,
    provider,
  });
}
