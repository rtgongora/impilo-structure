import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QCLot {
  id: string;
  lot_number: string;
  material_name: string;
  manufacturer: string | null;
  test_catalog_id: string | null;
  analyzer_id: string | null;
  level: string;
  target_mean: number;
  target_sd: number;
  unit: string | null;
  expiry_date: string;
  opened_at: string | null;
  is_active: boolean;
}

export interface QCRun {
  id: string;
  qc_lot_id: string;
  analyzer_id: string;
  run_date: string;
  run_time: string;
  performed_by: string;
  result_value: number;
  z_score: number | null;
  cv_percent: number | null;
  status: "pending" | "accepted" | "rejected" | "warning";
  westgard_rules_violated: string[] | null;
  comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  qc_lot?: QCLot;
}

// Westgard rules checker
export function checkWestgardRules(
  value: number,
  mean: number,
  sd: number,
  previousRuns: number[] = []
): { passed: boolean; violations: string[]; zScore: number } {
  const violations: string[] = [];
  const zScore = (value - mean) / sd;

  // 1:3s rule - single value exceeds mean ± 3SD
  if (Math.abs(zScore) > 3) {
    violations.push("1:3s");
  }

  // 1:2s rule - warning, single value exceeds mean ± 2SD
  if (Math.abs(zScore) > 2 && Math.abs(zScore) <= 3) {
    violations.push("1:2s (warning)");
  }

  if (previousRuns.length >= 1) {
    const prevZScore = (previousRuns[0] - mean) / sd;
    
    // 2:2s rule - two consecutive values exceed mean + 2SD or mean - 2SD
    if ((zScore > 2 && prevZScore > 2) || (zScore < -2 && prevZScore < -2)) {
      violations.push("2:2s");
    }

    // R:4s rule - one value exceeds +2SD and another exceeds -2SD
    if ((zScore > 2 && prevZScore < -2) || (zScore < -2 && prevZScore > 2)) {
      violations.push("R:4s");
    }
  }

  if (previousRuns.length >= 3) {
    const allZScores = [zScore, ...previousRuns.slice(0, 3).map(v => (v - mean) / sd)];
    
    // 4:1s rule - four consecutive values exceed mean + 1SD or mean - 1SD
    if (allZScores.every(z => z > 1) || allZScores.every(z => z < -1)) {
      violations.push("4:1s");
    }
  }

  if (previousRuns.length >= 9) {
    const allZScores = [zScore, ...previousRuns.slice(0, 9).map(v => (v - mean) / sd)];
    
    // 10x rule - ten consecutive values on same side of mean
    if (allZScores.every(z => z > 0) || allZScores.every(z => z < 0)) {
      violations.push("10x");
    }
  }

  const realViolations = violations.filter(v => !v.includes("warning"));
  
  return {
    passed: realViolations.length === 0,
    violations,
    zScore,
  };
}

export function useQCLots(analyzerId?: string) {
  const [lots, setLots] = useState<QCLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      setLoading(true);
      let query = supabase
        .from("lab_qc_lots")
        .select("*")
        .eq("is_active", true)
        .order("material_name");

      if (analyzerId) {
        query = query.eq("analyzer_id", analyzerId);
      }

      const { data, error } = await query;
      if (!error) {
        setLots((data as QCLot[]) || []);
      }
      setLoading(false);
    };

    fetchLots();
  }, [analyzerId]);

  return { lots, loading };
}

export function useQCRuns(analyzerId?: string, dateFrom?: string, dateTo?: string) {
  const [runs, setRuns] = useState<QCRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRuns = async () => {
    setLoading(true);
    let query = supabase
      .from("lab_qc_runs")
      .select(`
        *,
        qc_lot:lab_qc_lots(*)
      `)
      .order("run_time", { ascending: false })
      .limit(100);

    if (analyzerId) {
      query = query.eq("analyzer_id", analyzerId);
    }
    if (dateFrom) {
      query = query.gte("run_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("run_date", dateTo);
    }

    const { data, error } = await query;
    if (!error) {
      setRuns((data as QCRun[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRuns();
  }, [analyzerId, dateFrom, dateTo]);

  const recordQCRun = async (
    qcLotId: string,
    analyzerId: string,
    resultValue: number
  ) => {
    if (!user) {
      toast.error("You must be logged in to record QC");
      return null;
    }

    try {
      // Get the QC lot for mean/SD
      const { data: lot } = await supabase
        .from("lab_qc_lots")
        .select("target_mean, target_sd")
        .eq("id", qcLotId)
        .single();

      if (!lot) throw new Error("QC lot not found");

      // Get previous runs for Westgard rules
      const { data: prevRuns } = await supabase
        .from("lab_qc_runs")
        .select("result_value")
        .eq("qc_lot_id", qcLotId)
        .eq("analyzer_id", analyzerId)
        .order("run_time", { ascending: false })
        .limit(10);

      const previousValues = prevRuns?.map(r => r.result_value) || [];
      const westgard = checkWestgardRules(resultValue, lot.target_mean, lot.target_sd, previousValues);

      let status: QCRun["status"] = "accepted";
      if (!westgard.passed) {
        status = "rejected";
      } else if (westgard.violations.length > 0) {
        status = "warning";
      }

      const cv = (lot.target_sd / lot.target_mean) * 100;

      const { data, error } = await supabase
        .from("lab_qc_runs")
        .insert({
          qc_lot_id: qcLotId,
          analyzer_id: analyzerId,
          performed_by: user.id,
          result_value: resultValue,
          z_score: westgard.zScore,
          cv_percent: cv,
          status,
          westgard_rules_violated: westgard.violations.length > 0 ? westgard.violations : null,
        })
        .select()
        .single();

      if (error) throw error;

      if (status === "rejected") {
        toast.error("QC Failed - Westgard rule violation detected");
      } else if (status === "warning") {
        toast.warning("QC Warning - Review recommended");
      } else {
        toast.success("QC Run recorded successfully");
      }

      await fetchRuns();
      return data;
    } catch (err: any) {
      toast.error(`Failed to record QC: ${err.message}`);
      return null;
    }
  };

  const reviewQCRun = async (runId: string, approved: boolean, comments?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("lab_qc_runs")
        .update({
          status: approved ? "accepted" : "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          comments,
        })
        .eq("id", runId);

      if (error) throw error;
      toast.success(`QC Run ${approved ? "approved" : "rejected"}`);
      await fetchRuns();
      return true;
    } catch (err) {
      toast.error("Failed to review QC run");
      return false;
    }
  };

  return { runs, loading, refetch: fetchRuns, recordQCRun, reviewQCRun };
}
