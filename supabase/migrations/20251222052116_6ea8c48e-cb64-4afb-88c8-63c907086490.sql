-- =====================================================
-- PHASE 2 COMPLETION: ORDER & WORKFLOW SYSTEMS
-- =====================================================

-- 1. PRESCRIPTIONS TABLE (ePrescription management)
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  prescribed_by UUID REFERENCES auth.users(id),
  prescribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'dispensed', 'partially_dispensed', 'cancelled', 'expired')),
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  pharmacy_notes TEXT,
  dispensing_instructions TEXT,
  valid_until DATE,
  refills_authorized INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  controlled_schedule TEXT, -- DEA Schedule I-V
  requires_prior_auth BOOLEAN DEFAULT FALSE,
  prior_auth_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PRESCRIPTION ITEMS (individual medications in a prescription)
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  ndc_code TEXT, -- National Drug Code
  dosage TEXT NOT NULL,
  dosage_unit TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT NOT NULL,
  duration TEXT,
  quantity INTEGER NOT NULL,
  dispense_as_written BOOLEAN DEFAULT FALSE,
  substitution_allowed BOOLEAN DEFAULT TRUE,
  instructions TEXT,
  indication TEXT,
  is_controlled BOOLEAN DEFAULT FALSE,
  schedule TEXT, -- DEA Schedule
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dispensed', 'partial', 'cancelled')),
  dispensed_quantity INTEGER DEFAULT 0,
  dispensed_at TIMESTAMPTZ,
  dispensed_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRESCRIPTION REFILLS (tracking refill requests and history)
CREATE TABLE public.prescription_refills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id),
  refill_number INTEGER NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by TEXT, -- patient, provider, pharmacy
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'dispensed', 'expired')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  dispensed_at TIMESTAMPTZ,
  dispensed_by UUID REFERENCES auth.users(id),
  denial_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FORMULARY (drug formulary for institution)
CREATE TABLE public.formulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  brand_names TEXT[],
  ndc_code TEXT,
  drug_class TEXT,
  therapeutic_category TEXT,
  formulary_status TEXT NOT NULL DEFAULT 'formulary' CHECK (formulary_status IN ('formulary', 'non-formulary', 'restricted', 'prior-auth-required')),
  restrictions TEXT,
  alternatives TEXT[],
  dosage_forms TEXT[],
  available_strengths TEXT[],
  unit_cost NUMERIC(10,2),
  is_controlled BOOLEAN DEFAULT FALSE,
  dea_schedule TEXT,
  requires_monitoring BOOLEAN DEFAULT FALSE,
  monitoring_parameters TEXT[],
  contraindications TEXT[],
  black_box_warning TEXT,
  pregnancy_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CONTROLLED SUBSTANCE LOG (audit trail for controlled substances)
CREATE TABLE public.controlled_substance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_item_id UUID REFERENCES public.prescription_items(id),
  medication_name TEXT NOT NULL,
  dea_schedule TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('received', 'dispensed', 'wasted', 'returned', 'transferred', 'count', 'discrepancy')),
  quantity NUMERIC(10,2) NOT NULL,
  quantity_unit TEXT NOT NULL,
  batch_number TEXT,
  patient_id UUID REFERENCES public.patients(id),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  witnessed_by UUID REFERENCES auth.users(id),
  witness_required BOOLEAN DEFAULT TRUE,
  reason TEXT,
  discrepancy_notes TEXT,
  location TEXT,
  inventory_before NUMERIC(10,2),
  inventory_after NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PATIENT COUNSELING (pharmacy counseling documentation)
