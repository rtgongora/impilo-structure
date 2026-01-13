-- =============================================
-- IMPILO END-TO-END FINANCIAL BACKBONE
-- Phase 4: Claims & Reconciliation
-- =============================================

-- ENUMS for Claims
DO $$ BEGIN
  CREATE TYPE public.claim_status AS ENUM (
    'draft', 'submitted', 'acknowledged', 'processing', 'approved', 'partially_approved',
    'denied', 'appealed', 'paid', 'written_off'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.claim_type AS ENUM (
    'insurance', 'government', 'employer', 'donor', 'workers_comp'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- CLAIMS (Third-party payer billing)
-- =============================================
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT NOT NULL UNIQUE,
  
  -- Context
  visit_id UUID REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Payer
  claim_type claim_type NOT NULL,
  payer_id UUID, -- Reference to insurer/employer/programme
  payer_name TEXT NOT NULL,
  payer_code TEXT,
  
  -- Member/coverage info
  member_id TEXT,
  group_number TEXT,
  authorization_number TEXT,
  
  -- Amounts
  total_claimed DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_approved DECIMAL(12,2) DEFAULT 0,
  total_denied DECIMAL(12,2) DEFAULT 0,
  patient_responsibility DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status
  status claim_status NOT NULL DEFAULT 'draft',
  
  -- Submission
  submission_date DATE,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  submission_reference TEXT,
  submission_method TEXT, -- 'electronic', 'paper', 'portal'
  
  -- Response
  acknowledgment_date DATE,
  processing_date DATE,
  adjudication_date DATE,
  denial_reason TEXT,
  denial_codes TEXT[],
  
  -- Appeal
  is_appealed BOOLEAN DEFAULT false,
  appeal_date DATE,
  appeal_reason TEXT,
  appeal_status TEXT,
  
  -- Payment
  paid_date DATE,
  payment_reference TEXT,
  remittance_advice_id UUID,
  
  -- Audit
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- CLAIM LINE ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS public.claim_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  charge_sheet_id UUID REFERENCES public.charge_sheets(id),
  
  -- Line details
  line_number INTEGER NOT NULL,
  service_code TEXT NOT NULL,
  service_description TEXT NOT NULL,
  service_date DATE NOT NULL,
  
  -- Diagnosis (for medical necessity)
  primary_diagnosis_code TEXT,
  secondary_diagnosis_codes TEXT[],
  
  -- Provider
  rendering_provider_id UUID,
  rendering_provider_npi TEXT,
  
  -- Amounts
  quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  claimed_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  denied_amount DECIMAL(12,2),
  
  -- Adjudication
  adjudication_status TEXT, -- 'pending', 'approved', 'denied', 'partial'
  adjudication_code TEXT,
  adjudication_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- REMITTANCE ADVICE (Payment from payers)
-- =============================================
CREATE TABLE IF NOT EXISTS public.remittance_advices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_number TEXT NOT NULL UNIQUE,
  
  -- Payer
  payer_id UUID,
  payer_name TEXT NOT NULL,
  payer_code TEXT,
  
  -- Payment
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  check_number TEXT,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Coverage period
  period_start DATE,
  period_end DATE,
  
  -- Totals
  total_claims INTEGER DEFAULT 0,
  total_claimed DECIMAL(12,2) DEFAULT 0,
  total_approved DECIMAL(12,2) DEFAULT 0,
  total_denied DECIMAL(12,2) DEFAULT 0,
  adjustments DECIMAL(12,2) DEFAULT 0,
  
  -- File reference
  file_reference TEXT,
  file_format TEXT, -- '835', 'csv', 'pdf'
  raw_file_path TEXT,
  
  -- Processing
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_errors JSONB,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  
  received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- REMITTANCE LINE ITEMS (Claim-level detail)
-- =============================================
CREATE TABLE IF NOT EXISTS public.remittance_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_advice_id UUID NOT NULL REFERENCES public.remittance_advices(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id),
  
  -- Claim reference
  claim_number TEXT,
  patient_member_id TEXT,
  patient_name TEXT,
  service_date_from DATE,
  service_date_to DATE,
  
  -- Amounts
  billed_amount DECIMAL(12,2) NOT NULL,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2) NOT NULL,
  patient_responsibility DECIMAL(12,2) DEFAULT 0,
  adjustment_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Adjustment codes
  adjustment_codes TEXT[],
  remark_codes TEXT[],
  
  -- Matching
  is_matched BOOLEAN DEFAULT false,
  matched_at TIMESTAMPTZ,
  match_discrepancy TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SETTLEMENT RECONCILIATION (Provider payments)
-- =============================================
CREATE TABLE IF NOT EXISTS public.settlement_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  facility_id UUID REFERENCES public.facilities(id),
  payment_channel TEXT NOT NULL,
  settlement_date DATE NOT NULL,
  
  -- Expected from provider
  expected_transactions INTEGER DEFAULT 0,
  expected_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Actual from bank/settlement
  actual_transactions INTEGER,
  actual_amount DECIMAL(12,2),
  
  -- Variance
  transaction_variance INTEGER,
  amount_variance DECIMAL(12,2),
  
  -- Settlement reference
  settlement_reference TEXT,
  bank_reference TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'matched', 'discrepancy', 'resolved'
  
  -- Resolution
  discrepancy_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_action TEXT,
  
  -- File references
  provider_report_path TEXT,
  bank_statement_path TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(facility_id, payment_channel, settlement_date)
);

