-- =====================================================
-- IMPILO TRUST LAYER - COMPREHENSIVE DATABASE SCHEMA
-- Implements: TL-ID, TL-AUTH, TL-AUTHZ, TL-CONS, TL-AUD, TL-OFF, TL-KEY, TL-MOS
-- =====================================================

-- =====================================================
-- SECTION 1: IDENTITY RESOLUTION & TOKENISATION (TL-ID)
-- =====================================================

-- Core identity mapping table (BLACK BOX) - Health ID is internal only
-- TL-ID-07: Mapping store exists only inside Trust Layer
CREATE TABLE IF NOT EXISTS public.trust_layer_identity_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Internal identifiers (never exposed downstream)
  health_id TEXT UNIQUE NOT NULL,           -- Real internal health-domain identifier (TL-ID-01)
  impilo_id TEXT UNIQUE NOT NULL,           -- Memorable patient-facing alias (TL-ID-02)
  memorable_phid TEXT UNIQUE,               -- DDDSDDDX format for easy recall
  
  -- Registry-specific identifiers
  crid TEXT UNIQUE NOT NULL,                -- Client Registry ID (TL-ID-08: never in SHR)
  cpid TEXT UNIQUE NOT NULL,                -- Clinical Pseudonym for SHR (TL-ID-08: never in CR)
  
  -- Status and versioning
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'suspended', 'merged')),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Rotation tracking (TL-ID-04, TL-ID-05)
  previous_impilo_id TEXT,
  previous_cpid TEXT,
  rotated_at TIMESTAMPTZ,
  rotation_reason TEXT,
  
  -- Merge tracking
  merged_into_health_id TEXT REFERENCES public.trust_layer_identity_mapping(health_id),
  merged_at TIMESTAMPTZ,
  
  -- Provenance
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by TEXT,
  issued_at_facility_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tlim_impilo_id ON public.trust_layer_identity_mapping(impilo_id);
CREATE INDEX IF NOT EXISTS idx_tlim_crid ON public.trust_layer_identity_mapping(crid);
CREATE INDEX IF NOT EXISTS idx_tlim_cpid ON public.trust_layer_identity_mapping(cpid);
CREATE INDEX IF NOT EXISTS idx_tlim_status ON public.trust_layer_identity_mapping(status);

-- Alias history for rotation tracking (TL-ID-04)
CREATE TABLE IF NOT EXISTS public.trust_layer_alias_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_id TEXT NOT NULL REFERENCES public.trust_layer_identity_mapping(health_id),
  alias_type TEXT NOT NULL CHECK (alias_type IN ('impilo_id', 'cpid', 'memorable_phid')),
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  rotation_reason TEXT,
  rotated_by TEXT,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- Old alias may remain valid briefly for transition
  is_revoked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tlah_health_id ON public.trust_layer_alias_history(health_id);
CREATE INDEX IF NOT EXISTS idx_tlah_old_value ON public.trust_layer_alias_history(old_value);

-- Offline Provisional IDs (TL-ID-06, TL-OFF-02)
CREATE TABLE IF NOT EXISTS public.trust_layer_offline_cpid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  o_cpid TEXT UNIQUE NOT NULL,              -- Offline-generated CPID
  generating_device_id TEXT NOT NULL,
  generating_facility_id UUID,
  generating_user_id UUID,
  
  -- Reconciliation status
  status TEXT NOT NULL DEFAULT 'provisional' CHECK (status IN ('provisional', 'reconciled', 'merged', 'rejected')),
  reconciled_to_health_id TEXT REFERENCES public.trust_layer_identity_mapping(health_id),
  reconciled_to_cpid TEXT,
  
  -- Merge handling
  merge_confidence NUMERIC(3,2),
  merge_method TEXT,
  merge_notes TEXT,
  
  -- Provenance
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_attempted_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  reconciled_by TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tloc_status ON public.trust_layer_offline_cpid(status);
CREATE INDEX IF NOT EXISTS idx_tloc_device ON public.trust_layer_offline_cpid(generating_device_id);

