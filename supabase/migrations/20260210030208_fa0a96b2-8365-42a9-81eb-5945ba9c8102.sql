
-- ============================================================================
-- TSHEPO Trust Layer — Comprehensive Schema Migration
-- Covers all 7 sub-domains with strict PII-minimization
-- ============================================================================

-- ============================================================================
-- F1: IDENTITY RESOLUTION & TOKENISATION (tshepo_identity)
-- Upgrades to existing trust_layer_identity_mapping
-- ============================================================================

-- Add missing columns to identity mapping for v1.1 compliance
ALTER TABLE public.trust_layer_identity_mapping
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS pod_id text NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS cpid_deterministic_seed text,
  ADD COLUMN IF NOT EXISTS cpid_algorithm text DEFAULT 'SHA256_HMAC',
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_count bigint NOT NULL DEFAULT 0;

-- O-CPID upgrade: add tenant/pod and reconciliation metadata
ALTER TABLE public.trust_layer_offline_cpid
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS pod_id text NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS reconciled_cpid text,
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciled_by uuid,
  ADD COLUMN IF NOT EXISTS conflict_resolution text,
  ADD COLUMN IF NOT EXISTS reconciliation_notes text;

-- ============================================================================
-- F2: SESSION ASSURANCE (tshepo_session)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tshepo_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  pod_id text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL DEFAULT 'provider',
  session_token_hash text NOT NULL,
  idp_source text NOT NULL DEFAULT 'keycloak',
  idp_session_id text,
  assurance_level text NOT NULL DEFAULT 'aal1',
  roles text[] NOT NULL DEFAULT '{}',
  facility_id uuid,
  workspace_id uuid,
  shift_id uuid,
  device_fingerprint text,
  device_type text,
  ip_address inet,
  step_up_completed_at timestamptz,
  step_up_method text,
  is_offline boolean NOT NULL DEFAULT false,
  offline_capability_token_hash text,
  purpose_of_use text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tshepo_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_sessions_service_only" ON public.tshepo_sessions
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_tshepo_sessions_actor ON public.tshepo_sessions (actor_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tshepo_sessions_token ON public.tshepo_sessions (session_token_hash);
CREATE INDEX IF NOT EXISTS idx_tshepo_sessions_active ON public.tshepo_sessions (expires_at) WHERE ended_at IS NULL;

-- ============================================================================
-- F3: AUTHORIZATION & POLICY DECISIONS (tshepo_authz)
-- Persistent store for PDP decisions (currently in-memory only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tshepo_policy_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  bundle_version text NOT NULL,
  policy_language text NOT NULL DEFAULT 'rego_sim',
  rules jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  activated_by uuid,
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bundle_version)
);

