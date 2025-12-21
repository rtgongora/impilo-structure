import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Referral {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  referral_number: string;
  referral_type: string;
  from_department: string | null;
  to_department: string;
  to_provider_id: string | null;
  to_provider_name: string | null;
  urgency: string;
  status: string;
  reason: string;
  clinical_summary: string | null;
  requested_by: string | null;
  requested_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export function useReferrals(patientId?: string, encounterId?: string) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReferrals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("referrals")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("requested_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }
      if (encounterId) {
        query = query.eq("encounter_id", encounterId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setReferrals(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createReferral = async (referral: {
    patient_id: string;
    encounter_id?: string;
    referral_type: "internal" | "external" | "teleconsult";
    from_department?: string;
    to_department: string;
    to_provider_name?: string;
    urgency?: string;
    reason: string;
    clinical_summary?: string;
  }) => {
    if (!user) return null;

    try {
      // Generate referral number
      const { data: referralNumber } = await supabase.rpc("generate_referral_number");

      const { data, error: insertError } = await supabase
        .from("referrals")
        .insert({
          patient_id: referral.patient_id,
          encounter_id: referral.encounter_id,
          referral_number: referralNumber,
          referral_type: referral.referral_type,
          from_department: referral.from_department,
          to_department: referral.to_department,
          to_provider_name: referral.to_provider_name,
          urgency: referral.urgency || "routine",
          status: "pending",
          reason: referral.reason,
          clinical_summary: referral.clinical_summary,
          requested_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchReferrals();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateReferralStatus = async (
    referralId: string,
    status: string,
    notes?: string
  ) => {
    if (!user) return;

    try {
      const updates: Record<string, any> = { status };

      if (status === "accepted") {
        updates.accepted_by = user.id;
        updates.accepted_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completion_notes = notes;
      }

      const { error: updateError } = await supabase
        .from("referrals")
        .update(updates)
        .eq("id", referralId);

      if (updateError) throw updateError;
      await fetchReferrals();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user, patientId, encounterId]);

  return {
    referrals,
    loading,
    error,
    refetch: fetchReferrals,
    createReferral,
    updateReferralStatus,
  };
}
