-- =====================================================
-- MULTI-TENANT ORGANIZATIONAL HIERARCHY & PLATFORM ROLES
-- Complete migration
-- =====================================================

-- 1. ENUMS
-- =====================================================

CREATE TYPE public.organization_type AS ENUM (
  'government',
  'private',
  'ngo',
  'faith_based',
  'academic',
  'development_partner'
);

CREATE TYPE public.work_context_type AS ENUM (
  'facility',
  'independent',
  'emergency',
  'community_outreach',
  'platform_direct'
);

CREATE TYPE public.user_category AS ENUM (
  'regulated_practitioner',
  'unregulated_staff'
);

CREATE TYPE public.platform_role_type AS ENUM (
  'platform_superuser',
  'platform_support',
  'platform_auditor',
  'platform_tester'
);

-- 2. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  org_type public.organization_type NOT NULL,
  registration_number TEXT,
  tax_id TEXT,
  parent_organization_id UUID REFERENCES public.organizations(id),
  country_code TEXT DEFAULT 'ZW',
  jurisdiction TEXT,
  logo_url TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address JSONB,
  subscription_tier TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add organization ownership to facilities
ALTER TABLE public.facilities 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS managing_organization_id UUID REFERENCES public.organizations(id);

-- 3. ORGANIZATION ADMINISTRATIVE HIERARCHY
-- =====================================================
CREATE TABLE public.org_administrative_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  level_depth INTEGER NOT NULL DEFAULT 0,
  parent_unit_id UUID REFERENCES public.org_administrative_units(id),
  geographic_scope JSONB,
  head_user_id UUID REFERENCES auth.users(id),
  contact_email TEXT,
  contact_phone TEXT,
  can_access_patient_data BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.facility_admin_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  admin_unit_id UUID NOT NULL REFERENCES public.org_administrative_units(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL DEFAULT 'oversight',
  is_primary BOOLEAN DEFAULT false,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(facility_id, admin_unit_id, assignment_type)
);

-- 4. ORGANIZATION STAFF
-- =====================================================
CREATE TABLE public.organization_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_category public.user_category NOT NULL,
  employee_number TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  admin_unit_id UUID REFERENCES public.org_administrative_units(id),
  provider_id UUID REFERENCES public.providers(id),
  employment_type TEXT DEFAULT 'permanent',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_org_admin BOOLEAN DEFAULT false,
  can_manage_facilities BOOLEAN DEFAULT false,
  can_manage_staff BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 5. PLATFORM-LEVEL ROLES
-- =====================================================
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type public.platform_role_type NOT NULL,
  can_view_all_organizations BOOLEAN DEFAULT true,
  can_view_anonymized_clinical BOOLEAN DEFAULT false,
  can_impersonate_for_support BOOLEAN DEFAULT false,
  can_create_test_data BOOLEAN DEFAULT false,
  can_modify_platform_config BOOLEAN DEFAULT false,
  restricted_to_organizations UUID[],
  rate_limit_per_hour INTEGER DEFAULT 1000,
  requires_2fa BOOLEAN DEFAULT true,
  requires_approval_for_actions BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_type)
);

-- 6. UPDATE PROFILES FOR USER CATEGORY
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_category public.user_category DEFAULT 'regulated_practitioner',
  ADD COLUMN IF NOT EXISTS primary_organization_id UUID REFERENCES public.organizations(id);

-- 7. LICENSE-ANCHORED ENCOUNTERS
-- =====================================================
ALTER TABLE public.encounters
  ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES public.facilities(id),
  ADD COLUMN IF NOT EXISTS work_context_type public.work_context_type DEFAULT 'facility',
  ADD COLUMN IF NOT EXISTS provider_license_number TEXT,
  ADD COLUMN IF NOT EXISTS location_description TEXT,
  ADD COLUMN IF NOT EXISTS geo_latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS geo_longitude DECIMAL(11, 8);

