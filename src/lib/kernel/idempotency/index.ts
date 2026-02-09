/**
 * Impilo vNext v1.1 — Idempotency Module Index
 */
export * from './types';
export { canonicalJson, computeRequestHash } from './hash';
export {
  getIdempotencyRecord,
  putIdempotencyRecord,
  getOrPut,
  clearIdempotencyStore,
  getIdempotencyStoreSize,
} from './store';
export {
  requireIdempotencyKey,
  checkIdempotency,
  storeIdempotencyResult,
  type IdempotencyCheckResult,
} from './middleware';
