
-- ============================================================
-- VITO v1.1 Reference Tables
-- Executable brief for the human-led dev stream
-- ============================================================

-- 1. vito_config: emit_mode + spine_status
CREATE TABLE IF NOT EXISTS public.vito_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  config_key text NOT NULL,
  config_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  UNIQUE(tenant_id, config_key)
);

-- Seed default config
INSERT INTO public.vito_config (tenant_id, config_key, config_value) VALUES
  ('default-tenant', 'emit_mode', 'DUAL'),
  ('default-tenant', 'spine_status', 'ONLINE')
ON CONFLICT (tenant_id, config_key) DO NOTHING;

ALTER TABLE public.vito_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_config_select" ON public.vito_config FOR SELECT USING (true);
CREATE POLICY "vito_config_update" ON public.vito_config FOR UPDATE USING (true);

-- 2. vito_patients: identity refs only (no PII)
CREATE TABLE IF NOT EXISTS public.vito_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  health_id text NOT NULL,
  crid text,
  cpid text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  UNIQUE(tenant_id, health_id)
);

ALTER TABLE public.vito_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_patients_select" ON public.vito_patients FOR SELECT USING (true);
CREATE POLICY "vito_patients_insert" ON public.vito_patients FOR INSERT WITH CHECK (true);
CREATE POLICY "vito_patients_update" ON public.vito_patients FOR UPDATE USING (true);

-- 3. vito_patient_aliases: merge alias tracking
CREATE TABLE IF NOT EXISTS public.vito_patient_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  from_health_id text NOT NULL,
  to_health_id text NOT NULL,
  alias_type text NOT NULL DEFAULT 'merge',
  merge_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vito_patient_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_patient_aliases_select" ON public.vito_patient_aliases FOR SELECT USING (true);
CREATE POLICY "vito_patient_aliases_insert" ON public.vito_patient_aliases FOR INSERT WITH CHECK (true);

-- 4. vito_merge_requests: federation-guarded merge queue
CREATE TABLE IF NOT EXISTS public.vito_merge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  survivor_health_id text NOT NULL,
  merged_health_ids text[] NOT NULL DEFAULT '{}',
  requested_by text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vito_merge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_merge_requests_select" ON public.vito_merge_requests FOR SELECT USING (true);
CREATE POLICY "vito_merge_requests_insert" ON public.vito_merge_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "vito_merge_requests_update" ON public.vito_merge_requests FOR UPDATE USING (true);

-- 5. vito_idempotency_keys: per-request deduplication
CREATE TABLE IF NOT EXISTS public.vito_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  actor_id text NOT NULL,
  endpoint text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  response_status int,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(tenant_id, idempotency_key)
);

ALTER TABLE public.vito_idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_idempotency_keys_select" ON public.vito_idempotency_keys FOR SELECT USING (true);
CREATE POLICY "vito_idempotency_keys_insert" ON public.vito_idempotency_keys FOR INSERT WITH CHECK (true);

-- 6. vito_event_envelopes: v1.1 event store
CREATE TABLE IF NOT EXISTS public.vito_event_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_version int NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  producer text NOT NULL DEFAULT 'vito-service',
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  tenant_id text NOT NULL,
  pod_id text NOT NULL,
  request_id text NOT NULL,
  correlation_id text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  purpose_of_use text NOT NULL,
  subject_type text NOT NULL DEFAULT 'patient',
  subject_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vito_events_correlation ON public.vito_event_envelopes(correlation_id);
CREATE INDEX IF NOT EXISTS idx_vito_events_request ON public.vito_event_envelopes(request_id);
CREATE INDEX IF NOT EXISTS idx_vito_events_type ON public.vito_event_envelopes(event_type);
CREATE INDEX IF NOT EXISTS idx_vito_events_tenant ON public.vito_event_envelopes(tenant_id);

ALTER TABLE public.vito_event_envelopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_event_envelopes_select" ON public.vito_event_envelopes FOR SELECT USING (true);
CREATE POLICY "vito_event_envelopes_insert" ON public.vito_event_envelopes FOR INSERT WITH CHECK (true);

-- 7. vito_audit_log: lightweight audit with opaque refs
CREATE TABLE IF NOT EXISTS public.vito_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  action text NOT NULL,
  decision text NOT NULL DEFAULT 'SYSTEM',
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  purpose_of_use text,
  resource_type text,
  resource_id text,
  request_id text NOT NULL,
  correlation_id text NOT NULL,
  pod_id text,
  facility_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vito_audit_correlation ON public.vito_audit_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_vito_audit_request ON public.vito_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_vito_audit_actor ON public.vito_audit_log(actor_id);

ALTER TABLE public.vito_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vito_audit_log_select" ON public.vito_audit_log FOR SELECT USING (true);
CREATE POLICY "vito_audit_log_insert" ON public.vito_audit_log FOR INSERT WITH CHECK (true);
