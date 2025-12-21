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
      appointments: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          appointment_type: string
          created_at: string
          created_by: string | null
          department: string | null
          encounter_id: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          notes: string | null
          patient_id: string | null
          priority: string | null
          provider_id: string | null
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
          created_at?: string
          created_by?: string | null
          department?: string | null
          encounter_id?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          priority?: string | null
          provider_id?: string | null
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
          created_at?: string
          created_by?: string | null
          department?: string | null
          encounter_id?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          priority?: string | null
          provider_id?: string | null
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
          encounter_type: string
          id: string
          notes: string | null
          patient_id: string
          primary_diagnosis: string | null
          status: string
          triage_category: string | null
          updated_at: string
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
          encounter_type: string
          id?: string
          notes?: string | null
          patient_id: string
          primary_diagnosis?: string | null
          status?: string
          triage_category?: string | null
          updated_at?: string
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
          encounter_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          primary_diagnosis?: string | null
          status?: string
          triage_category?: string | null
          updated_at?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          created_at: string
          department: string | null
          display_name: string
          force_password_reset: boolean
          id: string
          last_active_at: string | null
          license_number: string | null
          password_reset_reason: string | null
          phone: string | null
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
          created_at?: string
          department?: string | null
          display_name: string
          force_password_reset?: boolean
          id?: string
          last_active_at?: string | null
          license_number?: string | null
          password_reset_reason?: string | null
          phone?: string | null
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
          created_at?: string
          department?: string | null
          display_name?: string
          force_password_reset?: boolean
          id?: string
          last_active_at?: string | null
          license_number?: string | null
          password_reset_reason?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["clinical_role"]
          specialty?: string | null
          totp_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      teleconsult_sessions: {
        Row: {
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          referral_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          referral_id: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          referral_id?: string
          status?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_encounter_number: { Args: never; Returns: string }
      generate_mrn: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      clinical_role: "doctor" | "nurse" | "specialist" | "patient" | "admin"
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
      app_role: ["admin", "moderator", "user"],
      clinical_role: ["doctor", "nurse", "specialist", "patient", "admin"],
    },
  },
} as const
