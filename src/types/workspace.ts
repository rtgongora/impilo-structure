// Workspace type definitions

export type WorkspaceType = 'clinical' | 'admin' | 'support';
export type WorkspaceRoleType = 'staff' | 'supervisor' | 'manager';
export type ShiftStatus = 'active' | 'ended' | 'cancelled';
export type WorkspaceTransferReason = 'rotation' | 'cover' | 'emergency' | 'break' | 'other';

export interface Workspace {
  id: string;
  facility_id: string;
  name: string;
  workspace_type: WorkspaceType;
  location_code: string | null;
  description: string | null;
  service_tags: string[];
  operating_hours: Record<string, { open: string; close: string }> | null;
  is_active: boolean;
  parent_workspace_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  provider_id: string;
  workspace_role: WorkspaceRoleType;
  can_self_assign: boolean;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface Shift {
  id: string;
  provider_id: string;
  facility_id: string;
  current_workspace_id: string | null;
  status: ShiftStatus;
  started_at: string;
  ended_at: string | null;
  start_method: string;
  end_method: string | null;
  handover_notes: string | null;
  summary: string | null;
  total_duration_minutes: number | null;
}

export interface ShiftWorkspaceLog {
  id: string;
  shift_id: string;
  workspace_id: string;
  entered_at: string;
  exited_at: string | null;
  transfer_reason: WorkspaceTransferReason | null;
  transfer_notes: string | null;
  duration_minutes: number | null;
}

export interface UserWorkspace {
  workspace_id: string;
  workspace_name: string;
  workspace_type: WorkspaceType;
  facility_id: string;
  facility_name: string;
  workspace_role: WorkspaceRoleType;
  service_tags: string[];
}

export interface ActiveShift {
  shift_id: string;
  facility_id: string;
  facility_name: string;
  current_workspace_id: string | null;
  current_workspace_name: string | null;
  started_at: string;
  duration_minutes: number;
}

// Session storage format for active workspace
export interface ActiveWorkspaceSession {
  workspace_id: string;
  workspace_name: string;
  workspace_type: WorkspaceType;
  facility_id: string;
  facility_name: string;
  shift_id: string;
  department?: string;
  login_time: string;
}
