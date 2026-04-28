// CategoryDetail.tsx — drill-down view for a single category (e.g. Expenses).
// 1:1 from the original midfi.jsx CategoryDetail.

import { useNavigate, useParams } from "react-router-dom";
import type { CSSProperties } from "react";
import type { SidebarState } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { CATS, findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { useUploadModal } from "@/lib/upload-modal";
import { Sidebar } from "@/components/Sidebar";
import { Panel } from "@/components/ui/Panel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon, type IconName } from "@/components/ui/Icon";

interface CategoryDetailProps {
  sidebarState?: SidebarState;
}

const BARS = [38, 42, 65, 48, 58, 82, 72, 55, 68, 92, 78, 95];
const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const DOCS = [
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
  const { id } = useParams<{ id: string }>();

  // The category id in the URL is the cat key without the "cat_" prefix.
  // Default to "expenses" — that's what the original mock used (CATS[1]).
  const lookupKey = id ? `cat_${id}` : "cat_expenses";
  const cat = findCategory(lookupKey) ?? CATS[1];
  const tintColor = ACCENT_VARS[cat.tint];
  const collapsed = sidebarState === "collapsed";

  const titleIconStyle: CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: `linear-gradient(135deg, color-mix(in oklab, ${tintColor} 23%, transparent), color-mix(in oklab, ${tintColor} 7%, transparent))`,
    border: `1px solid color-mix(in oklab, ${tintColor} 25%, transparent)`,
    color: tintColor,
    boxShadow: `0 0 32px color-mix(in oklab, ${tintColor} 19%, transparent)`,
  };

  return (
    <div
      style={{
        width: 1440,
        height: 900,
        background: "var(--ad-bg)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <Orbs seed={2} />
      <Grain />

      <div className="flex" style={{ height: "100%", position: "relative", zIndex: 2 }}>
        <Sidebar collapsed={collapsed} active="documents" />

        <div
          className="flex flex-col"
          style={{ flex: 1, padding: "28px 28px", gap: 20, minWidth: 0 }}
        >
          {/* Breadcrumb */}
          <div
            className="flex items-center"
            style={{
              gap: 6,
              fontSize: 12,
              color: "var(--ad-text-dim)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/documents")}
          >
            <Icon name="arrow-left" size={13} />
            <span>{t("cd_back")}</span>
          </div>

          {/* Title bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 16 }}>
              <div className="flex items-center justify-center" style={titleIconStyle}>
                <Icon name={cat.icon as IconName} size={28} stroke={1.6} />
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
                  {t("categories")}
                </div>
                <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8 }}>
                  {t(cat.key)}
                </div>
                <div style={{ fontSize: 13, color: "var(--ad-text-dim)", ...numStyle }}>
                  {cat.count} {t("cd_count")} · €18,420 {t("cd_month")}
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
                  {t("cd_total")} · 12 {t("cd_month").toLowerCase()}
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
                  €142,830
                </div>
              </div>
              <div
                className="flex items-center"
                style={{ fontSize: 12, color: "var(--ad-accent-mint)", gap: 4 }}
              >
                <Icon name="trend-up" size={13} />
                +12.4% YoY
              </div>
            </div>
            <div className="flex items-end" style={{ gap: 10, height: 140 }}>
              {BARS.map((b, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  style={{ flex: 1, height: "100%", justifyContent: "flex-end", gap: 6 }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${b}%`,
                      borderRadius: 4,
                      background: `linear-gradient(180deg, ${tintColor}, color-mix(in oklab, ${tintColor} 40%, transparent))`,
                      boxShadow: `0 0 12px color-mix(in oklab, ${tintColor} 25%, transparent)`,
                      animation: `growUp 720ms ${i * 40}ms cubic-bezier(.2,.7,.3,1) backwards`,
                      transformOrigin: "bottom",
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
          <Panel style={{ padding: 0, flex: 1, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 120px 100px 30px",
                padding: "14px 22px",
                fontSize: 10,
                color: "var(--ad-text-faint)",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontWeight: 600,
                borderBottom: "1px solid var(--ad-hairline)",
              }}
            >
              <div>Document</div>
              <div>Vendor</div>
              <div>{t("lbl_updated")}</div>
              <div>Amount</div>
              <div></div>
            </div>
            {DOCS.map((d, i) => (
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
          </Panel>
        </div>
      </div>
    </div>
  );
}
