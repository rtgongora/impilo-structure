-- =============================================
-- PHASE 1: FOUNDATION TABLES FOR IMPILO ERP
-- =============================================

-- 1. PATIENTS TABLE (Core patient demographics)
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mrn TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  national_id TEXT,
  passport_number TEXT,
  phone_primary TEXT,
  phone_secondary TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Zimbabwe',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
  allergies TEXT[],
  chronic_conditions TEXT[],
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. PATIENT ENCOUNTERS TABLE
CREATE TABLE public.encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_number TEXT NOT NULL UNIQUE,
  encounter_type TEXT NOT NULL CHECK (encounter_type IN ('outpatient', 'inpatient', 'emergency', 'daycase')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred', 'deceased', 'cancelled')),
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  ward TEXT,
  bed TEXT,
  attending_physician_id UUID REFERENCES auth.users(id),
  primary_diagnosis TEXT,
  chief_complaint TEXT,
  triage_category TEXT CHECK (triage_category IN ('resuscitation', 'emergency', 'urgent', 'standard', 'non-urgent')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. STOCK CATEGORIES
CREATE TABLE public.stock_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.stock_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. SUPPLIERS TABLE
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  payment_terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. STOCK ITEMS TABLE (Products/Consumables)
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.stock_categories(id),
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  is_consumable BOOLEAN NOT NULL DEFAULT true,
  is_chargeable BOOLEAN NOT NULL DEFAULT true,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  storage_conditions TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. STOCK LOCATIONS (Wards, Pharmacies, Stores)
CREATE TABLE public.stock_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location_type TEXT NOT NULL CHECK (location_type IN ('main_store', 'pharmacy', 'ward', 'theatre', 'lab', 'radiology')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. STOCK LEVELS (Current inventory per location)
CREATE TABLE public.stock_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.stock_locations(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, location_id, batch_number)
);

-- 8. STOCK MOVEMENTS (Audit trail for all stock transactions)
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.stock_items(id),
  from_location_id UUID REFERENCES public.stock_locations(id),
  to_location_id UUID REFERENCES public.stock_locations(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'return', 'expired', 'damaged')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(12,2),
  batch_number TEXT,
  reference_number TEXT,
  reason TEXT,
  encounter_id UUID REFERENCES public.encounters(id),
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. CHARGE ITEMS (Services and billable items)
CREATE TABLE public.charge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('consultation', 'procedure', 'lab', 'radiology', 'pharmacy', 'nursing', 'room', 'consumable', 'other')),
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_taxable BOOLEAN NOT NULL DEFAULT false,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  stock_item_id UUID REFERENCES public.stock_items(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. ENCOUNTER CHARGES (Charges applied to patient encounters)
CREATE TABLE public.encounter_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  charge_item_id UUID NOT NULL REFERENCES public.charge_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  is_voided BOOLEAN NOT NULL DEFAULT false,
  voided_reason TEXT,
  voided_by UUID REFERENCES auth.users(id),
  charged_by UUID REFERENCES auth.users(id),
  charged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. CONSUMABLE USAGE (Track consumables used per encounter)
CREATE TABLE public.consumable_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  location_id UUID NOT NULL REFERENCES public.stock_locations(id),
  quantity INTEGER NOT NULL,
  batch_number TEXT,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  charge_id UUID REFERENCES public.encounter_charges(id),
  administered_by UUID REFERENCES auth.users(id),
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (clinical staff)
-- Patients: All authenticated users can view, clinical staff can create/update
CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Clinical staff can create patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Clinical staff can update patients" ON public.patients FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Encounters: Similar policies
CREATE POLICY "Authenticated users can view encounters" ON public.encounters FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Clinical staff can create encounters" ON public.encounters FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Clinical staff can update encounters" ON public.encounters FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Stock tables: All authenticated users can view, specific roles can modify
CREATE POLICY "Authenticated users can view stock categories" ON public.stock_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage stock categories" ON public.stock_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view stock items" ON public.stock_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage stock items" ON public.stock_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view stock locations" ON public.stock_locations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage stock locations" ON public.stock_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view stock levels" ON public.stock_levels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update stock levels" ON public.stock_levels FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view stock movements" ON public.stock_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create stock movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Charge items: All can view, admins manage
CREATE POLICY "Authenticated users can view charge items" ON public.charge_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage charge items" ON public.charge_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Encounter charges: Clinical staff can manage
CREATE POLICY "Authenticated users can view encounter charges" ON public.encounter_charges FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create encounter charges" ON public.encounter_charges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update encounter charges" ON public.encounter_charges FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Consumable usage: Clinical staff can manage
CREATE POLICY "Authenticated users can view consumable usage" ON public.consumable_usage FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create consumable usage" ON public.consumable_usage FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_patients_mrn ON public.patients(mrn);
CREATE INDEX idx_patients_name ON public.patients(last_name, first_name);
CREATE INDEX idx_patients_national_id ON public.patients(national_id);
CREATE INDEX idx_encounters_patient ON public.encounters(patient_id);
CREATE INDEX idx_encounters_status ON public.encounters(status);
CREATE INDEX idx_encounters_date ON public.encounters(admission_date);
CREATE INDEX idx_stock_levels_item ON public.stock_levels(item_id);
CREATE INDEX idx_stock_levels_location ON public.stock_levels(location_id);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id);
CREATE INDEX idx_encounter_charges_encounter ON public.encounter_charges(encounter_id);
CREATE INDEX idx_consumable_usage_encounter ON public.consumable_usage(encounter_id);

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON public.stock_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_charge_items_updated_at BEFORE UPDATE ON public.charge_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate MRN
CREATE OR REPLACE FUNCTION public.generate_mrn()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_mrn TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(mrn FROM 10) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.patients 
  WHERE mrn LIKE 'MRN-' || year_part || '-%';
  
  new_mrn := 'MRN-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_mrn;
END;
$$;

-- Function to generate encounter number
CREATE OR REPLACE FUNCTION public.generate_encounter_number()
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
  SELECT COALESCE(MAX(CAST(SUBSTRING(encounter_number FROM 12) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.encounters 
  WHERE encounter_number LIKE 'ENC-' || date_part || '-%';
  
  new_number := 'ENC-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;