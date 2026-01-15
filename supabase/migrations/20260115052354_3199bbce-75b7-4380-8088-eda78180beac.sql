
-- =====================================================
-- LANDELA DOCUMENT MANAGEMENT SYSTEM - Core Schema
-- =====================================================

-- Document Type Catalogue (controlled vocabulary)
CREATE TABLE public.landela_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('civil_registry', 'clinical', 'admin_erp', 'telemedicine', 'hr', 'asset', 'general')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_patient BOOLEAN DEFAULT false,
  requires_provider BOOLEAN DEFAULT false,
  requires_facility BOOLEAN DEFAULT false,
  requires_encounter BOOLEAN DEFAULT false,
  requires_visit BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  retention_days INTEGER,
  is_immutable BOOLEAN DEFAULT false,
  mandatory_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sensitivity Levels
CREATE TYPE landela_sensitivity_level AS ENUM ('normal', 'sensitive', 'highly_restricted');

-- Document Status
CREATE TYPE landela_document_status AS ENUM (
  'uploading', 'processing', 'indexing_required', 'pending_review', 
  'verified', 'final', 'archived', 'rejected'
);

-- Capture Source
CREATE TYPE landela_capture_source AS ENUM (
  'scanner', 'mobile_camera', 'file_upload', 'email_ingestion', 
  'watch_folder', 'system_generated', 'bulk_import', 'external_system'
);

-- Main Document Reference Table
CREATE TABLE public.landela_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number TEXT UNIQUE NOT NULL DEFAULT ('DOC-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8)),
  
  -- Type and classification
  document_type_id UUID REFERENCES public.landela_document_types(id),
  document_type_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Storage reference
  storage_bucket TEXT NOT NULL DEFAULT 'landela-documents',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  page_count INTEGER DEFAULT 1,
  checksum TEXT,
  
  -- Capture metadata
  source landela_capture_source NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_by UUID REFERENCES auth.users(id),
  capture_device TEXT,
  capture_facility_id UUID REFERENCES public.facilities(id),
  
  -- Status and workflow
  status landela_document_status NOT NULL DEFAULT 'processing',
  sensitivity_level landela_sensitivity_level NOT NULL DEFAULT 'normal',
  
  -- OCR and AI processing
  ocr_processed BOOLEAN DEFAULT false,
  ocr_text TEXT,
  ocr_confidence NUMERIC(5,4),
  ai_classified BOOLEAN DEFAULT false,
  ai_classification_confidence NUMERIC(5,4),
  ai_suggested_type_id UUID REFERENCES public.landela_document_types(id),
  ai_extracted_entities JSONB DEFAULT '{}'::jsonb,
  ai_quality_score NUMERIC(5,4),
  ai_quality_issues TEXT[],
  
  -- Batch/bulk scanning
  batch_id UUID,
  batch_sequence INTEGER,
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  is_current_version BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES public.landela_documents(id),
  version_reason TEXT,
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  
  -- Archival
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),
  archive_reason TEXT,
  retention_until DATE,
  
  -- Metadata
  custom_metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clinical Document Index (links to patient/encounter/visit)
