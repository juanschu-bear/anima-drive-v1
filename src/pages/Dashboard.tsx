// Dashboard.tsx — main dashboard page.
// 1:1 from the original midfi.jsx Dashboard.
// Layout: Sidebar | (header + KPIs + Categories + Recent + Activity) | AIPanel

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryTreatment, SidebarState, AIPlacement } from "@/types";
import { useLang } from "@/lib/i18n";
import { greetKey } from "@/lib/utils";
import { useUploadModal } from "@/lib/upload-modal";
import { useCommandPalette } from "@/lib/command-palette";
import { useDocuments } from "@/lib/useDocuments";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { AIPanel } from "@/components/AIPanel";
import { Activity } from "@/components/Activity";
import { Categories } from "@/components/Categories";
import { RecentCard } from "@/components/RecentCard";
import { Panel } from "@/components/ui/Panel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { KPI } from "@/components/ui/KPI";
import { Icon } from "@/components/ui/Icon";

interface DashboardProps {
  /** Layout knobs — defaults match the polished mid-fi reference. */
  sidebarState?: SidebarState;
  aiPlacement?: AIPlacement;
}

export function Dashboard({ sidebarState = "expanded", aiPlacement = "panel" }: DashboardProps) {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { open: openUpload } = useUploadModal();
  const { open: openSearch } = useCommandPalette();
  const { documents, rawDocuments, isMock } = useDocuments();
  const { user } = useAuth();
  const [treatment, setTreatment] = useState<CategoryTreatment>("grid");

  // User display name: pull from Supabase user metadata if signed in.
  // Falls back to the localized "Maya" only in true demo mode.
  const userName = (() => {
    if (isMock) return t("user_name");
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const fullName = typeof meta?.full_name === "string" ? meta.full_name : undefined;
    const firstName = typeof meta?.first_name === "string" ? meta.first_name : undefined;
    if (firstName) return firstName;
    if (fullName) return fullName.split(" ")[0];
    // Fall back to the part before @ in the email.
    const email = user?.email ?? "";
    const handle = email.split("@")[0];
    if (handle) {
      // Capitalize first letter for niceness.
      return handle.charAt(0).toUpperCase() + handle.slice(1);
    }
    return "there";
  })();

  // In demo mode (no Supabase / no auth) we keep the polished mid-fi numbers.
  // Once a real user is signed in, KPIs reflect their actual document count.
  const totalDocs = isMock ? 47 : documents.length;
  const activeCategories = (() => {
    if (isMock) return 16;
    const set = new Set(documents.map((d) => d.catKey));
    return set.size;
  })();
  // Storage usage: sum of size_bytes from raw rows (real mode), mock 234 MB otherwise.
  const storageMb = isMock
    ? 234
    : Math.round(rawDocuments.reduce((sum, r) => sum + (r.size_bytes ?? 0), 0) / (1024 * 1024));

  const greet = t(greetKey());
  const collapsed = sidebarState === "collapsed";
  const aiRight = aiPlacement !== "drawer";

  const localeMap: Record<string, string> = { de: "de-DE", es: "es-ES", en: "en-US" };
  const dateStr = new Date().toLocaleDateString(localeMap[lang] ?? "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{
        width: 1440,
        height: 900,
        position: "relative",
        overflow: "hidden",
        background: "var(--ad-bg)",
        color: "var(--ad-text)",
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Orbs />
      <Grain />

      <div className="flex" style={{ height: "100%", position: "relative", zIndex: 2 }}>
        <Sidebar collapsed={collapsed} active="dashboard" />

        {/* Main column */}
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "28px 28px 24px",
            gap: 20,
            overflow: "auto",
          }}
        >
          {/* Header */}
          <div
            className="flex items-end justify-between"
            style={{ animation: "fadeUp 560ms cubic-bezier(.2,.7,.3,1) backwards" }}
          >
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
                {dateStr}
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: -0.8,
                  marginTop: 4,
                }}
              >
                {greet}, {userName}.
              </div>
              <div style={{ fontSize: 14, color: "var(--ad-text-dim)", marginTop: 4 }}>
                {totalDocs === 0
                  ? t("subtitle_dash_zero")
                  : `${totalDocs} ${t("subtitle_dash")}`}
              </div>
            </div>

            <div className="flex" style={{ gap: 8 }}>
              <div
                onClick={openSearch}
                className="flex items-center"
                style={{
                  gap: 8,
                  padding: "0 12px",
                  height: 34,
                  borderRadius: 10,
                  background: "var(--ad-chip)",
                  border: "1px solid var(--ad-border)",
                  color: "var(--ad-text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <Icon name="search" size={13} />
                Search
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
              <div
                onClick={openUpload}
                className="flex items-center"
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 10,
                  gap: 8,
                  background: "var(--ad-accent-mint)",
                  color: "#09090b",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 0 24px color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)",
                }}
              >
                <Icon name="upload" size={13} stroke={2} />
                {t("nav_upload")}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex" style={{ gap: 14 }}>
            <KPI label={t("kpi_docs")}       value={totalDocs}       tint="mint"  icon="file"   delay={80}  />
            <KPI label={t("kpi_categories")} value={activeCategories} tint="amber" icon="grid"   delay={160} />
            <KPI
              label={t("kpi_storage")}
              value={storageMb}
              unit={`MB ${t("kpi_of")} 5 GB`}
              tint="blue"
              icon="folder"
              delay={240}
              ring={storageMb / 5000}
            />
          </div>

          {/* Categories panel */}
          <Panel style={{ padding: 22 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "var(--ad-text-dim)",
                }}
              >
                {t("categories")}
              </div>
              <div className="flex items-center" style={{ gap: 10 }}>
                <div
                  className="flex"
                  style={{
                    padding: 2,
                    borderRadius: 8,
                    background: "var(--ad-chip)",
                    border: "1px solid var(--ad-border)",
                  }}
                >
                  {(
                    [
                      { k: "grid",  icon: "grid"  },
                      { k: "list",  icon: "menu"  },
                      { k: "cloud", icon: "spark" },
                    ] as const
                  ).map((v) => {
                    const isActive = treatment === v.k;
                    return (
                      <div
                        key={v.k}
                        onClick={() => setTreatment(v.k as CategoryTreatment)}
                        className="flex items-center justify-center"
                        style={{
                          width: 26,
                          height: 22,
                          borderRadius: 6,
                          color: isActive ? "var(--ad-text)" : "var(--ad-text-faint)",
                          background: isActive ? "var(--ad-panel-solid)" : "transparent",
                          boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                          cursor: "pointer",
                          transition: "all 140ms",
                        }}
                      >
                        <Icon name={v.icon} size={12} stroke={1.8} />
                      </div>
                    );
                  })}
                </div>
                <div
                  onClick={() => navigate("/documents")}
                  style={{ fontSize: 11, color: "var(--ad-text-faint)", cursor: "pointer" }}
                >
                  {t("see_all")} ›
                </div>
              </div>
            </div>
            <Categories treatment={treatment} />
          </Panel>

          {/* Recent + Activity */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 2fr)",
              gap: 14,
              minHeight: 0,
              flex: 1,
            }}
          >
            <Panel style={{ padding: "18px 0 18px 22px", overflow: "hidden" }}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 14, paddingRight: 22 }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "var(--ad-text-dim)",
                  }}
                >
                  {t("recent")}
                </div>
              </div>
              <div
                className="flex"
                style={{
                  gap: 10,
                  overflowX: "auto",
                  overflowY: "hidden",
                  paddingRight: 22,
                  paddingBottom: 4,
                  scrollbarWidth: "thin",
                }}
              >
                {documents.slice(0, 5).map((d, i) => (
                  <RecentCard key={`${d.name}-${i}`} doc={d} delay={260 + i * 70} />
                ))}
              </div>
            </Panel>
            <Activity />
          </div>
        </div>

        {/* Right AI rail */}
        {aiRight && (
          <div style={{ width: 360, padding: "28px 28px 24px 0" }}>
            <AIPanel width={360} />
          </div>
        )}
      </div>
    </div>
  );
}
