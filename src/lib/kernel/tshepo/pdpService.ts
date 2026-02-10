/**
 * Impilo vNext v1.1 — TSHEPO PDP Service
 *
 * POST /internal/v1/pdp/decide
 *
 * Evaluates policy, writes audit, returns decision.
 * If audit write fails → 500 AUDIT_LEDGER_WRITE_FAILED (no decision returned).
 */

import type { KernelRequestContext } from '../types';
import type { PDPDecideRequest, PDPDecideResponse } from './types';
import type { AuditDecision } from '../audit/types';
import { evaluatePolicy } from './pdpEngine';
import { logPolicyDecision } from '../audit/policyDecisionLogger';

/**
 * Map PDP decision to audit decision.
 */
function toAuditDecision(d: string): AuditDecision {
  if (d === 'ALLOW') return 'ALLOW';
  return 'DENY'; // DENY, STEP_UP_REQUIRED, BREAK_GLASS_REQUIRED all map to DENY
}

/**
 * Execute a PDP decide request with mandatory audit logging.
 *
 * @throws Error with code AUDIT_LEDGER_WRITE_FAILED if audit fails.
 */
export async function pdpDecide(
  ctx: KernelRequestContext,
  request: PDPDecideRequest
): Promise<PDPDecideResponse> {
  // 1. Evaluate policy
  const response = evaluatePolicy(request);

  // 2. Mandatory audit logging — must succeed before returning decision
  try {
    await logPolicyDecision({
      actor: {
        subject_id: request.subject.user_id,
        roles: request.subject.roles,
        facility_id: request.subject.facility_id,
        assurance_level: request.subject.assurance_level,
      },
      action: 'tshepo.pdp.decide',
      resource: {
        ...request.resource,
        requested_action: request.action,
        purpose_of_use: request.context.purpose_of_use,
      },
      decision: toAuditDecision(response.decision),
      reason_codes: response.reason_codes,
      policy_version: response.policy_version,
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    });
  } catch (err) {
    console.error('[TSHEPO] Audit ledger write failed for PDP decision:', err);
    throw {
      code: 'AUDIT_LEDGER_WRITE_FAILED',
      status: 500,
      message: 'Failed to write PDP decision to audit ledger',
    };
  }

  return response;
}
