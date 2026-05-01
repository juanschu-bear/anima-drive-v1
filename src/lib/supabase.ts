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

const runtimeEnv = (globalThis as any).__ANIMA_ENV__ ?? {};
const url =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ??
  runtimeEnv.SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ??
  runtimeEnv.SUPABASE_ANON_KEY;

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[anima-drive] Supabase env vars missing. " +
      "Set SUPABASE_URL/SUPABASE_ANON_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) to enable backend. " +
      "Running in demo mode with mock data.",
  );
}

export const supabase = createClient(
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

export const STORAGE_BUCKET = "ad-docs";

/** Returns true iff the env vars are populated. Useful for graceful fallback to mocks. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
