-- =============================================
-- OPERATIONAL ROSTER, DUTY MANAGEMENT & VIRTUAL CARE POOLS
-- =============================================

-- Enums for roster and operations
CREATE TYPE public.facility_ops_mode AS ENUM ('simple', 'standard', 'advanced');
CREATE TYPE public.shift_type AS ENUM ('am', 'pm', 'night', 'on_call', 'full_day', 'custom');
CREATE TYPE public.roster_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.shift_assignment_status AS ENUM ('scheduled', 'confirmed', 'started', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.cover_request_status AS ENUM ('pending', 'approved', 'denied', 'expired');
CREATE TYPE public.operational_role AS ENUM ('roster_supervisor', 'shift_lead', 'facility_ops_manager', 'virtual_pool_supervisor', 'department_head');

-- =============================================
-- 1. FACILITY OPERATIONS CONFIGURATION
-- =============================================
CREATE TABLE public.facility_operations_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    ops_mode facility_ops_mode NOT NULL DEFAULT 'standard',
    
    auto_assign_workspace_by_cadre BOOLEAN DEFAULT true,
    default_clinical_workspace_id UUID REFERENCES public.workspaces(id),
    default_admin_workspace_id UUID REFERENCES public.workspaces(id),
    
    roster_required BOOLEAN DEFAULT true,
    allow_unrostered_login BOOLEAN DEFAULT false,
    allow_self_start_shift BOOLEAN DEFAULT false,
    require_supervisor_approval_for_cover BOOLEAN DEFAULT true,
    
    min_coverage_enabled BOOLEAN DEFAULT false,
    coverage_alert_threshold INTEGER DEFAULT 1,
    
    virtual_care_enabled BOOLEAN DEFAULT false,
    virtual_care_facility_anchored BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(facility_id)
);

-- =============================================
-- 2. VIRTUAL CARE POOLS
-- =============================================
CREATE TABLE public.virtual_pools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    pool_type TEXT NOT NULL DEFAULT 'telecare',
    
    anchor_facility_id UUID REFERENCES public.facilities(id),
    managing_entity TEXT,
    
    service_tags TEXT[] DEFAULT '{}',
    operating_hours JSONB,
    is_24_7 BOOLEAN DEFAULT false,
    
    sla_first_response_minutes INTEGER DEFAULT 30,
    sla_resolution_hours INTEGER DEFAULT 24,
    escalation_rules JSONB,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.pool_memberships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID NOT NULL REFERENCES public.virtual_pools(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    pool_role workspace_role NOT NULL DEFAULT 'staff',
    can_self_assign BOOLEAN DEFAULT false,
    
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    revoked_by UUID REFERENCES auth.users(id),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(pool_id, provider_id, effective_from)
);

-- =============================================
-- 3. SHIFT DEFINITIONS
-- =============================================
CREATE TABLE public.shift_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    shift_type shift_type NOT NULL,
    
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    crosses_midnight BOOLEAN DEFAULT false,
    
    duration_hours NUMERIC(4,2) NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(facility_id, code)
);

-- =============================================
-- 4. ROSTER PLANS
-- =============================================
CREATE TABLE public.roster_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    status roster_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(facility_id, period_start, period_end)
);

-- =============================================
-- 5. SHIFT ASSIGNMENTS
-- =============================================
CREATE TABLE public.shift_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_plan_id UUID NOT NULL REFERENCES public.roster_plans(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    assignment_date DATE NOT NULL,
    shift_definition_id UUID NOT NULL REFERENCES public.shift_definitions(id),
    
    workspace_id UUID REFERENCES public.workspaces(id),
    pool_id UUID REFERENCES public.virtual_pools(id),
    
    assigned_role TEXT,
    status shift_assignment_status NOT NULL DEFAULT 'scheduled',
    
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id),
    
    original_provider_id UUID REFERENCES public.providers(id),
    swap_reason TEXT,
    swap_approved_by UUID REFERENCES auth.users(id),
    swap_approved_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT workspace_or_pool CHECK (
        (workspace_id IS NOT NULL AND pool_id IS NULL) OR
        (workspace_id IS NULL AND pool_id IS NOT NULL)
    )
);

