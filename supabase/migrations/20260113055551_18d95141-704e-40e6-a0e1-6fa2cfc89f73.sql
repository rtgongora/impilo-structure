-- Step 2: Create tables for privileges and ownership

-- PROVIDER PRIVILEGES (Clinical access separate from employment)
CREATE TABLE IF NOT EXISTS public.provider_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  
  privilege_type public.privilege_type NOT NULL,
  status public.privilege_status NOT NULL DEFAULT 'active',
  
  department_scope TEXT[],
  conditions TEXT,
  
  granted_by UUID REFERENCES auth.users(id),
  granted_by_name TEXT,
  granted_by_role TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_privileges_provider ON public.provider_privileges(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_privileges_facility ON public.provider_privileges(facility_id);
CREATE INDEX IF NOT EXISTS idx_provider_privileges_active ON public.provider_privileges(provider_id, facility_id) 
  WHERE status = 'active';

-- PROVIDER FACILITY OWNERSHIP (Business relationships)
CREATE TABLE IF NOT EXISTS public.provider_facility_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  
  ownership_type public.ownership_type NOT NULL,
  ownership_percentage NUMERIC(5,2) CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  is_operator BOOLEAN DEFAULT false,
  
  business_registration_number TEXT,
  partnership_agreement_ref TEXT,
  
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_ownership_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_provider_ownership_provider ON public.provider_facility_ownership(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_ownership_facility ON public.provider_facility_ownership(facility_id);

-- Add PIC columns to facilities
ALTER TABLE public.facilities 
  ADD COLUMN IF NOT EXISTS practitioner_in_charge_id UUID REFERENCES public.health_providers(id),
  ADD COLUMN IF NOT EXISTS pic_appointed_by TEXT,
  ADD COLUMN IF NOT EXISTS pic_effective_from DATE,
  ADD COLUMN IF NOT EXISTS pic_appointment_ref TEXT;

-- RLS POLICIES
ALTER TABLE public.provider_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_facility_ownership ENABLE ROW LEVEL SECURITY;

-- Privileges: Providers see their own, admins see all
CREATE POLICY "Providers view own privileges"
  ON public.provider_privileges FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage privileges"
  ON public.provider_privileges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Ownership: Providers see their own, admins see all  
CREATE POLICY "Providers view own ownership"
  ON public.provider_facility_ownership FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage ownership"
  ON public.provider_facility_ownership FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));