/**
 * Impilo vNext v1.1 — Audit Ledger
 *
 * Append-only, hash-chained audit ledger.
 * - No UPDATE or DELETE operations
 * - Each record includes prev_hash → record_hash chain
 * - Verifiable integrity via verifyChain()
 *
 * Prototype: in-memory store. Production: DB table.
 */

import type {
  AuditRecord,
  AuditRecordInput,
  ChainVerificationResult,
} from './types';
import { canonicalJson } from '../idempotency/hash';

// ---------------------------------------------------------------------------
// Hashing (uses Web Crypto API)
// ---------------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// In-memory ledger store (append-only)
// ---------------------------------------------------------------------------

/** Per-chain storage keyed by "tenant_id::pod_id". */
const ledger = new Map<string, AuditRecord[]>();

function chainKey(tenantId: string, podId: string): string {
  return `${tenantId}::${podId}`;
}

function getChain(tenantId: string, podId: string): AuditRecord[] {
  const key = chainKey(tenantId, podId);
  if (!ledger.has(key)) {
    ledger.set(key, []);
  }
  return ledger.get(key)!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Append an audit record to the ledger.
 * Computes prev_hash and record_hash automatically.
 *
 * @returns The complete AuditRecord with hashes.
 */
export async function appendAuditRecord(
  input: AuditRecordInput
): Promise<AuditRecord> {
  const chain = getChain(input.tenant_id, input.pod_id);
  const lastRecord = chain.length > 0 ? chain[chain.length - 1] : null;
  const prevHash = lastRecord?.record_hash ?? null;

  // Build the record without record_hash for hashing
  const recordForHashing = {
    ...input,
    prev_hash: prevHash,
  };

  const recordHash = await sha256Hex(canonicalJson(recordForHashing));

  const record: AuditRecord = {
    ...input,
    prev_hash: prevHash,
    record_hash: recordHash,
  };

  // Append-only — push to chain
  chain.push(record);

  console.log(
    `[AuditLedger] appended: action=${record.action} decision=${record.decision} audit_id=${record.audit_id} chain_length=${chain.length}`
  );

  return record;
}

/**
 * Verify the hash chain integrity for a tenant+pod.
 */
export async function verifyChain(
  tenantId: string,
  podId: string
): Promise<ChainVerificationResult> {
  const chain = getChain(tenantId, podId);

  if (chain.length === 0) {
    return { ok: true, total_records: 0 };
  }

  for (let i = 0; i < chain.length; i++) {
    const record = chain[i];

    // Verify prev_hash links
    if (i === 0) {
      if (record.prev_hash !== null) {
        return { ok: false, total_records: chain.length, broken_at: record.audit_id };
      }
    } else {
      if (record.prev_hash !== chain[i - 1].record_hash) {
        return { ok: false, total_records: chain.length, broken_at: record.audit_id };
      }
    }

    // Recompute record_hash and verify
    const { record_hash: _stored, ...rest } = record;
    const recomputed = await sha256Hex(canonicalJson(rest));
    if (recomputed !== record.record_hash) {
      return { ok: false, total_records: chain.length, broken_at: record.audit_id };
    }
  }

  return { ok: true, total_records: chain.length };
}

/**
 * List all audit records matching a correlation ID.
 */
export function listByCorrelationId(
  tenantId: string,
  podId: string,
  correlationId: string
): AuditRecord[] {
  const chain = getChain(tenantId, podId);
  return chain.filter(r => r.correlation_id === correlationId);
}

/**
 * Get all records for a tenant+pod chain. For testing/debugging.
 */
export function getAuditChain(tenantId: string, podId: string): readonly AuditRecord[] {
  return [...getChain(tenantId, podId)];
}

/**
 * Clear all audit data. For testing only.
 */
export function clearAuditLedger(): void {
  ledger.clear();
}
