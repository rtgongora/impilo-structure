-- =============================================
-- WELLNESS & LIFESTYLE MODULE - DATABASE SCHEMA
-- Patient-generated wellness data (non-clinical)
-- =============================================

-- Wellness Activity Logs (steps, exercise, movement)
CREATE TABLE public.wellness_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL, -- 'steps', 'walk', 'run', 'cycling', 'gym', 'yoga', 'sports', 'swimming'
  steps INTEGER,
  distance_meters NUMERIC(10, 2),
  duration_minutes INTEGER,
  calories_burned INTEGER,
  active_minutes INTEGER,
  intensity TEXT, -- 'light', 'moderate', 'vigorous'
  source TEXT DEFAULT 'manual', -- 'manual', 'device', 'app'
  device_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wellness Goals (daily/weekly targets)
CREATE TABLE public.wellness_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL, -- 'steps', 'active_minutes', 'water', 'sleep', 'weight', 'exercise_sessions'
  target_value NUMERIC(10, 2) NOT NULL,
  target_unit TEXT NOT NULL, -- 'steps', 'minutes', 'ml', 'hours', 'kg', 'sessions'
  period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wellness Streaks (track consecutive goal achievements)
CREATE TABLE public.wellness_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.wellness_goals(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'steps', 'exercise', 'hydration', 'sleep', 'mood_check'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_achieved_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sleep Tracking
CREATE TABLE public.wellness_sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sleep_date DATE NOT NULL,
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_hours NUMERIC(4, 2),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- 1-5 scale
  naps_count INTEGER DEFAULT 0,
  nap_duration_minutes INTEGER,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nutrition & Hydration Tracking
CREATE TABLE public.wellness_nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIMESTAMPTZ DEFAULT now(),
  meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
  meal_description TEXT,
  photo_url TEXT,
  calories INTEGER,
  water_intake_ml INTEGER,
  dietary_tags TEXT[], -- 'vegetarian', 'low_salt', 'diabetic_friendly', 'high_protein'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wellness Vitals (patient-generated, non-clinical)
CREATE TABLE public.wellness_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vital_type TEXT NOT NULL, -- 'weight', 'blood_pressure', 'heart_rate', 'blood_glucose', 'oxygen_saturation', 'temperature'
  value_numeric NUMERIC(10, 2),
  value_secondary NUMERIC(10, 2), -- For BP diastolic
  unit TEXT NOT NULL,
  context TEXT, -- 'resting', 'post_exercise', 'fasting', 'post_meal'
  source TEXT DEFAULT 'manual',
  device_name TEXT,
  notes TEXT,
  -- Sharing with clinical care
  shared_with_provider BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  promoted_to_clinical BOOLEAN DEFAULT false,
  promoted_at TIMESTAMPTZ,
  promoted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mental Wellbeing & Mood Tracking
CREATE TABLE public.wellness_mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIMESTAMPTZ DEFAULT now(),
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5), -- 1=very low, 5=excellent
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 5),
  mood_tags TEXT[], -- 'happy', 'calm', 'anxious', 'sad', 'motivated', 'tired'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Private Journal Entries
CREATE TABLE public.wellness_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  content TEXT NOT NULL,
  mood_at_writing INTEGER CHECK (mood_at_writing >= 1 AND mood_at_writing <= 5),
  tags TEXT[],
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wellness Communities
CREATE TABLE public.wellness_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'fitness', 'nutrition', 'mental_health', 'chronic_support', 'lifestyle'
  community_type TEXT NOT NULL DEFAULT 'public', -- 'public', 'private', 'moderated'
  cover_image_url TEXT,
  icon_url TEXT,
  rules TEXT,
  member_count INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community Memberships
CREATE TABLE public.wellness_community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.wellness_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- 'member', 'moderator', 'admin'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(community_id, user_id)
);

-- Community Posts
CREATE TABLE public.wellness_community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.wellness_communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT DEFAULT 'discussion', -- 'discussion', 'achievement', 'question', 'tip', 'motivation'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wellness Challenges
CREATE TABLE public.wellness_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'steps', 'exercise', 'hydration', 'sleep', 'mindfulness', 'custom'
  target_metric TEXT NOT NULL, -- 'total_steps', 'total_minutes', 'days_completed', 'streak'
  target_value NUMERIC(12, 2) NOT NULL,
  target_unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  rules TEXT,
  prizes TEXT,
  community_id UUID REFERENCES public.wellness_communities(id),
  is_public BOOLEAN DEFAULT true,
  has_leaderboard BOOLEAN DEFAULT true,
  max_participants INTEGER,
  participant_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Challenge Participants
CREATE TABLE public.wellness_challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.wellness_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress_value NUMERIC(12, 2) DEFAULT 0,
  rank INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Wellness Events
CREATE TABLE public.wellness_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'class', 'workshop', 'webinar', 'meetup', 'race', 'retreat'
  category TEXT NOT NULL, -- 'fitness', 'yoga', 'nutrition', 'mental_health', 'general'
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  cover_image_url TEXT,
  host_name TEXT,
  host_id UUID,
  community_id UUID REFERENCES public.wellness_communities(id),
  registration_deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event Registrations
