-- Clinical Documentation Tables

-- Vital signs recordings
CREATE TABLE public.vital_signs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  temperature NUMERIC(4,1),
  temperature_unit TEXT DEFAULT 'C' CHECK (temperature_unit IN ('C', 'F')),
  pulse_rate INTEGER,
  respiratory_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation INTEGER,
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  weight NUMERIC(5,1),
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
  height NUMERIC(5,1),
  height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'in')),
  blood_glucose NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SOAP Notes
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'soap' CHECK (note_type IN ('soap', 'progress', 'procedure', 'consultation', 'discharge', 'admission')),
  author_id UUID,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  content TEXT,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medication Orders
CREATE TABLE public.medication_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  dosage_unit TEXT NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('oral', 'iv', 'im', 'sc', 'topical', 'inhaled', 'rectal', 'sublingual', 'transdermal', 'ophthalmic', 'otic', 'nasal', 'other')),
  frequency TEXT NOT NULL,
  duration TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  indication TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'discontinued', 'cancelled')),
  ordered_by UUID,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  is_prn BOOLEAN DEFAULT false,
  prn_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medication Administrations
CREATE TABLE public.medication_administrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_order_id UUID NOT NULL REFERENCES public.medication_orders(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id),
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  administered_by UUID,
  dosage_given TEXT NOT NULL,
  route_used TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'given' CHECK (status IN ('given', 'held', 'refused', 'missed', 'partial')),
  reason_not_given TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments / Scheduling
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  provider_id UUID,
  encounter_id UUID REFERENCES public.encounters(id),
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('new', 'follow-up', 'procedure', 'consultation', 'teleconsult', 'lab', 'imaging', 'therapy')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled')),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  department TEXT,
  location TEXT,
  room TEXT,
  reason TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  reminder_sent BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider Availability
CREATE TABLE public.provider_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  location TEXT,
  department TEXT,
  slot_duration_minutes INTEGER DEFAULT 30,
  max_appointments INTEGER,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider Time Off
CREATE TABLE public.provider_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_time_off ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vital_signs
CREATE POLICY "Authenticated users can view vital signs" ON public.vital_signs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can insert vital signs" ON public.vital_signs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update vital signs" ON public.vital_signs FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for clinical_notes
CREATE POLICY "Authenticated users can view clinical notes" ON public.clinical_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can insert clinical notes" ON public.clinical_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update clinical notes" ON public.clinical_notes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for medication_orders
CREATE POLICY "Authenticated users can view medication orders" ON public.medication_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can insert medication orders" ON public.medication_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update medication orders" ON public.medication_orders FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for medication_administrations
CREATE POLICY "Authenticated users can view medication administrations" ON public.medication_administrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can insert medication administrations" ON public.medication_administrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for appointments
CREATE POLICY "Authenticated users can view appointments" ON public.appointments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage appointments" ON public.appointments FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for provider_schedules
CREATE POLICY "Authenticated users can view provider schedules" ON public.provider_schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Providers can manage their schedules" ON public.provider_schedules FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for provider_time_off
CREATE POLICY "Authenticated users can view time off" ON public.provider_time_off FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Providers can manage their time off" ON public.provider_time_off FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_vital_signs_encounter ON public.vital_signs(encounter_id);
CREATE INDEX idx_clinical_notes_encounter ON public.clinical_notes(encounter_id);
CREATE INDEX idx_medication_orders_encounter ON public.medication_orders(encounter_id);
CREATE INDEX idx_medication_orders_patient ON public.medication_orders(patient_id);
CREATE INDEX idx_medication_administrations_order ON public.medication_administrations(medication_order_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_start);
CREATE INDEX idx_provider_schedules_provider ON public.provider_schedules(provider_id);

-- Triggers for updated_at
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medication_orders_updated_at BEFORE UPDATE ON public.medication_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();