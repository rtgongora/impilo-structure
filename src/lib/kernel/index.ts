/**
 * Impilo vNext v1.1 — Kernel Module Index
 * 
 * Central export for all kernel primitives.
 */

export * from './types';
export * from './errorFormatter';
export * from './kernelClient';

// Wave 1 — Eventing
export { 
  type ImpiloEventEnvelopeV11,
  type ImpiloDeltaPayload,
  type ImpiloSnapshotPayload,
  type EventPublishResult,
  SchemaValidationError,
  validateEventOrThrow,
  emitV11,
  emitWithPolicy,
  setEmitMode,
  getEmitMode,
  setProducerName,
  getProducerName,
  onEvent,
  getStoredEvents,
  clearEventStore,
  emitPatientCreated,
  emitPatientUpdated,
  emitPatientMerged,
  type VitoPatientState,
} from './events';

// Wave 2 — Idempotency
export {
  type IdempotencyRecord,
  requireIdempotencyKey,
  checkIdempotency,
  storeIdempotencyResult,
  clearIdempotencyStore,
  computeRequestHash,
  canonicalJson,
} from './idempotency';

// Wave 2 — Audit
export {
  type AuditRecord,
  type AuditRecordInput,
  type AuditActor,
  type AuditDecision,
  type ChainVerificationResult,
  appendAuditRecord,
  verifyChain,
  listByCorrelationId,
  getAuditChain,
  clearAuditLedger,
  logPolicyDecision,
} from './audit';

// Wave 2 — VITO Commands
export {
  vitoPatientUpsert,
  vitoPatientMerge,
  type VitoUpsertRequest,
  type VitoMergeRequest,
  type VitoCommandResult,
} from './vito';

// Wave 3 — TSHEPO PDP
export {
  type PDPSubject,
  type PDPDecideRequest,
  type PDPDecideResponse,
  type PDPDecisionValue,
  type PDPObligation,
  evaluatePolicy,
  pdpDecide,
} from './tshepo';

// Wave 3 — Consistency
export {
  decidePdp,
  enforceClassAOrThrow,
  type ClassAEnforcementInput,
  type ClassAEnforcementResult,
} from './consistency';

// Wave 3 — MSIKA Commands
export {
  msikaTariffUpdate,
  getTariff,
  clearTariffStore,
  type TariffUpdateRequest,
  type MsikaCommandResult,
} from './msika';

// Wave 3 — Security / Actor
export {
  getActorFromHeaders,
  type ActorHeaders,
} from './security';

// Wave 4 — Offline Entitlements
export {
  issueEntitlement,
  verifyEntitlementOffline,
  revokeEntitlement,
  consumeEntitlement,
  generateSigningKey,
  getActiveKid,
  setActiveKid,
  clearKeyStore,
  clearEntitlementStore,
  setEntitlementStore,
  getEntitlementStoreAdapter,
  InMemoryEntitlementStore,
  PostgresEntitlementStore,
  putEntitlement,
  getEntitlement,
  updateEntitlementStatus,
  ENTITLEMENT_ERRORS,
  emitEntitlementIssued,
  emitEntitlementRevoked,
  emitEntitlementConsumed,
  type OfflineScope,
  type EntitlementConstraints,
  type EntitlementIssuanceRequest,
  type EntitlementPayload,
  type SignedEntitlement,
  type EntitlementRecord,
  type EntitlementVerificationResult,
  type EntitlementStoreAdapter,
} from './offlineEntitlements';

// Wave 4 — BUTANO Events
export {
  emitButanoResourceCreated,
  emitButanoResourceUpdated,
  emitButanoReconcileCompleted,
  type ButanoResourceMeta,
  type ButanoReconcileMeta,
} from './butano';
