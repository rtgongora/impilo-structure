import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Type definitions matching the database schema
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
  workspace?: Workspace;
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
  facility_name?: string;
  workspace_name?: string;
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
  workspace_name?: string;
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

interface UseWorkspaceDataReturn {
  // Data
  workspaces: Workspace[];
  myWorkspaces: UserWorkspace[];
  activeShift: ActiveShift | null;
  shiftLogs: ShiftWorkspaceLog[];
  
  // Loading states
  loading: boolean;
  shiftLoading: boolean;
  
  // Actions
  fetchWorkspaces: (facilityId?: string) => Promise<void>;
  fetchMyWorkspaces: (facilityId?: string) => Promise<void>;
  fetchActiveShift: () => Promise<ActiveShift | null>;
  startShift: (facilityId: string, workspaceId: string) => Promise<Shift | null>;
  endShift: (handoverNotes?: string, summary?: string) => Promise<boolean>;
  transferWorkspace: (newWorkspaceId: string, reason: WorkspaceTransferReason, notes?: string) => Promise<boolean>;
  canAccessWorkspace: (workspaceId: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

export const useWorkspaceData = (): UseWorkspaceDataReturn => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [myWorkspaces, setMyWorkspaces] = useState<UserWorkspace[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [shiftLogs, setShiftLogs] = useState<ShiftWorkspaceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Fetch all workspaces for a facility
  const fetchWorkspaces = useCallback(async (facilityId?: string) => {
    try {
      let query = supabase
        .from('workspaces')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkspaces((data || []) as unknown as Workspace[]);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  }, []);

  // Fetch user's authorized workspaces using the SQL function
  const fetchMyWorkspaces = useCallback(async (facilityId?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_workspaces', { 
          _user_id: user.id,
          _facility_id: facilityId || null
        });

      if (error) throw error;
      setMyWorkspaces((data || []) as UserWorkspace[]);
    } catch (error) {
      console.error('Error fetching my workspaces:', error);
      // Fallback: fetch from table directly
      setMyWorkspaces([]);
    }
  }, [user]);

