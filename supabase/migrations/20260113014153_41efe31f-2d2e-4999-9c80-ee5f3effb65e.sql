-- =============================================
-- IMPILO END-TO-END FINANCIAL BACKBONE
-- Phase 2: Billing & Invoicing
-- =============================================

-- ENUMS for Billing
CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'finalized',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'written_off'
);

CREATE TYPE public.payer_type AS ENUM (
  'patient',
  'insurance',
  'government',
  'employer',
  'donor',
  'other'
);

CREATE TYPE public.charge_status AS ENUM (
  'pending',
  'approved',
  'billed',
  'disputed',
  'waived',
  'cancelled'
);

-- =============================================
-- VISIT FINANCIAL ACCOUNTS (Master Account per Visit)
-- =============================================
CREATE TABLE public.visit_financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Account status
  account_status public.financial_state NOT NULL DEFAULT 'pending',
  
  -- Balance breakdown by payer
  total_charges DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_adjustments DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_payments DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Split by responsibility
  patient_responsibility DECIMAL(12,2) DEFAULT 0,
  payer_responsibility DECIMAL(12,2) DEFAULT 0, -- Insurance/Govt/Donor
  
  -- Current balances
  patient_balance DECIMAL(12,2) DEFAULT 0,
  payer_balance DECIMAL(12,2) DEFAULT 0,
  total_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Deposit tracking
  deposit_required DECIMAL(12,2) DEFAULT 0,
  deposit_paid DECIMAL(12,2) DEFAULT 0,
  deposit_satisfied BOOLEAN DEFAULT false,
  
  -- Coverage info
  primary_payer_type payer_type,
  primary_payer_id UUID, -- Reference to insurance/employer/programme
  coverage_verified BOOLEAN DEFAULT false,
  coverage_verified_at TIMESTAMPTZ,
  authorization_number TEXT,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TARIFFS (Price List / Charge Master)
-- =============================================
CREATE TABLE public.tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id), -- NULL = system-wide
  
  -- Service identification
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT, -- 'consultation', 'procedure', 'lab', 'imaging', 'bed_day', 'medication'
  
  -- Pricing
  base_price DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payer-specific pricing
  insurance_price DECIMAL(12,2),
  government_price DECIMAL(12,2),
  
  -- Rules
  requires_authorization BOOLEAN DEFAULT false,
  is_elective BOOLEAN DEFAULT false,
  is_emergency_exempt BOOLEAN DEFAULT true, -- Can bypass deposit requirement
  
  -- Validity
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(facility_id, service_code, effective_from)
);

-- =============================================
-- CHARGE SHEETS (Individual Charges)
-- =============================================
CREATE TABLE public.charge_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  encounter_id UUID REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  
  -- Service details
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT,
  quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status charge_status NOT NULL DEFAULT 'pending',
  
  -- Source reference
  source_entity_type TEXT, -- 'order', 'procedure', 'bed_day', 'consumable'
  source_entity_id UUID,
  
  -- Authorization
  requires_authorization BOOLEAN DEFAULT false,
  authorization_status TEXT, -- 'pending', 'approved', 'denied'
  authorization_number TEXT,
  authorization_date TIMESTAMPTZ,
  
  -- Adjustments
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  
  -- Attribution
  ordering_provider_id UUID,
  performing_provider_id UUID,
  cost_center TEXT,
  
  -- Timestamps
  service_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  billed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- INVOICES (Patient-facing bills)
-- =============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  visit_id UUID REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  
  -- Invoice type
  invoice_type TEXT NOT NULL DEFAULT 'final', -- 'deposit', 'interim', 'final', 'adjustment'
  
  -- Payer split
  payer_type payer_type NOT NULL DEFAULT 'patient',
  payer_id UUID, -- For insurance/employer
  payer_name TEXT,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status
  status invoice_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Follow-up
  last_reminder_sent TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  finalized_by UUID
);

-- =============================================
-- INVOICE LINE ITEMS
-- =============================================
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  charge_sheet_id UUID REFERENCES public.charge_sheets(id),
  
  -- Line details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  service_code TEXT,
  quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Service date
  service_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ADJUSTMENTS (Credits, Write-offs, Waivers)
