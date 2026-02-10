
-- ============================================================
-- Inventory & Supply Chain — inv schema + audit schema
-- ============================================================

-- 1) Create schemas
CREATE SCHEMA IF NOT EXISTS inv;
CREATE SCHEMA IF NOT EXISTS audit;

-- 2) Extend cap.tenant_facility_capabilities for inventory routing
ALTER TABLE cap.tenant_facility_capabilities
  ADD COLUMN IF NOT EXISTS internal_inventory_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_inventory_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_hybrid_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_adapter_preferences jsonb DEFAULT '{}';

-- 3) audit.audit_log (immutable audit trail)
CREATE TABLE audit.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  actor_id text NOT NULL,
  purpose_of_use text,
  correlation_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_tenant_entity ON audit.audit_log (tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit.audit_log (created_at DESC);

-- 4) inv.facilities
CREATE TABLE inv.facilities (
  facility_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  name text NOT NULL,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_facilities_tenant ON inv.facilities (tenant_id);

-- 5) inv.stores
CREATE TABLE inv.stores (
  store_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL REFERENCES inv.facilities(facility_id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'MAIN',
  parent_store_id text REFERENCES inv.stores(store_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_stores_tenant_facility ON inv.stores (tenant_id, facility_id);

-- 6) inv.bins
CREATE TABLE inv.bins (
  bin_id text PRIMARY KEY,
  store_id text NOT NULL REFERENCES inv.stores(store_id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'SHELF',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_bins_store ON inv.bins (store_id);

-- 7) inv.items
CREATE TABLE inv.items (
  tenant_id text NOT NULL,
  item_code text NOT NULL,
  name text NOT NULL,
  uom text NOT NULL DEFAULT 'EA',
  zibo_refs jsonb,
  is_controlled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, item_code)
);

-- 8) inv.item_barcodes
CREATE TABLE inv.item_barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  item_code text NOT NULL,
  barcode_type text NOT NULL DEFAULT 'INTERNAL',
  barcode_value text NOT NULL,
  batch text,
  expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, barcode_value)
);

-- 9) inv.ledger_events (append-only)
CREATE TABLE inv.ledger_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  bin_id text,
  event_type text NOT NULL,
  item_code text NOT NULL,
  batch text,
  expiry date,
  qty_delta numeric NOT NULL,
  uom text NOT NULL DEFAULT 'EA',
  reason text,
  ref_type text,
  ref_id text,
  idempotency_key text,
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_facility_store_item ON inv.ledger_events (facility_id, store_id, item_code);
CREATE INDEX idx_ledger_item_batch ON inv.ledger_events (item_code, batch, expiry);
CREATE INDEX idx_ledger_created ON inv.ledger_events (created_at DESC);
CREATE UNIQUE INDEX idx_ledger_idempotency ON inv.ledger_events (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 10) inv.on_hand_projection
CREATE TABLE inv.on_hand_projection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  bin_id text,
  item_code text NOT NULL,
  batch text,
  expiry date,
  qty_on_hand numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, facility_id, store_id, bin_id, item_code, batch, expiry)
);

-- 11) inv.count_sessions
CREATE TABLE inv.count_sessions (
  session_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  bin_scope jsonb,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by_actor_id text
);

-- 12) inv.count_lines
CREATE TABLE inv.count_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES inv.count_sessions(session_id),
  item_code text NOT NULL,
  batch text,
  expiry date,
  qty_counted numeric NOT NULL DEFAULT 0,
  scanned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_count_lines_session ON inv.count_lines (session_id);

-- 13) inv.handovers
CREATE TABLE inv.handovers (
  handover_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  from_actor_id text NOT NULL,
  to_actor_id text NOT NULL,
  status text NOT NULL DEFAULT 'STARTED',
  signed_outgoing_at timestamptz,
  signed_incoming_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14) inv.requisitions
CREATE TABLE inv.requisitions (
  req_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  from_store_id text NOT NULL,
  to_store_id text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  fulfilled_at timestamptz
);

-- 15) inv.requisition_lines
CREATE TABLE inv.requisition_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  req_id text NOT NULL REFERENCES inv.requisitions(req_id),
  item_code text NOT NULL,
  qty_requested numeric NOT NULL,
  qty_fulfilled numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16) inv.reconcile_queue
CREATE TABLE inv.reconcile_queue (
  rec_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  confidence numeric NOT NULL DEFAULT 0,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by_actor_id text,
  resolved_at timestamptz
);
CREATE INDEX idx_inv_reconcile_status ON inv.reconcile_queue (status, confidence DESC);

-- 17) Views: near-expiry and stockout risk
CREATE OR REPLACE VIEW inv.v_near_expiry AS
SELECT
  p.tenant_id, p.facility_id, p.store_id, p.bin_id,
  p.item_code, p.batch, p.expiry, p.qty_on_hand,
  (p.expiry - CURRENT_DATE) AS days_until_expiry
FROM inv.on_hand_projection p
WHERE p.expiry IS NOT NULL
  AND p.expiry <= (CURRENT_DATE + INTERVAL '90 days')
  AND p.qty_on_hand > 0
ORDER BY p.expiry ASC;

CREATE OR REPLACE VIEW inv.v_stockout_risk AS
SELECT
  p.tenant_id, p.facility_id, p.store_id, p.bin_id,
  p.item_code, p.batch, p.expiry, p.qty_on_hand
FROM inv.on_hand_projection p
WHERE p.qty_on_hand <= 0
ORDER BY p.facility_id, p.store_id, p.item_code;

-- 18) RLS on all inv tables
ALTER TABLE inv.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.item_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.ledger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.on_hand_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.count_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv.reconcile_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY;

-- Service-role-only policies for edge functions
CREATE POLICY "service_role_all" ON inv.facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.bins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.item_barcodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.ledger_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.on_hand_projection FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.count_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.count_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.handovers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.requisitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.requisition_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON inv.reconcile_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON audit.audit_log FOR ALL USING (true) WITH CHECK (true);
