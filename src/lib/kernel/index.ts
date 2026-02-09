/**
 * Impilo vNext v1.1 — Kernel Module Index
 * 
 * Central export for all kernel primitives.
 */

export * from './types';
export * from './errorFormatter';
export * from './kernelClient';
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
