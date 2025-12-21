import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CarePlan {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  title: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  items?: CarePlanItem[];
}

export interface CarePlanItem {
  id: string;
  care_plan_id: string;
  item_type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  target_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export function useCarePlans(patientId?: string, encounterId?: string) {
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCarePlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("care_plans")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn),
          items:care_plan_items(*)
        `)
        .order("created_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }
      if (encounterId) {
        query = query.eq("encounter_id", encounterId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setCarePlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCarePlan = async (plan: {
    patient_id: string;
    encounter_id?: string;
    title: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from("care_plans")
        .insert({
          patient_id: plan.patient_id,
          encounter_id: plan.encounter_id,
          title: plan.title,
          start_date: plan.start_date || new Date().toISOString().split("T")[0],
          end_date: plan.end_date,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchCarePlans();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addCarePlanItem = async (item: {
    care_plan_id: string;
    item_type: "diagnosis" | "goal" | "intervention";
    title: string;
    description?: string;
    priority?: string;
    target_date?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from("care_plan_items")
        .insert({
          care_plan_id: item.care_plan_id,
          item_type: item.item_type,
          title: item.title,
          description: item.description,
          priority: item.priority || "medium",
          target_date: item.target_date,
          status: "active",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchCarePlans();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateCarePlanItem = async (
    itemId: string,
    updates: {
      status?: string;
      completed_at?: string;
    }
  ) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from("care_plan_items")
        .update({
          ...updates,
          completed_by: updates.status === "completed" ? user.id : undefined,
        })
        .eq("id", itemId);

      if (updateError) throw updateError;
      await fetchCarePlans();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCarePlans();
  }, [user, patientId, encounterId]);

  return {
    carePlans,
    loading,
    error,
    refetch: fetchCarePlans,
    createCarePlan,
    addCarePlanItem,
    updateCarePlanItem,
  };
}
