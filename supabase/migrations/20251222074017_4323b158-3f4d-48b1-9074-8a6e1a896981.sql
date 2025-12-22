-- =============================================
-- ID GENERATION & COMPOSITE IMPILO ID ARCHITECTURE
-- =============================================
-- Impilo ID = Client Registry ID (CR-ID) + SHR ID
-- Client always has complete key
-- Client Registry requires complete key OR biometrics to link to SHR

-- Add SHR ID component to patient_identifiers
ALTER TABLE public.patient_identifiers 
ADD COLUMN IF NOT EXISTS shr_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS client_registry_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS id_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS id_generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS id_generation_method TEXT DEFAULT 'system';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_shr_id ON public.patient_identifiers(shr_id);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_client_registry_id ON public.patient_identifiers(client_registry_id);

-- Create ID generation audit log table
CREATE TABLE IF NOT EXISTS public.id_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'provider', 'facility', 'shr_record')),
  generated_id TEXT NOT NULL,
  id_format TEXT NOT NULL,
  generation_method TEXT NOT NULL DEFAULT 'cryptographic',
  entropy_source TEXT,
  linked_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  metadata JSONB
);

-- Enable RLS on id_generation_logs
ALTER TABLE public.id_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view ID generation logs
CREATE POLICY "Staff can view ID generation logs"
  ON public.id_generation_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: System can insert ID generation logs
CREATE POLICY "System can insert ID generation logs"
  ON public.id_generation_logs
  FOR INSERT
  WITH CHECK (true);

-- Create ID sequence tracker for sequential component (helps with uniqueness)
CREATE TABLE IF NOT EXISTS public.id_sequence_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  counter_type TEXT NOT NULL UNIQUE,
  current_value BIGINT NOT NULL DEFAULT 0,
  prefix TEXT,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on id_sequence_counters
ALTER TABLE public.id_sequence_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view counters
CREATE POLICY "Staff can view ID counters"
  ON public.id_sequence_counters
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: System can manage counters
CREATE POLICY "System can manage ID counters"
  ON public.id_sequence_counters
  FOR ALL
  USING (true);

-- Initialize counter types
INSERT INTO public.id_sequence_counters (counter_type, prefix, current_value)
VALUES 
  ('client_registry', 'CR', 0),
  ('shr_record', 'SHR', 0),
  ('provider_registry', 'VARAPI', 0),
  ('facility_registry', 'THUSO', 0)
ON CONFLICT (counter_type) DO NOTHING;

-- Function to generate next sequence number atomically
CREATE OR REPLACE FUNCTION public.get_next_id_sequence(p_counter_type TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  UPDATE public.id_sequence_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE counter_type = p_counter_type
  RETURNING current_value INTO next_val;
  
  IF next_val IS NULL THEN
    INSERT INTO public.id_sequence_counters (counter_type, current_value)
    VALUES (p_counter_type, 1)
    RETURNING current_value INTO next_val;
  END IF;
  
  RETURN next_val;
END;
$$;

-- Function to generate Client Registry ID
CREATE OR REPLACE FUNCTION public.generate_client_registry_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num BIGINT;
  random_part TEXT;
  check_digit INTEGER;
  cr_id TEXT;
BEGIN
  -- Get next sequence number
  seq_num := get_next_id_sequence('client_registry');
  
  -- Generate random component (4 alphanumeric chars)
  random_part := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  
  -- Format: CR-YYYYMMDD-NNNNNN-XXXX
  cr_id := 'CR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_num::text, 6, '0') || '-' || random_part;
  
  RETURN cr_id;
END;
$$;

-- Function to generate SHR ID
CREATE OR REPLACE FUNCTION public.generate_shr_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num BIGINT;
  random_part TEXT;
  shr_id TEXT;
BEGIN
  -- Get next sequence number
  seq_num := get_next_id_sequence('shr_record');
  
  -- Generate random component (6 alphanumeric chars for higher entropy)
  random_part := upper(substr(md5(random()::text || clock_timestamp()::text || seq_num::text), 1, 6));
  
  -- Format: SHR-NNNNNNNN-XXXXXX
  shr_id := 'SHR-' || lpad(seq_num::text, 8, '0') || '-' || random_part;
  
  RETURN shr_id;
END;
$$;

-- Function to generate composite Impilo ID
CREATE OR REPLACE FUNCTION public.generate_impilo_id()
RETURNS TABLE(impilo_id TEXT, client_registry_id TEXT, shr_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cr_id TEXT;
  v_shr_id TEXT;
  v_impilo_id TEXT;
BEGIN
  -- Generate both components
  v_cr_id := generate_client_registry_id();
  v_shr_id := generate_shr_id();
  
  -- Composite format: {CR-ID}|{SHR-ID}
  -- Client card shows full ID, system can split for lookups
  v_impilo_id := v_cr_id || '|' || v_shr_id;
  
  impilo_id := v_impilo_id;
  client_registry_id := v_cr_id;
  shr_id := v_shr_id;
  
  RETURN NEXT;
END;
$$;

-- Function to generate Provider Registry ID
CREATE OR REPLACE FUNCTION public.generate_provider_registry_id(p_province_code TEXT DEFAULT 'ZW')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num BIGINT;
  random_part TEXT;
  provider_id TEXT;
BEGIN
  seq_num := get_next_id_sequence('provider_registry');
  random_part := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  
  -- Format: VARAPI-YYYY-PPNNNNNN-XXXX (PP = province code)
  provider_id := 'VARAPI-' || to_char(now(), 'YYYY') || '-' || 
                 upper(p_province_code) || lpad(seq_num::text, 6, '0') || '-' || random_part;
  
  RETURN provider_id;
END;
$$;

-- Function to generate Facility Registry ID
CREATE OR REPLACE FUNCTION public.generate_facility_registry_id(p_province_code TEXT DEFAULT 'ZW')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num BIGINT;
  random_part TEXT;
  facility_id TEXT;
BEGIN
  seq_num := get_next_id_sequence('facility_registry');
  random_part := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 3));
  
  -- Format: THUSO-PP-NNNNNN-XXX
  facility_id := 'THUSO-' || upper(p_province_code) || '-' || 
                 lpad(seq_num::text, 6, '0') || '-' || random_part;
  
  RETURN facility_id;
END;
$$;