ALTER TABLE public.tshepo_policy_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_policy_bundles_service_only" ON public.tshepo_policy_bundles
  FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS public.tshepo_authz_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  pod_id text NOT NULL,
  request_id text NOT NULL,
  correlation_id text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  actor_roles text[] NOT NULL DEFAULT '{}',
  assurance_level text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  facility_id uuid,
  workspace_id uuid,
  shift_id uuid,
  purpose_of_use text,
  device_fingerprint text,
  consent_evaluated boolean NOT NULL DEFAULT false,
  consent_id uuid,
  consent_decision text,
  policy_bundle_version text,
  decision text NOT NULL,
  reason_codes text[] NOT NULL DEFAULT '{}',
  obligations jsonb NOT NULL DEFAULT '[]',
  ttl_seconds integer NOT NULL DEFAULT 0,
  decided_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tshepo_authz_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_authz_decisions_service_only" ON public.tshepo_authz_decisions
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_tshepo_authz_actor ON public.tshepo_authz_decisions (actor_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_tshepo_authz_resource ON public.tshepo_authz_decisions (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_tshepo_authz_correlation ON public.tshepo_authz_decisions (correlation_id);

-- ============================================================================
-- F4: CONSENT & PREFERENCE (tshepo_consent)
-- FHIR R4 Consent stored as opaque FHIR JSON
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tshepo_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  fhir_id text NOT NULL,
  fhir_resource jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active',
  scope_code text NOT NULL DEFAULT 'patient-privacy',
  patient_cpid text NOT NULL,
  grantor_type text NOT NULL DEFAULT 'patient',
  grantor_ref text NOT NULL,
  grantee_type text,
  grantee_ref text,
  purpose_of_use text[] NOT NULL DEFAULT '{}',
  action_codes text[] NOT NULL DEFAULT '{}',
  data_classes text[] NOT NULL DEFAULT '{}',
  period_start timestamptz,
  period_end timestamptz,
  provision_type text NOT NULL DEFAULT 'permit',
  delegation_allowed boolean NOT NULL DEFAULT false,
  delegation_depth integer NOT NULL DEFAULT 0,
  delegated_from_consent_id uuid REFERENCES public.tshepo_consents(id),
  version integer NOT NULL DEFAULT 1,
  previous_version_id uuid REFERENCES public.tshepo_consents(id),
  revoked_at timestamptz,
  revoked_by text,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tshepo_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_consents_service_only" ON public.tshepo_consents
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_tshepo_consents_patient ON public.tshepo_consents (patient_cpid, status);
CREATE INDEX IF NOT EXISTS idx_tshepo_consents_fhir ON public.tshepo_consents (fhir_id);
CREATE INDEX IF NOT EXISTS idx_tshepo_consents_active ON public.tshepo_consents (status, period_start, period_end);

-- ============================================================================
-- F5: PROVENANCE, AUDIT & NON-REPUDIATION (tshepo_audit)
-- Persistent hash-chained audit ledger (replaces in-memory ledger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tshepo_audit_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id text NOT NULL UNIQUE,
  tenant_id text NOT NULL,
  pod_id text NOT NULL,
  chain_sequence bigint NOT NULL,
  occurred_at timestamptz NOT NULL,
  request_id text NOT NULL,
  correlation_id text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL DEFAULT 'provider',
  actor_roles text[] NOT NULL DEFAULT '{}',
  actor_facility_id text,
  actor_assurance_level text,
  action text NOT NULL,
  decision text NOT NULL,
  reason_codes text[] NOT NULL DEFAULT '{}',
  policy_version text,
  resource_type text,
  resource_id text,
  resource_metadata jsonb,
  prev_hash text,
  record_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tshepo_audit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_audit_ledger_append_only" ON public.tshepo_audit_ledger
  FOR INSERT WITH CHECK (true);
CREATE POLICY "tshepo_audit_ledger_read_service" ON public.tshepo_audit_ledger
  FOR SELECT USING (false);

-- Unique chain sequence per tenant+pod
CREATE UNIQUE INDEX IF NOT EXISTS idx_tshepo_audit_chain
  ON public.tshepo_audit_ledger (tenant_id, pod_id, chain_sequence);
CREATE INDEX IF NOT EXISTS idx_tshepo_audit_correlation
  ON public.tshepo_audit_ledger (correlation_id);
CREATE INDEX IF NOT EXISTS idx_tshepo_audit_actor
  ON public.tshepo_audit_ledger (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_tshepo_audit_resource
  ON public.tshepo_audit_ledger (resource_type, resource_id);

-- Patient access history view (redacted — no PII, only CPIDs)
CREATE TABLE IF NOT EXISTS public.tshepo_patient_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  patient_cpid text NOT NULL,
  accessor_type text NOT NULL,
  accessor_ref text NOT NULL,
  accessor_role text,
  facility_ref text,
  action text NOT NULL,
  purpose_of_use text,
  resource_type text,
  resource_summary text,
  decision text NOT NULL,
  audit_ledger_id uuid REFERENCES public.tshepo_audit_ledger(id),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  is_break_glass boolean NOT NULL DEFAULT false,
  is_redacted boolean NOT NULL DEFAULT false,
  redaction_reason text
);

ALTER TABLE public.tshepo_patient_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_patient_access_service_only" ON public.tshepo_patient_access_log
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_tshepo_patient_access_cpid
  ON public.tshepo_patient_access_log (patient_cpid, occurred_at DESC);

-- ============================================================================
-- F6: OFFLINE TRUST CONTROLS (tshepo_offline)
-- Upgrade existing offline tables
-- ============================================================================

ALTER TABLE public.trust_layer_offline_tokens
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS pod_id text NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS capability_scope jsonb NOT NULL DEFAULT '{"actions":["read"],"resource_types":["patient_summary"]}',
  ADD COLUMN IF NOT EXISTS max_actions integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS actions_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reconciled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz;

-- ============================================================================
-- F7: SERVICE-TO-SERVICE TRUST & KEYS (tshepo_keys)
-- Upgrade existing signing keys table
-- ============================================================================

ALTER TABLE public.trust_layer_signing_keys
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS key_algorithm text NOT NULL DEFAULT 'Ed25519',
  ADD COLUMN IF NOT EXISTS key_usage text NOT NULL DEFAULT 'signing',
  ADD COLUMN IF NOT EXISTS jwks_kid text,
  ADD COLUMN IF NOT EXISTS rotation_schedule_hours integer NOT NULL DEFAULT 720,
  ADD COLUMN IF NOT EXISTS rotated_from_key_id uuid,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- JWKS endpoint cache
CREATE TABLE IF NOT EXISTS public.tshepo_jwks_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  jwks_document jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  key_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.tshepo_jwks_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tshepo_jwks_cache_service_only" ON public.tshepo_jwks_cache
  FOR ALL USING (false);

-- ============================================================================
-- BREAK-GLASS: Upgrade existing table
-- ============================================================================

ALTER TABLE public.trust_layer_break_glass
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS pod_id text NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS step_up_method text,
  ADD COLUMN IF NOT EXISTS step_up_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS elevated_token_hash text,
  ADD COLUMN IF NOT EXISTS elevated_token_scope jsonb,
  ADD COLUMN IF NOT EXISTS elevated_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_queue_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_outcome text,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS audit_ledger_id uuid;

CREATE INDEX IF NOT EXISTS idx_break_glass_review_queue
  ON public.trust_layer_break_glass (review_queue_status) WHERE review_queue_status = 'pending_review';

-- ============================================================================
-- DEVICE REGISTRY: For fingerprint tracking
-- ============================================================================

ALTER TABLE public.trust_layer_devices
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS fingerprint_method text NOT NULL DEFAULT 'ua_platform_uuid_hash',
  ADD COLUMN IF NOT EXISTS reputation_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_trusted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_facility_id uuid,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ============================================================================
-- MOSIP INDIRECT LINK: Upgrade
-- ============================================================================

ALTER TABLE public.trust_layer_mosip_links
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default-tenant',
  ADD COLUMN IF NOT EXISTS proofing_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS proofing_method text,
  ADD COLUMN IF NOT EXISTS proofing_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS proofing_assurance_level text,
  ADD COLUMN IF NOT EXISTS link_ref_encrypted text,
  ADD COLUMN IF NOT EXISTS link_ref_hash text;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get next chain sequence for audit ledger
CREATE OR REPLACE FUNCTION public.tshepo_next_chain_sequence(
  p_tenant_id text,
  p_pod_id text
) RETURNS bigint
LANGUAGE sql
SET search_path = public
AS $$
  SELECT COALESCE(MAX(chain_sequence), 0) + 1
  FROM public.tshepo_audit_ledger
  WHERE tenant_id = p_tenant_id AND pod_id = p_pod_id;
$$;

-- Get last audit hash for chain continuation
CREATE OR REPLACE FUNCTION public.tshepo_last_audit_hash(
  p_tenant_id text,
  p_pod_id text
) RETURNS text
LANGUAGE sql
SET search_path = public
AS $$
  SELECT record_hash
  FROM public.tshepo_audit_ledger
  WHERE tenant_id = p_tenant_id AND pod_id = p_pod_id
  ORDER BY chain_sequence DESC
  LIMIT 1;
$$;
