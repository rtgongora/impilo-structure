-- =====================================================
-- SECURITY  GOVERNANCE FIXUPS (POST-ORG MIGRATION)
-- - Remove role-like fields from profiles (avoid client self-escalation)
-- - Enforce license-first practitioner check via Provider Registry tables
-- - Improve RLS for organization self-registration bootstrap
-- =====================================================

-- 1) Remove user_category / primary_organization_id from profiles
--    (roles/authority data must not be user-editable via profile updates)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS user_category,
  DROP COLUMN IF EXISTS primary_organization_id;

-- 2) License-first check (licensed practitioners can do independent/emergency work)
CREATE OR REPLACE FUNCTION public.is_licensed_practitioner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.health_providers hp
    WHERE hp.user_id = _user_id
      AND hp.lifecycle_state = 'active'
  )
  AND EXISTS (
    SELECT 1
    FROM public.health_providers hp
    JOIN public.provider_licenses pl ON pl.provider_id = hp.id
    WHERE hp.user_id = _user_id
      AND pl.status = 'active'
      AND pl.expiry_date >= CURRENT_DATE
  )
$$;

-- 3) Helper: org admin check without RLS recursion
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_staff os
    WHERE os.user_id = _user_id
      AND os.organization_id = _organization_id
      AND os.is_active = true
      AND os.is_org_admin = true
      AND (os.end_date IS NULL OR os.end_date >= CURRENT_DATE)
  )
$$;

-- 4) RLS POLICY UPDATES (bootstrap-friendly)
-- =====================================================

-- Organizations: include creator visibility
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT
  USING (
    is_active = true
    AND (
      created_by = auth.uid()
      OR EXISTS (
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

-- Allow any authenticated user to self-register an organization they create
DROP POLICY IF EXISTS "org_insert_policy" ON public.organizations;
CREATE POLICY "org_insert_policy" ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow org creator, org admins, global admins, or platform superuser to update
DROP POLICY IF EXISTS "org_update_policy" ON public.organizations;
CREATE POLICY "org_update_policy" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_org_admin(auth.uid(), organizations.id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_platform_superuser(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_org_admin(auth.uid(), organizations.id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_platform_superuser(auth.uid())
  );

-- Organization staff: keep SELECT policy, add INSERT/UPDATE for org admins and bootstrap
DROP POLICY IF EXISTS "org_staff_select_policy" ON public.organization_staff;
CREATE POLICY "org_staff_select_policy" ON public.organization_staff
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_org_admin(auth.uid(), organization_staff.organization_id)
    OR public.is_platform_superuser(auth.uid())
  );

-- Bootstrap: creator can add themselves as org admin for their org
DROP POLICY IF EXISTS "org_staff_insert_policy" ON public.organization_staff;
CREATE POLICY "org_staff_insert_policy" ON public.organization_staff
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superuser(auth.uid())
    OR public.is_org_admin(auth.uid(), organization_staff.organization_id)
    OR (
      organization_staff.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = organization_staff.organization_id
          AND o.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "org_staff_update_policy" ON public.organization_staff;
CREATE POLICY "org_staff_update_policy" ON public.organization_staff
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superuser(auth.uid())
    OR public.is_org_admin(auth.uid(), organization_staff.organization_id)
  )
  WITH CHECK (
    public.is_platform_superuser(auth.uid())
    OR public.is_org_admin(auth.uid(), organization_staff.organization_id)
  );

-- Administrative units: allow org admins/platform superusers to manage
DROP POLICY IF EXISTS "admin_units_select_policy" ON public.org_administrative_units;
CREATE POLICY "admin_units_select_policy" ON public.org_administrative_units
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_staff os
      WHERE os.organization_id = org_administrative_units.organization_id
        AND os.user_id = auth.uid()
        AND os.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_administrative_units.organization_id
        AND o.created_by = auth.uid()
    )
    OR public.is_platform_superuser(auth.uid())
  );

DROP POLICY IF EXISTS "admin_units_write_policy" ON public.org_administrative_units;
CREATE POLICY "admin_units_write_policy" ON public.org_administrative_units
  FOR ALL
  TO authenticated
  USING (
    public.is_platform_superuser(auth.uid())
    OR public.is_org_admin(auth.uid(), org_administrative_units.organization_id)
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_administrative_units.organization_id
        AND o.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.is_platform_superuser(auth.uid())
    OR public.is_org_admin(auth.uid(), org_administrative_units.organization_id)
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_administrative_units.organization_id
        AND o.created_by = auth.uid()
    )
  );

-- Facility admin assignments: allow org admins/platform superusers to manage
DROP POLICY IF EXISTS "facility_admin_select_policy" ON public.facility_admin_assignments;
CREATE POLICY "facility_admin_select_policy" ON public.facility_admin_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_facility_context pfc
      WHERE pfc.facility_id = facility_admin_assignments.facility_id
        AND pfc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_administrative_units au
      WHERE au.id = facility_admin_assignments.admin_unit_id
        AND (
          public.is_org_admin(auth.uid(), au.organization_id)
          OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = au.organization_id
              AND o.created_by = auth.uid()
          )
        )
    )
    OR public.is_platform_superuser(auth.uid())
  );

DROP POLICY IF EXISTS "facility_admin_write_policy" ON public.facility_admin_assignments;
CREATE POLICY "facility_admin_write_policy" ON public.facility_admin_assignments
  FOR ALL
  TO authenticated
  USING (
    public.is_platform_superuser(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_administrative_units au
      WHERE au.id = facility_admin_assignments.admin_unit_id
        AND (
          public.is_org_admin(auth.uid(), au.organization_id)
          OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = au.organization_id
              AND o.created_by = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    public.is_platform_superuser(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_administrative_units au
      WHERE au.id = facility_admin_assignments.admin_unit_id
        AND (
          public.is_org_admin(auth.uid(), au.organization_id)
          OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = au.organization_id
              AND o.created_by = auth.uid()
          )
        )
    )
  );

-- Platform roles: only platform superuser can manage
DROP POLICY IF EXISTS "platform_roles_select_policy" ON public.platform_roles;
CREATE POLICY "platform_roles_select_policy" ON public.platform_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_platform_superuser(auth.uid())
  );

DROP POLICY IF EXISTS "platform_roles_write_policy" ON public.platform_roles;
CREATE POLICY "platform_roles_write_policy" ON public.platform_roles
  FOR ALL
  TO authenticated
  USING (public.is_platform_superuser(auth.uid()))
  WITH CHECK (public.is_platform_superuser(auth.uid()));
