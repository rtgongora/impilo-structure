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
          address_line1: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          facility_type: string
          gofr_id: string
          id: string
          is_active: boolean | null
          latitude: number | null
          level: string | null
          longitude: number | null
          name: string
          phone: string | null
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          facility_type: string
          gofr_id: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          facility_type?: string
          gofr_id?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          level?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          province?: string | null
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
      lab_orders: {
        Row: {
          created_at: string
          department: string | null
          encounter_id: string | null
          id: string
          notes: string | null
          order_number: string
          ordered_at: string
          ordered_by: string | null
          patient_id: string
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          ordered_at?: string
          ordered_by?: string | null
          patient_id: string
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          encounter_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          ordered_at?: string
          ordered_by?: string | null
          patient_id?: string
          priority?: string
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
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_abnormal: boolean | null
          is_critical: boolean | null
          lab_order_id: string
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          reference_range: string | null
          result_unit: string | null
          result_value: string | null
          status: string
          test_code: string | null
          test_name: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          lab_order_id: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value?: string | null
          status?: string
          test_code?: string | null
          test_name: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          lab_order_id?: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value?: string | null
          status?: string
          test_code?: string | null
          test_name?: string
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
        ]
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
          created_at: string | null
          id: string
          impilo_id: string
          mosip_uin: string | null
          patient_id: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string | null
          id?: string
          impilo_id: string
          mosip_uin?: string | null
          patient_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          biometric_enrolled_at?: string | null
          biometric_facial_hash?: string | null
          biometric_fingerprint_hash?: string | null
          biometric_iris_hash?: string | null
          created_at?: string | null
          id?: string
          impilo_id?: string
          mosip_uin?: string | null
          patient_id?: string | null
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
          collected_at: string
          collected_by: string | null
          collection_method: string | null
          collection_notes: string | null
          collection_site: string | null
          container_type: string | null
          created_at: string
          encounter_id: string | null
          fasting_status: string | null
          id: string
          is_biohazard: boolean | null
          lab_order_id: string | null
          patient_id: string
          preservative: string | null
          priority: string | null
          rejection_reason: string | null
          specimen_id: string
          specimen_source: string | null
          specimen_type: string
          status: string
          temperature_requirement: string | null
          transport_conditions: string | null
          updated_at: string
          volume_collected: string | null
          volume_unit: string | null
        }
        Insert: {
          collected_at?: string
          collected_by?: string | null
          collection_method?: string | null
          collection_notes?: string | null
          collection_site?: string | null
          container_type?: string | null
          created_at?: string
          encounter_id?: string | null
          fasting_status?: string | null
          id?: string
          is_biohazard?: boolean | null
          lab_order_id?: string | null
          patient_id: string
          preservative?: string | null
          priority?: string | null
          rejection_reason?: string | null
          specimen_id: string
          specimen_source?: string | null
          specimen_type: string
          status?: string
          temperature_requirement?: string | null
          transport_conditions?: string | null
          updated_at?: string
          volume_collected?: string | null
          volume_unit?: string | null
        }
        Update: {
          collected_at?: string
          collected_by?: string | null
          collection_method?: string | null
          collection_notes?: string | null
          collection_site?: string | null
          container_type?: string | null
          created_at?: string
          encounter_id?: string | null
          fasting_status?: string | null
          id?: string
          is_biohazard?: boolean | null
          lab_order_id?: string | null
          patient_id?: string
          preservative?: string | null
          priority?: string | null
          rejection_reason?: string | null
          specimen_id?: string
          specimen_source?: string | null
          specimen_type?: string
          status?: string
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
      generate_claim_number: { Args: never; Returns: string }
      generate_encounter_number: { Args: never; Returns: string }
      generate_fulfillment_number: { Args: never; Returns: string }
      generate_lab_order_number: { Args: never; Returns: string }
      generate_mrn: { Args: never; Returns: string }
      generate_prescription_number: { Args: never; Returns: string }
      generate_referral_number: { Args: never; Returns: string }
      generate_specimen_id: { Args: never; Returns: string }
      generate_theatre_booking_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
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
      approval_status: "pending" | "approved" | "suspended" | "rejected"
      clinical_role: "doctor" | "nurse" | "specialist" | "patient" | "admin"
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
      approval_status: ["pending", "approved", "suspended", "rejected"],
      clinical_role: ["doctor", "nurse", "specialist", "patient", "admin"],
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
    },
  },
} as const
