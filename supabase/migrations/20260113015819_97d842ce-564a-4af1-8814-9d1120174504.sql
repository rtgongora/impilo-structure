-- =============================================
-- IMPILO END-TO-END FINANCIAL BACKBONE
-- Phase 3b: Payment Orchestrator (Remaining Tables)
-- =============================================

-- ENUMS for Payments (if not exist, wrap in DO block)
DO $$ BEGIN
  CREATE TYPE public.payment_request_status AS ENUM (
    'created', 'sent', 'in_progress', 'paid', 'failed', 'expired', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_v2 AS ENUM (
    'cash', 'mobile_money', 'card', 'bank_transfer', 'qr_code', 'cheque', 'insurance_remittance', 'government_remittance'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_channel AS ENUM (
    'paynow', 'ecocash', 'onemoney', 'innbucks', 'stripe', 'dpo_paygate', 'zipit', 'rtgs', 'cbz_bank', 'cash_facility', 'cheque_facility'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM (
    'pending', 'processing', 'success', 'failed', 'reversed', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- PAYMENT REQUESTS (Orchestrator)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_number TEXT NOT NULL UNIQUE,
  invoice_id UUID REFERENCES public.invoices(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  visit_id UUID REFERENCES public.visits(id),
  patient_id UUID REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  purpose TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  allowed_methods TEXT[] DEFAULT '{cash,mobile_money,card,bank_transfer}',
  preferred_channel TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  payment_link TEXT,
  checkout_token TEXT,
  short_reference TEXT,
  expires_at TIMESTAMPTZ,
  callback_url TEXT,
  webhook_secret TEXT,
  idempotency_key TEXT UNIQUE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payer_phone TEXT,
  payer_email TEXT,
  payer_name TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- RECEIPTS (System of record)
-- =============================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  invoice_id UUID REFERENCES public.invoices(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  transaction_reference TEXT,
  provider_reference TEXT,
  receipt_type TEXT NOT NULL DEFAULT 'payment',
  is_voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT,
  void_approved_by UUID,
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMPTZ,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- REFUNDS
-- =============================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number TEXT NOT NULL UNIQUE,
  original_receipt_id UUID NOT NULL REFERENCES public.receipts(id),
  original_transaction_id UUID REFERENCES public.payment_transactions(id),
  patient_id UUID REFERENCES public.patients(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  facility_id UUID REFERENCES public.facilities(id),
  refund_amount DECIMAL(12,2) NOT NULL,
  refund_reason TEXT NOT NULL,
  refund_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requires_approval BOOLEAN DEFAULT true,
  approval_threshold DECIMAL(12,2),
  requested_by UUID,
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  refund_method TEXT,
  refund_reference TEXT,
  provider_chargeback_id TEXT,
  chargeback_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PAYMENT WEBHOOKS (Audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_channel TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  signature TEXT,
  parsed_txn_id TEXT,
  parsed_amount DECIMAL(12,2),
  parsed_status TEXT,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  payment_request_id UUID REFERENCES public.payment_requests(id),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  webhook_id TEXT,
  is_duplicate BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PAYMENT NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID REFERENCES public.payment_requests(id),
  patient_id UUID REFERENCES public.patients(id),
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  message_template TEXT,
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- DAILY CASH RECONCILIATION
-- =============================================
CREATE TABLE IF NOT EXISTS public.cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  reconciliation_date DATE NOT NULL,
  cashier_id UUID,
  cash_drawer_id UUID,
  expected_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_cash DECIMAL(12,2),
  variance DECIMAL(12,2),
  transactions_count INTEGER DEFAULT 0,
  total_receipts DECIMAL(12,2) DEFAULT 0,
  total_refunds DECIMAL(12,2) DEFAULT 0,
  opening_balance DECIMAL(12,2) DEFAULT 0,
  closing_balance DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'open',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  variance_explanation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(facility_id, reconciliation_date, cashier_id)
);

-- =============================================
-- SEQUENCES & TRIGGERS
-- =============================================
CREATE SEQUENCE IF NOT EXISTS public.payment_request_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.refund_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_payment_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_request_number IS NULL OR NEW.payment_request_number = '' THEN
    NEW.payment_request_number := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
      LPAD(NEXTVAL('public.payment_request_seq')::TEXT, 6, '0');
  END IF;
  IF NEW.short_reference IS NULL THEN
    NEW.short_reference := UPPER(SUBSTR(MD5(NEW.id::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS payment_request_before_insert ON public.payment_requests;
CREATE TRIGGER payment_request_before_insert
  BEFORE INSERT ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_payment_request_number();

CREATE OR REPLACE FUNCTION public.generate_receipt_number_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'RCT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
      LPAD(NEXTVAL('public.receipt_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS receipt_before_insert ON public.receipts;
CREATE TRIGGER receipt_before_insert
  BEFORE INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number_fn();

CREATE OR REPLACE FUNCTION public.generate_refund_number_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.refund_number IS NULL OR NEW.refund_number = '' THEN
    NEW.refund_number := 'RFD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
      LPAD(NEXTVAL('public.refund_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS refund_before_insert ON public.refunds;
CREATE TRIGGER refund_before_insert
  BEFORE INSERT ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.generate_refund_number_fn();

DROP TRIGGER IF EXISTS update_cash_reconciliations_updated_at ON public.cash_reconciliations;
CREATE TRIGGER update_cash_reconciliations_updated_at
  BEFORE UPDATE ON public.cash_reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_reconciliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view payment requests" ON public.payment_requests;
CREATE POLICY "Staff can view payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can manage payment requests" ON public.payment_requests;
CREATE POLICY "Staff can manage payment requests" ON public.payment_requests FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view receipts" ON public.receipts;
CREATE POLICY "Staff can view receipts" ON public.receipts FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can manage receipts" ON public.receipts;
CREATE POLICY "Staff can manage receipts" ON public.receipts FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view refunds" ON public.refunds;
CREATE POLICY "Staff can view refunds" ON public.refunds FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can manage refunds" ON public.refunds;
CREATE POLICY "Staff can manage refunds" ON public.refunds FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view webhooks" ON public.payment_webhooks;
CREATE POLICY "Staff can view webhooks" ON public.payment_webhooks FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can manage webhooks" ON public.payment_webhooks;
CREATE POLICY "System can manage webhooks" ON public.payment_webhooks FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view notifications" ON public.payment_notifications;
CREATE POLICY "Staff can view notifications" ON public.payment_notifications FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can manage notifications" ON public.payment_notifications;
CREATE POLICY "System can manage notifications" ON public.payment_notifications FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view reconciliations" ON public.cash_reconciliations;
CREATE POLICY "Staff can view reconciliations" ON public.cash_reconciliations FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Cashiers can manage reconciliations" ON public.cash_reconciliations;
CREATE POLICY "Cashiers can manage reconciliations" ON public.cash_reconciliations FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_payment_requests_invoice ON public.payment_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_patient ON public.payment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_short_ref ON public.payment_requests(short_reference);

CREATE INDEX IF NOT EXISTS idx_receipts_patient ON public.receipts(patient_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON public.receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts(receipt_date);

CREATE INDEX IF NOT EXISTS idx_refunds_receipt ON public.refunds(original_receipt_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_channel ON public.payment_webhooks(payment_channel);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON public.payment_webhooks(is_processed) WHERE is_processed = false;

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_facility ON public.cash_reconciliations(facility_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date ON public.cash_reconciliations(reconciliation_date);