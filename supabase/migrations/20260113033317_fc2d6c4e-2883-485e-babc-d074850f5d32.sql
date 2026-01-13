-- =====================================================
-- CRVS MODULE: CIVIL REGISTRATION & VITAL STATISTICS
-- Zimbabwe Context: Birth (42 days) / Death (30 days)
-- =====================================================

-- ENUMS
CREATE TYPE crvs_notification_type AS ENUM ('birth', 'death');
CREATE TYPE crvs_notification_source AS ENUM ('facility', 'community', 'client_portal');
CREATE TYPE crvs_notification_status AS ENUM ('draft', 'pending_verification', 'verified', 'submitted_to_registrar', 'registered', 'rejected', 'requires_correction');
CREATE TYPE crvs_death_manner AS ENUM ('natural', 'accident', 'suicide', 'homicide', 'pending_investigation', 'undetermined');
CREATE TYPE crvs_cod_method AS ENUM ('mccd', 'verbal_autopsy', 'pending');
CREATE TYPE crvs_va_status AS ENUM ('pending', 'in_progress', 'completed', 'needs_review', 'cancelled');
CREATE TYPE crvs_certificate_status AS ENUM ('not_requested', 'requested', 'approved', 'printed', 'issued', 'collected', 'reprint_requested', 'amended');
CREATE TYPE crvs_birth_plurality AS ENUM ('single', 'twin', 'triplet', 'higher_order');
CREATE TYPE crvs_notifier_role AS ENUM ('facility_nurse', 'facility_doctor', 'records_clerk', 'vhw', 'eht', 'village_head', 'councillor', 'relative', 'other');