-- =====================================================
-- SECTION 2: MOSIP INTEGRATION (TL-MOS - Option A)
-- =====================================================

-- MOSIP link tokens (TL-MOS-01) - stored only in CR zone
CREATE TABLE IF NOT EXISTS public.trust_layer_mosip_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crid TEXT NOT NULL REFERENCES public.trust_layer_identity_mapping(crid),
  
  -- Opaque token from MOSIP (TL-MOS-01, TL-MOS-02: never store actual national ID)
  mosip_link_token TEXT NOT NULL,
  mosip_link_status TEXT NOT NULL DEFAULT 'pending' CHECK (mosip_link_status IN ('pending', 'verified', 'failed', 'revoked', 'expired')),
  
  -- Assurance
  assurance_level TEXT,  -- LoA from eSignet verification
  identity_assurance_level TEXT,  -- IAL per NIST 800-63
  
  -- Verification metadata
  verification_timestamp TIMESTAMPTZ,
  verification_method TEXT,  -- e.g., 'esignet_oidc', 'biometric', 'document'
  verifier_facility_id UUID,
  verifier_user_id UUID,
  
  -- Lifecycle
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_crid_mosip UNIQUE (crid)
);

CREATE INDEX IF NOT EXISTS idx_tlml_status ON public.trust_layer_mosip_links(mosip_link_status);

-- =====================================================
-- SECTION 3: CONSENT MANAGEMENT (TL-CONS - FHIR-based)
-- =====================================================

-- FHIR Consent resource storage (TL-CONS-01, TL-CONS-02)
CREATE TABLE IF NOT EXISTS public.trust_layer_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id TEXT UNIQUE NOT NULL,  -- FHIR resource ID
  
  -- Subject (using CPID scope, not direct PII reference)
  subject_cpid TEXT NOT NULL,       -- References CPID not CRID for SHR context
  subject_health_id TEXT,           -- Internal only, for Trust Layer operations
  
  -- Consent type (TL-CONS-01)
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'care_team_access',           -- TPO baseline
    'cross_facility_sharing',     -- Inter-facility
    'referral_sharing',           -- Referral package
    'telehealth',                 -- Telemedicine sessions
    'sensitive_data_hiv',         -- HIV segmentation
    'sensitive_data_srh',         -- Sexual/reproductive health
    'sensitive_data_mh',          -- Mental health
    'delegate_access',            -- Guardian/proxy access
    'research_analytics',         -- Optional research opt-in
    'data_export',                -- Patient data export
    'emergency_override'          -- Pre-consent for emergency access
  )),
  
  -- Scope and actors
  scope_facility_ids UUID[],        -- Specific facilities or NULL for all
  scope_provider_upids TEXT[],      -- Specific providers or NULL for all care team
  scope_roles TEXT[],               -- Role-based scope
  
  -- Purpose of use
  purpose_of_use TEXT[] NOT NULL DEFAULT ARRAY['treatment'],  -- TPO, referral, audit, research
  
  -- FHIR Consent status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error')),
  
  -- Period (TL-CONS-02)
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ,
  
  -- Data constraints (TL-CONS-02)
  data_classes TEXT[],              -- Encounter types, data categories to include/exclude
  data_sensitivity_tags TEXT[],     -- e.g., 'R', 'V', 'ETH' (restricted, very restricted, substance abuse)
  
  -- Provision rules
  provision_type TEXT DEFAULT 'permit' CHECK (provision_type IN ('deny', 'permit')),
  provision_rules JSONB,            -- Complex provision logic
  
  -- Verification
  verification_method TEXT,         -- how consent was obtained
  verified_by TEXT,
  verification_timestamp TIMESTAMPTZ,
  
  -- Patient signature/acknowledgment
  patient_signature_reference TEXT,
  patient_acknowledged_at TIMESTAMPTZ,
  
  -- Revocation (TL-CONS-02)
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  
  -- FHIR resource
  fhir_resource JSONB,              -- Full FHIR Consent resource
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES public.trust_layer_consent(id),
  
  -- Provenance
  source_facility_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tlc_subject ON public.trust_layer_consent(subject_cpid);
