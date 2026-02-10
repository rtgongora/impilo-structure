
-- ============================================================
-- MUSHEX v1.1 — National Payment Switch & Claims Layer
-- Schemas: mushex, mushex_sec, outbox (reuse if exists), audit (reuse if exists)
-- ============================================================

-- Schemas
CREATE SCHEMA IF NOT EXISTS mushex;
CREATE SCHEMA IF NOT EXISTS mushex_sec;
CREATE SCHEMA IF NOT EXISTS outbox;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- MUSHEX CORE
-- ============================================================

-- Payment Intents
CREATE TABLE mushex.payment_intents (
  intent_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  facility_id TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('COSTA_BILL','MSIKA_ORDER','ADHOC')),
  source_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  amount_total NUMERIC NOT NULL CHECK (amount_total > 0),
  amount_paid NUMERIC NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','PENDING','AUTHORIZED','PAID','FAILED','CANCELLED','REFUND_PENDING','REFUNDED')),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lock_version INT NOT NULL DEFAULT 0
);

-- Payment Attempts
CREATE TABLE mushex.payment_attempts (
  id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL REFERENCES mushex.payment_intents(intent_id),
  adapter_type TEXT NOT NULL CHECK (adapter_type IN ('MOBILE_MONEY','BANK_TRANSFER','CARD','SANDBOX')),
  adapter_ref TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','PENDING','PAID','FAILED','CANCELLED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  raw_summary JSONB DEFAULT '{}'
);

-- Remittance Tokens (delegated pay slips)
CREATE TABLE mushex.remittance_tokens (
  id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL REFERENCES mushex.payment_intents(intent_id),
  token_hash TEXT NOT NULL UNIQUE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','CLAIMED','EXPIRED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  claim_meta JSONB DEFAULT '{}'
);

-- Receipts
CREATE TABLE mushex.receipts (
  receipt_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE REFERENCES mushex.payment_intents(intent_id),
  landela_doc_id TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary JSONB DEFAULT '{}'
);

