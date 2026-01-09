-- =====================================================
-- NATIONAL CLIENT REGISTRY (Health ID Registry)
-- OpenHIE, WHO DIIG, FHIR R4 Compliant
-- =====================================================

-- Client lifecycle states
CREATE TYPE client_lifecycle_state AS ENUM (
  'draft',      -- Locally created, not yet reconciled
  'active',     -- Canonical, valid identity
  'inactive',   -- No recent activity
  'deceased',   -- Death confirmed
  'merged'      -- Superseded by another record
);

-- Identifier confidence levels
CREATE TYPE identifier_confidence AS ENUM (
  'verified',   -- Verified against authoritative source
  'self_reported', -- Client-provided, not verified
  'derived',    -- Inferred from other data
  'uncertain'   -- Low confidence
);

-- Relationship types
CREATE TYPE client_relationship_type AS ENUM (
  'mother',
  'father',
  'guardian',
  'caregiver',
  'spouse',
  'child',
  'sibling',
  'proxy',
  'next_of_kin',
  'emergency_contact'
);

-- =====================================================
-- CORE CLIENT REGISTRY TABLE
-- =====================================================
CREATE TABLE public.client_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Health ID (Patient_UUID) - globally unique, immutable
  health_id TEXT UNIQUE NOT NULL,
  
  -- Core identity attributes (WHO/OpenHIE minimum data set)
  given_names TEXT NOT NULL,
  family_name TEXT NOT NULL,
  other_names TEXT,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other', 'unknown')),
  date_of_birth DATE,
  estimated_dob BOOLEAN DEFAULT false,
  dob_confidence TEXT CHECK (dob_confidence IN ('exact', 'year_month', 'year_only', 'estimated')),
  
  -- Demographic attributes
  place_of_birth TEXT,
  nationality TEXT DEFAULT 'ZW',
  
  -- Address (structured, aligned to Facility Registry admin levels)
  address_line1 TEXT,
  address_line2 TEXT,
  village TEXT,
  ward TEXT,
  district TEXT,
  province TEXT,
  country TEXT DEFAULT 'Zimbabwe',
  postal_code TEXT,
  
  -- Contact information
  phone_primary TEXT,
  phone_secondary TEXT,
  email TEXT,
  
  -- Lifecycle management
  lifecycle_state client_lifecycle_state DEFAULT 'draft',
  lifecycle_state_reason TEXT,
  lifecycle_state_changed_at TIMESTAMPTZ,
  lifecycle_state_changed_by UUID,
  
  -- Death management
  deceased_date DATE,
  deceased_confirmed BOOLEAN DEFAULT false,
  deceased_source TEXT,
  
  -- Merge management
  merged_into_id UUID REFERENCES public.client_registry(id),
  merged_at TIMESTAMPTZ,
  merged_by UUID,
  
  -- Biometric linkage (optional, policy-driven)
  biometric_enrolled BOOLEAN DEFAULT false,
  biometric_fingerprint_hash TEXT,
  biometric_facial_hash TEXT,
  biometric_iris_hash TEXT,
  
  -- Matching scores and flags
  matching_score NUMERIC(5,2),
  duplicate_flag BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  verification_source TEXT,
  
  -- Provenance
  source_system TEXT,
  source_facility_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_modified_by UUID,
  
  -- FHIR resource version
  version_id INTEGER DEFAULT 1
);

-- =====================================================
-- CLIENT IDENTIFIERS (Multiple per client)
-- =====================================================
CREATE TABLE public.client_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_registry(id) ON DELETE CASCADE,
  
  -- Identifier details
  identifier_type TEXT NOT NULL, -- 'national_id', 'passport', 'birth_registration', 'facility_mrn', 'programme_id', 'insurance_id'
  identifier_value TEXT NOT NULL,
  assigning_authority TEXT, -- e.g., 'RG', 'ZIMRA', 'Facility Name', 'HIV Programme'
  
  -- Status and validity
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  issue_date DATE,
  expiry_date DATE,
  
  -- Confidence and provenance
  confidence identifier_confidence DEFAULT 'self_reported',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  verification_method TEXT,
  
  -- Provenance
  source_system TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint per type per client
  UNIQUE(client_id, identifier_type, identifier_value)
);

