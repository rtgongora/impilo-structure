import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Specimen {
  id: string;
  specimen_id: string;
  patient_id: string;
  encounter_id?: string;
  lab_order_id?: string;
  specimen_type: string;
  specimen_source?: string;
  collection_site?: string;
  collected_at: string;
  collected_by?: string;
  collection_method?: string;
  volume_collected?: string;
  volume_unit?: string;
  container_type?: string;
  preservative?: string;
  fasting_status?: string;
  collection_notes?: string;
  status: string;
  priority: string;
  temperature_requirement?: string;
  transport_conditions?: string;
  rejection_reason?: string;
  is_biohazard: boolean;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  tracking?: SpecimenTracking[];
}

export interface SpecimenTracking {
  id: string;
  specimen_id: string;
  action: string;
  location_from?: string;
  location_to?: string;
  performed_by: string;
  performed_at: string;
  temperature_logged?: number;
  condition_on_receipt?: string;
  notes?: string;
}

export function useSpecimens(patientId?: string, labOrderId?: string) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecimens = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("specimens")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("collected_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }
      if (labOrderId) {
        query = query.eq("lab_order_id", labOrderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSpecimens((data as any) || []);
    } catch (err) {
      console.error("Error fetching specimens:", err);
      toast.error("Failed to load specimens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecimens();
  }, [patientId, labOrderId]);

  return { specimens, loading, refetch: fetchSpecimens };
}

export function useCreateSpecimen() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createSpecimen = async (specimen: {
    patient_id: string;
    encounter_id?: string;
    lab_order_id?: string;
    specimen_type: string;
    specimen_source?: string;
    collection_site?: string;
    collection_method?: string;
    volume_collected?: string;
    volume_unit?: string;
    container_type?: string;
    preservative?: string;
    fasting_status?: string;
    collection_notes?: string;
    priority?: string;
    temperature_requirement?: string;
    is_biohazard?: boolean;
  }) => {
    if (!user) {
      toast.error("You must be logged in to collect specimens");
      return null;
    }

    setCreating(true);
    try {
      // Generate specimen ID
      const { data: specId } = await supabase.rpc("generate_specimen_id");

      const { data, error } = await supabase
        .from("specimens")
        .insert({
          ...specimen,
          specimen_id: specId || `SPEC-${Date.now()}`,
          collected_by: user.id,
          status: "collected",
        })
        .select()
        .single();

      if (error) throw error;

      // Log the collection in tracking
      await supabase.from("specimen_tracking").insert({
        specimen_id: data.id,
        action: "collected",
        location_to: specimen.collection_site || "Collection Point",
        performed_by: user.id,
      });

      toast.success(`Specimen ${data.specimen_id} collected`);
      return data;
    } catch (err) {
      console.error("Error creating specimen:", err);
      toast.error("Failed to collect specimen");
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateSpecimenStatus = async (
    specimenId: string,
    status: string,
    action: string,
    details?: {
      location_from?: string;
      location_to?: string;
      temperature_logged?: number;
      condition_on_receipt?: string;
      notes?: string;
      rejection_reason?: string;
    }
  ) => {
    if (!user) return false;

    try {
      // Update specimen status
      const updateData: any = { status };
      if (details?.rejection_reason) {
        updateData.rejection_reason = details.rejection_reason;
      }

      const { error: updateError } = await supabase
        .from("specimens")
        .update(updateData)
        .eq("id", specimenId);

      if (updateError) throw updateError;

      // Add tracking entry
      const { error: trackError } = await supabase
        .from("specimen_tracking")
        .insert({
          specimen_id: specimenId,
          action,
          performed_by: user.id,
          ...details,
        });

      if (trackError) throw trackError;

      toast.success(`Specimen ${action}`);
      return true;
    } catch (err) {
      console.error("Error updating specimen:", err);
      toast.error("Failed to update specimen");
      return false;
    }
  };

  return { createSpecimen, updateSpecimenStatus, creating };
}

export function useSpecimenTracking(specimenId: string) {
  const [tracking, setTracking] = useState<SpecimenTracking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("specimen_tracking")
        .select("*")
        .eq("specimen_id", specimenId)
        .order("performed_at", { ascending: true });

      if (error) throw error;
      setTracking((data as any) || []);
    } catch (err) {
      console.error("Error fetching tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (specimenId) {
      fetchTracking();
    }
  }, [specimenId]);

  return { tracking, loading, refetch: fetchTracking };
}
