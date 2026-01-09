-- ============================================
-- REGISTRY ADMIN ROLES
-- Role-based access by registry type
-- ============================================

-- Add new registry admin roles to the app_role enum if they don't exist
-- Note: Using a separate table for granular registry permissions

-- Create registry_role type for registry-specific permissions
CREATE TYPE public.registry_role AS ENUM (
  'client_registry_admin',     -- Manages Client Registry (MOSIP/patient identity)
  'provider_registry_admin',   -- Manages Provider Registry (Varapi/healthcare workers)
  'facility_registry_admin',   -- Manages Facility Registry (Thuso/facilities)
  'terminology_admin',         -- Manages Terminology Service
  'shr_admin',                 -- Manages Shared Health Records
  'ndr_admin',                 -- Manages National Data Repository
  'registry_super_admin'       -- Full access to all registries
);

-- Registry admin roles table
CREATE TABLE public.registry_admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registry_role registry_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(user_id, registry_role)
);

-- Enable RLS
ALTER TABLE public.registry_admin_roles ENABLE ROW LEVEL SECURITY;

-- Only registry super admins or system admins can view/manage registry roles
CREATE POLICY "Registry admins can view their own roles"
  ON public.registry_admin_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.registry_admin_roles rar
      WHERE rar.user_id = auth.uid() 
      AND rar.registry_role = 'registry_super_admin'
      AND rar.is_active = true
    )
  );

CREATE POLICY "Only admins can manage registry roles"
  ON public.registry_admin_roles
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.registry_admin_roles rar
      WHERE rar.user_id = auth.uid() 
      AND rar.registry_role = 'registry_super_admin'
      AND rar.is_active = true
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.registry_admin_roles rar
      WHERE rar.user_id = auth.uid() 
      AND rar.registry_role = 'registry_super_admin'
      AND rar.is_active = true
    )
  );

-- ============================================
-- REGISTRY RECORD MANAGEMENT TABLES
-- Approval workflows and audit trails
-- ============================================

-- Status type for registry records
CREATE TYPE public.registry_record_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'suspended',
  'deactivated'
);

-- Client Registry Records (managed locally, syncs with MOSIP)
CREATE TABLE public.client_registry_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  impilo_id TEXT UNIQUE,
  client_registry_id TEXT,
  shr_id TEXT,
  mosip_uin TEXT,
  
  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_names TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  national_id TEXT,
  passport_number TEXT,
  
  -- Contact information
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Zimbabwe',
  
  -- Biometric status
  biometric_enrolled BOOLEAN DEFAULT false,
  biometric_fingerprint_hash TEXT,
  biometric_facial_hash TEXT,
  biometric_iris_hash TEXT,
  
  -- Status and workflow
  status registry_record_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.client_registry_records ENABLE ROW LEVEL SECURITY;

-- Provider Registry Records (managed locally, syncs with iHRIS/Varapi)
CREATE TABLE public.provider_registry_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id TEXT UNIQUE,
  
  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  other_names TEXT,
  date_of_birth DATE,
  gender TEXT,
  national_id TEXT,
  
  -- Professional information
  role TEXT NOT NULL,
  specialty TEXT,
  department TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  license_number TEXT,
  license_expiry DATE,
  license_issuing_body TEXT,
  qualification TEXT,
  qualification_institution TEXT,
  qualification_year INTEGER,
  
  -- Contact information
  phone TEXT,
  email TEXT NOT NULL,
  work_phone TEXT,
  
  -- Biometric status
  biometric_enrolled BOOLEAN DEFAULT false,
  biometric_fingerprint_hash TEXT,
  biometric_facial_hash TEXT,
  biometric_iris_hash TEXT,
  
  -- Status and workflow
  status registry_record_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.provider_registry_records ENABLE ROW LEVEL SECURITY;

