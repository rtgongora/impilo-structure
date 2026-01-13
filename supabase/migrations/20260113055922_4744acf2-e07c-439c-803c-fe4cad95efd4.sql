-- Complete provider-facility relationships setup

-- Enum types (safe creation)
DO $$ BEGIN CREATE TYPE public.affiliation_type AS ENUM ('employed', 'contracted', 'honorary', 'locum', 'volunteer', 'student'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.employer_type AS ENUM ('facility', 'mohcc', 'ngo', 'agency', 'self', 'university', 'mission', 'private_company'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.administrative_role AS ENUM ('ceo', 'medical_director', 'nursing_director', 'hod', 'unit_lead', 'matron', 'sister_in_charge', 'coordinator', 'supervisor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns to provider_affiliations
ALTER TABLE public.provider_affiliations 
  ADD COLUMN IF NOT EXISTS affiliation_type_v2 TEXT DEFAULT 'employed',
  ADD COLUMN IF NOT EXISTS employer_type_v2 TEXT DEFAULT 'facility',
  ADD COLUMN IF NOT EXISTS employer_name TEXT,
  ADD COLUMN IF NOT EXISTS hours_per_week NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS administrative_role_v2 TEXT;

-- VIEW: Provider's accessible facilities 
CREATE OR REPLACE VIEW public.provider_facility_context 
WITH (security_invoker = true)
AS
SELECT 
  hp.id AS provider_id,
  hp.first_name || ' ' || hp.surname AS provider_name,
  hp.upid AS varapi_id,
  hp.user_id,
  f.id AS facility_id,
  f.name AS facility_name,
  f.facility_type,
  f.level AS level_of_care,
  
  -- Affiliation info
  pa.id AS affiliation_id,
  pa.employment_type,
  pa.affiliation_type_v2 AS affiliation_type,
  pa.employer_type_v2 AS employer_type,
  pa.employer_name,
  CASE WHEN pa.is_active THEN 'active' ELSE 'inactive' END AS employment_status,
  pa.is_primary,
  pa.position_title AS job_title,
  pa.department,
  pa.administrative_role_v2 AS administrative_role,
  pa.hours_per_week,
  
  -- Ownership info
  pfo.ownership_percentage,
  pfo.is_operator,
  pfo.ownership_type::TEXT,
  
  -- PIC status
  (f.practitioner_in_charge_id = hp.id) AS is_pic,
  
  -- Privileges from affiliation
  COALESCE(pa.privileges, ARRAY[]::TEXT[]) AS affiliation_privileges,
  
  -- Access determination
  CASE 
    WHEN pa.is_active = true AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_DATE) THEN true
    WHEN pfo.id IS NOT NULL AND (pfo.effective_to IS NULL OR pfo.effective_to >= CURRENT_DATE) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.provider_privileges pp 
      WHERE pp.provider_id = hp.id AND pp.facility_id = f.id 
      AND pp.status = 'active' 
      AND (pp.expires_at IS NULL OR pp.expires_at >= CURRENT_DATE)
    ) THEN true
    ELSE false
  END AS can_access_facility,
  
  -- Context label for UI display
  CASE
    WHEN pfo.is_operator THEN 'Owner/Operator'
    WHEN pfo.id IS NOT NULL THEN 'Owner'
    WHEN pa.administrative_role_v2 IS NOT NULL THEN initcap(replace(pa.administrative_role_v2, '_', ' '))
    WHEN pa.affiliation_type_v2 = 'honorary' THEN 'Honorary Consultant'
    WHEN pa.affiliation_type_v2 = 'locum' THEN 'Locum'
    WHEN pa.employer_type_v2 = 'mohcc' THEN 'MoHCC Staff'
    ELSE 'Staff'
  END AS context_label

FROM public.health_providers hp
LEFT JOIN public.provider_affiliations pa ON pa.provider_id = hp.id
LEFT JOIN public.facilities f ON f.id::TEXT = pa.facility_id OR f.gofr_id = pa.facility_id
LEFT JOIN public.provider_facility_ownership pfo ON pfo.provider_id = hp.id AND pfo.facility_id = f.id
WHERE hp.user_id IS NOT NULL;

-- FUNCTION: Get provider's accessible facilities for login
CREATE OR REPLACE FUNCTION public.get_provider_facilities(_user_id UUID)
RETURNS TABLE (
  facility_id UUID,
  facility_name TEXT,
  facility_type TEXT,
  level_of_care TEXT,
  context_label TEXT,
  is_primary BOOLEAN,
  is_pic BOOLEAN,
  is_owner BOOLEAN,
  can_access BOOLEAN,
  privileges TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    pfc.facility_id,
    pfc.facility_name,
    pfc.facility_type,
    pfc.level_of_care,
    pfc.context_label,
    COALESCE(pfc.is_primary, false),
    COALESCE(pfc.is_pic, false),
    (pfc.ownership_percentage IS NOT NULL) AS is_owner,
    pfc.can_access_facility,
    pfc.affiliation_privileges
  FROM public.provider_facility_context pfc
  WHERE pfc.user_id = _user_id
    AND pfc.can_access_facility = true
    AND pfc.facility_id IS NOT NULL
  ORDER BY 
    COALESCE(pfc.is_primary, false) DESC,
    COALESCE(pfc.is_pic, false) DESC,
    pfc.facility_name
$$;