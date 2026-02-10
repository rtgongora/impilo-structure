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
  EntitlementStoreAdapter,
} from './types';
export { ENTITLEMENT_ERRORS } from './types';
export { issueEntitlement } from './issuer';
export { verifyEntitlementOffline } from './verifier';
export { revokeEntitlement, consumeEntitlement } from './lifecycle';
export {
  putEntitlement,
  getEntitlement,
  updateEntitlementStatus,
  listBySubject,
  listByDevice,
  clearEntitlementStore,
  setEntitlementStore,
  getEntitlementStoreAdapter,
  InMemoryEntitlementStore,
} from './store';
export { PostgresEntitlementStore } from './postgresStore';
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
