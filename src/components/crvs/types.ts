// CRVS Types
export type NotificationStatus = 'draft' | 'submitted' | 'verified' | 'registered' | 'rejected';
export type NotificationSource = 'facility' | 'community' | 'client_portal';
export type NotifierRole = 'health_worker' | 'community_health_worker' | 'family_member' | 'traditional_leader' | 'police' | 'other';
export type BirthPlurality = 'singleton' | 'twin' | 'triplet' | 'quadruplet' | 'higher';
export type CauseOfDeathType = 'mccd' | 'verbal_autopsy' | 'coroner_report' | 'unknown';
export type CertificateType = 'birth' | 'death';
export type VerbalAutopsyMethod = 'who_2022' | 'phmrc' | 'interva5' | 'custom';

export interface BirthNotification {
  id: string;
  notification_number: string;
  status: NotificationStatus;
  source: NotificationSource;
  
  // Child info
  child_given_names?: string;
  child_family_name?: string;
  child_sex: string;
  date_of_birth: string;
  time_of_birth?: string;
  is_date_estimated?: boolean;
  birth_weight_grams?: number;
  plurality?: BirthPlurality;
  birth_order?: number;
  
  // Mother info
  mother_given_names: string;
  mother_family_name: string;
  mother_maiden_name?: string;
  mother_date_of_birth?: string;
  mother_national_id?: string;
  mother_age_at_birth?: number;
  mother_residence_province?: string;
  mother_residence_district?: string;
  
  // Father info
  father_given_names?: string;
  father_family_name?: string;
  father_national_id?: string;
  father_acknowledged?: boolean;
  
  // Birth location
  facility_id?: string;
  facility_ward?: string;
  facility_room?: string;
  community_province?: string;
  community_district?: string;
  community_ward?: string;
  community_village?: string;
  
  // Notifier
  notifier_role: NotifierRole;
  notifier_name: string;
  notifier_contact?: string;
  
  // Late registration
  is_late_registration?: boolean;
  late_registration_reason?: string;
  
  // Dates
  created_at: string;
  submitted_at?: string;
  verified_at?: string;
  registered_at?: string;
  registration_number?: string;
}

export interface DeathNotification {
  id: string;
  notification_number: string;
  status: NotificationStatus;
  source: NotificationSource;
  
  // Deceased info
  deceased_given_names: string;
  deceased_family_name: string;
  deceased_sex: string;
  deceased_date_of_birth?: string;
  deceased_national_id?: string;
  deceased_age_at_death?: number;
  deceased_occupation?: string;
  deceased_marital_status?: string;
  
  // Death info
  date_of_death: string;
  time_of_death?: string;
  is_date_estimated?: boolean;
  manner_of_death?: string;
  
  // Death location
  place_of_death?: string;
  facility_id?: string;
  death_geo_lat?: number;
  death_geo_lng?: number;
  
  // Cause of death
  cause_of_death_type: CauseOfDeathType;
  mccd_id?: string;
  verbal_autopsy_id?: string;
  primary_cause_of_death?: string;
  secondary_causes?: string[];
  
  // Informant
  informant_name?: string;
  informant_relationship?: string;
  informant_contact?: string;
  
  // Disposal
  disposal_method?: string;
  burial_permit_issued?: boolean;
  burial_permit_number?: string;
  
  // Dates
  created_at: string;
  submitted_at?: string;
  verified_at?: string;
  registered_at?: string;
  registration_number?: string;
}

export interface MCCDRecord {
  id: string;
  death_notification_id: string;
  certifying_physician_id?: string;
  certifying_physician_name: string;
  certifying_physician_qualification?: string;
  certification_date: string;
  
  // ICD Codes
  immediate_cause_code?: string;
  immediate_cause_description?: string;
  antecedent_cause_1_code?: string;
  antecedent_cause_1_description?: string;
  antecedent_cause_2_code?: string;
  antecedent_cause_2_description?: string;
  underlying_cause_code?: string;
  underlying_cause_description?: string;
  
  // Contributing conditions
  contributing_conditions?: string;
  was_surgery_performed?: boolean;
  surgery_date?: string;
  was_autopsy_performed?: boolean;
  autopsy_findings_available?: boolean;
  
  // For maternal deaths
  was_pregnant?: boolean;
  pregnancy_contribution?: string;
  
  // For infant deaths
  was_multiple_pregnancy?: boolean;
  stillborn?: boolean;
  birth_weight_grams?: number;
  
  status: 'draft' | 'signed' | 'amended';
}

export interface VerbalAutopsyRecord {
  id: string;
  death_notification_id: string;
  va_method: VerbalAutopsyMethod;
  interview_date: string;
  interviewer_name: string;
  
  respondent_name: string;
  respondent_relationship: string;
  
  symptoms_data: Record<string, unknown>;
  algorithm_result?: Record<string, unknown>;
  physician_coded_cause?: string;
  final_cause_of_death?: string;
  
  status: 'pending_interview' | 'interview_complete' | 'algorithm_processed' | 'physician_reviewed' | 'finalized';
}

export interface RegistrarQueueItem {
  id: string;
  notification_type: CertificateType;
  notification_id: string;
  notification_number: string;
  priority: number;
  status: 'pending_review' | 'under_review' | 'requires_correction' | 'approved' | 'rejected';
  assigned_to?: string;
  registrar_notes?: string;
  created_at: string;
}

export interface CRVSCertificate {
  id: string;
  certificate_type: CertificateType;
  certificate_number: string;
  notification_id?: string;
  registration_number: string;
  issued_at: string;
  issued_by?: string;
  is_reissue: boolean;
  reissue_count: number;
  valid_until?: string;
  revoked_at?: string;
}

export interface QualityFlag {
  id: string;
  entity_type: 'birth_notification' | 'death_notification' | 'mccd' | 'verbal_autopsy';
  entity_id: string;
  flag_type: string;
  flag_code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  auto_resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

// Zimbabwe-specific fields
export interface ZimbabweAddressFields {
  province: string;
  district: string;
  ward?: string;
  village?: string;
  street_address?: string;
}

export const ZIMBABWE_PROVINCES = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands'
] as const;

export const MANNER_OF_DEATH = [
  'natural',
  'accident',
  'suicide',
  'homicide',
  'pending_investigation',
  'undetermined'
] as const;

export const PLACE_OF_DEATH = [
  'hospital',
  'clinic',
  'home',
  'on_route_to_facility',
  'other'
] as const;