-- =====================================================
-- CLIENT RELATIONSHIPS
-- =====================================================
CREATE TABLE public.client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The client this relationship belongs to
  client_id UUID NOT NULL REFERENCES public.client_registry(id) ON DELETE CASCADE,
  
  -- The related person (can be another registered client or external)
  related_client_id UUID REFERENCES public.client_registry(id),
  related_person_name TEXT, -- If not a registered client
  related_person_phone TEXT,
  
  -- Relationship details
  relationship_type client_relationship_type NOT NULL,
  relationship_description TEXT,
  
  -- Validity
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Legal/consent relevance
  legal_relevance BOOLEAN DEFAULT false,
  consent_relevance BOOLEAN DEFAULT false,
  
  -- Provenance
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SUSPECTED DUPLICATES QUEUE
-- =====================================================
CREATE TABLE public.client_duplicate_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The two clients suspected to be duplicates
  client_a_id UUID NOT NULL REFERENCES public.client_registry(id) ON DELETE CASCADE,
  client_b_id UUID NOT NULL REFERENCES public.client_registry(id) ON DELETE CASCADE,
  
  -- Matching details
  match_score NUMERIC(5,2) NOT NULL,
  match_method TEXT, -- 'deterministic', 'probabilistic', 'manual_flag'
  match_reasons JSONB, -- Array of matching field explanations
  
  -- Review status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed_duplicate', 'not_duplicate', 'merged')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  
  -- Resolution
  surviving_client_id UUID REFERENCES public.client_registry(id),
  merged_at TIMESTAMPTZ,
  merged_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure we don't create duplicate queue entries
  UNIQUE(client_a_id, client_b_id)
);

-- =====================================================
-- MERGE HISTORY (Audit trail)
-- =====================================================
CREATE TABLE public.client_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The merge operation
  surviving_client_id UUID NOT NULL REFERENCES public.client_registry(id),
  merged_client_id UUID NOT NULL, -- Don't FK as the client is now merged
  merged_client_health_id TEXT NOT NULL, -- Preserve the old Health ID
  
  -- What was merged
  merged_data JSONB NOT NULL, -- Snapshot of merged client data
  identifiers_transferred JSONB, -- List of identifiers moved
  relationships_transferred JSONB, -- List of relationships moved
  
  -- Merge details
  merge_reason TEXT,
  merge_method TEXT, -- 'automatic', 'manual', 'bulk'
  
  -- Provenance
  merged_at TIMESTAMPTZ DEFAULT now(),
  merged_by UUID,
  
  -- For potential un-merge
  can_unmerge BOOLEAN DEFAULT true,
  unmerged_at TIMESTAMPTZ,
  unmerged_by UUID
);

-- =====================================================
-- CLIENT STATE TRANSITIONS (Audit)
-- =====================================================
CREATE TABLE public.client_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_registry(id) ON DELETE CASCADE,
  
  from_state client_lifecycle_state,
  to_state client_lifecycle_state NOT NULL,
  
  reason TEXT,
  triggered_by TEXT, -- 'user', 'system', 'api', 'merge', 'death_record'
  
  -- Provenance
  changed_at TIMESTAMPTZ DEFAULT now(),
  changed_by UUID
);

-- =====================================================
-- CLIENT REGISTRY EVENTS (For downstream systems)
-- =====================================================
CREATE TABLE public.client_registry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type TEXT NOT NULL, -- 'health_id_issued', 'identity_merged', 'client_deceased', 'identifier_added', 'identifier_changed'
  client_id UUID NOT NULL,
  health_id TEXT NOT NULL,
  
  event_data JSONB,
  
  -- Downstream processing
  processed_by_shr BOOLEAN DEFAULT false,
  processed_by_consent BOOLEAN DEFAULT false,
  processed_by_iam BOOLEAN DEFAULT false,
  processed_by_ndr BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- MATCHING RULES CONFIGURATION
