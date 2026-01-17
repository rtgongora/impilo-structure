/**
 * Result Acknowledgment Hook
 * For lab/imaging result review workflow
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ResultAcknowledgment {
  id: string;
  patient_id: string;
  result_id: string;
  result_table: string;
  result_type: string;
  acknowledgment_type: string;
  is_critical: boolean | null;
  acknowledged_at: string;
  acknowledged_by: string;
  action_notes: string | null;
  follow_up_required: boolean | null;
  follow_up_notes: string | null;
  critical_acknowledged_within_sla: boolean | null;
  created_at: string;
}

export interface ResultInput {
  patient_id: string;
  result_id: string;
  result_table: string;
  result_type: string;
  acknowledgment_type: string;
  acknowledged_by: string;
  is_critical?: boolean;
  action_notes?: string;
  follow_up_required?: boolean;
  follow_up_notes?: string;
}

export function useResultAcknowledgments(options?: { 
  patientId?: string; 
  resultType?: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['result-acknowledgments', options];

  const resultsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('result_acknowledgments').select('*');

      if (options?.patientId) {
        query = query.eq('patient_id', options.patientId);
      }
      if (options?.resultType) {
        query = query.eq('result_type', options.resultType);
      }

      const { data, error } = await query
        .order('is_critical', { ascending: false })
        .order('acknowledged_at', { ascending: false });

      if (error) throw error;
      return data as ResultAcknowledgment[];
    },
    enabled: !!options?.patientId,
  });

  const criticalResults = resultsQuery.data?.filter(r => r.is_critical) || [];
  const pendingFollowUp = resultsQuery.data?.filter(r => r.follow_up_required && !r.follow_up_notes) || [];

  const acknowledgeResult = useMutation({
    mutationFn: async (input: ResultInput) => {
      const { data, error } = await supabase
        .from('result_acknowledgments')
        .insert({
          patient_id: input.patient_id,
          result_id: input.result_id,
          result_table: input.result_table,
          result_type: input.result_type,
          acknowledgment_type: input.acknowledgment_type,
          acknowledged_by: input.acknowledged_by,
          is_critical: input.is_critical || false,
          action_notes: input.action_notes,
          follow_up_required: input.follow_up_required || false,
          follow_up_notes: input.follow_up_notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['result-acknowledgments'] });
      toast.success('Result acknowledged');
    },
    onError: (error) => {
      console.error('Failed to acknowledge result:', error);
      toast.error('Failed to acknowledge result');
    },
  });

  const updateFollowUp = useMutation({
    mutationFn: async ({ id, follow_up_notes }: { id: string; follow_up_notes: string }) => {
      const { data, error } = await supabase
        .from('result_acknowledgments')
        .update({ follow_up_notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['result-acknowledgments'] });
      toast.success('Follow-up updated');
    },
  });

  return {
    acknowledgments: resultsQuery.data || [],
    criticalResults,
    pendingFollowUp,
    isLoading: resultsQuery.isLoading,
    error: resultsQuery.error,
    acknowledgeResult,
    updateFollowUp,
    refetch: resultsQuery.refetch,
  };
}
