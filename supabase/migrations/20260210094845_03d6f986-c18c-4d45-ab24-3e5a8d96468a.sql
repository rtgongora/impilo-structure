
-- ============================================================
-- COSTA v1.1 — Impilo Costing Engine (Executable Reference)
-- Schemas: costa, costa_sec, outbox (reuse if exists), audit (reuse if exists)
-- ============================================================

-- Schemas
CREATE SCHEMA IF NOT EXISTS costa;
CREATE SCHEMA IF NOT EXISTS costa_sec;
CREATE SCHEMA IF NOT EXISTS outbox;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- A) Cost methods + unit cost sources
-- ============================================================
CREATE TABLE costa.cost_methods (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('MICRO','ABC','TARIFF','STANDARD','STOCK_AVG')),
  config jsonb NOT NULL DEFAULT '{}',
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.unit_cost_sources (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('INVENTORY','TARIFF','MANUAL','ABC_POOL')),
  ref jsonb NOT NULL DEFAULT '{}',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz
);

-- ============================================================
-- B) ABC cost pools + driver rates
-- ============================================================
CREATE TABLE costa.abc_cost_pools (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  pool_name text NOT NULL,
  annual_cost numeric NOT NULL DEFAULT 0,
  driver_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.abc_driver_rates (
  id text PRIMARY KEY,
  pool_id text NOT NULL REFERENCES costa.abc_cost_pools(id),
  driver_unit text NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- C) Tariffs, charging rulesets, exemptions, insurance
-- ============================================================
CREATE TABLE costa.tariffs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  tariff_code text NOT NULL,
  msika_code text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  rules jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tariffs_eff ON costa.tariffs (tenant_id, tariff_code, effective_from DESC);

CREATE TABLE costa.charging_rulesets (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED')),
  rules jsonb NOT NULL DEFAULT '[]',
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.exemption_rules (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  version int NOT NULL DEFAULT 1,
  rules jsonb NOT NULL DEFAULT '[]',
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.insurance_plans (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  insurer_name text NOT NULL,
  plan_code text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}',
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- D) Encounters (operational refs)
-- ============================================================
CREATE TABLE costa.encounters (
  encounter_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  patient_cpid text NOT NULL,
  pct_ref jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX idx_costa_enc_patient ON costa.encounters (patient_cpid, opened_at DESC);

-- ============================================================
-- E) Capability profiles (dual mode)
-- ============================================================
CREATE TABLE costa.capability_profiles (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text,
  profile jsonb NOT NULL DEFAULT '{"mode":"INTERNAL"}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- F) Bill headers, lines, parties
-- ============================================================
CREATE TABLE costa.bill_headers (
  bill_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  encounter_id text REFERENCES costa.encounters(encounter_id),
  msika_order_id text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVAL_PENDING','FINAL','FINAL_EXTERNAL','VOID')),
  currency text NOT NULL DEFAULT 'ZAR',
  totals jsonb NOT NULL DEFAULT '{}',
  trace_summary jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lock_version int NOT NULL DEFAULT 0
);
CREATE INDEX idx_bill_headers_main ON costa.bill_headers (tenant_id, facility_id, status, created_at DESC);

CREATE TABLE costa.bill_lines (
  line_id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  msika_code text,
  kind text NOT NULL CHECK (kind IN ('SERVICE','PRODUCT','FEE','BEDDAY','FOOD','LAUNDRY','OXYGEN','THEATRE','IMPLANT','ANAESTHESIA','RECOVERY','TRANSPORT','PER_DIEM','COLD_CHAIN','DELIVERY_FEE','OTHER')),
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  cost_amount numeric NOT NULL DEFAULT 0,
  cost_trace jsonb NOT NULL DEFAULT '{}',
  charge_trace jsonb NOT NULL DEFAULT '{}',
  restriction_snapshot jsonb NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'INTERNAL' CHECK (mode IN ('INTERNAL','EXTERNAL'))
);
CREATE INDEX idx_bill_lines_bill ON costa.bill_lines (bill_id);

CREATE TABLE costa.bill_parties (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  party_type text NOT NULL CHECK (party_type IN ('PATIENT','INSURER','SUBSIDY','WRITE_OFF')),
  amount numeric NOT NULL DEFAULT 0,
  reason_codes text[] NOT NULL DEFAULT '{}'
);

-- ============================================================
-- G) Approvals, invoices, payments, refunds, claim packs
-- ============================================================
CREATE TABLE costa.approvals (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  step text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approver_actor_id text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.invoices (
  invoice_id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  document_ref text,
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.payments (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  mushex_payment_intent_id text UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED')),
  paid_amount numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.refunds (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  mushex_refund_id text,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REFUND_PENDING','REFUNDED','REJECTED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa.claim_packs (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES costa.bill_headers(bill_id),
  insurer_ref text,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','ACCEPTED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- H) Stock weighted average (local prototype)
-- ============================================================
CREATE TABLE costa.stock_avg_cost (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  msika_code text NOT NULL,
  avg_unit_cost numeric NOT NULL DEFAULT 0,
  total_qty numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, facility_id, msika_code)
);

-- ============================================================
-- I) Inventory cost snapshots
-- ============================================================
CREATE TABLE costa.inventory_cost_snapshots (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  msika_code text NOT NULL,
  event_type text NOT NULL,
  qty numeric NOT NULL,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- J) Outbox events (reuse if exists, or create)
-- ============================================================
CREATE TABLE IF NOT EXISTS outbox.events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- ============================================================
-- K) Audit log (reuse if exists, or create)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  actor_id text,
  actor_type text,
  purpose_of_use text,
  correlation_id text,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- L) Security tables (costa_sec)
-- ============================================================
CREATE TABLE costa_sec.idempotency_keys (
  key text PRIMARY KEY,
  tenant_id text NOT NULL,
  endpoint text NOT NULL,
  request_hash text NOT NULL,
  response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE costa_sec.rate_limits (
  key text PRIMARY KEY,
  window_seconds int NOT NULL DEFAULT 60,
  count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- M) RLS on all costa tables
-- ============================================================
ALTER TABLE costa.cost_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.unit_cost_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.abc_cost_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.abc_driver_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.charging_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.exemption_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.capability_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.bill_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.bill_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.claim_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.stock_avg_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa.inventory_cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa_sec.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE costa_sec.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY;

-- Service role full access (Edge Functions operate as service role)
CREATE POLICY "service_role_full" ON costa.cost_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.unit_cost_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.abc_cost_pools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.abc_driver_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.tariffs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.charging_rulesets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.exemption_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.insurance_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.encounters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.capability_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.bill_headers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.bill_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.bill_parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.refunds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.claim_packs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.stock_avg_cost FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa.inventory_cost_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa_sec.idempotency_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON costa_sec.rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON outbox.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full" ON audit.audit_log FOR ALL USING (true) WITH CHECK (true);
