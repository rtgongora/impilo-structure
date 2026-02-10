/**
 * Impilo vNext v1.1 — BUTANO SHR Event Emitters
 *
 * PII-free events for clinical data lifecycle:
 *  - impilo.butano.fhir.resource.created.v1
 *  - impilo.butano.fhir.resource.updated.v1
 *  - impilo.butano.reconcile.completed.v1
 *
 * Partition key: patient_cpid (or o_cpid for provisional).
 */

import type { KernelRequestContext } from '../types';
import type { ImpiloEventEnvelopeV11, ImpiloDeltaPayload } from '../events/types';
import { emitWithPolicy } from '../events/emitter';

const PRODUCER = 'butano-service';
const SCHEMA_VERSION = 1;

function now(): string {
  return new Date().toISOString();
}

function buildEnvelope(
  eventType: string,
  payload: ImpiloDeltaPayload,
  ctx: KernelRequestContext,
  subjectType: string,
  subjectId: string,
  partitionKey: string,
  idempotencyKey?: string
): ImpiloEventEnvelopeV11 {
  return {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    schema_version: SCHEMA_VERSION,
    correlation_id: ctx.correlationId,
    causation_id: null,
    idempotency_key: idempotencyKey || ctx.requestId,
    producer: PRODUCER,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    occurred_at: now(),
    emitted_at: now(),
    subject_type: subjectType,
    subject_id: subjectId,
    payload,
    meta: {
      partition_key: partitionKey,
    },
  };
}

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface ButanoResourceMeta {
  resource_type: string;
  fhir_id: string;
  subject_cpid: string;
  encounter_id?: string | null;
  effective_at?: string | null;
  is_provisional?: boolean;
  tags?: string[];
}

export interface ButanoReconcileMeta {
  from_ocpid: string;
  to_cpid: string;
  records_rewritten: number;
}

// ---------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------

/**
 * Emit impilo.butano.fhir.resource.created.v1
 */
export async function emitButanoResourceCreated(
  ctx: KernelRequestContext,
  resource: ButanoResourceMeta,
  idempotencyKey?: string
) {
  const payload: ImpiloDeltaPayload = {
    op: 'CREATE',
    before: null,
    after: {
      resource_type: resource.resource_type,
      fhir_id: resource.fhir_id,
      subject_cpid: resource.subject_cpid,
      encounter_id: resource.encounter_id ?? null,
      effective_at: resource.effective_at ?? null,
      is_provisional: resource.is_provisional ?? false,
      tags: resource.tags ?? [],
    },
    changed_fields: ['*'],
  };

  const partitionKey = resource.subject_cpid;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.butano.fhir.resource.created.v1',
      payload,
      ctx,
      resource.resource_type.toLowerCase(),
      resource.fhir_id,
      partitionKey,
      idempotencyKey
    ),
  });
}

/**
 * Emit impilo.butano.fhir.resource.updated.v1
 */
export async function emitButanoResourceUpdated(
  ctx: KernelRequestContext,
  resource: ButanoResourceMeta,
  changedFields: string[],
  before?: Record<string, unknown> | null,
  idempotencyKey?: string
) {
  const payload: ImpiloDeltaPayload = {
    op: 'UPDATE',
    before: before ?? null,
    after: {
      resource_type: resource.resource_type,
      fhir_id: resource.fhir_id,
      subject_cpid: resource.subject_cpid,
      encounter_id: resource.encounter_id ?? null,
      effective_at: resource.effective_at ?? null,
      is_provisional: resource.is_provisional ?? false,
      tags: resource.tags ?? [],
    },
    changed_fields: changedFields,
  };

  const partitionKey = resource.subject_cpid;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.butano.fhir.resource.updated.v1',
      payload,
      ctx,
      resource.resource_type.toLowerCase(),
      resource.fhir_id,
      partitionKey,
      idempotencyKey
    ),
  });
}

/**
 * Emit impilo.butano.reconcile.completed.v1
 */
export async function emitButanoReconcileCompleted(
  ctx: KernelRequestContext,
  reconcile: ButanoReconcileMeta,
  idempotencyKey?: string
) {
  const payload: ImpiloDeltaPayload = {
    op: 'UPDATE',
    before: { subject_ref: reconcile.from_ocpid },
    after: {
      from_ocpid: reconcile.from_ocpid,
      to_cpid: reconcile.to_cpid,
      records_rewritten: reconcile.records_rewritten,
    },
    changed_fields: ['subject_ref'],
  };

  const partitionKey = reconcile.to_cpid;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.butano.reconcile.completed.v1',
      payload,
      ctx,
      'reconciliation',
      `${reconcile.from_ocpid}:${reconcile.to_cpid}`,
      partitionKey,
      idempotencyKey
    ),
  });
}
