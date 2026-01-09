/**
 * National Health Provider Registry (HPR) & Identity Provider (IdP) Types
 * Based on OpenHIE and WHO Digital Health Building Blocks
 */

// Provider Lifecycle States (HPR-FR-010)
export type ProviderLifecycleState = 
  | 'draft'
  | 'pending_council_verification'
  | 'pending_facility_affiliation'
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'retired'
  | 'deceased';

// License Status
export type LicenseStatus = 
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'expired'
  | 'pending_renewal';

// Employment Type
export type EmploymentType = 
  | 'permanent'
  | 'contract'
  | 'locum'
  | 'volunteer'
  | 'intern'
  | 'student';

// IdP Revocation Event Types
export type RevocationEventType = 
  | 'license_expired'
  | 'provider_suspended'
  | 'provider_revoked'
  | 'privilege_revoked'
  | 'affiliation_ended';

// Provider Sex
export type ProviderSex = 'male' | 'female' | 'other';

// Provider Qualification
export interface ProviderQualification {
  degree: string;
  institution: string;
  year: number;
  country?: string;
}

// Health Provider (HPR Core Record)
export interface HealthProvider {
  id: string;
  upid: string;
  
  // Core identity fields
  first_name: string;
  surname: string;
  other_names?: string;
  date_of_birth: string;
  sex: ProviderSex;
  national_id?: string;
  passport_number?: string;
  
  // Optional identity fields
  photograph_url?: string;
  email?: string;
  phone?: string;
  nationality: string;
  
  // Professional attributes
  cadre: string;
  specialty?: string;
  sub_specialty?: string;
  qualifications: ProviderQualification[];
  languages: string[];
  
  // Lifecycle state
  lifecycle_state: ProviderLifecycleState;
  lifecycle_state_reason?: string;
  lifecycle_state_changed_at?: string;
  lifecycle_state_changed_by?: string;
  
  // User linkage (IdP)
  user_id?: string;
  user_linked_at?: string;
  user_link_verified_by?: string;
  user_link_verification_method?: string;
  
  // Audit
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  
  // De-duplication
  is_master_record: boolean;
  merged_into_upid?: string;
  merged_at?: string;
  merge_reason?: string;
}

// Provider License (HPR-FR-020)
export interface ProviderLicense {
  id: string;
  provider_id: string;
  
  council_id: string;
  council_name: string;
  registration_number: string;
  license_category: string;
  
  status: LicenseStatus;
  status_reason?: string;
  status_changed_at?: string;
  status_changed_by?: string;
  
  issue_date: string;
  expiry_date: string;
  last_verified_at?: string;
  last_verified_by?: string;
  
  source_system?: string;
  source_reference?: string;
  
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// Provider Affiliation (HPR-FR-030)
export interface ProviderAffiliation {
  id: string;
  provider_id: string;
  facility_id: string;
  facility_name: string;
  
  employment_type: EmploymentType;
  role: string;
  department?: string;
  position_title?: string;
  
  privileges: string[];
  
  start_date: string;
  end_date?: string;
  
  is_active: boolean;
  is_primary: boolean;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
  
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// Provider Privilege Taxonomy
export interface ProviderPrivilege {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  requires_supervision: boolean;
  is_active: boolean;
  created_at: string;
}

// State Transition Audit Log
export interface ProviderStateTransition {
  id: string;
  provider_id: string;
  from_state?: ProviderLifecycleState;
  to_state: ProviderLifecycleState;
  reason?: string;
  reason_code?: string;
  changed_by: string;
  changed_by_role?: string;
  council_reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Eligibility Decision (HPR-FR-050)
export interface EligibilityDecision {
  id: string;
  provider_id: string;
  
  eligible: boolean;
  reason_codes: string[];
  
  requested_role?: string;
  requested_privileges?: string[];
  facility_context?: string;
  
  granted_roles: string[];
  granted_privileges: string[];
  facility_scope: string[];
  license_valid_until?: string;
  
  requested_by?: string;
  requested_at: string;
  response_time_ms?: number;
  
  token_issued: boolean;
  session_id?: string;
}

// Eligibility Response (from check_provider_eligibility function)
export interface EligibilityResponse {
  eligible: boolean;
  provider_id: string;
  roles: string[];
  privileges: string[];
  facility_scope: string[];
  license_valid_until?: string;
  reason_codes: string[];
}

// IdP Revocation Event (IDP-FR-040)
export interface IdPRevocationEvent {
  id: string;
  provider_id: string;
  user_id?: string;
  
  event_type: RevocationEventType;
  
  source_entity_type?: string;
  source_entity_id?: string;
  
  sessions_revoked: number;
  tokens_invalidated: number;
  
