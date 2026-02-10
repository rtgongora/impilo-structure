/**
 * Impilo vNext v1.1 — PDP Client
 *
 * Calls TSHEPO /internal/v1/pdp/decide.
 * In the prototype, this calls the in-process pdpDecide() directly.
 * In production, this would be an HTTP call to the TSHEPO service.
 */

import type { KernelRequestContext } from '../types';
import type { PDPDecideRequest, PDPDecideResponse, PDPSubject } from '../tshepo/types';
import { pdpDecide } from '../tshepo/pdpService';

export interface DecidePdpInput {
  ctx: KernelRequestContext;
  subject: PDPSubject;
  action: string;
  resource: Record<string, unknown>;
  purposeOfUse?: string;
}

/**
 * Call PDP and return the decision.
 * @throws structured error if PDP is unavailable or audit fails.
 */
export async function decidePdp(input: DecidePdpInput): Promise<PDPDecideResponse> {
  const request: PDPDecideRequest = {
    subject: input.subject,
    action: input.action,
    resource: input.resource,
    context: {
      tenant_id: input.ctx.tenantId,
      pod_id: input.ctx.podId,
      purpose_of_use: input.purposeOfUse,
    },
  };

  try {
    return await pdpDecide(input.ctx, request);
  } catch (err: any) {
    // If it's already a structured error (from audit failure), rethrow
    if (err?.code === 'AUDIT_LEDGER_WRITE_FAILED') {
      throw err;
    }
    // PDP unavailable
    throw {
      code: 'PDP_UNAVAILABLE',
      status: 503,
      message: 'Policy Decision Point is unavailable',
      details: { original_error: err?.message },
    };
  }
}
