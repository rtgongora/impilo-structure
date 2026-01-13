-- Add queue assignment and follow-up tracking to appointments table
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.queue_definitions(id),
  ADD COLUMN IF NOT EXISTS booking_reference TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS follow_up_reason TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_created_by UUID,
  ADD COLUMN IF NOT EXISTS missed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS queue_item_id UUID REFERENCES public.queue_items(id),
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Create index for queue-appointment lookups
CREATE INDEX IF NOT EXISTS idx_appointments_queue_id ON public.appointments(queue_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_reference ON public.appointments(booking_reference);

-- Add function to auto-flag missed appointments (can be called periodically)
CREATE OR REPLACE FUNCTION public.flag_missed_appointments(hours_threshold INTEGER DEFAULT 2)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE appointments
  SET 
    status = 'no-show',
    missed_at = now(),
    follow_up_needed = TRUE,
    follow_up_reason = 'Missed appointment - auto-flagged after ' || hours_threshold || ' hours'
  WHERE 
    status IN ('scheduled', 'confirmed')
    AND scheduled_start < (now() - (hours_threshold || ' hours')::INTERVAL)
    AND checked_in_at IS NULL;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Add comments
COMMENT ON COLUMN appointments.queue_id IS 'Direct assignment to a specific queue for this appointment';
COMMENT ON COLUMN appointments.booking_reference IS 'Human-readable booking reference for check-in';
COMMENT ON COLUMN appointments.follow_up_needed IS 'Flag set by clinician or auto-flagged for missed appointments';
COMMENT ON COLUMN appointments.checked_in_at IS 'Timestamp when patient checked in for this appointment';
COMMENT ON COLUMN appointments.queue_item_id IS 'Link to queue_item when patient is checked in';