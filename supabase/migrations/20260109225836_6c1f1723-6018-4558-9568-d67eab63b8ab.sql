-- Drop and recreate the facility_capabilities view to include facility-specific services
DROP VIEW IF EXISTS public.facility_capabilities;

CREATE OR REPLACE VIEW public.facility_capabilities AS
SELECT 
  f.id AS facility_id,
  f.name AS facility_name,
  f.facility_code,
  ft.code AS facility_type_code,
  ft.name AS facility_type_name,
  ft.level_of_care,
  ft.category,
  -- Merge facility-type capabilities with facility-specific services
  -- Use COALESCE to handle NULLs, and array_cat + array_distinct to merge and deduplicate
  (
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        COALESCE(ft.capabilities, '{}') || COALESCE(f.services, '{}')
      )
    )
  ) AS capabilities,
  -- Also expose raw facility services for reference
  COALESCE(f.services, '{}') AS facility_services
FROM public.facilities f
LEFT JOIN public.facility_types ft ON f.facility_type_id = ft.id
WHERE f.is_active = true;