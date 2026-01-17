/**
 * Patient Problems/Conditions Hook
 * CRUD operations for problem list management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PatientProblem {
  id: string;
  patient_id: string;
  encounter_id?: string;
  problem_code?: string;
  problem_code_system: string;
  problem_display: string;
  problem_category?: 'problem' | 'diagnosis' | 'health_concern' | 'symptom';
  clinical_status: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
  verification_status: 'provisional' | 'differential' | 'confirmed' | 'refuted' | 'entered_in_error';
  severity?: 'mild' | 'moderate' | 'severe';
  body_site?: string;
  onset_date?: string;
  abatement_date?: string;
  recorded_date: string;
  recorded_by?: string;
  is_principal_diagnosis: boolean;
  is_chronic: boolean;
  rank_order?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProblemInput = Omit<PatientProblem, 'id' | 'created_at' | 'updated_at' | 'recorded_date' | 'problem_code_system'> & {
  problem_code_system?: string;
};

export function usePatientProblems(patientId?: string, options?: { encounterId?: string; activeOnly?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = ['patient-problems', patientId, options];

  const problemsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId) return [];
      
      let query = supabase
        .from('patient_problems')
        .select('*')
        .eq('patient_id', patientId);

      if (options?.encounterId) {
        query = query.eq('encounter_id', options.encounterId);
      }

      if (options?.activeOnly) {
        query = query.in('clinical_status', ['active', 'recurrence', 'relapse']);
      }

      const { data, error } = await query
        .order('is_principal_diagnosis', { ascending: false })
        .order('rank_order', { ascending: true, nullsFirst: false })
        .order('onset_date', { ascending: false });

      if (error) throw error;
      return data as PatientProblem[];
    },
    enabled: !!patientId,
  });

  const activeProblems = problemsQuery.data?.filter(p => 
    ['active', 'recurrence', 'relapse'].includes(p.clinical_status)
  ) || [];

  const chronicConditions = problemsQuery.data?.filter(p => p.is_chronic && p.clinical_status === 'active') || [];
  const principalDiagnosis = problemsQuery.data?.find(p => p.is_principal_diagnosis);

  const addProblem = useMutation({
    mutationFn: async (problem: ProblemInput) => {
      const { data, error } = await supabase
        .from('patient_problems')
        .insert({
          ...problem,
          problem_code_system: problem.problem_code_system || 'ICD-11',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Problem added successfully');
    },
    onError: (error) => {
      console.error('Failed to add problem:', error);
      toast.error('Failed to add problem');
    },
  });

  const updateProblem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PatientProblem> & { id: string }) => {
      const { data, error } = await supabase
        .from('patient_problems')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Problem updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update problem:', error);
      toast.error('Failed to update problem');
    },
  });

  const resolveProblem = useMutation({
    mutationFn: async ({ id, abatement_date }: { id: string; abatement_date?: string }) => {
      const { data, error } = await supabase
        .from('patient_problems')
        .update({
          clinical_status: 'resolved',
          abatement_date: abatement_date || new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Problem marked as resolved');
    },
  });

  const confirmProblem = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('patient_problems')
        .update({ verification_status: 'confirmed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Diagnosis confirmed');
    },
  });

  const setPrincipalDiagnosis = useMutation({
    mutationFn: async (id: string) => {
      // First, unset any existing principal diagnosis for this patient
      await supabase
        .from('patient_problems')
        .update({ is_principal_diagnosis: false })
        .eq('patient_id', patientId)
        .eq('is_principal_diagnosis', true);

      // Then set the new one
      const { data, error } = await supabase
        .from('patient_problems')
        .update({ is_principal_diagnosis: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Principal diagnosis updated');
    },
  });

  const deleteProblem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_problems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-problems', patientId] });
      toast.success('Problem removed');
    },
  });

  return {
    problems: problemsQuery.data || [],
    activeProblems,
    chronicConditions,
    principalDiagnosis,
    isLoading: problemsQuery.isLoading,
    error: problemsQuery.error,
    addProblem,
    updateProblem,
    resolveProblem,
    confirmProblem,
    setPrincipalDiagnosis,
    deleteProblem,
    refetch: problemsQuery.refetch,
  };
}
