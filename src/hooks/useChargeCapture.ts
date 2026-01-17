import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: 'markup' | 'discount' | 'fixed' | 'tiered' | 'time_based';
  applies_to: 'all' | 'category' | 'item' | 'payer' | 'service';
  target_id: string | null;
  conditions: Record<string, any>;
  adjustment_type: 'percentage' | 'fixed_amount';
  adjustment_value: number;
  priority: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChargeCaptureItem {
  id: string;
  source_type: 'consumable' | 'procedure' | 'lab' | 'imaging' | 'pharmacy' | 'manual';
  source_id: string;
  patient_id: string;
  encounter_id: string | null;
  visit_id: string | null;
  stock_item_id: string | null;
  charge_item_id: string | null;
  service_code: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  calculated_price: number | null;
  pricing_rule_id: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'billed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  captured_by: string | null;
  captured_at: string;
  created_at: string;
  patients?: { first_name: string; last_name: string; mrn: string };
  stock_items?: { name: string; sku: string };
  pricing_rules?: PricingRule;
}

export interface ChargeSheet {
  id: string;
  patient_id: string;
  visit_id: string;
  encounter_id: string | null;
  service_code: string;
  service_name: string;
  service_category: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  discount_percent: number | null;
  discount_amount: number | null;
  net_amount: number;
  status: string;
  service_date: string;
  created_at: string;
}

// Hook for pricing rules
export function usePricingRules() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as PricingRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule created");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create rule"),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule updated");
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pricing_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule deleted");
    },
  });

  const activeRules = (query.data || []).filter(r => r.is_active);

  return {
    rules: query.data || [],
    activeRules,
    isLoading: query.isLoading,
    error: query.error,
    createRule,
    updateRule,
    deleteRule,
    refetch: query.refetch,
  };
}

