-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view encounters" ON public.encounters;

-- Create restrictive policy: only treating providers, assigned staff, and admins can view encounters
CREATE POLICY "Authorized staff can view encounters" 
ON public.encounters 
FOR SELECT 
USING (
  -- Treating physician can view
  auth.uid() = attending_physician_id
  OR
  -- Staff who created the encounter can view
  auth.uid() = created_by
  OR
  -- Admins can view all
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  -- Clinical staff with active care relationship (via care plans, orders, referrals)
  public.can_access_patient(auth.uid(), patient_id)
);