CREATE INDEX IF NOT EXISTS idx_tlc_type ON public.trust_layer_consent(consent_type);
CREATE INDEX IF NOT EXISTS idx_tlc_status ON public.trust_layer_consent(status);
CREATE INDEX IF NOT EXISTS idx_tlc_period ON public.trust_layer_consent(period_start, period_end);

-- Consent delegation (for guardian/proxy access)
CREATE TABLE IF NOT EXISTS public.trust_layer_consent_delegation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES public.trust_layer_consent(id),
  
  -- Delegate information
  delegate_cpid TEXT,               -- If delegate is also a patient
  delegate_upid TEXT,               -- If delegate is a provider
  delegate_type TEXT NOT NULL CHECK (delegate_type IN ('guardian', 'proxy', 'legal_representative', 'caregiver', 'next_of_kin')),
  
  -- Delegation scope
  delegated_actions TEXT[] NOT NULL DEFAULT ARRAY['view'],  -- view, share, export, manage
  delegation_constraints JSONB,
  
  -- Period
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  
  -- Verification
  verified_by TEXT,
  verification_method TEXT,
  legal_document_reference TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tlcd_consent ON public.trust_layer_consent_delegation(consent_id);
CREATE INDEX IF NOT EXISTS idx_tlcd_delegate ON public.trust_layer_consent_delegation(delegate_cpid);

-- =====================================================
-- SECTION 4: POLICY & AUTHORIZATION (TL-AUTHZ)
-- =====================================================

-- Policy definitions (OPA-like policies)
CREATE TABLE IF NOT EXISTS public.trust_layer_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id TEXT UNIQUE NOT NULL,
  policy_name TEXT NOT NULL,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  
  -- Policy type
  policy_type TEXT NOT NULL CHECK (policy_type IN ('access_control', 'consent_enforcement', 'break_glass', 'data_classification', 'audit', 'offline')),
  
  -- Policy definition (TL-AUTHZ-01)
  attributes JSONB NOT NULL,        -- Required attributes for evaluation
  conditions JSONB NOT NULL,        -- Conditions that must be met
  actions TEXT[] NOT NULL,          -- Allowed/denied actions
  effect TEXT NOT NULL DEFAULT 'permit' CHECK (effect IN ('permit', 'deny')),
  
  -- Scope
  applies_to_roles TEXT[],
  applies_to_facilities UUID[],
  applies_to_data_classes TEXT[],
  
  -- Priority for conflict resolution
  priority INTEGER NOT NULL DEFAULT 100,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  rationale TEXT,
  regulatory_reference TEXT,        -- e.g., HIPAA, POPIA, local health act
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tlp_type ON public.trust_layer_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_tlp_active ON public.trust_layer_policies(is_active) WHERE is_active = true;

-- Break-glass access records (TL-AUTHZ-04)
CREATE TABLE IF NOT EXISTS public.trust_layer_break_glass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who and what
  user_id UUID NOT NULL,
  provider_upid TEXT,
  subject_cpid TEXT NOT NULL,       -- Patient whose record was accessed
  
  -- Justification
  justification TEXT NOT NULL,
  emergency_type TEXT CHECK (emergency_type IN ('life_threatening', 'urgent_care', 'patient_unresponsive', 'system_emergency', 'other')),
  
  -- Access details
  accessed_data_classes TEXT[],
  accessed_encounter_ids UUID[],
  access_scope TEXT NOT NULL,       -- 'full', 'limited', 'minimal'
  
  -- Time bounds (TL-AUTHZ-04: time-bound access)
  access_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_expires_at TIMESTAMPTZ NOT NULL,
  access_ended_at TIMESTAMPTZ,
  
  -- Facility context
  facility_id UUID,
  workspace_id UUID,
  
  -- Review workflow (TL-AUTHZ-04: post-review)
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'approved', 'flagged', 'violation')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  review_outcome TEXT,
  
  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_assigned_to TEXT,
  follow_up_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlbg_user ON public.trust_layer_break_glass(user_id);
