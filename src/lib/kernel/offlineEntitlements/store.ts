/**
 * Impilo vNext v1.1 — Offline Entitlement Store
 *
 * In-memory store for prototype. Production: Postgres-backed.
 * Stores entitlement records keyed by entitlement_id.
 */

import type { EntitlementRecord } from './types';

const store = new Map<string, EntitlementRecord>();

/**
 * Store an entitlement record.
 */
export function putEntitlement(record: EntitlementRecord): void {
  store.set(record.entitlement_id, { ...record });
}

/**
 * Get an entitlement by ID.
 */
export function getEntitlement(entitlementId: string): EntitlementRecord | null {
  return store.get(entitlementId) ?? null;
}

/**
 * Update entitlement status.
 */
export function updateEntitlementStatus(
  entitlementId: string,
  status: EntitlementRecord['status'],
  meta?: { consumed_at?: string; revoked_at?: string }
): boolean {
  const record = store.get(entitlementId);
  if (!record) return false;

  record.status = status;
  if (meta?.consumed_at) record.consumed_at = meta.consumed_at;
  if (meta?.revoked_at) record.revoked_at = meta.revoked_at;
  return true;
}

/**
 * List entitlements by subject.
 */
export function listBySubject(tenantId: string, subjectId: string): EntitlementRecord[] {
  return Array.from(store.values()).filter(
    r => r.tenant_id === tenantId && r.subject_id === subjectId
  );
}

/**
 * List entitlements by device.
 */
export function listByDevice(tenantId: string, deviceId: string): EntitlementRecord[] {
  return Array.from(store.values()).filter(
    r => r.tenant_id === tenantId && r.device_id === deviceId
  );
}

/**
 * Clear all entitlements. For testing only.
 */
export function clearEntitlementStore(): void {
  store.clear();
}
