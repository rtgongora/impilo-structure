// Mock Provider Registry sync hook
// In production, this would integrate with iHRIS/Varapi for real-time provider data
// Currently simulates the registry sync pattern for development

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RegistrySyncStatus {
  lastSyncAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  providerId: string | null;
  affiliationsCount: number;
}

interface UseRegistrySyncReturn {
  syncStatus: RegistrySyncStatus;
  syncProviderData: () => Promise<void>;
  linkToProviderRecord: (providerId: string) => Promise<boolean>;
  isLinked: boolean;
}

/**
 * Mock registry sync hook that simulates Provider Registry (iHRIS/Varapi) integration
 * 
 * In production, this hook would:
 * 1. Query the external Provider Registry API for the user's provider record
 * 2. Fetch current affiliations, licenses, and privileges
 * 3. Sync this data to the local health_providers and provider_affiliations tables
 * 4. Handle credential verification and license status updates
 * 
 * Current implementation queries local tables that simulate registry data.
 */
export function useRegistrySync(): UseRegistrySyncReturn {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<RegistrySyncStatus>({
    lastSyncAt: null,
    syncStatus: 'idle',
    providerId: null,
    affiliationsCount: 0,
  });

  const syncProviderData = useCallback(async () => {
    if (!user) return;

    setSyncStatus(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      // In production: Call external iHRIS/Varapi API
      // Currently: Query local health_providers table (simulated registry)
      
      const { data: provider, error: providerError } = await supabase
        .from('health_providers')
        .select('id, upid, first_name, surname, cadre, lifecycle_state')
        .eq('user_id', user.id)
        .eq('is_master_record', true)
        .single();

      if (providerError || !provider) {
        setSyncStatus({
          lastSyncAt: new Date(),
          syncStatus: 'success',
          providerId: null,
          affiliationsCount: 0,
        });
        return;
      }

      // Fetch affiliations count
      const { count: affiliationsCount } = await supabase
        .from('provider_affiliations')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider.id)
        .eq('is_active', true);

      setSyncStatus({
        lastSyncAt: new Date(),
        syncStatus: 'success',
        providerId: provider.id,
        affiliationsCount: affiliationsCount || 0,
      });

      console.log('[RegistrySync] Synced provider data:', {
        upid: provider.upid,
        name: `${provider.first_name} ${provider.surname}`,
        affiliations: affiliationsCount,
      });

    } catch (error) {
      console.error('[RegistrySync] Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, syncStatus: 'error' }));
      toast.error('Failed to sync with Provider Registry');
    }
  }, [user]);

  /**
   * Link user account to provider record
   * In production: Would trigger biometric verification via eSignet
   * Currently: Updates user_id on health_providers record
   */
  const linkToProviderRecord = useCallback(async (providerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('health_providers')
        .update({
          user_id: user.id,
          user_linked_at: new Date().toISOString(),
        })
        .eq('id', providerId)
        .is('user_id', null); // Only link if not already linked

      if (error) {
        console.error('[RegistrySync] Link failed:', error);
        toast.error('Failed to link account to provider record');
        return false;
      }

      toast.success('Account linked to provider record');
      await syncProviderData();
      return true;

    } catch (error) {
      console.error('[RegistrySync] Link error:', error);
      return false;
    }
  }, [user, syncProviderData]);

  return {
    syncStatus,
    syncProviderData,
    linkToProviderRecord,
    isLinked: syncStatus.providerId !== null,
  };
}