-- =============================================
-- 6. COVER REQUESTS
-- =============================================
CREATE TABLE public.cover_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    
    requester_id UUID NOT NULL REFERENCES public.providers(id),
    
    workspace_id UUID REFERENCES public.workspaces(id),
    pool_id UUID REFERENCES public.virtual_pools(id),
    shift_definition_id UUID REFERENCES public.shift_definitions(id),
    
    cover_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    reason TEXT NOT NULL,
    
    status cover_request_status NOT NULL DEFAULT 'pending',
    
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    temporary_assignment_id UUID REFERENCES public.shift_assignments(id),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT cover_workspace_or_pool CHECK (
        (workspace_id IS NOT NULL AND pool_id IS NULL) OR
        (workspace_id IS NULL AND pool_id IS NOT NULL)
    )
);

-- =============================================
-- 7. OPERATIONAL SUPERVISORS
-- =============================================
CREATE TABLE public.operational_supervisors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id UUID REFERENCES public.providers(id),
    
    facility_id UUID NOT NULL REFERENCES public.facilities(id),
    department TEXT,
    
    operational_role operational_role NOT NULL,
    
    can_manage_roster BOOLEAN DEFAULT true,
    can_approve_cover BOOLEAN DEFAULT true,
    can_approve_swaps BOOLEAN DEFAULT true,
    can_override_assignments BOOLEAN DEFAULT false,
    can_manage_virtual_pools BOOLEAN DEFAULT false,
    
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    assigned_by UUID REFERENCES auth.users(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, facility_id, department, operational_role)
);

-- =============================================
-- 8. COVERAGE RULES
-- =============================================
CREATE TABLE public.coverage_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    
    workspace_id UUID REFERENCES public.workspaces(id),
    pool_id UUID REFERENCES public.virtual_pools(id),
    shift_definition_id UUID REFERENCES public.shift_definitions(id),
    
    min_staff_count INTEGER NOT NULL DEFAULT 1,
    required_cadres TEXT[],
    applies_to_days INTEGER[],
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 9. VIRTUAL POOL CASE ASSIGNMENTS
-- =============================================
CREATE TABLE public.pool_case_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID NOT NULL REFERENCES public.virtual_pools(id) ON DELETE CASCADE,
    
    patient_id UUID REFERENCES public.patients(id),
    encounter_id UUID REFERENCES public.encounters(id),
    case_type TEXT NOT NULL,
    
    assigned_to UUID REFERENCES public.providers(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    
    sla_deadline TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES public.providers(id),
    escalation_reason TEXT,
    
    handover_from UUID REFERENCES public.providers(id),
    handover_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 10. ROSTER AUDIT LOG
-- =============================================
CREATE TABLE public.roster_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    
    actor_id UUID REFERENCES auth.users(id),
    actor_role TEXT,
    
    facility_id UUID REFERENCES public.facilities(id),
    
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_facility_ops_config_facility ON public.facility_operations_config(facility_id);
CREATE INDEX idx_virtual_pools_anchor_facility ON public.virtual_pools(anchor_facility_id);
CREATE INDEX idx_virtual_pools_active ON public.virtual_pools(is_active) WHERE is_active = true;
CREATE INDEX idx_pool_memberships_pool ON public.pool_memberships(pool_id);
CREATE INDEX idx_pool_memberships_provider ON public.pool_memberships(provider_id);
CREATE INDEX idx_pool_memberships_active ON public.pool_memberships(is_active, effective_from, effective_to);
CREATE INDEX idx_shift_definitions_facility ON public.shift_definitions(facility_id);
CREATE INDEX idx_roster_plans_facility ON public.roster_plans(facility_id);
CREATE INDEX idx_roster_plans_period ON public.roster_plans(period_start, period_end);
CREATE INDEX idx_roster_plans_status ON public.roster_plans(status);
CREATE INDEX idx_shift_assignments_roster ON public.shift_assignments(roster_plan_id);
CREATE INDEX idx_shift_assignments_provider ON public.shift_assignments(provider_id);
CREATE INDEX idx_shift_assignments_date ON public.shift_assignments(assignment_date);
CREATE INDEX idx_shift_assignments_workspace ON public.shift_assignments(workspace_id);
CREATE INDEX idx_shift_assignments_pool ON public.shift_assignments(pool_id);
CREATE INDEX idx_shift_assignments_status ON public.shift_assignments(status);
CREATE INDEX idx_cover_requests_facility ON public.cover_requests(facility_id);
CREATE INDEX idx_cover_requests_status ON public.cover_requests(status);
CREATE INDEX idx_cover_requests_date ON public.cover_requests(cover_date);
CREATE INDEX idx_operational_supervisors_facility ON public.operational_supervisors(facility_id);
CREATE INDEX idx_operational_supervisors_user ON public.operational_supervisors(user_id);
CREATE INDEX idx_coverage_rules_facility ON public.coverage_rules(facility_id);
CREATE INDEX idx_pool_case_assignments_pool ON public.pool_case_assignments(pool_id);
CREATE INDEX idx_pool_case_assignments_assigned_to ON public.pool_case_assignments(assigned_to);
CREATE INDEX idx_pool_case_assignments_status ON public.pool_case_assignments(status);
CREATE INDEX idx_roster_audit_log_entity ON public.roster_audit_log(entity_type, entity_id);
CREATE INDEX idx_roster_audit_log_facility ON public.roster_audit_log(facility_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.facility_operations_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facility ops config for their facilities"
    ON public.facility_operations_config FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            JOIN public.provider_affiliations pa ON p.id = pa.provider_id
            WHERE p.user_id = auth.uid()
            AND pa.facility_id = facility_operations_config.facility_id::text
            AND pa.is_active = true
        )
        OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins and facility managers can manage ops config"
    ON public.facility_operations_config FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = facility_operations_config.facility_id
            AND os.operational_role = 'facility_ops_manager'::operational_role
            AND os.is_active = true
        )
    );

