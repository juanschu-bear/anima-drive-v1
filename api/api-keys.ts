import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authedUser, bearerToken, serviceClient } from "./_supabase.js";
import { createApiKeySecret, normalizeScopes, redactApiKeyPrefix } from "./_api_keys.js";

type Row = {
  id: string;
  name: string | null;
  key_prefix: string;
  scopes: string[] | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

function respondMethodNotAllowed(res: VercelResponse, allow: string) {
  res.setHeader("Allow", allow);
  return res.status(405).json({ error: "Method not allowed" });
}

async function listKeys(userId: string, res: VercelResponse) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("ad_api_keys")
    .select("id,name,key_prefix,scopes,created_at,last_used_at,revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const rows = (data || []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    prefix: redactApiKeyPrefix(r.key_prefix),
    scopes: Array.isArray(r.scopes) ? r.scopes : [],
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
    revokedAt: r.revoked_at,
    active: !r.revoked_at,
  }));
  return res.status(200).json({ ok: true, rows });
}

async function createKey(userId: string, req: VercelRequest, res: VercelResponse) {
  const body = req.body || {};
  const name = String(body.name || "").trim() || null;
  const scopes = normalizeScopes(body.scopes);
  const { secret, prefix, hash } = createApiKeySecret();
  const admin = serviceClient();
  const { data, error } = await admin
    .from("ad_api_keys")
    .insert({
      user_id: userId,
      name,
      key_prefix: prefix,
      key_hash: hash,
      scopes,
    })
    .select("id,created_at")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await admin.from("ad_api_key_events").insert({
    api_key_id: data.id,
    user_id: userId,
    event_type: "created",
  });
  return res.status(201).json({
    ok: true,
    key: {
      id: data.id,
      secret,
      prefix: redactApiKeyPrefix(prefix),
      scopes,
      createdAt: data.created_at,
    },
  });
}

async function revokeKey(userId: string, req: VercelRequest, res: VercelResponse) {
  const keyId = String(req.body?.id || "").trim();
  if (!keyId) return res.status(400).json({ error: "id is required" });
  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("ad_api_keys")
    .update({ revoked_at: now })
    .eq("id", keyId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data?.id) return res.status(404).json({ error: "Key not found" });
  await admin.from("ad_api_key_events").insert({
    api_key_id: keyId,
    user_id: userId,
    event_type: "revoked",
  });
  return res.status(200).json({ ok: true, revoked: keyId });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId = "";
  try {
    const user = await authedUser(bearerToken(req));
    userId = user.id;
  } catch (e) {
    return res.status(401).json({ error: e instanceof Error ? e.message : "Unauthorized" });
  }

  if (req.method === "GET") return listKeys(userId, res);
  if (req.method === "POST") return createKey(userId, req, res);
  if (req.method === "DELETE") return revokeKey(userId, req, res);
  return respondMethodNotAllowed(res, "GET, POST, DELETE");
}
