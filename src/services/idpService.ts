/**
 * Identity Provider (IdP) Service
 * Implements IDP-FR requirements for authentication, authorization, and revocation
 */

import { supabase } from '@/integrations/supabase/client';
import { HPRService } from './hprService';
import type {
  HealthProvider,
  EligibilityResponse,
  IdPRevocationEvent,
  RevocationEventType,
} from '@/types/hpr';

export interface IdPTokenClaims {
  sub: string; // User ID
  provider_id: string; // UPID
  cadre: string;
  roles: string[];
  privileges: string[];
  facility_scope: string[];
  license_expiry: string | null;
  iat: number;
  exp: number;
}

export interface AuthorizationResult {
  authorized: boolean;
  provider: HealthProvider | null;
  eligibility: EligibilityResponse | null;
  claims: Partial<IdPTokenClaims> | null;
  denialReasons: string[];
}

export const IdPService = {
  // ==========================================
  // USER-PROVIDER LINKAGE (IDP-FR-010, IDP-FR-011)
  // ==========================================

  /**
   * Get provider linked to current authenticated user
   */
  async getLinkedProvider(): Promise<HealthProvider | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return HPRService.getProviderByUserId(user.id);
  },

  /**
   * Verify user-provider linkage by national ID match
   */
  async verifyLinkageByNationalId(
    providerId: string,
    nationalId: string
  ): Promise<boolean> {
    const provider = await HPRService.getProvider(providerId);
    if (!provider) return false;

    return provider.national_id === nationalId;
  },

  /**
   * Verify user-provider linkage by council registration
   */
  async verifyLinkageByCouncilRegistration(
    providerId: string,
    councilId: string,
    registrationNumber: string
  ): Promise<boolean> {
    const licenses = await HPRService.getProviderLicenses(providerId);
    
    return licenses.some(
      l => l.council_id === councilId && 
           l.registration_number === registrationNumber &&
           l.status === 'active'
    );
  },

  // ==========================================
  // AUTHORIZATION FLOW (IDP-FR-020)
  // ==========================================

  /**
   * Perform full authorization check for current user
   * Implements the IdP authorization flow:
   * 1. Authenticate user (done by Supabase)
   * 2. Retrieve linked UPID
   * 3. Call HPR Eligibility API
   * 4. Evaluate policy rules
   * 5. Return authorization result
   */
  async authorizeCurrentUser(
    requestedRole?: string,
    requestedPrivileges?: string[],
    facilityContext?: string
  ): Promise<AuthorizationResult> {
    const denialReasons: string[] = [];

    // Step 1: Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        authorized: false,
        provider: null,
        eligibility: null,
        claims: null,
        denialReasons: ['USER_NOT_AUTHENTICATED'],
      };
    }

    // Step 2: Retrieve linked provider (IDP-FR-012)
    const provider = await HPRService.getProviderByUserId(user.id);
    if (!provider) {
      return {
        authorized: false,
        provider: null,
        eligibility: null,
        claims: null,
        denialReasons: ['NO_LINKED_PROVIDER'],
      };
    }

    // Step 3: Call HPR Eligibility API
    const eligibility = await HPRService.checkEligibility(
      provider.id,
      requestedRole,
      requestedPrivileges,
      facilityContext
    );

    // Step 4: Evaluate policy
    if (!eligibility.eligible) {
      return {
        authorized: false,
        provider,
        eligibility,
        claims: null,
        denialReasons: eligibility.reason_codes,
      };
    }

    // Step 5: Build token claims (IDP-FR-021)
    const claims: Partial<IdPTokenClaims> = {
      sub: user.id,
      provider_id: provider.upid,
      cadre: provider.cadre,
      roles: eligibility.roles,
      privileges: eligibility.privileges,
      facility_scope: eligibility.facility_scope,
      license_expiry: eligibility.license_valid_until || null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    return {
      authorized: true,
      provider,
      eligibility,
      claims,
      denialReasons: [],
    };
  },

  /**
   * Check if user can perform a specific action
   */
  async canPerformAction(
    privilege: string,
    facilityId?: string
  ): Promise<boolean> {
    const result = await this.authorizeCurrentUser(
      undefined,
      [privilege],
      facilityId
    );
    return result.authorized;
  },

  // ==========================================
  // ACCESS ENFORCEMENT (IDP-FR-030, IDP-FR-031)
  // ==========================================

  /**
   * Enforce clinical write access requirements
   * Clinical write actions require: active license + valid privilege + current affiliation
   */
  async enforceClinicalWriteAccess(
    requiredPrivilege: string,
    facilityId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const result = await this.authorizeCurrentUser(
      undefined,
      [requiredPrivilege],
      facilityId
    );

    if (!result.authorized) {
      const reason = result.denialReasons.join(', ') || 'Access denied';
      return { allowed: false, reason };
    }

    // Additional checks for clinical write
    if (!result.eligibility?.license_valid_until) {
      return { allowed: false, reason: 'No valid license found' };
    }

    if (!result.eligibility.privileges.includes(requiredPrivilege)) {
      return { allowed: false, reason: `Missing privilege: ${requiredPrivilege}` };
    }

    if (!result.eligibility.facility_scope.includes(facilityId)) {
      return { allowed: false, reason: 'No affiliation with this facility' };
    }

    return { allowed: true };
  },

  // ==========================================
  // REVOCATION EVENTS (IDP-FR-040, IDP-FR-041)
  // ==========================================

  /**
   * Get revocation events for a provider
   */
  async getRevocationEvents(providerId: string): Promise<IdPRevocationEvent[]> {
    const { data, error } = await supabase
      .from('idp_revocation_events')
      .select('*')
      .eq('provider_id', providerId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as IdPRevocationEvent[];
  },

  /**
   * Get unprocessed revocation events
   */
  async getUnprocessedRevocationEvents(): Promise<IdPRevocationEvent[]> {
    const { data, error } = await supabase
      .from('idp_revocation_events')
      .select('*')
      .is('processed_at', null)
      .order('triggered_at', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as IdPRevocationEvent[];
  },

  /**
   * Process a revocation event (mark sessions/tokens as revoked)
   */
  async processRevocationEvent(
    eventId: string,
    sessionsRevoked: number,
    tokensInvalidated: number
  ): Promise<void> {
    const { error } = await supabase
      .from('idp_revocation_events')
      .update({
        processed_at: new Date().toISOString(),
        processed_by: 'idp_service',
        sessions_revoked: sessionsRevoked,
        tokens_invalidated: tokensInvalidated,
      })
      .eq('id', eventId);

    if (error) throw error;
  },

  /**
   * Subscribe to revocation events in realtime
   */
  subscribeToRevocationEvents(
    callback: (event: IdPRevocationEvent) => void
  ): () => void {
    const channel = supabase
      .channel('idp-revocation-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'idp_revocation_events',
        },
        (payload) => {
          callback(payload.new as unknown as IdPRevocationEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Force logout user associated with a revocation event
   */
  async forceLogout(userId: string): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Invalidate all active sessions for the user
    // 2. Revoke all refresh tokens
    // 3. Add user to a blocklist
    
    // For now, we just sign out the current user if it matches
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) {
      await supabase.auth.signOut();
      return true;
    }
    
    return false;
  },

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Get current session info with provider context
   */
  async getSessionInfo(): Promise<{
    authenticated: boolean;
    user: { id: string; email: string } | null;
    provider: HealthProvider | null;
    eligibility: EligibilityResponse | null;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        authenticated: false,
        user: null,
        provider: null,
        eligibility: null,
      };
    }

    const provider = await HPRService.getProviderByUserId(user.id);
    let eligibility: EligibilityResponse | null = null;

    if (provider) {
      eligibility = await HPRService.checkEligibility(provider.id);
    }

    return {
      authenticated: true,
      user: { id: user.id, email: user.email || '' },
      provider,
      eligibility,
    };
  },
};

export default IdPService;
