// _supabase.ts — server-side Supabase clients used by API routes.
//
// Untyped on purpose; see src/lib/supabase.ts for the rationale.
//
//   - userClient(token): scoped to a specific user, respects RLS
//   - serviceClient(): bypasses RLS, used to update document state after
//                      we've verified the user owns the row
//
// IMPORTANT: env var checks are deferred until the client functions are
// actually called. Throwing at module-import time would crash the Vercel
// function with FUNCTION_INVOCATION_FAILED before it can send a proper
// JSON error response.

import { createClient } from "@supabase/supabase-js";

function getUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing env var: SUPABASE_URL (or VITE_SUPABASE_URL) is not set in this environment.",
    );
  }
  return url;
}

function getAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing env var: SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) is not set in this environment.",
    );
  }
  return key;
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing env var: SUPABASE_SERVICE_ROLE_KEY is not set. Note: this must NOT have a VITE_ prefix.",
    );
  }
  return key;
}

export function userClient(accessToken: string | undefined) {
  return createClient(getUrl(), getAnonKey(), {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceClient() {
  return createClient(getUrl(), getServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Extract the bearer token from request headers. */
export function bearerToken(req: { headers: Record<string, string | string[] | undefined> }): string | undefined {
  const h = req.headers["authorization"] ?? req.headers["Authorization"];
  const value = Array.isArray(h) ? h[0] : h;
  if (!value || !value.toLowerCase().startsWith("bearer ")) return undefined;
  return value.slice(7).trim();
}

/** Verify the bearer token and return the user. Throws on failure. */
export async function authedUser(accessToken: string | undefined) {
  if (!accessToken) {
    throw new Error("Missing Authorization header");
  }
  const sb = userClient(accessToken);
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error(error?.message ?? "Invalid token");
  }
  return data.user;
}
