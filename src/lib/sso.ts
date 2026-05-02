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
    const hashMatch = hash.match(/(?:^#|[?&])sso=([^&]+)/);
    const search = window.location.search || "";
    const queryMatch = search.match(/(?:^\?|&)sso=([^&]+)/);
    const token = hashMatch?.[1] || queryMatch?.[1];
    if (!token) return;
    const payload = JSON.parse(b64UrlDecode(decodeURIComponent(token))) as SsoPayload;
    if (!payload?.access_token || !payload?.refresh_token) return;
    if (!payload?.exp || Date.now() > payload.exp) return;
    await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });
  } catch (e) {
    console.warn("[sso] consume failed", e);
  } finally {
    const url = new URL(window.location.href);
    const hadSsoInHash = url.hash.includes("sso=");
    const hadSsoInQuery = url.searchParams.has("sso");
    if (hadSsoInQuery) url.searchParams.delete("sso");
    if (hadSsoInHash) url.hash = "";
    if (hadSsoInHash || hadSsoInQuery) {
      history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }
}
