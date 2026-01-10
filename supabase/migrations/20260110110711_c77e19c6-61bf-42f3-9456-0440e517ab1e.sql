-- =====================================================
-- PACS COMPREHENSIVE EXTENSION - Missing Requirements
-- Worklists, Routing, Prefetch, Audit, Consults, Lifecycle
-- =====================================================

-- 1. RADIOLOGIST WORKLISTS AND ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.imaging_worklists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    facility_id UUID REFERENCES public.facilities(id),
    modality_filter TEXT[], -- ['CT', 'MRI', 'XR']
    body_part_filter TEXT[],
    priority_filter TEXT[], -- ['stat', 'urgent', 'routine']
    auto_assign_provider_id UUID,
    pool_providers UUID[], -- Array of provider IDs for round-robin
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imaging_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    worklist_id UUID REFERENCES public.imaging_worklists(id),
    assigned_to UUID, -- Provider ID
    assigned_by UUID, -- Provider who made assignment
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reassigned', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'routine')),
    is_current BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reassign_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STUDY ROUTING RULES
CREATE TABLE IF NOT EXISTS public.imaging_routing_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority
    -- Match conditions (all must match if specified)
    source_facility_id UUID REFERENCES public.facilities(id),
    modality_match TEXT[],
    body_part_match TEXT[],
    study_description_pattern TEXT, -- ILIKE pattern
    -- Actions
    target_worklist_id UUID REFERENCES public.imaging_worklists(id),
    target_facility_id UUID REFERENCES public.facilities(id),
    auto_assign_to UUID, -- Provider ID
    set_priority TEXT CHECK (set_priority IN ('stat', 'urgent', 'routine')),
    notify_providers UUID[], -- Send notification to these providers
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PREFETCH RULES
CREATE TABLE IF NOT EXISTS public.imaging_prefetch_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    modality TEXT[], -- When study of this modality arrives
    body_part TEXT[], -- And body part matches
    lookback_days INTEGER NOT NULL DEFAULT 365, -- Fetch priors within N days
    max_priors INTEGER DEFAULT 5, -- Limit number of prior studies
    same_modality_only BOOLEAN DEFAULT false,
    same_body_part_only BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imaging_prefetched_priors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    current_study_id UUID NOT NULL REFERENCES public.imaging_studies(id) ON DELETE CASCADE,
    prior_study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    prefetch_rule_id UUID REFERENCES public.imaging_prefetch_rules(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'ready', 'failed')),
    fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(current_study_id, prior_study_id)
);

-- 4. CRITICAL FINDINGS WORKFLOW
CREATE TABLE IF NOT EXISTS public.imaging_critical_findings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    report_id UUID REFERENCES public.imaging_reports(id),
    finding_description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('critical', 'significant', 'unexpected')),
    -- Notification tracking
    notification_required BOOLEAN NOT NULL DEFAULT true,
    notification_attempts INTEGER DEFAULT 0,
    first_notified_at TIMESTAMPTZ,
    notified_to TEXT, -- Who was notified
    notified_by UUID, -- Provider who sent notification
    notification_method TEXT, -- 'phone', 'page', 'in_person', 'secure_message'
    notification_confirmed_at TIMESTAMPTZ,
    confirmation_details TEXT, -- Who confirmed, what they said
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notifying', 'notified', 'confirmed', 'escalated', 'failed')),
    escalated_to UUID,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TELERADIOLOGY CONSULTS
