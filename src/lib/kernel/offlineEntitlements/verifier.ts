/**
 * Impilo vNext v1.1 — Offline Entitlement Verifier
 *
 * Verifies entitlement tokens OFFLINE (no PDP call).
 * Checks: Ed25519 signature, alg, expiry, scope, constraints, kid, revocation.
 */

import type { EntitlementVerificationResult, OfflineScope } from './types';
import { ENTITLEMENT_ERRORS } from './types';
import { verifyEntitlementSignature, hasKey } from './crypto';
import { getEntitlement } from './store';

/**
 * Verify an entitlement token offline.
 * Rejects any non-Ed25519 algorithm.
 *
 * @param token - The signed entitlement token string
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
  // 1. Verify Ed25519 signature (also rejects non-Ed25519 alg)
  const sigResult = await verifyEntitlementSignature(token);

  if (!sigResult.valid || !sigResult.payload) {
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

  // 2. Enforce Ed25519 algorithm
  if (payload.alg !== 'Ed25519') {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_SIGNATURE_INVALID,
    };
  }

  // 3. Check revocation status in store
  const storedRecord = getEntitlement(payload.entitlement_id);
  if (storedRecord?.status === 'REVOKED') {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_REVOKED,
    };
  }

  // 4. Check time bounds
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

  // 5. Check scope
  if (!payload.scope.includes(requestedAction)) {
    return {
      valid: false,
      entitlement_id: payload.entitlement_id,
      reason: ENTITLEMENT_ERRORS.ENTITLEMENT_SCOPE_MISMATCH,
    };
  }

  // 6. Check constraints
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
