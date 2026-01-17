-- =====================================================
-- STOCK MANAGEMENT MODULE - Enhanced Tables
-- =====================================================

-- 1. Purchase Orders for reorder workflow
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  facility_id UUID REFERENCES public.facilities(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partial_received', 'received', 'cancelled')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Purchase Order Line Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Stock Alerts for reorder & expiry notifications
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'overstock')),
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  location_id UUID REFERENCES public.stock_locations(id),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  current_quantity INTEGER,
  threshold_quantity INTEGER,
  expiry_date DATE,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Stock Counts for inventory audits
CREATE TABLE IF NOT EXISTS public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_number TEXT NOT NULL UNIQUE,
  count_type TEXT NOT NULL DEFAULT 'cycle' CHECK (count_type IN ('cycle', 'full', 'spot', 'annual')),
  location_id UUID REFERENCES public.stock_locations(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'pending_review', 'approved', 'cancelled')),
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performed_by TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Stock Count Items
CREATE TABLE IF NOT EXISTS public.stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  stock_level_id UUID REFERENCES public.stock_levels(id),
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - expected_quantity) STORED,
  variance_reason TEXT,
  counted_at TIMESTAMPTZ,
  counted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CONSUMABLES & CHARGES MODULE - Enhanced Tables
-- =====================================================

-- 6. Pricing Rules Engine
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('markup', 'discount', 'fixed', 'tiered', 'time_based')),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'category', 'item', 'payer', 'service')),
  target_id UUID, -- category_id, item_id, payer_id based on applies_to
  conditions JSONB DEFAULT '{}'::jsonb,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount')),
  adjustment_value NUMERIC(10,2) NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Charge Capture Queue (pending charges awaiting review)
CREATE TABLE IF NOT EXISTS public.charge_capture_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('consumable', 'procedure', 'lab', 'imaging', 'pharmacy', 'manual')),
  source_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  visit_id UUID REFERENCES public.visits(id),
  stock_item_id UUID REFERENCES public.stock_items(id),
  charge_item_id UUID REFERENCES public.charge_items(id),
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  calculated_price NUMERIC(10,2), -- After pricing rules applied
  pricing_rule_id UUID REFERENCES public.pricing_rules(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'billed')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  captured_by TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON public.stock_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_item ON public.stock_alerts(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON public.stock_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON public.stock_counts(status);
CREATE INDEX IF NOT EXISTS idx_charge_capture_queue_status ON public.charge_capture_queue(status);
CREATE INDEX IF NOT EXISTS idx_charge_capture_queue_patient ON public.charge_capture_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(is_active) WHERE is_active = true;

-- 9. Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_capture_queue ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies (authenticated users can CRUD)
CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage PO items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage stock alerts" ON public.stock_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage stock counts" ON public.stock_counts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage stock count items" ON public.stock_count_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage pricing rules" ON public.pricing_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage charge capture" ON public.charge_capture_queue FOR ALL USING (true) WITH CHECK (true);

-- 11. Function to generate stock alerts
CREATE OR REPLACE FUNCTION public.generate_stock_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  -- Low stock alerts
  FOR item IN 
    SELECT si.id as stock_item_id, si.name, si.reorder_level, 
           COALESCE(SUM(sl.quantity_on_hand), 0) as total_qty
    FROM stock_items si
    LEFT JOIN stock_levels sl ON sl.item_id = si.id
    WHERE si.is_active = true
    GROUP BY si.id, si.name, si.reorder_level
    HAVING COALESCE(SUM(sl.quantity_on_hand), 0) <= si.reorder_level
  LOOP
    INSERT INTO stock_alerts (alert_type, stock_item_id, severity, message, current_quantity, threshold_quantity)
    SELECT 
      CASE WHEN item.total_qty = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      item.stock_item_id,
      CASE WHEN item.total_qty = 0 THEN 'critical' ELSE 'warning' END,
      CASE WHEN item.total_qty = 0 
        THEN item.name || ' is OUT OF STOCK'
        ELSE item.name || ' is below reorder level (' || item.total_qty || '/' || item.reorder_level || ')'
      END,
      item.total_qty::integer,
      item.reorder_level
    WHERE NOT EXISTS (
      SELECT 1 FROM stock_alerts sa 
      WHERE sa.stock_item_id = item.stock_item_id 
        AND sa.alert_type IN ('low_stock', 'out_of_stock')
        AND sa.is_resolved = false
    );
  END LOOP;

  -- Expiry alerts (items expiring within 30 days)
  INSERT INTO stock_alerts (alert_type, stock_item_id, location_id, severity, message, expiry_date)
  SELECT 
    CASE WHEN sl.expiry_date <= CURRENT_DATE THEN 'expired' ELSE 'expiring_soon' END,
    sl.item_id,
    sl.location_id,
    CASE WHEN sl.expiry_date <= CURRENT_DATE THEN 'critical' ELSE 'warning' END,
    si.name || CASE 
      WHEN sl.expiry_date <= CURRENT_DATE THEN ' has EXPIRED on ' 
      ELSE ' expires on ' 
    END || sl.expiry_date::text,
    sl.expiry_date
  FROM stock_levels sl
  JOIN stock_items si ON si.id = sl.item_id
  WHERE sl.expiry_date IS NOT NULL
    AND sl.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND sl.quantity_on_hand > 0
    AND NOT EXISTS (
      SELECT 1 FROM stock_alerts sa 
      WHERE sa.stock_item_id = sl.item_id 
        AND sa.location_id = sl.location_id
        AND sa.alert_type IN ('expired', 'expiring_soon')
        AND sa.is_resolved = false
    );
END;
$$;

-- 12. Function to auto-generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('po_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Create sequence for PO numbers
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq START 1;

CREATE TRIGGER trigger_generate_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_po_number();

-- 13. Function to auto-generate stock count number
CREATE OR REPLACE FUNCTION public.generate_count_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.count_number IS NULL OR NEW.count_number = '' THEN
    NEW.count_number := 'CNT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('count_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS public.count_number_seq START 1;

CREATE TRIGGER trigger_generate_count_number
BEFORE INSERT ON public.stock_counts
FOR EACH ROW
EXECUTE FUNCTION public.generate_count_number();