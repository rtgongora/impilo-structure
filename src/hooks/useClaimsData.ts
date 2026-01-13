import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ClaimStatus = Database["public"]["Enums"]["claim_status"];
type ClaimType = Database["public"]["Enums"]["claim_type"];

export type Claim = Database["public"]["Tables"]["claims"]["Row"] & {
  patient?: { first_name: string; last_name: string; mrn: string };
};

export type RemittanceAdvice = Database["public"]["Tables"]["remittance_advices"]["Row"];

export function useClaims(patientId?: string, status?: ClaimStatus) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClaims = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("claims")
        .select(`*, patient:patients(first_name, last_name, mrn)`)
        .order("created_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);
      if (status) query = query.eq("status", status);

      const { data, error: fetchError } = await query.limit(200);
      if (fetchError) throw fetchError;
      setClaims((data as Claim[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId, status]);

  const submitClaim = async (claimId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("claims")
        .update({
          status: "submitted" as ClaimStatus,
          submission_date: new Date().toISOString(),
          submitted_by: user?.id,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (updateError) throw updateError;
      await fetchClaims();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const createClaim = async (claim: {
    patient_id: string;
    visit_id?: string;
    claim_type: ClaimType;
    payer_name: string;
    member_id?: string;
    group_number?: string;
    total_claimed: number;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      // Generate claim number via RPC
      const { data: claimNumber } = await supabase.rpc("generate_claim_number");
      
      const { data, error: insertError } = await supabase
        .from("claims")
        .insert({
          claim_number: claimNumber || `CLM-${Date.now()}`,
          patient_id: claim.patient_id,
          visit_id: claim.visit_id,
          claim_type: claim.claim_type,
          payer_name: claim.payer_name,
          member_id: claim.member_id,
          group_number: claim.group_number,
          total_claimed: claim.total_claimed,
          notes: claim.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchClaims();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats = {
    draft: claims.filter(c => c.status === "draft").length,
    submitted: claims.filter(c => c.status === "submitted").length,
    processing: claims.filter(c => c.status === "processing").length,
    approved: claims.filter(c => c.status === "approved" || c.status === "partially_approved").length,
    denied: claims.filter(c => c.status === "denied").length,
    totalClaimed: claims.reduce((sum, c) => sum + c.total_claimed, 0),
    totalApproved: claims.reduce((sum, c) => sum + (c.total_approved || 0), 0),
    totalPaid: claims.reduce((sum, c) => sum + (c.amount_paid || 0), 0),
  };

  return { claims, loading, error, stats, refetch: fetchClaims, submitClaim, createClaim };
}

export function useRemittanceAdvices() {
  const [remittances, setRemittances] = useState<RemittanceAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRemittances = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("remittance_advices")
        .select("*")
        .order("payment_date", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setRemittances(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRemittances();
  }, [fetchRemittances]);

  const stats = {
    unprocessed: remittances.filter(r => !r.is_processed).length,
    totalReceived: remittances.reduce((sum, r) => sum + r.payment_amount, 0),
  };

  return { remittances, loading, error, stats, refetch: fetchRemittances };
}
