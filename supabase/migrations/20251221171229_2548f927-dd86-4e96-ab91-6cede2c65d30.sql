-- Create shift_handoffs table for storing handoff reports
CREATE TABLE public.shift_handoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outgoing_user_id UUID NOT NULL,
  incoming_user_id UUID,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_time TEXT NOT NULL,
  general_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, completed
  patient_ids UUID[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_shift_handoffs_outgoing_user ON public.shift_handoffs(outgoing_user_id);
CREATE INDEX idx_shift_handoffs_status ON public.shift_handoffs(status);
CREATE INDEX idx_shift_handoffs_shift_date ON public.shift_handoffs(shift_date);

-- Enable Row Level Security
ALTER TABLE public.shift_handoffs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view shift handoffs"
ON public.shift_handoffs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own handoffs"
ON public.shift_handoffs
FOR INSERT
WITH CHECK (auth.uid() = outgoing_user_id);

CREATE POLICY "Users can update their own handoffs"
ON public.shift_handoffs
FOR UPDATE
USING (auth.uid() = outgoing_user_id OR auth.uid() = incoming_user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_shift_handoffs_updated_at
BEFORE UPDATE ON public.shift_handoffs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();