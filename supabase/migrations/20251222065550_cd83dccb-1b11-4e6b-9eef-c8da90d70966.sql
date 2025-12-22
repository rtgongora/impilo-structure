-- ============================================
-- PHASE 3: SCHEDULING & BOOKING SYSTEM (Additional Tables)
-- ============================================

-- Schedule exceptions (holidays, leave, special hours)
CREATE TABLE IF NOT EXISTS public.schedule_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID,
  exception_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wait list for appointments
CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID,
  preferred_date_from DATE,
  preferred_date_to DATE,
  preferred_time_from TIME,
  preferred_time_to TIME,
  appointment_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theatre/Operating Room management
CREATE TABLE IF NOT EXISTS public.operating_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  location TEXT,
  room_type TEXT DEFAULT 'general',
  equipment TEXT[],
  capacity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theatre bookings
CREATE TABLE IF NOT EXISTS public.theatre_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT NOT NULL,
  operating_room_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  surgeon_id UUID,
  anaesthetist_id UUID,
  procedure_name TEXT NOT NULL,
  procedure_code TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled',
  priority TEXT DEFAULT 'elective',
  pre_op_completed BOOLEAN DEFAULT false,
  consent_signed BOOLEAN DEFAULT false,
  equipment_needed TEXT[],
  special_requirements TEXT,
  notes TEXT,
  cancelled_reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Theatre team assignments
CREATE TABLE IF NOT EXISTS public.theatre_team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  staff_id UUID,
  staff_name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment reservations
CREATE TABLE IF NOT EXISTS public.equipment_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  equipment_id TEXT,
  reserved_for TEXT NOT NULL,
  reference_id UUID NOT NULL,
  reserved_from TIMESTAMP WITH TIME ZONE NOT NULL,
  reserved_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reserved_by UUID,
  status TEXT DEFAULT 'reserved',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider noticeboard/announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  target_departments TEXT[],
  target_roles TEXT[],
  published_by UUID,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN DEFAULT false,
  requires_acknowledgment BOOLEAN DEFAULT false,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcement acknowledgments
CREATE TABLE IF NOT EXISTS public.announcement_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff rosters/shifts
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  department TEXT,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  role TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  room_id TEXT,
  purpose TEXT NOT NULL,
  booked_by UUID,
  booked_by_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees TEXT[],
  equipment_needed TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  recurring_pattern JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leave/time-off requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_day_start BOOLEAN DEFAULT false,
  half_day_end BOOLEAN DEFAULT false,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- On-call schedules
CREATE TABLE IF NOT EXISTS public.on_call_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  department TEXT NOT NULL,
  specialty TEXT,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '00:00',
  end_time TIME NOT NULL DEFAULT '23:59',
  contact_number TEXT,
  backup_staff_id UUID,
  backup_staff_name TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatre_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatre_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_call_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view schedule exceptions" ON public.schedule_exceptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage schedule exceptions" ON public.schedule_exceptions FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view waitlist" ON public.appointment_waitlist FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage waitlist" ON public.appointment_waitlist FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view operating rooms" ON public.operating_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage operating rooms" ON public.operating_rooms FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view theatre bookings" ON public.theatre_bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage theatre bookings" ON public.theatre_bookings FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view team assignments" ON public.theatre_team_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage team assignments" ON public.theatre_team_assignments FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view equipment reservations" ON public.equipment_reservations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage equipment reservations" ON public.equipment_reservations FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own acknowledgments" ON public.announcement_acknowledgments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can acknowledge" ON public.announcement_acknowledgments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view shifts" ON public.staff_shifts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage shifts" ON public.staff_shifts FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view room bookings" ON public.room_bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage room bookings" ON public.room_bookings FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage leave requests" ON public.leave_requests FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view on-call schedules" ON public.on_call_schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage on-call schedules" ON public.on_call_schedules FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON public.schedule_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_appointment_waitlist_status ON public.appointment_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_theatre_bookings_date ON public.theatre_bookings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON public.staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_time ON public.room_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_on_call_schedules_date ON public.on_call_schedules(schedule_date);

-- Function to generate theatre booking number
CREATE OR REPLACE FUNCTION public.generate_theatre_booking_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 11) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.theatre_bookings 
  WHERE booking_number LIKE 'OR-' || date_part || '-%';
  
  new_number := 'OR-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;