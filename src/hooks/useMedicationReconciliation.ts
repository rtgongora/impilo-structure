/**
 * Medication Reconciliation Hook
 * For admission, transfer, and discharge med rec workflows
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReconciliationType = 'admission' | 'transfer' | 'discharge';
export type ReconciliationStatus = 'in_progress' | 'completed' | 'verified';
export type MedicationSource = 'patient' | 'caregiver' | 'pharmacy' | 'medical_record' | 'medication_list' | 'other';

export interface HomeMedication {
  name: string;
  dose: string;
  frequency: string;
  route?: string;
  last_taken?: string;
  indication?: string;
  prescriber?: string;
  pharmacy?: string;
}

export interface ReconciledMedication extends HomeMedication {
  action: 'continue' | 'discontinue' | 'modify' | 'hold' | 'substitute';
  new_dose?: string;
  new_frequency?: string;
  reason?: string;
  substitute_name?: string;
}

export interface Discrepancy {
  medication: string;
  type: 'omission' | 'commission' | 'dose' | 'frequency' | 'duplication' | 'interaction';
  description: string;
  resolved: boolean;
  resolution?: string;
}

export interface MedicationReconciliation {
  id: string;
  patient_id: string;
  encounter_id: string;
  visit_id?: string;
  reconciliation_type: ReconciliationType;
  status: ReconciliationStatus;
  source: MedicationSource;
  source_verified: boolean;
  home_medications: HomeMedication[];
  reconciled_medications: ReconciledMedication[];
  discrepancies: Discrepancy[];
  started_at: string;
  completed_at?: string;
  verified_at?: string;
  performed_by: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedRecInput {
  patient_id: string;
  encounter_id: string;
  visit_id?: string;
  reconciliation_type: ReconciliationType;
  source?: MedicationSource;
  performed_by: string;
  home_medications?: HomeMedication[];
}

export function useMedicationReconciliation(encounterId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['med-reconciliation', encounterId];

  const medRecQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!encounterId) return null;
      
      const { data, error } = await supabase
        .from('medication_reconciliation')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          home_medications: (data.home_medications as unknown as HomeMedication[]) || [],
          reconciled_medications: (data.reconciled_medications as unknown as ReconciledMedication[]) || [],
          discrepancies: (data.discrepancies as unknown as Discrepancy[]) || [],
        } as MedicationReconciliation;
      }
      return null;
    },
    enabled: !!encounterId,
  });

  const startReconciliation = useMutation({
    mutationFn: async (input: MedRecInput) => {
      const insertData = {
        ...input,
        status: 'in_progress' as const,
        source: input.source || 'patient',
        source_verified: false,
        home_medications: (input.home_medications || []) as unknown,
        reconciled_medications: [] as unknown,
        discrepancies: [] as unknown,
      };
      const { data, error } = await supabase
        .from('medication_reconciliation')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Medication reconciliation started');
    },
    onError: (error) => {
      console.error('Failed to start med rec:', error);
      toast.error('Failed to start medication reconciliation');
    },
  });

  const updateHomeMedications = useMutation({
    mutationFn: async ({ id, medications, source }: { 
      id: string; 
      medications: HomeMedication[];
      source?: MedicationSource;
    }) => {
      const updates: Record<string, unknown> = {
        home_medications: medications,
      };
      if (source) {
        updates.source = source;
      }

      const { data, error } = await supabase
        .from('medication_reconciliation')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Home medications updated');
    },
  });

  const reconcileMedications = useMutation({
    mutationFn: async ({ id, reconciled, discrepancies }: { 
      id: string; 
      reconciled: ReconciledMedication[];
      discrepancies?: Discrepancy[];
    }) => {
      const { data, error } = await supabase
        .from('medication_reconciliation')
        .update({
          reconciled_medications: reconciled as unknown,
          discrepancies: (discrepancies || []) as unknown,
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Medications reconciled');
    },
  });

  const completeReconciliation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('medication_reconciliation')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Medication reconciliation completed');
    },
  });

  const verifyReconciliation = useMutation({
    mutationFn: async ({ id, verified_by }: { id: string; verified_by: string }) => {
      const { data, error } = await supabase
        .from('medication_reconciliation')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by,
          source_verified: true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Medication reconciliation verified');
    },
  });

  return {
    reconciliation: medRecQuery.data,
    isLoading: medRecQuery.isLoading,
    error: medRecQuery.error,
    startReconciliation,
    updateHomeMedications,
    reconcileMedications,
    completeReconciliation,
    verifyReconciliation,
    refetch: medRecQuery.refetch,
  };
}