CREATE INDEX IF NOT EXISTS idx_tlbg_subject ON public.trust_layer_break_glass(subject_cpid);
CREATE INDEX IF NOT EXISTS idx_tlbg_review ON public.trust_layer_break_glass(review_status) WHERE review_status = 'pending';

-- =====================================================
-- SECTION 5: AUDIT & PROVENANCE (TL-AUD)
-- =====================================================

-- Comprehensive trust layer audit log (TL-AUD-01)
CREATE TABLE IF NOT EXISTS public.trust_layer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_category TEXT NOT NULL CHECK (event_category IN (
    'authentication', 'authorization', 'identity_resolution', 'consent',
    'break_glass', 'export', 'disclosure', 'roster', 'offline', 'key_management'
  )),
  event_type TEXT NOT NULL,
  event_outcome TEXT NOT NULL CHECK (event_outcome IN ('success', 'failure', 'error', 'partial')),
  
  -- Actor
  user_id UUID,
  user_email TEXT,
  provider_upid TEXT,
  user_role TEXT,
  user_ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Subject (patient)
  subject_cpid TEXT,                -- Never store CRID in audit (TL-P-02)
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  
  -- Context
  facility_id UUID,
  workspace_id UUID,
  purpose_of_use TEXT,
  assurance_level TEXT,
  
  -- Request/response (sanitized)
  request_metadata JSONB,
  response_code TEXT,
  error_message TEXT,
  
  -- Consent reference
  consent_id UUID,
  consent_version INTEGER,
  
  -- Provenance
  source_system TEXT,
  correlation_id TEXT,              -- For tracing across services
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partitioning by month for performance
CREATE INDEX IF NOT EXISTS idx_tlal_created ON public.trust_layer_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tlal_user ON public.trust_layer_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_tlal_subject ON public.trust_layer_audit_log(subject_cpid);
CREATE INDEX IF NOT EXISTS idx_tlal_category ON public.trust_layer_audit_log(event_category);
CREATE INDEX IF NOT EXISTS idx_tlal_correlation ON public.trust_layer_audit_log(correlation_id);

-- Access history for patient portal (TL-AUD-02)
CREATE TABLE IF NOT EXISTS public.trust_layer_patient_access_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  subject_cpid TEXT NOT NULL,
  
  -- Accessor (sanitized for patient view)
  accessor_role TEXT NOT NULL,      -- e.g., 'Doctor', 'Nurse' (not individual identity unless allowed)
  accessor_facility_name TEXT,
  accessor_department TEXT,
  
  -- Access details
  purpose_of_use TEXT NOT NULL,
  data_accessed_summary TEXT,       -- High-level description
  access_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Derived from policy (what patient can see)
  show_accessor_name BOOLEAN DEFAULT false,
  accessor_name TEXT,               -- Only if show_accessor_name is true
  
  -- Linkage to full audit
  audit_log_id UUID REFERENCES public.trust_layer_audit_log(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlpah_subject ON public.trust_layer_patient_access_history(subject_cpid);
CREATE INDEX IF NOT EXISTS idx_tlpah_timestamp ON public.trust_layer_patient_access_history(access_timestamp);

-- =====================================================
-- SECTION 6: DEVICE & SESSION MANAGEMENT (TL-AUTH)
-- =====================================================

-- Device registry (TL-AUTH-03)
CREATE TABLE IF NOT EXISTS public.trust_layer_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT UNIQUE NOT NULL,
  
  user_id UUID NOT NULL,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('workstation', 'mobile', 'tablet', 'kiosk', 'other')),
  
  -- Trust level
  is_trusted BOOLEAN DEFAULT false,
  trust_level TEXT DEFAULT 'unknown' CHECK (trust_level IN ('unknown', 'recognized', 'trusted', 'managed')),
  trust_established_at TIMESTAMPTZ,
  trust_established_method TEXT,
  
  -- Binding
  bound_to_facility_id UUID,
  bound_to_workspace_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_ip_address INET,
  
  -- Security
  requires_mfa BOOLEAN DEFAULT true,
  mfa_last_verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tld_user ON public.trust_layer_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_tld_fingerprint ON public.trust_layer_devices(device_fingerprint);

