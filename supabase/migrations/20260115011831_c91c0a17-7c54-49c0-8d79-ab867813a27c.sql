-- Create function to check if user can bypass all restrictions (dev_tester or admin role)
CREATE OR REPLACE FUNCTION public.can_bypass_restrictions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'dev_tester')
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_bypass_restrictions(uuid) TO authenticated;