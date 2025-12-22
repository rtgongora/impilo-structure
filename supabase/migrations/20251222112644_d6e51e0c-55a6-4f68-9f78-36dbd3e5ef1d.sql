-- Drop the overly permissive SELECT policy that allows any authenticated user to view all patients
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;