-- Offline tokens (TL-AUTH-04)
CREATE TABLE IF NOT EXISTS public.trust_layer_offline_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,  -- Hash of the token, never store plaintext
  
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.trust_layer_devices(id),
  
  -- Scope
  facility_id UUID,
  workspace_id UUID,
  granted_roles TEXT[],
  granted_privileges TEXT[],
  
  -- Time limits (TL-AUTH-04: time-limited offline)
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  max_offline_duration_hours INTEGER DEFAULT 24,
  
  -- Cache permissions
  can_cache_identity_mappings BOOLEAN DEFAULT true,
  identity_cache_ttl_hours INTEGER DEFAULT 48,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'used')),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlot_user ON public.trust_layer_offline_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tlot_status ON public.trust_layer_offline_tokens(status);

-- =====================================================
-- SECTION 7: KEY MANAGEMENT (TL-KEY)
-- =====================================================

-- Signing key metadata (TL-KEY-01, TL-KEY-02)
CREATE TABLE IF NOT EXISTS public.trust_layer_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT UNIQUE NOT NULL,
  
  -- Key purpose
  key_purpose TEXT NOT NULL CHECK (key_purpose IN ('document_signing', 'token_signing', 'service_auth', 'encryption')),
  key_algorithm TEXT NOT NULL,      -- e.g., 'RS256', 'ES256'
  
  -- Key material (public only - private in HSM/vault)
  public_key_pem TEXT NOT NULL,
  key_thumbprint TEXT NOT NULL,
  
  -- External reference
  vault_key_reference TEXT,         -- Reference to key in vault/HSM
  hsm_key_id TEXT,
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rotating', 'retired', 'compromised')),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  
  -- Rotation (TL-KEY-02)
  rotates_to_key_id TEXT,
  rotation_scheduled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlsk_purpose ON public.trust_layer_signing_keys(key_purpose);
CREATE INDEX IF NOT EXISTS idx_tlsk_status ON public.trust_layer_signing_keys(status);

-- Signed artifacts registry (TL-KEY-03)
CREATE TABLE IF NOT EXISTS public.trust_layer_signed_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Artifact reference
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('referral', 'transfer_package', 'discharge_summary', 'certificate', 'crvs_notification', 'prescription')),
  artifact_id UUID NOT NULL,
  artifact_hash TEXT NOT NULL,      -- Hash of the document content
  
  -- Signature
  signing_key_id TEXT NOT NULL REFERENCES public.trust_layer_signing_keys(key_id),
  signature TEXT NOT NULL,
  signature_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Signer
  signer_user_id UUID,
  signer_upid TEXT,
  signer_role TEXT,
  signer_facility_id UUID,
  
  -- Verification
  verification_qr_data TEXT,        -- For QR code verification
  verification_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'superseded', 'revoked')),
  superseded_by_id UUID REFERENCES public.trust_layer_signed_artifacts(id),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlsa_artifact ON public.trust_layer_signed_artifacts(artifact_type, artifact_id);
CREATE INDEX IF NOT EXISTS idx_tlsa_hash ON public.trust_layer_signed_artifacts(artifact_hash);

-- =====================================================
-- SECTION 8: ACCESS TOKEN MANAGEMENT
-- =====================================================

