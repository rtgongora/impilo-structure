
-- PCT (Patient Care Tracker) v1.1 Schema
-- Operational orchestrator: state/workflow/queues/assignments/telemetry
-- Clinical payloads live in BUTANO; identity in TSHEPO/VITO

-- ============================================================
-- A) Workspace Sessions (Work tab foundation)
-- ============================================================
CREATE TABLE public.pct_workspace_sessions (
  session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  shift_id TEXT,
  duty_mode TEXT NOT NULL DEFAULT 'CLINICAL' CHECK (duty_mode IN ('CLINICAL','ADMIN','VIRTUAL')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ENDED')),
  context_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pct_ws_sessions_actor ON public.pct_workspace_sessions (tenant_id, actor_id, status);
CREATE INDEX idx_pct_ws_sessions_facility ON public.pct_workspace_sessions (tenant_id, facility_id, started_at DESC);

ALTER TABLE public.pct_workspace_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_workspace_sessions"
  ON public.pct_workspace_sessions FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- B) Patient Journeys
-- ============================================================
CREATE TABLE public.pct_journeys (
  journey_id TEXT NOT NULL PRIMARY KEY, -- ULID string
  tenant_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  patient_cpid TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'ARRIVED' CHECK (state IN (
    'ARRIVED','REG_PENDING','TRIAGED','ROUTED','IN_QUEUE',
    'IN_ENCOUNTER','ADMITTED','DISCHARGE_IN_PROGRESS','DISCHARGED',
    'DEATH_IN_PROGRESS','DECEASED','CANCELLED'
  )),
  referral_source TEXT,
  current_workspace_id TEXT,
  current_queue_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pct_journeys_facility ON public.pct_journeys (tenant_id, facility_id, updated_at DESC);
CREATE INDEX idx_pct_journeys_cpid ON public.pct_journeys (tenant_id, patient_cpid, created_at DESC);

ALTER TABLE public.pct_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_journeys"
  ON public.pct_journeys FOR ALL USING (auth.uid() IS NOT NULL);

-- Triage Records
CREATE TABLE public.pct_triage_records (
  triage_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  acuity TEXT NOT NULL CHECK (acuity IN ('RED','ORANGE','YELLOW','GREEN','BLUE')),
  vitals_json JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  triaged_by_actor_id TEXT NOT NULL,
  triaged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_triage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_triage_records"
  ON public.pct_triage_records FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- C) Queues + Worklists
-- ============================================================
CREATE TABLE public.pct_queues (
  queue_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FIFO' CHECK (type IN ('FIFO','PRIORITY','TRIAGE','APPOINTMENT')),
  rules_json JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_queues"
  ON public.pct_queues FOR ALL USING (auth.uid() IS NOT NULL);

-- Ticket counter per workspace
CREATE TABLE public.pct_ticket_counters (
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, workspace_id, counter_date)
);

ALTER TABLE public.pct_ticket_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_ticket_counters"
  ON public.pct_ticket_counters FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_queue_items (
  item_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_id UUID NOT NULL REFERENCES public.pct_queues(queue_id),
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  priority INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN (
    'WAITING','CALLED','IN_SERVICE','PAUSED','COMPLETED','NO_SHOW','LEFT'
  )),
  ticket_number TEXT,
  enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  called_by_actor_id TEXT,
  last_status_by_actor_id TEXT,
  notes TEXT
);

CREATE INDEX idx_pct_qi_queue ON public.pct_queue_items (tenant_id, queue_id, status);
CREATE INDEX idx_pct_qi_journey ON public.pct_queue_items (tenant_id, journey_id);

ALTER TABLE public.pct_queue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_queue_items"
  ON public.pct_queue_items FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- D) Encounter Orchestration
-- ============================================================
CREATE TABLE public.pct_encounters (
  pct_encounter_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  status TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','ON_HOLD','COMPLETED','CANCELLED')),
  workspace_id TEXT NOT NULL,
  assigned_provider_public_id TEXT,
  butano_encounter_ref TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  meta_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_pct_enc_journey ON public.pct_encounters (tenant_id, journey_id);
CREATE INDEX idx_pct_enc_workspace ON public.pct_encounters (tenant_id, workspace_id, started_at DESC);

ALTER TABLE public.pct_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_encounters"
  ON public.pct_encounters FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- E) Tasks + Handoffs
