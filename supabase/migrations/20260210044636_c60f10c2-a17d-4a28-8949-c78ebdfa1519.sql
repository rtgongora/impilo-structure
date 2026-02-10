
-- ZIBO Terminology Service v1.1 Schema
-- Core artifact store (versioned + immutable once published)
CREATE TABLE IF NOT EXISTS zibo_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'NATIONAL',
  fhir_type text NOT NULL CHECK (fhir_type IN ('CodeSystem','ValueSet','ConceptMap','NamingSystem','StructureDefinition','ImplementationGuide','Bundle','Parameters')),
  canonical_url text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED','RETIRED')),
  content_json jsonb NOT NULL DEFAULT '{}',
  hash text,
  created_by_actor_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_zibo_artifacts_canonical ON zibo_artifacts (tenant_id, canonical_url, version);
CREATE INDEX idx_zibo_artifacts_status ON zibo_artifacts (tenant_id, status);
CREATE INDEX idx_zibo_artifacts_created ON zibo_artifacts (created_at DESC);
ALTER TABLE zibo_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_artifacts_all" ON zibo_artifacts FOR ALL USING (true) WITH CHECK (true);

-- Packs
CREATE TABLE IF NOT EXISTS zibo_packs (
  pack_id text NOT NULL,
  tenant_id text NOT NULL DEFAULT 'NATIONAL',
  name text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED','RETIRED')),
  manifest_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pack_id, version, tenant_id)
);
CREATE INDEX idx_zibo_packs_status ON zibo_packs (tenant_id, status);
ALTER TABLE zibo_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_packs_all" ON zibo_packs FOR ALL USING (true) WITH CHECK (true);

-- Pack artifacts (join table)
CREATE TABLE IF NOT EXISTS zibo_pack_artifacts (
  pack_id text NOT NULL,
  pack_version text NOT NULL,
  tenant_id text NOT NULL DEFAULT 'NATIONAL',
  artifact_id uuid NOT NULL REFERENCES zibo_artifacts(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, pack_version, tenant_id, artifact_id)
);
ALTER TABLE zibo_pack_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_pack_artifacts_all" ON zibo_pack_artifacts FOR ALL USING (true) WITH CHECK (true);

-- Assignments (packs -> tenant/facility/workspace + policy mode)
CREATE TABLE IF NOT EXISTS zibo_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('TENANT','FACILITY','WORKSPACE')),
  scope_id text NOT NULL,
  pack_tenant_id text NOT NULL DEFAULT 'NATIONAL',
  pack_id text NOT NULL,
  pack_version text NOT NULL,
  policy_mode text NOT NULL DEFAULT 'LENIENT' CHECK (policy_mode IN ('STRICT','LENIENT')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_zibo_assignments_scope ON zibo_assignments (tenant_id, scope_type, scope_id);
ALTER TABLE zibo_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_assignments_all" ON zibo_assignments FOR ALL USING (true) WITH CHECK (true);

-- Mapping index for fast lookups
CREATE TABLE IF NOT EXISTS zibo_mappings_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'NATIONAL',
  source_system text NOT NULL,
  source_code text NOT NULL,
  target_system text NOT NULL,
  target_code text NOT NULL,
  conceptmap_ref jsonb,
  confidence numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_zibo_mappings_source ON zibo_mappings_index (source_system, source_code);
CREATE INDEX idx_zibo_mappings_target ON zibo_mappings_index (target_system, target_code);
ALTER TABLE zibo_mappings_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_mappings_all" ON zibo_mappings_index FOR ALL USING (true) WITH CHECK (true);

-- Validation jobs
CREATE TABLE IF NOT EXISTS zibo_validation_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text,
  requested_policy_mode text CHECK (requested_policy_mode IS NULL OR requested_policy_mode IN ('STRICT','LENIENT')),
  payload_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
  result_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE zibo_validation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_validation_jobs_all" ON zibo_validation_jobs FOR ALL USING (true) WITH CHECK (true);

-- Validation logs
CREATE TABLE IF NOT EXISTS zibo_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text,
  service_name text NOT NULL DEFAULT 'unknown',
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARN','ERROR')),
  issue_code text NOT NULL,
  canonical_url text,
  version text,
  details_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_zibo_validation_logs_tenant ON zibo_validation_logs (tenant_id, created_at DESC);
CREATE INDEX idx_zibo_validation_logs_facility ON zibo_validation_logs (tenant_id, facility_id, created_at DESC);
ALTER TABLE zibo_validation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zibo_validation_logs_all" ON zibo_validation_logs FOR ALL USING (true) WITH CHECK (true);