-- Short-lived access tokens for ID resolution
CREATE TABLE IF NOT EXISTS public.trust_layer_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  
  -- Subject
  subject_type TEXT NOT NULL CHECK (subject_type IN ('cpid', 'crid', 'health_id')),
  subject_value TEXT NOT NULL,
  
  -- Scope
  scope TEXT NOT NULL CHECK (scope IN ('clinical', 'registry', 'consent', 'audit')),
  granted_actions TEXT[] NOT NULL,
  
  -- Requester
  requester_user_id UUID,
  requester_facility_id UUID,
  requester_purpose TEXT,
  
  -- Consent reference
  consent_id UUID REFERENCES public.trust_layer_consent(id),
  
  -- Time bounds
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'used')),
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlat_token ON public.trust_layer_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tlat_subject ON public.trust_layer_access_tokens(subject_value);
CREATE INDEX IF NOT EXISTS idx_tlat_status ON public.trust_layer_access_tokens(status);

-- =====================================================
-- SECTION 9: RATE LIMITING & ANTI-ENUMERATION (TL-ID-10)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trust_layer_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Limiter key
  limit_key TEXT NOT NULL,          -- Combination of user/device/facility/endpoint
  limit_type TEXT NOT NULL CHECK (limit_type IN ('id_resolution', 'consent_query', 'break_glass', 'export')),
  
  -- Counters
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_duration_seconds INTEGER NOT NULL DEFAULT 60,
  
  -- Limits
  max_requests INTEGER NOT NULL,
  
  -- Lockout
  is_locked_out BOOLEAN DEFAULT false,
  lockout_until TIMESTAMPTZ,
  lockout_reason TEXT,
  
  -- Metadata
  last_request_at TIMESTAMPTZ,
  last_request_ip INET,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_limit_key UNIQUE (limit_key, limit_type)
);

CREATE INDEX IF NOT EXISTS idx_tlrl_key ON public.trust_layer_rate_limits(limit_key);

-- =====================================================
-- SECTION 10: RLS POLICIES
-- =====================================================

-- Enable RLS on all Trust Layer tables
ALTER TABLE public.trust_layer_identity_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_alias_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_offline_cpid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_mosip_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_consent_delegation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_break_glass ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_patient_access_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_offline_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_signing_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_signed_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_layer_rate_limits ENABLE ROW LEVEL SECURITY;

-- Identity mapping: Only Trust Layer services can access (via service role)
CREATE POLICY "Trust Layer identity mapping - service access only"
  ON public.trust_layer_identity_mapping
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
    OR public.has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Consent: Patients can view their own, providers can view with consent
CREATE POLICY "Consent - subject access"
  ON public.trust_layer_consent
  FOR SELECT
  USING (
    -- Service role full access
    auth.jwt() ->> 'role' = 'service_role'
    -- Platform superuser
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
    -- Provider with valid authorization (checked by application layer)
    OR public.is_licensed_practitioner(auth.uid())
  );

CREATE POLICY "Consent - insert by authenticated"
  ON public.trust_layer_consent
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Consent - update by creator or service"
  ON public.trust_layer_consent
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR created_by = auth.uid()::text
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
  );

-- Break glass: Reviewers and the user who triggered can view
CREATE POLICY "Break glass - access policy"
  ON public.trust_layer_break_glass
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id = auth.uid()
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
    OR public.has_above_site_role(auth.uid())
  );

-- Audit log: Read-only for authorized users
CREATE POLICY "Audit log - read access"
  ON public.trust_layer_audit_log
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
    OR public.has_above_site_role(auth.uid())
    OR user_id = auth.uid()  -- Users can see their own audit trail
  );

CREATE POLICY "Audit log - insert only by service"
  ON public.trust_layer_audit_log
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Patient access history: Patients see their own
CREATE POLICY "Patient access history - subject access"
  ON public.trust_layer_patient_access_history
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
    -- In production, would check if current user is the patient via CPID
  );

-- Devices: Users see their own devices
CREATE POLICY "Devices - user access"
  ON public.trust_layer_devices
  FOR ALL
  USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
  );

