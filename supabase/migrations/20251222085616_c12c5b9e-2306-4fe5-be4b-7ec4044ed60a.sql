-- =============================================
-- TIMELINE / SOCIAL FEED
-- =============================================

-- Posts table for timeline content
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  content TEXT,
  post_type TEXT NOT NULL DEFAULT 'standard', -- standard, health_update, milestone, announcement
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}', -- image, video, document
  visibility TEXT NOT NULL DEFAULT 'public', -- public, followers, community, private
  community_id UUID, -- if posted to a community
  is_pinned BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  health_data JSONB, -- for health updates (vitals, milestones, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments on posts
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Likes/reactions on posts
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- like, love, support, celebrate
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Follows system
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- =============================================
-- COMMUNITIES & GROUPS
-- =============================================

-- Communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- general, support, condition, wellness, professional
  cover_image_url TEXT,
  avatar_url TEXT,
  privacy TEXT NOT NULL DEFAULT 'public', -- public, private, invite_only
  is_verified BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  rules JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community membership
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- member, moderator, admin, owner
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  UNIQUE(community_id, user_id)
);

-- Community invites
CREATE TABLE public.community_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invited_user_id UUID,
  invite_code TEXT UNIQUE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- CROWDFUNDING
-- =============================================

-- Campaigns table
CREATE TABLE public.crowdfunding_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  beneficiary_id UUID, -- if different from organizer
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  story TEXT, -- Full story/details
  category TEXT NOT NULL DEFAULT 'medical', -- medical, community, equipment, research, other
  cover_image_url TEXT,
  goal_amount NUMERIC NOT NULL,
  raised_amount NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  donor_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, active, paused, completed, cancelled
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  hospital_facility_id UUID,
  medical_condition TEXT,
  documents JSONB DEFAULT '[]', -- verification documents
  updates JSONB DEFAULT '[]', -- campaign updates
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Donations/Contributions
CREATE TABLE public.campaign_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.crowdfunding_campaigns(id) ON DELETE CASCADE,
  donor_id UUID, -- null for anonymous
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_anonymous BOOLEAN DEFAULT false,
  donor_name TEXT, -- for display
  message TEXT, -- public message
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_reference TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign updates/milestones
CREATE TABLE public.campaign_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.crowdfunding_campaigns(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  update_type TEXT NOT NULL DEFAULT 'update', -- update, milestone, thank_you, completion
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowdfunding_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Posts policies
CREATE POLICY "Users can view public posts" ON public.posts
  FOR SELECT USING (visibility = 'public' OR author_id = auth.uid());

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments" ON public.post_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.post_comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR DELETE USING (author_id = auth.uid());

-- Reactions policies
CREATE POLICY "Users can view reactions" ON public.post_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own reactions" ON public.post_reactions
  FOR ALL USING (user_id = auth.uid());

-- Follows policies
CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own follows" ON public.user_follows
  FOR ALL USING (follower_id = auth.uid());

-- Communities policies
CREATE POLICY "Anyone can view public communities" ON public.communities
  FOR SELECT USING (privacy = 'public' OR EXISTS (
    SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Community owners can update" ON public.communities
  FOR UPDATE USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid() AND role IN ('admin', 'owner')
  ));

-- Community members policies
CREATE POLICY "View community members" ON public.community_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can update members" ON public.community_members
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner')
  ));

-- Community invites policies
CREATE POLICY "View own invites" ON public.community_invites
  FOR SELECT USING (invited_user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Admins can create invites" ON public.community_invites
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM community_members WHERE community_id = community_invites.community_id AND user_id = auth.uid() AND role IN ('admin', 'owner', 'moderator')
  ));

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON public.crowdfunding_campaigns
  FOR SELECT USING (status IN ('active', 'completed') OR organizer_id = auth.uid());

CREATE POLICY "Users can create campaigns" ON public.crowdfunding_campaigns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update campaigns" ON public.crowdfunding_campaigns
  FOR UPDATE USING (organizer_id = auth.uid());

-- Donations policies
CREATE POLICY "View donations" ON public.campaign_donations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can donate" ON public.campaign_donations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR donor_id IS NULL);

-- Campaign updates policies
CREATE POLICY "View campaign updates" ON public.campaign_updates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can post updates" ON public.campaign_updates
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM crowdfunding_campaigns WHERE id = campaign_updates.campaign_id AND organizer_id = auth.uid()
  ));

-- =============================================
-- Enable realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_donations;

-- =============================================
-- Functions for counts
-- =============================================
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_reactions' THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_reactions' THEN
      UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_post_likes_count
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Update campaign raised amount
CREATE OR REPLACE FUNCTION public.update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE crowdfunding_campaigns 
    SET raised_amount = raised_amount + NEW.amount,
        donor_count = donor_count + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_campaign_totals_trigger
AFTER INSERT ON public.campaign_donations
FOR EACH ROW EXECUTE FUNCTION update_campaign_totals();

-- Update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_community_members_trigger
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();