ALTER TABLE public.virtual_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active virtual pools"
    ON public.virtual_pools FOR SELECT
    TO authenticated
    USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and pool supervisors can manage virtual pools"
    ON public.virtual_pools FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.can_manage_virtual_pools = true
            AND os.is_active = true
        )
    );

ALTER TABLE public.pool_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pool memberships"
    ON public.pool_memberships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = pool_memberships.provider_id
            AND p.user_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.can_manage_virtual_pools = true
            AND os.is_active = true
        )
    );

CREATE POLICY "Pool supervisors can manage pool memberships"
    ON public.pool_memberships FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.can_manage_virtual_pools = true
            AND os.is_active = true
        )
    );

ALTER TABLE public.shift_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shift definitions"
    ON public.shift_definitions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Facility managers can manage shift definitions"
    ON public.shift_definitions FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = shift_definitions.facility_id
            AND os.is_active = true
        )
    );

ALTER TABLE public.roster_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published rosters"
    ON public.roster_plans FOR SELECT
    USING (
        status = 'published'::roster_status
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = roster_plans.facility_id
            AND os.is_active = true
        )
    );

CREATE POLICY "Roster supervisors can manage rosters"
    ON public.roster_plans FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = roster_plans.facility_id
            AND os.can_manage_roster = true
            AND os.is_active = true
        )
    );

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shift assignments"
    ON public.shift_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = shift_assignments.provider_id
            AND p.user_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.roster_plans rp
            JOIN public.operational_supervisors os ON os.facility_id = rp.facility_id
            WHERE rp.id = shift_assignments.roster_plan_id
            AND os.user_id = auth.uid()
            AND os.is_active = true
        )
    );

CREATE POLICY "Roster supervisors can manage shift assignments"
    ON public.shift_assignments FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.roster_plans rp
            JOIN public.operational_supervisors os ON os.facility_id = rp.facility_id
            WHERE rp.id = shift_assignments.roster_plan_id
            AND os.user_id = auth.uid()
            AND os.can_manage_roster = true
            AND os.is_active = true
        )
    );

ALTER TABLE public.cover_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cover requests"
    ON public.cover_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = cover_requests.requester_id
            AND p.user_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = cover_requests.facility_id
            AND os.can_approve_cover = true
            AND os.is_active = true
        )
    );

CREATE POLICY "Users can create cover requests"
    ON public.cover_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = cover_requests.requester_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can approve cover requests"
    ON public.cover_requests FOR UPDATE
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = cover_requests.facility_id
            AND os.can_approve_cover = true
            AND os.is_active = true
        )
    );

ALTER TABLE public.operational_supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operational supervisors"
    ON public.operational_supervisors FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage operational supervisors"
    ON public.operational_supervisors FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.coverage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view coverage rules"
    ON public.coverage_rules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Facility managers can manage coverage rules"
    ON public.coverage_rules FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = coverage_rules.facility_id
            AND os.operational_role = 'facility_ops_manager'::operational_role
            AND os.is_active = true
        )
    );

