/**
 * Impilo vNext v1.1 — Policy Decision Logger
 *
 * Reusable function for logging PDP decisions and other policy-gated
 * actions to the audit ledger. Used by TSHEPO PDP (Wave 3) and
 * by Class A endpoints.
 */

import type { AuditActor, AuditDecision, AuditRecordInput } from './types';
import { appendAuditRecord } from './ledger';

export interface PolicyDecisionInput {
  actor: AuditActor;
  action: string;
  resource: Record<string, unknown>;
  decision: AuditDecision;
  reason_codes: string[];
  policy_version: string | null;
  tenant_id: string;
  pod_id: string;
  request_id: string;
  correlation_id: string;
}

/**
 * Log a policy decision to the audit ledger.
 * Returns the appended audit record with hash chain.
 */
export async function logPolicyDecision(input: PolicyDecisionInput) {
  const record: AuditRecordInput = {
    audit_id: crypto.randomUUID(),
    tenant_id: input.tenant_id,
    pod_id: input.pod_id,
    occurred_at: new Date().toISOString(),
    request_id: input.request_id,
    correlation_id: input.correlation_id,
    actor: input.actor,
    action: input.action,
    decision: input.decision,
    reason_codes: input.reason_codes,
    policy_version: input.policy_version,
    resource: input.resource,
  };

  return appendAuditRecord(record);
}
