// Icon.tsx — stroke-only SVG icon set for Anima-Drive.
// 24×24 viewBox, currentColor stroke. Paths are kept flat strings; multi-subpath
// icons are split on " M" so each subpath owns its own start point.
// Ported 1:1 from the original tokens.jsx — every key and path identical.

import type { CSSProperties, SVGProps } from "react";

export type IconName =
  | "upload" | "sparkle" | "grid" | "file" | "folder" | "sheet" | "trash"
  | "people" | "settings" | "search" | "trend-up" | "trend-down" | "key"
  | "shield" | "receipt" | "chart" | "plane" | "box" | "megaphone" | "spark"
  | "car" | "antenna" | "glass" | "dots" | "send" | "arrow-right" | "arrow-left"
  | "check" | "x" | "plus" | "sun" | "moon" | "globe" | "menu" | "chevron-r"
  | "chevron-d" | "bolt" | "inbox" | "more" | "image";

const ICONS: Record<IconName, string> = {
  "upload":      "M12 16V5M12 5l-4 4M12 5l4 4M5 18h14",
  "sparkle":     "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z M19 3v2M19 4h2",
  "grid":        "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  "file":        "M6 3h9l3 3v15H6z M15 3v3h3",
  "folder":      "M3 6h6l2 2h10v11H3z",
  "sheet":       "M4 4h16v16H4z M4 10h16 M10 4v16",
  "trash":       "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
  "people":      "M8 11a3 3 0 100-6 3 3 0 000 6zM16 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M3 20c0-3.3 2.7-5 5-5s5 1.7 5 5 M14 20c0-2.5 2-4 4-4s4 1.5 4 4",
  "settings":    "M12 9a3 3 0 100 6 3 3 0 000-6z M12 3v2 M12 19v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M3 12h2 M19 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
  "search":      "M11 4a7 7 0 100 14 7 7 0 000-14z M16 16l5 5",
  "trend-up":    "M4 17l6-6 4 4 6-8 M15 7h5v5",
  "trend-down":  "M4 7l6 6 4-4 6 8 M15 17h5v-5",
  "key":         "M15 9a4 4 0 10-3.5 4L4 20v2h3v-2h2v-2h2l2.5-2.5A4 4 0 0015 9z",
  "shield":      "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z",
  "receipt":     "M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z M9 8h6 M9 12h6 M9 16h4",
  "chart":       "M4 20h16 M7 17v-6 M12 17V7 M17 17v-9",
  "plane":       "M4 14l16-8-5 14-3-6-6-2z",
  "box":         "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  "megaphone":   "M3 10v4l12 5V5L3 10z M15 8v8 M19 10a2 2 0 010 4",
  "spark":       "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M5.6 18.4l2.8-2.8 M15.6 8.4l2.8-2.8",
  "car":         "M4 16l2-7h12l2 7v3H4z M4 19v2 M20 19v2 M7 14h2 M15 14h2",
  "antenna":     "M12 13v8 M8 21h8 M8 7a4 4 0 018 0 M5 7a7 7 0 0114 0 M12 13a2 2 0 100-4 2 2 0 000 4z",
  "glass":       "M6 4h12l-2 8a4 4 0 01-8 0z M12 12v7 M9 21h6",
  "dots":        "M6 12h.01 M12 12h.01 M18 12h.01",
  "send":        "M4 4l17 8-17 8 2-8z M6 12h10",
  "arrow-right": "M5 12h14 M13 6l6 6-6 6",
  "arrow-left":  "M19 12H5 M11 6l-6 6 6 6",
  "check":       "M5 12l4 4 10-10",
  "x":           "M6 6l12 12 M18 6L6 18",
  "plus":        "M12 5v14 M5 12h14",
  "sun":         "M12 6a6 6 0 100 12 6 6 0 000-12z M12 2v2 M12 20v2 M4 12H2 M22 12h-2 M4.9 4.9L3.5 3.5 M20.5 20.5l-1.4-1.4 M4.9 19.1l-1.4 1.4 M20.5 3.5l-1.4 1.4",
  "moon":        "M20 14A8 8 0 0110 4a8 8 0 1010 10z",
  "globe":       "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3a14 14 0 010 18 M12 3a14 14 0 000 18",
  "menu":        "M4 6h16 M4 12h16 M4 18h16",
  "chevron-r":   "M9 6l6 6-6 6",
  "chevron-d":   "M6 9l6 6 6-6",
  "bolt":        "M13 3L4 14h7l-1 7 9-11h-7z",
  "inbox":       "M3 14h5l1 3h6l1-3h5 M4 14l3-9h10l3 9v6H4z",
  "more":        "M5 12h.01 M12 12h.01 M19 12h.01",
  "image":       "M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6",
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "stroke"> {
  name: IconName;
  size?: number;
  /** Stroke width — maps to the SVG strokeWidth attribute. */
  stroke?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, stroke = 1.6, style, ...rest }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  // Some path strings contain multiple subpaths separated by " M";
  // render each as its own <path> so each subpath owns its own start point.
  const parts = d.split(/ (?=M)/);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...(style ?? {}) }}
      {...rest}
    >
      {parts.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
