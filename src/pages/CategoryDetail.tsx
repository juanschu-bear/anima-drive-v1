// CategoryDetail.tsx — drill-down view for a single category (e.g. Expenses).
//
// In demo mode (no auth / no Supabase): shows the original mid-fi mock data so
// the page looks polished for screenshots.
//
// In auth mode: filters the user's real documents by the category from the URL.
// If the category has no documents, shows a graceful empty state.

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CSSProperties } from "react";
import type { SidebarState, RecentDoc } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { CATS, findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { useUploadModal } from "@/lib/upload-modal";
import { useDocuments } from "@/lib/useDocuments";
import { useDocumentDetail } from "@/lib/document-detail";
import { Sidebar } from "@/components/Sidebar";
import { Panel } from "@/components/ui/Panel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon, type IconName } from "@/components/ui/Icon";

interface CategoryDetailProps {
  sidebarState?: SidebarState;
}

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Mid-fi mock used only in demo mode.
const MOCK_BARS = [38, 42, 65, 48, 58, 82, 72, 55, 68, 92, 78, 95];
const MOCK_DOCS: Array<{ n: string; v: string; a: string; age: string }> = [
  { n: "Rechnung_AWS_März.pdf",  v: "Amazon Web Services", a: "€ 4,120.00", age: "act_time_1h"  },
  { n: "Hotel_Berlin_Mar.pdf",   v: "Hotel Berlin Mitte",  a: "€ 842.60",   age: "act_time_3h"  },
  { n: "Figma_Invoice_Q1.pdf",   v: "Figma Inc.",          a: "€ 225.00",   age: "act_time_14m" },
  { n: "Uber_receipt_0412.jpg",  v: "Uber B.V.",           a: "€ 38.50",    age: "act_time_2m"  },
  { n: "Bürolöhne_März.pdf",     v: "Internal",            a: "€ 4,320.00", age: "act_time_3h"  },
  { n: "Notion_Invoice_Mar.pdf", v: "Notion Labs",         a: "€ 96.00",    age: "act_time_3h"  },
];

export function CategoryDetail({ sidebarState = "expanded" }: CategoryDetailProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { open: openUpload } = useUploadModal();
  const { openDoc } = useDocumentDetail();
  const { id } = useParams<{ id: string }>();
  const { documents, rawDocuments, isMock } = useDocuments();

  // The category id in the URL is the cat key without the "cat_" prefix.
  const lookupKey = id ? `cat_${id}` : "cat_expenses";
  const cat = findCategory(lookupKey) ?? CATS[1];
  const tintColor = ACCENT_VARS[cat.tint];
  const collapsed = sidebarState === "collapsed";

  // Filter the user's documents to this category.
  const categoryDocs = useMemo(
    () => (isMock ? [] : documents.filter((d) => d.catKey === cat.key)),
    [documents, isMock, cat.key],
  );

  // Compute the 12-month bars from real documents (by upload date).
  // For demo mode, fall back to the mid-fi mock pattern.
  const bars = useMemo(() => {
    if (isMock) return MOCK_BARS;
    const counts = new Array(12).fill(0);
    for (const r of rawDocuments) {
      if (r.category_key !== cat.key) continue;
      const month = new Date(r.uploaded_at).getMonth();
      counts[month] += 1;
    }
    const max = Math.max(1, ...counts);
    return counts.map((c) => Math.round((c / max) * 100));
  }, [rawDocuments, isMock, cat.key]);

  // Total label: in demo mode the polished number, otherwise the real count.
  const totalLabel = isMock ? "€142,830" : `${categoryDocs.length} ${t("lbl_files")}`;
  const monthLabel = isMock ? `12 ${t("cd_month").toLowerCase()}` : "this year";

  const titleIconStyle: CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: `color-mix(in oklab, ${tintColor} 14%, transparent)`,
    color: tintColor,
    boxShadow: `0 0 30px color-mix(in oklab, ${tintColor} 24%, transparent)`,
  };

  return (
    <div
      className="flex"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <Orbs />
      <Grain />

      <Sidebar collapsed={collapsed} active="documents" />

      <div
        className="flex flex-col"
        style={{ flex: 1, padding: 28, gap: 16, position: "relative", zIndex: 2, overflow: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center" style={{ gap: 12, marginBottom: 4 }}>
          <div
            onClick={() => navigate("/documents")}
            className="flex items-center"
            style={{
              gap: 6,
              fontSize: 12,
              color: "var(--ad-text-dim)",
              cursor: "pointer",
            }}
          >
            <Icon name="arrow-left" size={13} stroke={2} />
            {t("cd_all")}
          </div>
        </div>

        <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 18 }}>
            <div className="flex items-center justify-center" style={titleIconStyle}>
              <Icon name={cat.icon as IconName} size={26} stroke={1.6} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ad-text-dim)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {t("nav_categories")}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: -0.6,
                  marginTop: 2,
                }}
              >
                {t(cat.key)}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ad-text-dim)", marginTop: 2, ...numStyle }}
              >
                {isMock
                  ? `${cat.count} ${t("cd_documents")} · €18,420 ${t("cd_thismonth")}`
                  : `${categoryDocs.length} ${t("cd_documents")}`}
              </div>
            </div>
          </div>

          <div className="flex" style={{ gap: 8 }}>
            <div
              onClick={() => alert("Export to Sheets — coming soon")}
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
              <Icon name="sheet" size={13} />
              {t("cd_export")}
            </div>
            <div
              onClick={openUpload}
              className="flex items-center"
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 9,
                gap: 7,
                background: tintColor,
                color: "#09090b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icon name="plus" size={13} stroke={2} />
              {t("nav_upload")}
            </div>
          </div>
        </div>

        {/* Chart */}
        <Panel style={{ padding: 22 }}>
          <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ad-text-dim)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {t("cd_total")} · {monthLabel}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: -0.6,
                  marginTop: 2,
                  ...numStyle,
                }}
              >
                {totalLabel}
              </div>
            </div>
            {isMock && (
              <div
                className="flex items-center"
                style={{ fontSize: 12, color: "var(--ad-accent-mint)", gap: 4 }}
              >
                <Icon name="trend-up" size={13} />
                +12.4% YoY
              </div>
            )}
          </div>
          <div className="flex items-end" style={{ gap: 10, height: 140 }}>
            {bars.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center"
                style={{ flex: 1, height: "100%", justifyContent: "flex-end", gap: 6 }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(b, 4)}%`,
                    borderRadius: 4,
                    background: `linear-gradient(180deg, ${tintColor}, color-mix(in oklab, ${tintColor} 40%, transparent))`,
                    boxShadow: `0 0 12px color-mix(in oklab, ${tintColor} 25%, transparent)`,
                    animation: `growUp 720ms ${i * 40}ms cubic-bezier(.2,.7,.3,1) backwards`,
                    transformOrigin: "bottom",
                    opacity: b === 0 ? 0.18 : 1,
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ad-text-faint)",
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  {MONTH_LABELS[i]}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Docs list */}
        <Panel style={{ padding: 0, flex: 1, overflow: "hidden", minHeight: 200 }}>
          <DocList
            isMock={isMock}
            categoryDocs={categoryDocs}
            tintColor={tintColor}
            onRowClick={(doc) => openDoc(doc)}
            onUpload={openUpload}
            t={t}
          />
        </Panel>
      </div>
    </div>
  );
}

interface DocListProps {
  isMock: boolean;
  categoryDocs: RecentDoc[];
  tintColor: string;
  onRowClick: (doc: RecentDoc) => void;
  onUpload: () => void;
  t: ReturnType<typeof useLang>["t"];
}

function DocList({ isMock, categoryDocs, tintColor, onRowClick, onUpload, t }: DocListProps) {
  const headerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 140px 120px 100px 30px",
    padding: "14px 22px",
    fontSize: 10,
    color: "var(--ad-text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: 600,
    borderBottom: "1px solid var(--ad-hairline)",
  };

  // Empty state for real users with no docs in this category.
  if (!isMock && categoryDocs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: 240, gap: 10, padding: 30, textAlign: "center" }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `color-mix(in oklab, ${tintColor} 10%, transparent)`,
            color: tintColor,
          }}
        >
          <Icon name="file" size={20} stroke={1.6} />
        </div>
        <div style={{ fontSize: 14, color: "var(--ad-text)", fontWeight: 500 }}>
          No documents in this category yet
        </div>
        <div
          onClick={onUpload}
          style={{
            fontSize: 12,
            color: tintColor,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Upload one →
        </div>
      </div>
    );
  }

  // Mid-fi mock rows for demo mode.
  if (isMock) {
    return (
      <>
        <div style={headerStyle}>
          <div>Document</div>
          <div>Vendor</div>
          <div>{t("lbl_updated")}</div>
          <div>Amount</div>
          <div></div>
        </div>
        {MOCK_DOCS.map((d, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 120px 100px 30px",
              alignItems: "center",
              padding: "14px 22px",
              borderBottom: "1px solid var(--ad-hairline)",
              fontSize: 13,
            }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              <Icon name="file" size={14} style={{ color: "var(--ad-text-dim)" }} />
              <span style={{ fontWeight: 500 }}>{d.n}</span>
            </div>
            <div style={{ color: "var(--ad-text-dim)" }}>{d.v}</div>
            <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>{t(d.age)}</div>
            <div style={{ fontWeight: 600, ...numStyle }}>{d.a}</div>
            <Icon name="more" size={14} style={{ color: "var(--ad-text-faint)" }} />
          </div>
        ))}
      </>
    );
  }

  // Real rows.
  return (
    <>
      <div style={headerStyle}>
        <div>Document</div>
        <div>Vendor</div>
        <div>{t("lbl_updated")}</div>
        <div>Amount</div>
        <div></div>
      </div>
      {categoryDocs.map((d, i) => (
        <div
          key={`${d.name}-${i}`}
          onClick={() => onRowClick(d)}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 120px 100px 30px",
            alignItems: "center",
            padding: "14px 22px",
            borderBottom: "1px solid var(--ad-hairline)",
            fontSize: 13,
            cursor: "pointer",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--ad-chip)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <Icon name="file" size={14} style={{ color: "var(--ad-text-dim)" }} />
            <span style={{ fontWeight: 500 }}>{d.name}</span>
          </div>
          <div style={{ color: "var(--ad-text-dim)" }}>—</div>
          <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>{t(d.ageKey)}</div>
          <div style={{ fontWeight: 600, ...numStyle }}>—</div>
          <Icon name="more" size={14} style={{ color: "var(--ad-text-faint)" }} />
        </div>
      ))}
    </>
  );
}