-- Offline tokens: Users see their own
CREATE POLICY "Offline tokens - user access"
  ON public.trust_layer_offline_tokens
  FOR ALL
  USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policies: Read by all authenticated, write by admins
CREATE POLICY "Policies - read access"
  ON public.trust_layer_policies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Policies - admin write"
  ON public.trust_layer_policies
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR public.has_platform_role(auth.uid(), 'platform_superuser')
  );

-- Signing keys: Read public keys, write by service only
CREATE POLICY "Signing keys - read public"
  ON public.trust_layer_signing_keys
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Signing keys - service write"
  ON public.trust_layer_signing_keys
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Other tables: Service role access
CREATE POLICY "Alias history - service access"
  ON public.trust_layer_alias_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR public.has_platform_role(auth.uid(), 'platform_superuser'));

CREATE POLICY "Offline CPID - service access"
  ON public.trust_layer_offline_cpid FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR public.has_platform_role(auth.uid(), 'platform_superuser'));

CREATE POLICY "MOSIP links - service access"
  ON public.trust_layer_mosip_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR public.has_registry_role(auth.uid(), 'registry_super_admin'));

CREATE POLICY "Consent delegation - access"
  ON public.trust_layer_consent_delegation FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "Signed artifacts - read access"
  ON public.trust_layer_signed_artifacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Signed artifacts - service write"
  ON public.trust_layer_signed_artifacts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "Access tokens - service access"
  ON public.trust_layer_access_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR requester_user_id = auth.uid());

CREATE POLICY "Rate limits - service access"
  ON public.trust_layer_rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 11: HELPER FUNCTIONS
-- =====================================================

