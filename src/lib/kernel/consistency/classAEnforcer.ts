/**
 * Impilo vNext v1.1 — Class A Consistency Enforcer
 *
 * Synchronous PDP enforcement for Class A endpoints.
 * Must be called BEFORE any commit/write operation.
 *
 * Decision mapping:
 *   ALLOW               → return decision context
 *   DENY                → throw 403 POLICY_DENY
 *   STEP_UP_REQUIRED    → throw 412 STEP_UP_REQUIRED
 *   BREAK_GLASS_REQUIRED → throw 403 BREAK_GLASS_REQUIRED
 *   PDP unreachable     → throw 503 PDP_UNAVAILABLE
 */

import type { KernelRequestContext } from '../types';
import type { PDPSubject, PDPDecideResponse } from '../tshepo/types';
import { decidePdp } from './pdpClient';

export interface ClassAEnforcementInput {
  ctx: KernelRequestContext;
  subject: PDPSubject;
  action: string;
  resource: Record<string, unknown>;
  purposeOfUse?: string;
}

export interface ClassAEnforcementResult {
  policy_version: string;
  reason_codes: string[];
  ttl_seconds: number;
}

/**
 * Enforce Class A synchronous truth.
 * @throws structured error if decision is not ALLOW.
 */
export async function enforceClassAOrThrow(
  input: ClassAEnforcementInput
): Promise<ClassAEnforcementResult> {
  const response: PDPDecideResponse = await decidePdp({
    ctx: input.ctx,
    subject: input.subject,
    action: input.action,
    resource: input.resource,
    purposeOfUse: input.purposeOfUse,
  });

  switch (response.decision) {
    case 'ALLOW':
      return {
        policy_version: response.policy_version,
        reason_codes: response.reason_codes,
        ttl_seconds: response.ttl_seconds,
      };

    case 'DENY':
      throw {
        code: 'POLICY_DENY',
        status: 403,
        message: 'Policy decision: DENY',
        details: {
          reason_codes: response.reason_codes,
          policy_version: response.policy_version,
        },
      };

    case 'STEP_UP_REQUIRED':
      throw {
        code: 'STEP_UP_REQUIRED',
        status: 412,
        message: 'Step-up authentication required before this action can proceed',
        details: {
          reason_codes: response.reason_codes,
          policy_version: response.policy_version,
        },
      };

    case 'BREAK_GLASS_REQUIRED':
      throw {
        code: 'BREAK_GLASS_REQUIRED',
        status: 403,
        message: 'Break-glass authorization required. Prototype does not implement break-glass flow.',
        details: {
          reason_codes: response.reason_codes,
          policy_version: response.policy_version,
        },
      };

    default:
      throw {
        code: 'PDP_UNAVAILABLE',
        status: 503,
        message: `Unexpected PDP decision: ${response.decision}`,
      };
  }
}
