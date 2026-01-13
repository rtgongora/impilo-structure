// Discharge & Death Workflow Types

export type DischargeWorkflowState = 
  | 'active'
  | 'discharge_initiated'
  | 'clinical_clearance'
  | 'financial_clearance'
  | 'admin_approval'
  | 'closed_discharged'
  | 'death_declared'
  | 'certification'
  | 'financial_reconciliation'
  | 'closed_deceased'
  | 'cancelled';

export type DischargeDecisionType = 
  | 'routine'
  | 'dama'
  | 'referral'
  | 'transfer'
  | 'absconded'
  | 'death';

// Maps to visit_outcome enum in database
export type DischargeDestination = 
  | 'discharged_home'
  | 'discharged_care'
  | 'transferred'
  | 'lama'
  | 'absconded'
  | 'death'
  | 'administrative_closure';

// Mapping from decision type to visit outcome
export const DECISION_TO_OUTCOME: Record<DischargeDecisionType, DischargeDestination | null> = {
  routine: null, // Requires destination selection
  dama: 'lama',
  referral: 'transferred',
  transfer: 'transferred',
  absconded: 'absconded',
  death: 'death',
};

export const DISCHARGE_DESTINATION_LABELS: Record<DischargeDestination, string> = {
  discharged_home: 'Discharged Home',
  discharged_care: 'Discharged to Care Facility',
  transferred: 'Transferred to Another Facility',
  lama: 'Left Against Medical Advice',
  absconded: 'Absconded',
  death: 'Death',
  administrative_closure: 'Administrative Closure',
};

export type ClearanceType = 
  | 'clinical'
  | 'nursing'
  | 'pharmacy'
  | 'laboratory'
  | 'imaging'
  | 'financial'
  | 'administrative'
  | 'records'
  | 'crvs';

export type ClearanceStatus = 
  | 'pending'
  | 'in_progress'
  | 'cleared'
  | 'blocked'
  | 'waived'
  | 'not_applicable';

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed?: boolean;
}

export interface DischargeCase {
  id: string;
  case_number: string;
  visit_id: string;
  patient_id: string;
  encounter_id?: string;
  facility_id?: string;
  workflow_state: DischargeWorkflowState;
  workflow_type: 'discharge' | 'death';
  decision_type?: DischargeDecisionType;
  decision_reason?: string;
  decision_datetime?: string;
  decision_by?: string;
  
  // Discharge destination (for routine discharges)
  discharge_destination?: DischargeDestination;
  
  // Death fields
  death_datetime?: string;
  death_place?: string;
  preliminary_cause_category?: string;
  is_community_death?: boolean;
  mortuary_transfer_datetime?: string;
  mortuary_location?: string;
  
  // Discharge fields
  discharge_diagnosis?: string;
  treatment_summary?: string;
  follow_up_plan?: string;
  discharge_instructions?: string;
  discharge_datetime?: string;
  
  // Financial
  financial_status: string;
  total_charges: number;
  total_paid: number;
  total_waived: number;
  outstanding_balance: number;
  
  // Flags
  is_legal_hold?: boolean;
  patient_acknowledged?: boolean;
  
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface DischargeClearance {
  id: string;
  discharge_case_id: string;
  clearance_type: ClearanceType;
  status: ClearanceStatus;
  sequence_order: number;
  assigned_to?: string;
  assigned_role?: string;
  cleared_by?: string;
  cleared_at?: string;
  blocked_reason?: string;
  waived_by?: string;
  waived_reason?: string;
  checklist_items: ChecklistItem[];
  completed_items: ChecklistItem[];
  notes?: string;
}

export interface DischargeApproval {
  id: string;
  discharge_case_id: string;
  approval_stage: string;
  required_role: string;
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  sequence_order: number;
  is_mandatory: boolean;
}

export interface DeathCertification {
  id: string;
  discharge_case_id: string;
  certification_type: 'facility' | 'community';
  practitioner_name: string;
  practitioner_qualification: string;
  practitioner_registration_number?: string;
  community_verifier_name?: string;
  community_verifier_role?: string;
  certification_datetime: string;
  place_of_certification?: string;
  immediate_cause?: string;
  underlying_cause?: string;
  contributing_causes?: string[];
  manner_of_death?: string;
  is_verified: boolean;
}

export interface DischargeFinancialClearance {
  id: string;
  discharge_case_id: string;
  bed_day_charges: number;
  procedure_charges: number;
  medication_charges: number;
  lab_charges: number;
  imaging_charges: number;
  consumable_charges: number;
  catering_charges: number;
  utility_charges: number;
  special_service_charges: number;
  mortuary_charges: number;
  other_charges: number;
  gross_total: number;
  exemptions_applied: number;
  insurance_covered: number;
  sponsor_covered: number;
  discounts_applied: number;
  net_payable: number;
  amount_paid: number;
  balance_due: number;
  resolution_type?: string;
  resolution_notes?: string;
}

// State machine helpers
export const DISCHARGE_STATE_FLOW: DischargeWorkflowState[] = [
  'active',
  'discharge_initiated',
  'clinical_clearance',
  'financial_clearance',
  'admin_approval',
  'closed_discharged'
];

export const DEATH_STATE_FLOW: DischargeWorkflowState[] = [
  'active',
  'death_declared',
  'certification',
  'financial_reconciliation',
  'admin_approval',
  'closed_deceased'
];

export const CLEARANCE_LABELS: Record<ClearanceType, string> = {
  clinical: 'Clinical Clearance',
  nursing: 'Nursing Clearance',
  pharmacy: 'Pharmacy Clearance',
  laboratory: 'Laboratory Clearance',
  imaging: 'Imaging Clearance',
  financial: 'Financial Clearance',
  administrative: 'Administrative Clearance',
  records: 'Records Clearance',
  crvs: 'CRVS Notification'
};

export const CLEARANCE_ICONS: Record<ClearanceType, string> = {
  clinical: 'Stethoscope',
  nursing: 'Heart',
  pharmacy: 'Pill',
  laboratory: 'FlaskConical',
  imaging: 'ScanLine',
  financial: 'DollarSign',
  administrative: 'ClipboardCheck',
  records: 'FileText',
  crvs: 'FileCheck'
};
