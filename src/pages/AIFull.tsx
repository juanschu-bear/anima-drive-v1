// AIFull.tsx — full-screen view of the AI assistant with a back button.

import { useNavigate } from "react-router-dom";
import { AIPanel } from "@/components/AIPanel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon } from "@/components/ui/Icon";
import { useLang } from "@/lib/i18n";

export function AIFull() {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        background: "var(--ad-bg)",
        position: "relative",
        overflow: "hidden",
        padding: 40,
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <Orbs seed={1} />
      <Grain />

      <div
        onClick={() => navigate("/")}
        className="flex items-center"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 5,
          gap: 6,
          fontSize: 12,
          color: "var(--ad-text-dim)",
          cursor: "pointer",
          padding: "8px 14px",
          borderRadius: 9,
          background: "color-mix(in oklab, var(--ad-bg) 60%, transparent)",
          border: "1px solid var(--ad-border)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Icon name="arrow-left" size={13} stroke={2} />
        {t("lbl_back")}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(720px, 90vw)",
          height: "min(780px, 88vh)",
        }}
      >
        <AIPanel width={720} />
      </div>
    </div>
  );
}