CREATE TABLE public.patient_counseling (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  counseled_by UUID NOT NULL REFERENCES auth.users(id),
  counseled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  counseling_offered BOOLEAN NOT NULL DEFAULT TRUE,
  counseling_accepted BOOLEAN,
  counseling_declined_reason TEXT,
  topics_covered TEXT[], -- ['purpose', 'dosage', 'administration', 'side_effects', 'storage', 'interactions', 'refills']
  patient_questions TEXT,
  pharmacist_responses TEXT,
  comprehension_verified BOOLEAN DEFAULT FALSE,
  interpreter_used BOOLEAN DEFAULT FALSE,
  interpreter_language TEXT,
  special_instructions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SPECIMENS TABLE (pathology specimen tracking)
CREATE TABLE public.specimens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specimen_id TEXT NOT NULL UNIQUE, -- barcode/QR ID
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  lab_order_id UUID REFERENCES public.lab_orders(id),
  specimen_type TEXT NOT NULL, -- blood, urine, tissue, swab, stool, csf, etc.
  specimen_source TEXT, -- left arm, right arm, wound, etc.
  collection_site TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_by UUID REFERENCES auth.users(id),
  collection_method TEXT, -- venipuncture, fingerstick, midstream, biopsy, etc.
  volume_collected TEXT,
  volume_unit TEXT,
  container_type TEXT,
  preservative TEXT,
  fasting_status TEXT CHECK (fasting_status IN ('fasting', 'non-fasting', 'unknown')),
  collection_notes TEXT,
  status TEXT NOT NULL DEFAULT 'collected' CHECK (status IN ('ordered', 'collected', 'in-transit', 'received', 'processing', 'completed', 'rejected', 'insufficient')),
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  temperature_requirement TEXT, -- room temp, refrigerated, frozen
  transport_conditions TEXT,
  rejection_reason TEXT,
  is_biohazard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. SPECIMEN TRACKING (chain of custody)
CREATE TABLE public.specimen_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specimen_id UUID NOT NULL REFERENCES public.specimens(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('collected', 'labeled', 'transported', 'received', 'accessioned', 'aliquoted', 'tested', 'stored', 'disposed', 'rejected')),
  location_from TEXT,
  location_to TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperature_logged NUMERIC(5,2),
  condition_on_receipt TEXT, -- intact, hemolyzed, lipemic, clotted, insufficient
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. FIVE RIGHTS VERIFICATION (medication safety)
CREATE TABLE public.five_rights_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_item_id UUID REFERENCES public.prescription_items(id),
  medication_administration_id UUID REFERENCES public.medication_administrations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  verified_by UUID NOT NULL REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  right_patient BOOLEAN NOT NULL DEFAULT FALSE,
  patient_verification_method TEXT, -- wristband, verbal, photo, biometric
  right_medication BOOLEAN NOT NULL DEFAULT FALSE,
  medication_barcode_scanned BOOLEAN DEFAULT FALSE,
  right_dose BOOLEAN NOT NULL DEFAULT FALSE,
  dose_calculated BOOLEAN DEFAULT FALSE,
  right_route BOOLEAN NOT NULL DEFAULT FALSE,
  right_time BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_time TIMESTAMPTZ,
  actual_time TIMESTAMPTZ,
  all_rights_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  double_check_required BOOLEAN DEFAULT FALSE,
  double_checked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_refills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controlled_substance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_counseling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimen_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.five_rights_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Prescriptions
CREATE POLICY "Authenticated users can view prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can create prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Clinical staff can update prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for Prescription Items
CREATE POLICY "Authenticated users can view prescription items" ON public.prescription_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can manage prescription items" ON public.prescription_items
  FOR ALL TO authenticated USING (true);

-- RLS Policies for Prescription Refills
CREATE POLICY "Authenticated users can view refills" ON public.prescription_refills
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can manage refills" ON public.prescription_refills
  FOR ALL TO authenticated USING (true);

-- RLS Policies for Formulary (read by all authenticated, managed by admins)
CREATE POLICY "Authenticated users can view formulary" ON public.formulary
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage formulary" ON public.formulary
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for Controlled Substance Log (strict audit trail)
CREATE POLICY "Authenticated users can view controlled substance log" ON public.controlled_substance_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can log controlled substances" ON public.controlled_substance_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for Patient Counseling
CREATE POLICY "Authenticated users can view counseling records" ON public.patient_counseling
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can manage counseling records" ON public.patient_counseling
  FOR ALL TO authenticated USING (true);

-- RLS Policies for Specimens
CREATE POLICY "Authenticated users can view specimens" ON public.specimens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can manage specimens" ON public.specimens
  FOR ALL TO authenticated USING (true);

-- RLS Policies for Specimen Tracking
CREATE POLICY "Authenticated users can view specimen tracking" ON public.specimen_tracking
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can add tracking entries" ON public.specimen_tracking
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for Five Rights Verification
CREATE POLICY "Authenticated users can view verifications" ON public.five_rights_verification
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can create verifications" ON public.five_rights_verification
  FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_encounter ON public.prescriptions(encounter_id);
CREATE INDEX idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX idx_prescriptions_number ON public.prescriptions(prescription_number);

CREATE INDEX idx_prescription_items_prescription ON public.prescription_items(prescription_id);
CREATE INDEX idx_prescription_refills_prescription ON public.prescription_refills(prescription_id);

CREATE INDEX idx_formulary_medication ON public.formulary(medication_name);
CREATE INDEX idx_formulary_generic ON public.formulary(generic_name);
CREATE INDEX idx_formulary_status ON public.formulary(formulary_status);

CREATE INDEX idx_controlled_log_prescription ON public.controlled_substance_log(prescription_item_id);
CREATE INDEX idx_controlled_log_patient ON public.controlled_substance_log(patient_id);
CREATE INDEX idx_controlled_log_performed ON public.controlled_substance_log(performed_by);

CREATE INDEX idx_specimens_patient ON public.specimens(patient_id);
CREATE INDEX idx_specimens_encounter ON public.specimens(encounter_id);
CREATE INDEX idx_specimens_lab_order ON public.specimens(lab_order_id);
CREATE INDEX idx_specimens_specimen_id ON public.specimens(specimen_id);
CREATE INDEX idx_specimens_status ON public.specimens(status);

CREATE INDEX idx_specimen_tracking_specimen ON public.specimen_tracking(specimen_id);

CREATE INDEX idx_five_rights_patient ON public.five_rights_verification(patient_id);
CREATE INDEX idx_five_rights_prescription ON public.five_rights_verification(prescription_item_id);

-- Function to generate prescription number
CREATE OR REPLACE FUNCTION public.generate_prescription_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_number FROM 11) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.prescriptions 
  WHERE prescription_number LIKE 'RX-' || date_part || '-%';
  
  new_number := 'RX-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Function to generate specimen ID
