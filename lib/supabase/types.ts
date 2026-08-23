export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      business_members: {
        Row: {
          accepted_at: string | null
          business_id: string
          id: string
          invited_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          id?: string
          invited_at?: string
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
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          archived_at: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
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
      jobs: {
        Row: {
          archived_at: string | null
          business_id: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          project_id: string | null
          quote_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          business_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          business_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
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
      price_book_items: {
        Row: {
          active: boolean
          archived_at: string | null
          business_id: string
          created_at: string
          id: string
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
          id?: string
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
          id?: string
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
          price_book_item_id: string | null
          qty: number
          quote_id: string
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_book_item_id?: string | null
          qty?: number
          quote_id: string
          sort_order?: number
          total_cents: number
          unit?: string | null
          unit_price_cents: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
          id: string
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
          id?: string
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
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_business_with_owner: {
        Args: { p_name: string; p_slug: string; p_user_id: string }
        Returns: string
      }
      get_my_business_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
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
      member_role: "owner" | "office_manager" | "estimator" | "field_worker"
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
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
