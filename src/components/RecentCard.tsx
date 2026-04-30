// RecentCard.tsx — recent uploads card. Click opens the document detail modal.

import type { CSSProperties } from "react";
import type { RecentDoc } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { findCategory } from "@/lib/mock-data";
import { useDelayed, numStyle } from "@/lib/utils";
import { useDocumentDetail } from "@/lib/document-detail";
import { Chip } from "@/components/ui/Chip";
import { ThumbSwatch } from "@/components/ui/ThumbSwatch";

interface RecentCardProps {
  doc: RecentDoc;
  delay?: number;
  layout?: "compact" | "row";
}

export function RecentCard({ doc, delay = 0, layout = "compact" }: RecentCardProps) {
  const { t } = useLang();
  const { openDoc } = useDocumentDetail();
  const cat = findCategory(doc.catKey);
  const on = useDelayed(delay);
  if (!cat) return null;
  const tintColor = ACCENT_VARS[cat.tint];
  const isRow = layout === "row";

  const cardStyle: CSSProperties = {
    width: isRow ? "100%" : "clamp(180px, 22vw, 220px)",
    flexShrink: isRow ? 1 : 0,
    padding: 12,
    borderRadius: 12,
    border: "1px solid var(--ad-border)",
    background: "var(--ad-card-bg-recent)",
    transition: "transform 220ms cubic-bezier(.2,.7,.3,1), box-shadow 220ms",
    cursor: "pointer",
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(8px)",
  };

  return (
    <div
      style={cardStyle}
      onClick={() => openDoc(doc)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 10px 30px color-mix(in oklab, ${tintColor} 12%, transparent)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="flex" style={{ gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: isRow ? 130 : "100%", flexShrink: 0 }}>
          <ThumbSwatch cat={cat} ext={doc.ext} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ad-text)",
              display: "-webkit-box",
              WebkitLineClamp: isRow ? 3 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.25,
              minHeight: isRow ? 44 : 30,
            }}
          >
            {doc.name}
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 8, gap: 8 }}>
            <Chip tint={cat.tint} icon={cat.icon as never}>
              {t(cat.key)}
            </Chip>
            <div style={{ fontSize: 10, color: "var(--ad-text-faint)", ...numStyle }}>
              {t(doc.ageKey)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
