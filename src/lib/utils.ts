// utils.ts — small utilities used across screens.
// Ported 1:1 from the original tokens.jsx.

import { useEffect, useState } from "react";

export function greetKey(date: Date = new Date()): "greet_morning" | "greet_afternoon" | "greet_evening" {
  const h = date.getHours();
  if (h < 12) return "greet_morning";
  if (h < 18) return "greet_afternoon";
  return "greet_evening";
}

/** Counts 0 → target once on mount over `ms` milliseconds with cubic ease-out. */
export function useCountUp(target: number, ms: number = 900, key: number = 0): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    setV(0);
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, key]);
  return v;
}

/** Returns true after `ms` has elapsed since mount; used to stagger entry animations. */
export function useDelayed(ms: number): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setOn(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return on;
}

/** Inline style for tabular numerals — used for any digit-heavy text. */
export const numStyle: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
