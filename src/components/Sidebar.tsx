// Sidebar.tsx — left-rail navigation. Active item gets a glowing left bar.
// Uses react-router NavLink for routing; theme/lang toggles wire to contexts.
// 1:1 layout from the original midfi.jsx Sidebar.

import { useNavigate, useLocation } from "react-router-dom";
import type { CSSProperties } from "react";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { useUploadModal } from "@/lib/upload-modal";
import type { Lang, ThemeKey } from "@/types";
import { Icon, type IconName } from "@/components/ui/Icon";

interface SidebarProps {
  collapsed: boolean;
  /** Override the active key; otherwise inferred from route. */
  active?: string;
}

interface NavItem {
  k: string;
  icon: IconName;
  label: string;
  path?: string;
}

const NAV: NavItem[] = [
  { k: "upload",    icon: "upload",  label: "nav_upload" },
  { k: "ask",       icon: "sparkle", label: "nav_ask",       path: "/ai" },
  { k: "dashboard", icon: "grid",    label: "nav_dashboard", path: "/" },
  { k: "documents", icon: "file",    label: "nav_documents", path: "/documents" },
  { k: "sheets",    icon: "sheet",   label: "nav_sheets" },
  { k: "trash",     icon: "trash",   label: "nav_trash" },
  { k: "contacts",  icon: "people",  label: "nav_contacts" },
];

function pathToKey(pathname: string): string {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/categories")) return "documents";
  if (pathname.startsWith("/ai")) return "ask";
  if (pathname.startsWith("/onboarding")) return "dashboard";
  return "dashboard";
}

export function Sidebar({ collapsed, active }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeKey, setThemeKey } = useTheme();
  const { lang, setLang, t } = useLang();
  const { open: openUpload } = useUploadModal();
  const activeKey = active ?? pathToKey(location.pathname);

  const w = collapsed ? 64 : 232;

  return (
    <div
      style={{
        width: w,
        flexShrink: 0,
        height: "100%",
        borderRight: "1px solid var(--ad-hairline)",
        padding: collapsed ? "18px 12px" : "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "width 260ms cubic-bezier(.2,.7,.3,1), padding 260ms",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Brand: spinning conic logo + counter-spinning inner glyph */}
      <div className="flex items-center gap-2.5" style={{ padding: "6px 8px 18px" }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            position: "relative",
            background:
              "conic-gradient(from 200deg, var(--ad-accent-mint), var(--ad-accent-blue), var(--ad-accent-amber), var(--ad-accent-coral), var(--ad-accent-mint))",
            boxShadow: "0 0 20px color-mix(in oklab, var(--ad-accent-mint) 33%, transparent)",
            animation: "logoSpin 14s linear infinite",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              position: "absolute",
              inset: 3,
              background: "var(--ad-panel-solid)",
              borderRadius: 6,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--ad-text)",
              animation: "logoCounterSpin 14s linear infinite",
            }}
          >
            a
          </div>
        </div>
        {!collapsed && (
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: "var(--ad-text)" }}>
            Anima-Drive
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ position: "relative" }}>
        {NAV.map((n) => {
          const isActive = n.k === activeKey;
          const onClick = () => {
            if (n.k === "upload") {
              openUpload();
              return;
            }
            if (n.path) navigate(n.path);
          };
          const itemStyle: CSSProperties = {
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 36,
            padding: collapsed ? "0 9px" : "0 10px",
            borderRadius: 9,
            color: isActive ? "var(--ad-text)" : "var(--ad-text-dim)",
            background: isActive ? "var(--ad-chip)" : "transparent",
            fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            cursor: "pointer",
            transition: "background 120ms, color 120ms",
            marginBottom: 1,
          };
          return (
            <div key={n.k} style={itemStyle} onClick={onClick}>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    background: "var(--ad-accent-mint)",
                    borderRadius: 2,
                    boxShadow: "0 0 10px var(--ad-accent-mint)",
                  }}
                />
              )}
              <Icon name={n.icon} size={17} stroke={1.6} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{t(n.label)}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer: theme + lang toggles */}
      {!collapsed ? (
        <div className="flex flex-col" style={{ gap: 8, padding: "8px 2px" }}>
          {/* Theme toggle */}
          <div
            className="flex items-center"
            style={{
              gap: 6,
              border: "1px solid var(--ad-border)",
              borderRadius: 9,
              padding: 3,
              background: "var(--ad-chip)",
            }}
          >
            {(["dark", "light"] as ThemeKey[]).map((k) => {
              const isActive = k === themeKey;
              return (
                <div
                  key={k}
                  onClick={() => setThemeKey(k)}
                  className="flex items-center justify-center"
                  style={{
                    flex: 1,
                    height: 26,
                    borderRadius: 6,
                    gap: 5,
                    background: isActive ? "var(--ad-panel-solid)" : "transparent",
                    color: isActive ? "var(--ad-text)" : "var(--ad-text-dim)",
                    fontSize: 11,
                    fontWeight: 500,
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <Icon name={k === "dark" ? "moon" : "sun"} size={12} stroke={1.8} />
                  {t(k)}
                </div>
              );
            })}
          </div>
          {/* Lang toggle */}
          <div
            className="flex items-center"
            style={{
              gap: 6,
              border: "1px solid var(--ad-border)",
              borderRadius: 9,
              padding: 3,
              background: "var(--ad-chip)",
            }}
          >
            {(["en", "de", "es"] as Lang[]).map((k) => {
              const isActive = k === lang;
              return (
                <div
                  key={k}
                  onClick={() => setLang(k)}
                  className="flex items-center justify-center"
                  style={{
                    flex: 1,
                    height: 24,
                    borderRadius: 6,
                    background: isActive ? "var(--ad-panel-solid)" : "transparent",
                    color: isActive ? "var(--ad-text)" : "var(--ad-text-dim)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {k}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center"
          style={{ gap: 8, padding: "8px 0", color: "var(--ad-text-dim)" }}
        >
          <Icon name={themeKey === "dark" ? "moon" : "sun"} size={16} />
          <Icon name="globe" size={16} />
        </div>
      )}
    </div>
  );
}
