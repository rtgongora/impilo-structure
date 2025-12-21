-- Add 2FA fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN totp_secret text,
ADD COLUMN totp_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN backup_codes text[];

-- Create index for faster lookups
CREATE INDEX idx_profiles_totp_enabled ON public.profiles(totp_enabled) WHERE totp_enabled = true;