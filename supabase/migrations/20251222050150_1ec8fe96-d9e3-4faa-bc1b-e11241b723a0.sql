-- =====================================================
-- FIX: Remove conflicting RLS policies causing infinite recursion
-- =====================================================

-- Drop all existing policies on user_roles that cause recursion
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate policies using ONLY the has_role() security definer function
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SHARED HEALTH RECORD (SHR) INFRASTRUCTURE
-- Based on HAPI FHIR Architecture
-- =====================================================

-- FHIR Bundles/Compositions for longitudinal patient records
CREATE TABLE IF NOT EXISTS public.shr_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id),
  bundle_type TEXT NOT NULL DEFAULT 'document', -- document, message, transaction
  composition_type TEXT NOT NULL, -- encounter-summary, discharge-summary, referral
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preliminary', -- preliminary, final, amended, entered-in-error
  authored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID,
  fhir_version TEXT DEFAULT 'R4',
  bundle_json JSONB NOT NULL,
  signature_hash TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on SHR bundles
ALTER TABLE public.shr_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SHR bundles"
ON public.shr_bundles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create SHR bundles"
ON public.shr_bundles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update SHR bundles"
ON public.shr_bundles FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TERMINOLOGY SERVICE (OCL Based)
-- =====================================================

-- Terminology Code Systems (ICD-11, SNOMED-CT, LOINC, ATC, etc.)
CREATE TABLE IF NOT EXISTS public.terminology_code_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_system_id TEXT NOT NULL UNIQUE, -- e.g., 'icd-11', 'snomed-ct', 'loinc', 'atc'
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  uri TEXT, -- Official URI (e.g., http://snomed.info/sct)
  publisher TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Terminology Concepts (actual codes)
CREATE TABLE IF NOT EXISTS public.terminology_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_system_id UUID NOT NULL REFERENCES public.terminology_code_systems(id),
  code TEXT NOT NULL,
  display TEXT NOT NULL,
  definition TEXT,
  parent_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  properties JSONB, -- Additional properties like severity, laterality
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code_system_id, code)
);

-- Value Sets (curated subsets of codes for specific use cases)
CREATE TABLE IF NOT EXISTS public.terminology_value_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value_set_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'active', -- draft, active, retired
  purpose TEXT, -- clinical, administrative, billing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Value Set Memberships (which concepts belong to which value sets)
CREATE TABLE IF NOT EXISTS public.terminology_value_set_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value_set_id UUID NOT NULL REFERENCES public.terminology_value_sets(id),
  concept_id UUID NOT NULL REFERENCES public.terminology_concepts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(value_set_id, concept_id)
);

-- Concept Mappings (translations between code systems)
CREATE TABLE IF NOT EXISTS public.terminology_concept_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_concept_id UUID NOT NULL REFERENCES public.terminology_concepts(id),
  target_concept_id UUID NOT NULL REFERENCES public.terminology_concepts(id),
  equivalence TEXT NOT NULL DEFAULT 'equivalent', -- equivalent, wider, narrower, inexact
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_concept_id, target_concept_id)
);

-- Enable RLS on terminology tables
ALTER TABLE public.terminology_code_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_value_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_value_set_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_concept_maps ENABLE ROW LEVEL SECURITY;

-- Everyone can read terminology (it's reference data)
CREATE POLICY "Anyone can view code systems"
ON public.terminology_code_systems FOR SELECT USING (true);

CREATE POLICY "Anyone can view concepts"
ON public.terminology_concepts FOR SELECT USING (true);

CREATE POLICY "Anyone can view value sets"
ON public.terminology_value_sets FOR SELECT USING (true);

CREATE POLICY "Anyone can view value set members"
ON public.terminology_value_set_members FOR SELECT USING (true);

CREATE POLICY "Anyone can view concept maps"
ON public.terminology_concept_maps FOR SELECT USING (true);

-- Only admins can manage terminology
CREATE POLICY "Admins can manage code systems"
ON public.terminology_code_systems FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage concepts"
ON public.terminology_concepts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage value sets"
ON public.terminology_value_sets FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage value set members"
ON public.terminology_value_set_members FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage concept maps"
ON public.terminology_concept_maps FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- NATIONAL DATA REPOSITORY (NDR)
-- Analytics-optimized data warehouse tables
-- =====================================================

-- NDR Observations (denormalized for analytics)
CREATE TABLE IF NOT EXISTS public.ndr_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  encounter_id UUID,
  facility_id UUID,
  observation_type TEXT NOT NULL, -- vital, lab, diagnosis, procedure
  code TEXT NOT NULL,
  code_system TEXT NOT NULL,
  display TEXT NOT NULL,
  value_quantity NUMERIC,
  value_unit TEXT,
  value_string TEXT,
  value_coded TEXT,
  effective_date DATE NOT NULL,
  effective_datetime TIMESTAMP WITH TIME ZONE,
  performer_id UUID,
  status TEXT NOT NULL DEFAULT 'final',
  is_abnormal BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  source_system TEXT DEFAULT 'impilo-ehr',
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Denormalized patient demographics for analytics
  patient_age_years INTEGER,
  patient_gender TEXT,
  patient_province TEXT,
  patient_district TEXT
);

