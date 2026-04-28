// Login.tsx — email/password sign-in and sign-up.
// On success the AuthProvider session updates and the App routes to the dashboard.

import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Panel } from "@/components/ui/Panel";
import { Orbs } from "@/components/ui/Orbs";
import { Grain } from "@/components/ui/Grain";
import { Icon } from "@/components/ui/Icon";

type Mode = "signin" | "signup";

export function Login() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: authError } = await fn(email, password);
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup") {
      setInfo("Account created. Check your inbox to confirm your email if confirmation is enabled.");
    }
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    background: "var(--ad-card-bg-input)",
    border: "1px solid var(--ad-border)",
    color: "var(--ad-text)",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    marginBottom: 10,
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <Orbs />
      <Grain />

      <Panel style={{ position: "relative", zIndex: 2, width: 420, padding: 36 }}>
        {/* Spinning logo */}
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 20px",
            borderRadius: 14,
            position: "relative",
            background:
              "conic-gradient(from 200deg, var(--ad-accent-mint), var(--ad-accent-blue), var(--ad-accent-amber), var(--ad-accent-coral), var(--ad-accent-mint))",
            boxShadow: "0 0 36px color-mix(in oklab, var(--ad-accent-mint) 31%, transparent)",
            animation: "logoSpin 14s linear infinite",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              position: "absolute",
              inset: 4,
              background: "var(--ad-panel-solid)",
              borderRadius: 10,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--ad-text)",
            }}
          >
            a
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, textAlign: "center" }}>
          {mode === "signin" ? "Welcome back" : "Create your Anima-Drive"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ad-text-dim)",
            textAlign: "center",
            marginTop: 4,
            marginBottom: 24,
          }}
        >
          {mode === "signin"
            ? "Sign in to your document brain."
            : "Drop your first document and we take it from there."}
        </div>

        {!configured && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "color-mix(in oklab, var(--ad-accent-coral) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--ad-accent-coral) 30%, transparent)",
              color: "var(--ad-text)",
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            Supabase env vars are missing. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to enable login.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            style={inputStyle}
          />

          {error && (
            <div style={{ color: "var(--ad-accent-coral)", fontSize: 12, marginBottom: 10 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ color: "var(--ad-accent-mint)", fontSize: 12, marginBottom: 10 }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !configured}
            className="flex items-center justify-center"
            style={{
              width: "100%",
              height: 42,
              borderRadius: 10,
              border: "none",
              background: "var(--ad-accent-mint)",
              color: "#09090b",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting || !configured ? "not-allowed" : "pointer",
              opacity: submitting || !configured ? 0.6 : 1,
              gap: 8,
              boxShadow: "0 0 24px color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)",
              marginTop: 6,
            }}
          >
            {submitting ? (
              "..."
            ) : mode === "signin" ? (
              <>
                <Icon name="arrow-right" size={14} stroke={2} /> Sign in
              </>
            ) : (
              <>
                <Icon name="sparkle" size={14} stroke={2} /> Create account
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--ad-text-dim)", marginTop: 18 }}>
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <span
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            style={{ color: "var(--ad-accent-mint)", cursor: "pointer", fontWeight: 500 }}
          >
            {mode === "signin" ? "Create an account" : "Sign in instead"}
          </span>
        </div>
      </Panel>
    </div>
  );
}
