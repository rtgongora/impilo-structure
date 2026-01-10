-- Above-Site Roles Database Schema
-- Implements AS-FR-01, AS-FR-02, AS-AUTH-02

-- Enum for above-site role types
CREATE TYPE public.above_site_role_type AS ENUM (
  'district_medical_officer',
  'district_health_executive',
  'provincial_health_executive',
  'national_programme_manager',
  'telecare_operations_manager',
  'radiology_network_manager',
  'lab_network_manager',
  'digital_health_manager',
  'quality_assurance_officer',
  'regulator_inspector'
);

-- Enum for jurisdiction level
CREATE TYPE public.jurisdiction_level AS ENUM (
  'facility_list',
  'district',
  'province',
  'national',
  'virtual_services',
  'programme'
);

-- Enum for above-site context types
CREATE TYPE public.above_site_context_type AS ENUM (
  'district_overview',
  'provincial_operations',
  'national_operations',
  'programme_operations',
  'telecare_operations',
  'network_operations'
);

-- Enum for intervention types
CREATE TYPE public.intervention_type AS ENUM (
  'staff_redeployment',
  'coverage_approval',
  'queue_escalation',
  'virtual_pool_authorization',
  'facility_override',
  'emergency_response'
);

-- Main above-site roles table
CREATE TABLE public.above_site_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type above_site_role_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  can_access_patient_data BOOLEAN DEFAULT false,
  can_intervene BOOLEAN DEFAULT true,
  can_act_as BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_type)
);

-- Jurisdiction assignments (what scope does the role cover)
CREATE TABLE public.jurisdiction_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  above_site_role_id UUID NOT NULL REFERENCES public.above_site_roles(id) ON DELETE CASCADE,
  jurisdiction_level jurisdiction_level NOT NULL,
  -- For specific facility list
  facility_ids UUID[] DEFAULT '{}',
  -- For district/province
  district_codes TEXT[] DEFAULT '{}',
  province_codes TEXT[] DEFAULT '{}',
  -- For programme-based
  programme_code TEXT,
  programme_name TEXT,
  -- For virtual services
  virtual_pool_ids UUID[] DEFAULT '{}',
  -- Time bounds
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Above-site context sessions (tracks what context user is viewing)
CREATE TABLE public.above_site_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  above_site_role_id UUID NOT NULL REFERENCES public.above_site_roles(id) ON DELETE CASCADE,
  context_type above_site_context_type NOT NULL,
  context_label TEXT NOT NULL,
  -- Selected scope for this session
  selected_province TEXT,
  selected_district TEXT,
  selected_programme TEXT,
  selected_facility_id UUID REFERENCES public.facilities(id),
  -- Act-as mode tracking
  is_acting_as BOOLEAN DEFAULT false,
  acting_as_workspace_id UUID REFERENCES public.workspaces(id),
  acting_as_reason TEXT,
  acting_as_started_at TIMESTAMPTZ,
  acting_as_expires_at TIMESTAMPTZ,
  -- Session lifecycle
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Above-site interventions (audit trail for all actions)
CREATE TABLE public.above_site_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.above_site_sessions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  intervention_type intervention_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Target of intervention
  target_facility_id UUID REFERENCES public.facilities(id),
  target_workspace_id UUID REFERENCES public.workspaces(id),
  target_provider_id UUID,
  target_pool_id UUID REFERENCES public.virtual_pools(id),
  -- Intervention details
  action_data JSONB DEFAULT '{}',
  reason TEXT NOT NULL,
  is_approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  is_reversible BOOLEAN DEFAULT true,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES auth.users(id),
  reversal_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Above-site audit log (comprehensive logging per AS-AUD-01)
CREATE TABLE public.above_site_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID REFERENCES public.above_site_sessions(id),
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL, -- 'login', 'context_change', 'view', 'drill_down', 'intervention', 'patient_access', 'act_as'
  description TEXT,
  -- Context at time of action
  jurisdiction_scope JSONB,
  -- Target details
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  -- For patient access (AS-DATA-02)
  patient_id UUID,
  patient_access_purpose TEXT,
  patient_access_time_limit INTERVAL,
  patient_access_approved_by UUID,
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_above_site_roles_user ON public.above_site_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_above_site_roles_type ON public.above_site_roles(role_type);
CREATE INDEX idx_jurisdiction_assignments_role ON public.jurisdiction_assignments(above_site_role_id);
CREATE INDEX idx_above_site_sessions_user ON public.above_site_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_above_site_interventions_session ON public.above_site_interventions(session_id);
CREATE INDEX idx_above_site_audit_user ON public.above_site_audit_log(user_id);
CREATE INDEX idx_above_site_audit_category ON public.above_site_audit_log(action_category);
CREATE INDEX idx_above_site_audit_created ON public.above_site_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.above_site_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.above_site_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.above_site_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.above_site_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has above-site role
CREATE OR REPLACE FUNCTION public.has_above_site_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.above_site_roles
    WHERE user_id = _user_id
      AND is_active = true
      AND effective_from <= CURRENT_DATE
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  )
$$;

