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

export interface AdExtractionRow {
  id: string;
  document_id: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
