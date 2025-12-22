-- Professional Pages table for individuals and organizations
CREATE TABLE public.professional_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL DEFAULT 'individual' CHECK (page_type IN ('individual', 'organization', 'healthcare_provider')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Business profile fields
  business_category TEXT,
  services TEXT[],
  operating_hours JSONB,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  
  -- Healthcare provider fields
  credentials TEXT[],
  specialties TEXT[],
  license_number TEXT,
  is_verified_provider BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  
  -- Social/marketplace participation
  can_post BOOLEAN DEFAULT true,
  can_sell BOOLEAN DEFAULT true,
  
  -- Stats
  follower_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Page followers
CREATE TABLE public.page_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.professional_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id)
);

-- Page reviews
CREATE TABLE public.page_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.professional_pages(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_visit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clubs table (separate from communities for wellness/fitness focus)
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  club_type TEXT NOT NULL DEFAULT 'health' CHECK (club_type IN ('health', 'wellness', 'fitness', 'nutrition', 'mental_health', 'support', 'other')),
  category TEXT NOT NULL DEFAULT 'general',
  cover_image_url TEXT,
  avatar_url TEXT,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'invite_only')),
  
  -- Activity features
  has_events BOOLEAN DEFAULT true,
  has_challenges BOOLEAN DEFAULT true,
  has_leaderboard BOOLEAN DEFAULT false,
  
  -- Organizer
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_page_id UUID REFERENCES public.professional_pages(id) ON DELETE SET NULL,
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  activity_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  rules JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Club members
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  UNIQUE(club_id, user_id)
);

-- Add page_id to posts for professional page posts
ALTER TABLE public.posts ADD COLUMN page_id UUID REFERENCES public.professional_pages(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.professional_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Professional Pages policies
CREATE POLICY "Anyone can view active pages" ON public.professional_pages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their pages" ON public.professional_pages
  FOR ALL USING (auth.uid() = owner_id);

-- Page Followers policies
CREATE POLICY "Anyone can view followers" ON public.page_followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow/unfollow" ON public.page_followers
  FOR ALL USING (auth.uid() = user_id);

-- Page Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.page_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their reviews" ON public.page_reviews
  FOR ALL USING (auth.uid() = reviewer_id);

-- Clubs policies
CREATE POLICY "Anyone can view public clubs" ON public.clubs
  FOR SELECT USING (privacy = 'public' OR EXISTS (
    SELECT 1 FROM public.club_members WHERE club_id = clubs.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update clubs" ON public.clubs
  FOR UPDATE USING (auth.uid() = created_by);

-- Club Members policies
CREATE POLICY "Anyone can view club members" ON public.club_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join/leave clubs" ON public.club_members
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for follower count
CREATE OR REPLACE FUNCTION public.update_page_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE professional_pages SET follower_count = follower_count + 1 WHERE id = NEW.page_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE professional_pages SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.page_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_page_follower_change
AFTER INSERT OR DELETE ON public.page_followers
FOR EACH ROW EXECUTE FUNCTION public.update_page_follower_count();

-- Triggers for club member count
CREATE OR REPLACE FUNCTION public.update_club_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_club_member_change
AFTER INSERT OR DELETE ON public.club_members
FOR EACH ROW EXECUTE FUNCTION public.update_club_member_count();

-- Update page rating on review changes
CREATE OR REPLACE FUNCTION public.update_page_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE professional_pages
  SET 
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM page_reviews WHERE page_id = COALESCE(NEW.page_id, OLD.page_id)),
    review_count = (SELECT COUNT(*) FROM page_reviews WHERE page_id = COALESCE(NEW.page_id, OLD.page_id))
  WHERE id = COALESCE(NEW.page_id, OLD.page_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_page_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.page_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_page_rating();