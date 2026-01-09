
-- =====================================================
-- FACILITY REGISTRY - Enhance existing facilities table + Add supporting tables
-- =====================================================

-- 1. Administrative Hierarchies (Geo-objects)
CREATE TABLE IF NOT EXISTS facility_admin_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES facility_admin_hierarchies(id),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  level_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  boundary_geojson JSONB,
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Facility Types (controlled vocabulary)
CREATE TABLE IF NOT EXISTS facility_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  level_of_care VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ownership Types
CREATE TABLE IF NOT EXISTS facility_ownership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Service Categories
CREATE TABLE IF NOT EXISTS facility_service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES facility_service_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add new columns to existing facilities table
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS legacy_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS dhis2_uid VARCHAR(50),
ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS facility_type_id UUID REFERENCES facility_types(id),
ADD COLUMN IF NOT EXISTS ownership_type_id UUID REFERENCES facility_ownership_types(id),
ADD COLUMN IF NOT EXISTS admin_hierarchy_id UUID REFERENCES facility_admin_hierarchies(id),
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS postal_address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS altitude INTEGER,
ADD COLUMN IF NOT EXISTS phone_alt VARCHAR(50),
ADD COLUMN IF NOT EXISTS fax VARCHAR(50),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'operational',
ADD COLUMN IF NOT EXISTS status_effective_date DATE,
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS is_24hr BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_electricity BOOLEAN,
ADD COLUMN IF NOT EXISTS has_water BOOLEAN,
ADD COLUMN IF NOT EXISTS has_internet BOOLEAN,
ADD COLUMN IF NOT EXISTS bed_count INTEGER,
ADD COLUMN IF NOT EXISTS cot_count INTEGER,
ADD COLUMN IF NOT EXISTS managing_org_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS managing_org_contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS license_expiry DATE,
ADD COLUMN IF NOT EXISTS accreditation_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS accreditation_body VARCHAR(255),
ADD COLUMN IF NOT EXISTS record_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS data_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_by UUID,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- 6. Facility Services Offered
CREATE TABLE IF NOT EXISTS facility_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  service_category_id UUID REFERENCES facility_service_categories(id),
  service_name VARCHAR(255) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  availability_notes TEXT,
  operating_days VARCHAR(50),
  operating_hours VARCHAR(100),
  capacity INTEGER,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Facility Identifier Crosswalks
CREATE TABLE IF NOT EXISTS facility_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  identifier_type VARCHAR(100) NOT NULL,
  identifier_value VARCHAR(255) NOT NULL,
  source_system VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(facility_id, identifier_type, identifier_value)
);

-- 8. Facility Change Requests
CREATE TABLE IF NOT EXISTS facility_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  request_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  justification TEXT,
  proposed_changes JSONB,
  merge_source_ids UUID[],
  split_target_count INTEGER,
  status VARCHAR(50) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'normal',
  attachments JSONB,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  assigned_to UUID,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_comments TEXT,
  clarification_request TEXT,
  clarification_response TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 9. Change Request Comments
CREATE TABLE IF NOT EXISTS facility_change_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES facility_change_requests(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL
);

-- 10. Reconciliation Sources
CREATE TABLE IF NOT EXISTS facility_reconciliation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  description TEXT,
  connection_config JSONB,
  field_mapping JSONB,
  last_sync_at TIMESTAMPTZ,
  sync_frequency VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 11. Reconciliation Jobs
CREATE TABLE IF NOT EXISTS facility_reconciliation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES facility_reconciliation_sources(id),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  matched_records INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 12. Reconciliation Matches
CREATE TABLE IF NOT EXISTS facility_reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES facility_reconciliation_jobs(id) ON DELETE CASCADE,
  source_record JSONB NOT NULL,
  candidate_facility_id UUID REFERENCES facilities(id),
  match_score DECIMAL(5, 4),
  match_reasons JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  decision_by UUID,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Facility History
CREATE TABLE IF NOT EXISTS facility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_type VARCHAR(50),
  change_summary TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Facility Audit Log
CREATE TABLE IF NOT EXISTS facility_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  notes TEXT
);

-- 15. Facility Registry Roles
CREATE TABLE IF NOT EXISTS facility_registry_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role VARCHAR(100) NOT NULL,
  scope_type VARCHAR(50),
  scope_id UUID,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_validate BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT false,
  can_reconcile BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE facility_admin_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_ownership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_change_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_reconciliation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_reconciliation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_registry_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for read access
CREATE POLICY "Authenticated can view hierarchies" ON facility_admin_hierarchies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view facility types" ON facility_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view ownership types" ON facility_ownership_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view service categories" ON facility_service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view facility services" ON facility_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view facility identifiers" ON facility_identifiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own change requests" ON facility_change_requests FOR SELECT TO authenticated USING (created_by = auth.uid() OR assigned_to = auth.uid());
CREATE POLICY "Users can view change request comments" ON facility_change_request_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view reconciliation sources" ON facility_reconciliation_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view reconciliation jobs" ON facility_reconciliation_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view reconciliation matches" ON facility_reconciliation_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view facility history" ON facility_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view audit logs" ON facility_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own facility roles" ON facility_registry_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Write policies
CREATE POLICY "Authenticated can create change requests" ON facility_change_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own draft change requests" ON facility_change_requests FOR UPDATE TO authenticated USING (created_by = auth.uid() AND status IN ('draft', 'clarification_needed'));
CREATE POLICY "Users can add comments" ON facility_change_request_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can insert facility services" ON facility_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update facility services" ON facility_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert facility identifiers" ON facility_identifiers FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_facility_code ON facilities(facility_code);
CREATE INDEX IF NOT EXISTS idx_facilities_workflow_status ON facilities(workflow_status);
CREATE INDEX IF NOT EXISTS idx_facilities_facility_type_id ON facilities(facility_type_id);
CREATE INDEX IF NOT EXISTS idx_facilities_admin_hierarchy_id ON facilities(admin_hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facility_services_facility ON facility_services(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_facility ON facility_identifiers(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_value ON facility_identifiers(identifier_value);
CREATE INDEX IF NOT EXISTS idx_change_requests_facility ON facility_change_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON facility_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_job ON facility_reconciliation_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_facility_history_facility ON facility_history(facility_id);
CREATE INDEX IF NOT EXISTS idx_admin_hierarchies_parent ON facility_admin_hierarchies(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_hierarchies_level ON facility_admin_hierarchies(level);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_facility_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facility_services_updated_at BEFORE UPDATE ON facility_services FOR EACH ROW EXECUTE FUNCTION update_facility_registry_updated_at();
CREATE TRIGGER update_facility_change_requests_updated_at BEFORE UPDATE ON facility_change_requests FOR EACH ROW EXECUTE FUNCTION update_facility_registry_updated_at();
CREATE TRIGGER update_facility_types_updated_at BEFORE UPDATE ON facility_types FOR EACH ROW EXECUTE FUNCTION update_facility_registry_updated_at();
CREATE TRIGGER update_facility_admin_hierarchies_updated_at BEFORE UPDATE ON facility_admin_hierarchies FOR EACH ROW EXECUTE FUNCTION update_facility_registry_updated_at();
