// api/extract.ts — universal document extraction.
//
// Supports ANY kind of document, not just financial.
//
// Flow:
//   1. Authenticate, fetch doc.
//   2. Generate a signed URL for the file in storage.
//   3. If the file is an image, fetch it and base64-encode it so we can pass
//      it to a vision-capable LLM (Anthropic Haiku). For PDFs/other we work
//      with filename + mime + category metadata; vision PDF support will land
//      in a follow-up.
//   4. Ask the LLM to:
//        a) classify document_type ('financial' | 'contract' | 'legal' |
//           'medical' | 'educational' | 'technical' | 'correspondence' |
//           'personal' | 'media' | 'other')
//        b) always produce a display_name and a one-paragraph summary
//        c) for financial docs, fill the legacy fields (vendor, total, date,
//           VAT, line items)
//        d) for other types, fill type-specific fields into a `metadata`
//           jsonb object
//   5. Persist into ad_extractions (+ ad_line_items for financial).
//   6. Update the document row: status='ready', display_name set.
//   7. Activity entry.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { llmCall, parseJsonResponse, type LlmContent } from "./_llm.js";
import { authedUser, bearerToken, userClient, serviceClient } from "./_supabase.js";

const STORAGE_BUCKET = "ad-docs";
const SIGNED_URL_TTL_SEC = 60 * 5;

// ─────────────────────────────────────────────────────────────────────
// Result schema
// ─────────────────────────────────────────────────────────────────────

type DocumentType =
  | "financial"
  | "contract"
  | "legal"
  | "medical"
  | "educational"
  | "technical"
  | "correspondence"
  | "personal"
  | "media"
  | "other";

interface LineItem {
  description: string;
  quantity?: number | null;
  unit_price?: number | null;
  amount: number;
}

interface ExtractionResult {
  display_name: string;
  document_type: DocumentType;
  summary: string;

  // Financial-only fields
  vendor?: string | null;
  doc_date?: string | null; // ISO YYYY-MM-DD
  total_amount?: number | null;
  currency?: string | null;
  vat_amount?: number | null;
  vat_rate?: number | null;
  invoice_number?: string | null;
  due_date?: string | null;
  payment_terms?: string | null;
  line_items?: LineItem[];

