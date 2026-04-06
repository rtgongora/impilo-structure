// Hook to fetch provider's accessible facilities using get_provider_facilities()
// Implements the post-login workplace selection requirement
// Includes Demo Mode for dev/test accounts with no real facility assignments

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
  is_demo?: boolean; // Flag to indicate demo facility
}

interface UseProviderFacilitiesReturn {
  facilities: ProviderFacility[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isDemoMode: boolean;
}

// Demo facilities for testing purposes
const DEMO_FACILITIES: ProviderFacility[] = [
  {
    facility_id: 'demo-tertiary-001',
    facility_name: 'Parirenyatwa Central Hospital',
    facility_type: 'Central Hospital',
    level_of_care: 'tertiary',
    context_label: 'Clinical Staff',
    is_primary: true,
    is_pic: false,
    is_owner: false,
    can_access: true,
    privileges: ['clinical_read', 'clinical_write', 'order_labs', 'prescribe'],
    is_demo: true,
  },
  {
    facility_id: 'demo-secondary-001',
    facility_name: 'Chitungwiza Provincial Hospital',
    facility_type: 'Provincial Hospital',
    level_of_care: 'secondary',
    context_label: 'Visiting Consultant',
    is_primary: false,
    is_pic: false,
    is_owner: false,
    can_access: true,
    privileges: ['clinical_read', 'clinical_write', 'order_labs'],
    is_demo: true,
  },
  {
    facility_id: 'demo-primary-001',
    facility_name: 'Mbare Polyclinic',
    facility_type: 'Urban Clinic',
    level_of_care: 'primary',
    context_label: 'Clinical Staff',
    is_primary: false,
    is_pic: false,
    is_owner: false,
    can_access: true,
    privileges: ['clinical_read', 'clinical_write'],
    is_demo: true,
  },
  {
    facility_id: 'demo-clinic-001',
    facility_name: 'Greendale Family Practice',
    facility_type: 'Private Practice',
    level_of_care: 'clinic',
    context_label: 'Practice Owner',
    is_primary: false,
    is_pic: true,
    is_owner: true,
    can_access: true,
    privileges: ['clinical_read', 'clinical_write', 'admin', 'billing'],
    is_demo: true,
  },
];

// List of dev/tester emails that can fallback to demo mode
// Demo mode only activates if these users have NO real affiliations
// DISABLED in production environments
const IS_PRODUCTION = typeof window !== 'undefined' && window.location.hostname.endsWith('.lovable.app') && !window.location.hostname.includes('preview');

const DEV_TESTER_EMAILS = IS_PRODUCTION ? [] : [
  'dev@impilo.health',
  'admin@impilo.health',
  'test@impilo.health',
];

export function useProviderFacilities(): UseProviderFacilitiesReturn {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<ProviderFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if user can fallback to demo mode (only for specific test accounts, never in production)
  const isDevTester = !IS_PRODUCTION && user?.email && DEV_TESTER_EMAILS.includes(user.email.toLowerCase());

  const fetchFacilities = useCallback(async () => {
    if (!user) {
      setFacilities([]);
      setLoading(false);
      setIsDemoMode(false);
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
        // If function doesn't exist yet, check for demo mode
        if (fetchError.code === '42883') {
          if (isDevTester) {
            console.log('Demo mode activated: RPC function not found, using demo facilities');
            setFacilities(DEMO_FACILITIES);
            setIsDemoMode(true);
          } else {
            setFacilities([]);
          }
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
        is_demo: false,
      }));

      // If no real facilities found and user is dev/tester, use demo mode
      if (mappedFacilities.length === 0 && isDevTester) {
        console.log('Demo mode activated: No facilities assigned, using demo facilities');
        setFacilities(DEMO_FACILITIES);
        setIsDemoMode(true);
      } else {
        setFacilities(mappedFacilities);
        setIsDemoMode(false);
      }
    } catch (err) {
      console.error('Error in useProviderFacilities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch facilities');
      
      // Fallback to demo mode for dev/testers on error
      if (isDevTester) {
        console.log('Demo mode activated: Error fetching facilities, using demo facilities');
        setFacilities(DEMO_FACILITIES);
        setIsDemoMode(true);
      } else {
        setFacilities([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isDevTester]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    loading,
    error,
    refresh: fetchFacilities,
    isDemoMode,
  };
}