-- 8. HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_platform_role(
  _user_id UUID,
  _role_type public.platform_role_type
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id
      AND role_type = _role_type
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND revoked_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.is_platform_superuser(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_platform_role(_user_id, 'platform_superuser')
$$;

CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  is_org_admin BOOLEAN,
  job_title TEXT,
  user_category public.user_category
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    os.organization_id,
    o.name as organization_name,
    os.is_org_admin,
    os.job_title,
    os.user_category
  FROM public.organization_staff os
  JOIN public.organizations o ON o.id = os.organization_id
  WHERE os.user_id = _user_id
    AND os.is_active = true
    AND o.is_active = true
    AND (os.end_date IS NULL OR os.end_date >= CURRENT_DATE)
$$;

CREATE OR REPLACE FUNCTION public.is_licensed_practitioner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.user_category = 'regulated_practitioner'
  )
$$;

-- 9. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_administrative_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_admin_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT USING (
    is_active = true
    AND (
      EXISTS (
        SELECT 1 FROM public.organization_staff os
        WHERE os.organization_id = organizations.id
          AND os.user_id = auth.uid()
          AND os.is_active = true
      )
      OR public.is_platform_superuser(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.organization_staff os
        WHERE os.organization_id = organizations.parent_organization_id
          AND os.user_id = auth.uid()
          AND os.is_active = true
      )
    )
  );

CREATE POLICY "org_staff_select_policy" ON public.organization_staff
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_staff os
      WHERE os.organization_id = organization_staff.organization_id
        AND os.user_id = auth.uid()
        AND os.is_org_admin = true
        AND os.is_active = true
    )
    OR public.is_platform_superuser(auth.uid())
  );

CREATE POLICY "platform_roles_select_policy" ON public.platform_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_platform_superuser(auth.uid())
  );

CREATE POLICY "admin_units_select_policy" ON public.org_administrative_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_staff os
      WHERE os.organization_id = org_administrative_units.organization_id
        AND os.user_id = auth.uid()
        AND os.is_active = true
    )
    OR public.is_platform_superuser(auth.uid())
  );

CREATE POLICY "facility_admin_select_policy" ON public.facility_admin_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_facility_context pfc
      WHERE pfc.facility_id = facility_admin_assignments.facility_id
        AND pfc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_administrative_units au
      JOIN public.organization_staff os ON os.organization_id = au.organization_id
      WHERE au.id = facility_admin_assignments.admin_unit_id
        AND os.user_id = auth.uid()
        AND os.is_active = true
    )
    OR public.is_platform_superuser(auth.uid())
  );

-- 10. INDEXES
-- =====================================================
CREATE INDEX idx_organizations_parent ON public.organizations(parent_organization_id) WHERE parent_organization_id IS NOT NULL;
CREATE INDEX idx_organizations_type ON public.organizations(org_type);
CREATE INDEX idx_org_admin_units_org ON public.org_administrative_units(organization_id);
CREATE INDEX idx_org_admin_units_parent ON public.org_administrative_units(parent_unit_id) WHERE parent_unit_id IS NOT NULL;
CREATE INDEX idx_org_staff_user ON public.organization_staff(user_id);
CREATE INDEX idx_org_staff_org ON public.organization_staff(organization_id);
CREATE INDEX idx_org_staff_provider ON public.organization_staff(provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX idx_platform_roles_user ON public.platform_roles(user_id);
CREATE INDEX idx_facility_admin_facility ON public.facility_admin_assignments(facility_id);
CREATE INDEX idx_facility_admin_unit ON public.facility_admin_assignments(admin_unit_id);
CREATE INDEX idx_facilities_org ON public.facilities(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_encounters_facility ON public.encounters(facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_encounters_context ON public.encounters(work_context_type);

-- 11. TRIGGERS
-- =====================================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_admin_units_updated_at
  BEFORE UPDATE ON public.org_administrative_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_staff_updated_at
  BEFORE UPDATE ON public.organization_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_roles_updated_at
  BEFORE UPDATE ON public.platform_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();