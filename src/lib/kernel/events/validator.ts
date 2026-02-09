/**
 * Impilo vNext v1.1 — Schema Gate (Blocking Validator)
 *
 * Validates event envelopes BEFORE publish. If validation fails,
 * the event is BLOCKED — it must not be emitted.
 *
 * Per Tech Companion Spec §2.2 + §2.4.
 */

import type { ImpiloEventEnvelopeV11 } from './types';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export type SchemaValidationCode =
  | 'SCHEMA_VERSION_MISSING_OR_INVALID'
  | 'EVENT_ENVELOPE_INVALID'
  | 'PARTITION_KEY_MISSING';

export class SchemaValidationError extends Error {
  code: SchemaValidationCode;
  details: Record<string, unknown>;

  constructor(code: SchemaValidationCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'SchemaValidationError';
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// RFC 3339 check (lenient but catches obvious junk)
// ---------------------------------------------------------------------------

const RFC3339_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isRFC3339(value: unknown): value is string {
  return typeof value === 'string' && RFC3339_RE.test(value);
}

// ---------------------------------------------------------------------------
// Required envelope field names (for error messages)
// ---------------------------------------------------------------------------

const REQUIRED_STRING_FIELDS: (keyof ImpiloEventEnvelopeV11)[] = [
  'event_id',
  'event_type',
  'idempotency_key',
  'producer',
  'tenant_id',
  'pod_id',
  'subject_type',
  'subject_id',
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate that `event` is a complete, spec-compliant v1.1 envelope.
 * Throws SchemaValidationError on the FIRST blocking violation found.
 *
 * This function MUST be called before any publish/emit.
 */
export function validateEventOrThrow(
  event: unknown
): asserts event is ImpiloEventEnvelopeV11 {
  if (!event || typeof event !== 'object') {
    throw new SchemaValidationError(
      'EVENT_ENVELOPE_INVALID',
      'Event must be a non-null object',
      { received: typeof event }
    );
  }

  const e = event as Record<string, unknown>;

  // 1. schema_version — MUST be integer >= 1
  if (
    e.schema_version === undefined ||
    e.schema_version === null ||
    typeof e.schema_version !== 'number' ||
    !Number.isInteger(e.schema_version) ||
    e.schema_version < 1
  ) {
    throw new SchemaValidationError(
      'SCHEMA_VERSION_MISSING_OR_INVALID',
      'schema_version must be an integer >= 1',
      { received: e.schema_version }
    );
  }

  // 2. Required string fields
  const missingFields: string[] = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    const val = e[field];
    if (typeof val !== 'string' || val.trim().length === 0) {
      missingFields.push(field);
    }
  }

  // correlation_id — required string
  if (typeof e.correlation_id !== 'string' || e.correlation_id.trim().length === 0) {
    missingFields.push('correlation_id');
  }

  // causation_id — must be string or null (not undefined)
  if (e.causation_id !== null && typeof e.causation_id !== 'string') {
    missingFields.push('causation_id (must be string or null)');
  }

  if (missingFields.length > 0) {
    throw new SchemaValidationError(
      'EVENT_ENVELOPE_INVALID',
      `Missing or invalid required envelope fields: ${missingFields.join(', ')}`,
      { missing_fields: missingFields }
    );
  }

  // 3. RFC3339 timestamps
  if (!isRFC3339(e.occurred_at)) {
    throw new SchemaValidationError(
      'EVENT_ENVELOPE_INVALID',
      'occurred_at must be a valid RFC3339 date-time string',
      { received: e.occurred_at }
    );
  }
  if (!isRFC3339(e.emitted_at)) {
    throw new SchemaValidationError(
      'EVENT_ENVELOPE_INVALID',
      'emitted_at must be a valid RFC3339 date-time string',
      { received: e.emitted_at }
    );
  }

  // 4. payload must be an object
  if (!e.payload || typeof e.payload !== 'object') {
    throw new SchemaValidationError(
      'EVENT_ENVELOPE_INVALID',
      'payload must be a non-null object',
      { received: typeof e.payload }
    );
  }

  // 5. meta.partition_key — MUST be present and non-empty string
  if (!e.meta || typeof e.meta !== 'object') {
    throw new SchemaValidationError(
      'PARTITION_KEY_MISSING',
      'meta object is required and must contain partition_key',
      {}
    );
  }

  const meta = e.meta as Record<string, unknown>;
  if (typeof meta.partition_key !== 'string' || meta.partition_key.trim().length === 0) {
    throw new SchemaValidationError(
      'PARTITION_KEY_MISSING',
      'meta.partition_key must be a non-empty string',
      { received: meta.partition_key }
    );
  }
}
