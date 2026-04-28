// command-palette.tsx — global ⌘K (or Ctrl+K) shortcut + trigger.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/CommandPalette";

interface CommandPaletteCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<CommandPaletteCtx | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global keyboard shortcut: ⌘K on Mac, Ctrl+K elsewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <CommandPalette open={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}

export function useCommandPalette(): CommandPaletteCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return v;
}
