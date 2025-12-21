-- Create IP whitelist table
CREATE TABLE public.ip_whitelist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  description text,
  is_range boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on IP address
ALTER TABLE public.ip_whitelist ADD CONSTRAINT ip_whitelist_ip_address_key UNIQUE (ip_address);

-- Enable RLS
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view IP whitelist"
ON public.ip_whitelist
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Admins can insert IP whitelist"
ON public.ip_whitelist
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Admins can update IP whitelist"
ON public.ip_whitelist
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "Admins can delete IP whitelist"
ON public.ip_whitelist
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

-- Add system setting for IP whitelist mode
INSERT INTO public.system_settings (key, value, description)
VALUES ('ip_whitelist_enabled', 'false', 'Enable IP whitelist enforcement for all logins')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_ip_whitelist_updated_at
BEFORE UPDATE ON public.ip_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();