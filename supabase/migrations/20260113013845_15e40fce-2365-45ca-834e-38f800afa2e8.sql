-- =============================================
-- IMPILO END-TO-END FINANCIAL BACKBONE
-- Phase 1: Cost Engine (TDABC Model)
-- =============================================

-- ENUMS for Cost Engine
CREATE TYPE public.cost_event_type AS ENUM (
  'encounter_completed',
  'service_completed',
  'bed_day_accrued',
  'consumable_used',
  'procedure_performed',
  'transport_provided',
  'outreach_session'
);

CREATE TYPE public.cost_category AS ENUM (
  'staff_time',
  'consumables',
  'equipment_depreciation',
  'facility_overhead',
  'transport',
  'accommodation',
  'catering',
  'linen_laundry',
  'utilities',
  'cold_chain',
  'per_diem',
  'other'
);

CREATE TYPE public.financial_state AS ENUM (
  'pending',
  'deposit_required',
  'copay_pending',
  'cleared',
  'partial',
  'overdue',
  'exempt',
  'written_off'
);

-- =============================================
-- COST RATES (Reference Data for TDABC)
-- =============================================
CREATE TABLE public.cost_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id),
  category cost_category NOT NULL,
  resource_type TEXT NOT NULL, -- e.g., 'nurse', 'doctor', 'xray_machine', 'bed_ward_a'
  unit_of_measure TEXT NOT NULL, -- 'minute', 'unit', 'day', 'km', 'session'
  cost_per_unit DECIMAL(12,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- COST EVENTS (Raw Cost Recording)
-- =============================================
CREATE TABLE public.cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type cost_event_type NOT NULL,
  visit_id UUID REFERENCES public.visits(id),
  encounter_id UUID REFERENCES public.encounters(id),
  patient_id UUID REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  
  -- Source reference (what triggered this cost)
  source_entity_type TEXT NOT NULL, -- 'encounter', 'order', 'procedure', 'bed_assignment', 'outreach_session'
  source_entity_id UUID NOT NULL,
  
  -- Timing (for TDABC)
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER, -- For time-based costs
  
  -- Cost breakdown (JSON for flexibility)
  cost_breakdown JSONB NOT NULL DEFAULT '[]', -- Array of {category, resource_type, quantity, unit_cost, total_cost}
  total_internal_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Staff attribution
  staff_id UUID,
  staff_role TEXT,
  
  -- Metadata
  is_billable BOOLEAN DEFAULT true, -- Some costs are internal-only
  billing_event_emitted BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- COST SUMMARIES (Aggregated by Visit)
-- =============================================
CREATE TABLE public.visit_cost_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) UNIQUE,
  patient_id UUID REFERENCES public.patients(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Aggregated costs by category
  total_staff_cost DECIMAL(12,4) DEFAULT 0,
  total_consumables_cost DECIMAL(12,4) DEFAULT 0,
  total_equipment_cost DECIMAL(12,4) DEFAULT 0,
  total_overhead_cost DECIMAL(12,4) DEFAULT 0,
  total_accommodation_cost DECIMAL(12,4) DEFAULT 0,
  total_catering_cost DECIMAL(12,4) DEFAULT 0,
  total_transport_cost DECIMAL(12,4) DEFAULT 0,
  total_other_cost DECIMAL(12,4) DEFAULT 0,
  
  grand_total_cost DECIMAL(12,4) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Cost vs Charge analysis
  total_charges DECIMAL(12,4) DEFAULT 0, -- From billing
  cost_to_charge_ratio DECIMAL(6,4),
  margin DECIMAL(12,4),
  
  -- Timestamps
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- BED DAY COSTS (Inpatient Daily Accrual)
-- =============================================
CREATE TABLE public.bed_day_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID REFERENCES public.patients(id),
  bed_id UUID REFERENCES public.beds(id),
  ward_id UUID,
  facility_id UUID REFERENCES public.facilities(id),
  
  accrual_date DATE NOT NULL,
  accrual_sequence INTEGER NOT NULL DEFAULT 1, -- Day 1, 2, 3...
  
  -- Component costs
  accommodation_cost DECIMAL(12,4) DEFAULT 0,
  catering_cost DECIMAL(12,4) DEFAULT 0,
  linen_laundry_cost DECIMAL(12,4) DEFAULT 0,
  cleaning_cost DECIMAL(12,4) DEFAULT 0,
  utilities_cost DECIMAL(12,4) DEFAULT 0,
  nursing_baseline_cost DECIMAL(12,4) DEFAULT 0,
  
  total_bed_day_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Acuity adjustment
  acuity_level TEXT, -- 'standard', 'high_dependency', 'icu'
  acuity_multiplier DECIMAL(4,2) DEFAULT 1.0,
  
  is_billable BOOLEAN DEFAULT true,
  billing_event_emitted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  UNIQUE(visit_id, accrual_date)
);

