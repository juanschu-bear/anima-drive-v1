// api/ask.ts — natural language queries over the user's document corpus.
//
// V1 retrieval is simple: pull the user's recent documents + their extractions,
// pack them into the system prompt, and let the LLM answer + reference doc IDs.
// Returns: { answer, document_refs, provider }
//
// Future: vector search over chunks, conversation memory, streaming.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { llmCall, parseJsonResponse } from "./_llm.js";
import { authedUser, bearerToken, userClient, serviceClient } from "./_supabase.js";

interface AskBody {
  message?: string;
  conversationId?: string | null;
}

interface AskResult {
  answer: string;
  document_refs?: string[];
}

const MAX_DOCS_IN_CONTEXT = 30;

const SYSTEM_PROMPT = `You are Anima, the user's personal financial assistant. You answer questions strictly using the provided document corpus.

Output ONLY a JSON object: {"answer": "...", "document_refs": ["doc_id_1", ...]}
- answer: short, conversational, in the user's language. If the corpus doesn't contain the answer, say so honestly.
- document_refs: array of document UUIDs (strings) you grounded the answer in. Empty array if none.

Be concise. Use bullets only when listing 3+ items. Currency amounts: format with the document's currency code.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handle(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ask] uncaught error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
}

async function handle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as AskBody | undefined;
  const message = body?.message?.trim();
  if (!message) {
    res.status(400).json({ error: "Missing message" });
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

  // Pull user's documents + extractions (single query each, joined client-side).
  const { data: docs, error: docsErr } = await sb
    .from("ad_documents")
    .select("id, filename, category_key, uploaded_at, status")
    .eq("status", "ready")
    .order("uploaded_at", { ascending: false })
    .limit(MAX_DOCS_IN_CONTEXT);
  if (docsErr) {
    res.status(500).json({ error: docsErr.message });
    return;
  }

  const docList = (docs ?? []) as Array<{
    id: string;
    filename: string;
    category_key: string | null;
    uploaded_at: string;
    status: string;
  }>;

  let extractions: Array<{
    document_id: string;
    vendor: string | null;
    doc_date: string | null;
    total_amount: number | null;
    currency: string | null;
    invoice_number: string | null;
    due_date: string | null;
  }> = [];

  if (docList.length > 0) {
    const { data: ex } = await sb
      .from("ad_extractions")
      .select("document_id, vendor, doc_date, total_amount, currency, invoice_number, due_date")
      .in("document_id", docList.map((d) => d.id));
    extractions = (ex ?? []) as typeof extractions;
  }

  const exMap = new Map(extractions.map((e) => [e.document_id, e]));

  const corpusLines = docList.map((d) => {
    const e = exMap.get(d.id);
    const parts = [
      `id=${d.id}`,
      `name="${d.filename}"`,
      `category=${d.category_key ?? "unknown"}`,
      `uploaded=${d.uploaded_at.slice(0, 10)}`,
    ];
    if (e?.vendor) parts.push(`vendor="${e.vendor}"`);
    if (e?.doc_date) parts.push(`date=${e.doc_date}`);
    if (e?.total_amount != null) parts.push(`total=${e.total_amount}${e.currency ?? "EUR"}`);
    if (e?.invoice_number) parts.push(`invoice=${e.invoice_number}`);
    return `- ${parts.join(", ")}`;
  });

  const corpus =
    corpusLines.length > 0
      ? corpusLines.join("\n")
      : "(No documents have been uploaded and processed yet.)";

  const userPrompt = `User question: ${message}

Document corpus:
${corpus}

Answer the user's question, grounded in the corpus only. Return JSON.`;

  let result: AskResult;
  let provider: string;
  try {
    const llm = await llmCall({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      json: true,
      temperature: 0.3,
      maxTokens: 800,
    });
    provider = llm.provider;
    result = parseJsonResponse<AskResult>(llm.text);
  } catch (err) {
    const message_ = err instanceof Error ? err.message : "LLM call failed";
    res.status(502).json({ error: message_ });
    return;
  }

  // Persist conversation if requested.
  let conversationId = body?.conversationId ?? null;
  if (conversationId === null || conversationId === undefined) {
    const title = message.length > 60 ? message.slice(0, 57) + "…" : message;
    const { data: conv } = await svc
      .from("ad_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    conversationId = (conv as { id: string } | null)?.id ?? null;
  }
  if (conversationId) {
    await svc.from("ad_messages").insert([
      {
        conversation_id: conversationId,
        role: "user",
        content: message,
      },
      {
        conversation_id: conversationId,
        role: "assistant",
        content: result.answer,
        document_refs: result.document_refs ?? [],
      },
    ]);
    await svc
      .from("ad_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  res.status(200).json({
    answer: result.answer,
    document_refs: result.document_refs ?? [],
    conversationId,
    provider,
  });
}