// Hook for charge capture queue
export function useChargeCaptureQueue(status?: string, patientId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["charge-capture-queue", status, patientId],
    queryFn: async () => {
      let q = supabase
        .from("charge_capture_queue")
        .select("*, patients(first_name, last_name, mrn), stock_items(name, sku), pricing_rules(*)")
        .order("captured_at", { ascending: false });
      if (status) q = q.eq("status", status);
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ChargeCaptureItem[];
    },
  });

  const captureCharge = useMutation({
    mutationFn: async (charge: Omit<ChargeCaptureItem, 'id' | 'created_at' | 'captured_at' | 'patients' | 'stock_items' | 'pricing_rules'>) => {
      // Apply pricing rules
      const calculatedPrice = await applyPricingRules(charge.service_code, charge.unit_price, charge.quantity);
      
      const { data, error } = await supabase
        .from("charge_capture_queue")
        .insert({
          ...charge,
          calculated_price: calculatedPrice.price,
          pricing_rule_id: calculatedPrice.ruleId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-capture-queue"] });
      toast.success("Charge captured");
    },
    onError: (error: any) => toast.error(error.message || "Failed to capture charge"),
  });

  const reviewCharge = useMutation({
    mutationFn: async ({ id, status, reviewedBy, rejectionReason }: {
      id: string;
      status: 'approved' | 'rejected';
      reviewedBy: string;
      rejectionReason?: string;
    }) => {
      const { error } = await supabase
        .from("charge_capture_queue")
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-capture-queue"] });
      toast.success("Charge reviewed");
    },
  });

  const billCharge = useMutation({
    mutationFn: async (chargeId: string) => {
      // Get the charge
      const { data: charge, error: fetchError } = await supabase
        .from("charge_capture_queue")
        .select("*")
        .eq("id", chargeId)
        .single();
      if (fetchError) throw fetchError;

      // Create charge sheet entry
      const { error: sheetError } = await supabase
        .from("charge_sheets")
        .insert({
          patient_id: charge.patient_id,
          visit_id: charge.visit_id,
          encounter_id: charge.encounter_id,
          service_code: charge.service_code,
          service_name: charge.service_name,
          quantity: charge.quantity,
          unit_price: charge.unit_price,
          total_amount: charge.unit_price * charge.quantity,
          net_amount: charge.calculated_price || (charge.unit_price * charge.quantity),
          status: 'pending',
          source_entity_type: charge.source_type,
          source_entity_id: charge.source_id,
        });
      if (sheetError) throw sheetError;

      // Update capture queue status
      const { error: updateError } = await supabase
        .from("charge_capture_queue")
        .update({ status: 'billed' })
        .eq("id", chargeId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-capture-queue"] });
      queryClient.invalidateQueries({ queryKey: ["charge-sheets"] });
      toast.success("Charge billed");
    },
  });

  const pendingCharges = (query.data || []).filter(c => c.status === 'pending');
  const approvedCharges = (query.data || []).filter(c => c.status === 'approved');

  return {
    charges: query.data || [],
    pendingCharges,
    approvedCharges,
    isLoading: query.isLoading,
    error: query.error,
    captureCharge,
    reviewCharge,
    billCharge,
    refetch: query.refetch,
  };
}

// Hook for charge sheets
export function useChargeSheets(patientId?: string, visitId?: string) {
  const query = useQuery({
    queryKey: ["charge-sheets", patientId, visitId],
    queryFn: async () => {
      let q = supabase
        .from("charge_sheets")
        .select("*")
        .order("service_date", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      if (visitId) q = q.eq("visit_id", visitId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ChargeSheet[];
    },
  });

  const totalAmount = (query.data || []).reduce((sum, c) => sum + (c.net_amount || 0), 0);
  const pendingAmount = (query.data || [])
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.net_amount || 0), 0);

  return {
    charges: query.data || [],
    totalAmount,
    pendingAmount,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Helper to apply pricing rules
async function applyPricingRules(
  serviceCode: string,
  unitPrice: number,
  quantity: number
): Promise<{ price: number; ruleId: string | null }> {
  // Fetch active pricing rules
  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("is_active", true)
    .lte("effective_from", new Date().toISOString().split('T')[0])
    .order("priority", { ascending: false });

  let finalPrice = unitPrice * quantity;
  let appliedRuleId: string | null = null;

  if (rules && rules.length > 0) {
    for (const rule of rules) {
      // Check if rule applies
      if (rule.applies_to === 'all' || 
          (rule.applies_to === 'service' && (rule.conditions as any)?.service_code === serviceCode)) {
        
        if (rule.adjustment_type === 'percentage') {
          if (rule.rule_type === 'markup') {
            finalPrice = finalPrice * (1 + rule.adjustment_value / 100);
          } else if (rule.rule_type === 'discount') {
            finalPrice = finalPrice * (1 - rule.adjustment_value / 100);
          }
        } else if (rule.adjustment_type === 'fixed_amount') {
          if (rule.rule_type === 'markup') {
            finalPrice = finalPrice + rule.adjustment_value;
          } else if (rule.rule_type === 'discount') {
            finalPrice = finalPrice - rule.adjustment_value;
          } else if (rule.rule_type === 'fixed') {
            finalPrice = rule.adjustment_value * quantity;
          }
        }
        
        appliedRuleId = rule.id;
        break; // Apply only the highest priority matching rule
      }
    }
  }

  return { price: Math.max(0, finalPrice), ruleId: appliedRuleId };
}

// Capture consumable usage as a charge
export async function captureConsumableCharge(
  consumableUsage: {
    id: string;
    stock_item_id: string;
    patient_id: string;
    encounter_id: string;
    quantity: number;
    unit_price: number;
  },
  stockItem: { name: string; sku: string },
  capturedBy: string
) {
  const { error } = await supabase
    .from("charge_capture_queue")
    .insert({
      source_type: 'consumable',
      source_id: consumableUsage.id,
      patient_id: consumableUsage.patient_id,
      encounter_id: consumableUsage.encounter_id,
      stock_item_id: consumableUsage.stock_item_id,
      service_code: stockItem.sku,
      service_name: stockItem.name,
      quantity: consumableUsage.quantity,
      unit_price: consumableUsage.unit_price,
      captured_by: capturedBy,
    });

  if (error) throw error;
  toast.success("Consumable charge captured");
}
