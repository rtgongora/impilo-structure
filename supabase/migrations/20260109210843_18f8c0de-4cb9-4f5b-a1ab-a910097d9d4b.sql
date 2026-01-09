-- Add capabilities array to facility_types to define what services each type supports
ALTER TABLE public.facility_types
ADD COLUMN capabilities text[] DEFAULT '{}';

-- Define standard capability codes
COMMENT ON COLUMN public.facility_types.capabilities IS 'Array of capability codes: theatre, inpatient, icu, maternity, dialysis, radiology, laboratory, pharmacy, blood_bank, dental, mental_health, rehabilitation, emergency_24hr, chemotherapy, radiotherapy, pacs, lims';

-- Update facility types with their capabilities based on level_of_care and category

-- Quaternary (Central Hospital) - Full capabilities
UPDATE public.facility_types 
SET capabilities = ARRAY['theatre', 'inpatient', 'icu', 'maternity', 'dialysis', 'radiology', 'laboratory', 'pharmacy', 'blood_bank', 'dental', 'mental_health', 'rehabilitation', 'emergency_24hr', 'chemotherapy', 'radiotherapy', 'pacs', 'lims', 'teleconsult']
WHERE level_of_care = 'quaternary' AND category = 'hospital';

-- Tertiary (Provincial Hospital) - Most capabilities
UPDATE public.facility_types 
SET capabilities = ARRAY['theatre', 'inpatient', 'icu', 'maternity', 'dialysis', 'radiology', 'laboratory', 'pharmacy', 'blood_bank', 'emergency_24hr', 'pacs', 'lims', 'teleconsult']
WHERE level_of_care = 'tertiary' AND category = 'hospital';

-- Secondary (District/Mission/Private Hospital) - Core hospital capabilities
UPDATE public.facility_types 
SET capabilities = ARRAY['theatre', 'inpatient', 'maternity', 'radiology', 'laboratory', 'pharmacy', 'emergency_24hr', 'lims', 'teleconsult']
WHERE level_of_care = 'secondary' AND category = 'hospital';

-- Primary clinics - Basic capabilities only
UPDATE public.facility_types 
SET capabilities = ARRAY['outpatient', 'pharmacy_basic', 'immunization', 'anc', 'teleconsult', 'referral']
WHERE level_of_care = 'primary' AND category = 'clinic';

-- Pharmacy types
UPDATE public.facility_types 
SET capabilities = ARRAY['pharmacy', 'dispensing']
WHERE category = 'pharmacy';

-- Laboratory types
UPDATE public.facility_types 
SET capabilities = ARRAY['laboratory', 'lims', 'specimen_collection']
WHERE level_of_care = 'quaternary' AND category = 'laboratory';

UPDATE public.facility_types 
SET capabilities = ARRAY['laboratory', 'lims']
WHERE level_of_care IN ('tertiary', 'secondary') AND category = 'laboratory';

UPDATE public.facility_types 
SET capabilities = ARRAY['laboratory', 'specimen_collection']
WHERE level_of_care = 'primary' AND category = 'laboratory';

-- Imaging center
UPDATE public.facility_types 
SET capabilities = ARRAY['radiology', 'pacs']
WHERE category = 'diagnostic';

-- Blood bank
UPDATE public.facility_types 
SET capabilities = ARRAY['blood_bank', 'laboratory']
WHERE category = 'blood_services';

-- Rehabilitation
UPDATE public.facility_types 
SET capabilities = ARRAY['rehabilitation', 'physiotherapy', 'occupational_therapy']
WHERE category = 'rehabilitation';

-- Mental health
UPDATE public.facility_types 
SET capabilities = ARRAY['mental_health', 'inpatient', 'outpatient', 'psychotherapy']
WHERE category = 'mental_health';

-- Dental
UPDATE public.facility_types 
SET capabilities = ARRAY['dental', 'outpatient']
WHERE category = 'dental';

-- Create a view for easy facility capability lookup
CREATE OR REPLACE VIEW public.facility_capabilities AS
SELECT 
  f.id as facility_id,
  f.name as facility_name,
  f.facility_code,
  ft.code as facility_type_code,
  ft.name as facility_type_name,
  ft.level_of_care,
  ft.category,
  ft.capabilities
FROM public.facilities f
LEFT JOIN public.facility_types ft ON f.facility_type_id = ft.id
WHERE f.is_active = true;

-- Grant access to the view
ALTER VIEW public.facility_capabilities OWNER TO postgres;

-- Create index for faster capability lookups
CREATE INDEX IF NOT EXISTS idx_facility_types_capabilities ON public.facility_types USING GIN (capabilities);

-- Add facility_id foreign key reference to profiles if it doesn't exist properly
-- (it exists as text, let's keep it as text for flexibility with external systems)
COMMENT ON COLUMN public.profiles.facility_id IS 'Reference to the user assigned facility (from Facility Registry or external system ID)';