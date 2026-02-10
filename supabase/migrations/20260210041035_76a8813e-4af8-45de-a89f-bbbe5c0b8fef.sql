
-- ============================================================
-- BUTANO v1.1 — Shared Health Record (SHR) Schema
-- PII-free FHIR resource storage + reconciliation + audit
-- ============================================================

-- Core FHIR resource storage
CREATE TABLE public.butano_fhir_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  fhir_id TEXT NOT NULL,
  subject_cpid TEXT NOT NULL,
  encounter_id TEXT,
  effective_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_provisional BOOLEAN NOT NULL DEFAULT false,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  resource_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, fhir_id)
);

CREATE INDEX idx_butano_fhir_tenant_subject ON public.butano_fhir_resources (tenant_id, subject_cpid, last_updated_at DESC);
CREATE INDEX idx_butano_fhir_tenant_type_subject ON public.butano_fhir_resources (tenant_id, resource_type, subject_cpid);
CREATE INDEX idx_butano_fhir_tenant_encounter ON public.butano_fhir_resources (tenant_id, encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX idx_butano_fhir_resource_json ON public.butano_fhir_resources USING GIN (resource_json);

ALTER TABLE public.butano_fhir_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_fhir_resources_all" ON public.butano_fhir_resources FOR ALL USING (true) WITH CHECK (true);

-- Document references (external binary pointers)
CREATE TABLE public.butano_document_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_cpid TEXT NOT NULL,
  documentreference_fhir_id TEXT NOT NULL,
  external_url TEXT NOT NULL,
  content_type TEXT,
  hash_sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, documentreference_fhir_id)
);

CREATE INDEX idx_butano_docref_subject ON public.butano_document_references (tenant_id, subject_cpid);

ALTER TABLE public.butano_document_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_docref_all" ON public.butano_document_references FOR ALL USING (true) WITH CHECK (true);

-- Subject mappings (O-CPID → CPID reconciliation)
CREATE TABLE public.butano_subject_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  from_subject TEXT NOT NULL,
  to_subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
  requested_by_actor_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  summary_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_butano_subject_map_tenant ON public.butano_subject_mappings (tenant_id, from_subject);

ALTER TABLE public.butano_subject_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_subject_mappings_all" ON public.butano_subject_mappings FOR ALL USING (true) WITH CHECK (true);

-- Reconciliation queue (job tracking)
CREATE TABLE public.butano_reconciliation_queue (
  job_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  from_ocpid TEXT NOT NULL,
  to_cpid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error TEXT
);

CREATE INDEX idx_butano_recon_tenant ON public.butano_reconciliation_queue (tenant_id, status);

ALTER TABLE public.butano_reconciliation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_recon_queue_all" ON public.butano_reconciliation_queue FOR ALL USING (true) WITH CHECK (true);

-- Outbox events (prototype event log)
CREATE TABLE public.butano_outbox_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_butano_outbox_tenant ON public.butano_outbox_events (tenant_id, created_at DESC);

ALTER TABLE public.butano_outbox_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_outbox_all" ON public.butano_outbox_events FOR ALL USING (true) WITH CHECK (true);

-- Tenant registry (diagnostic)
CREATE TABLE public.butano_tenants (
  tenant_id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.butano_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_tenants_all" ON public.butano_tenants FOR ALL USING (true) WITH CHECK (true);

-- Tenant config (ZIBO validation mode etc.)
CREATE TABLE public.butano_tenant_config (
  tenant_id TEXT NOT NULL PRIMARY KEY REFERENCES public.butano_tenants(tenant_id),
  zibo_validation_mode TEXT NOT NULL DEFAULT 'LENIENT' CHECK (zibo_validation_mode IN ('STRICT','LENIENT')),
  zibo_endpoint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.butano_tenant_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_tenant_config_all" ON public.butano_tenant_config FOR ALL USING (true) WITH CHECK (true);

-- PII violation log (never stores the PII itself, only metadata)
CREATE TABLE public.butano_pii_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  resource_type TEXT,
  fhir_id TEXT,
  violation_type TEXT NOT NULL,
  violation_paths TEXT[] NOT NULL DEFAULT '{}',
  actor_id TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_butano_pii_violations_tenant ON public.butano_pii_violations (tenant_id, created_at DESC);

ALTER TABLE public.butano_pii_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "butano_pii_violations_all" ON public.butano_pii_violations FOR ALL USING (true) WITH CHECK (true);

-- Seed default tenant
INSERT INTO public.butano_tenants (tenant_id, name) VALUES ('default-tenant', 'Default Tenant');
INSERT INTO public.butano_tenant_config (tenant_id, zibo_validation_mode) VALUES ('default-tenant', 'LENIENT');