-- =============================================
-- UNMATCHED TRANSACTIONS (Exceptions queue)
-- =============================================
CREATE TABLE IF NOT EXISTS public.unmatched_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  source_type TEXT NOT NULL, -- 'webhook', 'settlement_report', 'bank_statement', 'remittance'
  source_reference TEXT,
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Identifying info
  provider_reference TEXT,
  payer_reference TEXT,
  patient_hint TEXT, -- Partial name/ID from source
  
  -- Raw data
  raw_data JSONB,
  
  -- Resolution
  status TEXT NOT NULL DEFAULT 'unmatched', -- 'unmatched', 'matched', 'written_off', 'refunded'
  matched_to_type TEXT, -- 'payment_transaction', 'claim', 'receipt'
  matched_to_id UUID,
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SEQUENCES & TRIGGERS
-- =============================================
CREATE SEQUENCE IF NOT EXISTS public.claim_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.remittance_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_claim_number_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
    NEW.claim_number := 'CLM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
      LPAD(NEXTVAL('public.claim_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS claim_before_insert ON public.claims;
CREATE TRIGGER claim_before_insert
  BEFORE INSERT ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.generate_claim_number_fn();

CREATE OR REPLACE FUNCTION public.generate_remittance_number_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.remittance_number IS NULL OR NEW.remittance_number = '' THEN
    NEW.remittance_number := 'REM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
      LPAD(NEXTVAL('public.remittance_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS remittance_before_insert ON public.remittance_advices;
CREATE TRIGGER remittance_before_insert
  BEFORE INSERT ON public.remittance_advices
  FOR EACH ROW EXECUTE FUNCTION public.generate_remittance_number_fn();

-- Timestamp triggers
CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settlement_reconciliations_updated_at
  BEFORE UPDATE ON public.settlement_reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remittance_advices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remittance_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_transactions ENABLE ROW LEVEL SECURITY;

-- Claims
CREATE POLICY "Staff can view claims" ON public.claims FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage claims" ON public.claims FOR ALL USING (auth.uid() IS NOT NULL);

-- Claim Line Items
CREATE POLICY "Staff can view claim lines" ON public.claim_line_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage claim lines" ON public.claim_line_items FOR ALL USING (auth.uid() IS NOT NULL);

-- Remittance
CREATE POLICY "Staff can view remittances" ON public.remittance_advices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage remittances" ON public.remittance_advices FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view remittance lines" ON public.remittance_line_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage remittance lines" ON public.remittance_line_items FOR ALL USING (auth.uid() IS NOT NULL);

-- Settlement Reconciliations
CREATE POLICY "Staff can view settlements" ON public.settlement_reconciliations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage settlements" ON public.settlement_reconciliations FOR ALL USING (auth.uid() IS NOT NULL);

-- Unmatched Transactions
CREATE POLICY "Staff can view unmatched" ON public.unmatched_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage unmatched" ON public.unmatched_transactions FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_claims_visit ON public.claims(visit_id);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON public.claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_payer ON public.claims(payer_id);
CREATE INDEX IF NOT EXISTS idx_claims_submission ON public.claims(submission_date);

CREATE INDEX IF NOT EXISTS idx_claim_line_items_claim ON public.claim_line_items(claim_id);

CREATE INDEX IF NOT EXISTS idx_remittance_advices_payer ON public.remittance_advices(payer_id);
CREATE INDEX IF NOT EXISTS idx_remittance_advices_date ON public.remittance_advices(payment_date);
CREATE INDEX IF NOT EXISTS idx_remittance_advices_processed ON public.remittance_advices(is_processed) WHERE is_processed = false;

CREATE INDEX IF NOT EXISTS idx_remittance_line_items_remittance ON public.remittance_line_items(remittance_advice_id);
CREATE INDEX IF NOT EXISTS idx_remittance_line_items_claim ON public.remittance_line_items(claim_id);

CREATE INDEX IF NOT EXISTS idx_settlement_reconciliations_facility ON public.settlement_reconciliations(facility_id);
CREATE INDEX IF NOT EXISTS idx_settlement_reconciliations_date ON public.settlement_reconciliations(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlement_reconciliations_status ON public.settlement_reconciliations(status);

CREATE INDEX IF NOT EXISTS idx_unmatched_transactions_status ON public.unmatched_transactions(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_transactions_date ON public.unmatched_transactions(transaction_date);