-- =============================================
-- OUTREACH SESSION COSTS
-- =============================================
CREATE TABLE public.outreach_session_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  session_date DATE NOT NULL,
  facility_id UUID REFERENCES public.facilities(id), -- Virtual/home facility
  
  -- Staff costs
  total_staff_time_minutes INTEGER DEFAULT 0,
  total_staff_cost DECIMAL(12,4) DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  
  -- Transport costs
  distance_km DECIMAL(8,2),
  fuel_cost DECIMAL(12,4) DEFAULT 0,
  vehicle_depreciation DECIMAL(12,4) DEFAULT 0,
  driver_cost DECIMAL(12,4) DEFAULT 0,
  
  -- Other costs
  per_diem_cost DECIMAL(12,4) DEFAULT 0,
  cold_chain_cost DECIMAL(12,4) DEFAULT 0,
  consumables_cost DECIMAL(12,4) DEFAULT 0,
  
  -- Totals
  total_session_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  patients_served INTEGER DEFAULT 0,
  cost_per_patient DECIMAL(12,4),
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Attribution
  programme_code TEXT, -- For donor/programme attribution
  cost_center TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- =============================================
-- TRIGGERS: Auto-update timestamps
-- =============================================
CREATE TRIGGER update_cost_rates_updated_at
  BEFORE UPDATE ON public.cost_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_cost_summaries_updated_at
  BEFORE UPDATE ON public.visit_cost_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTION: Calculate Visit Cost Summary
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_visit_cost_summary(p_visit_id UUID)
RETURNS void AS $$
DECLARE
  v_costs RECORD;
BEGIN
  -- Aggregate costs from cost_events
  SELECT
    COALESCE(SUM(CASE WHEN ce.cost_breakdown::text LIKE '%staff_time%' THEN ce.total_internal_cost ELSE 0 END), 0) as staff,
    COALESCE(SUM(CASE WHEN ce.cost_breakdown::text LIKE '%consumables%' THEN ce.total_internal_cost ELSE 0 END), 0) as consumables,
    COALESCE(SUM(CASE WHEN ce.cost_breakdown::text LIKE '%equipment%' THEN ce.total_internal_cost ELSE 0 END), 0) as equipment,
    COALESCE(SUM(CASE WHEN ce.cost_breakdown::text LIKE '%overhead%' THEN ce.total_internal_cost ELSE 0 END), 0) as overhead,
    COALESCE(SUM(ce.total_internal_cost), 0) as grand_total
  INTO v_costs
  FROM public.cost_events ce
  WHERE ce.visit_id = p_visit_id;

  -- Upsert summary
  INSERT INTO public.visit_cost_summaries (
    visit_id, 
    total_staff_cost, 
    total_consumables_cost,
    total_equipment_cost,
    total_overhead_cost,
    grand_total_cost,
    last_calculated_at
  )
  VALUES (
    p_visit_id,
    v_costs.staff,
    v_costs.consumables,
    v_costs.equipment,
    v_costs.overhead,
    v_costs.grand_total,
    now()
  )
  ON CONFLICT (visit_id) DO UPDATE SET
    total_staff_cost = EXCLUDED.total_staff_cost,
    total_consumables_cost = EXCLUDED.total_consumables_cost,
    total_equipment_cost = EXCLUDED.total_equipment_cost,
    total_overhead_cost = EXCLUDED.total_overhead_cost,
    grand_total_cost = EXCLUDED.grand_total_cost,
    last_calculated_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.cost_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_cost_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_day_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_session_costs ENABLE ROW LEVEL SECURITY;

-- Cost Rates: Admin/Finance can manage
CREATE POLICY "Admin can manage cost rates"
  ON public.cost_rates FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Cost Events: Facility staff can view, system creates
CREATE POLICY "Staff can view cost events for their facility"
  ON public.cost_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert cost events"
  ON public.cost_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Visit Cost Summaries: Read access for authenticated users
CREATE POLICY "Staff can view visit cost summaries"
  ON public.visit_cost_summaries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage visit cost summaries"
  ON public.visit_cost_summaries FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Bed Day Costs
CREATE POLICY "Staff can view bed day costs"
  ON public.bed_day_costs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage bed day costs"
  ON public.bed_day_costs FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Outreach Session Costs
CREATE POLICY "Staff can view outreach costs"
  ON public.outreach_session_costs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage outreach costs"
  ON public.outreach_session_costs FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_cost_rates_facility ON public.cost_rates(facility_id);
CREATE INDEX idx_cost_rates_category ON public.cost_rates(category);
CREATE INDEX idx_cost_rates_active ON public.cost_rates(is_active) WHERE is_active = true;

CREATE INDEX idx_cost_events_visit ON public.cost_events(visit_id);
CREATE INDEX idx_cost_events_encounter ON public.cost_events(encounter_id);
CREATE INDEX idx_cost_events_facility ON public.cost_events(facility_id);
CREATE INDEX idx_cost_events_type ON public.cost_events(event_type);
CREATE INDEX idx_cost_events_timestamp ON public.cost_events(event_timestamp);
CREATE INDEX idx_cost_events_source ON public.cost_events(source_entity_type, source_entity_id);

CREATE INDEX idx_bed_day_costs_visit ON public.bed_day_costs(visit_id);
CREATE INDEX idx_bed_day_costs_date ON public.bed_day_costs(accrual_date);

CREATE INDEX idx_outreach_costs_session ON public.outreach_session_costs(session_id);
CREATE INDEX idx_outreach_costs_date ON public.outreach_session_costs(session_date);