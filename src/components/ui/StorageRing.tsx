// StorageRing.tsx — animated circular progress ring used in the storage KPI.
// 1:1 from the original midfi.jsx StorageRing.

import { useEffect, useState } from "react";

interface StorageRingProps {
  value?: number;
  size?: number;
}

export function StorageRing({ value = 0.046, size = 64 }: StorageRingProps) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setP(value), 120);
    return () => clearTimeout(id);
  }, [value]);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ad-border)" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--ad-accent-blue)"
        strokeWidth={4}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)",
          filter: "drop-shadow(0 0 6px var(--ad-accent-blue))",
        }}
      />
    </svg>
  );
}
