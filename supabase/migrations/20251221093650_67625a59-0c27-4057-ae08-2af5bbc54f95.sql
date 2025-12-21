-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- Only admins can insert settings
CREATE POLICY "Admins can insert system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- Insert default session timeout setting
INSERT INTO public.system_settings (key, value, description)
VALUES ('session_timeout_minutes', '30', 'Session inactivity timeout in minutes');