/**
 * Impilo vNext v1.1 — Request Context
 * 
 * Extracts and validates mandatory headers per Tech Companion Spec §B.
 * Used by both client-side interceptors and server-side middleware.
 */

export interface KernelRequestContext {
  tenantId: string;
  podId: string;
  requestId: string;
  correlationId: string;
}

/**
 * Standard v1.1 error codes as defined in the Technical Companion Spec.
 */
export const V1_1_ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_CLIENT_NOT_ALLOWED: 'AUTH_CLIENT_NOT_ALLOWED',
  
  // Policy
  POLICY_DENY: 'POLICY_DENY',
  PDP_UNAVAILABLE: 'PDP_UNAVAILABLE',
  STEP_UP_REQUIRED: 'STEP_UP_REQUIRED',
  STALE_CONTEXT: 'STALE_CONTEXT',
  
  // Identity
  IDENTITY_CONFLICT: 'IDENTITY_CONFLICT',
  MERGE_CONFLICT: 'MERGE_CONFLICT',
  INVALID_MERGE_REQUEST: 'INVALID_MERGE_REQUEST',
  
  // Federation
  FEDERATION_NOT_AUTHORIZED: 'FEDERATION_NOT_AUTHORIZED',
  FEDERATION_AUTHORITY_VIOLATION: 'FEDERATION_AUTHORITY_VIOLATION',
  INVALID_LINKAGE: 'INVALID_LINKAGE',
  
  // Entitlements
  ENTITLEMENT_NOT_ALLOWED: 'ENTITLEMENT_NOT_ALLOWED',
  DEVICE_NOT_TRUSTED: 'DEVICE_NOT_TRUSTED',
  
  // Tariff
  EFFECTIVE_DATE_CONFLICT: 'EFFECTIVE_DATE_CONFLICT',
  INVALID_TARIFF: 'INVALID_TARIFF',
  
  // General
  RATE_LIMITED: 'RATE_LIMITED',
  MISSING_REQUIRED_HEADER: 'MISSING_REQUIRED_HEADER',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Idempotency (Wave 2)
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',

  // Audit (Wave 2)
  AUDIT_LEDGER_WRITE_FAILED: 'AUDIT_LEDGER_WRITE_FAILED',
} as const;

export type V1_1ErrorCode = typeof V1_1_ERROR_CODES[keyof typeof V1_1_ERROR_CODES];

/**
 * Standard v1.1 error response shape.
 * All errors from ALL services MUST use this format.
 */
export interface V1_1ErrorResponse {
  error: {
    code: V1_1ErrorCode;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
    correlation_id: string;
  };
}

/**
 * Consistency classes per Tech Companion Spec §3.
 */
export type ConsistencyClass = 'A' | 'B' | 'C';

/**
 * PDP decision values per Tech Companion Spec §1.1.2.
 */
export type PDPDecision = 'ALLOW' | 'DENY' | 'BREAK_GLASS_REQUIRED' | 'STEP_UP_REQUIRED';

/**
 * v1.1 Event envelope per Tech Companion Spec §2.2.
 */
export interface V1_1EventEnvelope {
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
  emitted_at: string; // RFC3339
  subject_type: string;
  subject_id: string;
  payload: V1_1DeltaPayload | V1_1SnapshotPayload;
  meta: {
    partition_key: string;
    policy_version?: string;
    [key: string]: unknown;
  };
}

export interface V1_1DeltaPayload {
  op: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'REVOKE';
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed_fields: string[];
}

export interface V1_1SnapshotPayload {
  state: Record<string, unknown>;
  snapshot_at: string;
}

/**
 * Emit mode for dual-running events during migration.
 */
export type EmitMode = 'V1_ONLY' | 'V1_1_ONLY' | 'DUAL';