-- Helper function: Get user's above-site roles
CREATE OR REPLACE FUNCTION public.get_above_site_roles(_user_id UUID)
RETURNS TABLE (
  role_id UUID,
  role_type above_site_role_type,
  title TEXT,
  can_access_patient_data BOOLEAN,
  can_intervene BOOLEAN,
  can_act_as BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id AS role_id,
    role_type,
    title,
    can_access_patient_data,
    can_intervene,
    can_act_as
  FROM public.above_site_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
$$;

-- Helper function: Get jurisdiction scope for a role
CREATE OR REPLACE FUNCTION public.get_jurisdiction_scope(_role_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'level', jurisdiction_level,
    'facility_ids', facility_ids,
    'district_codes', district_codes,
    'province_codes', province_codes,
    'programme_code', programme_code,
    'programme_name', programme_name,
    'virtual_pool_ids', virtual_pool_ids
  ))
  FROM public.jurisdiction_assignments
  WHERE above_site_role_id = _role_id
    AND is_active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
$$;

-- Helper function: Check if user can access facility in their jurisdiction
CREATE OR REPLACE FUNCTION public.can_access_facility_in_jurisdiction(_user_id UUID, _facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_facility RECORD;
  v_assignment RECORD;
BEGIN
  -- Get facility details
  SELECT province, district INTO v_facility
  FROM public.facilities WHERE id = _facility_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check each jurisdiction assignment
  FOR v_assignment IN 
    SELECT ja.* 
    FROM public.jurisdiction_assignments ja
    JOIN public.above_site_roles asr ON ja.above_site_role_id = asr.id
    WHERE asr.user_id = _user_id
      AND asr.is_active = true
      AND ja.is_active = true
      AND asr.effective_from <= CURRENT_DATE
      AND (asr.effective_to IS NULL OR asr.effective_to >= CURRENT_DATE)
      AND ja.effective_from <= CURRENT_DATE
      AND (ja.effective_to IS NULL OR ja.effective_to >= CURRENT_DATE)
  LOOP
    CASE v_assignment.jurisdiction_level
      WHEN 'national' THEN
        RETURN true;
      WHEN 'province' THEN
        IF v_facility.province = ANY(v_assignment.province_codes) THEN
          RETURN true;
        END IF;
      WHEN 'district' THEN
        IF v_facility.district = ANY(v_assignment.district_codes) THEN
          RETURN true;
        END IF;
      WHEN 'facility_list' THEN
        IF _facility_id = ANY(v_assignment.facility_ids) THEN
          RETURN true;
        END IF;
      ELSE
        NULL;
    END CASE;
  END LOOP;
  
  RETURN false;
END;
$$;

-- RLS Policies

-- above_site_roles: users can see their own, admins can see all
CREATE POLICY "Users can view own above-site roles"
  ON public.above_site_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage above-site roles"
  ON public.above_site_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- jurisdiction_assignments: accessible to role owners and admins
CREATE POLICY "Users can view own jurisdiction assignments"
  ON public.jurisdiction_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.above_site_roles asr
      WHERE asr.id = above_site_role_id
        AND (asr.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage jurisdiction assignments"
  ON public.jurisdiction_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- above_site_sessions: users can manage own sessions
CREATE POLICY "Users can manage own above-site sessions"
  ON public.above_site_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- above_site_interventions: accessible to session owner and admins
CREATE POLICY "Users can view own interventions"
  ON public.above_site_interventions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR target_facility_id IN (
      SELECT id FROM public.facilities 
      WHERE public.can_access_facility_in_jurisdiction(auth.uid(), id)
    )
  );

CREATE POLICY "Above-site users can create interventions"
  ON public.above_site_interventions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND public.has_above_site_role(auth.uid())
  );

-- above_site_audit_log: read-only for own actions, admins see all
CREATE POLICY "Users can view own audit log"
  ON public.above_site_audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.above_site_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_above_site_roles_updated_at
  BEFORE UPDATE ON public.above_site_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jurisdiction_assignments_updated_at
  BEFORE UPDATE ON public.jurisdiction_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();