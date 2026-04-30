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
  const { rawDocuments, trashDoc, purgeDoc, refresh } = useDocuments();
  const configured = isSupabaseConfigured();
  const isAuth = configured && !!user;

  const [extraction, setExtraction] = useState<AdExtractionRow | null>(null);
  const [lineItems, setLineItems] = useState<AdLineItemRow[]>([]);
  const [busy, setBusy] = useState<"open" | "download" | "trash" | "purge" | "extract" | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
      .filter((r) => {
        if (doc.documentId && r.id === doc.documentId) return true;
        if (doc.originalFilename && r.filename === doc.originalFilename) return true;
        return r.display_name === doc.name || r.filename === doc.name;
      })
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
    a.download = docRow?.filename ?? doc.originalFilename ?? doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function onReExtract() {
    if (!docRow) return;
    setBusy("extract");
    setExtractError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setExtractError("Not signed in");
        return;
      }
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: docRow.id }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        setExtractError(`Extraction failed: ${res.status} ${errText.slice(0, 200)}`);
        return;
      }
      // Re-fetch the extraction now that it should exist.
      const extRes = await supabase
        .from("ad_extractions")
        .select("*")
        .eq("document_id", docRow.id)
        .maybeSingle();
      const ext = (extRes.data as AdExtractionRow | null) ?? null;
      setExtraction(ext);
      if (ext) {
        const liRes = await supabase
          .from("ad_line_items")
          .select("*")
          .eq("extraction_id", ext.id)
          .order("position");
        setLineItems(((liRes.data ?? []) as AdLineItemRow[]) ?? []);
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function onTrash() {
    const targetId = docRow?.id ?? doc?.documentId ?? null;
    if (!targetId) return;
    setDeleteError(null);
    setBusy("trash");
    try {
      await trashDoc(targetId);
      await refresh();
      onClose();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t("err_trash_failed"));
    } finally {
      setBusy(null);
    }
  }

  async function onPurgeNow() {
    const targetId = docRow?.id ?? doc?.documentId ?? null;
    const targetName = docRow?.filename ?? doc?.originalFilename ?? doc?.name ?? "this document";
    if (!targetId) return;
    if (!confirm(t("confirm_delete_forever").replace("{name}", targetName))) return;
    setDeleteError(null);
    setBusy("purge");
    try {
      await purgeDoc(targetId);
      await refresh();
      onClose();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t("err_purge_failed"));
    } finally {
      setBusy(null);
    }
  }

  const hasExtraction =
    extraction != null &&
    (extraction.summary ||
      extraction.vendor ||
      extraction.total_amount != null ||
      extraction.doc_date ||
      (extraction.metadata && Object.keys(extraction.metadata).length > 0));

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
            className="flex items-center justify-between"
            style={{
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--ad-text-faint)",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Extracted data
            </div>
            {extraction?.document_type && (
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--ad-text-dim)",
                  background: "var(--ad-bg)",
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid var(--ad-border)",
                }}
              >
                {extraction.document_type}
              </div>
            )}
          </div>
          {hasExtraction && extraction ? (
            <DynamicExtractionView extraction={extraction} lineItems={lineItems} />
          ) : (
            <div>
              <div style={{ fontSize: 13, color: "var(--ad-text-dim)", marginBottom: 12 }}>
                {isAuth
                  ? "No extracted data yet — Anima may still be processing this document, or extraction hasn't run."
                  : "Vendor, amount, date and line items will appear here once you sign in."}
              </div>
              {isAuth && docRow && (
                <button
                  type="button"
                  onClick={onReExtract}
                  disabled={busy !== null}
                  className="flex items-center"
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 7,
                    gap: 6,
                    background: "color-mix(in oklab, var(--ad-accent-mint) 14%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--ad-accent-mint) 40%, var(--ad-border))",
                    color: "var(--ad-accent-mint)",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: busy === "extract" ? "wait" : "pointer",
                  }}
                >
                  <Icon name="sparkle" size={11} />
                  {busy === "extract" ? "Extracting…" : "Run extraction"}
                </button>
              )}
              {extractError && (
                <div style={{ marginTop: 10, fontSize: 11, color: "#ef4444" }}>
                  {extractError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center" style={{ gap: 8, flexWrap: "wrap" }}>
          {(docRow || doc.documentId) && (
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
              {busy === "trash" ? "…" : t("doc_modal_trash")}
            </button>
          )}
          {(docRow || doc.documentId) && (
            <button
              type="button"
              onClick={onPurgeNow}
              disabled={busy !== null}
              className="flex items-center"
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                gap: 7,
                background: "transparent",
                border: "1px solid color-mix(in oklab, #ef4444 40%, var(--ad-border))",
                color: "#ef4444",
                fontSize: 12,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              <Icon name="trash" size={13} />
              {busy === "purge" ? t("doc_modal_deleting") : t("doc_modal_delete_permanent")}
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
        {deleteError && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444" }}>{deleteError}</div>
        )}
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

interface DynamicExtractionViewProps {
  extraction: AdExtractionRow;
  lineItems: AdLineItemRow[];
}

function DynamicExtractionView({ extraction, lineItems }: DynamicExtractionViewProps) {
  const fmtAmount = (a: number | null, c: string | null): string => {
    if (a == null) return "—";
    const cur = c ?? "EUR";
    try {
      return new Intl.NumberFormat("de-DE", { style: "currency", currency: cur }).format(a);
    } catch {
      return `${a.toFixed(2)} ${cur}`;
    }
  };
  const fmtDate = (s: string | null): string => {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  };

  const dt = extraction.document_type ?? "other";
  const meta = (extraction.metadata ?? {}) as Record<string, unknown>;

  // Helper for rendering metadata values cleanly.
  const m = (key: string): string | null => {
    const v = meta[key];
    if (v == null) return null;
    if (typeof v === "string") return v.trim() || null;
    if (typeof v === "number") return String(v);
    return null;
  };
  const mList = (key: string): string[] => {
    const v = meta[key];
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Summary always at top */}
      {extraction.summary && (
        <div
          style={{
            fontSize: 13,
            color: "var(--ad-text)",
            lineHeight: 1.5,
            paddingBottom: 8,
            borderBottom: "1px solid var(--ad-hairline)",
          }}
        >
          {extraction.summary}
        </div>
      )}

      {/* Type-specific fields */}
      {dt === "financial" && (
        <>
          <KV label="Vendor" value={extraction.vendor ?? "—"} />
          <KV label="Total" value={fmtAmount(extraction.total_amount, extraction.currency)} />
          <KV label="Date" value={fmtDate(extraction.doc_date)} />
          {extraction.invoice_number && <KV label="Invoice #" value={extraction.invoice_number} />}
          {lineItems.length > 0 && (
            <LineItemsView items={lineItems} currency={extraction.currency} />
          )}
        </>
      )}

      {dt === "contract" && (
        <>
          {mList("parties").length > 0 && <KV label="Parties" value={mList("parties").join(", ")} />}
          {m("contract_type") && <KV label="Type" value={m("contract_type")!} />}
          {m("effective_date") && <KV label="Effective" value={fmtDate(m("effective_date"))} />}
          {mList("key_terms").length > 0 && (
            <BulletList label="Key terms" items={mList("key_terms")} />
          )}
        </>
      )}

      {dt === "legal" && (
        <>
          {mList("parties").length > 0 && <KV label="Parties" value={mList("parties").join(", ")} />}
          {m("case_or_reference") && <KV label="Case / Ref" value={m("case_or_reference")!} />}
          {m("court_or_authority") && <KV label="Authority" value={m("court_or_authority")!} />}
          {mList("key_points").length > 0 && (
            <BulletList label="Key points" items={mList("key_points")} />
          )}
        </>
      )}

      {dt === "medical" && (
        <>
          {m("patient_name") && <KV label="Patient" value={m("patient_name")!} />}
          {m("doctor") && <KV label="Doctor" value={m("doctor")!} />}
          {m("date") && <KV label="Date" value={fmtDate(m("date"))} />}
          {m("diagnosis_or_topic") && <KV label="Topic" value={m("diagnosis_or_topic")!} />}
          {m("prescription") && <KV label="Prescription" value={m("prescription")!} />}
        </>
      )}

      {dt === "educational" && (
        <>
          {m("institution") && <KV label="Institution" value={m("institution")!} />}
          {m("student_name") && <KV label="Student" value={m("student_name")!} />}
          {m("document_kind") && <KV label="Kind" value={m("document_kind")!} />}
          {m("date") && <KV label="Date" value={fmtDate(m("date"))} />}
          {m("grade_or_outcome") && <KV label="Outcome" value={m("grade_or_outcome")!} />}
        </>
      )}

      {dt === "technical" && (
        <>
          {m("title") && <KV label="Title" value={m("title")!} />}
          {m("language") && <KV label="Language" value={m("language")!} />}
          {mList("topics").length > 0 && <BulletList label="Topics" items={mList("topics")} />}
          {mList("key_concepts").length > 0 && (
            <BulletList label="Key concepts" items={mList("key_concepts")} />
          )}
        </>
      )}

      {dt === "correspondence" && (
        <>
          {m("from") && <KV label="From" value={m("from")!} />}
          {m("to") && <KV label="To" value={m("to")!} />}
          {m("subject") && <KV label="Subject" value={m("subject")!} />}
          {m("date") && <KV label="Date" value={fmtDate(m("date"))} />}
        </>
      )}

      {dt === "personal" && (
        <>
          {m("document_kind") && <KV label="Kind" value={m("document_kind")!} />}
          {m("full_name") && <KV label="Name" value={m("full_name")!} />}
          {m("identifier") && <KV label="ID" value={m("identifier")!} />}
          {m("valid_until") && <KV label="Valid until" value={fmtDate(m("valid_until"))} />}
        </>
      )}

      {dt === "media" && (
        <>
          {m("description") && <KV label="Description" value={m("description")!} />}
          {mList("detected_objects").length > 0 && (
            <BulletList label="Detected" items={mList("detected_objects")} />
          )}
        </>
      )}

      {dt === "other" && mList("key_facts").length > 0 && (
        <BulletList label="Key facts" items={mList("key_facts")} />
      )}
    </div>
  );
}

function LineItemsView({
  items,
  currency,
}: {
  items: AdLineItemRow[];
  currency: string | null;
}) {
  const fmt = (a: number | null) => {
    if (a == null) return "—";
    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currency ?? "EUR",
      }).format(a);
    } catch {
      return `${a.toFixed(2)} ${currency ?? "EUR"}`;
    }
  };
  return (
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
        {items.slice(0, 8).map((li) => (
          <div
            key={li.id}
            className="flex items-center justify-between"
            style={{ fontSize: 12, color: "var(--ad-text-dim)" }}
          >
            <span style={{ flex: 1, marginRight: 8 }}>{li.description ?? "—"}</span>
            <span style={{ ...numStyle }}>{fmt(li.amount)}</span>
          </div>
        ))}
        {items.length > 8 && (
          <div style={{ fontSize: 11, color: "var(--ad-text-faint)" }}>
            +{items.length - 8} more
          </div>
        )}
      </div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
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
        {label}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--ad-text-dim)", lineHeight: 1.55 }}>
        {items.slice(0, 8).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
