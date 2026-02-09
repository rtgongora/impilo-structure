/**
 * Impilo vNext v1.1 — Idempotency Middleware / Guard
 *
 * Enforces idempotency semantics on command endpoints:
 * - Missing Idempotency-Key → 400 IDEMPOTENCY_KEY_REQUIRED
 * - Same key + same body → return cached response (no side effects)
 * - Same key + different body → 409 IDEMPOTENCY_CONFLICT
 *
 * Designed for use in both edge functions and client-side simulation.
 */

import type { KernelRequestContext } from '../types';
import type { IdempotencyRecord } from './types';
import { computeRequestHash } from './hash';
import { getIdempotencyRecord, putIdempotencyRecord } from './store';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface IdempotencyCheckResult {
  /** 'proceed' = new request, execute handler; 'cached' = return existing; 'conflict' = 409 */
  action: 'proceed' | 'cached' | 'conflict';
  cachedRecord?: IdempotencyRecord;
}

// ---------------------------------------------------------------------------
// Guard functions
// ---------------------------------------------------------------------------

/**
 * Extract and validate the Idempotency-Key.
 * Throws a structured error descriptor if missing.
 */
export function requireIdempotencyKey(
  idempotencyKey: string | null | undefined
): string {
  if (!idempotencyKey || idempotencyKey.trim() === '') {
    throw {
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      status: 400,
      message: 'Missing required Idempotency-Key header on command endpoint',
    };
  }
  return idempotencyKey.trim();
}

/**
 * Check idempotency state for this request.
 *
 * @returns IdempotencyCheckResult indicating what the caller should do.
 */
export async function checkIdempotency(
  idempotencyKey: string,
  ctx: KernelRequestContext,
  route: string,
  body: unknown
): Promise<IdempotencyCheckResult> {
  const requestHash = await computeRequestHash(body);
  
  const existing = await getIdempotencyRecord(
    idempotencyKey,
    ctx.tenantId,
    ctx.podId,
    route
  );

  if (!existing) {
    // New request — caller should proceed
    return { action: 'proceed' };
  }

  // Existing record found — check body match
  if (existing.request_hash === requestHash) {
    // Same key + same body → cached replay
    return { action: 'cached', cachedRecord: existing };
  }

  // Same key + different body → conflict
  return { action: 'conflict', cachedRecord: existing };
}

/**
 * Store the idempotency record after a successful response.
 */
export async function storeIdempotencyResult(
  idempotencyKey: string,
  ctx: KernelRequestContext,
  route: string,
  body: unknown,
  statusCode: number,
  responseBody: unknown,
  ttlMs?: number
): Promise<void> {
  const requestHash = await computeRequestHash(body);
  const now = new Date();

  const record: IdempotencyRecord = {
    key: idempotencyKey,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    route,
    request_hash: requestHash,
    status_code: statusCode,
    response_body: responseBody,
    created_at: now.toISOString(),
    expires_at: ttlMs
      ? new Date(now.getTime() + ttlMs).toISOString()
      : null,
    correlation_id: ctx.correlationId,
    request_id: ctx.requestId,
  };

  await putIdempotencyRecord(record);
}
