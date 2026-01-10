
-- Patient Sorting & Front-Door Flow Schema

-- Enums for sorting workflow
CREATE TYPE public.arrival_mode AS ENUM ('walk_in', 'appointment', 'referral', 'emergency');
CREATE TYPE public.triage_urgency AS ENUM ('emergency', 'very_urgent', 'urgent', 'routine');
CREATE TYPE public.sorting_outcome AS ENUM ('immediate_care', 'queued', 'referred', 'deferred', 'redirected');
CREATE TYPE public.identity_resolution_status AS ENUM ('confirmed', 'probable_match', 'temporary', 'unknown');
CREATE TYPE public.sorting_session_status AS ENUM ('in_progress', 'completed', 'cancelled', 'escalated');

-- Core Sorting Sessions table
CREATE TABLE public.sorting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  sorting_desk_id UUID REFERENCES public.workspaces(id),
  
  -- Arrival info
  arrival_mode arrival_mode NOT NULL DEFAULT 'walk_in',
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Identity resolution
  identity_status identity_resolution_status NOT NULL DEFAULT 'unknown',
  patient_id UUID REFERENCES public.patients(id),
  temp_identity_id UUID,
  health_id TEXT,
  search_query TEXT,
  
  -- Triage
  triage_category triage_urgency,
  presenting_complaint TEXT,
  danger_signs TEXT[],
  triage_notes TEXT,
  triage_by UUID,
  triage_at TIMESTAMPTZ,
  
  -- Outcome
  outcome sorting_outcome,
  outcome_reason TEXT,
  outcome_at TIMESTAMPTZ,
  outcome_by UUID,
  
  -- Routing
  target_queue_id UUID REFERENCES public.queue_definitions(id),
  queue_item_id UUID REFERENCES public.queue_items(id),
  immediate_care_workspace_id UUID REFERENCES public.workspaces(id),
  encounter_id UUID REFERENCES public.encounters(id),
  
  -- Supervisor actions
  escalated BOOLEAN DEFAULT false,
  escalated_reason TEXT,
  escalated_at TIMESTAMPTZ,
  escalated_by UUID,
  supervisor_override BOOLEAN DEFAULT false,
  supervisor_notes TEXT,
  
  -- Session status
  status sorting_session_status NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  processing_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Temporary patient identities for unknown patients
CREATE TABLE public.temporary_patient_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_id TEXT NOT NULL UNIQUE,
  
  -- Minimal identity info
  given_name TEXT,
  alias TEXT,
  sex TEXT,
  estimated_age INTEGER,
  estimated_age_unit TEXT DEFAULT 'years',
  
  -- Creation context
  reason TEXT NOT NULL,
  sorting_session_id UUID REFERENCES public.sorting_sessions(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Reconciliation
  reconciled_to_patient_id UUID REFERENCES public.patients(id),
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  reconciliation_method TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sorting desk performance metrics (aggregated)
CREATE TABLE public.sorting_desk_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  metric_date DATE NOT NULL,
  metric_hour INTEGER,
  
  -- Counts
  total_arrivals INTEGER DEFAULT 0,
  total_triaged INTEGER DEFAULT 0,
  immediate_care_count INTEGER DEFAULT 0,
  queued_count INTEGER DEFAULT 0,
  
  -- Timings (in seconds)
  avg_processing_time INTEGER,
  max_processing_time INTEGER,
  min_processing_time INTEGER,
  
  -- Identity stats
  confirmed_identity_count INTEGER DEFAULT 0,
  temporary_identity_count INTEGER DEFAULT 0,
  
  -- Urgency breakdown
  emergency_count INTEGER DEFAULT 0,
  very_urgent_count INTEGER DEFAULT 0,
  urgent_count INTEGER DEFAULT 0,
  routine_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(facility_id, metric_date, metric_hour, workspace_id)
);

-- Sorting session audit log
CREATE TABLE public.sorting_session_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorting_session_id UUID REFERENCES public.sorting_sessions(id) NOT NULL,
  action TEXT NOT NULL,
  action_data JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- Function to generate sorting session number
CREATE OR REPLACE FUNCTION public.generate_sorting_session_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date_part TEXT;
  v_seq INTEGER;
  v_session_number TEXT;
