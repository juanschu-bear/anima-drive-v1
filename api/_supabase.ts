// _supabase.ts — server-side Supabase clients used by API routes.
//
// Untyped on purpose; see src/lib/supabase.ts for the rationale.
//
//   - userClient(token): scoped to a specific user, respects RLS
//   - serviceClient(): bypasses RLS, used to update document state after
//                      we've verified the user owns the row

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("SUPABASE_URL or VITE_SUPABASE_URL must be set");
}
if (!anonKey) {
  throw new Error("SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY must be set");
}

export function userClient(accessToken: string | undefined) {
  return createClient(url!, anonKey!, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceClient() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set for server operations");
  }
  return createClient(url!, serviceKey, {
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
