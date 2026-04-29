// types.ts — shared type definitions for Anima-Drive.

export type ThemeKey = "dark" | "light";
export type Lang = "en" | "de" | "es";
export type AccentTint = "mint" | "coral" | "amber" | "blue";
export type SidebarState = "expanded" | "collapsed";
export type AIPlacement = "panel" | "drawer";
export type CategoryTreatment = "grid" | "list" | "cloud";

export interface Category {
  key: string;
  tint: AccentTint;
  icon: string;
  count: number;
}

export interface RecentDoc {
  documentId?: string;
  originalFilename?: string;
  name: string;
  catKey: string;
  ext: string;
  size: string;
  ageKey: string;
}
