/**
 * Impilo vNext v1.1 — Offline Entitlement Events
 *
 * Event emitters for entitlement lifecycle:
 *  - impilo.offline.entitlement.issued.v1
 *  - impilo.offline.entitlement.revoked.v1
 *  - impilo.offline.entitlement.consumed.v1
 */

import type { KernelRequestContext } from '../types';
import type { ImpiloEventEnvelopeV11, ImpiloDeltaPayload } from '../events/types';
import type { EntitlementPayload } from './types';
import { emitWithPolicy } from '../events/emitter';

const PRODUCER = 'tshepo-service';
const SCHEMA_VERSION = 1;

function now(): string {
  return new Date().toISOString();
}

function buildEnvelope(
  eventType: string,
  payload: ImpiloDeltaPayload,
  ctx: KernelRequestContext,
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
    subject_type: 'entitlement',
    subject_id: subjectId,
    payload,
    meta: {
      partition_key: partitionKey,
    },
  };
}

/**
 * Emit impilo.offline.entitlement.issued.v1
 */
export async function emitEntitlementIssued(
  ctx: KernelRequestContext,
  entitlement: EntitlementPayload
) {
  const payload: ImpiloDeltaPayload = {
    op: 'CREATE',
    before: null,
    after: {
      entitlement_id: entitlement.entitlement_id,
      device_id: entitlement.device_id,
      subject_id: entitlement.subject_id,
      scope: entitlement.scope,
      valid_from: entitlement.valid_from,
      valid_to: entitlement.valid_to,
      policy_version: entitlement.policy_version,
    },
    changed_fields: ['*'],
  };

  const partitionKey = `${ctx.tenantId}:${entitlement.subject_id}`;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.offline.entitlement.issued.v1',
      payload,
      ctx,
      entitlement.entitlement_id,
      partitionKey
    ),
  });
}

/**
 * Emit impilo.offline.entitlement.revoked.v1
 */
export async function emitEntitlementRevoked(
  ctx: KernelRequestContext,
  entitlementId: string,
  subjectId: string,
  reason: string
) {
  const payload: ImpiloDeltaPayload = {
    op: 'REVOKE',
    before: { status: 'ACTIVE' },
    after: { status: 'REVOKED', reason },
    changed_fields: ['status'],
  };

  const partitionKey = `${ctx.tenantId}:${subjectId}`;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.offline.entitlement.revoked.v1',
      payload,
      ctx,
      entitlementId,
      partitionKey
    ),
  });
}

/**
 * Emit impilo.offline.entitlement.consumed.v1
 */
export async function emitEntitlementConsumed(
  ctx: KernelRequestContext,
  entitlementId: string,
  subjectId: string,
  action: string
) {
  const payload: ImpiloDeltaPayload = {
    op: 'UPDATE',
    before: { status: 'ACTIVE' },
    after: { status: 'CONSUMED', action_performed: action },
    changed_fields: ['status'],
  };

  const partitionKey = `${ctx.tenantId}:${subjectId}`;
  return emitWithPolicy({
    v11: buildEnvelope(
      'impilo.offline.entitlement.consumed.v1',
      payload,
      ctx,
      entitlementId,
      partitionKey
    ),
  });
}
