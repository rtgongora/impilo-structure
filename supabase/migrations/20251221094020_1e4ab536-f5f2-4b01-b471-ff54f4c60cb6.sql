-- Create login_attempts table to track failed logins
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view all login attempts
CREATE POLICY "Admins can view login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- Anyone can insert login attempts (for tracking before auth)
CREATE POLICY "Anyone can insert login attempts" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (true);

-- Create security_events table for audit trail
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Create account_lockouts table
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Admins can view lockouts
CREATE POLICY "Admins can view account lockouts" 
ON public.account_lockouts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- Admins can delete lockouts (unlock accounts)
CREATE POLICY "Admins can delete account lockouts" 
ON public.account_lockouts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- System can manage lockouts
CREATE POLICY "System can insert lockouts" 
ON public.account_lockouts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update lockouts" 
ON public.account_lockouts 
FOR UPDATE 
USING (true);

-- Add additional system settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
  ('lockout_duration_minutes', '30', 'Duration of account lockout in minutes'),
  ('password_min_length', '8', 'Minimum password length'),
  ('password_require_uppercase', 'true', 'Require uppercase letter in password'),
  ('password_require_lowercase', 'true', 'Require lowercase letter in password'),
  ('password_require_number', 'true', 'Require number in password'),
  ('password_require_special', 'false', 'Require special character in password'),
  ('session_expiry_notification', 'true', 'Send email notification when session expires'),
  ('security_alerts_enabled', 'true', 'Send security alert emails to admins')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts (email, created_at DESC);
CREATE INDEX idx_security_events_created ON public.security_events (created_at DESC);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts (email);