ALTER TABLE public.pool_case_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pool members can view assigned cases"
    ON public.pool_case_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE (p.id = pool_case_assignments.assigned_to OR p.id = pool_case_assignments.escalated_to)
            AND p.user_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.pool_memberships pm
            JOIN public.providers p ON pm.provider_id = p.id
            WHERE pm.pool_id = pool_case_assignments.pool_id
            AND p.user_id = auth.uid()
            AND pm.pool_role IN ('supervisor'::workspace_role, 'manager'::workspace_role)
            AND pm.is_active = true
        )
    );

CREATE POLICY "Pool supervisors can manage case assignments"
    ON public.pool_case_assignments FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.pool_memberships pm
            JOIN public.providers p ON pm.provider_id = p.id
            WHERE pm.pool_id = pool_case_assignments.pool_id
            AND p.user_id = auth.uid()
            AND pm.pool_role IN ('supervisor'::workspace_role, 'manager'::workspace_role)
            AND pm.is_active = true
        )
    );

ALTER TABLE public.roster_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.roster_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Supervisors can view audit logs"
    ON public.roster_audit_log FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.operational_supervisors os
            WHERE os.user_id = auth.uid()
            AND os.facility_id = roster_audit_log.facility_id
            AND os.is_active = true
        )
    );

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_facility_operations_config_updated_at
    BEFORE UPDATE ON public.facility_operations_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_pools_updated_at
    BEFORE UPDATE ON public.virtual_pools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_memberships_updated_at
    BEFORE UPDATE ON public.pool_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_definitions_updated_at
    BEFORE UPDATE ON public.shift_definitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roster_plans_updated_at
    BEFORE UPDATE ON public.roster_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at
    BEFORE UPDATE ON public.shift_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cover_requests_updated_at
    BEFORE UPDATE ON public.cover_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operational_supervisors_updated_at
    BEFORE UPDATE ON public.operational_supervisors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coverage_rules_updated_at
    BEFORE UPDATE ON public.coverage_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_case_assignments_updated_at
    BEFORE UPDATE ON public.pool_case_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.get_todays_roster_assignment(
    _user_id UUID,
    _facility_id UUID DEFAULT NULL
)
RETURNS TABLE (
    assignment_id UUID,
    shift_name TEXT,
    shift_type_val shift_type,
    start_time TIME,
    end_time TIME,
    workspace_id UUID,
    workspace_name TEXT,
    pool_id UUID,
    pool_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        sa.id AS assignment_id,
        sd.name AS shift_name,
        sd.shift_type AS shift_type_val,
        sd.start_time,
        sd.end_time,
        sa.workspace_id,
        w.name AS workspace_name,
        sa.pool_id,
        vp.name AS pool_name
    FROM public.shift_assignments sa
    JOIN public.roster_plans rp ON sa.roster_plan_id = rp.id
    JOIN public.shift_definitions sd ON sa.shift_definition_id = sd.id
    JOIN public.providers p ON sa.provider_id = p.id
    LEFT JOIN public.workspaces w ON sa.workspace_id = w.id
    LEFT JOIN public.virtual_pools vp ON sa.pool_id = vp.id
    WHERE p.user_id = _user_id
      AND sa.assignment_date = CURRENT_DATE
      AND rp.status = 'published'::roster_status
      AND sa.status IN ('scheduled'::shift_assignment_status, 'confirmed'::shift_assignment_status)
      AND (_facility_id IS NULL OR rp.facility_id = _facility_id)
    ORDER BY sd.start_time
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_operational_supervisor(
    _user_id UUID,
    _facility_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.operational_supervisors os
        WHERE os.user_id = _user_id
          AND os.is_active = true
          AND (os.effective_to IS NULL OR os.effective_to >= CURRENT_DATE)
          AND (_facility_id IS NULL OR os.facility_id = _facility_id)
    )
$$;

CREATE OR REPLACE FUNCTION public.get_facility_ops_mode(_facility_id UUID)
RETURNS facility_ops_mode
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT ops_mode FROM public.facility_operations_config WHERE facility_id = _facility_id),
        'standard'::facility_ops_mode
    )
$$;