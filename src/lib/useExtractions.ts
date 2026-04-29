// useExtractions.ts — fetches all extracted data rows joined with their documents.
// Used by the Sheets and Contacts pages.

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { AdDocumentRow, AdExtractionRow } from "@/lib/database.types";

export interface ExtractedRow {
  document_id: string;
  filename: string;
  category_key: string | null;
  vendor: string | null;
  total_amount: number | null;
  currency: string | null;
  doc_date: string | null;
  uploaded_at: string;
  status: string;
}

export interface UseExtractionsResult {
  rows: ExtractedRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isMock: boolean;
}

export function useExtractions(): UseExtractionsResult {
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const isMock = !configured || !user;
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isMock) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);

    // Fetch documents and extractions separately, then join client-side.
    const [docsRes, extRes] = await Promise.all([
      supabase
        .from("ad_documents")
        .select("*")
        .neq("status", "trashed")
        .order("uploaded_at", { ascending: false })
        .limit(200),
      supabase.from("ad_extractions").select("*"),
    ]);

    setLoading(false);

    if (docsRes.error) {
      setError(docsRes.error.message);
      return;
    }
    if (extRes.error) {
      setError(extRes.error.message);
      return;
    }

    const docs = (docsRes.data ?? []) as AdDocumentRow[];
    const exts = (extRes.data ?? []) as AdExtractionRow[];
    const extByDoc = new Map<string, AdExtractionRow>();
    for (const e of exts) extByDoc.set(e.document_id, e);

    const joined: ExtractedRow[] = docs.map((d) => {
      const e = extByDoc.get(d.id);
      return {
        document_id: d.id,
        filename: d.filename,
        category_key: d.category_key,
        vendor: e?.vendor ?? null,
        total_amount: e?.total_amount ?? null,
        currency: e?.currency ?? null,
        doc_date: e?.doc_date ?? null,
        uploaded_at: d.uploaded_at,
        status: d.status,
      };
    });

    setRows(joined);
  }, [isMock]);

  useEffect(() => {
    refresh();
  }, [user?.id, configured, refresh]);

  return { rows, loading, error, refresh, isMock };
}
