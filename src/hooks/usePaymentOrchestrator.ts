import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type PaymentRequest = Database["public"]["Tables"]["payment_requests"]["Row"] & {
  patient?: { first_name: string; last_name: string; mrn: string };
};

export type Receipt = Database["public"]["Tables"]["receipts"]["Row"] & {
  patient?: { first_name: string; last_name: string; mrn: string };
};

export type CashReconciliation = Database["public"]["Tables"]["cash_reconciliations"]["Row"];

export function usePaymentRequests(patientId?: string) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("payment_requests")
        .select(`*, patient:patients(first_name, last_name, mrn)`)
        .order("created_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setRequests((data as PaymentRequest[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createPaymentRequest = async (data: {
    patient_id: string;
    amount: number;
    purpose: string;
    preferred_channel?: string;
    invoice_id?: string;
    visit_id?: string;
    payer_name?: string;
    payer_phone?: string;
    payer_email?: string;
  }) => {
    const { data: result, error } = await supabase
      .from("payment_requests")
      .insert({
        ...data,
        payment_request_number: `PAY-${Date.now()}`,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchRequests();
    return result;
  };

  const stats = {
    pending: requests.filter(r => r.status === "pending").length,
    processing: requests.filter(r => r.status === "processing").length,
    completed: requests.filter(r => r.status === "paid").length,
    cash: requests.filter(r => r.preferred_channel === "cash").length,
    mobile: requests.filter(r => r.preferred_channel === "mobile_money").length,
    card: requests.filter(r => r.preferred_channel === "card").length,
    bank: requests.filter(r => r.preferred_channel === "bank_transfer").length,
  };

  return { requests, loading, error, stats, refetch: fetchRequests, createPaymentRequest };
}

export function useReceipts(patientId?: string) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReceipts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("receipts")
        .select(`*, patient:patients(first_name, last_name, mrn)`)
        .order("created_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setReceipts((data as Receipt[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const todayTotal = receipts
    .filter(r => {
      const today = new Date().toDateString();
      return new Date(r.receipt_date).toDateString() === today && !r.is_voided;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  return { receipts, loading, error, todayTotal, refetch: fetchReceipts };
}

export function useCashReconciliations(facilityId?: string) {
  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReconciliations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("cash_reconciliations")
        .select("*")
        .order("reconciliation_date", { ascending: false });

      if (facilityId) query = query.eq("facility_id", facilityId);

      const { data, error: fetchError } = await query.limit(50);
      if (fetchError) throw fetchError;
      setReconciliations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, facilityId]);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  const createReconciliation = async (data: {
    facility_id: string;
    reconciliation_date: string;
    opening_balance: number;
    expected_cash: number;
    actual_cash?: number;
  }) => {
    const { data: result, error } = await supabase
      .from("cash_reconciliations")
      .insert({
        ...data,
        cashier_id: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchReconciliations();
    return result;
  };

  const submitReconciliation = async (id: string, actualCash: number, varianceExplanation?: string) => {
    const expectedCash = reconciliations.find(r => r.id === id)?.expected_cash || 0;
    const variance = actualCash - expectedCash;

    const { error } = await supabase
      .from("cash_reconciliations")
      .update({
        actual_cash: actualCash,
        variance,
        variance_explanation: varianceExplanation,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        submitted_by: user?.id,
      })
      .eq("id", id);

    if (error) throw error;
    await fetchReconciliations();
  };

  return { reconciliations, loading, error, refetch: fetchReconciliations, createReconciliation, submitReconciliation };
}