-- ===================
-- BIRTH NOTIFICATIONS
-- ===================
CREATE TABLE public.birth_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_number TEXT UNIQUE NOT NULL,
  source crvs_notification_source NOT NULL DEFAULT 'facility',
  status crvs_notification_status NOT NULL DEFAULT 'draft',
  
  -- Child Details
  child_given_names TEXT,
  child_family_name TEXT,
  child_sex TEXT NOT NULL CHECK (child_sex IN ('male', 'female', 'indeterminate')),
  date_of_birth DATE NOT NULL,
  time_of_birth TIME,
  is_date_estimated BOOLEAN DEFAULT false,
  birth_weight_grams INTEGER,
  plurality crvs_birth_plurality DEFAULT 'single',
  birth_order INTEGER DEFAULT 1,
  
  -- Birth Location
  birth_occurred_at TEXT NOT NULL CHECK (birth_occurred_at IN ('facility', 'home', 'transit', 'other')),
  facility_id UUID REFERENCES public.facilities(id),
  facility_ward TEXT,
  facility_room TEXT,
  community_province TEXT,
  community_district TEXT,
  community_ward TEXT,
  community_village TEXT,
  birth_geo_lat DECIMAL(10,8),
  birth_geo_lng DECIMAL(11,8),
  
  -- Mother Details
  mother_client_id UUID REFERENCES public.client_registry(id),
  mother_given_names TEXT NOT NULL,
  mother_family_name TEXT NOT NULL,
  mother_maiden_name TEXT,
  mother_date_of_birth DATE,
  mother_age_at_birth INTEGER,
  mother_national_id TEXT,
  mother_passport TEXT,
  mother_marital_status TEXT,
  mother_marriage_date DATE,
  mother_residence_province TEXT,
  mother_residence_district TEXT,
  mother_residence_ward TEXT,
  mother_residence_village TEXT,
  mother_occupation TEXT,
  mother_education_level TEXT,
  
  -- Father Details
  father_client_id UUID REFERENCES public.client_registry(id),
  father_given_names TEXT,
  father_family_name TEXT,
  father_date_of_birth DATE,
  father_national_id TEXT,
  father_passport TEXT,
  father_marital_status TEXT,
  father_residence_province TEXT,
  father_residence_district TEXT,
  father_occupation TEXT,
  father_education_level TEXT,
  father_acknowledged BOOLEAN DEFAULT false,
  
  -- Attendant/Notifier
  birth_attendant_name TEXT,
  birth_attendant_role TEXT,
  birth_attendant_qualification TEXT,
  notifier_user_id UUID,
  notifier_name TEXT NOT NULL,
  notifier_role crvs_notifier_role NOT NULL,
  notifier_contact TEXT,
  notifier_relationship TEXT,
  
  -- Supporting Documents
  documents JSONB DEFAULT '[]',
  
  -- Registration Tracking
  is_late_registration BOOLEAN DEFAULT false,
  late_registration_reason TEXT,
  registration_number TEXT,
  registered_at TIMESTAMPTZ,
  registered_by TEXT,
  
  -- Linked Records
  encounter_id UUID REFERENCES public.encounters(id),
  child_client_id UUID REFERENCES public.client_registry(id),
  visit_id UUID REFERENCES public.visits(id),
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- ===================
-- DEATH NOTIFICATIONS
-- ===================
CREATE TABLE public.death_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_number TEXT UNIQUE NOT NULL,
  source crvs_notification_source NOT NULL DEFAULT 'facility',
  status crvs_notification_status NOT NULL DEFAULT 'draft',
  
  -- Deceased Details
  deceased_client_id UUID REFERENCES public.client_registry(id),
  deceased_given_names TEXT NOT NULL,
  deceased_family_name TEXT NOT NULL,
  deceased_sex TEXT NOT NULL CHECK (deceased_sex IN ('male', 'female')),
  deceased_date_of_birth DATE,
  deceased_age_years INTEGER,
  deceased_age_months INTEGER,
  deceased_age_days INTEGER,
  deceased_national_id TEXT,
  deceased_passport TEXT,
  deceased_health_id TEXT,
  deceased_marital_status TEXT,
  deceased_occupation TEXT,
  deceased_education_level TEXT,
  deceased_nationality TEXT DEFAULT 'Zimbabwean',
  
  -- Residence
  residence_province TEXT,
  residence_district TEXT,
  residence_ward TEXT,
  residence_village TEXT,
  residence_address TEXT,
  
  -- Death Event
  date_of_death DATE NOT NULL,
  time_of_death TIME,
  is_date_estimated BOOLEAN DEFAULT false,
  death_occurred_at TEXT NOT NULL CHECK (death_occurred_at IN ('facility', 'home', 'other')),
  facility_id UUID REFERENCES public.facilities(id),
  facility_ward TEXT,
  community_province TEXT,
  community_district TEXT,
  community_ward TEXT,
  community_village TEXT,
  death_geo_lat DECIMAL(10,8),
  death_geo_lng DECIMAL(11,8),
  
  -- Manner/Circumstances
  manner_of_death crvs_death_manner DEFAULT 'natural',
  circumstances_description TEXT,
  
  -- Cause of Death Method
  cod_method crvs_cod_method DEFAULT 'pending',
  mccd_id UUID,
  verbal_autopsy_id UUID,
  
  -- Informant Details
  informant_name TEXT NOT NULL,
  informant_relationship TEXT NOT NULL,
  informant_contact TEXT,
  informant_national_id TEXT,
  informant_address TEXT,
  
  -- Notifier
  notifier_user_id UUID,
  notifier_name TEXT NOT NULL,
  notifier_role crvs_notifier_role NOT NULL,
  notifier_contact TEXT,
  
  -- Supporting Documents
  documents JSONB DEFAULT '[]',
  traditional_leader_letter BOOLEAN DEFAULT false,
  traditional_leader_name TEXT,
  traditional_leader_village TEXT,
  
  -- Registration Tracking
  is_late_registration BOOLEAN DEFAULT false,
  late_registration_reason TEXT,
  registration_number TEXT,
  registered_at TIMESTAMPTZ,
  registered_by TEXT,
  
  -- Linked Records
  encounter_id UUID REFERENCES public.encounters(id),
  visit_id UUID REFERENCES public.visits(id),
  
  -- Verification (for client-reported deaths)
  requires_verification BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  verification_method TEXT,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Downstream Actions
  client_registry_updated BOOLEAN DEFAULT false,
  billing_notified BOOLEAN DEFAULT false,
  clinical_record_locked BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- ===================
