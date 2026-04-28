// AIPanel.tsx — the right-rail / focused AI assistant.
// In V2 the message thread starts with the original scripted demo,
// then the user can type or click suggestion chips. send() POSTs to /api/ask
// with the bearer token; falls back to the V2 stub answer when not signed in.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { RECENT } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";
import { TypingDots } from "@/components/ui/TypingDots";
import { AIMsg } from "./AIMsg";

interface AIPanelProps {
  width?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  body: ReactNode;
  delay?: number;
}

const SUGGESTION_KEYS = ["sug_receipts", "sug_software", "sug_rental", "sug_uncat"];

export function AIPanel({ width = 360 }: AIPanelProps) {
  const { t } = useLang();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial scripted demo — only shown in demo mode (no auth / no Supabase).
  // For real users we start with an empty thread + greeting.
  useEffect(() => {
    if (configured && user) {
      // Real user: empty thread, show greeting bubble only.
      setMessages([
        {
          id: "greet",
          role: "ai",
          delay: 80,
          body: (
            <div>
              Hi — drop a question about any of your documents. Try{" "}
              <i>"how much did I spend on software last month?"</i> or{" "}
              <i>"find my rental contract"</i>.
            </div>
          ),
        },
      ]);
      setIsThinking(false);
      return;
    }

    const initial: ChatMessage[] = [
      { id: "u1", role: "user", body: t("ai_msg_user1"), delay: 160 },
      {
        id: "a1",
        role: "ai",
        delay: 440,
        body: (
          <>
            <div>{t("ai_msg_ai1_p1")}</div>
            <div className="flex flex-wrap" style={{ marginTop: 8, gap: 6 }}>
              {RECENT.slice(0, 3).map((d) => (
                <div
                  key={d.name}
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--ad-card-bg-input)",
                    border: "1px solid var(--ad-border)",
                    color: "var(--ad-text-dim)",
                  }}
                >
                  {d.name}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, color: "var(--ad-accent-mint)", fontWeight: 500 }}>
              {t("ai_msg_ai1_p2")}
            </div>
          </>
        ),
      },
      { id: "u2", role: "user", delay: 820, body: t("sug_rental").replace("?", "") },
      {
        id: "a2",
        role: "ai",
        delay: 1080,
        body: (
          <>
            <div style={{ fontSize: 12, color: "var(--ad-text-dim)", marginBottom: 2 }}>
              Mietvertrag_2026.pdf
            </div>
            <div>
              Expires <b>31 Dec 2026</b>, 12-month notice.
            </div>
          </>
        ),
      },
    ];
    setMessages(initial);
    setIsThinking(false);
  }, [t, configured, user]);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isThinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      body: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Demo mode (no auth or no Supabase): canned response.
    if (!configured || !user) {
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `a${Date.now()}`,
          role: "ai",
          body: (
            <>
              <div style={{ color: "var(--ad-text-dim)", fontSize: 12 }}>
                Sign in to get answers grounded in your real documents.
              </div>
              <div style={{ marginTop: 6 }}>
                You asked: <i>{trimmed}</i>
              </div>
            </>
          ),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 800);
      return;
    }

    // Real call to /api/ask.
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`ask failed: ${res.status} ${text}`);
      }
      const data: {
        answer: string;
        document_refs?: string[];
        conversationId: string | null;
      } = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);

      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`,
        role: "ai",
        body: <div style={{ whiteSpace: "pre-wrap" }}>{data.answer}</div>,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const aiMsg: ChatMessage = {
        id: `e${Date.now()}`,
        role: "ai",
        body: (
          <div style={{ color: "var(--ad-accent-coral)", fontSize: 12 }}>
            {err instanceof Error ? err.message : "Failed to get an answer."}
          </div>
        ),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const panelStyle: CSSProperties = {
    width,
    display: "flex",
    flexDirection: "column",
    padding: 18,
    gap: 14,
    height: "100%",
    overflow: "hidden",
  };

  const inputStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 10px 0 14px",
    height: 44,
    borderRadius: 12,
    background: "var(--ad-card-bg-input)",
    border: `1px solid ${focused ? "var(--ad-accent-mint)" : "var(--ad-border)"}`,
    boxShadow: focused
      ? "0 0 0 3px color-mix(in oklab, var(--ad-accent-mint) 13%, transparent), 0 0 20px color-mix(in oklab, var(--ad-accent-mint) 19%, transparent)"
      : "none",
    transition: "border-color 180ms, box-shadow 180ms",
  };

  return (
    <Panel style={panelStyle}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--ad-accent-mint), var(--ad-accent-blue))",
              color: "#0b0b0d",
              boxShadow: "0 0 16px color-mix(in oklab, var(--ad-accent-mint) 33%, transparent)",
            }}
          >
            <Icon name="sparkle" size={15} stroke={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ad-text)" }}>{t("ai_title")}</div>
            <div className="flex items-center" style={{ fontSize: 10.5, color: "var(--ad-text-dim)", gap: 5 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--ad-accent-mint)",
                  boxShadow: "0 0 6px var(--ad-accent-mint)",
                }}
              />
              {t("ai_status")}
            </div>
          </div>
        </div>
        <Icon name="more" size={16} style={{ color: "var(--ad-text-dim)" }} />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-col"
        style={{ flex: 1, gap: 10, overflowY: "auto", overflowX: "hidden", minHeight: 0, paddingRight: 4 }}
      >
        {messages.map((m) => (
          <AIMsg key={m.id} from={m.role} delay={m.delay ?? 0}>
            {m.body}
          </AIMsg>
        ))}
        {isThinking && (
          <div
            className="flex items-center"
            style={{ paddingLeft: 4, color: "var(--ad-text-dim)", fontSize: 11, gap: 6 }}
          >
            <TypingDots />
            {t("ai_typing")}
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        {SUGGESTION_KEYS.map((k, i) => (
          <div
            key={k}
            onClick={() => send(t(k))}
            style={{
              fontSize: 11,
              padding: "5px 9px",
              borderRadius: 999,
              border: "1px solid var(--ad-border)",
              background: "var(--ad-chip)",
              color: "var(--ad-text-dim)",
              animation: `chipPulse 3s ${i * 0.3}s ease-in-out infinite`,
              cursor: "pointer",
              transition: "color 120ms, border-color 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ad-text)";
              e.currentTarget.style.borderColor = "var(--ad-border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ad-text-dim)";
              e.currentTarget.style.borderColor = "var(--ad-border)";
            }}
          >
            {t(k)}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div style={inputStyle}>
        <Icon name="sparkle" size={14} style={{ color: "var(--ad-accent-mint)" }} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t("ai_placeholder")}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "var(--ad-text)",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={input.trim().length === 0}
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "none",
            background: "var(--ad-accent-mint)",
            color: "#09090b",
            cursor: input.trim() ? "pointer" : "not-allowed",
            opacity: input.trim() ? 1 : 0.5,
          }}
        >
          <Icon name="send" size={13} stroke={2} />
        </button>
      </div>
    </Panel>
  );
}
