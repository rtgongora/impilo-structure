import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VirtualPool {
  id: string;
  name: string;
  description: string | null;
  pool_type: string;
  anchor_facility_id: string | null;
  managing_entity: string | null;
  service_tags: string[];
  operating_hours: any;
  is_24_7: boolean;
  sla_first_response_minutes: number;
  sla_resolution_hours: number;
  escalation_rules: any;
  is_active: boolean;
  created_at: string;
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
  notes: string | null;
  // Joined data
  pool_name?: string;
  provider_name?: string;
}

export interface PoolCaseAssignment {
  id: string;
  pool_id: string;
  patient_id: string | null;
  encounter_id: string | null;
  case_type: string;
  assigned_to: string | null;
  assigned_at: string;
  sla_deadline: string | null;
  first_response_at: string | null;
  status: string;
  priority: string;
  completed_at: string | null;
  resolution_notes: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  // Joined data
  pool_name?: string;
  patient_name?: string;
  assigned_to_name?: string;
}

export function useVirtualPools() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch all active virtual pools
  const fetchVirtualPools = useCallback(async (facilityId?: string): Promise<VirtualPool[]> => {
    try {
      let query = supabase
        .from('virtual_pools')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (facilityId) {
        query = query.or(`anchor_facility_id.eq.${facilityId},anchor_facility_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching virtual pools:', error);
        return [];
      }

      return (data || []) as VirtualPool[];
    } catch (error) {
      console.error('Error fetching virtual pools:', error);
      return [];
    }
  }, []);

  // Fetch user's pool memberships
  const fetchMyPoolMemberships = useCallback(async (): Promise<PoolMembership[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('pool_memberships')
        .select(`
          *,
          virtual_pools:pool_id (name),
          providers:provider_id (full_name)
        `)
        .eq('is_active', true)
        .lte('effective_from', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching pool memberships:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        pool_name: item.virtual_pools?.name,
        provider_name: item.providers?.full_name,
      })) as PoolMembership[];
    } catch (error) {
      console.error('Error fetching pool memberships:', error);
      return [];
    }
  }, [user?.id]);

  // Fetch pool case assignments
  const fetchPoolCaseAssignments = useCallback(async (
    poolId: string,
    status?: string
  ): Promise<PoolCaseAssignment[]> => {
    try {
      let query = supabase
        .from('pool_case_assignments')
        .select(`
          *,
          virtual_pools:pool_id (name),
          patients:patient_id (first_name, last_name),
          providers:assigned_to (full_name)
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pool case assignments:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        pool_name: item.virtual_pools?.name,
        patient_name: item.patients ? `${item.patients.first_name} ${item.patients.last_name}` : null,
        assigned_to_name: item.providers?.full_name,
      })) as PoolCaseAssignment[];
    } catch (error) {
      console.error('Error fetching pool case assignments:', error);
      return [];
    }
  }, []);

  // Create virtual pool
  const createVirtualPool = useCallback(async (
    name: string,
    poolType: string,
    description?: string,
    anchorFacilityId?: string,
    managingEntity?: string,
    serviceTags?: string[],
    is24_7?: boolean,
    slaFirstResponse?: number,
    slaResolution?: number
  ): Promise<VirtualPool | null> => {
    if (!user?.id) return null;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('virtual_pools')
        .insert({
          name,
          pool_type: poolType,
          description: description || null,
          anchor_facility_id: anchorFacilityId || null,
          managing_entity: managingEntity || null,
          service_tags: serviceTags || [],
          is_24_7: is24_7 || false,
          sla_first_response_minutes: slaFirstResponse || 30,
          sla_resolution_hours: slaResolution || 24,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating virtual pool:', error);
        toast.error('Failed to create virtual pool');
        return null;
      }

      toast.success('Virtual pool created');
      return data as VirtualPool;
    } catch (error) {
      console.error('Error creating virtual pool:', error);
      toast.error('Failed to create virtual pool');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Assign provider to pool
  const assignToPool = useCallback(async (
    poolId: string,
    providerId: string,
    poolRole: 'staff' | 'supervisor' | 'manager' = 'staff',
    effectiveFrom?: string,
    effectiveTo?: string
  ): Promise<PoolMembership | null> => {
    if (!user?.id) return null;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('pool_memberships')
        .insert({
          pool_id: poolId,
          provider_id: providerId,
          pool_role: poolRole,
          effective_from: effectiveFrom || new Date().toISOString().split('T')[0],
          effective_to: effectiveTo || null,
          assigned_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error assigning to pool:', error);
        toast.error('Failed to assign to pool');
        return null;
      }

      toast.success('Provider assigned to pool');
      return data as PoolMembership;
    } catch (error) {
      console.error('Error assigning to pool:', error);
      toast.error('Failed to assign to pool');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create case assignment
  const createCaseAssignment = useCallback(async (
    poolId: string,
    caseType: string,
    patientId?: string,
    encounterId?: string,
    assignedTo?: string,
    priority: string = 'normal'
  ): Promise<PoolCaseAssignment | null> => {
    if (!user?.id) return null;
    setLoading(true);

    try {
      const pool = await supabase
        .from('virtual_pools')
        .select('sla_first_response_minutes')
        .eq('id', poolId)
        .single();

      const slaMinutes = pool.data?.sla_first_response_minutes || 30;
      const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('pool_case_assignments')
        .insert({
          pool_id: poolId,
          case_type: caseType,
          patient_id: patientId || null,
          encounter_id: encounterId || null,
          assigned_to: assignedTo || null,
          priority,
          sla_deadline: slaDeadline,
          assigned_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating case assignment:', error);
        toast.error('Failed to create case assignment');
        return null;
      }

      toast.success('Case assigned to pool');
      return data as PoolCaseAssignment;
    } catch (error) {
      console.error('Error creating case assignment:', error);
      toast.error('Failed to create case assignment');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update case status
  const updateCaseStatus = useCallback(async (
    caseId: string,
    status: string,
    resolutionNotes?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    setLoading(true);

    try {
      const updates: any = { status };
      
      if (status === 'in_progress' && !resolutionNotes) {
        updates.first_response_at = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user.id;
        if (resolutionNotes) updates.resolution_notes = resolutionNotes;
      }

      const { error } = await supabase
        .from('pool_case_assignments')
        .update(updates)
        .eq('id', caseId);

      if (error) {
        console.error('Error updating case status:', error);
        toast.error('Failed to update case');
        return false;
      }

      toast.success('Case updated');
      return true;
    } catch (error) {
      console.error('Error updating case status:', error);
      toast.error('Failed to update case');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Escalate case
  const escalateCase = useCallback(async (
    caseId: string,
    escalateTo: string,
    reason: string
  ): Promise<boolean> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('pool_case_assignments')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalated_to: escalateTo,
          escalation_reason: reason
        })
        .eq('id', caseId);

      if (error) {
        console.error('Error escalating case:', error);
        toast.error('Failed to escalate case');
        return false;
      }

      toast.success('Case escalated');
      return true;
    } catch (error) {
      console.error('Error escalating case:', error);
      toast.error('Failed to escalate case');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchVirtualPools,
    fetchMyPoolMemberships,
    fetchPoolCaseAssignments,
    createVirtualPool,
    assignToPool,
    createCaseAssignment,
    updateCaseStatus,
    escalateCase
  };
}
