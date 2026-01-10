-- Patient Summary (IPS) and Visit Summary tables

-- IPS (International Patient Summary) table
CREATE TABLE public.patient_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  health_id TEXT,
  summary_type TEXT NOT NULL DEFAULT 'ips' CHECK (summary_type IN ('ips', 'emergency', 'referral')),
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'superseded', 'entered-in-error')),
  
  -- FHIR Bundle reference
  fhir_bundle JSONB,
  fhir_composition_id TEXT,
  
  -- Content sections (denormalized for quick access)
  allergies JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  immunizations JSONB DEFAULT '[]',
  procedures JSONB DEFAULT '[]',
  diagnostic_results JSONB DEFAULT '[]',
  imaging_summary JSONB DEFAULT '[]',
  vital_signs JSONB DEFAULT '[]',
  care_plans JSONB DEFAULT '[]',
  social_history JSONB,
  pregnancy_status JSONB,
  devices JSONB DEFAULT '[]',
  advance_directives JSONB,
  
  -- Provenance
  source_systems TEXT[] DEFAULT '{}',
  authoring_organization TEXT,
  generation_trigger TEXT CHECK (generation_trigger IN ('on_demand', 'referral', 'transfer', 'emergency', 'discharge', 'scheduled')),
  data_recency_notes JSONB,
  
  -- Access control
  consent_reference TEXT,
  redaction_applied BOOLEAN DEFAULT false,
  redacted_sections TEXT[] DEFAULT '{}',
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'emergency', 'redacted')),
  
  -- Sharing
  share_token TEXT UNIQUE,
  share_token_expires_at TIMESTAMPTZ,
  qr_code_data TEXT,
  
  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visit Summary table
CREATE TABLE public.visit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.encounters(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  
  -- Status and versioning
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'amended', 'entered-in-error')),
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES public.visit_summaries(id),
  amendment_reason TEXT,
  
  -- Administrative section
  facility_id UUID REFERENCES public.facilities(id),
  facility_name TEXT,
  service_point TEXT,
  visit_type TEXT,
  visit_start TIMESTAMPTZ,
  visit_end TIMESTAMPTZ,
  attending_providers JSONB DEFAULT '[]',
  
  -- Clinical section
  presenting_complaint TEXT,
  chief_complaint_coded JSONB,
  key_findings TEXT,
  diagnoses JSONB DEFAULT '[]',
  procedures_performed JSONB DEFAULT '[]',
  medications_prescribed JSONB DEFAULT '[]',
  medications_changed JSONB DEFAULT '[]',
  investigations_ordered JSONB DEFAULT '[]',
  investigations_pending JSONB DEFAULT '[]',
  imaging_performed JSONB DEFAULT '[]',
  allergies_verified JSONB DEFAULT '[]',
  
  -- Disposition section
  disposition TEXT CHECK (disposition IN ('discharged', 'admitted', 'referred', 'transferred', 'left_ama', 'deceased', 'other')),
  disposition_details TEXT,
  follow_up_plan TEXT,
  follow_up_appointments JSONB DEFAULT '[]',
  return_precautions TEXT,
  referrals_made JSONB DEFAULT '[]',
  
  -- Attachments and references
  encounter_note_link TEXT,
  lab_results_link TEXT,
  imaging_link TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Renderings
  provider_summary_html TEXT,
  patient_summary_html TEXT,
  provider_summary_pdf_path TEXT,
  patient_summary_pdf_path TEXT,
  
  -- FHIR integration
  fhir_composition JSONB,
  fhir_document_reference TEXT,
  shr_bundle_id UUID REFERENCES public.shr_bundles(id),
  
  -- Signing
  signed_by UUID,
  signed_at TIMESTAMPTZ,
  co_signers JSONB DEFAULT '[]',
  
  -- Sharing
  share_token TEXT UNIQUE,
  share_token_expires_at TIMESTAMPTZ,
  qr_code_data TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

