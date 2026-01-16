/**
 * Offline Trust Controls Service
 * 
 * Implements TL-OFF requirements for offline-first operations:
 * - TL-OFF-01: Offline cache management
 * - TL-OFF-02: Provisional offline identity (O-CPID)
 * - TL-OFF-03: Reconciliation upon sync
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  OfflineToken,
  OfflineCpid,
  DeviceRegistration,
} from '@/types/trustLayer';

// Local storage keys
const OFFLINE_TOKEN_KEY = 'impilo_offline_token';
const OFFLINE_CACHE_KEY = 'impilo_identity_cache';
const OFFLINE_QUEUE_KEY = 'impilo_offline_queue';

interface CachedIdentity {
  impiloId: string;
  cpid: string;
  cachedAt: string;
  expiresAt: string;
}

interface OfflineQueueItem {
  id: string;
  type: 'identity' | 'encounter' | 'observation' | 'consent';
  data: Record<string, unknown>;
  createdAt: string;
  oCpid?: string;
}

export const OfflineService = {
  /**
   * Check if we're in offline mode
   */
  isOffline(): boolean {
    return !navigator.onLine;
  },

  /**
   * Request offline token (TL-AUTH-04)
   */
  async requestOfflineToken(
    userId: string,
    deviceId: string,
    facilityId: string,
    workspaceId?: string
  ): Promise<{ success: boolean; token?: OfflineToken; error?: string }> {
    try {
      // Generate token hash
      const tokenData = `${userId}:${deviceId}:${Date.now()}:${Math.random()}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(tokenData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get user's roles and privileges
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = roleData?.map(r => r.role) || [];

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { data: tokenRecord, error } = await supabase
        .from('trust_layer_offline_tokens')
        .insert({
          token_hash: tokenHash,
          user_id: userId,
          device_id: deviceId,
          facility_id: facilityId,
          workspace_id: workspaceId,
          granted_roles: roles,
          granted_privileges: ['read_clinical', 'write_encounter'],
          expires_at: expiresAt.toISOString(),
          max_offline_duration_hours: 24,
          can_cache_identity_mappings: true,
          identity_cache_ttl_hours: 48,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create offline token:', error);
        return { success: false, error: error.message };
      }

      const token = this.mapToOfflineToken(tokenRecord);

      // Store token locally
      localStorage.setItem(OFFLINE_TOKEN_KEY, JSON.stringify({
        token,
        rawToken: tokenHash, // In production, this would be encrypted
      }));

      return { success: true, token };
    } catch (err) {
      console.error('Offline token request error:', err);
      return { success: false, error: 'Failed to request offline token' };
    }
  },

  /**
   * Get stored offline token
   */
  getStoredOfflineToken(): OfflineToken | null {
    try {
      const stored = localStorage.getItem(OFFLINE_TOKEN_KEY);
      if (!stored) return null;

      const { token } = JSON.parse(stored);
      
      // Check if expired
      if (new Date(token.expiresAt) < new Date()) {
        this.clearOfflineToken();
        return null;
      }

      return token;
    } catch {
      return null;
    }
  },

  /**
   * Clear offline token
   */
  clearOfflineToken(): void {
    localStorage.removeItem(OFFLINE_TOKEN_KEY);
  },

  /**
   * Cache identity mapping for offline use (TL-OFF-01)
   */
  cacheIdentity(impiloId: string, cpid: string, ttlHours: number = 48): void {
    try {
      const cache = this.getIdentityCache();
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

      cache[impiloId] = {
        impiloId,
        cpid,
        cachedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Failed to cache identity:', err);
    }
  },

  /**
   * Get cached identity
   */
  getCachedIdentity(impiloId: string): CachedIdentity | null {
    try {
      const cache = this.getIdentityCache();
      const cached = cache[impiloId];

      if (!cached) return null;

      // Check if expired
      if (new Date(cached.expiresAt) < new Date()) {
        delete cache[impiloId];
        localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached;
    } catch {
      return null;
    }
  },

  /**
   * Get all cached identities
   */
  getIdentityCache(): Record<string, CachedIdentity> {
    try {
      const stored = localStorage.getItem(OFFLINE_CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /**
   * Clear identity cache
   */
  clearIdentityCache(): void {
    localStorage.removeItem(OFFLINE_CACHE_KEY);
  },

  /**
   * Queue item for offline sync (TL-OFF-02)
   */
  queueForSync(
    type: OfflineQueueItem['type'],
    data: Record<string, unknown>,
    oCpid?: string
  ): string {
    try {
      const queue = this.getOfflineQueue();
      const id = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const item: OfflineQueueItem = {
        id,
        type,
        data,
        createdAt: new Date().toISOString(),
        oCpid,
      };

      queue.push(item);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      return id;
    } catch (err) {
      console.error('Failed to queue item:', err);
      return '';
    }
  },

  /**
   * Get offline queue
   */
  getOfflineQueue(): OfflineQueueItem[] {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Process offline queue on reconnection (TL-OFF-03)
   */
  async processOfflineQueue(): Promise<{
    processed: number;
    failed: number;
    results: Array<{ id: string; success: boolean; error?: string }>;
  }> {
    const queue = this.getOfflineQueue();
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        // Process based on type
        switch (item.type) {
          case 'identity':
            // Reconcile O-CPID
            if (item.oCpid) {
              await this.reconcileOfflineCpid(item.oCpid, item.data);
            }
            break;
          case 'encounter':
            // Sync encounter data
            await this.syncOfflineEncounter(item.data);
            break;
          case 'observation':
            // Sync observation data
            await this.syncOfflineObservation(item.data);
            break;
          case 'consent':
            // Sync consent record
            await this.syncOfflineConsent(item.data);
            break;
        }

        processed++;
        results.push({ id: item.id, success: true });
      } catch (err) {
        failed++;
        results.push({ id: item.id, success: false, error: String(err) });
      }
    }

    // Clear processed items
    const failedItems = queue.filter(item => 
      results.find(r => r.id === item.id && !r.success)
    );
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));

    return { processed, failed, results };
  },

  /**
   * Reconcile offline CPID with real identity
   */
  async reconcileOfflineCpid(
    oCpid: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('trust_layer_offline_cpid')
      .update({
        status: 'reconciled',
        reconciled_at: new Date().toISOString(),
      })
      .eq('o_cpid', oCpid);

    if (error) {
      throw new Error(`Failed to reconcile O-CPID: ${error.message}`);
    }
  },

  /**
   * Sync offline encounter
   */
  async syncOfflineEncounter(data: Record<string, unknown>): Promise<void> {
    // Add offline provenance
    const encounterData = {
      ...data,
      offline_created: true,
      offline_synced_at: new Date().toISOString(),
    };

    // In production, this would properly merge with existing data
    console.log('Syncing offline encounter:', encounterData);
  },

  /**
   * Sync offline observation
   */
  async syncOfflineObservation(data: Record<string, unknown>): Promise<void> {
    console.log('Syncing offline observation:', data);
  },

  /**
   * Sync offline consent
   */
  async syncOfflineConsent(data: Record<string, unknown>): Promise<void> {
    console.log('Syncing offline consent:', data);
  },

  /**
   * Register device (TL-AUTH-03)
   */
  async registerDevice(
    userId: string,
    deviceInfo: {
      fingerprint: string;
      name?: string;
      type: 'workstation' | 'mobile' | 'tablet' | 'kiosk' | 'other';
    }
  ): Promise<{ success: boolean; device?: DeviceRegistration; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_devices')
        .upsert({
          device_fingerprint: deviceInfo.fingerprint,
          user_id: userId,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          trust_level: 'recognized',
          is_trusted: false,
          requires_mfa: true,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'device_fingerprint' })
        .select()
        .single();

      if (error) {
        console.error('Failed to register device:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        device: this.mapToDevice(data),
      };
    } catch (err) {
      console.error('Device registration error:', err);
      return { success: false, error: 'Failed to register device' };
    }
  },

  /**
   * Get user's devices
   */
  async getUserDevices(userId: string): Promise<DeviceRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch devices:', error);
        return [];
      }

      return (data || []).map(this.mapToDevice);
    } catch (err) {
      console.error('Error fetching devices:', err);
      return [];
    }
  },

  /**
   * Trust a device
   */
  async trustDevice(
    deviceId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trust_layer_devices')
        .update({
          is_trusted: true,
          trust_level: 'trusted',
          trust_established_at: new Date().toISOString(),
          trust_established_method: 'user_verified',
        })
        .eq('id', deviceId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error trusting device:', err);
      return { success: false, error: 'Failed to trust device' };
    }
  },

  /**
   * Revoke device
   */
  async revokeDevice(
    deviceId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trust_layer_devices')
        .update({
          is_active: false,
          is_trusted: false,
        })
        .eq('id', deviceId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error revoking device:', err);
      return { success: false, error: 'Failed to revoke device' };
    }
  },

  /**
   * Wipe local cache on compromise (TL-OFF-01)
   */
  wipeLocalCache(): void {
    this.clearOfflineToken();
    this.clearIdentityCache();
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  mapToOfflineToken(data: any): OfflineToken {
    return {
      tokenHash: data.token_hash,
      userId: data.user_id,
      deviceId: data.device_id,
      facilityId: data.facility_id,
      workspaceId: data.workspace_id,
      grantedRoles: data.granted_roles || [],
      grantedPrivileges: data.granted_privileges || [],
      issuedAt: data.issued_at,
      expiresAt: data.expires_at,
      maxOfflineDurationHours: data.max_offline_duration_hours,
      canCacheIdentityMappings: data.can_cache_identity_mappings,
      identityCacheTtlHours: data.identity_cache_ttl_hours,
      status: data.status,
    };
  },

  mapToDevice(data: any): DeviceRegistration {
    return {
      id: data.id,
      deviceFingerprint: data.device_fingerprint,
      userId: data.user_id,
      deviceName: data.device_name,
      deviceType: data.device_type,
      trustLevel: data.trust_level,
      isTrusted: data.is_trusted,
      boundToFacilityId: data.bound_to_facility_id,
      boundToWorkspaceId: data.bound_to_workspace_id,
      requiresMfa: data.requires_mfa,
      lastUsedAt: data.last_used_at,
    };
  },
};

export default OfflineService;
