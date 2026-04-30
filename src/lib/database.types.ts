// database.types.ts — manually maintained types for Supabase tables.
// Keep in sync with supabase/migrations/0001_anima_drive_schema.sql.
// Each Tables entry needs Row + Insert + Update + Relationships, otherwise
// Supabase v2's typed client treats the table as `never`.

export interface AdDocumentRow {
  id: string;
  user_id: string;
  filename: string;
  display_name: string | null;
  ext: string;
  size_bytes: number;
  storage_path: string;
  mime_type: string | null;
  category_key: string | null;
  category_confidence: number | null;
  status: "uploaded" | "categorizing" | "extracting" | "ready" | "failed" | "trashed";
  error_message: string | null;
  uploaded_at: string;
  categorized_at: string | null;
  extracted_at: string | null;
}

export interface AdUserCategoryRow {
  id: string;
  user_id: string;
  key: string;
  label: string;
  icon: string;
  tint: string;
  created_at: string;
}

export type DocumentType =
  | "financial"
  | "contract"
  | "legal"
  | "medical"
  | "educational"
  | "technical"
  | "correspondence"
  | "personal"
  | "media"
  | "other";

export interface AdExtractionRow {
  id: string;
  document_id: string;
  document_type: DocumentType | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  vendor: string | null;
  doc_date: string | null;
  total_amount: number | null;
  currency: string | null;
  vat_amount: number | null;
  vat_rate: number | null;
  invoice_number: string | null;
  due_date: string | null;
  payment_terms: string | null;
  raw_extraction: unknown;
  created_at: string;
}

export interface AdLineItemRow {
  id: string;
  extraction_id: string;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  position: number;
}

export interface AdActivityRow {
  id: string;
  user_id: string;
  document_id: string | null;
  type: "categorized" | "uploaded" | "exported" | "extracted" | "failed";
  message: string;
  metadata: unknown;
  created_at: string;
}

export interface AdConversationRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdMessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  document_refs: string[] | null;
  created_at: string;
}

export interface AdCfoEventRow {
  id: string;
  user_id: string;
  event_type: string;
  source: string;
  document_id: string | null;
  conversation_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AdCfoProfileRow {
  user_id: string;
  health_score: number;
  risk_level: "low" | "medium" | "high";
  total_spend_30d: number;
  total_spend_prev_30d: number;
  active_financial_docs: number;
  active_contract_docs: number;
  open_due_14d_count: number;
  open_due_14d_amount: number;
  top_vendor: string | null;
  top_vendor_share: number | null;
  behavior_stress_score: number;
  profile_json: Record<string, unknown>;
  last_recomputed_at: string;
  updated_at: string;
}

export interface AdCfoSignalRow {
  id: string;
  user_id: string;
  signal_key: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  title: string;
  details: string;
  payload: Record<string, unknown>;
  status: "active" | "resolved";
  detected_at: string;
  resolved_at: string | null;
}

export interface AdCfoRecommendationRow {
  id: string;
  user_id: string;
  signal_id: string | null;
  priority: number;
  title: string;
  rationale: string;
  action: string;
  status: "pending" | "done" | "dismissed";
  due_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  // Required marker for Supabase v2 typed client (>= 2.50).
  // The PostgrestVersion controls which Postgres feature flags are enabled
  // in the type system. "12" matches our Supabase project version.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      ad_documents: {
        Row: AdDocumentRow;
        Insert: Omit<AdDocumentRow, "id" | "uploaded_at" | "categorized_at" | "extracted_at"> & {
          id?: string;
          uploaded_at?: string;
          categorized_at?: string | null;
          extracted_at?: string | null;
        };
        Update: Partial<AdDocumentRow>;
        Relationships: [];
      };
      ad_extractions: {
        Row: AdExtractionRow;
        Insert: Omit<AdExtractionRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdExtractionRow>;
        Relationships: [];
      };
      ad_line_items: {
        Row: AdLineItemRow;
        Insert: Omit<AdLineItemRow, "id"> & { id?: string };
        Update: Partial<AdLineItemRow>;
        Relationships: [];
      };
      ad_activities: {
        Row: AdActivityRow;
        Insert: Omit<AdActivityRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdActivityRow>;
        Relationships: [];
      };
      ad_conversations: {
        Row: AdConversationRow;
        Insert: Omit<AdConversationRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AdConversationRow>;
        Relationships: [];
      };
      ad_messages: {
        Row: AdMessageRow;
        Insert: Omit<AdMessageRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdMessageRow>;
        Relationships: [];
      };
      ad_cfo_events: {
        Row: AdCfoEventRow;
        Insert: Omit<AdCfoEventRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdCfoEventRow>;
        Relationships: [];
      };
      ad_cfo_profiles: {
        Row: AdCfoProfileRow;
        Insert: AdCfoProfileRow;
        Update: Partial<AdCfoProfileRow>;
        Relationships: [];
      };
      ad_cfo_signals: {
        Row: AdCfoSignalRow;
        Insert: Omit<AdCfoSignalRow, "id" | "detected_at" | "resolved_at"> & {
          id?: string;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<AdCfoSignalRow>;
        Relationships: [];
      };
      ad_cfo_recommendations: {
        Row: AdCfoRecommendationRow;
        Insert: Omit<AdCfoRecommendationRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdCfoRecommendationRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
