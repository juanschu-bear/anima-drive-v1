// DocumentDetailModal.tsx — appears when a document card or row is clicked.
//
// Wires:
//   - Real extracted data (vendor, total, date, line items) from ad_extractions
//   - Open button: opens the file via Supabase Signed URL in a new tab
//   - Download button: downloads via Signed URL
//   - Trash button: soft-delete (status='trashed')
//
// In demo mode (no Supabase / not signed in), shows the legacy placeholder.

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { RecentDoc } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { useDocuments } from "@/lib/useDocuments";
import { supabase, isSupabaseConfigured, STORAGE_BUCKET } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { AdDocumentRow, AdExtractionRow, AdLineItemRow } from "@/lib/database.types";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";

interface DocumentDetailModalProps {
  doc: RecentDoc | null;
  onClose: () => void;
}

export function DocumentDetailModal({ doc, onClose }: DocumentDetailModalProps) {
  const { t } = useLang();
  const { user } = useAuth();
  const { rawDocuments, trashDoc, refresh } = useDocuments();
  const configured = isSupabaseConfigured();
  const isAuth = configured && !!user;

  const [extraction, setExtraction] = useState<AdExtractionRow | null>(null);
  const [lineItems, setLineItems] = useState<AdLineItemRow[]>([]);
  const [busy, setBusy] = useState<"open" | "download" | "trash" | null>(null);
  const [docRow, setDocRow] = useState<AdDocumentRow | null>(null);

  // Resolve the matching DB row from the displayed RecentDoc by filename.
  // Filename collisions are unlikely within a single user; if they occur, we pick the latest.
  useEffect(() => {
    if (!doc) {
      setDocRow(null);
      return;
    }
    if (!isAuth) return;
    const match = rawDocuments
      .filter((r) => r.filename === doc.name)
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))[0];
    setDocRow(match ?? null);
  }, [doc, rawDocuments, isAuth]);

  // Fetch extraction + line items for the resolved doc row.
  useEffect(() => {
    if (!docRow) {
      setExtraction(null);
      setLineItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const extRes = await supabase
        .from("ad_extractions")
        .select("*")
        .eq("document_id", docRow.id)
        .maybeSingle();
      if (cancelled) return;
      const ext = (extRes.data as AdExtractionRow | null) ?? null;
      setExtraction(ext);
      if (ext) {
        const liRes = await supabase
          .from("ad_line_items")
          .select("*")
          .eq("extraction_id", ext.id)
          .order("position");
        if (cancelled) return;
        setLineItems(((liRes.data ?? []) as AdLineItemRow[]) ?? []);
      } else {
        setLineItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docRow]);

  if (!doc) return null;
  const cat = findCategory(doc.catKey);
  if (!cat) return null;
  const tintColor = ACCENT_VARS[cat.tint];

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Geist', system-ui, sans-serif",
    color: "var(--ad-text)",
  };

  async function getSignedUrl(): Promise<string | null> {
    if (!docRow) return null;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(docRow.storage_path, 60 * 5); // 5 min
    if (error || !data?.signedUrl) {
      // eslint-disable-next-line no-console
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  }

  async function onOpen() {
    setBusy("open");
    const url = await getSignedUrl();
    setBusy(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onDownload() {
    if (!doc) return;
    setBusy("download");
    const url = await getSignedUrl();
    setBusy(null);
    if (!url) return;
    // Trigger a download by creating an anchor with download attr.
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function onTrash() {
    if (!docRow) return;
    setBusy("trash");
    await trashDoc(docRow.id);
    setBusy(null);
    await refresh();
    onClose();
  }

  const fmtAmount = (amount: number | null, currency: string | null): string => {
    if (amount == null) return "—";
    const cur = currency ?? "EUR";
    try {
      return new Intl.NumberFormat("de-DE", { style: "currency", currency: cur }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${cur}`;
    }
  };

  const fmtDate = (s: string | null): string => {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  };

  const hasExtraction =
    extraction != null && (extraction.vendor || extraction.total_amount != null || extraction.doc_date);

  return (
    <div style={overlayStyle}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />
      <Panel
        style={{
          position: "relative",
          width: 580,
          maxHeight: "calc(100vh - 80px)",
          padding: 28,
          zIndex: 1,
          animation: "fadeUp 320ms cubic-bezier(.2,.7,.3,1)",
          overflow: "auto",
        }}
      >
        {/* Close */}
        <div
          onClick={onClose}
          className="flex items-center justify-center"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: 8,
            color: "var(--ad-text-dim)",
            background: "var(--ad-chip)",
            border: "1px solid var(--ad-border)",
            cursor: "pointer",
          }}
        >
          <Icon name="x" size={14} />
        </div>

        {/* Big thumbnail */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="flex items-end"
            style={{
              width: "100%",
              height: 200,
              borderRadius: 14,
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, color-mix(in oklab, ${tintColor} 24%, transparent), color-mix(in oklab, ${tintColor} 6%, transparent))`,
              border: "1px solid var(--ad-border)",
              padding: 18,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(45deg, transparent 0 8px, color-mix(in oklab, ${tintColor} 4%, transparent) 8px 9px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tintColor,
                background: `color-mix(in oklab, ${tintColor} 15%, transparent)`,
                padding: "4px 9px",
                borderRadius: 5,
              }}
            >
              {doc.ext}
            </div>
            <div style={{ color: tintColor, opacity: 0.9 }}>
              <Icon name={cat.icon as never} size={48} stroke={1.4} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.4,
            color: "var(--ad-text)",
            marginBottom: 6,
            wordBreak: "break-word",
          }}
        >
          {doc.name}
        </div>

        {/* Meta row */}
        <div className="flex items-center" style={{ gap: 10, marginBottom: 18 }}>
          <Chip tint={cat.tint} icon={cat.icon as never}>
            {t(cat.key)}
          </Chip>
          <span style={{ fontSize: 12, color: "var(--ad-text-faint)", ...numStyle }}>
            {doc.size}
          </span>
          <span style={{ fontSize: 12, color: "var(--ad-text-faint)", ...numStyle }}>
            · {t(doc.ageKey)}
          </span>
        </div>

        {/* Extracted data */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "var(--ad-chip)",
            border: "1px solid var(--ad-border)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ad-text-faint)",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Extracted data
          </div>
          {hasExtraction && extraction ? (
            <div style={{ display: "grid", gap: 8 }}>
              <KV label="Vendor" value={extraction.vendor ?? "—"} />
              <KV
                label="Total"
                value={fmtAmount(extraction.total_amount, extraction.currency)}
              />
              <KV label="Date" value={fmtDate(extraction.doc_date)} />
              {lineItems.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ad-text-faint)",
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Line items
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {lineItems.slice(0, 8).map((li) => (
                      <div
                        key={li.id}
                        className="flex items-center justify-between"
                        style={{ fontSize: 12, color: "var(--ad-text-dim)" }}
                      >
                        <span style={{ flex: 1, marginRight: 8 }}>
                          {li.description ?? "—"}
                        </span>
                        <span style={{ ...numStyle }}>
                          {fmtAmount(li.amount, extraction.currency)}
                        </span>
                      </div>
                    ))}
                    {lineItems.length > 8 && (
                      <div style={{ fontSize: 11, color: "var(--ad-text-faint)" }}>
                        +{lineItems.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ad-text-dim)" }}>
              {isAuth
                ? "No extracted data yet — Anima may still be processing this document."
                : "Vendor, amount, date and line items will appear here once you sign in."}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center" style={{ gap: 8, flexWrap: "wrap" }}>
          {isAuth && docRow && (
            <button
              type="button"
              onClick={onTrash}
              disabled={busy !== null}
              className="flex items-center"
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                gap: 7,
                background: "transparent",
                border: "1px solid var(--ad-border)",
                color: "var(--ad-text-dim)",
                fontSize: 12,
                cursor: busy ? "wait" : "pointer",
                marginRight: "auto",
              }}
            >
              <Icon name="trash" size={13} />
              {busy === "trash" ? "…" : "Trash"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center"
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-chip)",
              border: "1px solid var(--ad-border)",
              color: "var(--ad-text)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          {isAuth && docRow && (
            <button
              type="button"
              onClick={onDownload}
              disabled={busy !== null}
              className="flex items-center"
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 9,
                gap: 7,
                background: "var(--ad-chip)",
                border: "1px solid var(--ad-border)",
                color: "var(--ad-text)",
                fontSize: 12,
                fontWeight: 500,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              <Icon name="download" size={13} />
              {busy === "download" ? "…" : "Download"}
            </button>
          )}
          <button
            type="button"
            onClick={isAuth && docRow ? onOpen : onClose}
            disabled={busy !== null}
            className="flex items-center"
            style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-accent-mint)",
              color: "#09090b",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
              boxShadow: "0 0 20px color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)",
            }}
          >
            {busy === "open" ? "Opening…" : "Open"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
      <span style={{ color: "var(--ad-text-faint)", fontSize: 11, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ color: "var(--ad-text)", fontWeight: 500, ...numStyle }}>{value}</span>
    </div>
  );
}
