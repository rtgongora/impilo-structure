// Above-Site Roles Type Definitions
// Implements AS-FR-01, AS-FR-02, AS-CTX-01

export type AboveSiteRoleType =
  | 'district_medical_officer'
  | 'district_health_executive'
  | 'provincial_health_executive'
  | 'national_programme_manager'
  | 'telecare_operations_manager'
  | 'radiology_network_manager'
  | 'lab_network_manager'
  | 'digital_health_manager'
  | 'quality_assurance_officer'
  | 'regulator_inspector';

export type JurisdictionLevel =
  | 'facility_list'
  | 'district'
  | 'province'
  | 'national'
  | 'virtual_services'
  | 'programme';

export type AboveSiteContextType =
  | 'district_overview'
  | 'provincial_operations'
  | 'national_operations'
  | 'programme_operations'
  | 'telecare_operations'
  | 'network_operations';

export type InterventionType =
  | 'staff_redeployment'
  | 'coverage_approval'
  | 'queue_escalation'
  | 'virtual_pool_authorization'
  | 'facility_override'
  | 'emergency_response';

export interface AboveSiteRole {
  id: string;
  user_id: string;
  role_type: AboveSiteRoleType;
  title: string;
  description: string | null;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  can_access_patient_data: boolean;
  can_intervene: boolean;
  can_act_as: boolean;
  created_at: string;
  updated_at: string;
}

export interface JurisdictionAssignment {
  id: string;
  above_site_role_id: string;
  jurisdiction_level: JurisdictionLevel;
  facility_ids: string[];
  district_codes: string[];
  province_codes: string[];
  programme_code: string | null;
  programme_name: string | null;
  virtual_pool_ids: string[];
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export interface AboveSiteSession {
  id: string;
  user_id: string;
  above_site_role_id: string;
  context_type: AboveSiteContextType;
  context_label: string;
  selected_province: string | null;
  selected_district: string | null;
  selected_programme: string | null;
  selected_facility_id: string | null;
  is_acting_as: boolean;
  acting_as_workspace_id: string | null;
  acting_as_reason: string | null;
  acting_as_started_at: string | null;
  acting_as_expires_at: string | null;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

export interface AboveSiteIntervention {
  id: string;
  session_id: string;
  user_id: string;
  intervention_type: InterventionType;
  title: string;
  description: string | null;
  target_facility_id: string | null;
  target_workspace_id: string | null;
  target_provider_id: string | null;
  target_pool_id: string | null;
  action_data: Record<string, unknown>;
  reason: string;
  is_approved: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  is_reversible: boolean;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
  created_at: string;
  expires_at: string | null;
}

// Context options for above-site users
export interface ContextOption {
  type: AboveSiteContextType;
  label: string;
  description: string;
  icon: string;
  scope?: {
    level: JurisdictionLevel;
    value?: string;
  };
}

// Labels and metadata
export const ABOVE_SITE_ROLE_LABELS: Record<AboveSiteRoleType, string> = {
  district_medical_officer: 'District Medical Officer',
  district_health_executive: 'District Health Executive',
  provincial_health_executive: 'Provincial Health Executive',
  national_programme_manager: 'National Programme Manager',
  telecare_operations_manager: 'Telecare Operations Manager',
  radiology_network_manager: 'Radiology Network Manager',
  lab_network_manager: 'Lab Network Manager',
  digital_health_manager: 'Digital Health Manager',
  quality_assurance_officer: 'Quality Assurance Officer',
  regulator_inspector: 'Regulator / Inspector',
};

export const JURISDICTION_LEVEL_LABELS: Record<JurisdictionLevel, string> = {
  facility_list: 'Specific Facilities',
  district: 'District',
  province: 'Province',
  national: 'National',
  virtual_services: 'Virtual Services',
  programme: 'Programme',
};

export const CONTEXT_TYPE_LABELS: Record<AboveSiteContextType, { label: string; description: string; icon: string }> = {
  district_overview: {
    label: 'District Overview',
    description: 'View and manage all facilities in your district',
    icon: 'building-2',
  },
  provincial_operations: {
    label: 'Provincial Operations',
    description: 'Provincial-level oversight and coordination',
    icon: 'map',
  },
  national_operations: {
    label: 'National Operations',
    description: 'National-level monitoring and management',
    icon: 'globe',
  },
  programme_operations: {
    label: 'Programme Operations',
    description: 'Programme-specific monitoring (HIV, TB, MNCH, etc.)',
    icon: 'heart-pulse',
  },
  telecare_operations: {
    label: 'Telecare Operations',
    description: 'Virtual care pool management and oversight',
    icon: 'video',
  },
  network_operations: {
    label: 'Network Operations',
    description: 'Lab/Radiology network management',
    icon: 'network',
  },
};

export const INTERVENTION_TYPE_LABELS: Record<InterventionType, { label: string; description: string }> = {
  staff_redeployment: {
    label: 'Staff Redeployment',
    description: 'Request or approve temporary staff movement between facilities',
  },
  coverage_approval: {
    label: 'Coverage Approval',
    description: 'Approve temporary coverage or shift changes',
  },
  queue_escalation: {
    label: 'Queue Escalation',
    description: 'Escalate a queue to a higher-capacity facility',
  },
  virtual_pool_authorization: {
    label: 'Virtual Pool Authorization',
    description: 'Authorize additional virtual pool coverage',
  },
  facility_override: {
    label: 'Facility Override',
    description: 'Override facility-level restrictions (with audit)',
  },
  emergency_response: {
    label: 'Emergency Response',
    description: 'Initiate emergency response protocols',
  },
};
