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
