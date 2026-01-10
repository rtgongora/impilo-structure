-- =============================================
-- WORKSPACE, SHIFT, AND FACILITY OPERATIONS SCHEMA
-- =============================================

-- Workspace type enum
CREATE TYPE public.workspace_type AS ENUM ('clinical', 'admin', 'support');

-- Workspace role enum (within a workspace)
CREATE TYPE public.workspace_role AS ENUM ('staff', 'supervisor', 'manager');

-- Shift status enum
CREATE TYPE public.shift_status AS ENUM ('active', 'ended', 'cancelled');

-- Workspace transfer reason enum
CREATE TYPE public.workspace_transfer_reason AS ENUM ('rotation', 'cover', 'emergency', 'break', 'other');

-- =============================================
-- WORKSPACES TABLE
-- =============================================
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    workspace_type public.workspace_type NOT NULL DEFAULT 'clinical',
    location_code TEXT,
    description TEXT,
    service_tags TEXT[] DEFAULT '{}',
    operating_hours JSONB, -- {monday: {open: "08:00", close: "17:00"}, ...}
    is_active BOOLEAN NOT NULL DEFAULT true,
    parent_workspace_id UUID REFERENCES public.workspaces(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    UNIQUE(facility_id, name)
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can view workspaces
CREATE POLICY "Authenticated users can view workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage workspaces
CREATE POLICY "Admins can manage workspaces"
ON public.workspaces FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- WORKSPACE MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE public.workspace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    workspace_role public.workspace_role NOT NULL DEFAULT 'staff',
    can_self_assign BOOLEAN NOT NULL DEFAULT false,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_by UUID,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, provider_id, effective_from)
);

-- Enable RLS
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
ON public.workspace_memberships FOR SELECT
TO authenticated
USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

-- Admins can manage memberships
CREATE POLICY "Admins can manage memberships"
ON public.workspace_memberships FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SHIFTS TABLE
-- =============================================
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    current_workspace_id UUID REFERENCES public.workspaces(id),
    status public.shift_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    start_method TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'supervisor_assignment'
    end_method TEXT, -- 'manual', 'timeout', 'supervisor_override'
    handover_notes TEXT,
    summary TEXT,
    total_duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Users can view their own shifts
CREATE POLICY "Users can view own shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

-- Users can start/end their own shifts
CREATE POLICY "Users can manage own shifts"
ON public.shifts FOR INSERT
TO authenticated
WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own shifts"
ON public.shifts FOR UPDATE
TO authenticated
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- Admins can manage all shifts
CREATE POLICY "Admins can manage all shifts"
ON public.shifts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SHIFT WORKSPACE LOGS TABLE (transfers)
-- =============================================
CREATE TABLE public.shift_workspace_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
    entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    exited_at TIMESTAMPTZ,
    transfer_reason public.workspace_transfer_reason,
    transfer_notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_workspace_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own shift logs
