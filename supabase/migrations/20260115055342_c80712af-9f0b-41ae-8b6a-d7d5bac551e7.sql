-- Create table for Landela document notifications (memos, comments, workflow actions)
CREATE TABLE public.landela_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL,
  document_id UUID REFERENCES public.landela_documents(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'memo_assigned', 'comment_added', 'action_required', 'document_shared', 'approval_request', 'deadline_reminder'
  title TEXT NOT NULL,
  message TEXT,
  sender_user_id UUID,
  sender_name TEXT,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for professional email messages
CREATE TABLE public.professional_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder TEXT NOT NULL DEFAULT 'inbox', -- 'inbox', 'sent', 'drafts', 'archive', 'trash'
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  thread_id UUID,
  in_reply_to UUID REFERENCES public.professional_emails(id),
  labels TEXT[] DEFAULT '{}',
  external_message_id TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_landela_notifications_recipient ON public.landela_notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX idx_landela_notifications_document ON public.landela_notifications(document_id);
CREATE INDEX idx_professional_emails_user_folder ON public.professional_emails(user_id, folder, received_at DESC);
CREATE INDEX idx_professional_emails_thread ON public.professional_emails(thread_id);

-- Enable RLS
ALTER TABLE public.landela_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for Landela notifications
CREATE POLICY "Users can view their own notifications"
ON public.landela_notifications
FOR SELECT
USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update their own notifications"
ON public.landela_notifications
FOR UPDATE
USING (auth.uid() = recipient_user_id);

CREATE POLICY "System can insert notifications"
ON public.landela_notifications
FOR INSERT
WITH CHECK (true);

-- RLS policies for professional emails
CREATE POLICY "Users can view their own emails"
ON public.professional_emails
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own emails"
ON public.professional_emails
FOR ALL
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.landela_notifications;

-- Create trigger for email updated_at
CREATE TRIGGER update_professional_emails_updated_at
BEFORE UPDATE ON public.professional_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();