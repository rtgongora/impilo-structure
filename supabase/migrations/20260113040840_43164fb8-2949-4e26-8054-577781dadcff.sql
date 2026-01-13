-- DISCHARGE & DEATH WORKFLOW STATE MACHINE
-- Implements the full state machine for discharge (alive) and death workflows

-- Enum for discharge/death workflow states
CREATE TYPE public.discharge_workflow_state AS ENUM (
  'active',
  'discharge_initiated',
  'clinical_clearance',
  'financial_clearance',
  'admin_approval',
  'closed_discharged',
  'death_declared',
  'certification',
  'financial_reconciliation',
  'closed_deceased',
  'cancelled'
);

-- Enum for discharge decision type
CREATE TYPE public.discharge_decision_type AS ENUM (
  'routine',
  'dama',
  'referral',
  'transfer',
  'absconded',
  'death'
);

-- Enum for clearance types
CREATE TYPE public.clearance_type AS ENUM (
  'clinical',
  'nursing',
  'pharmacy',
  'laboratory',
  'imaging',
  'financial',
  'administrative',
  'records',
  'crvs'
);

-- Enum for clearance status
CREATE TYPE public.clearance_status AS ENUM (
  'pending',
  'in_progress',
  'cleared',
  'blocked',
  'waived',
  'not_applicable'
);

-- Main discharge/death cases table
CREATE TABLE public.discharge_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE DEFAULT 'DCH-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6),
  
  -- Links
  visit_id UUID NOT NULL REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  facility_id UUID REFERENCES public.facilities(id),
  
  -- Workflow state
  workflow_state discharge_workflow_state NOT NULL DEFAULT 'active',
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('discharge', 'death')),
  
  -- Decision details
  decision_type discharge_decision_type,
  decision_reason TEXT,
  decision_datetime TIMESTAMPTZ,
  decision_by UUID,
  
  -- Death-specific fields
  death_datetime TIMESTAMPTZ,
  death_place TEXT,
  preliminary_cause_category TEXT,
  mccd_id UUID REFERENCES public.mccd_records(id),
  verbal_autopsy_id UUID REFERENCES public.verbal_autopsy_records(id),
  death_notification_id UUID REFERENCES public.death_notifications(id),
  is_community_death BOOLEAN DEFAULT false,
  mortuary_transfer_datetime TIMESTAMPTZ,
  mortuary_location TEXT,
  
  -- Discharge-specific fields
  discharge_diagnosis TEXT,
  treatment_summary TEXT,
  follow_up_plan TEXT,
  discharge_instructions TEXT,
  discharge_datetime TIMESTAMPTZ,
  
  -- Financial state
  financial_status TEXT DEFAULT 'pending' CHECK (financial_status IN ('pending', 'cleared', 'exempted', 'deferred', 'written_off', 'waived')),
  total_charges DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  total_waived DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  cost_snapshot_id UUID,
  
  -- Approval tracking
  final_approved_at TIMESTAMPTZ,
  final_approved_by UUID,
  
  -- Documents
  discharge_summary_id UUID,
  death_summary_id UUID,
  
  -- Flags
  is_legal_hold BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  requires_supervisor_override BOOLEAN DEFAULT false,
  supervisor_override_reason TEXT,
  supervisor_override_by UUID,
  supervisor_override_at TIMESTAMPTZ,
  
  -- Patient acknowledgement
  patient_acknowledged BOOLEAN DEFAULT false,
  patient_acknowledged_at TIMESTAMPTZ,
  patient_acknowledged_by TEXT,
  patient_signature_path TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Clearance checklists table
CREATE TABLE public.discharge_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_case_id UUID NOT NULL REFERENCES public.discharge_cases(id) ON DELETE CASCADE,
  
  clearance_type clearance_type NOT NULL,
  status clearance_status NOT NULL DEFAULT 'pending',
  sequence_order INTEGER NOT NULL,
  
  assigned_to UUID,
  assigned_role TEXT,
  
  cleared_by UUID,
  cleared_at TIMESTAMPTZ,
  blocked_reason TEXT,
  waived_by UUID,
  waived_reason TEXT,
  
  checklist_items JSONB DEFAULT '[]',
  completed_items JSONB DEFAULT '[]',
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(discharge_case_id, clearance_type)
);

