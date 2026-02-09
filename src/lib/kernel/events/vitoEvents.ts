/**
 * Impilo vNext v1.1 — VITO Delta Event Builders
 *
 * Emits v1.1 delta events for patient create/update/merge.
 *
 * Topics:
 *  - impilo.vito.patient.created.v1
 *  - impilo.vito.patient.updated.v1
 *  - impilo.vito.patient.merged.v1
 *
 * Rules:
 *  - subject_type = "patient"
 *  - subject_id = CPID if available, else CRID
 *  - meta.partition_key = CPID if available, else CRID
 *  - producer = "vito"
 */

import type { ImpiloEventEnvelopeV11, ImpiloDeltaPayload } from './types';
import { emitWithPolicy } from './emitter';
import type { KernelRequestContext } from '../types';

const PRODUCER = 'vito';
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function resolveSubjectId(cpid?: string | null, crid?: string | null): string {
  return cpid || crid || 'unknown';
}

function resolvePartitionKey(cpid?: string | null, crid?: string | null): string {
  return cpid || crid || 'unknown';
}

function buildEnvelope(
  eventType: string,
  payload: ImpiloDeltaPayload,
  ctx: KernelRequestContext,
  subjectId: string,
  partitionKey: string,
  idempotencyKey?: string | null,
  occurredAt?: string
): ImpiloEventEnvelopeV11 {
  const eventId = crypto.randomUUID();
  return {
    event_id: eventId,
    event_type: eventType,
    schema_version: SCHEMA_VERSION,
    correlation_id: ctx.correlationId,
    causation_id: null,
    idempotency_key: idempotencyKey || ctx.requestId,
    producer: PRODUCER,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    occurred_at: occurredAt || now(),
    emitted_at: now(),
    subject_type: 'patient',
    subject_id: subjectId,
    payload,
    meta: {
      partition_key: partitionKey,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface VitoPatientState {
  crid?: string | null;
  cpid?: string | null;
  given_name?: string;
  family_name?: string;
  date_of_birth?: string;
  gender?: string;
  national_id?: string;
  mrn?: string;
  [key: string]: unknown;
}

/**
 * Emit `impilo.vito.patient.created.v1` after a new patient registration.
 */
export async function emitPatientCreated(
  ctx: KernelRequestContext,
  patient: VitoPatientState,
  idempotencyKey?: string | null
) {
  const subjectId = resolveSubjectId(patient.cpid, patient.crid);
  const partitionKey = resolvePartitionKey(patient.cpid, patient.crid);

  const payload: ImpiloDeltaPayload = {
    op: 'CREATE',
    before: null,
    after: { ...patient },
    changed_fields: ['*'],
  };

  const envelope = buildEnvelope(
    'impilo.vito.patient.created.v1',
    payload,
    ctx,
    subjectId,
    partitionKey,
    idempotencyKey
  );

  return emitWithPolicy({ v11: envelope });
}

/**
 * Emit `impilo.vito.patient.updated.v1` after a patient record change.
 */
export async function emitPatientUpdated(
  ctx: KernelRequestContext,
  before: VitoPatientState | null,
  after: VitoPatientState,
  changedFields: string[],
  idempotencyKey?: string | null
) {
  const subjectId = resolveSubjectId(after.cpid, after.crid);
  const partitionKey = resolvePartitionKey(after.cpid, after.crid);

  const payload: ImpiloDeltaPayload = {
    op: 'UPDATE',
    before: before ? { ...before } : null,
    after: { ...after },
    changed_fields: changedFields,
  };

  const envelope = buildEnvelope(
    'impilo.vito.patient.updated.v1',
    payload,
    ctx,
    subjectId,
    partitionKey,
    idempotencyKey
  );

  return emitWithPolicy({ v11: envelope });
}

/**
 * Emit `impilo.vito.patient.merged.v1` after a patient merge.
 */
export async function emitPatientMerged(
  ctx: KernelRequestContext,
  merge: {
    survivor_crid: string;
    merged_crids: string[];
    alias_map: Array<{ from: string; to: string }>;
    cpid?: string | null;
    version?: number;
  },
  idempotencyKey?: string | null
) {
  const subjectId = resolveSubjectId(merge.cpid, merge.survivor_crid);
  const partitionKey = resolvePartitionKey(merge.cpid, merge.survivor_crid);

  const payload: ImpiloDeltaPayload = {
    op: 'MERGE',
    before: null,
    after: {
      survivor_crid: merge.survivor_crid,
      merged_crids: merge.merged_crids,
      alias_map: merge.alias_map,
      cpid: merge.cpid || null,
      version: merge.version ?? 1,
    },
    changed_fields: ['survivor_crid', 'alias_map', 'merged_crids', 'version'],
  };

  const envelope = buildEnvelope(
    'impilo.vito.patient.merged.v1',
    payload,
    ctx,
    subjectId,
    partitionKey,
    idempotencyKey
  );

  return emitWithPolicy({ v11: envelope });
}
