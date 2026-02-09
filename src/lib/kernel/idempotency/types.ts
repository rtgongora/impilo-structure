/**
 * Impilo vNext v1.1 — Idempotency Types
 *
 * Data model for idempotency enforcement per Tech Companion Spec §3.
 */

/**
 * A stored idempotency record, keyed by (key, tenant_id, pod_id, route).
 */
export interface IdempotencyRecord {
  /** The Idempotency-Key header value. */
  key: string;
  tenant_id: string;
  pod_id: string;
  /** Canonical route: "METHOD /path/template" */
  route: string;
  /** SHA-256 hex digest of the canonical request body. */
  request_hash: string;
  /** HTTP status code of the original response. */
  status_code: number;
  /** The original response body (JSON-serializable). */
  response_body: unknown;
  created_at: string;
  /** Optional TTL — records older than this may be purged. */
  expires_at: string | null;
  correlation_id: string;
  request_id: string;
}
