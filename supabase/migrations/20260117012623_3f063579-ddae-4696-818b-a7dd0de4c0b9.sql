-- =====================================================
-- PATIENT MANAGEMENT CORE - REMAINING TABLES
-- =====================================================

-- 1. PATIENT ALLERGIES (structured, not JSON)
-- =====================================================
CREATE TABLE public.patient_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id),
  
  -- Allergy details
  allergen_type TEXT NOT NULL CHECK (allergen_type IN ('drug', 'food', 'environmental', 'biological', 'other')),
  allergen_code TEXT,
  allergen_code_system TEXT,
  allergen_display TEXT NOT NULL,
  
  -- Reaction details
  reaction_type TEXT CHECK (reaction_type IN ('allergy', 'intolerance', 'adverse_reaction')),
  reaction_severity TEXT CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  reaction_manifestations TEXT[],
  reaction_onset TEXT CHECK (reaction_onset IN ('immediate', 'delayed', 'unknown')),
  
  -- Clinical status
  clinical_status TEXT NOT NULL DEFAULT 'active' CHECK (clinical_status IN ('active', 'inactive', 'resolved')),
  verification_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (verification_status IN ('unconfirmed', 'confirmed', 'refuted', 'entered_in_error')),
  criticality TEXT CHECK (criticality IN ('low', 'high', 'unable_to_assess')),
  
  -- Dates and provenance
  onset_date DATE,
  recorded_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID,
  last_occurrence DATE,
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_allergies_patient ON public.patient_allergies(patient_id);
CREATE INDEX idx_patient_allergies_status ON public.patient_allergies(clinical_status);

-- 2. PATIENT PROBLEMS / CONDITIONS
-- =====================================================
CREATE TABLE public.patient_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id),
  
  -- Problem identification
  problem_code TEXT,
  problem_code_system TEXT DEFAULT 'ICD-11',
  problem_display TEXT NOT NULL,
  problem_category TEXT CHECK (problem_category IN ('problem', 'diagnosis', 'health_concern', 'symptom')),
  
  -- Clinical status
  clinical_status TEXT NOT NULL DEFAULT 'active' CHECK (clinical_status IN ('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved')),
  verification_status TEXT NOT NULL DEFAULT 'provisional' CHECK (verification_status IN ('provisional', 'differential', 'confirmed', 'refuted', 'entered_in_error')),
  
  -- Severity
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  body_site TEXT,
  
  -- Dates
  onset_date DATE,
  abatement_date DATE,
  recorded_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID,
  
  -- Classification
  is_principal_diagnosis BOOLEAN DEFAULT false,
  is_chronic BOOLEAN DEFAULT false,
  rank_order INTEGER,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_problems_patient ON public.patient_problems(patient_id);
CREATE INDEX idx_patient_problems_status ON public.patient_problems(clinical_status);
CREATE INDEX idx_patient_problems_code ON public.patient_problems(problem_code);

-- 3. MEDICATION RECONCILIATION
-- =====================================================
CREATE TABLE public.medication_reconciliation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id),
  visit_id UUID REFERENCES public.visits(id),
  
  reconciliation_type TEXT NOT NULL CHECK (reconciliation_type IN ('admission', 'transfer', 'discharge')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'verified')),
  
  source TEXT CHECK (source IN ('patient', 'caregiver', 'pharmacy', 'medical_record', 'medication_list', 'other')),
  source_verified BOOLEAN DEFAULT false,
  
  home_medications JSONB DEFAULT '[]',
  reconciled_medications JSONB DEFAULT '[]',
  discrepancies JSONB DEFAULT '[]',
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  performed_by UUID NOT NULL,
  verified_by UUID,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_med_rec_patient ON public.medication_reconciliation(patient_id);
CREATE INDEX idx_med_rec_encounter ON public.medication_reconciliation(encounter_id);

