// PageShell.tsx — shared layout for secondary pages (Sheets, Trash, Contacts, Settings).
// Provides the same Sidebar + Orbs + Grain backdrop as the rest of the app
// but with a centered content column instead of the dashboard's heavy panel grid.

import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { SidebarState } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon } from "@/components/ui/Icon";

interface PageShellProps {
  title: string;
  subtitle?: string;
  active?: string;
  sidebarState?: SidebarState;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  active,
  sidebarState = "expanded",
  back,
  actions,
  children,
}: PageShellProps) {
  const navigate = useNavigate();
  const collapsed = sidebarState === "collapsed";

  const wrapStyle: CSSProperties = {
    width: "100vw",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Geist', system-ui, sans-serif",
    color: "var(--ad-text)",
  };

  return (
    <div className="flex" style={wrapStyle}>
      <Orbs />
      <Grain />
      <Sidebar collapsed={collapsed} active={active} />
      <div
        className="flex flex-col"
        style={{
          flex: 1,
          padding: 28,
          gap: 16,
          position: "relative",
          zIndex: 2,
          overflow: "auto",
        }}
      >
        {back && (
          <div
            onClick={() => navigate(back.to)}
            className="flex items-center"
            style={{
              gap: 6,
              fontSize: 12,
              color: "var(--ad-text-dim)",
              cursor: "pointer",
              width: "fit-content",
              marginBottom: 4,
            }}
          >
            <Icon name="arrow-left" size={13} stroke={2} />
            {back.label}
          </div>
        )}

        <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -0.6,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{ fontSize: 13, color: "var(--ad-text-dim)", marginTop: 4, maxWidth: 640 }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="flex" style={{ gap: 8 }}>{actions}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}
