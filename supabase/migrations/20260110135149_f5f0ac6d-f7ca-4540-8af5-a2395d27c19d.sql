-- Client Queue Self-Service & Notifications
-- Note: RLS simplified since patient-to-user linking requires portal setup first

-- 1. Client Queue Notifications table
CREATE TABLE IF NOT EXISTS public.client_queue_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  queue_item_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'appointment_reminder', 'queue_confirmation', 'proceed_to_service', 
    'delay_notice', 'reschedule_notice', 'service_complete', 
    'follow_up_required', 'results_ready', 'queue_position_update'
  )),
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'sms', 'whatsapp', 'email')),
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  acknowledged_at timestamptz,
  response_data jsonb,
  requires_action boolean DEFAULT false,
  action_type text,
  action_deadline timestamptz,
  action_completed_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Remote Queue Requests table (for pre-arrival requests)
CREATE TABLE IF NOT EXISTS public.client_queue_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  queue_id uuid REFERENCES public.queue_definitions(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  requested_date date NOT NULL,
  requested_time_from time,
  requested_time_to time,
  reason_for_visit text,
  priority_requested text DEFAULT 'routine',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'expired', 'cancelled', 'checked_in'
  )),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  queue_item_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  arrival_confirmed_at timestamptz,
  consent_captured boolean DEFAULT false,
  consent_timestamp timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Follow-up Queues table
CREATE TABLE IF NOT EXISTS public.client_follow_up_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  follow_up_type text NOT NULL CHECK (follow_up_type IN (
    'results_ready', 'review_appointment', 'treatment_continuation', 
    'referral_follow_up', 'callback', 'virtual_return'
  )),
  trigger_event text,
  trigger_resource_id uuid,
  scheduled_date date,
  scheduled_time time,
  is_virtual boolean DEFAULT false,
  queue_id uuid REFERENCES public.queue_definitions(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'triggered', 'notified', 'scheduled', 'completed', 'cancelled'
  )),
  notification_sent_at timestamptz,
  client_response text,
  client_response_at timestamptz,
  notes text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_queue_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_queue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_follow_up_queues ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users (staff) can manage queue notifications
CREATE POLICY "Staff can view notifications"
ON public.client_queue_notifications FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create notifications"
ON public.client_queue_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update notifications"
ON public.client_queue_notifications FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for client_queue_requests
CREATE POLICY "Authenticated users can view requests"
ON public.client_queue_requests FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create requests"
ON public.client_queue_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update requests"
ON public.client_queue_requests FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for client_follow_up_queues
CREATE POLICY "Staff can manage follow-ups"
ON public.client_follow_up_queues FOR ALL
USING (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_queue_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_queue_requests;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_queue_notifications_patient ON public.client_queue_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_client_queue_notifications_unread ON public.client_queue_notifications(patient_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_queue_requests_patient ON public.client_queue_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_client_queue_requests_status ON public.client_queue_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_follow_up_queues_patient ON public.client_follow_up_queues(patient_id);
CREATE INDEX IF NOT EXISTS idx_client_follow_up_queues_status ON public.client_follow_up_queues(status);