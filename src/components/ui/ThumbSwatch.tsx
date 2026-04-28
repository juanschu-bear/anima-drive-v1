// ThumbSwatch.tsx — fake document thumbnail used in cards/lists.
// 1:1 from the original midfi.jsx ThumbSwatch.

import type { Category } from "@/types";
import { ACCENT_VARS } from "@/lib/theme";
import { Icon, type IconName } from "@/components/ui/Icon";

interface ThumbSwatchProps {
  cat: Category;
  ext: string;
}

export function ThumbSwatch({ cat, ext }: ThumbSwatchProps) {
  const tintColor = ACCENT_VARS[cat.tint];
  return (
    <div
      className="flex items-end"
      style={{
        width: "100%",
        height: 88,
        borderRadius: 10,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, color-mix(in oklab, ${tintColor} 16%, transparent), color-mix(in oklab, ${tintColor} 4%, transparent))`,
        border: "1px solid var(--ad-border)",
        padding: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(45deg, transparent 0 6px, color-mix(in oklab, ${tintColor} 3%, transparent) 6px 7px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: tintColor,
          background: `color-mix(in oklab, ${tintColor} 13%, transparent)`,
          padding: "3px 6px",
          borderRadius: 4,
        }}
      >
        {ext}
      </div>
      <div style={{ color: tintColor, opacity: 0.9 }}>
        <Icon name={cat.icon as IconName} size={22} stroke={1.6} />
      </div>
    </div>
  );
}
