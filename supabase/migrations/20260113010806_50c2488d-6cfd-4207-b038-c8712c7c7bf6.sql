
-- ============================================
-- PATIENT CARE TRACKER - COMPLETE SCHEMA
-- ============================================

-- PART 1: ENUMS
CREATE TYPE visit_type AS ENUM (
  'outpatient', 'inpatient', 'emergency', 'day_case', 
  'home_care', 'telehealth', 'programme'
);

CREATE TYPE visit_status AS ENUM (
  'planned', 'active', 'completed', 'cancelled', 'on_hold'
);

CREATE TYPE visit_outcome AS ENUM (
  'discharged_home', 'discharged_care', 'transferred', 'admitted',
  'death', 'lama', 'absconded', 'administrative_closure', 'ongoing'
);

CREATE TYPE clinical_document_type AS ENUM (
  'ips', 'visit_summary', 'discharge_summary', 'ed_summary',
  'transfer_summary', 'referral_summary', 'lab_report', 'imaging_report',
  'procedure_note', 'death_summary', 'lama_summary', 'operative_note',
  'consultation_note', 'progress_note'
);

CREATE TYPE document_status AS ENUM (
  'draft', 'pending_signature', 'final', 'amended', 'superseded', 'entered_in_error'
);

-- PART 2: VISITS TABLE
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  visit_type visit_type NOT NULL DEFAULT 'outpatient',
  status visit_status NOT NULL DEFAULT 'active',
  facility_id UUID REFERENCES public.facilities(id),
  facility_name TEXT,
  programme_code TEXT,
  programme_name TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  expected_discharge_date TIMESTAMPTZ,
  outcome visit_outcome,
  outcome_details TEXT,
  outcome_at TIMESTAMPTZ,
  outcome_by UUID,
  admission_source TEXT,
  admission_reason TEXT,
  ward_id TEXT,
  bed_id TEXT,
  attending_physician_id UUID,
  transferred_from_visit_id UUID REFERENCES public.visits(id),
  transferred_to_visit_id UUID REFERENCES public.visits(id),
  transfer_reason TEXT,
  temporary_identity_id UUID,
  identity_reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary_generated BOOLEAN DEFAULT false,
  meds_reconciled BOOLEAN DEFAULT false,
  pending_results_assigned BOOLEAN DEFAULT false,
  conclusion_signed_by UUID,
  conclusion_signed_at TIMESTAMPTZ
);

-- Link encounters to visits
ALTER TABLE public.encounters 
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES public.visits(id),
ADD COLUMN IF NOT EXISTS encounter_sequence INTEGER DEFAULT 1;

-- Visit number generator
CREATE OR REPLACE FUNCTION public.generate_visit_number()
RETURNS TEXT LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_number TEXT; year_part TEXT; seq_num INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(visit_number FROM 10) AS INTEGER)), 0) + 1 
  INTO seq_num FROM public.visits WHERE visit_number LIKE 'VIS-' || year_part || '-%';
  new_number := 'VIS-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END; $$;

CREATE OR REPLACE FUNCTION public.visit_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.visit_number IS NULL OR NEW.visit_number = '' THEN
    NEW.visit_number := public.generate_visit_number();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER visit_before_insert_trigger
BEFORE INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION public.visit_before_insert();

CREATE TRIGGER update_visits_updated_at
BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PART 3: CLINICAL DOCUMENTS
CREATE TABLE public.clinical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number TEXT NOT NULL UNIQUE,
  document_type clinical_document_type NOT NULL,
  document_subtype TEXT,
  loinc_code TEXT,
  loinc_display TEXT,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  encounter_id UUID REFERENCES public.encounters(id),
  title TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES public.clinical_documents(id),
  content_json JSONB,
  content_fhir JSONB,
  html_content TEXT,
  patient_friendly_html TEXT,
  pdf_path TEXT,
  patient_friendly_pdf_path TEXT,
  authoring_facility_id UUID REFERENCES public.facilities(id),
  authoring_facility_name TEXT,
  author_id UUID,
  author_name TEXT,
  author_role TEXT,
  signed_by UUID,
  signed_by_name TEXT,
  signed_at TIMESTAMPTZ,
  signature_hash TEXT,
  co_signers JSONB DEFAULT '[]'::JSONB,
  amendment_reason TEXT,
  amended_sections TEXT[],
  share_token TEXT,
  share_token_expires_at TIMESTAMPTZ,
  access_restrictions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TEXT LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_number TEXT; date_part TEXT; seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num FROM public.clinical_documents WHERE document_number LIKE 'DOC-' || date_part || '-%';
  new_number := 'DOC-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END; $$;

