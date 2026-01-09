/**
 * Facility Registry Types
 * OpenHIE/GOFR/WHO MFL compliant type definitions
 */

export type FacilityWorkflowStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type OperationalStatus = 
  | 'planned'
  | 'operational'
  | 'temporarily_closed'
  | 'permanently_closed'
  | 'merged'
  | 'split';

export type ChangeRequestType = 
  | 'create'
  | 'update'
  | 'deactivate'
  | 'merge'
  | 'split';

export type ChangeRequestStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'clarification_needed'
  | 'approved'
  | 'rejected'
  | 'published';

export type ReconciliationMatchStatus = 
  | 'pending'
  | 'confirmed_match'
  | 'confirmed_new'
  | 'rejected';

export interface FacilityAdminHierarchy {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  level: number;
  level_name: string;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: Record<string, unknown> | null;
  population: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  level_of_care: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityOwnershipType {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FacilityServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Facility {
  id: string;
  facility_code: string | null;
  legacy_code: string | null;
  dhis2_uid: string | null;
  gofr_id: string | null;
  name: string;
  short_name: string | null;
  facility_type: string | null;
  facility_type_id: string | null;
  ownership_type_id: string | null;
  level: string | null;
  admin_hierarchy_id: string | null;
  address_line1: string | null;
  physical_address: string | null;
  postal_address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  phone: string | null;
  phone_alt: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  operational_status: OperationalStatus;
  status_effective_date: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  is_24hr: boolean;
  has_electricity: boolean | null;
  has_water: boolean | null;
  has_internet: boolean | null;
  bed_count: number | null;
  cot_count: number | null;
  managing_org_name: string | null;
  managing_org_contact: string | null;
  license_number: string | null;
  license_expiry: string | null;
  accreditation_status: string | null;
  accreditation_body: string | null;
  record_date: string | null;
  data_source: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  workflow_status: FacilityWorkflowStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  published_at: string | null;
  published_by: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_modified_by: string | null;
  // Joined data
  facility_type_data?: FacilityType;
  ownership_type_data?: FacilityOwnershipType;
  admin_hierarchy_data?: FacilityAdminHierarchy;
}

export interface FacilityService {
  id: string;
  facility_id: string;
  service_category_id: string | null;
  service_name: string;
  is_available: boolean;
  availability_notes: string | null;
  operating_days: string | null;
  operating_hours: string | null;
  capacity: number | null;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service_category?: FacilityServiceCategory;
}

export interface FacilityIdentifier {
  id: string;
  facility_id: string;
  identifier_type: string;
  identifier_value: string;
  source_system: string | null;
  is_primary: boolean;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export interface FacilityChangeRequest {
  id: string;
  facility_id: string | null;
  request_type: ChangeRequestType;
  title: string;
  description: string | null;
  justification: string | null;
  proposed_changes: Record<string, { old: unknown; new: unknown }> | null;
  merge_source_ids: string[] | null;
  split_target_count: number | null;
  status: ChangeRequestStatus;
  priority: string;
  attachments: Array<{ name: string; url: string; type: string; uploaded_at: string }> | null;
  submitted_at: string | null;
  submitted_by: string | null;
  assigned_to: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_comments: string | null;
  clarification_request: string | null;
  clarification_response: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FacilityReconciliationSource {
  id: string;
  name: string;
  source_type: string;
  description: string | null;
  connection_config: Record<string, unknown> | null;
  field_mapping: Record<string, string> | null;
  last_sync_at: string | null;
  sync_frequency: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface FacilityReconciliationJob {
  id: string;
  source_id: string | null;
  job_type: string;
  status: string;
  total_records: number;
  processed_records: number;
  matched_records: number;
  new_records: number;
  updated_records: number;
  error_records: number;
  errors: unknown[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface FacilityReconciliationMatch {
  id: string;
  job_id: string;
  source_record: Record<string, unknown>;
  candidate_facility_id: string | null;
  match_score: number | null;
  match_reasons: Array<{ field: string; reason: string; score: number }> | null;
  status: ReconciliationMatchStatus;
  decision_by: string | null;
  decision_at: string | null;
  decision_notes: string | null;
  created_at: string;
  // Joined data
  candidate_facility?: Facility;
}

export interface FacilityRegistryRole {
  id: string;
  user_id: string;
  role: string;
  scope_type: string | null;
  scope_id: string | null;
  can_create: boolean;
  can_edit: boolean;
  can_validate: boolean;
  can_approve: boolean;
  can_publish: boolean;
  can_reconcile: boolean;
  is_active: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
}

// Status labels and colors
export const FACILITY_WORKFLOW_STATUS_LABELS: Record<FacilityWorkflowStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const FACILITY_WORKFLOW_STATUS_COLORS: Record<FacilityWorkflowStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  planned: 'Planned',
  operational: 'Operational',
  temporarily_closed: 'Temporarily Closed',
  permanently_closed: 'Permanently Closed',
  merged: 'Merged',
  split: 'Split',
};

export const OPERATIONAL_STATUS_COLORS: Record<OperationalStatus, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  operational: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  temporarily_closed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  permanently_closed: 'bg-muted text-muted-foreground',
  merged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  split: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  clarification_needed: 'Clarification Needed',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
};

export const LEVEL_OF_CARE_LABELS: Record<string, string> = {
  primary: 'Primary Care',
  secondary: 'Secondary Care',
  tertiary: 'Tertiary Care',
  quaternary: 'Quaternary Care',
};