-- =============================================
CREATE TABLE public.billing_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.visit_financial_accounts(id),
  invoice_id UUID REFERENCES public.invoices(id),
  charge_sheet_id UUID REFERENCES public.charge_sheets(id),
  
  adjustment_type TEXT NOT NULL, -- 'discount', 'waiver', 'write_off', 'correction', 'insurance_adjustment'
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  
  -- Approval
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- INVOICE NUMBER GENERATOR
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || 
      LPAD(NEXTVAL('public.invoice_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE TRIGGER invoice_before_insert
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- =============================================
-- TRIGGERS: Auto-update timestamps
-- =============================================
CREATE TRIGGER update_visit_financial_accounts_updated_at
  BEFORE UPDATE ON public.visit_financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tariffs_updated_at
  BEFORE UPDATE ON public.tariffs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTION: Update Account Balances
-- =============================================
CREATE OR REPLACE FUNCTION public.update_account_balances(p_account_id UUID)
RETURNS void AS $$
DECLARE
  v_totals RECORD;
BEGIN
  -- Calculate totals from charges and payments
  SELECT
    COALESCE(SUM(cs.net_amount), 0) as total_charges,
    COALESCE(SUM(ba.amount), 0) as total_adjustments
  INTO v_totals
  FROM public.visit_financial_accounts vfa
  LEFT JOIN public.charge_sheets cs ON cs.account_id = vfa.id AND cs.status = 'billed'
  LEFT JOIN public.billing_adjustments ba ON ba.account_id = vfa.id AND ba.approved_at IS NOT NULL
  WHERE vfa.id = p_account_id;

  UPDATE public.visit_financial_accounts
  SET
    total_charges = v_totals.total_charges,
    total_adjustments = v_totals.total_adjustments,
    total_balance = v_totals.total_charges - v_totals.total_adjustments - total_payments,
    patient_balance = patient_responsibility - total_payments,
    updated_at = now()
  WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.visit_financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_adjustments ENABLE ROW LEVEL SECURITY;

-- Visit Financial Accounts
CREATE POLICY "Staff can view financial accounts"
  ON public.visit_financial_accounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Finance staff can manage financial accounts"
  ON public.visit_financial_accounts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Tariffs
CREATE POLICY "Anyone can view active tariffs"
  ON public.tariffs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage tariffs"
  ON public.tariffs FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Charge Sheets
CREATE POLICY "Staff can view charge sheets"
  ON public.charge_sheets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage charge sheets"
  ON public.charge_sheets FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Invoices
CREATE POLICY "Staff can view invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Finance staff can manage invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Invoice Line Items
CREATE POLICY "Staff can view invoice line items"
  ON public.invoice_line_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Finance staff can manage invoice line items"
  ON public.invoice_line_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Billing Adjustments
CREATE POLICY "Staff can view adjustments"
  ON public.billing_adjustments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Finance staff can manage adjustments"
  ON public.billing_adjustments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_visit_financial_accounts_visit ON public.visit_financial_accounts(visit_id);
CREATE INDEX idx_visit_financial_accounts_patient ON public.visit_financial_accounts(patient_id);
CREATE INDEX idx_visit_financial_accounts_status ON public.visit_financial_accounts(account_status);

CREATE INDEX idx_tariffs_facility ON public.tariffs(facility_id);
CREATE INDEX idx_tariffs_service_code ON public.tariffs(service_code);
CREATE INDEX idx_tariffs_active ON public.tariffs(is_active) WHERE is_active = true;

CREATE INDEX idx_charge_sheets_visit ON public.charge_sheets(visit_id);
CREATE INDEX idx_charge_sheets_encounter ON public.charge_sheets(encounter_id);
CREATE INDEX idx_charge_sheets_account ON public.charge_sheets(account_id);
CREATE INDEX idx_charge_sheets_status ON public.charge_sheets(status);
CREATE INDEX idx_charge_sheets_date ON public.charge_sheets(service_date);

CREATE INDEX idx_invoices_visit ON public.invoices(visit_id);
CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_billing_adjustments_account ON public.billing_adjustments(account_id);
CREATE INDEX idx_billing_adjustments_invoice ON public.billing_adjustments(invoice_id);