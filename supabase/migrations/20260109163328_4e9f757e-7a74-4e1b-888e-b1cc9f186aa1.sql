-- Create enum for provider lifecycle states
CREATE TYPE provider_lifecycle_state AS ENUM (
  'draft',
  'pending_council_verification',
  'pending_facility_affiliation',
  'active',
  'suspended',
  'revoked',
  'retired',
  'deceased'
);

-- Create enum for license status
CREATE TYPE license_status AS ENUM (
  'active',
  'suspended',
  'revoked',
  'expired',
  'pending_renewal'
);

-- Create enum for employment type
CREATE TYPE employment_type AS ENUM (
  'permanent',
  'contract',
  'locum',
  'volunteer',
  'intern',
  'student'
);

-- Create privilege taxonomy table
CREATE TABLE public.provider_privileges_taxonomy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  requires_supervision BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed privilege taxonomy
INSERT INTO public.provider_privileges_taxonomy (code, name, description, category) VALUES
('prescribe_medication', 'Prescribe Medication', 'Authority to prescribe pharmaceutical medications', 'clinical'),
('dispense_medication', 'Dispense Medication', 'Authority to dispense medications to patients', 'pharmacy'),
('order_laboratory', 'Order Laboratory Tests', 'Authority to order diagnostic laboratory tests', 'diagnostics'),
('order_imaging', 'Order Imaging Studies', 'Authority to order X-rays, CT, MRI, ultrasound', 'diagnostics'),
('perform_surgery', 'Perform Surgery', 'Authority to perform surgical procedures', 'surgical'),
('perform_minor_procedure', 'Perform Minor Procedures', 'Authority to perform minor clinical procedures', 'clinical'),
('administer_anesthesia', 'Administer Anesthesia', 'Authority to administer anesthesia', 'anesthesia'),
('sign_discharge', 'Sign Discharge Summaries', 'Authority to sign patient discharge documents', 'documentation'),
('access_sensitive_data', 'Access Sensitive Patient Data', 'Authority to access restricted patient information', 'access'),
('certify_death', 'Certify Death', 'Authority to sign death certificates', 'legal'),
('issue_sick_leave', 'Issue Sick Leave Certificates', 'Authority to issue work absence certificates', 'legal'),
('supervise_trainee', 'Supervise Trainees', 'Authority to supervise students and interns', 'education'),
('perform_blood_transfusion', 'Perform Blood Transfusion', 'Authority to order and administer blood products', 'clinical'),
('administer_chemotherapy', 'Administer Chemotherapy', 'Authority to prescribe and administer chemotherapy', 'oncology'),
('perform_dialysis', 'Perform Dialysis', 'Authority to order and manage dialysis treatment', 'nephrology');

-- Create health providers table (HPR core)
CREATE TABLE public.health_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upid TEXT NOT NULL UNIQUE,
  
  -- Core identity fields (HPR-FR-002)
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  other_names TEXT,
  date_of_birth DATE NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  national_id TEXT,
  passport_number TEXT,
  
  -- Optional identity fields
  photograph_url TEXT,
  email TEXT,
  phone TEXT,
  nationality TEXT DEFAULT 'ZW',
  
  -- Professional attributes
  cadre TEXT NOT NULL,
  specialty TEXT,
  sub_specialty TEXT,
  qualifications JSONB DEFAULT '[]',
  languages TEXT[] DEFAULT ARRAY['en'],
  
  -- Lifecycle state (HPR-FR-010)
  lifecycle_state provider_lifecycle_state NOT NULL DEFAULT 'draft',
  lifecycle_state_reason TEXT,
  lifecycle_state_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lifecycle_state_changed_by UUID,
  
  -- User linkage (for IdP - IDP-FR-010)
  user_id UUID UNIQUE,
  user_linked_at TIMESTAMP WITH TIME ZONE,
  user_link_verified_by UUID,
  user_link_verification_method TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- De-duplication tracking
  is_master_record BOOLEAN DEFAULT true,
  merged_into_upid TEXT,
  merged_at TIMESTAMP WITH TIME ZONE,
  merge_reason TEXT
);

-- Create index for UPID lookups
CREATE INDEX idx_health_providers_upid ON public.health_providers(upid);
CREATE INDEX idx_health_providers_lifecycle ON public.health_providers(lifecycle_state);
CREATE INDEX idx_health_providers_cadre ON public.health_providers(cadre);
CREATE INDEX idx_health_providers_national_id ON public.health_providers(national_id);
CREATE INDEX idx_health_providers_user_id ON public.health_providers(user_id);

