import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BedData {
  id: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  patient?: {
    id: string;
    name: string;
    mrn: string;
    admissionDate: Date;
    diagnosis: string;
    attendingPhysician: string;
    acuityLevel: 'critical' | 'high' | 'medium' | 'low';
  };
  reservedFor?: string;
}

interface DbBed {
  id: string;
  bed_number: string;
  ward_id: string;
  ward_name: string;
  status: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_mrn: string | null;
  admission_date: string | null;
  diagnosis: string | null;
  attending_physician: string | null;
  acuity_level: string | null;
  reserved_for: string | null;
}

export const WARDS = [
  { id: 'medical', name: 'Medical Ward', capacity: 20 },
  { id: 'surgical', name: 'Surgical Ward', capacity: 16 },
  { id: 'maternity', name: 'Maternity Ward', capacity: 12 },
  { id: 'paediatric', name: 'Paediatric Ward', capacity: 10 },
  { id: 'icu', name: 'ICU', capacity: 8 },
  { id: 'hdu', name: 'HDU', capacity: 6 },
];

const transformBed = (dbBed: DbBed): BedData => {
  const bed: BedData = {
    id: dbBed.id,
    bedNumber: dbBed.bed_number,
    wardId: dbBed.ward_id,
    wardName: dbBed.ward_name,
    status: dbBed.status as BedData['status'],
    reservedFor: dbBed.reserved_for || undefined,
  };

  if (dbBed.patient_id && dbBed.patient_name && dbBed.patient_mrn) {
    bed.patient = {
      id: dbBed.patient_id,
      name: dbBed.patient_name,
      mrn: dbBed.patient_mrn,
      admissionDate: dbBed.admission_date ? new Date(dbBed.admission_date) : new Date(),
      diagnosis: dbBed.diagnosis || 'Not specified',
      attendingPhysician: dbBed.attending_physician || 'Not assigned',
      acuityLevel: (dbBed.acuity_level as BedData['patient']['acuityLevel']) || 'medium',
    };
  }

  return bed;
};

export function useBedData() {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number');

      if (fetchError) throw fetchError;

      const transformedBeds = (data as DbBed[]).map(transformBed);
      setBeds(transformedBeds);
      setError(null);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setError('Failed to load beds');
      toast.error('Failed to load bed data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('beds-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'beds',
        },
        () => {
          fetchBeds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateBedStatus = async (
    bedId: string,
    action: string,
    patientData?: {
      patientId: string;
      patientName: string;
      patientMrn: string;
      diagnosis?: string;
      attendingPhysician?: string;
      acuityLevel?: string;
    }
  ) => {
    try {
      let updateData: Record<string, unknown> = {};

      switch (action) {
        case 'discharge':
        case 'transfer':
          updateData = {
            status: 'cleaning',
            patient_id: null,
            patient_name: null,
            patient_mrn: null,
            admission_date: null,
            diagnosis: null,
            attending_physician: null,
            acuity_level: null,
            reserved_for: null,
          };
          break;
        case 'reserve':
          updateData = {
            status: 'reserved',
            reserved_for: 'Pending admission',
          };
          break;
        case 'available':
          updateData = {
            status: 'available',
            reserved_for: null,
          };
          break;
        case 'maintenance':
          updateData = {
            status: 'maintenance',
          };
          break;
        case 'admit':
          if (patientData) {
            updateData = {
              status: 'occupied',
              patient_id: patientData.patientId,
              patient_name: patientData.patientName,
              patient_mrn: patientData.patientMrn,
              admission_date: new Date().toISOString(),
              diagnosis: patientData.diagnosis || 'To be determined',
              attending_physician: patientData.attendingPhysician || 'Dr. Mwangi',
              acuity_level: patientData.acuityLevel || 'medium',
              reserved_for: null,
            };
          }
          break;
        default:
          return;
      }

      const { error: updateError } = await supabase
        .from('beds')
        .update(updateData)
        .eq('id', bedId);

      if (updateError) throw updateError;

      toast.success(`Bed ${action} successful`);
    } catch (err) {
      console.error('Error updating bed:', err);
      toast.error(`Failed to ${action} bed`);
    }
  };

  return {
    beds,
    loading,
    error,
    refetch: fetchBeds,
    updateBedStatus,
  };
}