-- NDR Encounters (denormalized summary)
CREATE TABLE IF NOT EXISTS public.ndr_encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL UNIQUE,
  patient_id UUID NOT NULL,
  facility_id UUID,
  encounter_type TEXT NOT NULL,
  encounter_class TEXT, -- ambulatory, inpatient, emergency
  admission_date DATE NOT NULL,
  discharge_date DATE,
  length_of_stay INTEGER,
  primary_diagnosis_code TEXT,
  primary_diagnosis_display TEXT,
  secondary_diagnoses JSONB,
  procedures_performed JSONB,
  discharge_disposition TEXT,
  source_system TEXT DEFAULT 'impilo-ehr',
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Analytics dimensions
  facility_name TEXT,
  facility_type TEXT,
  facility_province TEXT,
  patient_age_at_encounter INTEGER,
  patient_gender TEXT
);

-- NDR Aggregated Indicators (pre-computed metrics)
CREATE TABLE IF NOT EXISTS public.ndr_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_code TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  period_type TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  facility_id UUID,
  province TEXT,
  district TEXT,
  numerator NUMERIC,
  denominator NUMERIC,
  value NUMERIC NOT NULL,
  unit TEXT,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(indicator_code, period_start, period_end, facility_id)
);

-- Enable RLS on NDR tables
ALTER TABLE public.ndr_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndr_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndr_indicators ENABLE ROW LEVEL SECURITY;

-- NDR is read-only for most users, write for system/admins
CREATE POLICY "Authenticated can view NDR observations"
ON public.ndr_observations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can view NDR encounters"
ON public.ndr_encounters FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can view NDR indicators"
ON public.ndr_indicators FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert NDR observations"
ON public.ndr_observations FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert NDR encounters"
ON public.ndr_encounters FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can manage NDR indicators"
ON public.ndr_indicators FOR ALL
USING (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shr_bundles_patient ON public.shr_bundles(patient_id);
CREATE INDEX IF NOT EXISTS idx_shr_bundles_encounter ON public.shr_bundles(encounter_id);
CREATE INDEX IF NOT EXISTS idx_shr_bundles_authored ON public.shr_bundles(authored_at);

CREATE INDEX IF NOT EXISTS idx_terminology_concepts_code ON public.terminology_concepts(code);
CREATE INDEX IF NOT EXISTS idx_terminology_concepts_display ON public.terminology_concepts USING gin(to_tsvector('english', display));

CREATE INDEX IF NOT EXISTS idx_ndr_observations_patient ON public.ndr_observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_ndr_observations_date ON public.ndr_observations(effective_date);
CREATE INDEX IF NOT EXISTS idx_ndr_observations_type ON public.ndr_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_ndr_observations_code ON public.ndr_observations(code);

CREATE INDEX IF NOT EXISTS idx_ndr_encounters_patient ON public.ndr_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_ndr_encounters_facility ON public.ndr_encounters(facility_id);
CREATE INDEX IF NOT EXISTS idx_ndr_encounters_admission ON public.ndr_encounters(admission_date);

CREATE INDEX IF NOT EXISTS idx_ndr_indicators_code ON public.ndr_indicators(indicator_code);
CREATE INDEX IF NOT EXISTS idx_ndr_indicators_period ON public.ndr_indicators(period_start, period_end);

-- =====================================================
-- SEED DEFAULT TERMINOLOGY CODE SYSTEMS
-- =====================================================

INSERT INTO public.terminology_code_systems (code_system_id, name, description, version, uri, publisher)
VALUES 
  ('icd-11', 'ICD-11', 'International Classification of Diseases 11th Revision', '2024', 'http://id.who.int/icd/release/11', 'WHO'),
  ('snomed-ct', 'SNOMED CT', 'Systematized Nomenclature of Medicine Clinical Terms', '2024', 'http://snomed.info/sct', 'SNOMED International'),
  ('loinc', 'LOINC', 'Logical Observation Identifiers Names and Codes', '2.77', 'http://loinc.org', 'Regenstrief Institute'),
  ('atc', 'ATC', 'Anatomical Therapeutic Chemical Classification', '2024', 'http://www.whocc.no/atc', 'WHO'),
  ('cpt', 'CPT', 'Current Procedural Terminology', '2024', 'http://www.ama-assn.org/go/cpt', 'AMA'),
  ('cvx', 'CVX', 'Vaccine Administered Code Set', '2024', 'http://hl7.org/fhir/sid/cvx', 'CDC')
ON CONFLICT (code_system_id) DO NOTHING;

-- Seed some value sets
INSERT INTO public.terminology_value_sets (value_set_id, name, description, purpose)
VALUES 
  ('vs-triage-categories', 'Triage Categories', 'Emergency triage classification', 'clinical'),
  ('vs-vital-signs', 'Vital Signs', 'Standard vital sign observation types', 'clinical'),
  ('vs-encounter-types', 'Encounter Types', 'Classification of clinical encounters', 'clinical'),
  ('vs-discharge-dispositions', 'Discharge Dispositions', 'Patient discharge outcomes', 'clinical'),
  ('vs-common-diagnoses-zw', 'Zimbabwe Common Diagnoses', 'Frequently used diagnoses in Zimbabwe', 'clinical')
ON CONFLICT (value_set_id) DO NOTHING;

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================

CREATE TRIGGER update_shr_bundles_updated_at
BEFORE UPDATE ON public.shr_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terminology_code_systems_updated_at
BEFORE UPDATE ON public.terminology_code_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terminology_value_sets_updated_at
BEFORE UPDATE ON public.terminology_value_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();