  triggered_at: string;
  processed_at?: string;
  processed_by?: string;
  
  metadata?: Record<string, unknown>;
}

// Provider Lifecycle State Metadata
export const LIFECYCLE_STATE_METADATA: Record<ProviderLifecycleState, {
  label: string;
  description: string;
  allowsAccess: boolean;
  color: string;
}> = {
  draft: {
    label: 'Draft',
    description: 'Created but unverified',
    allowsAccess: false,
    color: 'bg-muted text-muted-foreground',
  },
  pending_council_verification: {
    label: 'Pending Council Verification',
    description: 'Awaiting licensure check',
    allowsAccess: false,
    color: 'bg-yellow-100 text-yellow-800',
  },
  pending_facility_affiliation: {
    label: 'Pending Facility Affiliation',
    description: 'Licensed but unaffiliated',
    allowsAccess: false,
    color: 'bg-orange-100 text-orange-800',
  },
  active: {
    label: 'Active',
    description: 'Licensed + affiliated',
    allowsAccess: true,
    color: 'bg-green-100 text-green-800',
  },
  suspended: {
    label: 'Suspended',
    description: 'Temporarily barred',
    allowsAccess: false,
    color: 'bg-red-100 text-red-800',
  },
  revoked: {
    label: 'Revoked',
    description: 'Permanently barred',
    allowsAccess: false,
    color: 'bg-red-200 text-red-900',
  },
  retired: {
    label: 'Retired',
    description: 'Not practicing',
    allowsAccess: false,
    color: 'bg-gray-100 text-gray-800',
  },
  deceased: {
    label: 'Deceased',
    description: 'Closed',
    allowsAccess: false,
    color: 'bg-gray-200 text-gray-900',
  },
};

// License Status Metadata
export const LICENSE_STATUS_METADATA: Record<LicenseStatus, {
  label: string;
  color: string;
}> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  suspended: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
  revoked: { label: 'Revoked', color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800' },
  pending_renewal: { label: 'Pending Renewal', color: 'bg-blue-100 text-blue-800' },
};

// Employment Type Labels
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  locum: 'Locum',
  volunteer: 'Volunteer',
  intern: 'Intern',
  student: 'Student',
};

// Cadre options (controlled vocabulary)
export const PROVIDER_CADRES = [
  { value: 'doctor', label: 'Doctor (Medical Practitioner)' },
  { value: 'specialist', label: 'Specialist Physician' },
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'nurse', label: 'Registered Nurse' },
  { value: 'midwife', label: 'Midwife' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'pharmacy_tech', label: 'Pharmacy Technician' },
  { value: 'lab_scientist', label: 'Laboratory Scientist' },
  { value: 'lab_tech', label: 'Laboratory Technician' },
  { value: 'radiographer', label: 'Radiographer' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'dental_tech', label: 'Dental Technician' },
  { value: 'psychologist', label: 'Psychologist' },
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'nutritionist', label: 'Nutritionist/Dietitian' },
  { value: 'optometrist', label: 'Optometrist' },
  { value: 'paramedic', label: 'Paramedic/EMT' },
  { value: 'health_officer', label: 'Health Officer' },
  { value: 'chw', label: 'Community Health Worker' },
  { value: 'admin', label: 'Healthcare Administrator' },
];

// Registration Councils
export const REGISTRATION_COUNCILS = [
  { id: 'MDPCZ', name: 'Medical and Dental Practitioners Council of Zimbabwe' },
  { id: 'NCZ', name: 'Nurses Council of Zimbabwe' },
  { id: 'PACBZ', name: 'Pharmacists Council of Zimbabwe' },
  { id: 'AHPCZ', name: 'Allied Health Practitioners Council of Zimbabwe' },
  { id: 'ZMLS', name: 'Zimbabwe Medical Laboratory Scientists Council' },
  { id: 'ZHPCZ', name: 'Zimbabwe Health Professionals Council' },
];

// Valid State Transitions (HPR-FR-011)
export const VALID_STATE_TRANSITIONS: Record<ProviderLifecycleState, ProviderLifecycleState[]> = {
  draft: ['pending_council_verification'],
  pending_council_verification: ['pending_facility_affiliation', 'suspended', 'revoked'],
  pending_facility_affiliation: ['active', 'suspended', 'revoked'],
  active: ['suspended', 'revoked', 'retired', 'deceased'],
  suspended: ['active', 'revoked', 'deceased'],
  revoked: ['deceased'],
  retired: ['active', 'deceased'],
  deceased: [],
};

// Council-only state transitions (HPR-FR-011)
export const COUNCIL_ONLY_TRANSITIONS: ProviderLifecycleState[] = [
  'suspended',
  'revoked',
];
