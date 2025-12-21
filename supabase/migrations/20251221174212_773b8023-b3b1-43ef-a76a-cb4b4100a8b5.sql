-- Add signature_url column to medication_administrations
ALTER TABLE public.medication_administrations 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Add barcode column to medication_orders for verification
ALTER TABLE public.medication_orders
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for signatures bucket
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can view signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'signatures');

-- Enable realtime for shift_handoffs
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_handoffs;