-- Discharge approval chain
CREATE TABLE public.discharge_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_case_id UUID NOT NULL REFERENCES public.discharge_cases(id) ON DELETE CASCADE,
  
  approval_stage TEXT NOT NULL,
  required_role TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deferred')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  deferred_until TIMESTAMPTZ,
  deferred_reason TEXT,
  
  signature_hash TEXT,
  
  sequence_order INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- State transition log (immutable audit trail)
CREATE TABLE public.discharge_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_case_id UUID NOT NULL REFERENCES public.discharge_cases(id) ON DELETE CASCADE,
  
  from_state discharge_workflow_state,
  to_state discharge_workflow_state NOT NULL,
  
  transition_reason TEXT,
  transitioned_by UUID NOT NULL,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  clearance_snapshot JSONB,
  
  ip_address INET,
  user_agent TEXT
);

-- Death certification workflow (Zimbabwe-specific)
CREATE TABLE public.death_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_case_id UUID NOT NULL REFERENCES public.discharge_cases(id) ON DELETE CASCADE,
  
  certification_type TEXT NOT NULL CHECK (certification_type IN ('facility', 'community')),
  
  -- For facility deaths: medical practitioner only
  certifying_practitioner_id UUID,
  practitioner_name TEXT NOT NULL,
  practitioner_qualification TEXT NOT NULL,
  practitioner_registration_number TEXT,
  
  -- For community deaths: different process
  community_verifier_id UUID,
  community_verifier_name TEXT,
  community_verifier_role TEXT,
  
  certification_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  place_of_certification TEXT,
  
  immediate_cause TEXT,
  underlying_cause TEXT,
  contributing_causes TEXT[],
  manner_of_death TEXT,
  
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  digital_signature TEXT,
  signature_datetime TIMESTAMPTZ,
  
  mccd_record_id UUID REFERENCES public.mccd_records(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial clearance details
CREATE TABLE public.discharge_financial_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_case_id UUID NOT NULL REFERENCES public.discharge_cases(id) ON DELETE CASCADE,
  
  bed_day_charges DECIMAL(12,2) DEFAULT 0,
  procedure_charges DECIMAL(12,2) DEFAULT 0,
  medication_charges DECIMAL(12,2) DEFAULT 0,
  lab_charges DECIMAL(12,2) DEFAULT 0,
  imaging_charges DECIMAL(12,2) DEFAULT 0,
  consumable_charges DECIMAL(12,2) DEFAULT 0,
  catering_charges DECIMAL(12,2) DEFAULT 0,
  utility_charges DECIMAL(12,2) DEFAULT 0,
  special_service_charges DECIMAL(12,2) DEFAULT 0,
  mortuary_charges DECIMAL(12,2) DEFAULT 0,
  other_charges DECIMAL(12,2) DEFAULT 0,
  
  gross_total DECIMAL(12,2) DEFAULT 0,
  exemptions_applied DECIMAL(12,2) DEFAULT 0,
  insurance_covered DECIMAL(12,2) DEFAULT 0,
  sponsor_covered DECIMAL(12,2) DEFAULT 0,
  discounts_applied DECIMAL(12,2) DEFAULT 0,
  net_payable DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  
  resolution_type TEXT CHECK (resolution_type IN ('paid_full', 'paid_partial', 'exempted', 'waived', 'deferred', 'written_off', 'sponsor_guaranteed')),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  
  deferred_until DATE,
  deferred_approved_by UUID,
  payment_plan_id UUID,
  
  write_off_approved_by UUID,
  write_off_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(discharge_case_id)
);

-- Clearance checklist templates
CREATE TABLE public.clearance_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id),
  
  clearance_type clearance_type NOT NULL,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('discharge', 'death', 'both')),
  
  checklist_items JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Approval matrix configuration
CREATE TABLE public.approval_matrix_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id),
  
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('discharge', 'death', 'both')),
  approval_stage TEXT NOT NULL,
  
  required_roles TEXT[] NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  sequence_order INTEGER NOT NULL,
  
  conditions JSONB,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_discharge_cases_visit ON public.discharge_cases(visit_id);
CREATE INDEX idx_discharge_cases_patient ON public.discharge_cases(patient_id);
CREATE INDEX idx_discharge_cases_state ON public.discharge_cases(workflow_state);
CREATE INDEX idx_discharge_cases_type ON public.discharge_cases(workflow_type);
CREATE INDEX idx_discharge_clearances_case ON public.discharge_clearances(discharge_case_id);
CREATE INDEX idx_discharge_approvals_case ON public.discharge_approvals(discharge_case_id);
CREATE INDEX idx_discharge_transitions_case ON public.discharge_state_transitions(discharge_case_id);