BEGIN
  v_date_part := to_char(now(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(session_number FROM 13) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM public.sorting_sessions
  WHERE session_number LIKE 'SORT-' || v_date_part || '-%';
  
  v_session_number := 'SORT-' || v_date_part || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_session_number;
END;
$$;

-- Function to generate temp patient ID
CREATE OR REPLACE FUNCTION public.generate_temp_patient_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date_part TEXT;
  v_random TEXT;
  v_temp_id TEXT;
BEGIN
  v_date_part := to_char(now(), 'YYYYMMDD');
  v_random := UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 4));
  v_temp_id := 'TEMP-' || v_date_part || '-' || v_random;
  RETURN v_temp_id;
END;
$$;

-- Trigger for auto-generating session number
CREATE OR REPLACE FUNCTION public.sorting_session_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.session_number IS NULL OR NEW.session_number = '' THEN
    NEW.session_number := public.generate_sorting_session_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sorting_session_before_insert
  BEFORE INSERT ON public.sorting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sorting_session_before_insert();

-- Trigger for auto-generating temp patient ID
CREATE OR REPLACE FUNCTION public.temp_identity_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.temp_id IS NULL OR NEW.temp_id = '' THEN
    NEW.temp_id := public.generate_temp_patient_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_temp_identity_before_insert
  BEFORE INSERT ON public.temporary_patient_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.temp_identity_before_insert();

-- Trigger to calculate processing time on completion
CREATE OR REPLACE FUNCTION public.sorting_session_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    NEW.processing_time_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.arrival_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sorting_session_on_complete
  BEFORE UPDATE ON public.sorting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sorting_session_on_complete();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION public.log_sorting_session_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sorting_session_audit (sorting_session_id, action, action_data, performed_by)
    VALUES (NEW.id, 'created', jsonb_build_object('arrival_mode', NEW.arrival_mode), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log triage
    IF NEW.triage_at IS NOT NULL AND OLD.triage_at IS NULL THEN
      INSERT INTO public.sorting_session_audit (sorting_session_id, action, action_data, performed_by)
      VALUES (NEW.id, 'triaged', jsonb_build_object('category', NEW.triage_category, 'complaint', NEW.presenting_complaint), NEW.triage_by);
    END IF;
    -- Log outcome
    IF NEW.outcome IS NOT NULL AND OLD.outcome IS NULL THEN
      INSERT INTO public.sorting_session_audit (sorting_session_id, action, action_data, performed_by)
      VALUES (NEW.id, 'routed', jsonb_build_object('outcome', NEW.outcome, 'reason', NEW.outcome_reason), NEW.outcome_by);
    END IF;
    -- Log escalation
    IF NEW.escalated = true AND OLD.escalated = false THEN
      INSERT INTO public.sorting_session_audit (sorting_session_id, action, action_data, performed_by)
      VALUES (NEW.id, 'escalated', jsonb_build_object('reason', NEW.escalated_reason), NEW.escalated_by);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_sorting_session_changes
  AFTER INSERT OR UPDATE ON public.sorting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sorting_session_changes();

-- Enable RLS
ALTER TABLE public.sorting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_patient_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorting_desk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorting_session_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read sorting sessions"
  ON public.sorting_sessions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sorting sessions"
  ON public.sorting_sessions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sorting sessions"
  ON public.sorting_sessions FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read temp identities"
  ON public.temporary_patient_identities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage temp identities"
  ON public.temporary_patient_identities FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update temp identities"
  ON public.temporary_patient_identities FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read sorting metrics"
  ON public.sorting_desk_metrics FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read sorting audit"
  ON public.sorting_session_audit FOR SELECT TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sorting_sessions;

-- Indexes for performance
CREATE INDEX idx_sorting_sessions_facility_date ON public.sorting_sessions(facility_id, arrival_time);
CREATE INDEX idx_sorting_sessions_status ON public.sorting_sessions(status) WHERE status = 'in_progress';
CREATE INDEX idx_sorting_sessions_patient ON public.sorting_sessions(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_temp_identities_active ON public.temporary_patient_identities(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_sorting_metrics_date ON public.sorting_desk_metrics(facility_id, metric_date);
