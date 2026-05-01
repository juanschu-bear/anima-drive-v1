import crypto from "node:crypto";

const KEY_PREFIX = "anima_live_";
const VISIBLE_PREFIX_LEN = 12;

export type ApiKeyScope =
  | "drive:read"
  | "drive:write"
  | "sheets:read"
  | "whatsanima:ingest";

const ALLOWED_SCOPES: Set<ApiKeyScope> = new Set([
  "drive:read",
  "drive:write",
  "sheets:read",
  "whatsanima:ingest",
]);

export function normalizeScopes(input: unknown): ApiKeyScope[] {
  if (!Array.isArray(input)) return [];
  const dedup = new Set<ApiKeyScope>();
  for (const raw of input) {
    const s = String(raw || "").trim() as ApiKeyScope;
    if (ALLOWED_SCOPES.has(s)) dedup.add(s);
  }
  return [...dedup];
}

export function createApiKeySecret(): { secret: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString("base64url");
  const secret = `${KEY_PREFIX}${random}`;
  const prefix = secret.slice(0, VISIBLE_PREFIX_LEN);
  const hash = crypto.createHash("sha256").update(secret).digest("hex");
  return { secret, prefix, hash };
}

export function hashApiKey(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function redactApiKeyPrefix(prefix: string): string {
  return `${prefix}...`;
}