-- Facility Registry Records (managed locally, syncs with GOFR/Thuso)
CREATE TABLE public.facility_registry_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  thuso_id TEXT UNIQUE,
  
  -- Facility information
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  level TEXT NOT NULL, -- Primary, Secondary, Tertiary, Quaternary
  ownership TEXT, -- Government, Private, NGO, Faith-based
  
  -- Location
  address_line1 TEXT,
  city TEXT,
  district TEXT,
  province TEXT NOT NULL,
  country TEXT DEFAULT 'Zimbabwe',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Operational details
  operating_hours TEXT,
  bed_count INTEGER,
  staff_count INTEGER,
  services_offered TEXT[],
  
  -- Status and workflow
  status registry_record_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.facility_registry_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REGISTRY AUDIT LOG
-- Tracks all changes to registry records
-- ============================================

CREATE TABLE public.registry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type TEXT NOT NULL, -- 'client', 'provider', 'facility', 'terminology', 'shr', 'ndr'
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'submit', 'approve', 'reject', 'suspend', 'deactivate', 'reactivate'
  old_status registry_record_status,
  new_status registry_record_status,
  changes JSONB, -- Stores field-level changes
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.registry_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR REGISTRY RECORDS
-- ============================================

-- Function to check if user has specific registry admin role
CREATE OR REPLACE FUNCTION public.has_registry_role(_user_id uuid, _registry_role registry_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.registry_admin_roles
    WHERE user_id = _user_id
      AND (registry_role = _registry_role OR registry_role = 'registry_super_admin')
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Client Registry RLS Policies
CREATE POLICY "Client registry admins can view all records"
  ON public.client_registry_records
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'client_registry_admin')
  );

CREATE POLICY "Client registry admins can manage records"
  ON public.client_registry_records
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'client_registry_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'client_registry_admin')
  );

-- Provider Registry RLS Policies
CREATE POLICY "Provider registry admins can view all records"
  ON public.provider_registry_records
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'provider_registry_admin')
  );

CREATE POLICY "Provider registry admins can manage records"
  ON public.provider_registry_records
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'provider_registry_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'provider_registry_admin')
  );

-- Facility Registry RLS Policies
CREATE POLICY "Facility registry admins can view all records"
  ON public.facility_registry_records
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'facility_registry_admin')
  );

CREATE POLICY "Facility registry admins can manage records"
  ON public.facility_registry_records
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'facility_registry_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_registry_role(auth.uid(), 'facility_registry_admin')
  );

-- Audit Log RLS Policies
CREATE POLICY "Registry admins can view audit logs"
  ON public.registry_audit_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.registry_admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Registry admins can create audit logs"
  ON public.registry_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.registry_admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_client_registry_records_updated_at
  BEFORE UPDATE ON public.client_registry_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_registry_records_updated_at
  BEFORE UPDATE ON public.provider_registry_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_registry_records_updated_at
  BEFORE UPDATE ON public.facility_registry_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_client_registry_status ON public.client_registry_records(status);
CREATE INDEX idx_client_registry_impilo_id ON public.client_registry_records(impilo_id);
CREATE INDEX idx_client_registry_national_id ON public.client_registry_records(national_id);

CREATE INDEX idx_provider_registry_status ON public.provider_registry_records(status);
CREATE INDEX idx_provider_registry_provider_id ON public.provider_registry_records(provider_id);
CREATE INDEX idx_provider_registry_license ON public.provider_registry_records(license_number);

CREATE INDEX idx_facility_registry_status ON public.facility_registry_records(status);
CREATE INDEX idx_facility_registry_thuso_id ON public.facility_registry_records(thuso_id);
CREATE INDEX idx_facility_registry_province ON public.facility_registry_records(province);

CREATE INDEX idx_registry_audit_record ON public.registry_audit_log(registry_type, record_id);
CREATE INDEX idx_registry_audit_performed_at ON public.registry_audit_log(performed_at DESC);

-- Grant admin user registry super admin role
INSERT INTO public.registry_admin_roles (user_id, registry_role, notes)
SELECT id, 'registry_super_admin', 'Initial admin setup'
FROM auth.users
WHERE email = 'admin@impilo.health'
ON CONFLICT DO NOTHING;