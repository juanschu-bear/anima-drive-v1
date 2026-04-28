// Categories.tsx — three visual treatments of the same 16 categories.
// Each card/row/cloud-item navigates to /categories/:id where id is the
// category key without the "cat_" prefix (e.g. "expenses").

import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { CategoryTreatment } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { CATS } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

interface CategoriesProps {
  treatment: CategoryTreatment;
}

function categoryPath(key: string): string {
  return `/categories/${key.replace(/^cat_/, "")}`;
}

export function Categories({ treatment }: CategoriesProps) {
  if (treatment === "list") return <CatList />;
  if (treatment === "cloud") return <CatCloud />;
  return <CatGrid />;
}

function CatGrid() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {CATS.map((c, i) => {
        const tintColor = ACCENT_VARS[c.tint];
        const cardStyle: CSSProperties = {
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--ad-border)",
          background: "var(--ad-card-bg)",
          transition: "transform 200ms cubic-bezier(.2,.7,.3,1), border-color 200ms, background 200ms",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          animation: `fadeUp 520ms ${60 + i * 28}ms cubic-bezier(.2,.7,.3,1) backwards`,
        };
        return (
          <div
            key={c.key}
            style={cardStyle}
            onClick={() => navigate(categoryPath(c.key))}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = tintColor;
              e.currentTarget.style.background = `color-mix(in oklab, ${tintColor} 6%, transparent)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.borderColor = "var(--ad-border)";
              e.currentTarget.style.background = "var(--ad-card-bg)";
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `color-mix(in oklab, ${tintColor} 12%, transparent)`,
                color: tintColor,
                marginBottom: 10,
              }}
            >
              <Icon name={c.icon as IconName} size={15} stroke={1.8} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ad-text)", marginBottom: 2 }}>
              {t(c.key)}
            </div>
            <div style={{ fontSize: 11, color: "var(--ad-text-faint)", ...numStyle }}>
              {c.count} {t("lbl_files")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatList() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
      {CATS.map((c, i) => {
        const tintColor = ACCENT_VARS[c.tint];
        return (
          <div
            key={c.key}
            className="flex items-center"
            onClick={() => navigate(categoryPath(c.key))}
            style={{
              gap: 12,
              padding: "10px 4px",
              borderBottom: "1px solid var(--ad-hairline)",
              cursor: "pointer",
              animation: `fadeUp 420ms ${60 + i * 18}ms cubic-bezier(.2,.7,.3,1) backwards`,
            }}
          >
            <div style={{ color: tintColor, width: 18 }}>
              <Icon name={c.icon as IconName} size={14} stroke={1.8} />
            </div>
            <div style={{ flex: 1, fontSize: 13, color: "var(--ad-text)" }}>{t(c.key)}</div>
            <div style={{ fontSize: 12, color: "var(--ad-text-faint)", ...numStyle }}>{c.count}</div>
            <div
              style={{
                width: 60,
                height: 4,
                borderRadius: 2,
                background: "var(--ad-hairline)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, c.count * 8)}%`,
                  background: tintColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatCloud() {
  const { t } = useLang();
  const navigate = useNavigate();
  const max = Math.max(...CATS.map((c) => c.count));
  return (
    <div className="flex flex-wrap items-baseline" style={{ gap: "10px 14px", padding: "4px 2px" }}>
      {CATS.map((c, i) => {
        const scale = 0.55 + (c.count / max) * 0.8;
        const tintColor = ACCENT_VARS[c.tint];
        return (
          <div
            key={c.key}
            className="inline-flex items-center"
            onClick={() => navigate(categoryPath(c.key))}
            style={{
              gap: 6,
              fontSize: Math.round(16 * scale) + 6,
              fontWeight: scale > 0.8 ? 700 : 500,
              letterSpacing: -0.3,
              color: scale > 0.8 ? tintColor : "var(--ad-text)",
              opacity: scale > 0.6 ? 1 : 0.7,
              cursor: "pointer",
              animation: `fadeUp 420ms ${60 + i * 25}ms cubic-bezier(.2,.7,.3,1) backwards`,
            }}
          >
            <span>{t(c.key)}</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--ad-text-faint)",
                fontWeight: 400,
                ...numStyle,
              }}
            >
              {c.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
