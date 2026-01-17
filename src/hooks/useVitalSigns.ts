/**
 * Vital Signs Hook
 * CRUD operations for vital signs charting and monitoring
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VitalSign {
  id: string;
  encounter_id: string;
  recorded_by?: string;
  recorded_at: string;
  temperature?: number;
  temperature_unit: string;
  pulse_rate?: number;
  respiratory_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  oxygen_saturation?: number;
  pain_score?: number;
  weight?: number;
  weight_unit: string;
  height?: number;
  height_unit: string;
  blood_glucose?: number;
  notes?: string;
  created_at: string;
}

export interface VitalSignInput {
  encounter_id: string;
  recorded_by?: string;
  temperature?: number;
  temperature_unit?: string;
  pulse_rate?: number;
  respiratory_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  oxygen_saturation?: number;
  pain_score?: number;
  weight?: number;
  weight_unit?: string;
  height?: number;
  height_unit?: string;
  blood_glucose?: number;
  notes?: string;
}

// Vital sign reference ranges for interpretation
export const VITAL_RANGES = {
  temperature: { normal: { min: 36.1, max: 37.2 }, unit: '°C' },
  pulse_rate: { normal: { min: 60, max: 100 }, unit: 'bpm' },
  respiratory_rate: { normal: { min: 12, max: 20 }, unit: '/min' },
  blood_pressure_systolic: { normal: { min: 90, max: 120 }, warning: { min: 121, max: 139 }, unit: 'mmHg' },
  blood_pressure_diastolic: { normal: { min: 60, max: 80 }, warning: { min: 81, max: 89 }, unit: 'mmHg' },
  oxygen_saturation: { normal: { min: 95, max: 100 }, warning: { min: 90, max: 94 }, unit: '%' },
  blood_glucose: { normal: { min: 3.9, max: 5.6 }, unit: 'mmol/L' },
};

export type VitalStatus = 'normal' | 'warning' | 'critical';

export function getVitalStatus(type: keyof typeof VITAL_RANGES, value: number): VitalStatus {
  const range = VITAL_RANGES[type];
  if (!range) return 'normal';

  if (value >= range.normal.min && value <= range.normal.max) {
    return 'normal';
  }

  if ('warning' in range && value >= range.warning.min && value <= range.warning.max) {
    return 'warning';
  }

  return 'critical';
}

export function useVitalSigns(encounterId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['vital-signs', encounterId];

  const vitalsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!encounterId) return [];
      
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data as VitalSign[];
    },
    enabled: !!encounterId,
  });

  const latestVitals = vitalsQuery.data?.[0];

  // Calculate trends based on last few readings
  const getTrend = (type: keyof VitalSign) => {
    const readings = vitalsQuery.data?.slice(0, 3) || [];
    if (readings.length < 2) return 'stable';

    const values = readings.map(r => r[type] as number).filter(v => v != null);
    if (values.length < 2) return 'stable';

    const diff = values[0] - values[1];
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  };

  const addVitals = useMutation({
    mutationFn: async (vitals: VitalSignInput) => {
      const { data, error } = await supabase
        .from('vital_signs')
        .insert({
          ...vitals,
          temperature_unit: vitals.temperature_unit || 'C',
          weight_unit: vitals.weight_unit || 'kg',
          height_unit: vitals.height_unit || 'cm',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Vitals recorded successfully');
    },
    onError: (error) => {
      console.error('Failed to record vitals:', error);
      toast.error('Failed to record vitals');
    },
  });

  const updateVitals = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VitalSign> & { id: string }) => {
      const { data, error } = await supabase
        .from('vital_signs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Vitals updated');
    },
  });

  const deleteVitals = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Vitals entry removed');
    },
  });

  // Check for critical vitals
  const hasCriticalVitals = latestVitals ? (
    (latestVitals.blood_pressure_systolic && getVitalStatus('blood_pressure_systolic', latestVitals.blood_pressure_systolic) === 'critical') ||
    (latestVitals.oxygen_saturation && getVitalStatus('oxygen_saturation', latestVitals.oxygen_saturation) === 'critical') ||
    (latestVitals.pulse_rate && getVitalStatus('pulse_rate', latestVitals.pulse_rate) === 'critical') ||
    (latestVitals.temperature && getVitalStatus('temperature', latestVitals.temperature) === 'critical')
  ) : false;

  return {
    vitals: vitalsQuery.data || [],
    latestVitals,
    hasCriticalVitals,
    getTrend,
    isLoading: vitalsQuery.isLoading,
    error: vitalsQuery.error,
    addVitals,
    updateVitals,
    deleteVitals,
    refetch: vitalsQuery.refetch,
  };
}

// Hook for patient-level vitals history across encounters
export function usePatientVitalsHistory(patientId?: string, limit = 50) {
  return useQuery({
    queryKey: ['patient-vitals-history', patientId, limit],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('vital_signs')
        .select(`
          *,
          encounters!inner(patient_id)
        `)
        .eq('encounters.patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VitalSign[];
    },
    enabled: !!patientId,
  });
}
