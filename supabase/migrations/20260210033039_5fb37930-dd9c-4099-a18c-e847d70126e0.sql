
-- ============================================================
-- TUSO v1.1 — Complete Schema
-- ============================================================

-- 0) TUSO Config (tenant-level)
CREATE TABLE public.tuso_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  gofr_enabled boolean NOT NULL DEFAULT false,
  gofr_sync_frequency text,
  gofr_last_sync_at timestamptz,
  zibo_mode text NOT NULL DEFAULT 'LENIENT' CHECK (zibo_mode IN ('STRICT','LENIENT')),
  emit_mode text NOT NULL DEFAULT 'DUAL' CHECK (emit_mode IN ('LEGACY_ONLY','V1_1_ONLY','DUAL')),
  spine_status text NOT NULL DEFAULT 'ONLINE' CHECK (spine_status IN ('ONLINE','OFFLINE','DEGRADED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);
ALTER TABLE public.tuso_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_config_all" ON public.tuso_config FOR ALL USING (true) WITH CHECK (true);

-- 1) Code Sets (ZIBO stub)
CREATE TABLE public.tuso_code_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_system text NOT NULL,
  code text NOT NULL,
  display text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_system, code)
);
ALTER TABLE public.tuso_code_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_code_sets_all" ON public.tuso_code_sets FOR ALL USING (true) WITH CHECK (true);

-- 2) Facilities
CREATE TABLE public.tuso_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED','MERGED','INACTIVE')),
  ownership text NOT NULL DEFAULT 'GOVT' CHECK (ownership IN ('GOVT','PRIVATE','FAITH','OTHER')),
  level text NOT NULL DEFAULT 'clinic',
  type_code text,
  parent_facility_id uuid REFERENCES public.tuso_facilities(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facilities_all" ON public.tuso_facilities FOR ALL USING (true) WITH CHECK (true);

-- 3) Facility Identifiers
CREATE TABLE public.tuso_facility_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  id_type text NOT NULL CHECK (id_type IN ('NATIONAL_CODE','GOFR_ID','OTHER')),
  id_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id_type, id_value)
);
ALTER TABLE public.tuso_facility_identifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_identifiers_all" ON public.tuso_facility_identifiers FOR ALL USING (true) WITH CHECK (true);

-- 4) Facility Geo
CREATE TABLE public.tuso_facility_geo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  lat double precision,
  lng double precision,
  district text,
  province text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text DEFAULT 'ZA',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_geo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_geo_all" ON public.tuso_facility_geo FOR ALL USING (true) WITH CHECK (true);

-- 5) Facility Contacts
CREATE TABLE public.tuso_facility_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  phone text,
  email text,
  primary_contact_name text,
  primary_contact_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_contacts_all" ON public.tuso_facility_contacts FOR ALL USING (true) WITH CHECK (true);

-- 6) Facility Capabilities
CREATE TABLE public.tuso_facility_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  capability_code text NOT NULL,
  department_code text,
  operating_hours_json jsonb,
  validation_status text NOT NULL DEFAULT 'UNVALIDATED' CHECK (validation_status IN ('VALID','UNVALIDATED','INVALID')),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_capabilities_all" ON public.tuso_facility_capabilities FOR ALL USING (true) WITH CHECK (true);

-- 7) Facility Readiness
CREATE TABLE public.tuso_facility_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  connectivity jsonb DEFAULT '{}',
  power jsonb DEFAULT '{}',
  devices jsonb DEFAULT '{}',
  ehr_readiness jsonb DEFAULT '{}',
  compliance_flags jsonb DEFAULT '{}',
  validation_status text NOT NULL DEFAULT 'UNVALIDATED' CHECK (validation_status IN ('VALID','UNVALIDATED','INVALID')),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_readiness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_readiness_all" ON public.tuso_facility_readiness FOR ALL USING (true) WITH CHECK (true);

-- 8) Facility Versions (history)
CREATE TABLE public.tuso_facility_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  version_no integer NOT NULL DEFAULT 1,
  changed_fields text[],
  before jsonb,
  after jsonb,
  changed_by_actor_id text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_versions_all" ON public.tuso_facility_versions FOR ALL USING (true) WITH CHECK (true);

