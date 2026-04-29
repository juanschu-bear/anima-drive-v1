// Settings.tsx — user profile + password + custom categories + sign out.

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { SidebarState, Lang, ThemeKey } from "@/types";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme, ACCENT_VARS } from "@/lib/theme";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AdUserCategoryRow } from "@/lib/database.types";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface SettingsProps {
  sidebarState?: SidebarState;
}

const TINT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "mint", label: "Mint" },
  { key: "blue", label: "Blue" },
  { key: "coral", label: "Coral" },
  { key: "amber", label: "Amber" },
];

const ICON_OPTIONS = ["folder", "file", "shield", "receipt", "chart", "plane", "box", "megaphone", "spark", "key"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function Settings({ sidebarState }: SettingsProps) {
  const { t, lang, setLang } = useLang();
  const { themeKey, setThemeKey } = useTheme();
  const { user, signOut } = useAuth();
  const configured = isSupabaseConfigured();
  const isAuth = configured && !!user;

  // Profile
  const initialName =
    (user?.user_metadata as Record<string, unknown> | undefined)?.first_name as string | undefined;
  const [name, setName] = useState<string>(initialName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Custom categories
  const [customCats, setCustomCats] = useState<AdUserCategoryRow[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatTint, setNewCatTint] = useState("mint");
  const [newCatIcon, setNewCatIcon] = useState("folder");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuth) return;
    void loadCategories();
  }, [isAuth]);

  async function loadCategories() {
    setLoadingCats(true);
    const { data, error } = await supabase
      .from("ad_user_categories")
      .select("*")
      .order("created_at", { ascending: true });
    setLoadingCats(false);
    if (error) {
      setCatError(error.message);
      return;
    }
    setCustomCats((data ?? []) as AdUserCategoryRow[]);
  }

  async function onSaveProfile() {
    if (!isAuth) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    const { error } = await supabase.auth.updateUser({
      data: { first_name: name.trim() || null },
    });
    setSavingProfile(false);
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2200);
  }

  async function onChangePassword() {
    if (!isAuth) return;
    setPwError(null);
    setPwSaved(false);
    if (pwNew.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Passwords don't match.");
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setSavingPw(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    setPwNew("");
    setPwConfirm("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2200);
  }

  async function onAddCategory() {
    if (!isAuth) return;
    setCatError(null);
    const label = newCatLabel.trim();
    if (label.length < 2) {
      setCatError("Category name too short.");
      return;
    }
    const key = `cat_${slugify(label)}`;
    if (!key.startsWith("cat_") || key.length < 5) {
      setCatError("Could not derive a valid key from this name.");
      return;
    }
    setSavingCat(true);
    const { error } = await supabase.from("ad_user_categories").insert({
      user_id: user!.id,
      key,
      label,
      icon: newCatIcon,
      tint: newCatTint,
    });
    setSavingCat(false);
    if (error) {
      setCatError(error.message);
      return;
    }
    setNewCatLabel("");
    setNewCatTint("mint");
    setNewCatIcon("folder");
    await loadCategories();
  }

  async function onDeleteCategory(id: string) {
    if (!confirm("Delete this category? Documents already filed here keep their key but appear under 'Other' in the UI.")) return;
    const { error } = await supabase.from("ad_user_categories").delete().eq("id", id);
    if (error) {
      setCatError(error.message);
      return;
    }
    await loadCategories();
  }

  async function onSignOut() {
    await signOut();
  }

  // Styling helpers
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
  const primaryBtn: CSSProperties = {
    height: 36,
    padding: "0 18px",
    borderRadius: 9,
    gap: 7,
    background: "var(--ad-accent-mint)",
    color: "#09090b",
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <PageShell title={t("page_settings_title")} active="settings" sidebarState={sidebarState}>
      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
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

          {profileError && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>{profileError}</div>
          )}

          <div className="flex items-center" style={{ gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={!isAuth || savingProfile}
              style={{ ...primaryBtn, opacity: !isAuth || savingProfile ? 0.6 : 1 }}
            >
              {savingProfile ? "…" : t("page_settings_save")}
            </button>
            {profileSaved && (
              <span style={{ fontSize: 12, color: "var(--ad-accent-mint)" }}>
                ✓ {t("page_settings_saved")}
              </span>
            )}
          </div>
        </Panel>

        {/* Password */}
        {isAuth && (
          <Panel style={{ padding: 22 }}>
            <div style={sectionTitle}>Password</div>

            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>Confirm password</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              style={inputStyle}
            />

            {pwError && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>{pwError}</div>
            )}

            <div className="flex items-center" style={{ gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onChangePassword}
                disabled={savingPw || pwNew.length === 0}
                style={{ ...primaryBtn, opacity: savingPw || pwNew.length === 0 ? 0.6 : 1 }}
              >
                {savingPw ? "…" : "Change password"}
              </button>
              {pwSaved && (
                <span style={{ fontSize: 12, color: "var(--ad-accent-mint)" }}>
                  ✓ Password updated
                </span>
              )}
            </div>
          </Panel>
        )}

        {/* Custom categories */}
        {isAuth && (
          <Panel style={{ padding: 22 }}>
            <div style={sectionTitle}>Custom categories</div>
            <div style={{ fontSize: 12, color: "var(--ad-text-dim)", marginBottom: 14 }}>
              Add your own categories beyond the 17 built-in ones. They appear in the sidebar
              alongside the others and can be picked by Anima during categorization.
            </div>

            {/* Existing custom categories */}
            {loadingCats ? (
              <div style={{ fontSize: 12, color: "var(--ad-text-dim)" }}>Loading…</div>
            ) : customCats.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--ad-text-faint)", marginBottom: 14 }}>
                No custom categories yet.
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 6, marginBottom: 14 }}>
                {customCats.map((c) => {
                  const tintColor = ACCENT_VARS[c.tint as keyof typeof ACCENT_VARS] ?? "var(--ad-accent-mint)";
                  return (
                    <div
                      key={c.id}
                      className="flex items-center"
                      style={{
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "var(--ad-chip)",
                        border: "1px solid var(--ad-border)",
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: `color-mix(in oklab, ${tintColor} 14%, transparent)`,
                          color: tintColor,
                        }}
                      >
                        <Icon name={c.icon as never} size={13} />
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                      <code
                        style={{
                          fontSize: 10,
                          color: "var(--ad-text-faint)",
                          fontFamily: "'Geist Mono', monospace",
                        }}
                      >
                        {c.key}
                      </code>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        style={{
                          height: 26,
                          padding: "0 10px",
                          borderRadius: 6,
                          background: "transparent",
                          border: "1px solid color-mix(in oklab, #ef4444 40%, var(--ad-border))",
                          color: "#ef4444",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new */}
            <div
              style={{
                padding: 14,
                borderRadius: 9,
                background: "var(--ad-chip)",
                border: "1px solid var(--ad-border)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ad-text-dim)", marginBottom: 10, fontWeight: 500 }}>
                Add new category
              </div>

              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="e.g. My Subscriptions"
                style={{ ...inputStyle, marginBottom: 10 }}
              />

              <div className="flex items-center" style={{ gap: 14, marginBottom: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ad-text-faint)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Tint
                  </div>
                  <div className="flex" style={{ gap: 6 }}>
                    {TINT_OPTIONS.map((tt) => {
                      const tintColor = ACCENT_VARS[tt.key as keyof typeof ACCENT_VARS] ?? "var(--ad-accent-mint)";
                      const active = newCatTint === tt.key;
                      return (
                        <button
                          key={tt.key}
                          type="button"
                          onClick={() => setNewCatTint(tt.key)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: tintColor,
                            border: active ? "2px solid var(--ad-text)" : "2px solid transparent",
                            cursor: "pointer",
                            padding: 0,
                          }}
                          title={tt.label}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ad-text-faint)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Icon
                  </div>
                  <div className="flex" style={{ gap: 4, flexWrap: "wrap" }}>
                    {ICON_OPTIONS.map((ic) => {
                      const active = newCatIcon === ic;
                      return (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNewCatIcon(ic)}
                          className="flex items-center justify-center"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: active ? "var(--ad-accent-mint)" : "transparent",
                            border: active ? "1px solid var(--ad-accent-mint)" : "1px solid var(--ad-border)",
                            color: active ? "#09090b" : "var(--ad-text-dim)",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Icon name={ic as never} size={11} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {catError && (
                <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{catError}</div>
              )}

              <button
                type="button"
                onClick={onAddCategory}
                disabled={savingCat || newCatLabel.trim().length < 2}
                style={{
                  ...primaryBtn,
                  opacity: savingCat || newCatLabel.trim().length < 2 ? 0.6 : 1,
                }}
              >
                {savingCat ? "…" : "Add category"}
              </button>
            </div>
          </Panel>
        )}

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

        {/* Sign out */}
        {isAuth && (
          <Panel style={{ padding: 22 }}>
            <div style={sectionTitle}>{t("page_settings_account")}</div>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 9,
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
