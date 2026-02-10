/**
 * Impilo vNext v1.1 — Offline Entitlement Lifecycle
 *
 * Revocation + Consumption transitions with audit + events.
 * Both operations are idempotent.
 */

import type { KernelRequestContext } from '../types';
import { ENTITLEMENT_ERRORS } from './types';
import { getEntitlement, updateEntitlementStatus } from './store';
import { logPolicyDecision } from '../audit/policyDecisionLogger';
import { emitEntitlementRevoked, emitEntitlementConsumed } from './events';

/**
 * Revoke an entitlement. Idempotent: revoking an already-revoked entitlement is a no-op.
 *
 * @throws structured error if entitlement not found.
 */
export async function revokeEntitlement(
  ctx: KernelRequestContext,
  entitlementId: string,
  reason: string
): Promise<{ already_revoked: boolean }> {
  const record = getEntitlement(entitlementId);
  if (!record) {
    throw {
      code: ENTITLEMENT_ERRORS.ENTITLEMENT_NOT_FOUND,
      status: 404,
      message: `Entitlement ${entitlementId} not found`,
    };
  }

  // Idempotent: already revoked
  if (record.status === 'REVOKED') {
    return { already_revoked: true };
  }

  const now = new Date().toISOString();
  updateEntitlementStatus(entitlementId, 'REVOKED', { revoked_at: now });

  // Audit
  await logPolicyDecision({
    actor: { subject_id: 'SYSTEM', roles: ['SYSTEM'] },
    action: 'offline.entitlement.revoked',
    resource: {
      entitlement_id: entitlementId,
      subject_id: record.subject_id,
      reason,
    },
    decision: 'SYSTEM',
    reason_codes: [reason],
    policy_version: record.policy_version,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
  });

  // Event
  await emitEntitlementRevoked(ctx, entitlementId, record.subject_id, reason);

  return { already_revoked: false };
}

/**
 * Consume an entitlement. Idempotent: consuming an already-consumed entitlement
 * returns { already_consumed: true } without error.
 *
 * @throws structured error if entitlement not found or revoked.
 */
export async function consumeEntitlement(
  ctx: KernelRequestContext,
  entitlementId: string,
  consumeContext?: { action?: string }
): Promise<{ already_consumed: boolean }> {
  const record = getEntitlement(entitlementId);
  if (!record) {
    throw {
      code: ENTITLEMENT_ERRORS.ENTITLEMENT_NOT_FOUND,
      status: 404,
      message: `Entitlement ${entitlementId} not found`,
    };
  }

  // Revoked entitlement cannot be consumed
  if (record.status === 'REVOKED') {
    throw {
      code: ENTITLEMENT_ERRORS.ENTITLEMENT_REVOKED,
      status: 403,
      message: 'Cannot consume a revoked entitlement',
    };
  }

  // Idempotent: already consumed
  if (record.status === 'CONSUMED') {
    return { already_consumed: true };
  }

  const now = new Date().toISOString();
  const action = consumeContext?.action || 'consume';
  updateEntitlementStatus(entitlementId, 'CONSUMED', { consumed_at: now });

  // Audit
  await logPolicyDecision({
    actor: { subject_id: 'SYSTEM', roles: ['SYSTEM'] },
    action: 'offline.entitlement.consumed',
    resource: {
      entitlement_id: entitlementId,
      subject_id: record.subject_id,
      action_performed: action,
    },
    decision: 'SYSTEM',
    reason_codes: ['CONSUMED'],
    policy_version: record.policy_version,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
  });

  // Event
  await emitEntitlementConsumed(ctx, entitlementId, record.subject_id, action);

  return { already_consumed: false };
}
