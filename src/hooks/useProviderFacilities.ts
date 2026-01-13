// Hook to fetch provider's accessible facilities using get_provider_facilities()
// Implements the post-login workplace selection requirement

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderFacility {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  level_of_care: string;
  context_label: string;
  is_primary: boolean;
  is_pic: boolean;
  is_owner: boolean;
  can_access: boolean;
  privileges: string[];
}

interface UseProviderFacilitiesReturn {
  facilities: ProviderFacility[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProviderFacilities(): UseProviderFacilitiesReturn {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<ProviderFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilities = useCallback(async () => {
    if (!user) {
      setFacilities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the get_provider_facilities function
      const { data, error: fetchError } = await supabase.rpc(
        'get_provider_facilities',
        { _user_id: user.id }
      );

      if (fetchError) {
        console.error('Error fetching provider facilities:', fetchError);
        // If function doesn't exist yet, return empty array gracefully
        if (fetchError.code === '42883') {
          setFacilities([]);
          return;
        }
        throw fetchError;
      }

      // Map the response to our interface
      const mappedFacilities: ProviderFacility[] = (data || []).map((f: any) => ({
        facility_id: f.facility_id,
        facility_name: f.facility_name || 'Unknown Facility',
        facility_type: f.facility_type || 'Unknown',
        level_of_care: f.level_of_care || 'Unknown',
        context_label: f.context_label || 'Staff',
        is_primary: f.is_primary || false,
        is_pic: f.is_pic || false,
        is_owner: f.is_owner || false,
        can_access: f.can_access !== false,
        privileges: f.privileges || [],
      }));

      setFacilities(mappedFacilities);
    } catch (err) {
      console.error('Error in useProviderFacilities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    loading,
    error,
    refresh: fetchFacilities,
  };
}
