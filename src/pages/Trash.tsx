// Trash.tsx — shows soft-deleted documents (status='trashed') with restore/purge actions.

import { useState } from "react";
import type { CSSProperties } from "react";
import type { SidebarState } from "@/types";
import { useLang } from "@/lib/i18n";
import { useDocuments } from "@/lib/useDocuments";
import { findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface TrashProps {
  sidebarState?: SidebarState;
}

export function Trash({ sidebarState }: TrashProps) {
  const { t } = useLang();
  const { rawDocuments, restoreDoc, purgeDoc, loading } = useDocuments("trashed");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onRestore(id: string) {
    setBusyId(id);
    await restoreDoc(id);
    setBusyId(null);
  }

  async function onPurge(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setBusyId(id);
    await purgeDoc(id);
    setBusyId(null);
  }

  const headerCellStyle: CSSProperties = {
    fontSize: 10,
    color: "var(--ad-text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: 600,
  };

  if (rawDocuments.length === 0 && !loading) {
    return (
      <PageShell
        title={t("page_trash_title")}
        subtitle={t("page_trash_sub")}
        active="trash"
        sidebarState={sidebarState}
      >
        <Panel style={{ padding: 60, textAlign: "center" }}>
          <div className="flex flex-col items-center" style={{ gap: 12 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "color-mix(in oklab, var(--ad-text-dim) 14%, transparent)",
                color: "var(--ad-text-dim)",
              }}
            >
              <Icon name="trash" size={22} stroke={1.6} />
            </div>
            <div style={{ fontSize: 14, color: "var(--ad-text-dim)" }}>
              {t("page_trash_empty")}
            </div>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("page_trash_title")}
      subtitle={t("page_trash_sub")}
      active="trash"
      sidebarState={sidebarState}
    >
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr 220px",
            padding: "14px 22px",
            borderBottom: "1px solid var(--ad-hairline)",
            gap: 16,
          }}
        >
          <div style={headerCellStyle}>Filename</div>
          <div style={headerCellStyle}>Category</div>
          <div style={headerCellStyle}>Deleted</div>
          <div></div>
        </div>

        {rawDocuments.map((r) => {
          const cat = r.category_key ? findCategory(r.category_key) : null;
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr 220px",
                padding: "14px 22px",
                borderBottom: "1px solid var(--ad-hairline)",
                gap: 16,
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                <Icon name="file" size={14} style={{ color: "var(--ad-text-dim)", flexShrink: 0 }} />
                <span
                  style={{
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.filename}
                </span>
              </div>
              <div style={{ color: "var(--ad-text-dim)" }}>{cat ? t(cat.key) : "—"}</div>
              <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>
                {new Date(r.uploaded_at).toLocaleDateString()}
              </div>
              <div className="flex items-center justify-end" style={{ gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onRestore(r.id)}
                  disabled={busyId !== null}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 7,
                    background: "var(--ad-chip)",
                    border: "1px solid var(--ad-border)",
                    color: "var(--ad-text)",
                    fontSize: 11,
                    cursor: busyId === r.id ? "wait" : "pointer",
                  }}
                >
                  {busyId === r.id ? "…" : t("page_trash_restore")}
                </button>
                <button
                  type="button"
                  onClick={() => onPurge(r.id, r.filename)}
                  disabled={busyId !== null}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 7,
                    background: "transparent",
                    border: "1px solid color-mix(in oklab, #ef4444 40%, var(--ad-border))",
                    color: "#ef4444",
                    fontSize: 11,
                    cursor: busyId === r.id ? "wait" : "pointer",
                  }}
                >
                  {t("page_trash_purge")}
                </button>
              </div>
            </div>
          );
        })}
      </Panel>
    </PageShell>
  );
}