-- Enable RLS
ALTER TABLE public.discharge_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_financial_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearance_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_matrix_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Auth users view discharge cases" ON public.discharge_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert discharge cases" ON public.discharge_cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update discharge cases" ON public.discharge_cases FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users view clearances" ON public.discharge_clearances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert clearances" ON public.discharge_clearances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update clearances" ON public.discharge_clearances FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users view approvals" ON public.discharge_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert approvals" ON public.discharge_approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update approvals" ON public.discharge_approvals FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View state transitions" ON public.discharge_state_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert state transitions" ON public.discharge_state_transitions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "View death certifications" ON public.death_certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert death certifications" ON public.death_certifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update death certifications" ON public.death_certifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View financial clearances" ON public.discharge_financial_clearances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert financial clearances" ON public.discharge_financial_clearances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update financial clearances" ON public.discharge_financial_clearances FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View checklist templates" ON public.clearance_checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage checklist templates" ON public.clearance_checklist_templates FOR ALL TO authenticated USING (true);

CREATE POLICY "View approval matrix" ON public.approval_matrix_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage approval matrix" ON public.approval_matrix_config FOR ALL TO authenticated USING (true);

-- Trigger function to create default clearances
CREATE OR REPLACE FUNCTION public.create_discharge_clearances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workflow_type = 'discharge' THEN
    INSERT INTO public.discharge_clearances (discharge_case_id, clearance_type, sequence_order, checklist_items)
    VALUES
      (NEW.id, 'clinical', 1, '[{"id": "1", "label": "Discharge diagnosis completed", "required": true}, {"id": "2", "label": "Treatment summary documented", "required": true}, {"id": "3", "label": "Follow-up plan specified", "required": true}]'),
      (NEW.id, 'nursing', 2, '[{"id": "1", "label": "Vital signs stable", "required": true}, {"id": "2", "label": "Care tasks completed", "required": true}, {"id": "3", "label": "Patient education done", "required": true}]'),
      (NEW.id, 'pharmacy', 3, '[{"id": "1", "label": "Medications reconciled", "required": true}, {"id": "2", "label": "Discharge medications issued", "required": true}]'),
      (NEW.id, 'laboratory', 4, '[{"id": "1", "label": "No pending critical results", "required": true}]'),
      (NEW.id, 'imaging', 5, '[{"id": "1", "label": "No pending imaging", "required": false}]'),
      (NEW.id, 'financial', 6, '[{"id": "1", "label": "All charges captured", "required": true}, {"id": "2", "label": "Bill generated", "required": true}, {"id": "3", "label": "Payment resolved", "required": true}]'),
      (NEW.id, 'administrative', 7, '[{"id": "1", "label": "Documentation complete", "required": true}, {"id": "2", "label": "Discharge summary generated", "required": true}]');
  ELSIF NEW.workflow_type = 'death' THEN
    INSERT INTO public.discharge_clearances (discharge_case_id, clearance_type, sequence_order, checklist_items)
    VALUES
      (NEW.id, 'clinical', 1, '[{"id": "1", "label": "Death declared by authorized clinician", "required": true}, {"id": "2", "label": "Time and place documented", "required": true}]'),
      (NEW.id, 'nursing', 2, '[{"id": "1", "label": "Last observations recorded", "required": true}, {"id": "2", "label": "Devices removed", "required": true}]'),
      (NEW.id, 'financial', 3, '[{"id": "1", "label": "Costs finalized", "required": true}, {"id": "2", "label": "Outstanding balance resolved", "required": true}]'),
      (NEW.id, 'records', 4, '[{"id": "1", "label": "Identity verified", "required": true}, {"id": "2", "label": "Informant details captured", "required": true}]'),
      (NEW.id, 'crvs', 5, '[{"id": "1", "label": "MCCD completed", "required": true}, {"id": "2", "label": "Death notification submitted", "required": true}]'),
      (NEW.id, 'administrative', 6, '[{"id": "1", "label": "Death summary generated", "required": true}]');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_discharge_clearances_trigger
  AFTER INSERT ON public.discharge_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.create_discharge_clearances();

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_discharge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_discharge_cases_ts BEFORE UPDATE ON public.discharge_cases FOR EACH ROW EXECUTE FUNCTION public.update_discharge_timestamp();
CREATE TRIGGER update_discharge_clearances_ts BEFORE UPDATE ON public.discharge_clearances FOR EACH ROW EXECUTE FUNCTION public.update_discharge_timestamp();