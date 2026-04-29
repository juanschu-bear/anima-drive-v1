// _llm.ts — shared LLM client used by every API route.
// Calls Ollama first (qwen3.5:35b on Juan's box), falls back to Anthropic Haiku.
// Vercel runtime: Node 20+. We use globalThis.fetch which is native there.

const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://77.48.24.250:48439/v1/chat/completions";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:35b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 45000);

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

export interface LlmTextContent {
  type: "text";
  text: string;
}

export interface LlmImageContent {
  type: "image";
  /** Base64-encoded image data (no data:... prefix). */
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export interface LlmImageUrlContent {
  type: "image_url";
  /** Publicly fetchable URL — Anthropic will fetch it server-side. */
  url: string;
}

export interface LlmDocumentContent {
  type: "document";
  /** Base64-encoded PDF data (no data:... prefix). */
  base64: string;
  mediaType: "application/pdf";
}

export interface LlmDocumentUrlContent {
  type: "document_url";
  /** Publicly fetchable PDF URL — Anthropic will fetch it server-side. */
  url: string;
}

export type LlmContent =
  | LlmTextContent
  | LlmImageContent
  | LlmImageUrlContent
  | LlmDocumentContent
  | LlmDocumentUrlContent;

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  /** String for plain text, or an array for multimodal (text+image). */
  content: string | LlmContent[];
}

export interface LlmCallOptions {
  messages: LlmMessage[];
  /** Force a JSON response — both backends honor this. */
  json?: boolean;
  /** Per-call max tokens; Ollama doesn't enforce strictly, Anthropic does. */
  maxTokens?: number;
  /** Temperature; both backends honor this. */
  temperature?: number;
}

export interface LlmCallResult {
  text: string;
  provider: "ollama" | "anthropic";
}

class LlmError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LlmError";
  }
}

function hasBinaryContent(messages: LlmMessage[]): boolean {
  return messages.some(
    (m) =>
      Array.isArray(m.content) &&
      m.content.some(
        (c) =>
          c.type === "image" ||
          c.type === "image_url" ||
          c.type === "document" ||
          c.type === "document_url",
      ),
  );
}

function plainTextContent(content: string | LlmContent[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((c): c is LlmTextContent => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new LlmError(`Timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callOllama(opts: LlmCallOptions): Promise<string> {
  // Ollama OpenAI-compat doesn't reliably handle image content arrays in this setup.
  // If images are present we send the text part only; the caller's logic should
  // decide whether to skip Ollama. Here we strip images defensively.
  const textOnlyMessages = opts.messages.map((m) => ({
    role: m.role,
    content: plainTextContent(m.content),
  }));

  const body: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages: textOnlyMessages,
    stream: false,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }
  if (opts.maxTokens) {
    body.max_tokens = opts.maxTokens;
  }

  const res = await withTimeout(
    fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    OLLAMA_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new LlmError(`Ollama returned ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError("Ollama returned empty content.");
  return content;
}

async function callAnthropic(opts: LlmCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmError("ANTHROPIC_API_KEY not set.");

  // Anthropic API takes system separately, then messages of role user/assistant.
  const systemMsg = opts.messages.find((m) => m.role === "system");
  const others = opts.messages.filter((m) => m.role !== "system");

  // Convert our internal LlmContent[] to Anthropic's content blocks.
  const anthropicMessages = others.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    const blocks = m.content.map((c) => {
      if (c.type === "text") {
        return { type: "text" as const, text: c.text };
      }
      if (c.type === "image") {
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: c.mediaType,
            data: c.base64,
          },
        };
      }
      if (c.type === "image_url") {
        return {
          type: "image" as const,
          source: {
            type: "url" as const,
            url: c.url,
          },
        };
      }
      if (c.type === "document_url") {
        return {
          type: "document" as const,
          source: {
            type: "url" as const,
            url: c.url,
          },
        };
      }
      // document (base64 PDF)
      return {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: c.mediaType,
          data: c.base64,
        },
      };
    });
    return { role: m.role, content: blocks };
  });

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.2,
    ...(systemMsg ? { system: plainTextContent(systemMsg.content) } : {}),
    messages: anthropicMessages,
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new LlmError(`Anthropic returned ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new LlmError("Anthropic returned no text content.");
  return text;
}

export async function llmCall(opts: LlmCallOptions): Promise<LlmCallResult> {
  // Vision/document content goes straight to Anthropic — Ollama in our setup
  // is text-only and would just hallucinate without seeing the file.
  if (hasBinaryContent(opts.messages)) {
    const text = await callAnthropic(opts);
    return { text, provider: "anthropic" };
  }

  // Text-only: try Ollama first, fall back to Anthropic.
  try {
    const text = await callOllama(opts);
    return { text, provider: "ollama" };
  } catch (ollamaErr) {
    // eslint-disable-next-line no-console
    console.warn("[llm] Ollama failed, falling back to Anthropic:", ollamaErr);
    const text = await callAnthropic(opts);
    return { text, provider: "anthropic" };
  }
}

/** Strip markdown code fences and parse JSON. Throws on parse failure. */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  // Remove ```json … ``` or ``` … ``` fences.
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  // Some models add prose before/after JSON; pick the first {...} block.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  const parsed = JSON.parse(cleaned) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LlmError("LLM JSON parse produced a non-object payload.");
  }
  return parsed as T;
}