CREATE TABLE public.landela_clinical_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  
  -- Clinical linkages
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  visit_id UUID REFERENCES public.visits(id),
  provider_id UUID,
  
  -- Clinical context
  program_code TEXT,
  service_area TEXT,
  event_date DATE,
  
  -- Problem/order linkage
  problem_ids UUID[],
  order_ids UUID[],
  care_plan_id UUID REFERENCES public.care_plans(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Registry Document Index (links to client/provider/facility registries)
CREATE TABLE public.landela_registry_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  
  -- Registry linkages
  registry_type TEXT NOT NULL CHECK (registry_type IN ('client', 'provider', 'facility', 'crvs')),
  registry_entity_id UUID NOT NULL,
  
  -- Certificate info
  certificate_number TEXT,
  valid_from DATE,
  valid_to DATE,
  is_primary_document BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin/ERP Document Index
CREATE TABLE public.landela_erp_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  
  -- ERP linkages
  supplier_id UUID,
  purchase_order_id UUID,
  invoice_id UUID,
  payment_id UUID,
  
  -- Reference numbers
  po_number TEXT,
  invoice_number TEXT,
  payment_reference TEXT,
  
  -- Cost center
  project_code TEXT,
  cost_center TEXT,
  department TEXT,
  
  -- Amounts
  amount NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  
  -- Approval workflow
  approval_workflow_id UUID,
  approval_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Batch Scan Sessions
CREATE TABLE public.landela_batch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session info
  session_name TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  separation_method TEXT CHECK (separation_method IN ('barcode', 'qr_code', 'blank_page', 'manual', 'fixed_pages')),
  target_document_type_id UUID REFERENCES public.landela_document_types(id),
  target_patient_id UUID REFERENCES public.patients(id),
  target_entity_type TEXT,
  target_entity_id UUID,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'indexing', 'completed', 'cancelled')),
  
  -- Stats
  total_pages INTEGER DEFAULT 0,
  documents_created INTEGER DEFAULT 0,
  documents_indexed INTEGER DEFAULT 0,
  
  -- User and facility
  created_by UUID REFERENCES auth.users(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document Sharing (for telemedicine packages, etc.)
CREATE TABLE public.landela_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  
  -- Share target
  shared_with_user_id UUID,
  shared_with_facility_id UUID REFERENCES public.facilities(id),
  shared_with_provider_id UUID,
  shared_with_email TEXT,
  
  -- Access control
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  
  -- Permissions
  can_download BOOLEAN DEFAULT false,
  can_print BOOLEAN DEFAULT false,
  
  -- Consent
  consent_reference TEXT,
  consent_given_by UUID,
  consent_given_at TIMESTAMPTZ,
  
  -- Sharing metadata
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  share_reason TEXT,
  watermark_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Referral/Telemedicine Packages
CREATE TABLE public.landela_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_number TEXT UNIQUE NOT NULL DEFAULT ('PKG-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8)),
  
  -- Package type
  package_type TEXT NOT NULL CHECK (package_type IN ('referral', 'telemedicine', 'audit_export', 'transfer', 'discharge')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Patient context
  patient_id UUID REFERENCES public.patients(id),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_consent', 'ready', 'shared', 'expired', 'revoked')),
  
  -- Sharing
  shared_with_facility_id UUID REFERENCES public.facilities(id),
  shared_with_provider_id UUID,
  
  -- Access control
  expires_at TIMESTAMPTZ,
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Consent
  consent_required BOOLEAN DEFAULT true,
  consent_given_at TIMESTAMPTZ,
  consent_given_by UUID,
  
  -- Manifest
  manifest JSONB DEFAULT '[]'::jsonb,
  
  -- User
  created_by UUID REFERENCES auth.users(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Package Items
CREATE TABLE public.landela_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.landela_packages(id) ON DELETE CASCADE,
  
  -- Item type
  item_type TEXT NOT NULL CHECK (item_type IN ('document', 'patient_summary', 'encounter_summary', 'lab_results', 'medications', 'custom')),
  
  -- Document reference (if document)
  document_id UUID REFERENCES public.landela_documents(id),
  
  -- Or generated content
  content_type TEXT,
  content JSONB,
  
  -- Order and metadata
  sequence INTEGER DEFAULT 0,
  title TEXT,
  description TEXT,
  
  -- Inclusion
  included BOOLEAN DEFAULT true,
  excluded_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Document Audit Log
CREATE TABLE public.landela_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'upload', 'view', 'download', 'print', 'share', 'unshare',
    'index', 'verify', 'reject', 'archive', 'restore',
    'update_metadata', 'replace_version', 'delete',
    'ocr_process', 'ai_classify', 'ai_extract',
    'break_glass_access', 'consent_given', 'consent_revoked'
  )),
  
  -- Target
  document_id UUID REFERENCES public.landela_documents(id),
  package_id UUID REFERENCES public.landela_packages(id),
  share_id UUID REFERENCES public.landela_document_shares(id),
  
  -- User
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Context
  facility_id UUID REFERENCES public.facilities(id),
  patient_id UUID REFERENCES public.patients(id),
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  
  -- For break glass
  break_glass_reason TEXT,
  break_glass_approved_by UUID,
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Print Jobs
CREATE TABLE public.landela_print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  document_id UUID REFERENCES public.landela_documents(id),
  package_id UUID REFERENCES public.landela_packages(id),
  
  -- Print type
  print_type TEXT NOT NULL CHECK (print_type IN ('document', 'certificate', 'referral', 'discharge_summary', 'invoice', 'receipt', 'report')),
  template_id TEXT,
  
  -- Configuration
  copies INTEGER DEFAULT 1,
  watermark_text TEXT,
  include_qr_verification BOOLEAN DEFAULT true,
  qr_verification_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed', 'cancelled')),
  
  -- Output
  output_storage_path TEXT,
  
  -- User
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  printer_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  printed_at TIMESTAMPTZ
);

-- Annotations
CREATE TABLE public.landela_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  
  -- Position
  page_number INTEGER NOT NULL DEFAULT 1,
  x_position NUMERIC(10,4),
  y_position NUMERIC(10,4),
  width NUMERIC(10,4),
  height NUMERIC(10,4),
  
  -- Content
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('note', 'highlight', 'stamp', 'signature', 'redaction')),
  content TEXT,
  color TEXT,
  
  -- Visibility
  is_private BOOLEAN DEFAULT false,
  
  -- User
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_landela_documents_type ON public.landela_documents(document_type_code);
CREATE INDEX idx_landela_documents_status ON public.landela_documents(status);
CREATE INDEX idx_landela_documents_captured_at ON public.landela_documents(captured_at);
CREATE INDEX idx_landela_documents_batch ON public.landela_documents(batch_id);
CREATE INDEX idx_landela_documents_captured_by ON public.landela_documents(captured_by);

