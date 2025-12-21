-- Add last_active_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient sorting
CREATE INDEX idx_profiles_last_active_at ON public.profiles(last_active_at DESC);