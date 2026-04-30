import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authedUser, bearerToken, serviceClient } from "./_supabase.js";
import { emitCfoEvent, recomputeCfoProfile } from "./_cfo.js";

const STALE_MS = 30 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handle(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[cfo-profile] uncaught error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
}

async function handle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let user;
  try {
    user = await authedUser(bearerToken(req));
  } catch (e) {
    res.status(401).json({ error: e instanceof Error ? e.message : "Unauthorized" });
    return;
  }

  const svc = serviceClient();
  const force = req.method === "POST" || req.query.force === "1";

  const { data: profileExisting } = await svc
    .from("ad_cfo_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStale =
    !profileExisting ||
    !profileExisting.last_recomputed_at ||
    Date.now() - Date.parse(profileExisting.last_recomputed_at) > STALE_MS;

  if (force || isStale) {
    await recomputeCfoProfile(svc, user.id);
    await emitCfoEvent(svc, {
      userId: user.id,
      eventType: "cfo_profile_recomputed",
      source: "anima-drive.cfo-profile",
      payload: { force, reason: force ? "manual" : "stale_profile" },
    });
  }

  const [{ data: profile }, { data: activeSignals }, { data: recommendations }] = await Promise.all([
    svc.from("ad_cfo_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    svc
      .from("ad_cfo_signals")
      .select("id, signal_key, severity, score, title, details, payload, detected_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("detected_at", { ascending: false }),
    svc
      .from("ad_cfo_recommendations")
      .select("id, priority, title, rationale, action, status, due_date, created_at, metadata")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  res.status(200).json({
    profile: profile ?? null,
    active_signals: activeSignals ?? [],
    recommendations: recommendations ?? [],
  });
}

