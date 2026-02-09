/**
 * Impilo vNext v1.1 — Audit Ledger Types
 *
 * Append-only, hash-chained audit record format per Tech Companion Spec.
 * Every sensitive decision (PDP, merges, tariff updates, authority violations)
 * must produce an AuditRecord.
 */

/**
 * Actor who performed the auditable action.
 */
export interface AuditActor {
  /** Subject identifier (prid, sub, user_id). */
  subject_id: string;
  /** Roles active at the time of the action. */
  roles: string[];
  /** Facility context, if applicable. */
  facility_id?: string;
  /** Assurance level of the authentication. */
  assurance_level?: string;
}

/**
 * Auditable decision outcome.
 */
export type AuditDecision = 'ALLOW' | 'DENY' | 'BREAK_GLASS' | 'SYSTEM';

/**
 * A single audit ledger record.
 * Append-only: no UPDATE or DELETE operations exist.
 */
export interface AuditRecord {
  /** Unique identifier for this audit entry. */
  audit_id: string;
  tenant_id: string;
  pod_id: string;
  /** When the auditable action occurred. RFC3339. */
  occurred_at: string;
  /** Originating request ID. */
  request_id: string;
  /** Correlation chain ID. */
  correlation_id: string;
  /** Who performed the action. */
  actor: AuditActor;
  /** Canonical action name (e.g., "vito.patient.merge"). */
  action: string;
  /** Decision outcome. */
  decision: AuditDecision;
  /** Machine-readable reason codes. */
  reason_codes: string[];
  /** Policy version that governed the decision, if applicable. */
  policy_version: string | null;
  /** Resource context (patient CPID/CRID, tariff ID, etc.). */
  resource: Record<string, unknown>;
  /** Hash of the previous record in the chain (null if first). */
  prev_hash: string | null;
  /** SHA-256 hash of this record (computed over all fields + prev_hash). */
  record_hash: string;
}

/**
 * Input to the ledger append function — all fields except hashes.
 */
export type AuditRecordInput = Omit<AuditRecord, 'prev_hash' | 'record_hash'>;

/**
 * Result of a chain verification.
 */
export interface ChainVerificationResult {
  ok: boolean;
  total_records: number;
  broken_at?: string; // audit_id where chain broke
}
