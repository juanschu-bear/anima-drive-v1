// mock-data.ts — placeholder data for screens until Supabase is wired up.
// Copied 1:1 from the original public/i18n.js.
// TODO: Replace CATS with Supabase select from category_definitions table.
// TODO: Replace RECENT with Supabase query of last 5 uploaded documents.

import type { Category, RecentDoc } from "@/types";

export const CATS: Category[] = [
  { key: "cat_revenue",       tint: "mint",  icon: "trend-up",   count: 8 },
  { key: "cat_expenses",      tint: "coral", icon: "trend-down", count: 12 },
  { key: "cat_salaries",      tint: "blue",  icon: "people",     count: 6 },
  { key: "cat_rent",          tint: "amber", icon: "key",        count: 2 },
  { key: "cat_contracts",     tint: "blue",  icon: "file",       count: 0 },
  { key: "cat_insurance",     tint: "blue",  icon: "shield",     count: 3 },
  { key: "cat_taxes",         tint: "coral", icon: "receipt",    count: 4 },
  { key: "cat_depreciation",  tint: "mint",  icon: "chart",      count: 1 },
  { key: "cat_travel",        tint: "amber", icon: "plane",      count: 5 },
  { key: "cat_office",        tint: "mint",  icon: "box",        count: 3 },
  { key: "cat_marketing",     tint: "coral", icon: "megaphone",  count: 4 },
  { key: "cat_software",      tint: "blue",  icon: "grid",       count: 9 },
  { key: "cat_consulting",    tint: "amber", icon: "spark",      count: 2 },
  { key: "cat_vehicle",       tint: "mint",  icon: "car",        count: 5 },
  { key: "cat_telecom",       tint: "blue",  icon: "antenna",    count: 2 },
  { key: "cat_entertainment", tint: "coral", icon: "glass",      count: 1 },
  { key: "cat_other",         tint: "amber", icon: "dots",       count: 3 },
];

export const RECENT: RecentDoc[] = [
  { name: "Rechnung_Telekom_April.pdf", catKey: "cat_telecom",   ext: "pdf", size: "412 KB", ageKey: "act_time_14m" },
  { name: "Mietvertrag_2026.pdf",       catKey: "cat_rent",      ext: "pdf", size: "1.2 MB", ageKey: "act_time_1h"  },
  { name: "Tankbeleg_19-04.jpg",        catKey: "cat_vehicle",   ext: "jpg", size: "284 KB", ageKey: "act_time_2m"  },
  { name: "LinkedIn_Invoice_Q2.pdf",    catKey: "cat_marketing", ext: "pdf", size: "189 KB", ageKey: "act_time_3h"  },
  { name: "Lohnabrechnung_März.pdf",    catKey: "cat_salaries",  ext: "pdf", size: "96 KB",  ageKey: "act_time_3h"  },
];

export function findCategory(key: string): Category | undefined {
  return CATS.find((c) => c.key === key);
}
