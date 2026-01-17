import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface StockItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_of_measure: string;
  unit_cost: number;
  selling_price: number;
  reorder_level: number;
  reorder_quantity: number;
  is_consumable: boolean;
  is_chargeable: boolean;
  requires_prescription: boolean;
  storage_conditions: string | null;
  supplier_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockLevel {
  id: string;
  item_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  batch_number: string | null;
  expiry_date: string | null;
  last_counted_at: string | null;
  updated_at: string;
  stock_items?: StockItem;
  stock_locations?: StockLocation;
}

export interface StockLocation {
  id: string;
  name: string;
  location_type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  movement_type: string;
  quantity: number;
  batch_number: string | null;
  reason: string | null;
  reference_number: string | null;
  encounter_id: string | null;
  unit_cost: number | null;
  performed_by: string | null;
  created_at: string;
  stock_items?: StockItem;
  from_location?: StockLocation;
  to_location?: StockLocation;
}

export interface StockAlert {
  id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock';
  stock_item_id: string;
  location_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  current_quantity: number | null;
  threshold_quantity: number | null;
  expiry_date: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  stock_items?: StockItem;
  stock_locations?: StockLocation;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string | null;
  facility_id: string | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: { id: string; name: string };
  purchase_order_items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  stock_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  stock_items?: StockItem;
}

export interface StockCount {
  id: string;
  count_number: string;
  count_type: 'cycle' | 'full' | 'spot' | 'annual';
  location_id: string | null;
  status: 'planned' | 'in_progress' | 'pending_review' | 'approved' | 'cancelled';
  count_date: string;
  performed_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stock_locations?: StockLocation;
  stock_count_items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  stock_item_id: string;
  stock_level_id: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number;
  variance_reason: string | null;
  counted_at: string | null;
  counted_by: string | null;
  created_at: string;
  stock_items?: StockItem;
}

// Hook for stock items
export function useStockItems() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as StockItem[];
    },
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("stock_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast.success("Stock item added");
    },
    onError: (error: any) => toast.error(error.message || "Failed to add item"),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StockItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("stock_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast.success("Stock item updated");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update item"),
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addItem,
    updateItem,
    refetch: query.refetch,
  };
}

// Hook for stock levels
export function useStockLevels(locationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-levels", locationId],
    queryFn: async () => {
      let q = supabase
        .from("stock_levels")
        .select("*, stock_items(*), stock_locations(*)");
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return data as StockLevel[];
    },
  });

  return {
    levels: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook for stock alerts
export function useStockAlerts(resolved = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-alerts", resolved],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select("*, stock_items(*), stock_locations(*)")
        .eq("is_resolved", resolved)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StockAlert[];
    },
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async ({ id, acknowledgedBy }: { id: string; acknowledgedBy: string }) => {
      const { error } = await supabase
        .from("stock_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Alert acknowledged");
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stock_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Alert resolved");
    },
  });

  const criticalAlerts = (query.data || []).filter(a => a.severity === 'critical');
  const warningAlerts = (query.data || []).filter(a => a.severity === 'warning');

  return {
    alerts: query.data || [],
    criticalAlerts,
    warningAlerts,
    isLoading: query.isLoading,
    error: query.error,
    acknowledgeAlert,
    resolveAlert,
    refetch: query.refetch,
  };
}

