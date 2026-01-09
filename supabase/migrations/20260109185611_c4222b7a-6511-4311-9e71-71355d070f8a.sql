
-- Add missing columns to ref_leave_types
ALTER TABLE public.ref_leave_types ADD COLUMN IF NOT EXISTS max_days_per_year INTEGER;
ALTER TABLE public.ref_leave_types ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;