-- =====================================================
CREATE TABLE public.client_matching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('deterministic', 'probabilistic')),
  
  -- Rule definition
  fields JSONB NOT NULL, -- Fields to match on
  weights JSONB, -- For probabilistic matching
  threshold NUMERIC(5,2), -- Minimum score for match
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_client_registry_health_id ON public.client_registry(health_id);
CREATE INDEX idx_client_registry_names ON public.client_registry(given_names, family_name);
CREATE INDEX idx_client_registry_dob ON public.client_registry(date_of_birth);
CREATE INDEX idx_client_registry_phone ON public.client_registry(phone_primary);
CREATE INDEX idx_client_registry_state ON public.client_registry(lifecycle_state);
CREATE INDEX idx_client_registry_province ON public.client_registry(province);
CREATE INDEX idx_client_registry_deceased ON public.client_registry(deceased_date) WHERE deceased_confirmed = true;
CREATE INDEX idx_client_registry_duplicate ON public.client_registry(duplicate_flag) WHERE duplicate_flag = true;

CREATE INDEX idx_client_identifiers_client ON public.client_identifiers(client_id);
CREATE INDEX idx_client_identifiers_type_value ON public.client_identifiers(identifier_type, identifier_value);
CREATE INDEX idx_client_identifiers_value ON public.client_identifiers(identifier_value);

CREATE INDEX idx_client_relationships_client ON public.client_relationships(client_id);
CREATE INDEX idx_client_relationships_related ON public.client_relationships(related_client_id);

CREATE INDEX idx_client_duplicate_queue_status ON public.client_duplicate_queue(status);
CREATE INDEX idx_client_registry_events_type ON public.client_registry_events(event_type);
CREATE INDEX idx_client_registry_events_processed ON public.client_registry_events(processed_by_shr, processed_by_consent);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE TRIGGER update_client_registry_updated_at
  BEFORE UPDATE ON public.client_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_identifiers_updated_at
  BEFORE UPDATE ON public.client_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_relationships_updated_at
  BEFORE UPDATE ON public.client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Log state transitions
