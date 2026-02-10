/**
 * Impilo vNext v1.1 — Offline Entitlement Issuer
 *
 * Issues offline entitlements after PDP ALLOW decision.
 * Every issuance:
 *  1. Validates PDP allows the requested scope
 *  2. Signs the entitlement with Ed25519
 *  3. Writes audit record (SYSTEM decision)
 *  4. Emits impilo.offline.entitlement.issued.v1 event
 *  5. Stores the entitlement record
 *  6. Returns signed JWT + entitlement_id + policy_version
 */

import type { KernelRequestContext } from '../types';
import type {
  EntitlementIssuanceRequest,
  EntitlementPayload,
  SignedEntitlement,
} from './types';
import { ENTITLEMENT_ERRORS } from './types';
import { decidePdp } from '../consistency/pdpClient';
import { logPolicyDecision } from '../audit/policyDecisionLogger';
import { signEntitlement, getActiveKid } from './crypto';
import { putEntitlement } from './store';
import { emitEntitlementIssued } from './events';

const MAX_VALIDITY_HOURS = 6;

/**
 * Issue an offline entitlement.
 *
 * @throws structured error if PDP denies or audit fails.
 */
export async function issueEntitlement(
  ctx: KernelRequestContext,
  request: EntitlementIssuanceRequest
): Promise<SignedEntitlement> {
  // 1. Validate request
  if (!request.device_id || !request.subject_id || !request.scope?.length) {
    throw {
      code: 'INVALID_REQUEST',
      status: 400,
      message: 'device_id, subject_id, and scope are required',
    };
  }

  // Validate time bounds
  const validFrom = new Date(request.valid_from);
  const validTo = new Date(request.valid_to);
  const maxMs = MAX_VALIDITY_HOURS * 60 * 60 * 1000;

  if (validTo.getTime() - validFrom.getTime() > maxMs) {
    throw {
      code: 'INVALID_REQUEST',
      status: 400,
      message: `Entitlement validity cannot exceed ${MAX_VALIDITY_HOURS} hours`,
    };
  }

  // 2. PDP check — each scope must be allowed
  const pdpResponse = await decidePdp({
    ctx,
    subject: {
      user_id: request.subject_id,
      roles: ['CLINICIAN'], // In production, resolved from token
      facility_id: request.constraints?.facility_id,
      assurance_level: 'aal2',
    },
    action: 'offline.entitlement.issue',
    resource: {
      device_id: request.device_id,
      scope: request.scope,
    },
    purposeOfUse: request.constraints?.purpose_of_use || 'TREATMENT',
  });

  if (pdpResponse.decision !== 'ALLOW') {
    throw {
      code: ENTITLEMENT_ERRORS.ENTITLEMENT_NOT_ALLOWED,
      status: 403,
      message: `PDP decision: ${pdpResponse.decision}`,
      details: {
        reason_codes: pdpResponse.reason_codes,
        policy_version: pdpResponse.policy_version,
      },
    };
  }

  // 3. Build entitlement payload
  const entitlementId = crypto.randomUUID();
  const kid = getActiveKid();
  const now = new Date().toISOString();

  const payload: EntitlementPayload = {
    entitlement_id: entitlementId,
    device_id: request.device_id,
    subject_id: request.subject_id,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    scope: request.scope,
    valid_from: request.valid_from,
    valid_to: request.valid_to,
    constraints: request.constraints || {},
    policy_version: pdpResponse.policy_version,
    kid,
    alg: 'Ed25519',
    issued_at: now,
  };

  // 4. Sign with Ed25519
  const entitlementJwt = await signEntitlement(payload);

  // 5. Audit record (mandatory — must succeed before response)
  try {
    await logPolicyDecision({
      actor: {
        subject_id: 'SYSTEM',
        roles: ['SYSTEM'],
      },
      action: 'offline.entitlement.issued',
      resource: {
        entitlement_id: entitlementId,
        device_id: request.device_id,
        subject_id: request.subject_id,
        scope: request.scope,
      },
      decision: 'SYSTEM',
      reason_codes: pdpResponse.reason_codes,
      policy_version: pdpResponse.policy_version,
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    });
  } catch (err) {
    throw {
      code: 'AUDIT_LEDGER_WRITE_FAILED',
      status: 500,
      message: 'Failed to write entitlement issuance to audit ledger',
    };
  }

  // 6. Store record (must persist before returning)
  putEntitlement({
    entitlement_id: entitlementId,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    device_id: request.device_id,
    subject_id: request.subject_id,
    scope: request.scope,
    valid_from: request.valid_from,
    valid_to: request.valid_to,
    constraints: request.constraints || {},
    policy_version: pdpResponse.policy_version,
    kid,
    alg: 'Ed25519',
    status: 'ACTIVE',
    issued_at: now,
  });

  // 7. Emit event
  await emitEntitlementIssued(ctx, payload);

  return {
    entitlement_jwt: entitlementJwt,
    entitlement_id: entitlementId,
    policy_version: pdpResponse.policy_version,
  };
}