CREATE OR REPLACE FUNCTION public.clinical_document_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := public.generate_document_number();
  END IF;
  IF NEW.loinc_code IS NULL THEN
    CASE NEW.document_type
      WHEN 'discharge_summary' THEN NEW.loinc_code := '18842-5'; NEW.loinc_display := 'Discharge Summary';
      WHEN 'ips' THEN NEW.loinc_code := '60591-5'; NEW.loinc_display := 'Patient Summary';
      WHEN 'transfer_summary' THEN NEW.loinc_code := '18761-7'; NEW.loinc_display := 'Transfer Summary';
      WHEN 'ed_summary' THEN NEW.loinc_code := '34878-9'; NEW.loinc_display := 'Emergency Department Note';
      WHEN 'procedure_note' THEN NEW.loinc_code := '28570-0'; NEW.loinc_display := 'Procedure Note';
      WHEN 'lab_report' THEN NEW.loinc_code := '11502-2'; NEW.loinc_display := 'Laboratory Report';
      WHEN 'imaging_report' THEN NEW.loinc_code := '18748-4'; NEW.loinc_display := 'Diagnostic Imaging Report';
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER clinical_document_before_insert_trigger
BEFORE INSERT ON public.clinical_documents FOR EACH ROW EXECUTE FUNCTION public.clinical_document_before_insert();

CREATE TRIGGER update_clinical_documents_updated_at
BEFORE UPDATE ON public.clinical_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Document References
CREATE TABLE public.document_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  encounter_id UUID REFERENCES public.encounters(id),
  document_type clinical_document_type NOT NULL,
  document_date TIMESTAMPTZ NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  facility_name TEXT,
  title TEXT NOT NULL,
  status document_status NOT NULL,
  author_name TEXT,
  searchable_text TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PART 4: SUMMARY TABLES
