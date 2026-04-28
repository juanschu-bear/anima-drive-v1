// KPI.tsx — large stat card on the dashboard (count-up animated).
// 1:1 from the original midfi.jsx KPI.

import type { CSSProperties } from "react";
import type { AccentTint } from "@/types";
import { ACCENT_VARS } from "@/lib/theme";
import { useCountUp, useDelayed, numStyle } from "@/lib/utils";
import { Panel } from "./Panel";
import { Icon, type IconName } from "./Icon";
import { StorageRing } from "./StorageRing";

interface KPIProps {
  label: string;
  value: number;
  unit?: string;
  tint: AccentTint;
  icon: IconName;
  delay?: number;
  /** If set, the storage ring is shown filled to this fraction (0..1). */
  ring?: number;
}

export function KPI({ label, value, unit, tint, icon, delay = 0, ring }: KPIProps) {
  const n = useCountUp(value, 900, delay);
  const on = useDelayed(delay);
  const tintColor = ACCENT_VARS[tint];

  const panelStyle: CSSProperties = {
    padding: "20px 22px",
    flex: 1,
    position: "relative",
    overflow: "hidden",
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 480ms cubic-bezier(.2,.7,.3,1) 60ms, transform 480ms cubic-bezier(.2,.7,.3,1) 60ms",
  };

  return (
    <Panel style={panelStyle}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div
          className="flex items-center gap-2"
          style={{
            color: "var(--ad-text-dim)",
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <Icon name={icon} size={13} stroke={1.8} />
          {label}
        </div>
        {ring !== undefined && <StorageRing value={ring} />}
      </div>
      <div className="flex items-baseline gap-2" style={numStyle}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: -1.2,
            color: "var(--ad-text)",
            lineHeight: 1,
            fontFamily: "'Geist', ui-sans-serif, system-ui",
          }}
        >
          {n}
        </div>
        {unit && (
          <div style={{ fontSize: 14, color: "var(--ad-text-dim)", fontWeight: 400 }}>{unit}</div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          right: -20,
          bottom: -20,
          width: 120,
          height: 120,
          background: `radial-gradient(closest-side, ${tintColor}, transparent)`,
          opacity: 0.14,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
    </Panel>
  );
}
