-- =============================================
-- IMPILO FUNDO (MOODLE) INTEGRATION SCHEMA
-- Training, CPD/CME, Helpdesk, Knowledge Base
-- =============================================

-- ===================
-- ENUMS
-- ===================

DO $$ BEGIN
  CREATE TYPE public.training_status AS ENUM (
    'not_enrolled',
    'enrolled', 
    'in_progress',
    'completed',
    'expired',
    'recert_due'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_difficulty AS ENUM (
    'beginner',
    'intermediate', 
    'advanced',
    'expert'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_format AS ENUM (
    'microlearning',
    'full_course',
    'simulation',
    'job_aid',
    'video',
    'webinar',
    'classroom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM (
    'submitted',
    'triaged',
    'assigned',
    'in_progress',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.cpd_activity_type AS ENUM (
    'online_course',
    'webinar',
    'conference',
    'workshop',
    'peer_review',
    'publication',
    'supervision',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===================
-- MOODLE CONNECTION CONFIG
-- ===================

CREATE TABLE IF NOT EXISTS public.moodle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TRAINING PROFILES
-- ===================

CREATE TABLE IF NOT EXISTS public.training_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  moodle_user_id INTEGER,
  moodle_username TEXT,
  current_pathway_id UUID,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  total_courses_completed INTEGER DEFAULT 0,
  total_cpd_credits DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ===================
-- COURSE CATALOG
-- ===================

CREATE TABLE IF NOT EXISTS public.course_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodle_course_id INTEGER,
  course_code TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  target_roles TEXT[] DEFAULT '{}',
  target_cadres TEXT[] DEFAULT '{}',
  target_facility_types TEXT[] DEFAULT '{}',
  module_tags TEXT[] DEFAULT '{}',
  program_areas TEXT[] DEFAULT '{}',
  difficulty course_difficulty DEFAULT 'beginner',
  format course_format DEFAULT 'full_course',
  duration_minutes INTEGER,
  language TEXT DEFAULT 'en',
  is_cpd_eligible BOOLEAN DEFAULT false,
  cpd_credits DECIMAL(5,2) DEFAULT 0,
  cpd_accreditor TEXT,
  cpd_validity_months INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  requires_enrollment BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0',
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  moodle_url TEXT,
  launch_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- COURSE PREREQUISITES
-- ===================

CREATE TABLE IF NOT EXISTS public.course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.course_catalog(id) ON DELETE CASCADE,
  prerequisite_course_id UUID REFERENCES public.course_catalog(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  min_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, prerequisite_course_id)
);

-- ===================
-- TRAINING PATHWAYS
-- ===================

CREATE TABLE IF NOT EXISTS public.training_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  target_role TEXT,
  target_cadre TEXT,
  is_onboarding BOOLEAN DEFAULT false,
  estimated_duration_hours DECIMAL(5,1),
  is_published BOOLEAN DEFAULT true,
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pathway_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES public.training_pathways(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.course_catalog(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  unlock_after_completion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pathway_id, course_id)
);

-- ===================
-- TRAINING ENROLLMENTS & EVENTS
-- ===================

CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.course_catalog(id) ON DELETE CASCADE,
  pathway_id UUID REFERENCES public.training_pathways(id),
  status training_status DEFAULT 'enrolled',
  progress_percent DECIMAL(5,2) DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_quiz_score DECIMAL(5,2),
  best_quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  passed BOOLEAN,
  moodle_enrollment_id INTEGER,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.course_catalog(id),
  enrollment_id UUID REFERENCES public.training_enrollments(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  moodle_event_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  synced_from_moodle BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- CERTIFICATES
-- ===================

CREATE TABLE IF NOT EXISTS public.training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.course_catalog(id),
  enrollment_id UUID REFERENCES public.training_enrollments(id),
  title TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cpd_credits DECIMAL(5,2) DEFAULT 0,
  cpd_accreditor TEXT,
  verification_code TEXT UNIQUE,
  verification_url TEXT,
  qr_code_url TEXT,
  certificate_pdf_url TEXT,
  template_id TEXT,
  moodle_certificate_id INTEGER,
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- CPD/CME LEDGER
-- ===================

CREATE TABLE IF NOT EXISTS public.cpd_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type cpd_activity_type NOT NULL,
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  course_id UUID REFERENCES public.course_catalog(id),
  certificate_id UUID REFERENCES public.training_certificates(id),
  external_provider TEXT,
  external_reference TEXT,
  credits_earned DECIMAL(5,2) NOT NULL,
  credits_category TEXT,
  activity_date DATE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  evidence_url TEXT,
  cpd_period_year INTEGER,
  cpd_period_start DATE,
  cpd_period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- KNOWLEDGE BASE
-- ===================

CREATE TABLE IF NOT EXISTS public.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.kb_categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sequence_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  excerpt TEXT,
  module_tags TEXT[] DEFAULT '{}',
  screen_context TEXT[],
  target_roles TEXT[] DEFAULT '{}',
  article_type TEXT DEFAULT 'how_to',
  severity TEXT,
  keywords TEXT[],
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  version TEXT DEFAULT '1.0',
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kb_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  user_id UUID,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- HELPDESK TICKETS
-- ===================

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  reporter_id UUID NOT NULL,
  reporter_email TEXT,
  reporter_name TEXT,
  reporter_facility_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  module_context TEXT,
  screen_context TEXT,
  url_context TEXT,
  diagnostic_bundle JSONB,
  category TEXT,
  subcategory TEXT,
  severity ticket_severity DEFAULT 'medium',
  status ticket_status DEFAULT 'submitted',
  assigned_to UUID,
  assigned_team TEXT,
  assigned_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolution_type TEXT,
  related_kb_article_id UUID REFERENCES public.kb_articles(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  satisfaction_rating INTEGER,
  satisfaction_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.helpdesk_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.helpdesk_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.helpdesk_ticket_comments(id),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- FEATURE ACCESS GATES
-- ===================

CREATE TABLE IF NOT EXISTS public.training_access_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  required_course_id UUID REFERENCES public.course_catalog(id),
  required_pathway_id UUID REFERENCES public.training_pathways(id),
  min_quiz_score DECIMAL(5,2),
  must_be_current BOOLEAN DEFAULT true,
  validity_months INTEGER,
  allow_supervisor_override BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_gate_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gate_id UUID REFERENCES public.training_access_gates(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL,
  reason TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- CONTEXTUAL HELP MAPPING
-- ===================

CREATE TABLE IF NOT EXISTS public.contextual_help_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_path TEXT NOT NULL,
  element_id TEXT,
  kb_article_id UUID REFERENCES public.kb_articles(id),
  course_id UUID REFERENCES public.course_catalog(id),
  help_text TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TRAINING NOTIFICATIONS
-- ===================

CREATE TABLE IF NOT EXISTS public.training_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_course_id UUID REFERENCES public.course_catalog(id),
  related_pathway_id UUID REFERENCES public.training_pathways(id),
  action_url TEXT,
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  channels TEXT[] DEFAULT '{in_app}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- INDEXES
-- ===================

CREATE INDEX IF NOT EXISTS idx_training_profiles_user ON public.training_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_training_profiles_moodle ON public.training_profiles(moodle_user_id);
CREATE INDEX IF NOT EXISTS idx_course_catalog_tags ON public.course_catalog USING GIN(module_tags);
CREATE INDEX IF NOT EXISTS idx_course_catalog_roles ON public.course_catalog USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_course_catalog_published ON public.course_catalog(is_published, is_featured);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_user ON public.training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course ON public.training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON public.training_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_training_events_user ON public.training_events(user_id);
CREATE INDEX IF NOT EXISTS idx_training_events_type ON public.training_events(event_type);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.training_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON public.training_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_cpd_ledger_user ON public.cpd_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_cpd_ledger_period ON public.cpd_ledger(cpd_period_year, user_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON public.kb_articles USING GIN(module_tags);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON public.kb_articles(is_published, is_featured);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_reporter ON public.helpdesk_tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON public.helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_assigned ON public.helpdesk_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_training_notifications_user ON public.training_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contextual_help_screen ON public.contextual_help_mappings(screen_path);

-- ===================
-- ENABLE RLS
-- ===================

ALTER TABLE public.moodle_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpd_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_access_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_gate_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextual_help_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_notifications ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS POLICIES
-- ===================

CREATE POLICY "Anyone can view published courses" ON public.course_catalog FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published pathways" ON public.training_pathways FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view pathway courses" ON public.pathway_courses FOR SELECT USING (true);
CREATE POLICY "Anyone can view prerequisites" ON public.course_prerequisites FOR SELECT USING (true);
CREATE POLICY "Users can view own training profile" ON public.training_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own training profile" ON public.training_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training profile" ON public.training_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own enrollments" ON public.training_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON public.training_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON public.training_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own training events" ON public.training_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training events" ON public.training_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own certificates" ON public.training_certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own CPD entries" ON public.cpd_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CPD entries" ON public.cpd_ledger FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view KB categories" ON public.kb_categories FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published KB articles" ON public.kb_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Users can insert KB feedback" ON public.kb_article_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.helpdesk_tickets FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create tickets" ON public.helpdesk_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can update own tickets" ON public.helpdesk_tickets FOR UPDATE TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users can view comments on own tickets" ON public.helpdesk_ticket_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.helpdesk_tickets t WHERE t.id = ticket_id AND t.reporter_id = auth.uid()));
CREATE POLICY "Users can add comments to own tickets" ON public.helpdesk_ticket_comments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.helpdesk_tickets t WHERE t.id = ticket_id AND t.reporter_id = auth.uid()));
CREATE POLICY "Users can view attachments on own tickets" ON public.helpdesk_ticket_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.helpdesk_tickets t WHERE t.id = ticket_id AND t.reporter_id = auth.uid()));
CREATE POLICY "Users can add attachments to own tickets" ON public.helpdesk_ticket_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.helpdesk_tickets t WHERE t.id = ticket_id AND t.reporter_id = auth.uid()));
CREATE POLICY "Anyone can view access gates" ON public.training_access_gates FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own gate overrides" ON public.training_gate_overrides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view contextual help" ON public.contextual_help_mappings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own notifications" ON public.training_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.training_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===================
-- TRIGGERS
-- ===================

