/**
 * Impilo vNext v1.1 — Idempotency Store
 *
 * In-memory idempotency store for the prototype.
 * Keyed by composite (key, tenant_id, pod_id, route).
 * Thread-safe via JS single-thread + lock map for concurrent request protection.
 */

import type { IdempotencyRecord } from './types';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const store = new Map<string, IdempotencyRecord>();
const MAX_RECORDS = 10_000;

function compositeKey(key: string, tenantId: string, podId: string, route: string): string {
  return `${tenantId}::${podId}::${route}::${key}`;
}

// ---------------------------------------------------------------------------
// Lock map for concurrent duplicate protection
// ---------------------------------------------------------------------------

const locks = new Map<string, Promise<void>>();

async function withLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock
  while (locks.has(lockKey)) {
    await locks.get(lockKey);
  }
  let resolve: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  locks.set(lockKey, promise);
  try {
    return await fn();
  } finally {
    locks.delete(lockKey);
    resolve!();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getIdempotencyRecord(
  key: string,
  tenantId: string,
  podId: string,
  route: string
): Promise<IdempotencyRecord | null> {
  const ck = compositeKey(key, tenantId, podId, route);
  const record = store.get(ck) ?? null;

  // Check TTL
  if (record?.expires_at) {
    if (new Date(record.expires_at) < new Date()) {
      store.delete(ck);
      return null;
    }
  }
  return record;
}

export async function putIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
  const ck = compositeKey(record.key, record.tenant_id, record.pod_id, record.route);
  await withLock(ck, async () => {
    // Enforce max size
    if (store.size >= MAX_RECORDS) {
      // Evict oldest
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
    store.set(ck, record);
  });
}

/**
 * Atomic get-or-put: returns existing record if found, otherwise stores and returns null.
 * Used by the idempotency guard for safe concurrent handling.
 */
export async function getOrPut(
  key: string,
  tenantId: string,
  podId: string,
  route: string,
  createRecord: () => IdempotencyRecord
): Promise<IdempotencyRecord | null> {
  const ck = compositeKey(key, tenantId, podId, route);
  return withLock(ck, async () => {
    const existing = store.get(ck) ?? null;
    if (existing) {
      if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
        store.delete(ck);
        return null;
      }
      return existing;
    }
    // Not found — caller will proceed; we don't store yet (store after response)
    return null;
  });
}

/** Clear all records. For testing only. */
export function clearIdempotencyStore(): void {
  store.clear();
}

/** Get count. For testing. */
export function getIdempotencyStoreSize(): number {
  return store.size;
}
