/**
 * Impilo vNext v1.1 — Event Envelope Types
 *
 * Canonical event structure per Technical Companion Spec §2.2.
 * All v1.1 events MUST use ImpiloEventEnvelopeV11.
 */

// Re-export the emit mode from kernel types for convenience
export type EmitMode = 'V1_ONLY' | 'V1_1_ONLY' | 'DUAL';

/**
 * v1.1 Delta payload — used for CREATE/UPDATE/DELETE/MERGE/REVOKE.
 * Delta-first: only changed state, not full snapshots.
 */
export interface ImpiloDeltaPayload {
  op: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'REVOKE';
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed_fields: string[];
}

/**
 * v1.1 Snapshot payload — used only for mandated snapshot topics
 * (e.g., impilo.msika.snapshot.products.v1).
 */
export interface ImpiloSnapshotPayload {
  snapshot_type: string;
  as_of: string; // RFC3339
  items: Record<string, unknown>[];
  page: {
    number: number;
    size: number;
    total: number;
  };
}

/**
 * v1.1 Event Envelope — every v1.1 event MUST conform.
 *
 * Required fields per Tech Companion Spec §2.2:
 * - event_id, event_type, schema_version, correlation_id, causation_id,
 *   idempotency_key, producer, tenant_id, pod_id, occurred_at, emitted_at,
 *   subject_type, subject_id, payload, meta (with partition_key).
 */
export interface ImpiloEventEnvelopeV11 {
  event_id: string;
  event_type: string;
  schema_version: number;
  correlation_id: string;
  causation_id: string | null;
  idempotency_key: string;
  producer: string;
  tenant_id: string;
  pod_id: string;
  occurred_at: string; // RFC3339
  emitted_at: string;  // RFC3339
  subject_type: string;
  subject_id: string;
  payload: ImpiloDeltaPayload | ImpiloSnapshotPayload;
  meta: {
    partition_key: string;
    policy_version?: string;
    [key: string]: unknown;
  };
}

/**
 * Result of an emit operation — tracks what was actually published.
 */
export interface EventPublishResult {
  success: boolean;
  mode: EmitMode;
  v1_emitted: boolean;
  v11_emitted: boolean;
  event_id: string | null;
  error?: string;
}
