import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export type FacilityOpsMode = 'simple' | 'standard' | 'advanced';
export type ShiftType = 'am' | 'pm' | 'night' | 'on_call' | 'full_day' | 'custom';
export type RosterStatus = 'draft' | 'published' | 'archived';
export type ShiftAssignmentStatus = 'scheduled' | 'confirmed' | 'started' | 'completed' | 'cancelled' | 'no_show';
export type CoverRequestStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type OperationalRole = 'roster_supervisor' | 'shift_lead' | 'facility_ops_manager' | 'virtual_pool_supervisor' | 'department_head';

export interface FacilityOpsConfig {
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
  notes: string | null;
  // Joined data
  provider_name?: string;
  shift_name?: string;
  shift_type?: ShiftType;
  workspace_name?: string;
  pool_name?: string;
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
  created_at: string;
  // Joined data
  requester_name?: string;
  workspace_name?: string;
  pool_name?: string;
}

export interface TodaysRosterAssignment {
  assignment_id: string;
  shift_name: string;
  shift_type_val: ShiftType;
  start_time: string;
  end_time: string;
  workspace_id: string | null;
  workspace_name: string | null;
  pool_id: string | null;
  pool_name: string | null;
}

export function useRosterData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch facility operations config
  const fetchFacilityOpsConfig = useCallback(async (facilityId: string): Promise<FacilityOpsConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('facility_operations_config')
        .select('*')
        .eq('facility_id', facilityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching facility ops config:', error);
        return null;
      }

      return data as FacilityOpsConfig | null;
    } catch (error) {
      console.error('Error fetching facility ops config:', error);
      return null;
    }
  }, []);

  // Fetch shift definitions for a facility
  const fetchShiftDefinitions = useCallback(async (facilityId: string): Promise<ShiftDefinition[]> => {
    try {
      const { data, error } = await supabase
        .from('shift_definitions')
        .select('*')
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching shift definitions:', error);
        return [];
      }

      return (data || []) as ShiftDefinition[];
    } catch (error) {
      console.error('Error fetching shift definitions:', error);
      return [];
    }
  }, []);

  // Fetch roster plans for a facility
  const fetchRosterPlans = useCallback(async (facilityId: string, status?: RosterStatus): Promise<RosterPlan[]> => {
    try {
      let query = supabase
        .from('roster_plans')
        .select('*')
        .eq('facility_id', facilityId)
        .order('period_start', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching roster plans:', error);
        return [];
      }

      return (data || []) as RosterPlan[];
    } catch (error) {
      console.error('Error fetching roster plans:', error);
      return [];
    }
  }, []);

  // Fetch shift assignments for a roster plan
  const fetchShiftAssignments = useCallback(async (
    rosterPlanId: string,
    date?: string
  ): Promise<ShiftAssignment[]> => {
    try {
      let query = supabase
        .from('shift_assignments')
        .select(`
          *,
          providers:provider_id (full_name),
          shift_definitions:shift_definition_id (name, shift_type),
          workspaces:workspace_id (name),
          virtual_pools:pool_id (name)
        `)
        .eq('roster_plan_id', rosterPlanId)
        .order('assignment_date');

      if (date) {
        query = query.eq('assignment_date', date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching shift assignments:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        provider_name: item.providers?.full_name,
        shift_name: item.shift_definitions?.name,
        shift_type: item.shift_definitions?.shift_type,
        workspace_name: item.workspaces?.name,
        pool_name: item.virtual_pools?.name,
      })) as ShiftAssignment[];
    } catch (error) {
      console.error('Error fetching shift assignments:', error);
      return [];
    }
  }, []);

  // Get today's roster assignment for current user
  const fetchTodaysAssignment = useCallback(async (facilityId?: string): Promise<TodaysRosterAssignment | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase.rpc('get_todays_roster_assignment', {
        _user_id: user.id,
        _facility_id: facilityId || null
      });

      if (error) {
        console.error('Error fetching today\'s assignment:', error);
        return null;
      }

      return data?.[0] as TodaysRosterAssignment | null;
    } catch (error) {
      console.error('Error fetching today\'s assignment:', error);
      return null;
    }
  }, [user?.id]);

  // Check if user is an operational supervisor
  const checkIsSupervisor = useCallback(async (facilityId?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('is_operational_supervisor', {
        _user_id: user.id,
        _facility_id: facilityId || null
      });

      if (error) {
        console.error('Error checking supervisor status:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking supervisor status:', error);
      return false;
    }
  }, [user?.id]);

  // Create a roster plan
  const createRosterPlan = useCallback(async (
    facilityId: string,
    name: string,
    periodStart: string,
    periodEnd: string,
    notes?: string
  ): Promise<RosterPlan | null> => {
    if (!user?.id) return null;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('roster_plans')
        .insert({
          facility_id: facilityId,
          name,
          period_start: periodStart,
          period_end: periodEnd,
          notes,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating roster plan:', error);
        toast.error('Failed to create roster plan');
        return null;
      }

      toast.success('Roster plan created');
      return data as RosterPlan;
    } catch (error) {
      console.error('Error creating roster plan:', error);
      toast.error('Failed to create roster plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Publish a roster plan
  const publishRosterPlan = useCallback(async (rosterPlanId: string): Promise<boolean> => {
    if (!user?.id) return false;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('roster_plans')
        .update({
          status: 'published' as RosterStatus,
          published_at: new Date().toISOString(),
          published_by: user.id
        })
        .eq('id', rosterPlanId);

      if (error) {
        console.error('Error publishing roster plan:', error);
        toast.error('Failed to publish roster plan');
        return false;
      }

      toast.success('Roster plan published');
      return true;
    } catch (error) {
      console.error('Error publishing roster plan:', error);
      toast.error('Failed to publish roster plan');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create shift assignment
  const createShiftAssignment = useCallback(async (
    rosterPlanId: string,
    providerId: string,
    assignmentDate: string,
    shiftDefinitionId: string,
    workspaceId?: string,
    poolId?: string,
    assignedRole?: string
  ): Promise<ShiftAssignment | null> => {
    if (!user?.id) return null;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('shift_assignments')
        .insert({
          roster_plan_id: rosterPlanId,
          provider_id: providerId,
          assignment_date: assignmentDate,
          shift_definition_id: shiftDefinitionId,
          workspace_id: workspaceId || null,
          pool_id: poolId || null,
          assigned_role: assignedRole || null,
          assigned_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating shift assignment:', error);
        toast.error('Failed to create shift assignment');
        return null;
      }

      toast.success('Shift assignment created');
      return data as ShiftAssignment;
    } catch (error) {
      console.error('Error creating shift assignment:', error);
      toast.error('Failed to create shift assignment');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch cover requests
  const fetchCoverRequests = useCallback(async (
    facilityId: string,
    status?: CoverRequestStatus
  ): Promise<CoverRequest[]> => {
    try {
      let query = supabase
        .from('cover_requests')
        .select(`
          *,
          providers:requester_id (full_name),
          workspaces:workspace_id (name),
          virtual_pools:pool_id (name)
        `)
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cover requests:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        requester_name: item.providers?.full_name,
        workspace_name: item.workspaces?.name,
        pool_name: item.virtual_pools?.name,
      })) as CoverRequest[];
    } catch (error) {
      console.error('Error fetching cover requests:', error);
      return [];
    }
  }, []);

  // Create cover request
  const createCoverRequest = useCallback(async (
    facilityId: string,
    providerId: string,
    coverDate: string,
    reason: string,
    workspaceId?: string,
    poolId?: string,
    shiftDefinitionId?: string,
    startTime?: string,
    endTime?: string
  ): Promise<CoverRequest | null> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('cover_requests')
        .insert({
          facility_id: facilityId,
          requester_id: providerId,
          cover_date: coverDate,
          reason,
          workspace_id: workspaceId || null,
          pool_id: poolId || null,
          shift_definition_id: shiftDefinitionId || null,
          start_time: startTime || null,
          end_time: endTime || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating cover request:', error);
        toast.error('Failed to create cover request');
        return null;
      }

      toast.success('Cover request submitted');
      return data as CoverRequest;
    } catch (error) {
      console.error('Error creating cover request:', error);
      toast.error('Failed to create cover request');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve/deny cover request
  const reviewCoverRequest = useCallback(async (
    requestId: string,
    approved: boolean,
    reviewNotes?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('cover_requests')
        .update({
          status: approved ? 'approved' as CoverRequestStatus : 'denied' as CoverRequestStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error reviewing cover request:', error);
        toast.error('Failed to review cover request');
        return false;
      }

      toast.success(approved ? 'Cover request approved' : 'Cover request denied');
      return true;
    } catch (error) {
      console.error('Error reviewing cover request:', error);
      toast.error('Failed to review cover request');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    loading,
    fetchFacilityOpsConfig,
    fetchShiftDefinitions,
    fetchRosterPlans,
    fetchShiftAssignments,
    fetchTodaysAssignment,
    checkIsSupervisor,
    createRosterPlan,
    publishRosterPlan,
    createShiftAssignment,
    fetchCoverRequests,
    createCoverRequest,
    reviewCoverRequest
  };
}
