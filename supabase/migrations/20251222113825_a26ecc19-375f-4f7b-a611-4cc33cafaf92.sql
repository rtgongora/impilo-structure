-- Drop the overly permissive SELECT policy that exposes all provider data
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;

-- Create a view for public scheduling information (non-sensitive data only)
CREATE OR REPLACE VIEW public.provider_scheduling_info AS
SELECT 
  id,
  full_name,
  specialty,
  department,
  role,
  status,
  is_active,
  facility_gofr_id
FROM public.providers
WHERE is_active = true AND status = 'active';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.provider_scheduling_info TO authenticated;

-- Create restrictive RLS policy: users can only view their own full record
CREATE POLICY "Providers can view own full record" 
ON public.providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for admins to view all provider data (already exists via "Admins can manage providers")
-- So we just need clinical staff access

-- Create policy for clinical staff to view provider basics needed for care coordination
CREATE POLICY "Clinical staff can view providers for care" 
ON public.providers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'moderator')
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('doctor', 'nurse', 'specialist', 'admin')
  )
);