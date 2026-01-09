-- Professional Councils table (MCAZ, PCZ, NCZ, etc.)
CREATE TABLE public.professional_councils (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    description TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    jurisdiction_cadres TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Council admin assignments
CREATE TABLE public.council_administrators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    council_id UUID NOT NULL REFERENCES public.professional_councils(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    can_verify_licenses BOOLEAN DEFAULT false,
    can_approve_registrations BOOLEAN DEFAULT false,
    can_suspend_providers BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    appointed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    appointed_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(council_id, user_id)
);

-- Add council reference to health_providers
ALTER TABLE public.health_providers 
ADD COLUMN IF NOT EXISTS professional_council_id UUID REFERENCES public.professional_councils(id),
ADD COLUMN IF NOT EXISTS council_registration_number TEXT,
ADD COLUMN IF NOT EXISTS council_registration_date DATE,
ADD COLUMN IF NOT EXISTS council_registration_expires DATE;

-- Add more reference data tables
CREATE TABLE IF NOT EXISTS public.ref_specializations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    applicable_cadres TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_funds_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_employment_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_cadres (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    council_id UUID REFERENCES public.professional_councils(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HPR Audit log for all registry changes
CREATE TABLE public.hpr_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by UUID NOT NULL,
    performed_by_name TEXT,
    council_id UUID REFERENCES public.professional_councils(id),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_funds_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_employment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_cadres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpr_audit_log ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Authenticated users can view councils" ON public.professional_councils FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view ref_specializations" ON public.ref_specializations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view ref_funds_sources" ON public.ref_funds_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view ref_employment_types" ON public.ref_employment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view ref_cadres" ON public.ref_cadres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view audit log" ON public.hpr_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Council admins can view their assignments" ON public.council_administrators FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admin write policies
CREATE POLICY "Admins can manage councils" ON public.professional_councils FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage council admins" ON public.council_administrators FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ref_specializations" ON public.ref_specializations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ref_funds_sources" ON public.ref_funds_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ref_employment_types" ON public.ref_employment_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ref_cadres" ON public.ref_cadres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit log" ON public.hpr_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Insert seed data for professional councils
INSERT INTO public.professional_councils (code, name, abbreviation, description, jurisdiction_cadres) VALUES
('MCAZ', 'Medical and Dental Practitioners Council of Zimbabwe', 'MCAZ', 'Regulates medical doctors, dentists, and dental specialists', ARRAY['medical_doctor', 'dentist', 'dental_specialist']),
('NCZ', 'Nurses Council of Zimbabwe', 'NCZ', 'Regulates nurses and midwives', ARRAY['registered_nurse', 'midwife', 'nurse_aide']),
('PCZ', 'Pharmacists Council of Zimbabwe', 'PCZ', 'Regulates pharmacists and pharmacy technicians', ARRAY['pharmacist', 'pharmacy_technician']),
('AHPCZ', 'Allied Health Practitioners Council of Zimbabwe', 'AHPCZ', 'Regulates allied health practitioners', ARRAY['physiotherapist', 'radiographer', 'laboratory_scientist', 'occupational_therapist']),
('ZPC', 'Zimbabwe Psychologists Council', 'ZPC', 'Regulates psychologists and counselors', ARRAY['clinical_psychologist', 'counselor']),
('MLSCZ', 'Medical Laboratory and Clinical Scientists Council of Zimbabwe', 'MLSCZ', 'Regulates laboratory scientists and technicians', ARRAY['laboratory_scientist', 'laboratory_technician'])
ON CONFLICT (code) DO NOTHING;

-- Insert seed reference data
INSERT INTO public.ref_specializations (code, name, category, applicable_cadres) VALUES
('general_practice', 'General Practice', 'Primary Care', ARRAY['medical_doctor']),
('internal_medicine', 'Internal Medicine', 'Medical Specialties', ARRAY['medical_doctor']),
('surgery', 'General Surgery', 'Surgical Specialties', ARRAY['medical_doctor']),
('pediatrics', 'Pediatrics', 'Medical Specialties', ARRAY['medical_doctor']),
('obstetrics_gynecology', 'Obstetrics & Gynecology', 'Surgical Specialties', ARRAY['medical_doctor']),
('psychiatry', 'Psychiatry', 'Medical Specialties', ARRAY['medical_doctor']),
('emergency_medicine', 'Emergency Medicine', 'Medical Specialties', ARRAY['medical_doctor']),
('anesthesiology', 'Anesthesiology', 'Surgical Specialties', ARRAY['medical_doctor']),
('radiology', 'Radiology', 'Diagnostic Specialties', ARRAY['medical_doctor']),
('pathology', 'Pathology', 'Diagnostic Specialties', ARRAY['medical_doctor']),
('critical_care', 'Critical Care Nursing', 'Nursing Specialties', ARRAY['registered_nurse']),
('oncology_nursing', 'Oncology Nursing', 'Nursing Specialties', ARRAY['registered_nurse']),
('community_pharmacy', 'Community Pharmacy', 'Pharmacy Specialties', ARRAY['pharmacist']),
('clinical_pharmacy', 'Clinical Pharmacy', 'Pharmacy Specialties', ARRAY['pharmacist'])
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ref_funds_sources (code, name, description) VALUES
('government', 'Government/Treasury', 'Central government payroll'),
('facility', 'Facility/Hospital', 'Direct hospital employment'),
('ngo', 'NGO/Donor', 'Non-governmental organization funding'),
('private', 'Private Practice', 'Self-employed or private clinic'),
('university', 'University/Academic', 'University or academic institution'),
('international', 'International Organization', 'WHO, UNICEF, etc.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ref_employment_types (code, name) VALUES
('permanent', 'Permanent'),
('contract', 'Contract'),
('temporary', 'Temporary'),
('locum', 'Locum'),
('intern', 'Intern/Trainee'),
('volunteer', 'Volunteer')
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_council_admins_council ON public.council_administrators(council_id);
CREATE INDEX IF NOT EXISTS idx_council_admins_user ON public.council_administrators(user_id);
CREATE INDEX IF NOT EXISTS idx_hpr_audit_entity ON public.hpr_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hpr_audit_date ON public.hpr_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hpr_audit_council ON public.hpr_audit_log(council_id);
CREATE INDEX IF NOT EXISTS idx_providers_council ON public.health_providers(professional_council_id);