-- Create provider licenses table (HPR-FR-020)
CREATE TABLE public.provider_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- License identifiers
  council_id TEXT NOT NULL,
  council_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  license_category TEXT NOT NULL,
  
  -- Status
  status license_status NOT NULL DEFAULT 'active',
  status_reason TEXT,
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status_changed_by UUID,
  
  -- Dates
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_verified_by UUID,
  
  -- Source system
  source_system TEXT,
  source_reference TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(council_id, registration_number)
);

CREATE INDEX idx_provider_licenses_provider ON public.provider_licenses(provider_id);
CREATE INDEX idx_provider_licenses_status ON public.provider_licenses(status);
CREATE INDEX idx_provider_licenses_expiry ON public.provider_licenses(expiry_date);
CREATE INDEX idx_provider_licenses_council ON public.provider_licenses(council_id, registration_number);

-- Create provider affiliations table (HPR-FR-030)
CREATE TABLE public.provider_affiliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  
  -- Employment details
  employment_type employment_type NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  position_title TEXT,
  
  -- Privileges (facility-scoped, role-dependent, time-bounded)
  privileges TEXT[] NOT NULL DEFAULT '{}',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID,
  deactivation_reason TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_affiliations_provider ON public.provider_affiliations(provider_id);
CREATE INDEX idx_provider_affiliations_facility ON public.provider_affiliations(facility_id);
CREATE INDEX idx_provider_affiliations_active ON public.provider_affiliations(is_active);

-- Create provider state transitions audit log (HPR-FR-010)
CREATE TABLE public.provider_state_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  from_state provider_lifecycle_state,
  to_state provider_lifecycle_state NOT NULL,
  
  reason TEXT,
  reason_code TEXT,
  
  -- Who made the change
  changed_by UUID NOT NULL,
  changed_by_role TEXT,
  council_reference TEXT,
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_state_transitions_provider ON public.provider_state_transitions(provider_id);
CREATE INDEX idx_provider_state_transitions_date ON public.provider_state_transitions(created_at);

-- Create eligibility decisions audit log (HPR-FR-050)
CREATE TABLE public.eligibility_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id),
  
  -- Decision
  eligible BOOLEAN NOT NULL,
  reason_codes TEXT[] DEFAULT '{}',
  
  -- Request context
  requested_role TEXT,
  requested_privileges TEXT[],
  facility_context TEXT,
  
  -- Response
  granted_roles TEXT[] DEFAULT '{}',
  granted_privileges TEXT[] DEFAULT '{}',
  facility_scope TEXT[] DEFAULT '{}',
  license_valid_until DATE,
  
  -- Audit
  requested_by UUID,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  
  -- For IdP integration
  token_issued BOOLEAN DEFAULT false,
  session_id TEXT
);

CREATE INDEX idx_eligibility_decisions_provider ON public.eligibility_decisions(provider_id);
CREATE INDEX idx_eligibility_decisions_date ON public.eligibility_decisions(requested_at);

-- Create IdP revocation events table (IDP-FR-040)
CREATE TABLE public.idp_revocation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id),
  user_id UUID,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'license_expired',
    'provider_suspended',
    'provider_revoked',
    'privilege_revoked',
    'affiliation_ended'
  )),
  
  -- Event source
  source_entity_type TEXT,
  source_entity_id UUID,
  
  -- Actions taken
  sessions_revoked INTEGER DEFAULT 0,
  tokens_invalidated INTEGER DEFAULT 0,
  
  -- Audit
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_idp_revocation_provider ON public.idp_revocation_events(provider_id);
CREATE INDEX idx_idp_revocation_user ON public.idp_revocation_events(user_id);
CREATE INDEX idx_idp_revocation_date ON public.idp_revocation_events(triggered_at);

-- Enable RLS on all tables
ALTER TABLE public.provider_privileges_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idp_revocation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privilege taxonomy (public read)
CREATE POLICY "Anyone can view privilege taxonomy"
  ON public.provider_privileges_taxonomy FOR SELECT
  USING (true);

-- RLS Policies for health providers
CREATE POLICY "Authenticated users can view providers"
  ON public.health_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can update own record"
  ON public.health_providers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin users can manage providers"
  ON public.health_providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for licenses
