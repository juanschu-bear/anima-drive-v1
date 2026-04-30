// Sheets.tsx — tabular view of all extracted document data.
// Read-only for now: vendor, amount, date, category, source filename.

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { SidebarState } from "@/types";
import { useLang } from "@/lib/i18n";
import { useExtractions } from "@/lib/useExtractions";
import { findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface SheetsProps {
  sidebarState?: SidebarState;
}

type SortKey = "uploaded_at" | "vendor" | "total_amount" | "doc_date";

export function Sheets({ sidebarState }: SheetsProps) {
  const { t } = useLang();
  const { rows, loading, isMock } = useExtractions();
  const [sort, setSort] = useState<SortKey>("uploaded_at");
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== "all" && (r.category_key ?? "none") !== categoryFilter) return false;
      if (typeFilter !== "all" && (r.document_type ?? "other") !== typeFilter) return false;
      if (directionFilter !== "all" && r.financial_direction !== directionFilter) return false;
      if (!q) return true;
      const hay = `${r.filename} ${r.vendor ?? ""} ${r.currency ?? ""} ${r.category_key ?? ""} ${
        r.document_type ?? ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, categoryFilter, typeFilter, directionFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: string | number | null = a[sort];
      let bv: string | number | null = b[sort];
      if (av == null) av = sort === "total_amount" ? -Infinity : "";
      if (bv == null) bv = sort === "total_amount" ? -Infinity : "";
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sort, asc]);

  function toggle(k: SortKey) {
    if (sort === k) setAsc(!asc);
    else {
      setSort(k);
      setAsc(false);
    }
  }

  function exportCsv() {
    const header = [
      "Filename",
      "Category",
      "Type",
      "Direction",
      "Vendor",
      "Amount",
      "Currency",
      "Document date",
      "Uploaded",
    ];
    const lines = [header.join(",")];
    for (const r of sorted) {
      const cells = [
        csvCell(r.filename),
        csvCell(r.category_key ? r.category_key.replace(/^cat_/, "") : ""),
        csvCell(r.document_type ?? ""),
        csvCell(r.financial_direction),
        csvCell(r.vendor ?? ""),
        r.total_amount != null ? r.total_amount.toString() : "",
        csvCell(r.currency ?? ""),
        csvCell(r.doc_date ?? ""),
        csvCell(r.uploaded_at),
      ];
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anima-drive-sheets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const headerCellStyle: CSSProperties = {
    fontSize: 10,
    color: "var(--ad-text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <PageShell
      title={t("page_sheets_title")}
      subtitle={t("page_sheets_sub")}
      active="sheets"
      sidebarState={sidebarState}
      actions={
        rows.length > 0 ? (
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center"
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-chip)",
              border: "1px solid var(--ad-border)",
              color: "var(--ad-text)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <Icon name="download" size={13} />
            Export CSV
          </button>
        ) : undefined
      }
    >
      {!isMock && rows.length === 0 && !loading ? (
        <EmptyState text={t("page_sheets_empty")} />
      ) : (
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.8fr) repeat(3, minmax(0, 1fr))",
              gap: 10,
              padding: "14px 22px 10px",
              borderBottom: "1px solid var(--ad-hairline)",
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filename/vendor..."
              style={filterInputStyle}
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={filterInputStyle}>
              <option value="all">All categories</option>
              {Array.from(new Set(rows.map((r) => r.category_key).filter(Boolean))).map((k) => (
                <option key={k} value={k as string}>
                  {(k as string).replace(/^cat_/, "")}
                </option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={filterInputStyle}>
              <option value="all">All types</option>
              {Array.from(new Set(rows.map((r) => r.document_type).filter(Boolean))).map((k) => (
                <option key={k} value={k as string}>
                  {k}
                </option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              style={filterInputStyle}
            >
              <option value="all">All directions</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr 1.2fr 1fr 1fr",
              padding: "14px 22px",
              borderBottom: "1px solid var(--ad-hairline)",
              gap: 16,
            }}
          >
            <div style={headerCellStyle} onClick={() => toggle("uploaded_at")}>
              Filename {sort === "uploaded_at" && (asc ? "↑" : "↓")}
            </div>
            <div style={headerCellStyle}>Category</div>
            <div style={headerCellStyle}>Type</div>
            <div style={headerCellStyle}>Direction</div>
            <div style={headerCellStyle} onClick={() => toggle("vendor")}>
              Vendor {sort === "vendor" && (asc ? "↑" : "↓")}
            </div>
            <div style={headerCellStyle} onClick={() => toggle("doc_date")}>
              Date {sort === "doc_date" && (asc ? "↑" : "↓")}
            </div>
            <div style={{ ...headerCellStyle, textAlign: "right" }} onClick={() => toggle("total_amount")}>
              Amount {sort === "total_amount" && (asc ? "↑" : "↓")}
            </div>
          </div>

          {loading && rows.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--ad-text-dim)" }}>Loading…</div>
          ) : null}

          {sorted.map((r) => {
            const cat = r.category_key ? findCategory(r.category_key) : null;
            return (
              <div
                key={r.document_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr 1.2fr 1fr 1fr",
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
                <div style={{ color: "var(--ad-text-dim)" }}>{r.document_type ?? "—"}</div>
                <div style={{ color: "var(--ad-text-dim)" }}>{directionLabel(r.financial_direction)}</div>
                <div style={{ color: "var(--ad-text-dim)" }}>{r.vendor ?? "—"}</div>
                <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>
                  {r.doc_date ? new Date(r.doc_date).toLocaleDateString() : "—"}
                </div>
                <div style={{ fontWeight: 600, textAlign: "right", ...numStyle }}>
                  {r.total_amount != null
                    ? formatCurrency(r.total_amount, r.currency ?? "EUR")
                    : "—"}
                </div>
              </div>
            );
          })}
        </Panel>
      )}
    </PageShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Panel style={{ padding: 60, textAlign: "center" }}>
      <div className="flex flex-col items-center" style={{ gap: 12 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "color-mix(in oklab, var(--ad-accent-mint) 12%, transparent)",
            color: "var(--ad-accent-mint)",
          }}
        >
          <Icon name="sheet" size={22} stroke={1.6} />
        </div>
        <div style={{ fontSize: 14, color: "var(--ad-text-dim)", maxWidth: 380 }}>{text}</div>
      </div>
    </Panel>
  );
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function csvCell(s: string): string {
  if (/[,"\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function directionLabel(direction: "income" | "expense" | "unknown"): string {
  if (direction === "income") return "Income";
  if (direction === "expense") return "Expense";
  return "Unknown";
}

const filterInputStyle: CSSProperties = {
  height: 34,
  borderRadius: 9,
  border: "1px solid var(--ad-border)",
  background: "var(--ad-chip)",
  color: "var(--ad-text)",
  padding: "0 10px",
  fontSize: 12,
  outline: "none",
};