CREATE TABLE public.discharge_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  admission_date TIMESTAMPTZ NOT NULL,
  discharge_date TIMESTAMPTZ NOT NULL,
  facility_name TEXT,
  ward_name TEXT,
  primary_diagnosis TEXT,
  primary_diagnosis_code TEXT,
  secondary_diagnoses JSONB DEFAULT '[]'::JSONB,
  hospital_course_narrative TEXT,
  significant_procedures JSONB DEFAULT '[]'::JSONB,
  discharge_medications JSONB DEFAULT '[]'::JSONB,
  medications_stopped JSONB DEFAULT '[]'::JSONB,
  medications_changed JSONB DEFAULT '[]'::JSONB,
  medication_reconciliation_by UUID,
  medication_reconciliation_at TIMESTAMPTZ,
  allergies JSONB DEFAULT '[]'::JSONB,
  key_lab_results JSONB DEFAULT '[]'::JSONB,
  key_imaging_results JSONB DEFAULT '[]'::JSONB,
  pending_results JSONB DEFAULT '[]'::JSONB,
  pending_results_reviewer UUID,
  pending_results_followup_plan TEXT,
  follow_up_appointments JSONB DEFAULT '[]'::JSONB,
  referrals JSONB DEFAULT '[]'::JSONB,
  patient_instructions TEXT,
  warning_signs TEXT,
  condition_at_discharge TEXT,
  functional_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  transfer_reason TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'routine',
  destination_facility_id UUID REFERENCES public.facilities(id),
  destination_facility_name TEXT,
  destination_department TEXT,
  accepting_provider TEXT,
  ips_document_id UUID REFERENCES public.clinical_documents(id),
  visit_summary_document_id UUID REFERENCES public.clinical_documents(id),
  current_medications JSONB DEFAULT '[]'::JSONB,
  allergies JSONB DEFAULT '[]'::JSONB,
  active_problems JSONB DEFAULT '[]'::JSONB,
  recent_results JSONB DEFAULT '[]'::JSONB,
  recent_imaging JSONB DEFAULT '[]'::JSONB,
  handover_notes TEXT,
  pending_investigations TEXT,
  critical_information TEXT,
  acceptance_status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT,
  arrival_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ed_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  triage_category TEXT,
  triage_time TIMESTAMPTZ,
  presenting_complaint TEXT,
  interventions JSONB DEFAULT '[]'::JSONB,
  key_results JSONB DEFAULT '[]'::JSONB,
  imaging_performed JSONB DEFAULT '[]'::JSONB,
  disposition TEXT NOT NULL,
  disposition_time TIMESTAMPTZ,
  disposition_notes TEXT,
  admitting_service TEXT,
  admitting_ward TEXT,
  discharge_instructions TEXT,
  follow_up_plan TEXT,
  handover_to TEXT,
  handover_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.procedure_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  procedure_name TEXT NOT NULL,
  procedure_code TEXT,
  procedure_code_system TEXT,
  procedure_type TEXT,
  procedure_date TIMESTAMPTZ NOT NULL,
  procedure_duration_minutes INTEGER,
  indication TEXT,
  pre_procedure_diagnosis TEXT,
  procedure_description TEXT,
  technique_used TEXT,
  findings TEXT,
  complications TEXT,
  complication_details JSONB,
  post_procedure_diagnosis TEXT,
  post_procedure_plan TEXT,
  specimens_collected JSONB DEFAULT '[]'::JSONB,
  primary_surgeon_id UUID,
  primary_surgeon_name TEXT,
  assistants JSONB DEFAULT '[]'::JSONB,
  anesthesia_type TEXT,
  anesthesiologist_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.death_outcome_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  death_datetime TIMESTAMPTZ NOT NULL,
  death_location TEXT,
  certifying_clinician_id UUID,
  certifying_clinician_name TEXT,
  certification_datetime TIMESTAMPTZ,
  immediate_cause TEXT,
  underlying_cause TEXT,
  cause_category_code TEXT,
  cause_category_display TEXT,
  autopsy_requested BOOLEAN DEFAULT false,
  autopsy_notes TEXT,
  family_notified BOOLEAN DEFAULT false,
  family_notified_at TIMESTAMPTZ,
  family_notified_by TEXT,
  death_certificate_task_id UUID,
  notification_tasks JSONB DEFAULT '[]'::JSONB,
  access_restricted BOOLEAN DEFAULT true,
  authorized_viewers UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.non_standard_closure_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  closure_type TEXT NOT NULL,
  closure_reason TEXT,
  counseling_offered BOOLEAN DEFAULT false,
  counseling_notes TEXT,
  risks_explained BOOLEAN DEFAULT false,
  follow_up_options_provided TEXT,
  tracing_task_created BOOLEAN DEFAULT false,
  tracing_task_id UUID,
  programme_follow_up_required BOOLEAN DEFAULT false,
  programme_code TEXT,
  witnessed_by TEXT,
  patient_signature_captured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PART 5: PATIENT CARE STATE & ACCESS LOG
CREATE TABLE public.patient_care_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  encounter_id UUID REFERENCES public.encounters(id),
  current_workspace_id UUID REFERENCES public.workspaces(id),
  current_workspace_name TEXT,
  current_service_point TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  care_state TEXT NOT NULL DEFAULT 'waiting',
  state_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responsible_team TEXT,
  responsible_provider_id UUID,
  responsible_provider_name TEXT,
  next_expected_action TEXT,
  next_action_due_at TIMESTAMPTZ,
  action_overdue BOOLEAN DEFAULT false,
  has_stalled_flow BOOLEAN DEFAULT false,
  stall_reason TEXT,
  escalation_needed BOOLEAN DEFAULT false,
  alerts JSONB DEFAULT '[]'::JSONB,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, visit_id)
);

