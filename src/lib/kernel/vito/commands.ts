/**
 * Impilo vNext v1.1 — VITO Command Handlers
 *
 * Integrates idempotency guard + audit ledger + v1.1 event emission
 * for VITO patient commands (upsert, merge).
 *
 * These functions represent the "service layer" for VITO commands.
 * Edge functions or UI code should call these instead of raw DB operations.
 */

import type { KernelRequestContext } from '../types';
import type { AuditActor } from '../audit/types';
import type { VitoPatientState } from '../events/vitoEvents';
import { requireIdempotencyKey, checkIdempotency, storeIdempotencyResult } from '../idempotency';
import { logPolicyDecision } from '../audit';
import { emitPatientCreated, emitPatientUpdated, emitPatientMerged } from '../events/vitoEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VitoUpsertRequest {
  /** The patient data to create/update. */
  patient: VitoPatientState;
  /** Previous state if this is an update. Null for creates. */
  previousState?: VitoPatientState | null;
  /** Fields that changed (for updates). */
  changedFields?: string[];
}

export interface VitoMergeRequest {
  survivor_crid: string;
  merged_crids: string[];
  alias_map: Array<{ from: string; to: string }>;
  cpid?: string | null;
  version?: number;
}

export interface VitoCommandResult {
  success: boolean;
  status_code: number;
  body: unknown;
  /** True if this was a cached idempotent replay. */
  idempotent_replay: boolean;
}

// ---------------------------------------------------------------------------
// Upsert command
// ---------------------------------------------------------------------------

/**
 * Execute a VITO patient upsert with idempotency + audit + eventing.
 *
 * Route: "PUT /internal/v1/patients/{crid}"
 */
export async function vitoPatientUpsert(
  ctx: KernelRequestContext,
  idempotencyKey: string | null | undefined,
  request: VitoUpsertRequest,
  actor: AuditActor
): Promise<VitoCommandResult> {
  // 1. Require idempotency key
  const key = requireIdempotencyKey(idempotencyKey);

  const route = `PUT /internal/v1/patients/${request.patient.crid || 'new'}`;

  // 2. Check idempotency
  const check = await checkIdempotency(key, ctx, route, request);

  if (check.action === 'cached') {
    // Same key + same body → replay
    return {
      success: true,
      status_code: check.cachedRecord!.status_code,
      body: check.cachedRecord!.response_body,
      idempotent_replay: true,
    };
  }

  if (check.action === 'conflict') {
    // Same key + different body → 409
    await logPolicyDecision({
      actor,
      action: 'idempotency.conflict',
      resource: { crid: request.patient.crid, idempotency_key: key },
      decision: 'DENY',
      reason_codes: ['IDEMPOTENCY_CONFLICT'],
      policy_version: null,
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    });

    return {
      success: false,
      status_code: 409,
      body: {
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key already used with a different request body',
          details: { idempotency_key: key },
          request_id: ctx.requestId,
          correlation_id: ctx.correlationId,
        },
      },
      idempotent_replay: false,
    };
  }

  // 3. Execute the domain action (prototype: in-memory)
  const isCreate = !request.previousState;
  const responseBody = {
    patient: request.patient,
    action: isCreate ? 'created' : 'updated',
    crid: request.patient.crid,
    cpid: request.patient.cpid,
  };

  // 4. Emit v1.1 event
  if (isCreate) {
    await emitPatientCreated(ctx, request.patient, key);
  } else {
    await emitPatientUpdated(
      ctx,
      request.previousState!,
      request.patient,
      request.changedFields || ['*'],
      key
    );
  }

  // 5. Audit
  await logPolicyDecision({
    actor,
    action: `vito.patient.${isCreate ? 'upsert.create' : 'upsert.update'}`,
    resource: {
      crid: request.patient.crid,
      cpid: request.patient.cpid,
    },
    decision: 'SYSTEM',
    reason_codes: ['COMMIT_OK'],
    policy_version: null,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
  });

  // 6. Store idempotency record
  await storeIdempotencyResult(key, ctx, route, request, 200, responseBody);

  return {
    success: true,
    status_code: 200,
    body: responseBody,
    idempotent_replay: false,
  };
}

// ---------------------------------------------------------------------------
// Merge command
// ---------------------------------------------------------------------------

/**
 * Execute a VITO patient merge with idempotency + audit + eventing.
 *
 * Route: "POST /internal/v1/patients/merge"
 */
export async function vitoPatientMerge(
  ctx: KernelRequestContext,
  idempotencyKey: string | null | undefined,
  request: VitoMergeRequest,
  actor: AuditActor
): Promise<VitoCommandResult> {
  // 1. Require idempotency key
  const key = requireIdempotencyKey(idempotencyKey);

  const route = 'POST /internal/v1/patients/merge';

  // 2. Check idempotency
  const check = await checkIdempotency(key, ctx, route, request);

  if (check.action === 'cached') {
    return {
      success: true,
      status_code: check.cachedRecord!.status_code,
      body: check.cachedRecord!.response_body,
      idempotent_replay: true,
    };
  }

  if (check.action === 'conflict') {
    await logPolicyDecision({
      actor,
      action: 'idempotency.conflict',
      resource: { survivor_crid: request.survivor_crid, idempotency_key: key },
      decision: 'DENY',
      reason_codes: ['IDEMPOTENCY_CONFLICT'],
      policy_version: null,
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    });

    return {
      success: false,
      status_code: 409,
      body: {
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key already used with a different request body',
          details: { idempotency_key: key },
          request_id: ctx.requestId,
          correlation_id: ctx.correlationId,
        },
      },
      idempotent_replay: false,
    };
  }

  // 3. Execute merge (prototype: in-memory)
  const responseBody = {
    merged: true,
    survivor_crid: request.survivor_crid,
    merged_crids: request.merged_crids,
    alias_map: request.alias_map,
    cpid: request.cpid,
  };

  // 4. Emit v1.1 merge event
  await emitPatientMerged(ctx, request, key);

  // 5. Audit — merge is a sensitive operation
  await logPolicyDecision({
    actor,
    action: 'vito.patient.merge',
    resource: {
      survivor_crid: request.survivor_crid,
      merged_crids: request.merged_crids,
      cpid: request.cpid,
    },
    decision: 'SYSTEM',
    reason_codes: ['COMMIT_OK'],
    policy_version: null,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
  });

  // 6. Store idempotency record
  await storeIdempotencyResult(key, ctx, route, request, 200, responseBody);

  return {
    success: true,
    status_code: 200,
    body: responseBody,
    idempotent_replay: false,
  };
}