-- Summary access audit log
CREATE TABLE public.summary_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_type TEXT NOT NULL CHECK (summary_type IN ('ips', 'visit')),
  summary_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  
  -- Access details
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'print', 'generate', 'qr_scan')),
  accessed_by UUID,
  accessed_by_role TEXT,
  accessed_via TEXT CHECK (accessed_via IN ('ehr', 'portal', 'api', 'share_link', 'qr_code', 'emergency')),
  
  -- Context
  purpose_of_use TEXT,
  justification TEXT,
  is_break_glass BOOLEAN DEFAULT false,
  
  -- Share details
  share_recipient TEXT,
  share_expires_at TIMESTAMPTZ,
  
  -- Technical
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share tokens for secure sharing
CREATE TABLE public.summary_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('ips', 'visit')),
  summary_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  
  -- Sharing configuration
  created_by UUID NOT NULL,
  created_by_role TEXT,
  recipient_type TEXT CHECK (recipient_type IN ('provider', 'facility', 'patient', 'caregiver', 'public_link')),
  recipient_identifier TEXT,
  
  -- Access control
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'redacted', 'patient_friendly')),
  allowed_actions TEXT[] DEFAULT '{view}',
  max_access_count INTEGER,
  current_access_count INTEGER DEFAULT 0,
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,
  
  -- QR code
  qr_code_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_patient_summaries_patient ON public.patient_summaries(patient_id);
CREATE INDEX idx_patient_summaries_status ON public.patient_summaries(status) WHERE status = 'current';
CREATE INDEX idx_patient_summaries_share_token ON public.patient_summaries(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX idx_visit_summaries_encounter ON public.visit_summaries(encounter_id);
CREATE INDEX idx_visit_summaries_patient ON public.visit_summaries(patient_id);
CREATE INDEX idx_visit_summaries_status ON public.visit_summaries(status);
CREATE INDEX idx_visit_summaries_share_token ON public.visit_summaries(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX idx_summary_access_log_patient ON public.summary_access_log(patient_id);
CREATE INDEX idx_summary_access_log_summary ON public.summary_access_log(summary_type, summary_id);

CREATE INDEX idx_summary_share_tokens_token ON public.summary_share_tokens(token);
CREATE INDEX idx_summary_share_tokens_expires ON public.summary_share_tokens(expires_at) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE public.patient_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_share_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_summaries
CREATE POLICY "Providers can view patient summaries for their patients"
  ON public.patient_summaries FOR SELECT
  USING (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Providers can generate patient summaries"
  ON public.patient_summaries FOR INSERT
  WITH CHECK (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Providers can update patient summaries"
  ON public.patient_summaries FOR UPDATE
  USING (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for visit_summaries
CREATE POLICY "Providers can view visit summaries for their patients"
  ON public.visit_summaries FOR SELECT
  USING (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Providers can create visit summaries"
  ON public.visit_summaries FOR INSERT
  WITH CHECK (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Providers can update visit summaries"
  ON public.visit_summaries FOR UPDATE
  USING (
    (public.can_access_patient(auth.uid(), patient_id) AND status != 'final')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for summary_access_log
CREATE POLICY "Admins can view all access logs"
  ON public.summary_access_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert access logs"
  ON public.summary_access_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for share tokens
CREATE POLICY "Users can view their created tokens"
  ON public.summary_share_tokens FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create share tokens for accessible patients"
  ON public.summary_share_tokens FOR INSERT
  WITH CHECK (
    public.can_access_patient(auth.uid(), patient_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can revoke their tokens"
  ON public.summary_share_tokens FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Function to generate share token
CREATE OR REPLACE FUNCTION public.generate_summary_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate a secure random token
  new_token := encode(gen_random_bytes(32), 'base64');
  -- Make URL-safe
  new_token := replace(replace(new_token, '+', '-'), '/', '_');
  new_token := rtrim(new_token, '=');
  RETURN new_token;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_patient_summaries_updated_at
  BEFORE UPDATE ON public.patient_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_summaries_updated_at
  BEFORE UPDATE ON public.visit_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();