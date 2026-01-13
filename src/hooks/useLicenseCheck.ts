// Hook to check if user is a licensed practitioner
// Implements the license-first authority model for independent/emergency work

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderLicense {
  id: string;
  license_category: string;
  registration_number: string;
  council_name: string;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'pending';
  expiry_date: string;
  cadre?: string;
}

export interface LicenseCheckResult {
  isLicensedPractitioner: boolean;
  hasActiveLicense: boolean;
  primaryLicense: ProviderLicense | null;
  allLicenses: ProviderLicense[];
  providerId: string | null;
  providerName: string | null;
  cadre: string | null;
  canPerformIndependentWork: boolean;
  canPerformEmergencyWork: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cadres that can perform independent clinical work
const INDEPENDENT_WORK_CADRES = [
  'medical_officer',
  'specialist',
  'general_practitioner',
  'dentist',
  'clinical_officer',
  'pharmacist',
  'optometrist',
  'physiotherapist',
  'psychologist',
  'doctor',
];

// All clinical cadres that can respond to emergencies
const EMERGENCY_WORK_CADRES = [
  ...INDEPENDENT_WORK_CADRES,
  'nurse',
  'midwife',
  'paramedic',
  'emergency_medical_technician',
  'registered_nurse',
  'nurse_practitioner',
];

export function useLicenseCheck(): LicenseCheckResult {
  const { user, profile } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [cadre, setCadre] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<ProviderLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenseData = useCallback(async () => {
    if (!user) {
      setLicenses([]);
      setProviderId(null);
      setProviderName(null);
      setCadre(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, check if user has a linked health_providers record
      const { data: providerData, error: providerError } = await supabase
        .from('health_providers')
        .select('id, first_name, other_names, surname, cadre, lifecycle_state')
        .eq('user_id', user.id)
        .eq('is_master_record', true)
        .maybeSingle();

      if (providerError) {
        console.error('Error fetching provider data:', providerError);
        // Don't throw - user might not be a provider
      }

      if (!providerData) {
        // User is not a registered health provider
        setProviderId(null);
        setProviderName(profile?.display_name || null);
        setCadre(null);
        setLicenses([]);
        setLoading(false);
        return;
      }

      setProviderId(providerData.id);
      setProviderName(
        [providerData.first_name, providerData.other_names, providerData.surname]
          .filter(Boolean)
          .join(' ')
      );
      setCadre(providerData.cadre);

      // Fetch licenses for this provider
      const { data: licenseData, error: licenseError } = await supabase
        .from('provider_licenses')
        .select('id, license_category, registration_number, council_name, status, expiry_date')
        .eq('provider_id', providerData.id)
        .order('created_at', { ascending: false });

      if (licenseError) {
        console.error('Error fetching licenses:', licenseError);
        setError('Failed to fetch license data');
        setLicenses([]);
      } else {
        setLicenses(
          (licenseData || []).map((l) => ({
            id: l.id,
            license_category: l.license_category,
            registration_number: l.registration_number,
            council_name: l.council_name,
            status: l.status as ProviderLicense['status'],
            expiry_date: l.expiry_date,
            cadre: providerData.cadre,
          }))
        );
      }
    } catch (err) {
      console.error('Error in useLicenseCheck:', err);
      setError(err instanceof Error ? err.message : 'Failed to check license');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchLicenseData();
  }, [fetchLicenseData]);

  // Check if any license is active and not expired
  const activeLicenses = licenses.filter((l) => {
    if (l.status !== 'active') return false;
    if (l.expiry_date && new Date(l.expiry_date) < new Date()) return false;
    return true;
  });

  const hasActiveLicense = activeLicenses.length > 0;
  const primaryLicense = activeLicenses[0] || null;
  const isLicensedPractitioner = hasActiveLicense && providerId !== null;

  // Check capability for independent work based on cadre
  const normalizedCadre = cadre?.toLowerCase().replace(/[^a-z_]/g, '_') || '';
  const canPerformIndependentWork =
    isLicensedPractitioner && INDEPENDENT_WORK_CADRES.includes(normalizedCadre);
  const canPerformEmergencyWork =
    isLicensedPractitioner && EMERGENCY_WORK_CADRES.includes(normalizedCadre);

  return {
    isLicensedPractitioner,
    hasActiveLicense,
    primaryLicense,
    allLicenses: licenses,
    providerId,
    providerName,
    cadre,
    canPerformIndependentWork,
    canPerformEmergencyWork,
    loading,
    error,
    refetch: fetchLicenseData,
  };
}
