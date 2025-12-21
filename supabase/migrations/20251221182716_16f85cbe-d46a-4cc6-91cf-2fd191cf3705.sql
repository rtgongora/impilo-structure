-- Create table for scheduled medication times
CREATE TABLE public.medication_schedule_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_order_id UUID NOT NULL REFERENCES public.medication_orders(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'due', 'administered', 'missed', 'held')),
  administered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_schedule_times ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view medication schedules"
  ON public.medication_schedule_times FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert medication schedules"
  ON public.medication_schedule_times FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update medication schedules"
  ON public.medication_schedule_times FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_med_schedule_order ON public.medication_schedule_times(medication_order_id);
CREATE INDEX idx_med_schedule_date ON public.medication_schedule_times(scheduled_date);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_schedule_times;