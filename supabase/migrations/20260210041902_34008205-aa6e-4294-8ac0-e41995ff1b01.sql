
-- ============================================================
-- LANDELA + CREDENTIALS SUITE — v1.1 Schema Migration
-- Canonical document metadata, credentials, cards, share, audit
-- ============================================================

-- ===================== LANDELA ADAPTER LAYER =====================

-- Canonical document metadata (dual-mode: LANDELA / INTERNAL)
CREATE TABLE IF NOT EXISTS public.suite_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('CLIENT','PROVIDER','FACILITY','ENCOUNTER','REFERRAL','OTHER')),
  subject_id text NOT NULL,
  document_type_code text NOT NULL,
  source text NOT NULL CHECK (source IN ('SCANNED','UPLOADED','GENERATED')),
  issuer text,
  created_by_actor_id text NOT NULL,
  confidentiality text NOT NULL DEFAULT 'NORMAL' CHECK (confidentiality IN ('NORMAL','RESTRICTED','HIGHLY_RESTRICTED')),
  hash_sha256 text,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  storage_provider text NOT NULL DEFAULT 'INTERNAL' CHECK (storage_provider IN ('LANDELA','INTERNAL')),
  storage_object_key text,
  external_ref text,
  lifecycle_state text NOT NULL DEFAULT 'ACTIVE' CHECK (lifecycle_state IN ('ACTIVE','REVOKED','SUPERSEDED','ARCHIVED','DELETED')),
  retention_policy_id text,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suite_docs_subject ON public.suite_documents (tenant_id, subject_type, subject_id);
CREATE INDEX idx_suite_docs_type ON public.suite_documents (tenant_id, document_type_code);
CREATE INDEX idx_suite_docs_lifecycle ON public.suite_documents (tenant_id, lifecycle_state);
CREATE INDEX idx_suite_docs_created ON public.suite_documents (tenant_id, created_at DESC);
CREATE INDEX idx_suite_docs_hash ON public.suite_documents (tenant_id, hash_sha256);

ALTER TABLE public.suite_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_documents_all" ON public.suite_documents FOR ALL USING (true) WITH CHECK (true);

-- Document versions
CREATE TABLE IF NOT EXISTS public.suite_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.suite_documents(id),
  version_number int NOT NULL DEFAULT 1,
  supersedes_version_id uuid REFERENCES public.suite_document_versions(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suite_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_doc_versions_all" ON public.suite_document_versions FOR ALL USING (true) WITH CHECK (true);

-- Signed links
CREATE TABLE IF NOT EXISTS public.suite_signed_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.suite_documents(id),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL DEFAULT 'DOWNLOAD' CHECK (scope IN ('DOWNLOAD','VIEW','VERIFY')),
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

ALTER TABLE public.suite_signed_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_signed_links_all" ON public.suite_signed_links FOR ALL USING (true) WITH CHECK (true);

-- High-risk approval queue
CREATE TABLE IF NOT EXISTS public.suite_high_risk_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('REVOKE','SUPERSEDE','DELETE','SHARE_CREATE','CARD_ISSUE')),
  document_id uuid REFERENCES public.suite_documents(id),
  credential_id uuid,
  print_job_id uuid,
  requested_by_actor_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decided_by_actor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

ALTER TABLE public.suite_high_risk_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_hrq_all" ON public.suite_high_risk_queue FOR ALL USING (true) WITH CHECK (true);

-- ===================== CREDENTIALS =====================

CREATE TABLE IF NOT EXISTS public.suite_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('CLIENT','PROVIDER','FACILITY')),
  subject_id text NOT NULL,
  credential_type text NOT NULL CHECK (credential_type IN ('LICENSE','CERTIFICATE','CARD_ASSERTION','OTHER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED','EXPIRED','SUPERSEDED')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  issuer text NOT NULL DEFAULT 'SYSTEM',
  qr_ref_token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  signing_kid text,
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suite_creds_subject ON public.suite_credentials (tenant_id, subject_type, subject_id);
CREATE INDEX idx_suite_creds_qr ON public.suite_credentials (qr_ref_token);

ALTER TABLE public.suite_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_creds_all" ON public.suite_credentials FOR ALL USING (true) WITH CHECK (true);

-- Credential-document links
CREATE TABLE IF NOT EXISTS public.suite_credential_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES public.suite_credentials(id),
  landela_document_id uuid NOT NULL REFERENCES public.suite_documents(id),
  kind text NOT NULL DEFAULT 'PDF' CHECK (kind IN ('PDF','VC_JSON','OTHER'))
);

ALTER TABLE public.suite_credential_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_cred_docs_all" ON public.suite_credential_documents FOR ALL USING (true) WITH CHECK (true);

