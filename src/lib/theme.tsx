// theme.ts — theme context + helpers.
// The theme value lives on <html data-theme="..."> so CSS variables swap natively.
// React consumers only need to read/write the key; all colors flow via CSS vars.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AccentTint, ThemeKey } from "@/types";

interface ThemeCtx {
  themeKey: ThemeKey;
  setThemeKey: (k: ThemeKey) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeKey);
  }, [themeKey]);

  const toggleTheme = useCallback(() => {
    setThemeKey((k) => (k === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ themeKey, setThemeKey, toggleTheme }), [themeKey, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}

/* ─────────────────────────────────────────────────────────────────
   Accent helpers.

   Everywhere in the original code, accents are referenced like
   `theme.accent.mint`, `theme.accent.coral`, etc. We expose the same
   shape but each value is a CSS var() reference. That means the
   string changes value automatically when data-theme flips, and we
   can use it inline (`color: accent("mint")`) or in template strings
   for dynamic gradients/shadows where Tailwind utilities can't reach.
   ───────────────────────────────────────────────────────────────── */

export function accent(tint: AccentTint): string {
  return `var(--ad-accent-${tint})`;
}

export const ACCENT_VARS: Record<AccentTint, string> = {
  mint: "var(--ad-accent-mint)",
  coral: "var(--ad-accent-coral)",
  amber: "var(--ad-accent-amber)",
  blue: "var(--ad-accent-blue)",
};
