// useDocuments.ts — fetches the current user's documents.
//
// Falls back to mock RECENT data when Supabase isn't configured or the user
// isn't signed in (demo mode).
//
// Modes:
//   - "active" (default): excludes documents with status 'trashed'
//   - "trashed": only documents with status 'trashed'
//   - "all": everything

import { useCallback, useEffect, useRef, useState } from "react";
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
    documentId: row.id,
    originalFilename: row.filename,
    name: row.display_name ?? row.filename,
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
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Auto-poll while there are docs in non-terminal states (categorizing/extracting).
  // Polling stops automatically once everything is ready/failed/trashed.
  useEffect(() => {
    if (isMock) return;
    const inFlight = rawDocuments.some(
      (r) => r.status === "categorizing" || r.status === "extracting" || r.status === "uploaded",
    );
    if (!inFlight) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    pollTimerRef.current = setTimeout(() => {
      refresh();
    }, 2500);
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [rawDocuments, isMock, refresh]);

  useEffect(() => {
    refresh();
  }, [user?.id, configured, mode, refresh]);

  const trashDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await callDocumentAction(id, "trash");
      await refresh();
    },
    [callDocumentAction, isMock, refresh],
  );

  const restoreDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await callDocumentAction(id, "restore");
      await refresh();
    },
    [callDocumentAction, isMock, refresh],
  );

  const purgeDoc = useCallback(
    async (id: string) => {
      if (isMock) return;
      await callDocumentAction(id, "purge");
      await refresh();
    },
    [callDocumentAction, isMock, refresh],
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
  const callDocumentAction = useCallback(
    async (id: string, action: "trash" | "restore" | "purge") => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/document-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: id, action }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Document action failed: ${res.status} ${text.slice(0, 200)}`);
      }
    },
    [],
  );
