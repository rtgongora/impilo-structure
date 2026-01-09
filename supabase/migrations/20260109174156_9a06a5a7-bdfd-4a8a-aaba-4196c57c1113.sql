-- =====================================================
-- iHRIS v5 Alignment Migration
-- Adds comprehensive HR management features
-- =====================================================

-- 1. Add missing fields to health_providers table
ALTER TABLE public.health_providers 
ADD COLUMN IF NOT EXISTS classification text,
ADD COLUMN IF NOT EXISTS employee_number text UNIQUE,
ADD COLUMN IF NOT EXISTS hire_date date,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS disability_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disability_type text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS birth_country text,
ADD COLUMN IF NOT EXISTS residence_country text DEFAULT 'ZW',
ADD COLUMN IF NOT EXISTS current_address text,
ADD COLUMN IF NOT EXISTS permanent_address text;

-- Create index for employee number lookups
CREATE INDEX IF NOT EXISTS idx_health_providers_employee_number ON public.health_providers(employee_number);

-- 2. Education Records Table (structured education history)
CREATE TABLE IF NOT EXISTS public.provider_education (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Education details
  education_level text NOT NULL, -- certificate, diploma, bachelors, masters, doctorate
  degree_name text NOT NULL,
  major text,
  minor text,
  
  -- Institution
  institution_name text NOT NULL,
  institution_type text, -- university, college, training_center
  institution_country text DEFAULT 'ZW',
  
  -- Dates
  start_date date,
  end_date date,
  graduation_date date,
  
  -- Status
  status text DEFAULT 'completed', -- in_progress, completed, incomplete
  gpa text,
  honors text,
  
  -- Verification
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  certificate_url text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider education viewable by authenticated users"
ON public.provider_education FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider education manageable by authenticated users"
ON public.provider_education FOR ALL
USING (auth.role() = 'authenticated');

-- 3. In-Service Training Records
CREATE TABLE IF NOT EXISTS public.provider_training (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Training details
  training_name text NOT NULL,
  training_type text NOT NULL, -- workshop, seminar, certification, course
  training_category text, -- clinical, management, technical, soft_skills
  description text,
  
  -- Provider/Institution
  training_provider text NOT NULL,
  location text,
  
  -- Dates
  start_date date NOT NULL,
  end_date date,
  duration_hours integer,
  
  -- Outcome
  status text DEFAULT 'completed', -- in_progress, completed, incomplete
  certificate_received boolean DEFAULT false,
  certificate_number text,
  certificate_url text,
  expiry_date date,
  
  -- Sponsorship
  sponsored_by text,
  cost numeric,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider training viewable by authenticated users"
ON public.provider_training FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider training manageable by authenticated users"
ON public.provider_training FOR ALL
USING (auth.role() = 'authenticated');

-- 4. Employment History (Work Experience)
CREATE TABLE IF NOT EXISTS public.provider_employment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Employment details
  employer_name text NOT NULL,
  employer_type text, -- government, private, ngo, international
  position_title text NOT NULL,
  department text,
  
  -- Location
  facility_id uuid REFERENCES public.facilities(id),
  location text,
  country text DEFAULT 'ZW',
  
  -- Dates
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  
  -- Reason for leaving
  departure_reason text,
  departure_type text, -- resignation, termination, transfer, retirement, contract_end
  
  -- Supervisor
  supervisor_name text,
  supervisor_contact text,
  
  -- Verification
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  reference_letter_url text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_employment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider employment history viewable by authenticated users"
ON public.provider_employment_history FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider employment history manageable by authenticated users"
ON public.provider_employment_history FOR ALL
USING (auth.role() = 'authenticated');

-- 5. Position/Job Changes (Promotions, Transfers, Demotions)
CREATE TABLE IF NOT EXISTS public.provider_position_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  affiliation_id uuid REFERENCES public.provider_affiliations(id),
  
  -- Change type
  change_type text NOT NULL, -- hire, promotion, demotion, transfer, reassignment, acting
  effective_date date NOT NULL,
  
  -- Previous position
  previous_position_title text,
  previous_department text,
  previous_facility_id uuid REFERENCES public.facilities(id),
  previous_salary_grade text,
  
  -- New position
  new_position_title text NOT NULL,
  new_department text,
  new_facility_id uuid REFERENCES public.facilities(id),
  new_salary_grade text,
  
  -- Details
  reason text,
  authorization_reference text,
  authorized_by text,
  
  -- Documents
  authorization_document_url text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_position_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider position changes viewable by authenticated users"
ON public.provider_position_changes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider position changes manageable by authenticated users"
ON public.provider_position_changes FOR ALL
USING (auth.role() = 'authenticated');

-- 6. Leave Records
CREATE TABLE IF NOT EXISTS public.provider_leave (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Leave details
  leave_type text NOT NULL, -- annual, sick, maternity, paternity, compassionate, study, unpaid
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer NOT NULL,
  days_approved integer,
  
  -- Status
  status text DEFAULT 'pending', -- pending, approved, rejected, cancelled
  
  -- Approval
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  
  -- Notes
  reason text,
  notes text,
  supporting_document_url text,
  
  -- Acting arrangements
  acting_replacement_id uuid REFERENCES public.health_providers(id),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_leave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider leave viewable by authenticated users"
ON public.provider_leave FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider leave manageable by authenticated users"
ON public.provider_leave FOR ALL
USING (auth.role() = 'authenticated');

-- 7. Disciplinary Actions
CREATE TABLE IF NOT EXISTS public.provider_disciplinary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Incident details
  incident_date date NOT NULL,
  reported_date date,
  incident_type text NOT NULL, -- misconduct, negligence, absenteeism, insubordination, fraud, harassment
  description text NOT NULL,
  
  -- Action taken
  action_type text NOT NULL, -- verbal_warning, written_warning, suspension, demotion, termination, counseling
  action_date date NOT NULL,
  action_duration_days integer,
  action_end_date date,
  
  -- Status
  status text DEFAULT 'active', -- active, expired, appealed, overturned
  
  -- Investigation
  investigated_by text,
  investigation_notes text,
  
  -- Hearing
  hearing_date date,
  hearing_outcome text,
  
  -- Appeal
  appeal_filed boolean DEFAULT false,
  appeal_date date,
  appeal_outcome text,
  
  -- Documents
  incident_report_url text,
  disciplinary_letter_url text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_disciplinary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider disciplinary viewable by authenticated users"
ON public.provider_disciplinary FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider disciplinary manageable by authenticated users"
ON public.provider_disciplinary FOR ALL
USING (auth.role() = 'authenticated');

-- 8. Performance Evaluations
CREATE TABLE IF NOT EXISTS public.provider_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Evaluation period
  evaluation_period text NOT NULL, -- e.g., "2024 Q1", "2024 Annual"
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Evaluator
  evaluator_id uuid REFERENCES public.health_providers(id),
  evaluator_name text,
  evaluator_position text,
  
  -- Scores (out of 5)
  overall_score numeric(3,2),
  attendance_score numeric(3,2),
  quality_score numeric(3,2),
  productivity_score numeric(3,2),
  teamwork_score numeric(3,2),
  communication_score numeric(3,2),
  leadership_score numeric(3,2),
  
  -- Qualitative
  strengths text,
  areas_for_improvement text,
  goals_set text,
  goals_achieved text,
  comments text,
  
  -- Employee feedback
  employee_comments text,
  employee_signed boolean DEFAULT false,
  employee_signed_at timestamptz,
  
  -- Status
  status text DEFAULT 'draft', -- draft, submitted, reviewed, finalized
  finalized_at timestamptz,
  
  -- Documents
  evaluation_form_url text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider performance viewable by authenticated users"
ON public.provider_performance FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider performance manageable by authenticated users"
ON public.provider_performance FOR ALL
USING (auth.role() = 'authenticated');

-- 9. Salary/Compensation Records
CREATE TABLE IF NOT EXISTS public.provider_salary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Salary details
  salary_grade text NOT NULL,
  salary_step text,
  base_salary numeric NOT NULL,
  currency text DEFAULT 'USD',
  
  -- Pay frequency
  pay_frequency text DEFAULT 'monthly', -- weekly, biweekly, monthly, annual
  
  -- Funding source
  funds_source text NOT NULL, -- government, donor, private, ngo
  funder_name text,
  funding_project text,
  
  -- Allowances (stored as JSON for flexibility)
  allowances jsonb DEFAULT '[]'::jsonb,
  total_allowances numeric DEFAULT 0,
  
  -- Deductions
  deductions jsonb DEFAULT '[]'::jsonb,
  total_deductions numeric DEFAULT 0,
  
  -- Net
  net_salary numeric,
  
  -- Effective period
  effective_from date NOT NULL,
  effective_until date,
  is_current boolean DEFAULT true,
  
  -- Bank details (encrypted reference)
  bank_name text,
  account_number_masked text, -- Only last 4 digits
  
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_salary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider salary viewable by authenticated users"
ON public.provider_salary FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider salary manageable by authenticated users"
ON public.provider_salary FOR ALL
USING (auth.role() = 'authenticated');

-- 10. Emergency Contacts
CREATE TABLE IF NOT EXISTS public.provider_emergency_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Contact details
  contact_name text NOT NULL,
  relationship text NOT NULL, -- spouse, parent, sibling, child, friend, other
  
  -- Contact information
  phone_primary text NOT NULL,
  phone_secondary text,
  email text,
  
  -- Address
  address text,
  city text,
  country text DEFAULT 'ZW',
  
  -- Priority
  priority_order integer DEFAULT 1,
  is_primary boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider emergency contacts viewable by authenticated users"
ON public.provider_emergency_contacts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider emergency contacts manageable by authenticated users"
ON public.provider_emergency_contacts FOR ALL
USING (auth.role() = 'authenticated');

-- 11. Dependents
CREATE TABLE IF NOT EXISTS public.provider_dependents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Dependent details
  full_name text NOT NULL,
  relationship text NOT NULL, -- spouse, child, parent, sibling
  date_of_birth date,
  sex text,
  
  -- Identification
  national_id text,
  
  -- Status
  is_beneficiary boolean DEFAULT true, -- For benefits/insurance
  is_dependent_on_tax boolean DEFAULT false,
  
  -- Health
  disability_status boolean DEFAULT false,
  disability_type text,
  
  -- Contact
  phone text,
  email text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.provider_dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider dependents viewable by authenticated users"
ON public.provider_dependents FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider dependents manageable by authenticated users"
ON public.provider_dependents FOR ALL
USING (auth.role() = 'authenticated');

-- 12. Additional Identifiers
CREATE TABLE IF NOT EXISTS public.provider_identifiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.health_providers(id) ON DELETE CASCADE,
  
  -- Identifier details
  identifier_type text NOT NULL, -- driving_license, professional_license, tin, ssn, pension
  identifier_value text NOT NULL,
  
  -- Validity
  issue_date date,
  expiry_date date,
  issuing_authority text,
  issuing_country text DEFAULT 'ZW',
  
  -- Verification
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(provider_id, identifier_type, identifier_value)
);

ALTER TABLE public.provider_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider identifiers viewable by authenticated users"
ON public.provider_identifiers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Provider identifiers manageable by authenticated users"
ON public.provider_identifiers FOR ALL
USING (auth.role() = 'authenticated');

-- 13. Reference Data: Education Levels
CREATE TABLE IF NOT EXISTS public.ref_education_levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ref_education_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Education levels viewable by all"
ON public.ref_education_levels FOR SELECT
USING (true);

-- Insert default education levels
INSERT INTO public.ref_education_levels (code, name, sort_order) VALUES
('certificate', 'Certificate', 1),
('diploma', 'Diploma', 2),
('advanced_diploma', 'Advanced Diploma', 3),
('bachelors', 'Bachelor''s Degree', 4),
('honors', 'Honours Degree', 5),
('postgrad_diploma', 'Postgraduate Diploma', 6),
('masters', 'Master''s Degree', 7),
('doctorate', 'Doctorate/PhD', 8),
('fellowship', 'Fellowship', 9)
ON CONFLICT (code) DO NOTHING;

-- 14. Reference Data: Training Types
CREATE TABLE IF NOT EXISTS public.ref_training_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ref_training_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Training types viewable by all"
ON public.ref_training_types FOR SELECT
USING (true);

INSERT INTO public.ref_training_types (code, name) VALUES
('workshop', 'Workshop'),
('seminar', 'Seminar'),
('conference', 'Conference'),
('certification', 'Certification Course'),
('short_course', 'Short Course'),
('online_course', 'Online Course'),
('on_job_training', 'On-the-Job Training'),
('mentorship', 'Mentorship Program'),
('exchange', 'Exchange Program')
ON CONFLICT (code) DO NOTHING;

-- 15. Reference Data: Leave Types
CREATE TABLE IF NOT EXISTS public.ref_leave_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  default_days integer,
  is_paid boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ref_leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leave types viewable by all"
ON public.ref_leave_types FOR SELECT
USING (true);

INSERT INTO public.ref_leave_types (code, name, default_days, is_paid) VALUES
('annual', 'Annual Leave', 22, true),
('sick', 'Sick Leave', 12, true),
('maternity', 'Maternity Leave', 98, true),
('paternity', 'Paternity Leave', 14, true),
('compassionate', 'Compassionate Leave', 5, true),
('study', 'Study Leave', 10, true),
('unpaid', 'Leave Without Pay', 0, false)
ON CONFLICT (code) DO NOTHING;

-- 16. Reference Data: Salary Grades
CREATE TABLE IF NOT EXISTS public.ref_salary_grades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  min_salary numeric,
  max_salary numeric,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ref_salary_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salary grades viewable by all"
ON public.ref_salary_grades FOR SELECT
USING (true);

INSERT INTO public.ref_salary_grades (code, name, min_salary, max_salary) VALUES
('A1', 'Grade A1 - Entry Level', 300, 500),
('A2', 'Grade A2 - Junior', 500, 800),
('B1', 'Grade B1 - Mid-Level', 800, 1200),
('B2', 'Grade B2 - Senior', 1200, 1800),
('C1', 'Grade C1 - Specialist', 1800, 2500),
('C2', 'Grade C2 - Expert', 2500, 3500),
('D1', 'Grade D1 - Management', 3500, 5000),
('D2', 'Grade D2 - Senior Management', 5000, 7500),
('E1', 'Grade E1 - Executive', 7500, 10000)
ON CONFLICT (code) DO NOTHING;

-- 17. Reference Data: Classification (iHRIS alignment)
CREATE TABLE IF NOT EXISTS public.ref_classifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ref_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classifications viewable by all"
ON public.ref_classifications FOR SELECT
USING (true);

INSERT INTO public.ref_classifications (code, name, description) VALUES
('clinical', 'Clinical Staff', 'Healthcare providers delivering direct patient care'),
('technical', 'Technical Staff', 'Laboratory, radiology, and other technical professionals'),
('nursing', 'Nursing Staff', 'Registered nurses, enrolled nurses, and nursing aides'),
('allied', 'Allied Health', 'Physiotherapists, occupational therapists, and other allied professionals'),
('pharmacy', 'Pharmacy Staff', 'Pharmacists and pharmacy technicians'),
('management', 'Management', 'Administrative and management staff'),
('support', 'Support Staff', 'Non-clinical support personnel'),
('community', 'Community Health', 'Community health workers and village health workers')
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_education_provider ON public.provider_education(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_training_provider ON public.provider_training(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_employment_history_provider ON public.provider_employment_history(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_position_changes_provider ON public.provider_position_changes(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_leave_provider ON public.provider_leave(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_leave_dates ON public.provider_leave(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_provider_disciplinary_provider ON public.provider_disciplinary(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_performance_provider ON public.provider_performance(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_salary_provider ON public.provider_salary(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_emergency_contacts_provider ON public.provider_emergency_contacts(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_dependents_provider ON public.provider_dependents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_identifiers_provider ON public.provider_identifiers(provider_id);