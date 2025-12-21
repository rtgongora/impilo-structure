-- Lab Orders table
CREATE TABLE public.lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  order_number TEXT NOT NULL,
  ordered_by UUID,
  ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority TEXT NOT NULL DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'pending',
  department TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lab Results table
CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id),
  test_name TEXT NOT NULL,
  test_code TEXT,
  category TEXT,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_abnormal BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  performed_by UUID,
  performed_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theatre Bookings table
CREATE TABLE public.theatre_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  theatre_room TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_code TEXT,
  surgeon_id UUID,
  anaesthetist_id UUID,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'elective',
  pre_op_notes TEXT,
  post_op_notes TEXT,
  equipment_required TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Care Plans table
CREATE TABLE public.care_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Care Plan Diagnoses/Goals table
CREATE TABLE public.care_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id UUID NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'diagnosis', 'goal', 'intervention'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  referral_number TEXT NOT NULL,
  referral_type TEXT NOT NULL, -- 'internal', 'external', 'teleconsult'
  from_department TEXT,
  to_department TEXT NOT NULL,
  to_provider_id UUID,
  to_provider_name TEXT,
  urgency TEXT NOT NULL DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT NOT NULL,
  clinical_summary TEXT,
  requested_by UUID,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_by UUID,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clinical Alerts table
CREATE TABLE public.clinical_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  alert_type TEXT NOT NULL, -- 'lab_critical', 'vital_abnormal', 'medication_due', 'allergy', 'fall_risk'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT, -- 'lab', 'vitals', 'medication', 'manual'
  source_id UUID, -- reference to source record
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment Transactions table
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  transaction_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'payment', 'refund', 'adjustment'
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'mobile_money', 'insurance', 'bank_transfer'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  reference_number TEXT,
  notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insurance Claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  claim_number TEXT NOT NULL,
  insurance_provider TEXT NOT NULL,
  policy_number TEXT,
  total_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'processing', 'approved', 'denied', 'partial', 'paid'
  submitted_at TIMESTAMP WITH TIME ZONE,
  response_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatre_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_orders
CREATE POLICY "Authenticated users can view lab orders" ON public.lab_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create lab orders" ON public.lab_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update lab orders" ON public.lab_orders FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for lab_results
CREATE POLICY "Authenticated users can view lab results" ON public.lab_results FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create lab results" ON public.lab_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update lab results" ON public.lab_results FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for theatre_bookings
CREATE POLICY "Authenticated users can view theatre bookings" ON public.theatre_bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create theatre bookings" ON public.theatre_bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update theatre bookings" ON public.theatre_bookings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can delete theatre bookings" ON public.theatre_bookings FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for care_plans
CREATE POLICY "Authenticated users can view care plans" ON public.care_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create care plans" ON public.care_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update care plans" ON public.care_plans FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for care_plan_items
CREATE POLICY "Authenticated users can view care plan items" ON public.care_plan_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create care plan items" ON public.care_plan_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update care plan items" ON public.care_plan_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can delete care plan items" ON public.care_plan_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for referrals
CREATE POLICY "Authenticated users can view referrals" ON public.referrals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update referrals" ON public.referrals FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for clinical_alerts
CREATE POLICY "Authenticated users can view clinical alerts" ON public.clinical_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can create clinical alerts" ON public.clinical_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update clinical alerts" ON public.clinical_alerts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for payment_transactions
CREATE POLICY "Authenticated users can view payment transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update payment transactions" ON public.payment_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for insurance_claims
CREATE POLICY "Authenticated users can view insurance claims" ON public.insurance_claims FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create insurance claims" ON public.insurance_claims FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update insurance claims" ON public.insurance_claims FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add update triggers
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON public.lab_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_theatre_bookings_updated_at BEFORE UPDATE ON public.theatre_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_plan_items_updated_at BEFORE UPDATE ON public.care_plan_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate lab order number function
CREATE OR REPLACE FUNCTION public.generate_lab_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.lab_orders 
  WHERE order_number LIKE 'LAB-' || date_part || '-%';
  
  new_number := 'LAB-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate referral number function
CREATE OR REPLACE FUNCTION public.generate_referral_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(referral_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.referrals 
  WHERE referral_number LIKE 'REF-' || date_part || '-%';
  
  new_number := 'REF-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate claim number function
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.insurance_claims 
  WHERE claim_number LIKE 'CLM-' || date_part || '-%';
  
  new_number := 'CLM-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate transaction number function
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.payment_transactions 
  WHERE transaction_number LIKE 'TXN-' || date_part || '-%';
  
  new_number := 'TXN-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;