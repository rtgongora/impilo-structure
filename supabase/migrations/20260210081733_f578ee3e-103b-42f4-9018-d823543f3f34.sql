
-- ============================================================
-- PHARMACY SERVICE v1.1 — Schema Migration
-- ============================================================

CREATE SCHEMA IF NOT EXISTS pharm;
CREATE SCHEMA IF NOT EXISTS intents;
CREATE SCHEMA IF NOT EXISTS cap;

-- ============================================================
-- Capability registry (shared with OROS)
-- ============================================================

CREATE TABLE IF NOT EXISTS cap.tenant_facility_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  uses_external_lims boolean NOT NULL DEFAULT false,
  uses_external_pacs boolean NOT NULL DEFAULT false,
  uses_external_pharmacy boolean NOT NULL DEFAULT false,
  hybrid_mode_enabled boolean NOT NULL DEFAULT false,
  adapter_preferences jsonb NOT NULL DEFAULT '{}',
  uses_external_elmis boolean NOT NULL DEFAULT false,
  elmis_hybrid_mode boolean NOT NULL DEFAULT false,
  elmis_adapter_preference text DEFAULT 'REST',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, facility_id)
);

ALTER TABLE cap.tenant_facility_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON cap.tenant_facility_capabilities FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- A) Core dispense order projection
-- ============================================================

CREATE TABLE pharm.dispense_orders (
  dispense_order_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  workspace_id text,
  patient_cpid text NOT NULL,
  oros_order_id text NOT NULL UNIQUE,
  priority text NOT NULL DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE','URGENT','STAT')),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','ACCEPTED','PICKING','DISPENSED_PARTIAL','DISPENSED_COMPLETE','BACKORDERED','CANCELLED','REVERSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispense_orders_lookup ON pharm.dispense_orders (tenant_id, facility_id, status, created_at DESC);
CREATE INDEX idx_dispense_orders_patient ON pharm.dispense_orders (patient_cpid, created_at DESC);

CREATE TABLE pharm.dispense_items (
  dispense_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispense_order_id text NOT NULL REFERENCES pharm.dispense_orders(dispense_order_id),
  drug_code jsonb NOT NULL,
  qty_requested numeric NOT NULL,
  qty_dispensed numeric NOT NULL DEFAULT 0,
  unit jsonb,
  route jsonb,
  no_substitution boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PICKED','PARTIAL','COMPLETE','BACKORDERED','SUBSTITUTED','CANCELLED')),
  substitution jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispense_items_order ON pharm.dispense_items (dispense_order_id);

-- ============================================================
-- B) Inventory shadow ledger
-- ============================================================

CREATE TABLE pharm.stores (
  store_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'MAIN' CHECK (type IN ('MAIN','WARD','SATELLITE')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pharm.bins (
  bin_id text PRIMARY KEY,
  store_id text NOT NULL REFERENCES pharm.stores(store_id),
  code text NOT NULL,
  name text NOT NULL
);

CREATE TABLE pharm.stock_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  bin_id text NOT NULL,
  item_code jsonb NOT NULL,
  batch text,
  expiry date,
  qty_on_hand numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_positions_location ON pharm.stock_positions (facility_id, store_id, bin_id);
CREATE INDEX idx_stock_positions_item ON pharm.stock_positions USING GIN (item_code);

CREATE TABLE pharm.stock_movements (
  movement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  store_id text NOT NULL,
  bin_id text NOT NULL,
  item_code jsonb NOT NULL,
  batch text,
  expiry date,
  qty_delta numeric NOT NULL,
  reason text NOT NULL CHECK (reason IN ('DISPENSE','RETURN','WASTAGE','ADJUSTMENT','REVERSAL','RECEIVE')),
  ref_type text NOT NULL CHECK (ref_type IN ('DISPENSE_ORDER','STOCK_COUNT','ADAPTER_SYNC')),
  ref_id text NOT NULL,
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_facility ON pharm.stock_movements (facility_id, created_at DESC);
CREATE INDEX idx_stock_movements_item ON pharm.stock_movements USING GIN (item_code);

-- ============================================================
-- C) Formulary + substitution rules
-- ============================================================

CREATE TABLE pharm.formulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  drug_code jsonb NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  constraints jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pharm.substitution_rules (
  rule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('GENERIC_ALLOWED','THERAPEUTIC_CLASS_ALLOWED','STRENGTH_FORM_CONVERSION','NO_SUBSTITUTION')),
  rule_json jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- D) Barcode catalog
-- ============================================================

CREATE TABLE pharm.item_barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  item_code jsonb NOT NULL,
  barcode_type text NOT NULL CHECK (barcode_type IN ('GTIN','INTERNAL','OTHER')),
  barcode_value text NOT NULL,
  batch text,
  expiry date,
  UNIQUE (tenant_id, barcode_value)
);

-- ============================================================
-- E) Backorders
-- ============================================================

CREATE TABLE pharm.backorders (
  backorder_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispense_order_id text NOT NULL REFERENCES pharm.dispense_orders(dispense_order_id),
  dispense_item_id uuid NOT NULL REFERENCES pharm.dispense_items(dispense_item_id),
  qty_remaining numeric NOT NULL,
  expected_date date,
  note text,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','FILLED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- F) Pickup proofs
-- ============================================================

CREATE TABLE pharm.pickup_proofs (
  pickup_proof_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispense_order_id text NOT NULL REFERENCES pharm.dispense_orders(dispense_order_id),
  method text NOT NULL CHECK (method IN ('OTP','QR')),
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','CLAIMED','EXPIRED','CANCELLED')),
  expires_at timestamptz NOT NULL,
  claimed_by_actor_id text,
  claimed_at timestamptz,
  is_delegated boolean NOT NULL DEFAULT false
);

-- ============================================================
-- G) Reconciliation queue
-- ============================================================

CREATE TABLE pharm.reconcile_queue (
  rec_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  type text NOT NULL DEFAULT 'STOCK',
  external_key text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','MATCHED','RESOLVED')),
  payload jsonb,
  ops_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pharm_reconcile_status ON pharm.reconcile_queue (status, confidence DESC);

-- ============================================================
-- H) Integration intents / outbox
-- ============================================================

CREATE TABLE IF NOT EXISTS intents.event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intents_event_log_type ON intents.event_log (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intents_event_log_entity ON intents.event_log (entity_type, entity_id);

-- ============================================================
-- RLS + policies
-- ============================================================

ALTER TABLE pharm.dispense_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.dispense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.stock_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.substitution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.item_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.backorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.pickup_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharm.reconcile_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents.event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON pharm.dispense_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.dispense_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.bins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.stock_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.formulary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.substitution_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.item_barcodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.backorders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.pickup_proofs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON pharm.reconcile_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON intents.event_log FOR ALL USING (true) WITH CHECK (true);
