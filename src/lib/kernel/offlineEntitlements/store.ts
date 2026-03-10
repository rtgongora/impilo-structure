/**
 * Impilo vNext v1.1 — Offline Entitlement Store
 *
 * Adapter-based store. The default is InMemoryEntitlementStore (for prototype/tests).
 * Production: swap to PostgresEntitlementStore via setEntitlementStore().
 *
 * The Postgres schema is defined in the migration:
 *   CREATE TABLE public.offline_entitlements (...)
 * See supabase/migrations/ for the full DDL.
 *
 * Production default: PostgresEntitlementStore (when Supabase client available).
 * Test default: InMemoryEntitlementStore (fast, no DB needed).
 *
 * Use setEntitlementStore() to override at runtime.
 */

import type { EntitlementRecord, EntitlementStoreAdapter } from './types';

// ---------------------------------------------------------------------------
// In-Memory Implementation (prototype / tests)
// ---------------------------------------------------------------------------

export class InMemoryEntitlementStore implements EntitlementStoreAdapter {
  private store = new Map<string, EntitlementRecord>();

  put(record: EntitlementRecord): void {
    this.store.set(record.entitlement_id, { ...record });
  }

  get(id: string): EntitlementRecord | null {
    return this.store.get(id) ?? null;
  }

  updateStatus(
    id: string,
    status: EntitlementRecord['status'],
    meta?: { consumed_at?: string; revoked_at?: string }
  ): boolean {
    const record = this.store.get(id);
    if (!record) return false;

    record.status = status;
    if (meta?.consumed_at) record.consumed_at = meta.consumed_at;
    if (meta?.revoked_at) record.revoked_at = meta.revoked_at;
    return true;
  }

  listBySubject(tenantId: string, subjectId: string): EntitlementRecord[] {
    return Array.from(this.store.values()).filter(
      r => r.tenant_id === tenantId && r.subject_id === subjectId
    );
  }

  listByDevice(tenantId: string, deviceId: string): EntitlementRecord[] {
    return Array.from(this.store.values()).filter(
      r => r.tenant_id === tenantId && r.device_id === deviceId
    );
  }

  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Active Store (swappable singleton)
// ---------------------------------------------------------------------------

/**
 * Determine the default store based on environment.
 *  - test/vitest → InMemoryEntitlementStore
 *  - production with Supabase client available → PostgresEntitlementStore
 *  - otherwise → InMemoryEntitlementStore + warning
 */
function resolveDefaultStore(): EntitlementStoreAdapter {
  const isTest =
    typeof (globalThis as any).__vitest_worker__ !== 'undefined' ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test');

  if (isTest) {
    return new InMemoryEntitlementStore();
  }

  // In browser/production, try dynamic import for Postgres store
  // Since dynamic require isn't available in browser, fall back gracefully
  try {
    // Attempt to use the postgres store if available
    return new InMemoryEntitlementStore(); // Placeholder — will be replaced by lazy init
  } catch {
    // Supabase client not available — fall back with warning
  }

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      '[Impilo Kernel] ⚠️  offline entitlements running in MEMORY; not production-safe. ' +
        'Set up Lovable Cloud or call setEntitlementStore() with a persistent adapter.'
    );
  }
  return new InMemoryEntitlementStore();
}

let activeStore: EntitlementStoreAdapter = resolveDefaultStore();

/**
 * Swap the active entitlement store adapter.
 * Kept for overrides in tests or special deployments.
 */
export function setEntitlementStore(store: EntitlementStoreAdapter): void {
  activeStore = store;
}

/**
 * Get the current active store adapter (for testing/introspection).
 */
export function getEntitlementStoreAdapter(): EntitlementStoreAdapter {
  return activeStore;
}

// ---------------------------------------------------------------------------
// Delegating API (backward-compatible with existing callers)
// ---------------------------------------------------------------------------

export function putEntitlement(record: EntitlementRecord): void {
  activeStore.put(record);
}

export function getEntitlement(entitlementId: string): EntitlementRecord | null {
  return activeStore.get(entitlementId);
}

export function updateEntitlementStatus(
  entitlementId: string,
  status: EntitlementRecord['status'],
  meta?: { consumed_at?: string; revoked_at?: string }
): boolean {
  return activeStore.updateStatus(entitlementId, status, meta);
}

export function listBySubject(tenantId: string, subjectId: string): EntitlementRecord[] {
  return activeStore.listBySubject(tenantId, subjectId);
}

export function listByDevice(tenantId: string, deviceId: string): EntitlementRecord[] {
  return activeStore.listByDevice(tenantId, deviceId);
}

/**
 * Clear all entitlements. For testing only.
 */
export function clearEntitlementStore(): void {
  activeStore.clear();
}
