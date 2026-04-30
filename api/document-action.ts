import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authedUser, bearerToken, serviceClient, userClient } from "./_supabase.js";

type Action = "trash" | "restore" | "purge";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body as { documentId?: string; action?: Action } | undefined;
    const documentId = body?.documentId;
    const action = body?.action;
    if (!documentId || !action) {
      res.status(400).json({ error: "Missing documentId or action" });
      return;
    }
    if (!["trash", "restore", "purge"].includes(action)) {
      res.status(400).json({ error: "Invalid action" });
      return;
    }

    const token = bearerToken(req);
    const user = await authedUser(token);
    const sb = userClient(token);
    const svc = serviceClient();

    const { data: doc, error: docErr } = await sb
      .from("ad_documents")
      .select("id, user_id, storage_path")
      .eq("id", documentId)
      .single();
    if (docErr || !doc) {
      res.status(404).json({ error: docErr?.message ?? "Document not found" });
      return;
    }

    if (action === "purge") {
      // Best-effort storage cleanup; DB delete is source of truth.
      try {
        await svc.storage.from("ad-docs").remove([doc.storage_path]);
      } catch {
        // ignore
      }
      const { error } = await svc.from("ad_documents").delete().eq("id", documentId).eq("user_id", user.id);
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json({ ok: true, action });
      return;
    }

    const nextStatus = action === "trash" ? "trashed" : "ready";
    const { error } = await svc
      .from("ad_documents")
      .update({ status: nextStatus })
      .eq("id", documentId)
      .eq("user_id", user.id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true, action, status: nextStatus });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[document-action] uncaught:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
}

