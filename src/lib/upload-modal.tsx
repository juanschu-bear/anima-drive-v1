// upload-modal.tsx — global trigger for the upload modal so any screen can open it.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { UploadModalOverlay } from "@/components/UploadModalOverlay";

interface UploadModalCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<UploadModalCtx | null>(null);

export function UploadModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <UploadModalOverlay open={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}

export function useUploadModal(): UploadModalCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUploadModal must be used within UploadModalProvider");
  return v;
}
