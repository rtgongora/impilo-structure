-- Queue Management System (QMS) Database Schema
-- Implements QMS-FR-01 through QMS-FR-101

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE public.queue_priority AS ENUM (
  'emergency', 'very_urgent', 'urgent', 'routine', 'scheduled'
);

CREATE TYPE public.queue_item_status AS ENUM (
  'waiting', 'called', 'in_service', 'paused', 'completed', 
  'transferred', 'escalated', 'no_show', 'cancelled'
);

CREATE TYPE public.queue_service_type AS ENUM (
  'opd_triage', 'opd_consultation', 'specialist_clinic', 'anc_clinic',
  'hiv_clinic', 'tb_clinic', 'ncd_clinic', 'child_welfare_clinic',
  'dialysis', 'imaging', 'lab_reception', 'lab_sample_collection',
  'pharmacy', 'theatre_preop', 'theatre_recovery', 'procedure_room',
  'telecare', 'specialist_pool', 'general_reception'
);

CREATE TYPE public.queue_facility_mode AS ENUM ('simple', 'standard', 'advanced');

CREATE TYPE public.queue_entry_type AS ENUM (
  'walk_in', 'appointment', 'referral', 'internal_transfer', 'callback'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

CREATE TABLE public.queue_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES public.virtual_pools(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_type queue_service_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_virtual BOOLEAN DEFAULT false,
  operating_hours_start TIME,
  operating_hours_end TIME,
  operating_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  default_priority queue_priority DEFAULT 'routine',
  sla_target_minutes INTEGER,
  escalation_threshold_minutes INTEGER,
  walk_in_appointment_ratio TEXT DEFAULT '2:1',
  allowed_cadres TEXT[],
  default_next_queue_id UUID,
  display_order INTEGER DEFAULT 0,
  color_code TEXT,
  icon TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT workspace_or_pool CHECK (workspace_id IS NOT NULL OR pool_id IS NOT NULL OR is_virtual = true)
);

CREATE TABLE public.queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queue_definitions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id),
  health_id TEXT,
  temp_identity_id UUID,
  encounter_id UUID REFERENCES public.encounters(id),
  appointment_id UUID REFERENCES public.appointments(id),
  ticket_number TEXT,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  entry_type queue_entry_type NOT NULL DEFAULT 'walk_in',
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrival_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason_for_visit TEXT,
  reason_code TEXT,
  notes TEXT,
  priority queue_priority NOT NULL DEFAULT 'routine',
  priority_changed_at TIMESTAMPTZ,
  priority_changed_by UUID,
  priority_change_reason TEXT,
  status queue_item_status NOT NULL DEFAULT 'waiting',
  called_at TIMESTAMPTZ,
  in_service_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_provider_id UUID,
  assigned_team_id UUID,
  transferred_from_queue_id UUID REFERENCES public.queue_definitions(id),
  transferred_from_item_id UUID,
  transfer_reason TEXT,
  transfer_request_id UUID,
  referral_id UUID REFERENCES public.referrals(id),
  ordering_provider_id UUID,
  is_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  escalated_by UUID,
  wait_time_minutes INTEGER,
  service_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.queue_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  pathway_steps JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.queue_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  from_status queue_item_status,
  to_status queue_item_status NOT NULL,
  from_queue_id UUID REFERENCES public.queue_definitions(id),
  to_queue_id UUID REFERENCES public.queue_definitions(id),
  performed_by UUID NOT NULL,
  workspace_id UUID,
  reason TEXT,
  notes TEXT,
  transition_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.queue_facility_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL UNIQUE REFERENCES public.facilities(id) ON DELETE CASCADE,
  queue_mode queue_facility_mode NOT NULL DEFAULT 'standard',
  enable_tokens BOOLEAN DEFAULT true,
  enable_sla_tracking BOOLEAN DEFAULT true,
  enable_priority_escalation BOOLEAN DEFAULT true,
  enable_self_checkin BOOLEAN DEFAULT false,
  enable_patient_display BOOLEAN DEFAULT false,
  enable_sms_notifications BOOLEAN DEFAULT false,
  default_sla_triage_minutes INTEGER DEFAULT 30,
  default_sla_consultation_minutes INTEGER DEFAULT 60,
  default_sla_lab_minutes INTEGER DEFAULT 120,
  default_sla_imaging_minutes INTEGER DEFAULT 90,
  default_sla_pharmacy_minutes INTEGER DEFAULT 30,
  enable_overflow_queues BOOLEAN DEFAULT false,
  max_overflow_queues INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.queue_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queue_definitions(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_arrivals INTEGER DEFAULT 0,
  walk_ins INTEGER DEFAULT 0,
  appointments INTEGER DEFAULT 0,
  transfers_in INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  cancelled INTEGER DEFAULT 0,
  transfers_out INTEGER DEFAULT 0,
  avg_wait_minutes NUMERIC(10,2),
  max_wait_minutes INTEGER,
  avg_service_minutes NUMERIC(10,2),
  sla_met_count INTEGER DEFAULT 0,
  sla_breached_count INTEGER DEFAULT 0,
  peak_queue_length INTEGER,
  peak_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(queue_id, stat_date)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_queue_definitions_facility ON public.queue_definitions(facility_id);
CREATE INDEX idx_queue_definitions_workspace ON public.queue_definitions(workspace_id);
CREATE INDEX idx_queue_definitions_service_type ON public.queue_definitions(service_type);
CREATE INDEX idx_queue_definitions_active ON public.queue_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_queue_items_queue ON public.queue_items(queue_id);
CREATE INDEX idx_queue_items_patient ON public.queue_items(patient_id);
CREATE INDEX idx_queue_items_status ON public.queue_items(status);
CREATE INDEX idx_queue_items_priority ON public.queue_items(priority);
CREATE INDEX idx_queue_items_waiting ON public.queue_items(queue_id, status, arrival_time) WHERE status IN ('waiting', 'called');
CREATE INDEX idx_queue_items_date ON public.queue_items(queue_id, arrival_date);
CREATE INDEX idx_queue_transitions_item ON public.queue_transitions(queue_item_id);
CREATE INDEX idx_queue_transitions_performer ON public.queue_transitions(performed_by);
CREATE INDEX idx_queue_transitions_time ON public.queue_transitions(transition_at);
CREATE INDEX idx_queue_daily_stats_queue_date ON public.queue_daily_stats(queue_id, stat_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.queue_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_facility_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue_definitions_select" ON public.queue_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_definitions_manage" ON public.queue_definitions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "queue_items_select" ON public.queue_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_items_insert" ON public.queue_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "queue_items_update" ON public.queue_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "queue_items_delete" ON public.queue_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "queue_pathways_select" ON public.queue_pathways FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_pathways_manage" ON public.queue_pathways FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "queue_transitions_select" ON public.queue_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_transitions_insert" ON public.queue_transitions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "queue_facility_config_select" ON public.queue_facility_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_facility_config_manage" ON public.queue_facility_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "queue_daily_stats_select" ON public.queue_daily_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_daily_stats_manage" ON public.queue_daily_stats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_queue_ticket(p_queue_id UUID, p_prefix TEXT DEFAULT 'Q')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER; v_ticket TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE;
  v_ticket := p_prefix || '-' || LPAD(v_count::TEXT, 3, '0');
  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_queue_sequence(p_queue_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_next INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_next FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE;
  RETURN v_next;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_queue_metrics(p_queue_id UUID)
RETURNS TABLE (queue_length INTEGER, avg_wait_minutes NUMERIC, longest_wait_minutes INTEGER, in_service_count INTEGER, completed_today INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE AND status = 'waiting'),
    (SELECT AVG(EXTRACT(EPOCH FROM (now() - arrival_time)) / 60) FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE AND status = 'waiting'),
    (SELECT MAX(EXTRACT(EPOCH FROM (now() - arrival_time)) / 60)::INTEGER FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE AND status = 'waiting'),
    (SELECT COUNT(*)::INTEGER FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE AND status = 'in_service'),
    (SELECT COUNT(*)::INTEGER FROM public.queue_items WHERE queue_id = p_queue_id AND arrival_date = CURRENT_DATE AND status = 'completed');
END;
$$;

-- Trigger to auto-generate ticket and sequence
CREATE OR REPLACE FUNCTION public.queue_item_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.sequence_number := public.get_next_queue_sequence(NEW.queue_id);
  IF NEW.ticket_number IS NULL THEN
    SELECT public.generate_queue_ticket(NEW.queue_id, UPPER(LEFT(qd.service_type::TEXT, 3)))
    INTO NEW.ticket_number FROM public.queue_definitions qd WHERE qd.id = NEW.queue_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER queue_item_before_insert_trigger BEFORE INSERT ON public.queue_items FOR EACH ROW EXECUTE FUNCTION public.queue_item_before_insert();

-- Trigger to log transitions
CREATE OR REPLACE FUNCTION public.queue_item_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.queue_transitions (queue_item_id, from_status, to_status, from_queue_id, to_queue_id, performed_by)
    VALUES (NEW.id, OLD.status, NEW.status, OLD.queue_id, NEW.queue_id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID));
    
    IF NEW.status = 'in_service' AND NEW.in_service_at IS NOT NULL THEN
      NEW.wait_time_minutes := EXTRACT(EPOCH FROM (NEW.in_service_at - NEW.arrival_time))::INTEGER / 60;
    END IF;
    IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL AND NEW.in_service_at IS NOT NULL THEN
      NEW.service_time_minutes := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.in_service_at))::INTEGER / 60;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER queue_item_status_change_trigger BEFORE UPDATE ON public.queue_items FOR EACH ROW EXECUTE FUNCTION public.queue_item_status_change();

CREATE TRIGGER update_queue_definitions_updated_at BEFORE UPDATE ON public.queue_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_queue_items_updated_at BEFORE UPDATE ON public.queue_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_queue_facility_config_updated_at BEFORE UPDATE ON public.queue_facility_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();