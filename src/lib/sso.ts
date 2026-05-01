import { supabase } from "./supabase";

type SsoPayload = {
  access_token: string;
  refresh_token: string;
  exp: number;
};

function b64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + pad);
}

export async function consumeSsoFromUrl(): Promise<void> {
  try {
    const hash = window.location.hash || "";
    const m = hash.match(/(?:^#|[?&])sso=([^&]+)/);
    if (!m?.[1]) return;
    const payload = JSON.parse(b64UrlDecode(decodeURIComponent(m[1]))) as SsoPayload;
    if (!payload?.access_token || !payload?.refresh_token) return;
    if (!payload?.exp || Date.now() > payload.exp) return;
    await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });
  } catch (e) {
    console.warn("[sso] consume failed", e);
  } finally {
    if (window.location.hash.includes("sso=")) {
      history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }
}