CREATE INDEX idx_landela_clinical_patient ON public.landela_clinical_index(patient_id);
CREATE INDEX idx_landela_clinical_encounter ON public.landela_clinical_index(encounter_id);
CREATE INDEX idx_landela_clinical_visit ON public.landela_clinical_index(visit_id);

CREATE INDEX idx_landela_registry_entity ON public.landela_registry_index(registry_type, registry_entity_id);
CREATE INDEX idx_landela_erp_supplier ON public.landela_erp_index(supplier_id);
CREATE INDEX idx_landela_erp_invoice ON public.landela_erp_index(invoice_number);
CREATE INDEX idx_landela_erp_po ON public.landela_erp_index(po_number);

CREATE INDEX idx_landela_audit_document ON public.landela_audit_log(document_id);
CREATE INDEX idx_landela_audit_user ON public.landela_audit_log(user_id);
CREATE INDEX idx_landela_audit_action ON public.landela_audit_log(action);
CREATE INDEX idx_landela_audit_created ON public.landela_audit_log(created_at);

CREATE INDEX idx_landela_shares_token ON public.landela_document_shares(access_token);
CREATE INDEX idx_landela_packages_token ON public.landela_packages(access_token);

-- Enable RLS
ALTER TABLE public.landela_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_clinical_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_registry_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_erp_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_batch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landela_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Document types are viewable by authenticated users"
  ON public.landela_document_types FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view documents they have access to"
  ON public.landela_documents FOR SELECT
  TO authenticated
  USING (
    captured_by = auth.uid() OR
    verified_by = auth.uid() OR
    sensitivity_level = 'normal' OR
    EXISTS (
      SELECT 1 FROM public.landela_document_shares 
      WHERE document_id = landela_documents.id 
      AND shared_with_user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > now())
      AND revoked_at IS NULL
    )
  );

