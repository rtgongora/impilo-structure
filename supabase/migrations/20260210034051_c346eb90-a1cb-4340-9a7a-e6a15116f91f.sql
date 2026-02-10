
-- ============================================================
-- VARAPI v1.1 — Provider Registry + Council Ops + Token/Bio
-- ============================================================

-- Tenant config
CREATE TABLE public.varapi_tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  registry_mode text NOT NULL DEFAULT 'SOR' CHECK (registry_mode IN ('SOR','EXTERNAL_SYNC','HYBRID')),
  zibo_validation_mode text NOT NULL DEFAULT 'LENIENT' CHECK (zibo_validation_mode IN ('STRICT','LENIENT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE public.varapi_tenant_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_tenant_config_all" ON public.varapi_tenant_config FOR ALL USING (true) WITH CHECK (true);

-- Councils
CREATE TABLE public.varapi_councils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  council_type_code text,
  mode text NOT NULL DEFAULT 'SOR' CHECK (mode IN ('SOR','EXTERNAL_SYNC','ORG_HR')),
  external_system_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_councils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_councils_all" ON public.varapi_councils FOR ALL USING (true) WITH CHECK (true);

-- Council users
CREATE TABLE public.varapi_council_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  council_id uuid NOT NULL REFERENCES public.varapi_councils(id),
  actor_id text NOT NULL,
  role text NOT NULL DEFAULT 'CLERK' CHECK (role IN ('ADMIN','REVIEWER','CLERK')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_council_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_council_users_all" ON public.varapi_council_users FOR ALL USING (true) WITH CHECK (true);

-- Core providers
CREATE TABLE public.varapi_providers (
  provider_public_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE','SUSPENDED','RETIRED','DECEASED','PENDING')),
  cadre_code text,
  primary_council_id uuid REFERENCES public.varapi_councils(id),
  profile_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_varapi_providers_tenant ON public.varapi_providers(tenant_id);
CREATE INDEX idx_varapi_providers_status ON public.varapi_providers(tenant_id, status);
ALTER TABLE public.varapi_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_providers_all" ON public.varapi_providers FOR ALL USING (true) WITH CHECK (true);

-- Provider contacts
CREATE TABLE public.varapi_provider_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('PHONE','EMAIL','ADDRESS')),
  value text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_provider_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_provider_contacts_all" ON public.varapi_provider_contacts FOR ALL USING (true) WITH CHECK (true);

-- Provider identifiers
CREATE TABLE public.varapi_provider_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  id_type text NOT NULL CHECK (id_type IN ('COUNCIL_REG_NO','HPA_NO','ORG_EMPLOYEE_NO','OTHER')),
  id_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_varapi_prov_ident ON public.varapi_provider_identifiers(tenant_id, id_type, id_value);
ALTER TABLE public.varapi_provider_identifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_provider_identifiers_all" ON public.varapi_provider_identifiers FOR ALL USING (true) WITH CHECK (true);

-- Provider specialties
CREATE TABLE public.varapi_provider_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  specialty_code text NOT NULL,
  subspecialty_code text,
  validation_status text NOT NULL DEFAULT 'UNVALIDATED' CHECK (validation_status IN ('VALID','UNVALIDATED','INVALID')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_provider_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_provider_specialties_all" ON public.varapi_provider_specialties FOR ALL USING (true) WITH CHECK (true);

-- Council affiliations
CREATE TABLE public.varapi_provider_council_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  council_id uuid NOT NULL REFERENCES public.varapi_councils(id),
  membership_status text NOT NULL DEFAULT 'ACTIVE',
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_provider_council_affiliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_provider_council_affiliations_all" ON public.varapi_provider_council_affiliations FOR ALL USING (true) WITH CHECK (true);

-- Licenses
CREATE TABLE public.varapi_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  council_id uuid REFERENCES public.varapi_councils(id),
  license_status text NOT NULL DEFAULT 'PENDING' CHECK (license_status IN ('VALID','EXPIRED','SUSPENDED','REVOKED','PENDING')),
  valid_from timestamptz,
  valid_to timestamptz,
  status_reason_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_varapi_licenses ON public.varapi_licenses(tenant_id, provider_public_id, license_status, valid_to);
ALTER TABLE public.varapi_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_licenses_all" ON public.varapi_licenses FOR ALL USING (true) WITH CHECK (true);

-- License events
CREATE TABLE public.varapi_license_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.varapi_licenses(id),
  tenant_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('ISSUED','RENEWED','SUSPENDED','REINSTATED','REVOKED','EXPIRED')),
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  payload_json jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.varapi_license_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_license_events_all" ON public.varapi_license_events FOR ALL USING (true) WITH CHECK (true);

-- Privileges
CREATE TABLE public.varapi_privileges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  tenant_id text NOT NULL,
  facility_id text,
  workspace_id text,
  scope_json jsonb DEFAULT '{}'::jsonb,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REVOKED','EXPIRED')),
  supervising_authority_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_varapi_privileges ON public.varapi_privileges(tenant_id, provider_public_id, facility_id, status);
ALTER TABLE public.varapi_privileges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_privileges_all" ON public.varapi_privileges FOR ALL USING (true) WITH CHECK (true);

-- Privilege approvals
CREATE TABLE public.varapi_privilege_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privilege_id uuid NOT NULL REFERENCES public.varapi_privileges(id),
  tenant_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVE','REJECT')),
  decided_by_actor_id text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  decision_reason text NOT NULL
);
ALTER TABLE public.varapi_privilege_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_privilege_approvals_all" ON public.varapi_privilege_approvals FOR ALL USING (true) WITH CHECK (true);

-- Provider tokens (secure; no plaintext)
CREATE TABLE public.varapi_provider_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  lookup_hash text NOT NULL,
  argon2_verifier text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ROTATED','REVOKED')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  last_used_at timestamptz,
  UNIQUE(lookup_hash)
);
ALTER TABLE public.varapi_provider_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_provider_tokens_all" ON public.varapi_provider_tokens FOR ALL USING (true) WITH CHECK (true);

-- Biometric bindings (reference only)
CREATE TABLE public.varapi_biometric_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  biometric_ref text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('BOUND','UNBOUND','PENDING')),
  bound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_biometric_bindings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_biometric_bindings_all" ON public.varapi_biometric_bindings FOR ALL USING (true) WITH CHECK (true);

