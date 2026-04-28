// Activity.tsx — small activity feed shown next to "Recent uploads".
// Reads from useActivities, which falls back to mocks when not signed in.

import type { AccentTint } from "@/types";
import { useLang } from "@/lib/i18n";
import { ACCENT_VARS } from "@/lib/theme";
import { numStyle } from "@/lib/utils";
import { useActivities } from "@/lib/useActivities";
import type { AdActivityRow } from "@/lib/database.types";
import { Panel } from "@/components/ui/Panel";
import { Icon, type IconName } from "@/components/ui/Icon";

const TYPE_VISUAL: Record<AdActivityRow["type"], { tint: AccentTint; icon: IconName }> = {
  categorized: { tint: "mint",  icon: "sparkle" },
  uploaded:    { tint: "blue",  icon: "upload" },
  exported:    { tint: "amber", icon: "sheet" },
  extracted:   { tint: "coral", icon: "key" },
  failed:      { tint: "coral", icon: "x" },
};

export function Activity() {
  const { t } = useLang();
  const { activities, isMock } = useActivities(4);

  return (
    <Panel style={{ padding: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "var(--ad-text-dim)",
          }}
        >
          {t("activity")}
        </div>
        <div style={{ fontSize: 11, color: "var(--ad-text-faint)" }}>{t("see_all")} ›</div>
      </div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {activities.slice(0, 4).map((it, i) => {
          const visual = TYPE_VISUAL[it.type] ?? TYPE_VISUAL.uploaded;
          const tintColor = ACCENT_VARS[visual.tint];
          // When mock, the message is a translation key; when real, it's a literal string.
          const label = isMock ? t(it.message) : it.message;
          return (
            <div
              key={it.id}
              className="flex items-center"
              style={{
                gap: 12,
                padding: "8px 2px",
                animation: `fadeUp 420ms ${200 + i * 60}ms cubic-bezier(.2,.7,.3,1) backwards`,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `color-mix(in oklab, ${tintColor} 9%, transparent)`,
                  color: tintColor,
                }}
              >
                <Icon name={visual.icon} size={13} stroke={1.8} />
              </div>
              <div style={{ flex: 1, fontSize: 12.5, color: "var(--ad-text)" }}>{label}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ad-text-faint)",
                  ...numStyle,
                }}
              >
                {t(it.ageKey)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
