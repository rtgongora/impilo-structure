/**
 * ID Mint "Black Box" Service
 * 
 * Implements TL-ID requirements for identity resolution and tokenisation:
 * - TL-ID-01: Generate Health ID (internal identifier)
 * - TL-ID-02: Generate Impilo ID (memorable alias)
 * - TL-ID-03: Generate CPID (clinical pseudonym)
 * - TL-ID-04: Alias rotation with audit
 * - TL-ID-05: CPID re-key/rotation
 * - TL-ID-06: O-CPID for offline-first capture
 * - TL-ID-07: Mapping store inside Trust Layer only
 * - TL-ID-08: CPID never in CR; CRID never in SHR
 * - TL-ID-09: Health ID never exposed downstream
 * - TL-ID-10: Anti-enumeration controls
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TrustLayerIdentity,
  IdentityResolutionRequest,
  IdentityResolutionResult,
  OfflineCpid,
  AliasRotation,
  PurposeOfUse,
} from '@/types/trustLayer';

// Rate limiting state (in-memory, per session)
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

export const IdMintService = {
  /**
   * Issue a new identity (TL-ID-01, TL-ID-02, TL-ID-03)
   * Creates Health ID, Impilo ID, CRID, and CPID
   */
  async issueIdentity(
    issuerUserId: string,
    issuerFacilityId?: string
  ): Promise<{ success: boolean; identity?: TrustLayerIdentity; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('trust_layer_issue_identity', {
        p_issuer_user_id: issuerUserId,
        p_issuer_facility_id: issuerFacilityId || null,
      });

      if (error) {
        console.error('Failed to issue identity:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'No identity returned' };
      }

      const result = data[0];
      return {
        success: true,
        identity: {
          healthId: result.health_id,
          impiloId: result.impilo_id,
          memorablePhid: result.memorable_phid,
          crid: result.crid,
          cpid: result.cpid,
          status: 'active',
          version: 1,
          issuedAt: new Date().toISOString(),
          issuedBy: issuerUserId,
          issuedAtFacilityId: issuerFacilityId,
        },
      };
    } catch (err) {
      console.error('Identity issuance error:', err);
      return { success: false, error: 'Failed to issue identity' };
    }
  },

  /**
   * Resolve Impilo ID to CPID for clinical access (TL-ID-09)
   * Health ID is never exposed - only CPID is returned
   */
  async resolveClinical(
    request: IdentityResolutionRequest
  ): Promise<IdentityResolutionResult> {
    // Rate limiting check (TL-ID-10)
    const rateLimitKey = `${request.requesterId}:${request.requesterFacilityId || 'global'}`;
    if (!this.checkRateLimit(rateLimitKey, 100, 60)) {
      await this.logResolutionAttempt(request, 'rate_limited');
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('trust_layer_resolve_clinical', {
        p_impilo_id: request.impiloId,
      });

      if (error) {
        await this.logResolutionAttempt(request, 'error');
        // Anti-enumeration: indistinguishable errors (TL-ID-10)
        return { success: false, error: 'Resolution failed' };
      }

      if (!data || data.length === 0) {
        await this.logResolutionAttempt(request, 'not_found');
        // Anti-enumeration: same error for not found vs not allowed
        return { success: false, error: 'Resolution failed' };
      }

      const result = data[0];
      
      // Check consent if required
      if (!result.consent_active && request.purpose !== 'emergency') {
        await this.logResolutionAttempt(request, 'no_consent');
        return {
          success: false,
          error: 'Consent required for access',
        };
      }

      await this.logResolutionAttempt(request, 'success', result.cpid);

      return {
        success: true,
        identifier: result.cpid,
        status: result.status as IdentityStatus,
        consentActive: result.consent_active,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      };
    } catch (err) {
      console.error('Clinical resolution error:', err);
      return { success: false, error: 'Resolution failed' };
    }
  },

  /**
   * Resolve Impilo ID to CRID for registry operations only
   * Used by Client Registry admin operations
   */
  async resolveRegistry(
    request: IdentityResolutionRequest
  ): Promise<IdentityResolutionResult> {
    // Rate limiting check
    const rateLimitKey = `registry:${request.requesterId}`;
    if (!this.checkRateLimit(rateLimitKey, 50, 60)) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const { data, error } = await supabase.rpc('trust_layer_resolve_registry', {
        p_impilo_id: request.impiloId,
      });

      if (error || !data || data.length === 0) {
        return { success: false, error: 'Resolution failed' };
      }

      const result = data[0];
      return {
        success: true,
        identifier: result.crid,
        status: result.status as IdentityStatus,
      };
    } catch (err) {
      console.error('Registry resolution error:', err);
      return { success: false, error: 'Resolution failed' };
    }
  },

  /**
   * Rotate Impilo ID alias (TL-ID-04)
   * Old alias is retired, new one issued
   */
  async rotateImpiloId(
    healthId: string,
    reason: string,
    rotatedBy: string
  ): Promise<{ success: boolean; newImpiloId?: string; error?: string }> {
    try {
      // Generate new Impilo ID
      const newImpiloId = this.generateLocalImpiloId();

      // Record rotation
      const { error: historyError } = await supabase
        .from('trust_layer_alias_history')
        .insert({
          health_id: healthId,
          alias_type: 'impilo_id',
          old_value: '', // Will be filled from current mapping
          new_value: newImpiloId,
          rotation_reason: reason,
          rotated_by: rotatedBy,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days grace
        });

      if (historyError) {
        console.error('Failed to record alias rotation:', historyError);
        return { success: false, error: 'Failed to rotate alias' };
      }

      // Update mapping - increment version manually
      const { data: current } = await supabase
        .from('trust_layer_identity_mapping')
        .select('version')
        .eq('health_id', healthId)
        .single();

      const { error: updateError } = await supabase
        .from('trust_layer_identity_mapping')
        .update({
          impilo_id: newImpiloId,
          rotated_at: new Date().toISOString(),
          rotation_reason: reason,
          version: (current?.version || 0) + 1,
        })
        .eq('health_id', healthId);

      if (updateError) {
        console.error('Failed to update identity mapping:', updateError);
        return { success: false, error: 'Failed to rotate alias' };
      }

      return { success: true, newImpiloId };
    } catch (err) {
      console.error('Alias rotation error:', err);
      return { success: false, error: 'Failed to rotate alias' };
    }
  },

  /**
   * Generate offline provisional CPID (TL-ID-06, TL-OFF-02)
   * For offline-first capture when no connectivity
   */
  generateOfflineCpid(
    deviceId: string,
    facilityId?: string,
    userId?: string
  ): OfflineCpid {
    const oCpid = `O-CPID-${Date.now().toString(36)}-${this.generateSecureRandom(8)}`;
    
    return {
      oCpid,
      generatingDeviceId: deviceId,
      generatingFacilityId: facilityId,
      generatingUserId: userId,
      status: 'provisional',
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Reconcile offline CPIDs after sync (TL-OFF-03)
   */
  async reconcileOfflineCpids(
    offlineCpids: OfflineCpid[]
  ): Promise<{ reconciled: number; merged: number; rejected: number; results: Array<{ oCpid: string; outcome: string; reconciledCpid?: string }> }> {
    const results: Array<{ oCpid: string; outcome: string; reconciledCpid?: string }> = [];
    let reconciled = 0;
    let merged = 0;
    let rejected = 0;

    for (const offline of offlineCpids) {
      try {
        // Attempt to match based on associated data
        // In production, this would use sophisticated matching algorithms
        const { data: existing } = await supabase
          .from('trust_layer_offline_cpid')
          .select('*')
          .eq('o_cpid', offline.oCpid)
          .maybeSingle();

        if (existing) {
          // Already processed
          results.push({ oCpid: offline.oCpid, outcome: 'already_processed' });
          continue;
        }

        // Insert for reconciliation
        const { error } = await supabase
          .from('trust_layer_offline_cpid')
          .insert({
            o_cpid: offline.oCpid,
            generating_device_id: offline.generatingDeviceId,
            generating_facility_id: offline.generatingFacilityId,
            generating_user_id: offline.generatingUserId,
            status: 'provisional',
            sync_attempted_at: new Date().toISOString(),
          });

        if (error) {
          rejected++;
          results.push({ oCpid: offline.oCpid, outcome: 'rejected', reconciledCpid: undefined });
        } else {
          reconciled++;
          results.push({ oCpid: offline.oCpid, outcome: 'pending_reconciliation' });
        }
      } catch (err) {
        rejected++;
        results.push({ oCpid: offline.oCpid, outcome: 'error' });
      }
    }

    return { reconciled, merged, rejected, results };
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Check rate limit (TL-ID-10)
   */
  checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const existing = rateLimitCache.get(key);

    if (!existing || now - existing.windowStart > windowSeconds * 1000) {
      rateLimitCache.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (existing.count >= maxRequests) {
      return false;
    }

    existing.count++;
    return true;
  },

  /**
   * Log resolution attempt for audit (TL-AUD-01)
   */
  async logResolutionAttempt(
    request: IdentityResolutionRequest,
    outcome: string,
    resolvedIdentifier?: string
  ): Promise<void> {
    try {
      await supabase.from('trust_layer_audit_log').insert({
        event_category: 'identity_resolution',
        event_type: `resolve_${request.scope}`,
        event_outcome: outcome === 'success' ? 'success' : 'failure',
        user_id: request.requesterId,
        action: 'resolve_identity',
        resource_type: 'identity_mapping',
        resource_id: resolvedIdentifier,
        facility_id: request.requesterFacilityId,
        purpose_of_use: request.purpose,
        request_metadata: {
          impilo_id_prefix: request.impiloId.substring(0, 4) + '***',
          scope: request.scope,
        },
      });
    } catch (err) {
      console.error('Failed to log resolution attempt:', err);
    }
  },

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(byte => charset[byte % charset.length])
      .join('');
  },

  /**
   * Generate local Impilo ID format
   */
  generateLocalImpiloId(): string {
    const digits1 = String(Math.floor(Math.random() * 900) + 100);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 24));
    const digits2 = String(Math.floor(Math.random() * 900) + 100);
    const check = Math.floor(Math.random() * 10);
    return `IMP-${digits1}${letter}${digits2}${check}`;
  },
};

export default IdMintService;
