// DocumentDetailModal.tsx — appears when a document card or row is clicked.
// Shows thumbnail, metadata, and action buttons (open, download, export).
// Visual-only for V2; V3 will fetch real extracted data.

import type { CSSProperties } from "react";
import type { RecentDoc } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { findCategory } from "@/lib/mock-data";
import { numStyle } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";

interface DocumentDetailModalProps {
  doc: RecentDoc | null;
  onClose: () => void;
}

export function DocumentDetailModal({ doc, onClose }: DocumentDetailModalProps) {
  const { t } = useLang();
  if (!doc) return null;
  const cat = findCategory(doc.catKey);
  if (!cat) return null;
  const tintColor = ACCENT_VARS[cat.tint];

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Geist', system-ui, sans-serif",
    color: "var(--ad-text)",
  };

  return (
    <div style={overlayStyle}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />
      <Panel
        style={{
          position: "relative",
          width: 560,
          padding: 28,
          zIndex: 1,
          animation: "fadeUp 320ms cubic-bezier(.2,.7,.3,1)",
        }}
      >
        {/* Close */}
        <div
          onClick={onClose}
          className="flex items-center justify-center"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: 8,
            color: "var(--ad-text-dim)",
            background: "var(--ad-chip)",
            border: "1px solid var(--ad-border)",
            cursor: "pointer",
          }}
        >
          <Icon name="x" size={14} />
        </div>

        {/* Big thumbnail */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="flex items-end"
            style={{
              width: "100%",
              height: 220,
              borderRadius: 14,
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, color-mix(in oklab, ${tintColor} 24%, transparent), color-mix(in oklab, ${tintColor} 6%, transparent))`,
              border: "1px solid var(--ad-border)",
              padding: 18,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(45deg, transparent 0 8px, color-mix(in oklab, ${tintColor} 4%, transparent) 8px 9px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tintColor,
                background: `color-mix(in oklab, ${tintColor} 15%, transparent)`,
                padding: "4px 9px",
                borderRadius: 5,
              }}
            >
              {doc.ext}
            </div>
            <div style={{ color: tintColor, opacity: 0.9 }}>
              <Icon name={cat.icon as never} size={48} stroke={1.4} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.4,
            color: "var(--ad-text)",
            marginBottom: 6,
            wordBreak: "break-word",
          }}
        >
          {doc.name}
        </div>

        {/* Meta row */}
        <div className="flex items-center" style={{ gap: 10, marginBottom: 18 }}>
          <Chip tint={cat.tint} icon={cat.icon as never}>
            {t(cat.key)}
          </Chip>
          <span style={{ fontSize: 12, color: "var(--ad-text-faint)", ...numStyle }}>
            {doc.size}
          </span>
          <span style={{ fontSize: 12, color: "var(--ad-text-faint)", ...numStyle }}>
            · {t(doc.ageKey)}
          </span>
        </div>

        {/* Placeholder for extracted data (V3) */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "var(--ad-chip)",
            border: "1px solid var(--ad-border)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ad-text-faint)",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Extracted data
          </div>
          <div style={{ fontSize: 13, color: "var(--ad-text-dim)" }}>
            Vendor, amount, date and line items will appear here once AI extraction
            is enabled.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center"
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-chip)",
              border: "1px solid var(--ad-border)",
              color: "var(--ad-text)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="flex items-center"
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-chip)",
              border: "1px solid var(--ad-border)",
              color: "var(--ad-text)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Icon name="sheet" size={13} />
            Export to Sheets
          </button>
          <button
            type="button"
            className="flex items-center"
            style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 9,
              gap: 7,
              background: "var(--ad-accent-mint)",
              color: "#09090b",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 0 20px color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)",
            }}
          >
            Open
          </button>
        </div>
      </Panel>
    </div>
  );
}