CREATE OR REPLACE FUNCTION public.update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_profiles_updated_at ON public.training_profiles;
CREATE TRIGGER update_training_profiles_updated_at BEFORE UPDATE ON public.training_profiles FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_course_catalog_updated_at ON public.course_catalog;
CREATE TRIGGER update_course_catalog_updated_at BEFORE UPDATE ON public.course_catalog FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_training_pathways_updated_at ON public.training_pathways;
CREATE TRIGGER update_training_pathways_updated_at BEFORE UPDATE ON public.training_pathways FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_training_enrollments_updated_at ON public.training_enrollments;
CREATE TRIGGER update_training_enrollments_updated_at BEFORE UPDATE ON public.training_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_kb_articles_updated_at ON public.kb_articles;
CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON public.kb_articles FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_helpdesk_tickets_updated_at ON public.helpdesk_tickets;
CREATE TRIGGER update_helpdesk_tickets_updated_at BEFORE UPDATE ON public.helpdesk_tickets FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

DROP TRIGGER IF EXISTS update_training_access_gates_updated_at ON public.training_access_gates;
CREATE TRIGGER update_training_access_gates_updated_at BEFORE UPDATE ON public.training_access_gates FOR EACH ROW EXECUTE FUNCTION public.update_training_updated_at();

-- ===================
-- TICKET NUMBER GENERATOR
-- ===================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random() * 10000))::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON public.helpdesk_tickets;
CREATE TRIGGER set_ticket_number BEFORE INSERT ON public.helpdesk_tickets FOR EACH ROW WHEN (NEW.ticket_number IS NULL) EXECUTE FUNCTION public.generate_ticket_number();

-- ===================
-- CERTIFICATE NUMBER GENERATOR
-- ===================

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'CERT-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 1000000))::text, 6, '0');
  NEW.verification_code := encode(gen_random_bytes(12), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_certificate_number ON public.training_certificates;
CREATE TRIGGER set_certificate_number BEFORE INSERT ON public.training_certificates FOR EACH ROW WHEN (NEW.certificate_number IS NULL) EXECUTE FUNCTION public.generate_certificate_number();