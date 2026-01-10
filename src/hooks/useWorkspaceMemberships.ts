import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WorkspaceRoleType, Workspace, WorkspaceMembership } from './useWorkspaceData';

interface MembershipWithDetails extends WorkspaceMembership {
  workspace: Workspace;
  provider_name?: string;
  provider_id_display?: string;
}

interface BulkAssignmentParams {
  workspaceIds: string[];
  providerIds: string[];
  role: WorkspaceRoleType;
  effectiveFrom?: string;
  effectiveTo?: string;
}

interface UseWorkspaceMembershipsReturn {
  memberships: MembershipWithDetails[];
  loading: boolean;
  
  // Fetch memberships
  fetchMemberships: (filters?: { workspaceId?: string; providerId?: string }) => Promise<void>;
  fetchWorkspaceMemberships: (workspaceId: string) => Promise<MembershipWithDetails[]>;
  fetchProviderMemberships: (providerId: string) => Promise<MembershipWithDetails[]>;
  
  // Manage memberships
  assignMembership: (
    workspaceId: string, 
    providerId: string, 
    role: WorkspaceRoleType,
    effectiveFrom?: string,
    effectiveTo?: string,
    notes?: string
  ) => Promise<boolean>;
  updateMembership: (
    membershipId: string, 
    updates: Partial<Pick<WorkspaceMembership, 'workspace_role' | 'effective_to' | 'notes' | 'can_self_assign'>>
  ) => Promise<boolean>;
  revokeMembership: (membershipId: string, reason: string) => Promise<boolean>;
  
  // Bulk operations
  bulkAssignMemberships: (params: BulkAssignmentParams) => Promise<{ success: number; failed: number }>;
}

export const useWorkspaceMemberships = (): UseWorkspaceMembershipsReturn => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<MembershipWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch memberships with optional filters
  const fetchMemberships = useCallback(async (filters?: { workspaceId?: string; providerId?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('workspace_memberships')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('is_active', true);

      if (filters?.workspaceId) {
        query = query.eq('workspace_id', filters.workspaceId);
      }
      if (filters?.providerId) {
        query = query.eq('provider_id', filters.providerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setMemberships((data || []) as unknown as MembershipWithDetails[]);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast.error('Failed to load workspace memberships');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch memberships for a specific workspace
  const fetchWorkspaceMemberships = useCallback(async (workspaceId: string): Promise<MembershipWithDetails[]> => {
    try {
      const { data, error } = await supabase
        .from('workspace_memberships')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('workspace_role', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as MembershipWithDetails[];
    } catch (error) {
      console.error('Error fetching workspace memberships:', error);
      return [];
    }
  }, []);

  // Fetch memberships for a specific provider
  const fetchProviderMemberships = useCallback(async (providerId: string): Promise<MembershipWithDetails[]> => {
    try {
      const { data, error } = await supabase
        .from('workspace_memberships')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as unknown as MembershipWithDetails[];
    } catch (error) {
      console.error('Error fetching provider memberships:', error);
      return [];
    }
  }, []);

  // Assign a membership
  const assignMembership = useCallback(async (
    workspaceId: string,
    providerId: string,
    role: WorkspaceRoleType,
    effectiveFrom?: string,
    effectiveTo?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check for existing active membership
      const { data: existing } = await supabase
        .from('workspace_memberships')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        toast.error('Provider already has an active membership for this workspace');
        return false;
      }

      const { error } = await supabase
        .from('workspace_memberships')
        .insert({
          workspace_id: workspaceId,
          provider_id: providerId,
          workspace_role: role,
          effective_from: effectiveFrom || new Date().toISOString().split('T')[0],
          effective_to: effectiveTo || null,
          notes,
          assigned_by: user.id,
          is_active: true
        });

      if (error) throw error;

      // Log the action
      await supabase
        .from('workspace_audit_log')
        .insert({
          actor_id: user.id,
          workspace_id: workspaceId,
          action: 'membership_assigned',
          entity_type: 'workspace_membership',
          new_value: { provider_id: providerId, role }
        });

      toast.success('Membership assigned successfully');
      return true;
    } catch (error) {
      console.error('Error assigning membership:', error);
      toast.error('Failed to assign membership');
      return false;
    }
  }, [user]);

  // Update a membership
  const updateMembership = useCallback(async (
    membershipId: string,
    updates: Partial<Pick<WorkspaceMembership, 'workspace_role' | 'effective_to' | 'notes' | 'can_self_assign'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current membership for audit
      const { data: current } = await supabase
        .from('workspace_memberships')
        .select('*')
        .eq('id', membershipId)
        .single();

      const { error } = await supabase
        .from('workspace_memberships')
        .update(updates)
        .eq('id', membershipId);

      if (error) throw error;

      // Log the action
      if (current) {
        await supabase
          .from('workspace_audit_log')
          .insert({
            actor_id: user.id,
            workspace_id: current.workspace_id,
            action: 'membership_updated',
            entity_type: 'workspace_membership',
            entity_id: membershipId,
            old_value: current,
            new_value: updates
          });
      }

      toast.success('Membership updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error('Failed to update membership');
      return false;
    }
  }, [user]);

  // Revoke a membership
  const revokeMembership = useCallback(async (membershipId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current membership for audit
      const { data: current } = await supabase
        .from('workspace_memberships')
        .select('*')
        .eq('id', membershipId)
        .single();

      const { error } = await supabase
        .from('workspace_memberships')
        .update({
          is_active: false,
          revoked_by: user.id,
          revoked_at: new Date().toISOString(),
          revocation_reason: reason
        })
        .eq('id', membershipId);

      if (error) throw error;

      // Log the action
      if (current) {
        await supabase
          .from('workspace_audit_log')
          .insert({
            actor_id: user.id,
            workspace_id: current.workspace_id,
            action: 'membership_revoked',
            entity_type: 'workspace_membership',
            entity_id: membershipId,
            old_value: { is_active: true },
            new_value: { is_active: false, reason },
            justification: reason
          });
      }

      toast.success('Membership revoked successfully');
      return true;
    } catch (error) {
      console.error('Error revoking membership:', error);
      toast.error('Failed to revoke membership');
      return false;
    }
  }, [user]);

  // Bulk assign memberships
  const bulkAssignMemberships = useCallback(async (params: BulkAssignmentParams): Promise<{ success: number; failed: number }> => {
    if (!user) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const workspaceId of params.workspaceIds) {
      for (const providerId of params.providerIds) {
        try {
          const result = await assignMembership(
            workspaceId,
            providerId,
            params.role,
            params.effectiveFrom,
            params.effectiveTo
          );
          if (result) success++;
          else failed++;
        } catch {
          failed++;
        }
      }
    }

    if (success > 0) {
      toast.success(`Successfully assigned ${success} membership(s)`);
    }
    if (failed > 0) {
      toast.error(`Failed to assign ${failed} membership(s)`);
    }

    return { success, failed };
  }, [user, assignMembership]);

  return {
    memberships,
    loading,
    fetchMemberships,
    fetchWorkspaceMemberships,
    fetchProviderMemberships,
    assignMembership,
    updateMembership,
    revokeMembership,
    bulkAssignMemberships
  };
};
