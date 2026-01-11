/**
 * Trust Layer Hook for Telemedicine
 * Manages secure EHR access tokens, consent validation, and audit logging
 * Based on patient consent and session context
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EHRAccessScope = 'read_summary' | 'read_full' | 'read_write' | 'orders_only' | 'notes_only';
export type ConsentType = 'verbal' | 'written' | 'digital' | 'emergency';

export interface AccessToken {
  id: string;
  sessionId: string;
  patientId: string;
  referralId?: string;
  tokenHash: string;
  scope: EHRAccessScope;
  grantedByProviderId: string;
  grantedToProviderId: string;
  consentType: ConsentType;
  consentTimestamp: string;
  validFrom: string;
  validUntil: string;
  timesAccessed: number;
  maxAccessCount: number;
  isActive: boolean;
}

export interface EHRAction {
  actionType: 'view' | 'order' | 'note' | 'update' | 'prescribe';
  resourceType: string;
  resourceId?: string;
  description: string;
  timestamp: string;
}

export interface TrustLayerState {
  accessToken: AccessToken | null;
  isValidating: boolean;
  isAccessGranted: boolean;
  accessScope: EHRAccessScope | null;
  ehrActions: EHRAction[];
}

export function useTelemedicineTrustLayer(sessionId?: string) {
  const [state, setState] = useState<TrustLayerState>({
    accessToken: null,
    isValidating: false,
    isAccessGranted: false,
    accessScope: null,
    ehrActions: [],
  });

  /**
   * Request access to patient EHR based on consent
   */
  const requestAccess = useCallback(async (params: {
    patientId: string;
    referralId?: string;
    grantedToProviderId: string;
    scope: EHRAccessScope;
    consentType: ConsentType;
    durationMinutes?: number;
  }) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Generate a secure token
      const { data: tokenHash, error: tokenError } = await supabase.rpc(
        'generate_teleconsult_access_token' as any
      );
      if (tokenError) throw tokenError;

      const validUntil = new Date(
        Date.now() + (params.durationMinutes || 120) * 60 * 1000
      ).toISOString();

      // Create access token record
      const { data: token, error } = await supabase
        .from('teleconsult_access_tokens')
        .insert({
          session_id: sessionId,
          patient_id: params.patientId,
          referral_id: params.referralId,
          token_hash: tokenHash,
          scope: params.scope,
          granted_by_provider_id: user.data.user.id,
          granted_to_provider_id: params.grantedToProviderId,
          consent_type: params.consentType,
          consent_timestamp: new Date().toISOString(),
          valid_from: new Date().toISOString(),
          valid_until: validUntil,
          max_access_count: 50,
          is_active: true,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const accessToken: AccessToken = {
        id: token.id,
        sessionId: token.session_id,
        patientId: token.patient_id,
        referralId: token.referral_id,
        tokenHash: token.token_hash,
        scope: token.scope as EHRAccessScope,
        grantedByProviderId: token.granted_by_provider_id,
        grantedToProviderId: token.granted_to_provider_id,
        consentType: token.consent_type as ConsentType,
        consentTimestamp: token.consent_timestamp,
        validFrom: token.valid_from,
        validUntil: token.valid_until,
        timesAccessed: token.times_accessed,
        maxAccessCount: token.max_access_count,
        isActive: token.is_active,
      };

      setState(prev => ({
        ...prev,
        accessToken,
        isValidating: false,
        isAccessGranted: true,
        accessScope: params.scope,
      }));

      toast.success('EHR access granted for consultation');
      return accessToken;
    } catch (error) {
      console.error('[TrustLayer] Error requesting access:', error);
      setState(prev => ({ ...prev, isValidating: false }));
      toast.error('Failed to grant EHR access');
      return null;
    }
  }, [sessionId]);

  /**
   * Validate an existing access token
   */
  const validateToken = useCallback(async (tokenHash: string) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc(
        'validate_teleconsult_access_token' as any,
        {
          _token_hash: tokenHash,
          _accessor_id: user.data.user.id,
        }
      );

      if (error) throw error;

      const result = data?.[0];
      if (!result?.is_valid) {
        toast.error(result?.error_message || 'Token validation failed');
        setState(prev => ({ 
          ...prev, 
          isValidating: false, 
          isAccessGranted: false 
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isValidating: false,
        isAccessGranted: true,
        accessScope: result.scope,
      }));

      return true;
    } catch (error) {
      console.error('[TrustLayer] Error validating token:', error);
      setState(prev => ({ ...prev, isValidating: false }));
      return false;
    }
  }, []);

  /**
   * Log an EHR action taken during the consultation
   */
  const logEHRAction = useCallback(async (action: Omit<EHRAction, 'timestamp'>) => {
    const newAction: EHRAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      ehrActions: [...prev.ehrActions, newAction],
    }));

    // Also log to the access log table
    if (state.accessToken) {
      try {
        const user = await supabase.auth.getUser();
        await supabase
          .from('teleconsult_access_log')
          .insert({
            session_id: state.accessToken.sessionId,
            token_id: state.accessToken.id,
            patient_id: state.accessToken.patientId,
            referral_id: state.accessToken.referralId,
            accessor_id: user.data.user?.id,
            access_type: action.actionType,
            resource_accessed: action.resourceType,
            actions_performed: [newAction],
          } as any);
      } catch (error) {
        console.error('[TrustLayer] Error logging action:', error);
      }
    }

    return newAction;
  }, [state.accessToken]);

  /**
   * Get all EHR actions for inclusion in consultation response
   */
  const getEHRActionsForResponse = useCallback(() => {
    return state.ehrActions;
  }, [state.ehrActions]);

  /**
   * Revoke access token
   */
  const revokeAccess = useCallback(async (reason?: string) => {
    if (!state.accessToken) return;

    try {
      const user = await supabase.auth.getUser();
      await supabase
        .from('teleconsult_access_tokens')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: user.data.user?.id,
          revoke_reason: reason || 'Session ended',
        } as any)
        .eq('id', state.accessToken.id);

      setState(prev => ({
        ...prev,
        accessToken: null,
        isAccessGranted: false,
        accessScope: null,
      }));

      toast.info('EHR access revoked');
    } catch (error) {
      console.error('[TrustLayer] Error revoking access:', error);
    }
  }, [state.accessToken]);

  /**
   * Check if user has required scope for an action
   */
  const hasScope = useCallback((requiredScope: EHRAccessScope): boolean => {
    if (!state.isAccessGranted || !state.accessScope) return false;

    const scopeHierarchy: Record<EHRAccessScope, number> = {
      'read_summary': 1,
      'read_full': 2,
      'notes_only': 2,
      'orders_only': 2,
      'read_write': 3,
    };

    return scopeHierarchy[state.accessScope] >= scopeHierarchy[requiredScope];
  }, [state.isAccessGranted, state.accessScope]);

  return {
    ...state,
    requestAccess,
    validateToken,
    logEHRAction,
    getEHRActionsForResponse,
    revokeAccess,
    hasScope,
  };
}
