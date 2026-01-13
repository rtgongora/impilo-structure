import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ChargeStatus = Database["public"]["Enums"]["charge_status"];
type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type FinancialState = Database["public"]["Enums"]["financial_state"];

export type ChargeSheet = Database["public"]["Tables"]["charge_sheets"]["Row"] & {
  patient?: { first_name: string; last_name: string; mrn: string };
};

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  patient?: { first_name: string; last_name: string; mrn: string };
};

export type VisitFinancialAccount = Database["public"]["Tables"]["visit_financial_accounts"]["Row"];

export function useChargeSheets(visitId?: string, patientId?: string) {
  const [charges, setCharges] = useState<ChargeSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCharges = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("charge_sheets")
        .select(`*, patient:patients(first_name, last_name, mrn)`)
        .order("created_at", { ascending: false });

      if (visitId) query = query.eq("visit_id", visitId);
      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(200);
      if (fetchError) throw fetchError;
      setCharges((data as ChargeSheet[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, visitId, patientId]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const totals = {
    pending: charges.filter(c => c.status === "pending").reduce((sum, c) => sum + c.net_amount, 0),
    billed: charges.filter(c => c.status === "billed").reduce((sum, c) => sum + c.net_amount, 0),
    total: charges.reduce((sum, c) => sum + c.net_amount, 0),
  };

  return { charges, loading, error, totals, refetch: fetchCharges };
}

export function useInvoices(patientId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("invoices")
        .select(`*, patient:patients(first_name, last_name, mrn)`)
        .order("created_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setInvoices((data as Invoice[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const stats = {
    totalOutstanding: invoices.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.balance_due, 0),
    overdueCount: invoices.filter(i => i.status === "overdue").length,
    draftCount: invoices.filter(i => i.status === "draft").length,
  };

  return { invoices, loading, error, stats, refetch: fetchInvoices };
}

export function useVisitAccounts(patientId?: string) {
  const [accounts, setAccounts] = useState<VisitFinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("visit_financial_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: fetchError } = await query.limit(100);
      if (fetchError) throw fetchError;
      setAccounts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
}
