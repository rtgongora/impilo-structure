import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LabOrder {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  order_number: string;
  ordered_by: string | null;
  ordered_at: string;
  priority: string;
  status: string;
  department: string | null;
  notes: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  results?: LabResult[];
}

export interface LabResult {
  id: string;
  lab_order_id: string;
  test_name: string;
  test_code: string | null;
  category: string | null;
  result_value: string | null;
  result_unit: string | null;
  reference_range: string | null;
  status: string;
  is_abnormal: boolean;
  is_critical: boolean;
  performed_at: string | null;
  verified_at: string | null;
  notes: string | null;
}

export function useLabOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("lab_orders")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn),
          results:lab_results(*)
        `)
        .order("ordered_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createLabOrder = async (order: {
    patient_id: string;
    encounter_id?: string;
    priority?: string;
    department?: string;
    notes?: string;
    tests: { test_name: string; test_code?: string; category?: string }[];
  }) => {
    if (!user) return null;

    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc("generate_lab_order_number");

      // Create the lab order
      const { data: newOrder, error: orderError } = await supabase
        .from("lab_orders")
        .insert({
          patient_id: order.patient_id,
          encounter_id: order.encounter_id,
          order_number: orderNumber,
          ordered_by: user.id,
          priority: order.priority || "routine",
          department: order.department,
          notes: order.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create lab results (pending) for each test
      if (order.tests && order.tests.length > 0) {
        const results = order.tests.map((test) => ({
          lab_order_id: newOrder.id,
          test_name: test.test_name,
          test_code: test.test_code,
          category: test.category,
          status: "pending",
        }));

        const { error: resultsError } = await supabase
          .from("lab_results")
          .insert(results);

        if (resultsError) throw resultsError;
      }

      await fetchOrders();
      return newOrder;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateLabResult = async (
    resultId: string,
    updates: {
      result_value?: string;
      is_abnormal?: boolean;
      is_critical?: boolean;
      status?: string;
    }
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("lab_results")
        .update({
          ...updates,
          performed_at: new Date().toISOString(),
        })
        .eq("id", resultId);

      if (updateError) throw updateError;
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createLabOrder,
    updateLabResult,
  };
}

export function useLabResults(encounterId?: string) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from("lab_results")
          .select(`
            *,
            lab_order:lab_orders(
              patient_id,
              encounter_id,
              order_number,
              patient:patients(first_name, last_name, mrn)
            )
          `)
          .order("created_at", { ascending: false });

        if (encounterId) {
          query = query.eq("lab_order.encounter_id", encounterId);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Error fetching lab results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, encounterId]);

  return { results, loading };
}
