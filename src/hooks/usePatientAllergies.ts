/**
 * Patient Allergies Hook
 * CRUD operations for structured allergy management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PatientAllergy {
  id: string;
  patient_id: string;
  encounter_id?: string;
  allergen_type: 'drug' | 'food' | 'environmental' | 'biological' | 'other';
  allergen_code?: string;
  allergen_code_system?: string;
  allergen_display: string;
  reaction_type?: 'allergy' | 'intolerance' | 'adverse_reaction';
  reaction_severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction_manifestations?: string[];
  reaction_onset?: 'immediate' | 'delayed' | 'unknown';
  clinical_status: 'active' | 'inactive' | 'resolved';
  verification_status: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered_in_error';
  criticality?: 'low' | 'high' | 'unable_to_assess';
  onset_date?: string;
  recorded_date: string;
  recorded_by?: string;
  last_occurrence?: string;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type AllergyInput = Omit<PatientAllergy, 'id' | 'created_at' | 'updated_at' | 'recorded_date'>;

export function usePatientAllergies(patientId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['patient-allergies', patientId];

  const allergiesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('patient_allergies')
        .select('*')
        .eq('patient_id', patientId)
        .order('clinical_status', { ascending: true })
        .order('criticality', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientAllergy[];
    },
    enabled: !!patientId,
  });

  const activeAllergies = allergiesQuery.data?.filter(a => a.clinical_status === 'active') || [];
  const hasActiveAllergies = activeAllergies.length > 0;
  const hasCriticalAllergies = activeAllergies.some(a => a.criticality === 'high' || a.reaction_severity === 'life_threatening');

  const addAllergy = useMutation({
    mutationFn: async (allergy: AllergyInput) => {
      const { data, error } = await supabase
        .from('patient_allergies')
        .insert(allergy)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Allergy added successfully');
    },
    onError: (error) => {
      console.error('Failed to add allergy:', error);
      toast.error('Failed to add allergy');
    },
  });

  const updateAllergy = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PatientAllergy> & { id: string }) => {
      const { data, error } = await supabase
        .from('patient_allergies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Allergy updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update allergy:', error);
      toast.error('Failed to update allergy');
    },
  });

  const verifyAllergy = useMutation({
    mutationFn: async ({ id, verified_by }: { id: string; verified_by: string }) => {
      const { data, error } = await supabase
        .from('patient_allergies')
        .update({
          verification_status: 'confirmed',
          verified_at: new Date().toISOString(),
          verified_by,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Allergy verified');
    },
  });

  const resolveAllergy = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('patient_allergies')
        .update({ clinical_status: 'resolved' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Allergy marked as resolved');
    },
  });

  const deleteAllergy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_allergies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Allergy removed');
    },
  });

  return {
    allergies: allergiesQuery.data || [],
    activeAllergies,
    hasActiveAllergies,
    hasCriticalAllergies,
    isLoading: allergiesQuery.isLoading,
    error: allergiesQuery.error,
    addAllergy,
    updateAllergy,
    verifyAllergy,
    resolveAllergy,
    deleteAllergy,
    refetch: allergiesQuery.refetch,
  };
}
