/**
 * Impilo vNext v1.1 — Federation Authority Guard Hook
 * 
 * Checks whether a protected action is permitted based on
 * National Spine authority availability.
 * 
 * Protected actions:
 * - VITO patient merge (requires national spine online)
 * - MSIKA tariff update (requires national spine online)
 * 
 * When spine is unavailable, protected actions are blocked
 * with clear user-facing messaging.
 */

import { useState, useCallback, useMemo } from 'react';

export type SpineStatus = 'online' | 'offline' | 'degraded' | 'checking';

export interface FederationGuardResult {
  /** Current spine connectivity status */
  spineStatus: SpineStatus;
  /** Whether the spine is available for authority-required actions */
  isAuthorityAvailable: boolean;
  /** Check if a specific action is allowed given current spine status */
  canPerformAction: (action: FederatedAction) => boolean;
  /** Human-readable reason why an action is blocked */
  getBlockReason: (action: FederatedAction) => string | null;
  /** Manually refresh spine status */
  refreshStatus: () => Promise<void>;
  /** Set spine status (for prototype/testing) */
  setSpineStatus: (status: SpineStatus) => void;
}

/** Actions that require National Spine authority */
export type FederatedAction = 
  | 'vito.patient.merge'
  | 'msika.tariff.update'
  | 'vito.patient.federation_link';

const AUTHORITY_REQUIRED_ACTIONS: Record<FederatedAction, string> = {
  'vito.patient.merge': 'Patient merge requires National Spine authority. The spine must be online to perform identity merges.',
  'msika.tariff.update': 'Tariff updates require National Spine authority. The spine must be online to modify pricing.',
  'vito.patient.federation_link': 'Federation linkage requires National Spine authority.',
};

export function useFederationGuard(): FederationGuardResult {
  // Prototype: default to online; in production this would poll a health endpoint
  const [spineStatus, setSpineStatus] = useState<SpineStatus>('online');

  const isAuthorityAvailable = useMemo(() => {
    return spineStatus === 'online';
  }, [spineStatus]);

  const canPerformAction = useCallback((action: FederatedAction): boolean => {
    if (!(action in AUTHORITY_REQUIRED_ACTIONS)) return true;
    return isAuthorityAvailable;
  }, [isAuthorityAvailable]);

  const getBlockReason = useCallback((action: FederatedAction): string | null => {
    if (canPerformAction(action)) return null;
    return AUTHORITY_REQUIRED_ACTIONS[action] || 'This action requires National Spine authority which is currently unavailable.';
  }, [canPerformAction]);

  const refreshStatus = useCallback(async () => {
    setSpineStatus('checking');
    // Prototype: simulate a health check
    // In production: GET /internal/v1/health/spine
    await new Promise(resolve => setTimeout(resolve, 500));
    setSpineStatus('online');
  }, []);

  return {
    spineStatus,
    isAuthorityAvailable,
    canPerformAction,
    getBlockReason,
    refreshStatus,
    setSpineStatus,
  };
}
