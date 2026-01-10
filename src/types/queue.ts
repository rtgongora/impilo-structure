// Queue Management System Types

export type QueuePriority = 'emergency' | 'very_urgent' | 'urgent' | 'routine' | 'scheduled';

export type QueueItemStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_service' 
  | 'paused' 
  | 'completed' 
  | 'transferred' 
  | 'escalated' 
  | 'no_show' 
  | 'cancelled';

export type QueueServiceType =
  | 'opd_triage'
  | 'opd_consultation'
  | 'specialist_clinic'
  | 'anc_clinic'
  | 'hiv_clinic'
  | 'tb_clinic'
  | 'ncd_clinic'
  | 'child_welfare_clinic'
  | 'dialysis'
  | 'imaging'
  | 'lab_reception'
  | 'lab_sample_collection'
  | 'pharmacy'
  | 'theatre_preop'
  | 'theatre_recovery'
  | 'procedure_room'
  | 'telecare'
  | 'specialist_pool'
  | 'general_reception';

export type QueueFacilityMode = 'simple' | 'standard' | 'advanced';

export type QueueEntryType = 'walk_in' | 'appointment' | 'referral' | 'internal_transfer' | 'callback';

export interface QueueDefinition {
  id: string;
  facility_id: string;
  workspace_id: string | null;
  pool_id: string | null;
  name: string;
  description: string | null;
  service_type: QueueServiceType;
  is_active: boolean;
  is_virtual: boolean;
  operating_hours_start: string | null;
  operating_hours_end: string | null;
  operating_days: number[];
  default_priority: QueuePriority;
  sla_target_minutes: number | null;
  escalation_threshold_minutes: number | null;
  walk_in_appointment_ratio: string;
  allowed_cadres: string[] | null;
  default_next_queue_id: string | null;
  display_order: number;
  color_code: string | null;
  icon: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface QueueItem {
  id: string;
  queue_id: string;
  patient_id: string | null;
  health_id: string | null;
  temp_identity_id: string | null;
  encounter_id: string | null;
  appointment_id: string | null;
  ticket_number: string;
  sequence_number: number;
  entry_type: QueueEntryType;
  arrival_time: string;
  arrival_date: string;
  reason_for_visit: string | null;
  reason_code: string | null;
  notes: string | null;
  priority: QueuePriority;
  priority_changed_at: string | null;
  priority_changed_by: string | null;
  priority_change_reason: string | null;
  status: QueueItemStatus;
  called_at: string | null;
  in_service_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  completed_at: string | null;
  assigned_provider_id: string | null;
  assigned_team_id: string | null;
  transferred_from_queue_id: string | null;
  transferred_from_item_id: string | null;
  transfer_reason: string | null;
  is_escalated: boolean;
  escalation_reason: string | null;
  escalated_at: string | null;
  escalated_by: string | null;
  wait_time_minutes: number | null;
  service_time_minutes: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: { first_name: string; last_name: string; mrn: string } | null;
  queue?: QueueDefinition | null;
}

export interface QueueMetrics {
  queue_length: number;
  avg_wait_minutes: number | null;
  longest_wait_minutes: number | null;
  in_service_count: number;
  completed_today: number;
}

export interface QueueFacilityConfig {
  id: string;
  facility_id: string;
  queue_mode: QueueFacilityMode;
  enable_tokens: boolean;
  enable_sla_tracking: boolean;
  enable_priority_escalation: boolean;
  enable_self_checkin: boolean;
  enable_patient_display: boolean;
  enable_sms_notifications: boolean;
  default_sla_triage_minutes: number;
  default_sla_consultation_minutes: number;
  default_sla_lab_minutes: number;
  default_sla_imaging_minutes: number;
  default_sla_pharmacy_minutes: number;
  enable_overflow_queues: boolean;
  max_overflow_queues: number;
}

// Labels and metadata
export const QUEUE_PRIORITY_LABELS: Record<QueuePriority, { label: string; color: string; bgColor: string }> = {
  emergency: { label: 'Emergency', color: 'text-red-600', bgColor: 'bg-red-100' },
  very_urgent: { label: 'Very Urgent', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  routine: { label: 'Routine', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  scheduled: { label: 'Scheduled', color: 'text-green-600', bgColor: 'bg-green-100' },
};

export const QUEUE_STATUS_LABELS: Record<QueueItemStatus, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'text-blue-600' },
  called: { label: 'Called', color: 'text-purple-600' },
  in_service: { label: 'In Service', color: 'text-green-600' },
  paused: { label: 'Paused', color: 'text-yellow-600' },
  completed: { label: 'Completed', color: 'text-gray-600' },
  transferred: { label: 'Transferred', color: 'text-indigo-600' },
  escalated: { label: 'Escalated', color: 'text-red-600' },
  no_show: { label: 'No Show', color: 'text-gray-400' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400' },
};

export const QUEUE_SERVICE_TYPE_LABELS: Record<QueueServiceType, string> = {
  opd_triage: 'OPD Triage',
  opd_consultation: 'OPD Consultation',
  specialist_clinic: 'Specialist Clinic',
  anc_clinic: 'ANC Clinic',
  hiv_clinic: 'HIV Clinic',
  tb_clinic: 'TB Clinic',
  ncd_clinic: 'NCD Clinic',
  child_welfare_clinic: 'Child Welfare Clinic',
  dialysis: 'Dialysis',
  imaging: 'Imaging',
  lab_reception: 'Lab Reception',
  lab_sample_collection: 'Lab Sample Collection',
  pharmacy: 'Pharmacy',
  theatre_preop: 'Theatre Pre-Op',
  theatre_recovery: 'Theatre Recovery',
  procedure_room: 'Procedure Room',
  telecare: 'Telecare',
  specialist_pool: 'Specialist Pool',
  general_reception: 'General Reception',
};

export const QUEUE_ENTRY_TYPE_LABELS: Record<QueueEntryType, string> = {
  walk_in: 'Walk-in',
  appointment: 'Appointment',
  referral: 'Referral',
  internal_transfer: 'Internal Transfer',
  callback: 'Callback',
};
