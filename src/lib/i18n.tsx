// i18n.ts — translations + language context for Anima-Drive.
// EN is source of truth; DE and ES are full translations (no English fallback).
// Strings copied 1:1 from the original public/i18n.js.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Lang } from "@/types";

type TranslationKey =
  | "brand" | "nav_upload" | "nav_ask" | "nav_dashboard" | "nav_documents"
  | "nav_sheets" | "nav_trash" | "nav_contacts" | "nav_settings"
  | "page_sheets_title" | "page_sheets_sub" | "page_sheets_empty"
  | "page_trash_title" | "page_trash_sub" | "page_trash_empty" | "page_trash_restore" | "page_trash_purge"
  | "page_contacts_title" | "page_contacts_sub" | "page_contacts_empty"
  | "page_settings_title" | "page_settings_profile" | "page_settings_name" | "page_settings_email"
  | "page_settings_save" | "page_settings_saved" | "page_settings_lang" | "page_settings_theme"
  | "page_settings_signout" | "page_settings_account"
  | "lbl_back"
  | "greet_morning" | "greet_afternoon" | "greet_evening"
  | "user_name" | "subtitle_dash" | "subtitle_dash_zero"
  | "kpi_docs" | "kpi_categories" | "kpi_storage" | "kpi_of"
  | "categories" | "recent" | "activity" | "see_all"
  | "cat_revenue" | "cat_expenses" | "cat_salaries" | "cat_rent" | "cat_contracts" | "cat_insurance"
  | "cat_taxes" | "cat_depreciation" | "cat_travel" | "cat_office" | "cat_marketing"
  | "cat_software" | "cat_consulting" | "cat_vehicle" | "cat_telecom"
  | "cat_entertainment" | "cat_other"
  | "act_categorized" | "act_upload" | "act_export" | "act_contract"
  | "act_time_2m" | "act_time_14m" | "act_time_1h" | "act_time_3h"
  | "ai_title" | "ai_status" | "ai_status_docs" | "ai_placeholder" | "ai_typing"
  | "sug_receipts" | "sug_software" | "sug_rental" | "sug_uncat"
  | "ai_msg_user1" | "ai_msg_ai1_p1" | "ai_msg_ai1_p2" | "ai_msg_ai2"
  | "upl_title" | "upl_sub" | "upl_browse" | "upl_uploading" | "upl_speed"
  | "upl_of" | "upl_cancel" | "upl_done"
  | "br_title" | "br_search" | "br_sort" | "br_grid" | "br_list" | "br_filter"
  | "br_all" | "br_select" | "br_selected"
  | "cd_back" | "cd_month" | "cd_total" | "cd_count" | "cd_export"
  | "ob_title" | "ob_sub" | "ob_cta" | "ob_or" | "ob_connect"
  | "ob_empty_title" | "ob_empty_sub"
  | "theme" | "language" | "dark" | "light" | "collapse" | "settings"
  | "lbl_files" | "lbl_updated" | "lbl_eur" | "lbl_new" | "lbl_ai_chip" | "send";

type TranslationDict = Record<TranslationKey, string>;

