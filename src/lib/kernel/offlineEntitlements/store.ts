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

let activeStore: EntitlementStoreAdapter = new InMemoryEntitlementStore();

/**
 * Swap the active entitlement store adapter.
 * Use this to inject a Postgres-backed store in production.
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
