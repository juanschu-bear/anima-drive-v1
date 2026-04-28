// UploadModal.tsx — page route that previews the upload modal in isolation.
// Mirrors the original midfi.jsx UploadModal screen (modal over orbs+grain).
// The modal itself is the reusable UploadModalOverlay component.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { UploadModalOverlay } from "@/components/UploadModalOverlay";

export function UploadModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    navigate("/");
  };

  return (
    <div
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
      <Orbs seed={2} />
      <Grain />
      <UploadModalOverlay open={open} onClose={close} />
    </div>
  );
}
