import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  encounter_id?: string;
  prescribed_by?: string;
  prescribed_at: string;
  status: string;
  priority: string;
  pharmacy_notes?: string;
  dispensing_instructions?: string;
  valid_until?: string;
  refills_authorized: number;
  refills_remaining: number;
  is_controlled_substance: boolean;
  controlled_schedule?: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  dosage_unit: string;
  frequency: string;
  route: string;
  duration?: string;
  quantity: number;
  instructions?: string;
  indication?: string;
  is_controlled: boolean;
  schedule?: string;
  status: string;
  dispensed_quantity: number;
}

export interface FormularyItem {
  id: string;
  medication_name: string;
  generic_name?: string;
  drug_class?: string;
  therapeutic_category?: string;
  formulary_status: string;
  dosage_forms?: string[];
  available_strengths?: string[];
  is_controlled: boolean;
  dea_schedule?: string;
  requires_monitoring: boolean;
  black_box_warning?: string;
}

export function usePrescriptions(patientId?: string) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("prescribed_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPrescriptions((data as any) || []);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  return { prescriptions, loading, refetch: fetchPrescriptions };
}

export function useFormulary() {
  const [formulary, setFormulary] = useState<FormularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFormulary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("formulary")
        .select("*")
        .eq("is_active", true)
        .order("medication_name");

      if (error) throw error;
      setFormulary((data as any) || []);
    } catch (err) {
      console.error("Error fetching formulary:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchFormulary = async (query: string) => {
    if (!query || query.length < 2) return [];
    
    try {
      const { data, error } = await supabase
        .from("formulary")
        .select("*")
        .eq("is_active", true)
        .or(`medication_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return (data as any) || [];
    } catch (err) {
      console.error("Error searching formulary:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchFormulary();
  }, []);

  return { formulary, loading, searchFormulary, refetch: fetchFormulary };
}

export function useCreatePrescription() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createPrescription = async (
    patientId: string,
    encounterId: string | undefined,
    items: Omit<PrescriptionItem, "id" | "prescription_id" | "status" | "dispensed_quantity">[]
  ) => {
    if (!user) {
      toast.error("You must be logged in to create prescriptions");
      return null;
    }

    setCreating(true);
    try {
      // Generate prescription number
      const { data: rxNum } = await supabase.rpc("generate_prescription_number");
      
      // Check for controlled substances
      const hasControlled = items.some(item => item.is_controlled);

      // Create prescription
      const { data: prescription, error: rxError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: rxNum || `RX-${Date.now()}`,
          patient_id: patientId,
          encounter_id: encounterId,
          prescribed_by: user.id,
          is_controlled_substance: hasControlled,
          status: "active",
        })
        .select()
        .single();

      if (rxError) throw rxError;

      // Add items
      const itemsToInsert = items.map(item => ({
        prescription_id: prescription.id,
        medication_name: item.medication_name,
        generic_name: item.generic_name,
        dosage: item.dosage,
        dosage_unit: item.dosage_unit,
        frequency: item.frequency,
        route: item.route,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        indication: item.indication,
        is_controlled: item.is_controlled,
        schedule: item.schedule,
      }));

      const { error: itemsError } = await supabase
        .from("prescription_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Prescription created successfully");
      return prescription;
    } catch (err) {
      console.error("Error creating prescription:", err);
      toast.error("Failed to create prescription");
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createPrescription, creating };
}