CREATE POLICY "Authenticated users can view licenses"
  ON public.provider_licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage licenses"
  ON public.provider_licenses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliations
CREATE POLICY "Authenticated users can view affiliations"
  ON public.provider_affiliations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage affiliations"
  ON public.provider_affiliations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for state transitions (read-only audit)
CREATE POLICY "Authenticated users can view state transitions"
  ON public.provider_state_transitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert state transitions"
  ON public.provider_state_transitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for eligibility decisions (read-only audit)
CREATE POLICY "Authenticated users can view eligibility decisions"
  ON public.eligibility_decisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert eligibility decisions"
  ON public.eligibility_decisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for revocation events
CREATE POLICY "Authenticated users can view revocation events"
  ON public.idp_revocation_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert revocation events"
  ON public.idp_revocation_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate UPID (HPR-FR-001, HPR-FR-002)
CREATE OR REPLACE FUNCTION public.generate_upid()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'UPID';
  timestamp_part TEXT;
  random_part TEXT;
  check_digit INTEGER;
  base_id TEXT;
  full_upid TEXT;
BEGIN
  -- Timestamp component (6 chars from epoch)
  timestamp_part := LPAD(TO_HEX(EXTRACT(EPOCH FROM now())::BIGINT % 16777216), 6, '0');
  
  -- Random component (8 chars)
  random_part := LPAD(TO_HEX((RANDOM() * 4294967295)::BIGINT), 8, '0');
  
  -- Combine
  base_id := UPPER(timestamp_part || random_part);
  
  -- Calculate check digit (simple mod 10)
  SELECT SUM(ASCII(c)) INTO check_digit FROM unnest(string_to_array(base_id, NULL)) AS c;
  check_digit := check_digit % 10;
  
  -- Format: UPID-XXXXXX-XXXXXXXX-C
  full_upid := prefix || '-' || SUBSTR(base_id, 1, 6) || '-' || SUBSTR(base_id, 7, 8) || '-' || check_digit::TEXT;
  
  RETURN full_upid;
END;
$$ LANGUAGE plpgsql;

