-- =====================================================
-- CME/CPD Tracking System
-- =====================================================

-- CPD Requirements by Council
CREATE TABLE public.cpd_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  council_id UUID REFERENCES public.professional_councils(id),
  cadre TEXT NOT NULL,
  points_required INTEGER NOT NULL DEFAULT 30,
  cycle_years INTEGER NOT NULL DEFAULT 1,
  categories JSONB DEFAULT '[]'::jsonb, -- [{name: "Clinical", min_points: 10}, ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CPD Activity Types (reference data)
CREATE TABLE public.ref_cpd_activity_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Clinical, Educational, Research, etc.
  default_points INTEGER NOT NULL DEFAULT 1,
  max_points_per_activity INTEGER,
  requires_certificate BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider CPD Activities
CREATE TABLE public.provider_cpd_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  activity_type_id UUID REFERENCES public.ref_cpd_activity_types(id),
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  points_claimed INTEGER NOT NULL,
  points_awarded INTEGER,
  category TEXT NOT NULL,
  provider_name TEXT, -- Course provider/institution
  certificate_number TEXT,
  certificate_document_id UUID, -- References provider_documents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CPD Cycle Tracking
CREATE TABLE public.provider_cpd_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  points_required INTEGER NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed, extended
  completed_at TIMESTAMPTZ,
  extended_to DATE,
  extension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Document Management System
-- =====================================================

-- Document Types (reference data)
CREATE TABLE public.ref_document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- identity, education, license, cme, employment
  is_mandatory BOOLEAN DEFAULT false,
  requires_expiry BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT true,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider Documents
CREATE TABLE public.provider_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.ref_document_types(id),
  document_type_code TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_number TEXT, -- ID number, certificate number, etc.
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES public.provider_documents(id),
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- License Payment Tracking
-- =====================================================

-- License Payments
CREATE TABLE public.license_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID REFERENCES public.provider_licenses(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL, -- initial, renewal, restoration, late_fee
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT, -- bank_transfer, mobile_money, card, cash
  payment_reference TEXT,
  transaction_id UUID REFERENCES public.payment_transactions(id),
  payment_date DATE NOT NULL,
  receipt_number TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- License Renewal Applications
CREATE TABLE public.license_renewal_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID REFERENCES public.provider_licenses(id),
  provider_id UUID NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  application_number TEXT UNIQUE,
  application_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_expiry_date DATE NOT NULL,
  requested_period_years INTEGER NOT NULL DEFAULT 1,
  cpd_points_verified BOOLEAN DEFAULT false,
  cpd_cycle_id UUID REFERENCES public.provider_cpd_cycles(id),
  payment_id UUID REFERENCES public.license_payments(id),
  documents_verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, under_review, approved, rejected
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  decision_notes TEXT,
  new_license_id UUID REFERENCES public.provider_licenses(id),
  new_expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Bulk Import Tracking
-- =====================================================

CREATE TABLE public.bulk_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE public.cpd_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_cpd_activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_cpd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_cpd_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_renewal_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_import_jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Reference data readable by all authenticated users
CREATE POLICY "Reference CPD types readable by authenticated" ON public.ref_cpd_activity_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Reference document types readable by authenticated" ON public.ref_document_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "CPD requirements readable by authenticated" ON public.cpd_requirements
  FOR SELECT TO authenticated USING (true);

-- Provider CPD activities - providers can manage their own, admins can manage all
CREATE POLICY "Providers can view own CPD activities" ON public.provider_cpd_activities
  FOR SELECT TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Providers can insert own CPD activities" ON public.provider_cpd_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Providers can update own CPD activities" ON public.provider_cpd_activities
  FOR UPDATE TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Provider documents
CREATE POLICY "Providers can view own documents" ON public.provider_documents
  FOR SELECT TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Providers can upload own documents" ON public.provider_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Providers can update own documents" ON public.provider_documents
  FOR UPDATE TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- CPD cycles
CREATE POLICY "Providers can view own CPD cycles" ON public.provider_cpd_cycles
  FOR SELECT TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Admin can manage CPD cycles" ON public.provider_cpd_cycles
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- License payments
CREATE POLICY "Providers can view own payments" ON public.license_payments
  FOR SELECT TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Admin can manage payments" ON public.license_payments
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- License renewal applications
CREATE POLICY "Providers can view own renewals" ON public.license_renewal_applications
  FOR SELECT TO authenticated
  USING (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Providers can create own renewals" ON public.license_renewal_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM public.health_providers WHERE user_id = auth.uid())
    OR has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Admin can manage renewals" ON public.license_renewal_applications
  FOR UPDATE TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Bulk import jobs - admin only
CREATE POLICY "Admin can manage bulk imports" ON public.bulk_import_jobs
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- Admin policies for reference data
CREATE POLICY "Admin can manage CPD activity types" ON public.ref_cpd_activity_types
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Admin can manage document types" ON public.ref_document_types
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

CREATE POLICY "Admin can manage CPD requirements" ON public.cpd_requirements
  FOR ALL TO authenticated
  USING (
    has_registry_role(auth.uid(), 'provider_registry_admin')
    OR has_registry_role(auth.uid(), 'registry_super_admin')
  );

-- =====================================================
-- Create storage bucket for provider documents
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider documents
CREATE POLICY "Providers can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.health_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-documents' AND
    (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.health_providers WHERE user_id = auth.uid()
      )
      OR has_registry_role(auth.uid(), 'provider_registry_admin')
      OR has_registry_role(auth.uid(), 'registry_super_admin')
    )
  );

-- =====================================================
-- Seed default CPD activity types
-- =====================================================

INSERT INTO public.ref_cpd_activity_types (code, name, category, default_points, max_points_per_activity, requires_certificate, requires_approval, description) VALUES
('CONF_ATTEND', 'Conference Attendance', 'Educational', 2, 10, true, false, 'Attending accredited professional conferences'),
('CONF_PRESENT', 'Conference Presentation', 'Educational', 5, 15, true, true, 'Presenting at accredited conferences'),
('WORKSHOP', 'Workshop/Training Course', 'Educational', 3, 20, true, false, 'Participating in professional workshops'),
('ONLINE_COURSE', 'Online Learning Course', 'Educational', 2, 10, true, false, 'Completing accredited online courses'),
('JOURNAL_CLUB', 'Journal Club Participation', 'Research', 1, 12, false, false, 'Regular participation in journal club discussions'),
('PUBLICATION', 'Peer-Reviewed Publication', 'Research', 10, 20, true, true, 'Publishing in peer-reviewed journals'),
('CASE_REVIEW', 'Case Presentation/Review', 'Clinical', 2, 10, false, false, 'Presenting clinical cases for peer review'),
('AUDIT', 'Clinical Audit', 'Clinical', 5, 15, true, true, 'Conducting and presenting clinical audits'),
('QI_PROJECT', 'Quality Improvement Project', 'Clinical', 10, 20, true, true, 'Leading or participating in QI projects'),
('SUPERVISION', 'Clinical Supervision Given', 'Teaching', 1, 12, false, false, 'Supervising junior colleagues or students'),
('TEACHING', 'Formal Teaching', 'Teaching', 3, 15, false, true, 'Delivering formal educational sessions'),
('COMMITTEE', 'Professional Committee Work', 'Professional', 2, 10, false, false, 'Serving on professional committees'),
('SELF_STUDY', 'Self-Directed Learning', 'Educational', 1, 10, false, false, 'Documented self-directed learning activities'),
('EXAM_PREP', 'Examination Preparation', 'Educational', 5, 20, true, true, 'Preparing for and sitting professional exams')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Seed default document types
-- =====================================================

INSERT INTO public.ref_document_types (code, name, category, is_mandatory, requires_expiry, requires_verification, description) VALUES
('NATIONAL_ID', 'National Identity Document', 'identity', true, true, true, 'Government-issued national ID card'),
('PASSPORT', 'Passport', 'identity', false, true, true, 'Valid passport'),
('BIRTH_CERT', 'Birth Certificate', 'identity', false, false, true, 'Official birth certificate'),
('DEGREE_CERT', 'Degree Certificate', 'education', true, false, true, 'University degree certificate'),
('DIPLOMA_CERT', 'Diploma Certificate', 'education', false, false, true, 'Professional diploma certificate'),
('TRANSCRIPT', 'Academic Transcript', 'education', false, false, true, 'Official academic transcript'),
('PRACTICE_LICENSE', 'License to Practice', 'license', true, true, true, 'Current practicing license'),
('COUNCIL_CERT', 'Council Registration Certificate', 'license', true, false, true, 'Registration with professional council'),
('SPECIALIST_CERT', 'Specialist Certificate', 'license', false, false, true, 'Specialist qualification certificate'),
('CPD_CERT', 'CPD/CME Certificate', 'cme', false, false, false, 'Continuing professional development certificate'),
('EMPLOYMENT_LETTER', 'Employment Letter', 'employment', false, false, true, 'Current employment confirmation'),
('REFERENCE_LETTER', 'Reference Letter', 'employment', false, false, false, 'Professional reference letter'),
('GOOD_STANDING', 'Certificate of Good Standing', 'license', false, true, true, 'Certificate of good standing from council'),
('MALPRACTICE_INS', 'Malpractice Insurance', 'license', false, true, true, 'Professional indemnity insurance certificate'),
('PHOTO', 'Passport Photo', 'identity', true, false, false, 'Recent passport-size photograph')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Generate application number function
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_renewal_application_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 9) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.license_renewal_applications 
  WHERE application_number LIKE 'REN-' || year_part || '-%';
  
  new_number := 'REN-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate application number
CREATE OR REPLACE FUNCTION public.set_renewal_application_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := generate_renewal_application_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_renewal_app_number_trigger
  BEFORE INSERT ON public.license_renewal_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_renewal_application_number();

-- =====================================================
-- Indexes for performance
-- =====================================================

CREATE INDEX idx_provider_cpd_activities_provider ON public.provider_cpd_activities(provider_id);
CREATE INDEX idx_provider_cpd_activities_status ON public.provider_cpd_activities(status);
CREATE INDEX idx_provider_cpd_cycles_provider ON public.provider_cpd_cycles(provider_id);
CREATE INDEX idx_provider_documents_provider ON public.provider_documents(provider_id);
CREATE INDEX idx_provider_documents_type ON public.provider_documents(document_type_code);
CREATE INDEX idx_license_payments_provider ON public.license_payments(provider_id);
CREATE INDEX idx_license_payments_license ON public.license_payments(license_id);
CREATE INDEX idx_license_renewal_provider ON public.license_renewal_applications(provider_id);
CREATE INDEX idx_license_renewal_status ON public.license_renewal_applications(status);