-- MCCD (Medical Certificate of Cause of Death)
-- ===================
CREATE TABLE public.mccd_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  death_notification_id UUID NOT NULL REFERENCES public.death_notifications(id),
  certificate_number TEXT UNIQUE,
  
  -- Certifier
  certifier_id UUID,
  certifier_name TEXT NOT NULL,
  certifier_qualification TEXT NOT NULL,
  certifier_registration_number TEXT,
  certifier_facility_id UUID REFERENCES public.facilities(id),
  certification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- WHO Part I: Disease or condition directly leading to death
  immediate_cause TEXT NOT NULL,
  immediate_cause_icd TEXT,
  immediate_cause_duration TEXT,
  
  antecedent_cause_a TEXT,
  antecedent_cause_a_icd TEXT,
  antecedent_cause_a_duration TEXT,
  
  antecedent_cause_b TEXT,
  antecedent_cause_b_icd TEXT,
  antecedent_cause_b_duration TEXT,
  
  antecedent_cause_c TEXT,
  antecedent_cause_c_icd TEXT,
  antecedent_cause_c_duration TEXT,
  
  -- WHO Part II: Other significant conditions
  contributing_conditions TEXT,
  contributing_conditions_icd TEXT[],
  
  -- Underlying Cause (selected)
  underlying_cause TEXT NOT NULL,
  underlying_cause_icd TEXT NOT NULL,
  
  -- Additional Info
  autopsy_performed BOOLEAN DEFAULT false,
  autopsy_findings_available BOOLEAN DEFAULT false,
  autopsy_findings TEXT,
  
  manner_of_death crvs_death_manner NOT NULL,
  pregnancy_status TEXT,
  pregnancy_contributed BOOLEAN,
  tobacco_use TEXT,
  
  -- Validation
  is_validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMPTZ,
  validated_by UUID,
  validation_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- VERBAL AUTOPSY
-- ===================
CREATE TABLE public.verbal_autopsy_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  death_notification_id UUID NOT NULL REFERENCES public.death_notifications(id),
  va_number TEXT UNIQUE,
  
  -- Status
  status crvs_va_status NOT NULL DEFAULT 'pending',
  
  -- Interviewer
  interviewer_id UUID,
  interviewer_name TEXT NOT NULL,
  interviewer_role TEXT NOT NULL,
  interviewer_training_date DATE,
  interview_date DATE NOT NULL,
  interview_location TEXT,
  
  -- Respondent
  respondent_name TEXT NOT NULL,
  respondent_relationship TEXT NOT NULL,
  respondent_contact TEXT,
  respondent_address TEXT,
  
  -- WHO VA Questionnaire Data (JSONB for flexibility)
  questionnaire_version TEXT DEFAULT 'WHO_2016',
  questionnaire_responses JSONB NOT NULL DEFAULT '{}',
  
  -- Duration indicators
  illness_duration_days INTEGER,
  final_illness_duration_days INTEGER,
  
  -- Key symptom flags (derived)
  had_fever BOOLEAN,
  had_cough BOOLEAN,
  had_difficulty_breathing BOOLEAN,
  had_diarrhea BOOLEAN,
  had_skin_rash BOOLEAN,
  had_injury BOOLEAN,
  had_pregnancy_related BOOLEAN,
  
  -- Algorithm Output
  algorithm_used TEXT,
  algorithm_version TEXT,
  algorithm_run_at TIMESTAMPTZ,
  
  probable_cause_1 TEXT,
  probable_cause_1_icd TEXT,
  probable_cause_1_likelihood DECIMAL(5,4),
  
  probable_cause_2 TEXT,
  probable_cause_2_icd TEXT,
  probable_cause_2_likelihood DECIMAL(5,4),
  
  probable_cause_3 TEXT,
  probable_cause_3_icd TEXT,
  probable_cause_3_likelihood DECIMAL(5,4),
  
  undetermined_flag BOOLEAN DEFAULT false,
  needs_physician_review BOOLEAN DEFAULT false,
  
  -- Physician Review
  physician_reviewer_id UUID,
  physician_review_date DATE,
  physician_final_cause TEXT,
  physician_final_cause_icd TEXT,
  physician_notes TEXT,
  
  -- Final Outcome
  final_cause_of_death TEXT,
  final_cause_icd TEXT,
  final_determination_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- REGISTRAR WORK QUEUE