-- Function to check provider eligibility (HPR-FR-050)
CREATE OR REPLACE FUNCTION public.check_provider_eligibility(
  p_provider_id UUID,
  p_requested_role TEXT DEFAULT NULL,
  p_requested_privileges TEXT[] DEFAULT NULL,
  p_facility_context TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_provider RECORD;
  v_eligible BOOLEAN := false;
  v_reason_codes TEXT[] := '{}';
  v_granted_roles TEXT[] := '{}';
  v_granted_privileges TEXT[] := '{}';
  v_facility_scope TEXT[] := '{}';
  v_license_valid_until DATE;
  v_start_time TIMESTAMP := clock_timestamp();
  v_response_time_ms INTEGER;
BEGIN
  -- Get provider
  SELECT * INTO v_provider FROM public.health_providers WHERE id = p_provider_id;
  
  IF NOT FOUND THEN
    v_reason_codes := array_append(v_reason_codes, 'PROVIDER_NOT_FOUND');
    RETURN jsonb_build_object(
      'eligible', false,
      'provider_id', p_provider_id,
      'reason_codes', v_reason_codes
    );
  END IF;
  
  -- Check lifecycle state
  IF v_provider.lifecycle_state != 'active' THEN
    v_reason_codes := array_append(v_reason_codes, 'PROVIDER_NOT_ACTIVE');
    v_reason_codes := array_append(v_reason_codes, 'STATE_' || UPPER(v_provider.lifecycle_state::TEXT));
  ELSE
    v_eligible := true;
  END IF;
  
  -- Check licenses
  SELECT MIN(expiry_date) INTO v_license_valid_until
  FROM public.provider_licenses
  WHERE provider_id = p_provider_id
    AND status = 'active'
    AND expiry_date >= CURRENT_DATE;
  
  IF v_license_valid_until IS NULL AND v_eligible THEN
    v_eligible := false;
    v_reason_codes := array_append(v_reason_codes, 'NO_VALID_LICENSE');
  END IF;
  
  -- Get granted roles and privileges from affiliations
  IF v_eligible THEN
    SELECT 
      array_agg(DISTINCT role),
      array_agg(DISTINCT unnest_priv),
      array_agg(DISTINCT facility_id)
    INTO v_granted_roles, v_granted_privileges, v_facility_scope
    FROM public.provider_affiliations,
         LATERAL unnest(privileges) AS unnest_priv
    WHERE provider_id = p_provider_id
      AND is_active = true
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      AND (p_facility_context IS NULL OR facility_id = p_facility_context);
    
    -- Check if requested role matches
    IF p_requested_role IS NOT NULL AND NOT (p_requested_role = ANY(v_granted_roles)) THEN
      v_eligible := false;
      v_reason_codes := array_append(v_reason_codes, 'ROLE_NOT_GRANTED');
    END IF;
    
    -- Check if requested privileges match
    IF p_requested_privileges IS NOT NULL AND v_eligible THEN
      IF NOT (p_requested_privileges <@ v_granted_privileges) THEN
        v_eligible := false;
        v_reason_codes := array_append(v_reason_codes, 'PRIVILEGES_NOT_GRANTED');
      END IF;
    END IF;
  END IF;
  
  -- Calculate response time
  v_response_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
  
  -- Log the decision
  INSERT INTO public.eligibility_decisions (
    provider_id, eligible, reason_codes, requested_role, requested_privileges,
    facility_context, granted_roles, granted_privileges, facility_scope,
    license_valid_until, response_time_ms
  ) VALUES (
    p_provider_id, v_eligible, v_reason_codes, p_requested_role, p_requested_privileges,
    p_facility_context, v_granted_roles, v_granted_privileges, v_facility_scope,
    v_license_valid_until, v_response_time_ms
  );
  
  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'provider_id', v_provider.upid,
    'roles', COALESCE(v_granted_roles, '{}'),
    'privileges', COALESCE(v_granted_privileges, '{}'),
    'facility_scope', COALESCE(v_facility_scope, '{}'),
    'license_valid_until', v_license_valid_until,
    'reason_codes', v_reason_codes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate UPID on insert
CREATE OR REPLACE FUNCTION public.auto_generate_upid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.upid IS NULL OR NEW.upid = '' THEN
    NEW.upid := public.generate_upid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_upid
  BEFORE INSERT ON public.health_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_upid();

-- Trigger to log state transitions
CREATE OR REPLACE FUNCTION public.log_provider_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_state IS DISTINCT FROM NEW.lifecycle_state THEN
    INSERT INTO public.provider_state_transitions (
      provider_id, from_state, to_state, reason, changed_by
    ) VALUES (
      NEW.id, OLD.lifecycle_state, NEW.lifecycle_state, 
      NEW.lifecycle_state_reason, COALESCE(NEW.lifecycle_state_changed_by, auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_state_transition
  AFTER UPDATE ON public.health_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_provider_state_transition();

-- Trigger to create revocation events on license status change
CREATE OR REPLACE FUNCTION public.handle_license_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('expired', 'suspended', 'revoked') THEN
    INSERT INTO public.idp_revocation_events (
      provider_id, user_id, event_type, source_entity_type, source_entity_id
    )
    SELECT 
      NEW.provider_id,
      hp.user_id,
      CASE NEW.status::text
        WHEN 'expired' THEN 'license_expired'
        WHEN 'suspended' THEN 'provider_suspended'
        WHEN 'revoked' THEN 'provider_revoked'
      END,
      'license',
      NEW.id
    FROM public.health_providers hp
    WHERE hp.id = NEW.provider_id
      AND hp.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_license_revocation
  AFTER UPDATE ON public.provider_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_license_status_change();

-- Trigger for affiliation end events
CREATE OR REPLACE FUNCTION public.handle_affiliation_end()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_active = true AND NEW.is_active = false) OR 
     (OLD.end_date IS NULL AND NEW.end_date IS NOT NULL AND NEW.end_date <= CURRENT_DATE) THEN
    INSERT INTO public.idp_revocation_events (
      provider_id, user_id, event_type, source_entity_type, source_entity_id
    )
    SELECT 
      NEW.provider_id,
      hp.user_id,
      'affiliation_ended',
      'affiliation',
      NEW.id
    FROM public.health_providers hp
    WHERE hp.id = NEW.provider_id
      AND hp.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliation_revocation
  AFTER UPDATE ON public.provider_affiliations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_affiliation_end();

-- Enable realtime for revocation events (for immediate IdP notification)
ALTER PUBLICATION supabase_realtime ADD TABLE public.idp_revocation_events;