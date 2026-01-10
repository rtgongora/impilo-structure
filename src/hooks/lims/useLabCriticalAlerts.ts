import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LabCriticalAlert {
  id: string;
  lab_result_id: string;
  patient_id: string;
  encounter_id: string | null;
  test_name: string;
  result_value: string;
  critical_type: "high" | "low" | "abnormal" | "panic";
  alert_message: string;
  urgency: "high" | "critical" | "urgent";
  notified_providers: string[] | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  status: "pending" | "notified" | "acknowledged" | "escalated" | "resolved";
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export function useLabCriticalAlerts(status?: string) {
  const [alerts, setAlerts] = useState<LabCriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("lab_critical_alerts")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq("status", status);
      } else {
        // Default to showing pending/notified/escalated (active alerts)
        query = query.in("status", ["pending", "notified", "escalated"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlerts((data as LabCriticalAlert[]) || []);
    } catch (err) {
      console.error("Error fetching critical alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("lab_critical_alerts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lab_critical_alerts" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("lab_critical_alerts")
        .update({
          status: "acknowledged",
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert acknowledged");
      await fetchAlerts();
      return true;
    } catch (err) {
      toast.error("Failed to acknowledge alert");
      return false;
    }
  };

  const escalateAlert = async (alertId: string, escalateTo?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("lab_critical_alerts")
        .update({
          status: "escalated",
          escalated_at: new Date().toISOString(),
          escalated_to: escalateTo || null,
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.warning("Alert escalated");
      await fetchAlerts();
      return true;
    } catch (err) {
      toast.error("Failed to escalate alert");
      return false;
    }
  };

  const resolveAlert = async (alertId: string, notes?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("lab_critical_alerts")
        .update({
          status: "resolved",
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert resolved");
      await fetchAlerts();
      return true;
    } catch (err) {
      toast.error("Failed to resolve alert");
      return false;
    }
  };

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status === "pending").length,
    acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    escalated: alerts.filter(a => a.status === "escalated").length,
    critical: alerts.filter(a => a.urgency === "critical").length,
  };

  return {
    alerts,
    loading,
    stats,
    refetch: fetchAlerts,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
  };
}
