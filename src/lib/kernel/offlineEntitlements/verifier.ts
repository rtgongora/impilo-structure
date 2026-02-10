/**
 * Impilo vNext v1.1 — Offline Entitlement Verifier
 *
 * Verifies entitlement tokens OFFLINE (no PDP call).
 * Checks: signature, expiry, scope, constraints, kid, revocation status.
 */

import type { EntitlementVerificationResult, OfflineScope, EntitlementConstraints } from './types';
import { ENTITLEMENT_ERRORS } from './types';
import { verifyEntitlementSignature, hasKey } from './crypto';
import { getEntitlement } from './store';

/**
 * Verify an entitlement token offline.
 * 
 * @param token - The signed entitlement JWT string
 * @param requestedAction - The action the consumer wants to perform
 * @param context - Optional context for constraint checking
 */
export async function verifyEntitlementOffline(
  token: string,
  requestedAction: OfflineScope,
  context?: {
    facility_id?: string;
    patient_cpid?: string;
    purpose_of_use?: string;
  }
): Promise<EntitlementVerificationResult> {
  // 1. Verify signature
  const sigResult = await verifyEntitlementSignature(token);

  if (!sigResult.valid || !sigResult.payload) {
    // Check if kid is unknown vs signature invalid
    if (sigResult.kid && !hasKey(sigResult.kid)) {
      return {
        valid: false,
        entitlement_id: '',
        reason: ENTITLEMENT_ERRORS.ENTITLEMENT_KID_UNKNOWN,
      };
    }
    return {
      valid: false,
      entitlement_id: '',
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_SIGNATURE_INVALID,
    };
  }

  const payload = sigResult.payload;

  // 2. Check revocation status in store (if online/synced)
  const storedRecord = getEntitlement(payload.entitlement_id);
  if (storedRecord?.status === 'REVOKED') {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_REVOKED,
    };
  }

  // 3. Check time bounds
  const now = new Date();
  const validFrom = new Date(payload.valid_from);
  const validTo = new Date(payload.valid_to);

  if (now < validFrom || now > validTo) {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_EXPIRED,
    };
  }

  // 4. Check scope
  if (!payload.scope.includes(requestedAction)) {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_SCOPE_MISMATCH,
    };
  }

  // 5. Check constraints
  const constraints = payload.constraints;

  if (constraints.facility_id && context?.facility_id && constraints.facility_id !== context.facility_id) {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_CONSTRAINT_VIOLATION,
    };
  }

  if (constraints.patient_cpid_allowlist?.length && context?.patient_cpid) {
    if (!constraints.patient_cpid_allowlist.includes(context.patient_cpid)) {
      return {
        valid: false,
        entitlement_id: payload.entitlement_id,
        reason: ENTITLEMENT_ERRORS.ENTITLEMENT_CONSTRAINT_VIOLATION,
      };
    }
  }

  if (constraints.purpose_of_use && context?.purpose_of_use && constraints.purpose_of_use !== context.purpose_of_use) {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_CONSTRAINT_VIOLATION,
    };
  }

  return {
    valid: true,
    entitlement_id: payload.entitlement_id,
    payload,
  };
}
