// Onboarding.tsx — first-run / empty welcome screen.
// 1:1 from the original midfi.jsx Onboarding.

import { useLang } from "@/lib/i18n";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon } from "@/components/ui/Icon";

export function Onboarding() {
  const { t } = useLang();
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 1440,
        height: 900,
        background: "var(--ad-bg)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <Orbs />
      <Grain />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 680,
        }}
      >
        {/* Spinning logo */}
        <div
          style={{
            width: 84,
            height: 84,
            margin: "0 auto 34px",
            borderRadius: 22,
            position: "relative",
            background:
              "conic-gradient(from 200deg, var(--ad-accent-mint), var(--ad-accent-blue), var(--ad-accent-amber), var(--ad-accent-coral), var(--ad-accent-mint))",
            boxShadow:
              "0 0 80px color-mix(in oklab, var(--ad-accent-mint) 38%, transparent), 0 0 40px color-mix(in oklab, var(--ad-accent-blue) 25%, transparent)",
            animation: "logoSpin 14s linear infinite",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              position: "absolute",
              inset: 6,
              background: "var(--ad-panel-solid)",
              borderRadius: 16,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 40,
              fontWeight: 800,
              color: "var(--ad-text)",
            }}
          >
            a
          </div>
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1.6,
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          {t("ob_title")}
        </div>
        <div
          style={{
            fontSize: 17,
            color: "var(--ad-text-dim)",
            lineHeight: 1.5,
            maxWidth: 540,
            margin: "0 auto 36px",
            textWrap: "pretty",
          }}
        >
          {t("ob_sub")}
        </div>

        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: 460,
            margin: "0 auto 28px",
            height: 180,
            borderRadius: 18,
            border: "1.5px dashed var(--ad-accent-mint)",
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--ad-accent-mint) 7%, transparent), transparent 70%)",
            gap: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--ad-accent-mint) 8%, transparent), transparent 70%)",
              animation: "zonePulse 2.6s ease-in-out infinite",
            }}
          />
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "color-mix(in oklab, var(--ad-accent-mint) 13%, transparent)",
              color: "var(--ad-accent-mint)",
              boxShadow:
                "0 0 32px color-mix(in oklab, var(--ad-accent-mint) 31%, transparent)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Icon name="upload" size={20} stroke={1.8} />
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              position: "relative",
              zIndex: 1,
            }}
          >
            {t("ob_cta")}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ad-text-dim)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {t("ob_or")}{" "}
            <span style={{ color: "var(--ad-accent-blue)", fontWeight: 500 }}>
              {t("ob_connect")}
            </span>
          </div>
        </div>

        {/* File-format pills */}
        <div
          className="flex justify-center"
          style={{ gap: 6, color: "var(--ad-text-faint)", fontSize: 11 }}
        >
          {["PDF", "JPG", "PNG", "CSV", "XLSX", "EML"].map((x) => (
            <span
              key={x}
              style={{
                padding: "3px 8px",
                borderRadius: 5,
                background: "var(--ad-chip)",
                border: "1px solid var(--ad-border)",
                fontWeight: 600,
                fontFamily: "'Geist Mono', monospace",
              }}
            >
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
