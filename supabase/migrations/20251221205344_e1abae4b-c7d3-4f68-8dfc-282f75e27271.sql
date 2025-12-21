-- Add OpenHIE registry identifiers to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS provider_registry_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS facility_id TEXT,
ADD COLUMN IF NOT EXISTS biometric_fingerprint_hash TEXT,
ADD COLUMN IF NOT EXISTS biometric_facial_hash TEXT,
ADD COLUMN IF NOT EXISTS biometric_iris_hash TEXT,
ADD COLUMN IF NOT EXISTS biometric_enrolled_at TIMESTAMP WITH TIME ZONE;

-- Create patients registry table for Impilo ID (MOSIP Client Registry)
CREATE TABLE IF NOT EXISTS public.patient_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  impilo_id TEXT UNIQUE NOT NULL,
  mosip_uin TEXT UNIQUE,
  biometric_fingerprint_hash TEXT,
  biometric_facial_hash TEXT,
  biometric_iris_hash TEXT,
  biometric_enrolled_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create facility registry table (GOFR)
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gofr_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  level TEXT,
  address_line1 TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'South Africa',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create provider registry audit table (iHRIS)
CREATE TABLE IF NOT EXISTS public.provider_registry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_registry_id TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  biometric_method TEXT,
  verification_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_registry_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_identifiers
CREATE POLICY "Authenticated users can view patient identifiers"
ON public.patient_identifiers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patient identifiers"
ON public.patient_identifiers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient identifiers"
ON public.patient_identifiers FOR UPDATE
TO authenticated
USING (true);

-- RLS policies for facilities (public read)
CREATE POLICY "Anyone can view facilities"
ON public.facilities FOR SELECT
USING (true);

CREATE POLICY "Admins can manage facilities"
ON public.facilities FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for provider registry logs
CREATE POLICY "Users can view their own logs"
ON public.provider_registry_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert logs"
ON public.provider_registry_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_provider_registry_id ON public.profiles(provider_registry_id);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_impilo_id ON public.patient_identifiers(impilo_id);
CREATE INDEX IF NOT EXISTS idx_facilities_gofr_id ON public.facilities(gofr_id);

-- Insert sample facilities
INSERT INTO public.facilities (gofr_id, name, facility_type, level, city, province) VALUES
('GOFR-ZA-001', 'Chris Hani Baragwanath Academic Hospital', 'Hospital', 'Tertiary', 'Johannesburg', 'Gauteng'),
('GOFR-ZA-002', 'Groote Schuur Hospital', 'Hospital', 'Tertiary', 'Cape Town', 'Western Cape'),
('GOFR-ZA-003', 'Steve Biko Academic Hospital', 'Hospital', 'Tertiary', 'Pretoria', 'Gauteng'),
('GOFR-ZA-004', 'Inkosi Albert Luthuli Central Hospital', 'Hospital', 'Tertiary', 'Durban', 'KwaZulu-Natal'),
('GOFR-ZA-005', 'Tygerberg Hospital', 'Hospital', 'Tertiary', 'Cape Town', 'Western Cape')
ON CONFLICT (gofr_id) DO NOTHING;