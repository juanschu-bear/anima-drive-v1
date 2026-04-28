// AIMsg.tsx — single chat-bubble in the AI panel. Slides in from its side.
// 1:1 from the original midfi.jsx AIMsg.

import type { CSSProperties, ReactNode } from "react";
import { useDelayed } from "@/lib/utils";

interface AIMsgProps {
  from: "user" | "ai";
  children: ReactNode;
  delay?: number;
}

export function AIMsg({ from, children, delay = 0 }: AIMsgProps) {
  const on = useDelayed(delay);
  const mine = from === "user";

  const wrapStyle: CSSProperties = {
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    opacity: on ? 1 : 0,
    transform: on ? "translateX(0)" : `translateX(${mine ? 12 : -12}px)`,
    transition: "opacity 420ms cubic-bezier(.2,.7,.3,1), transform 420ms cubic-bezier(.2,.7,.3,1)",
  };

  const bubbleStyle: CSSProperties = {
    maxWidth: "86%",
    padding: "10px 14px",
    borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    background: mine
      ? "color-mix(in oklab, var(--ad-accent-mint) 12%, transparent)"
      : "var(--ad-chip)",
    border: `1px solid ${mine ? "color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)" : "var(--ad-border)"}`,
    color: "var(--ad-text)",
    fontSize: 13,
    lineHeight: 1.5,
  };

  return (
    <div style={wrapStyle}>
      <div style={bubbleStyle}>{children}</div>
    </div>
  );
}
