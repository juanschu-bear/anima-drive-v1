// CommandPalette.tsx — ⌘K search across documents and categories.
// V2: client-side filter over RECENT + CATS.
// V3: hooks into Supabase full-text search.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { CATS, RECENT, findCategory } from "@/lib/mock-data";
import { useDocumentDetail } from "@/lib/document-detail";
import { Icon } from "@/components/ui/Icon";
import { numStyle } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: "document" | "category";
  /** Stable key for React rendering. */
  key: string;
  label: string;
  sublabel?: string;
  icon: string;
  tint: string;
  onActivate: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { openDoc } = useDocumentDetail();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      // Focus the input shortly after the modal mounts.
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Match documents by name (case-insensitive substring).
  for (const doc of RECENT) {
    if (q && !doc.name.toLowerCase().includes(q)) continue;
    const cat = findCategory(doc.catKey);
    if (!cat) continue;
    results.push({
      type: "document",
      key: `doc:${doc.name}`,
      label: doc.name,
      sublabel: t(cat.key),
      icon: cat.icon,
      tint: cat.tint,
      onActivate: () => {
        openDoc(doc);
        onClose();
      },
    });
  }

  // Match categories by translated name.
  for (const cat of CATS) {
    const name = t(cat.key);
    if (q && !name.toLowerCase().includes(q)) continue;
    results.push({
      type: "category",
      key: `cat:${cat.key}`,
      label: name,
      sublabel: `${cat.count} ${t("lbl_files")}`,
      icon: cat.icon,
      tint: cat.tint,
      onActivate: () => {
        const id = cat.key.replace(/^cat_/, "");
        navigate(`/categories/${id}`);
        onClose();
      },
    });
  }

  // Bound the active index whenever results change.
  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(Math.max(0, results.length - 1));
  }, [results.length, activeIdx]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) r.onActivate();
    }
  };

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 70,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 120,
    fontFamily: "'Geist', system-ui, sans-serif",
    color: "var(--ad-text)",
  };

  return (
    <div style={overlayStyle}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: 600,
          maxHeight: "60vh",
          background: "var(--ad-panel)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid var(--ad-border)",
          boxShadow: "var(--ad-panel-shadow)",
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "fadeUp 240ms cubic-bezier(.2,.7,.3,1)",
          zIndex: 1,
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center"
          style={{
            gap: 12,
            padding: "16px 18px",
            borderBottom: "1px solid var(--ad-hairline)",
          }}
        >
          <Icon name="search" size={16} style={{ color: "var(--ad-text-dim)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("br_search")}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--ad-text)",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--ad-border-strong)",
              color: "var(--ad-text-dim)",
              fontFamily: "'Geist Mono', monospace",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results */}
        <div
          style={{
            overflowY: "auto",
            padding: "8px 0",
            flex: 1,
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: "20px 18px",
                fontSize: 13,
                color: "var(--ad-text-faint)",
                textAlign: "center",
              }}
            >
              No results.
            </div>
          ) : (
            results.map((r, i) => {
              const tintColor = ACCENT_VARS[r.tint as never];
              const isActive = i === activeIdx;
              return (
                <div
                  key={r.key}
                  onClick={() => r.onActivate()}
                  onMouseEnter={() => setActiveIdx(i)}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: "10px 18px",
                    background: isActive ? "var(--ad-chip)" : "transparent",
                    cursor: "pointer",
                    transition: "background 100ms",
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `color-mix(in oklab, ${tintColor} 12%, transparent)`,
                      color: tintColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={r.icon as never} size={14} stroke={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ad-text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.label}
                    </div>
                    {r.sublabel && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ad-text-faint)",
                          marginTop: 1,
                          ...numStyle,
                        }}
                      >
                        {r.sublabel}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--ad-text-faint)",
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    {r.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--ad-hairline)",
            fontSize: 11,
            color: "var(--ad-text-faint)",
          }}
        >
          <span>↑↓ to navigate · ↵ to open</span>
          <span style={{ ...numStyle }}>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
