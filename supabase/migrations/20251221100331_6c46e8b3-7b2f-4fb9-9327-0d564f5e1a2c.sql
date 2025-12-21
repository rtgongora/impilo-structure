-- Add force password reset flag to profiles
ALTER TABLE public.profiles
ADD COLUMN force_password_reset boolean NOT NULL DEFAULT false,
ADD COLUMN password_reset_reason text;

-- Create trusted devices table
CREATE TABLE public.trusted_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  user_agent text,
  ip_address text,
  last_used_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  is_active boolean NOT NULL DEFAULT true
);

-- Add unique constraint
ALTER TABLE public.trusted_devices ADD CONSTRAINT trusted_devices_user_device_key UNIQUE (user_id, device_fingerprint);

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted devices
CREATE POLICY "Users can view their own trusted devices"
ON public.trusted_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can insert their own trusted devices"
ON public.trusted_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own trusted devices
CREATE POLICY "Users can update their own trusted devices"
ON public.trusted_devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete their own trusted devices"
ON public.trusted_devices
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);