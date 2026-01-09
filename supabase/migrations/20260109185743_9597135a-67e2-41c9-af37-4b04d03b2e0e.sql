
-- Add category column to ref_training_types
ALTER TABLE public.ref_training_types ADD COLUMN IF NOT EXISTS category TEXT;
