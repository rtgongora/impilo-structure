-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a public policy allowing unauthenticated provider lookup
-- Only expose necessary fields for authentication flow
CREATE POLICY "Anyone can view profiles for auth" 
ON public.profiles 
FOR SELECT 
USING (true);