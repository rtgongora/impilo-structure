import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";

type CostCategory = Database["public"]["Enums"]["cost_category"];
type CostEventType = Database["public"]["Enums"]["cost_event_type"];

export type CostRate = Database["public"]["Tables"]["cost_rates"]["Row"];

export type CostEvent = Database["public"]["Tables"]["cost_events"]["Row"];

export type VisitCostSummary = Database["public"]["Tables"]["visit_cost_summaries"]["Row"];

export function useCostRates(facilityId?: string) {
  const [rates, setRates] = useState<CostRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRates = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("cost_rates")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (facilityId) query = query.eq("facility_id", facilityId);

      const { data, error: fetchError } = await query.limit(200);
      if (fetchError) throw fetchError;
      setRates(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, facilityId]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates };
}

export function useCostEvents(visitId?: string, encounterId?: string) {
  const [events, setEvents] = useState<CostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("cost_events")
        .select("*")
        .order("event_timestamp", { ascending: false });

      if (visitId) query = query.eq("visit_id", visitId);
      if (encounterId) query = query.eq("encounter_id", encounterId);

      const { data, error: fetchError } = await query.limit(500);
      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, visitId, encounterId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const totals = {
    total: events.reduce((sum, e) => sum + e.total_internal_cost, 0),
  };

  return { events, loading, error, totals, refetch: fetchEvents };
}

export function useVisitCostSummaries(patientId?: string) {
  const [summaries, setSummaries] = useState<VisitCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSummaries = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("visit_cost_summaries")
        .select("*")
        .order("last_calculated_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setSummaries(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return { summaries, loading, error, refetch: fetchSummaries };
}
