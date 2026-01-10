// Patient Sorting & Front-Door Flow Types

export type ArrivalMode = 'walk_in' | 'appointment' | 'referral' | 'emergency';
export type TriageUrgency = 'emergency' | 'very_urgent' | 'urgent' | 'routine';
export type SortingOutcome = 'immediate_care' | 'queued' | 'referred' | 'deferred' | 'redirected';
export type IdentityResolutionStatus = 'confirmed' | 'probable_match' | 'temporary' | 'unknown';
export type SortingSessionStatus = 'in_progress' | 'completed' | 'cancelled' | 'escalated';

export interface SortingSession {
  id: string;
  session_number: string;
  facility_id: string | null;
  sorting_desk_id: string | null;
  
  // Arrival info
  arrival_mode: ArrivalMode;
  arrival_time: string;
  
  // Identity resolution
  identity_status: IdentityResolutionStatus;
  patient_id: string | null;
  temp_identity_id: string | null;
  health_id: string | null;
  search_query: string | null;
  
  // Triage
  triage_category: TriageUrgency | null;
  presenting_complaint: string | null;
  danger_signs: string[] | null;
  triage_notes: string | null;
  triage_by: string | null;
  triage_at: string | null;
  
  // Outcome
  outcome: SortingOutcome | null;
  outcome_reason: string | null;
  outcome_at: string | null;
  outcome_by: string | null;
  
  // Routing
  target_queue_id: string | null;
  queue_item_id: string | null;
  immediate_care_workspace_id: string | null;
  encounter_id: string | null;
  
  // Supervisor actions
  escalated: boolean;
  escalated_reason: string | null;
  escalated_at: string | null;
  escalated_by: string | null;
  supervisor_override: boolean;
  supervisor_notes: string | null;
  
  // Session status
  status: SortingSessionStatus;
  completed_at: string | null;
  
  // Metadata
  processing_time_seconds: number | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  
  // Joined data
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    mrn: string;
    date_of_birth: string | null;
    gender: string | null;
  } | null;
  temp_identity?: TemporaryPatientIdentity | null;
}

export interface TemporaryPatientIdentity {
  id: string;
  temp_id: string;
  given_name: string | null;
  alias: string | null;
  sex: string | null;
  estimated_age: number | null;
  estimated_age_unit: string;
  reason: string;
  sorting_session_id: string | null;
  facility_id: string | null;
  reconciled_to_patient_id: string | null;
  reconciled_at: string | null;
  reconciled_by: string | null;
  reconciliation_method: string | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface PatientSearchResult {
  id: string;
  mrn: string;
  health_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone?: string | null;
  matchConfidence: 'exact' | 'probable' | 'possible';
  matchReason?: string;
}

export interface SortingDeskMetrics {
  total_arrivals: number;
  total_triaged: number;
  immediate_care_count: number;
  queued_count: number;
  avg_processing_time: number | null;
  emergency_count: number;
  very_urgent_count: number;
  urgent_count: number;
  routine_count: number;
  pending_count: number;
}

// Labels and UI helpers
export const ARRIVAL_MODE_LABELS: Record<ArrivalMode, { label: string; icon: string; color: string }> = {
  walk_in: { label: 'Walk-in', icon: 'Footprints', color: 'text-blue-600' },
  appointment: { label: 'Appointment', icon: 'Calendar', color: 'text-green-600' },
  referral: { label: 'Referral', icon: 'ArrowRightLeft', color: 'text-purple-600' },
  emergency: { label: 'Emergency', icon: 'Siren', color: 'text-red-600' },
};

export const TRIAGE_URGENCY_CONFIG: Record<TriageUrgency, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  description: string;
}> = {
  emergency: { 
    label: 'Emergency', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    borderColor: 'border-red-500',
    description: 'Life-threatening, immediate attention required'
  },
  very_urgent: { 
    label: 'Very Urgent', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100', 
    borderColor: 'border-orange-500',
    description: 'Serious condition, prioritized care needed'
  },
  urgent: { 
    label: 'Urgent', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100', 
    borderColor: 'border-yellow-500',
    description: 'Needs attention soon but can wait briefly'
  },
  routine: { 
    label: 'Routine', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100', 
    borderColor: 'border-green-500',
    description: 'Standard priority, queue normally'
  },
};

export const SORTING_OUTCOME_LABELS: Record<SortingOutcome, { label: string; description: string }> = {
  immediate_care: { label: 'Immediate Care', description: 'Attend now, bypass queue' },
  queued: { label: 'Queue', description: 'Placed in service queue' },
  referred: { label: 'Referred', description: 'Referred to another facility' },
  deferred: { label: 'Deferred', description: 'Postponed to later' },
  redirected: { label: 'Redirected', description: 'Sent to different service' },
};

export const IDENTITY_STATUS_LABELS: Record<IdentityResolutionStatus, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'text-green-600' },
  probable_match: { label: 'Probable Match', color: 'text-yellow-600' },
  temporary: { label: 'Temporary ID', color: 'text-orange-600' },
  unknown: { label: 'Unknown', color: 'text-gray-500' },
};

// Common danger signs for quick selection
export const COMMON_DANGER_SIGNS = [
  'Airway obstruction',
  'Severe breathing difficulty',
  'Central cyanosis',
  'Signs of shock',
  'Unresponsive/unconscious',
  'Convulsing',
  'Severe dehydration',
  'Severe bleeding',
  'Chest pain',
  'Severe pain',
  'High fever (>39°C)',
  'Altered mental status',
];
