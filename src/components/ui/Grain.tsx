// Grain.tsx — subtle film-grain overlay using inline SVG feTurbulence.
// 1:1 from the original tokens.jsx; the grain opacity is theme-aware via CSS var.

import type { CSSProperties } from "react";

const SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
    <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
    <rect width='100%' height='100%' filter='url(#n)' opacity='1'/></svg>`,
);

// Opacity is a CSS variable, which React's CSSProperties types as number-only.
// We cast the style object once to bypass that single-property limitation.
const style = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 1,
  mixBlendMode: "overlay",
  opacity: "var(--ad-grain)",
  backgroundImage: `url("data:image/svg+xml;utf8,${SVG}")`,
  backgroundSize: "220px 220px",
} as CSSProperties;

export function Grain() {
  return <div aria-hidden style={style} />;
}
