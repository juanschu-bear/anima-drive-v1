// Panel.tsx — frosted-glass surface used everywhere on top of the bg.
// 1:1 from the original midfi.jsx Panel atom.

import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Panel({ children, style, className }: PanelProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--ad-panel)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        border: "1px solid var(--ad-border)",
        boxShadow: "var(--ad-panel-shadow)",
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
