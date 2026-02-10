
-- ============================================================
-- MSIKA Flow v1.1 — Complete Schema
-- Schemas: msika_flow, msika_flow_sec, outbox
-- Reuses: audit (from MSIKA Core migration)
-- ============================================================

-- 1) Create schemas
CREATE SCHEMA IF NOT EXISTS msika_flow;
CREATE SCHEMA IF NOT EXISTS msika_flow_sec;
CREATE SCHEMA IF NOT EXISTS outbox;
-- audit schema already exists from MSIKA Core

-- ============================================================
-- A) Orders + State Machine
-- ============================================================

CREATE TABLE msika_flow.orders (
  order_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('PATIENT','PROVIDER','VENDOR','OPS','SYSTEM')),
  patient_cpid text,
  type text NOT NULL CHECK (type IN ('OTC_PRODUCT_ORDER','RX_FULFILLMENT_ORDER','SERVICE_BOOKING_ORDER','BUNDLE_ORDER')),
  status text NOT NULL DEFAULT 'CREATED' CHECK (status IN (
    'CREATED','VALIDATED','PRICED','PAYMENT_PENDING','PAID','ROUTED','ACCEPTED',
    'IN_PROGRESS','READY_FOR_PICKUP','OUT_FOR_DELIVERY','BOOKED',
    'COLLECTED','DELIVERED','ATTENDED','COMPLETED',
    'CANCELLED','REFUND_PENDING','REFUNDED','FAILED'
  )),
  facility_id text,
  vendor_id text,
  amount_total numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  price_snapshot jsonb,
  restrictions_snapshot jsonb,
  lock_version int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_tenant_status ON msika_flow.orders (tenant_id, status, created_at DESC);
CREATE INDEX idx_orders_patient ON msika_flow.orders (patient_cpid, created_at DESC);
CREATE INDEX idx_orders_vendor ON msika_flow.orders (vendor_id, status);

CREATE TABLE msika_flow.order_lines (
  line_id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  msika_core_code text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('PRODUCT','SERVICE')),
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric,
  line_total numeric,
  restrictions jsonb,
  fulfillment_mode text CHECK (fulfillment_mode IN (
    'PHARMACY_PICKUP','HOME_DELIVERY','OUTREACH_DELIVERY','BOOKING','DIGITAL_FULFILLMENT'
  )),
  substitution_policy jsonb,
  state text NOT NULL DEFAULT 'requested',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_lines_order ON msika_flow.order_lines (order_id);
CREATE INDEX idx_order_lines_code ON msika_flow.order_lines (msika_core_code);

CREATE TABLE msika_flow.order_events (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  from_state text,
  to_state text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  reason_code text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_events_order ON msika_flow.order_events (order_id, created_at);

-- ============================================================
-- B) Fulfillment routing + reservations
-- ============================================================

CREATE TABLE msika_flow.fulfillment_routes (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  route_type text NOT NULL CHECK (route_type IN (
    'PHARMACY_PICKUP','HOME_DELIVERY','OUTREACH_DELIVERY','BOOKING','DIGITAL'
  )),
  target_ref jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ROUTED','FAILED','RETRYING','DONE')),
  last_error text,
  retry_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_routes_order ON msika_flow.fulfillment_routes (order_id);

CREATE TABLE msika_flow.reservations (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  line_id text NOT NULL REFERENCES msika_flow.order_lines(line_id),
  system text NOT NULL CHECK (system IN ('INVENTORY','PHARMACY','ADAPTER')),
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','RESERVED','CONFIRMED','RELEASED','FAILED','EXPIRED'
  )),
  reservation_ref text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_order ON msika_flow.reservations (order_id);
CREATE INDEX idx_reservations_status ON msika_flow.reservations (status, expires_at);

-- ============================================================
-- C) MUSHEX payment settlements + refunds
-- ============================================================

CREATE TABLE msika_flow.settlements (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  mushex_payment_intent_id text UNIQUE,
  splits jsonb,
  status text NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','PAID','SETTLED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE msika_flow.refunds (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  amount numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','APPROVED','REFUND_PENDING','REFUNDED','REJECTED','FAILED'
  )),
  mushex_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- D) Delegated pickup proof (secure)
-- ============================================================

CREATE TABLE msika_flow_sec.pickup_tokens (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  token_hash text UNIQUE NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','CLAIMED','EXPIRED','REVOKED')),
  claimed_by text,
  claimed_actor_type text,
  claimed_at timestamptz,
  claim_meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pickup_tokens_order ON msika_flow_sec.pickup_tokens (order_id);

CREATE TABLE msika_flow_sec.rate_limits (
  key text PRIMARY KEY,
  window_seconds int NOT NULL DEFAULT 300,
  count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- E) Vendors + compliance docs
-- ============================================================

CREATE TABLE msika_flow.vendor_profiles (
  vendor_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'FACILITY','PHARMACY','SUPPLIER','LAB','RADIOLOGY','CLINIC','DELIVERY'
  )),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'APPLIED' CHECK (status IN (
    'APPLIED','UNDER_REVIEW','APPROVED','SUSPENDED','REJECTED'
  )),
  coverage jsonb,
  capabilities jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE msika_flow.vendor_documents (
  id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES msika_flow.vendor_profiles(vendor_id),
  doc_type text NOT NULL CHECK (doc_type IN ('LICENSE','REGISTRATION','COMPLIANCE','OTHER')),
  document_id text NOT NULL,
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','VERIFIED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE msika_flow.ops_reviews (
  id text PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('ORDER','VENDOR','REFUND','OVERRIDE','RECONCILE')),
  entity_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','ESCALATED')),
  assigned_to text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- F) Encrypted delivery contact
-- ============================================================

CREATE TABLE msika_flow.delivery_contacts (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES msika_flow.orders(order_id),
  ciphertext text NOT NULL,
  key_ref text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- G) Outbox event log
-- ============================================================

CREATE TABLE IF NOT EXISTS outbox.events (
  id text PRIMARY KEY,
  tenant_id text,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- ============================================================
-- H) Audit log (reuse audit schema from MSIKA Core if exists)
-- ============================================================
-- audit.audit_log already created by MSIKA Core migration; skip if exists.

-- ============================================================
-- Timestamp update triggers
-- ============================================================

CREATE OR REPLACE FUNCTION msika_flow.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = msika_flow;

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON msika_flow.orders
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON msika_flow.fulfillment_routes
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_settlements_updated_at BEFORE UPDATE ON msika_flow.settlements
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON msika_flow.refunds
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_vendor_profiles_updated_at BEFORE UPDATE ON msika_flow.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_vendor_documents_updated_at BEFORE UPDATE ON msika_flow.vendor_documents
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

CREATE TRIGGER trg_ops_reviews_updated_at BEFORE UPDATE ON msika_flow.ops_reviews
  FOR EACH ROW EXECUTE FUNCTION msika_flow.update_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE msika_flow.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.fulfillment_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow_sec.pickup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow_sec.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.ops_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_flow.delivery_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox.events ENABLE ROW LEVEL SECURITY;

-- Service role full access (edge functions use service role)
CREATE POLICY "service_role_all" ON msika_flow.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.order_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.order_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.fulfillment_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.refunds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow_sec.pickup_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow_sec.rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.vendor_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.vendor_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.ops_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON msika_flow.delivery_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON outbox.events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Expose schemas to PostgREST
-- ============================================================

GRANT USAGE ON SCHEMA msika_flow TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA msika_flow TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA msika_flow_sec TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA msika_flow_sec TO service_role;
GRANT USAGE ON SCHEMA outbox TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA outbox TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA audit TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA audit TO anon, authenticated, service_role;
