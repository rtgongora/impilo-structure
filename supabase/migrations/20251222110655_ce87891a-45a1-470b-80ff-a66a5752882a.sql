-- Create providers table for iHRIS Provider Registry
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ihris_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  license_number TEXT,
  specialty TEXT,
  department TEXT,
  facility_gofr_id TEXT,
  role TEXT DEFAULT 'doctor',
  status TEXT DEFAULT 'active',
  phone TEXT,
  email TEXT,
  biometric_enrolled BOOLEAN DEFAULT false,
  biometric_fingerprint_hash TEXT,
  biometric_facial_hash TEXT,
  biometric_iris_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can view providers (for lookup)
CREATE POLICY "Authenticated users can view providers"
ON public.providers FOR SELECT TO authenticated
USING (true);

-- Only admins can insert/update providers
CREATE POLICY "Admins can manage providers"
ON public.providers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for fast lookups
CREATE INDEX idx_providers_ihris_id ON public.providers(ihris_id);
CREATE INDEX idx_providers_license ON public.providers(license_number);
CREATE INDEX idx_providers_user_id ON public.providers(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();