// api/extract.ts — extracts structured data from a document.
//
// Flow:
//   1. Authenticate, fetch doc.
//   2. Generate signed URL for the file in storage.
//   3. Ask LLM to extract { vendor, doc_date, total_amount, currency,
//      vat_amount, vat_rate, invoice_number, due_date, payment_terms,
//      line_items[] } as JSON.
//      - For images, we pass the signed URL so a vision-capable model can see it.
//      - For PDFs and others, we use filename heuristics in V1 (vision PDF
//        support is uneven across LLMs); a follow-up can run pdf-parse here.
//   4. Insert ad_extractions row + ad_line_items rows.
//   5. Update document status to 'ready'.
//   6. Insert activity entry.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { llmCall, parseJsonResponse } from "./_llm.js";
import { authedUser, bearerToken, userClient, serviceClient } from "./_supabase.js";

const STORAGE_BUCKET = "ad-docs";
const SIGNED_URL_TTL_SEC = 60 * 5;

interface LineItem {
  description: string;
  quantity?: number | null;
  unit_price?: number | null;
  amount: number;
}

interface ExtractionResult {
  vendor?: string | null;
  doc_date?: string | null;          // ISO date YYYY-MM-DD
  total_amount?: number | null;
  currency?: string | null;          // ISO 4217 (EUR, USD, …)
  vat_amount?: number | null;
  vat_rate?: number | null;
  invoice_number?: string | null;
  due_date?: string | null;
  payment_terms?: string | null;
  line_items?: LineItem[];
}

const SYSTEM_PROMPT = `You extract structured financial data from a single business document.

Output ONLY a JSON object matching this schema (omit fields you cannot determine, never invent):
{
  "vendor": string | null,
  "doc_date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "currency": "EUR" | "USD" | "GBP" | "CHF" | string | null,
  "vat_amount": number | null,
  "vat_rate": number | null,
  "invoice_number": string | null,
  "due_date": "YYYY-MM-DD" | null,
  "payment_terms": string | null,
  "line_items": [{"description": string, "quantity": number | null, "unit_price": number | null, "amount": number}]
}

Rules:
- Numbers are bare numerics (no currency symbol).
- Use null for unknown values; do not guess.
- Currency is the 3-letter ISO code (default "EUR" for European invoices).
- Total amount is the gross total the customer owes.`;

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

  let user;
  try {
    user = await authedUser(bearerToken(req));
  } catch (e) {
    res.status(401).json({ error: e instanceof Error ? e.message : "Unauthorized" });
    return;
  }

  const sb = userClient(bearerToken(req));
  const svc = serviceClient();

  const { data: doc, error: fetchErr } = await sb
    .from("ad_documents")
    .select("id, user_id, filename, ext, mime_type, storage_path, category_key")
    .eq("id", documentId)
    .single();
  if (fetchErr || !doc) {
    res.status(404).json({ error: fetchErr?.message ?? "Document not found" });
    return;
  }

  // Generate a short-lived signed URL so the LLM (or follow-up tools) can read the file.
  const { data: signed, error: signErr } = await svc.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SEC);
  if (signErr || !signed) {
    res.status(500).json({ error: signErr?.message ?? "Failed to sign URL" });
    return;
  }

  const userPrompt = `Document:
- filename: ${doc.filename}
- file extension: ${doc.ext}
- mime type: ${doc.mime_type ?? "unknown"}
- assigned category: ${doc.category_key ?? "unknown"}
- signed URL (valid 5 min): ${signed.signedUrl}

If the URL points to an image you can fetch, use it to read the document. Otherwise infer what you can from the filename and category.

Return the JSON object now.`;

  let extracted: ExtractionResult;
  let provider: string;
  try {
    const llm = await llmCall({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      json: true,
      temperature: 0.1,
      maxTokens: 1500,
    });
    provider = llm.provider;
    extracted = parseJsonResponse<ExtractionResult>(llm.text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    await svc
      .from("ad_documents")
      .update({ status: "failed", error_message: `extract: ${message}` })
      .eq("id", documentId);
    res.status(502).json({ error: message });
    return;
  }

  // Insert extraction row (one per document).
  const extractionRow = {
    document_id: documentId,
    vendor: extracted.vendor ?? null,
    doc_date: extracted.doc_date ?? null,
    total_amount: extracted.total_amount ?? null,
    currency: extracted.currency ?? "EUR",
    vat_amount: extracted.vat_amount ?? null,
    vat_rate: extracted.vat_rate ?? null,
    invoice_number: extracted.invoice_number ?? null,
    due_date: extracted.due_date ?? null,
    payment_terms: extracted.payment_terms ?? null,
    raw_extraction: extracted as unknown,
  };

  // Upsert by document_id (we have a unique index there).
  const { data: extractionInserted, error: extractionErr } = await svc
    .from("ad_extractions")
    .upsert(extractionRow, { onConflict: "document_id" })
    .select("id")
    .single();

  if (extractionErr || !extractionInserted) {
    res.status(500).json({ error: extractionErr?.message ?? "Failed to save extraction" });
    return;
  }
  const extractionId = (extractionInserted as { id: string }).id;

  // Wipe old line items, insert new ones.
  await svc.from("ad_line_items").delete().eq("extraction_id", extractionId);
  if (extracted.line_items && extracted.line_items.length > 0) {
    const rows = extracted.line_items
      .filter((li) => li && typeof li.description === "string" && Number.isFinite(li.amount))
      .map((li, idx) => ({
        extraction_id: extractionId,
        description: li.description,
        quantity: li.quantity ?? null,
        unit_price: li.unit_price ?? null,
        amount: Number(li.amount),
        position: idx,
      }));
    if (rows.length > 0) {
      await svc.from("ad_line_items").insert(rows);
    }
  }

  // Mark document ready.
  await svc
    .from("ad_documents")
    .update({
      status: "ready",
      extracted_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", documentId);

  // Activity entry.
  await svc.from("ad_activities").insert({
    user_id: user.id,
    document_id: documentId,
    type: "extracted",
    message: `Extracted data from ${doc.filename}${extracted.vendor ? ` (${extracted.vendor})` : ""}`,
    metadata: {
      provider,
      total: extracted.total_amount,
      currency: extracted.currency ?? "EUR",
    },
  });

  res.status(200).json({
    documentId,
    extractionId,
    vendor: extracted.vendor,
    total_amount: extracted.total_amount,
    currency: extracted.currency,
    provider,
  });
}
