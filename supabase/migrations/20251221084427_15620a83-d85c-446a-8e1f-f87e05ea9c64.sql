-- Create enum for user roles
CREATE TYPE public.clinical_role AS ENUM ('doctor', 'nurse', 'specialist', 'patient', 'admin');

-- Create profiles table for clinical users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role clinical_role NOT NULL DEFAULT 'patient',
  specialty TEXT,
  department TEXT,
  phone TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for role-based access (following security best practices)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role, specialty, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.email),
    COALESCE((new.raw_user_meta_data ->> 'role')::clinical_role, 'patient'),
    new.raw_user_meta_data ->> 'specialty',
    new.raw_user_meta_data ->> 'department'
  );
  
  -- Also assign default 'user' app role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update teleconsult_sessions to use authenticated user references
ALTER TABLE public.teleconsult_sessions 
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Update teleconsult_signals to use authenticated user references  
ALTER TABLE public.teleconsult_signals
  ALTER COLUMN sender_id TYPE UUID USING sender_id::uuid;

-- Update RLS on teleconsult tables for proper security
DROP POLICY IF EXISTS "Allow all operations on teleconsult_sessions" ON public.teleconsult_sessions;
DROP POLICY IF EXISTS "Allow all operations on teleconsult_signals" ON public.teleconsult_signals;

CREATE POLICY "Authenticated users can view teleconsult sessions"
ON public.teleconsult_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create teleconsult sessions"
ON public.teleconsult_sessions
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Session creators can update their sessions"
ON public.teleconsult_sessions
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can view signals"
ON public.teleconsult_signals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send signals"
ON public.teleconsult_signals
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();