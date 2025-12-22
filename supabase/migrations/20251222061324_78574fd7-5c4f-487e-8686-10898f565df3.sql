-- Prescription/Order fulfillment request status
CREATE TYPE public.fulfillment_status AS ENUM (
  'draft',
  'submitted',
  'bidding',
  'awarded',
  'confirmed',
  'processing',
  'ready',
  'dispatched',
  'delivered',
  'completed',
  'cancelled',
  'expired'
);

-- Fulfillment requests (from prescriptions or orders)
CREATE TABLE public.fulfillment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'prescription', -- prescription, lab_order, supply_order
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  prescription_id UUID REFERENCES public.prescriptions(id),
  requested_by UUID REFERENCES auth.users(id),
  status fulfillment_status DEFAULT 'draft',
  priority TEXT DEFAULT 'routine', -- stat, urgent, routine
  delivery_required BOOLEAN DEFAULT false,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_province TEXT,
  delivery_postal_code TEXT,
  delivery_latitude NUMERIC,
  delivery_longitude NUMERIC,
  preferred_vendor_id UUID REFERENCES public.vendors(id),
  notes TEXT,
  bidding_deadline TIMESTAMPTZ,
  awarded_vendor_id UUID REFERENCES public.vendors(id),
  awarded_at TIMESTAMPTZ,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items in a fulfillment request
CREATE TABLE public.fulfillment_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.fulfillment_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  prescription_item_id UUID REFERENCES public.prescription_items(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'unit',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor bids on fulfillment requests
CREATE TABLE public.vendor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.fulfillment_requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
  can_fulfill_all BOOLEAN DEFAULT true,
  partial_items JSONB, -- items that can be fulfilled if not all
  unit_prices JSONB NOT NULL, -- {item_id: price} for each item
  total_amount NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  estimated_ready_time TIMESTAMPTZ,
  delivery_available BOOLEAN DEFAULT false,
  delivery_fee NUMERIC DEFAULT 0,
  estimated_delivery_time TIMESTAMPTZ,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, vendor_id)
);

-- Fulfillment tracking
CREATE TABLE public.fulfillment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.fulfillment_requests(id) ON DELETE CASCADE,
  status fulfillment_status NOT NULL,
  notes TEXT,
  location TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fulfillment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Fulfillment requests: Staff can create/view, vendors can view awarded
CREATE POLICY "Staff can view fulfillment requests"
ON public.fulfillment_requests FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create fulfillment requests"
ON public.fulfillment_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update fulfillment requests"
ON public.fulfillment_requests FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Fulfillment request items
CREATE POLICY "Staff can view request items"
ON public.fulfillment_request_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage request items"
ON public.fulfillment_request_items FOR ALL
USING (auth.uid() IS NOT NULL);

-- Vendor bids: authenticated users can view
CREATE POLICY "Authenticated can view bids"
ON public.vendor_bids FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can create bids"
ON public.vendor_bids FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage bids"
ON public.vendor_bids FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Fulfillment tracking
CREATE POLICY "Authenticated can view tracking"
ON public.fulfillment_tracking FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can add tracking"
ON public.fulfillment_tracking FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_fulfillment_requests_status ON public.fulfillment_requests(status);
CREATE INDEX idx_fulfillment_requests_patient ON public.fulfillment_requests(patient_id);
CREATE INDEX idx_fulfillment_requests_prescription ON public.fulfillment_requests(prescription_id);
CREATE INDEX idx_vendor_bids_request ON public.vendor_bids(request_id);
CREATE INDEX idx_vendor_bids_vendor ON public.vendor_bids(vendor_id);

-- Triggers
CREATE TRIGGER update_fulfillment_requests_updated_at
BEFORE UPDATE ON public.fulfillment_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate fulfillment request number
CREATE OR REPLACE FUNCTION public.generate_fulfillment_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.fulfillment_requests 
  WHERE request_number LIKE 'FUL-' || date_part || '-%';
  
  new_number := 'FUL-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;