import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClinicalAlert {
  id: string;
  patient_id: string | null;
  encounter_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  source: string | null;
  source_id: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  expires_at: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export function useClinicalAlerts(patientId?: string, encounterId?: string) {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("clinical_alerts")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }
      if (encounterId) {
        query = query.eq("encounter_id", encounterId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setAlerts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alert: {
    patient_id?: string;
    encounter_id?: string;
    alert_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    message: string;
    source?: string;
    source_id?: string;
    expires_at?: string;
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from("clinical_alerts")
        .insert(alert)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchAlerts();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from("clinical_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (updateError) throw updateError;
      await fetchAlerts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from("clinical_alerts")
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (updateError) throw updateError;
      await fetchAlerts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("clinical-alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinical_alerts",
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, patientId, encounterId]);

  const activeAlerts = alerts.filter((a) => !a.is_acknowledged);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  return {
    alerts,
    activeAlerts,
    criticalCount,
    warningCount,
    loading,
    error,
    refetch: fetchAlerts,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
  };
}
