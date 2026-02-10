/**
 * Impilo vNext v1.1 — TSHEPO PDP Types
 *
 * Types for the Policy Decision Point (PDP) per Tech Companion Spec §1.1.2.
 */

/**
 * PDP request subject — who is asking.
 */
export interface PDPSubject {
  user_id: string;
  roles: string[];
  facility_id?: string;
  assurance_level?: string;
}

/**
 * PDP request body — what is being asked.
 */
export interface PDPDecideRequest {
  subject: PDPSubject;
  action: string;
  resource: Record<string, unknown>;
  context: {
    tenant_id: string;
    pod_id: string;
    purpose_of_use?: string;
  };
}

/**
 * PDP obligation attached to a decision.
 */
export interface PDPObligation {
  type: string;
  level: string;
}

/**
 * PDP decision values.
 */
export type PDPDecisionValue = 'ALLOW' | 'DENY' | 'BREAK_GLASS_REQUIRED' | 'STEP_UP_REQUIRED';

/**
 * PDP response — the decision.
 */
export interface PDPDecideResponse {
  decision: PDPDecisionValue;
  policy_version: string;
  reason_codes: string[];
  obligations: PDPObligation[];
  ttl_seconds: number;
}
