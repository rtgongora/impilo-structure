/**
 * Impilo vNext v1.1 — MSIKA Tariff Update Command
 *
 * PUT /internal/v1/tariffs/{tariff_id}
 *
 * Class A endpoint: requires synchronous PDP ALLOW before commit.
 * Integrates: Class A enforcer → idempotency → domain logic → eventing → audit.
 */

import type { KernelRequestContext } from '../types';
import type { AuditActor } from '../audit/types';
import type { PDPSubject } from '../tshepo/types';
import type { ImpiloDeltaPayload, ImpiloEventEnvelopeV11 } from '../events/types';
import { enforceClassAOrThrow } from '../consistency/classAEnforcer';
import { requireIdempotencyKey, checkIdempotency, storeIdempotencyResult } from '../idempotency';
import { logPolicyDecision } from '../audit/policyDecisionLogger';
import { emitWithPolicy } from '../events/emitter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TariffUpdateRequest {
  tariff_id: string;
  product_id: string;
  currency: string;
  amount: number;
  effective_from: string; // ISO date
  description?: string;
}

export interface MsikaCommandResult {
  success: boolean;
  status_code: number;
  body: unknown;
  idempotent_replay: boolean;
}

// ---------------------------------------------------------------------------
// In-memory tariff store (prototype)
// ---------------------------------------------------------------------------

const tariffStore = new Map<string, TariffUpdateRequest & { updated_at: string }>();

export function getTariff(tariffId: string) {
  return tariffStore.get(tariffId) ?? null;
}

export function clearTariffStore() {
  tariffStore.clear();
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

/**
 * Execute MSIKA tariff update with Class A PDP enforcement.
 */
export async function msikaTariffUpdate(
  ctx: KernelRequestContext,
  idempotencyKey: string | null | undefined,
  request: TariffUpdateRequest,
  actor: AuditActor & { assurance_level?: string }
): Promise<MsikaCommandResult> {
  // 1. Require idempotency key
  const key = requireIdempotencyKey(idempotencyKey);

  const route = `PUT /internal/v1/tariffs/${request.tariff_id}`;

  // 2. Check idempotency first (avoid redundant PDP calls for replays)
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

  // 3. CLASS A: Enforce PDP ALLOW before commit
  const subject: PDPSubject = {
    user_id: actor.subject_id,
    roles: actor.roles,
    facility_id: actor.facility_id,
    assurance_level: actor.assurance_level,
  };

  const pdpResult = await enforceClassAOrThrow({
    ctx,
    subject,
    action: 'finance.msika.tariff.update',
    resource: {
      tariff_id: request.tariff_id,
      product_id: request.product_id,
      currency: request.currency,
      amount: request.amount,
      effective_from: request.effective_from,
    },
    purposeOfUse: 'ADMINISTRATION',
  });

  // 4. Domain validation
  const today = new Date().toISOString().split('T')[0];
  if (request.effective_from < today) {
    return {
      success: false,
      status_code: 400,
      body: {
        error: {
          code: 'INVALID_TARIFF',
          message: 'effective_from cannot be in the past',
          details: { effective_from: request.effective_from, today },
          request_id: ctx.requestId,
          correlation_id: ctx.correlationId,
        },
      },
      idempotent_replay: false,
    };
  }

  // Check for effective date conflicts
  const existing = tariffStore.get(request.tariff_id);
  if (existing && existing.effective_from === request.effective_from && existing.amount !== request.amount) {
    return {
      success: false,
      status_code: 409,
      body: {
        error: {
          code: 'EFFECTIVE_DATE_CONFLICT',
          message: 'Tariff already has a different rate for this effective date',
          details: {
            tariff_id: request.tariff_id,
            effective_from: request.effective_from,
            existing_amount: existing.amount,
            requested_amount: request.amount,
          },
          request_id: ctx.requestId,
          correlation_id: ctx.correlationId,
        },
      },
      idempotent_replay: false,
    };
  }

  // 5. Commit (prototype: in-memory)
  const previousState = existing ? { ...existing } : null;
  const now = new Date().toISOString();
  tariffStore.set(request.tariff_id, { ...request, updated_at: now });

  const responseBody = {
    tariff_id: request.tariff_id,
    product_id: request.product_id,
    currency: request.currency,
    amount: request.amount,
    effective_from: request.effective_from,
    updated_at: now,
  };

  // 6. Emit v1.1 delta event
  const payload: ImpiloDeltaPayload = {
    op: previousState ? 'UPDATE' : 'CREATE',
    before: previousState ? { ...previousState } : null,
    after: { ...responseBody },
    changed_fields: previousState
      ? Object.keys(request).filter(k => (previousState as any)[k] !== (request as any)[k])
      : ['*'],
  };

  const envelope: ImpiloEventEnvelopeV11 = {
    event_id: crypto.randomUUID(),
    event_type: 'impilo.msika.tariff.updated.v1',
    schema_version: 1,
    correlation_id: ctx.correlationId,
    causation_id: null,
    idempotency_key: key,
    producer: 'msika',
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    occurred_at: now,
    emitted_at: new Date().toISOString(),
    subject_type: 'tariff',
    subject_id: request.tariff_id,
    payload,
    meta: {
      partition_key: request.tariff_id,
      policy_version: pdpResult.policy_version,
    },
  };

  await emitWithPolicy({ v11: envelope });

  // 7. Audit — service-level commit record
  await logPolicyDecision({
    actor,
    action: 'msika.tariff.update',
    resource: {
      tariff_id: request.tariff_id,
      product_id: request.product_id,
      amount: request.amount,
      currency: request.currency,
      effective_from: request.effective_from,
    },
    decision: 'ALLOW',
    reason_codes: [...pdpResult.reason_codes, 'COMMIT_OK'],
    policy_version: pdpResult.policy_version,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
  });

  // 8. Store idempotency record
  await storeIdempotencyResult(key, ctx, route, request, 200, responseBody);

  return {
    success: true,
    status_code: 200,
    body: responseBody,
    idempotent_replay: false,
  };
}