CREATE TABLE public.wellness_event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.wellness_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registration_status TEXT DEFAULT 'registered', -- 'registered', 'attended', 'cancelled', 'no_show'
  payment_status TEXT, -- 'pending', 'paid', 'refunded'
  payment_reference TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- Wellness Marketplace (Non-clinical services)
CREATE TABLE public.wellness_marketplace_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL, -- User or vendor who provides this service
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'individual', 'business', 'facility'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'fitness_coaching', 'nutrition_coaching', 'mental_wellness', 'yoga', 'personal_training', 'wellness_retreat'
  service_type TEXT NOT NULL, -- 'session', 'package', 'subscription', 'event'
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  duration_minutes INTEGER,
  is_virtual BOOLEAN DEFAULT false,
  location TEXT,
  availability_schedule JSONB, -- Booking availability
  images TEXT[],
  rating NUMERIC(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketplace Bookings
CREATE TABLE public.wellness_service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.wellness_marketplace_services(id),
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_status TEXT DEFAULT 'pending',
  payment_amount NUMERIC(10, 2),
  payment_reference TEXT,
  notes TEXT,
  provider_notes TEXT,
  rating INTEGER,
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device Integrations
CREATE TABLE public.wellness_device_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL, -- 'fitness_tracker', 'smart_scale', 'bp_monitor', 'glucose_monitor', 'pulse_oximeter'
  device_brand TEXT,
  device_model TEXT,
  device_id TEXT,
  connection_type TEXT, -- 'bluetooth', 'api', 'manual'
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Preventive Health Reminders
CREATE TABLE public.wellness_preventive_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'bp_check', 'glucose_check', 'wellness_checkup', 'immunization', 'screening', 'dental', 'eye_exam'
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  frequency TEXT, -- 'once', 'monthly', 'quarterly', 'annually'
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  snoozed_until DATE,
  is_dismissed BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'system', -- 'system', 'user', 'provider'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wellness_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_marketplace_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_preventive_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user-owned data
CREATE POLICY "Users manage own activity logs" ON public.wellness_activity_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own goals" ON public.wellness_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own streaks" ON public.wellness_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sleep logs" ON public.wellness_sleep_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own nutrition logs" ON public.wellness_nutrition_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own vitals" ON public.wellness_vitals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own mood logs" ON public.wellness_mood_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own journal entries" ON public.wellness_journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own device connections" ON public.wellness_device_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reminders" ON public.wellness_preventive_reminders FOR ALL USING (auth.uid() = user_id);

-- Communities: public viewable, members can interact
CREATE POLICY "Public communities viewable" ON public.wellness_communities FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated create communities" ON public.wellness_communities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins manage communities" ON public.wellness_communities FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "View community memberships" ON public.wellness_community_members FOR SELECT USING (true);
CREATE POLICY "Join communities" ON public.wellness_community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own membership" ON public.wellness_community_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Leave communities" ON public.wellness_community_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "View community posts" ON public.wellness_community_posts FOR SELECT USING (is_hidden = false);
CREATE POLICY "Create posts" ON public.wellness_community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Manage own posts" ON public.wellness_community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own posts" ON public.wellness_community_posts FOR DELETE USING (auth.uid() = author_id);

-- Challenges: public viewable
CREATE POLICY "View public challenges" ON public.wellness_challenges FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Create challenges" ON public.wellness_challenges FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Manage own challenges" ON public.wellness_challenges FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "View challenge participants" ON public.wellness_challenge_participants FOR SELECT USING (true);
CREATE POLICY "Join challenges" ON public.wellness_challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own progress" ON public.wellness_challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- Events: public viewable
CREATE POLICY "View events" ON public.wellness_events FOR SELECT USING (true);
CREATE POLICY "Create events" ON public.wellness_events FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Manage own events" ON public.wellness_events FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "View own registrations" ON public.wellness_event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Register for events" ON public.wellness_event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own registrations" ON public.wellness_event_registrations FOR UPDATE USING (auth.uid() = user_id);

-- Marketplace: public viewable, providers manage own
CREATE POLICY "View active services" ON public.wellness_marketplace_services FOR SELECT USING (is_active = true);
CREATE POLICY "Providers create services" ON public.wellness_marketplace_services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers manage services" ON public.wellness_marketplace_services FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Users view own bookings" ON public.wellness_service_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create bookings" ON public.wellness_service_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update bookings" ON public.wellness_service_bookings FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_wellness_activity_user_date ON public.wellness_activity_logs(user_id, activity_date DESC);
CREATE INDEX idx_wellness_vitals_user_type ON public.wellness_vitals(user_id, vital_type, recorded_at DESC);
CREATE INDEX idx_wellness_mood_user_date ON public.wellness_mood_logs(user_id, log_date DESC);
CREATE INDEX idx_wellness_sleep_user_date ON public.wellness_sleep_logs(user_id, sleep_date DESC);
CREATE INDEX idx_wellness_challenges_status ON public.wellness_challenges(status, start_date);
CREATE INDEX idx_wellness_events_start ON public.wellness_events(start_time, status);
CREATE INDEX idx_wellness_community_category ON public.wellness_communities(category, is_active);