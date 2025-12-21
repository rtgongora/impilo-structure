-- Create clinical_orders table for storing all types of clinical orders
CREATE TABLE public.clinical_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  order_type TEXT NOT NULL, -- medication, lab, imaging, procedure, consult, nursing
  order_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'routine', -- stat, urgent, routine
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled, discontinued
  details JSONB, -- flexible storage for type-specific details
  instructions TEXT,
  ordered_by UUID,
  ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_clinical_orders_encounter_id ON public.clinical_orders(encounter_id);
CREATE INDEX idx_clinical_orders_patient_id ON public.clinical_orders(patient_id);
CREATE INDEX idx_clinical_orders_status ON public.clinical_orders(status);
CREATE INDEX idx_clinical_orders_order_type ON public.clinical_orders(order_type);

-- Enable Row Level Security
ALTER TABLE public.clinical_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view clinical orders"
ON public.clinical_orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create clinical orders"
ON public.clinical_orders
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update clinical orders"
ON public.clinical_orders
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updating updated_at
CREATE TRIGGER update_clinical_orders_updated_at
BEFORE UPDATE ON public.clinical_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();