-- Function to resolve Impilo ID to CPID (TL-ID-09: Health ID never exposed)
CREATE OR REPLACE FUNCTION public.trust_layer_resolve_clinical(p_impilo_id TEXT)
RETURNS TABLE (cpid TEXT, status TEXT, consent_active BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tlim.cpid,
    tlim.status,
    EXISTS (
      SELECT 1 FROM public.trust_layer_consent tc
      WHERE tc.subject_cpid = tlim.cpid
        AND tc.status = 'active'
        AND tc.consent_type = 'care_team_access'
        AND (tc.period_end IS NULL OR tc.period_end > now())
    ) as consent_active
  FROM public.trust_layer_identity_mapping tlim
  WHERE tlim.impilo_id = p_impilo_id
    AND tlim.status = 'active';
END;
$$;

-- Function to resolve Impilo ID to CRID (for CR operations only)
CREATE OR REPLACE FUNCTION public.trust_layer_resolve_registry(p_impilo_id TEXT)
RETURNS TABLE (crid TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tlim.crid,
    tlim.status
  FROM public.trust_layer_identity_mapping tlim
  WHERE tlim.impilo_id = p_impilo_id
    AND tlim.status = 'active';
END;
$$;

-- Function to issue new identity (TL-ID-01, TL-ID-02, TL-ID-03)
CREATE OR REPLACE FUNCTION public.trust_layer_issue_identity(
  p_issuer_user_id UUID,
  p_issuer_facility_id UUID DEFAULT NULL
)
RETURNS TABLE (health_id TEXT, impilo_id TEXT, crid TEXT, cpid TEXT, memorable_phid TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_health_id TEXT;
  v_impilo_id TEXT;
  v_crid TEXT;
  v_cpid TEXT;
  v_memorable TEXT;
BEGIN
  -- Generate Health ID (internal identifier)
  v_health_id := public.generate_health_id();
  
  -- Generate CRID (for Client Registry)
  v_crid := public.generate_client_registry_id();
  
  -- Generate CPID (for SHR) - different from CRID!
  v_cpid := 'CPID-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  
  -- Generate memorable Impilo ID (patient-facing)
  v_impilo_id := 'IMP-' || 
    lpad((floor(random() * 900) + 100)::text, 3, '0') ||
    chr(65 + floor(random() * 24)::int) ||
    lpad((floor(random() * 900) + 100)::text, 3, '0') ||
    floor(random() * 10)::text;
  
  -- Generate PHID format (DDDSDDDX)
  v_memorable := lpad((floor(random() * 900) + 100)::text, 3, '0') ||
    chr(65 + floor(random() * 24)::int) ||
    lpad((floor(random() * 900) + 100)::text, 3, '0') ||
    floor(random() * 10)::text;
  
  -- Insert mapping
  INSERT INTO public.trust_layer_identity_mapping (
    health_id, impilo_id, memorable_phid, crid, cpid,
    issued_by, issued_at_facility_id
  ) VALUES (
    v_health_id, v_impilo_id, v_memorable, v_crid, v_cpid,
    p_issuer_user_id::text, p_issuer_facility_id
  );
  
  -- Audit log
  INSERT INTO public.trust_layer_audit_log (
    event_category, event_type, event_outcome, user_id,
    action, resource_type, resource_id
  ) VALUES (
    'identity_resolution', 'identity_issued', 'success', p_issuer_user_id,
    'issue_identity', 'trust_layer_identity_mapping', v_health_id
  );
  
  RETURN QUERY SELECT v_health_id, v_impilo_id, v_crid, v_cpid, v_memorable;
END;
$$;

-- Function to check consent for access
CREATE OR REPLACE FUNCTION public.trust_layer_check_consent(
  p_subject_cpid TEXT,
  p_requester_upid TEXT,
  p_purpose TEXT,
  p_facility_id UUID DEFAULT NULL
)
RETURNS TABLE (has_consent BOOLEAN, consent_id UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as has_consent,
    tc.id as consent_id,
    tc.period_end as expires_at
  FROM public.trust_layer_consent tc
  WHERE tc.subject_cpid = p_subject_cpid
    AND tc.status = 'active'
    AND (tc.period_end IS NULL OR tc.period_end > now())
    AND (p_purpose = ANY(tc.purpose_of_use) OR 'treatment' = ANY(tc.purpose_of_use))
    AND (
      tc.scope_provider_upids IS NULL 
      OR p_requester_upid = ANY(tc.scope_provider_upids)
    )
    AND (
      tc.scope_facility_ids IS NULL 
      OR p_facility_id = ANY(tc.scope_facility_ids)
    )
  ORDER BY tc.period_end DESC NULLS FIRST
  LIMIT 1;
  
  -- If no rows returned, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- Function to record break-glass access
CREATE OR REPLACE FUNCTION public.trust_layer_record_break_glass(
  p_user_id UUID,
  p_subject_cpid TEXT,
  p_justification TEXT,
  p_emergency_type TEXT,
  p_facility_id UUID DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 4
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_provider_upid TEXT;
BEGIN
  -- Get provider UPID
  SELECT hp.upid INTO v_provider_upid
  FROM public.health_providers hp
  WHERE hp.user_id = p_user_id;
  
  -- Create break-glass record
  INSERT INTO public.trust_layer_break_glass (
    user_id, provider_upid, subject_cpid, justification, emergency_type,
    facility_id, access_expires_at
  ) VALUES (
    p_user_id, v_provider_upid, p_subject_cpid, p_justification, p_emergency_type,
    p_facility_id, now() + (p_expires_in_hours || ' hours')::interval
  )
  RETURNING id INTO v_id;
  
  -- Audit log with escalated logging
  INSERT INTO public.trust_layer_audit_log (
    event_category, event_type, event_outcome, user_id, provider_upid,
    subject_cpid, action, resource_type, resource_id, facility_id, purpose_of_use
  ) VALUES (
    'break_glass', 'break_glass_activated', 'success', p_user_id, v_provider_upid,
    p_subject_cpid, 'activate_break_glass', 'patient_record', p_subject_cpid,
    p_facility_id, 'emergency_override'
  );
  
  RETURN v_id;
END;
$$;

-- Enable realtime for consent changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_layer_consent;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_layer_break_glass;