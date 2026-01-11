-- ============================================
-- TELEMEDICINE SYSTEM - ADDITIONAL SCHEMA
-- Trust Layer, Roles, and Response Tracking
-- ============================================

-- 1. Telemedicine Roles Enum and Table
CREATE TYPE public.telemedicine_role AS ENUM (
  'telemedicine_admin',
  'system_admin',
  'technician',
  'clinician',
  'specialist',
  'manager'
);

-- Telemedicine-specific user roles
CREATE TABLE public.telemedicine_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role telemedicine_role NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role, facility_id)
);

-- Enable RLS
ALTER TABLE public.telemedicine_user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check telemedicine role
CREATE OR REPLACE FUNCTION public.has_telemedicine_role(_user_id UUID, _role telemedicine_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.telemedicine_user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- RLS policies for telemedicine roles
CREATE POLICY "Users can view their own telemedicine roles"
ON public.telemedicine_user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Telemedicine admins can manage roles"
ON public.telemedicine_user_roles FOR ALL
TO authenticated
USING (
  public.has_telemedicine_role(auth.uid(), 'telemedicine_admin') OR
  public.has_telemedicine_role(auth.uid(), 'system_admin') OR
  public.has_role(auth.uid(), 'admin')
);

-- 2. Trust Layer - Session Tokens for Secure EHR Access
CREATE TYPE public.ehr_access_scope AS ENUM (
  'read_summary',
  'read_full',
  'read_write',
  'orders_only',
  'notes_only'
);

CREATE TABLE public.teleconsult_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES public.referrals(id),
  
  -- Token details
  token_hash TEXT NOT NULL UNIQUE,
  scope ehr_access_scope NOT NULL DEFAULT 'read_summary',
  
  -- Access control
  granted_by_provider_id UUID NOT NULL,
  granted_to_provider_id UUID NOT NULL,
  
  -- Consent reference
  consent_type TEXT NOT NULL CHECK (consent_type IN ('verbal', 'written', 'digital', 'emergency')),
  consent_timestamp TIMESTAMPTZ NOT NULL,
  consent_reference TEXT,
  
  -- Time bounds
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Usage tracking
  times_accessed INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT 10,
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teleconsult_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_access_tokens_session_id ON public.teleconsult_access_tokens(session_id);
CREATE INDEX idx_access_tokens_patient_id ON public.teleconsult_access_tokens(patient_id);
CREATE INDEX idx_access_tokens_granted_to ON public.teleconsult_access_tokens(granted_to_provider_id);

-- RLS policies
CREATE POLICY "Token grantors can manage their tokens"
ON public.teleconsult_access_tokens FOR ALL
TO authenticated
USING (granted_by_provider_id = auth.uid());

CREATE POLICY "Token recipients can view their tokens"
ON public.teleconsult_access_tokens FOR SELECT
TO authenticated
USING (granted_to_provider_id = auth.uid() AND is_active = true);

-- 3. Teleconsult Access Audit Log
CREATE TABLE public.teleconsult_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  token_id UUID REFERENCES public.teleconsult_access_tokens(id),
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  referral_id UUID REFERENCES public.referrals(id),
  
  -- Access details
  accessor_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  resource_accessed TEXT NOT NULL,
  
  -- Actions taken (auto-captured for response)
  actions_performed JSONB DEFAULT '[]'::JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teleconsult_access_log ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_access_log_session_id ON public.teleconsult_access_log(session_id);
CREATE INDEX idx_access_log_patient_id ON public.teleconsult_access_log(patient_id);
CREATE INDEX idx_access_log_accessor_id ON public.teleconsult_access_log(accessor_id);

-- RLS policies
CREATE POLICY "Admins and involved providers can view access logs"
ON public.teleconsult_access_log FOR SELECT
TO authenticated
USING (
  accessor_id = auth.uid() OR
  public.has_telemedicine_role(auth.uid(), 'telemedicine_admin') OR
  public.has_telemedicine_role(auth.uid(), 'system_admin') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert access logs"
ON public.teleconsult_access_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Consultation Responses Table (persistent storage)
CREATE TABLE public.teleconsult_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  referral_id UUID REFERENCES public.referrals(id),
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  
  -- Consulting provider
  consultant_provider_id UUID NOT NULL,
  consultant_facility_id UUID REFERENCES public.facilities(id),
  
  -- Mode used
  mode_used TEXT NOT NULL,
  
  -- Clinical response
  assessment TEXT,
  clinical_interpretation TEXT,
  working_diagnosis TEXT,
  diagnosis_codes JSONB DEFAULT '[]'::JSONB,
  response_to_questions TEXT,
  key_findings TEXT,
  impressions TEXT,
  
  -- Plan
  treatment_plan TEXT,
  medications JSONB DEFAULT '[]'::JSONB,
  investigations JSONB DEFAULT '[]'::JSONB,
  procedures JSONB DEFAULT '[]'::JSONB,
  monitoring_requirements TEXT,
  
  -- Disposition
  disposition_type TEXT NOT NULL,
  disposition_instructions TEXT,
  transfer_facility_id UUID REFERENCES public.facilities(id),
  
  -- Follow-up
  follow_up_type TEXT,
  follow_up_when TEXT,
  follow_up_instructions TEXT,
  follow_up_responsible_facility TEXT,
  
  -- Orders placed (references to actual orders)
  orders_placed JSONB DEFAULT '[]'::JSONB,
  
  -- Documentation
  session_duration_seconds INTEGER,
  attachments_used JSONB DEFAULT '[]'::JSONB,
  board_participants JSONB DEFAULT '[]'::JSONB,
  
  -- EHR actions taken during consultation (auto-captured)
  ehr_actions JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'integrated')),
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teleconsult_responses ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_responses_session_id ON public.teleconsult_responses(session_id);
CREATE INDEX idx_responses_patient_id ON public.teleconsult_responses(patient_id);
CREATE INDEX idx_responses_referral_id ON public.teleconsult_responses(referral_id);
CREATE INDEX idx_responses_consultant ON public.teleconsult_responses(consultant_provider_id);

