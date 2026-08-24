export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          business_id: string | null
          cost_usd: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          output_tokens: number
        }
        Insert: {
          business_id?: string | null
          cost_usd?: number
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          output_tokens?: number
        }
        Update: {
          business_id?: string | null
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          output_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          accepted_at: string | null
          business_id: string
          email: string | null
          id: string
          invited_at: string
          invited_by: string | null
          name: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          email?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          email?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          default_deposit_pct: number | null
          default_payment_terms: string | null
          default_tax_pct: number | null
          email: string | null
          id: string
          lang: string | null
          logo_url: string | null
          cashapp_tag: string | null
          venmo_tag: string | null
          zelle_tag: string | null
          name: string
          phone: string | null
          slug: string
          tagline: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          default_deposit_pct?: number | null
          default_payment_terms?: string | null
          default_tax_pct?: number | null
          email?: string | null
          id?: string
          lang?: string | null
          logo_url?: string | null
          cashapp_tag?: string | null
          venmo_tag?: string | null
          zelle_tag?: string | null
          name: string
          phone?: string | null
          slug: string
          tagline?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          default_deposit_pct?: number | null
          default_payment_terms?: string | null
          default_tax_pct?: number | null
          email?: string | null
          id?: string
          lang?: string | null
          logo_url?: string | null
          cashapp_tag?: string | null
          venmo_tag?: string | null
          zelle_tag?: string | null
          name?: string
          phone?: string | null
          slug?: string
          tagline?: string | null
          website?: string | null
        }
        Relationships: []
      }
      change_orders: {
        Row: {
          amount_cents: number
          business_id: string
          created_at: string
          description: string
          id: string
          job_id: string
          status: string
        }
        Insert: {
          amount_cents?: number
          business_id: string
          created_at?: string
          description: string
          id?: string
          job_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          business_id?: string
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          business_id: string
          contact_pref: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          business_id: string
          contact_pref?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          business_id?: string
          contact_pref?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_events: {
        Row: {
          actor_id: string | null
          business_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["estimate_event_type"]
          id: string
          meta: Json | null
          quote_id: string
        }
        Insert: {
          actor_id?: string | null
          business_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["estimate_event_type"]
          id?: string
          meta?: Json | null
          quote_id: string
        }
        Update: {
          actor_id?: string | null
          business_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["estimate_event_type"]
          id?: string
          meta?: Json | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          business_id: string
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          job_id: string | null
          receipt_url: string | null
          user_id: string | null
          vendor: string | null
        }
        Insert: {
          amount_cents?: number
          business_id: string
          category?: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          job_id?: string | null
          receipt_url?: string | null
          user_id?: string | null
          vendor?: string | null
        }
        Update: {
          amount_cents?: number
          business_id?: string
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          job_id?: string | null
          receipt_url?: string | null
          user_id?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          archived_at: string | null
          business_id: string
          client_id: string | null
          created_at: string
          due_at: string | null
          id: string
          issued_at: string | null
          job_id: string | null
          notes: string | null
          project_id: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          archived_at?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          job_id?: string | null
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          archived_at?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          job_id?: string | null
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assigned_at: string
          business_id: string
          id: string
          job_id: string
          role_in_job: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          business_id: string
          id?: string
          job_id: string
          role_in_job?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          business_id?: string
          id?: string
          job_id?: string
          role_in_job?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          job_id: string
          phase: string
          url: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          phase: string
          url: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          phase?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          business_id: string
          completed_at: string | null
          completion_summary: string | null
          created_at: string
          end_date: string | null
          flags: string[]
          id: string
          notes: string | null
          project_id: string | null
          quote_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string | null
          updated_at: string
          warranty_notes: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          business_id: string
          completed_at?: string | null
          completion_summary?: string | null
          created_at?: string
          end_date?: string | null
          flags?: string[]
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string | null
          updated_at?: string
          warranty_notes?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          business_id?: string
          completed_at?: string | null
          completion_summary?: string | null
          created_at?: string
          end_date?: string | null
          flags?: string[]
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string | null
          updated_at?: string
          warranty_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          business_id: string
          created_at: string
          external_reference: string | null
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          project_id: string | null
          quote_id: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          business_id: string
          created_at?: string
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          project_id?: string | null
          quote_id?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          business_id?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          project_id?: string | null
          quote_id?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: { id: string; job_id: string; business_id: string; author_id: string | null; body: string; is_private: boolean; created_at: string }
        Insert: { id?: string; job_id: string; business_id: string; author_id?: string | null; body: string; is_private?: boolean; created_at?: string }
        Update: { body?: string; is_private?: boolean }
        Relationships: []
      }
      message_templates: {
        Row: { id: string; business_id: string; name: string; body: string; created_at: string }
        Insert: { id?: string; business_id: string; name: string; body: string; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; body?: string; created_at?: string }
        Relationships: []
      }
      price_book_items: {
        Row: {
          active: boolean
          archived_at: string | null
          business_id: string
          created_at: string
          description: string | null
          favorite: boolean
          id: string
          is_optional: boolean
          item_type: string
          tax_rate_pct: number | null
          last_used_at: string | null
          name: string
          price_cents: number
          trade: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          archived_at?: string | null
          business_id: string
          created_at?: string
          description?: string | null
          favorite?: boolean
          id?: string
          is_optional?: boolean
          item_type?: string
          tax_rate_pct?: number | null
          last_used_at?: string | null
          name: string
          price_cents: number
          trade?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          archived_at?: string | null
          business_id?: string
          created_at?: string
          description?: string | null
          favorite?: boolean
          id?: string
          is_optional?: boolean
          item_type?: string
          tax_rate_pct?: number | null
          last_used_at?: string | null
          name?: string
          price_cents?: number
          trade?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_book_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          business_id: string
          client_id: string
          created_at: string
          id: string
          job_address: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          job_address?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          job_address?: string | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          optional: boolean
          price_book_item_id: string | null
          qty: number
          quote_id: string
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
          markup_pct: number | null
          item_type: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          optional?: boolean
          price_book_item_id?: string | null
          qty?: number
          quote_id: string
          sort_order?: number
          total_cents: number
          unit?: string | null
          unit_price_cents: number
          markup_pct?: number | null
          item_type?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          optional?: boolean
          price_book_item_id?: string | null
          qty?: number
          quote_id?: string
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_price_book_item_id_fkey"
            columns: ["price_book_item_id"]
            isOneToOne: false
            referencedRelation: "price_book_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_signatures: {
        Row: {
          business_id: string
          id: string
          quote_id: string
          signature_data: string | null
          signed_at: string
          signer_name: string | null
        }
        Insert: {
          business_id: string
          id?: string
          quote_id: string
          signature_data?: string | null
          signed_at?: string
          signer_name?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          quote_id?: string
          signature_data?: string | null
          signed_at?: string
          signer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_signatures_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_signatures_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          quote_id: string
          snapshot_json: Json
          version_number: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          quote_id: string
          snapshot_json: Json
          version_number: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          quote_id?: string
          snapshot_json?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_ip: unknown
          accepted_name: string | null
          accepted_ua: string | null
          ai_output: Json | null
          archived_at: string | null
          business_id: string
          client_id: string | null
          created_at: string
          deposit_cents: number | null
          deposit_pct: number | null
          expires_at: string | null
          id: string
          notes: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          total_cents: number
          updated_at: string
          version_number: number
          voice_transcript: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: unknown
          accepted_name?: string | null
          accepted_ua?: string | null
          ai_output?: Json | null
          archived_at?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          deposit_cents?: number | null
          deposit_pct?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_cents?: number
          updated_at?: string
          version_number?: number
          voice_transcript?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: unknown
          accepted_name?: string | null
          accepted_ua?: string | null
          ai_output?: Json | null
          archived_at?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          deposit_cents?: number | null
          deposit_pct?: number | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_cents?: number
          updated_at?: string
          version_number?: number
          voice_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing: Database["public"]["Enums"]["billing_cycle"]
          business_id: string
          created_at: string
          founder_price_cents: number | null
          id: string
          is_founder: boolean
          next_billing_at: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing?: Database["public"]["Enums"]["billing_cycle"]
          business_id: string
          created_at?: string
          founder_price_cents?: number | null
          id?: string
          is_founder?: boolean
          next_billing_at?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing?: Database["public"]["Enums"]["billing_cycle"]
          business_id?: string
          created_at?: string
          founder_price_cents?: number | null
          id?: string
          is_founder?: boolean
          next_billing_at?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          business_id: string
          created_at: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          name: string | null
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approved_by: string | null
          business_id: string
          clocked_in_at: string
          clocked_out_at: string | null
          created_at: string
          id: string
          job_id: string | null
          notes: string | null
          status: string
          user_id: string
          worker_name: string | null
        }
        Insert: {
          approved_by?: string | null
          business_id: string
          clocked_in_at?: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          status?: string
          user_id: string
          worker_name?: string | null
        }
        Update: {
          approved_by?: string | null
          business_id?: string
          clocked_in_at?: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          status?: string
          user_id?: string
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_business_with_owner: {
        Args: { p_name: string; p_slug: string; p_user_id: string }
        Returns: string
      }
      get_my_business_ids: { Args: never; Returns: string[] }
      my_role_in: {
        Args: { p_business_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
    }
    Enums: {
      billing_cycle: "monthly" | "annual"
      estimate_event_type:
        | "created"
        | "sent"
        | "viewed"
        | "accepted"
        | "declined"
        | "resent"
        | "expired"
        | "archived"
        | "change_requested"
      invoice_status:
        | "draft"
        | "sent"
        | "partial"
        | "paid"
        | "overdue"
        | "canceled"
      job_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "on_hold"
        | "canceled"
      member_role:
        | "owner"
        | "office_manager"
        | "estimator"
        | "field_worker"
        | "admin"
      payment_method: "cash" | "check" | "card" | "transfer" | "other"
      payment_status: "pending" | "received" | "failed" | "refunded"
      payment_type: "deposit" | "partial" | "final"
      project_status: "lead" | "active" | "completed" | "canceled"
      quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "declined"
        | "expired"
        | "converted"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["monthly", "annual"],
      estimate_event_type: [
        "created",
        "sent",
        "viewed",
        "accepted",
        "declined",
        "resent",
        "expired",
        "archived",
        "change_requested",
      ],
      invoice_status: [
        "draft",
        "sent",
        "partial",
        "paid",
        "overdue",
        "canceled",
      ],
      job_status: [
        "scheduled",
        "in_progress",
        "completed",
        "on_hold",
        "canceled",
      ],
      member_role: [
        "owner",
        "office_manager",
        "estimator",
        "field_worker",
        "admin",
      ],
      payment_method: ["cash", "check", "card", "transfer", "other"],
      payment_status: ["pending", "received", "failed", "refunded"],
      payment_type: ["deposit", "partial", "final"],
      project_status: ["lead", "active", "completed", "canceled"],
      quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "declined",
        "expired",
        "converted",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