-- Revocations
CREATE TABLE IF NOT EXISTS public.suite_revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES public.suite_credentials(id),
  reason text NOT NULL,
  revoked_by_actor_id text NOT NULL,
  revoked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suite_revocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_revocations_all" ON public.suite_revocations FOR ALL USING (true) WITH CHECK (true);

-- ===================== CARD PRINT JOBS =====================

CREATE TABLE IF NOT EXISTS public.suite_print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('PROVIDER_CARD','CLIENT_CARD','FACILITY_BADGE','SHARE_SLIP_PDF','EMERGENCY_CAPSULE_PDF')),
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','RENDERED','PRINTED','COLLECTED','FAILED')),
  requested_by_actor_id text NOT NULL,
  facility_id text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  output_landela_document_id uuid REFERENCES public.suite_documents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suite_print_subject ON public.suite_print_jobs (tenant_id, subject_type, subject_id);

ALTER TABLE public.suite_print_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_print_all" ON public.suite_print_jobs FOR ALL USING (true) WITH CHECK (true);

-- Printers
CREATE TABLE IF NOT EXISTS public.suite_printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  driver_type text NOT NULL DEFAULT 'DEV_FILE' CHECK (driver_type IN ('DEV_FILE','NETWORK_INTERFACE')),
  config_json jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.suite_printers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_printers_all" ON public.suite_printers FOR ALL USING (true) WITH CHECK (true);

-- ===================== SHARE / DELEGATED PICKUP =====================

CREATE TABLE IF NOT EXISTS public.suite_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('DOCUMENT','BUNDLE')),
  target_ref text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  proof_method text NOT NULL DEFAULT 'OTP' CHECK (proof_method IN ('OTP','QR','BOTH')),
  otp_hash text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLAIMED','EXPIRED','REVOKED')),
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_by_actor_id text
);

CREATE INDEX idx_suite_share_token ON public.suite_share_links (token);

ALTER TABLE public.suite_share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_share_all" ON public.suite_share_links FOR ALL USING (true) WITH CHECK (true);

-- Share events
CREATE TABLE IF NOT EXISTS public.suite_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid NOT NULL REFERENCES public.suite_share_links(id),
  event_type text NOT NULL CHECK (event_type IN ('CREATED','OTP_SENT','CLAIM_ATTEMPT','CLAIMED','EXPIRED','REVOKED')),
  actor_id text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  meta_json jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.suite_share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_share_events_all" ON public.suite_share_events FOR ALL USING (true) WITH CHECK (true);

-- ===================== AUDIT EVENTS =====================

CREATE TABLE IF NOT EXISTS public.suite_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  subject_type text,
  subject_id text,
  resource_type text,
  resource_id text,
  actor_id text NOT NULL,
  actor_type text,
  purpose_of_use text,
  correlation_id text,
  device_fingerprint text,
  facility_id text,
  workspace_id text,
  shift_id text,
  decision_id text,
  break_glass boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  details_json jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_suite_audit_tenant ON public.suite_audit_events (tenant_id, created_at DESC);
CREATE INDEX idx_suite_audit_subject ON public.suite_audit_events (tenant_id, subject_type, subject_id);
CREATE INDEX idx_suite_audit_resource ON public.suite_audit_events (tenant_id, resource_type, resource_id);
CREATE INDEX idx_suite_audit_correlation ON public.suite_audit_events (correlation_id);

ALTER TABLE public.suite_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_audit_all" ON public.suite_audit_events FOR ALL USING (true) WITH CHECK (true);

-- ===================== TENANT CONFIG (document mode) =====================

CREATE TABLE IF NOT EXISTS public.suite_tenant_config (
  tenant_id text PRIMARY KEY,
  document_mode text NOT NULL DEFAULT 'INTERNAL' CHECK (document_mode IN ('LANDELA','INTERNAL')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suite_tenant_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suite_tenant_config_all" ON public.suite_tenant_config FOR ALL USING (true) WITH CHECK (true);

-- Seed default dev tenant
INSERT INTO public.suite_tenant_config (tenant_id, document_mode) VALUES ('dev-tenant', 'INTERNAL') ON CONFLICT DO NOTHING;

-- ===================== UPDATED_AT TRIGGER =====================

CREATE OR REPLACE FUNCTION public.suite_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER suite_documents_updated_at BEFORE UPDATE ON public.suite_documents FOR EACH ROW EXECUTE FUNCTION public.suite_set_updated_at();
CREATE TRIGGER suite_print_jobs_updated_at BEFORE UPDATE ON public.suite_print_jobs FOR EACH ROW EXECUTE FUNCTION public.suite_set_updated_at();
CREATE TRIGGER suite_tenant_config_updated_at BEFORE UPDATE ON public.suite_tenant_config FOR EACH ROW EXECUTE FUNCTION public.suite_set_updated_at();
