/**
 * Clinical Observations Hook
 * For structured clinical observations beyond vital signs
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ObservationCategory = 
  | 'vital_signs' 
  | 'laboratory' 
  | 'imaging' 
  | 'procedure' 
  | 'survey' 
  | 'exam' 
  | 'therapy' 
  | 'activity' 
  | 'social_history' 
  | 'functional_status';

export type ObservationStatus = 'registered' | 'preliminary' | 'final' | 'amended' | 'cancelled' | 'entered_in_error';
export type Interpretation = 'normal' | 'abnormal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'positive' | 'negative';
export type ValueType = 'quantity' | 'string' | 'boolean' | 'integer' | 'codeable_concept' | 'range';

export interface ClinicalObservation {
  id: string;
  patient_id: string;
  encounter_id?: string;
  observation_code: string;
  observation_code_system: string;
  observation_display: string;
  observation_category?: ObservationCategory;
  value_type: ValueType;
  value_quantity?: number;
  value_quantity_unit?: string;
  value_string?: string;
  value_boolean?: boolean;
  value_integer?: number;
  value_code?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  interpretation?: Interpretation;
  status: ObservationStatus;
  effective_datetime: string;
  performer_id?: string;
  performer_name?: string;
  body_site?: string;
  method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ObservationInput {
  patient_id: string;
  encounter_id?: string;
  observation_code: string;
  observation_code_system?: string;
  observation_display: string;
  observation_category?: ObservationCategory;
  value_type: ValueType;
  value_quantity?: number;
  value_quantity_unit?: string;
  value_string?: string;
  value_boolean?: boolean;
  value_integer?: number;
  value_code?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  interpretation?: Interpretation;
  performer_id?: string;
  performer_name?: string;
  body_site?: string;
  method?: string;
  notes?: string;
}

// Common LOINC codes for clinical observations
export const COMMON_OBSERVATIONS = {
  PAIN_SCORE: { code: '38221-8', display: 'Pain severity', category: 'vital_signs' as ObservationCategory },
  FALL_RISK: { code: '73830-2', display: 'Fall risk total', category: 'survey' as ObservationCategory },
  BRADEN_SCORE: { code: '38228-3', display: 'Braden scale score', category: 'survey' as ObservationCategory },
  CONSCIOUSNESS: { code: '80288-4', display: 'Level of consciousness', category: 'exam' as ObservationCategory },
  PUPIL_REACTION: { code: '79817-2', display: 'Pupillary response', category: 'exam' as ObservationCategory },
  SKIN_INTEGRITY: { code: '72169-6', display: 'Skin integrity', category: 'exam' as ObservationCategory },
  MOBILITY: { code: '92860-1', display: 'Mobility status', category: 'functional_status' as ObservationCategory },
  NUTRITION_SCREEN: { code: '75285-7', display: 'Nutritional status', category: 'survey' as ObservationCategory },
  SMOKING_STATUS: { code: '72166-2', display: 'Tobacco smoking status', category: 'social_history' as ObservationCategory },
  ALCOHOL_USE: { code: '11331-6', display: 'Alcohol use', category: 'social_history' as ObservationCategory },
};

export function useClinicalObservations(options?: {
  patientId?: string;
  encounterId?: string;
  category?: ObservationCategory;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['clinical-observations', options];

  const observationsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!options?.patientId && !options?.encounterId) return [];
      
      let query = supabase.from('clinical_observations').select('*');

      if (options?.patientId) {
        query = query.eq('patient_id', options.patientId);
      }
      if (options?.encounterId) {
        query = query.eq('encounter_id', options.encounterId);
      }
      if (options?.category) {
        query = query.eq('observation_category', options.category);
      }

      const { data, error } = await query.order('effective_datetime', { ascending: false });

      if (error) throw error;
      return data as ClinicalObservation[];
    },
    enabled: !!(options?.patientId || options?.encounterId),
  });

  const abnormalObservations = observationsQuery.data?.filter(o => 
    o.interpretation && !['normal'].includes(o.interpretation)
  ) || [];

  const criticalObservations = observationsQuery.data?.filter(o =>
    o.interpretation && ['critical_low', 'critical_high'].includes(o.interpretation)
  ) || [];

  const addObservation = useMutation({
    mutationFn: async (observation: ObservationInput) => {
      const { data, error } = await supabase
        .from('clinical_observations')
        .insert({
          ...observation,
          observation_code_system: observation.observation_code_system || 'LOINC',
          status: 'final',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-observations'] });
      toast.success('Observation recorded');
    },
    onError: (error) => {
      console.error('Failed to record observation:', error);
      toast.error('Failed to record observation');
    },
  });

  const updateObservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClinicalObservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('clinical_observations')
        .update({
          ...updates,
          status: 'amended',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-observations'] });
      toast.success('Observation updated');
    },
  });

  const deleteObservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinical_observations')
        .update({ status: 'entered_in_error' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-observations'] });
      toast.success('Observation marked as entered in error');
    },
  });

  return {
    observations: observationsQuery.data || [],
    abnormalObservations,
    criticalObservations,
    isLoading: observationsQuery.isLoading,
    error: observationsQuery.error,
    addObservation,
    updateObservation,
    deleteObservation,
    refetch: observationsQuery.refetch,
  };
}