-- 4. CLINICAL OBSERVATIONS (non-vital structured observations)
-- =====================================================
CREATE TABLE public.clinical_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id),
  
  observation_code TEXT NOT NULL,
  observation_code_system TEXT DEFAULT 'LOINC',
  observation_display TEXT NOT NULL,
  observation_category TEXT CHECK (observation_category IN (
    'vital_signs', 'laboratory', 'imaging', 'procedure', 'survey', 
    'exam', 'therapy', 'activity', 'social_history', 'functional_status'
  )),
  
  value_type TEXT NOT NULL CHECK (value_type IN ('quantity', 'string', 'boolean', 'integer', 'codeable_concept', 'range')),
  value_quantity NUMERIC,
  value_quantity_unit TEXT,
  value_string TEXT,
  value_boolean BOOLEAN,
  value_integer INTEGER,
  value_code TEXT,
  
  reference_range_low NUMERIC,
  reference_range_high NUMERIC,
  reference_range_text TEXT,
  
  interpretation TEXT CHECK (interpretation IN ('normal', 'abnormal', 'low', 'high', 'critical_low', 'critical_high', 'positive', 'negative')),
  
  status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('registered', 'preliminary', 'final', 'amended', 'cancelled', 'entered_in_error')),
  effective_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  performer_id UUID,
  performer_name TEXT,
  body_site TEXT,
  method TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_observations_patient ON public.clinical_observations(patient_id);
CREATE INDEX idx_observations_encounter ON public.clinical_observations(encounter_id);
CREATE INDEX idx_observations_code ON public.clinical_observations(observation_code);

-- 5. RESULT ACKNOWLEDGMENTS
-- =====================================================
CREATE TABLE public.result_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  
  result_type TEXT NOT NULL CHECK (result_type IN ('lab', 'imaging', 'pathology', 'procedure', 'other')),
  result_id UUID NOT NULL,
  result_table TEXT NOT NULL,
  
  acknowledged_by UUID NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledgment_type TEXT NOT NULL CHECK (acknowledgment_type IN ('viewed', 'reviewed', 'action_taken', 'no_action_needed')),
  
  action_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  
  is_critical BOOLEAN DEFAULT false,
  critical_acknowledged_within_sla BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_result_ack_patient ON public.result_acknowledgments(patient_id);
CREATE INDEX idx_result_ack_result ON public.result_acknowledgments(result_id);

-- 6. ENHANCE EXISTING CLINICAL_NOTES TABLE
-- =====================================================
ALTER TABLE public.clinical_notes 
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id),
  ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES public.visits(id),
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS note_title TEXT,
  ADD COLUMN IF NOT EXISTS narrative TEXT,
  ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS author_role TEXT,
  ADD COLUMN IF NOT EXISTS requires_cosign BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cosigner_id UUID,
  ADD COLUMN IF NOT EXISTS cosigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_amendment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS amends_note_id UUID,
  ADD COLUMN IF NOT EXISTS amendment_reason TEXT,
  ADD COLUMN IF NOT EXISTS note_datetime TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON public.clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_status ON public.clinical_notes(status);

-- 7. ENABLE RLS
-- =====================================================
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_acknowledgments ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES
-- =====================================================
CREATE POLICY "Authenticated can view allergies" ON public.patient_allergies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage allergies" ON public.patient_allergies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view problems" ON public.patient_problems FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage problems" ON public.patient_problems FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view med_rec" ON public.medication_reconciliation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage med_rec" ON public.medication_reconciliation FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view observations" ON public.clinical_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage observations" ON public.clinical_observations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view acknowledgments" ON public.result_acknowledgments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create acknowledgments" ON public.result_acknowledgments FOR INSERT TO authenticated WITH CHECK (auth.uid() = acknowledged_by);

-- 9. UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_patient_mgmt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_allergies_updated_at BEFORE UPDATE ON public.patient_allergies FOR EACH ROW EXECUTE FUNCTION public.update_patient_mgmt_updated_at();
CREATE TRIGGER update_patient_problems_updated_at BEFORE UPDATE ON public.patient_problems FOR EACH ROW EXECUTE FUNCTION public.update_patient_mgmt_updated_at();
CREATE TRIGGER update_medication_reconciliation_updated_at BEFORE UPDATE ON public.medication_reconciliation FOR EACH ROW EXECUTE FUNCTION public.update_patient_mgmt_updated_at();
CREATE TRIGGER update_clinical_observations_updated_at BEFORE UPDATE ON public.clinical_observations FOR EACH ROW EXECUTE FUNCTION public.update_patient_mgmt_updated_at();