CREATE TABLE public.document_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_documents(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  accessed_by UUID,
  accessed_by_name TEXT,
  access_type TEXT NOT NULL,
  access_via TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  share_token_used TEXT,
  access_granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PART 6: OPERATIONS VIEW
CREATE OR REPLACE VIEW public.facility_operations_dashboard AS
SELECT 
  f.id as facility_id,
  f.name as facility_name,
  (SELECT COUNT(*) FROM public.sorting_sessions ss WHERE ss.facility_id = f.id AND DATE(ss.arrival_time) = CURRENT_DATE) as arrivals_today,
  (SELECT COUNT(*) FROM public.sorting_sessions ss WHERE ss.facility_id = f.id AND ss.status = 'in_progress') as sorting_pending,
  (SELECT COUNT(*) FROM public.queue_items qi JOIN public.queue_definitions qd ON qi.queue_id = qd.id WHERE qd.facility_id = f.id AND qi.status = 'waiting' AND qi.arrival_date = CURRENT_DATE) as queue_backlog,
  (SELECT COUNT(*) FROM public.patient_care_state pcs WHERE pcs.facility_id = f.id AND pcs.care_state = 'pending_results') as investigations_pending,
  (SELECT COUNT(*) FROM public.patient_care_state pcs WHERE pcs.facility_id = f.id AND pcs.care_state = 'ready_discharge') as ready_for_discharge,
  (SELECT COUNT(*) FROM public.patient_care_state pcs WHERE pcs.facility_id = f.id AND pcs.care_state = 'transfer_pending') as transfers_pending,
  (SELECT COUNT(*) FROM public.patient_care_state pcs WHERE pcs.facility_id = f.id AND pcs.has_stalled_flow = true) as stalled_flows
FROM public.facilities f WHERE f.is_active = true;

-- PART 7: RLS POLICIES
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_outcome_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_standard_closure_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_care_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_select" ON public.visits FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "visits_insert" ON public.visits FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "visits_update" ON public.visits FOR UPDATE USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "docs_select" ON public.clinical_documents FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "docs_insert" ON public.clinical_documents FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "docs_update" ON public.clinical_documents FOR UPDATE USING ((author_id = auth.uid() AND status = 'draft') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "docrefs_select" ON public.document_references FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "docrefs_insert" ON public.document_references FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "discharge_select" ON public.discharge_summaries FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "discharge_insert" ON public.discharge_summaries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "transfer_select" ON public.transfer_summaries FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "transfer_insert" ON public.transfer_summaries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ed_select" ON public.ed_summaries FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ed_insert" ON public.ed_summaries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "proc_select" ON public.procedure_notes FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proc_insert" ON public.procedure_notes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "death_select" ON public.death_outcome_summaries FOR SELECT USING (auth.uid() = ANY(authorized_viewers) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "death_insert" ON public.death_outcome_summaries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "closure_select" ON public.non_standard_closure_summaries FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "closure_insert" ON public.non_standard_closure_summaries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "accesslog_select" ON public.document_access_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "accesslog_insert" ON public.document_access_log FOR INSERT WITH CHECK (true);

CREATE POLICY "carestate_select" ON public.patient_care_state FOR SELECT USING (public.can_access_patient(auth.uid(), patient_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "carestate_all" ON public.patient_care_state FOR ALL USING (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

-- PART 8: INDEXES
CREATE INDEX idx_visits_patient ON public.visits(patient_id);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_facility ON public.visits(facility_id);
CREATE INDEX idx_visits_date ON public.visits(start_date DESC);
CREATE INDEX idx_docs_patient ON public.clinical_documents(patient_id);
CREATE INDEX idx_docs_visit ON public.clinical_documents(visit_id);
CREATE INDEX idx_docs_type ON public.clinical_documents(document_type);
CREATE INDEX idx_docs_status ON public.clinical_documents(status);
CREATE INDEX idx_docrefs_patient ON public.document_references(patient_id);
CREATE INDEX idx_docrefs_visit ON public.document_references(visit_id);
CREATE INDEX idx_docrefs_type ON public.document_references(document_type);
CREATE INDEX idx_carestate_patient ON public.patient_care_state(patient_id);
CREATE INDEX idx_carestate_facility ON public.patient_care_state(facility_id);
CREATE INDEX idx_carestate_state ON public.patient_care_state(care_state);
CREATE INDEX idx_encounters_visit ON public.encounters(visit_id);
