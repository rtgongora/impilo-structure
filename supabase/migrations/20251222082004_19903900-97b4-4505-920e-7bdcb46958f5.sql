-- =============================================
-- CLINICAL MESSAGING & PAGING SYSTEM
-- =============================================

-- Clinical Messages (Staff-to-Staff, Staff-to-Patient)
CREATE TABLE public.clinical_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, file, system
  content TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message Channels (Direct, Group, Patient)
CREATE TABLE public.message_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_type TEXT NOT NULL DEFAULT 'direct', -- direct, group, patient, department
  name TEXT,
  description TEXT,
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  department TEXT,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Channel Members
CREATE TABLE public.channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.message_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- admin, member
  is_muted BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clinical Pages (Paging System)
CREATE TABLE public.clinical_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_number TEXT NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  recipient_role TEXT,
  department TEXT,
  priority TEXT NOT NULL DEFAULT 'routine', -- stat, urgent, routine
  page_type TEXT NOT NULL DEFAULT 'callback', -- callback, code, consult, lab, pharmacy
  message TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  callback_number TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, acknowledged, responded, expired, escalated
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  response_notes TEXT,
  escalation_level INTEGER DEFAULT 0,
  escalated_to UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Page Escalation Rules
CREATE TABLE public.page_escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT,
  page_type TEXT,
  priority TEXT NOT NULL,
  escalation_timeout_minutes INTEGER NOT NULL DEFAULT 5,
  escalation_target_role TEXT,
  escalation_target_user UUID,
  max_escalations INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push Notification Subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pages_enabled BOOLEAN DEFAULT true,
  messages_enabled BOOLEAN DEFAULT true,
  alerts_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibrate_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  priority_override BOOLEAN DEFAULT true, -- stat pages bypass quiet hours
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice Call Log
CREATE TABLE public.voice_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  recipient_id UUID,
  recipient_role TEXT,
  call_type TEXT NOT NULL DEFAULT 'audio', -- audio, video
  status TEXT NOT NULL DEFAULT 'initiated', -- initiated, ringing, connected, ended, missed, declined
  patient_id UUID REFERENCES public.patients(id),
  encounter_id UUID REFERENCES public.encounters(id),
  started_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  end_reason TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinical_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinical_messages
CREATE POLICY "Users can view messages in their channels"
ON public.clinical_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members 
    WHERE channel_id = clinical_messages.channel_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their channels"
ON public.clinical_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.channel_members 
    WHERE channel_id = clinical_messages.channel_id 
    AND user_id = auth.uid()
  )
);

-- RLS Policies for message_channels
CREATE POLICY "Users can view their channels"
ON public.message_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members 
    WHERE channel_id = message_channels.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create channels"
ON public.message_channels FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Channel admins can update channels"
ON public.message_channels FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members 
    WHERE channel_id = message_channels.id 
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_members.channel_id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Channel admins can manage members"
ON public.channel_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_members.channel_id 
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  ) OR user_id = auth.uid()
);

-- RLS Policies for clinical_pages
CREATE POLICY "Users can view their received pages"
ON public.clinical_pages FOR SELECT
USING (
  recipient_id = auth.uid() OR sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Staff can send pages"
ON public.clinical_pages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Recipients can acknowledge pages"
ON public.clinical_pages FOR UPDATE
USING (recipient_id = auth.uid() OR escalated_to = auth.uid());

-- RLS for page_escalation_rules
CREATE POLICY "Admins can manage escalation rules"
ON public.page_escalation_rules FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view escalation rules"
ON public.page_escalation_rules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS for push_subscriptions
CREATE POLICY "Users can manage their subscriptions"
ON public.push_subscriptions FOR ALL
USING (user_id = auth.uid());

-- RLS for notification_preferences
CREATE POLICY "Users can manage their preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid());

-- RLS for voice_calls
CREATE POLICY "Users can view their calls"
ON public.voice_calls FOR SELECT
USING (caller_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can create calls"
ON public.voice_calls FOR INSERT
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Call participants can update calls"
ON public.voice_calls FOR UPDATE
USING (caller_id = auth.uid() OR recipient_id = auth.uid());

-- Enable realtime for messaging and paging
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinical_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinical_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_calls;

-- Function to generate page number
CREATE OR REPLACE FUNCTION public.generate_page_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_num INTEGER;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(page_number FROM 11) AS INTEGER)), 0) + 1 
  INTO seq_num
  FROM public.clinical_pages 
  WHERE page_number LIKE 'PG-' || date_part || '-%';
  
  new_number := 'PG-' || date_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate page numbers
CREATE OR REPLACE FUNCTION public.set_page_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.page_number IS NULL OR NEW.page_number = '' THEN
    NEW.page_number := generate_page_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_page_number_trigger
  BEFORE INSERT ON public.clinical_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_page_number();

-- Update channel last_message_at
CREATE OR REPLACE FUNCTION public.update_channel_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.message_channels
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_channel_last_message_trigger
  AFTER INSERT ON public.clinical_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_channel_last_message();