CREATE POLICY "Users can upload documents"
  ON public.landela_documents FOR INSERT
  TO authenticated
  WITH CHECK (captured_by = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON public.landela_documents FOR UPDATE
  TO authenticated
  USING (captured_by = auth.uid() OR verified_by = auth.uid());

CREATE POLICY "Clinical index viewable by authenticated users"
  ON public.landela_clinical_index FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clinical index insertable by authenticated users"
  ON public.landela_clinical_index FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Registry index viewable by authenticated users"
  ON public.landela_registry_index FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Registry index insertable by authenticated users"
  ON public.landela_registry_index FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "ERP index viewable by authenticated users"
  ON public.landela_erp_index FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ERP index insertable by authenticated users"
  ON public.landela_erp_index FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Batch sessions viewable by creator"
  ON public.landela_batch_sessions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Batch sessions insertable by authenticated users"
  ON public.landela_batch_sessions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Batch sessions updatable by creator"
  ON public.landela_batch_sessions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Shares viewable by creator or recipient"
  ON public.landela_document_shares FOR SELECT
  TO authenticated
  USING (shared_by = auth.uid() OR shared_with_user_id = auth.uid());

CREATE POLICY "Shares insertable by authenticated users"
  ON public.landela_document_shares FOR INSERT
  TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Packages viewable by creator or recipient"
  ON public.landela_packages FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Packages insertable by authenticated users"
  ON public.landela_packages FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Packages updatable by creator"
  ON public.landela_packages FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Package items viewable with package access"
  ON public.landela_package_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.landela_packages 
    WHERE id = landela_package_items.package_id 
    AND created_by = auth.uid()
  ));

CREATE POLICY "Package items insertable by package creator"
  ON public.landela_package_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.landela_packages 
    WHERE id = landela_package_items.package_id 
    AND created_by = auth.uid()
  ));

CREATE POLICY "Audit log insertable by authenticated users"
  ON public.landela_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Audit log viewable by authenticated users"
  ON public.landela_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Print jobs viewable by requester"
  ON public.landela_print_jobs FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Print jobs insertable by authenticated users"
  ON public.landela_print_jobs FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Annotations viewable by document viewers"
  ON public.landela_annotations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (is_private = false)
  );

CREATE POLICY "Annotations insertable by authenticated users"
  ON public.landela_annotations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Annotations updatable by creator"
  ON public.landela_annotations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Insert default document types
INSERT INTO public.landela_document_types (code, name, category, requires_patient, requires_approval, description) VALUES
-- Civil/Registry
('BIRTH_NOTIFICATION', 'Birth Notification', 'civil_registry', true, false, 'Birth notification from facility'),
('BIRTH_CERTIFICATE', 'Birth Certificate (Copy)', 'civil_registry', true, false, 'Certified copy of birth certificate'),
('DEATH_NOTIFICATION', 'Death Notification', 'civil_registry', true, false, 'Death notification from facility'),
('DEATH_CERTIFICATE', 'Death Certificate (Copy)', 'civil_registry', true, false, 'Certified copy of death certificate'),
('PROVIDER_REG_CERT', 'Provider Registration Certificate', 'civil_registry', false, true, 'Provider professional registration'),
('FACILITY_LICENCE', 'Facility Licence Certificate', 'civil_registry', false, true, 'Facility operating licence'),
('NATIONAL_ID', 'National ID Document', 'civil_registry', true, false, 'Copy of national ID card'),
('PASSPORT', 'Passport Document', 'civil_registry', true, false, 'Copy of passport'),
('CONSENT_FORM', 'Consent Form', 'civil_registry', true, false, 'Signed consent form'),