CREATE POLICY "Users can view own shift logs"
ON public.shift_workspace_logs FOR SELECT
TO authenticated
USING (
    shift_id IN (
        SELECT id FROM public.shifts 
        WHERE provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- Users can create/update their own shift logs
CREATE POLICY "Users can manage own shift logs"
ON public.shift_workspace_logs FOR INSERT
TO authenticated
WITH CHECK (
    shift_id IN (
        SELECT id FROM public.shifts 
        WHERE provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Users can update own shift logs"
ON public.shift_workspace_logs FOR UPDATE
TO authenticated
USING (
    shift_id IN (
        SELECT id FROM public.shifts 
        WHERE provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    )
);

-- =============================================
-- WORKSPACE AUDIT LOG
-- =============================================
CREATE TABLE public.workspace_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_provider_id UUID,
    facility_id UUID,
    workspace_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    justification TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.workspace_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "Authenticated can insert audit logs"
ON public.workspace_audit_log FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if a user has access to a workspace
CREATE OR REPLACE FUNCTION public.can_access_workspace(
    _user_id UUID,
    _workspace_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_memberships wm
        JOIN public.providers p ON wm.provider_id = p.id
        WHERE p.user_id = _user_id
          AND wm.workspace_id = _workspace_id
          AND wm.is_active = true
          AND wm.effective_from <= CURRENT_DATE
          AND (wm.effective_to IS NULL OR wm.effective_to >= CURRENT_DATE)
    )
    OR public.has_role(_user_id, 'admin')
$$;

-- Function to get user's authorized workspaces
CREATE OR REPLACE FUNCTION public.get_user_workspaces(_user_id UUID, _facility_id UUID DEFAULT NULL)
RETURNS TABLE(
    workspace_id UUID,
    workspace_name TEXT,
    workspace_type public.workspace_type,
    facility_id UUID,
    facility_name TEXT,
    workspace_role public.workspace_role,
    service_tags TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        w.id AS workspace_id,
        w.name AS workspace_name,
        w.workspace_type,
        w.facility_id,
        f.name AS facility_name,
        wm.workspace_role,
        w.service_tags
    FROM public.workspaces w
    JOIN public.workspace_memberships wm ON w.id = wm.workspace_id
    JOIN public.providers p ON wm.provider_id = p.id
    JOIN public.facilities f ON w.facility_id = f.id
    WHERE p.user_id = _user_id
      AND w.is_active = true
      AND wm.is_active = true
      AND wm.effective_from <= CURRENT_DATE
      AND (wm.effective_to IS NULL OR wm.effective_to >= CURRENT_DATE)
      AND (_facility_id IS NULL OR w.facility_id = _facility_id)
    ORDER BY f.name, w.sort_order, w.name
$$;

-- Function to get current active shift
CREATE OR REPLACE FUNCTION public.get_active_shift(_user_id UUID)
RETURNS TABLE(
    shift_id UUID,
    facility_id UUID,
    facility_name TEXT,
    current_workspace_id UUID,
    current_workspace_name TEXT,
    started_at TIMESTAMPTZ,
    duration_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        s.id AS shift_id,
        s.facility_id,
        f.name AS facility_name,
        s.current_workspace_id,
        w.name AS current_workspace_name,
        s.started_at,
        EXTRACT(EPOCH FROM (now() - s.started_at))::INTEGER / 60 AS duration_minutes
    FROM public.shifts s
    JOIN public.providers p ON s.provider_id = p.id
    JOIN public.facilities f ON s.facility_id = f.id
    LEFT JOIN public.workspaces w ON s.current_workspace_id = w.id
    WHERE p.user_id = _user_id
      AND s.status = 'active'
    ORDER BY s.started_at DESC
    LIMIT 1
$$;

-- Indexes for performance
CREATE INDEX idx_workspaces_facility ON public.workspaces(facility_id);
CREATE INDEX idx_workspaces_type ON public.workspaces(workspace_type);
CREATE INDEX idx_workspaces_active ON public.workspaces(is_active);

CREATE INDEX idx_workspace_memberships_provider ON public.workspace_memberships(provider_id);
CREATE INDEX idx_workspace_memberships_workspace ON public.workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_memberships_active ON public.workspace_memberships(is_active, effective_from, effective_to);

CREATE INDEX idx_shifts_provider ON public.shifts(provider_id);
CREATE INDEX idx_shifts_facility ON public.shifts(facility_id);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_shifts_active ON public.shifts(provider_id, status) WHERE status = 'active';

CREATE INDEX idx_shift_workspace_logs_shift ON public.shift_workspace_logs(shift_id);
CREATE INDEX idx_shift_workspace_logs_workspace ON public.shift_workspace_logs(workspace_id);

CREATE INDEX idx_workspace_audit_facility ON public.workspace_audit_log(facility_id);
CREATE INDEX idx_workspace_audit_workspace ON public.workspace_audit_log(workspace_id);
CREATE INDEX idx_workspace_audit_actor ON public.workspace_audit_log(actor_id);
CREATE INDEX idx_workspace_audit_created ON public.workspace_audit_log(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_memberships_updated_at
    BEFORE UPDATE ON public.workspace_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();