export const TR: Record<Lang, TranslationDict> = {
  en: {
    brand: "Anima-Drive",
    nav_upload: "Upload", nav_ask: "Ask Anima", nav_dashboard: "Dashboard",
    nav_documents: "Documents", nav_sheets: "Sheets", nav_trash: "Trash", nav_contacts: "Contacts",
    nav_settings: "Settings",
    page_sheets_title: "Sheets",
    page_sheets_sub: "Tabular view of all extracted document data — vendor, amount, date.",
    page_sheets_empty: "No extracted data yet. Upload some documents and let Anima do its thing.",
    page_trash_title: "Trash",
    page_trash_sub: "Deleted documents are kept here. Restore or permanently delete.",
    page_trash_empty: "Nothing in the trash.",
    page_trash_restore: "Restore",
    page_trash_purge: "Delete forever",
    page_contacts_title: "Contacts",
    page_contacts_sub: "Vendors detected across all your documents.",
    page_contacts_empty: "No vendors yet — they'll appear once you upload some receipts.",
    page_settings_title: "Settings",
    page_settings_profile: "Profile",
    page_settings_name: "Display name",
    page_settings_email: "Email",
    page_settings_save: "Save",
    page_settings_saved: "Saved.",
    page_settings_lang: "Language",
    page_settings_theme: "Theme",
    page_settings_signout: "Sign out",
    page_settings_account: "Account",
    lbl_back: "Back",
    greet_morning: "Good morning", greet_afternoon: "Good afternoon", greet_evening: "Good evening",
    user_name: "Maya",
    subtitle_dash: "documents, neatly filed. Ask me anything.",
    subtitle_dash_zero: "Drop your first document. I'll file the rest.",
    kpi_docs: "Total documents", kpi_categories: "Active categories", kpi_storage: "Storage used", kpi_of: "of",
    categories: "Categories", recent: "Recent uploads", activity: "Activity", see_all: "See all",
    cat_revenue: "Revenue", cat_expenses: "Expenses", cat_salaries: "Salaries", cat_rent: "Rent", cat_contracts: "Contracts",
    cat_insurance: "Insurance", cat_taxes: "Taxes", cat_depreciation: "Depreciation", cat_travel: "Travel",
    cat_office: "Office supplies", cat_marketing: "Marketing", cat_software: "Software & licenses",
    cat_consulting: "Consulting", cat_vehicle: "Vehicle costs", cat_telecom: "Telecoms",
    cat_entertainment: "Entertainment", cat_other: "Other",
    act_categorized: "AI categorized Tankbeleg_19-04.jpg as Vehicle costs",
    act_upload: "New upload: LinkedIn_Invoice_Q2.pdf",
    act_export: "Export to Anima Sheets completed — 12 transactions",
    act_contract: "Rental contract renewed — Mietvertrag_2026.pdf",
    act_time_2m: "2 min ago", act_time_14m: "14 min ago", act_time_1h: "1 h ago", act_time_3h: "3 h ago",
    ai_title: "Ask Anima", ai_status: "Ready · indexed",
    ai_status_docs: "docs",
    ai_placeholder: "Ask about your documents…", ai_typing: "Thinking…",
    sug_receipts: "Show all receipts from this month",
    sug_software: "How much did I spend on software?",
    sug_rental: "Find my rental contract",
    sug_uncat: "Uncategorized documents",
    ai_msg_user1: "Show me all invoices over 500 € from March",
    ai_msg_ai1_p1: "I found 4 invoices over €500 from March. The largest is Bürolöhne_März.pdf at €4,320.",
    ai_msg_ai1_p2: "Want me to export these to Anima Sheets?",
    ai_msg_ai2: "I categorized 3 new documents: 2 receipts, 1 invoice.",
    upl_title: "Drop files to upload", upl_sub: "PDF, JPG, PNG, CSV · up to 25 MB each",
    upl_browse: "or browse files", upl_uploading: "Uploading", upl_speed: "2.4 MB/s",
    upl_of: "of", upl_cancel: "Cancel", upl_done: "Done",
    br_title: "Documents", br_search: "Search documents…", br_sort: "Sort",
    br_grid: "Grid", br_list: "List", br_filter: "Filter", br_all: "All",
    br_select: "Select", br_selected: "selected",
    cd_back: "All categories", cd_month: "This month", cd_total: "Total",
    cd_count: "documents", cd_export: "Export to Sheets",
    ob_title: "Welcome to Anima-Drive",
    ob_sub: "Your CFO in a folder. Drop a document to begin — we'll file, tag, and remember everything.",
    ob_cta: "Upload your first document", ob_or: "or", ob_connect: "connect a mailbox",
    ob_empty_title: "Nothing here yet",
    ob_empty_sub: "Documents you upload will appear in this category.",
    theme: "Theme", language: "Language", dark: "Dark", light: "Light",
    collapse: "Collapse", settings: "Settings",
    lbl_files: "files", lbl_updated: "Updated", lbl_eur: "€",
    lbl_new: "New", lbl_ai_chip: "AI", send: "Send",
  },
  de: {
    brand: "Anima-Drive",
    nav_upload: "Hochladen", nav_ask: "Anima fragen", nav_dashboard: "Übersicht",
    nav_documents: "Dokumente", nav_sheets: "Tabellen", nav_trash: "Papierkorb", nav_contacts: "Kontakte",
    nav_settings: "Einstellungen",
    page_sheets_title: "Tabellen",
    page_sheets_sub: "Tabellenansicht aller extrahierten Dokumentdaten — Anbieter, Betrag, Datum.",
    page_sheets_empty: "Noch keine extrahierten Daten. Lade ein paar Dokumente hoch und lass Anima ihr Ding machen.",
    page_trash_title: "Papierkorb",
    page_trash_sub: "Gelöschte Dokumente werden hier aufbewahrt. Wiederherstellen oder endgültig löschen.",
    page_trash_empty: "Papierkorb ist leer.",
    page_trash_restore: "Wiederherstellen",
    page_trash_purge: "Endgültig löschen",
    page_contacts_title: "Kontakte",
    page_contacts_sub: "Anbieter, die in deinen Dokumenten erkannt wurden.",
    page_contacts_empty: "Noch keine Anbieter — sie erscheinen, sobald du Belege hochlädst.",
    page_settings_title: "Einstellungen",
    page_settings_profile: "Profil",
    page_settings_name: "Anzeigename",
    page_settings_email: "E-Mail",
    page_settings_save: "Speichern",
    page_settings_saved: "Gespeichert.",
    page_settings_lang: "Sprache",
    page_settings_theme: "Theme",
    page_settings_signout: "Abmelden",
    page_settings_account: "Konto",
    lbl_back: "Zurück",
    greet_morning: "Guten Morgen", greet_afternoon: "Guten Tag", greet_evening: "Guten Abend",
    user_name: "Maya",
    subtitle_dash: "Dokumente, sauber abgelegt. Frag mich alles.",
    subtitle_dash_zero: "Wirf dein erstes Dokument rein. Den Rest mach ich.",
    kpi_docs: "Dokumente insgesamt", kpi_categories: "Aktive Kategorien", kpi_storage: "Speicher belegt", kpi_of: "von",
    categories: "Kategorien", recent: "Zuletzt hochgeladen", activity: "Aktivität", see_all: "Alle ansehen",
    cat_revenue: "Umsatz", cat_expenses: "Ausgaben", cat_salaries: "Gehälter", cat_rent: "Miete", cat_contracts: "Verträge",
    cat_insurance: "Versicherung", cat_taxes: "Steuern", cat_depreciation: "Abschreibung", cat_travel: "Reisen",
    cat_office: "Bürobedarf", cat_marketing: "Marketing", cat_software: "Software & Lizenzen",
    cat_consulting: "Beratung", cat_vehicle: "Fahrzeugkosten", cat_telecom: "Telekommunikation",
    cat_entertainment: "Bewirtung", cat_other: "Sonstiges",
    act_categorized: "KI hat Tankbeleg_19-04.jpg als Fahrzeugkosten eingeordnet",
    act_upload: "Neuer Upload: LinkedIn_Invoice_Q2.pdf",
    act_export: "Export zu Anima Sheets abgeschlossen — 12 Vorgänge",
    act_contract: "Mietvertrag erneuert — Mietvertrag_2026.pdf",
    act_time_2m: "vor 2 Min.", act_time_14m: "vor 14 Min.", act_time_1h: "vor 1 Std.", act_time_3h: "vor 3 Std.",
    ai_title: "Anima fragen", ai_status: "Bereit · indiziert",
    ai_status_docs: "Dokumente",
    ai_placeholder: "Frag nach deinen Dokumenten…", ai_typing: "Denke nach…",
    sug_receipts: "Alle Belege dieses Monats",
    sug_software: "Wie viel habe ich für Software ausgegeben?",
    sug_rental: "Mietvertrag finden",
    sug_uncat: "Nicht kategorisierte Dokumente",
    ai_msg_user1: "Zeig mir alle Rechnungen über 500 € aus März",
    ai_msg_ai1_p1: "Ich habe 4 Rechnungen über 500 € aus März gefunden. Die größte ist Bürolöhne_März.pdf mit 4.320 €.",
    ai_msg_ai1_p2: "Soll ich diese zu Anima Sheets exportieren?",
    ai_msg_ai2: "Ich habe 3 neue Dokumente eingeordnet: 2 Belege, 1 Rechnung.",
    upl_title: "Dateien hier ablegen", upl_sub: "PDF, JPG, PNG, CSV · bis zu 25 MB je Datei",
    upl_browse: "oder Dateien durchsuchen", upl_uploading: "Wird hochgeladen", upl_speed: "2,4 MB/s",
    upl_of: "von", upl_cancel: "Abbrechen", upl_done: "Fertig",
    br_title: "Dokumente", br_search: "Dokumente durchsuchen…", br_sort: "Sortieren",
    br_grid: "Raster", br_list: "Liste", br_filter: "Filter", br_all: "Alle",
    br_select: "Auswählen", br_selected: "ausgewählt",
    cd_back: "Alle Kategorien", cd_month: "Diesen Monat", cd_total: "Gesamt",
    cd_count: "Dokumente", cd_export: "Zu Sheets exportieren",
    ob_title: "Willkommen bei Anima-Drive",
    ob_sub: "Dein CFO im Ordner. Leg ein Dokument ab — wir sortieren, taggen und merken uns alles.",
    ob_cta: "Erstes Dokument hochladen", ob_or: "oder", ob_connect: "Postfach verbinden",
    ob_empty_title: "Noch nichts hier",
    ob_empty_sub: "Hochgeladene Dokumente erscheinen in dieser Kategorie.",
    theme: "Theme", language: "Sprache", dark: "Dunkel", light: "Hell",
    collapse: "Einklappen", settings: "Einstellungen",
    lbl_files: "Dateien", lbl_updated: "Aktualisiert", lbl_eur: "€",
    lbl_new: "Neu", lbl_ai_chip: "KI", send: "Senden",
  },
  es: {
    brand: "Anima-Drive",
    nav_upload: "Subir", nav_ask: "Preguntar a Anima", nav_dashboard: "Panel",
    nav_documents: "Documentos", nav_sheets: "Hojas", nav_trash: "Papelera", nav_contacts: "Contactos",
    nav_settings: "Ajustes",
    page_sheets_title: "Hojas",
    page_sheets_sub: "Vista tabular de todos los datos extraídos — proveedor, importe, fecha.",
    page_sheets_empty: "Aún no hay datos extraídos. Sube algunos documentos y deja que Anima haga su magia.",
    page_trash_title: "Papelera",
    page_trash_sub: "Los documentos eliminados se guardan aquí. Restaurar o borrar permanentemente.",
    page_trash_empty: "Papelera vacía.",
    page_trash_restore: "Restaurar",
    page_trash_purge: "Borrar definitivamente",
    page_contacts_title: "Contactos",
    page_contacts_sub: "Proveedores detectados en tus documentos.",
    page_contacts_empty: "Aún no hay proveedores — aparecerán cuando subas recibos.",
    page_settings_title: "Ajustes",
    page_settings_profile: "Perfil",
    page_settings_name: "Nombre",
    page_settings_email: "Correo",
    page_settings_save: "Guardar",
    page_settings_saved: "Guardado.",
    page_settings_lang: "Idioma",
    page_settings_theme: "Tema",
    page_settings_signout: "Cerrar sesión",
    page_settings_account: "Cuenta",
    lbl_back: "Atrás",
    greet_morning: "Buenos días", greet_afternoon: "Buenas tardes", greet_evening: "Buenas noches",
    user_name: "Maya",
    subtitle_dash: "documentos, bien archivados. Pregúntame lo que quieras.",
    subtitle_dash_zero: "Sube tu primer documento. Yo me ocupo del resto.",
    kpi_docs: "Documentos totales", kpi_categories: "Categorías activas", kpi_storage: "Almacenamiento usado", kpi_of: "de",
    categories: "Categorías", recent: "Subidas recientes", activity: "Actividad", see_all: "Ver todo",
    cat_revenue: "Ingresos", cat_expenses: "Gastos", cat_salaries: "Salarios", cat_rent: "Alquiler", cat_contracts: "Contratos",
    cat_insurance: "Seguros", cat_taxes: "Impuestos", cat_depreciation: "Amortización", cat_travel: "Viajes",
    cat_office: "Oficina", cat_marketing: "Marketing", cat_software: "Software y licencias",
    cat_consulting: "Consultoría", cat_vehicle: "Vehículos", cat_telecom: "Telecom.",
    cat_entertainment: "Representación", cat_other: "Otros",
    act_categorized: "La IA categorizó Tankbeleg_19-04.jpg como Vehículos",
    act_upload: "Nueva subida: LinkedIn_Invoice_Q2.pdf",
    act_export: "Exportación a Anima Sheets completada — 12 operaciones",
    act_contract: "Contrato de alquiler renovado — Mietvertrag_2026.pdf",
    act_time_2m: "hace 2 min", act_time_14m: "hace 14 min", act_time_1h: "hace 1 h", act_time_3h: "hace 3 h",
    ai_title: "Preguntar a Anima", ai_status: "Listo · indexados",
    ai_status_docs: "docs",
    ai_placeholder: "Pregunta sobre tus documentos…", ai_typing: "Pensando…",
    sug_receipts: "Todos los recibos de este mes",
    sug_software: "¿Cuánto gasté en software?",
    sug_rental: "Busca mi contrato de alquiler",
    sug_uncat: "Documentos sin categorizar",
    ai_msg_user1: "Muéstrame todas las facturas de marzo por más de 500 €",
    ai_msg_ai1_p1: "Encontré 4 facturas de más de 500 € de marzo. La mayor es Bürolöhne_März.pdf con 4.320 €.",
    ai_msg_ai1_p2: "¿Las exporto a Anima Sheets?",
    ai_msg_ai2: "Categoricé 3 documentos nuevos: 2 recibos, 1 factura.",
    upl_title: "Arrastra archivos para subir", upl_sub: "PDF, JPG, PNG, CSV · hasta 25 MB cada uno",
    upl_browse: "o buscar archivos", upl_uploading: "Subiendo", upl_speed: "2,4 MB/s",
    upl_of: "de", upl_cancel: "Cancelar", upl_done: "Hecho",
    br_title: "Documentos", br_search: "Buscar documentos…", br_sort: "Ordenar",
    br_grid: "Cuadrícula", br_list: "Lista", br_filter: "Filtrar", br_all: "Todos",
    br_select: "Seleccionar", br_selected: "seleccionados",
    cd_back: "Todas las categorías", cd_month: "Este mes", cd_total: "Total",
    cd_count: "documentos", cd_export: "Exportar a Sheets",
    ob_title: "Te damos la bienvenida a Anima-Drive",
    ob_sub: "Tu CFO en una carpeta. Arrastra un documento y lo archivamos, etiquetamos y recordamos por ti.",
    ob_cta: "Sube tu primer documento", ob_or: "o", ob_connect: "conecta un buzón",
    ob_empty_title: "Todavía no hay nada",
    ob_empty_sub: "Los documentos que subas aparecerán en esta categoría.",
    theme: "Tema", language: "Idioma", dark: "Oscuro", light: "Claro",
    collapse: "Contraer", settings: "Ajustes",
    lbl_files: "archivos", lbl_updated: "Actualizado", lbl_eur: "€",
    lbl_new: "Nuevo", lbl_ai_chip: "IA", send: "Enviar",
  },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback(
    (k: string): string => {
      const dict = TR[lang] as Record<string, string>;
      const fallback = TR.en as Record<string, string>;
      return dict[k] ?? fallback[k] ?? k;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used within LangProvider");
  return v;
}
