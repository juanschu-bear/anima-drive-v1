// Chip.tsx — small accent label (used inside cards, lists, AI panel).
// 1:1 from the original midfi.jsx Chip atom.

import type { ReactNode } from "react";
import type { AccentTint } from "@/types";
import { ACCENT_VARS } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";

interface ChipProps {
  tint?: AccentTint;
  children: ReactNode;
  icon?: IconName;
}

export function Chip({ tint, children, icon }: ChipProps) {
  const color = tint ? ACCENT_VARS[tint] : "var(--ad-text-dim)";
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        height: 22,
        padding: "0 8px",
        borderRadius: 6,
        background: "var(--ad-chip)",
        border: "1px solid var(--ad-border)",
        color,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.2,
      }}
    >
      {icon && <Icon name={icon} size={12} stroke={1.8} />}
      {children}
    </span>
  );
}