-- RLS policies
CREATE POLICY "Involved providers can view responses"
ON public.teleconsult_responses FOR SELECT
TO authenticated
USING (
  consultant_provider_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.id = referral_id
    AND (r.requested_by = auth.uid() OR r.to_provider_id = auth.uid() OR r.accepted_by = auth.uid())
  ) OR
  public.has_telemedicine_role(auth.uid(), 'telemedicine_admin')
);

CREATE POLICY "Consultants can create responses"
ON public.teleconsult_responses FOR INSERT
TO authenticated
WITH CHECK (consultant_provider_id = auth.uid());

CREATE POLICY "Consultants can update their draft responses"
ON public.teleconsult_responses FOR UPDATE
TO authenticated
USING (consultant_provider_id = auth.uid() AND status = 'draft');

-- 5. Add columns to teleconsult_sessions for enhanced workflow
ALTER TABLE public.teleconsult_sessions 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id),
ADD COLUMN IF NOT EXISTS patient_hid TEXT,
ADD COLUMN IF NOT EXISTS referring_provider_id UUID,
ADD COLUMN IF NOT EXISTS referring_facility_id UUID REFERENCES public.facilities(id),
ADD COLUMN IF NOT EXISTS consulting_provider_id UUID,
ADD COLUMN IF NOT EXISTS consulting_facility_id UUID REFERENCES public.facilities(id),
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'async',
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'routine',
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS reason_for_consult TEXT,
ADD COLUMN IF NOT EXISTS clinical_questions JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS routed_to_provider_id UUID,
ADD COLUMN IF NOT EXISTS routed_to_facility_id UUID REFERENCES public.facilities(id),
ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS routing_reason TEXT,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS response_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 6. Function to validate and use access token
CREATE OR REPLACE FUNCTION public.validate_teleconsult_access_token(
  _token_hash TEXT,
  _accessor_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  patient_id UUID,
  session_id UUID,
  scope ehr_access_scope,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token RECORD;
BEGIN
  SELECT * INTO _token
  FROM public.teleconsult_access_tokens
  WHERE token_hash = _token_hash;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::UUID, NULL::ehr_access_scope, 'Token not found'::TEXT;
    RETURN;
  END IF;
  
  IF NOT _token.is_active THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::UUID, NULL::ehr_access_scope, 'Token has been revoked'::TEXT;
    RETURN;
  END IF;
  
  IF _token.granted_to_provider_id != _accessor_id THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::UUID, NULL::ehr_access_scope, 'Token not authorized for this user'::TEXT;
    RETURN;
  END IF;
  
  IF now() < _token.valid_from OR now() > _token.valid_until THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::UUID, NULL::ehr_access_scope, 'Token has expired'::TEXT;
    RETURN;
  END IF;
  
  IF _token.times_accessed >= _token.max_access_count THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::UUID, NULL::ehr_access_scope, 'Token access limit exceeded'::TEXT;
    RETURN;
  END IF;
  
  -- Update access count
  UPDATE public.teleconsult_access_tokens
  SET times_accessed = times_accessed + 1,
      last_accessed_at = now()
  WHERE id = _token.id;
  
  RETURN QUERY SELECT true::BOOLEAN, _token.patient_id, _token.session_id, _token.scope, NULL::TEXT;
END;
$$;

-- 7. Function to generate access token
CREATE OR REPLACE FUNCTION public.generate_teleconsult_access_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(gen_random_bytes(32), 'base64');
  new_token := replace(replace(new_token, '+', '-'), '/', '_');
  new_token := rtrim(new_token, '=');
  RETURN new_token;
END;
$$;

-- 8. Triggers for updated_at
CREATE TRIGGER update_telemedicine_user_roles_updated_at
BEFORE UPDATE ON public.telemedicine_user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teleconsult_responses_updated_at
BEFORE UPDATE ON public.teleconsult_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsult_responses;