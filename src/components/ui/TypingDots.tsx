// TypingDots.tsx — three pulsing dots, used in the AI panel's typing indicator.
// 1:1 from the original midfi.jsx TypingDots.

export function TypingDots() {
  return (
    <div className="inline-flex items-center" style={{ gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "var(--ad-accent-mint)",
            animation: `dotPulse 1.2s ${i * 0.15}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
