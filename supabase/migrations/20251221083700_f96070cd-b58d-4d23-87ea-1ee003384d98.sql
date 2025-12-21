-- Create table for WebRTC signaling
CREATE TABLE public.teleconsult_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'connecting', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create table for signaling messages (SDP offers/answers, ICE candidates)
CREATE TABLE public.teleconsult_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.teleconsult_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate', 'join', 'leave')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teleconsult_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsult_signals ENABLE ROW LEVEL SECURITY;

-- Public policies for now (teleconsult sessions are between authenticated providers)
-- In production, these would be restricted to authenticated users
CREATE POLICY "Allow all operations on teleconsult_sessions"
ON public.teleconsult_sessions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on teleconsult_signals"
ON public.teleconsult_signals
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsult_signals;

-- Create index for faster signal lookups
CREATE INDEX idx_teleconsult_signals_session_id ON public.teleconsult_signals(session_id);
CREATE INDEX idx_teleconsult_sessions_referral_id ON public.teleconsult_sessions(referral_id);