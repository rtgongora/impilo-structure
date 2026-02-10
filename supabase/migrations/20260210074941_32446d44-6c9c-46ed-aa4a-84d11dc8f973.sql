
-- OROS v1.1 — Orders & Results Orchestration Schema
-- CAP — Capability Registry for routing decisions

-- ============================================================
-- A) oros.orders — Canonical Orders + State Machine
-- ============================================================
CREATE TABLE public.oros_orders (
  order_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  patient_cpid text NOT NULL,
  type text NOT NULL CHECK (type IN ('LAB','IMAGING','PHARMACY','PROCEDURE','OTHER')),
  priority text NOT NULL DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE','URGENT','STAT')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PLACED','ACCEPTED','SCHEDULED','IN_PROGRESS','PARTIAL_RESULT','RESULT_AVAILABLE','REVIEWED','RELEASED','COMPLETED','CANCELLED','REJECTED','FAILED')),
  placed_at timestamptz,
  placed_by_actor_id text,
  zibo_order_code jsonb,
  external_refs jsonb DEFAULT '{}'::jsonb,
  butano_refs jsonb DEFAULT '{}'::jsonb,
  routing_mode text DEFAULT 'INTERNAL' CHECK (routing_mode IN ('INTERNAL','ADAPTER','HYBRID')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oros_orders_tenant_facility ON public.oros_orders (tenant_id, facility_id, status, placed_at DESC);
CREATE INDEX idx_oros_orders_cpid ON public.oros_orders (patient_cpid, placed_at DESC);
CREATE INDEX idx_oros_orders_external_refs ON public.oros_orders USING GIN (external_refs);

ALTER TABLE public.oros_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_orders" ON public.oros_orders FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- B) oros.order_items
-- ============================================================
CREATE TABLE public.oros_order_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  code jsonb NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  instructions text,
  specimen_type jsonb,
  body_site jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oros_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_order_items" ON public.oros_order_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- C) oros.worksteps
-- ============================================================
CREATE TABLE public.oros_worksteps (
  workstep_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  step_type text NOT NULL CHECK (step_type IN ('ORDER_PLACED','SPECIMEN_COLLECTION','SPECIMEN_RECEIVED','ANALYSIS','REPORTING','IMAGING_ACQUISITION','IMAGING_REPORTING','DISPENSE','ADMINISTER','CLOSE_OUT')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','DONE','SKIPPED','FAILED')),
  assigned_to_actor_id text,
  started_at timestamptz,
  completed_at timestamptz,
  notes text
);

ALTER TABLE public.oros_worksteps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_worksteps" ON public.oros_worksteps FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- D) oros.acknowledgements
-- ============================================================
CREATE TABLE public.oros_acknowledgements (
  ack_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  ack_type text NOT NULL CHECK (ack_type IN ('DEPT','CLINICIAN','CRITICAL')),
  actor_id text NOT NULL,
  ack_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.oros_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_acknowledgements" ON public.oros_acknowledgements FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- E) oros.results
-- ============================================================
CREATE TABLE public.oros_results (
  result_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('LAB','IMAGING','PHARMACY','DOC')),
  summary jsonb DEFAULT '{}'::jsonb,
  zibo_result_codes jsonb DEFAULT '[]'::jsonb,
  doc_ids jsonb DEFAULT '[]'::jsonb,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oros_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_results" ON public.oros_results FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- F) oros.routing
-- ============================================================
CREATE TABLE public.oros_routing (
  route_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  route_target text NOT NULL CHECK (route_target IN ('INTERNAL','LIMS','PACS','PHARMACY','OTHER')),
  adapter_mode text NOT NULL DEFAULT 'NONE' CHECK (adapter_mode IN ('REST','CSV','KAFKA','NONE')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','ACKED','FAILED')),
  last_error text,
  retry_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oros_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_routing" ON public.oros_routing FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- G) oros.sla_timers
-- ============================================================
CREATE TABLE public.oros_sla_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.oros_orders(order_id) ON DELETE CASCADE,
  stage text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  breached boolean NOT NULL DEFAULT false
);

ALTER TABLE public.oros_sla_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_sla_timers" ON public.oros_sla_timers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- H) oros.reconcile_queue
-- ============================================================
CREATE TABLE public.oros_reconcile_queue (
  rec_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  order_id text REFERENCES public.oros_orders(order_id),
  external_key text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','MATCHED','RESOLVED')),
  ops_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oros_reconcile_status ON public.oros_reconcile_queue (status, confidence DESC);

ALTER TABLE public.oros_reconcile_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_reconcile_queue" ON public.oros_reconcile_queue FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- I) oros.event_log
-- ============================================================
CREATE TABLE public.oros_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oros_events_tenant ON public.oros_event_log (tenant_id, created_at DESC);

ALTER TABLE public.oros_event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_event_log" ON public.oros_event_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- J) oros.writeback_intents
-- ============================================================
CREATE TABLE public.oros_writeback_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  target text NOT NULL CHECK (target IN ('BUTANO','PCT')),
  intent_type text NOT NULL CHECK (intent_type IN ('CREATE_SERVICEREQUEST','CREATE_DIAGNOSTICREPORT','CREATE_OBSERVATIONS','CREATE_MEDDISPENSE','PCT_EXPECTED_WORKSTEPS','PCT_RESULT_AVAILABLE')),
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','ACKED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oros_writeback_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on oros_writeback_intents" ON public.oros_writeback_intents FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- K) cap.tenant_facility_capabilities
-- ============================================================
CREATE TABLE public.cap_tenant_facility_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  uses_external_lims boolean NOT NULL DEFAULT false,
  uses_external_pacs boolean NOT NULL DEFAULT false,
  uses_external_pharmacy boolean NOT NULL DEFAULT false,
  hybrid_mode_enabled boolean NOT NULL DEFAULT false,
  adapter_preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, facility_id)
);

ALTER TABLE public.cap_tenant_facility_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on cap_capabilities" ON public.cap_tenant_facility_capabilities FOR ALL USING (true) WITH CHECK (true);