  // Fetch active shift using the SQL function
  const fetchActiveShift = useCallback(async (): Promise<ActiveShift | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_active_shift', { _user_id: user.id });

      if (error) throw error;
      
      const shift = data && data.length > 0 ? data[0] as ActiveShift : null;
      setActiveShift(shift);
      return shift;
    } catch (error) {
      console.error('Error fetching active shift:', error);
      setActiveShift(null);
      return null;
    }
  }, [user]);

  // Start a new shift
  const startShift = useCallback(async (facilityId: string, workspaceId: string): Promise<Shift | null> => {
    if (!user) return null;

    setShiftLoading(true);
    try {
      // Get provider ID for the user
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError || !providerData) {
        toast.error('Provider record not found');
        return null;
      }

      // Check for existing active shift
      const { data: existingShift } = await supabase
        .from('shifts')
        .select('id')
        .eq('provider_id', providerData.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingShift) {
        toast.error('You already have an active shift. Please end it before starting a new one.');
        return null;
      }

      // Create the shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          provider_id: providerData.id,
          facility_id: facilityId,
          current_workspace_id: workspaceId,
          status: 'active',
          start_method: 'manual'
        })
        .select()
        .single();

      if (shiftError) throw shiftError;

      // Create initial workspace log
      await supabase
        .from('shift_workspace_logs')
        .insert({
          shift_id: shift.id,
          workspace_id: workspaceId
        });

      // Log the action
      await supabase
        .from('workspace_audit_log')
        .insert({
          actor_id: user.id,
          actor_provider_id: providerData.id,
          facility_id: facilityId,
          workspace_id: workspaceId,
          action: 'shift_started',
          entity_type: 'shift',
          entity_id: shift.id,
          new_value: { status: 'active', workspace_id: workspaceId }
        });

      await fetchActiveShift();
      toast.success('Shift started successfully');
      return shift as unknown as Shift;
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
      return null;
    } finally {
      setShiftLoading(false);
    }
  }, [user, fetchActiveShift]);

  // End the current shift
  const endShift = useCallback(async (handoverNotes?: string, summary?: string): Promise<boolean> => {
    if (!user || !activeShift) return false;

    setShiftLoading(true);
    try {
      const endedAt = new Date().toISOString();
      const startedAt = new Date(activeShift.started_at);
      const durationMinutes = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60));

      // Close any open workspace log
      await supabase
        .from('shift_workspace_logs')
        .update({ 
          exited_at: endedAt,
          duration_minutes: durationMinutes
        })
        .eq('shift_id', activeShift.shift_id)
        .is('exited_at', null);

      // End the shift
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'ended',
          ended_at: endedAt,
          end_method: 'manual',
          handover_notes: handoverNotes,
          summary: summary,
          total_duration_minutes: durationMinutes
        })
        .eq('id', activeShift.shift_id);

      if (error) throw error;

      // Log the action
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase
        .from('workspace_audit_log')
        .insert({
          actor_id: user.id,
          actor_provider_id: providerData?.id,
          facility_id: activeShift.facility_id,
          workspace_id: activeShift.current_workspace_id,
          action: 'shift_ended',
          entity_type: 'shift',
          entity_id: activeShift.shift_id,
          new_value: { status: 'ended', duration_minutes: durationMinutes }
        });

      setActiveShift(null);
      toast.success('Shift ended successfully');
      return true;
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Failed to end shift');
      return false;
    } finally {
      setShiftLoading(false);
    }
  }, [user, activeShift]);

  // Transfer to a new workspace
  const transferWorkspace = useCallback(async (
    newWorkspaceId: string, 
    reason: WorkspaceTransferReason, 
    notes?: string
  ): Promise<boolean> => {
    if (!user || !activeShift) return false;

    setShiftLoading(true);
    try {
      const now = new Date().toISOString();
      const previousWorkspaceId = activeShift.current_workspace_id;

      // Close the current workspace log
      if (previousWorkspaceId) {
        await supabase
          .from('shift_workspace_logs')
          .update({ 
            exited_at: now,
            transfer_reason: reason,
            transfer_notes: notes
          })
          .eq('shift_id', activeShift.shift_id)
          .eq('workspace_id', previousWorkspaceId)
          .is('exited_at', null);
      }

      // Create new workspace log
      await supabase
        .from('shift_workspace_logs')
        .insert({
          shift_id: activeShift.shift_id,
          workspace_id: newWorkspaceId,
          transfer_reason: reason,
          transfer_notes: notes
        });

      // Update the shift's current workspace
      const { error } = await supabase
        .from('shifts')
        .update({ current_workspace_id: newWorkspaceId })
        .eq('id', activeShift.shift_id);

      if (error) throw error;

      // Log the action
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase
        .from('workspace_audit_log')
        .insert({
          actor_id: user.id,
          actor_provider_id: providerData?.id,
          facility_id: activeShift.facility_id,
          workspace_id: newWorkspaceId,
          action: 'workspace_transfer',
          entity_type: 'shift',
          entity_id: activeShift.shift_id,
          old_value: { workspace_id: previousWorkspaceId },
          new_value: { workspace_id: newWorkspaceId, reason, notes }
        });

      await fetchActiveShift();
      toast.success('Workspace transferred successfully');
      return true;
    } catch (error) {
      console.error('Error transferring workspace:', error);
      toast.error('Failed to transfer workspace');
      return false;
    } finally {
      setShiftLoading(false);
    }
  }, [user, activeShift, fetchActiveShift]);

  // Check if user can access a workspace
  const canAccessWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('can_access_workspace', { 
          _user_id: user.id,
          _workspace_id: workspaceId
        });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking workspace access:', error);
      return false;
    }
  }, [user]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWorkspaces(),
        fetchMyWorkspaces(),
        fetchActiveShift()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaces, fetchMyWorkspaces, fetchActiveShift]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    workspaces,
    myWorkspaces,
    activeShift,
    shiftLogs,
    loading,
    shiftLoading,
    fetchWorkspaces,
    fetchMyWorkspaces,
    fetchActiveShift,
    startShift,
    endShift,
    transferWorkspace,
    canAccessWorkspace,
    refreshAll
  };
};