-- ============================================================
CREATE TABLE public.pct_tasks (
  task_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  type TEXT NOT NULL DEFAULT 'OTHER' CHECK (type IN (
    'TRIAGE_REVIEW','LAB_FOLLOWUP','IMAGING_REVIEW','PHARMACY_DISPENSE',
    'BILLING_CLEARANCE','DISCHARGE_SUMMARY','TELEMED_HANDOFF','OTHER'
  )),
  assignee_type TEXT NOT NULL DEFAULT 'ROLE' CHECK (assignee_type IN ('ROLE','PERSON','WORKSPACE')),
  assignee_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKED','IN_PROGRESS','DONE','CANCELLED')),
  due_at TIMESTAMPTZ,
  created_by_actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handoff_notes TEXT
);

ALTER TABLE public.pct_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_tasks"
  ON public.pct_tasks FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- F) Admissions / Transfers / Discharge / Death
-- ============================================================
CREATE TABLE public.pct_admissions (
  admission_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  ward_id TEXT NOT NULL,
  bed_id TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','APPROVED','ADMITTED','TRANSFER_PENDING','TRANSFERRED','DISCHARGED','CANCELLED'
  )),
  requested_by_actor_id TEXT NOT NULL,
  approved_by_actor_id TEXT,
  admitted_at TIMESTAMPTZ,
  discharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_admissions"
  ON public.pct_admissions FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_transfers (
  transfer_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  from_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  to_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','APPROVED','IN_TRANSIT','COMPLETED','REJECTED'
  )),
  approvals_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_transfers"
  ON public.pct_transfers FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_discharge_cases (
  case_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  discharge_type TEXT NOT NULL DEFAULT 'ROUTINE' CHECK (discharge_type IN ('ROUTINE','AMA','TRANSFER','OTHER')),
  blockers_json JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','BLOCKED','CLEARED','COMPLETED')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_discharge_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_discharge_cases"
  ON public.pct_discharge_cases FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_death_cases (
  case_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  status TEXT NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED','NOTIFIED_UBOMI','COMPLETED')),
  ubomi_status TEXT,
  cert_doc_id TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_death_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_death_cases"
  ON public.pct_death_cases FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- G) Telemetry + Alerts + Outbox
-- ============================================================
CREATE TABLE public.pct_telemetry_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  workspace_id TEXT,
  event_type TEXT NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_json JSONB DEFAULT '{}'::jsonb,
  correlation_id TEXT NOT NULL
);

CREATE INDEX idx_pct_telemetry ON public.pct_telemetry_events (tenant_id, facility_id, event_ts DESC);

ALTER TABLE public.pct_telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read pct_telemetry_events"
  ON public.pct_telemetry_events FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_alerts (
  alert_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARN','CRITICAL')),
  rule_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  payload_json JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.pct_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_alerts"
  ON public.pct_alerts FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.pct_outbox_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}'::jsonb,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_pct_outbox_unpublished ON public.pct_outbox_events (tenant_id, published_at) WHERE published_at IS NULL;

ALTER TABLE public.pct_outbox_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_outbox_events"
  ON public.pct_outbox_events FOR ALL USING (auth.uid() IS NOT NULL);

-- MUSHEX payment status mock table (for discharge gate)
CREATE TABLE public.pct_mushex_payment_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journey_id TEXT NOT NULL REFERENCES public.pct_journeys(journey_id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PARTIAL','CLEARED','WAIVED','FAILED')),
  amount_due NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  correlation_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pct_mushex_payment_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_mushex_payment_status"
  ON public.pct_mushex_payment_status FOR ALL USING (auth.uid() IS NOT NULL);

-- Idempotency guard for inbound integration webhooks
CREATE TABLE public.pct_integration_idempotency (
  tenant_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, correlation_id, event_type)
);

ALTER TABLE public.pct_integration_idempotency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pct_integration_idempotency"
  ON public.pct_integration_idempotency FOR ALL USING (auth.uid() IS NOT NULL);
