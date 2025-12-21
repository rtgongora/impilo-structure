-- Create beds table for bed management
CREATE TABLE public.beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bed_number TEXT NOT NULL,
  ward_id TEXT NOT NULL,
  ward_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  patient_id UUID REFERENCES public.patients(id),
  patient_name TEXT,
  patient_mrn TEXT,
  admission_date TIMESTAMP WITH TIME ZONE,
  diagnosis TEXT,
  attending_physician TEXT,
  acuity_level TEXT,
  reserved_for TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT beds_bed_ward_unique UNIQUE (bed_number, ward_id)
);

-- Enable RLS
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view beds" ON public.beds
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage beds" ON public.beds
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Updated at trigger
CREATE TRIGGER update_beds_updated_at
  BEFORE UPDATE ON public.beds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;

-- Insert initial beds for all wards
INSERT INTO public.beds (bed_number, ward_id, ward_name, status) VALUES
  -- Medical Ward (20 beds)
  ('MED-01', 'medical', 'Medical Ward', 'available'),
  ('MED-02', 'medical', 'Medical Ward', 'available'),
  ('MED-03', 'medical', 'Medical Ward', 'available'),
  ('MED-04', 'medical', 'Medical Ward', 'available'),
  ('MED-05', 'medical', 'Medical Ward', 'available'),
  ('MED-06', 'medical', 'Medical Ward', 'available'),
  ('MED-07', 'medical', 'Medical Ward', 'available'),
  ('MED-08', 'medical', 'Medical Ward', 'available'),
  ('MED-09', 'medical', 'Medical Ward', 'available'),
  ('MED-10', 'medical', 'Medical Ward', 'available'),
  ('MED-11', 'medical', 'Medical Ward', 'available'),
  ('MED-12', 'medical', 'Medical Ward', 'available'),
  ('MED-13', 'medical', 'Medical Ward', 'available'),
  ('MED-14', 'medical', 'Medical Ward', 'available'),
  ('MED-15', 'medical', 'Medical Ward', 'available'),
  ('MED-16', 'medical', 'Medical Ward', 'available'),
  ('MED-17', 'medical', 'Medical Ward', 'available'),
  ('MED-18', 'medical', 'Medical Ward', 'available'),
  ('MED-19', 'medical', 'Medical Ward', 'available'),
  ('MED-20', 'medical', 'Medical Ward', 'available'),
  -- Surgical Ward (16 beds)
  ('SUR-01', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-02', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-03', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-04', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-05', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-06', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-07', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-08', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-09', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-10', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-11', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-12', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-13', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-14', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-15', 'surgical', 'Surgical Ward', 'available'),
  ('SUR-16', 'surgical', 'Surgical Ward', 'available'),
  -- Maternity Ward (12 beds)
  ('MAT-01', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-02', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-03', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-04', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-05', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-06', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-07', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-08', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-09', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-10', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-11', 'maternity', 'Maternity Ward', 'available'),
  ('MAT-12', 'maternity', 'Maternity Ward', 'available'),
  -- Paediatric Ward (10 beds)
  ('PED-01', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-02', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-03', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-04', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-05', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-06', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-07', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-08', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-09', 'paediatric', 'Paediatric Ward', 'available'),
  ('PED-10', 'paediatric', 'Paediatric Ward', 'available'),
  -- ICU (8 beds)
  ('ICU-01', 'icu', 'ICU', 'available'),
  ('ICU-02', 'icu', 'ICU', 'available'),
  ('ICU-03', 'icu', 'ICU', 'available'),
  ('ICU-04', 'icu', 'ICU', 'available'),
  ('ICU-05', 'icu', 'ICU', 'available'),
  ('ICU-06', 'icu', 'ICU', 'available'),
  ('ICU-07', 'icu', 'ICU', 'available'),
  ('ICU-08', 'icu', 'ICU', 'available'),
  -- HDU (6 beds)
  ('HDU-01', 'hdu', 'HDU', 'available'),
  ('HDU-02', 'hdu', 'HDU', 'available'),
  ('HDU-03', 'hdu', 'HDU', 'available'),
  ('HDU-04', 'hdu', 'HDU', 'available'),
  ('HDU-05', 'hdu', 'HDU', 'available'),
  ('HDU-06', 'hdu', 'HDU', 'available');