-- Refunds
CREATE TABLE mushex.refunds (
  refund_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL REFERENCES mushex.payment_intents(intent_id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','PENDING','COMPLETED','FAILED','CANCELLED')),
  adapter_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger Accounts
CREATE TABLE mushex.ledger_accounts (
  account_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','INCOME','EXPENSE')),
  currency TEXT NOT NULL DEFAULT 'ZAR'
);

-- Ledger Entries (double-entry-lite)
CREATE TABLE mushex.ledger_entries (
  entry_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  intent_id TEXT,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('PAYMENT','REFUND','SETTLEMENT','CLAIM','ADJUSTMENT')),
  reference_id TEXT NOT NULL,
  debit_account TEXT NOT NULL REFERENCES mushex.ledger_accounts(account_id),
  credit_account TEXT NOT NULL REFERENCES mushex.ledger_accounts(account_id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insurer Profiles
CREATE TABLE mushex.insurer_profiles (
  insurer_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'REST' CHECK (mode IN ('REST','CSV','KAFKA')),
  config_encrypted JSONB DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true
);

-- Claims
CREATE TABLE mushex.claims (
  claim_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  bill_id TEXT NOT NULL,
  insurer_id TEXT NOT NULL REFERENCES mushex.insurer_profiles(insurer_id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','RECEIVED','ADJUDICATED','PAID','PARTIAL','REJECTED','RESUBMIT_PENDING')),
  totals JSONB DEFAULT '{}',
  bill_pack_json JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  adjudicated_at TIMESTAMPTZ,
  external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claim Events
CREATE TABLE mushex.claim_events (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES mushex.claims(claim_id),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claim Attachments
CREATE TABLE mushex.claim_attachments (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES mushex.claims(claim_id),
  landela_doc_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adjudications
CREATE TABLE mushex.adjudications (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL UNIQUE REFERENCES mushex.claims(claim_id),
  decision JSONB NOT NULL DEFAULT '{}',
  patient_residual NUMERIC NOT NULL DEFAULT 0,
  insurer_payable NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settlements
CREATE TABLE mushex.settlements (
  settlement_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','READY','RELEASED','COMPLETED','FAILED')),
  totals JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settlement Policies
CREATE TABLE mushex.settlement_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'DAILY' CHECK (frequency IN ('DAILY','WEEKLY','MONTHLY')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payout Batches
CREATE TABLE mushex.payout_batches (
  batch_id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES mushex.settlements(settlement_id),
  adapter_type TEXT NOT NULL DEFAULT 'SANDBOX' CHECK (adapter_type IN ('BANK_TRANSFER','SANDBOX')),
  destination_ref JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','RELEASED','IN_PROGRESS','COMPLETED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);

-- Payout Items
CREATE TABLE mushex.payout_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES mushex.payout_batches(batch_id),
  payee_type TEXT NOT NULL CHECK (payee_type IN ('FACILITY','VENDOR','DELIVERY','OTHER')),
  payee_ref TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED'))
);

-- Fraud Flags
CREATE TABLE mushex.fraud_flags (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fraud Baselines
CREATE TABLE mushex.fraud_baselines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  entity_scope TEXT NOT NULL,
  baseline_value NUMERIC NOT NULL,
  threshold_multiplier NUMERIC NOT NULL DEFAULT 2.0,
  sample_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ops Reviews
CREATE TABLE mushex.ops_reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MUSHEX_SEC
-- ============================================================

CREATE TABLE mushex_sec.idempotency_keys (
  key TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mushex_sec.rate_limits (
  key TEXT PRIMARY KEY,
  window_seconds INT NOT NULL DEFAULT 60,
  count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mushex_sec.webhook_secrets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  secret_ref TEXT NOT NULL,
  rotation_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mushex_sec.mock_authz (
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  facility_id TEXT,
  permissions JSONB DEFAULT '{}',
  PRIMARY KEY (actor_id, actor_type, tenant_id)
);

-- ============================================================
-- OUTBOX (if not exists from prior migrations)
-- ============================================================

CREATE TABLE IF NOT EXISTS outbox.events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- ============================================================
-- AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS audit.mushex_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_mushex_pi_tenant_status ON mushex.payment_intents(tenant_id, status, created_at DESC);
CREATE INDEX idx_mushex_pi_source ON mushex.payment_intents(source_type, source_id);
CREATE UNIQUE INDEX idx_mushex_pa_adapter_ref ON mushex.payment_attempts(adapter_ref) WHERE adapter_ref IS NOT NULL;
CREATE INDEX idx_mushex_claims_tenant ON mushex.claims(tenant_id, insurer_id, status, submitted_at DESC);
CREATE INDEX idx_mushex_ledger_tenant ON mushex.ledger_entries(tenant_id, created_at DESC);
CREATE INDEX idx_mushex_fraud_tenant ON mushex.fraud_flags(tenant_id, status, created_at DESC);
CREATE INDEX idx_mushex_outbox_unpub ON outbox.events(published_at) WHERE published_at IS NULL;
CREATE INDEX idx_mushex_settlements_tenant ON mushex.settlements(tenant_id, status, created_at DESC);
CREATE INDEX idx_mushex_ops_reviews ON mushex.ops_reviews(tenant_id, status, created_at DESC);
CREATE INDEX idx_mushex_remittance_intent ON mushex.remittance_tokens(intent_id);
CREATE INDEX idx_mushex_claim_events ON mushex.claim_events(claim_id, created_at DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE mushex.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.remittance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.insurer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.claim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.claim_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.adjudications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.settlement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.fraud_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex.ops_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex_sec.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex_sec.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex_sec.webhook_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushex_sec.mock_authz ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.mushex_log ENABLE ROW LEVEL SECURITY;

-- Service-role-only policies (Edge Functions use service role)
CREATE POLICY "service_role_all" ON mushex.payment_intents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.payment_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.remittance_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.refunds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.ledger_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.insurer_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.claim_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.claim_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.adjudications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.settlement_policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.payout_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.payout_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.fraud_flags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.fraud_baselines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex.ops_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex_sec.idempotency_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex_sec.rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex_sec.webhook_secrets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mushex_sec.mock_authz FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON audit.mushex_log FOR ALL USING (true) WITH CHECK (true);

-- Seed standard ledger accounts for demo tenant
INSERT INTO mushex.ledger_accounts (account_id, tenant_id, name, type, currency) VALUES
  ('PATIENT_CASH', 'demo-tenant', 'Patient Cash', 'ASSET', 'ZAR'),
  ('FACILITY_REVENUE', 'demo-tenant', 'Facility Revenue', 'INCOME', 'ZAR'),
  ('PLATFORM_FEES', 'demo-tenant', 'Platform Fees', 'INCOME', 'ZAR'),
  ('INSURER_RECEIVABLE', 'demo-tenant', 'Insurer Receivable', 'ASSET', 'ZAR'),
  ('REFUNDS_PAYABLE', 'demo-tenant', 'Refunds Payable', 'LIABILITY', 'ZAR'),
  ('SETTLEMENT_PAYABLE', 'demo-tenant', 'Settlement Payable', 'LIABILITY', 'ZAR')
ON CONFLICT DO NOTHING;

-- Seed mock authz for dev
INSERT INTO mushex_sec.mock_authz (actor_id, actor_type, tenant_id, facility_id, permissions) VALUES
  ('dev-ops-1', 'OPS', 'demo-tenant', NULL, '{"all": true}'),
  ('dev-finance-1', 'FACILITY_FINANCE', 'demo-tenant', 'facility-1', '{"facility_scope": true}'),
  ('dev-system-1', 'SYSTEM', 'demo-tenant', NULL, '{"internal": true}'),
  ('dev-patient-1', 'PATIENT', 'demo-tenant', NULL, '{"patient_cpid": "CPID-001"}'),
  ('dev-insurer-1', 'INSURER', 'demo-tenant', NULL, '{"insurer_id": "ins-demo-1"}')
ON CONFLICT DO NOTHING;

-- Seed demo insurer
INSERT INTO mushex.insurer_profiles (insurer_id, tenant_id, name, mode, enabled) VALUES
  ('ins-demo-1', 'demo-tenant', 'National Health Insurance Demo', 'REST', true)
ON CONFLICT DO NOTHING;

-- Seed settlement policy
INSERT INTO mushex.settlement_policies (id, tenant_id, frequency, config) VALUES
  ('sp-demo-1', 'demo-tenant', 'DAILY', '{"cutoff_hour": 18}')
ON CONFLICT DO NOTHING;
