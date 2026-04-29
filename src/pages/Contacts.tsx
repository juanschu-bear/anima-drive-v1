// Contacts.tsx — vendor list aggregated from extractions.
// Groups extractions by vendor, shows count + total spend per vendor.

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { SidebarState } from "@/types";
import { useLang } from "@/lib/i18n";
import { useExtractions } from "@/lib/useExtractions";
import { numStyle } from "@/lib/utils";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface ContactsProps {
  sidebarState?: SidebarState;
}

interface VendorSummary {
  vendor: string;
  documentCount: number;
  totalAmount: number;
  currency: string;
  lastSeen: string;
}

export function Contacts({ sidebarState }: ContactsProps) {
  const { t } = useLang();
  const { rows, loading, isMock } = useExtractions();

  const vendors: VendorSummary[] = useMemo(() => {
    const map = new Map<string, VendorSummary>();
    for (const r of rows) {
      if (!r.vendor) continue;
      const existing = map.get(r.vendor);
      if (existing) {
        existing.documentCount += 1;
        existing.totalAmount += r.total_amount ?? 0;
        if (r.uploaded_at > existing.lastSeen) existing.lastSeen = r.uploaded_at;
      } else {
        map.set(r.vendor, {
          vendor: r.vendor,
          documentCount: 1,
          totalAmount: r.total_amount ?? 0,
          currency: r.currency ?? "EUR",
          lastSeen: r.uploaded_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [rows]);

  if (!isMock && vendors.length === 0 && !loading) {
    return (
      <PageShell
        title={t("page_contacts_title")}
        subtitle={t("page_contacts_sub")}
        active="contacts"
        sidebarState={sidebarState}
      >
        <Panel style={{ padding: 60, textAlign: "center" }}>
          <div className="flex flex-col items-center" style={{ gap: 12 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "color-mix(in oklab, var(--ad-accent-mint) 12%, transparent)",
                color: "var(--ad-accent-mint)",
              }}
            >
              <Icon name="people" size={22} stroke={1.6} />
            </div>
            <div style={{ fontSize: 14, color: "var(--ad-text-dim)", maxWidth: 380 }}>
              {t("page_contacts_empty")}
            </div>
          </div>
        </Panel>
      </PageShell>
    );
  }

  const headerCellStyle: CSSProperties = {
    fontSize: 10,
    color: "var(--ad-text-faint)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: 600,
  };

  return (
    <PageShell
      title={t("page_contacts_title")}
      subtitle={t("page_contacts_sub")}
      active="contacts"
      sidebarState={sidebarState}
    >
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) 100px 1fr 1fr",
            padding: "14px 22px",
            borderBottom: "1px solid var(--ad-hairline)",
            gap: 16,
          }}
        >
          <div style={headerCellStyle}>Vendor</div>
          <div style={headerCellStyle}>Documents</div>
          <div style={headerCellStyle}>Last seen</div>
          <div style={{ ...headerCellStyle, textAlign: "right" }}>Total spend</div>
        </div>

        {vendors.map((v) => (
          <div
            key={v.vendor}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) 100px 1fr 1fr",
              padding: "14px 22px",
              borderBottom: "1px solid var(--ad-hairline)",
              gap: 16,
              fontSize: 13,
              alignItems: "center",
            }}
          >
            <div className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--ad-chip)",
                  border: "1px solid var(--ad-border)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ad-text-dim)",
                  flexShrink: 0,
                }}
              >
                {v.vendor.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {v.vendor}
              </span>
            </div>
            <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>{v.documentCount}</div>
            <div style={{ color: "var(--ad-text-dim)", ...numStyle }}>
              {new Date(v.lastSeen).toLocaleDateString()}
            </div>
            <div style={{ fontWeight: 600, textAlign: "right", ...numStyle }}>
              {formatCurrency(v.totalAmount, v.currency)}
            </div>
          </div>
        ))}
      </Panel>
    </PageShell>
  );
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
