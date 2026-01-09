
-- Job Lists
CREATE TABLE IF NOT EXISTS public.ref_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_salary_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_salary DECIMAL(12,2),
  max_salary DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_job_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cadre_id UUID,
  classification_id UUID,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_job_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Education Lists
CREATE TABLE IF NOT EXISTS public.ref_education_majors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  field_of_study TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_degrees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level_id UUID,
  duration_years INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_education_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  years_of_education INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_institution_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  institution_type_id UUID,
  country TEXT,
  city TEXT,
  is_accredited BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Position Lists
CREATE TABLE IF NOT EXISTS public.ref_employment_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_departure_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_pay_frequencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  periods_per_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Other Lists
CREATE TABLE IF NOT EXISTS public.ref_identifier_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  validation_regex TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  max_days_per_year INTEGER,
  is_paid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_discipline_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  severity TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_training_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Geographical Information
CREATE TABLE IF NOT EXISTS public.ref_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  iso_code TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_id UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region_id UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_nationalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_id UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Facility Data
CREATE TABLE IF NOT EXISTS public.ref_facility_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ref_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_education_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_degrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_institution_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_employment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_departure_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_pay_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_identifier_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_discipline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_training_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_nationalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_facility_types ENABLE ROW LEVEL SECURITY;

-- Create read policies for all reference tables
CREATE POLICY "ref_classifications_select" ON public.ref_classifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_salary_grades_select" ON public.ref_salary_grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_job_titles_select" ON public.ref_job_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_job_types_select" ON public.ref_job_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_education_majors_select" ON public.ref_education_majors FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_degrees_select" ON public.ref_degrees FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_education_levels_select" ON public.ref_education_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_institution_types_select" ON public.ref_institution_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_institutions_select" ON public.ref_institutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_employment_statuses_select" ON public.ref_employment_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_departure_reasons_select" ON public.ref_departure_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_pay_frequencies_select" ON public.ref_pay_frequencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_identifier_types_select" ON public.ref_identifier_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_leave_types_select" ON public.ref_leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_discipline_actions_select" ON public.ref_discipline_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_training_types_select" ON public.ref_training_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_countries_select" ON public.ref_countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_regions_select" ON public.ref_regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_districts_select" ON public.ref_districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_nationalities_select" ON public.ref_nationalities FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_facility_types_select" ON public.ref_facility_types FOR SELECT TO authenticated USING (true);

-- Create admin policies for all reference tables
CREATE POLICY "ref_classifications_admin" ON public.ref_classifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_salary_grades_admin" ON public.ref_salary_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_job_titles_admin" ON public.ref_job_titles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_job_types_admin" ON public.ref_job_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_education_majors_admin" ON public.ref_education_majors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_degrees_admin" ON public.ref_degrees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_education_levels_admin" ON public.ref_education_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_institution_types_admin" ON public.ref_institution_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_institutions_admin" ON public.ref_institutions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_employment_statuses_admin" ON public.ref_employment_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_departure_reasons_admin" ON public.ref_departure_reasons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_pay_frequencies_admin" ON public.ref_pay_frequencies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_identifier_types_admin" ON public.ref_identifier_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_leave_types_admin" ON public.ref_leave_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_discipline_actions_admin" ON public.ref_discipline_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_training_types_admin" ON public.ref_training_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_countries_admin" ON public.ref_countries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_regions_admin" ON public.ref_regions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_districts_admin" ON public.ref_districts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_nationalities_admin" ON public.ref_nationalities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ref_facility_types_admin" ON public.ref_facility_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
