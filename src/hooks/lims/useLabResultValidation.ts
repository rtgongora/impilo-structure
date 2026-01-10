import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ResultValidationData {
  result_value: string;
  result_unit?: string;
  is_abnormal?: boolean;
  is_critical?: boolean;
  notes?: string;
  method?: string;
  analyzer_id?: string;
}

export function useLabResultValidation() {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  // Enter result value
  const enterResult = async (resultId: string, data: ResultValidationData) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("lab_results")
        .update({
          result_value: data.result_value,
          result_unit: data.result_unit,
          is_abnormal: data.is_abnormal,
          is_critical: data.is_critical,
          notes: data.notes,
          method: data.method,
          analyzer_id: data.analyzer_id,
          performed_at: new Date().toISOString(),
          performed_by: user.id,
          status: "resulted",
        })
        .eq("id", resultId);

      if (error) throw error;

      // Check for critical values and create alert
      if (data.is_critical) {
        await createCriticalAlert(resultId, data);
      }

      // Log workflow event
      await supabase.from("lab_workflow_events").insert({
        entity_type: "result",
        entity_id: resultId,
        event_type: "result_entered",
        to_status: "resulted",
        performed_by: user.id,
      });

      toast.success("Result entered");
      return true;
    } catch (err) {
      toast.error("Failed to enter result");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Technical validation (lab tech)
  const technicalValidate = async (resultId: string, approved: boolean, notes?: string) => {
    if (!user) return false;

    setProcessing(true);
    try {
      const updateData: any = {
        technical_validated_at: new Date().toISOString(),
        technical_validated_by: user.id,
      };

      if (approved) {
        updateData.status = "verified";
      } else {
        updateData.status = "rejected";
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from("lab_results")
        .update(updateData)
        .eq("id", resultId);

      if (error) throw error;

      await supabase.from("lab_workflow_events").insert({
        entity_type: "result",
        entity_id: resultId,
        event_type: approved ? "technical_validated" : "technical_rejected",
        to_status: updateData.status,
        performed_by: user.id,
        notes,
      });

      toast.success(approved ? "Result technically validated" : "Result rejected");
      return true;
    } catch (err) {
      toast.error("Failed to validate result");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Clinical validation (pathologist/clinician)
  const clinicalValidate = async (resultId: string, approved: boolean, interpretation?: string) => {
    if (!user) return false;

    setProcessing(true);
    try {
      const updateData: any = {
        clinical_validated_at: new Date().toISOString(),
        clinical_validated_by: user.id,
        result_interpretation: interpretation,
      };

      if (approved) {
        updateData.status = "verified";
      }

      const { error } = await supabase
        .from("lab_results")
        .update(updateData)
        .eq("id", resultId);

      if (error) throw error;

      await supabase.from("lab_workflow_events").insert({
        entity_type: "result",
        entity_id: resultId,
        event_type: "clinical_validated",
        to_status: "verified",
        performed_by: user.id,
        notes: interpretation,
      });

      toast.success("Result clinically validated");
      return true;
    } catch (err) {
      toast.error("Failed to validate result");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Release result
  const releaseResult = async (resultId: string) => {
    if (!user) return false;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("lab_results")
        .update({
          status: "completed",
          released_at: new Date().toISOString(),
          released_by: user.id,
        })
        .eq("id", resultId);

      if (error) throw error;

      await supabase.from("lab_workflow_events").insert({
        entity_type: "result",
        entity_id: resultId,
        event_type: "result_released",
        to_status: "completed",
        performed_by: user.id,
      });

      toast.success("Result released");
      return true;
    } catch (err) {
      toast.error("Failed to release result");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Batch release
  const batchReleaseResults = async (resultIds: string[]) => {
    if (!user || resultIds.length === 0) return false;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("lab_results")
        .update({
          status: "completed",
          released_at: new Date().toISOString(),
          released_by: user.id,
        })
        .in("id", resultIds);

      if (error) throw error;

      // Log events for each
      const events = resultIds.map(id => ({
        entity_type: "result" as const,
        entity_id: id,
        event_type: "result_released",
        to_status: "completed",
        performed_by: user.id,
      }));

      await supabase.from("lab_workflow_events").insert(events);

      toast.success(`${resultIds.length} result(s) released`);
      return true;
    } catch (err) {
      toast.error("Failed to release results");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const createCriticalAlert = async (resultId: string, data: ResultValidationData) => {
    // Get result details
    const { data: result } = await supabase
      .from("lab_results")
      .select(`
        *,
        lab_order:lab_orders(patient_id, encounter_id)
      `)
      .eq("id", resultId)
      .single();

    if (!result || !result.lab_order) return;

    await supabase.from("lab_critical_alerts").insert({
      lab_result_id: resultId,
      patient_id: result.lab_order.patient_id,
      encounter_id: result.lab_order.encounter_id,
      test_name: result.test_name,
      result_value: data.result_value,
      critical_type: "panic",
      alert_message: `CRITICAL: ${result.test_name} = ${data.result_value} ${data.result_unit || ""}`,
      urgency: "critical",
      status: "pending",
    });
  };

  return {
    enterResult,
    technicalValidate,
    clinicalValidate,
    releaseResult,
    batchReleaseResults,
    processing,
  };
}
