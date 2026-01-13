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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      above_site_audit_log: {
        Row: {
          action_category: string
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          jurisdiction_scope: Json | null
          metadata: Json | null
          patient_access_approved_by: string | null
          patient_access_purpose: string | null
          patient_access_time_limit: unknown
          patient_id: string | null
          session_id: string | null
          target_id: string | null
          target_name: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_category: string
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          jurisdiction_scope?: Json | null
          metadata?: Json | null
          patient_access_approved_by?: string | null
          patient_access_purpose?: string | null
          patient_access_time_limit?: unknown
          patient_id?: string | null
          session_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_category?: string
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          jurisdiction_scope?: Json | null
          metadata?: Json | null
          patient_access_approved_by?: string | null
          patient_access_purpose?: string | null
          patient_access_time_limit?: unknown
          patient_id?: string | null
          session_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "above_site_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "above_site_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      above_site_interventions: {
        Row: {
          action_data: Json | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          intervention_type: Database["public"]["Enums"]["intervention_type"]
          is_approved: boolean | null
          is_reversible: boolean | null
          reason: string
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          session_id: string
          target_facility_id: string | null
          target_pool_id: string | null
          target_provider_id: string | null
          target_workspace_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          intervention_type: Database["public"]["Enums"]["intervention_type"]
          is_approved?: boolean | null
          is_reversible?: boolean | null
          reason: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          session_id: string
          target_facility_id?: string | null
          target_pool_id?: string | null
          target_provider_id?: string | null
          target_workspace_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          intervention_type?: Database["public"]["Enums"]["intervention_type"]
          is_approved?: boolean | null
          is_reversible?: boolean | null
          reason?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          session_id?: string
          target_facility_id?: string | null
          target_pool_id?: string | null
          target_provider_id?: string | null
          target_workspace_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "above_site_interventions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "above_site_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_interventions_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_interventions_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "above_site_interventions_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "above_site_interventions_target_pool_id_fkey"
            columns: ["target_pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_interventions_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      above_site_roles: {
        Row: {
          can_access_patient_data: boolean | null
          can_act_as: boolean | null
          can_intervene: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          role_type: Database["public"]["Enums"]["above_site_role_type"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_access_patient_data?: boolean | null
          can_act_as?: boolean | null
          can_intervene?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          role_type: Database["public"]["Enums"]["above_site_role_type"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_access_patient_data?: boolean | null
          can_act_as?: boolean | null
          can_intervene?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          role_type?: Database["public"]["Enums"]["above_site_role_type"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      above_site_sessions: {
        Row: {
          above_site_role_id: string
          acting_as_expires_at: string | null
          acting_as_reason: string | null
          acting_as_started_at: string | null
          acting_as_workspace_id: string | null
          context_label: string
          context_type: Database["public"]["Enums"]["above_site_context_type"]
          created_at: string | null
          ended_at: string | null
          id: string
          is_acting_as: boolean | null
          last_activity_at: string | null
          selected_district: string | null
          selected_facility_id: string | null
          selected_programme: string | null
          selected_province: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          above_site_role_id: string
          acting_as_expires_at?: string | null
          acting_as_reason?: string | null
          acting_as_started_at?: string | null
          acting_as_workspace_id?: string | null
          context_label: string
          context_type: Database["public"]["Enums"]["above_site_context_type"]
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_acting_as?: boolean | null
          last_activity_at?: string | null
          selected_district?: string | null
          selected_facility_id?: string | null
          selected_programme?: string | null
          selected_province?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          above_site_role_id?: string
          acting_as_expires_at?: string | null
          acting_as_reason?: string | null
          acting_as_started_at?: string | null
          acting_as_workspace_id?: string | null
          context_label?: string
          context_type?: Database["public"]["Enums"]["above_site_context_type"]
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_acting_as?: boolean | null
          last_activity_at?: string | null
          selected_district?: string | null
          selected_facility_id?: string | null
          selected_programme?: string | null
          selected_province?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "above_site_sessions_above_site_role_id_fkey"
            columns: ["above_site_role_id"]
            isOneToOne: false
            referencedRelation: "above_site_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_sessions_acting_as_workspace_id_fkey"
            columns: ["acting_as_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_sessions_selected_facility_id_fkey"
            columns: ["selected_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "above_site_sessions_selected_facility_id_fkey"
            columns: ["selected_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "above_site_sessions_selected_facility_id_fkey"
            columns: ["selected_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          id: string
          locked_at: string
          reason: string | null
          unlock_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locked_at?: string
          reason?: string | null
          unlock_at: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locked_at?: string
          reason?: string | null
          unlock_at?: string
        }
        Relationships: []
      }
      announcement_acknowledgments: {
        Row: {
          acknowledged_at: string
          announcement_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          announcement_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          announcement_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          attachments: Json | null
          category: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          published_at: string | null
          published_by: string | null
          requires_acknowledgment: boolean | null
          target_departments: string[] | null
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          category?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          published_by?: string | null
          requires_acknowledgment?: boolean | null
          target_departments?: string[] | null
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          category?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          published_by?: string | null
          requires_acknowledgment?: boolean | null
          target_departments?: string[] | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_waitlist: {
        Row: {
          appointment_type: string
          created_at: string
          id: string
          notes: string | null
          notified_at: string | null
          patient_id: string | null
          preferred_date_from: string | null
          preferred_date_to: string | null
          preferred_time_from: string | null
          preferred_time_to: string | null
          priority: string | null
          provider_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          appointment_type: string
          created_at?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_id?: string | null
          preferred_date_from?: string | null
          preferred_date_to?: string | null
          preferred_time_from?: string | null
          preferred_time_to?: string | null
          priority?: string | null
          provider_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_id?: string | null
          preferred_date_from?: string | null
          preferred_date_to?: string | null
          preferred_time_from?: string | null
          preferred_time_to?: string | null
          priority?: string | null
          provider_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_waitlist_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          appointment_type: string
          booking_reference: string | null
          checked_in_at: string | null
          created_at: string
          created_by: string | null
          department: string | null
          encounter_id: string | null
          follow_up_created_at: string | null
          follow_up_created_by: string | null
          follow_up_needed: boolean | null
          follow_up_reason: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          missed_at: string | null
          notes: string | null
          patient_id: string | null
          priority: string | null
          provider_id: string | null
          queue_id: string | null
          queue_item_id: string | null
          reason: string | null
          recurrence_pattern: Json | null
          reminder_sent: boolean | null
          room: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_type: string
          booking_reference?: string | null
          checked_in_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          encounter_id?: string | null
          follow_up_created_at?: string | null
          follow_up_created_by?: string | null
          follow_up_needed?: boolean | null
          follow_up_reason?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          missed_at?: string | null
          notes?: string | null
          patient_id?: string | null
          priority?: string | null
          provider_id?: string | null
          queue_id?: string | null
          queue_item_id?: string | null
          reason?: string | null
          recurrence_pattern?: Json | null
          reminder_sent?: boolean | null
          room?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_type?: string
          booking_reference?: string | null
          checked_in_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          encounter_id?: string | null
          follow_up_created_at?: string | null
          follow_up_created_by?: string | null
          follow_up_needed?: boolean | null
          follow_up_reason?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          missed_at?: string | null
          notes?: string | null
          patient_id?: string | null
          priority?: string | null
          provider_id?: string | null
          queue_id?: string | null
          queue_item_id?: string | null
          reason?: string | null
          recurrence_pattern?: Json | null
          reminder_sent?: boolean | null
          room?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_matrix_config: {
        Row: {
          approval_stage: string
          conditions: Json | null
          created_at: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          required_roles: string[]
          sequence_order: number
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          approval_stage: string
          conditions?: Json | null
          created_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          required_roles: string[]
          sequence_order: number
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          approval_stage?: string
          conditions?: Json | null
          created_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          required_roles?: string[]
          sequence_order?: number
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_matrix_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_matrix_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "approval_matrix_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string
        }
        Relationships: []
      }
      bed_day_costs: {
        Row: {
          accommodation_cost: number | null
          accrual_date: string
          accrual_sequence: number
          acuity_level: string | null
          acuity_multiplier: number | null
          bed_id: string | null
          billing_event_emitted: boolean | null
          catering_cost: number | null
          cleaning_cost: number | null
          created_at: string | null
          created_by: string | null
          currency: string
          facility_id: string | null
          id: string
          is_billable: boolean | null
          linen_laundry_cost: number | null
          nursing_baseline_cost: number | null
          patient_id: string | null
          total_bed_day_cost: number
          utilities_cost: number | null
          visit_id: string
          ward_id: string | null
        }
        Insert: {
          accommodation_cost?: number | null
          accrual_date: string
          accrual_sequence?: number
          acuity_level?: string | null
          acuity_multiplier?: number | null
          bed_id?: string | null
          billing_event_emitted?: boolean | null
          catering_cost?: number | null
          cleaning_cost?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          facility_id?: string | null
          id?: string
          is_billable?: boolean | null
          linen_laundry_cost?: number | null
          nursing_baseline_cost?: number | null
          patient_id?: string | null
          total_bed_day_cost?: number
          utilities_cost?: number | null
          visit_id: string
          ward_id?: string | null
        }
        Update: {
          accommodation_cost?: number | null
          accrual_date?: string
          accrual_sequence?: number
          acuity_level?: string | null
          acuity_multiplier?: number | null
          bed_id?: string | null
          billing_event_emitted?: boolean | null
          catering_cost?: number | null
          cleaning_cost?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          facility_id?: string | null
          id?: string
          is_billable?: boolean | null
          linen_laundry_cost?: number | null
          nursing_baseline_cost?: number | null
          patient_id?: string | null
          total_bed_day_cost?: number
          utilities_cost?: number | null
          visit_id?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bed_day_costs_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bed_day_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bed_day_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "bed_day_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "bed_day_costs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bed_day_costs_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          acuity_level: string | null
          admission_date: string | null
          attending_physician: string | null
          bed_number: string
          created_at: string
          diagnosis: string | null
          id: string
          patient_id: string | null
          patient_mrn: string | null
          patient_name: string | null
          reserved_for: string | null
          status: string
          updated_at: string
          ward_id: string
          ward_name: string
        }
        Insert: {
          acuity_level?: string | null
          admission_date?: string | null
          attending_physician?: string | null
          bed_number: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          patient_id?: string | null
          patient_mrn?: string | null
          patient_name?: string | null
          reserved_for?: string | null
          status?: string
          updated_at?: string
          ward_id: string
          ward_name: string
        }
        Update: {
          acuity_level?: string | null
          admission_date?: string | null
          attending_physician?: string | null
          bed_number?: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          patient_id?: string | null
          patient_mrn?: string | null
          patient_name?: string | null
          reserved_for?: string | null
          status?: string
          updated_at?: string
          ward_id?: string
          ward_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_notifications: {
        Row: {
          created_at: string
          fulfillment_request_id: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          fulfillment_request_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          fulfillment_request_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_notifications_fulfillment_request_id_fkey"
            columns: ["fulfillment_request_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_adjustments: {
        Row: {
          account_id: string | null
          adjustment_type: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          charge_sheet_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          reason: string
          requires_approval: boolean | null
        }
        Insert: {
          account_id?: string | null
          adjustment_type: string
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          charge_sheet_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          reason: string
          requires_approval?: boolean | null
        }
        Update: {
          account_id?: string | null
          adjustment_type?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          charge_sheet_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          reason?: string
          requires_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_adjustments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_charge_sheet_id_fkey"
            columns: ["charge_sheet_id"]
            isOneToOne: false
            referencedRelation: "charge_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      birth_notifications: {
        Row: {
          birth_attendant_name: string | null
          birth_attendant_qualification: string | null
          birth_attendant_role: string | null
          birth_geo_lat: number | null
          birth_geo_lng: number | null
          birth_occurred_at: string
          birth_order: number | null
          birth_weight_grams: number | null
          child_client_id: string | null
          child_family_name: string | null
          child_given_names: string | null
          child_sex: string
          community_district: string | null
          community_province: string | null
          community_village: string | null
          community_ward: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          documents: Json | null
          encounter_id: string | null
          facility_id: string | null
          facility_room: string | null
          facility_ward: string | null
          father_acknowledged: boolean | null
          father_client_id: string | null
          father_date_of_birth: string | null
          father_education_level: string | null
          father_family_name: string | null
          father_given_names: string | null
          father_marital_status: string | null
          father_national_id: string | null
          father_occupation: string | null
          father_passport: string | null
          father_residence_district: string | null
          father_residence_province: string | null
          id: string
          is_date_estimated: boolean | null
          is_late_registration: boolean | null
          late_registration_reason: string | null
          mother_age_at_birth: number | null
          mother_client_id: string | null
          mother_date_of_birth: string | null
          mother_education_level: string | null
          mother_family_name: string
          mother_given_names: string
          mother_maiden_name: string | null
          mother_marital_status: string | null
          mother_marriage_date: string | null
          mother_national_id: string | null
          mother_occupation: string | null
          mother_passport: string | null
          mother_residence_district: string | null
          mother_residence_province: string | null
          mother_residence_village: string | null
          mother_residence_ward: string | null
          notification_number: string
          notifier_contact: string | null
          notifier_name: string
          notifier_relationship: string | null
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id: string | null
          plurality: Database["public"]["Enums"]["crvs_birth_plurality"] | null
          registered_at: string | null
          registered_by: string | null
          registration_number: string | null
          rejection_reason: string | null
          source: Database["public"]["Enums"]["crvs_notification_source"]
          status: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at: string | null
          time_of_birth: string | null
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          visit_id: string | null
        }
        Insert: {
          birth_attendant_name?: string | null
          birth_attendant_qualification?: string | null
          birth_attendant_role?: string | null
          birth_geo_lat?: number | null
          birth_geo_lng?: number | null
          birth_occurred_at: string
          birth_order?: number | null
          birth_weight_grams?: number | null
          child_client_id?: string | null
          child_family_name?: string | null
          child_given_names?: string | null
          child_sex: string
          community_district?: string | null
          community_province?: string | null
          community_village?: string | null
          community_ward?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          documents?: Json | null
          encounter_id?: string | null
          facility_id?: string | null
          facility_room?: string | null
          facility_ward?: string | null
          father_acknowledged?: boolean | null
          father_client_id?: string | null
          father_date_of_birth?: string | null
          father_education_level?: string | null
          father_family_name?: string | null
          father_given_names?: string | null
          father_marital_status?: string | null
          father_national_id?: string | null
          father_occupation?: string | null
          father_passport?: string | null
          father_residence_district?: string | null
          father_residence_province?: string | null
          id?: string
          is_date_estimated?: boolean | null
          is_late_registration?: boolean | null
          late_registration_reason?: string | null
          mother_age_at_birth?: number | null
          mother_client_id?: string | null
          mother_date_of_birth?: string | null
          mother_education_level?: string | null
          mother_family_name: string
          mother_given_names: string
          mother_maiden_name?: string | null
          mother_marital_status?: string | null
          mother_marriage_date?: string | null
          mother_national_id?: string | null
          mother_occupation?: string | null
          mother_passport?: string | null
          mother_residence_district?: string | null
          mother_residence_province?: string | null
          mother_residence_village?: string | null
          mother_residence_ward?: string | null
          notification_number: string
          notifier_contact?: string | null
          notifier_name: string
          notifier_relationship?: string | null
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id?: string | null
          plurality?: Database["public"]["Enums"]["crvs_birth_plurality"] | null
          registered_at?: string | null
          registered_by?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          source?: Database["public"]["Enums"]["crvs_notification_source"]
          status?: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at?: string | null
          time_of_birth?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id?: string | null
        }
        Update: {
          birth_attendant_name?: string | null
          birth_attendant_qualification?: string | null
          birth_attendant_role?: string | null
          birth_geo_lat?: number | null
          birth_geo_lng?: number | null
          birth_occurred_at?: string
          birth_order?: number | null
          birth_weight_grams?: number | null
          child_client_id?: string | null
          child_family_name?: string | null
          child_given_names?: string | null
          child_sex?: string
          community_district?: string | null
          community_province?: string | null
          community_village?: string | null
          community_ward?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          documents?: Json | null
          encounter_id?: string | null
          facility_id?: string | null
          facility_room?: string | null
          facility_ward?: string | null
          father_acknowledged?: boolean | null
          father_client_id?: string | null
          father_date_of_birth?: string | null
          father_education_level?: string | null
          father_family_name?: string | null
          father_given_names?: string | null
          father_marital_status?: string | null
          father_national_id?: string | null
          father_occupation?: string | null
          father_passport?: string | null
          father_residence_district?: string | null
          father_residence_province?: string | null
          id?: string
          is_date_estimated?: boolean | null
          is_late_registration?: boolean | null
          late_registration_reason?: string | null
          mother_age_at_birth?: number | null
          mother_client_id?: string | null
          mother_date_of_birth?: string | null
          mother_education_level?: string | null
          mother_family_name?: string
          mother_given_names?: string
          mother_maiden_name?: string | null
          mother_marital_status?: string | null
          mother_marriage_date?: string | null
          mother_national_id?: string | null
          mother_occupation?: string | null
          mother_passport?: string | null
          mother_residence_district?: string | null
          mother_residence_province?: string | null
          mother_residence_village?: string | null
          mother_residence_ward?: string | null
          notification_number?: string
          notifier_contact?: string | null
          notifier_name?: string
          notifier_relationship?: string | null
          notifier_role?: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id?: string | null
          plurality?: Database["public"]["Enums"]["crvs_birth_plurality"] | null
          registered_at?: string | null
          registered_by?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          source?: Database["public"]["Enums"]["crvs_notification_source"]
          status?: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at?: string | null
          time_of_birth?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birth_notifications_child_client_id_fkey"
            columns: ["child_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_notifications_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "birth_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "birth_notifications_father_client_id_fkey"
            columns: ["father_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_notifications_mother_client_id_fkey"
            columns: ["mother_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_notifications_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_count: number
          errors: Json | null
          file_name: string
          id: string
          processed_rows: number
          started_at: string | null
          status: string
          success_count: number
          table_name: string
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          errors?: Json | null
          file_name: string
          id?: string
          processed_rows?: number
          started_at?: string | null
          status?: string
          success_count?: number
          table_name: string
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          errors?: Json | null
          file_name?: string
          id?: string
          processed_rows?: number
          started_at?: string | null
          status?: string
          success_count?: number
          table_name?: string
          total_rows?: number
        }
        Relationships: []
      }
      call_ice_candidates: {
        Row: {
          candidate_data: Json
          created_at: string
          id: string
          sender_id: string
          session_id: string
        }
        Insert: {
          candidate_data: Json
          created_at?: string
          id?: string
          sender_id: string
          session_id: string
        }
        Update: {
          candidate_data?: Json
          created_at?: string
          id?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_ice_candidates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_recordings: {
        Row: {
          consent_timestamp: string
          consented_by: string[]
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          session_id: string
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          consent_timestamp: string
          consented_by: string[]
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          session_id: string
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          consent_timestamp?: string
          consented_by?: string[]
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          session_id?: string
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          connected_at: string | null
          created_at: string
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          id: string
          is_recorded: boolean | null
          metadata: Json | null
          recording_consent_given: boolean | null
          recording_path: string | null
          sdp_answer: string | null
          sdp_offer: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          connected_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          is_recorded?: boolean | null
          metadata?: Json | null
          recording_consent_given?: boolean | null
          recording_path?: string | null
          sdp_answer?: string | null
          sdp_offer?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          connected_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          is_recorded?: boolean | null
          metadata?: Json | null
          recording_consent_given?: boolean | null
          recording_path?: string | null
          sdp_answer?: string | null
          sdp_offer?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_donations: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          currency: string
          donor_id: string | null
          donor_name: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          currency?: string
          donor_id?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          currency?: string
          donor_id?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crowdfunding_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          author_id: string
          campaign_id: string
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          title: string
          update_type: string
        }
        Insert: {
          author_id: string
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          title: string
          update_type?: string
        }
        Update: {
          author_id?: string
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          title?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crowdfunding_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_items: {
        Row: {
          care_plan_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          item_type: string
          priority: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          care_plan_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type: string
          priority?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          care_plan_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          priority?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_items_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          created_at: string
          created_by: string | null
          encounter_id: string | null
          end_date: string | null
          id: string
          patient_id: string
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          end_date?: string | null
          id?: string
          patient_id: string
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          end_date?: string | null
          id?: string
          patient_id?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_reconciliations: {
        Row: {
          actual_cash: number | null
          approved_at: string | null
          approved_by: string | null
          cash_drawer_id: string | null
          cashier_id: string | null
          closing_balance: number | null
          created_at: string | null
          expected_cash: number
          facility_id: string
          id: string
          notes: string | null
          opening_balance: number | null
          reconciliation_date: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          total_receipts: number | null
          total_refunds: number | null
          transactions_count: number | null
          updated_at: string | null
          variance: number | null
          variance_explanation: string | null
        }
        Insert: {
          actual_cash?: number | null
          approved_at?: string | null
          approved_by?: string | null
          cash_drawer_id?: string | null
          cashier_id?: string | null
          closing_balance?: number | null
          created_at?: string | null
          expected_cash?: number
          facility_id: string
          id?: string
          notes?: string | null
          opening_balance?: number | null
          reconciliation_date: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_receipts?: number | null
          total_refunds?: number | null
          transactions_count?: number | null
          updated_at?: string | null
          variance?: number | null
          variance_explanation?: string | null
        }
        Update: {
          actual_cash?: number | null
          approved_at?: string | null
          approved_by?: string | null
          cash_drawer_id?: string | null
          cashier_id?: string | null
          closing_balance?: number | null
          created_at?: string | null
          expected_cash?: number
          facility_id?: string
          id?: string
          notes?: string | null
          opening_balance?: number | null
          reconciliation_date?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_receipts?: number | null
          total_refunds?: number | null
          transactions_count?: number | null
          updated_at?: string | null
          variance?: number | null
          variance_explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cash_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "message_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      charge_items: {
        Row: {
          base_price: number
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_taxable: boolean
          name: string
          stock_item_id: string | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_taxable?: boolean
          name: string
          stock_item_id?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_taxable?: boolean
          name?: string
          stock_item_id?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charge_items_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      charge_sheets: {
        Row: {
          account_id: string | null
          authorization_date: string | null
          authorization_number: string | null
          authorization_status: string | null
          billed_at: string | null
          cost_center: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          encounter_id: string | null
          facility_id: string | null
          id: string
          net_amount: number
          ordering_provider_id: string | null
          patient_id: string
          performing_provider_id: string | null
          quantity: number
          requires_authorization: boolean | null
          service_category: string | null
          service_code: string
          service_date: string
          service_name: string
          source_entity_id: string | null
          source_entity_type: string | null
          status: Database["public"]["Enums"]["charge_status"]
          total_amount: number
          unit_price: number
          visit_id: string
        }
        Insert: {
          account_id?: string | null
          authorization_date?: string | null
          authorization_number?: string | null
          authorization_status?: string | null
          billed_at?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          encounter_id?: string | null
          facility_id?: string | null
          id?: string
          net_amount: number
          ordering_provider_id?: string | null
          patient_id: string
          performing_provider_id?: string | null
          quantity?: number
          requires_authorization?: boolean | null
          service_category?: string | null
          service_code: string
          service_date?: string
          service_name: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          total_amount: number
          unit_price: number
          visit_id: string
        }
        Update: {
          account_id?: string | null
          authorization_date?: string | null
          authorization_number?: string | null
          authorization_status?: string | null
          billed_at?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          encounter_id?: string | null
          facility_id?: string | null
          id?: string
          net_amount?: number
          ordering_provider_id?: string | null
          patient_id?: string
          performing_provider_id?: string | null
          quantity?: number
          requires_authorization?: boolean | null
          service_category?: string | null
          service_code?: string
          service_date?: string
          service_name?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          total_amount?: number
          unit_price?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charge_sheets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_sheets_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_sheets_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_sheets_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "charge_sheets_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "charge_sheets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charge_sheets_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_line_items: {
        Row: {
          adjudication_code: string | null
          adjudication_reason: string | null
          adjudication_status: string | null
          approved_amount: number | null
          charge_sheet_id: string | null
          claim_id: string
          claimed_amount: number
          created_at: string | null
          denied_amount: number | null
          id: string
          line_number: number
          primary_diagnosis_code: string | null
          quantity: number
          rendering_provider_id: string | null
          rendering_provider_npi: string | null
          secondary_diagnosis_codes: string[] | null
          service_code: string
          service_date: string
          service_description: string
          unit_price: number
        }
        Insert: {
          adjudication_code?: string | null
          adjudication_reason?: string | null
          adjudication_status?: string | null
          approved_amount?: number | null
          charge_sheet_id?: string | null
          claim_id: string
          claimed_amount: number
          created_at?: string | null
          denied_amount?: number | null
          id?: string
          line_number: number
          primary_diagnosis_code?: string | null
          quantity?: number
          rendering_provider_id?: string | null
          rendering_provider_npi?: string | null
          secondary_diagnosis_codes?: string[] | null
          service_code: string
          service_date: string
          service_description: string
          unit_price: number
        }
        Update: {
          adjudication_code?: string | null
          adjudication_reason?: string | null
          adjudication_status?: string | null
          approved_amount?: number | null
          charge_sheet_id?: string | null
          claim_id?: string
          claimed_amount?: number
          created_at?: string | null
          denied_amount?: number | null
          id?: string
          line_number?: number
          primary_diagnosis_code?: string | null
          quantity?: number
          rendering_provider_id?: string | null
          rendering_provider_npi?: string | null
          secondary_diagnosis_codes?: string[] | null
          service_code?: string
          service_date?: string
          service_description?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "claim_line_items_charge_sheet_id_fkey"
            columns: ["charge_sheet_id"]
            isOneToOne: false
            referencedRelation: "charge_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_line_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          account_id: string | null
          acknowledgment_date: string | null
          adjudication_date: string | null
          amount_paid: number | null
          appeal_date: string | null
          appeal_reason: string | null
          appeal_status: string | null
          authorization_number: string | null
          claim_number: string
          claim_type: Database["public"]["Enums"]["claim_type"]
          created_at: string | null
          created_by: string | null
          currency: string
          denial_codes: string[] | null
          denial_reason: string | null
          facility_id: string | null
          group_number: string | null
          id: string
          internal_notes: string | null
          is_appealed: boolean | null
          member_id: string | null
          notes: string | null
          paid_date: string | null
          patient_id: string
          patient_responsibility: number | null
          payer_code: string | null
          payer_id: string | null
          payer_name: string
          payment_reference: string | null
          processing_date: string | null
          remittance_advice_id: string | null
          status: Database["public"]["Enums"]["claim_status"]
          submission_date: string | null
          submission_method: string | null
          submission_reference: string | null
          submitted_at: string | null
          submitted_by: string | null
          total_approved: number | null
          total_claimed: number
          total_denied: number | null
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          account_id?: string | null
          acknowledgment_date?: string | null
          adjudication_date?: string | null
          amount_paid?: number | null
          appeal_date?: string | null
          appeal_reason?: string | null
          appeal_status?: string | null
          authorization_number?: string | null
          claim_number: string
          claim_type: Database["public"]["Enums"]["claim_type"]
          created_at?: string | null
          created_by?: string | null
          currency?: string
          denial_codes?: string[] | null
          denial_reason?: string | null
          facility_id?: string | null
          group_number?: string | null
          id?: string
          internal_notes?: string | null
          is_appealed?: boolean | null
          member_id?: string | null
          notes?: string | null
          paid_date?: string | null
          patient_id: string
          patient_responsibility?: number | null
          payer_code?: string | null
          payer_id?: string | null
          payer_name: string
          payment_reference?: string | null
          processing_date?: string | null
          remittance_advice_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          submission_date?: string | null
          submission_method?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          total_approved?: number | null
          total_claimed?: number
          total_denied?: number | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          account_id?: string | null
          acknowledgment_date?: string | null
          adjudication_date?: string | null
          amount_paid?: number | null
          appeal_date?: string | null
          appeal_reason?: string | null
          appeal_status?: string | null
          authorization_number?: string | null
          claim_number?: string
          claim_type?: Database["public"]["Enums"]["claim_type"]
          created_at?: string | null
          created_by?: string | null
          currency?: string
          denial_codes?: string[] | null
          denial_reason?: string | null
          facility_id?: string | null
          group_number?: string | null
          id?: string
          internal_notes?: string | null
          is_appealed?: boolean | null
          member_id?: string | null
          notes?: string | null
          paid_date?: string | null
          patient_id?: string
          patient_responsibility?: number | null
          payer_code?: string | null
          payer_id?: string | null
          payer_name?: string
          payment_reference?: string | null
          processing_date?: string | null
          remittance_advice_id?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          submission_date?: string | null
          submission_method?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          total_approved?: number | null
          total_claimed?: number
          total_denied?: number | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "claims_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      clearance_checklist_templates: {
        Row: {
          checklist_items: Json
          clearance_type: Database["public"]["Enums"]["clearance_type"]
          created_at: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          checklist_items?: Json
          clearance_type: Database["public"]["Enums"]["clearance_type"]
          created_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          checklist_items?: Json
          clearance_type?: Database["public"]["Enums"]["clearance_type"]
          created_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clearance_checklist_templates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_checklist_templates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "clearance_checklist_templates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      client_duplicate_queue: {
        Row: {
          client_a_id: string
          client_b_id: string
          created_at: string | null
          id: string
          match_method: string | null
          match_reasons: Json | null
          match_score: number
          merged_at: string | null
          merged_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          surviving_client_id: string | null
        }
        Insert: {
          client_a_id: string
          client_b_id: string
          created_at?: string | null
          id?: string
          match_method?: string | null
          match_reasons?: Json | null
          match_score: number
          merged_at?: string | null
          merged_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          surviving_client_id?: string | null
        }
        Update: {
          client_a_id?: string
          client_b_id?: string
          created_at?: string | null
          id?: string
          match_method?: string | null
          match_reasons?: Json | null
          match_score?: number
          merged_at?: string | null
          merged_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          surviving_client_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_duplicate_queue_client_a_id_fkey"
            columns: ["client_a_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_duplicate_queue_client_b_id_fkey"
            columns: ["client_b_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_duplicate_queue_surviving_client_id_fkey"
            columns: ["surviving_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      client_follow_up_queues: {
        Row: {
          client_response: string | null
          client_response_at: string | null
          created_at: string | null
          created_by: string
          encounter_id: string | null
          follow_up_type: string
          id: string
          is_virtual: boolean | null
          metadata: Json | null
          notes: string | null
          notification_sent_at: string | null
          patient_id: string
          queue_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          trigger_event: string | null
          trigger_resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_response?: string | null
          client_response_at?: string | null
          created_at?: string | null
          created_by: string
          encounter_id?: string | null
          follow_up_type: string
          id?: string
          is_virtual?: boolean | null
          metadata?: Json | null
          notes?: string | null
          notification_sent_at?: string | null
          patient_id: string
          queue_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          trigger_event?: string | null
          trigger_resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_response?: string | null
          client_response_at?: string | null
          created_at?: string | null
          created_by?: string
          encounter_id?: string | null
          follow_up_type?: string
          id?: string
          is_virtual?: boolean | null
          metadata?: Json | null
          notes?: string | null
          notification_sent_at?: string | null
          patient_id?: string
          queue_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          trigger_event?: string | null
          trigger_resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_follow_up_queues_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_follow_up_queues_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_follow_up_queues_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_identifiers: {
        Row: {
          assigning_authority: string | null
          client_id: string
          confidence:
            | Database["public"]["Enums"]["identifier_confidence"]
            | null
          created_at: string | null
          created_by: string | null
          expiry_date: string | null
          id: string
          identifier_type: string
          identifier_value: string
          issue_date: string | null
          source_system: string | null
          status: string | null
          updated_at: string | null
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigning_authority?: string | null
          client_id: string
          confidence?:
            | Database["public"]["Enums"]["identifier_confidence"]
            | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          identifier_type: string
          identifier_value: string
          issue_date?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigning_authority?: string | null
          client_id?: string
          confidence?:
            | Database["public"]["Enums"]["identifier_confidence"]
            | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          identifier_type?: string
          identifier_value?: string
          issue_date?: string | null
          source_system?: string | null
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_identifiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      client_matching_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          fields: Json
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: string
          threshold: number | null
          updated_at: string | null
          version: number | null
          weights: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fields: Json
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: string
          threshold?: number | null
          updated_at?: string | null
          version?: number | null
          weights?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          threshold?: number | null
          updated_at?: string | null
          version?: number | null
          weights?: Json | null
        }
        Relationships: []
      }
      client_merge_history: {
        Row: {
          can_unmerge: boolean | null
          id: string
          identifiers_transferred: Json | null
          merge_method: string | null
          merge_reason: string | null
          merged_at: string | null
          merged_by: string | null
          merged_client_health_id: string
          merged_client_id: string
          merged_data: Json
          relationships_transferred: Json | null
          surviving_client_id: string
          unmerged_at: string | null
          unmerged_by: string | null
        }
        Insert: {
          can_unmerge?: boolean | null
          id?: string
          identifiers_transferred?: Json | null
          merge_method?: string | null
          merge_reason?: string | null
          merged_at?: string | null
          merged_by?: string | null
          merged_client_health_id: string
          merged_client_id: string
          merged_data: Json
          relationships_transferred?: Json | null
          surviving_client_id: string
          unmerged_at?: string | null
          unmerged_by?: string | null
        }
        Update: {
          can_unmerge?: boolean | null
          id?: string
          identifiers_transferred?: Json | null
          merge_method?: string | null
          merge_reason?: string | null
          merged_at?: string | null
          merged_by?: string | null
          merged_client_health_id?: string
          merged_client_id?: string
          merged_data?: Json
          relationships_transferred?: Json | null
          surviving_client_id?: string
          unmerged_at?: string | null
          unmerged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_merge_history_surviving_client_id_fkey"
            columns: ["surviving_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      client_queue_notifications: {
        Row: {
          acknowledged_at: string | null
          action_completed_at: string | null
          action_deadline: string | null
          action_type: string | null
          appointment_id: string | null
          channel: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          patient_id: string
          priority: string | null
          queue_item_id: string | null
          read_at: string | null
          requires_action: boolean | null
          response_data: Json | null
          sent_at: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_completed_at?: string | null
          action_deadline?: string | null
          action_type?: string | null
          appointment_id?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          patient_id: string
          priority?: string | null
          queue_item_id?: string | null
          read_at?: string | null
          requires_action?: boolean | null
          response_data?: Json | null
          sent_at?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          action_completed_at?: string | null
          action_deadline?: string | null
          action_type?: string | null
          appointment_id?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          patient_id?: string
          priority?: string | null
          queue_item_id?: string | null
          read_at?: string | null
          requires_action?: boolean | null
          response_data?: Json | null
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_queue_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_notifications_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_queue_requests: {
        Row: {
          appointment_id: string | null
          arrival_confirmed_at: string | null
          consent_captured: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          facility_id: string
          id: string
          metadata: Json | null
          patient_id: string
          priority_requested: string | null
          queue_id: string | null
          queue_item_id: string | null
          reason_for_visit: string | null
          rejection_reason: string | null
          requested_date: string
          requested_time_from: string | null
          requested_time_to: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          arrival_confirmed_at?: string | null
          consent_captured?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          facility_id: string
          id?: string
          metadata?: Json | null
          patient_id: string
          priority_requested?: string | null
          queue_id?: string | null
          queue_item_id?: string | null
          reason_for_visit?: string | null
          rejection_reason?: string | null
          requested_date: string
          requested_time_from?: string | null
          requested_time_to?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          arrival_confirmed_at?: string | null
          consent_captured?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          facility_id?: string
          id?: string
          metadata?: Json | null
          patient_id?: string
          priority_requested?: string | null
          queue_id?: string | null
          queue_item_id?: string | null
          reason_for_visit?: string | null
          rejection_reason?: string | null
          requested_date?: string
          requested_time_from?: string | null
          requested_time_to?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_queue_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "client_queue_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "client_queue_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_requests_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_queue_requests_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_registry: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          biometric_enrolled: boolean | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deceased_confirmed: boolean | null
          deceased_date: string | null
          deceased_source: string | null
          district: string | null
          dob_confidence: string | null
          duplicate_flag: boolean | null
          email: string | null
          estimated_dob: boolean | null
          family_name: string
          given_names: string
          health_id: string
          id: string
          last_modified_by: string | null
          last_verified_at: string | null
          lifecycle_state:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          lifecycle_state_changed_at: string | null
          lifecycle_state_changed_by: string | null
          lifecycle_state_reason: string | null
          matching_score: number | null
          merged_at: string | null
          merged_by: string | null
          merged_into_id: string | null
          nationality: string | null
          other_names: string | null
          phone_primary: string | null
          phone_secondary: string | null
          place_of_birth: string | null
          postal_code: string | null
          province: string | null
          sex: string
          source_facility_id: string | null
          source_system: string | null
          updated_at: string | null
          verification_source: string | null
          version_id: number | null
          village: string | null
          ward: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deceased_confirmed?: boolean | null
          deceased_date?: string | null
          deceased_source?: string | null
          district?: string | null
          dob_confidence?: string | null
          duplicate_flag?: boolean | null
          email?: string | null
          estimated_dob?: boolean | null
          family_name: string
          given_names: string
          health_id: string
          id?: string
          last_modified_by?: string | null
          last_verified_at?: string | null
          lifecycle_state?:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          lifecycle_state_changed_at?: string | null
          lifecycle_state_changed_by?: string | null
          lifecycle_state_reason?: string | null
          matching_score?: number | null
          merged_at?: string | null
          merged_by?: string | null
          merged_into_id?: string | null
          nationality?: string | null
          other_names?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          province?: string | null
          sex: string
          source_facility_id?: string | null
          source_system?: string | null
          updated_at?: string | null
          verification_source?: string | null
          version_id?: number | null
          village?: string | null
          ward?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deceased_confirmed?: boolean | null
          deceased_date?: string | null
          deceased_source?: string | null
          district?: string | null
          dob_confidence?: string | null
          duplicate_flag?: boolean | null
          email?: string | null
          estimated_dob?: boolean | null
          family_name?: string
          given_names?: string
          health_id?: string
          id?: string
          last_modified_by?: string | null
          last_verified_at?: string | null
          lifecycle_state?:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          lifecycle_state_changed_at?: string | null
          lifecycle_state_changed_by?: string | null
          lifecycle_state_reason?: string | null
          matching_score?: number | null
          merged_at?: string | null
          merged_by?: string | null
          merged_into_id?: string | null
          nationality?: string | null
          other_names?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          place_of_birth?: string | null
          postal_code?: string | null
          province?: string | null
          sex?: string
          source_facility_id?: string | null
          source_system?: string | null
          updated_at?: string | null
          verification_source?: string | null
          version_id?: number | null
          village?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_registry_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      client_registry_events: {
        Row: {
          client_id: string
          created_at: string | null
          event_data: Json | null
          event_type: string
          health_id: string
          id: string
          processed_by_consent: boolean | null
          processed_by_iam: boolean | null
          processed_by_ndr: boolean | null
          processed_by_shr: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          health_id: string
          id?: string
          processed_by_consent?: boolean | null
          processed_by_iam?: boolean | null
          processed_by_ndr?: boolean | null
          processed_by_shr?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          health_id?: string
          id?: string
          processed_by_consent?: boolean | null
          processed_by_iam?: boolean | null
          processed_by_ndr?: boolean | null
          processed_by_shr?: boolean | null
        }
        Relationships: []
      }
      client_registry_records: {
        Row: {
          address_line1: string | null
          approved_at: string | null
          approved_by: string | null
          biometric_enrolled: boolean | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          city: string | null
          client_registry_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string
          email: string | null
          first_name: string
          gender: string
          id: string
          impilo_id: string | null
          last_modified_by: string | null
          last_name: string
          mosip_uin: string | null
          national_id: string | null
          other_names: string | null
          passport_number: string | null
          patient_id: string | null
          phone: string | null
          province: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shr_id: string | null
          status: Database["public"]["Enums"]["registry_record_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          city?: string | null
          client_registry_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          first_name: string
          gender: string
          id?: string
          impilo_id?: string | null
          last_modified_by?: string | null
          last_name: string
          mosip_uin?: string | null
          national_id?: string | null
          other_names?: string | null
          passport_number?: string | null
          patient_id?: string | null
          phone?: string | null
          province?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shr_id?: string | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          city?: string | null
          client_registry_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          first_name?: string
          gender?: string
          id?: string
          impilo_id?: string | null
          last_modified_by?: string | null
          last_name?: string
          mosip_uin?: string | null
          national_id?: string | null
          other_names?: string | null
          passport_number?: string | null
          patient_id?: string | null
          phone?: string | null
          province?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shr_id?: string | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_registry_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_relationships: {
        Row: {
          client_id: string
          consent_relevance: boolean | null
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean | null
          legal_relevance: boolean | null
          related_client_id: string | null
          related_person_name: string | null
          related_person_phone: string | null
          relationship_description: string | null
          relationship_type: Database["public"]["Enums"]["client_relationship_type"]
          updated_at: string | null
        }
        Insert: {
          client_id: string
          consent_relevance?: boolean | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          legal_relevance?: boolean | null
          related_client_id?: string | null
          related_person_name?: string | null
          related_person_phone?: string | null
          relationship_description?: string | null
          relationship_type: Database["public"]["Enums"]["client_relationship_type"]
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          consent_relevance?: boolean | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          legal_relevance?: boolean | null
          related_client_id?: string | null
          related_person_name?: string | null
          related_person_phone?: string | null
          relationship_description?: string | null
          relationship_type?: Database["public"]["Enums"]["client_relationship_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_relationships_related_client_id_fkey"
            columns: ["related_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      client_state_transitions: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          client_id: string
          from_state:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          id: string
          reason: string | null
          to_state: Database["public"]["Enums"]["client_lifecycle_state"]
          triggered_by: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          client_id: string
          from_state?:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          id?: string
          reason?: string | null
          to_state: Database["public"]["Enums"]["client_lifecycle_state"]
          triggered_by?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          client_id?: string
          from_state?:
            | Database["public"]["Enums"]["client_lifecycle_state"]
            | null
          id?: string
          reason?: string | null
          to_state?: Database["public"]["Enums"]["client_lifecycle_state"]
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_state_transitions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          encounter_id: string | null
          expires_at: string | null
          id: string
          is_acknowledged: boolean | null
          is_resolved: boolean | null
          message: string
          patient_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          source_id: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          encounter_id?: string | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_resolved?: boolean | null
          message: string
          patient_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          source_id?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          encounter_id?: string | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_resolved?: boolean | null
          message?: string
          patient_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          source_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_alerts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          access_restrictions: string[] | null
          amended_sections: string[] | null
          amendment_reason: string | null
          author_id: string | null
          author_name: string | null
          author_role: string | null
          authoring_facility_id: string | null
          authoring_facility_name: string | null
          co_signers: Json | null
          content_fhir: Json | null
          content_json: Json | null
          created_at: string
          document_number: string
          document_subtype: string | null
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id: string | null
          finalized_at: string | null
          html_content: string | null
          id: string
          loinc_code: string | null
          loinc_display: string | null
          patient_friendly_html: string | null
          patient_friendly_pdf_path: string | null
          patient_id: string
          pdf_path: string | null
          previous_version_id: string | null
          share_token: string | null
          share_token_expires_at: string | null
          signature_hash: string | null
          signed_at: string | null
          signed_by: string | null
          signed_by_name: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          version: number
          visit_id: string | null
        }
        Insert: {
          access_restrictions?: string[] | null
          amended_sections?: string[] | null
          amendment_reason?: string | null
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          authoring_facility_id?: string | null
          authoring_facility_name?: string | null
          co_signers?: Json | null
          content_fhir?: Json | null
          content_json?: Json | null
          created_at?: string
          document_number: string
          document_subtype?: string | null
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id?: string | null
          finalized_at?: string | null
          html_content?: string | null
          id?: string
          loinc_code?: string | null
          loinc_display?: string | null
          patient_friendly_html?: string | null
          patient_friendly_pdf_path?: string | null
          patient_id: string
          pdf_path?: string | null
          previous_version_id?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          signed_by?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          version?: number
          visit_id?: string | null
        }
        Update: {
          access_restrictions?: string[] | null
          amended_sections?: string[] | null
          amendment_reason?: string | null
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          authoring_facility_id?: string | null
          authoring_facility_name?: string | null
          co_signers?: Json | null
          content_fhir?: Json | null
          content_json?: Json | null
          created_at?: string
          document_number?: string
          document_subtype?: string | null
          document_type?: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id?: string | null
          finalized_at?: string | null
          html_content?: string | null
          id?: string
          loinc_code?: string | null
          loinc_display?: string | null
          patient_friendly_html?: string | null
          patient_friendly_pdf_path?: string | null
          patient_id?: string
          pdf_path?: string | null
          previous_version_id?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          signature_hash?: string | null
          signed_at?: string | null
          signed_by?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          version?: number
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_authoring_facility_id_fkey"
            columns: ["authoring_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_authoring_facility_id_fkey"
            columns: ["authoring_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "clinical_documents_authoring_facility_id_fkey"
            columns: ["authoring_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "clinical_documents_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      clinical_notes: {
        Row: {
          assessment: string | null
          author_id: string | null
          content: string | null
          created_at: string
          encounter_id: string
          id: string
          is_signed: boolean | null
          note_type: string
          objective: string | null
          plan: string | null
          signed_at: string | null
          signed_by: string | null
          subjective: string | null
          updated_at: string
        }
        Insert: {
          assessment?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string
          encounter_id: string
          id?: string
          is_signed?: boolean | null
          note_type?: string
          objective?: string | null
          plan?: string | null
          signed_at?: string | null
          signed_by?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Update: {
          assessment?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string
          encounter_id?: string
          id?: string
          is_signed?: boolean | null
          note_type?: string
          objective?: string | null
          plan?: string | null
          signed_at?: string | null
          signed_by?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          details: Json | null
          encounter_id: string | null
          id: string
          instructions: string | null
          order_name: string
          order_type: string
          ordered_at: string
          ordered_by: string | null
          patient_id: string
          priority: string
          quantity: number
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          details?: Json | null
          encounter_id?: string | null
          id?: string
          instructions?: string | null
          order_name: string
          order_type: string
          ordered_at?: string
          ordered_by?: string | null
          patient_id: string
          priority?: string
          quantity?: number
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          details?: Json | null
          encounter_id?: string | null
          id?: string
          instructions?: string | null
          order_name?: string
          order_type?: string
          ordered_at?: string
          ordered_by?: string | null
          patient_id?: string
          priority?: string
          quantity?: number
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_pages: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          callback_number: string | null
          created_at: string
          department: string | null
          encounter_id: string | null
          escalated_to: string | null
          escalation_level: number | null
          expires_at: string | null
          id: string
          location: string | null
          message: string
          page_number: string
          page_type: string
          patient_id: string | null
          priority: string
          recipient_id: string | null
          recipient_role: string | null
          response_notes: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          callback_number?: string | null
          created_at?: string
          department?: string | null
          encounter_id?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          message: string
          page_number: string
          page_type?: string
          patient_id?: string | null
          priority?: string
          recipient_id?: string | null
          recipient_role?: string | null
          response_notes?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          callback_number?: string | null
          created_at?: string
          department?: string | null
          encounter_id?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          message?: string
          page_number?: string
          page_type?: string
          patient_id?: string | null
          priority?: string
          recipient_id?: string | null
          recipient_role?: string | null
          response_notes?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_pages_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_pages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          is_banned: boolean | null
          is_muted: boolean | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          activity_count: number | null
          avatar_url: string | null
          category: string
          club_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          has_challenges: boolean | null
          has_events: boolean | null
          has_leaderboard: boolean | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          member_count: number | null
          name: string
          organizer_page_id: string | null
          privacy: string
          rules: Json | null
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          activity_count?: number | null
          avatar_url?: string | null
          category?: string
          club_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          has_challenges?: boolean | null
          has_events?: boolean | null
          has_leaderboard?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          name: string
          organizer_page_id?: string | null
          privacy?: string
          rules?: Json | null
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          activity_count?: number | null
          avatar_url?: string | null
          category?: string
          club_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          has_challenges?: boolean | null
          has_events?: boolean | null
          has_leaderboard?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          name?: string
          organizer_page_id?: string | null
          privacy?: string
          rules?: Json | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_organizer_page_id_fkey"
            columns: ["organizer_page_id"]
            isOneToOne: false
            referencedRelation: "professional_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_verified: boolean | null
          member_count: number | null
          name: string
          post_count: number | null
          privacy: string
          rules: Json | null
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          member_count?: number | null
          name: string
          post_count?: number | null
          privacy?: string
          rules?: Json | null
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          member_count?: number | null
          name?: string
          post_count?: number | null
          privacy?: string
          rules?: Json | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      community_invites: {
        Row: {
          community_id: string
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          invite_code: string | null
          invited_by: string
          invited_user_id: string | null
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string | null
          invited_by: string
          invited_user_id?: string | null
          status?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string | null
          invited_by?: string
          invited_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          is_banned: boolean | null
          is_muted: boolean | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          is_banned?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      consumable_usage: {
        Row: {
          administered_at: string
          administered_by: string | null
          batch_number: string | null
          charge_id: string | null
          encounter_id: string
          id: string
          location_id: string
          notes: string | null
          quantity: number
          stock_item_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          batch_number?: string | null
          charge_id?: string | null
          encounter_id: string
          id?: string
          location_id: string
          notes?: string | null
          quantity: number
          stock_item_id: string
          total_cost: number
          unit_cost: number
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          batch_number?: string | null
          charge_id?: string | null
          encounter_id?: string
          id?: string
          location_id?: string
          notes?: string | null
          quantity?: number
          stock_item_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumable_usage_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "encounter_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_usage_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_usage_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumable_usage_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      controlled_substance_log: {
        Row: {
          action: string
          batch_number: string | null
          created_at: string
          dea_schedule: string
          discrepancy_notes: string | null
          id: string
          inventory_after: number | null
          inventory_before: number | null
          location: string | null
          medication_name: string
          patient_id: string | null
          performed_by: string
          prescription_item_id: string | null
          quantity: number
          quantity_unit: string
          reason: string | null
          witness_required: boolean | null
          witnessed_by: string | null
        }
        Insert: {
          action: string
          batch_number?: string | null
          created_at?: string
          dea_schedule: string
          discrepancy_notes?: string | null
          id?: string
          inventory_after?: number | null
          inventory_before?: number | null
          location?: string | null
          medication_name: string
          patient_id?: string | null
          performed_by: string
          prescription_item_id?: string | null
          quantity: number
          quantity_unit: string
          reason?: string | null
          witness_required?: boolean | null
          witnessed_by?: string | null
        }
        Update: {
          action?: string
          batch_number?: string | null
          created_at?: string
          dea_schedule?: string
          discrepancy_notes?: string | null
          id?: string
          inventory_after?: number | null
          inventory_before?: number | null
          location?: string | null
          medication_name?: string
          patient_id?: string | null
          performed_by?: string
          prescription_item_id?: string | null
          quantity?: number
          quantity_unit?: string
          reason?: string | null
          witness_required?: boolean | null
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "controlled_substance_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controlled_substance_log_prescription_item_id_fkey"
            columns: ["prescription_item_id"]
            isOneToOne: false
            referencedRelation: "prescription_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_events: {
        Row: {
          billing_event_emitted: boolean | null
          cost_breakdown: Json
          created_at: string | null
          created_by: string | null
          currency: string
          duration_minutes: number | null
          encounter_id: string | null
          event_timestamp: string
          event_type: Database["public"]["Enums"]["cost_event_type"]
          facility_id: string | null
          id: string
          is_billable: boolean | null
          notes: string | null
          patient_id: string | null
          source_entity_id: string
          source_entity_type: string
          staff_id: string | null
          staff_role: string | null
          total_internal_cost: number
          visit_id: string | null
          workspace_id: string | null
        }
        Insert: {
          billing_event_emitted?: boolean | null
          cost_breakdown?: Json
          created_at?: string | null
          created_by?: string | null
          currency?: string
          duration_minutes?: number | null
          encounter_id?: string | null
          event_timestamp?: string
          event_type: Database["public"]["Enums"]["cost_event_type"]
          facility_id?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          patient_id?: string | null
          source_entity_id: string
          source_entity_type: string
          staff_id?: string | null
          staff_role?: string | null
          total_internal_cost?: number
          visit_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          billing_event_emitted?: boolean | null
          cost_breakdown?: Json
          created_at?: string | null
          created_by?: string | null
          currency?: string
          duration_minutes?: number | null
          encounter_id?: string | null
          event_timestamp?: string
          event_type?: Database["public"]["Enums"]["cost_event_type"]
          facility_id?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          patient_id?: string | null
          source_entity_id?: string
          source_entity_type?: string
          staff_id?: string | null
          staff_role?: string | null
          total_internal_cost?: number
          visit_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_events_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cost_events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cost_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_rates: {
        Row: {
          category: Database["public"]["Enums"]["cost_category"]
          cost_per_unit: number
          created_at: string | null
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          resource_type: string
          unit_of_measure: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["cost_category"]
          cost_per_unit: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          resource_type: string
          unit_of_measure: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["cost_category"]
          cost_per_unit?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          resource_type?: string
          unit_of_measure?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_rates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_rates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cost_rates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      council_administrators: {
        Row: {
          appointed_at: string
          appointed_by: string | null
          can_approve_registrations: boolean | null
          can_suspend_providers: boolean | null
          can_verify_licenses: boolean | null
          council_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          appointed_at?: string
          appointed_by?: string | null
          can_approve_registrations?: boolean | null
          can_suspend_providers?: boolean | null
          can_verify_licenses?: boolean | null
          council_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id: string
        }
        Update: {
          appointed_at?: string
          appointed_by?: string | null
          can_approve_registrations?: boolean | null
          can_suspend_providers?: boolean | null
          can_verify_licenses?: boolean | null
          council_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_administrators_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "professional_councils"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_requests: {
        Row: {
          cover_date: string
          created_at: string
          end_time: string | null
          expires_at: string | null
          facility_id: string
          id: string
          pool_id: string | null
          reason: string
          requester_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shift_definition_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["cover_request_status"]
          temporary_assignment_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          cover_date: string
          created_at?: string
          end_time?: string | null
          expires_at?: string | null
          facility_id: string
          id?: string
          pool_id?: string | null
          reason: string
          requester_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_definition_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["cover_request_status"]
          temporary_assignment_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          cover_date?: string
          created_at?: string
          end_time?: string | null
          expires_at?: string | null
          facility_id?: string
          id?: string
          pool_id?: string | null
          reason?: string
          requester_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_definition_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["cover_request_status"]
          temporary_assignment_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cover_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "cover_requests_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_shift_definition_id_fkey"
            columns: ["shift_definition_id"]
            isOneToOne: false
            referencedRelation: "shift_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_temporary_assignment_id_fkey"
            columns: ["temporary_assignment_id"]
            isOneToOne: false
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_rules: {
        Row: {
          applies_to_days: number[] | null
          created_at: string
          facility_id: string
          id: string
          is_active: boolean | null
          min_staff_count: number
          pool_id: string | null
          required_cadres: string[] | null
          shift_definition_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          applies_to_days?: number[] | null
          created_at?: string
          facility_id: string
          id?: string
          is_active?: boolean | null
          min_staff_count?: number
          pool_id?: string | null
          required_cadres?: string[] | null
          shift_definition_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          applies_to_days?: number[] | null
          created_at?: string
          facility_id?: string
          id?: string
          is_active?: boolean | null
          min_staff_count?: number
          pool_id?: string | null
          required_cadres?: string[] | null
          shift_definition_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_rules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_rules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "coverage_rules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "coverage_rules_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_rules_shift_definition_id_fkey"
            columns: ["shift_definition_id"]
            isOneToOne: false
            referencedRelation: "shift_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cpd_requirements: {
        Row: {
          cadre: string
          categories: Json | null
          council_id: string | null
          created_at: string
          cycle_years: number
          id: string
          is_active: boolean | null
          points_required: number
          updated_at: string
        }
        Insert: {
          cadre: string
          categories?: Json | null
          council_id?: string | null
          created_at?: string
          cycle_years?: number
          id?: string
          is_active?: boolean | null
          points_required?: number
          updated_at?: string
        }
        Update: {
          cadre?: string
          categories?: Json | null
          council_id?: string | null
          created_at?: string
          cycle_years?: number
          id?: string
          is_active?: boolean | null
          points_required?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_requirements_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "professional_councils"
            referencedColumns: ["id"]
          },
        ]
      }
      crowdfunding_campaigns: {
        Row: {
          beneficiary_id: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string
          documents: Json | null
          donor_count: number | null
          end_date: string | null
          goal_amount: number
          hospital_facility_id: string | null
          id: string
          is_featured: boolean | null
          is_urgent: boolean | null
          is_verified: boolean | null
          location: string | null
          medical_condition: string | null
          organizer_id: string
          raised_amount: number | null
          slug: string
          status: string
          story: string | null
          tags: string[] | null
          title: string
          updated_at: string
          updates: Json | null
        }
        Insert: {
          beneficiary_id?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description: string
          documents?: Json | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount: number
          hospital_facility_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_urgent?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          medical_condition?: string | null
          organizer_id: string
          raised_amount?: number | null
          slug: string
          status?: string
          story?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updates?: Json | null
        }
        Update: {
          beneficiary_id?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          documents?: Json | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number
          hospital_facility_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_urgent?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          medical_condition?: string | null
          organizer_id?: string
          raised_amount?: number | null
          slug?: string
          status?: string
          story?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updates?: Json | null
        }
        Relationships: []
      }
      crvs_audit_log: {
        Row: {
          action: string
          action_data: Json | null
          id: string
          ip_address: unknown
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          action_data?: Json | null
          id?: string
          ip_address?: unknown
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          action_data?: Json | null
          id?: string
          ip_address?: unknown
          notification_id?: string
          notification_type?: Database["public"]["Enums"]["crvs_notification_type"]
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      crvs_certificates: {
        Row: {
          amendment_date: string | null
          amendment_reason: string | null
          approved_at: string | null
          approved_by: string | null
          certificate_number: string | null
          certificate_type: Database["public"]["Enums"]["crvs_notification_type"]
          collected_at: string | null
          collected_by: string | null
          collection_id_presented: string | null
          created_at: string | null
          id: string
          is_amended: boolean | null
          issued_at: string | null
          issued_by: string | null
          issued_to: string | null
          notification_id: string
          previous_certificate_id: string | null
          print_queue_position: number | null
          printed_at: string | null
          printed_by: string | null
          registration_number: string
          requested_at: string | null
          requested_by: string | null
          requestor_contact: string | null
          requestor_name: string | null
          requestor_relationship: string | null
          status: Database["public"]["Enums"]["crvs_certificate_status"]
          updated_at: string | null
        }
        Insert: {
          amendment_date?: string | null
          amendment_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_number?: string | null
          certificate_type: Database["public"]["Enums"]["crvs_notification_type"]
          collected_at?: string | null
          collected_by?: string | null
          collection_id_presented?: string | null
          created_at?: string | null
          id?: string
          is_amended?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          issued_to?: string | null
          notification_id: string
          previous_certificate_id?: string | null
          print_queue_position?: number | null
          printed_at?: string | null
          printed_by?: string | null
          registration_number: string
          requested_at?: string | null
          requested_by?: string | null
          requestor_contact?: string | null
          requestor_name?: string | null
          requestor_relationship?: string | null
          status?: Database["public"]["Enums"]["crvs_certificate_status"]
          updated_at?: string | null
        }
        Update: {
          amendment_date?: string | null
          amendment_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_number?: string | null
          certificate_type?: Database["public"]["Enums"]["crvs_notification_type"]
          collected_at?: string | null
          collected_by?: string | null
          collection_id_presented?: string | null
          created_at?: string | null
          id?: string
          is_amended?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          issued_to?: string | null
          notification_id?: string
          previous_certificate_id?: string | null
          print_queue_position?: number | null
          printed_at?: string | null
          printed_by?: string | null
          registration_number?: string
          requested_at?: string | null
          requested_by?: string | null
          requestor_contact?: string | null
          requestor_name?: string | null
          requestor_relationship?: string | null
          status?: Database["public"]["Enums"]["crvs_certificate_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      crvs_community_submissions: {
        Row: {
          captured_at: string
          captured_lat: number | null
          captured_lng: number | null
          created_at: string | null
          device_id: string | null
          id: string
          local_reference_id: string
          notification_data: Json
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          notifier_id: string | null
          notifier_name: string
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          processed: boolean | null
          processed_at: string | null
          processed_by: string | null
          processing_notes: string | null
          result_notification_id: string | null
          supervisor_approved: boolean | null
          supervisor_approved_at: string | null
          supervisor_id: string | null
          synced_at: string | null
        }
        Insert: {
          captured_at: string
          captured_lat?: number | null
          captured_lng?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          local_reference_id: string
          notification_data: Json
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          notifier_id?: string | null
          notifier_name: string
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          processing_notes?: string | null
          result_notification_id?: string | null
          supervisor_approved?: boolean | null
          supervisor_approved_at?: string | null
          supervisor_id?: string | null
          synced_at?: string | null
        }
        Update: {
          captured_at?: string
          captured_lat?: number | null
          captured_lng?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          local_reference_id?: string
          notification_data?: Json
          notification_type?: Database["public"]["Enums"]["crvs_notification_type"]
          notifier_id?: string | null
          notifier_name?: string
          notifier_role?: Database["public"]["Enums"]["crvs_notifier_role"]
          processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          processing_notes?: string | null
          result_notification_id?: string | null
          supervisor_approved?: boolean | null
          supervisor_approved_at?: string | null
          supervisor_id?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      crvs_quality_flags: {
        Row: {
          auto_detected: boolean | null
          created_at: string | null
          flag_description: string
          flag_type: string
          id: string
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
        }
        Insert: {
          auto_detected?: boolean | null
          created_at?: string | null
          flag_description: string
          flag_type: string
          id?: string
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Update: {
          auto_detected?: boolean | null
          created_at?: string | null
          flag_description?: string
          flag_type?: string
          id?: string
          notification_id?: string
          notification_type?: Database["public"]["Enums"]["crvs_notification_type"]
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      crvs_registrar_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          info_received_at: string | null
          info_requested: string | null
          info_requested_at: string | null
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          priority: string | null
          queue_status: string
          registration_date: string | null
          registration_number: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          info_received_at?: string | null
          info_requested?: string | null
          info_requested_at?: string | null
          notification_id: string
          notification_type: Database["public"]["Enums"]["crvs_notification_type"]
          priority?: string | null
          queue_status?: string
          registration_date?: string | null
          registration_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          info_received_at?: string | null
          info_requested?: string | null
          info_requested_at?: string | null
          notification_id?: string
          notification_type?: Database["public"]["Enums"]["crvs_notification_type"]
          priority?: string | null
          queue_status?: string
          registration_date?: string | null
          registration_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      death_certifications: {
        Row: {
          certification_datetime: string
          certification_type: string
          certifying_practitioner_id: string | null
          community_verifier_id: string | null
          community_verifier_name: string | null
          community_verifier_role: string | null
          contributing_causes: string[] | null
          created_at: string | null
          digital_signature: string | null
          discharge_case_id: string
          id: string
          immediate_cause: string | null
          is_verified: boolean | null
          manner_of_death: string | null
          mccd_record_id: string | null
          place_of_certification: string | null
          practitioner_name: string
          practitioner_qualification: string
          practitioner_registration_number: string | null
          signature_datetime: string | null
          underlying_cause: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certification_datetime?: string
          certification_type: string
          certifying_practitioner_id?: string | null
          community_verifier_id?: string | null
          community_verifier_name?: string | null
          community_verifier_role?: string | null
          contributing_causes?: string[] | null
          created_at?: string | null
          digital_signature?: string | null
          discharge_case_id: string
          id?: string
          immediate_cause?: string | null
          is_verified?: boolean | null
          manner_of_death?: string | null
          mccd_record_id?: string | null
          place_of_certification?: string | null
          practitioner_name: string
          practitioner_qualification: string
          practitioner_registration_number?: string | null
          signature_datetime?: string | null
          underlying_cause?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certification_datetime?: string
          certification_type?: string
          certifying_practitioner_id?: string | null
          community_verifier_id?: string | null
          community_verifier_name?: string | null
          community_verifier_role?: string | null
          contributing_causes?: string[] | null
          created_at?: string | null
          digital_signature?: string | null
          discharge_case_id?: string
          id?: string
          immediate_cause?: string | null
          is_verified?: boolean | null
          manner_of_death?: string | null
          mccd_record_id?: string | null
          place_of_certification?: string | null
          practitioner_name?: string
          practitioner_qualification?: string
          practitioner_registration_number?: string | null
          signature_datetime?: string | null
          underlying_cause?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "death_certifications_discharge_case_id_fkey"
            columns: ["discharge_case_id"]
            isOneToOne: false
            referencedRelation: "discharge_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_certifications_mccd_record_id_fkey"
            columns: ["mccd_record_id"]
            isOneToOne: false
            referencedRelation: "mccd_records"
            referencedColumns: ["id"]
          },
        ]
      }
      death_notifications: {
        Row: {
          billing_notified: boolean | null
          circumstances_description: string | null
          client_registry_updated: boolean | null
          clinical_record_locked: boolean | null
          cod_method: Database["public"]["Enums"]["crvs_cod_method"] | null
          community_district: string | null
          community_province: string | null
          community_village: string | null
          community_ward: string | null
          created_at: string | null
          created_by: string | null
          date_of_death: string
          death_geo_lat: number | null
          death_geo_lng: number | null
          death_occurred_at: string
          deceased_age_days: number | null
          deceased_age_months: number | null
          deceased_age_years: number | null
          deceased_client_id: string | null
          deceased_date_of_birth: string | null
          deceased_education_level: string | null
          deceased_family_name: string
          deceased_given_names: string
          deceased_health_id: string | null
          deceased_marital_status: string | null
          deceased_national_id: string | null
          deceased_nationality: string | null
          deceased_occupation: string | null
          deceased_passport: string | null
          deceased_sex: string
          documents: Json | null
          encounter_id: string | null
          facility_id: string | null
          facility_ward: string | null
          id: string
          informant_address: string | null
          informant_contact: string | null
          informant_name: string
          informant_national_id: string | null
          informant_relationship: string
          is_date_estimated: boolean | null
          is_late_registration: boolean | null
          late_registration_reason: string | null
          manner_of_death:
            | Database["public"]["Enums"]["crvs_death_manner"]
            | null
          mccd_id: string | null
          notification_number: string
          notifier_contact: string | null
          notifier_name: string
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id: string | null
          registered_at: string | null
          registered_by: string | null
          registration_number: string | null
          rejection_reason: string | null
          requires_verification: boolean | null
          residence_address: string | null
          residence_district: string | null
          residence_province: string | null
          residence_village: string | null
          residence_ward: string | null
          source: Database["public"]["Enums"]["crvs_notification_source"]
          status: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at: string | null
          time_of_death: string | null
          traditional_leader_letter: boolean | null
          traditional_leader_name: string | null
          traditional_leader_village: string | null
          updated_at: string | null
          verbal_autopsy_id: string | null
          verification_method: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          visit_id: string | null
        }
        Insert: {
          billing_notified?: boolean | null
          circumstances_description?: string | null
          client_registry_updated?: boolean | null
          clinical_record_locked?: boolean | null
          cod_method?: Database["public"]["Enums"]["crvs_cod_method"] | null
          community_district?: string | null
          community_province?: string | null
          community_village?: string | null
          community_ward?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_death: string
          death_geo_lat?: number | null
          death_geo_lng?: number | null
          death_occurred_at: string
          deceased_age_days?: number | null
          deceased_age_months?: number | null
          deceased_age_years?: number | null
          deceased_client_id?: string | null
          deceased_date_of_birth?: string | null
          deceased_education_level?: string | null
          deceased_family_name: string
          deceased_given_names: string
          deceased_health_id?: string | null
          deceased_marital_status?: string | null
          deceased_national_id?: string | null
          deceased_nationality?: string | null
          deceased_occupation?: string | null
          deceased_passport?: string | null
          deceased_sex: string
          documents?: Json | null
          encounter_id?: string | null
          facility_id?: string | null
          facility_ward?: string | null
          id?: string
          informant_address?: string | null
          informant_contact?: string | null
          informant_name: string
          informant_national_id?: string | null
          informant_relationship: string
          is_date_estimated?: boolean | null
          is_late_registration?: boolean | null
          late_registration_reason?: string | null
          manner_of_death?:
            | Database["public"]["Enums"]["crvs_death_manner"]
            | null
          mccd_id?: string | null
          notification_number: string
          notifier_contact?: string | null
          notifier_name: string
          notifier_role: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id?: string | null
          registered_at?: string | null
          registered_by?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          requires_verification?: boolean | null
          residence_address?: string | null
          residence_district?: string | null
          residence_province?: string | null
          residence_village?: string | null
          residence_ward?: string | null
          source?: Database["public"]["Enums"]["crvs_notification_source"]
          status?: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at?: string | null
          time_of_death?: string | null
          traditional_leader_letter?: boolean | null
          traditional_leader_name?: string | null
          traditional_leader_village?: string | null
          updated_at?: string | null
          verbal_autopsy_id?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id?: string | null
        }
        Update: {
          billing_notified?: boolean | null
          circumstances_description?: string | null
          client_registry_updated?: boolean | null
          clinical_record_locked?: boolean | null
          cod_method?: Database["public"]["Enums"]["crvs_cod_method"] | null
          community_district?: string | null
          community_province?: string | null
          community_village?: string | null
          community_ward?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_death?: string
          death_geo_lat?: number | null
          death_geo_lng?: number | null
          death_occurred_at?: string
          deceased_age_days?: number | null
          deceased_age_months?: number | null
          deceased_age_years?: number | null
          deceased_client_id?: string | null
          deceased_date_of_birth?: string | null
          deceased_education_level?: string | null
          deceased_family_name?: string
          deceased_given_names?: string
          deceased_health_id?: string | null
          deceased_marital_status?: string | null
          deceased_national_id?: string | null
          deceased_nationality?: string | null
          deceased_occupation?: string | null
          deceased_passport?: string | null
          deceased_sex?: string
          documents?: Json | null
          encounter_id?: string | null
          facility_id?: string | null
          facility_ward?: string | null
          id?: string
          informant_address?: string | null
          informant_contact?: string | null
          informant_name?: string
          informant_national_id?: string | null
          informant_relationship?: string
          is_date_estimated?: boolean | null
          is_late_registration?: boolean | null
          late_registration_reason?: string | null
          manner_of_death?:
            | Database["public"]["Enums"]["crvs_death_manner"]
            | null
          mccd_id?: string | null
          notification_number?: string
          notifier_contact?: string | null
          notifier_name?: string
          notifier_role?: Database["public"]["Enums"]["crvs_notifier_role"]
          notifier_user_id?: string | null
          registered_at?: string | null
          registered_by?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          requires_verification?: boolean | null
          residence_address?: string | null
          residence_district?: string | null
          residence_province?: string | null
          residence_village?: string | null
          residence_ward?: string | null
          source?: Database["public"]["Enums"]["crvs_notification_source"]
          status?: Database["public"]["Enums"]["crvs_notification_status"]
          submitted_at?: string | null
          time_of_death?: string | null
          traditional_leader_letter?: boolean | null
          traditional_leader_name?: string | null
          traditional_leader_village?: string | null
          updated_at?: string | null
          verbal_autopsy_id?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "death_notifications_deceased_client_id_fkey"
            columns: ["deceased_client_id"]
            isOneToOne: false
            referencedRelation: "client_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_notifications_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "death_notifications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "death_notifications_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      death_outcome_summaries: {
        Row: {
          access_restricted: boolean | null
          authorized_viewers: string[] | null
          autopsy_notes: string | null
          autopsy_requested: boolean | null
          cause_category_code: string | null
          cause_category_display: string | null
          certification_datetime: string | null
          certifying_clinician_id: string | null
          certifying_clinician_name: string | null
          created_at: string
          death_certificate_task_id: string | null
          death_datetime: string
          death_location: string | null
          document_id: string
          family_notified: boolean | null
          family_notified_at: string | null
          family_notified_by: string | null
          id: string
          immediate_cause: string | null
          notification_tasks: Json | null
          patient_id: string
          underlying_cause: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          access_restricted?: boolean | null
          authorized_viewers?: string[] | null
          autopsy_notes?: string | null
          autopsy_requested?: boolean | null
          cause_category_code?: string | null
          cause_category_display?: string | null
          certification_datetime?: string | null
          certifying_clinician_id?: string | null
          certifying_clinician_name?: string | null
          created_at?: string
          death_certificate_task_id?: string | null
          death_datetime: string
          death_location?: string | null
          document_id: string
          family_notified?: boolean | null
          family_notified_at?: string | null
          family_notified_by?: string | null
          id?: string
          immediate_cause?: string | null
          notification_tasks?: Json | null
          patient_id: string
          underlying_cause?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          access_restricted?: boolean | null
          authorized_viewers?: string[] | null
          autopsy_notes?: string | null
          autopsy_requested?: boolean | null
          cause_category_code?: string | null
          cause_category_display?: string | null
          certification_datetime?: string | null
          certifying_clinician_id?: string | null
          certifying_clinician_name?: string | null
          created_at?: string
          death_certificate_task_id?: string | null
          death_datetime?: string
          death_location?: string | null
          document_id?: string
          family_notified?: boolean | null
          family_notified_at?: string | null
          family_notified_by?: string | null
          id?: string
          immediate_cause?: string | null
          notification_tasks?: Json | null
          patient_id?: string
          underlying_cause?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "death_outcome_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_outcome_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_outcome_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_approvals: {
        Row: {
          approval_stage: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          deferred_reason: string | null
          deferred_until: string | null
          discharge_case_id: string
          id: string
          is_mandatory: boolean | null
          rejected_reason: string | null
          required_role: string
          sequence_order: number
          signature_hash: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_stage: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deferred_reason?: string | null
          deferred_until?: string | null
          discharge_case_id: string
          id?: string
          is_mandatory?: boolean | null
          rejected_reason?: string | null
          required_role: string
          sequence_order: number
          signature_hash?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_stage?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deferred_reason?: string | null
          deferred_until?: string | null
          discharge_case_id?: string
          id?: string
          is_mandatory?: boolean | null
          rejected_reason?: string | null
          required_role?: string
          sequence_order?: number
          signature_hash?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_approvals_discharge_case_id_fkey"
            columns: ["discharge_case_id"]
            isOneToOne: false
            referencedRelation: "discharge_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_cases: {
        Row: {
          case_number: string
          closed_at: string | null
          cost_snapshot_id: string | null
          created_at: string | null
          created_by: string | null
          death_datetime: string | null
          death_notification_id: string | null
          death_place: string | null
          death_summary_id: string | null
          decision_by: string | null
          decision_datetime: string | null
          decision_reason: string | null
          decision_type:
            | Database["public"]["Enums"]["discharge_decision_type"]
            | null
          discharge_datetime: string | null
          discharge_diagnosis: string | null
          discharge_instructions: string | null
          discharge_summary_id: string | null
          encounter_id: string | null
          facility_id: string | null
          final_approved_at: string | null
          final_approved_by: string | null
          financial_status: string | null
          follow_up_plan: string | null
          id: string
          is_community_death: boolean | null
          is_legal_hold: boolean | null
          legal_hold_reason: string | null
          mccd_id: string | null
          mortuary_location: string | null
          mortuary_transfer_datetime: string | null
          notes: string | null
          outstanding_balance: number | null
          patient_acknowledged: boolean | null
          patient_acknowledged_at: string | null
          patient_acknowledged_by: string | null
          patient_id: string
          patient_signature_path: string | null
          preliminary_cause_category: string | null
          requires_supervisor_override: boolean | null
          supervisor_override_at: string | null
          supervisor_override_by: string | null
          supervisor_override_reason: string | null
          total_charges: number | null
          total_paid: number | null
          total_waived: number | null
          treatment_summary: string | null
          updated_at: string | null
          verbal_autopsy_id: string | null
          visit_id: string
          workflow_state: Database["public"]["Enums"]["discharge_workflow_state"]
          workflow_type: string
        }
        Insert: {
          case_number?: string
          closed_at?: string | null
          cost_snapshot_id?: string | null
          created_at?: string | null
          created_by?: string | null
          death_datetime?: string | null
          death_notification_id?: string | null
          death_place?: string | null
          death_summary_id?: string | null
          decision_by?: string | null
          decision_datetime?: string | null
          decision_reason?: string | null
          decision_type?:
            | Database["public"]["Enums"]["discharge_decision_type"]
            | null
          discharge_datetime?: string | null
          discharge_diagnosis?: string | null
          discharge_instructions?: string | null
          discharge_summary_id?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          financial_status?: string | null
          follow_up_plan?: string | null
          id?: string
          is_community_death?: boolean | null
          is_legal_hold?: boolean | null
          legal_hold_reason?: string | null
          mccd_id?: string | null
          mortuary_location?: string | null
          mortuary_transfer_datetime?: string | null
          notes?: string | null
          outstanding_balance?: number | null
          patient_acknowledged?: boolean | null
          patient_acknowledged_at?: string | null
          patient_acknowledged_by?: string | null
          patient_id: string
          patient_signature_path?: string | null
          preliminary_cause_category?: string | null
          requires_supervisor_override?: boolean | null
          supervisor_override_at?: string | null
          supervisor_override_by?: string | null
          supervisor_override_reason?: string | null
          total_charges?: number | null
          total_paid?: number | null
          total_waived?: number | null
          treatment_summary?: string | null
          updated_at?: string | null
          verbal_autopsy_id?: string | null
          visit_id: string
          workflow_state?: Database["public"]["Enums"]["discharge_workflow_state"]
          workflow_type: string
        }
        Update: {
          case_number?: string
          closed_at?: string | null
          cost_snapshot_id?: string | null
          created_at?: string | null
          created_by?: string | null
          death_datetime?: string | null
          death_notification_id?: string | null
          death_place?: string | null
          death_summary_id?: string | null
          decision_by?: string | null
          decision_datetime?: string | null
          decision_reason?: string | null
          decision_type?:
            | Database["public"]["Enums"]["discharge_decision_type"]
            | null
          discharge_datetime?: string | null
          discharge_diagnosis?: string | null
          discharge_instructions?: string | null
          discharge_summary_id?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          financial_status?: string | null
          follow_up_plan?: string | null
          id?: string
          is_community_death?: boolean | null
          is_legal_hold?: boolean | null
          legal_hold_reason?: string | null
          mccd_id?: string | null
          mortuary_location?: string | null
          mortuary_transfer_datetime?: string | null
          notes?: string | null
          outstanding_balance?: number | null
          patient_acknowledged?: boolean | null
          patient_acknowledged_at?: string | null
          patient_acknowledged_by?: string | null
          patient_id?: string
          patient_signature_path?: string | null
          preliminary_cause_category?: string | null
          requires_supervisor_override?: boolean | null
          supervisor_override_at?: string | null
          supervisor_override_by?: string | null
          supervisor_override_reason?: string | null
          total_charges?: number | null
          total_paid?: number | null
          total_waived?: number | null
          treatment_summary?: string | null
          updated_at?: string | null
          verbal_autopsy_id?: string | null
          visit_id?: string
          workflow_state?: Database["public"]["Enums"]["discharge_workflow_state"]
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discharge_cases_death_notification_id_fkey"
            columns: ["death_notification_id"]
            isOneToOne: false
            referencedRelation: "death_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "discharge_cases_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "discharge_cases_mccd_id_fkey"
            columns: ["mccd_id"]
            isOneToOne: false
            referencedRelation: "mccd_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_verbal_autopsy_id_fkey"
            columns: ["verbal_autopsy_id"]
            isOneToOne: false
            referencedRelation: "verbal_autopsy_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_cases_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_clearances: {
        Row: {
          assigned_role: string | null
          assigned_to: string | null
          blocked_reason: string | null
          checklist_items: Json | null
          clearance_type: Database["public"]["Enums"]["clearance_type"]
          cleared_at: string | null
          cleared_by: string | null
          completed_items: Json | null
          created_at: string | null
          discharge_case_id: string
          id: string
          notes: string | null
          sequence_order: number
          status: Database["public"]["Enums"]["clearance_status"]
          updated_at: string | null
          waived_by: string | null
          waived_reason: string | null
        }
        Insert: {
          assigned_role?: string | null
          assigned_to?: string | null
          blocked_reason?: string | null
          checklist_items?: Json | null
          clearance_type: Database["public"]["Enums"]["clearance_type"]
          cleared_at?: string | null
          cleared_by?: string | null
          completed_items?: Json | null
          created_at?: string | null
          discharge_case_id: string
          id?: string
          notes?: string | null
          sequence_order: number
          status?: Database["public"]["Enums"]["clearance_status"]
          updated_at?: string | null
          waived_by?: string | null
          waived_reason?: string | null
        }
        Update: {
          assigned_role?: string | null
          assigned_to?: string | null
          blocked_reason?: string | null
          checklist_items?: Json | null
          clearance_type?: Database["public"]["Enums"]["clearance_type"]
          cleared_at?: string | null
          cleared_by?: string | null
          completed_items?: Json | null
          created_at?: string | null
          discharge_case_id?: string
          id?: string
          notes?: string | null
          sequence_order?: number
          status?: Database["public"]["Enums"]["clearance_status"]
          updated_at?: string | null
          waived_by?: string | null
          waived_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_clearances_discharge_case_id_fkey"
            columns: ["discharge_case_id"]
            isOneToOne: false
            referencedRelation: "discharge_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_financial_clearances: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          bed_day_charges: number | null
          catering_charges: number | null
          consumable_charges: number | null
          created_at: string | null
          deferred_approved_by: string | null
          deferred_until: string | null
          discharge_case_id: string
          discounts_applied: number | null
          exemptions_applied: number | null
          gross_total: number | null
          id: string
          imaging_charges: number | null
          insurance_covered: number | null
          lab_charges: number | null
          medication_charges: number | null
          mortuary_charges: number | null
          net_payable: number | null
          other_charges: number | null
          payment_plan_id: string | null
          procedure_charges: number | null
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          special_service_charges: number | null
          sponsor_covered: number | null
          updated_at: string | null
          utility_charges: number | null
          write_off_approved_by: string | null
          write_off_reason: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          bed_day_charges?: number | null
          catering_charges?: number | null
          consumable_charges?: number | null
          created_at?: string | null
          deferred_approved_by?: string | null
          deferred_until?: string | null
          discharge_case_id: string
          discounts_applied?: number | null
          exemptions_applied?: number | null
          gross_total?: number | null
          id?: string
          imaging_charges?: number | null
          insurance_covered?: number | null
          lab_charges?: number | null
          medication_charges?: number | null
          mortuary_charges?: number | null
          net_payable?: number | null
          other_charges?: number | null
          payment_plan_id?: string | null
          procedure_charges?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          special_service_charges?: number | null
          sponsor_covered?: number | null
          updated_at?: string | null
          utility_charges?: number | null
          write_off_approved_by?: string | null
          write_off_reason?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          bed_day_charges?: number | null
          catering_charges?: number | null
          consumable_charges?: number | null
          created_at?: string | null
          deferred_approved_by?: string | null
          deferred_until?: string | null
          discharge_case_id?: string
          discounts_applied?: number | null
          exemptions_applied?: number | null
          gross_total?: number | null
          id?: string
          imaging_charges?: number | null
          insurance_covered?: number | null
          lab_charges?: number | null
          medication_charges?: number | null
          mortuary_charges?: number | null
          net_payable?: number | null
          other_charges?: number | null
          payment_plan_id?: string | null
          procedure_charges?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          special_service_charges?: number | null
          sponsor_covered?: number | null
          updated_at?: string | null
          utility_charges?: number | null
          write_off_approved_by?: string | null
          write_off_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_financial_clearances_discharge_case_id_fkey"
            columns: ["discharge_case_id"]
            isOneToOne: true
            referencedRelation: "discharge_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_state_transitions: {
        Row: {
          clearance_snapshot: Json | null
          discharge_case_id: string
          from_state:
            | Database["public"]["Enums"]["discharge_workflow_state"]
            | null
          id: string
          ip_address: unknown
          to_state: Database["public"]["Enums"]["discharge_workflow_state"]
          transition_reason: string | null
          transitioned_at: string
          transitioned_by: string
          user_agent: string | null
        }
        Insert: {
          clearance_snapshot?: Json | null
          discharge_case_id: string
          from_state?:
            | Database["public"]["Enums"]["discharge_workflow_state"]
            | null
          id?: string
          ip_address?: unknown
          to_state: Database["public"]["Enums"]["discharge_workflow_state"]
          transition_reason?: string | null
          transitioned_at?: string
          transitioned_by: string
          user_agent?: string | null
        }
        Update: {
          clearance_snapshot?: Json | null
          discharge_case_id?: string
          from_state?:
            | Database["public"]["Enums"]["discharge_workflow_state"]
            | null
          id?: string
          ip_address?: unknown
          to_state?: Database["public"]["Enums"]["discharge_workflow_state"]
          transition_reason?: string | null
          transitioned_at?: string
          transitioned_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_state_transitions_discharge_case_id_fkey"
            columns: ["discharge_case_id"]
            isOneToOne: false
            referencedRelation: "discharge_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_summaries: {
        Row: {
          admission_date: string
          allergies: Json | null
          condition_at_discharge: string | null
          created_at: string
          discharge_date: string
          discharge_medications: Json | null
          document_id: string
          facility_name: string | null
          follow_up_appointments: Json | null
          functional_status: string | null
          hospital_course_narrative: string | null
          id: string
          key_imaging_results: Json | null
          key_lab_results: Json | null
          medication_reconciliation_at: string | null
          medication_reconciliation_by: string | null
          medications_changed: Json | null
          medications_stopped: Json | null
          patient_id: string
          patient_instructions: string | null
          pending_results: Json | null
          pending_results_followup_plan: string | null
          pending_results_reviewer: string | null
          primary_diagnosis: string | null
          primary_diagnosis_code: string | null
          referrals: Json | null
          secondary_diagnoses: Json | null
          significant_procedures: Json | null
          updated_at: string
          visit_id: string
          ward_name: string | null
          warning_signs: string | null
        }
        Insert: {
          admission_date: string
          allergies?: Json | null
          condition_at_discharge?: string | null
          created_at?: string
          discharge_date: string
          discharge_medications?: Json | null
          document_id: string
          facility_name?: string | null
          follow_up_appointments?: Json | null
          functional_status?: string | null
          hospital_course_narrative?: string | null
          id?: string
          key_imaging_results?: Json | null
          key_lab_results?: Json | null
          medication_reconciliation_at?: string | null
          medication_reconciliation_by?: string | null
          medications_changed?: Json | null
          medications_stopped?: Json | null
          patient_id: string
          patient_instructions?: string | null
          pending_results?: Json | null
          pending_results_followup_plan?: string | null
          pending_results_reviewer?: string | null
          primary_diagnosis?: string | null
          primary_diagnosis_code?: string | null
          referrals?: Json | null
          secondary_diagnoses?: Json | null
          significant_procedures?: Json | null
          updated_at?: string
          visit_id: string
          ward_name?: string | null
          warning_signs?: string | null
        }
        Update: {
          admission_date?: string
          allergies?: Json | null
          condition_at_discharge?: string | null
          created_at?: string
          discharge_date?: string
          discharge_medications?: Json | null
          document_id?: string
          facility_name?: string | null
          follow_up_appointments?: Json | null
          functional_status?: string | null
          hospital_course_narrative?: string | null
          id?: string
          key_imaging_results?: Json | null
          key_lab_results?: Json | null
          medication_reconciliation_at?: string | null
          medication_reconciliation_by?: string | null
          medications_changed?: Json | null
          medications_stopped?: Json | null
          patient_id?: string
          patient_instructions?: string | null
          pending_results?: Json | null
          pending_results_followup_plan?: string | null
          pending_results_reviewer?: string | null
          primary_diagnosis?: string | null
          primary_diagnosis_code?: string | null
          referrals?: Json | null
          secondary_diagnoses?: Json | null
          significant_procedures?: Json | null
          updated_at?: string
          visit_id?: string
          ward_name?: string | null
          warning_signs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_log: {
        Row: {
          access_granted: boolean
          access_type: string
          access_via: string
          accessed_by: string | null
          accessed_by_name: string | null
          created_at: string
          denial_reason: string | null
          document_id: string
          id: string
          ip_address: unknown
          patient_id: string
          share_token_used: string | null
          user_agent: string | null
        }
        Insert: {
          access_granted: boolean
          access_type: string
          access_via: string
          accessed_by?: string | null
          accessed_by_name?: string | null
          created_at?: string
          denial_reason?: string | null
          document_id: string
          id?: string
          ip_address?: unknown
          patient_id: string
          share_token_used?: string | null
          user_agent?: string | null
        }
        Update: {
          access_granted?: boolean
          access_type?: string
          access_via?: string
          accessed_by?: string | null
          accessed_by_name?: string | null
          created_at?: string
          denial_reason?: string | null
          document_id?: string
          id?: string
          ip_address?: unknown
          patient_id?: string
          share_token_used?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_references: {
        Row: {
          author_name: string | null
          created_at: string
          document_date: string
          document_id: string
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id: string | null
          facility_id: string | null
          facility_name: string | null
          id: string
          patient_id: string
          searchable_text: string | null
          status: Database["public"]["Enums"]["document_status"]
          tags: string[] | null
          title: string
          visit_id: string | null
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          document_date: string
          document_id: string
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id?: string | null
          facility_id?: string | null
          facility_name?: string | null
          id?: string
          patient_id: string
          searchable_text?: string | null
          status: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          title: string
          visit_id?: string | null
        }
        Update: {
          author_name?: string | null
          created_at?: string
          document_date?: string
          document_id?: string
          document_type?: Database["public"]["Enums"]["clinical_document_type"]
          encounter_id?: string | null
          facility_id?: string | null
          facility_name?: string | null
          id?: string
          patient_id?: string
          searchable_text?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          title?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_references_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "document_references_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "document_references_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_references_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ed_summaries: {
        Row: {
          admitting_service: string | null
          admitting_ward: string | null
          created_at: string
          discharge_instructions: string | null
          disposition: string
          disposition_notes: string | null
          disposition_time: string | null
          document_id: string
          encounter_id: string
          follow_up_plan: string | null
          handover_notes: string | null
          handover_to: string | null
          id: string
          imaging_performed: Json | null
          interventions: Json | null
          key_results: Json | null
          patient_id: string
          presenting_complaint: string | null
          triage_category: string | null
          triage_time: string | null
          updated_at: string
        }
        Insert: {
          admitting_service?: string | null
          admitting_ward?: string | null
          created_at?: string
          discharge_instructions?: string | null
          disposition: string
          disposition_notes?: string | null
          disposition_time?: string | null
          document_id: string
          encounter_id: string
          follow_up_plan?: string | null
          handover_notes?: string | null
          handover_to?: string | null
          id?: string
          imaging_performed?: Json | null
          interventions?: Json | null
          key_results?: Json | null
          patient_id: string
          presenting_complaint?: string | null
          triage_category?: string | null
          triage_time?: string | null
          updated_at?: string
        }
        Update: {
          admitting_service?: string | null
          admitting_ward?: string | null
          created_at?: string
          discharge_instructions?: string | null
          disposition?: string
          disposition_notes?: string | null
          disposition_time?: string | null
          document_id?: string
          encounter_id?: string
          follow_up_plan?: string | null
          handover_notes?: string | null
          handover_to?: string | null
          id?: string
          imaging_performed?: Json | null
          interventions?: Json | null
          key_results?: Json | null
          patient_id?: string
          presenting_complaint?: string | null
          triage_category?: string | null
          triage_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ed_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ed_summaries_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ed_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_decisions: {
        Row: {
          eligible: boolean
          facility_context: string | null
          facility_scope: string[] | null
          granted_privileges: string[] | null
          granted_roles: string[] | null
          id: string
          license_valid_until: string | null
          provider_id: string
          reason_codes: string[] | null
          requested_at: string
          requested_by: string | null
          requested_privileges: string[] | null
          requested_role: string | null
          response_time_ms: number | null
          session_id: string | null
          token_issued: boolean | null
        }
        Insert: {
          eligible: boolean
          facility_context?: string | null
          facility_scope?: string[] | null
          granted_privileges?: string[] | null
          granted_roles?: string[] | null
          id?: string
          license_valid_until?: string | null
          provider_id: string
          reason_codes?: string[] | null
          requested_at?: string
          requested_by?: string | null
          requested_privileges?: string[] | null
          requested_role?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          token_issued?: boolean | null
        }
        Update: {
          eligible?: boolean
          facility_context?: string | null
          facility_scope?: string[] | null
          granted_privileges?: string[] | null
          granted_roles?: string[] | null
          id?: string
          license_valid_until?: string | null
          provider_id?: string
          reason_codes?: string[] | null
          requested_at?: string
          requested_by?: string | null
          requested_privileges?: string[] | null
          requested_role?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          token_issued?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_decisions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_charges: {
        Row: {
          charge_item_id: string
          charged_at: string
          charged_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          encounter_id: string
          id: string
          is_voided: boolean
          notes: string | null
          quantity: number
          tax_amount: number | null
          total_amount: number
          unit_price: number
          voided_by: string | null
          voided_reason: string | null
        }
        Insert: {
          charge_item_id: string
          charged_at?: string
          charged_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          encounter_id: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          quantity?: number
          tax_amount?: number | null
          total_amount: number
          unit_price: number
          voided_by?: string | null
          voided_reason?: string | null
        }
        Update: {
          charge_item_id?: string
          charged_at?: string
          charged_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          encounter_id?: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          quantity?: number
          tax_amount?: number | null
          total_amount?: number
          unit_price?: number
          voided_by?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_charges_charge_item_id_fkey"
            columns: ["charge_item_id"]
            isOneToOne: false
            referencedRelation: "charge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_charges_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          admission_date: string
          attending_physician_id: string | null
          bed: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          discharge_date: string | null
          encounter_number: string
          encounter_sequence: number | null
          encounter_type: string
          id: string
          notes: string | null
          patient_id: string
          primary_diagnosis: string | null
          status: string
          triage_category: string | null
          updated_at: string
          visit_id: string | null
          ward: string | null
        }
        Insert: {
          admission_date?: string
          attending_physician_id?: string | null
          bed?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          discharge_date?: string | null
          encounter_number: string
          encounter_sequence?: number | null
          encounter_type: string
          id?: string
          notes?: string | null
          patient_id: string
          primary_diagnosis?: string | null
          status?: string
          triage_category?: string | null
          updated_at?: string
          visit_id?: string | null
          ward?: string | null
        }
        Update: {
          admission_date?: string
          attending_physician_id?: string | null
          bed?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          discharge_date?: string | null
          encounter_number?: string
          encounter_sequence?: number | null
          encounter_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          primary_diagnosis?: string | null
          status?: string
          triage_category?: string | null
          updated_at?: string
          visit_id?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_reservations: {
        Row: {
          created_at: string
          equipment_id: string | null
          equipment_name: string
          id: string
          notes: string | null
          reference_id: string
          reserved_by: string | null
          reserved_for: string
          reserved_from: string
          reserved_until: string
          status: string | null
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          equipment_name: string
          id?: string
          notes?: string | null
          reference_id: string
          reserved_by?: string | null
          reserved_for: string
          reserved_from: string
          reserved_until: string
          status?: string | null
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          equipment_name?: string
          id?: string
          notes?: string | null
          reference_id?: string
          reserved_by?: string | null
          reserved_for?: string
          reserved_from?: string
          reserved_until?: string
          status?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          accreditation_body: string | null
          accreditation_status: string | null
          address_line1: string | null
          admin_hierarchy_id: string | null
          altitude: number | null
          approved_at: string | null
          approved_by: string | null
          bed_count: number | null
          city: string | null
          cot_count: number | null
          country: string | null
          created_at: string | null
          created_by: string | null
          data_source: string | null
          dhis2_uid: string | null
          email: string | null
          facility_code: string | null
          facility_type: string
          facility_type_id: string | null
          fax: string | null
          gofr_id: string
          has_electricity: boolean | null
          has_internet: boolean | null
          has_water: boolean | null
          id: string
          is_24hr: boolean | null
          is_active: boolean | null
          is_verified: boolean | null
          last_modified_by: string | null
          latitude: number | null
          legacy_code: string | null
          level: string | null
          license_expiry: string | null
          license_number: string | null
          longitude: number | null
          managing_org_contact: string | null
          managing_org_name: string | null
          name: string
          operating_hours: Json | null
          operational_status: string | null
          ownership_type_id: string | null
          phone: string | null
          phone_alt: string | null
          physical_address: string | null
          postal_address: string | null
          postal_code: string | null
          province: string | null
          published_at: string | null
          published_by: string | null
          record_date: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          services: string[] | null
          short_name: string | null
          status_effective_date: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          version: number | null
          website: string | null
          workflow_status: string | null
        }
        Insert: {
          accreditation_body?: string | null
          accreditation_status?: string | null
          address_line1?: string | null
          admin_hierarchy_id?: string | null
          altitude?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bed_count?: number | null
          city?: string | null
          cot_count?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          dhis2_uid?: string | null
          email?: string | null
          facility_code?: string | null
          facility_type: string
          facility_type_id?: string | null
          fax?: string | null
          gofr_id: string
          has_electricity?: boolean | null
          has_internet?: boolean | null
          has_water?: boolean | null
          id?: string
          is_24hr?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_modified_by?: string | null
          latitude?: number | null
          legacy_code?: string | null
          level?: string | null
          license_expiry?: string | null
          license_number?: string | null
          longitude?: number | null
          managing_org_contact?: string | null
          managing_org_name?: string | null
          name: string
          operating_hours?: Json | null
          operational_status?: string | null
          ownership_type_id?: string | null
          phone?: string | null
          phone_alt?: string | null
          physical_address?: string | null
          postal_address?: string | null
          postal_code?: string | null
          province?: string | null
          published_at?: string | null
          published_by?: string | null
          record_date?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services?: string[] | null
          short_name?: string | null
          status_effective_date?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          website?: string | null
          workflow_status?: string | null
        }
        Update: {
          accreditation_body?: string | null
          accreditation_status?: string | null
          address_line1?: string | null
          admin_hierarchy_id?: string | null
          altitude?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bed_count?: number | null
          city?: string | null
          cot_count?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          dhis2_uid?: string | null
          email?: string | null
          facility_code?: string | null
          facility_type?: string
          facility_type_id?: string | null
          fax?: string | null
          gofr_id?: string
          has_electricity?: boolean | null
          has_internet?: boolean | null
          has_water?: boolean | null
          id?: string
          is_24hr?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_modified_by?: string | null
          latitude?: number | null
          legacy_code?: string | null
          level?: string | null
          license_expiry?: string | null
          license_number?: string | null
          longitude?: number | null
          managing_org_contact?: string | null
          managing_org_name?: string | null
          name?: string
          operating_hours?: Json | null
          operational_status?: string | null
          ownership_type_id?: string | null
          phone?: string | null
          phone_alt?: string | null
          physical_address?: string | null
          postal_address?: string | null
          postal_code?: string | null
          province?: string | null
          published_at?: string | null
          published_by?: string | null
          record_date?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services?: string[] | null
          short_name?: string | null
          status_effective_date?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          website?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_admin_hierarchy_id_fkey"
            columns: ["admin_hierarchy_id"]
            isOneToOne: false
            referencedRelation: "facility_admin_hierarchies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_facility_type_id_fkey"
            columns: ["facility_type_id"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_ownership_type_id_fkey"
            columns: ["ownership_type_id"]
            isOneToOne: false
            referencedRelation: "facility_ownership_types"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_admin_hierarchies: {
        Row: {
          boundary_geojson: Json | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          level: number
          level_name: string
          longitude: number | null
          name: string
          parent_id: string | null
          population: number | null
          updated_at: string | null
        }
        Insert: {
          boundary_geojson?: Json | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          level: number
          level_name: string
          longitude?: number | null
          name: string
          parent_id?: string | null
          population?: number | null
          updated_at?: string | null
        }
        Update: {
          boundary_geojson?: Json | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          level?: number
          level_name?: string
          longitude?: number | null
          name?: string
          parent_id?: string | null
          population?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_admin_hierarchies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "facility_admin_hierarchies"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_audit_log: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      facility_change_request_comments: {
        Row: {
          change_request_id: string
          comment: string
          comment_type: string | null
          created_at: string | null
          created_by: string
          id: string
          is_internal: boolean | null
        }
        Insert: {
          change_request_id: string
          comment: string
          comment_type?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_internal?: boolean | null
        }
        Update: {
          change_request_id?: string
          comment?: string
          comment_type?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_internal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_change_request_comments_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "facility_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_change_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          attachments: Json | null
          clarification_request: string | null
          clarification_response: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          facility_id: string | null
          id: string
          justification: string | null
          merge_source_ids: string[] | null
          priority: string | null
          proposed_changes: Json | null
          published_at: string | null
          published_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_type: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          split_target_count: number | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          clarification_request?: string | null
          clarification_response?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          facility_id?: string | null
          id?: string
          justification?: string | null
          merge_source_ids?: string[] | null
          priority?: string | null
          proposed_changes?: Json | null
          published_at?: string | null
          published_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          split_target_count?: number | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          clarification_request?: string | null
          clarification_response?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          facility_id?: string | null
          id?: string
          justification?: string | null
          merge_source_ids?: string[] | null
          priority?: string | null
          proposed_changes?: Json | null
          published_at?: string | null
          published_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          split_target_count?: number | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_change_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_change_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_change_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      facility_history: {
        Row: {
          change_summary: string | null
          change_type: string | null
          changed_at: string | null
          changed_by: string | null
          facility_id: string
          id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          facility_id: string
          id?: string
          snapshot: Json
          version: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          facility_id?: string
          id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "facility_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      facility_identifiers: {
        Row: {
          created_at: string | null
          facility_id: string
          id: string
          identifier_type: string
          identifier_value: string
          is_primary: boolean | null
          source_system: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          facility_id: string
          id?: string
          identifier_type: string
          identifier_value: string
          is_primary?: boolean | null
          source_system?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          facility_id?: string
          id?: string
          identifier_type?: string
          identifier_value?: string
          is_primary?: boolean | null
          source_system?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_identifiers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_identifiers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_identifiers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      facility_operations_config: {
        Row: {
          allow_self_start_shift: boolean | null
          allow_unrostered_login: boolean | null
          auto_assign_workspace_by_cadre: boolean | null
          coverage_alert_threshold: number | null
          created_at: string
          default_admin_workspace_id: string | null
          default_clinical_workspace_id: string | null
          facility_id: string
          id: string
          min_coverage_enabled: boolean | null
          ops_mode: Database["public"]["Enums"]["facility_ops_mode"]
          require_supervisor_approval_for_cover: boolean | null
          roster_required: boolean | null
          updated_at: string
          virtual_care_enabled: boolean | null
          virtual_care_facility_anchored: boolean | null
        }
        Insert: {
          allow_self_start_shift?: boolean | null
          allow_unrostered_login?: boolean | null
          auto_assign_workspace_by_cadre?: boolean | null
          coverage_alert_threshold?: number | null
          created_at?: string
          default_admin_workspace_id?: string | null
          default_clinical_workspace_id?: string | null
          facility_id: string
          id?: string
          min_coverage_enabled?: boolean | null
          ops_mode?: Database["public"]["Enums"]["facility_ops_mode"]
          require_supervisor_approval_for_cover?: boolean | null
          roster_required?: boolean | null
          updated_at?: string
          virtual_care_enabled?: boolean | null
          virtual_care_facility_anchored?: boolean | null
        }
        Update: {
          allow_self_start_shift?: boolean | null
          allow_unrostered_login?: boolean | null
          auto_assign_workspace_by_cadre?: boolean | null
          coverage_alert_threshold?: number | null
          created_at?: string
          default_admin_workspace_id?: string | null
          default_clinical_workspace_id?: string | null
          facility_id?: string
          id?: string
          min_coverage_enabled?: boolean | null
          ops_mode?: Database["public"]["Enums"]["facility_ops_mode"]
          require_supervisor_approval_for_cover?: boolean | null
          roster_required?: boolean | null
          updated_at?: string
          virtual_care_enabled?: boolean | null
          virtual_care_facility_anchored?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_operations_config_default_admin_workspace_id_fkey"
            columns: ["default_admin_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_operations_config_default_clinical_workspace_id_fkey"
            columns: ["default_clinical_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_operations_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_operations_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_operations_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      facility_ownership_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sector: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sector?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sector?: string | null
        }
        Relationships: []
      }
      facility_reconciliation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_records: number | null
          errors: Json | null
          id: string
          job_type: string
          matched_records: number | null
          new_records: number | null
          processed_records: number | null
          source_id: string | null
          started_at: string | null
          status: string | null
          total_records: number | null
          updated_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_records?: number | null
          errors?: Json | null
          id?: string
          job_type: string
          matched_records?: number | null
          new_records?: number | null
          processed_records?: number | null
          source_id?: string | null
          started_at?: string | null
          status?: string | null
          total_records?: number | null
          updated_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_records?: number | null
          errors?: Json | null
          id?: string
          job_type?: string
          matched_records?: number | null
          new_records?: number | null
          processed_records?: number | null
          source_id?: string | null
          started_at?: string | null
          status?: string | null
          total_records?: number | null
          updated_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_reconciliation_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "facility_reconciliation_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_reconciliation_matches: {
        Row: {
          candidate_facility_id: string | null
          created_at: string | null
          decision_at: string | null
          decision_by: string | null
          decision_notes: string | null
          id: string
          job_id: string | null
          match_reasons: Json | null
          match_score: number | null
          source_record: Json
          status: string | null
        }
        Insert: {
          candidate_facility_id?: string | null
          created_at?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          id?: string
          job_id?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          source_record: Json
          status?: string | null
        }
        Update: {
          candidate_facility_id?: string | null
          created_at?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          id?: string
          job_id?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          source_record?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_reconciliation_matches_candidate_facility_id_fkey"
            columns: ["candidate_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_reconciliation_matches_candidate_facility_id_fkey"
            columns: ["candidate_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_reconciliation_matches_candidate_facility_id_fkey"
            columns: ["candidate_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_reconciliation_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "facility_reconciliation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_reconciliation_sources: {
        Row: {
          connection_config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          field_mapping: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          source_type: string
          sync_frequency: string | null
        }
        Insert: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          source_type: string
          sync_frequency?: string | null
        }
        Update: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          source_type?: string
          sync_frequency?: string | null
        }
        Relationships: []
      }
      facility_registry_records: {
        Row: {
          address_line1: string | null
          approved_at: string | null
          approved_by: string | null
          bed_count: number | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          district: string | null
          email: string | null
          facility_id: string | null
          facility_type: string
          id: string
          last_modified_by: string | null
          latitude: number | null
          level: string
          longitude: number | null
          name: string
          operating_hours: string | null
          ownership: string | null
          phone: string | null
          province: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          services_offered: string[] | null
          staff_count: number | null
          status: Database["public"]["Enums"]["registry_record_status"]
          submitted_at: string | null
          submitted_by: string | null
          thuso_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bed_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          facility_id?: string | null
          facility_type: string
          id?: string
          last_modified_by?: string | null
          latitude?: number | null
          level: string
          longitude?: number | null
          name: string
          operating_hours?: string | null
          ownership?: string | null
          phone?: string | null
          province: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          thuso_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bed_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          facility_id?: string | null
          facility_type?: string
          id?: string
          last_modified_by?: string | null
          latitude?: number | null
          level?: string
          longitude?: number | null
          name?: string
          operating_hours?: string | null
          ownership?: string | null
          phone?: string | null
          province?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          thuso_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      facility_registry_roles: {
        Row: {
          can_approve: boolean | null
          can_create: boolean | null
          can_edit: boolean | null
          can_publish: boolean | null
          can_reconcile: boolean | null
          can_validate: boolean | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: string
          scope_id: string | null
          scope_type: string | null
          user_id: string
        }
        Insert: {
          can_approve?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_publish?: boolean | null
          can_reconcile?: boolean | null
          can_validate?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          scope_id?: string | null
          scope_type?: string | null
          user_id: string
        }
        Update: {
          can_approve?: boolean | null
          can_create?: boolean | null
          can_edit?: boolean | null
          can_publish?: boolean | null
          can_reconcile?: boolean | null
          can_validate?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          scope_id?: string | null
          scope_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      facility_service_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "facility_service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_services: {
        Row: {
          availability_notes: string | null
          capacity: number | null
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          facility_id: string
          id: string
          is_available: boolean | null
          operating_days: string | null
          operating_hours: string | null
          service_category_id: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          availability_notes?: string | null
          capacity?: number | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          facility_id: string
          id?: string
          is_available?: boolean | null
          operating_days?: string | null
          operating_hours?: string | null
          service_category_id?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          availability_notes?: string | null
          capacity?: number | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          facility_id?: string
          id?: string
          is_available?: boolean | null
          operating_days?: string | null
          operating_hours?: string | null
          service_category_id?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "facility_services_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "facility_service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_types: {
        Row: {
          capabilities: string[] | null
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level_of_care: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: string[] | null
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_of_care?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: string[] | null
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_of_care?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      five_rights_verification: {
        Row: {
          actual_time: string | null
          all_rights_confirmed: boolean
          created_at: string
          dose_calculated: boolean | null
          double_check_required: boolean | null
          double_checked_by: string | null
          id: string
          medication_administration_id: string | null
          medication_barcode_scanned: boolean | null
          notes: string | null
          override_reason: string | null
          patient_id: string
          patient_verification_method: string | null
          prescription_item_id: string | null
          right_dose: boolean
          right_medication: boolean
          right_patient: boolean
          right_route: boolean
          right_time: boolean
          scheduled_time: string | null
          verified_at: string
          verified_by: string
        }
        Insert: {
          actual_time?: string | null
          all_rights_confirmed?: boolean
          created_at?: string
          dose_calculated?: boolean | null
          double_check_required?: boolean | null
          double_checked_by?: string | null
          id?: string
          medication_administration_id?: string | null
          medication_barcode_scanned?: boolean | null
          notes?: string | null
          override_reason?: string | null
          patient_id: string
          patient_verification_method?: string | null
          prescription_item_id?: string | null
          right_dose?: boolean
          right_medication?: boolean
          right_patient?: boolean
          right_route?: boolean
          right_time?: boolean
          scheduled_time?: string | null
          verified_at?: string
          verified_by: string
        }
        Update: {
          actual_time?: string | null
          all_rights_confirmed?: boolean
          created_at?: string
          dose_calculated?: boolean | null
          double_check_required?: boolean | null
          double_checked_by?: string | null
          id?: string
          medication_administration_id?: string | null
          medication_barcode_scanned?: boolean | null
          notes?: string | null
          override_reason?: string | null
          patient_id?: string
          patient_verification_method?: string | null
          prescription_item_id?: string | null
          right_dose?: boolean
          right_medication?: boolean
          right_patient?: boolean
          right_route?: boolean
          right_time?: boolean
          scheduled_time?: string | null
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "five_rights_verification_medication_administration_id_fkey"
            columns: ["medication_administration_id"]
            isOneToOne: false
            referencedRelation: "medication_administrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "five_rights_verification_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "five_rights_verification_prescription_item_id_fkey"
            columns: ["prescription_item_id"]
            isOneToOne: false
            referencedRelation: "prescription_items"
            referencedColumns: ["id"]
          },
        ]
      }
      formulary: {
        Row: {
          alternatives: string[] | null
          available_strengths: string[] | null
          black_box_warning: string | null
          brand_names: string[] | null
          contraindications: string[] | null
          created_at: string
          dea_schedule: string | null
          dosage_forms: string[] | null
          drug_class: string | null
          formulary_status: string
          generic_name: string | null
          id: string
          is_active: boolean | null
          is_controlled: boolean | null
          medication_name: string
          monitoring_parameters: string[] | null
          ndc_code: string | null
          pregnancy_category: string | null
          requires_monitoring: boolean | null
          restrictions: string | null
          therapeutic_category: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          alternatives?: string[] | null
          available_strengths?: string[] | null
          black_box_warning?: string | null
          brand_names?: string[] | null
          contraindications?: string[] | null
          created_at?: string
          dea_schedule?: string | null
          dosage_forms?: string[] | null
          drug_class?: string | null
          formulary_status?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          is_controlled?: boolean | null
          medication_name: string
          monitoring_parameters?: string[] | null
          ndc_code?: string | null
          pregnancy_category?: string | null
          requires_monitoring?: boolean | null
          restrictions?: string | null
          therapeutic_category?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          alternatives?: string[] | null
          available_strengths?: string[] | null
          black_box_warning?: string | null
          brand_names?: string[] | null
          contraindications?: string[] | null
          created_at?: string
          dea_schedule?: string | null
          dosage_forms?: string[] | null
          drug_class?: string | null
          formulary_status?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          is_controlled?: boolean | null
          medication_name?: string
          monitoring_parameters?: string[] | null
          ndc_code?: string | null
          pregnancy_category?: string | null
          requires_monitoring?: boolean | null
          restrictions?: string | null
          therapeutic_category?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fulfillment_request_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          prescription_item_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          request_id: string
          unit_of_measure: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          prescription_item_id?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          request_id: string
          unit_of_measure?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          prescription_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          request_id?: string
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_request_items_prescription_item_id_fkey"
            columns: ["prescription_item_id"]
            isOneToOne: false
            referencedRelation: "prescription_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_requests: {
        Row: {
          awarded_at: string | null
          awarded_vendor_id: string | null
          bidding_deadline: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_postal_code: string | null
          delivery_province: string | null
          delivery_required: boolean | null
          encounter_id: string | null
          id: string
          notes: string | null
          patient_id: string | null
          preferred_vendor_id: string | null
          prescription_id: string | null
          priority: string | null
          request_number: string
          request_type: string
          requested_by: string | null
          status: Database["public"]["Enums"]["fulfillment_status"] | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_vendor_id?: string | null
          bidding_deadline?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_postal_code?: string | null
          delivery_province?: string | null
          delivery_required?: boolean | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          preferred_vendor_id?: string | null
          prescription_id?: string | null
          priority?: string | null
          request_number: string
          request_type?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          awarded_at?: string | null
          awarded_vendor_id?: string | null
          bidding_deadline?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_postal_code?: string | null
          delivery_province?: string | null
          delivery_required?: boolean | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          preferred_vendor_id?: string | null
          prescription_id?: string | null
          priority?: string | null
          request_number?: string
          request_type?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_requests_awarded_vendor_id_fkey"
            columns: ["awarded_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_requests_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_requests_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_requests_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_tracking: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          request_id: string
          status: Database["public"]["Enums"]["fulfillment_status"]
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          request_id: string
          status: Database["public"]["Enums"]["fulfillment_status"]
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["fulfillment_status"]
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      health_providers: {
        Row: {
          birth_country: string | null
          cadre: string
          classification: string | null
          council_registration_date: string | null
          council_registration_expires: string | null
          council_registration_number: string | null
          created_at: string
          created_by: string | null
          current_address: string | null
          date_of_birth: string
          disability_status: boolean | null
          disability_type: string | null
          email: string | null
          employee_number: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_master_record: boolean | null
          languages: string[] | null
          lifecycle_state: Database["public"]["Enums"]["provider_lifecycle_state"]
          lifecycle_state_changed_at: string | null
          lifecycle_state_changed_by: string | null
          lifecycle_state_reason: string | null
          marital_status: string | null
          merge_reason: string | null
          merged_at: string | null
          merged_into_upid: string | null
          national_id: string | null
          nationality: string | null
          other_names: string | null
          passport_number: string | null
          permanent_address: string | null
          phone: string | null
          photograph_url: string | null
          professional_council_id: string | null
          qualifications: Json | null
          religion: string | null
          residence_country: string | null
          sex: string
          specialty: string | null
          sub_specialty: string | null
          surname: string
          updated_at: string
          updated_by: string | null
          upid: string
          user_id: string | null
          user_link_verification_method: string | null
          user_link_verified_by: string | null
          user_linked_at: string | null
        }
        Insert: {
          birth_country?: string | null
          cadre: string
          classification?: string | null
          council_registration_date?: string | null
          council_registration_expires?: string | null
          council_registration_number?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          date_of_birth: string
          disability_status?: boolean | null
          disability_type?: string | null
          email?: string | null
          employee_number?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_master_record?: boolean | null
          languages?: string[] | null
          lifecycle_state?: Database["public"]["Enums"]["provider_lifecycle_state"]
          lifecycle_state_changed_at?: string | null
          lifecycle_state_changed_by?: string | null
          lifecycle_state_reason?: string | null
          marital_status?: string | null
          merge_reason?: string | null
          merged_at?: string | null
          merged_into_upid?: string | null
          national_id?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          photograph_url?: string | null
          professional_council_id?: string | null
          qualifications?: Json | null
          religion?: string | null
          residence_country?: string | null
          sex: string
          specialty?: string | null
          sub_specialty?: string | null
          surname: string
          updated_at?: string
          updated_by?: string | null
          upid: string
          user_id?: string | null
          user_link_verification_method?: string | null
          user_link_verified_by?: string | null
          user_linked_at?: string | null
        }
        Update: {
          birth_country?: string | null
          cadre?: string
          classification?: string | null
          council_registration_date?: string | null
          council_registration_expires?: string | null
          council_registration_number?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          date_of_birth?: string
          disability_status?: boolean | null
          disability_type?: string | null
          email?: string | null
          employee_number?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_master_record?: boolean | null
          languages?: string[] | null
          lifecycle_state?: Database["public"]["Enums"]["provider_lifecycle_state"]
          lifecycle_state_changed_at?: string | null
          lifecycle_state_changed_by?: string | null
          lifecycle_state_reason?: string | null
          marital_status?: string | null
          merge_reason?: string | null
          merged_at?: string | null
          merged_into_upid?: string | null
          national_id?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          photograph_url?: string | null
          professional_council_id?: string | null
          qualifications?: Json | null
          religion?: string | null
          residence_country?: string | null
          sex?: string
          specialty?: string | null
          sub_specialty?: string | null
          surname?: string
          updated_at?: string
          updated_by?: string | null
          upid?: string
          user_id?: string | null
          user_link_verification_method?: string | null
          user_link_verified_by?: string | null
          user_linked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_providers_professional_council_id_fkey"
            columns: ["professional_council_id"]
            isOneToOne: false
            referencedRelation: "professional_councils"
            referencedColumns: ["id"]
          },
        ]
      }
      hpr_audit_log: {
        Row: {
          action: string
          council_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          field_changed: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          performed_by: string
          performed_by_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          council_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          performed_by_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          council_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          performed_by_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hpr_audit_log_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "professional_councils"
            referencedColumns: ["id"]
          },
        ]
      }
      id_generation_logs: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: string
          entropy_source: string | null
          generated_id: string
          generation_method: string
          id: string
          id_format: string
          linked_entity_id: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type: string
          entropy_source?: string | null
          generated_id: string
          generation_method?: string
          id?: string
          id_format: string
          linked_entity_id?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: string
          entropy_source?: string | null
          generated_id?: string
          generation_method?: string
          id?: string
          id_format?: string
          linked_entity_id?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      id_sequence_counters: {
        Row: {
          counter_type: string
          created_at: string
          current_value: number
          id: string
          last_reset_at: string | null
          prefix: string | null
          updated_at: string
        }
        Insert: {
          counter_type: string
          created_at?: string
          current_value?: number
          id?: string
          last_reset_at?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          counter_type?: string
          created_at?: string
          current_value?: number
          id?: string
          last_reset_at?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      idp_revocation_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json | null
          processed_at: string | null
          processed_by: string | null
          provider_id: string
          sessions_revoked: number | null
          source_entity_id: string | null
          source_entity_type: string | null
          tokens_invalidated: number | null
          triggered_at: string
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          provider_id: string
          sessions_revoked?: number | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          tokens_invalidated?: number | null
          triggered_at?: string
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          provider_id?: string
          sessions_revoked?: number | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          tokens_invalidated?: number | null
          triggered_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idp_revocation_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_annotations: {
        Row: {
          annotation_data: Json
          annotation_type: string
          created_at: string
          created_by: string
          id: string
          instance_id: string
          is_key_image: boolean | null
          label: string | null
          study_id: string
          updated_at: string
        }
        Insert: {
          annotation_data: Json
          annotation_type: string
          created_at?: string
          created_by: string
          id?: string
          instance_id: string
          is_key_image?: boolean | null
          label?: string | null
          study_id: string
          updated_at?: string
        }
        Update: {
          annotation_data?: Json
          annotation_type?: string
          created_at?: string
          created_by?: string
          id?: string
          instance_id?: string
          is_key_image?: boolean | null
          label?: string | null
          study_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_annotations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "imaging_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_annotations_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_current: boolean
          notes: string | null
          priority: string
          reassign_reason: string | null
          started_at: string | null
          status: string
          study_id: string
          worklist_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          notes?: string | null
          priority?: string
          reassign_reason?: string | null
          started_at?: string | null
          status?: string
          study_id: string
          worklist_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          notes?: string | null
          priority?: string
          reassign_reason?: string | null
          started_at?: string | null
          status?: string
          study_id?: string
          worklist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_assignments_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_assignments_worklist_id_fkey"
            columns: ["worklist_id"]
            isOneToOne: false
            referencedRelation: "imaging_worklists"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_audit_log: {
        Row: {
          access_method: string | null
          action: string
          actor_facility_id: string | null
          actor_id: string
          client_ip: string | null
          created_at: string
          de_identified: boolean | null
          emergency_justification: string | null
          export_format: string | null
          id: string
          instance_id: string | null
          is_emergency_access: boolean | null
          purpose_of_use: string | null
          report_id: string | null
          series_id: string | null
          shared_with: string | null
          study_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_method?: string | null
          action: string
          actor_facility_id?: string | null
          actor_id: string
          client_ip?: string | null
          created_at?: string
          de_identified?: boolean | null
          emergency_justification?: string | null
          export_format?: string | null
          id?: string
          instance_id?: string | null
          is_emergency_access?: boolean | null
          purpose_of_use?: string | null
          report_id?: string | null
          series_id?: string | null
          shared_with?: string | null
          study_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_method?: string | null
          action?: string
          actor_facility_id?: string | null
          actor_id?: string
          client_ip?: string | null
          created_at?: string
          de_identified?: boolean | null
          emergency_justification?: string | null
          export_format?: string | null
          id?: string
          instance_id?: string | null
          is_emergency_access?: boolean | null
          purpose_of_use?: string | null
          report_id?: string | null
          series_id?: string | null
          shared_with?: string | null
          study_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_audit_log_actor_facility_id_fkey"
            columns: ["actor_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_audit_log_actor_facility_id_fkey"
            columns: ["actor_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_audit_log_actor_facility_id_fkey"
            columns: ["actor_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_audit_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "imaging_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_audit_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "imaging_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_audit_log_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "imaging_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_audit_log_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_consults: {
        Row: {
          accepted_at: string | null
          clinical_question: string | null
          consult_type: string
          consulting_facility_id: string | null
          consulting_provider_id: string | null
          created_at: string
          declined_reason: string | null
          id: string
          requesting_facility_id: string | null
          requesting_provider_id: string | null
          responded_at: string | null
          response_findings: string | null
          response_impression: string | null
          response_recommendations: string | null
          status: string
          study_id: string
          turnaround_minutes: number | null
          updated_at: string
          urgency: string
        }
        Insert: {
          accepted_at?: string | null
          clinical_question?: string | null
          consult_type?: string
          consulting_facility_id?: string | null
          consulting_provider_id?: string | null
          created_at?: string
          declined_reason?: string | null
          id?: string
          requesting_facility_id?: string | null
          requesting_provider_id?: string | null
          responded_at?: string | null
          response_findings?: string | null
          response_impression?: string | null
          response_recommendations?: string | null
          status?: string
          study_id: string
          turnaround_minutes?: number | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          accepted_at?: string | null
          clinical_question?: string | null
          consult_type?: string
          consulting_facility_id?: string | null
          consulting_provider_id?: string | null
          created_at?: string
          declined_reason?: string | null
          id?: string
          requesting_facility_id?: string | null
          requesting_provider_id?: string | null
          responded_at?: string | null
          response_findings?: string | null
          response_impression?: string | null
          response_recommendations?: string | null
          status?: string
          study_id?: string
          turnaround_minutes?: number | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_consults_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_consults_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_consults_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_consults_requesting_facility_id_fkey"
            columns: ["requesting_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_consults_requesting_facility_id_fkey"
            columns: ["requesting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_consults_requesting_facility_id_fkey"
            columns: ["requesting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_consults_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_critical_findings: {
        Row: {
          confirmation_details: string | null
          created_at: string
          escalated_at: string | null
          escalated_to: string | null
          finding_description: string
          first_notified_at: string | null
          id: string
          notification_attempts: number | null
          notification_confirmed_at: string | null
          notification_method: string | null
          notification_required: boolean
          notified_by: string | null
          notified_to: string | null
          report_id: string | null
          severity: string
          status: string
          study_id: string
          updated_at: string
        }
        Insert: {
          confirmation_details?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          finding_description: string
          first_notified_at?: string | null
          id?: string
          notification_attempts?: number | null
          notification_confirmed_at?: string | null
          notification_method?: string | null
          notification_required?: boolean
          notified_by?: string | null
          notified_to?: string | null
          report_id?: string | null
          severity?: string
          status?: string
          study_id: string
          updated_at?: string
        }
        Update: {
          confirmation_details?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          finding_description?: string
          first_notified_at?: string | null
          id?: string
          notification_attempts?: number | null
          notification_confirmed_at?: string | null
          notification_method?: string | null
          notification_required?: boolean
          notified_by?: string | null
          notified_to?: string | null
          report_id?: string | null
          severity?: string
          status?: string
          study_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_critical_findings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "imaging_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_critical_findings_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_deidentification_jobs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          custom_tag_removals: string[] | null
          date_shift_days: number | null
          error_message: string | null
          id: string
          output_format: string | null
          output_location: string | null
          project_name: string | null
          purpose: string
          rejection_reason: string | null
          remove_dates: boolean | null
          remove_institution: boolean | null
          remove_patient_id: boolean | null
          remove_patient_name: boolean | null
          remove_physician_names: boolean | null
          requested_by: string
          status: string
          study_ids: string[]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          custom_tag_removals?: string[] | null
          date_shift_days?: number | null
          error_message?: string | null
          id?: string
          output_format?: string | null
          output_location?: string | null
          project_name?: string | null
          purpose: string
          rejection_reason?: string | null
          remove_dates?: boolean | null
          remove_institution?: boolean | null
          remove_patient_id?: boolean | null
          remove_patient_name?: boolean | null
          remove_physician_names?: boolean | null
          requested_by: string
          status?: string
          study_ids: string[]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          custom_tag_removals?: string[] | null
          date_shift_days?: number | null
          error_message?: string | null
          id?: string
          output_format?: string | null
          output_location?: string | null
          project_name?: string | null
          purpose?: string
          rejection_reason?: string | null
          remove_dates?: boolean | null
          remove_institution?: boolean | null
          remove_patient_id?: boolean | null
          remove_patient_name?: boolean | null
          remove_physician_names?: boolean | null
          requested_by?: string
          status?: string
          study_ids?: string[]
        }
        Relationships: []
      }
      imaging_hanging_protocols: {
        Row: {
          auto_compare_priors: boolean | null
          auto_link_scrolling: boolean | null
          body_part: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          initial_window_preset: string | null
          is_active: boolean
          is_default: boolean | null
          layout_type: string
          modality: string
          name: string
          sort_order: number | null
          viewport_config: Json
        }
        Insert: {
          auto_compare_priors?: boolean | null
          auto_link_scrolling?: boolean | null
          body_part?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initial_window_preset?: string | null
          is_active?: boolean
          is_default?: boolean | null
          layout_type?: string
          modality: string
          name: string
          sort_order?: number | null
          viewport_config?: Json
        }
        Update: {
          auto_compare_priors?: boolean | null
          auto_link_scrolling?: boolean | null
          body_part?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initial_window_preset?: string | null
          is_active?: boolean
          is_default?: boolean | null
          layout_type?: string
          modality?: string
          name?: string
          sort_order?: number | null
          viewport_config?: Json
        }
        Relationships: []
      }
      imaging_instances: {
        Row: {
          bits_allocated: number | null
          columns: number | null
          created_at: string
          file_size_bytes: number | null
          id: string
          instance_number: number | null
          pixel_spacing: number[] | null
          rows: number | null
          series_id: string
          sop_class_uid: string | null
          sop_instance_uid: string
          storage_path: string
          transfer_syntax_uid: string | null
          window_center: number | null
          window_width: number | null
        }
        Insert: {
          bits_allocated?: number | null
          columns?: number | null
          created_at?: string
          file_size_bytes?: number | null
          id?: string
          instance_number?: number | null
          pixel_spacing?: number[] | null
          rows?: number | null
          series_id: string
          sop_class_uid?: string | null
          sop_instance_uid: string
          storage_path: string
          transfer_syntax_uid?: string | null
          window_center?: number | null
          window_width?: number | null
        }
        Update: {
          bits_allocated?: number | null
          columns?: number | null
          created_at?: string
          file_size_bytes?: number | null
          id?: string
          instance_number?: number | null
          pixel_spacing?: number[] | null
          rows?: number | null
          series_id?: string
          sop_class_uid?: string | null
          sop_instance_uid?: string
          storage_path?: string
          transfer_syntax_uid?: string | null
          window_center?: number | null
          window_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_instances_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "imaging_series"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_lifecycle_policies: {
        Row: {
          cold_storage_days: number
          created_at: string
          deletion_after_days: number | null
          description: string | null
          facility_id: string | null
          hot_storage_days: number
          id: string
          is_active: boolean
          legal_hold_category: string | null
          modality: string[] | null
          name: string
          patient_age_category: string | null
          warm_storage_days: number
        }
        Insert: {
          cold_storage_days?: number
          created_at?: string
          deletion_after_days?: number | null
          description?: string | null
          facility_id?: string | null
          hot_storage_days?: number
          id?: string
          is_active?: boolean
          legal_hold_category?: string | null
          modality?: string[] | null
          name: string
          patient_age_category?: string | null
          warm_storage_days?: number
        }
        Update: {
          cold_storage_days?: number
          created_at?: string
          deletion_after_days?: number | null
          description?: string | null
          facility_id?: string | null
          hot_storage_days?: number
          id?: string
          is_active?: boolean
          legal_hold_category?: string | null
          modality?: string[] | null
          name?: string
          patient_age_category?: string | null
          warm_storage_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "imaging_lifecycle_policies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_lifecycle_policies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_lifecycle_policies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      imaging_prefetch_rules: {
        Row: {
          body_part: string[] | null
          created_at: string
          id: string
          is_active: boolean
          lookback_days: number
          max_priors: number | null
          modality: string[] | null
          name: string
          same_body_part_only: boolean | null
          same_modality_only: boolean | null
        }
        Insert: {
          body_part?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          lookback_days?: number
          max_priors?: number | null
          modality?: string[] | null
          name: string
          same_body_part_only?: boolean | null
          same_modality_only?: boolean | null
        }
        Update: {
          body_part?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          lookback_days?: number
          max_priors?: number | null
          modality?: string[] | null
          name?: string
          same_body_part_only?: boolean | null
          same_modality_only?: boolean | null
        }
        Relationships: []
      }
      imaging_prefetched_priors: {
        Row: {
          created_at: string
          current_study_id: string
          fetched_at: string | null
          id: string
          prefetch_rule_id: string | null
          prior_study_id: string
          status: string
        }
        Insert: {
          created_at?: string
          current_study_id: string
          fetched_at?: string | null
          id?: string
          prefetch_rule_id?: string | null
          prior_study_id: string
          status?: string
        }
        Update: {
          created_at?: string
          current_study_id?: string
          fetched_at?: string | null
          id?: string
          prefetch_rule_id?: string | null
          prior_study_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_prefetched_priors_current_study_id_fkey"
            columns: ["current_study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_prefetched_priors_prefetch_rule_id_fkey"
            columns: ["prefetch_rule_id"]
            isOneToOne: false
            referencedRelation: "imaging_prefetch_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_prefetched_priors_prior_study_id_fkey"
            columns: ["prior_study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_reports: {
        Row: {
          amendment_reason: string | null
          clinical_history: string | null
          comparison_studies: string | null
          created_at: string
          critical_finding_details: string | null
          critical_finding_notified_at: string | null
          critical_finding_notified_to: string | null
          findings: string | null
          has_critical_finding: boolean | null
          id: string
          impression: string | null
          previous_report_id: string | null
          recommendations: string | null
          reported_at: string | null
          reported_by: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          study_id: string
          technique: string | null
          updated_at: string
        }
        Insert: {
          amendment_reason?: string | null
          clinical_history?: string | null
          comparison_studies?: string | null
          created_at?: string
          critical_finding_details?: string | null
          critical_finding_notified_at?: string | null
          critical_finding_notified_to?: string | null
          findings?: string | null
          has_critical_finding?: boolean | null
          id?: string
          impression?: string | null
          previous_report_id?: string | null
          recommendations?: string | null
          reported_at?: string | null
          reported_by?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          study_id: string
          technique?: string | null
          updated_at?: string
        }
        Update: {
          amendment_reason?: string | null
          clinical_history?: string | null
          comparison_studies?: string | null
          created_at?: string
          critical_finding_details?: string | null
          critical_finding_notified_at?: string | null
          critical_finding_notified_to?: string | null
          findings?: string | null
          has_critical_finding?: boolean | null
          id?: string
          impression?: string | null
          previous_report_id?: string | null
          recommendations?: string | null
          reported_at?: string | null
          reported_by?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          study_id?: string
          technique?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_reports_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_routing_rules: {
        Row: {
          auto_assign_to: string | null
          body_part_match: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          modality_match: string[] | null
          name: string
          notify_providers: string[] | null
          priority: number
          set_priority: string | null
          source_facility_id: string | null
          study_description_pattern: string | null
          target_facility_id: string | null
          target_worklist_id: string | null
          updated_at: string
        }
        Insert: {
          auto_assign_to?: string | null
          body_part_match?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          modality_match?: string[] | null
          name: string
          notify_providers?: string[] | null
          priority?: number
          set_priority?: string | null
          source_facility_id?: string | null
          study_description_pattern?: string | null
          target_facility_id?: string | null
          target_worklist_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_assign_to?: string | null
          body_part_match?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          modality_match?: string[] | null
          name?: string
          notify_providers?: string[] | null
          priority?: number
          set_priority?: string | null
          source_facility_id?: string | null
          study_description_pattern?: string | null
          target_facility_id?: string | null
          target_worklist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_target_facility_id_fkey"
            columns: ["target_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_routing_rules_target_worklist_id_fkey"
            columns: ["target_worklist_id"]
            isOneToOne: false
            referencedRelation: "imaging_worklists"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_series: {
        Row: {
          body_part_examined: string | null
          created_at: string
          id: string
          modality: string
          number_of_instances: number | null
          protocol_name: string | null
          series_description: string | null
          series_instance_uid: string
          series_number: number | null
          slice_thickness: number | null
          spacing_between_slices: number | null
          study_id: string
        }
        Insert: {
          body_part_examined?: string | null
          created_at?: string
          id?: string
          modality: string
          number_of_instances?: number | null
          protocol_name?: string | null
          series_description?: string | null
          series_instance_uid: string
          series_number?: number | null
          slice_thickness?: number | null
          spacing_between_slices?: number | null
          study_id: string
        }
        Update: {
          body_part_examined?: string | null
          created_at?: string
          id?: string
          modality?: string
          number_of_instances?: number | null
          protocol_name?: string | null
          series_description?: string | null
          series_instance_uid?: string
          series_number?: number | null
          slice_thickness?: number | null
          spacing_between_slices?: number | null
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_series_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_studies: {
        Row: {
          accession_number: string | null
          archive_location: string | null
          archived_at: string | null
          body_part: string | null
          created_at: string
          deleted_at: string | null
          encounter_id: string | null
          facility_id: string | null
          health_id: string | null
          id: string
          institution_name: string | null
          is_archived: boolean | null
          legal_hold_reason: string | null
          legal_hold_until: string | null
          lifecycle_policy_id: string | null
          lifecycle_status: string | null
          modality: string
          number_of_instances: number | null
          number_of_series: number | null
          order_id: string | null
          patient_id: string
          performing_physician: string | null
          priority: string | null
          referring_physician: string | null
          station_name: string | null
          status: string
          storage_location: string | null
          study_date: string
          study_description: string | null
          study_instance_uid: string
          study_time: string | null
          updated_at: string
          workflow_status: string | null
        }
        Insert: {
          accession_number?: string | null
          archive_location?: string | null
          archived_at?: string | null
          body_part?: string | null
          created_at?: string
          deleted_at?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          health_id?: string | null
          id?: string
          institution_name?: string | null
          is_archived?: boolean | null
          legal_hold_reason?: string | null
          legal_hold_until?: string | null
          lifecycle_policy_id?: string | null
          lifecycle_status?: string | null
          modality: string
          number_of_instances?: number | null
          number_of_series?: number | null
          order_id?: string | null
          patient_id: string
          performing_physician?: string | null
          priority?: string | null
          referring_physician?: string | null
          station_name?: string | null
          status?: string
          storage_location?: string | null
          study_date: string
          study_description?: string | null
          study_instance_uid: string
          study_time?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Update: {
          accession_number?: string | null
          archive_location?: string | null
          archived_at?: string | null
          body_part?: string | null
          created_at?: string
          deleted_at?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          health_id?: string | null
          id?: string
          institution_name?: string | null
          is_archived?: boolean | null
          legal_hold_reason?: string | null
          legal_hold_until?: string | null
          lifecycle_policy_id?: string | null
          lifecycle_status?: string | null
          modality?: string
          number_of_instances?: number | null
          number_of_series?: number | null
          order_id?: string | null
          patient_id?: string
          performing_physician?: string | null
          priority?: string | null
          referring_physician?: string | null
          station_name?: string | null
          status?: string
          storage_location?: string | null
          study_date?: string
          study_description?: string | null
          study_instance_uid?: string
          study_time?: string | null
          updated_at?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_studies_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_studies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_studies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_studies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_studies_lifecycle_policy_id_fkey"
            columns: ["lifecycle_policy_id"]
            isOneToOne: false
            referencedRelation: "imaging_lifecycle_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_studies_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "clinical_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_studies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_tat_metrics: {
        Row: {
          acquired_at: string | null
          acquisition_to_report: number | null
          assigned_at: string | null
          created_at: string
          facility_id: string | null
          final_reported_at: string | null
          id: string
          modality: string
          order_to_acquisition: number | null
          ordered_at: string | null
          prelim_reported_at: string | null
          priority: string
          read_started_at: string | null
          received_at: string | null
          sla_met: boolean | null
          sla_target_minutes: number | null
          study_id: string
          total_tat: number | null
        }
        Insert: {
          acquired_at?: string | null
          acquisition_to_report?: number | null
          assigned_at?: string | null
          created_at?: string
          facility_id?: string | null
          final_reported_at?: string | null
          id?: string
          modality: string
          order_to_acquisition?: number | null
          ordered_at?: string | null
          prelim_reported_at?: string | null
          priority: string
          read_started_at?: string | null
          received_at?: string | null
          sla_met?: boolean | null
          sla_target_minutes?: number | null
          study_id: string
          total_tat?: number | null
        }
        Update: {
          acquired_at?: string | null
          acquisition_to_report?: number | null
          assigned_at?: string | null
          created_at?: string
          facility_id?: string | null
          final_reported_at?: string | null
          id?: string
          modality?: string
          order_to_acquisition?: number | null
          ordered_at?: string | null
          prelim_reported_at?: string | null
          priority?: string
          read_started_at?: string | null
          received_at?: string | null
          sla_met?: boolean | null
          sla_target_minutes?: number | null
          study_id?: string
          total_tat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_tat_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_tat_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_tat_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_tat_metrics_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "imaging_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_worklists: {
        Row: {
          auto_assign_provider_id: string | null
          body_part_filter: string[] | null
          created_at: string
          description: string | null
          facility_id: string | null
          id: string
          is_active: boolean
          modality_filter: string[] | null
          name: string
          pool_providers: string[] | null
          priority_filter: string[] | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          auto_assign_provider_id?: string | null
          body_part_filter?: string[] | null
          created_at?: string
          description?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean
          modality_filter?: string[] | null
          name: string
          pool_providers?: string[] | null
          priority_filter?: string[] | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          auto_assign_provider_id?: string | null
          body_part_filter?: string[] | null
          created_at?: string
          description?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean
          modality_filter?: string[] | null
          name?: string
          pool_providers?: string[] | null
          priority_filter?: string[] | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_worklists_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_worklists_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "imaging_worklists_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_number: string
          created_at: string
          created_by: string | null
          denial_reason: string | null
          encounter_id: string | null
          id: string
          insurance_provider: string
          notes: string | null
          patient_id: string
          policy_number: string | null
          response_at: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          claim_number: string
          created_at?: string
          created_by?: string | null
          denial_reason?: string | null
          encounter_id?: string | null
          id?: string
          insurance_provider: string
          notes?: string | null
          patient_id: string
          policy_number?: string | null
          response_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          claim_number?: string
          created_at?: string
          created_by?: string | null
          denial_reason?: string | null
          encounter_id?: string | null
          id?: string
          insurance_provider?: string
          notes?: string | null
          patient_id?: string
          policy_number?: string | null
          response_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          charge_sheet_id: string | null
          created_at: string | null
          description: string
          discount_amount: number | null
          id: string
          invoice_id: string
          line_number: number
          quantity: number
          service_code: string | null
          service_date: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          charge_sheet_id?: string | null
          created_at?: string | null
          description: string
          discount_amount?: number | null
          id?: string
          invoice_id: string
          line_number: number
          quantity?: number
          service_code?: string | null
          service_date?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          charge_sheet_id?: string | null
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          id?: string
          invoice_id?: string
          line_number?: number
          quantity?: number
          service_code?: string | null
          service_date?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_charge_sheet_id_fkey"
            columns: ["charge_sheet_id"]
            isOneToOne: false
            referencedRelation: "charge_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string | null
          amount_paid: number | null
          balance_due: number
          created_at: string | null
          created_by: string | null
          currency: string
          discount_amount: number | null
          due_date: string | null
          facility_id: string | null
          finalized_by: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          last_reminder_sent: string | null
          notes: string | null
          paid_at: string | null
          patient_id: string
          payer_id: string | null
          payer_name: string | null
          payer_type: Database["public"]["Enums"]["payer_type"]
          reminder_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount_paid?: number | null
          balance_due?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          facility_id?: string | null
          finalized_by?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          last_reminder_sent?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          payer_id?: string | null
          payer_name?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"]
          reminder_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount_paid?: number | null
          balance_due?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          facility_id?: string | null
          finalized_by?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          last_reminder_sent?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          payer_id?: string | null
          payer_name?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"]
          reminder_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "invoices_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_enabled: boolean
          is_range: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_enabled?: boolean
          is_range?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_enabled?: boolean
          is_range?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      jurisdiction_assignments: {
        Row: {
          above_site_role_id: string
          created_at: string | null
          district_codes: string[] | null
          effective_from: string
          effective_to: string | null
          facility_ids: string[] | null
          id: string
          is_active: boolean | null
          jurisdiction_level: Database["public"]["Enums"]["jurisdiction_level"]
          programme_code: string | null
          programme_name: string | null
          province_codes: string[] | null
          updated_at: string | null
          virtual_pool_ids: string[] | null
        }
        Insert: {
          above_site_role_id: string
          created_at?: string | null
          district_codes?: string[] | null
          effective_from?: string
          effective_to?: string | null
          facility_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          jurisdiction_level: Database["public"]["Enums"]["jurisdiction_level"]
          programme_code?: string | null
          programme_name?: string | null
          province_codes?: string[] | null
          updated_at?: string | null
          virtual_pool_ids?: string[] | null
        }
        Update: {
          above_site_role_id?: string
          created_at?: string | null
          district_codes?: string[] | null
          effective_from?: string
          effective_to?: string | null
          facility_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          jurisdiction_level?: Database["public"]["Enums"]["jurisdiction_level"]
          programme_code?: string | null
          programme_name?: string | null
          province_codes?: string[] | null
          updated_at?: string | null
          virtual_pool_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_assignments_above_site_role_id_fkey"
            columns: ["above_site_role_id"]
            isOneToOne: false
            referencedRelation: "above_site_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_analyzers: {
        Row: {
          analyzer_code: string
          connection_config: Json | null
          connection_type: string | null
          created_at: string
          department: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          last_calibration_at: string | null
          last_maintenance_at: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_at: string | null
          serial_number: string | null
          status: string
          tests_supported: string[] | null
          updated_at: string
          uptime_percent: number | null
        }
        Insert: {
          analyzer_code: string
          connection_config?: Json | null
          connection_type?: string | null
          created_at?: string
          department?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          last_calibration_at?: string | null
          last_maintenance_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_at?: string | null
          serial_number?: string | null
          status?: string
          tests_supported?: string[] | null
          updated_at?: string
          uptime_percent?: number | null
        }
        Update: {
          analyzer_code?: string
          connection_config?: Json | null
          connection_type?: string | null
          created_at?: string
          department?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          last_calibration_at?: string | null
          last_maintenance_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_at?: string | null
          serial_number?: string | null
          status?: string
          tests_supported?: string[] | null
          updated_at?: string
          uptime_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_analyzers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_analyzers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_analyzers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      lab_critical_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_message: string
          created_at: string
          critical_type: string
          encounter_id: string | null
          escalated_at: string | null
          escalated_to: string | null
          id: string
          lab_result_id: string
          notified_providers: string[] | null
          patient_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          result_value: string
          status: string
          test_name: string
          urgency: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_message: string
          created_at?: string
          critical_type: string
          encounter_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          lab_result_id: string
          notified_providers?: string[] | null
          patient_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          result_value: string
          status?: string
          test_name: string
          urgency?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_message?: string
          created_at?: string
          critical_type?: string
          encounter_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          lab_result_id?: string
          notified_providers?: string[] | null
          patient_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          result_value?: string
          status?: string
          test_name?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_critical_alerts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_critical_alerts_lab_result_id_fkey"
            columns: ["lab_result_id"]
            isOneToOne: false
            referencedRelation: "lab_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_critical_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_order_tests: {
        Row: {
          created_at: string
          id: string
          lab_order_id: string
          priority: string | null
          rejection_code_id: string | null
          rejection_notes: string | null
          specimen_id: string | null
          status: string
          test_catalog_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lab_order_id: string
          priority?: string | null
          rejection_code_id?: string | null
          rejection_notes?: string | null
          specimen_id?: string | null
          status?: string
          test_catalog_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lab_order_id?: string
          priority?: string | null
          rejection_code_id?: string | null
          rejection_notes?: string | null
          specimen_id?: string | null
          status?: string
          test_catalog_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_tests_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_tests_rejection_code_id_fkey"
            columns: ["rejection_code_id"]
            isOneToOne: false
            referencedRelation: "lab_rejection_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_tests_specimen_id_fkey"
            columns: ["specimen_id"]
            isOneToOne: false
            referencedRelation: "specimens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_tests_test_catalog_id_fkey"
            columns: ["test_catalog_id"]
            isOneToOne: false
            referencedRelation: "lab_test_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          biosafety_level: string | null
          clinical_indication: string | null
          collection_instructions: string | null
          created_at: string
          department: string | null
          diagnosis_code: string | null
          diagnosis_system: string | null
          encounter_id: string | null
          id: string
          infection_control_flags: string[] | null
          is_stat: boolean | null
          notes: string | null
          order_number: string
          ordered_at: string
          ordered_by: string | null
          ordering_facility_id: string | null
          patient_id: string
          performing_lab_id: string | null
          priority: string
          received_at: string | null
          received_by: string | null
          routing_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          biosafety_level?: string | null
          clinical_indication?: string | null
          collection_instructions?: string | null
          created_at?: string
          department?: string | null
          diagnosis_code?: string | null
          diagnosis_system?: string | null
          encounter_id?: string | null
          id?: string
          infection_control_flags?: string[] | null
          is_stat?: boolean | null
          notes?: string | null
          order_number: string
          ordered_at?: string
          ordered_by?: string | null
          ordering_facility_id?: string | null
          patient_id: string
          performing_lab_id?: string | null
          priority?: string
          received_at?: string | null
          received_by?: string | null
          routing_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          biosafety_level?: string | null
          clinical_indication?: string | null
          collection_instructions?: string | null
          created_at?: string
          department?: string | null
          diagnosis_code?: string | null
          diagnosis_system?: string | null
          encounter_id?: string | null
          id?: string
          infection_control_flags?: string[] | null
          is_stat?: boolean | null
          notes?: string | null
          order_number?: string
          ordered_at?: string
          ordered_by?: string | null
          ordering_facility_id?: string | null
          patient_id?: string
          performing_lab_id?: string | null
          priority?: string
          received_at?: string | null
          received_by?: string | null
          routing_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_ordering_facility_id_fkey"
            columns: ["ordering_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_ordering_facility_id_fkey"
            columns: ["ordering_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_orders_ordering_facility_id_fkey"
            columns: ["ordering_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_performing_lab_id_fkey"
            columns: ["performing_lab_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_performing_lab_id_fkey"
            columns: ["performing_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_orders_performing_lab_id_fkey"
            columns: ["performing_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      lab_qc_lots: {
        Row: {
          analyzer_id: string | null
          created_at: string
          expiry_date: string
          id: string
          is_active: boolean | null
          level: string
          lot_number: string
          manufacturer: string | null
          material_name: string
          opened_at: string | null
          target_mean: number
          target_sd: number
          test_catalog_id: string | null
          unit: string | null
        }
        Insert: {
          analyzer_id?: string | null
          created_at?: string
          expiry_date: string
          id?: string
          is_active?: boolean | null
          level: string
          lot_number: string
          manufacturer?: string | null
          material_name: string
          opened_at?: string | null
          target_mean: number
          target_sd: number
          test_catalog_id?: string | null
          unit?: string | null
        }
        Update: {
          analyzer_id?: string | null
          created_at?: string
          expiry_date?: string
          id?: string
          is_active?: boolean | null
          level?: string
          lot_number?: string
          manufacturer?: string | null
          material_name?: string
          opened_at?: string | null
          target_mean?: number
          target_sd?: number
          test_catalog_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_qc_lots_analyzer_id_fkey"
            columns: ["analyzer_id"]
            isOneToOne: false
            referencedRelation: "lab_analyzers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_qc_lots_test_catalog_id_fkey"
            columns: ["test_catalog_id"]
            isOneToOne: false
            referencedRelation: "lab_test_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_qc_runs: {
        Row: {
          analyzer_id: string
          comments: string | null
          created_at: string
          cv_percent: number | null
          id: string
          performed_by: string
          qc_lot_id: string
          result_value: number
          reviewed_at: string | null
          reviewed_by: string | null
          run_date: string
          run_time: string
          status: string
          westgard_rules_violated: string[] | null
          z_score: number | null
        }
        Insert: {
          analyzer_id: string
          comments?: string | null
          created_at?: string
          cv_percent?: number | null
          id?: string
          performed_by: string
          qc_lot_id: string
          result_value: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_date?: string
          run_time?: string
          status?: string
          westgard_rules_violated?: string[] | null
          z_score?: number | null
        }
        Update: {
          analyzer_id?: string
          comments?: string | null
          created_at?: string
          cv_percent?: number | null
          id?: string
          performed_by?: string
          qc_lot_id?: string
          result_value?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_date?: string
          run_time?: string
          status?: string
          westgard_rules_violated?: string[] | null
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_qc_runs_analyzer_id_fkey"
            columns: ["analyzer_id"]
            isOneToOne: false
            referencedRelation: "lab_analyzers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_qc_runs_qc_lot_id_fkey"
            columns: ["qc_lot_id"]
            isOneToOne: false
            referencedRelation: "lab_qc_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_rejection_codes: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          requires_recollection: boolean | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          requires_recollection?: boolean | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          requires_recollection?: boolean | null
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          analyzer_id: string | null
          category: string | null
          clinical_validated_at: string | null
          clinical_validated_by: string | null
          created_at: string
          delta_check_flag: boolean | null
          delta_check_value: string | null
          id: string
          is_abnormal: boolean | null
          is_critical: boolean | null
          lab_order_id: string
          lab_order_test_id: string | null
          loinc_code: string | null
          method: string | null
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          previous_result_date: string | null
          previous_result_value: string | null
          reference_range: string | null
          released_at: string | null
          released_by: string | null
          result_interpretation: string | null
          result_unit: string | null
          result_value: string | null
          specimen_id: string | null
          status: string
          technical_validated_at: string | null
          technical_validated_by: string | null
          test_code: string | null
          test_name: string
          ucum_unit: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          analyzer_id?: string | null
          category?: string | null
          clinical_validated_at?: string | null
          clinical_validated_by?: string | null
          created_at?: string
          delta_check_flag?: boolean | null
          delta_check_value?: string | null
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          lab_order_id: string
          lab_order_test_id?: string | null
          loinc_code?: string | null
          method?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_result_date?: string | null
          previous_result_value?: string | null
          reference_range?: string | null
          released_at?: string | null
          released_by?: string | null
          result_interpretation?: string | null
          result_unit?: string | null
          result_value?: string | null
          specimen_id?: string | null
          status?: string
          technical_validated_at?: string | null
          technical_validated_by?: string | null
          test_code?: string | null
          test_name: string
          ucum_unit?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          analyzer_id?: string | null
          category?: string | null
          clinical_validated_at?: string | null
          clinical_validated_by?: string | null
          created_at?: string
          delta_check_flag?: boolean | null
          delta_check_value?: string | null
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          lab_order_id?: string
          lab_order_test_id?: string | null
          loinc_code?: string | null
          method?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_result_date?: string | null
          previous_result_value?: string | null
          reference_range?: string | null
          released_at?: string | null
          released_by?: string | null
          result_interpretation?: string | null
          result_unit?: string | null
          result_value?: string | null
          specimen_id?: string | null
          status?: string
          technical_validated_at?: string | null
          technical_validated_by?: string | null
          test_code?: string | null
          test_name?: string
          ucum_unit?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_lab_order_test_id_fkey"
            columns: ["lab_order_test_id"]
            isOneToOne: false
            referencedRelation: "lab_order_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_specimen_id_fkey"
            columns: ["specimen_id"]
            isOneToOne: false
            referencedRelation: "specimens"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_routing_rules: {
        Row: {
          conditions: Json | null
          created_at: string
          destination_lab_id: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          source_facility_id: string | null
          test_categories: string[] | null
          test_codes: string[] | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          destination_lab_id?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          source_facility_id?: string | null
          test_categories?: string[] | null
          test_codes?: string[] | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          destination_lab_id?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          source_facility_id?: string | null
          test_categories?: string[] | null
          test_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_routing_rules_destination_lab_id_fkey"
            columns: ["destination_lab_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_routing_rules_destination_lab_id_fkey"
            columns: ["destination_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_routing_rules_destination_lab_id_fkey"
            columns: ["destination_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "lab_routing_rules_source_facility_id_fkey"
            columns: ["source_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      lab_test_catalog: {
        Row: {
          age_max_years: number | null
          age_min_years: number | null
          category: string
          collection_instructions: string | null
          created_at: string
          critical_high: number | null
          critical_low: number | null
          department: string | null
          facility_availability: string[] | null
          gender_specific: string | null
          id: string
          is_active: boolean | null
          is_orderable: boolean | null
          is_panel: boolean | null
          loinc_code: string | null
          panel_components: string[] | null
          reference_range_high: number | null
          reference_range_low: number | null
          reference_range_text: string | null
          requires_fasting: boolean | null
          result_type: string | null
          result_unit: string | null
          short_name: string | null
          specimen_snomed_code: string | null
          specimen_type: string
          stability_hours: number | null
          temperature_requirement: string | null
          test_code: string
          test_name: string
          turnaround_time_hours: number | null
          ucum_unit: string | null
          updated_at: string
        }
        Insert: {
          age_max_years?: number | null
          age_min_years?: number | null
          category: string
          collection_instructions?: string | null
          created_at?: string
          critical_high?: number | null
          critical_low?: number | null
          department?: string | null
          facility_availability?: string[] | null
          gender_specific?: string | null
          id?: string
          is_active?: boolean | null
          is_orderable?: boolean | null
          is_panel?: boolean | null
          loinc_code?: string | null
          panel_components?: string[] | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          reference_range_text?: string | null
          requires_fasting?: boolean | null
          result_type?: string | null
          result_unit?: string | null
          short_name?: string | null
          specimen_snomed_code?: string | null
          specimen_type: string
          stability_hours?: number | null
          temperature_requirement?: string | null
          test_code: string
          test_name: string
          turnaround_time_hours?: number | null
          ucum_unit?: string | null
          updated_at?: string
        }
        Update: {
          age_max_years?: number | null
          age_min_years?: number | null
          category?: string
          collection_instructions?: string | null
          created_at?: string
          critical_high?: number | null
          critical_low?: number | null
          department?: string | null
          facility_availability?: string[] | null
          gender_specific?: string | null
          id?: string
          is_active?: boolean | null
          is_orderable?: boolean | null
          is_panel?: boolean | null
          loinc_code?: string | null
          panel_components?: string[] | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          reference_range_text?: string | null
          requires_fasting?: boolean | null
          result_type?: string | null
          result_unit?: string | null
          short_name?: string | null
          specimen_snomed_code?: string | null
          specimen_type?: string
          stability_hours?: number | null
          temperature_requirement?: string | null
          test_code?: string
          test_name?: string
          turnaround_time_hours?: number | null
          ucum_unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_workflow_events: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          facility_id: string | null
          from_status: string | null
          id: string
          metadata: Json | null
          notes: string | null
          performed_by: string
          to_status: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          facility_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by: string
          to_status?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          facility_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by?: string
          to_status?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          created_at: string
          end_date: string
          half_day_end: boolean | null
          half_day_start: boolean | null
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          created_at?: string
          end_date: string
          half_day_end?: boolean | null
          half_day_start?: boolean | null
          id?: string
          leave_type: string
          reason?: string | null
          rejection_reason?: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          created_at?: string
          end_date?: string
          half_day_end?: boolean | null
          half_day_start?: boolean | null
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          staff_id?: string
          staff_name?: string
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      license_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          license_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          payment_type: string
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processed_by: string | null
          provider_id: string
          receipt_number: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          license_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_type: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_id: string
          receipt_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          license_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_id?: string
          receipt_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_payments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "provider_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      license_renewal_applications: {
        Row: {
          application_date: string
          application_number: string | null
          cpd_cycle_id: string | null
          cpd_points_verified: boolean | null
          created_at: string
          current_expiry_date: string
          decision_notes: string | null
          documents_verified: boolean | null
          id: string
          license_id: string | null
          new_expiry_date: string | null
          new_license_id: string | null
          payment_id: string | null
          provider_id: string
          requested_period_years: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          application_date?: string
          application_number?: string | null
          cpd_cycle_id?: string | null
          cpd_points_verified?: boolean | null
          created_at?: string
          current_expiry_date: string
          decision_notes?: string | null
          documents_verified?: boolean | null
          id?: string
          license_id?: string | null
          new_expiry_date?: string | null
          new_license_id?: string | null
          payment_id?: string | null
          provider_id: string
          requested_period_years?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          application_date?: string
          application_number?: string | null
          cpd_cycle_id?: string | null
          cpd_points_verified?: boolean | null
          created_at?: string
          current_expiry_date?: string
          decision_notes?: string | null
          documents_verified?: boolean | null
          id?: string
          license_id?: string | null
          new_expiry_date?: string | null
          new_license_id?: string | null
          payment_id?: string | null
          provider_id?: string
          requested_period_years?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_renewal_applications_cpd_cycle_id_fkey"
            columns: ["cpd_cycle_id"]
            isOneToOne: false
            referencedRelation: "provider_cpd_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_applications_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "provider_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_applications_new_license_id_fkey"
            columns: ["new_license_id"]
            isOneToOne: false
            referencedRelation: "provider_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_applications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "license_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_renewal_applications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          registration_number: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          registration_number?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          registration_number?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      mccd_records: {
        Row: {
          antecedent_cause_a: string | null
          antecedent_cause_a_duration: string | null
          antecedent_cause_a_icd: string | null
          antecedent_cause_b: string | null
          antecedent_cause_b_duration: string | null
          antecedent_cause_b_icd: string | null
          antecedent_cause_c: string | null
          antecedent_cause_c_duration: string | null
          antecedent_cause_c_icd: string | null
          autopsy_findings: string | null
          autopsy_findings_available: boolean | null
          autopsy_performed: boolean | null
          certificate_number: string | null
          certification_date: string
          certifier_facility_id: string | null
          certifier_id: string | null
          certifier_name: string
          certifier_qualification: string
          certifier_registration_number: string | null
          contributing_conditions: string | null
          contributing_conditions_icd: string[] | null
          created_at: string | null
          created_by: string | null
          death_notification_id: string
          id: string
          immediate_cause: string
          immediate_cause_duration: string | null
          immediate_cause_icd: string | null
          is_validated: boolean | null
          manner_of_death: Database["public"]["Enums"]["crvs_death_manner"]
          pregnancy_contributed: boolean | null
          pregnancy_status: string | null
          tobacco_use: string | null
          underlying_cause: string
          underlying_cause_icd: string
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          antecedent_cause_a?: string | null
          antecedent_cause_a_duration?: string | null
          antecedent_cause_a_icd?: string | null
          antecedent_cause_b?: string | null
          antecedent_cause_b_duration?: string | null
          antecedent_cause_b_icd?: string | null
          antecedent_cause_c?: string | null
          antecedent_cause_c_duration?: string | null
          antecedent_cause_c_icd?: string | null
          autopsy_findings?: string | null
          autopsy_findings_available?: boolean | null
          autopsy_performed?: boolean | null
          certificate_number?: string | null
          certification_date?: string
          certifier_facility_id?: string | null
          certifier_id?: string | null
          certifier_name: string
          certifier_qualification: string
          certifier_registration_number?: string | null
          contributing_conditions?: string | null
          contributing_conditions_icd?: string[] | null
          created_at?: string | null
          created_by?: string | null
          death_notification_id: string
          id?: string
          immediate_cause: string
          immediate_cause_duration?: string | null
          immediate_cause_icd?: string | null
          is_validated?: boolean | null
          manner_of_death: Database["public"]["Enums"]["crvs_death_manner"]
          pregnancy_contributed?: boolean | null
          pregnancy_status?: string | null
          tobacco_use?: string | null
          underlying_cause: string
          underlying_cause_icd: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          antecedent_cause_a?: string | null
          antecedent_cause_a_duration?: string | null
          antecedent_cause_a_icd?: string | null
          antecedent_cause_b?: string | null
          antecedent_cause_b_duration?: string | null
          antecedent_cause_b_icd?: string | null
          antecedent_cause_c?: string | null
          antecedent_cause_c_duration?: string | null
          antecedent_cause_c_icd?: string | null
          autopsy_findings?: string | null
          autopsy_findings_available?: boolean | null
          autopsy_performed?: boolean | null
          certificate_number?: string | null
          certification_date?: string
          certifier_facility_id?: string | null
          certifier_id?: string | null
          certifier_name?: string
          certifier_qualification?: string
          certifier_registration_number?: string | null
          contributing_conditions?: string | null
          contributing_conditions_icd?: string[] | null
          created_at?: string | null
          created_by?: string | null
          death_notification_id?: string
          id?: string
          immediate_cause?: string
          immediate_cause_duration?: string | null
          immediate_cause_icd?: string | null
          is_validated?: boolean | null
          manner_of_death?: Database["public"]["Enums"]["crvs_death_manner"]
          pregnancy_contributed?: boolean | null
          pregnancy_status?: string | null
          tobacco_use?: string | null
          underlying_cause?: string
          underlying_cause_icd?: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mccd_records_certifier_facility_id_fkey"
            columns: ["certifier_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mccd_records_certifier_facility_id_fkey"
            columns: ["certifier_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "mccd_records_certifier_facility_id_fkey"
            columns: ["certifier_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "mccd_records_death_notification_id_fkey"
            columns: ["death_notification_id"]
            isOneToOne: false
            referencedRelation: "death_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_administrations: {
        Row: {
          administered_at: string
          administered_by: string | null
          created_at: string
          dosage_given: string
          encounter_id: string
          id: string
          medication_order_id: string
          notes: string | null
          reason_not_given: string | null
          route_used: string
          signature_url: string | null
          status: string
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dosage_given: string
          encounter_id: string
          id?: string
          medication_order_id: string
          notes?: string | null
          reason_not_given?: string | null
          route_used: string
          signature_url?: string | null
          status?: string
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dosage_given?: string
          encounter_id?: string
          id?: string
          medication_order_id?: string
          notes?: string | null
          reason_not_given?: string | null
          route_used?: string
          signature_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administrations_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_administrations_medication_order_id_fkey"
            columns: ["medication_order_id"]
            isOneToOne: false
            referencedRelation: "medication_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_orders: {
        Row: {
          barcode: string | null
          created_at: string
          dosage: string
          dosage_unit: string
          duration: string | null
          encounter_id: string
          end_date: string | null
          frequency: string
          generic_name: string | null
          id: string
          indication: string | null
          instructions: string | null
          is_prn: boolean | null
          medication_name: string
          ordered_by: string | null
          patient_id: string
          prn_reason: string | null
          route: string
          start_date: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          dosage: string
          dosage_unit: string
          duration?: string | null
          encounter_id: string
          end_date?: string | null
          frequency: string
          generic_name?: string | null
          id?: string
          indication?: string | null
          instructions?: string | null
          is_prn?: boolean | null
          medication_name: string
          ordered_by?: string | null
          patient_id: string
          prn_reason?: string | null
          route: string
          start_date?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          dosage?: string
          dosage_unit?: string
          duration?: string | null
          encounter_id?: string
          end_date?: string | null
          frequency?: string
          generic_name?: string | null
          id?: string
          indication?: string | null
          instructions?: string | null
          is_prn?: boolean | null
          medication_name?: string
          ordered_by?: string | null
          patient_id?: string
          prn_reason?: string | null
          route?: string
          start_date?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedule_times: {
        Row: {
          administered_at: string | null
          created_at: string
          id: string
          medication_order_id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string
        }
        Insert: {
          administered_at?: string | null
          created_at?: string
          id?: string
          medication_order_id: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          administered_at?: string | null
          created_at?: string
          id?: string
          medication_order_id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedule_times_medication_order_id_fkey"
            columns: ["medication_order_id"]
            isOneToOne: false
            referencedRelation: "medication_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          encounter_id: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          name: string | null
          patient_id: string | null
          updated_at: string
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          encounter_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          name?: string | null
          patient_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          encounter_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          name?: string | null
          patient_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_channels_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_channels_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ndr_encounters: {
        Row: {
          admission_date: string
          discharge_date: string | null
          discharge_disposition: string | null
          encounter_class: string | null
          encounter_id: string
          encounter_type: string
          facility_id: string | null
          facility_name: string | null
          facility_province: string | null
          facility_type: string | null
          id: string
          ingested_at: string
          length_of_stay: number | null
          patient_age_at_encounter: number | null
          patient_gender: string | null
          patient_id: string
          primary_diagnosis_code: string | null
          primary_diagnosis_display: string | null
          procedures_performed: Json | null
          secondary_diagnoses: Json | null
          source_system: string | null
        }
        Insert: {
          admission_date: string
          discharge_date?: string | null
          discharge_disposition?: string | null
          encounter_class?: string | null
          encounter_id: string
          encounter_type: string
          facility_id?: string | null
          facility_name?: string | null
          facility_province?: string | null
          facility_type?: string | null
          id?: string
          ingested_at?: string
          length_of_stay?: number | null
          patient_age_at_encounter?: number | null
          patient_gender?: string | null
          patient_id: string
          primary_diagnosis_code?: string | null
          primary_diagnosis_display?: string | null
          procedures_performed?: Json | null
          secondary_diagnoses?: Json | null
          source_system?: string | null
        }
        Update: {
          admission_date?: string
          discharge_date?: string | null
          discharge_disposition?: string | null
          encounter_class?: string | null
          encounter_id?: string
          encounter_type?: string
          facility_id?: string | null
          facility_name?: string | null
          facility_province?: string | null
          facility_type?: string | null
          id?: string
          ingested_at?: string
          length_of_stay?: number | null
          patient_age_at_encounter?: number | null
          patient_gender?: string | null
          patient_id?: string
          primary_diagnosis_code?: string | null
          primary_diagnosis_display?: string | null
          procedures_performed?: Json | null
          secondary_diagnoses?: Json | null
          source_system?: string | null
        }
        Relationships: []
      }
      ndr_indicators: {
        Row: {
          computed_at: string
          denominator: number | null
          district: string | null
          facility_id: string | null
          id: string
          indicator_code: string
          indicator_name: string
          numerator: number | null
          period_end: string
          period_start: string
          period_type: string
          province: string | null
          unit: string | null
          value: number
        }
        Insert: {
          computed_at?: string
          denominator?: number | null
          district?: string | null
          facility_id?: string | null
          id?: string
          indicator_code: string
          indicator_name: string
          numerator?: number | null
          period_end: string
          period_start: string
          period_type: string
          province?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          computed_at?: string
          denominator?: number | null
          district?: string | null
          facility_id?: string | null
          id?: string
          indicator_code?: string
          indicator_name?: string
          numerator?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          province?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      ndr_observations: {
        Row: {
          code: string
          code_system: string
          display: string
          effective_date: string
          effective_datetime: string | null
          encounter_id: string | null
          facility_id: string | null
          id: string
          ingested_at: string
          is_abnormal: boolean | null
          is_critical: boolean | null
          observation_type: string
          patient_age_years: number | null
          patient_district: string | null
          patient_gender: string | null
          patient_id: string
          patient_province: string | null
          performer_id: string | null
          source_system: string | null
          status: string
          value_coded: string | null
          value_quantity: number | null
          value_string: string | null
          value_unit: string | null
        }
        Insert: {
          code: string
          code_system: string
          display: string
          effective_date: string
          effective_datetime?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          id?: string
          ingested_at?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          observation_type: string
          patient_age_years?: number | null
          patient_district?: string | null
          patient_gender?: string | null
          patient_id: string
          patient_province?: string | null
          performer_id?: string | null
          source_system?: string | null
          status?: string
          value_coded?: string | null
          value_quantity?: number | null
          value_string?: string | null
          value_unit?: string | null
        }
        Update: {
          code?: string
          code_system?: string
          display?: string
          effective_date?: string
          effective_datetime?: string | null
          encounter_id?: string | null
          facility_id?: string | null
          id?: string
          ingested_at?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          observation_type?: string
          patient_age_years?: number | null
          patient_district?: string | null
          patient_gender?: string | null
          patient_id?: string
          patient_province?: string | null
          performer_id?: string | null
          source_system?: string | null
          status?: string
          value_coded?: string | null
          value_quantity?: number | null
          value_string?: string | null
          value_unit?: string | null
        }
        Relationships: []
      }
      non_standard_closure_summaries: {
        Row: {
          closure_reason: string | null
          closure_type: string
          counseling_notes: string | null
          counseling_offered: boolean | null
          created_at: string
          document_id: string
          follow_up_options_provided: string | null
          id: string
          patient_id: string
          patient_signature_captured: boolean | null
          programme_code: string | null
          programme_follow_up_required: boolean | null
          risks_explained: boolean | null
          tracing_task_created: boolean | null
          tracing_task_id: string | null
          updated_at: string
          visit_id: string
          witnessed_by: string | null
        }
        Insert: {
          closure_reason?: string | null
          closure_type: string
          counseling_notes?: string | null
          counseling_offered?: boolean | null
          created_at?: string
          document_id: string
          follow_up_options_provided?: string | null
          id?: string
          patient_id: string
          patient_signature_captured?: boolean | null
          programme_code?: string | null
          programme_follow_up_required?: boolean | null
          risks_explained?: boolean | null
          tracing_task_created?: boolean | null
          tracing_task_id?: string | null
          updated_at?: string
          visit_id: string
          witnessed_by?: string | null
        }
        Update: {
          closure_reason?: string | null
          closure_type?: string
          counseling_notes?: string | null
          counseling_offered?: boolean | null
          created_at?: string
          document_id?: string
          follow_up_options_provided?: string | null
          id?: string
          patient_id?: string
          patient_signature_captured?: boolean | null
          programme_code?: string | null
          programme_follow_up_required?: boolean | null
          risks_explained?: boolean | null
          tracing_task_created?: boolean | null
          tracing_task_id?: string | null
          updated_at?: string
          visit_id?: string
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_standard_closure_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_standard_closure_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_standard_closure_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alerts_enabled: boolean | null
          created_at: string
          id: string
          messages_enabled: boolean | null
          pages_enabled: boolean | null
          priority_override: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sound_enabled: boolean | null
          updated_at: string
          user_id: string
          vibrate_enabled: boolean | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          created_at?: string
          id?: string
          messages_enabled?: boolean | null
          pages_enabled?: boolean | null
          priority_override?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string
          user_id: string
          vibrate_enabled?: boolean | null
        }
        Update: {
          alerts_enabled?: boolean | null
          created_at?: string
          id?: string
          messages_enabled?: boolean | null
          pages_enabled?: boolean | null
          priority_override?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          vibrate_enabled?: boolean | null
        }
        Relationships: []
      }
      on_call_schedules: {
        Row: {
          backup_staff_id: string | null
          backup_staff_name: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          department: string
          end_time: string
          id: string
          notes: string | null
          schedule_date: string
          specialty: string | null
          staff_id: string
          staff_name: string
          start_time: string
        }
        Insert: {
          backup_staff_id?: string | null
          backup_staff_name?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          end_time?: string
          id?: string
          notes?: string | null
          schedule_date: string
          specialty?: string | null
          staff_id: string
          staff_name: string
          start_time?: string
        }
        Update: {
          backup_staff_id?: string | null
          backup_staff_name?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          end_time?: string
          id?: string
          notes?: string | null
          schedule_date?: string
          specialty?: string | null
          staff_id?: string
          staff_name?: string
          start_time?: string
        }
        Relationships: []
      }
      operating_rooms: {
        Row: {
          capacity: number | null
          created_at: string
          equipment: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          room_number: string
          room_type: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          room_number: string
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          room_number?: string
          room_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      operational_supervisors: {
        Row: {
          assigned_by: string | null
          can_approve_cover: boolean | null
          can_approve_swaps: boolean | null
          can_manage_roster: boolean | null
          can_manage_virtual_pools: boolean | null
          can_override_assignments: boolean | null
          created_at: string
          department: string | null
          effective_from: string
          effective_to: string | null
          facility_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          operational_role: Database["public"]["Enums"]["operational_role"]
          provider_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          can_approve_cover?: boolean | null
          can_approve_swaps?: boolean | null
          can_manage_roster?: boolean | null
          can_manage_virtual_pools?: boolean | null
          can_override_assignments?: boolean | null
          created_at?: string
          department?: string | null
          effective_from?: string
          effective_to?: string | null
          facility_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          operational_role: Database["public"]["Enums"]["operational_role"]
          provider_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          can_approve_cover?: boolean | null
          can_approve_swaps?: boolean | null
          can_manage_roster?: boolean | null
          can_manage_virtual_pools?: boolean | null
          can_override_assignments?: boolean | null
          created_at?: string
          department?: string | null
          effective_from?: string
          effective_to?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          operational_role?: Database["public"]["Enums"]["operational_role"]
          provider_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_supervisors_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_supervisors_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "operational_supervisors_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "operational_supervisors_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_supervisors_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_session_costs: {
        Row: {
          cold_chain_cost: number | null
          consumables_cost: number | null
          cost_center: string | null
          cost_per_patient: number | null
          created_at: string | null
          created_by: string | null
          currency: string
          distance_km: number | null
          driver_cost: number | null
          facility_id: string | null
          fuel_cost: number | null
          id: string
          patients_served: number | null
          per_diem_cost: number | null
          programme_code: string | null
          session_date: string
          session_id: string
          staff_count: number | null
          total_session_cost: number
          total_staff_cost: number | null
          total_staff_time_minutes: number | null
          vehicle_depreciation: number | null
        }
        Insert: {
          cold_chain_cost?: number | null
          consumables_cost?: number | null
          cost_center?: string | null
          cost_per_patient?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          distance_km?: number | null
          driver_cost?: number | null
          facility_id?: string | null
          fuel_cost?: number | null
          id?: string
          patients_served?: number | null
          per_diem_cost?: number | null
          programme_code?: string | null
          session_date: string
          session_id: string
          staff_count?: number | null
          total_session_cost?: number
          total_staff_cost?: number | null
          total_staff_time_minutes?: number | null
          vehicle_depreciation?: number | null
        }
        Update: {
          cold_chain_cost?: number | null
          consumables_cost?: number | null
          cost_center?: string | null
          cost_per_patient?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          distance_km?: number | null
          driver_cost?: number | null
          facility_id?: string | null
          fuel_cost?: number | null
          id?: string
          patients_served?: number | null
          per_diem_cost?: number | null
          programme_code?: string | null
          session_date?: string
          session_id?: string
          staff_count?: number | null
          total_session_cost?: number
          total_staff_cost?: number | null
          total_staff_time_minutes?: number | null
          vehicle_depreciation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_session_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_session_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "outreach_session_costs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      package_deal_items: {
        Row: {
          created_at: string
          id: string
          package_id: string
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_deal_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "package_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_deal_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      package_deals: {
        Row: {
          category: string
          created_at: string
          current_redemptions: number | null
          description: string | null
          discount_percentage: number | null
          discounted_price: number
          id: string
          image_url: string | null
          is_active: boolean | null
          max_redemptions: number | null
          name: string
          original_price: number
          terms_conditions: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
          vendor_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          current_redemptions?: number | null
          description?: string | null
          discount_percentage?: number | null
          discounted_price: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name: string
          original_price: number
          terms_conditions?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          current_redemptions?: number | null
          description?: string | null
          discount_percentage?: number | null
          discounted_price?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name?: string
          original_price?: number
          terms_conditions?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_deals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      page_escalation_rules: {
        Row: {
          created_at: string
          department: string | null
          escalation_target_role: string | null
          escalation_target_user: string | null
          escalation_timeout_minutes: number
          id: string
          is_active: boolean | null
          max_escalations: number | null
          page_type: string | null
          priority: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          escalation_target_role?: string | null
          escalation_target_user?: string | null
          escalation_timeout_minutes?: number
          id?: string
          is_active?: boolean | null
          max_escalations?: number | null
          page_type?: string | null
          priority: string
        }
        Update: {
          created_at?: string
          department?: string | null
          escalation_target_role?: string | null
          escalation_target_user?: string | null
          escalation_timeout_minutes?: number
          id?: string
          is_active?: boolean | null
          max_escalations?: number | null
          page_type?: string | null
          priority?: string
        }
        Relationships: []
      }
      page_followers: {
        Row: {
          followed_at: string
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          followed_at?: string
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          followed_at?: string
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_followers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "professional_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_reviews: {
        Row: {
          created_at: string
          id: string
          is_verified_visit: boolean | null
          page_id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified_visit?: boolean | null
          page_id: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified_visit?: boolean | null
          page_id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_reviews_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "professional_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_care_state: {
        Row: {
          action_overdue: boolean | null
          alerts: Json | null
          care_state: string
          current_service_point: string | null
          current_workspace_id: string | null
          current_workspace_name: string | null
          encounter_id: string | null
          escalation_needed: boolean | null
          facility_id: string | null
          has_stalled_flow: boolean | null
          id: string
          last_activity_at: string | null
          next_action_due_at: string | null
          next_expected_action: string | null
          patient_id: string
          responsible_provider_id: string | null
          responsible_provider_name: string | null
          responsible_team: string | null
          stall_reason: string | null
          state_started_at: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          action_overdue?: boolean | null
          alerts?: Json | null
          care_state?: string
          current_service_point?: string | null
          current_workspace_id?: string | null
          current_workspace_name?: string | null
          encounter_id?: string | null
          escalation_needed?: boolean | null
          facility_id?: string | null
          has_stalled_flow?: boolean | null
          id?: string
          last_activity_at?: string | null
          next_action_due_at?: string | null
          next_expected_action?: string | null
          patient_id: string
          responsible_provider_id?: string | null
          responsible_provider_name?: string | null
          responsible_team?: string | null
          stall_reason?: string | null
          state_started_at?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          action_overdue?: boolean | null
          alerts?: Json | null
          care_state?: string
          current_service_point?: string | null
          current_workspace_id?: string | null
          current_workspace_name?: string | null
          encounter_id?: string | null
          escalation_needed?: boolean | null
          facility_id?: string | null
          has_stalled_flow?: boolean | null
          id?: string
          last_activity_at?: string | null
          next_action_due_at?: string | null
          next_expected_action?: string | null
          patient_id?: string
          responsible_provider_id?: string | null
          responsible_provider_name?: string | null
          responsible_team?: string | null
          stall_reason?: string | null
          state_started_at?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_care_state_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_state_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_state_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_state_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "patient_care_state_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "patient_care_state_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_state_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_counseling: {
        Row: {
          comprehension_verified: boolean | null
          counseled_at: string
          counseled_by: string
          counseling_accepted: boolean | null
          counseling_declined_reason: string | null
          counseling_offered: boolean
          created_at: string
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          interpreter_language: string | null
          interpreter_used: boolean | null
          patient_id: string
          patient_questions: string | null
          pharmacist_responses: string | null
          prescription_id: string
          signature_url: string | null
          special_instructions: string | null
          topics_covered: string[] | null
        }
        Insert: {
          comprehension_verified?: boolean | null
          counseled_at?: string
          counseled_by: string
          counseling_accepted?: boolean | null
          counseling_declined_reason?: string | null
          counseling_offered?: boolean
          created_at?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          interpreter_language?: string | null
          interpreter_used?: boolean | null
          patient_id: string
          patient_questions?: string | null
          pharmacist_responses?: string | null
          prescription_id: string
          signature_url?: string | null
          special_instructions?: string | null
          topics_covered?: string[] | null
        }
        Update: {
          comprehension_verified?: boolean | null
          counseled_at?: string
          counseled_by?: string
          counseling_accepted?: boolean | null
          counseling_declined_reason?: string | null
          counseling_offered?: boolean
          created_at?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          interpreter_language?: string | null
          interpreter_used?: boolean | null
          patient_id?: string
          patient_questions?: string | null
          pharmacist_responses?: string | null
          prescription_id?: string
          signature_url?: string | null
          special_instructions?: string | null
          topics_covered?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_counseling_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_counseling_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_identifiers: {
        Row: {
          biometric_enrolled_at: string | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          client_registry_id: string | null
          created_at: string | null
          id: string
          id_generated_at: string | null
          id_generation_method: string | null
          id_version: number | null
          impilo_id: string
          mosip_uin: string | null
          patient_id: string | null
          shr_id: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          client_registry_id?: string | null
          created_at?: string | null
          id?: string
          id_generated_at?: string | null
          id_generation_method?: string | null
          id_version?: number | null
          impilo_id: string
          mosip_uin?: string | null
          patient_id?: string | null
          shr_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          client_registry_id?: string | null
          created_at?: string | null
          id?: string
          id_generated_at?: string | null
          id_generation_method?: string | null
          id_version?: number | null
          impilo_id?: string
          mosip_uin?: string | null
          patient_id?: string | null
          shr_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_identifiers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_summaries: {
        Row: {
          access_level: string | null
          advance_directives: Json | null
          allergies: Json | null
          authoring_organization: string | null
          care_plans: Json | null
          conditions: Json | null
          consent_reference: string | null
          created_at: string
          data_recency_notes: Json | null
          devices: Json | null
          diagnostic_results: Json | null
          expires_at: string | null
          fhir_bundle: Json | null
          fhir_composition_id: string | null
          generated_at: string
          generated_by: string | null
          generation_trigger: string | null
          health_id: string | null
          id: string
          imaging_summary: Json | null
          immunizations: Json | null
          last_accessed_at: string | null
          medications: Json | null
          patient_id: string
          pregnancy_status: Json | null
          procedures: Json | null
          qr_code_data: string | null
          redacted_sections: string[] | null
          redaction_applied: boolean | null
          share_token: string | null
          share_token_expires_at: string | null
          social_history: Json | null
          source_systems: string[] | null
          status: string
          summary_type: string
          updated_at: string
          vital_signs: Json | null
        }
        Insert: {
          access_level?: string | null
          advance_directives?: Json | null
          allergies?: Json | null
          authoring_organization?: string | null
          care_plans?: Json | null
          conditions?: Json | null
          consent_reference?: string | null
          created_at?: string
          data_recency_notes?: Json | null
          devices?: Json | null
          diagnostic_results?: Json | null
          expires_at?: string | null
          fhir_bundle?: Json | null
          fhir_composition_id?: string | null
          generated_at?: string
          generated_by?: string | null
          generation_trigger?: string | null
          health_id?: string | null
          id?: string
          imaging_summary?: Json | null
          immunizations?: Json | null
          last_accessed_at?: string | null
          medications?: Json | null
          patient_id: string
          pregnancy_status?: Json | null
          procedures?: Json | null
          qr_code_data?: string | null
          redacted_sections?: string[] | null
          redaction_applied?: boolean | null
          share_token?: string | null
          share_token_expires_at?: string | null
          social_history?: Json | null
          source_systems?: string[] | null
          status?: string
          summary_type?: string
          updated_at?: string
          vital_signs?: Json | null
        }
        Update: {
          access_level?: string | null
          advance_directives?: Json | null
          allergies?: Json | null
          authoring_organization?: string | null
          care_plans?: Json | null
          conditions?: Json | null
          consent_reference?: string | null
          created_at?: string
          data_recency_notes?: Json | null
          devices?: Json | null
          diagnostic_results?: Json | null
          expires_at?: string | null
          fhir_bundle?: Json | null
          fhir_composition_id?: string | null
          generated_at?: string
          generated_by?: string | null
          generation_trigger?: string | null
          health_id?: string | null
          id?: string
          imaging_summary?: Json | null
          immunizations?: Json | null
          last_accessed_at?: string | null
          medications?: Json | null
          patient_id?: string
          pregnancy_status?: Json | null
          procedures?: Json | null
          qr_code_data?: string | null
          redacted_sections?: string[] | null
          redaction_applied?: boolean | null
          share_token?: string | null
          share_token_expires_at?: string | null
          social_history?: Json | null
          source_systems?: string[] | null
          status?: string
          summary_type?: string
          updated_at?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          blood_type: string | null
          chronic_conditions: string[] | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: string
          id: string
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_active: boolean
          last_name: string
          middle_name: string | null
          mrn: string
          national_id: string | null
          passport_number: string | null
          phone_primary: string | null
          phone_secondary: string | null
          postal_code: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean
          last_name: string
          middle_name?: string | null
          mrn: string
          national_id?: string | null
          passport_number?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean
          last_name?: string
          middle_name?: string | null
          mrn?: string
          national_id?: string | null
          passport_number?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_notifications: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          message_content: string | null
          message_template: string | null
          notification_type: string
          patient_id: string | null
          payment_request_id: string | null
          provider_message_id: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message_content?: string | null
          message_template?: string | null
          notification_type: string
          patient_id?: string | null
          payment_request_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message_content?: string | null
          message_template?: string | null
          notification_type?: string
          patient_id?: string | null
          payment_request_id?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notifications_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          account_id: string | null
          allowed_methods: string[] | null
          amount: number
          callback_url: string | null
          cancelled_at: string | null
          checkout_token: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          expires_at: string | null
          facility_id: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          invoice_id: string | null
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          patient_id: string | null
          payer_email: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_link: string | null
          payment_request_number: string
          preferred_channel: string | null
          purpose: string
          sent_at: string | null
          short_reference: string | null
          status: string
          visit_id: string | null
          webhook_secret: string | null
        }
        Insert: {
          account_id?: string | null
          allowed_methods?: string[] | null
          amount: number
          callback_url?: string | null
          cancelled_at?: string | null
          checkout_token?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          facility_id?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_link?: string | null
          payment_request_number: string
          preferred_channel?: string | null
          purpose: string
          sent_at?: string | null
          short_reference?: string | null
          status?: string
          visit_id?: string | null
          webhook_secret?: string | null
        }
        Update: {
          account_id?: string | null
          allowed_methods?: string[] | null
          amount?: number
          callback_url?: string | null
          cancelled_at?: string | null
          checkout_token?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          facility_id?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_link?: string | null
          payment_request_number?: string
          preferred_channel?: string | null
          purpose?: string
          sent_at?: string | null
          short_reference?: string | null
          status?: string
          visit_id?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "payment_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "payment_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          encounter_id: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          reference_number: string | null
          status: string
          transaction_number: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: string
          transaction_number: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          id: string
          is_duplicate: boolean | null
          is_processed: boolean | null
          parsed_amount: number | null
          parsed_status: string | null
          parsed_txn_id: string | null
          payment_channel: string
          payment_request_id: string | null
          payment_transaction_id: string | null
          processed_at: string | null
          processing_error: string | null
          raw_payload: Json
          received_at: string | null
          signature: string | null
          webhook_id: string | null
          webhook_type: string
        }
        Insert: {
          id?: string
          is_duplicate?: boolean | null
          is_processed?: boolean | null
          parsed_amount?: number | null
          parsed_status?: string | null
          parsed_txn_id?: string | null
          payment_channel: string
          payment_request_id?: string | null
          payment_transaction_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload: Json
          received_at?: string | null
          signature?: string | null
          webhook_id?: string | null
          webhook_type: string
        }
        Update: {
          id?: string
          is_duplicate?: boolean | null
          is_processed?: boolean | null
          parsed_amount?: number | null
          parsed_status?: string | null
          parsed_txn_id?: string | null
          payment_channel?: string
          payment_request_id?: string | null
          payment_transaction_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload?: Json
          received_at?: string | null
          signature?: string | null
          webhook_id?: string | null
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_webhooks_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_case_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          case_type: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          encounter_id: string | null
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          first_response_at: string | null
          handover_from: string | null
          handover_notes: string | null
          id: string
          patient_id: string | null
          pool_id: string
          priority: string | null
          resolution_notes: string | null
          sla_deadline: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          case_type: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          encounter_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          handover_from?: string | null
          handover_notes?: string | null
          id?: string
          patient_id?: string | null
          pool_id: string
          priority?: string | null
          resolution_notes?: string | null
          sla_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          case_type?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          encounter_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          handover_from?: string | null
          handover_notes?: string | null
          id?: string
          patient_id?: string | null
          pool_id?: string
          priority?: string | null
          resolution_notes?: string | null
          sla_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_case_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_handover_from_fkey"
            columns: ["handover_from"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_handover_from_fkey"
            columns: ["handover_from"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_case_assignments_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_memberships: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          can_self_assign: boolean | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          pool_id: string
          pool_role: Database["public"]["Enums"]["workspace_role"]
          provider_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_self_assign?: boolean | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pool_id: string
          pool_role?: Database["public"]["Enums"]["workspace_role"]
          provider_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_self_assign?: boolean | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pool_id?: string
          pool_role?: Database["public"]["Enums"]["workspace_role"]
          provider_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_memberships_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_memberships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_memberships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          club_id: string | null
          comments_count: number | null
          community_id: string | null
          content: string | null
          created_at: string
          health_data: Json | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          media_types: string[] | null
          media_urls: string[] | null
          page_id: string | null
          post_type: string
          shares_count: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          club_id?: string | null
          comments_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          health_data?: Json | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          page_id?: string | null
          post_type?: string
          shares_count?: number | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          club_id?: string | null
          comments_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          health_data?: Json | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          page_id?: string | null
          post_type?: string
          shares_count?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "professional_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          batch_number: string | null
          created_at: string
          dispense_as_written: boolean | null
          dispensed_at: string | null
          dispensed_by: string | null
          dispensed_quantity: number | null
          dosage: string
          dosage_unit: string
          duration: string | null
          expiry_date: string | null
          frequency: string
          generic_name: string | null
          id: string
          indication: string | null
          instructions: string | null
          is_controlled: boolean | null
          medication_name: string
          ndc_code: string | null
          prescription_id: string
          quantity: number
          route: string
          schedule: string | null
          status: string
          substitution_allowed: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          dispense_as_written?: boolean | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          dispensed_quantity?: number | null
          dosage: string
          dosage_unit: string
          duration?: string | null
          expiry_date?: string | null
          frequency: string
          generic_name?: string | null
          id?: string
          indication?: string | null
          instructions?: string | null
          is_controlled?: boolean | null
          medication_name: string
          ndc_code?: string | null
          prescription_id: string
          quantity: number
          route: string
          schedule?: string | null
          status?: string
          substitution_allowed?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          dispense_as_written?: boolean | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          dispensed_quantity?: number | null
          dosage?: string
          dosage_unit?: string
          duration?: string | null
          expiry_date?: string | null
          frequency?: string
          generic_name?: string | null
          id?: string
          indication?: string | null
          instructions?: string | null
          is_controlled?: boolean | null
          medication_name?: string
          ndc_code?: string | null
          prescription_id?: string
          quantity?: number
          route?: string
          schedule?: string | null
          status?: string
          substitution_allowed?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_refills: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          denial_reason: string | null
          dispensed_at: string | null
          dispensed_by: string | null
          id: string
          notes: string | null
          prescription_id: string
          refill_number: number
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          denial_reason?: string | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          id?: string
          notes?: string | null
          prescription_id: string
          refill_number: number
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          denial_reason?: string | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          id?: string
          notes?: string | null
          prescription_id?: string
          refill_number?: number
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_refills_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          controlled_schedule: string | null
          created_at: string
          dispensing_instructions: string | null
          encounter_id: string | null
          id: string
          is_controlled_substance: boolean | null
          patient_id: string
          pharmacy_notes: string | null
          prescribed_at: string
          prescribed_by: string | null
          prescription_number: string
          prior_auth_number: string | null
          priority: string
          refills_authorized: number | null
          refills_remaining: number | null
          requires_prior_auth: boolean | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          controlled_schedule?: string | null
          created_at?: string
          dispensing_instructions?: string | null
          encounter_id?: string | null
          id?: string
          is_controlled_substance?: boolean | null
          patient_id: string
          pharmacy_notes?: string | null
          prescribed_at?: string
          prescribed_by?: string | null
          prescription_number: string
          prior_auth_number?: string | null
          priority?: string
          refills_authorized?: number | null
          refills_remaining?: number | null
          requires_prior_auth?: boolean | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          controlled_schedule?: string | null
          created_at?: string
          dispensing_instructions?: string | null
          encounter_id?: string | null
          id?: string
          is_controlled_substance?: boolean | null
          patient_id?: string
          pharmacy_notes?: string | null
          prescribed_at?: string
          prescribed_by?: string | null
          prescription_number?: string
          prior_auth_number?: string | null
          priority?: string
          refills_authorized?: number | null
          refills_remaining?: number | null
          requires_prior_auth?: boolean | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_notes: {
        Row: {
          anesthesia_type: string | null
          anesthesiologist_name: string | null
          assistants: Json | null
          complication_details: Json | null
          complications: string | null
          created_at: string
          document_id: string
          encounter_id: string
          findings: string | null
          id: string
          indication: string | null
          patient_id: string
          post_procedure_diagnosis: string | null
          post_procedure_plan: string | null
          pre_procedure_diagnosis: string | null
          primary_surgeon_id: string | null
          primary_surgeon_name: string | null
          procedure_code: string | null
          procedure_code_system: string | null
          procedure_date: string
          procedure_description: string | null
          procedure_duration_minutes: number | null
          procedure_name: string
          procedure_type: string | null
          specimens_collected: Json | null
          technique_used: string | null
          updated_at: string
        }
        Insert: {
          anesthesia_type?: string | null
          anesthesiologist_name?: string | null
          assistants?: Json | null
          complication_details?: Json | null
          complications?: string | null
          created_at?: string
          document_id: string
          encounter_id: string
          findings?: string | null
          id?: string
          indication?: string | null
          patient_id: string
          post_procedure_diagnosis?: string | null
          post_procedure_plan?: string | null
          pre_procedure_diagnosis?: string | null
          primary_surgeon_id?: string | null
          primary_surgeon_name?: string | null
          procedure_code?: string | null
          procedure_code_system?: string | null
          procedure_date: string
          procedure_description?: string | null
          procedure_duration_minutes?: number | null
          procedure_name: string
          procedure_type?: string | null
          specimens_collected?: Json | null
          technique_used?: string | null
          updated_at?: string
        }
        Update: {
          anesthesia_type?: string | null
          anesthesiologist_name?: string | null
          assistants?: Json | null
          complication_details?: Json | null
          complications?: string | null
          created_at?: string
          document_id?: string
          encounter_id?: string
          findings?: string | null
          id?: string
          indication?: string | null
          patient_id?: string
          post_procedure_diagnosis?: string | null
          post_procedure_plan?: string | null
          pre_procedure_diagnosis?: string | null
          primary_surgeon_id?: string | null
          primary_surgeon_name?: string | null
          procedure_code?: string | null
          procedure_code_system?: string | null
          procedure_date?: string
          procedure_description?: string | null
          procedure_duration_minutes?: number | null
          procedure_name?: string
          procedure_type?: string | null
          specimens_collected?: Json | null
          technique_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_type:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_controlled: boolean | null
          name: string
          parent_id: string | null
          requires_prescription: boolean | null
          slug: string
        }
        Insert: {
          category_type?:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_controlled?: boolean | null
          name: string
          parent_id?: string | null
          requires_prescription?: boolean | null
          slug: string
        }
        Update: {
          category_type?:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_controlled?: boolean | null
          name?: string
          parent_id?: string | null
          requires_prescription?: boolean | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          title: string | null
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          title?: string | null
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          title?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active_ingredients: string[] | null
          additional_images: string[] | null
          barcode: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          dea_schedule: string | null
          description: string | null
          dosage_form: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_controlled: boolean | null
          manufacturer_id: string | null
          name: string
          pack_size: number | null
          requires_prescription: boolean | null
          route_of_administration: string | null
          shelf_life_months: number | null
          sku: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["approval_status"] | null
          storage_requirements: string | null
          strength: string | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          active_ingredients?: string[] | null
          additional_images?: string[] | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dea_schedule?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_controlled?: boolean | null
          manufacturer_id?: string | null
          name: string
          pack_size?: number | null
          requires_prescription?: boolean | null
          route_of_administration?: string | null
          shelf_life_months?: number | null
          sku?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          storage_requirements?: string | null
          strength?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          active_ingredients?: string[] | null
          additional_images?: string[] | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dea_schedule?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_controlled?: boolean | null
          manufacturer_id?: string | null
          name?: string
          pack_size?: number | null
          requires_prescription?: boolean | null
          route_of_administration?: string | null
          shelf_life_months?: number | null
          sku?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          storage_requirements?: string | null
          strength?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_councils: {
        Row: {
          abbreviation: string
          address: string | null
          code: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          jurisdiction_cadres: string[] | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          abbreviation: string
          address?: string | null
          code: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_cadres?: string[] | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          abbreviation?: string
          address?: string | null
          code?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_cadres?: string[] | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      professional_pages: {
        Row: {
          address: string | null
          average_rating: number | null
          bio: string | null
          business_category: string | null
          can_post: boolean | null
          can_sell: boolean | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          credentials: string[] | null
          follower_count: number | null
          id: string
          is_active: boolean | null
          is_verified_provider: boolean | null
          license_number: string | null
          logo_url: string | null
          name: string
          operating_hours: Json | null
          owner_id: string
          page_type: string
          review_count: number | null
          services: string[] | null
          slug: string
          specialties: string[] | null
          updated_at: string
          verification_date: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          bio?: string | null
          business_category?: string | null
          can_post?: boolean | null
          can_sell?: boolean | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          credentials?: string[] | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          is_verified_provider?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          owner_id: string
          page_type?: string
          review_count?: number | null
          services?: string[] | null
          slug: string
          specialties?: string[] | null
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          bio?: string | null
          business_category?: string | null
          can_post?: boolean | null
          can_sell?: boolean | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          credentials?: string[] | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          is_verified_provider?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          owner_id?: string
          page_type?: string
          review_count?: number | null
          services?: string[] | null
          slug?: string
          specialties?: string[] | null
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          biometric_enrolled_at: string | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          created_at: string
          department: string | null
          display_name: string
          facility_id: string | null
          force_password_reset: boolean
          id: string
          last_active_at: string | null
          license_number: string | null
          password_reset_reason: string | null
          phone: string | null
          provider_registry_id: string | null
          role: Database["public"]["Enums"]["clinical_role"]
          specialty: string | null
          totp_enabled: boolean
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string
          department?: string | null
          display_name: string
          facility_id?: string | null
          force_password_reset?: boolean
          id?: string
          last_active_at?: string | null
          license_number?: string | null
          password_reset_reason?: string | null
          phone?: string | null
          provider_registry_id?: string | null
          role?: Database["public"]["Enums"]["clinical_role"]
          specialty?: string | null
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string
          department?: string | null
          display_name?: string
          facility_id?: string | null
          force_password_reset?: boolean
          id?: string
          last_active_at?: string | null
          license_number?: string | null
          password_reset_reason?: string | null
          phone?: string | null
          provider_registry_id?: string | null
          role?: Database["public"]["Enums"]["clinical_role"]
          specialty?: string | null
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_affiliations: {
        Row: {
          created_at: string
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          department: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_date: string | null
          facility_id: string
          facility_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          position_title: string | null
          privileges: string[]
          provider_id: string
          role: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          facility_id: string
          facility_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          position_title?: string | null
          privileges?: string[]
          provider_id: string
          role: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          facility_id?: string
          facility_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          position_title?: string | null
          privileges?: string[]
          provider_id?: string
          role?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_affiliations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_cpd_activities: {
        Row: {
          activity_date: string
          activity_type_id: string | null
          approved_at: string | null
          approved_by: string | null
          category: string
          certificate_document_id: string | null
          certificate_number: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          points_awarded: number | null
          points_claimed: number
          provider_id: string
          provider_name: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          activity_type_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category: string
          certificate_document_id?: string | null
          certificate_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          points_claimed: number
          provider_id: string
          provider_name?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          certificate_document_id?: string | null
          certificate_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          points_claimed?: number
          provider_id?: string
          provider_name?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_cpd_activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "ref_cpd_activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_cpd_activities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_cpd_cycles: {
        Row: {
          completed_at: string | null
          created_at: string
          cycle_end: string
          cycle_start: string
          extended_to: string | null
          extension_reason: string | null
          id: string
          points_earned: number
          points_required: number
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cycle_end: string
          cycle_start: string
          extended_to?: string | null
          extension_reason?: string | null
          id?: string
          points_earned?: number
          points_required: number
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          extended_to?: string | null
          extension_reason?: string | null
          id?: string
          points_earned?: number
          points_required?: number
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_cpd_cycles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_dependents: {
        Row: {
          created_at: string
          date_of_birth: string | null
          disability_status: boolean | null
          disability_type: string | null
          email: string | null
          full_name: string
          id: string
          is_beneficiary: boolean | null
          is_dependent_on_tax: boolean | null
          national_id: string | null
          phone: string | null
          provider_id: string
          relationship: string
          sex: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          disability_status?: boolean | null
          disability_type?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_beneficiary?: boolean | null
          is_dependent_on_tax?: boolean | null
          national_id?: string | null
          phone?: string | null
          provider_id: string
          relationship: string
          sex?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          disability_status?: boolean | null
          disability_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_beneficiary?: boolean | null
          is_dependent_on_tax?: boolean | null
          national_id?: string | null
          phone?: string | null
          provider_id?: string
          relationship?: string
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_dependents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_disciplinary: {
        Row: {
          action_date: string
          action_duration_days: number | null
          action_end_date: string | null
          action_type: string
          appeal_date: string | null
          appeal_filed: boolean | null
          appeal_outcome: string | null
          created_at: string
          created_by: string | null
          description: string
          disciplinary_letter_url: string | null
          hearing_date: string | null
          hearing_outcome: string | null
          id: string
          incident_date: string
          incident_report_url: string | null
          incident_type: string
          investigated_by: string | null
          investigation_notes: string | null
          provider_id: string
          reported_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_date: string
          action_duration_days?: number | null
          action_end_date?: string | null
          action_type: string
          appeal_date?: string | null
          appeal_filed?: boolean | null
          appeal_outcome?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          disciplinary_letter_url?: string | null
          hearing_date?: string | null
          hearing_outcome?: string | null
          id?: string
          incident_date: string
          incident_report_url?: string | null
          incident_type: string
          investigated_by?: string | null
          investigation_notes?: string | null
          provider_id: string
          reported_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_date?: string
          action_duration_days?: number | null
          action_end_date?: string | null
          action_type?: string
          appeal_date?: string | null
          appeal_filed?: boolean | null
          appeal_outcome?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          disciplinary_letter_url?: string | null
          hearing_date?: string | null
          hearing_outcome?: string | null
          id?: string
          incident_date?: string
          incident_report_url?: string | null
          incident_type?: string
          investigated_by?: string | null
          investigation_notes?: string | null
          provider_id?: string
          reported_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_disciplinary_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type_code: string
          document_type_id: string | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_current: boolean | null
          is_verified: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          metadata: Json | null
          mime_type: string | null
          previous_version_id: string | null
          provider_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type_code: string
          document_type_id?: string | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          previous_version_id?: string | null
          provider_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type_code?: string
          document_type_id?: string | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          previous_version_id?: string | null
          provider_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "ref_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "provider_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_education: {
        Row: {
          certificate_url: string | null
          created_at: string
          created_by: string | null
          degree_name: string
          education_level: string
          end_date: string | null
          gpa: string | null
          graduation_date: string | null
          honors: string | null
          id: string
          institution_country: string | null
          institution_name: string
          institution_type: string | null
          major: string | null
          minor: string | null
          provider_id: string
          start_date: string | null
          status: string | null
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          created_by?: string | null
          degree_name: string
          education_level: string
          end_date?: string | null
          gpa?: string | null
          graduation_date?: string | null
          honors?: string | null
          id?: string
          institution_country?: string | null
          institution_name: string
          institution_type?: string | null
          major?: string | null
          minor?: string | null
          provider_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          created_by?: string | null
          degree_name?: string
          education_level?: string
          end_date?: string | null
          gpa?: string | null
          graduation_date?: string | null
          honors?: string | null
          id?: string
          institution_country?: string | null
          institution_name?: string
          institution_type?: string | null
          major?: string | null
          minor?: string | null
          provider_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_education_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_emergency_contacts: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          phone_primary: string
          phone_secondary: string | null
          priority_order: number | null
          provider_id: string
          relationship: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone_primary: string
          phone_secondary?: string | null
          priority_order?: number | null
          provider_id: string
          relationship: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          phone_primary?: string
          phone_secondary?: string | null
          priority_order?: number | null
          provider_id?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_emergency_contacts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_employment_history: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          department: string | null
          departure_reason: string | null
          departure_type: string | null
          employer_name: string
          employer_type: string | null
          end_date: string | null
          facility_id: string | null
          id: string
          is_current: boolean | null
          location: string | null
          position_title: string
          provider_id: string
          reference_letter_url: string | null
          start_date: string
          supervisor_contact: string | null
          supervisor_name: string | null
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          departure_reason?: string | null
          departure_type?: string | null
          employer_name: string
          employer_type?: string | null
          end_date?: string | null
          facility_id?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position_title: string
          provider_id: string
          reference_letter_url?: string | null
          start_date: string
          supervisor_contact?: string | null
          supervisor_name?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          departure_reason?: string | null
          departure_type?: string | null
          employer_name?: string
          employer_type?: string | null
          end_date?: string | null
          facility_id?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position_title?: string
          provider_id?: string
          reference_letter_url?: string | null
          start_date?: string
          supervisor_contact?: string | null
          supervisor_name?: string | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_employment_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_employment_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_employment_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_employment_history_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_identifiers: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          identifier_type: string
          identifier_value: string
          issue_date: string | null
          issuing_authority: string | null
          issuing_country: string | null
          provider_id: string
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          identifier_type: string
          identifier_value: string
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country?: string | null
          provider_id: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          identifier_type?: string
          identifier_value?: string
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country?: string | null
          provider_id?: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_identifiers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_leave: {
        Row: {
          acting_replacement_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          days_approved: number | null
          days_requested: number
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          provider_id: string
          reason: string | null
          rejection_reason: string | null
          requested_at: string | null
          start_date: string
          status: string | null
          supporting_document_url: string | null
          updated_at: string
        }
        Insert: {
          acting_replacement_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days_approved?: number | null
          days_requested: number
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          provider_id: string
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          start_date: string
          status?: string | null
          supporting_document_url?: string | null
          updated_at?: string
        }
        Update: {
          acting_replacement_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days_approved?: number | null
          days_requested?: number
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          provider_id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          start_date?: string
          status?: string | null
          supporting_document_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_leave_acting_replacement_id_fkey"
            columns: ["acting_replacement_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_leave_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_licenses: {
        Row: {
          council_id: string
          council_name: string
          created_at: string
          created_by: string | null
          expiry_date: string
          id: string
          issue_date: string
          last_verified_at: string | null
          last_verified_by: string | null
          license_category: string
          provider_id: string
          registration_number: string
          source_reference: string | null
          source_system: string | null
          status: Database["public"]["Enums"]["license_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          council_id: string
          council_name: string
          created_at?: string
          created_by?: string | null
          expiry_date: string
          id?: string
          issue_date: string
          last_verified_at?: string | null
          last_verified_by?: string | null
          license_category: string
          provider_id: string
          registration_number: string
          source_reference?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          council_id?: string
          council_name?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          last_verified_at?: string | null
          last_verified_by?: string | null
          license_category?: string
          provider_id?: string
          registration_number?: string
          source_reference?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_licenses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_performance: {
        Row: {
          areas_for_improvement: string | null
          attendance_score: number | null
          comments: string | null
          communication_score: number | null
          created_at: string
          created_by: string | null
          employee_comments: string | null
          employee_signed: boolean | null
          employee_signed_at: string | null
          end_date: string
          evaluation_form_url: string | null
          evaluation_period: string
          evaluator_id: string | null
          evaluator_name: string | null
          evaluator_position: string | null
          finalized_at: string | null
          goals_achieved: string | null
          goals_set: string | null
          id: string
          leadership_score: number | null
          overall_score: number | null
          productivity_score: number | null
          provider_id: string
          quality_score: number | null
          start_date: string
          status: string | null
          strengths: string | null
          teamwork_score: number | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          attendance_score?: number | null
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_signed?: boolean | null
          employee_signed_at?: string | null
          end_date: string
          evaluation_form_url?: string | null
          evaluation_period: string
          evaluator_id?: string | null
          evaluator_name?: string | null
          evaluator_position?: string | null
          finalized_at?: string | null
          goals_achieved?: string | null
          goals_set?: string | null
          id?: string
          leadership_score?: number | null
          overall_score?: number | null
          productivity_score?: number | null
          provider_id: string
          quality_score?: number | null
          start_date: string
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          attendance_score?: number | null
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_signed?: boolean | null
          employee_signed_at?: string | null
          end_date?: string
          evaluation_form_url?: string | null
          evaluation_period?: string
          evaluator_id?: string | null
          evaluator_name?: string | null
          evaluator_position?: string | null
          finalized_at?: string | null
          goals_achieved?: string | null
          goals_set?: string | null
          id?: string
          leadership_score?: number | null
          overall_score?: number | null
          productivity_score?: number | null
          provider_id?: string
          quality_score?: number | null
          start_date?: string
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_performance_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_performance_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_position_changes: {
        Row: {
          affiliation_id: string | null
          authorization_document_url: string | null
          authorization_reference: string | null
          authorized_by: string | null
          change_type: string
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          new_department: string | null
          new_facility_id: string | null
          new_position_title: string
          new_salary_grade: string | null
          previous_department: string | null
          previous_facility_id: string | null
          previous_position_title: string | null
          previous_salary_grade: string | null
          provider_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          affiliation_id?: string | null
          authorization_document_url?: string | null
          authorization_reference?: string | null
          authorized_by?: string | null
          change_type: string
          created_at?: string
          created_by?: string | null
          effective_date: string
          id?: string
          new_department?: string | null
          new_facility_id?: string | null
          new_position_title: string
          new_salary_grade?: string | null
          previous_department?: string | null
          previous_facility_id?: string | null
          previous_position_title?: string | null
          previous_salary_grade?: string | null
          provider_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          affiliation_id?: string | null
          authorization_document_url?: string | null
          authorization_reference?: string | null
          authorized_by?: string | null
          change_type?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          new_department?: string | null
          new_facility_id?: string | null
          new_position_title?: string
          new_salary_grade?: string | null
          previous_department?: string | null
          previous_facility_id?: string | null
          previous_position_title?: string | null
          previous_salary_grade?: string | null
          provider_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_position_changes_affiliation_id_fkey"
            columns: ["affiliation_id"]
            isOneToOne: false
            referencedRelation: "provider_affiliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_position_changes_new_facility_id_fkey"
            columns: ["new_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_position_changes_new_facility_id_fkey"
            columns: ["new_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_position_changes_new_facility_id_fkey"
            columns: ["new_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_position_changes_previous_facility_id_fkey"
            columns: ["previous_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_position_changes_previous_facility_id_fkey"
            columns: ["previous_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_position_changes_previous_facility_id_fkey"
            columns: ["previous_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_position_changes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_privileges_taxonomy: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_supervision: boolean | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_supervision?: boolean | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_supervision?: boolean | null
        }
        Relationships: []
      }
      provider_registry_logs: {
        Row: {
          action: string
          biometric_method: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          provider_registry_id: string
          user_agent: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          action: string
          biometric_method?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          provider_registry_id: string
          user_agent?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          action?: string
          biometric_method?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          provider_registry_id?: string
          user_agent?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      provider_registry_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          biometric_enrolled: boolean | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          facility_id: string | null
          first_name: string
          gender: string | null
          id: string
          last_modified_by: string | null
          last_name: string
          license_expiry: string | null
          license_issuing_body: string | null
          license_number: string | null
          national_id: string | null
          other_names: string | null
          phone: string | null
          provider_id: string | null
          qualification: string | null
          qualification_institution: string | null
          qualification_year: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          specialty: string | null
          status: Database["public"]["Enums"]["registry_record_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          user_id: string | null
          work_phone: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          facility_id?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_modified_by?: string | null
          last_name: string
          license_expiry?: string | null
          license_issuing_body?: string | null
          license_number?: string | null
          national_id?: string | null
          other_names?: string | null
          phone?: string | null
          provider_id?: string | null
          qualification?: string | null
          qualification_institution?: string | null
          qualification_year?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          specialty?: string | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          user_id?: string | null
          work_phone?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          facility_id?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_modified_by?: string | null
          last_name?: string
          license_expiry?: string | null
          license_issuing_body?: string | null
          license_number?: string | null
          national_id?: string | null
          other_names?: string | null
          phone?: string | null
          provider_id?: string | null
          qualification?: string | null
          qualification_institution?: string | null
          qualification_year?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          specialty?: string | null
          status?: Database["public"]["Enums"]["registry_record_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          user_id?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "provider_registry_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      provider_salary: {
        Row: {
          account_number_masked: string | null
          allowances: Json | null
          bank_name: string | null
          base_salary: number
          created_at: string
          created_by: string | null
          currency: string | null
          deductions: Json | null
          effective_from: string
          effective_until: string | null
          funder_name: string | null
          funding_project: string | null
          funds_source: string
          id: string
          is_current: boolean | null
          net_salary: number | null
          pay_frequency: string | null
          provider_id: string
          salary_grade: string
          salary_step: string | null
          total_allowances: number | null
          total_deductions: number | null
          updated_at: string
        }
        Insert: {
          account_number_masked?: string | null
          allowances?: Json | null
          bank_name?: string | null
          base_salary: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deductions?: Json | null
          effective_from: string
          effective_until?: string | null
          funder_name?: string | null
          funding_project?: string | null
          funds_source: string
          id?: string
          is_current?: boolean | null
          net_salary?: number | null
          pay_frequency?: string | null
          provider_id: string
          salary_grade: string
          salary_step?: string | null
          total_allowances?: number | null
          total_deductions?: number | null
          updated_at?: string
        }
        Update: {
          account_number_masked?: string | null
          allowances?: Json | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deductions?: Json | null
          effective_from?: string
          effective_until?: string | null
          funder_name?: string | null
          funding_project?: string | null
          funds_source?: string
          id?: string
          is_current?: boolean | null
          net_salary?: number | null
          pay_frequency?: string | null
          provider_id?: string
          salary_grade?: string
          salary_step?: string | null
          total_allowances?: number | null
          total_deductions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_salary_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          department: string | null
          effective_from: string
          effective_to: string | null
          end_time: string
          id: string
          is_available: boolean | null
          location: string | null
          max_appointments: number | null
          provider_id: string
          slot_duration_minutes: number | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          department?: string | null
          effective_from?: string
          effective_to?: string | null
          end_time: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          max_appointments?: number | null
          provider_id: string
          slot_duration_minutes?: number | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          department?: string | null
          effective_from?: string
          effective_to?: string | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          max_appointments?: number | null
          provider_id?: string
          slot_duration_minutes?: number | null
          start_time?: string
        }
        Relationships: []
      }
      provider_state_transitions: {
        Row: {
          changed_by: string
          changed_by_role: string | null
          council_reference: string | null
          created_at: string
          from_state:
            | Database["public"]["Enums"]["provider_lifecycle_state"]
            | null
          id: string
          metadata: Json | null
          provider_id: string
          reason: string | null
          reason_code: string | null
          to_state: Database["public"]["Enums"]["provider_lifecycle_state"]
        }
        Insert: {
          changed_by: string
          changed_by_role?: string | null
          council_reference?: string | null
          created_at?: string
          from_state?:
            | Database["public"]["Enums"]["provider_lifecycle_state"]
            | null
          id?: string
          metadata?: Json | null
          provider_id: string
          reason?: string | null
          reason_code?: string | null
          to_state: Database["public"]["Enums"]["provider_lifecycle_state"]
        }
        Update: {
          changed_by?: string
          changed_by_role?: string | null
          council_reference?: string | null
          created_at?: string
          from_state?:
            | Database["public"]["Enums"]["provider_lifecycle_state"]
            | null
          id?: string
          metadata?: Json | null
          provider_id?: string
          reason?: string | null
          reason_code?: string | null
          to_state?: Database["public"]["Enums"]["provider_lifecycle_state"]
        }
        Relationships: [
          {
            foreignKeyName: "provider_state_transitions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_time_off: {
        Row: {
          created_at: string
          end_date: string
          id: string
          provider_id: string
          reason: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          provider_id: string
          reason?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          provider_id?: string
          reason?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      provider_training: {
        Row: {
          certificate_number: string | null
          certificate_received: boolean | null
          certificate_url: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          end_date: string | null
          expiry_date: string | null
          id: string
          location: string | null
          provider_id: string
          sponsored_by: string | null
          start_date: string
          status: string | null
          training_category: string | null
          training_name: string
          training_provider: string
          training_type: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_received?: boolean | null
          certificate_url?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          provider_id: string
          sponsored_by?: string | null
          start_date: string
          status?: string | null
          training_category?: string | null
          training_name: string
          training_provider: string
          training_type: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          certificate_received?: boolean | null
          certificate_url?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          provider_id?: string
          sponsored_by?: string | null
          start_date?: string
          status?: string | null
          training_category?: string | null
          training_name?: string
          training_provider?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_training_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "health_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          biometric_enrolled: boolean | null
          biometric_facial_hash: string | null
          biometric_fingerprint_hash: string | null
          biometric_iris_hash: string | null
          created_at: string | null
          department: string | null
          email: string | null
          facility_gofr_id: string | null
          full_name: string
          id: string
          ihris_id: string
          is_active: boolean | null
          license_number: string | null
          phone: string | null
          role: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          facility_gofr_id?: string | null
          full_name: string
          id?: string
          ihris_id: string
          is_active?: boolean | null
          license_number?: string | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          biometric_enrolled?: boolean | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          facility_gofr_id?: string | null
          full_name?: string
          id?: string
          ihris_id?: string
          is_active?: boolean | null
          license_number?: string | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_daily_stats: {
        Row: {
          appointments: number | null
          avg_service_minutes: number | null
          avg_wait_minutes: number | null
          cancelled: number | null
          completed: number | null
          created_at: string | null
          id: string
          max_wait_minutes: number | null
          no_shows: number | null
          peak_queue_length: number | null
          peak_time: string | null
          queue_id: string
          sla_breached_count: number | null
          sla_met_count: number | null
          stat_date: string
          total_arrivals: number | null
          transfers_in: number | null
          transfers_out: number | null
          updated_at: string | null
          walk_ins: number | null
        }
        Insert: {
          appointments?: number | null
          avg_service_minutes?: number | null
          avg_wait_minutes?: number | null
          cancelled?: number | null
          completed?: number | null
          created_at?: string | null
          id?: string
          max_wait_minutes?: number | null
          no_shows?: number | null
          peak_queue_length?: number | null
          peak_time?: string | null
          queue_id: string
          sla_breached_count?: number | null
          sla_met_count?: number | null
          stat_date?: string
          total_arrivals?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          updated_at?: string | null
          walk_ins?: number | null
        }
        Update: {
          appointments?: number | null
          avg_service_minutes?: number | null
          avg_wait_minutes?: number | null
          cancelled?: number | null
          completed?: number | null
          created_at?: string | null
          id?: string
          max_wait_minutes?: number | null
          no_shows?: number | null
          peak_queue_length?: number | null
          peak_time?: string | null
          queue_id?: string
          sla_breached_count?: number | null
          sla_met_count?: number | null
          stat_date?: string
          total_arrivals?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          updated_at?: string | null
          walk_ins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_daily_stats_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_definitions: {
        Row: {
          allowed_cadres: string[] | null
          color_code: string | null
          created_at: string | null
          created_by: string | null
          default_next_queue_id: string | null
          default_priority: Database["public"]["Enums"]["queue_priority"] | null
          description: string | null
          display_order: number | null
          escalation_threshold_minutes: number | null
          facility_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_virtual: boolean | null
          name: string
          operating_days: number[] | null
          operating_hours_end: string | null
          operating_hours_start: string | null
          pool_id: string | null
          service_type: Database["public"]["Enums"]["queue_service_type"]
          sla_target_minutes: number | null
          updated_at: string | null
          updated_by: string | null
          version: number | null
          walk_in_appointment_ratio: string | null
          workspace_id: string | null
        }
        Insert: {
          allowed_cadres?: string[] | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          default_next_queue_id?: string | null
          default_priority?:
            | Database["public"]["Enums"]["queue_priority"]
            | null
          description?: string | null
          display_order?: number | null
          escalation_threshold_minutes?: number | null
          facility_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          name: string
          operating_days?: number[] | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          pool_id?: string | null
          service_type: Database["public"]["Enums"]["queue_service_type"]
          sla_target_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          walk_in_appointment_ratio?: string | null
          workspace_id?: string | null
        }
        Update: {
          allowed_cadres?: string[] | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          default_next_queue_id?: string | null
          default_priority?:
            | Database["public"]["Enums"]["queue_priority"]
            | null
          description?: string | null
          display_order?: number | null
          escalation_threshold_minutes?: number | null
          facility_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          name?: string
          operating_days?: number[] | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          pool_id?: string | null
          service_type?: Database["public"]["Enums"]["queue_service_type"]
          sla_target_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          walk_in_appointment_ratio?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "queue_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "queue_definitions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_facility_config: {
        Row: {
          created_at: string | null
          default_sla_consultation_minutes: number | null
          default_sla_imaging_minutes: number | null
          default_sla_lab_minutes: number | null
          default_sla_pharmacy_minutes: number | null
          default_sla_triage_minutes: number | null
          enable_overflow_queues: boolean | null
          enable_patient_display: boolean | null
          enable_priority_escalation: boolean | null
          enable_self_checkin: boolean | null
          enable_sla_tracking: boolean | null
          enable_sms_notifications: boolean | null
          enable_tokens: boolean | null
          facility_id: string
          id: string
          max_overflow_queues: number | null
          queue_mode: Database["public"]["Enums"]["queue_facility_mode"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_sla_consultation_minutes?: number | null
          default_sla_imaging_minutes?: number | null
          default_sla_lab_minutes?: number | null
          default_sla_pharmacy_minutes?: number | null
          default_sla_triage_minutes?: number | null
          enable_overflow_queues?: boolean | null
          enable_patient_display?: boolean | null
          enable_priority_escalation?: boolean | null
          enable_self_checkin?: boolean | null
          enable_sla_tracking?: boolean | null
          enable_sms_notifications?: boolean | null
          enable_tokens?: boolean | null
          facility_id: string
          id?: string
          max_overflow_queues?: number | null
          queue_mode?: Database["public"]["Enums"]["queue_facility_mode"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_sla_consultation_minutes?: number | null
          default_sla_imaging_minutes?: number | null
          default_sla_lab_minutes?: number | null
          default_sla_pharmacy_minutes?: number | null
          default_sla_triage_minutes?: number | null
          enable_overflow_queues?: boolean | null
          enable_patient_display?: boolean | null
          enable_priority_escalation?: boolean | null
          enable_self_checkin?: boolean | null
          enable_sla_tracking?: boolean | null
          enable_sms_notifications?: boolean | null
          enable_tokens?: boolean | null
          facility_id?: string
          id?: string
          max_overflow_queues?: number | null
          queue_mode?: Database["public"]["Enums"]["queue_facility_mode"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_facility_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_facility_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "queue_facility_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      queue_items: {
        Row: {
          appointment_id: string | null
          arrival_date: string
          arrival_time: string
          assigned_provider_id: string | null
          assigned_team_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          encounter_id: string | null
          entry_type: Database["public"]["Enums"]["queue_entry_type"]
          escalated_at: string | null
          escalated_by: string | null
          escalation_reason: string | null
          health_id: string | null
          id: string
          in_service_at: string | null
          is_escalated: boolean | null
          notes: string | null
          ordering_provider_id: string | null
          patient_id: string | null
          paused_at: string | null
          priority: Database["public"]["Enums"]["queue_priority"]
          priority_change_reason: string | null
          priority_changed_at: string | null
          priority_changed_by: string | null
          queue_id: string
          reason_code: string | null
          reason_for_visit: string | null
          referral_id: string | null
          resumed_at: string | null
          sequence_number: number
          service_time_minutes: number | null
          status: Database["public"]["Enums"]["queue_item_status"]
          temp_identity_id: string | null
          ticket_number: string | null
          transfer_reason: string | null
          transfer_request_id: string | null
          transferred_from_item_id: string | null
          transferred_from_queue_id: string | null
          updated_at: string | null
          wait_time_minutes: number | null
        }
        Insert: {
          appointment_id?: string | null
          arrival_date?: string
          arrival_time?: string
          assigned_provider_id?: string | null
          assigned_team_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          encounter_id?: string | null
          entry_type?: Database["public"]["Enums"]["queue_entry_type"]
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_reason?: string | null
          health_id?: string | null
          id?: string
          in_service_at?: string | null
          is_escalated?: boolean | null
          notes?: string | null
          ordering_provider_id?: string | null
          patient_id?: string | null
          paused_at?: string | null
          priority?: Database["public"]["Enums"]["queue_priority"]
          priority_change_reason?: string | null
          priority_changed_at?: string | null
          priority_changed_by?: string | null
          queue_id: string
          reason_code?: string | null
          reason_for_visit?: string | null
          referral_id?: string | null
          resumed_at?: string | null
          sequence_number?: number
          service_time_minutes?: number | null
          status?: Database["public"]["Enums"]["queue_item_status"]
          temp_identity_id?: string | null
          ticket_number?: string | null
          transfer_reason?: string | null
          transfer_request_id?: string | null
          transferred_from_item_id?: string | null
          transferred_from_queue_id?: string | null
          updated_at?: string | null
          wait_time_minutes?: number | null
        }
        Update: {
          appointment_id?: string | null
          arrival_date?: string
          arrival_time?: string
          assigned_provider_id?: string | null
          assigned_team_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          encounter_id?: string | null
          entry_type?: Database["public"]["Enums"]["queue_entry_type"]
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_reason?: string | null
          health_id?: string | null
          id?: string
          in_service_at?: string | null
          is_escalated?: boolean | null
          notes?: string | null
          ordering_provider_id?: string | null
          patient_id?: string | null
          paused_at?: string | null
          priority?: Database["public"]["Enums"]["queue_priority"]
          priority_change_reason?: string | null
          priority_changed_at?: string | null
          priority_changed_by?: string | null
          queue_id?: string
          reason_code?: string | null
          reason_for_visit?: string | null
          referral_id?: string | null
          resumed_at?: string | null
          sequence_number?: number
          service_time_minutes?: number | null
          status?: Database["public"]["Enums"]["queue_item_status"]
          temp_identity_id?: string | null
          ticket_number?: string | null
          transfer_reason?: string | null
          transfer_request_id?: string | null
          transferred_from_item_id?: string | null
          transferred_from_queue_id?: string | null
          updated_at?: string | null
          wait_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_transferred_from_queue_id_fkey"
            columns: ["transferred_from_queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_pathways: {
        Row: {
          created_at: string | null
          description: string | null
          facility_id: string
          id: string
          is_active: boolean | null
          name: string
          pathway_steps: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          facility_id: string
          id?: string
          is_active?: boolean | null
          name: string
          pathway_steps: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          pathway_steps?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_pathways_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_pathways_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "queue_pathways_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      queue_transitions: {
        Row: {
          from_queue_id: string | null
          from_status: Database["public"]["Enums"]["queue_item_status"] | null
          id: string
          notes: string | null
          performed_by: string
          queue_item_id: string
          reason: string | null
          to_queue_id: string | null
          to_status: Database["public"]["Enums"]["queue_item_status"]
          transition_at: string | null
          workspace_id: string | null
        }
        Insert: {
          from_queue_id?: string | null
          from_status?: Database["public"]["Enums"]["queue_item_status"] | null
          id?: string
          notes?: string | null
          performed_by: string
          queue_item_id: string
          reason?: string | null
          to_queue_id?: string | null
          to_status: Database["public"]["Enums"]["queue_item_status"]
          transition_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          from_queue_id?: string | null
          from_status?: Database["public"]["Enums"]["queue_item_status"] | null
          id?: string
          notes?: string | null
          performed_by?: string
          queue_item_id?: string
          reason?: string | null
          to_queue_id?: string | null
          to_status?: Database["public"]["Enums"]["queue_item_status"]
          transition_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_transitions_from_queue_id_fkey"
            columns: ["from_queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_transitions_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_transitions_to_queue_id_fkey"
            columns: ["to_queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string
          facility_id: string | null
          id: string
          invoice_id: string | null
          is_voided: boolean | null
          last_printed_at: string | null
          patient_id: string
          payment_method: string
          payment_transaction_id: string | null
          print_count: number | null
          provider_reference: string | null
          receipt_date: string
          receipt_number: string
          receipt_type: string
          transaction_reference: string | null
          void_approved_by: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          facility_id?: string | null
          id?: string
          invoice_id?: string | null
          is_voided?: boolean | null
          last_printed_at?: string | null
          patient_id: string
          payment_method: string
          payment_transaction_id?: string | null
          print_count?: number | null
          provider_reference?: string | null
          receipt_date?: string
          receipt_number: string
          receipt_type?: string
          transaction_reference?: string | null
          void_approved_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          facility_id?: string | null
          id?: string
          invoice_id?: string | null
          is_voided?: boolean | null
          last_printed_at?: string | null
          patient_id?: string
          payment_method?: string
          payment_transaction_id?: string | null
          print_count?: number | null
          provider_reference?: string | null
          receipt_date?: string
          receipt_number?: string
          receipt_type?: string
          transaction_reference?: string | null
          void_approved_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "receipts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_cadres: {
        Row: {
          category: string | null
          code: string
          council_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          council_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          council_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ref_cadres_council_id_fkey"
            columns: ["council_id"]
            isOneToOne: false
            referencedRelation: "professional_councils"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_classifications: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          iso_code: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_code?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_code?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_cpd_activity_types: {
        Row: {
          category: string
          code: string
          created_at: string
          default_points: number
          description: string | null
          id: string
          is_active: boolean | null
          max_points_per_activity: number | null
          name: string
          requires_approval: boolean | null
          requires_certificate: boolean | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          default_points?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_points_per_activity?: number | null
          name: string
          requires_approval?: boolean | null
          requires_certificate?: boolean | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          default_points?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_points_per_activity?: number | null
          name?: string
          requires_approval?: boolean | null
          requires_certificate?: boolean | null
        }
        Relationships: []
      }
      ref_degrees: {
        Row: {
          code: string
          created_at: string | null
          duration_years: number | null
          id: string
          is_active: boolean | null
          level_id: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean | null
          level_id?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean | null
          level_id?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_departure_reasons: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_discipline_actions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          severity: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          severity?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          severity?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_districts: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          region_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          region_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          region_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_document_types: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          name: string
          requires_expiry: boolean | null
          requires_verification: boolean | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name: string
          requires_expiry?: boolean | null
          requires_verification?: boolean | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name?: string
          requires_expiry?: boolean | null
          requires_verification?: boolean | null
        }
        Relationships: []
      }
      ref_education_levels: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          years_of_education: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          years_of_education?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          years_of_education?: number | null
        }
        Relationships: []
      }
      ref_education_majors: {
        Row: {
          code: string
          created_at: string | null
          field_of_study: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          field_of_study?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          field_of_study?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_employment_statuses: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_employment_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_facility_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_funds_sources: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_identifier_types: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          validation_regex: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          validation_regex?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          validation_regex?: string | null
        }
        Relationships: []
      }
      ref_institution_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_institutions: {
        Row: {
          city: string | null
          code: string
          country: string | null
          created_at: string | null
          id: string
          institution_type_id: string | null
          is_accredited: boolean | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          code: string
          country?: string | null
          created_at?: string | null
          id?: string
          institution_type_id?: string | null
          is_accredited?: boolean | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string | null
          id?: string
          institution_type_id?: string | null
          is_accredited?: boolean | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_job_titles: {
        Row: {
          cadre_id: string | null
          classification_id: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          cadre_id?: string | null
          classification_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          cadre_id?: string | null
          classification_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_job_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_leave_types: {
        Row: {
          code: string
          created_at: string
          default_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_days_per_year: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          default_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days_per_year?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          default_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days_per_year?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      ref_nationalities: {
        Row: {
          code: string
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_pay_frequencies: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          periods_per_year: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          periods_per_year?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          periods_per_year?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_regions: {
        Row: {
          code: string
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_salary_grades: {
        Row: {
          code: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_salary: number | null
          min_salary: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_salary?: number | null
          min_salary?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      ref_specializations: {
        Row: {
          applicable_cadres: string[] | null
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          applicable_cadres?: string[] | null
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          applicable_cadres?: string[] | null
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_training_types: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          clinical_summary: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          encounter_id: string | null
          from_department: string | null
          id: string
          patient_id: string
          reason: string
          referral_number: string
          referral_type: string
          requested_at: string
          requested_by: string | null
          status: string
          to_department: string
          to_provider_id: string | null
          to_provider_name: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          clinical_summary?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          encounter_id?: string | null
          from_department?: string | null
          id?: string
          patient_id: string
          reason: string
          referral_number: string
          referral_type: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          to_department: string
          to_provider_id?: string | null
          to_provider_name?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          clinical_summary?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          encounter_id?: string | null
          from_department?: string | null
          id?: string
          patient_id?: string
          reason?: string
          referral_number?: string
          referral_type?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          to_department?: string
          to_provider_id?: string | null
          to_provider_name?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          account_id: string | null
          approval_threshold: number | null
          approved_at: string | null
          approved_by: string | null
          chargeback_received_at: string | null
          created_at: string | null
          facility_id: string | null
          id: string
          original_receipt_id: string
          original_transaction_id: string | null
          patient_id: string | null
          processed_at: string | null
          processed_by: string | null
          provider_chargeback_id: string | null
          refund_amount: number
          refund_method: string | null
          refund_number: string
          refund_reason: string
          refund_reference: string | null
          refund_type: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string | null
          requires_approval: boolean | null
          status: string
        }
        Insert: {
          account_id?: string | null
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          chargeback_received_at?: string | null
          created_at?: string | null
          facility_id?: string | null
          id?: string
          original_receipt_id: string
          original_transaction_id?: string | null
          patient_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_chargeback_id?: string | null
          refund_amount: number
          refund_method?: string | null
          refund_number: string
          refund_reason: string
          refund_reference?: string | null
          refund_type: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          status?: string
        }
        Update: {
          account_id?: string | null
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          chargeback_received_at?: string | null
          created_at?: string | null
          facility_id?: string | null
          id?: string
          original_receipt_id?: string
          original_transaction_id?: string | null
          patient_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_chargeback_id?: string | null
          refund_amount?: number
          refund_method?: string | null
          refund_number?: string
          refund_reason?: string
          refund_reference?: string | null
          refund_type?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "visit_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "refunds_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "refunds_original_receipt_id_fkey"
            columns: ["original_receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_admin_roles: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          registry_role: Database["public"]["Enums"]["registry_role"]
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          registry_role: Database["public"]["Enums"]["registry_role"]
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          registry_role?: Database["public"]["Enums"]["registry_role"]
          user_id?: string
        }
        Relationships: []
      }
      registry_audit_log: {
        Row: {
          action: string
          changes: Json | null
          id: string
          ip_address: string | null
          new_status:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          notes: string | null
          old_status:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          performed_at: string
          performed_by: string
          record_id: string
          registry_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          id?: string
          ip_address?: string | null
          new_status?:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          performed_at?: string
          performed_by: string
          record_id: string
          registry_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          id?: string
          ip_address?: string | null
          new_status?:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["registry_record_status"]
            | null
          performed_at?: string
          performed_by?: string
          record_id?: string
          registry_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      remittance_advices: {
        Row: {
          adjustments: number | null
          check_number: string | null
          created_at: string | null
          currency: string
          file_format: string | null
          file_reference: string | null
          id: string
          is_processed: boolean | null
          is_reconciled: boolean | null
          payer_code: string | null
          payer_id: string | null
          payer_name: string
          payment_amount: number
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processing_errors: Json | null
          raw_file_path: string | null
          received_at: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          remittance_number: string
          total_approved: number | null
          total_claimed: number | null
          total_claims: number | null
          total_denied: number | null
        }
        Insert: {
          adjustments?: number | null
          check_number?: string | null
          created_at?: string | null
          currency?: string
          file_format?: string | null
          file_reference?: string | null
          id?: string
          is_processed?: boolean | null
          is_reconciled?: boolean | null
          payer_code?: string | null
          payer_id?: string | null
          payer_name: string
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processing_errors?: Json | null
          raw_file_path?: string | null
          received_at?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          remittance_number: string
          total_approved?: number | null
          total_claimed?: number | null
          total_claims?: number | null
          total_denied?: number | null
        }
        Update: {
          adjustments?: number | null
          check_number?: string | null
          created_at?: string | null
          currency?: string
          file_format?: string | null
          file_reference?: string | null
          id?: string
          is_processed?: boolean | null
          is_reconciled?: boolean | null
          payer_code?: string | null
          payer_id?: string | null
          payer_name?: string
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processing_errors?: Json | null
          raw_file_path?: string | null
          received_at?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          remittance_number?: string
          total_approved?: number | null
          total_claimed?: number | null
          total_claims?: number | null
          total_denied?: number | null
        }
        Relationships: []
      }
      remittance_line_items: {
        Row: {
          adjustment_amount: number | null
          adjustment_codes: string[] | null
          allowed_amount: number | null
          billed_amount: number
          claim_id: string | null
          claim_number: string | null
          created_at: string | null
          id: string
          is_matched: boolean | null
          match_discrepancy: string | null
          matched_at: string | null
          paid_amount: number
          patient_member_id: string | null
          patient_name: string | null
          patient_responsibility: number | null
          remark_codes: string[] | null
          remittance_advice_id: string
          service_date_from: string | null
          service_date_to: string | null
        }
        Insert: {
          adjustment_amount?: number | null
          adjustment_codes?: string[] | null
          allowed_amount?: number | null
          billed_amount: number
          claim_id?: string | null
          claim_number?: string | null
          created_at?: string | null
          id?: string
          is_matched?: boolean | null
          match_discrepancy?: string | null
          matched_at?: string | null
          paid_amount: number
          patient_member_id?: string | null
          patient_name?: string | null
          patient_responsibility?: number | null
          remark_codes?: string[] | null
          remittance_advice_id: string
          service_date_from?: string | null
          service_date_to?: string | null
        }
        Update: {
          adjustment_amount?: number | null
          adjustment_codes?: string[] | null
          allowed_amount?: number | null
          billed_amount?: number
          claim_id?: string | null
          claim_number?: string | null
          created_at?: string | null
          id?: string
          is_matched?: boolean | null
          match_discrepancy?: string | null
          matched_at?: string | null
          paid_amount?: number
          patient_member_id?: string | null
          patient_name?: string | null
          patient_responsibility?: number | null
          remark_codes?: string[] | null
          remittance_advice_id?: string
          service_date_from?: string | null
          service_date_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remittance_line_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittance_line_items_remittance_advice_id_fkey"
            columns: ["remittance_advice_id"]
            isOneToOne: false
            referencedRelation: "remittance_advices"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bookings: {
        Row: {
          attendees: string[] | null
          booked_by: string | null
          booked_by_name: string | null
          created_at: string
          end_time: string
          equipment_needed: string[] | null
          id: string
          notes: string | null
          purpose: string
          recurring_pattern: Json | null
          room_id: string | null
          room_name: string
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          booked_by?: string | null
          booked_by_name?: string | null
          created_at?: string
          end_time: string
          equipment_needed?: string[] | null
          id?: string
          notes?: string | null
          purpose: string
          recurring_pattern?: Json | null
          room_id?: string | null
          room_name: string
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          booked_by?: string | null
          booked_by_name?: string | null
          created_at?: string
          end_time?: string
          equipment_needed?: string[] | null
          id?: string
          notes?: string | null
          purpose?: string
          recurring_pattern?: Json | null
          room_id?: string | null
          room_name?: string
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roster_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string
          entity_type: string
          facility_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          facility_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          facility_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_audit_log_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_audit_log_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "roster_audit_log_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      roster_plans: {
        Row: {
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          name: string
          notes: string | null
          period_end: string
          period_start: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["roster_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          name: string
          notes?: string | null
          period_end: string
          period_start: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["roster_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          name?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["roster_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_plans_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_plans_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "roster_plans_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      schedule_exceptions: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string | null
          exception_date: string
          id: string
          is_available: boolean | null
          provider_id: string | null
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          exception_date: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          exception_date?: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          reason?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_capabilities: string[] | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_capabilities?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_capabilities?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settlement_reconciliations: {
        Row: {
          actual_amount: number | null
          actual_transactions: number | null
          amount_variance: number | null
          bank_reference: string | null
          bank_statement_path: string | null
          created_at: string | null
          discrepancy_notes: string | null
          expected_amount: number | null
          expected_transactions: number | null
          facility_id: string | null
          id: string
          payment_channel: string
          provider_report_path: string | null
          resolution_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          settlement_date: string
          settlement_reference: string | null
          status: string
          transaction_variance: number | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          actual_transactions?: number | null
          amount_variance?: number | null
          bank_reference?: string | null
          bank_statement_path?: string | null
          created_at?: string | null
          discrepancy_notes?: string | null
          expected_amount?: number | null
          expected_transactions?: number | null
          facility_id?: string | null
          id?: string
          payment_channel: string
          provider_report_path?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          settlement_date: string
          settlement_reference?: string | null
          status?: string
          transaction_variance?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          actual_transactions?: number | null
          amount_variance?: number | null
          bank_reference?: string | null
          bank_statement_path?: string | null
          created_at?: string | null
          discrepancy_notes?: string | null
          expected_amount?: number | null
          expected_transactions?: number | null
          facility_id?: string | null
          id?: string
          payment_channel?: string
          provider_report_path?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          settlement_date?: string
          settlement_reference?: string | null
          status?: string
          transaction_variance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "settlement_reconciliations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          assigned_by: string | null
          assigned_role: string | null
          assignment_date: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          notes: string | null
          original_provider_id: string | null
          pool_id: string | null
          provider_id: string
          roster_plan_id: string
          shift_definition_id: string
          status: Database["public"]["Enums"]["shift_assignment_status"]
          swap_approved_at: string | null
          swap_approved_by: string | null
          swap_reason: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_role?: string | null
          assignment_date: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          original_provider_id?: string | null
          pool_id?: string | null
          provider_id: string
          roster_plan_id: string
          shift_definition_id: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          swap_approved_at?: string | null
          swap_approved_by?: string | null
          swap_reason?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_role?: string | null
          assignment_date?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          original_provider_id?: string | null
          pool_id?: string | null
          provider_id?: string
          roster_plan_id?: string
          shift_definition_id?: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          swap_approved_at?: string | null
          swap_approved_by?: string | null
          swap_reason?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_original_provider_id_fkey"
            columns: ["original_provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_original_provider_id_fkey"
            columns: ["original_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "virtual_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_roster_plan_id_fkey"
            columns: ["roster_plan_id"]
            isOneToOne: false
            referencedRelation: "roster_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_definition_id_fkey"
            columns: ["shift_definition_id"]
            isOneToOne: false
            referencedRelation: "shift_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_definitions: {
        Row: {
          break_minutes: number | null
          code: string
          color: string | null
          created_at: string
          crosses_midnight: boolean | null
          duration_hours: number
          end_time: string
          facility_id: string
          id: string
          is_active: boolean | null
          name: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          sort_order: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number | null
          code: string
          color?: string | null
          created_at?: string
          crosses_midnight?: boolean | null
          duration_hours: number
          end_time: string
          facility_id: string
          id?: string
          is_active?: boolean | null
          name: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          sort_order?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number | null
          code?: string
          color?: string | null
          created_at?: string
          crosses_midnight?: boolean | null
          duration_hours?: number
          end_time?: string
          facility_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          sort_order?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shift_definitions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      shift_handoffs: {
        Row: {
          completed_at: string | null
          created_at: string
          general_notes: string | null
          id: string
          incoming_user_id: string | null
          outgoing_user_id: string
          patient_ids: string[] | null
          shift_date: string
          shift_time: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          general_notes?: string | null
          id?: string
          incoming_user_id?: string | null
          outgoing_user_id: string
          patient_ids?: string[] | null
          shift_date?: string
          shift_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          general_notes?: string | null
          id?: string
          incoming_user_id?: string | null
          outgoing_user_id?: string
          patient_ids?: string[] | null
          shift_date?: string
          shift_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_workspace_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          entered_at: string
          exited_at: string | null
          id: string
          shift_id: string
          transfer_notes: string | null
          transfer_reason:
            | Database["public"]["Enums"]["workspace_transfer_reason"]
            | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          shift_id: string
          transfer_notes?: string | null
          transfer_reason?:
            | Database["public"]["Enums"]["workspace_transfer_reason"]
            | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          shift_id?: string
          transfer_notes?: string | null
          transfer_reason?:
            | Database["public"]["Enums"]["workspace_transfer_reason"]
            | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_workspace_logs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_workspace_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          current_workspace_id: string | null
          end_method: string | null
          ended_at: string | null
          facility_id: string
          handover_notes: string | null
          id: string
          provider_id: string
          start_method: string
          started_at: string
          status: Database["public"]["Enums"]["shift_status"]
          summary: string | null
          total_duration_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_workspace_id?: string | null
          end_method?: string | null
          ended_at?: string | null
          facility_id: string
          handover_notes?: string | null
          id?: string
          provider_id: string
          start_method?: string
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          summary?: string | null
          total_duration_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_workspace_id?: string | null
          end_method?: string | null
          ended_at?: string | null
          facility_id?: string
          handover_notes?: string | null
          id?: string
          provider_id?: string
          start_method?: string
          started_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          summary?: string | null
          total_duration_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shifts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "shifts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shr_bundles: {
        Row: {
          author_id: string | null
          authored_at: string
          bundle_json: Json
          bundle_type: string
          composition_type: string
          created_at: string
          encounter_id: string | null
          fhir_version: string | null
          id: string
          patient_id: string
          signature_hash: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          authored_at?: string
          bundle_json: Json
          bundle_type?: string
          composition_type: string
          created_at?: string
          encounter_id?: string | null
          fhir_version?: string | null
          id?: string
          patient_id: string
          signature_hash?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          authored_at?: string
          bundle_json?: Json
          bundle_type?: string
          composition_type?: string
          created_at?: string
          encounter_id?: string | null
          fhir_version?: string | null
          id?: string
          patient_id?: string
          signature_hash?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shr_bundles_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shr_bundles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_desk_metrics: {
        Row: {
          avg_processing_time: number | null
          confirmed_identity_count: number | null
          created_at: string | null
          emergency_count: number | null
          facility_id: string
          id: string
          immediate_care_count: number | null
          max_processing_time: number | null
          metric_date: string
          metric_hour: number | null
          min_processing_time: number | null
          queued_count: number | null
          routine_count: number | null
          temporary_identity_count: number | null
          total_arrivals: number | null
          total_triaged: number | null
          updated_at: string | null
          urgent_count: number | null
          very_urgent_count: number | null
          workspace_id: string | null
        }
        Insert: {
          avg_processing_time?: number | null
          confirmed_identity_count?: number | null
          created_at?: string | null
          emergency_count?: number | null
          facility_id: string
          id?: string
          immediate_care_count?: number | null
          max_processing_time?: number | null
          metric_date: string
          metric_hour?: number | null
          min_processing_time?: number | null
          queued_count?: number | null
          routine_count?: number | null
          temporary_identity_count?: number | null
          total_arrivals?: number | null
          total_triaged?: number | null
          updated_at?: string | null
          urgent_count?: number | null
          very_urgent_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          avg_processing_time?: number | null
          confirmed_identity_count?: number | null
          created_at?: string | null
          emergency_count?: number | null
          facility_id?: string
          id?: string
          immediate_care_count?: number | null
          max_processing_time?: number | null
          metric_date?: string
          metric_hour?: number | null
          min_processing_time?: number | null
          queued_count?: number | null
          routine_count?: number | null
          temporary_identity_count?: number | null
          total_arrivals?: number | null
          total_triaged?: number | null
          updated_at?: string | null
          urgent_count?: number | null
          very_urgent_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorting_desk_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_desk_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "sorting_desk_metrics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "sorting_desk_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_session_audit: {
        Row: {
          action: string
          action_data: Json | null
          id: string
          performed_at: string | null
          performed_by: string | null
          sorting_session_id: string
        }
        Insert: {
          action: string
          action_data?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          sorting_session_id: string
        }
        Update: {
          action?: string
          action_data?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          sorting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sorting_session_audit_sorting_session_id_fkey"
            columns: ["sorting_session_id"]
            isOneToOne: false
            referencedRelation: "sorting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_sessions: {
        Row: {
          arrival_mode: Database["public"]["Enums"]["arrival_mode"]
          arrival_time: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          danger_signs: string[] | null
          encounter_id: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalated_by: string | null
          escalated_reason: string | null
          facility_id: string | null
          health_id: string | null
          id: string
          identity_status: Database["public"]["Enums"]["identity_resolution_status"]
          immediate_care_workspace_id: string | null
          outcome: Database["public"]["Enums"]["sorting_outcome"] | null
          outcome_at: string | null
          outcome_by: string | null
          outcome_reason: string | null
          patient_id: string | null
          presenting_complaint: string | null
          processing_time_seconds: number | null
          queue_item_id: string | null
          search_query: string | null
          session_number: string
          sorting_desk_id: string | null
          status: Database["public"]["Enums"]["sorting_session_status"]
          supervisor_notes: string | null
          supervisor_override: boolean | null
          target_queue_id: string | null
          temp_identity_id: string | null
          triage_at: string | null
          triage_by: string | null
          triage_category: Database["public"]["Enums"]["triage_urgency"] | null
          triage_notes: string | null
          updated_at: string | null
        }
        Insert: {
          arrival_mode?: Database["public"]["Enums"]["arrival_mode"]
          arrival_time?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          danger_signs?: string[] | null
          encounter_id?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_reason?: string | null
          facility_id?: string | null
          health_id?: string | null
          id?: string
          identity_status?: Database["public"]["Enums"]["identity_resolution_status"]
          immediate_care_workspace_id?: string | null
          outcome?: Database["public"]["Enums"]["sorting_outcome"] | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_reason?: string | null
          patient_id?: string | null
          presenting_complaint?: string | null
          processing_time_seconds?: number | null
          queue_item_id?: string | null
          search_query?: string | null
          session_number: string
          sorting_desk_id?: string | null
          status?: Database["public"]["Enums"]["sorting_session_status"]
          supervisor_notes?: string | null
          supervisor_override?: boolean | null
          target_queue_id?: string | null
          temp_identity_id?: string | null
          triage_at?: string | null
          triage_by?: string | null
          triage_category?: Database["public"]["Enums"]["triage_urgency"] | null
          triage_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          arrival_mode?: Database["public"]["Enums"]["arrival_mode"]
          arrival_time?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          danger_signs?: string[] | null
          encounter_id?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_reason?: string | null
          facility_id?: string | null
          health_id?: string | null
          id?: string
          identity_status?: Database["public"]["Enums"]["identity_resolution_status"]
          immediate_care_workspace_id?: string | null
          outcome?: Database["public"]["Enums"]["sorting_outcome"] | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_reason?: string | null
          patient_id?: string | null
          presenting_complaint?: string | null
          processing_time_seconds?: number | null
          queue_item_id?: string | null
          search_query?: string | null
          session_number?: string
          sorting_desk_id?: string | null
          status?: Database["public"]["Enums"]["sorting_session_status"]
          supervisor_notes?: string | null
          supervisor_override?: boolean | null
          target_queue_id?: string | null
          temp_identity_id?: string | null
          triage_at?: string | null
          triage_by?: string | null
          triage_category?: Database["public"]["Enums"]["triage_urgency"] | null
          triage_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorting_sessions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "sorting_sessions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "sorting_sessions_immediate_care_workspace_id_fkey"
            columns: ["immediate_care_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_sorting_desk_id_fkey"
            columns: ["sorting_desk_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_sessions_target_queue_id_fkey"
            columns: ["target_queue_id"]
            isOneToOne: false
            referencedRelation: "queue_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      specimen_tracking: {
        Row: {
          action: string
          condition_on_receipt: string | null
          created_at: string
          id: string
          location_from: string | null
          location_to: string | null
          notes: string | null
          performed_at: string
          performed_by: string
          specimen_id: string
          temperature_logged: number | null
        }
        Insert: {
          action: string
          condition_on_receipt?: string | null
          created_at?: string
          id?: string
          location_from?: string | null
          location_to?: string | null
          notes?: string | null
          performed_at?: string
          performed_by: string
          specimen_id: string
          temperature_logged?: number | null
        }
        Update: {
          action?: string
          condition_on_receipt?: string | null
          created_at?: string
          id?: string
          location_from?: string | null
          location_to?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string
          specimen_id?: string
          temperature_logged?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specimen_tracking_specimen_id_fkey"
            columns: ["specimen_id"]
            isOneToOne: false
            referencedRelation: "specimens"
            referencedColumns: ["id"]
          },
        ]
      }
      specimens: {
        Row: {
          barcode: string | null
          body_site_code: string | null
          collected_at: string
          collected_by: string | null
          collection_method: string | null
          collection_notes: string | null
          collection_site: string | null
          container_type: string | null
          created_at: string
          disposed_at: string | null
          disposed_by: string | null
          encounter_id: string | null
          external_id: string | null
          fasting_status: string | null
          id: string
          is_biohazard: boolean | null
          lab_order_id: string | null
          patient_id: string
          preservative: string | null
          priority: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          received_at: string | null
          received_by: string | null
          received_condition: string | null
          referral_lab_id: string | null
          rejection_reason: string | null
          shipped_at: string | null
          shipped_by: string | null
          snomed_specimen_code: string | null
          specimen_id: string
          specimen_source: string | null
          specimen_type: string
          status: string
          storage_location: string | null
          temperature_requirement: string | null
          transport_conditions: string | null
          updated_at: string
          volume_collected: string | null
          volume_unit: string | null
        }
        Insert: {
          barcode?: string | null
          body_site_code?: string | null
          collected_at?: string
          collected_by?: string | null
          collection_method?: string | null
          collection_notes?: string | null
          collection_site?: string | null
          container_type?: string | null
          created_at?: string
          disposed_at?: string | null
          disposed_by?: string | null
          encounter_id?: string | null
          external_id?: string | null
          fasting_status?: string | null
          id?: string
          is_biohazard?: boolean | null
          lab_order_id?: string | null
          patient_id: string
          preservative?: string | null
          priority?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          received_at?: string | null
          received_by?: string | null
          received_condition?: string | null
          referral_lab_id?: string | null
          rejection_reason?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          snomed_specimen_code?: string | null
          specimen_id: string
          specimen_source?: string | null
          specimen_type: string
          status?: string
          storage_location?: string | null
          temperature_requirement?: string | null
          transport_conditions?: string | null
          updated_at?: string
          volume_collected?: string | null
          volume_unit?: string | null
        }
        Update: {
          barcode?: string | null
          body_site_code?: string | null
          collected_at?: string
          collected_by?: string | null
          collection_method?: string | null
          collection_notes?: string | null
          collection_site?: string | null
          container_type?: string | null
          created_at?: string
          disposed_at?: string | null
          disposed_by?: string | null
          encounter_id?: string | null
          external_id?: string | null
          fasting_status?: string | null
          id?: string
          is_biohazard?: boolean | null
          lab_order_id?: string | null
          patient_id?: string
          preservative?: string | null
          priority?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          received_at?: string | null
          received_by?: string | null
          received_condition?: string | null
          referral_lab_id?: string | null
          rejection_reason?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          snomed_specimen_code?: string | null
          specimen_id?: string
          specimen_source?: string | null
          specimen_type?: string
          status?: string
          storage_location?: string | null
          temperature_requirement?: string | null
          transport_conditions?: string | null
          updated_at?: string
          volume_collected?: string | null
          volume_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specimens_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specimens_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specimens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specimens_referral_lab_id_fkey"
            columns: ["referral_lab_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specimens_referral_lab_id_fkey"
            columns: ["referral_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "specimens_referral_lab_id_fkey"
            columns: ["referral_lab_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          end_time: string
          id: string
          location: string | null
          notes: string | null
          role: string | null
          shift_date: string
          shift_type: string
          staff_id: string
          staff_name: string
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          shift_date: string
          shift_type: string
          staff_id: string
          staff_name: string
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          role?: string | null
          shift_date?: string
          shift_type?: string
          staff_id?: string
          staff_name?: string
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "stock_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_chargeable: boolean
          is_consumable: boolean
          name: string
          reorder_level: number
          reorder_quantity: number
          requires_prescription: boolean
          selling_price: number
          sku: string
          storage_conditions: string | null
          supplier_id: string | null
          unit_cost: number
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_chargeable?: boolean
          is_consumable?: boolean
          name: string
          reorder_level?: number
          reorder_quantity?: number
          requires_prescription?: boolean
          selling_price?: number
          sku: string
          storage_conditions?: string | null
          supplier_id?: string | null
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_chargeable?: boolean
          is_consumable?: boolean
          name?: string
          reorder_level?: number
          reorder_quantity?: number
          requires_prescription?: boolean
          selling_price?: number
          sku?: string
          storage_conditions?: string | null
          supplier_id?: string | null
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "stock_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          batch_number: string | null
          expiry_date: string | null
          id: string
          item_id: string
          last_counted_at: string | null
          location_id: string
          quantity_on_hand: number
          quantity_reserved: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          expiry_date?: string | null
          id?: string
          item_id: string
          last_counted_at?: string | null
          location_id: string
          quantity_on_hand?: number
          quantity_reserved?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          expiry_date?: string | null
          id?: string
          item_id?: string
          last_counted_at?: string | null
          location_id?: string
          quantity_on_hand?: number
          quantity_reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location_type: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_type: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_type?: string
          name?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          created_at: string
          encounter_id: string | null
          from_location_id: string | null
          id: string
          item_id: string
          movement_type: string
          performed_by: string | null
          quantity: number
          reason: string | null
          reference_number: string | null
          to_location_id: string | null
          unit_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          encounter_id?: string | null
          from_location_id?: string | null
          id?: string
          item_id: string
          movement_type: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
          reference_number?: string | null
          to_location_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          encounter_id?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          reference_number?: string | null
          to_location_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_access_log: {
        Row: {
          access_type: string
          accessed_by: string | null
          accessed_by_role: string | null
          accessed_via: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_break_glass: boolean | null
          justification: string | null
          patient_id: string
          purpose_of_use: string | null
          share_expires_at: string | null
          share_recipient: string | null
          summary_id: string
          summary_type: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by?: string | null
          accessed_by_role?: string | null
          accessed_via?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_break_glass?: boolean | null
          justification?: string | null
          patient_id: string
          purpose_of_use?: string | null
          share_expires_at?: string | null
          share_recipient?: string | null
          summary_id: string
          summary_type: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string | null
          accessed_by_role?: string | null
          accessed_via?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_break_glass?: boolean | null
          justification?: string | null
          patient_id?: string
          purpose_of_use?: string | null
          share_expires_at?: string | null
          share_recipient?: string | null
          summary_id?: string
          summary_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_share_tokens: {
        Row: {
          access_level: string | null
          allowed_actions: string[] | null
          created_at: string
          created_by: string
          created_by_role: string | null
          current_access_count: number | null
          expires_at: string
          id: string
          max_access_count: number | null
          patient_id: string
          qr_code_url: string | null
          recipient_identifier: string | null
          recipient_type: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          summary_id: string
          summary_type: string
          token: string
          valid_from: string
        }
        Insert: {
          access_level?: string | null
          allowed_actions?: string[] | null
          created_at?: string
          created_by: string
          created_by_role?: string | null
          current_access_count?: number | null
          expires_at: string
          id?: string
          max_access_count?: number | null
          patient_id: string
          qr_code_url?: string | null
          recipient_identifier?: string | null
          recipient_type?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          summary_id: string
          summary_type: string
          token: string
          valid_from?: string
        }
        Update: {
          access_level?: string | null
          allowed_actions?: string[] | null
          created_at?: string
          created_by?: string
          created_by_role?: string | null
          current_access_count?: number | null
          expires_at?: string
          id?: string
          max_access_count?: number | null
          patient_id?: string
          qr_code_url?: string | null
          recipient_identifier?: string | null
          recipient_type?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          summary_id?: string
          summary_type?: string
          token?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_share_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tariffs: {
        Row: {
          base_price: number
          created_at: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          facility_id: string | null
          government_price: number | null
          id: string
          insurance_price: number | null
          is_active: boolean | null
          is_elective: boolean | null
          is_emergency_exempt: boolean | null
          requires_authorization: boolean | null
          service_category: string | null
          service_code: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          facility_id?: string | null
          government_price?: number | null
          id?: string
          insurance_price?: number | null
          is_active?: boolean | null
          is_elective?: boolean | null
          is_emergency_exempt?: boolean | null
          requires_authorization?: boolean | null
          service_category?: string | null
          service_code: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          facility_id?: string | null
          government_price?: number | null
          id?: string
          insurance_price?: number | null
          is_active?: boolean | null
          is_elective?: boolean | null
          is_emergency_exempt?: boolean | null
          requires_authorization?: boolean | null
          service_category?: string | null
          service_code?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tariffs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tariffs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "tariffs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      teleconsult_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessor_id: string
          actions_performed: Json | null
          id: string
          ip_address: unknown
          patient_id: string
          referral_id: string | null
          resource_accessed: string
          session_id: string | null
          token_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessor_id: string
          actions_performed?: Json | null
          id?: string
          ip_address?: unknown
          patient_id: string
          referral_id?: string | null
          resource_accessed: string
          session_id?: string | null
          token_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessor_id?: string
          actions_performed?: Json | null
          id?: string
          ip_address?: unknown
          patient_id?: string
          referral_id?: string | null
          resource_accessed?: string
          session_id?: string | null
          token_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_access_log_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_access_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "teleconsult_access_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsult_access_tokens: {
        Row: {
          consent_reference: string | null
          consent_timestamp: string
          consent_type: string
          created_at: string | null
          granted_by_provider_id: string
          granted_to_provider_id: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          max_access_count: number | null
          patient_id: string
          referral_id: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          scope: Database["public"]["Enums"]["ehr_access_scope"]
          session_id: string
          times_accessed: number | null
          token_hash: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          consent_reference?: string | null
          consent_timestamp: string
          consent_type: string
          created_at?: string | null
          granted_by_provider_id: string
          granted_to_provider_id: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_access_count?: number | null
          patient_id: string
          referral_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scope?: Database["public"]["Enums"]["ehr_access_scope"]
          session_id: string
          times_accessed?: number | null
          token_hash: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          consent_reference?: string | null
          consent_timestamp?: string
          consent_type?: string
          created_at?: string | null
          granted_by_provider_id?: string
          granted_to_provider_id?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_access_count?: number | null
          patient_id?: string
          referral_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scope?: Database["public"]["Enums"]["ehr_access_scope"]
          session_id?: string
          times_accessed?: number | null
          token_hash?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_access_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_access_tokens_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsult_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size_bytes: number | null
          id: string
          session_id: string
          shared_at: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          session_id: string
          shared_at?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          session_id?: string
          shared_at?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      teleconsult_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_shared_with_patient: boolean | null
          note_type: string
          session_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_shared_with_patient?: boolean | null
          note_type?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_shared_with_patient?: boolean | null
          note_type?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teleconsult_responses: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assessment: string | null
          attachments_used: Json | null
          board_participants: Json | null
          clinical_interpretation: string | null
          consultant_facility_id: string | null
          consultant_provider_id: string
          created_at: string | null
          diagnosis_codes: Json | null
          disposition_instructions: string | null
          disposition_type: string
          ehr_actions: Json | null
          follow_up_instructions: string | null
          follow_up_responsible_facility: string | null
          follow_up_type: string | null
          follow_up_when: string | null
          id: string
          impressions: string | null
          investigations: Json | null
          key_findings: string | null
          medications: Json | null
          mode_used: string
          monitoring_requirements: string | null
          orders_placed: Json | null
          patient_id: string
          procedures: Json | null
          referral_id: string | null
          response_to_questions: string | null
          session_duration_seconds: number | null
          session_id: string
          status: string
          submitted_at: string | null
          transfer_facility_id: string | null
          treatment_plan: string | null
          updated_at: string | null
          working_diagnosis: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assessment?: string | null
          attachments_used?: Json | null
          board_participants?: Json | null
          clinical_interpretation?: string | null
          consultant_facility_id?: string | null
          consultant_provider_id: string
          created_at?: string | null
          diagnosis_codes?: Json | null
          disposition_instructions?: string | null
          disposition_type: string
          ehr_actions?: Json | null
          follow_up_instructions?: string | null
          follow_up_responsible_facility?: string | null
          follow_up_type?: string | null
          follow_up_when?: string | null
          id?: string
          impressions?: string | null
          investigations?: Json | null
          key_findings?: string | null
          medications?: Json | null
          mode_used: string
          monitoring_requirements?: string | null
          orders_placed?: Json | null
          patient_id: string
          procedures?: Json | null
          referral_id?: string | null
          response_to_questions?: string | null
          session_duration_seconds?: number | null
          session_id: string
          status?: string
          submitted_at?: string | null
          transfer_facility_id?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          working_diagnosis?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assessment?: string | null
          attachments_used?: Json | null
          board_participants?: Json | null
          clinical_interpretation?: string | null
          consultant_facility_id?: string | null
          consultant_provider_id?: string
          created_at?: string | null
          diagnosis_codes?: Json | null
          disposition_instructions?: string | null
          disposition_type?: string
          ehr_actions?: Json | null
          follow_up_instructions?: string | null
          follow_up_responsible_facility?: string | null
          follow_up_type?: string | null
          follow_up_when?: string | null
          id?: string
          impressions?: string | null
          investigations?: Json | null
          key_findings?: string | null
          medications?: Json | null
          mode_used?: string
          monitoring_requirements?: string | null
          orders_placed?: Json | null
          patient_id?: string
          procedures?: Json | null
          referral_id?: string | null
          response_to_questions?: string | null
          session_duration_seconds?: number | null
          session_id?: string
          status?: string
          submitted_at?: string | null
          transfer_facility_id?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          working_diagnosis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_responses_consultant_facility_id_fkey"
            columns: ["consultant_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_responses_consultant_facility_id_fkey"
            columns: ["consultant_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_responses_consultant_facility_id_fkey"
            columns: ["consultant_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_responses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_responses_transfer_facility_id_fkey"
            columns: ["transfer_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_responses_transfer_facility_id_fkey"
            columns: ["transfer_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_responses_transfer_facility_id_fkey"
            columns: ["transfer_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      teleconsult_sessions: {
        Row: {
          accepted_at: string | null
          call_quality_rating: number | null
          clinical_questions: Json | null
          consent_obtained: boolean | null
          consent_timestamp: string | null
          consulting_facility_id: string | null
          consulting_provider_id: string | null
          created_at: string
          created_by: string
          decline_reason: string | null
          declined_at: string | null
          ended_at: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          mode: string | null
          outcome: string | null
          patient_hid: string | null
          patient_id: string | null
          reason_for_consult: string | null
          referral_id: string
          referring_facility_id: string | null
          referring_provider_id: string | null
          response_id: string | null
          routed_at: string | null
          routed_to_facility_id: string | null
          routed_to_provider_id: string | null
          routing_reason: string | null
          scheduled_at: string | null
          specialty: string | null
          stage_status: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          urgency: string | null
          waiting_room_joined_at: string | null
          workflow_stage: number | null
        }
        Insert: {
          accepted_at?: string | null
          call_quality_rating?: number | null
          clinical_questions?: Json | null
          consent_obtained?: boolean | null
          consent_timestamp?: string | null
          consulting_facility_id?: string | null
          consulting_provider_id?: string | null
          created_at?: string
          created_by: string
          decline_reason?: string | null
          declined_at?: string | null
          ended_at?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          mode?: string | null
          outcome?: string | null
          patient_hid?: string | null
          patient_id?: string | null
          reason_for_consult?: string | null
          referral_id: string
          referring_facility_id?: string | null
          referring_provider_id?: string | null
          response_id?: string | null
          routed_at?: string | null
          routed_to_facility_id?: string | null
          routed_to_provider_id?: string | null
          routing_reason?: string | null
          scheduled_at?: string | null
          specialty?: string | null
          stage_status?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          urgency?: string | null
          waiting_room_joined_at?: string | null
          workflow_stage?: number | null
        }
        Update: {
          accepted_at?: string | null
          call_quality_rating?: number | null
          clinical_questions?: Json | null
          consent_obtained?: boolean | null
          consent_timestamp?: string | null
          consulting_facility_id?: string | null
          consulting_provider_id?: string | null
          created_at?: string
          created_by?: string
          decline_reason?: string | null
          declined_at?: string | null
          ended_at?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          mode?: string | null
          outcome?: string | null
          patient_hid?: string | null
          patient_id?: string | null
          reason_for_consult?: string | null
          referral_id?: string
          referring_facility_id?: string | null
          referring_provider_id?: string | null
          response_id?: string | null
          routed_at?: string | null
          routed_to_facility_id?: string | null
          routed_to_provider_id?: string | null
          routing_reason?: string | null
          scheduled_at?: string | null
          specialty?: string | null
          stage_status?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          urgency?: string | null
          waiting_room_joined_at?: string | null
          workflow_stage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_sessions_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_consulting_facility_id_fkey"
            columns: ["consulting_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_referring_facility_id_fkey"
            columns: ["referring_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_referring_facility_id_fkey"
            columns: ["referring_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_referring_facility_id_fkey"
            columns: ["referring_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_routed_to_facility_id_fkey"
            columns: ["routed_to_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_routed_to_facility_id_fkey"
            columns: ["routed_to_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "teleconsult_sessions_routed_to_facility_id_fkey"
            columns: ["routed_to_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      teleconsult_signals: {
        Row: {
          created_at: string
          id: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          created_at?: string
          id?: string
          sender_id?: string
          session_id?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsult_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teleconsult_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["telemedicine_role"]
          specialty: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["telemedicine_role"]
          specialty?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["telemedicine_role"]
          specialty?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_user_roles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_user_roles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "telemedicine_user_roles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      temporary_patient_identities: {
        Row: {
          alias: string | null
          created_at: string | null
          created_by: string | null
          estimated_age: number | null
          estimated_age_unit: string | null
          expires_at: string | null
          facility_id: string | null
          given_name: string | null
          id: string
          is_active: boolean | null
          reason: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciled_to_patient_id: string | null
          reconciliation_method: string | null
          sex: string | null
          sorting_session_id: string | null
          temp_id: string
          updated_at: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_age?: number | null
          estimated_age_unit?: string | null
          expires_at?: string | null
          facility_id?: string | null
          given_name?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_to_patient_id?: string | null
          reconciliation_method?: string | null
          sex?: string | null
          sorting_session_id?: string | null
          temp_id: string
          updated_at?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_age?: number | null
          estimated_age_unit?: string | null
          expires_at?: string | null
          facility_id?: string | null
          given_name?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_to_patient_id?: string | null
          reconciliation_method?: string | null
          sex?: string | null
          sorting_session_id?: string | null
          temp_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temporary_patient_identities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_patient_identities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "temporary_patient_identities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "temporary_patient_identities_reconciled_to_patient_id_fkey"
            columns: ["reconciled_to_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_patient_identities_sorting_session_id_fkey"
            columns: ["sorting_session_id"]
            isOneToOne: false
            referencedRelation: "sorting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      terminology_code_systems: {
        Row: {
          code_system_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          publisher: string | null
          updated_at: string
          uri: string | null
          version: string
        }
        Insert: {
          code_system_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          publisher?: string | null
          updated_at?: string
          uri?: string | null
          version: string
        }
        Update: {
          code_system_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          publisher?: string | null
          updated_at?: string
          uri?: string | null
          version?: string
        }
        Relationships: []
      }
      terminology_concept_maps: {
        Row: {
          comment: string | null
          created_at: string
          equivalence: string
          id: string
          source_concept_id: string
          target_concept_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          equivalence?: string
          id?: string
          source_concept_id: string
          target_concept_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          equivalence?: string
          id?: string
          source_concept_id?: string
          target_concept_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminology_concept_maps_source_concept_id_fkey"
            columns: ["source_concept_id"]
            isOneToOne: false
            referencedRelation: "terminology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminology_concept_maps_target_concept_id_fkey"
            columns: ["target_concept_id"]
            isOneToOne: false
            referencedRelation: "terminology_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      terminology_concepts: {
        Row: {
          code: string
          code_system_id: string
          created_at: string
          definition: string | null
          display: string
          id: string
          is_active: boolean
          parent_code: string | null
          properties: Json | null
        }
        Insert: {
          code: string
          code_system_id: string
          created_at?: string
          definition?: string | null
          display: string
          id?: string
          is_active?: boolean
          parent_code?: string | null
          properties?: Json | null
        }
        Update: {
          code?: string
          code_system_id?: string
          created_at?: string
          definition?: string | null
          display?: string
          id?: string
          is_active?: boolean
          parent_code?: string | null
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "terminology_concepts_code_system_id_fkey"
            columns: ["code_system_id"]
            isOneToOne: false
            referencedRelation: "terminology_code_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      terminology_value_set_members: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          is_active: boolean
          value_set_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          value_set_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          value_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminology_value_set_members_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "terminology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminology_value_set_members_value_set_id_fkey"
            columns: ["value_set_id"]
            isOneToOne: false
            referencedRelation: "terminology_value_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      terminology_value_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          purpose: string | null
          status: string
          updated_at: string
          value_set_id: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          purpose?: string | null
          status?: string
          updated_at?: string
          value_set_id: string
          version?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          purpose?: string | null
          status?: string
          updated_at?: string
          value_set_id?: string
          version?: string
        }
        Relationships: []
      }
      theatre_bookings: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          anaesthetist_id: string | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          equipment_required: string[] | null
          id: string
          patient_id: string
          post_op_notes: string | null
          pre_op_notes: string | null
          priority: string
          procedure_code: string | null
          procedure_name: string
          scheduled_end: string
          scheduled_start: string
          status: string
          surgeon_id: string | null
          theatre_room: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthetist_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          equipment_required?: string[] | null
          id?: string
          patient_id: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          priority?: string
          procedure_code?: string | null
          procedure_name: string
          scheduled_end: string
          scheduled_start: string
          status?: string
          surgeon_id?: string | null
          theatre_room: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthetist_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          equipment_required?: string[] | null
          id?: string
          patient_id?: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          priority?: string
          procedure_code?: string | null
          procedure_name?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          surgeon_id?: string | null
          theatre_room?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theatre_bookings_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theatre_bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      theatre_team_assignments: {
        Row: {
          booking_id: string
          confirmed: boolean | null
          created_at: string
          id: string
          is_primary: boolean | null
          notes: string | null
          role: string
          staff_id: string | null
          staff_name: string
        }
        Insert: {
          booking_id: string
          confirmed?: boolean | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          role: string
          staff_id?: string | null
          staff_name: string
        }
        Update: {
          booking_id?: string
          confirmed?: boolean | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          role?: string
          staff_id?: string | null
          staff_name?: string
        }
        Relationships: []
      }
      transfer_summaries: {
        Row: {
          acceptance_status: string | null
          accepted_at: string | null
          accepted_by: string | null
          accepting_provider: string | null
          active_problems: Json | null
          allergies: Json | null
          arrival_confirmed_at: string | null
          created_at: string
          critical_information: string | null
          current_medications: Json | null
          destination_department: string | null
          destination_facility_id: string | null
          destination_facility_name: string | null
          document_id: string
          handover_notes: string | null
          id: string
          ips_document_id: string | null
          patient_id: string
          pending_investigations: string | null
          recent_imaging: Json | null
          recent_results: Json | null
          transfer_reason: string
          updated_at: string
          urgency: string
          visit_id: string
          visit_summary_document_id: string | null
        }
        Insert: {
          acceptance_status?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          accepting_provider?: string | null
          active_problems?: Json | null
          allergies?: Json | null
          arrival_confirmed_at?: string | null
          created_at?: string
          critical_information?: string | null
          current_medications?: Json | null
          destination_department?: string | null
          destination_facility_id?: string | null
          destination_facility_name?: string | null
          document_id: string
          handover_notes?: string | null
          id?: string
          ips_document_id?: string | null
          patient_id: string
          pending_investigations?: string | null
          recent_imaging?: Json | null
          recent_results?: Json | null
          transfer_reason: string
          updated_at?: string
          urgency?: string
          visit_id: string
          visit_summary_document_id?: string | null
        }
        Update: {
          acceptance_status?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          accepting_provider?: string | null
          active_problems?: Json | null
          allergies?: Json | null
          arrival_confirmed_at?: string | null
          created_at?: string
          critical_information?: string | null
          current_medications?: Json | null
          destination_department?: string | null
          destination_facility_id?: string | null
          destination_facility_name?: string | null
          document_id?: string
          handover_notes?: string | null
          id?: string
          ips_document_id?: string | null
          patient_id?: string
          pending_investigations?: string | null
          recent_imaging?: Json | null
          recent_results?: Json | null
          transfer_reason?: string
          updated_at?: string
          urgency?: string
          visit_id?: string
          visit_summary_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_summaries_destination_facility_id_fkey"
            columns: ["destination_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_summaries_destination_facility_id_fkey"
            columns: ["destination_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "transfer_summaries_destination_facility_id_fkey"
            columns: ["destination_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "transfer_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_summaries_ips_document_id_fkey"
            columns: ["ips_document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_summaries_visit_summary_document_id_fkey"
            columns: ["visit_summary_document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_used_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_used_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_used_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unmatched_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          matched_at: string | null
          matched_by: string | null
          matched_to_id: string | null
          matched_to_type: string | null
          patient_hint: string | null
          payer_reference: string | null
          provider_reference: string | null
          raw_data: Json | null
          resolution_notes: string | null
          source_reference: string | null
          source_type: string
          status: string
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_to_id?: string | null
          matched_to_type?: string | null
          patient_hint?: string | null
          payer_reference?: string | null
          provider_reference?: string | null
          raw_data?: Json | null
          resolution_notes?: string | null
          source_reference?: string | null
          source_type: string
          status?: string
          transaction_date: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_to_id?: string | null
          matched_to_type?: string | null
          patient_hint?: string | null
          payer_reference?: string | null
          provider_reference?: string | null
          raw_data?: Json | null
          resolution_notes?: string | null
          source_reference?: string | null
          source_type?: string
          status?: string
          transaction_date?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_info: string | null
          ended_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_at: string
          location: string | null
          session_token: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_info?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          location?: string | null
          session_token: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_info?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          location?: string | null
          session_token?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_bids: {
        Row: {
          can_fulfill_all: boolean | null
          created_at: string | null
          delivery_available: boolean | null
          delivery_fee: number | null
          discount_percent: number | null
          estimated_delivery_time: string | null
          estimated_ready_time: string | null
          expires_at: string | null
          id: string
          notes: string | null
          partial_items: Json | null
          request_id: string
          status: string | null
          submitted_at: string | null
          total_amount: number
          unit_prices: Json
          vendor_id: string
        }
        Insert: {
          can_fulfill_all?: boolean | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          discount_percent?: number | null
          estimated_delivery_time?: string | null
          estimated_ready_time?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          partial_items?: Json | null
          request_id: string
          status?: string | null
          submitted_at?: string | null
          total_amount: number
          unit_prices: Json
          vendor_id: string
        }
        Update: {
          can_fulfill_all?: boolean | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          discount_percent?: number | null
          estimated_delivery_time?: string | null
          estimated_ready_time?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          partial_items?: Json | null
          request_id?: string
          status?: string | null
          submitted_at?: string | null
          total_amount?: number
          unit_prices?: Json
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bids_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          batch_number: string | null
          created_at: string | null
          currency: string | null
          discount_percent: number | null
          expiry_date: string | null
          id: string
          is_available: boolean | null
          is_featured: boolean | null
          last_restocked_at: string | null
          lead_time_days: number | null
          max_stock_level: number | null
          min_stock_level: number | null
          notes: string | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
          unit_price: number
          updated_at: string | null
          vendor_id: string
          wholesale_min_quantity: number | null
          wholesale_price: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          currency?: string | null
          discount_percent?: number | null
          expiry_date?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          last_restocked_at?: string | null
          lead_time_days?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          notes?: string | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
          unit_price?: number
          updated_at?: string | null
          vendor_id: string
          wholesale_min_quantity?: number | null
          wholesale_price?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          currency?: string | null
          discount_percent?: number | null
          expiry_date?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          last_restocked_at?: string | null
          lead_time_days?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          notes?: string | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
          unit_price?: number
          updated_at?: string | null
          vendor_id?: string
          wholesale_min_quantity?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ratings: {
        Row: {
          created_at: string
          fulfillment_request_id: string | null
          id: string
          is_verified: boolean | null
          patient_id: string | null
          rated_by: string | null
          rating: number
          responded_at: string | null
          response: string | null
          review: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          fulfillment_request_id?: string | null
          id?: string
          is_verified?: boolean | null
          patient_id?: string | null
          rated_by?: string | null
          rating: number
          responded_at?: string | null
          response?: string | null
          review?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          fulfillment_request_id?: string | null
          id?: string
          is_verified?: boolean | null
          patient_id?: string | null
          rated_by?: string | null
          rating?: number
          responded_at?: string | null
          response?: string | null
          review?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ratings_fulfillment_request_id_fkey"
            columns: ["fulfillment_request_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ratings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          average_rating: number | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          delivery_available: boolean | null
          delivery_radius_km: number | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          license_expiry: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          operating_hours: Json | null
          postal_code: string | null
          province: string | null
          rating: number | null
          registration_number: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          total_ratings: number | null
          total_reviews: number | null
          updated_at: string | null
          vendor_type: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          average_rating?: number | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_available?: boolean | null
          delivery_radius_km?: number | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_expiry?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          operating_hours?: Json | null
          postal_code?: string | null
          province?: string | null
          rating?: number | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          total_ratings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          vendor_type?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          average_rating?: number | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_available?: boolean | null
          delivery_radius_km?: number | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_expiry?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          operating_hours?: Json | null
          postal_code?: string | null
          province?: string | null
          rating?: number | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          total_ratings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          vendor_type?: string
          website?: string | null
        }
        Relationships: []
      }
      verbal_autopsy_records: {
        Row: {
          algorithm_run_at: string | null
          algorithm_used: string | null
          algorithm_version: string | null
          created_at: string | null
          created_by: string | null
          death_notification_id: string
          final_cause_icd: string | null
          final_cause_of_death: string | null
          final_determination_date: string | null
          final_illness_duration_days: number | null
          had_cough: boolean | null
          had_diarrhea: boolean | null
          had_difficulty_breathing: boolean | null
          had_fever: boolean | null
          had_injury: boolean | null
          had_pregnancy_related: boolean | null
          had_skin_rash: boolean | null
          id: string
          illness_duration_days: number | null
          interview_date: string
          interview_location: string | null
          interviewer_id: string | null
          interviewer_name: string
          interviewer_role: string
          interviewer_training_date: string | null
          needs_physician_review: boolean | null
          physician_final_cause: string | null
          physician_final_cause_icd: string | null
          physician_notes: string | null
          physician_review_date: string | null
          physician_reviewer_id: string | null
          probable_cause_1: string | null
          probable_cause_1_icd: string | null
          probable_cause_1_likelihood: number | null
          probable_cause_2: string | null
          probable_cause_2_icd: string | null
          probable_cause_2_likelihood: number | null
          probable_cause_3: string | null
          probable_cause_3_icd: string | null
          probable_cause_3_likelihood: number | null
          questionnaire_responses: Json
          questionnaire_version: string | null
          respondent_address: string | null
          respondent_contact: string | null
          respondent_name: string
          respondent_relationship: string
          status: Database["public"]["Enums"]["crvs_va_status"]
          undetermined_flag: boolean | null
          updated_at: string | null
          va_number: string | null
        }
        Insert: {
          algorithm_run_at?: string | null
          algorithm_used?: string | null
          algorithm_version?: string | null
          created_at?: string | null
          created_by?: string | null
          death_notification_id: string
          final_cause_icd?: string | null
          final_cause_of_death?: string | null
          final_determination_date?: string | null
          final_illness_duration_days?: number | null
          had_cough?: boolean | null
          had_diarrhea?: boolean | null
          had_difficulty_breathing?: boolean | null
          had_fever?: boolean | null
          had_injury?: boolean | null
          had_pregnancy_related?: boolean | null
          had_skin_rash?: boolean | null
          id?: string
          illness_duration_days?: number | null
          interview_date: string
          interview_location?: string | null
          interviewer_id?: string | null
          interviewer_name: string
          interviewer_role: string
          interviewer_training_date?: string | null
          needs_physician_review?: boolean | null
          physician_final_cause?: string | null
          physician_final_cause_icd?: string | null
          physician_notes?: string | null
          physician_review_date?: string | null
          physician_reviewer_id?: string | null
          probable_cause_1?: string | null
          probable_cause_1_icd?: string | null
          probable_cause_1_likelihood?: number | null
          probable_cause_2?: string | null
          probable_cause_2_icd?: string | null
          probable_cause_2_likelihood?: number | null
          probable_cause_3?: string | null
          probable_cause_3_icd?: string | null
          probable_cause_3_likelihood?: number | null
          questionnaire_responses?: Json
          questionnaire_version?: string | null
          respondent_address?: string | null
          respondent_contact?: string | null
          respondent_name: string
          respondent_relationship: string
          status?: Database["public"]["Enums"]["crvs_va_status"]
          undetermined_flag?: boolean | null
          updated_at?: string | null
          va_number?: string | null
        }
        Update: {
          algorithm_run_at?: string | null
          algorithm_used?: string | null
          algorithm_version?: string | null
          created_at?: string | null
          created_by?: string | null
          death_notification_id?: string
          final_cause_icd?: string | null
          final_cause_of_death?: string | null
          final_determination_date?: string | null
          final_illness_duration_days?: number | null
          had_cough?: boolean | null
          had_diarrhea?: boolean | null
          had_difficulty_breathing?: boolean | null
          had_fever?: boolean | null
          had_injury?: boolean | null
          had_pregnancy_related?: boolean | null
          had_skin_rash?: boolean | null
          id?: string
          illness_duration_days?: number | null
          interview_date?: string
          interview_location?: string | null
          interviewer_id?: string | null
          interviewer_name?: string
          interviewer_role?: string
          interviewer_training_date?: string | null
          needs_physician_review?: boolean | null
          physician_final_cause?: string | null
          physician_final_cause_icd?: string | null
          physician_notes?: string | null
          physician_review_date?: string | null
          physician_reviewer_id?: string | null
          probable_cause_1?: string | null
          probable_cause_1_icd?: string | null
          probable_cause_1_likelihood?: number | null
          probable_cause_2?: string | null
          probable_cause_2_icd?: string | null
          probable_cause_2_likelihood?: number | null
          probable_cause_3?: string | null
          probable_cause_3_icd?: string | null
          probable_cause_3_likelihood?: number | null
          questionnaire_responses?: Json
          questionnaire_version?: string | null
          respondent_address?: string | null
          respondent_contact?: string | null
          respondent_name?: string
          respondent_relationship?: string
          status?: Database["public"]["Enums"]["crvs_va_status"]
          undetermined_flag?: boolean | null
          updated_at?: string | null
          va_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verbal_autopsy_records_death_notification_id_fkey"
            columns: ["death_notification_id"]
            isOneToOne: false
            referencedRelation: "death_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_pools: {
        Row: {
          anchor_facility_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          escalation_rules: Json | null
          id: string
          is_24_7: boolean | null
          is_active: boolean | null
          managing_entity: string | null
          name: string
          operating_hours: Json | null
          pool_type: string
          service_tags: string[] | null
          sla_first_response_minutes: number | null
          sla_resolution_hours: number | null
          updated_at: string
        }
        Insert: {
          anchor_facility_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_24_7?: boolean | null
          is_active?: boolean | null
          managing_entity?: string | null
          name: string
          operating_hours?: Json | null
          pool_type?: string
          service_tags?: string[] | null
          sla_first_response_minutes?: number | null
          sla_resolution_hours?: number | null
          updated_at?: string
        }
        Update: {
          anchor_facility_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_24_7?: boolean | null
          is_active?: boolean | null
          managing_entity?: string | null
          name?: string
          operating_hours?: Json | null
          pool_type?: string
          service_tags?: string[] | null
          sla_first_response_minutes?: number | null
          sla_resolution_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_pools_anchor_facility_id_fkey"
            columns: ["anchor_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_pools_anchor_facility_id_fkey"
            columns: ["anchor_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "virtual_pools_anchor_facility_id_fkey"
            columns: ["anchor_facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
        ]
      }
      visit_cost_summaries: {
        Row: {
          cost_to_charge_ratio: number | null
          created_at: string | null
          currency: string
          facility_id: string | null
          grand_total_cost: number | null
          id: string
          last_calculated_at: string | null
          margin: number | null
          patient_id: string | null
          total_accommodation_cost: number | null
          total_catering_cost: number | null
          total_charges: number | null
          total_consumables_cost: number | null
          total_equipment_cost: number | null
          total_other_cost: number | null
          total_overhead_cost: number | null
          total_staff_cost: number | null
          total_transport_cost: number | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          cost_to_charge_ratio?: number | null
          created_at?: string | null
          currency?: string
          facility_id?: string | null
          grand_total_cost?: number | null
          id?: string
          last_calculated_at?: string | null
          margin?: number | null
          patient_id?: string | null
          total_accommodation_cost?: number | null
          total_catering_cost?: number | null
          total_charges?: number | null
          total_consumables_cost?: number | null
          total_equipment_cost?: number | null
          total_other_cost?: number | null
          total_overhead_cost?: number | null
          total_staff_cost?: number | null
          total_transport_cost?: number | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          cost_to_charge_ratio?: number | null
          created_at?: string | null
          currency?: string
          facility_id?: string | null
          grand_total_cost?: number | null
          id?: string
          last_calculated_at?: string | null
          margin?: number | null
          patient_id?: string | null
          total_accommodation_cost?: number | null
          total_catering_cost?: number | null
          total_charges?: number | null
          total_consumables_cost?: number | null
          total_equipment_cost?: number | null
          total_other_cost?: number | null
          total_overhead_cost?: number | null
          total_staff_cost?: number | null
          total_transport_cost?: number | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_cost_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_cost_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_cost_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_cost_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_cost_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_financial_accounts: {
        Row: {
          account_status: Database["public"]["Enums"]["financial_state"]
          authorization_number: string | null
          closed_at: string | null
          coverage_verified: boolean | null
          coverage_verified_at: string | null
          created_at: string | null
          currency: string
          deposit_paid: number | null
          deposit_required: number | null
          deposit_satisfied: boolean | null
          facility_id: string | null
          id: string
          opened_at: string | null
          patient_balance: number | null
          patient_id: string
          patient_responsibility: number | null
          payer_balance: number | null
          payer_responsibility: number | null
          primary_payer_id: string | null
          primary_payer_type: Database["public"]["Enums"]["payer_type"] | null
          total_adjustments: number
          total_balance: number | null
          total_charges: number
          total_payments: number
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["financial_state"]
          authorization_number?: string | null
          closed_at?: string | null
          coverage_verified?: boolean | null
          coverage_verified_at?: string | null
          created_at?: string | null
          currency?: string
          deposit_paid?: number | null
          deposit_required?: number | null
          deposit_satisfied?: boolean | null
          facility_id?: string | null
          id?: string
          opened_at?: string | null
          patient_balance?: number | null
          patient_id: string
          patient_responsibility?: number | null
          payer_balance?: number | null
          payer_responsibility?: number | null
          primary_payer_id?: string | null
          primary_payer_type?: Database["public"]["Enums"]["payer_type"] | null
          total_adjustments?: number
          total_balance?: number | null
          total_charges?: number
          total_payments?: number
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["financial_state"]
          authorization_number?: string | null
          closed_at?: string | null
          coverage_verified?: boolean | null
          coverage_verified_at?: string | null
          created_at?: string | null
          currency?: string
          deposit_paid?: number | null
          deposit_required?: number | null
          deposit_satisfied?: boolean | null
          facility_id?: string | null
          id?: string
          opened_at?: string | null
          patient_balance?: number | null
          patient_id?: string
          patient_responsibility?: number | null
          payer_balance?: number | null
          payer_responsibility?: number | null
          primary_payer_id?: string | null
          primary_payer_type?: Database["public"]["Enums"]["payer_type"] | null
          total_adjustments?: number
          total_balance?: number | null
          total_charges?: number
          total_payments?: number
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_financial_accounts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_financial_accounts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_financial_accounts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_financial_accounts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_financial_accounts_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_summaries: {
        Row: {
          allergies_verified: Json | null
          amendment_reason: string | null
          attachments: Json | null
          attending_providers: Json | null
          chief_complaint_coded: Json | null
          co_signers: Json | null
          created_at: string
          diagnoses: Json | null
          disposition: string | null
          disposition_details: string | null
          encounter_id: string
          encounter_note_link: string | null
          facility_id: string | null
          facility_name: string | null
          fhir_composition: Json | null
          fhir_document_reference: string | null
          finalized_at: string | null
          follow_up_appointments: Json | null
          follow_up_plan: string | null
          id: string
          imaging_link: string | null
          imaging_performed: Json | null
          investigations_ordered: Json | null
          investigations_pending: Json | null
          key_findings: string | null
          lab_results_link: string | null
          medications_changed: Json | null
          medications_prescribed: Json | null
          patient_id: string
          patient_summary_html: string | null
          patient_summary_pdf_path: string | null
          presenting_complaint: string | null
          previous_version_id: string | null
          procedures_performed: Json | null
          provider_summary_html: string | null
          provider_summary_pdf_path: string | null
          qr_code_data: string | null
          referrals_made: Json | null
          return_precautions: string | null
          service_point: string | null
          share_token: string | null
          share_token_expires_at: string | null
          shr_bundle_id: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          updated_at: string
          version: number
          visit_end: string | null
          visit_start: string | null
          visit_type: string | null
        }
        Insert: {
          allergies_verified?: Json | null
          amendment_reason?: string | null
          attachments?: Json | null
          attending_providers?: Json | null
          chief_complaint_coded?: Json | null
          co_signers?: Json | null
          created_at?: string
          diagnoses?: Json | null
          disposition?: string | null
          disposition_details?: string | null
          encounter_id: string
          encounter_note_link?: string | null
          facility_id?: string | null
          facility_name?: string | null
          fhir_composition?: Json | null
          fhir_document_reference?: string | null
          finalized_at?: string | null
          follow_up_appointments?: Json | null
          follow_up_plan?: string | null
          id?: string
          imaging_link?: string | null
          imaging_performed?: Json | null
          investigations_ordered?: Json | null
          investigations_pending?: Json | null
          key_findings?: string | null
          lab_results_link?: string | null
          medications_changed?: Json | null
          medications_prescribed?: Json | null
          patient_id: string
          patient_summary_html?: string | null
          patient_summary_pdf_path?: string | null
          presenting_complaint?: string | null
          previous_version_id?: string | null
          procedures_performed?: Json | null
          provider_summary_html?: string | null
          provider_summary_pdf_path?: string | null
          qr_code_data?: string | null
          referrals_made?: Json | null
          return_precautions?: string | null
          service_point?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          shr_bundle_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          version?: number
          visit_end?: string | null
          visit_start?: string | null
          visit_type?: string | null
        }
        Update: {
          allergies_verified?: Json | null
          amendment_reason?: string | null
          attachments?: Json | null
          attending_providers?: Json | null
          chief_complaint_coded?: Json | null
          co_signers?: Json | null
          created_at?: string
          diagnoses?: Json | null
          disposition?: string | null
          disposition_details?: string | null
          encounter_id?: string
          encounter_note_link?: string | null
          facility_id?: string | null
          facility_name?: string | null
          fhir_composition?: Json | null
          fhir_document_reference?: string | null
          finalized_at?: string | null
          follow_up_appointments?: Json | null
          follow_up_plan?: string | null
          id?: string
          imaging_link?: string | null
          imaging_performed?: Json | null
          investigations_ordered?: Json | null
          investigations_pending?: Json | null
          key_findings?: string | null
          lab_results_link?: string | null
          medications_changed?: Json | null
          medications_prescribed?: Json | null
          patient_id?: string
          patient_summary_html?: string | null
          patient_summary_pdf_path?: string | null
          presenting_complaint?: string | null
          previous_version_id?: string | null
          procedures_performed?: Json | null
          provider_summary_html?: string | null
          provider_summary_pdf_path?: string | null
          qr_code_data?: string | null
          referrals_made?: Json | null
          return_precautions?: string | null
          service_point?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          shr_bundle_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          version?: number
          visit_end?: string | null
          visit_start?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_summaries_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_summaries_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visit_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_summaries_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "visit_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_summaries_shr_bundle_id_fkey"
            columns: ["shr_bundle_id"]
            isOneToOne: false
            referencedRelation: "shr_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          admission_reason: string | null
          admission_source: string | null
          attending_physician_id: string | null
          bed_id: string | null
          conclusion_signed_at: string | null
          conclusion_signed_by: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          expected_discharge_date: string | null
          facility_id: string | null
          facility_name: string | null
          id: string
          identity_reconciled_at: string | null
          meds_reconciled: boolean | null
          outcome: Database["public"]["Enums"]["visit_outcome"] | null
          outcome_at: string | null
          outcome_by: string | null
          outcome_details: string | null
          patient_id: string
          pending_results_assigned: boolean | null
          programme_code: string | null
          programme_name: string | null
          start_date: string
          status: Database["public"]["Enums"]["visit_status"]
          summary_generated: boolean | null
          temporary_identity_id: string | null
          transfer_reason: string | null
          transferred_from_visit_id: string | null
          transferred_to_visit_id: string | null
          updated_at: string
          visit_number: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          ward_id: string | null
        }
        Insert: {
          admission_reason?: string | null
          admission_source?: string | null
          attending_physician_id?: string | null
          bed_id?: string | null
          conclusion_signed_at?: string | null
          conclusion_signed_by?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          expected_discharge_date?: string | null
          facility_id?: string | null
          facility_name?: string | null
          id?: string
          identity_reconciled_at?: string | null
          meds_reconciled?: boolean | null
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_details?: string | null
          patient_id: string
          pending_results_assigned?: boolean | null
          programme_code?: string | null
          programme_name?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["visit_status"]
          summary_generated?: boolean | null
          temporary_identity_id?: string | null
          transfer_reason?: string | null
          transferred_from_visit_id?: string | null
          transferred_to_visit_id?: string | null
          updated_at?: string
          visit_number: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          ward_id?: string | null
        }
        Update: {
          admission_reason?: string | null
          admission_source?: string | null
          attending_physician_id?: string | null
          bed_id?: string | null
          conclusion_signed_at?: string | null
          conclusion_signed_by?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          expected_discharge_date?: string | null
          facility_id?: string | null
          facility_name?: string | null
          id?: string
          identity_reconciled_at?: string | null
          meds_reconciled?: boolean | null
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_details?: string | null
          patient_id?: string
          pending_results_assigned?: boolean | null
          programme_code?: string | null
          programme_name?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["visit_status"]
          summary_generated?: boolean | null
          temporary_identity_id?: string | null
          transfer_reason?: string | null
          transferred_from_visit_id?: string | null
          transferred_to_visit_id?: string | null
          updated_at?: string
          visit_number?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visits_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_transferred_from_visit_id_fkey"
            columns: ["transferred_from_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_transferred_to_visit_id_fkey"
            columns: ["transferred_to_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          encounter_id: string
          height: number | null
          height_unit: string | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          pain_score: number | null
          pulse_rate: number | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          temperature: number | null
          temperature_unit: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          encounter_id: string
          height?: number | null
          height_unit?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_score?: number | null
          pulse_rate?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
          temperature_unit?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          encounter_id?: string
          height?: number | null
          height_unit?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_score?: number | null
          pulse_rate?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
          temperature_unit?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_calls: {
        Row: {
          answered_at: string | null
          call_type: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          encounter_id: string | null
          end_reason: string | null
          ended_at: string | null
          id: string
          patient_id: string | null
          recipient_id: string | null
          recipient_role: string | null
          recording_url: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          answered_at?: string | null
          call_type?: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          encounter_id?: string | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          patient_id?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          answered_at?: string | null
          call_type?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          encounter_id?: string | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          patient_id?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_calls_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_activity_logs: {
        Row: {
          active_minutes: number | null
          activity_date: string
          activity_type: string
          calories_burned: number | null
          created_at: string
          device_name: string | null
          distance_meters: number | null
          duration_minutes: number | null
          id: string
          intensity: string | null
          notes: string | null
          source: string | null
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          activity_date?: string
          activity_type: string
          calories_burned?: number | null
          created_at?: string
          device_name?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          source?: string | null
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          activity_date?: string
          activity_type?: string
          calories_burned?: number | null
          created_at?: string
          device_name?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          source?: string | null
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          is_completed: boolean | null
          joined_at: string
          last_updated_at: string | null
          progress_value: number | null
          rank: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string
          last_updated_at?: string | null
          progress_value?: number | null
          rank?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string
          last_updated_at?: string | null
          progress_value?: number | null
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "wellness_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_challenges: {
        Row: {
          challenge_type: string
          community_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          has_leaderboard: boolean | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          participant_count: number | null
          prizes: string | null
          rules: string | null
          start_date: string
          status: string | null
          target_metric: string
          target_unit: string
          target_value: number
          updated_at: string
        }
        Insert: {
          challenge_type: string
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          has_leaderboard?: boolean | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          participant_count?: number | null
          prizes?: string | null
          rules?: string | null
          start_date: string
          status?: string | null
          target_metric: string
          target_unit: string
          target_value: number
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          has_leaderboard?: boolean | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          participant_count?: number | null
          prizes?: string | null
          rules?: string | null
          start_date?: string
          status?: string | null
          target_metric?: string
          target_unit?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_challenges_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "wellness_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_communities: {
        Row: {
          category: string
          community_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_official: boolean | null
          member_count: number | null
          name: string
          rules: string | null
          updated_at: string
        }
        Insert: {
          category: string
          community_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          member_count?: number | null
          name: string
          rules?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          community_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          member_count?: number | null
          name?: string
          rules?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wellness_community_members: {
        Row: {
          community_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "wellness_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_community_posts: {
        Row: {
          author_id: string
          comments_count: number | null
          community_id: string
          content: string
          created_at: string
          id: string
          is_hidden: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          post_type: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          community_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "wellness_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_device_connections: {
        Row: {
          connection_type: string | null
          created_at: string
          device_brand: string | null
          device_id: string | null
          device_model: string | null
          device_type: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          sync_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          device_brand?: string | null
          device_id?: string | null
          device_model?: string | null
          device_type: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          sync_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          device_brand?: string | null
          device_id?: string | null
          device_model?: string | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          sync_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_event_registrations: {
        Row: {
          attended_at: string | null
          event_id: string
          id: string
          payment_reference: string | null
          payment_status: string | null
          registered_at: string
          registration_status: string | null
          user_id: string
        }
        Insert: {
          attended_at?: string | null
          event_id: string
          id?: string
          payment_reference?: string | null
          payment_status?: string | null
          registered_at?: string
          registration_status?: string | null
          user_id: string
        }
        Update: {
          attended_at?: string | null
          event_id?: string
          id?: string
          payment_reference?: string | null
          payment_status?: string | null
          registered_at?: string
          registration_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wellness_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_events: {
        Row: {
          category: string
          community_id: string | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          current_participants: number | null
          description: string | null
          end_time: string | null
          event_type: string
          host_id: string | null
          host_name: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          max_participants: number | null
          price: number | null
          registration_deadline: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          category: string
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_type: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          registration_deadline?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          category?: string
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          registration_deadline?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "wellness_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_goals: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          is_active: boolean | null
          period: string
          target_unit: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          period?: string
          target_unit: string
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          period?: string
          target_unit?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          is_private: boolean | null
          mood_at_writing: number | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          is_private?: boolean | null
          mood_at_writing?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          is_private?: boolean | null
          mood_at_writing?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_marketplace_services: {
        Row: {
          availability_schedule: Json | null
          category: string
          created_at: string
          currency: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_verified: boolean | null
          is_virtual: boolean | null
          location: string | null
          price: number
          provider_id: string
          provider_name: string
          provider_type: string
          rating: number | null
          review_count: number | null
          service_type: string
          title: string
          updated_at: string
        }
        Insert: {
          availability_schedule?: Json | null
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          price: number
          provider_id: string
          provider_name: string
          provider_type: string
          rating?: number | null
          review_count?: number | null
          service_type: string
          title: string
          updated_at?: string
        }
        Update: {
          availability_schedule?: Json | null
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          price?: number
          provider_id?: string
          provider_name?: string
          provider_type?: string
          rating?: number | null
          review_count?: number | null
          service_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wellness_mood_logs: {
        Row: {
          anxiety_level: number | null
          created_at: string
          energy_level: number | null
          id: string
          log_date: string
          log_time: string | null
          mood_rating: number
          mood_tags: string[] | null
          notes: string | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          anxiety_level?: number | null
          created_at?: string
          energy_level?: number | null
          id?: string
          log_date?: string
          log_time?: string | null
          mood_rating: number
          mood_tags?: string[] | null
          notes?: string | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          anxiety_level?: number | null
          created_at?: string
          energy_level?: number | null
          id?: string
          log_date?: string
          log_time?: string | null
          mood_rating?: number
          mood_tags?: string[] | null
          notes?: string | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      wellness_nutrition_logs: {
        Row: {
          calories: number | null
          created_at: string
          dietary_tags: string[] | null
          id: string
          log_date: string
          log_time: string | null
          meal_description: string | null
          meal_type: string | null
          notes: string | null
          photo_url: string | null
          user_id: string
          water_intake_ml: number | null
        }
        Insert: {
          calories?: number | null
          created_at?: string
          dietary_tags?: string[] | null
          id?: string
          log_date?: string
          log_time?: string | null
          meal_description?: string | null
          meal_type?: string | null
          notes?: string | null
          photo_url?: string | null
          user_id: string
          water_intake_ml?: number | null
        }
        Update: {
          calories?: number | null
          created_at?: string
          dietary_tags?: string[] | null
          id?: string
          log_date?: string
          log_time?: string | null
          meal_description?: string | null
          meal_type?: string | null
          notes?: string | null
          photo_url?: string | null
          user_id?: string
          water_intake_ml?: number | null
        }
        Relationships: []
      }
      wellness_preventive_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          frequency: string | null
          id: string
          is_completed: boolean | null
          is_dismissed: boolean | null
          reminder_type: string
          snoozed_until: string | null
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          is_completed?: boolean | null
          is_dismissed?: boolean | null
          reminder_type: string
          snoozed_until?: string | null
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          is_completed?: boolean | null
          is_dismissed?: boolean | null
          reminder_type?: string
          snoozed_until?: string | null
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_service_bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          payment_amount: number | null
          payment_reference: string | null
          payment_status: string | null
          provider_notes: string | null
          rating: number | null
          review: string | null
          service_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          provider_notes?: string | null
          rating?: number | null
          review?: string | null
          service_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          provider_notes?: string | null
          rating?: number | null
          review?: string | null
          service_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "wellness_marketplace_services"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          device_name: string | null
          duration_hours: number | null
          id: string
          nap_duration_minutes: number | null
          naps_count: number | null
          notes: string | null
          quality_rating: number | null
          sleep_date: string
          source: string | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          device_name?: string | null
          duration_hours?: number | null
          id?: string
          nap_duration_minutes?: number | null
          naps_count?: number | null
          notes?: string | null
          quality_rating?: number | null
          sleep_date: string
          source?: string | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          device_name?: string | null
          duration_hours?: number | null
          id?: string
          nap_duration_minutes?: number | null
          naps_count?: number | null
          notes?: string | null
          quality_rating?: number | null
          sleep_date?: string
          source?: string | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      wellness_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          goal_id: string | null
          id: string
          last_achieved_date: string | null
          longest_streak: number | null
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          goal_id?: string | null
          id?: string
          last_achieved_date?: string | null
          longest_streak?: number | null
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          goal_id?: string | null
          id?: string
          last_achieved_date?: string | null
          longest_streak?: number | null
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_streaks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "wellness_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_vitals: {
        Row: {
          context: string | null
          created_at: string
          device_name: string | null
          id: string
          notes: string | null
          promoted_at: string | null
          promoted_by: string | null
          promoted_to_clinical: boolean | null
          recorded_at: string
          shared_at: string | null
          shared_with_provider: boolean | null
          source: string | null
          unit: string
          user_id: string
          value_numeric: number | null
          value_secondary: number | null
          vital_type: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          promoted_to_clinical?: boolean | null
          recorded_at?: string
          shared_at?: string | null
          shared_with_provider?: boolean | null
          source?: string | null
          unit: string
          user_id: string
          value_numeric?: number | null
          value_secondary?: number | null
          vital_type: string
        }
        Update: {
          context?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          promoted_to_clinical?: boolean | null
          recorded_at?: string
          shared_at?: string | null
          shared_with_provider?: boolean | null
          source?: string | null
          unit?: string
          user_id?: string
          value_numeric?: number | null
          value_secondary?: number | null
          vital_type?: string
        }
        Relationships: []
      }
      workspace_audit_log: {
        Row: {
          action: string
          actor_id: string
          actor_provider_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          facility_id: string | null
          id: string
          ip_address: unknown
          justification: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_provider_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          facility_id?: string | null
          id?: string
          ip_address?: unknown
          justification?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_provider_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          facility_id?: string | null
          id?: string
          ip_address?: unknown
          justification?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      workspace_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          can_self_assign: boolean
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          notes: string | null
          provider_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
          workspace_id: string
          workspace_role: Database["public"]["Enums"]["workspace_role"]
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          can_self_assign?: boolean
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          provider_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          workspace_id: string
          workspace_role?: Database["public"]["Enums"]["workspace_role"]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          can_self_assign?: boolean
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          provider_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          workspace_id?: string
          workspace_role?: Database["public"]["Enums"]["workspace_role"]
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_scheduling_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          facility_id: string
          id: string
          is_active: boolean
          location_code: string | null
          name: string
          operating_hours: Json | null
          parent_workspace_id: string | null
          service_tags: string[] | null
          sort_order: number | null
          updated_at: string
          workspace_type: Database["public"]["Enums"]["workspace_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          facility_id: string
          id?: string
          is_active?: boolean
          location_code?: string | null
          name: string
          operating_hours?: Json | null
          parent_workspace_id?: string | null
          service_tags?: string[] | null
          sort_order?: number | null
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["workspace_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean
          location_code?: string | null
          name?: string
          operating_hours?: Json | null
          parent_workspace_id?: string | null
          service_tags?: string[] | null
          sort_order?: number | null
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["workspace_type"]
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_capabilities"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "workspaces_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_operations_dashboard"
            referencedColumns: ["facility_id"]
          },
          {
            foreignKeyName: "workspaces_parent_workspace_id_fkey"
            columns: ["parent_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      facility_capabilities: {
        Row: {
          capabilities: string[] | null
          category: string | null
          facility_code: string | null
          facility_id: string | null
          facility_name: string | null
          facility_services: string[] | null
          facility_type_code: string | null
          facility_type_name: string | null
          level_of_care: string | null
        }
        Relationships: []
      }
      facility_operations_dashboard: {
        Row: {
          arrivals_today: number | null
          facility_id: string | null
          facility_name: string | null
          investigations_pending: number | null
          queue_backlog: number | null
          ready_for_discharge: number | null
          sorting_pending: number | null
          stalled_flows: number | null
          transfers_pending: number | null
        }
        Insert: {
          arrivals_today?: never
          facility_id?: string | null
          facility_name?: string | null
          investigations_pending?: never
          queue_backlog?: never
          ready_for_discharge?: never
          sorting_pending?: never
          stalled_flows?: never
          transfers_pending?: never
        }
        Update: {
          arrivals_today?: never
          facility_id?: string | null
          facility_name?: string | null
          investigations_pending?: never
          queue_backlog?: never
          ready_for_discharge?: never
          sorting_pending?: never
          stalled_flows?: never
          transfers_pending?: never
        }
        Relationships: []
      }
      provider_scheduling_info: {
        Row: {
          department: string | null
          facility_gofr_id: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          role: string | null
          specialty: string | null
          status: string | null
        }
        Insert: {
          department?: string | null
          facility_gofr_id?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          role?: string | null
          specialty?: string | null
          status?: string | null
        }
        Update: {
          department?: string | null
          facility_gofr_id?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          role?: string | null
          specialty?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_visit_cost_summary: {
        Args: { p_visit_id: string }
        Returns: undefined
      }
      can_access_facility_in_jurisdiction: {
        Args: { _facility_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_patient: {
        Args: { _patient_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_workspace: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      check_provider_eligibility: {
        Args: {
          p_facility_context?: string
          p_provider_id: string
          p_requested_privileges?: string[]
          p_requested_role?: string
        }
        Returns: Json
      }
      flag_missed_appointments: {
        Args: { hours_threshold?: number }
        Returns: number
      }
      generate_birth_notification_number: { Args: never; Returns: string }
      generate_claim_number: { Args: never; Returns: string }
      generate_client_registry_id: { Args: never; Returns: string }
      generate_death_notification_number: { Args: never; Returns: string }
      generate_document_number: { Args: never; Returns: string }
      generate_encounter_number: { Args: never; Returns: string }
      generate_facility_registry_id: {
        Args: { p_province_code?: string }
        Returns: string
      }
      generate_fulfillment_number: { Args: never; Returns: string }
      generate_health_id: { Args: never; Returns: string }
      generate_impilo_id: {
        Args: never
        Returns: {
          client_registry_id: string
          impilo_id: string
          shr_id: string
        }[]
      }
      generate_lab_order_number: { Args: never; Returns: string }
      generate_mrn: { Args: never; Returns: string }
      generate_page_number: { Args: never; Returns: string }
      generate_prescription_number: { Args: never; Returns: string }
      generate_provider_registry_id: {
        Args: { p_province_code?: string }
        Returns: string
      }
      generate_queue_ticket: {
        Args: { p_prefix?: string; p_queue_id: string }
        Returns: string
      }
      generate_referral_number: { Args: never; Returns: string }
      generate_renewal_application_number: { Args: never; Returns: string }
      generate_shr_id: { Args: never; Returns: string }
      generate_sorting_session_number: { Args: never; Returns: string }
      generate_specimen_id: { Args: never; Returns: string }
      generate_summary_share_token: { Args: never; Returns: string }
      generate_teleconsult_access_token: { Args: never; Returns: string }
      generate_temp_patient_id: { Args: never; Returns: string }
      generate_theatre_booking_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      generate_upid: { Args: never; Returns: string }
      generate_visit_number: { Args: never; Returns: string }
      get_above_site_roles: {
        Args: { _user_id: string }
        Returns: {
          can_access_patient_data: boolean
          can_act_as: boolean
          can_intervene: boolean
          role_id: string
          role_type: Database["public"]["Enums"]["above_site_role_type"]
          title: string
        }[]
      }
      get_active_shift: {
        Args: { _user_id: string }
        Returns: {
          current_workspace_id: string
          current_workspace_name: string
          duration_minutes: number
          facility_id: string
          facility_name: string
          shift_id: string
          started_at: string
        }[]
      }
      get_facility_ops_mode: {
        Args: { _facility_id: string }
        Returns: Database["public"]["Enums"]["facility_ops_mode"]
      }
      get_jurisdiction_scope: { Args: { _role_id: string }; Returns: Json }
      get_next_id_sequence: {
        Args: { p_counter_type: string }
        Returns: number
      }
      get_next_queue_sequence: { Args: { p_queue_id: string }; Returns: number }
      get_queue_metrics: {
        Args: { p_queue_id: string }
        Returns: {
          avg_wait_minutes: number
          completed_today: number
          in_service_count: number
          longest_wait_minutes: number
          queue_length: number
        }[]
      }
      get_todays_roster_assignment: {
        Args: { _facility_id?: string; _user_id: string }
        Returns: {
          assignment_id: string
          end_time: string
          pool_id: string
          pool_name: string
          shift_name: string
          shift_type_val: Database["public"]["Enums"]["shift_type"]
          start_time: string
          workspace_id: string
          workspace_name: string
        }[]
      }
      get_user_workspaces: {
        Args: { _facility_id?: string; _user_id: string }
        Returns: {
          facility_id: string
          facility_name: string
          service_tags: string[]
          workspace_id: string
          workspace_name: string
          workspace_role: Database["public"]["Enums"]["workspace_role"]
          workspace_type: Database["public"]["Enums"]["workspace_type"]
        }[]
      }
      has_above_site_role: { Args: { _user_id: string }; Returns: boolean }
      has_registry_role: {
        Args: {
          _registry_role: Database["public"]["Enums"]["registry_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_telemedicine_role: {
        Args: {
          _role: Database["public"]["Enums"]["telemedicine_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_operational_supervisor: {
        Args: { _facility_id?: string; _user_id: string }
        Returns: boolean
      }
      update_account_balances: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      validate_teleconsult_access_token: {
        Args: { _accessor_id: string; _token_hash: string }
        Returns: {
          error_message: string
          is_valid: boolean
          patient_id: string
          scope: Database["public"]["Enums"]["ehr_access_scope"]
          session_id: string
        }[]
      }
    }
    Enums: {
      above_site_context_type:
        | "district_overview"
        | "provincial_operations"
        | "national_operations"
        | "programme_operations"
        | "telecare_operations"
        | "network_operations"
      above_site_role_type:
        | "district_medical_officer"
        | "district_health_executive"
        | "provincial_health_executive"
        | "national_programme_manager"
        | "telecare_operations_manager"
        | "radiology_network_manager"
        | "lab_network_manager"
        | "digital_health_manager"
        | "quality_assurance_officer"
        | "regulator_inspector"
      app_role: "admin" | "moderator" | "user"
      approval_status: "pending" | "approved" | "suspended" | "rejected"
      arrival_mode: "walk_in" | "appointment" | "referral" | "emergency"
      charge_status:
        | "pending"
        | "approved"
        | "billed"
        | "disputed"
        | "waived"
        | "cancelled"
      claim_status:
        | "draft"
        | "submitted"
        | "acknowledged"
        | "processing"
        | "approved"
        | "partially_approved"
        | "denied"
        | "appealed"
        | "paid"
        | "written_off"
      claim_type:
        | "insurance"
        | "government"
        | "employer"
        | "donor"
        | "workers_comp"
      clearance_status:
        | "pending"
        | "in_progress"
        | "cleared"
        | "blocked"
        | "waived"
        | "not_applicable"
      clearance_type:
        | "clinical"
        | "nursing"
        | "pharmacy"
        | "laboratory"
        | "imaging"
        | "financial"
        | "administrative"
        | "records"
        | "crvs"
      client_lifecycle_state:
        | "draft"
        | "active"
        | "inactive"
        | "deceased"
        | "merged"
      client_relationship_type:
        | "mother"
        | "father"
        | "guardian"
        | "caregiver"
        | "spouse"
        | "child"
        | "sibling"
        | "proxy"
        | "next_of_kin"
        | "emergency_contact"
      clinical_document_type:
        | "ips"
        | "visit_summary"
        | "discharge_summary"
        | "ed_summary"
        | "transfer_summary"
        | "referral_summary"
        | "lab_report"
        | "imaging_report"
        | "procedure_note"
        | "death_summary"
        | "lama_summary"
        | "operative_note"
        | "consultation_note"
        | "progress_note"
      clinical_role: "doctor" | "nurse" | "specialist" | "patient" | "admin"
      cost_category:
        | "staff_time"
        | "consumables"
        | "equipment_depreciation"
        | "facility_overhead"
        | "transport"
        | "accommodation"
        | "catering"
        | "linen_laundry"
        | "utilities"
        | "cold_chain"
        | "per_diem"
        | "other"
      cost_event_type:
        | "encounter_completed"
        | "service_completed"
        | "bed_day_accrued"
        | "consumable_used"
        | "procedure_performed"
        | "transport_provided"
        | "outreach_session"
      cover_request_status: "pending" | "approved" | "denied" | "expired"
      crvs_birth_plurality: "single" | "twin" | "triplet" | "higher_order"
      crvs_certificate_status:
        | "not_requested"
        | "requested"
        | "approved"
        | "printed"
        | "issued"
        | "collected"
        | "reprint_requested"
        | "amended"
      crvs_cod_method: "mccd" | "verbal_autopsy" | "pending"
      crvs_death_manner:
        | "natural"
        | "accident"
        | "suicide"
        | "homicide"
        | "pending_investigation"
        | "undetermined"
      crvs_notification_source: "facility" | "community" | "client_portal"
      crvs_notification_status:
        | "draft"
        | "pending_verification"
        | "verified"
        | "submitted_to_registrar"
        | "registered"
        | "rejected"
        | "requires_correction"
      crvs_notification_type: "birth" | "death"
      crvs_notifier_role:
        | "facility_nurse"
        | "facility_doctor"
        | "records_clerk"
        | "vhw"
        | "eht"
        | "village_head"
        | "councillor"
        | "relative"
        | "other"
      crvs_va_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "needs_review"
        | "cancelled"
      discharge_decision_type:
        | "routine"
        | "dama"
        | "referral"
        | "transfer"
        | "absconded"
        | "death"
      discharge_workflow_state:
        | "active"
        | "discharge_initiated"
        | "clinical_clearance"
        | "financial_clearance"
        | "admin_approval"
        | "closed_discharged"
        | "death_declared"
        | "certification"
        | "financial_reconciliation"
        | "closed_deceased"
        | "cancelled"
      document_status:
        | "draft"
        | "pending_signature"
        | "final"
        | "amended"
        | "superseded"
        | "entered_in_error"
      ehr_access_scope:
        | "read_summary"
        | "read_full"
        | "read_write"
        | "orders_only"
        | "notes_only"
      employment_type:
        | "permanent"
        | "contract"
        | "locum"
        | "volunteer"
        | "intern"
        | "student"
      facility_ops_mode: "simple" | "standard" | "advanced"
      financial_state:
        | "pending"
        | "deposit_required"
        | "copay_pending"
        | "cleared"
        | "partial"
        | "overdue"
        | "exempt"
        | "written_off"
      fulfillment_status:
        | "draft"
        | "submitted"
        | "bidding"
        | "awarded"
        | "confirmed"
        | "processing"
        | "ready"
        | "dispatched"
        | "delivered"
        | "completed"
        | "cancelled"
        | "expired"
      identifier_confidence:
        | "verified"
        | "self_reported"
        | "derived"
        | "uncertain"
      identity_resolution_status:
        | "confirmed"
        | "probable_match"
        | "temporary"
        | "unknown"
      intervention_type:
        | "staff_redeployment"
        | "coverage_approval"
        | "queue_escalation"
        | "virtual_pool_authorization"
        | "facility_override"
        | "emergency_response"
      invoice_status:
        | "draft"
        | "finalized"
        | "sent"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
        | "written_off"
      jurisdiction_level:
        | "facility_list"
        | "district"
        | "province"
        | "national"
        | "virtual_services"
        | "programme"
      license_status:
        | "active"
        | "suspended"
        | "revoked"
        | "expired"
        | "pending_renewal"
      operational_role:
        | "roster_supervisor"
        | "shift_lead"
        | "facility_ops_manager"
        | "virtual_pool_supervisor"
        | "department_head"
      payer_type:
        | "patient"
        | "insurance"
        | "government"
        | "employer"
        | "donor"
        | "other"
      payment_channel:
        | "paynow"
        | "ecocash"
        | "onemoney"
        | "innbucks"
        | "stripe"
        | "dpo_paygate"
        | "zipit"
        | "rtgs"
        | "cbz_bank"
        | "cash_facility"
        | "cheque_facility"
      payment_method_v2:
        | "cash"
        | "mobile_money"
        | "card"
        | "bank_transfer"
        | "qr_code"
        | "cheque"
        | "insurance_remittance"
        | "government_remittance"
      payment_request_status:
        | "created"
        | "sent"
        | "in_progress"
        | "paid"
        | "failed"
        | "expired"
        | "cancelled"
      product_category_type:
        | "pharmaceutical"
        | "medical_device"
        | "laboratory"
        | "consumable"
        | "equipment"
        | "ppe"
        | "diagnostic"
        | "nutritional"
        | "other"
      provider_lifecycle_state:
        | "draft"
        | "pending_council_verification"
        | "pending_facility_affiliation"
        | "active"
        | "suspended"
        | "revoked"
        | "retired"
        | "deceased"
      queue_entry_type:
        | "walk_in"
        | "appointment"
        | "referral"
        | "internal_transfer"
        | "callback"
      queue_facility_mode: "simple" | "standard" | "advanced"
      queue_item_status:
        | "waiting"
        | "called"
        | "in_service"
        | "paused"
        | "completed"
        | "transferred"
        | "escalated"
        | "no_show"
        | "cancelled"
      queue_priority:
        | "emergency"
        | "very_urgent"
        | "urgent"
        | "routine"
        | "scheduled"
      queue_service_type:
        | "opd_triage"
        | "opd_consultation"
        | "specialist_clinic"
        | "anc_clinic"
        | "hiv_clinic"
        | "tb_clinic"
        | "ncd_clinic"
        | "child_welfare_clinic"
        | "dialysis"
        | "imaging"
        | "lab_reception"
        | "lab_sample_collection"
        | "pharmacy"
        | "theatre_preop"
        | "theatre_recovery"
        | "procedure_room"
        | "telecare"
        | "specialist_pool"
        | "general_reception"
      registry_record_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "suspended"
        | "deactivated"
      registry_role:
        | "client_registry_admin"
        | "provider_registry_admin"
        | "facility_registry_admin"
        | "terminology_admin"
        | "shr_admin"
        | "ndr_admin"
        | "registry_super_admin"
      roster_status: "draft" | "published" | "archived"
      shift_assignment_status:
        | "scheduled"
        | "confirmed"
        | "started"
        | "completed"
        | "cancelled"
        | "no_show"
      shift_status: "active" | "ended" | "cancelled"
      shift_type: "am" | "pm" | "night" | "on_call" | "full_day" | "custom"
      sorting_outcome:
        | "immediate_care"
        | "queued"
        | "referred"
        | "deferred"
        | "redirected"
      sorting_session_status:
        | "in_progress"
        | "completed"
        | "cancelled"
        | "escalated"
      telemedicine_role:
        | "telemedicine_admin"
        | "system_admin"
        | "technician"
        | "clinician"
        | "specialist"
        | "manager"
      transaction_status:
        | "pending"
        | "processing"
        | "success"
        | "failed"
        | "reversed"
        | "disputed"
      triage_urgency: "emergency" | "very_urgent" | "urgent" | "routine"
      visit_outcome:
        | "discharged_home"
        | "discharged_care"
        | "transferred"
        | "admitted"
        | "death"
        | "lama"
        | "absconded"
        | "administrative_closure"
        | "ongoing"
      visit_status: "planned" | "active" | "completed" | "cancelled" | "on_hold"
      visit_type:
        | "outpatient"
        | "inpatient"
        | "emergency"
        | "day_case"
        | "home_care"
        | "telehealth"
        | "programme"
      workspace_role: "staff" | "supervisor" | "manager"
      workspace_transfer_reason:
        | "rotation"
        | "cover"
        | "emergency"
        | "break"
        | "other"
      workspace_type: "clinical" | "admin" | "support"
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
      above_site_context_type: [
        "district_overview",
        "provincial_operations",
        "national_operations",
        "programme_operations",
        "telecare_operations",
        "network_operations",
      ],
      above_site_role_type: [
        "district_medical_officer",
        "district_health_executive",
        "provincial_health_executive",
        "national_programme_manager",
        "telecare_operations_manager",
        "radiology_network_manager",
        "lab_network_manager",
        "digital_health_manager",
        "quality_assurance_officer",
        "regulator_inspector",
      ],
      app_role: ["admin", "moderator", "user"],
      approval_status: ["pending", "approved", "suspended", "rejected"],
      arrival_mode: ["walk_in", "appointment", "referral", "emergency"],
      charge_status: [
        "pending",
        "approved",
        "billed",
        "disputed",
        "waived",
        "cancelled",
      ],
      claim_status: [
        "draft",
        "submitted",
        "acknowledged",
        "processing",
        "approved",
        "partially_approved",
        "denied",
        "appealed",
        "paid",
        "written_off",
      ],
      claim_type: [
        "insurance",
        "government",
        "employer",
        "donor",
        "workers_comp",
      ],
      clearance_status: [
        "pending",
        "in_progress",
        "cleared",
        "blocked",
        "waived",
        "not_applicable",
      ],
      clearance_type: [
        "clinical",
        "nursing",
        "pharmacy",
        "laboratory",
        "imaging",
        "financial",
        "administrative",
        "records",
        "crvs",
      ],
      client_lifecycle_state: [
        "draft",
        "active",
        "inactive",
        "deceased",
        "merged",
      ],
      client_relationship_type: [
        "mother",
        "father",
        "guardian",
        "caregiver",
        "spouse",
        "child",
        "sibling",
        "proxy",
        "next_of_kin",
        "emergency_contact",
      ],
      clinical_document_type: [
        "ips",
        "visit_summary",
        "discharge_summary",
        "ed_summary",
        "transfer_summary",
        "referral_summary",
        "lab_report",
        "imaging_report",
        "procedure_note",
        "death_summary",
        "lama_summary",
        "operative_note",
        "consultation_note",
        "progress_note",
      ],
      clinical_role: ["doctor", "nurse", "specialist", "patient", "admin"],
      cost_category: [
        "staff_time",
        "consumables",
        "equipment_depreciation",
        "facility_overhead",
        "transport",
        "accommodation",
        "catering",
        "linen_laundry",
        "utilities",
        "cold_chain",
        "per_diem",
        "other",
      ],
      cost_event_type: [
        "encounter_completed",
        "service_completed",
        "bed_day_accrued",
        "consumable_used",
        "procedure_performed",
        "transport_provided",
        "outreach_session",
      ],
      cover_request_status: ["pending", "approved", "denied", "expired"],
      crvs_birth_plurality: ["single", "twin", "triplet", "higher_order"],
      crvs_certificate_status: [
        "not_requested",
        "requested",
        "approved",
        "printed",
        "issued",
        "collected",
        "reprint_requested",
        "amended",
      ],
      crvs_cod_method: ["mccd", "verbal_autopsy", "pending"],
      crvs_death_manner: [
        "natural",
        "accident",
        "suicide",
        "homicide",
        "pending_investigation",
        "undetermined",
      ],
      crvs_notification_source: ["facility", "community", "client_portal"],
      crvs_notification_status: [
        "draft",
        "pending_verification",
        "verified",
        "submitted_to_registrar",
        "registered",
        "rejected",
        "requires_correction",
      ],
      crvs_notification_type: ["birth", "death"],
      crvs_notifier_role: [
        "facility_nurse",
        "facility_doctor",
        "records_clerk",
        "vhw",
        "eht",
        "village_head",
        "councillor",
        "relative",
        "other",
      ],
      crvs_va_status: [
        "pending",
        "in_progress",
        "completed",
        "needs_review",
        "cancelled",
      ],
      discharge_decision_type: [
        "routine",
        "dama",
        "referral",
        "transfer",
        "absconded",
        "death",
      ],
      discharge_workflow_state: [
        "active",
        "discharge_initiated",
        "clinical_clearance",
        "financial_clearance",
        "admin_approval",
        "closed_discharged",
        "death_declared",
        "certification",
        "financial_reconciliation",
        "closed_deceased",
        "cancelled",
      ],
      document_status: [
        "draft",
        "pending_signature",
        "final",
        "amended",
        "superseded",
        "entered_in_error",
      ],
      ehr_access_scope: [
        "read_summary",
        "read_full",
        "read_write",
        "orders_only",
        "notes_only",
      ],
      employment_type: [
        "permanent",
        "contract",
        "locum",
        "volunteer",
        "intern",
        "student",
      ],
      facility_ops_mode: ["simple", "standard", "advanced"],
      financial_state: [
        "pending",
        "deposit_required",
        "copay_pending",
        "cleared",
        "partial",
        "overdue",
        "exempt",
        "written_off",
      ],
      fulfillment_status: [
        "draft",
        "submitted",
        "bidding",
        "awarded",
        "confirmed",
        "processing",
        "ready",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
        "expired",
      ],
      identifier_confidence: [
        "verified",
        "self_reported",
        "derived",
        "uncertain",
      ],
      identity_resolution_status: [
        "confirmed",
        "probable_match",
        "temporary",
        "unknown",
      ],
      intervention_type: [
        "staff_redeployment",
        "coverage_approval",
        "queue_escalation",
        "virtual_pool_authorization",
        "facility_override",
        "emergency_response",
      ],
      invoice_status: [
        "draft",
        "finalized",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
        "written_off",
      ],
      jurisdiction_level: [
        "facility_list",
        "district",
        "province",
        "national",
        "virtual_services",
        "programme",
      ],
      license_status: [
        "active",
        "suspended",
        "revoked",
        "expired",
        "pending_renewal",
      ],
      operational_role: [
        "roster_supervisor",
        "shift_lead",
        "facility_ops_manager",
        "virtual_pool_supervisor",
        "department_head",
      ],
      payer_type: [
        "patient",
        "insurance",
        "government",
        "employer",
        "donor",
        "other",
      ],
      payment_channel: [
        "paynow",
        "ecocash",
        "onemoney",
        "innbucks",
        "stripe",
        "dpo_paygate",
        "zipit",
        "rtgs",
        "cbz_bank",
        "cash_facility",
        "cheque_facility",
      ],
      payment_method_v2: [
        "cash",
        "mobile_money",
        "card",
        "bank_transfer",
        "qr_code",
        "cheque",
        "insurance_remittance",
        "government_remittance",
      ],
      payment_request_status: [
        "created",
        "sent",
        "in_progress",
        "paid",
        "failed",
        "expired",
        "cancelled",
      ],
      product_category_type: [
        "pharmaceutical",
        "medical_device",
        "laboratory",
        "consumable",
        "equipment",
        "ppe",
        "diagnostic",
        "nutritional",
        "other",
      ],
      provider_lifecycle_state: [
        "draft",
        "pending_council_verification",
        "pending_facility_affiliation",
        "active",
        "suspended",
        "revoked",
        "retired",
        "deceased",
      ],
      queue_entry_type: [
        "walk_in",
        "appointment",
        "referral",
        "internal_transfer",
        "callback",
      ],
      queue_facility_mode: ["simple", "standard", "advanced"],
      queue_item_status: [
        "waiting",
        "called",
        "in_service",
        "paused",
        "completed",
        "transferred",
        "escalated",
        "no_show",
        "cancelled",
      ],
      queue_priority: [
        "emergency",
        "very_urgent",
        "urgent",
        "routine",
        "scheduled",
      ],
      queue_service_type: [
        "opd_triage",
        "opd_consultation",
        "specialist_clinic",
        "anc_clinic",
        "hiv_clinic",
        "tb_clinic",
        "ncd_clinic",
        "child_welfare_clinic",
        "dialysis",
        "imaging",
        "lab_reception",
        "lab_sample_collection",
        "pharmacy",
        "theatre_preop",
        "theatre_recovery",
        "procedure_room",
        "telecare",
        "specialist_pool",
        "general_reception",
      ],
      registry_record_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "suspended",
        "deactivated",
      ],
      registry_role: [
        "client_registry_admin",
        "provider_registry_admin",
        "facility_registry_admin",
        "terminology_admin",
        "shr_admin",
        "ndr_admin",
        "registry_super_admin",
      ],
      roster_status: ["draft", "published", "archived"],
      shift_assignment_status: [
        "scheduled",
        "confirmed",
        "started",
        "completed",
        "cancelled",
        "no_show",
      ],
      shift_status: ["active", "ended", "cancelled"],
      shift_type: ["am", "pm", "night", "on_call", "full_day", "custom"],
      sorting_outcome: [
        "immediate_care",
        "queued",
        "referred",
        "deferred",
        "redirected",
      ],
      sorting_session_status: [
        "in_progress",
        "completed",
        "cancelled",
        "escalated",
      ],
      telemedicine_role: [
        "telemedicine_admin",
        "system_admin",
        "technician",
        "clinician",
        "specialist",
        "manager",
      ],
      transaction_status: [
        "pending",
        "processing",
        "success",
        "failed",
        "reversed",
        "disputed",
      ],
      triage_urgency: ["emergency", "very_urgent", "urgent", "routine"],
      visit_outcome: [
        "discharged_home",
        "discharged_care",
        "transferred",
        "admitted",
        "death",
        "lama",
        "absconded",
        "administrative_closure",
        "ongoing",
      ],
      visit_status: ["planned", "active", "completed", "cancelled", "on_hold"],
      visit_type: [
        "outpatient",
        "inpatient",
        "emergency",
        "day_case",
        "home_care",
        "telehealth",
        "programme",
      ],
      workspace_role: ["staff", "supervisor", "manager"],
      workspace_transfer_reason: [
        "rotation",
        "cover",
        "emergency",
        "break",
        "other",
      ],
      workspace_type: ["clinical", "admin", "support"],
    },
  },
} as const