-- ===================
CREATE TABLE public.crvs_registrar_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type crvs_notification_type NOT NULL,
  notification_id UUID NOT NULL,
  
  queue_status TEXT NOT NULL DEFAULT 'pending' CHECK (queue_status IN ('pending', 'in_review', 'approved', 'rejected', 'requires_info', 'registered')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  
  -- Registration
  registration_number TEXT,
  registration_date DATE,
  
  -- Additional Info Requested
  info_requested TEXT,
  info_requested_at TIMESTAMPTZ,
  info_received_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- CERTIFICATES
-- ===================
CREATE TABLE public.crvs_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type crvs_notification_type NOT NULL,
  notification_id UUID NOT NULL,
  registration_number TEXT NOT NULL,
  
  status crvs_certificate_status NOT NULL DEFAULT 'not_requested',
  
  -- Request
  requested_by UUID,
  requested_at TIMESTAMPTZ,
  requestor_name TEXT,
  requestor_relationship TEXT,
  requestor_contact TEXT,
  
  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Printing
  print_queue_position INTEGER,
  printed_at TIMESTAMPTZ,
  printed_by UUID,
  certificate_number TEXT UNIQUE,
  
  -- Issuance
  issued_at TIMESTAMPTZ,
  issued_by UUID,
  issued_to TEXT,
  
  -- Collection
  collected_at TIMESTAMPTZ,
  collected_by TEXT,
  collection_id_presented TEXT,
  
  -- Amendments
  is_amended BOOLEAN DEFAULT false,
  amendment_reason TEXT,
  amendment_date DATE,
  previous_certificate_id UUID,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- COMMUNITY NOTIFICATIONS (Offline-first queue)
-- ===================
CREATE TABLE public.crvs_community_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_reference_id TEXT NOT NULL,
  device_id TEXT,
  
  notification_type crvs_notification_type NOT NULL,
  notification_data JSONB NOT NULL,
  
  -- Notifier
  notifier_id UUID,
  notifier_name TEXT NOT NULL,
  notifier_role crvs_notifier_role NOT NULL,
  
  -- Geo/Time
  captured_at TIMESTAMPTZ NOT NULL,
  captured_lat DECIMAL(10,8),
  captured_lng DECIMAL(11,8),
  synced_at TIMESTAMPTZ,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  result_notification_id UUID,
  processing_notes TEXT,
  
  -- Validation
  supervisor_approved BOOLEAN,
  supervisor_id UUID,
  supervisor_approved_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- AUDIT LOG
-- ===================
CREATE TABLE public.crvs_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type crvs_notification_type NOT NULL,
  notification_id UUID NOT NULL,
  action TEXT NOT NULL,
  action_data JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- ===================
-- DATA QUALITY FLAGS
-- ===================
CREATE TABLE public.crvs_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type crvs_notification_type NOT NULL,
  notification_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  flag_description TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  auto_detected BOOLEAN DEFAULT true,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX idx_birth_notifications_status ON public.birth_notifications(status);
CREATE INDEX idx_birth_notifications_date ON public.birth_notifications(date_of_birth);
CREATE INDEX idx_birth_notifications_facility ON public.birth_notifications(facility_id);
CREATE INDEX idx_birth_notifications_mother ON public.birth_notifications(mother_client_id);
CREATE INDEX idx_birth_notifications_late ON public.birth_notifications(is_late_registration) WHERE is_late_registration = true;

CREATE INDEX idx_death_notifications_status ON public.death_notifications(status);
CREATE INDEX idx_death_notifications_date ON public.death_notifications(date_of_death);
CREATE INDEX idx_death_notifications_facility ON public.death_notifications(facility_id);
CREATE INDEX idx_death_notifications_deceased ON public.death_notifications(deceased_client_id);
CREATE INDEX idx_death_notifications_verification ON public.death_notifications(requires_verification) WHERE requires_verification = true;

CREATE INDEX idx_mccd_death ON public.mccd_records(death_notification_id);
CREATE INDEX idx_mccd_underlying_icd ON public.mccd_records(underlying_cause_icd);

CREATE INDEX idx_va_death ON public.verbal_autopsy_records(death_notification_id);
CREATE INDEX idx_va_status ON public.verbal_autopsy_records(status);
CREATE INDEX idx_va_needs_review ON public.verbal_autopsy_records(needs_physician_review) WHERE needs_physician_review = true;

CREATE INDEX idx_registrar_queue_status ON public.crvs_registrar_queue(queue_status);
CREATE INDEX idx_registrar_queue_type ON public.crvs_registrar_queue(notification_type);
CREATE INDEX idx_registrar_queue_assigned ON public.crvs_registrar_queue(assigned_to);

CREATE INDEX idx_certificates_status ON public.crvs_certificates(status);
CREATE INDEX idx_certificates_registration ON public.crvs_certificates(registration_number);

CREATE INDEX idx_community_sync ON public.crvs_community_submissions(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_community_processed ON public.crvs_community_submissions(processed) WHERE processed = false;

CREATE INDEX idx_crvs_audit_notification ON public.crvs_audit_log(notification_type, notification_id);

-- ===================
-- FUNCTIONS
-- ===================
CREATE OR REPLACE FUNCTION public.generate_birth_notification_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(notification_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.birth_notifications 
  WHERE notification_number LIKE 'BN-' || date_part || '-%';
  
  new_number := 'BN-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_death_notification_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(notification_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.death_notifications 
  WHERE notification_number LIKE 'DN-' || date_part || '-%';
  
  new_number := 'DN-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.birth_notification_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.notification_number IS NULL OR NEW.notification_number = '' THEN
    NEW.notification_number := generate_birth_notification_number();
  END IF;
  -- Flag late registration (>42 days)
  IF (CURRENT_DATE - NEW.date_of_birth) > 42 THEN
    NEW.is_late_registration := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.death_notification_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.notification_number IS NULL OR NEW.notification_number = '' THEN
    NEW.notification_number := generate_death_notification_number();
  END IF;
  -- Flag late registration (>30 days)
  IF (CURRENT_DATE - NEW.date_of_death) > 30 THEN
    NEW.is_late_registration := true;
  END IF;
  -- Client-reported deaths require verification
  IF NEW.source = 'client_portal' THEN
    NEW.requires_verification := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER birth_notification_before_insert_trigger
  BEFORE INSERT ON public.birth_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.birth_notification_before_insert();

CREATE TRIGGER death_notification_before_insert_trigger
  BEFORE INSERT ON public.death_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.death_notification_before_insert();

-- ===================
-- RLS POLICIES
-- ===================
ALTER TABLE public.birth_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mccd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbal_autopsy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crvs_registrar_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crvs_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crvs_community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crvs_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crvs_quality_flags ENABLE ROW LEVEL SECURITY;

-- Birth Notifications
CREATE POLICY "Authenticated users can view birth notifications"
  ON public.birth_notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create birth notifications"
  ON public.birth_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update birth notifications"
  ON public.birth_notifications FOR UPDATE TO authenticated USING (true);

-- Death Notifications
CREATE POLICY "Authenticated users can view death notifications"
  ON public.death_notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create death notifications"
  ON public.death_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update death notifications"
  ON public.death_notifications FOR UPDATE TO authenticated USING (true);

-- MCCD Records
CREATE POLICY "Authenticated users can view MCCD records"
  ON public.mccd_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create MCCD records"
  ON public.mccd_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update MCCD records"
  ON public.mccd_records FOR UPDATE TO authenticated USING (true);

-- VA Records
CREATE POLICY "Authenticated users can view VA records"
  ON public.verbal_autopsy_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create VA records"
  ON public.verbal_autopsy_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update VA records"
  ON public.verbal_autopsy_records FOR UPDATE TO authenticated USING (true);

-- Registrar Queue
CREATE POLICY "Authenticated users can view registrar queue"
  ON public.crvs_registrar_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage registrar queue"
  ON public.crvs_registrar_queue FOR ALL TO authenticated USING (true);

-- Certificates
CREATE POLICY "Authenticated users can view certificates"
  ON public.crvs_certificates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage certificates"
  ON public.crvs_certificates FOR ALL TO authenticated USING (true);

-- Community Submissions
CREATE POLICY "Authenticated users can view community submissions"
  ON public.crvs_community_submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create community submissions"
  ON public.crvs_community_submissions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update community submissions"
  ON public.crvs_community_submissions FOR UPDATE TO authenticated USING (true);

-- Audit Log
CREATE POLICY "Authenticated users can view audit log"
  ON public.crvs_audit_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create audit entries"
  ON public.crvs_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Quality Flags
CREATE POLICY "Authenticated users can view quality flags"
  ON public.crvs_quality_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage quality flags"
  ON public.crvs_quality_flags FOR ALL TO authenticated USING (true);