-- Create only missing tables

-- Device/location context memory
CREATE TABLE IF NOT EXISTS public.device_context_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL UNIQUE,
  user_id UUID,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  last_ip_address INET,
  last_gps_lat DECIMAL(10,8),
  last_gps_lng DECIMAL(11,8),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Facility IP ranges
CREATE TABLE IF NOT EXISTS public.facility_ip_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  ip_range_start INET NOT NULL,
  ip_range_end INET NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Facility GPS coordinates
CREATE TABLE IF NOT EXISTS public.facility_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shift coverage delegation
CREATE TABLE IF NOT EXISTS public.shift_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('virtual_panel', 'facility', 'on_call', 'specific_patients')),
  covered_facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  covered_pool_id UUID REFERENCES public.virtual_pools(id) ON DELETE SET NULL,
  covered_by_type TEXT NOT NULL CHECK (covered_by_type IN ('pool', 'colleague', 'auto_route', 'self')),
  covering_provider_id UUID,
  covering_pool_id UUID REFERENCES public.virtual_pools(id) ON DELETE SET NULL,
  allow_critical_breakthrough BOOLEAN DEFAULT true,
  breakthrough_threshold TEXT DEFAULT 'critical',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CPD/CME tracking
CREATE TABLE IF NOT EXISTS public.cpd_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('course', 'workshop', 'conference', 'self_study', 'teaching', 'publication', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  provider_name TEXT,
  points_claimed DECIMAL(5,2) NOT NULL,
  points_approved DECIMAL(5,2),
  activity_date DATE NOT NULL,
  completion_date DATE,
  cpd_cycle_start DATE NOT NULL,
  cpd_cycle_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  certificate_url TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.device_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_ip_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpd_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own device context" ON public.device_context_memory FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admins can manage facility IP ranges" ON public.facility_ip_ranges FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read IP ranges" ON public.facility_ip_ranges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage facility locations" ON public.facility_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read facility locations" ON public.facility_locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own shift coverage" ON public.shift_coverage FOR SELECT USING (provider_id = auth.uid() OR covering_provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own shift coverage" ON public.shift_coverage FOR INSERT WITH CHECK (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own CPD activities" ON public.cpd_activities FOR ALL USING (provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_device_context_fingerprint ON public.device_context_memory(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_facility_ip_ranges_facility ON public.facility_ip_ranges(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_locations_facility ON public.facility_locations(facility_id);
CREATE INDEX IF NOT EXISTS idx_shift_coverage_shift ON public.shift_coverage(shift_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_provider ON public.cpd_activities(provider_id);

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_device_context(p_device_fingerprint TEXT)
RETURNS TABLE (facility_id UUID, facility_name TEXT, workspace_id UUID, workspace_name TEXT, last_used_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT dcm.facility_id, f.name, dcm.workspace_id, w.name, dcm.last_used_at
  FROM public.device_context_memory dcm
  LEFT JOIN public.facilities f ON dcm.facility_id = f.id
  LEFT JOIN public.workspaces w ON dcm.workspace_id = w.id
  WHERE dcm.device_fingerprint = p_device_fingerprint AND dcm.expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.save_device_context(p_fingerprint TEXT, p_user_id UUID, p_facility_id UUID, p_workspace_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.device_context_memory (device_fingerprint, user_id, facility_id, workspace_id, last_used_at, expires_at)
  VALUES (p_fingerprint, p_user_id, p_facility_id, p_workspace_id, now(), now() + INTERVAL '30 days')
  ON CONFLICT (device_fingerprint) DO UPDATE SET user_id = p_user_id, facility_id = p_facility_id, workspace_id = p_workspace_id, last_used_at = now(), expires_at = now() + INTERVAL '30 days'
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cpd_summary(p_user_id UUID)
RETURNS TABLE (cycle_start DATE, cycle_end DATE, points_required DECIMAL, points_earned DECIMAL, points_pending DECIMAL, activities_count INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cpd_cycle_start, cpd_cycle_end, 25.0,
    COALESCE(SUM(CASE WHEN status = 'approved' THEN points_approved ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN points_claimed ELSE 0 END), 0),
    COUNT(*)::INTEGER
  FROM public.cpd_activities WHERE provider_id = p_user_id AND cpd_cycle_end >= CURRENT_DATE
  GROUP BY cpd_cycle_start, cpd_cycle_end ORDER BY cpd_cycle_end DESC LIMIT 1;
$$;