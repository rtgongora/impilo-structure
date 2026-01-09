/**
 * Registry Management Types
 * Types for managing HIE registries with approval workflows
 */

export type RegistryRole = 
  | 'client_registry_admin'
  | 'provider_registry_admin'
  | 'facility_registry_admin'
  | 'terminology_admin'
  | 'shr_admin'
  | 'ndr_admin'
  | 'registry_super_admin';

export type RegistryRecordStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export type RegistryType = 
  | 'client'
  | 'provider'
  | 'facility'
  | 'terminology'
  | 'shr'
  | 'ndr';

export interface RegistryAdminRole {
  id: string;
  user_id: string;
  registry_role: RegistryRole;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface ClientRegistryRecord {
  id: string;
  patient_id: string | null;
  impilo_id: string | null;
  client_registry_id: string | null;
  shr_id: string | null;
  mosip_uin: string | null;
  first_name: string;
  last_name: string;
  other_names: string | null;
  date_of_birth: string;
  gender: string;
  national_id: string | null;
  passport_number: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  province: string | null;
  country: string;
  biometric_enrolled: boolean;
  status: RegistryRecordStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProviderRegistryRecord {
  id: string;
  user_id: string | null;
  provider_id: string | null;
  first_name: string;
  last_name: string;
  other_names: string | null;
  date_of_birth: string | null;
  gender: string | null;
  national_id: string | null;
  role: string;
  specialty: string | null;
  department: string | null;
  facility_id: string | null;
  license_number: string | null;
  license_expiry: string | null;
  license_issuing_body: string | null;
  qualification: string | null;
  qualification_institution: string | null;
  qualification_year: number | null;
  phone: string | null;
  email: string;
  work_phone: string | null;
  biometric_enrolled: boolean;
  status: RegistryRecordStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FacilityRegistryRecord {
  id: string;
  facility_id: string | null;
  thuso_id: string | null;
  name: string;
  facility_type: string;
  level: string;
  ownership: string | null;
  address_line1: string | null;
  city: string | null;
  district: string | null;
  province: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  operating_hours: string | null;
  bed_count: number | null;
  staff_count: number | null;
  services_offered: string[] | null;
  status: RegistryRecordStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface RegistryAuditLog {
  id: string;
  registry_type: RegistryType;
  record_id: string;
  action: string;
  old_status: RegistryRecordStatus | null;
  new_status: RegistryRecordStatus | null;
  changes: Record<string, unknown> | null;
  notes: string | null;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export const REGISTRY_STATUS_LABELS: Record<RegistryRecordStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

export const REGISTRY_STATUS_COLORS: Record<RegistryRecordStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  deactivated: 'bg-muted text-muted-foreground',
};

export const REGISTRY_ROLE_LABELS: Record<RegistryRole, string> = {
  client_registry_admin: 'Client Registry Admin',
  provider_registry_admin: 'Provider Registry Admin',
  facility_registry_admin: 'Facility Registry Admin',
  terminology_admin: 'Terminology Admin',
  shr_admin: 'SHR Admin',
  ndr_admin: 'NDR Admin',
  registry_super_admin: 'Registry Super Admin',
};

export const REGISTRY_TYPE_LABELS: Record<RegistryType, string> = {
  client: 'Client Registry (MOSIP)',
  provider: 'Provider Registry (Varapi)',
  facility: 'Facility Registry (Thuso)',
  terminology: 'Terminology Service',
  shr: 'Shared Health Record',
  ndr: 'National Data Repository',
};
