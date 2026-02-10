/**
 * Impilo vNext v1.1 — TSHEPO PDP Rule Engine (Prototype)
 *
 * Deterministic policy evaluator for the prototype.
 * Production: replaced by OPA/Cedar policy engine.
 *
 * Rule set (Wave 3 minimal):
 * 1. Missing/invalid assurance_level → STEP_UP_REQUIRED
 * 2. Finance/tariff actions → require FINANCE_ADMIN or REGISTRY_ADMIN
 * 3. Controlled substance actions → require PHARMACIST or CLINICIAN_SENIOR
 * 4. Otherwise → ALLOW
 */

import type { PDPDecideRequest, PDPDecideResponse, PDPDecisionValue, PDPObligation } from './types';

const POLICY_VERSION = '2026-02-08.1';
const VALID_ASSURANCE_LEVELS = ['aal1', 'aal2', 'aal3'];

export function evaluatePolicy(req: PDPDecideRequest): PDPDecideResponse {
  const reasonCodes: string[] = [];
  let decision: PDPDecisionValue = 'ALLOW';
  const obligations: PDPObligation[] = [{ type: 'AUDIT', level: 'MANDATORY' }];

  // --- Validation ---
  if (!req.subject?.user_id) {
    return deny('SUBJECT_MISSING', obligations);
  }
  if (!req.action) {
    return deny('ACTION_MISSING', obligations);
  }
  if (!req.context?.tenant_id || !req.context?.pod_id) {
    return deny('CONTEXT_INCOMPLETE', obligations);
  }

  // --- Rule 1: Assurance level ---
  const aal = req.subject.assurance_level;
  if (!aal || !VALID_ASSURANCE_LEVELS.includes(aal)) {
    return {
      decision: 'STEP_UP_REQUIRED',
      policy_version: POLICY_VERSION,
      reason_codes: ['ASSURANCE_LEVEL_INSUFFICIENT'],
      obligations,
      ttl_seconds: 0,
    };
  }

  // --- Rule 2: Finance / tariff actions ---
  const actionLower = req.action.toLowerCase();
  if (actionLower.startsWith('finance.') || actionLower.includes('tariff')) {
    const roles = req.subject.roles.map(r => r.toUpperCase());
    if (!roles.includes('FINANCE_ADMIN') && !roles.includes('REGISTRY_ADMIN')) {
      return deny('ROLE_MISSING', obligations);
    }
    reasonCodes.push('FINANCE_PRIVILEGE_OK');
  }

  // --- Rule 3: Controlled substance ---
  if (actionLower.includes('controlled_substance')) {
    const roles = req.subject.roles.map(r => r.toUpperCase());
    if (!roles.includes('PHARMACIST') && !roles.includes('CLINICIAN_SENIOR')) {
      return deny('CONTROLLED_SUBSTANCE_PRIVILEGE_MISSING', obligations);
    }
    reasonCodes.push('CONTROLLED_SUBSTANCE_PRIVILEGE_OK');
  }

  // --- Default: ALLOW ---
  reasonCodes.push('CONSENT_OK', 'PRIVILEGE_OK');

  return {
    decision: 'ALLOW',
    policy_version: POLICY_VERSION,
    reason_codes: reasonCodes,
    obligations,
    ttl_seconds: 30,
  };
}

function deny(reason: string, obligations: PDPObligation[]): PDPDecideResponse {
  return {
    decision: 'DENY',
    policy_version: POLICY_VERSION,
    reason_codes: [reason],
    obligations,
    ttl_seconds: 0,
  };
}