-- Clinical
('OLD_FILE_SCAN', 'Old Paper File Scan', 'clinical', true, false, 'Digitized pages from old paper file'),
('EXTERNAL_LAB', 'External Lab Result', 'clinical', true, false, 'Lab result from external facility'),
('EXTERNAL_IMAGING', 'External Imaging Report', 'clinical', true, false, 'Radiology/imaging from external'),
('REFERRAL_LETTER_IN', 'Referral Letter (Incoming)', 'clinical', true, false, 'Referral received from another facility'),
('REFERRAL_LETTER_OUT', 'Referral Letter (Outgoing)', 'clinical', true, false, 'Referral sent to another facility'),
('DISCHARGE_SUMMARY', 'Discharge Summary', 'clinical', true, false, 'Patient discharge summary document'),
('OPERATIVE_NOTE', 'Operative Note Scan', 'clinical', true, false, 'Scanned operative/surgical notes'),
('TREATMENT_CONSENT', 'Treatment Consent', 'clinical', true, false, 'Signed treatment consent form'),
('PRESCRIPTION_SCAN', 'Prescription Scan', 'clinical', true, false, 'Scanned prescription'),
('CLINICAL_NOTE', 'Clinical Note Scan', 'clinical', true, false, 'Scanned clinical notes'),

-- Admin/ERP
('PURCHASE_ORDER', 'Purchase Order', 'admin_erp', false, true, 'Purchase order document'),
('INVOICE', 'Invoice', 'admin_erp', false, false, 'Supplier invoice'),
('DELIVERY_NOTE', 'Delivery Note', 'admin_erp', false, false, 'Goods delivery note'),
('CONTRACT', 'Contract/MoU', 'admin_erp', false, true, 'Contract or memorandum of understanding'),
('PAYMENT_PROOF', 'Payment Proof', 'admin_erp', false, false, 'Proof of payment'),
('QUOTATION', 'Quotation', 'admin_erp', false, false, 'Supplier quotation'),
('GRN', 'Goods Received Note', 'admin_erp', false, false, 'Goods received note'),

-- HR
('HR_LETTER', 'HR Letter', 'hr', false, false, 'HR correspondence'),
('EMPLOYMENT_CONTRACT', 'Employment Contract', 'hr', false, true, 'Employment contract'),
('QUALIFICATION_CERT', 'Qualification Certificate', 'hr', false, false, 'Educational/professional certificate'),
('PERFORMANCE_REVIEW', 'Performance Review', 'hr', false, true, 'Employee performance review'),

-- Asset
('WARRANTY_DOC', 'Warranty Document', 'asset', false, false, 'Equipment warranty'),
('SERVICE_RECORD', 'Service Record', 'asset', false, false, 'Equipment service/maintenance record'),
('ASSET_PHOTO', 'Asset Photo', 'asset', false, false, 'Photo of asset/equipment'),

-- Telemedicine
('REFERRAL_PACKAGE', 'Referral Package', 'telemedicine', true, false, 'Complete referral package bundle'),
('TELEHEALTH_ATTACHMENT', 'Telehealth Attachment', 'telemedicine', true, false, 'Attachment for telehealth consult'),
('CONSULT_EXPORT', 'Consultation Export', 'telemedicine', true, false, 'Exported consultation notes'),

-- General
('OTHER', 'Other Document', 'general', false, false, 'Other unclassified document');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_landela_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landela_documents_updated_at
  BEFORE UPDATE ON public.landela_documents
  FOR EACH ROW EXECUTE FUNCTION update_landela_updated_at();

CREATE TRIGGER update_landela_batch_sessions_updated_at
  BEFORE UPDATE ON public.landela_batch_sessions
  FOR EACH ROW EXECUTE FUNCTION update_landela_updated_at();

CREATE TRIGGER update_landela_packages_updated_at
  BEFORE UPDATE ON public.landela_packages
  FOR EACH ROW EXECUTE FUNCTION update_landela_updated_at();

CREATE TRIGGER update_landela_document_types_updated_at
  BEFORE UPDATE ON public.landela_document_types
  FOR EACH ROW EXECUTE FUNCTION update_landela_updated_at();

CREATE TRIGGER update_landela_annotations_updated_at
  BEFORE UPDATE ON public.landela_annotations
  FOR EACH ROW EXECUTE FUNCTION update_landela_updated_at();
