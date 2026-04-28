// Browser.tsx — document browser with filter pills and grid/list views.
// 1:1 from the original midfi.jsx Browser.

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { SidebarState } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { CATS, RECENT, findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { useDocumentDetail } from "@/lib/document-detail";
import { useCommandPalette } from "@/lib/command-palette";
import { Sidebar } from "@/components/Sidebar";
import { Panel } from "@/components/ui/Panel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { ThumbSwatch } from "@/components/ui/ThumbSwatch";

interface BrowserProps {
  sidebarState?: SidebarState;
}

type ViewMode = "grid" | "list";

export function Browser({ sidebarState = "expanded" }: BrowserProps) {
  const { t } = useLang();
  const { openDoc } = useDocumentDetail();
  const { open: openSearch } = useCommandPalette();
  const [view, setView] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const collapsed = sidebarState === "collapsed";

  // Same trick as the original: duplicate the recent docs to fill the grid/list.
  const allDocs = useMemo(
    () => [...RECENT, ...RECENT].map((d, i) => ({ ...d, id: i })),
    [],
  );

  const docs = useMemo(
    () => (activeFilter ? allDocs.filter((d) => d.catKey === activeFilter) : allDocs),
    [allDocs, activeFilter],
  );

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
      <Orbs seed={1} />
      <Grain />

      <div className="flex" style={{ height: "100%", position: "relative", zIndex: 2 }}>
        <Sidebar collapsed={collapsed} active="documents" />

        <div
          className="flex flex-col"
          style={{
            flex: 1,
            padding: "28px 28px",
            gap: 16,
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
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
                {t("nav_documents")}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: -0.6,
                  marginTop: 2,
                }}
              >
                {t("br_title")}{" "}
                <span
                  style={{
                    color: "var(--ad-text-faint)",
                    fontWeight: 400,
                    ...numStyle,
                  }}
                >
                  · {docs.length}
                </span>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                onClick={openSearch}
                className="flex items-center"
                style={{
                  gap: 8,
                  width: 280,
                  padding: "0 12px",
                  height: 36,
                  borderRadius: 10,
                  background: "var(--ad-chip)",
                  border: "1px solid var(--ad-border)",
                  color: "var(--ad-text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <Icon name="search" size={13} />
                <span style={{ flex: 1, color: "var(--ad-text-faint)" }}>{t("br_search")}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background: "var(--ad-border-strong)",
                    color: "var(--ad-text-dim)",
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  ⌘K
                </span>
              </div>
              {/* View toggle */}
              <div
                className="flex"
                style={{
                  padding: 2,
                  borderRadius: 9,
                  background: "var(--ad-chip)",
                  border: "1px solid var(--ad-border)",
                  height: 36,
                }}
              >
                {(["grid", "list"] as ViewMode[]).map((v) => {
                  const isActive = view === v;
                  const itemStyle: CSSProperties = {
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 7,
                    cursor: "pointer",
                    background: isActive ? "var(--ad-panel-solid)" : "transparent",
                    color: isActive ? "var(--ad-text)" : "var(--ad-text-dim)",
                    fontSize: 12,
                    fontWeight: 500,
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                  };
                  return (
                    <div key={v} onClick={() => setView(v)} style={itemStyle}>
                      <Icon name={v === "grid" ? "grid" : "menu"} size={12} />
                      {t(v === "grid" ? "br_grid" : "br_list")}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            <div
              onClick={() => setActiveFilter(null)}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                background: activeFilter === null ? "var(--ad-accent-mint)" : "var(--ad-chip)",
                color: activeFilter === null ? "#09090b" : "var(--ad-text-dim)",
                border: activeFilter === null ? "none" : "1px solid var(--ad-border)",
                cursor: "pointer",
                transition: "background 140ms, color 140ms",
              }}
            >
              {t("br_all")}{" "}
              <span style={{ opacity: 0.7, ...numStyle }}>{allDocs.length}</span>
            </div>
            {CATS.slice(0, 7).map((c) => {
              const tintColor = ACCENT_VARS[c.tint];
              const isActive = activeFilter === c.key;
              return (
                <div
                  key={c.key}
                  onClick={() => setActiveFilter(isActive ? null : c.key)}
                  className="flex items-center"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive
                      ? `color-mix(in oklab, ${tintColor} 18%, transparent)`
                      : "var(--ad-chip)",
                    border: isActive ? `1px solid ${tintColor}` : "1px solid var(--ad-border)",
                    color: isActive ? "var(--ad-text)" : "var(--ad-text-dim)",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 140ms",
                  }}
                >
                  <Icon name={c.icon as IconName} size={11} style={{ color: tintColor }} />
                  {t(c.key)}{" "}
                  <span style={{ color: "var(--ad-text-faint)", ...numStyle }}>{c.count}</span>
                </div>
              );
            })}
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 11,
                background: "transparent",
                color: "var(--ad-text-faint)",
              }}
            >
              +9 more
            </div>
          </div>

          {/* Content */}
          {view === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {docs.slice(0, 15).map((d, i) => {
                const cat = findCategory(d.catKey);
                if (!cat) return null;
                return (
                  <div
                    key={d.id}
                    onClick={() => openDoc(d)}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid var(--ad-border)",
                      background: "var(--ad-card-bg-recent)",
                      cursor: "pointer",
                      transition: "transform 220ms cubic-bezier(.2,.7,.3,1), border-color 220ms",
                      animation: `fadeUp 420ms ${60 + i * 20}ms cubic-bezier(.2,.7,.3,1) backwards`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT_VARS[cat.tint]} 40%, transparent)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.borderColor = "var(--ad-border)";
                    }}
                  >
                    <ThumbSwatch cat={cat} ext={d.ext} />
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.name}
                    </div>
                    <div
                      className="flex items-center justify-between"
                      style={{ marginTop: 5 }}
                    >
                      <Chip tint={cat.tint}>{t(cat.key)}</Chip>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--ad-text-faint)",
                          ...numStyle,
                        }}
                      >
                        {d.size}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Panel style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 1fr 160px 140px 100px 30px",
                  padding: "10px 16px",
                  fontSize: 10,
                  color: "var(--ad-text-faint)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--ad-hairline)",
                }}
              >
                <div></div>
                <div>Name</div>
                <div>Category</div>
                <div>{t("lbl_updated")}</div>
                <div>Size</div>
                <div></div>
              </div>
              {docs.slice(0, 8).map((d) => {
                const cat = findCategory(d.catKey);
                if (!cat) return null;
                return (
                  <div
                    key={d.id}
                    onClick={() => openDoc(d)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "30px 1fr 160px 140px 100px 30px",
                      alignItems: "center",
                      padding: "12px 16px",
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
                    <Icon name="file" size={14} style={{ color: "var(--ad-text-dim)" }} />
                    <div style={{ fontWeight: 500 }}>{d.name}</div>
                    <Chip tint={cat.tint} icon={cat.icon as IconName}>
                      {t(cat.key)}
                    </Chip>
                    <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>{t(d.ageKey)}</div>
                    <div style={{ color: "var(--ad-text-faint)", ...numStyle }}>{d.size}</div>
                    <Icon name="more" size={14} style={{ color: "var(--ad-text-faint)" }} />
                  </div>
                );
              })}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
