-- Create vendor ratings table
CREATE TABLE public.vendor_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  fulfillment_request_id UUID REFERENCES public.fulfillment_requests(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  rated_by UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package deals table
CREATE TABLE public.package_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  original_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  discount_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 THEN ROUND(((original_price - discounted_price) / original_price) * 100, 2) ELSE 0 END
  ) STORED,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  terms_conditions TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package deal items (products included in package)
CREATE TABLE public.package_deal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.package_deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bid notifications table
CREATE TABLE public.bid_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID,
  fulfillment_request_id UUID REFERENCES public.fulfillment_requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'new_request', 'bid_placed', 'bid_awarded', 'bid_rejected', 'request_cancelled'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_ratings
CREATE POLICY "Anyone can view vendor ratings" ON public.vendor_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.vendor_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ratings" ON public.vendor_ratings
  FOR UPDATE USING (auth.uid() = rated_by);

-- RLS policies for package_deals
CREATE POLICY "Anyone can view active package deals" ON public.package_deals
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage package deals" ON public.package_deals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for package_deal_items
CREATE POLICY "Anyone can view package deal items" ON public.package_deal_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage package deal items" ON public.package_deal_items
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for bid_notifications
CREATE POLICY "Users can view their own notifications" ON public.bid_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "System can create notifications" ON public.bid_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.bid_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_vendor_ratings_vendor ON public.vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_rating ON public.vendor_ratings(rating);
CREATE INDEX idx_package_deals_vendor ON public.package_deals(vendor_id);
CREATE INDEX idx_package_deals_active ON public.package_deals(is_active) WHERE is_active = true;
CREATE INDEX idx_bid_notifications_vendor ON public.bid_notifications(vendor_id);
CREATE INDEX idx_bid_notifications_user ON public.bid_notifications(user_id);
CREATE INDEX idx_bid_notifications_unread ON public.bid_notifications(user_id, is_read) WHERE is_read = false;

-- Add average rating column to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create function to update vendor average rating
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.vendor_ratings WHERE vendor_id = NEW.vendor_id),
    total_ratings = (SELECT COUNT(*) FROM public.vendor_ratings WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;

-- Create trigger for rating updates
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vendor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_vendor_rating();

-- Add updated_at triggers
CREATE TRIGGER update_vendor_ratings_updated_at
BEFORE UPDATE ON public.vendor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_deals_updated_at
BEFORE UPDATE ON public.package_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();