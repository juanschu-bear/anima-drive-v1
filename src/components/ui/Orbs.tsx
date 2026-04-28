// Orbs.tsx — three drifting radial-gradient orbs that sit behind the UI.
// Purely decorative; only used on full-screen pages.
// 1:1 from the original tokens.jsx (orb opacity is theme-aware via CSS var).

import type { CSSProperties } from "react";

interface OrbsProps {
  /** Seeds the per-orb drift offset so multiple pages don't sync up. */
  seed?: number;
}

const SET = [
  { x: "10%", y: "15%", c: "var(--ad-accent-mint)",  s: 420 },
  { x: "82%", y: "8%",  c: "var(--ad-accent-blue)",  s: 380 },
  { x: "60%", y: "78%", c: "var(--ad-accent-amber)", s: 520 },
];

const containerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

export function Orbs({ seed = 0 }: OrbsProps) {
  return (
    <div aria-hidden style={containerStyle}>
      {SET.map((o, i) => {
        const orbStyle = {
          position: "absolute",
          left: o.x,
          top: o.y,
          width: o.s,
          height: o.s,
          background: `radial-gradient(closest-side, ${o.c}, transparent 70%)`,
          opacity: "var(--ad-orb-opacity)",
          filter: "blur(60px)",
          transform: "translate(-50%, -50%)",
          animation: `orbDrift${(seed + i) % 3} 22s ease-in-out infinite`,
        } as CSSProperties;
        return <div key={i} style={orbStyle} />;
      })}
    </div>
  );
}
