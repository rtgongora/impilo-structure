import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { InterventionType } from '@/types/aboveSite';

export interface Intervention {
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
  // Joined data
  target_facility?: { name: string } | null;
  target_workspace?: { name: string } | null;
  target_pool?: { name: string } | null;
}

export interface CreateInterventionInput {
  session_id: string;
  intervention_type: InterventionType;
  title: string;
  description?: string;
  target_facility_id?: string;
  target_workspace_id?: string;
  target_provider_id?: string;
  target_pool_id?: string;
  action_data?: Record<string, unknown>;
  reason: string;
  is_reversible?: boolean;
  expires_at?: string;
}

export function useAboveSiteInterventions(sessionId?: string) {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterventions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('above_site_interventions')
        .select(`
          *,
          target_facility:facilities!above_site_interventions_target_facility_id_fkey(name),
          target_workspace:workspaces!above_site_interventions_target_workspace_id_fkey(name),
          target_pool:virtual_pools!above_site_interventions_target_pool_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setInterventions(data as Intervention[]);
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError('Failed to load interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [user, sessionId]);

  const createIntervention = async (input: CreateInterventionInput): Promise<Intervention | null> => {
    if (!user) return null;

    try {
      const insertData = {
        session_id: input.session_id,
        intervention_type: input.intervention_type as 'staff_redeployment' | 'coverage_approval' | 'queue_escalation' | 'virtual_pool_authorization' | 'facility_override' | 'emergency_response',
        title: input.title,
        description: input.description,
        target_facility_id: input.target_facility_id,
        target_workspace_id: input.target_workspace_id,
        target_provider_id: input.target_provider_id,
        target_pool_id: input.target_pool_id,
        action_data: (input.action_data || {}) as Record<string, unknown>,
        reason: input.reason,
        is_reversible: input.is_reversible ?? true,
        expires_at: input.expires_at,
        user_id: user.id,
      } as const;

      const { data, error: createError } = await supabase
        .from('above_site_interventions')
        .insert([{
          session_id: insertData.session_id,
          intervention_type: insertData.intervention_type,
          title: insertData.title,
          description: insertData.description,
          target_facility_id: insertData.target_facility_id,
          target_workspace_id: insertData.target_workspace_id,
          target_provider_id: insertData.target_provider_id,
          target_pool_id: insertData.target_pool_id,
          action_data: insertData.action_data as unknown as null,
          reason: insertData.reason,
          is_reversible: insertData.is_reversible,
          expires_at: insertData.expires_at,
          user_id: insertData.user_id,
        }])
        .select(`
          *,
          target_facility:facilities!above_site_interventions_target_facility_id_fkey(name),
          target_workspace:workspaces!above_site_interventions_target_workspace_id_fkey(name),
          target_pool:virtual_pools!above_site_interventions_target_pool_id_fkey(name)
        `)
        .single();

      if (createError) throw createError;

      setInterventions(prev => [data as Intervention, ...prev]);
      toast.success('Intervention created successfully');
      return data as Intervention;
    } catch (err) {
      console.error('Error creating intervention:', err);
      toast.error('Failed to create intervention');
      return null;
    }
  };

  const approveIntervention = async (interventionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('above_site_interventions')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', interventionId);

      if (updateError) throw updateError;

      setInterventions(prev =>
        prev.map(i =>
          i.id === interventionId
            ? { ...i, is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id }
            : i
        )
      );
      toast.success('Intervention approved');
      return true;
    } catch (err) {
      console.error('Error approving intervention:', err);
      toast.error('Failed to approve intervention');
      return false;
    }
  };

  const rejectIntervention = async (interventionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('above_site_interventions')
        .update({
          is_approved: false,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', interventionId);

      if (updateError) throw updateError;

      setInterventions(prev =>
        prev.map(i =>
          i.id === interventionId
            ? { ...i, is_approved: false, approved_at: new Date().toISOString(), approved_by: user.id }
            : i
        )
      );
      toast.success('Intervention rejected');
      return true;
    } catch (err) {
      console.error('Error rejecting intervention:', err);
      toast.error('Failed to reject intervention');
      return false;
    }
  };

  const reverseIntervention = async (interventionId: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('above_site_interventions')
        .update({
          reversed_at: new Date().toISOString(),
          reversed_by: user.id,
          reversal_reason: reason,
        })
        .eq('id', interventionId);

      if (updateError) throw updateError;

      setInterventions(prev =>
        prev.map(i =>
          i.id === interventionId
            ? { ...i, reversed_at: new Date().toISOString(), reversed_by: user.id, reversal_reason: reason }
            : i
        )
      );
      toast.success('Intervention reversed');
      return true;
    } catch (err) {
      console.error('Error reversing intervention:', err);
      toast.error('Failed to reverse intervention');
      return false;
    }
  };

  return {
    interventions,
    loading,
    error,
    createIntervention,
    approveIntervention,
    rejectIntervention,
    reverseIntervention,
    refetch: fetchInterventions,
  };
}
