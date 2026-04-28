// AIFull.tsx — full-screen view of the AI assistant.
// 1:1 from the original midfi.jsx AIFull.

import { AIPanel } from "@/components/AIPanel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";

export function AIFull() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 1440,
        height: 900,
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
      <div style={{ position: "relative", zIndex: 2, width: 720, height: 780 }}>
        <AIPanel width={720} />
      </div>
    </div>
  );
}