-- 9) Facility Merges
CREATE TABLE public.tuso_facility_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  from_facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  to_facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','COMPLETED')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_facility_merges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_merges_all" ON public.tuso_facility_merges FOR ALL USING (true) WITH CHECK (true);

-- 10) Facility Closures
CREATE TABLE public.tuso_facility_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  reason text NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  closed_by text NOT NULL
);
ALTER TABLE public.tuso_facility_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_facility_closures_all" ON public.tuso_facility_closures FOR ALL USING (true) WITH CHECK (true);

-- 11) Workspaces
CREATE TABLE public.tuso_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  workspace_type_code text NOT NULL,
  queues_supported_json jsonb DEFAULT '[]',
  default_panels_json jsonb DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_workspaces_all" ON public.tuso_workspaces FOR ALL USING (true) WITH CHECK (true);

-- 12) Workspace Rules
CREATE TABLE public.tuso_workspace_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.tuso_workspaces(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  eligible_cadres_json jsonb DEFAULT '[]',
  required_privileges_json jsonb DEFAULT '[]',
  requires_override_for_assignment boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_workspace_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_workspace_rules_all" ON public.tuso_workspace_rules FOR ALL USING (true) WITH CHECK (true);

-- 13) Workspace Overrides
CREATE TABLE public.tuso_workspace_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.tuso_workspaces(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  facility_id uuid REFERENCES public.tuso_facilities(id),
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  override_reason text NOT NULL,
  override_payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_workspace_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_workspace_overrides_all" ON public.tuso_workspace_overrides FOR ALL USING (true) WITH CHECK (true);

-- 14) Provider Workspace Eligibility (stub)
CREATE TABLE public.tuso_provider_workspace_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider_id text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.tuso_workspaces(id) ON DELETE CASCADE,
  eligible boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_provider_workspace_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_pwe_all" ON public.tuso_provider_workspace_eligibility FOR ALL USING (true) WITH CHECK (true);

-- 15) Shifts
CREATE TABLE public.tuso_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  actor_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ENDED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_shifts_all" ON public.tuso_shifts FOR ALL USING (true) WITH CHECK (true);

-- 16) Shift Workspace Assignments
CREATE TABLE public.tuso_shift_workspace_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.tuso_shifts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.tuso_workspaces(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_shift_workspace_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_swa_all" ON public.tuso_shift_workspace_assignments FOR ALL USING (true) WITH CHECK (true);

-- 17) Resources
CREATE TABLE public.tuso_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id) ON DELETE CASCADE,
  type_code text NOT NULL,
  name text NOT NULL,
  capacity integer DEFAULT 1,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','IN_USE','MAINTENANCE','DECOMMISSIONED')),
  maintenance_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_resources_all" ON public.tuso_resources FOR ALL USING (true) WITH CHECK (true);

-- 18) Resource Calendars
CREATE TABLE public.tuso_resource_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.tuso_resources(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  recurring_rules_json jsonb DEFAULT '{}',
  timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_resource_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_resource_calendars_all" ON public.tuso_resource_calendars FOR ALL USING (true) WITH CHECK (true);

-- 19) Bookings
CREATE TABLE public.tuso_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  resource_id uuid NOT NULL REFERENCES public.tuso_resources(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  booked_by_actor_id text NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_bookings_all" ON public.tuso_bookings FOR ALL USING (true) WITH CHECK (true);
-- Exclusion constraint for booking overlap
CREATE INDEX idx_tuso_bookings_resource_time ON public.tuso_bookings (resource_id, start_at, end_at) WHERE status = 'CONFIRMED';

-- 20) Occupancy Snapshots
CREATE TABLE public.tuso_occupancy_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  occupied_beds integer NOT NULL DEFAULT 0,
  total_beds integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'PCT'
);
ALTER TABLE public.tuso_occupancy_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_occupancy_snapshots_all" ON public.tuso_occupancy_snapshots FOR ALL USING (true) WITH CHECK (true);

