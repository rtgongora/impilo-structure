-- =============================================
-- LIMS COMPREHENSIVE SCHEMA ENHANCEMENT
-- Per FHIR R4, LOINC, SNOMED CT, UCUM standards
-- =============================================

-- 1. LAB TEST CATALOG (LOINC-aligned)
CREATE TABLE public.lab_test_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_code TEXT NOT NULL UNIQUE,
  loinc_code TEXT,
  test_name TEXT NOT NULL,
  short_name TEXT,
  category TEXT NOT NULL,
  specimen_type TEXT NOT NULL,
  specimen_snomed_code TEXT,
  department TEXT,
  result_type TEXT DEFAULT 'numeric' CHECK (result_type IN ('numeric', 'categorical', 'text', 'panel')),
  result_unit TEXT,
  ucum_unit TEXT,
  reference_range_low DECIMAL,
  reference_range_high DECIMAL,
  critical_low DECIMAL,
  critical_high DECIMAL,
  reference_range_text TEXT,
  is_panel BOOLEAN DEFAULT false,
  panel_components UUID[],
  turnaround_time_hours INTEGER DEFAULT 24,
  requires_fasting BOOLEAN DEFAULT false,
  collection_instructions TEXT,
  stability_hours INTEGER,
  temperature_requirement TEXT,
  is_orderable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  gender_specific TEXT CHECK (gender_specific IN ('male', 'female', NULL)),
  age_min_years INTEGER,
  age_max_years INTEGER,
  facility_availability UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. LAB REJECTION CODES (standardized)
CREATE TABLE public.lab_rejection_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('specimen', 'order', 'transport', 'technical', 'other')),
  requires_recollection BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENHANCE LAB ORDERS TABLE
ALTER TABLE public.lab_orders 
  ADD COLUMN IF NOT EXISTS ordering_facility_id UUID REFERENCES public.facilities(id),
  ADD COLUMN IF NOT EXISTS performing_lab_id UUID REFERENCES public.facilities(id),
  ADD COLUMN IF NOT EXISTS clinical_indication TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis_code TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis_system TEXT DEFAULT 'icd-11',
  ADD COLUMN IF NOT EXISTS infection_control_flags TEXT[],
  ADD COLUMN IF NOT EXISTS biosafety_level TEXT,
  ADD COLUMN IF NOT EXISTS is_stat BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by UUID,
  ADD COLUMN IF NOT EXISTS collection_instructions TEXT,
  ADD COLUMN IF NOT EXISTS routing_reason TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID;

-- 4. LAB ORDER TESTS (junction table for order → tests)
CREATE TABLE public.lab_order_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  test_catalog_id UUID NOT NULL REFERENCES public.lab_test_catalog(id),
  specimen_id UUID REFERENCES public.specimens(id),
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'collected', 'received', 'in_progress', 'resulted', 'verified', 'released', 'cancelled', 'rejected')),
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  rejection_code_id UUID REFERENCES public.lab_rejection_codes(id),
  rejection_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ENHANCE LAB RESULTS TABLE
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS lab_order_test_id UUID REFERENCES public.lab_order_tests(id),
  ADD COLUMN IF NOT EXISTS loinc_code TEXT,
  ADD COLUMN IF NOT EXISTS ucum_unit TEXT,
  ADD COLUMN IF NOT EXISTS specimen_id UUID REFERENCES public.specimens(id),
  ADD COLUMN IF NOT EXISTS result_interpretation TEXT,
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS analyzer_id UUID,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_by UUID,
  ADD COLUMN IF NOT EXISTS technical_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS technical_validated_by UUID,
  ADD COLUMN IF NOT EXISTS clinical_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clinical_validated_by UUID,
  ADD COLUMN IF NOT EXISTS delta_check_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delta_check_value TEXT,
  ADD COLUMN IF NOT EXISTS previous_result_value TEXT,
  ADD COLUMN IF NOT EXISTS previous_result_date TIMESTAMPTZ;

-- 6. LAB ANALYZERS TABLE
CREATE TABLE public.lab_analyzers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analyzer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  department TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error', 'calibrating')),
  connection_type TEXT CHECK (connection_type IN ('hl7', 'astm', 'serial', 'tcp', 'manual')),
  connection_config JSONB,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  last_calibration_at TIMESTAMPTZ,
  uptime_percent DECIMAL DEFAULT 100,
  tests_supported UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. LAB QC LOTS (control materials)
