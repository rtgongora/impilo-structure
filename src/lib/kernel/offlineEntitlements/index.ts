/**
 * Impilo vNext v1.1 — Offline Entitlements Module Index
 */
export type {
  OfflineScope,
  EntitlementConstraints,
  EntitlementIssuanceRequest,
  EntitlementPayload,
  SignedEntitlement,
  EntitlementRecord,
  EntitlementVerificationResult,
  EntitlementErrorCode,
} from './types';
export { ENTITLEMENT_ERRORS } from './types';
export { issueEntitlement } from './issuer';
export { verifyEntitlementOffline } from './verifier';
export {
  putEntitlement,
  getEntitlement,
  updateEntitlementStatus,
  listBySubject,
  listByDevice,
  clearEntitlementStore,
} from './store';
export {
  generateSigningKey,
  getActiveKid,
  setActiveKid,
  hasKey,
  clearKeyStore,
} from './crypto';
export {
  emitEntitlementIssued,
  emitEntitlementRevoked,
  emitEntitlementConsumed,
} from './events';
