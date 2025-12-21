import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueuePatient, VisitType } from "@/components/ehr/queue/QueuePatientCard";

interface EncounterWithPatient {
  id: string;
  encounter_number: string;
  encounter_type: string;
  status: string;
  triage_category: string | null;
  chief_complaint: string | null;
  admission_date: string;
  ward: string | null;
  bed: string | null;
  attending_physician_id: string | null;
  patient_id: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    mrn: string;
    date_of_birth: string;
    gender: string;
  };
}

const triageMap: Record<string, QueuePatient['triageLevel']> = {
  'resuscitation': 'red',
  'emergency': 'orange',
  'urgent': 'yellow',
  'standard': 'green',
  'non-urgent': 'blue',
};

const visitTypeMap: Record<string, VisitType> = {
  'outpatient': 'in-person',
  'inpatient': 'in-person',
  'emergency': 'in-person',
  'virtual': 'virtual',
  'teleconsult': 'virtual',
  'consultation': 'consultation',
  'referral': 'referral',
  'appointment': 'appointment',
};

const statusMap: Record<string, QueuePatient['status']> = {
  'active': 'waiting',
  'waiting': 'waiting',
  'in-progress': 'in-consultation',
  'in_progress': 'in-consultation',
  'completed': 'completed',
  'discharged': 'discharged',
  'called': 'called',
};

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function useQueueData(workspace: 'my-queue' | 'ward' | 'department' | 'all' = 'all', wardFilter?: string) {
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('encounters')
        .select(`
          id,
          encounter_number,
          encounter_type,
          status,
          triage_category,
          chief_complaint,
          admission_date,
          ward,
          bed,
          attending_physician_id,
          patient_id,
          patients!inner (
            id,
            first_name,
            last_name,
            mrn,
            date_of_birth,
            gender
          )
        `)
        .in('status', ['active', 'waiting', 'in-progress', 'in_progress', 'called'])
        .order('admission_date', { ascending: false })
        .limit(100);

      // Apply ward filter if specified
      if (wardFilter) {
        query = query.eq('ward', wardFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transform to QueuePatient format
      const transformedPatients: QueuePatient[] = (data || []).map((enc: any) => {
        const patient = enc.patients;
        return {
          id: enc.id,
          encounterId: enc.id,
          name: `${patient.first_name} ${patient.last_name}`,
          mrn: patient.mrn,
          age: calculateAge(patient.date_of_birth),
          gender: patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'O',
          chiefComplaint: enc.chief_complaint || 'No complaint recorded',
          triageLevel: triageMap[enc.triage_category?.toLowerCase() || 'green'] || 'green',
          arrivalTime: new Date(enc.admission_date),
          ticketNumber: enc.encounter_number,
          status: statusMap[enc.status] || 'waiting',
          visitType: visitTypeMap[enc.encounter_type?.toLowerCase()] || 'in-person',
          ward: enc.ward || undefined,
          bed: enc.bed || undefined,
        };
      });

      setPatients(transformedPatients);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching queue data:', err);
      setError(err.message || 'Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncounters();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('queue-encounters')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encounters',
        },
        () => {
          fetchEncounters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, wardFilter]);

  const updatePatientStatus = async (encounterId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('encounters')
        .update({ status })
        .eq('id', encounterId);

      if (error) throw error;
      
      // Optimistically update local state
      setPatients(prev => prev.map(p => 
        p.id === encounterId ? { ...p, status: statusMap[status] || 'waiting' } : p
      ));
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchEncounters,
    updatePatientStatus,
  };
}
