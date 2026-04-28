// useDocuments.ts — fetches the current user's documents.
// Falls back to mock RECENT data when Supabase isn't configured or the user
// isn't signed in (demo mode).

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { RECENT } from "@/lib/mock-data";
import type { RecentDoc } from "@/types";
import type { AdDocumentRow } from "@/lib/database.types";

export interface UseDocumentsResult {
  documents: RecentDoc[];
  rawDocuments: AdDocumentRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isMock: boolean;
}

const AGE_KEY_FALLBACKS = ["act_time_2m", "act_time_14m", "act_time_1h", "act_time_3h"];

function ageKeyForRow(uploadedAt: string): string {
  const ageMs = Date.now() - new Date(uploadedAt).getTime();
  const min = ageMs / 60000;
  if (min < 5) return "act_time_2m";
  if (min < 30) return "act_time_14m";
  if (min < 90) return "act_time_1h";
  if (min < 240) return "act_time_3h";
  // For older docs, fall through to the longest pre-translated bucket.
  return AGE_KEY_FALLBACKS[3];
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

export function useDocuments(): UseDocumentsResult {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RecentDoc[]>(RECENT);
  const [rawDocuments, setRawDocuments] = useState<AdDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const isMock = !configured || !user;

  const refresh = async () => {
    if (isMock) {
      setDocuments(RECENT);
      setRawDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("ad_documents")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const rows = (data ?? []) as AdDocumentRow[];
    setRawDocuments(rows);
    setDocuments(rows.map(rowToRecent));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, configured]);

  return { documents, rawDocuments, loading, error, refresh, isMock };
}
