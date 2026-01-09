/**
 * National Client Registry Types
 * OpenHIE, WHO DIIG, FHIR R4 Compliant
 */

export type ClientLifecycleState = 'draft' | 'active' | 'inactive' | 'deceased' | 'merged';
export type IdentifierConfidence = 'verified' | 'self_reported' | 'derived' | 'uncertain';
export type ClientRelationshipType = 
  | 'mother' | 'father' | 'guardian' | 'caregiver' 
  | 'spouse' | 'child' | 'sibling' | 'proxy' 
  | 'next_of_kin' | 'emergency_contact';

export interface ClientRecord {
  id: string;
  health_id: string;
  
  // Core identity
  given_names: string;
  family_name: string;
  other_names?: string;
  sex: 'male' | 'female' | 'other' | 'unknown';
  date_of_birth?: string;
  estimated_dob: boolean;
  dob_confidence?: 'exact' | 'year_month' | 'year_only' | 'estimated';
  
  // Demographics
  place_of_birth?: string;
  nationality: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  village?: string;
  ward?: string;
  district?: string;
  province?: string;
  country: string;
  postal_code?: string;
  
  // Contact
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  
  // Lifecycle
  lifecycle_state: ClientLifecycleState;
  lifecycle_state_reason?: string;
  lifecycle_state_changed_at?: string;
  lifecycle_state_changed_by?: string;
  
  // Death management
  deceased_date?: string;
  deceased_confirmed: boolean;
  deceased_source?: string;
  
  // Merge management
  merged_into_id?: string;
  merged_at?: string;
  merged_by?: string;
  
  // Biometric
  biometric_enrolled: boolean;
  
  // Matching
  matching_score?: number;
  duplicate_flag: boolean;
  last_verified_at?: string;
  verification_source?: string;
  
  // Provenance
  source_system?: string;
  source_facility_id?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  last_modified_by?: string;
  version_id: number;
}

export interface ClientIdentifier {
  id: string;
  client_id: string;
  identifier_type: string;
  identifier_value: string;
  assigning_authority?: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  issue_date?: string;
  expiry_date?: string;
  confidence: IdentifierConfidence;
  verified_at?: string;
  verified_by?: string;
  verification_method?: string;
  source_system?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ClientRelationship {
  id: string;
  client_id: string;
  related_client_id?: string;
  related_person_name?: string;
  related_person_phone?: string;
  relationship_type: ClientRelationshipType;
  relationship_description?: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  legal_relevance: boolean;
  consent_relevance: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ClientDuplicateQueue {
  id: string;
  client_a_id: string;
  client_b_id: string;
  match_score: number;
  match_method?: string;
  match_reasons?: Record<string, unknown>[];
  status: 'pending' | 'reviewing' | 'confirmed_duplicate' | 'not_duplicate' | 'merged';
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  surviving_client_id?: string;
  merged_at?: string;
  merged_by?: string;
  created_at: string;
  // Joined data
  client_a?: ClientRecord;
  client_b?: ClientRecord;
}

export interface ClientMergeHistory {
  id: string;
  surviving_client_id: string;
  merged_client_id: string;
  merged_client_health_id: string;
  merged_data: Record<string, unknown>;
  identifiers_transferred?: Record<string, unknown>[];
  relationships_transferred?: Record<string, unknown>[];
  merge_reason?: string;
  merge_method?: string;
  merged_at: string;
  merged_by?: string;
  can_unmerge: boolean;
  unmerged_at?: string;
  unmerged_by?: string;
}

export interface ClientMatchingRule {
  id: string;
  rule_name: string;
  rule_type: 'deterministic' | 'probabilistic';
  fields: string[];
  weights?: Record<string, number>;
  threshold?: number;
  is_active: boolean;
  priority: number;
  version: number;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ClientRegistryEvent {
  id: string;
  event_type: string;
  client_id: string;
  health_id: string;
  event_data?: Record<string, unknown>;
  processed_by_shr: boolean;
  processed_by_consent: boolean;
  processed_by_iam: boolean;
  processed_by_ndr: boolean;
  created_at: string;
}

// UI State types
export interface ClientRegistryCounts {
  total: number;
  draft: number;
  active: number;
  inactive: number;
  deceased: number;
  merged: number;
  duplicates: number;
}

export const LIFECYCLE_STATE_LABELS: Record<ClientLifecycleState, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
  deceased: 'Deceased',
  merged: 'Merged',
};

export const LIFECYCLE_STATE_COLORS: Record<ClientLifecycleState, string> = {
  draft: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-800',
  deceased: 'bg-slate-100 text-slate-800',
  merged: 'bg-purple-100 text-purple-800',
};

export const IDENTIFIER_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  birth_registration: 'Birth Certificate',
  facility_mrn: 'Facility MRN',
  programme_id: 'Programme ID',
  insurance_id: 'Insurance ID',
  drivers_license: "Driver's License",
};

export const RELATIONSHIP_TYPE_LABELS: Record<ClientRelationshipType, string> = {
  mother: 'Mother',
  father: 'Father',
  guardian: 'Guardian',
  caregiver: 'Caregiver',
  spouse: 'Spouse',
  child: 'Child',
  sibling: 'Sibling',
  proxy: 'Proxy',
  next_of_kin: 'Next of Kin',
  emergency_contact: 'Emergency Contact',
};

export const CONFIDENCE_LABELS: Record<IdentifierConfidence, string> = {
  verified: 'Verified',
  self_reported: 'Self-Reported',
  derived: 'Derived',
  uncertain: 'Uncertain',
};

export const CONFIDENCE_COLORS: Record<IdentifierConfidence, string> = {
  verified: 'bg-emerald-100 text-emerald-800',
  self_reported: 'bg-blue-100 text-blue-800',
  derived: 'bg-amber-100 text-amber-800',
  uncertain: 'bg-red-100 text-red-800',
};
