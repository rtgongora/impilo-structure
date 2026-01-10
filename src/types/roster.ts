// Roster and Operations Types

export type FacilityOpsMode = 'simple' | 'standard' | 'advanced';
export type ShiftType = 'am' | 'pm' | 'night' | 'on_call' | 'full_day' | 'custom';
export type RosterStatus = 'draft' | 'published' | 'archived';
export type ShiftAssignmentStatus = 'scheduled' | 'confirmed' | 'started' | 'completed' | 'cancelled' | 'no_show';
export type CoverRequestStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type OperationalRole = 'roster_supervisor' | 'shift_lead' | 'facility_ops_manager' | 'virtual_pool_supervisor' | 'department_head';
export type PoolType = 'telecare' | 'triage' | 'on_call' | 'hotline';

export interface FacilityOperationsConfig {
  id: string;
  facility_id: string;
  ops_mode: FacilityOpsMode;
  auto_assign_workspace_by_cadre: boolean;
  default_clinical_workspace_id: string | null;
  default_admin_workspace_id: string | null;
  roster_required: boolean;
  allow_unrostered_login: boolean;
  allow_self_start_shift: boolean;
  require_supervisor_approval_for_cover: boolean;
  min_coverage_enabled: boolean;
  coverage_alert_threshold: number;
  virtual_care_enabled: boolean;
  virtual_care_facility_anchored: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftDefinition {
  id: string;
  facility_id: string;
  name: string;
  code: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  crosses_midnight: boolean;
  duration_hours: number;
  break_minutes: number;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RosterPlan {
  id: string;
  facility_id: string;
  name: string;
  period_start: string;
  period_end: string;
  status: RosterStatus;
  published_at: string | null;
  published_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ShiftAssignment {
  id: string;
  roster_plan_id: string;
  provider_id: string;
  assignment_date: string;
  shift_definition_id: string;
  workspace_id: string | null;
  pool_id: string | null;
  assigned_role: string | null;
  status: ShiftAssignmentStatus;
  confirmed_at: string | null;
  confirmed_by: string | null;
  original_provider_id: string | null;
  swap_reason: string | null;
  swap_approved_by: string | null;
  swap_approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_by: string | null;
}

export interface CoverRequest {
  id: string;
  facility_id: string;
  requester_id: string;
  workspace_id: string | null;
  pool_id: string | null;
  shift_definition_id: string | null;
  cover_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  status: CoverRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  temporary_assignment_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalSupervisor {
  id: string;
  user_id: string;
  provider_id: string | null;
  facility_id: string;
  department: string | null;
  operational_role: OperationalRole;
  can_manage_roster: boolean;
  can_approve_cover: boolean;
  can_approve_swaps: boolean;
  can_override_assignments: boolean;
  can_manage_virtual_pools: boolean;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoverageRule {
  id: string;
  facility_id: string;
  workspace_id: string | null;
  pool_id: string | null;
  shift_definition_id: string | null;
  min_staff_count: number;
  required_cadres: string[];
  applies_to_days: number[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VirtualPool {
  id: string;
  name: string;
  description: string | null;
  pool_type: string;
  anchor_facility_id: string | null;
  managing_entity: string | null;
  service_tags: string[];
  operating_hours: Record<string, { start: string; end: string }> | null;
  is_24_7: boolean;
  sla_first_response_minutes: number;
  sla_resolution_hours: number;
  escalation_rules: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PoolMembership {
  id: string;
  pool_id: string;
  provider_id: string;
  pool_role: 'staff' | 'supervisor' | 'manager';
  can_self_assign: boolean;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  assigned_by: string | null;
  assigned_at: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoolCaseAssignment {
  id: string;
  pool_id: string;
  patient_id: string | null;
  encounter_id: string | null;
  case_type: string;
  assigned_to: string | null;
  assigned_at: string;
  assigned_by: string | null;
  sla_deadline: string | null;
  first_response_at: string | null;
  status: string;
  priority: string;
  completed_at: string | null;
  completed_by: string | null;
  resolution_notes: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  handover_from: string | null;
  handover_notes: string | null;
  created_at: string;
  updated_at: string;
}

// UI-specific types
export interface RosterCalendarDay {
  date: string;
  dayOfWeek: number;
  assignments: ShiftAssignment[];
  coverageStatus: 'adequate' | 'warning' | 'critical';
}

export interface OnDutyStaff {
  provider_id: string;
  provider_name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  pool_id: string | null;
  pool_name: string | null;
  shift_name: string;
  shift_type: ShiftType;
  started_at: string;
  is_late: boolean;
}

export interface CoverageGap {
  workspace_id: string;
  workspace_name: string;
  date: string;
  shift_type: ShiftType;
  required_staff: number;
  assigned_staff: number;
  missing_cadres: string[];
}
