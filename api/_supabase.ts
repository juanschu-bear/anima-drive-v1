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
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "./_env.js";

function getUrl(): string {
  return getSupabaseUrl();
}

function getAnonKey(): string {
  return getSupabaseAnonKey();
}

function getServiceKey(): string {
  return getSupabaseServiceRoleKey();
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
