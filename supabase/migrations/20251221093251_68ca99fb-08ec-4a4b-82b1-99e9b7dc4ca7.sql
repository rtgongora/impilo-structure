-- Add location column to user_sessions table
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS location TEXT;