CREATE TABLE IF NOT EXISTS public.imaging_consults (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    requesting_facility_id UUID REFERENCES public.facilities(id),
    requesting_provider_id UUID,
    consulting_facility_id UUID REFERENCES public.facilities(id),
    consulting_provider_id UUID,
    consult_type TEXT NOT NULL DEFAULT 'second_opinion' CHECK (consult_type IN ('second_opinion', 'specialist_review', 'teleradiology', 'urgent_read')),
    clinical_question TEXT,
    urgency TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('stat', 'urgent', 'routine')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined', 'cancelled')),
    -- Response
    response_findings TEXT,
    response_impression TEXT,
    response_recommendations TEXT,
    responded_at TIMESTAMPTZ,
    -- Tracking
    accepted_at TIMESTAMPTZ,
    declined_reason TEXT,
    turnaround_minutes INTEGER, -- Calculated field
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. IMAGING AUDIT LOG (View/Download/Share tracking)
CREATE TABLE IF NOT EXISTS public.imaging_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID REFERENCES public.imaging_studies(id),
    series_id UUID REFERENCES public.imaging_series(id),
    instance_id UUID REFERENCES public.imaging_instances(id),
    report_id UUID REFERENCES public.imaging_reports(id),
    action TEXT NOT NULL, -- 'view', 'download', 'share', 'print', 'export', 'report_view', 'report_create', 'report_sign'
    actor_id UUID NOT NULL, -- User who performed action
    actor_facility_id UUID REFERENCES public.facilities(id),
    purpose_of_use TEXT, -- 'clinical_care', 'quality_assurance', 'research', 'training', 'emergency'
    access_method TEXT, -- 'viewer', 'api', 'dicomweb', 'export'
    client_ip TEXT,
    user_agent TEXT,
    -- For share/export actions
    shared_with TEXT,
    export_format TEXT,
    de_identified BOOLEAN DEFAULT false,
    -- Emergency/break-glass
    is_emergency_access BOOLEAN DEFAULT false,
    emergency_justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. STUDY LIFECYCLE MANAGEMENT
CREATE TABLE IF NOT EXISTS public.imaging_lifecycle_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Match conditions
    modality TEXT[],
    facility_id UUID REFERENCES public.facilities(id),
    patient_age_category TEXT CHECK (patient_age_category IN ('pediatric', 'adult', 'all')),
    -- Retention periods (days)
    hot_storage_days INTEGER NOT NULL DEFAULT 90,
    warm_storage_days INTEGER NOT NULL DEFAULT 365,
    cold_storage_days INTEGER NOT NULL DEFAULT 2555, -- ~7 years default
    deletion_after_days INTEGER, -- NULL = never delete
    legal_hold_category TEXT, -- Can override deletion
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'hot' CHECK (lifecycle_status IN ('hot', 'warm', 'cold', 'archived', 'pending_deletion', 'legal_hold'));
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS lifecycle_policy_id UUID REFERENCES public.imaging_lifecycle_policies(id);
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS archive_location TEXT;
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS legal_hold_until TIMESTAMPTZ;
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT;
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS health_id TEXT; -- Link to Client Registry
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES public.facilities(id);
ALTER TABLE public.imaging_studies ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'received' CHECK (workflow_status IN ('ordered', 'scheduled', 'acquired', 'received', 'ready_for_read', 'prelim_reported', 'final_reported', 'amended'));

-- 8. HANGING PROTOCOLS
CREATE TABLE IF NOT EXISTS public.imaging_hanging_protocols (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    modality TEXT NOT NULL,
    body_part TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Layout configuration
    layout_type TEXT NOT NULL DEFAULT '1x1' CHECK (layout_type IN ('1x1', '1x2', '2x1', '2x2', '3x2', 'mpr_axial', 'mpr_coronal', 'mpr_sagittal', 'mpr_3plane', 'comparison')),
    viewport_config JSONB NOT NULL DEFAULT '[]', -- Array of viewport configurations
    initial_window_preset TEXT,
    auto_link_scrolling BOOLEAN DEFAULT true,
    auto_compare_priors BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 100,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. DE-IDENTIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS public.imaging_deidentification_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_ids UUID[] NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('research', 'training', 'quality_assurance', 'external_consult')),
    project_name TEXT,
    requested_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    rejection_reason TEXT,
    -- De-identification options
    remove_patient_name BOOLEAN DEFAULT true,
    remove_patient_id BOOLEAN DEFAULT true,
    remove_dates BOOLEAN DEFAULT false, -- Shift or remove
    date_shift_days INTEGER, -- Random shift if removing dates
    remove_institution BOOLEAN DEFAULT false,
    remove_physician_names BOOLEAN DEFAULT true,
    custom_tag_removals TEXT[], -- Additional DICOM tags to remove
    -- Output
    output_format TEXT DEFAULT 'dicom' CHECK (output_format IN ('dicom', 'nifti', 'png')),
    output_location TEXT,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TAT TRACKING METRICS
CREATE TABLE IF NOT EXISTS public.imaging_tat_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    facility_id UUID REFERENCES public.facilities(id),
    modality TEXT NOT NULL,
    priority TEXT NOT NULL,
    -- Timestamps
    ordered_at TIMESTAMPTZ,
    acquired_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    read_started_at TIMESTAMPTZ,
    prelim_reported_at TIMESTAMPTZ,
    final_reported_at TIMESTAMPTZ,
    -- Calculated durations (minutes)
    order_to_acquisition INTEGER,
    acquisition_to_report INTEGER,
    total_tat INTEGER,
    -- SLA tracking
    sla_target_minutes INTEGER,
    sla_met BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_imaging_assignments_study ON public.imaging_assignments(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_assignments_provider ON public.imaging_assignments(assigned_to) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_imaging_assignments_worklist ON public.imaging_assignments(worklist_id);
CREATE INDEX IF NOT EXISTS idx_imaging_routing_active ON public.imaging_routing_rules(is_active, priority);
CREATE INDEX IF NOT EXISTS idx_imaging_prefetch_current ON public.imaging_prefetched_priors(current_study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_critical_status ON public.imaging_critical_findings(status) WHERE status != 'confirmed';
CREATE INDEX IF NOT EXISTS idx_imaging_consults_study ON public.imaging_consults(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_consults_status ON public.imaging_consults(status);
CREATE INDEX IF NOT EXISTS idx_imaging_audit_study ON public.imaging_audit_log(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_audit_actor ON public.imaging_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_imaging_audit_time ON public.imaging_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imaging_tat_study ON public.imaging_tat_metrics(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_tat_facility ON public.imaging_tat_metrics(facility_id, modality);
CREATE INDEX IF NOT EXISTS idx_imaging_studies_health_id ON public.imaging_studies(health_id);
CREATE INDEX IF NOT EXISTS idx_imaging_studies_workflow ON public.imaging_studies(workflow_status);
CREATE INDEX IF NOT EXISTS idx_imaging_studies_lifecycle ON public.imaging_studies(lifecycle_status);

-- ENABLE RLS
ALTER TABLE public.imaging_worklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_prefetch_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_prefetched_priors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_critical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_lifecycle_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_hanging_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_deidentification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_tat_metrics ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Authenticated users can view worklists" ON public.imaging_worklists FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage worklists" ON public.imaging_worklists FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their assignments" ON public.imaging_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage assignments" ON public.imaging_assignments FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view routing rules" ON public.imaging_routing_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage routing rules" ON public.imaging_routing_rules FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view prefetch rules" ON public.imaging_prefetch_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage prefetch rules" ON public.imaging_prefetch_rules FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view prefetched priors" ON public.imaging_prefetched_priors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage prefetched priors" ON public.imaging_prefetched_priors FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view critical findings" ON public.imaging_critical_findings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage critical findings" ON public.imaging_critical_findings FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view consults" ON public.imaging_consults FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage consults" ON public.imaging_consults FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view audit log" ON public.imaging_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert audit log" ON public.imaging_audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view lifecycle policies" ON public.imaging_lifecycle_policies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage lifecycle policies" ON public.imaging_lifecycle_policies FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view hanging protocols" ON public.imaging_hanging_protocols FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage hanging protocols" ON public.imaging_hanging_protocols FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view deidentification jobs" ON public.imaging_deidentification_jobs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage deidentification jobs" ON public.imaging_deidentification_jobs FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view TAT metrics" ON public.imaging_tat_metrics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage TAT metrics" ON public.imaging_tat_metrics FOR ALL USING (auth.uid() IS NOT NULL);

-- Seed default hanging protocols
INSERT INTO public.imaging_hanging_protocols (name, modality, body_part, is_default, layout_type, viewport_config, initial_window_preset) VALUES
('CT Chest Standard', 'CT', 'CHEST', true, 'mpr_3plane', '[{"position": "main", "series": "axial", "window_preset": "Lung"}, {"position": "right_top", "series": "coronal"}, {"position": "right_bottom", "series": "sagittal"}]', 'Lung'),
('CT Abdomen Standard', 'CT', 'ABDOMEN', true, 'mpr_3plane', '[{"position": "main", "series": "axial", "window_preset": "Abdomen"}, {"position": "right_top", "series": "coronal"}, {"position": "right_bottom", "series": "sagittal"}]', 'Abdomen'),
('MRI Brain Standard', 'MRI', 'HEAD', true, '2x2', '[{"position": "top_left", "series": "T1"}, {"position": "top_right", "series": "T2"}, {"position": "bottom_left", "series": "FLAIR"}, {"position": "bottom_right", "series": "DWI"}]', 'Brain'),
('XR Chest PA/Lat', 'XR', 'CHEST', true, '1x2', '[{"position": "left", "series": "PA"}, {"position": "right", "series": "LAT"}]', 'Default'),
('Ultrasound Standard', 'US', NULL, true, '1x1', '[{"position": "main"}]', 'Default'),
('Comparison View', 'CT', NULL, false, 'comparison', '[{"position": "left", "study": "current"}, {"position": "right", "study": "prior"}]', NULL)
ON CONFLICT DO NOTHING;

-- Seed default prefetch rules
INSERT INTO public.imaging_prefetch_rules (name, modality, body_part, lookback_days, max_priors, same_modality_only, same_body_part_only) VALUES
('CT Chest Priors', ARRAY['CT'], ARRAY['CHEST'], 730, 3, true, true),
('MRI Brain Priors', ARRAY['MRI'], ARRAY['HEAD', 'BRAIN'], 1095, 5, true, true),
('XR Chest Priors', ARRAY['XR', 'CR', 'DR'], ARRAY['CHEST'], 365, 2, false, true),
('Mammography Priors', ARRAY['MG'], ARRAY['BREAST'], 1825, 5, true, true),
('Any CT Priors', ARRAY['CT'], NULL, 365, 3, true, false)
ON CONFLICT DO NOTHING;

-- Seed default lifecycle policies
INSERT INTO public.imaging_lifecycle_policies (name, description, modality, patient_age_category, hot_storage_days, warm_storage_days, cold_storage_days, deletion_after_days) VALUES
('Pediatric Imaging', 'Extended retention for pediatric patients', NULL, 'pediatric', 365, 730, 9125, NULL), -- 25 years, never delete
('Adult CT/MRI', 'Standard adult CT and MRI retention', ARRAY['CT', 'MRI'], 'adult', 90, 365, 2555, 3650), -- 7 years cold, 10 years total
('Adult XR', 'Standard adult X-ray retention', ARRAY['XR', 'CR', 'DR'], 'adult', 30, 180, 1825, 2555), -- 5 years cold, 7 years total
('Mammography', 'Extended mammography retention', ARRAY['MG'], 'all', 365, 730, 3650, NULL) -- 10 years cold, never delete
ON CONFLICT DO NOTHING;