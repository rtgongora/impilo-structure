import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LabAnalyzer {
  id: string;
  analyzer_code: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  department: string | null;
  facility_id: string | null;
  status: "online" | "offline" | "maintenance" | "error" | "calibrating";
  connection_type: string | null;
  connection_config: Record<string, any> | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  last_calibration_at: string | null;
  uptime_percent: number;
  tests_supported: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLabAnalyzers(facilityId?: string) {
  const [analyzers, setAnalyzers] = useState<LabAnalyzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyzers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("lab_analyzers")
        .select("*")
        .eq("is_active", true)
        .order("department")
        .order("name");

      if (facilityId) {
        query = query.eq("facility_id", facilityId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setAnalyzers((data as LabAnalyzer[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyzers();
  }, [facilityId]);

  const updateAnalyzerStatus = async (analyzerId: string, status: LabAnalyzer["status"]) => {
    try {
      const { error } = await supabase
        .from("lab_analyzers")
        .update({ status })
        .eq("id", analyzerId);

      if (error) throw error;
      await fetchAnalyzers();
      return true;
    } catch (err) {
      console.error("Error updating analyzer status:", err);
      return false;
    }
  };

  const stats = {
    total: analyzers.length,
    online: analyzers.filter(a => a.status === "online").length,
    offline: analyzers.filter(a => a.status === "offline").length,
    maintenance: analyzers.filter(a => a.status === "maintenance").length,
    error: analyzers.filter(a => a.status === "error").length,
    averageUptime: analyzers.length > 0 
      ? analyzers.reduce((sum, a) => sum + (a.uptime_percent || 0), 0) / analyzers.length
      : 0,
  };

  return { analyzers, loading, error, stats, refetch: fetchAnalyzers, updateAnalyzerStatus };
}