CREATE OR REPLACE FUNCTION public.generate_specimen_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(specimen_id FROM 13) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.specimens 
  WHERE specimen_id LIKE 'SPEC-' || date_part || '-%';
  
  new_id := 'SPEC-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_id;
END;
$$;

-- Updated_at triggers
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formulary_updated_at
  BEFORE UPDATE ON public.formulary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specimens_updated_at
  BEFORE UPDATE ON public.specimens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some common formulary items
INSERT INTO public.formulary (medication_name, generic_name, drug_class, therapeutic_category, dosage_forms, available_strengths, is_controlled, formulary_status) VALUES
('Amoxicillin', 'Amoxicillin', 'Antibiotic', 'Anti-infective', ARRAY['capsule', 'suspension'], ARRAY['250mg', '500mg'], false, 'formulary'),
('Metformin', 'Metformin Hydrochloride', 'Biguanide', 'Antidiabetic', ARRAY['tablet', 'tablet-extended-release'], ARRAY['500mg', '850mg', '1000mg'], false, 'formulary'),
('Lisinopril', 'Lisinopril', 'ACE Inhibitor', 'Antihypertensive', ARRAY['tablet'], ARRAY['5mg', '10mg', '20mg', '40mg'], false, 'formulary'),
('Atorvastatin', 'Atorvastatin Calcium', 'Statin', 'Antilipemic', ARRAY['tablet'], ARRAY['10mg', '20mg', '40mg', '80mg'], false, 'formulary'),
('Omeprazole', 'Omeprazole', 'Proton Pump Inhibitor', 'Gastrointestinal', ARRAY['capsule'], ARRAY['20mg', '40mg'], false, 'formulary'),
('Amlodipine', 'Amlodipine Besylate', 'Calcium Channel Blocker', 'Antihypertensive', ARRAY['tablet'], ARRAY['2.5mg', '5mg', '10mg'], false, 'formulary'),
('Hydrocodone/Acetaminophen', 'Hydrocodone/APAP', 'Opioid Analgesic', 'Pain Management', ARRAY['tablet'], ARRAY['5/325mg', '7.5/325mg', '10/325mg'], true, 'restricted'),
('Morphine Sulfate', 'Morphine', 'Opioid Analgesic', 'Pain Management', ARRAY['tablet', 'injection', 'solution'], ARRAY['15mg', '30mg', '60mg'], true, 'restricted'),
('Alprazolam', 'Alprazolam', 'Benzodiazepine', 'Anxiolytic', ARRAY['tablet'], ARRAY['0.25mg', '0.5mg', '1mg', '2mg'], true, 'restricted'),
('Gabapentin', 'Gabapentin', 'Anticonvulsant', 'Neuropathic Pain', ARRAY['capsule', 'tablet'], ARRAY['100mg', '300mg', '400mg', '600mg', '800mg'], false, 'formulary'),
('Prednisone', 'Prednisone', 'Corticosteroid', 'Anti-inflammatory', ARRAY['tablet'], ARRAY['5mg', '10mg', '20mg', '50mg'], false, 'formulary'),
('Azithromycin', 'Azithromycin', 'Macrolide Antibiotic', 'Anti-infective', ARRAY['tablet', 'suspension'], ARRAY['250mg', '500mg'], false, 'formulary'),
('Ceftriaxone', 'Ceftriaxone Sodium', 'Cephalosporin', 'Anti-infective', ARRAY['injection'], ARRAY['250mg', '500mg', '1g', '2g'], false, 'formulary'),
('Furosemide', 'Furosemide', 'Loop Diuretic', 'Diuretic', ARRAY['tablet', 'injection'], ARRAY['20mg', '40mg', '80mg'], false, 'formulary'),
('Pantoprazole', 'Pantoprazole Sodium', 'Proton Pump Inhibitor', 'Gastrointestinal', ARRAY['tablet', 'injection'], ARRAY['20mg', '40mg'], false, 'formulary')
ON CONFLICT DO NOTHING;