// Settings.tsx — user profile + sign out + display preferences.
// Persists display name to Supabase auth user_metadata.

import { useState } from "react";
import type { CSSProperties } from "react";
import type { SidebarState, Lang, ThemeKey } from "@/types";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface SettingsProps {
  sidebarState?: SidebarState;
}

export function Settings({ sidebarState }: SettingsProps) {
  const { t, lang, setLang } = useLang();
  const { themeKey, setThemeKey } = useTheme();
  const { user, signOut } = useAuth();
  const configured = isSupabaseConfigured();
  const isAuth = configured && !!user;

  const initialName =
    (user?.user_metadata as Record<string, unknown> | undefined)?.first_name as string | undefined;
  const [name, setName] = useState<string>(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (!isAuth) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({
      data: { first_name: name.trim() || null },
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((v) => (Date.now() - (v ?? 0) > 1900 ? null : v)), 2000);
  }

  async function onSignOut() {
    await signOut();
    // Auth provider will navigate us to /login automatically once user becomes null.
  }

  const sectionTitle: CSSProperties = {
    fontSize: 11,
    color: "var(--ad-text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: 600,
    marginBottom: 12,
  };

  const labelStyle: CSSProperties = {
    fontSize: 11,
    color: "var(--ad-text-dim)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: 500,
    marginBottom: 6,
    display: "block",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    height: 38,
    padding: "0 12px",
    background: "var(--ad-chip)",
    border: "1px solid var(--ad-border)",
    borderRadius: 9,
    color: "var(--ad-text)",
    fontSize: 13,
    fontFamily: "'Geist', system-ui, sans-serif",
    outline: "none",
  };

  return (
    <PageShell
      title={t("page_settings_title")}
      active="settings"
      sidebarState={sidebarState}
    >
      <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
        {/* Profile */}
        <Panel style={{ padding: 22 }}>
          <div style={sectionTitle}>{t("page_settings_profile")}</div>

          <label style={labelStyle}>{t("page_settings_name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isAuth ? "Your first name" : "—"}
            disabled={!isAuth}
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 14 }}>{t("page_settings_email")}</label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            style={{ ...inputStyle, color: "var(--ad-text-dim)" }}
          />

          {error && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>{error}</div>
          )}

          <div className="flex items-center" style={{ gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={onSave}
              disabled={!isAuth || saving}
              className="flex items-center"
              style={{
                height: 36,
                padding: "0 18px",
                borderRadius: 9,
                gap: 7,
                background: "var(--ad-accent-mint)",
                color: "#09090b",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: !isAuth || saving ? "not-allowed" : "pointer",
                opacity: !isAuth || saving ? 0.6 : 1,
              }}
            >
              {saving ? "…" : t("page_settings_save")}
            </button>
            {savedAt && (
              <span style={{ fontSize: 12, color: "var(--ad-accent-mint)" }}>
                ✓ {t("page_settings_saved")}
              </span>
            )}
          </div>
        </Panel>

        {/* Preferences */}
        <Panel style={{ padding: 22 }}>
          <div style={sectionTitle}>Preferences</div>

          <label style={labelStyle}>{t("page_settings_lang")}</label>
          <div className="flex" style={{ gap: 8 }}>
            {(["en", "de", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 7,
                  background: lang === l ? "var(--ad-accent-mint)" : "var(--ad-chip)",
                  border: "1px solid",
                  borderColor: lang === l ? "var(--ad-accent-mint)" : "var(--ad-border)",
                  color: lang === l ? "#09090b" : "var(--ad-text)",
                  fontSize: 12,
                  fontWeight: lang === l ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <label style={{ ...labelStyle, marginTop: 18 }}>{t("page_settings_theme")}</label>
          <div className="flex" style={{ gap: 8 }}>
            {(["dark", "light"] as ThemeKey[]).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setThemeKey(th)}
                className="flex items-center"
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 7,
                  gap: 7,
                  background: themeKey === th ? "var(--ad-text)" : "var(--ad-chip)",
                  border: "1px solid",
                  borderColor: themeKey === th ? "var(--ad-text)" : "var(--ad-border)",
                  color: themeKey === th ? "var(--ad-bg)" : "var(--ad-text)",
                  fontSize: 12,
                  fontWeight: themeKey === th ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                <Icon name={th === "dark" ? "moon" : "sun"} size={12} />
                {th}
              </button>
            ))}
          </div>
        </Panel>

        {/* Account / Sign out */}
        {isAuth && (
          <Panel style={{ padding: 22 }}>
            <div style={sectionTitle}>{t("page_settings_account")}</div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center"
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 9,
                gap: 7,
                background: "transparent",
                border: "1px solid color-mix(in oklab, #ef4444 40%, var(--ad-border))",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("page_settings_signout")}
            </button>
          </Panel>
        )}
      </div>
    </PageShell>
  );
}