// Hook for purchase orders
export function usePurchaseOrders(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["purchase-orders", status],
    queryFn: async () => {
      let q = supabase
        .from("purchase_orders")
        .select("*, suppliers(id, name)")
        .order("order_date", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const createOrder = useMutation({
    mutationFn: async (order: Partial<PurchaseOrder>) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert({ 
          order_number: '', // Will be auto-generated
          ...order 
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create PO"),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, approvedBy }: { id: string; status: string; approvedBy?: string }) => {
      const updates: any = { status };
      if (status === 'approved' && approvedBy) {
        updates.approved_by = approvedBy;
        updates.approved_at = new Date().toISOString();
      }
      if (status === 'received') {
        updates.actual_delivery_date = new Date().toISOString().split('T')[0];
      }
      const { error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order updated");
    },
  });

  const addOrderItem = useMutation({
    mutationFn: async (item: Omit<PurchaseOrderItem, 'id' | 'created_at' | 'total_cost'>) => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Item added to order");
    },
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createOrder,
    updateOrderStatus,
    addOrderItem,
    refetch: query.refetch,
  };
}

// Hook for stock counts
export function useStockCounts(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-counts", status],
    queryFn: async () => {
      let q = supabase
        .from("stock_counts")
        .select("*, stock_locations(*)")
        .order("count_date", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as StockCount[];
    },
  });

  const createCount = useMutation({
    mutationFn: async (count: Partial<StockCount>) => {
      const { data, error } = await supabase
        .from("stock_counts")
        .insert({
          count_number: '', // Will be auto-generated
          ...count,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
      toast.success("Stock count created");
    },
  });

  const updateCountStatus = useMutation({
    mutationFn: async ({ id, status, reviewedBy }: { id: string; status: string; reviewedBy?: string }) => {
      const updates: any = { status };
      if (status === 'approved' && reviewedBy) {
        updates.reviewed_by = reviewedBy;
        updates.reviewed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("stock_counts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
      toast.success("Stock count updated");
    },
  });

  const recordCountItem = useMutation({
    mutationFn: async ({ id, countedQuantity, countedBy, varianceReason }: {
      id: string;
      countedQuantity: number;
      countedBy: string;
      varianceReason?: string;
    }) => {
      const { error } = await supabase
        .from("stock_count_items")
        .update({
          counted_quantity: countedQuantity,
          counted_by: countedBy,
          counted_at: new Date().toISOString(),
          variance_reason: varianceReason,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
      toast.success("Count recorded");
    },
  });

  return {
    counts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createCount,
    updateCountStatus,
    recordCountItem,
    refetch: query.refetch,
  };
}

// Hook for stock movements
export function useStockMovements(itemId?: string, locationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stock-movements", itemId, locationId],
    queryFn: async () => {
      let q = supabase
        .from("stock_movements")
        .select("*, stock_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (itemId) q = q.eq("item_id", itemId);
      if (locationId) q = q.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);
      const { data, error } = await q;
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const recordMovement = useMutation({
    mutationFn: async (movement: {
      item_id: string;
      from_location_id?: string | null;
      to_location_id?: string | null;
      movement_type: string;
      quantity: number;
      batch_number?: string | null;
      reason?: string | null;
      performed_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert(movement)
        .select()
        .single();
      if (error) throw error;
      
      // Update stock levels based on movement type
      if (movement.movement_type === 'receipt' && movement.to_location_id) {
        await updateStockLevel(movement.item_id, movement.to_location_id, movement.quantity, 'add', movement.batch_number);
      } else if (movement.movement_type === 'issue' && movement.from_location_id) {
        await updateStockLevel(movement.item_id, movement.from_location_id, movement.quantity, 'subtract');
      } else if (movement.movement_type === 'transfer' && movement.from_location_id && movement.to_location_id) {
        await updateStockLevel(movement.item_id, movement.from_location_id, movement.quantity, 'subtract');
        await updateStockLevel(movement.item_id, movement.to_location_id, movement.quantity, 'add', movement.batch_number);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      toast.success("Movement recorded");
    },
    onError: (error: any) => toast.error(error.message || "Failed to record movement"),
  });

  return {
    movements: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    recordMovement,
    refetch: query.refetch,
  };
}

// Helper to update stock levels
async function updateStockLevel(
  itemId: string, 
  locationId: string, 
  quantity: number, 
  operation: 'add' | 'subtract',
  batchNumber?: string | null
) {
  const { data: existing } = await supabase
    .from("stock_levels")
    .select("*")
    .eq("item_id", itemId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (existing) {
    const newQty = operation === 'add' 
      ? existing.quantity_on_hand + quantity 
      : Math.max(0, existing.quantity_on_hand - quantity);
    await supabase
      .from("stock_levels")
      .update({ quantity_on_hand: newQty, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else if (operation === 'add') {
    await supabase.from("stock_levels").insert({
      item_id: itemId,
      location_id: locationId,
      quantity_on_hand: quantity,
      batch_number: batchNumber,
    });
  }
}

// Generate stock alerts (calls the DB function)
export async function generateStockAlerts() {
  const { error } = await supabase.rpc('generate_stock_alerts');
  if (error) throw error;
  toast.success("Stock alerts refreshed");
}
