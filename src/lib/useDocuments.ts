// useDocuments.ts — fetches the current user's documents.
// Falls back to mock RECENT data when Supabase isn't configured or the user
// isn't signed in (demo mode).
//
// The hook supports a `mode` param:
//   - "active" (default): excludes documents with status 'trashed'
//   - "trashed": only documents with status 'trashed'
//   - "all": everything
//
// Trash uses the existing `status` column (string) — we set status='trashed'
// on soft-delete and revert to 'ready' on restore. This avoids a schema migration.

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RECENT } from "@/lib/mock-data";
import type { RecentDoc } from "@/types";
import type { AdDocumentRow } from "@/lib/database.types";

export type DocumentsMode = "active" | "trashed" | "all";

export interface UseDocumentsResult {
  documents: RecentDoc[];
  rawDocuments: AdDocumentRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trashDoc: (id: string) => Promise<void>;
  restoreDoc: (id: string) => Promise<void>;
  purgeDoc: (id: string) => Promise<void>;
  isMock: boolean;
}

function ageKeyForRow(uploadedAt: string): string {
  const ageMs = Date.now() - new Date(uploadedAt).getTime();
  const min = ageMs / 60000;
  if (min < 5) return "act_time_2m";
  if (min < 30) return "act_time_14m";
  if (min < 90) return "act_time_1h";
  return "act_time_3h";
}

function rowToRecent(row: AdDocumentRow): RecentDoc {
  return {
    name: row.filename,
    catKey: row.category_key ?? "cat_other",
    ext: row.ext,
    size: formatBytes(row.size_bytes),
    ageKey: ageKeyForRow(row.uploaded_at),
  };
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function useDocuments(mode: DocumentsMode = "active"): UseDocumentsResult {
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const isMock = !configured || !user;
  const [documents, setDocuments] = useState<RecentDoc[]>(isMock && mode === "active" ? RECENT : []);
  const [rawDocuments, setRawDocuments] = useState<AdDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isMock) {
      setDocuments(mode === "active" ? RECENT : []);
      setRawDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    let query = supabase
      .from("ad_documents")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(100);
    if (mode === "active") {
      query = query.neq("status", "trashed");
    } else if (mode === "trashed") {
      query = query.eq("status", "trashed");
    }
    const { data, error: err } = await query;
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const rows = (data ?? []) as AdDocumentRow[];
    setRawDocuments(rows);
    setDocuments(rows.map(rowToRecent));
  }, [isMock, mode]);

  useEffect(() => {
    refresh();
  }, [user?.id, configured, mode, refresh]);

  const trashDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await supabase.from("ad_documents").update({ status: "trashed" }).eq("id", id);
      await refresh();
    },
    [isMock, refresh],
  );

  const restoreDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await supabase.from("ad_documents").update({ status: "ready" }).eq("id", id);
      await refresh();
    },
    [isMock, refresh],
  );

  const purgeDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await supabase.from("ad_documents").delete().eq("id", id);
      await refresh();
    },
    [isMock, refresh],
  );

  return {
    documents,
    rawDocuments,
    loading,
    error,
    refresh,
    trashDoc,
    restoreDoc,
    purgeDoc,
    isMock,
  };
}
