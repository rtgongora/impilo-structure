-- Create a function to check if a user has access to a specific patient
-- Access is granted if:
-- 1. User is an admin
-- 2. User has an encounter with the patient (attending physician or created_by)
-- 3. User has created a care plan for the patient
-- 4. User has clinical orders for the patient
-- 5. User has referrals for the patient
CREATE OR REPLACE FUNCTION public.can_access_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin access
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  )
  OR EXISTS (
    -- Provider with active encounter for this patient
    SELECT 1 FROM public.encounters 
    WHERE patient_id = _patient_id 
    AND (attending_physician_id = _user_id OR created_by = _user_id)
  )
  OR EXISTS (
    -- Provider who created a care plan for this patient
    SELECT 1 FROM public.care_plans 
    WHERE patient_id = _patient_id 
    AND created_by = _user_id
  )
  OR EXISTS (
    -- Provider who has clinical orders for this patient
    SELECT 1 FROM public.clinical_orders 
    WHERE patient_id = _patient_id 
    AND ordered_by = _user_id
  )
  OR EXISTS (
    -- Provider who requested or is target of referral for this patient
    SELECT 1 FROM public.referrals 
    WHERE patient_id = _patient_id 
    AND (requested_by = _user_id OR to_provider_id = _user_id OR accepted_by = _user_id)
  )
$$;

-- Create restrictive SELECT policy - only providers with care relationship can view
CREATE POLICY "Providers can view patients they treat"
ON public.patients
FOR SELECT
USING (public.can_access_patient(auth.uid(), id));

-- Update INSERT policy to ensure clinical staff validation
DROP POLICY IF EXISTS "Clinical staff can create patients" ON public.patients;
CREATE POLICY "Clinical staff can register patients"
ON public.patients
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.providers 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Update UPDATE policy to restrict to treating providers and admins
DROP POLICY IF EXISTS "Clinical staff can update patients" ON public.patients;
CREATE POLICY "Treating providers can update patients"
ON public.patients
FOR UPDATE
USING (public.can_access_patient(auth.uid(), id));