-- Import runs
CREATE TABLE public.varapi_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  council_id uuid NOT NULL REFERENCES public.varapi_councils(id),
  source_type text NOT NULL CHECK (source_type IN ('CSV','REST','MANUAL')),
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
  started_at timestamptz,
  ended_at timestamptz,
  summary_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_import_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_import_runs_all" ON public.varapi_import_runs FOR ALL USING (true) WITH CHECK (true);

-- Reconciliation cases
CREATE TABLE public.varapi_reconciliation_cases (
  case_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  council_id uuid REFERENCES public.varapi_councils(id),
  case_type text NOT NULL CHECK (case_type IN ('DUPLICATE_PROVIDER','LICENSE_MISMATCH','IDENTIFIER_CONFLICT')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DECIDED')),
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_reconciliation_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_reconciliation_cases_all" ON public.varapi_reconciliation_cases FOR ALL USING (true) WITH CHECK (true);

-- Reconciliation actions
CREATE TABLE public.varapi_reconciliation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.varapi_reconciliation_cases(case_id),
  tenant_id text NOT NULL,
  decision text NOT NULL,
  decision_reason text NOT NULL,
  decided_by text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_reconciliation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_reconciliation_actions_all" ON public.varapi_reconciliation_actions FOR ALL USING (true) WITH CHECK (true);

-- Documents
CREATE TABLE public.varapi_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('PROVIDER','COUNCIL','CPD_EVENT')),
  owner_id text NOT NULL,
  storage_pointer text,
  doc_type text NOT NULL CHECK (doc_type IN ('CERTIFICATE','ID_DOC','CPD_EVIDENCE')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_documents_all" ON public.varapi_documents FOR ALL USING (true) WITH CHECK (true);

-- CPD cycles
CREATE TABLE public.varapi_cpd_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  cycle_year integer NOT NULL,
  required_points integer NOT NULL DEFAULT 0,
  achieved_points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_cpd_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_cpd_cycles_all" ON public.varapi_cpd_cycles FOR ALL USING (true) WITH CHECK (true);

-- CPD events
CREATE TABLE public.varapi_cpd_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider_public_id text NOT NULL REFERENCES public.varapi_providers(provider_public_id),
  event_type text NOT NULL CHECK (event_type IN ('COURSE','CONFERENCE','IN_SERVICE','OTHER')),
  points integer NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'SELF' CHECK (source IN ('MOODLE','SELF','COUNCIL')),
  evidence_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_cpd_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_cpd_events_all" ON public.varapi_cpd_events FOR ALL USING (true) WITH CHECK (true);

-- CPD evidence
CREATE TABLE public.varapi_cpd_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  cpd_event_id uuid NOT NULL REFERENCES public.varapi_cpd_events(id),
  document_id uuid REFERENCES public.varapi_documents(id),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','ACCEPTED','REJECTED')),
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_cpd_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_cpd_evidence_all" ON public.varapi_cpd_evidence FOR ALL USING (true) WITH CHECK (true);

-- Outbox events (prototype event log)
CREATE TABLE public.varapi_outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.varapi_outbox_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_outbox_events_all" ON public.varapi_outbox_events FOR ALL USING (true) WITH CHECK (true);

-- Code sets (ZIBO stub)
CREATE TABLE public.varapi_code_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_system text NOT NULL,
  code text NOT NULL,
  display text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(code_system, code)
);
ALTER TABLE public.varapi_code_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varapi_code_sets_all" ON public.varapi_code_sets FOR ALL USING (true) WITH CHECK (true);

-- Seed some code sets
INSERT INTO public.varapi_code_sets (code_system, code, display) VALUES
  ('cadre', 'DOCTOR', 'Medical Doctor'),
  ('cadre', 'NURSE', 'Registered Nurse'),
  ('cadre', 'PHARMACIST', 'Pharmacist'),
  ('cadre', 'PHYSIO', 'Physiotherapist'),
  ('cadre', 'DENTIST', 'Dentist'),
  ('cadre', 'MIDWIFE', 'Midwife'),
  ('cadre', 'CHW', 'Community Health Worker'),
  ('council_type', 'HPCZ', 'Health Professions Council'),
  ('council_type', 'GNC', 'General Nursing Council'),
  ('council_type', 'PCZ', 'Pharmacy Council'),
  ('specialty', 'GP', 'General Practice'),
  ('specialty', 'SURG', 'Surgery'),
  ('specialty', 'PAED', 'Paediatrics'),
  ('specialty', 'OBG', 'Obstetrics & Gynaecology'),
  ('specialty', 'PSYCH', 'Psychiatry'),
  ('specialty', 'ANES', 'Anaesthesia'),
  ('specialty', 'ORTH', 'Orthopaedics'),
  ('specialty', 'DERM', 'Dermatology');
