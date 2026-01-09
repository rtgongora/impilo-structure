-- Add services array to facilities (stores service codes directly on each facility)
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';

-- Create service catalog reference table (different from facility_services junction table)
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  requires_capabilities TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Authenticated users can view service catalog"
ON public.service_catalog FOR SELECT
TO authenticated
USING (true);

-- Admin-only write access
CREATE POLICY "Registry admins can manage service catalog"
ON public.service_catalog FOR ALL
USING (
  public.has_registry_role(auth.uid(), 'registry_super_admin') OR
  public.has_registry_role(auth.uid(), 'facility_registry_admin')
);

-- Seed common healthcare services
INSERT INTO public.service_catalog (code, name, category, sort_order) VALUES
-- Clinical Services
('opd', 'Outpatient Department', 'clinical', 1),
('inpatient', 'Inpatient Services', 'clinical', 2),
('emergency', 'Emergency Services', 'clinical', 3),
('icu', 'Intensive Care Unit', 'clinical', 4),
('nicu', 'Neonatal ICU', 'clinical', 5),
('theatre', 'Operating Theatre', 'clinical', 6),
('maternity', 'Maternity Services', 'clinical', 7),
('labor_delivery', 'Labour & Delivery', 'clinical', 8),
('dialysis', 'Dialysis Unit', 'clinical', 9),
('oncology', 'Oncology Services', 'clinical', 10),
('chemotherapy', 'Chemotherapy', 'clinical', 11),
('radiotherapy', 'Radiotherapy', 'clinical', 12),
('burns', 'Burns Unit', 'clinical', 13),
('trauma', 'Trauma Centre', 'clinical', 14),
('resuscitation', 'Resuscitation Bay', 'clinical', 15),
-- Diagnostics
('laboratory', 'Laboratory Services', 'diagnostics', 20),
('radiology', 'Radiology/Imaging', 'diagnostics', 21),
('xray', 'X-Ray', 'diagnostics', 22),
('ultrasound', 'Ultrasound', 'diagnostics', 23),
('ct_scan', 'CT Scan', 'diagnostics', 24),
('mri', 'MRI', 'diagnostics', 25),
('pathology', 'Pathology', 'diagnostics', 26),
-- Pharmacy
('pharmacy', 'Pharmacy', 'pharmacy', 30),
('dispensary', 'Dispensary', 'pharmacy', 31),
-- Specialized
('physiotherapy', 'Physiotherapy', 'specialized', 40),
('occupational_therapy', 'Occupational Therapy', 'specialized', 41),
('speech_therapy', 'Speech Therapy', 'specialized', 42),
('mental_health', 'Mental Health Services', 'specialized', 43),
('dental', 'Dental Services', 'specialized', 44),
('ophthalmology', 'Ophthalmology', 'specialized', 45),
('ent', 'ENT Services', 'specialized', 46),
('dermatology', 'Dermatology', 'specialized', 47),
('cardiology', 'Cardiology', 'specialized', 48),
('neurology', 'Neurology', 'specialized', 49),
('orthopedics', 'Orthopedics', 'specialized', 50),
('pediatrics', 'Pediatrics', 'specialized', 51),
-- Primary Care
('immunization', 'Immunization', 'primary_care', 60),
('antenatal', 'Antenatal Care', 'primary_care', 61),
('postnatal', 'Postnatal Care', 'primary_care', 62),
('family_planning', 'Family Planning', 'primary_care', 63),
('hiv_services', 'HIV/AIDS Services', 'primary_care', 64),
('tb_services', 'TB Services', 'primary_care', 65),
('chronic_care', 'Chronic Disease Management', 'primary_care', 66),
-- Support
('blood_bank', 'Blood Bank', 'support', 70),
('mortuary', 'Mortuary', 'support', 71),
('ambulance', 'Ambulance Services', 'support', 72),
('telemedicine', 'Telemedicine', 'support', 73)
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_facilities_services ON public.facilities USING GIN(services);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON public.service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_service_catalog_code ON public.service_catalog(code);