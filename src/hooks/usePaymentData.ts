import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PaymentTransaction {
  id: string;
  encounter_id: string | null;
  patient_id: string;
  transaction_number: string;
  transaction_type: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  reference_number: string | null;
  notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export interface InsuranceClaim {
  id: string;
  encounter_id: string | null;
  patient_id: string;
  claim_number: string;
  insurance_provider: string;
  policy_number: string | null;
  total_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string | null;
  response_at: string | null;
  denial_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export function usePaymentTransactions(patientId?: string) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("payment_transactions")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("created_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transaction: {
    patient_id: string;
    encounter_id?: string;
    transaction_type: "payment" | "refund" | "adjustment";
    payment_method: string;
    amount: number;
    currency?: string;
    reference_number?: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data: transactionNumber } = await supabase.rpc("generate_transaction_number");

      const { data, error: insertError } = await supabase
        .from("payment_transactions")
        .insert({
          patient_id: transaction.patient_id,
          encounter_id: transaction.encounter_id,
          transaction_number: transactionNumber,
          transaction_type: transaction.transaction_type,
          payment_method: transaction.payment_method,
          amount: transaction.amount,
          currency: transaction.currency || "USD",
          status: "completed",
          reference_number: transaction.reference_number,
          notes: transaction.notes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchTransactions();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, patientId]);

  // Calculate totals
  const todayTotal = transactions
    .filter((t) => {
      const today = new Date().toDateString();
      return new Date(t.created_at).toDateString() === today && t.status === "completed";
    })
    .reduce((sum, t) => sum + (t.transaction_type === "refund" ? -t.amount : t.amount), 0);

  const pendingTotal = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions,
    loading,
    error,
    todayTotal,
    pendingTotal,
    refetch: fetchTransactions,
    createTransaction,
  };
}

export function useInsuranceClaims(patientId?: string) {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClaims = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("insurance_claims")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("created_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setClaims(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (claim: {
    patient_id: string;
    encounter_id?: string;
    insurance_provider: string;
    policy_number?: string;
    total_amount: number;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data: claimNumber } = await supabase.rpc("generate_claim_number");

      const { data, error: insertError } = await supabase
        .from("insurance_claims")
        .insert({
          patient_id: claim.patient_id,
          encounter_id: claim.encounter_id,
          claim_number: claimNumber,
          insurance_provider: claim.insurance_provider,
          policy_number: claim.policy_number,
          total_amount: claim.total_amount,
          status: "draft",
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

  const submitClaim = async (claimId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("insurance_claims")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (updateError) throw updateError;
      await fetchClaims();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [user, patientId]);

  return {
    claims,
    loading,
    error,
    refetch: fetchClaims,
    createClaim,
    submitClaim,
  };
}
