-- Create enum for product categories
CREATE TYPE public.product_category_type AS ENUM (
  'pharmaceutical',
  'medical_device',
  'laboratory',
  'consumable',
  'equipment',
  'ppe',
  'diagnostic',
  'nutritional',
  'other'
);

-- Create enum for vendor/product status
CREATE TYPE public.approval_status AS ENUM (
  'pending',
  'approved',
  'suspended',
  'rejected'
);

-- Manufacturers table
CREATE TABLE public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  country TEXT DEFAULT 'South Africa',
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Vendors/Suppliers table (pharmacies, distributors, etc.)
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor_type TEXT NOT NULL DEFAULT 'pharmacy', -- pharmacy, distributor, wholesaler
  registration_number TEXT UNIQUE,
  license_number TEXT,
  license_expiry DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'South Africa',
  latitude NUMERIC,
  longitude NUMERIC,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  operating_hours JSONB, -- e.g., {"mon": "08:00-17:00", ...}
  delivery_available BOOLEAN DEFAULT false,
  delivery_radius_km NUMERIC,
  is_verified BOOLEAN DEFAULT false,
  status approval_status DEFAULT 'pending',
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Product categories for hierarchical organization
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.product_categories(id),
  category_type product_category_type DEFAULT 'other',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_prescription BOOLEAN DEFAULT false,
  is_controlled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Master products catalogue (reference products)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  description TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  manufacturer_id UUID REFERENCES public.manufacturers(id),
  unit_of_measure TEXT DEFAULT 'unit', -- unit, box, bottle, pack
  pack_size INTEGER DEFAULT 1,
  active_ingredients TEXT[],
  strength TEXT,
  dosage_form TEXT,
  route_of_administration TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  is_controlled BOOLEAN DEFAULT false,
  dea_schedule TEXT,
  storage_requirements TEXT,
  shelf_life_months INTEGER,
  image_url TEXT,
  additional_images TEXT[],
  specifications JSONB,
  is_active BOOLEAN DEFAULT true,
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Vendor products (inventory with stock and pricing)
CREATE TABLE public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT, -- vendor's own SKU
  batch_number TEXT,
  expiry_date DATE,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  discount_percent NUMERIC DEFAULT 0,
  wholesale_price NUMERIC,
  wholesale_min_quantity INTEGER,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  lead_time_days INTEGER DEFAULT 0,
  notes TEXT,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, product_id)
);

-- Product reviews
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vendor_id UUID REFERENCES public.vendors(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Manufacturers: Public read for approved, admin manage
CREATE POLICY "Anyone can view approved manufacturers"
ON public.manufacturers FOR SELECT
USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage manufacturers"
ON public.manufacturers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Vendors: Public read for approved, admin manage
CREATE POLICY "Anyone can view approved vendors"
ON public.vendors FOR SELECT
USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vendors"
ON public.vendors FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Product categories: Public read
CREATE POLICY "Anyone can view active categories"
ON public.product_categories FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories"
ON public.product_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Products: Public read for approved, admin manage
CREATE POLICY "Anyone can view approved products"
ON public.products FOR SELECT
USING (status = 'approved' AND is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Vendor products: Public read for available, vendor/admin manage
CREATE POLICY "Anyone can view available vendor products"
ON public.vendor_products FOR SELECT
USING (is_available = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vendor products"
ON public.vendor_products FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Product reviews: Public read approved, authenticated create
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews FOR SELECT
USING (is_approved = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage reviews"
ON public.product_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_manufacturer ON public.products(manufacturer_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_vendor_products_vendor ON public.vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_product ON public.vendor_products(product_id);
CREATE INDEX idx_vendor_products_available ON public.vendor_products(is_available);
CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE INDEX idx_vendors_location ON public.vendors(city, province);

-- Triggers for updated_at
CREATE TRIGGER update_manufacturers_updated_at
BEFORE UPDATE ON public.manufacturers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_products_updated_at
BEFORE UPDATE ON public.vendor_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();