/**
 * iHRIS v5 Aligned Types for Health Provider Registry
 * Comprehensive HR management types based on iHRIS data model
 */

// ==========================================
// EDUCATION & TRAINING
// ==========================================

export interface ProviderEducation {
  id: string;
  provider_id: string;
  education_level: string;
  degree_name: string;
  major?: string;
  minor?: string;
  institution_name: string;
  institution_type?: string;
  institution_country: string;
  start_date?: string;
  end_date?: string;
  graduation_date?: string;
  status: 'in_progress' | 'completed' | 'incomplete';
  gpa?: string;
  honors?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  certificate_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ProviderTraining {
  id: string;
  provider_id: string;
  training_name: string;
  training_type: string;
  training_category?: string;
  description?: string;
  training_provider: string;
  location?: string;
  start_date: string;
  end_date?: string;
  duration_hours?: number;
  status: 'in_progress' | 'completed' | 'incomplete';
  certificate_received: boolean;
  certificate_number?: string;
  certificate_url?: string;
  expiry_date?: string;
  sponsored_by?: string;
  cost?: number;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// ==========================================
// EMPLOYMENT & POSITIONS
// ==========================================

export interface ProviderEmploymentHistory {
  id: string;
  provider_id: string;
  employer_name: string;
  employer_type?: 'government' | 'private' | 'ngo' | 'international';
  position_title: string;
  department?: string;
  facility_id?: string;
  location?: string;
  country: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  departure_reason?: string;
  departure_type?: 'resignation' | 'termination' | 'transfer' | 'retirement' | 'contract_end';
  supervisor_name?: string;
  supervisor_contact?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  reference_letter_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ProviderPositionChange {
  id: string;
  provider_id: string;
  affiliation_id?: string;
  change_type: 'hire' | 'promotion' | 'demotion' | 'transfer' | 'reassignment' | 'acting';
  effective_date: string;
  previous_position_title?: string;
  previous_department?: string;
  previous_facility_id?: string;
  previous_salary_grade?: string;
  new_position_title: string;
  new_department?: string;
  new_facility_id?: string;
  new_salary_grade?: string;
  reason?: string;
  authorization_reference?: string;
  authorized_by?: string;
  authorization_document_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// ==========================================
// HR MANAGEMENT
// ==========================================

export interface ProviderLeave {
  id: string;
  provider_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  days_approved?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  reason?: string;
  notes?: string;
  supporting_document_url?: string;
  acting_replacement_id?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ProviderDisciplinary {
  id: string;
  provider_id: string;
  incident_date: string;
  reported_date?: string;
  incident_type: 'misconduct' | 'negligence' | 'absenteeism' | 'insubordination' | 'fraud' | 'harassment';
  description: string;
  action_type: 'verbal_warning' | 'written_warning' | 'suspension' | 'demotion' | 'termination' | 'counseling';
  action_date: string;
  action_duration_days?: number;
  action_end_date?: string;
  status: 'active' | 'expired' | 'appealed' | 'overturned';
  investigated_by?: string;
  investigation_notes?: string;
  hearing_date?: string;
  hearing_outcome?: string;
  appeal_filed: boolean;
  appeal_date?: string;
  appeal_outcome?: string;
  incident_report_url?: string;
  disciplinary_letter_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ProviderPerformance {
  id: string;
  provider_id: string;
  evaluation_period: string;
  start_date: string;
  end_date: string;
  evaluator_id?: string;
  evaluator_name?: string;
  evaluator_position?: string;
  overall_score?: number;
  attendance_score?: number;
  quality_score?: number;
  productivity_score?: number;
  teamwork_score?: number;
  communication_score?: number;
  leadership_score?: number;
  strengths?: string[];
  areas_for_improvement?: string[];
  goals_set?: string[];
  goals_achieved?: string[];
  comments?: string;
  employee_comments?: string;
  employee_signed?: boolean;
  employee_signed_at?: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'finalized' | 'completed';
  finalized_at?: string;
  evaluation_form_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ProviderSalary {
  id: string;
  provider_id: string;
  salary_grade: string;
  salary_step?: number;
  base_salary: number;
  currency: string;
  pay_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'annual';
  funds_source?: string;
  funder_name?: string;
  funding_project?: string;
  allowances?: Record<string, number> | { name: string; amount: number }[];
  total_allowances?: number;
  deductions?: Record<string, number> | { name: string; amount: number }[];
  total_deductions?: number;
  net_salary?: number;
  effective_from: string;
  effective_until?: string;
  is_current: boolean;
  bank_name?: string;
  account_number_masked?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// ==========================================
// PERSONAL DETAILS
// ==========================================

export interface ProviderEmergencyContact {
  id: string;
  provider_id: string;
  contact_name: string;
  relationship: 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other';
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  city?: string;
  country: string;
  priority_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderDependent {
  id: string;
  provider_id: string;
  full_name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling';
  date_of_birth?: string;
  sex?: string;
  national_id?: string;
  is_beneficiary: boolean;
  is_dependent_on_tax: boolean;
  disability_status: boolean;
  disability_type?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderIdentifier {
  id: string;
  provider_id: string;
  identifier_type: string;
  identifier_value: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  issuing_country: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// REFERENCE DATA
// ==========================================

export interface RefEducationLevel {
  id: string;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface RefTrainingType {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface RefLeaveType {
  id: string;
  code: string;
  name: string;
  description?: string;
  default_days: number;
  is_paid: boolean;
  is_active: boolean;
}

export interface RefSalaryGrade {
  id: string;
  code: string;
  name: string;
  description?: string;
  min_salary: number;
  max_salary: number;
  currency: string;
  is_active: boolean;
}

export interface RefClassification {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================

export const EDUCATION_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'incomplete', label: 'Incomplete' },
];

export const EMPLOYER_TYPE_OPTIONS = [
  { value: 'government', label: 'Government' },
  { value: 'private', label: 'Private' },
  { value: 'ngo', label: 'NGO' },
  { value: 'international', label: 'International' },
];

export const DEPARTURE_TYPE_OPTIONS = [
  { value: 'resignation', label: 'Resignation' },
  { value: 'termination', label: 'Termination' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'contract_end', label: 'Contract End' },
];

export const POSITION_CHANGE_OPTIONS = [
  { value: 'hire', label: 'New Hire' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'demotion', label: 'Demotion' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'reassignment', label: 'Reassignment' },
  { value: 'acting', label: 'Acting Appointment' },
];

export const LEAVE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const INCIDENT_TYPE_OPTIONS = [
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'negligence', label: 'Negligence' },
  { value: 'absenteeism', label: 'Absenteeism' },
  { value: 'insubordination', label: 'Insubordination' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'harassment', label: 'Harassment' },
];

export const DISCIPLINARY_ACTION_OPTIONS = [
  { value: 'verbal_warning', label: 'Verbal Warning' },
  { value: 'written_warning', label: 'Written Warning' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'demotion', label: 'Demotion' },
  { value: 'termination', label: 'Termination' },
  { value: 'counseling', label: 'Counseling' },
];

export const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

export const IDENTIFIER_TYPE_OPTIONS = [
  { value: 'driving_license', label: 'Driving License' },
  { value: 'professional_license', label: 'Professional License' },
  { value: 'tin', label: 'Tax Identification Number' },
  { value: 'ssn', label: 'Social Security Number' },
  { value: 'pension', label: 'Pension Number' },
  { value: 'medical_aid', label: 'Medical Aid Number' },
  { value: 'insurance', label: 'Insurance Number' },
];

export const FUNDS_SOURCE_OPTIONS = [
  { value: 'government', label: 'Government' },
  { value: 'donor', label: 'Donor Funded' },
  { value: 'private', label: 'Private' },
  { value: 'ngo', label: 'NGO' },
];
