
-- =============================================================
-- MSIKA CORE — Products & Services Registry
-- =============================================================

CREATE SCHEMA IF NOT EXISTS msika;
CREATE SCHEMA IF NOT EXISTS msika_imp;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS intents;

-- A) Catalogs
CREATE TABLE msika.catalogs (
  catalog_id text PRIMARY KEY,
  scope text NOT NULL CHECK (scope IN ('NATIONAL','TENANT')),
  tenant_id text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED','PUBLISHED')),
  version text NOT NULL DEFAULT '0.1.0',
  parent_catalog_id text,
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  checksum_sha256 text
);
CREATE INDEX idx_msika_catalogs_scope_status ON msika.catalogs(scope, status);
CREATE INDEX idx_msika_catalogs_tenant_status ON msika.catalogs(tenant_id, status);

-- B) Catalog Items
CREATE TABLE msika.catalog_items (
  item_id text PRIMARY KEY,
  catalog_id text NOT NULL REFERENCES msika.catalogs(catalog_id),
  kind text NOT NULL CHECK (kind IN ('PRODUCT','SERVICE','ORDERABLE','CHARGEABLE','CAPABILITY_FACILITY','CAPABILITY_PROVIDER')),
  canonical_code text NOT NULL,
  display_name text NOT NULL,
  description text,
  synonyms text[],
  tags text[],
  restrictions jsonb DEFAULT '{}'::jsonb,
  zibo_bindings jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  lock_version int NOT NULL DEFAULT 0,
  fts_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(catalog_id, canonical_code)
);
CREATE INDEX idx_msika_items_catalog_kind ON msika.catalog_items(catalog_id, kind);
CREATE INDEX idx_msika_items_restrictions ON msika.catalog_items USING GIN(restrictions);
CREATE INDEX idx_msika_items_tags ON msika.catalog_items USING GIN(tags);
CREATE INDEX idx_msika_items_zibo ON msika.catalog_items USING GIN(zibo_bindings);
CREATE INDEX idx_msika_items_fts ON msika.catalog_items USING GIN(fts_vector);

-- Trigger to maintain FTS vector
CREATE OR REPLACE FUNCTION msika.update_catalog_item_fts()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'msika' AS $$
BEGIN
  NEW.fts_vector :=
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.synonyms, ' '), '')), 'B');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_catalog_items_fts
  BEFORE INSERT OR UPDATE OF display_name, synonyms ON msika.catalog_items
  FOR EACH ROW EXECUTE FUNCTION msika.update_catalog_item_fts();

-- B2) Product details
CREATE TABLE msika.product_details (
  item_id text PRIMARY KEY REFERENCES msika.catalog_items(item_id) ON DELETE CASCADE,
  form text, strength text, route text, uom text, pack_size int,
  barcode_gtin text,
  batch_tracked boolean DEFAULT false, expiry_tracked boolean DEFAULT false,
  cold_chain boolean DEFAULT false, controlled boolean DEFAULT false
);

-- B3) Service details
CREATE TABLE msika.service_details (
  item_id text PRIMARY KEY REFERENCES msika.catalog_items(item_id) ON DELETE CASCADE,
  service_category text, duration_minutes int,
  requires_schedule boolean DEFAULT false, requires_referral boolean DEFAULT false,
  facility_level_min text, specialty_required text
);

-- B4) Orderable details
CREATE TABLE msika.orderable_details (
  item_id text PRIMARY KEY REFERENCES msika.catalog_items(item_id) ON DELETE CASCADE,
  order_type text CHECK (order_type IN ('LAB','IMAGING','PHARMACY','PROCEDURE','OTHER')),
  target_kind text CHECK (target_kind IN ('PRODUCT','SERVICE')),
  target_item_id text, specimen_type text, body_site text,
  instructions_template text, critical_result_policy jsonb
);

-- B5) Chargeable details
CREATE TABLE msika.chargeable_details (
  item_id text PRIMARY KEY REFERENCES msika.catalog_items(item_id) ON DELETE CASCADE,
  target_kind text CHECK (target_kind IN ('PRODUCT','SERVICE')),
  target_item_id text, tariff_code text,
  pricing_refs jsonb DEFAULT '{}'::jsonb, cost_method_ref text,
  billable_rules jsonb DEFAULT '{}'::jsonb
);

-- B6) Capability links
CREATE TABLE msika.capability_links (
  id text PRIMARY KEY,
  item_id text NOT NULL REFERENCES msika.catalog_items(item_id) ON DELETE CASCADE,
  capability_type text NOT NULL CHECK (capability_type IN ('FACILITY','PROVIDER')),
  applies_to_scope jsonb DEFAULT '{}'::jsonb
);

-- C) External sources + mapping
CREATE TABLE msika.external_sources (
  source_id text PRIMARY KEY, tenant_id text, name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('REST','CSV','KAFKA')),
  config_encrypted jsonb DEFAULT '{}'::jsonb, enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE msika.external_mappings (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES msika.external_sources(source_id),
  external_code text NOT NULL,
  internal_item_id text NOT NULL REFERENCES msika.catalog_items(item_id),
  map_type text NOT NULL CHECK (map_type IN ('EXACT','NARROW','BROAD')),
  confidence numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewer_actor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(source_id, external_code)
);
CREATE INDEX idx_msika_mappings_status ON msika.external_mappings(status, confidence DESC);

-- D) Imports
CREATE TABLE msika_imp.import_jobs (
  job_id text PRIMARY KEY, source_id text, tenant_id text,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNING','FAILED','COMPLETED')),
  stats jsonb DEFAULT '{}'::jsonb, error_report_doc_id text,
  created_by_actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

CREATE TABLE msika_imp.import_staging_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL REFERENCES msika_imp.import_jobs(job_id),
  row_num int NOT NULL, raw jsonb NOT NULL, normalized_key text,
  dedup_reason text, validation_errors jsonb, suggested_internal_item_id text,
  status text NOT NULL DEFAULT 'STAGED' CHECK (status IN ('STAGED','INVALID','DEDUPED','MAPPED','PENDING_REVIEW','APPROVED','REJECTED'))
);
CREATE INDEX idx_msika_staging_job_status ON msika_imp.import_staging_items(job_id, status);
CREATE INDEX idx_msika_staging_normkey ON msika_imp.import_staging_items(normalized_key);

-- E) Audit + intents
CREATE TABLE IF NOT EXISTS audit.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text,
  action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
  actor_id text NOT NULL, purpose_of_use text, correlation_id text,
  details jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intents.event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text,
  event_type text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb, correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE msika.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.product_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.service_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.orderable_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.chargeable_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.capability_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.external_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika.external_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_imp.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE msika_imp.import_staging_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents.event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON msika.catalogs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.catalog_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.product_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.service_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.orderable_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.chargeable_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.capability_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.external_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika.external_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika_imp.import_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON msika_imp.import_staging_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_audit" ON audit.audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_intents" ON intents.event_log FOR ALL USING (true) WITH CHECK (true);