-- 21) Config — Tenant Defaults
CREATE TABLE public.tuso_config_tenant_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_config_tenant_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_ctd_all" ON public.tuso_config_tenant_defaults FOR ALL USING (true) WITH CHECK (true);

-- 22) Config — Facility Versions
CREATE TABLE public.tuso_config_facility_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.tuso_facilities(id),
  tenant_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_config_facility_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_cfv_all" ON public.tuso_config_facility_versions FOR ALL USING (true) WITH CHECK (true);

-- 23) Config — Workspace Overrides
CREATE TABLE public.tuso_config_workspace_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.tuso_workspaces(id),
  tenant_id text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_config_workspace_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_cwo_all" ON public.tuso_config_workspace_overrides FOR ALL USING (true) WITH CHECK (true);

-- 24) Telemetry Events
CREATE TABLE public.tuso_telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('PCT','OROS','OTHER')),
  facility_id uuid REFERENCES public.tuso_facilities(id),
  payload_json jsonb NOT NULL DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_telemetry_events_all" ON public.tuso_telemetry_events FOR ALL USING (true) WITH CHECK (true);

-- 25) Control Tower Alerts
CREATE TABLE public.tuso_control_tower_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id uuid REFERENCES public.tuso_facilities(id),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.tuso_control_tower_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_cta_all" ON public.tuso_control_tower_alerts FOR ALL USING (true) WITH CHECK (true);

-- 26) Alert Rules
CREATE TABLE public.tuso_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  rule_json jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_alert_rules_all" ON public.tuso_alert_rules FOR ALL USING (true) WITH CHECK (true);

-- 27) GOFR Sync Log
CREATE TABLE public.tuso_gofr_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('IMPORT','EXPORT')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','FAILED')),
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tuso_gofr_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tuso_gofr_sync_log_all" ON public.tuso_gofr_sync_log FOR ALL USING (true) WITH CHECK (true);

-- Seed default config
INSERT INTO public.tuso_config (tenant_id, gofr_enabled, zibo_mode, emit_mode, spine_status)
VALUES ('default-tenant', false, 'LENIENT', 'DUAL', 'ONLINE');

-- Seed some code sets for ZIBO stub
INSERT INTO public.tuso_code_sets (code_system, code, display) VALUES
  ('facility-type', 'CLINIC', 'Clinic'),
  ('facility-type', 'CHC', 'Community Health Centre'),
  ('facility-type', 'DISTRICT_HOSPITAL', 'District Hospital'),
  ('facility-type', 'PROVINCIAL_HOSPITAL', 'Provincial Hospital'),
  ('facility-type', 'CENTRAL_HOSPITAL', 'Central/Tertiary Hospital'),
  ('facility-type', 'SPECIALIZED', 'Specialized Facility'),
  ('capability', 'OPD', 'Outpatient Department'),
  ('capability', 'IPD', 'Inpatient Department'),
  ('capability', 'EMERGENCY', 'Emergency Services'),
  ('capability', 'MATERNITY', 'Maternity Services'),
  ('capability', 'THEATRE', 'Operating Theatre'),
  ('capability', 'PHARMACY', 'Pharmacy'),
  ('capability', 'LAB', 'Laboratory'),
  ('capability', 'RADIOLOGY', 'Radiology/Imaging'),
  ('workspace-type', 'CONSULTATION', 'Consultation Room'),
  ('workspace-type', 'TRIAGE', 'Triage Point'),
  ('workspace-type', 'DISPENSARY', 'Dispensary'),
  ('workspace-type', 'NURSING_STATION', 'Nursing Station'),
  ('workspace-type', 'ADMIN', 'Administrative Office'),
  ('resource-type', 'BED', 'Hospital Bed'),
  ('resource-type', 'ROOM', 'Room'),
  ('resource-type', 'THEATRE', 'Operating Theatre'),
  ('resource-type', 'EQUIPMENT', 'Medical Equipment'),
  ('resource-type', 'SERVICE_POINT', 'Service Point');