CREATE TABLE public.lab_qc_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_number TEXT NOT NULL,
  material_name TEXT NOT NULL,
  manufacturer TEXT,
  test_catalog_id UUID REFERENCES public.lab_test_catalog(id),
  analyzer_id UUID REFERENCES public.lab_analyzers(id),
  level TEXT NOT NULL CHECK (level IN ('level_1', 'level_2', 'level_3', 'low', 'normal', 'high')),
  target_mean DECIMAL NOT NULL,
  target_sd DECIMAL NOT NULL,
  unit TEXT,
  expiry_date DATE NOT NULL,
  opened_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LAB QC RUNS (daily QC data)
CREATE TABLE public.lab_qc_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qc_lot_id UUID NOT NULL REFERENCES public.lab_qc_lots(id),
  analyzer_id UUID NOT NULL REFERENCES public.lab_analyzers(id),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  run_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID NOT NULL,
  result_value DECIMAL NOT NULL,
  z_score DECIMAL,
  cv_percent DECIMAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'warning')),
  westgard_rules_violated TEXT[],
  comments TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. LAB ROUTING RULES
CREATE TABLE public.lab_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  priority INTEGER DEFAULT 100,
  source_facility_id UUID REFERENCES public.facilities(id),
  destination_lab_id UUID REFERENCES public.facilities(id),
  test_categories TEXT[],
  test_codes TEXT[],
  conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. CRITICAL RESULT NOTIFICATIONS
CREATE TABLE public.lab_critical_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_result_id UUID NOT NULL REFERENCES public.lab_results(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  test_name TEXT NOT NULL,
  result_value TEXT NOT NULL,
  critical_type TEXT NOT NULL CHECK (critical_type IN ('high', 'low', 'abnormal', 'panic')),
  alert_message TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'high' CHECK (urgency IN ('high', 'critical', 'urgent')),
  notified_providers UUID[],
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'acknowledged', 'escalated', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. LAB WORKFLOW AUDIT TRAIL
CREATE TABLE public.lab_workflow_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'specimen', 'result', 'qc_run')),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  performed_by UUID NOT NULL,
  facility_id UUID,
  workspace_id UUID,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. ENHANCE SPECIMENS TABLE
ALTER TABLE public.specimens
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS snomed_specimen_code TEXT,
  ADD COLUMN IF NOT EXISTS body_site_code TEXT,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by UUID,
  ADD COLUMN IF NOT EXISTS received_condition TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_location TEXT,
  ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disposed_by UUID,
  ADD COLUMN IF NOT EXISTS referral_lab_id UUID REFERENCES public.facilities(id),
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_by UUID;

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_category ON public.lab_test_catalog(category);
CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_loinc ON public.lab_test_catalog(loinc_code);
CREATE INDEX IF NOT EXISTS idx_lab_order_tests_order ON public.lab_order_tests(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_tests_status ON public.lab_order_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_qc_runs_date ON public.lab_qc_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_lab_critical_alerts_status ON public.lab_critical_alerts(status);
CREATE INDEX IF NOT EXISTS idx_lab_workflow_events_entity ON public.lab_workflow_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_specimens_barcode ON public.specimens(barcode);

-- 14. RLS POLICIES
ALTER TABLE public.lab_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_rejection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_order_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_analyzers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_qc_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_qc_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_workflow_events ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated users can view)
CREATE POLICY "Authenticated users can view lab test catalog" ON public.lab_test_catalog FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view rejection codes" ON public.lab_rejection_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view lab order tests" ON public.lab_order_tests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view analyzers" ON public.lab_analyzers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view qc lots" ON public.lab_qc_lots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view qc runs" ON public.lab_qc_runs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view routing rules" ON public.lab_routing_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view critical alerts" ON public.lab_critical_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view workflow events" ON public.lab_workflow_events FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert/Update policies
CREATE POLICY "Authenticated users can insert lab order tests" ON public.lab_order_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update lab order tests" ON public.lab_order_tests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert qc runs" ON public.lab_qc_runs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update qc runs" ON public.lab_qc_runs FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert critical alerts" ON public.lab_critical_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update critical alerts" ON public.lab_critical_alerts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert workflow events" ON public.lab_workflow_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin policies for catalog/config tables
CREATE POLICY "Admins can manage test catalog" ON public.lab_test_catalog FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage rejection codes" ON public.lab_rejection_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage analyzers" ON public.lab_analyzers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage qc lots" ON public.lab_qc_lots FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage routing rules" ON public.lab_routing_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 15. TRIGGER FOR updated_at
CREATE TRIGGER update_lab_test_catalog_updated_at BEFORE UPDATE ON public.lab_test_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_analyzers_updated_at BEFORE UPDATE ON public.lab_analyzers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_order_tests_updated_at BEFORE UPDATE ON public.lab_order_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. ENABLE REALTIME for critical alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_critical_alerts;