  // Type-specific structured fields (jsonb)
  metadata?: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Anima, a universal document extractor. You analyze documents of ANY kind — invoices, contracts, letters, medical records, technical specs, IDs, photos of receipts, screenshots — and extract structured data from them.

Output ONLY a JSON object. No prose, no code fences, just the JSON.

Schema:
{
  "display_name": string,                  // REQUIRED. Short human-readable title (30-80 chars). E.g. "AWS Invoice March 2026", "Mietvertrag Wohnung Berlin", "Hotel Berlin Mar 12 Receipt", "Codex Video Analysis Spec v2".
  "document_type": "financial" | "contract" | "legal" | "medical" | "educational" | "technical" | "correspondence" | "personal" | "media" | "other",  // REQUIRED.
  "summary": string,                       // REQUIRED. One paragraph (2-4 sentences) describing what this document is and contains, in the same language as the document.

  // FINANCIAL fields — fill these ONLY when document_type === "financial":
  "vendor": string | null,
  "doc_date": "YYYY-MM-DD" | null,
  "total_amount": number | null,           // bare number, no currency symbol
  "currency": "EUR" | "USD" | "GBP" | "CHF" | string | null,
  "vat_amount": number | null,
  "vat_rate": number | null,
  "invoice_number": string | null,
  "due_date": "YYYY-MM-DD" | null,
  "payment_terms": string | null,
  "line_items": [{"description": string, "quantity": number | null, "unit_price": number | null, "amount": number}],

  // METADATA — type-specific structured fields. Schema varies by document_type:
  "metadata": {
    // For "contract":         {parties: string[], contract_type: string, effective_date: "YYYY-MM-DD" | null, key_terms: string[]}
    // For "legal":             {parties: string[], case_or_reference: string | null, court_or_authority: string | null, key_points: string[]}
    // For "medical":           {patient_name: string | null, doctor: string | null, date: "YYYY-MM-DD" | null, diagnosis_or_topic: string | null, prescription: string | null}
    // For "educational":       {institution: string | null, student_name: string | null, document_kind: string, date: "YYYY-MM-DD" | null, grade_or_outcome: string | null}
    // For "technical":         {title: string, topics: string[], language: string | null, key_concepts: string[]}
    // For "correspondence":    {from: string | null, to: string | null, subject: string | null, date: "YYYY-MM-DD" | null}
    // For "personal":          {document_kind: string, full_name: string | null, identifier: string | null, valid_until: "YYYY-MM-DD" | null}
    // For "media":             {description: string, detected_objects: string[]}
    // For "other":             {key_facts: string[]}
  }
}

Rules:
- ALWAYS output display_name, document_type, and summary. They must never be missing.
- Use null (not empty string) for unknown values.
- For images, READ the document — describe what is actually there, do not invent.
- For non-image documents (PDF without vision support), make a best guess from filename and any context provided. If you genuinely cannot tell, set document_type="other" and explain in the summary.
- Numbers are bare numerics (no currency symbol).
- The summary should be useful — what would a human want to remember about this document later?`;

// ─────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let documentId: string | undefined;
  try {
    documentId = (req.body as { documentId?: string } | undefined)?.documentId;
    return await handle(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[extract] uncaught error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (documentId) {
      try {
        const svc = serviceClient();
        await svc
          .from("ad_documents")
          .update({
            status: "failed",
            error_message: message.slice(0, 500),
          })
          .eq("id", documentId);
      } catch {
        // ignore
      }
    }
    res.status(500).json({ error: message });
  }
}

async function handle(req: VercelRequest, res: VercelResponse) {
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

  // ── Sign URL ────────────────────────────────────────────────────────
  const { data: signed, error: signErr } = await svc.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SEC);
  if (signErr || !signed) {
    res.status(500).json({ error: signErr?.message ?? "Failed to sign URL" });
    return;
  }

  // ── Build the LLM messages ──────────────────────────────────────────
  // Send images and PDFs to Anthropic Vision so it actually reads the document.
  // We pass the Supabase Signed URL directly — Anthropic fetches the file
  // server-side, which sidesteps Vercel's request body size limits entirely.
  // Other formats (Word, Excel, eml, csv) fall back to text-only context for now.
  const isImage = isImageMime(doc.mime_type, doc.ext);
  const isPdf = isPdfMime(doc.mime_type, doc.ext);
  let userContent: string | LlmContent[];
  if (isImage) {
    const textBlock: LlmContent = {
      type: "text",
      text: buildContextPrompt(doc),
    };
    const imageBlock: LlmContent = {
      type: "image_url",
      url: signed.signedUrl,
    };
    userContent = [textBlock, imageBlock];
  } else if (isPdf) {
    const textBlock: LlmContent = {
      type: "text",
      text: buildContextPrompt(doc),
    };
    const pdfBlock: LlmContent = {
      type: "document_url",
      url: signed.signedUrl,
    };
    userContent = [textBlock, pdfBlock];
  } else {
    userContent = buildContextPrompt(doc);
  }

  // ── Call LLM ────────────────────────────────────────────────────────
  let extracted: ExtractionResult;
  let provider: string;
  try {
    const llm = await llmCall({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
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

  // ── Validate and normalize ─────────────────────────────────────────
  const docType = normalizeDocType(extracted.document_type);
  const displayName = (extracted.display_name ?? "").trim().slice(0, 200) || doc.filename;
  const summary = (extracted.summary ?? "").trim();

  // ── Persist ad_extractions ──────────────────────────────────────────
  const extractionRow = {
    document_id: documentId,
    document_type: docType,
    summary: summary || null,
    metadata: extracted.metadata ?? null,
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

  // ── Line items (only for financial) ─────────────────────────────────
  await svc.from("ad_line_items").delete().eq("extraction_id", extractionId);
  if (docType === "financial" && extracted.line_items && extracted.line_items.length > 0) {
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

  // ── Mark doc ready + display_name ───────────────────────────────────
  await svc
    .from("ad_documents")
    .update({
      status: "ready",
      display_name: displayName,
      extracted_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", documentId);

  // ── Activity entry ──────────────────────────────────────────────────
  await svc.from("ad_activities").insert({
    user_id: user.id,
    document_id: documentId,
    type: "extracted",
    message: `Extracted ${docType} document: ${displayName}`,
    metadata: { provider, document_type: docType },
  });

  res.status(200).json({
    documentId,
    extractionId,
    document_type: docType,
    display_name: displayName,
    provider,
  });
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function isImageMime(mime: string | null, ext: string): boolean {
  if (mime?.startsWith("image/")) return true;
  const e = ext?.toLowerCase();
  return e === "jpg" || e === "jpeg" || e === "png" || e === "gif" || e === "webp";
}

function isPdfMime(mime: string | null, ext: string): boolean {
  if (mime === "application/pdf") return true;
  return ext?.toLowerCase() === "pdf";
}

interface DocLite {
  filename: string;
  ext: string;
  mime_type: string | null;
  category_key: string | null;
}

function buildContextPrompt(doc: DocLite): string {
  return `Document context:
- filename: ${doc.filename}
- extension: ${doc.ext}
- mime type: ${doc.mime_type ?? "unknown"}
- preliminary category: ${doc.category_key ?? "none"}

Analyze this document and return the JSON object now.`;
}

function normalizeDocType(t: string | undefined): DocumentType {
  const allowed: DocumentType[] = [
    "financial",
    "contract",
    "legal",
    "medical",
    "educational",
    "technical",
    "correspondence",
    "personal",
    "media",
    "other",
  ];
  const v = (t ?? "").toLowerCase();
  if (allowed.includes(v as DocumentType)) return v as DocumentType;
  return "other";
}
