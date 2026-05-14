// supabase.ts — Supabase browser client.
//
// Untyped on purpose; see notes in api/_supabase.ts. The Database generic
// from Supabase v2 requires their `gen types` output to satisfy the strict
// internal markers, so we cast at call sites instead.
//
// When env vars are missing, we still create a client (with a placeholder URL
// that won't be reachable) so the app boots and the Auth provider can detect
// the missing config and fall back to demo mode. Without this fallback,
// createClient throws "supabaseUrl is required" on import and the whole app
// fails to render.

import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const dequoted = raw.trim().replace(/^['"]+|['"]+$/g, "");
  const trimmed = dequoted.replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "");
    if (
      path === "/auth/v1" ||
      path === "/rest/v1" ||
      path === "/storage/v1" ||
      path === "/functions/v1" ||
      path === "/realtime/v1"
    ) {
      // eslint-disable-next-line no-console
      console.warn(`[anima-drive] Normalized SUPABASE_URL from ${parsed.pathname} to project base origin.`);
      return parsed.origin;
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

const runtimeEnv = (globalThis as any).__ANIMA_ENV__ ?? {};
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ??
  runtimeEnv.SUPABASE_URL;
const url = normalizeSupabaseUrl(rawUrl);
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ??
  runtimeEnv.SUPABASE_ANON_KEY;

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";
let clientConfigured = Boolean(url && anonKey);

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[anima-drive] Supabase env vars missing. " +
      "Set SUPABASE_URL/SUPABASE_ANON_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) to enable backend. " +
      "Running in demo mode with mock data.",
  );
}

export const supabase = (() => {
  try {
    return createClient(
      url || PLACEHOLDER_URL,
      anonKey || PLACEHOLDER_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  } catch (error) {
    // Invalid env values should not white-screen the app.
    // eslint-disable-next-line no-console
    console.error("[anima-drive] Failed to init Supabase client, falling back to demo mode:", error);
    clientConfigured = false;
    return createClient(PLACEHOLDER_URL, PLACEHOLDER_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
})();

export const STORAGE_BUCKET = "ad-docs";

/** Returns true iff the env vars are populated. Useful for graceful fallback to mocks. */
export function isSupabaseConfigured(): boolean {
  return clientConfigured;
}
