/**
 * Hook to fetch user's registry data from Client and Provider registries
 * Links the authenticated user to their canonical registry records
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderRegistryData {
  id: string;
  upid: string;
  first_name: string;
  surname: string;
  other_names: string | null;
  date_of_birth: string | null;
  sex: string | null;
  national_id: string | null;
  photograph_url: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  cadre: string | null;
  specialty: string | null;
  sub_specialty: string | null;
  languages: string[] | null;
  lifecycle_state: string;
  employee_number: string | null;
  hire_date: string | null;
  classification: string | null;
}

export interface ProviderLicense {
  id: string;
  council_name: string;
  registration_number: string;
  license_category: string;
  status: string;
  issue_date: string;
  expiry_date: string;
}

export interface ProviderAffiliation {
  id: string;
  facility_id: string;
  facility_name: string;
  employment_type: string;
  role: string;
  department: string | null;
  position_title: string | null;
  privileges: string[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_primary: boolean;
}

export interface ClientRegistryData {
  id: string;
  health_id: string;
  given_names: string;
  family_name: string;
  other_names: string | null;
  sex: string;
  date_of_birth: string | null;
  nationality: string | null;
  phone_primary: string | null;
  email: string | null;
  province: string | null;
  district: string | null;
  lifecycle_state: string;
  biometric_enrolled: boolean;
}

export interface ProfileRegistryData {
  provider: ProviderRegistryData | null;
  licenses: ProviderLicense[];
  affiliations: ProviderAffiliation[];
  client: ClientRegistryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfileRegistry(): ProfileRegistryData {
  const { user, profile } = useAuth();
  const [provider, setProvider] = useState<ProviderRegistryData | null>(null);
  const [licenses, setLicenses] = useState<ProviderLicense[]>([]);
  const [affiliations, setAffiliations] = useState<ProviderAffiliation[]>([]);
  const [client, setClient] = useState<ClientRegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistryData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch provider registry data by user_id
      const { data: providerData, error: providerError } = await supabase
        .from('health_providers')
        .select(`
          id,
          upid,
          first_name,
          surname,
          other_names,
          date_of_birth,
          sex,
          national_id,
          photograph_url,
          email,
          phone,
          nationality,
          cadre,
          specialty,
          sub_specialty,
          languages,
          lifecycle_state,
          employee_number,
          hire_date,
          classification
        `)
        .eq('user_id', user.id)
        .eq('is_master_record', true)
        .maybeSingle();

      if (providerError && providerError.code !== 'PGRST116') {
        console.error('Error fetching provider data:', providerError);
      }

      if (providerData) {
        setProvider(providerData as ProviderRegistryData);

        // Fetch licenses for this provider
        const { data: licensesData, error: licensesError } = await supabase
          .from('provider_licenses')
          .select(`
            id,
            council_name,
            registration_number,
            license_category,
            status,
            issue_date,
            expiry_date
          `)
          .eq('provider_id', providerData.id)
          .order('expiry_date', { ascending: false });

        if (!licensesError && licensesData) {
          setLicenses(licensesData as ProviderLicense[]);
        }

        // Fetch affiliations for this provider
        const { data: affiliationsData, error: affiliationsError } = await supabase
          .from('provider_affiliations')
          .select(`
            id,
            facility_id,
            facility_name,
            employment_type,
            role,
            department,
            position_title,
            privileges,
            start_date,
            end_date,
            is_active,
            is_primary
          `)
          .eq('provider_id', providerData.id)
          .eq('is_active', true)
          .order('is_primary', { ascending: false });

        if (!affiliationsError && affiliationsData) {
          setAffiliations(affiliationsData as ProviderAffiliation[]);
        }
      }

      // Fetch client registry data by email match (or biometric hash if available)
      if (user.email) {
        const { data: clientData, error: clientError } = await supabase
          .from('client_registry')
          .select(`
            id,
            health_id,
            given_names,
            family_name,
            other_names,
            sex,
            date_of_birth,
            nationality,
            phone_primary,
            email,
            province,
            district,
            lifecycle_state,
            biometric_enrolled
          `)
          .eq('email', user.email)
          .eq('lifecycle_state', 'active')
          .maybeSingle();

        if (!clientError && clientData) {
          setClient(clientData as ClientRegistryData);
        }
      }

    } catch (err) {
      console.error('Error fetching registry data:', err);
      setError('Failed to load registry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, [user?.id]);

  return {
    provider,
    licenses,
    affiliations,
    client,
    loading,
    error,
    refresh: fetchRegistryData,
  };
}