CREATE OR REPLACE FUNCTION public.log_client_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_state IS DISTINCT FROM NEW.lifecycle_state THEN
    INSERT INTO public.client_state_transitions (
      client_id, from_state, to_state, reason, triggered_by, changed_by
    ) VALUES (
      NEW.id, OLD.lifecycle_state, NEW.lifecycle_state, 
      NEW.lifecycle_state_reason, 'user', NEW.lifecycle_state_changed_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_client_state_change
  AFTER UPDATE ON public.client_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.log_client_state_transition();

-- Emit events on significant changes
CREATE OR REPLACE FUNCTION public.emit_client_registry_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_registry_events (event_type, client_id, health_id, event_data)
    VALUES ('health_id_issued', NEW.id, NEW.health_id, jsonb_build_object(
      'given_names', NEW.given_names,
      'family_name', NEW.family_name,
      'sex', NEW.sex,
      'date_of_birth', NEW.date_of_birth
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.lifecycle_state != 'deceased' AND NEW.lifecycle_state = 'deceased' THEN
      INSERT INTO public.client_registry_events (event_type, client_id, health_id, event_data)
      VALUES ('client_deceased', NEW.id, NEW.health_id, jsonb_build_object(
        'deceased_date', NEW.deceased_date,
        'deceased_source', NEW.deceased_source
      ));
    END IF;
    IF OLD.lifecycle_state != 'merged' AND NEW.lifecycle_state = 'merged' THEN
      INSERT INTO public.client_registry_events (event_type, client_id, health_id, event_data)
      VALUES ('identity_merged', NEW.id, NEW.health_id, jsonb_build_object(
        'merged_into_id', NEW.merged_into_id
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emit_client_events
  AFTER INSERT OR UPDATE ON public.client_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_client_registry_event();

-- =====================================================
-- HEALTH ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_health_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num BIGINT;
  random_part TEXT;
  check_digit INTEGER;
  health_id TEXT;
  base_num TEXT;
BEGIN
  -- Get next sequence number
  seq_num := get_next_id_sequence('health_id');
  
  -- Generate random component (4 alphanumeric chars)
  random_part := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  
  -- Base number for check digit calculation
  base_num := lpad(seq_num::text, 10, '0');
  
  -- Calculate Luhn-style check digit
  SELECT (10 - (SUM(digit) % 10)) % 10 INTO check_digit
  FROM (
    SELECT (CASE WHEN pos % 2 = 1 THEN digit * 2 ELSE digit END) % 10 + 
           (CASE WHEN pos % 2 = 1 AND digit * 2 >= 10 THEN 1 ELSE 0 END) AS digit
    FROM (
      SELECT CAST(SUBSTRING(base_num FROM pos FOR 1) AS INTEGER) AS digit, pos
      FROM generate_series(1, 10) AS pos
    ) digits
  ) weighted;
  
  -- Format: HID-NNNNNNNNNN-XXXX-C
  health_id := 'HID-' || base_num || '-' || random_part || '-' || check_digit::TEXT;
  
  RETURN health_id;
END;
$$;

-- =====================================================
-- AUTO-GENERATE HEALTH ID ON INSERT
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_health_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.health_id IS NULL OR NEW.health_id = '' THEN
    NEW.health_id := public.generate_health_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_health_id
  BEFORE INSERT ON public.client_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_health_id();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.client_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_duplicate_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_registry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_matching_rules ENABLE ROW LEVEL SECURITY;

-- Registry admins can manage all records
CREATE POLICY "Registry admins can manage clients"
  ON public.client_registry
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Authenticated users can view clients (for clinical lookup)
CREATE POLICY "Authenticated users can view clients"
  ON public.client_registry
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Registry admins can manage identifiers
CREATE POLICY "Registry admins can manage identifiers"
  ON public.client_identifiers
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Authenticated users can view identifiers
CREATE POLICY "Authenticated users can view identifiers"
  ON public.client_identifiers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Registry admins can manage relationships
CREATE POLICY "Registry admins can manage relationships"
  ON public.client_relationships
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Authenticated users can view relationships
CREATE POLICY "Authenticated users can view relationships"
  ON public.client_relationships
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only registry admins can manage duplicate queue
CREATE POLICY "Registry admins can manage duplicates"
  ON public.client_duplicate_queue
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Only registry admins can view merge history
CREATE POLICY "Registry admins can view merge history"
  ON public.client_merge_history
  FOR SELECT
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Only registry admins can view state transitions
CREATE POLICY "Registry admins can view state transitions"
  ON public.client_state_transitions
  FOR SELECT
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Only registry admins can manage events
CREATE POLICY "Registry admins can manage events"
  ON public.client_registry_events
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'client_registry_admin') OR
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Only super admins can manage matching rules
CREATE POLICY "Super admins can manage matching rules"
  ON public.client_matching_rules
  FOR ALL
  USING (
    has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- =====================================================
-- INSERT DEFAULT MATCHING RULES
-- =====================================================
INSERT INTO public.client_matching_rules (rule_name, rule_type, fields, weights, threshold, priority) VALUES
('national_id_exact', 'deterministic', '["national_id"]'::jsonb, NULL, 100, 1),
('passport_exact', 'deterministic', '["passport"]'::jsonb, NULL, 100, 2),
('birth_registration_exact', 'deterministic', '["birth_registration"]'::jsonb, NULL, 100, 3),
('demographic_probabilistic', 'probabilistic', 
  '["given_names", "family_name", "date_of_birth", "sex", "phone_primary"]'::jsonb,
  '{"given_names": 25, "family_name": 25, "date_of_birth": 30, "sex": 10, "phone_primary": 10}'::jsonb,
  80, 10
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_registry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_duplicate_queue;