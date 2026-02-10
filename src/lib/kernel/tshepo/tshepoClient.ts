/**
 * TSHEPO Client SDK — React hooks + helpers for calling TSHEPO Trust Layer
 * 
 * This is the frontend SDK that mirrors the Java tshepo-sdk library.
 * It provides typed helpers for all TSHEPO endpoints.
 */

import { invokeKernelFunction } from '@/lib/kernel/kernelClient';

// ---------------------------------------------------------------------------
// Types (mirrors TSHEPO API contracts)
// ---------------------------------------------------------------------------

export interface AuthzDecideRequest {
  action: string;
  resource?: { type?: string; id?: string };
  roles: string[];
  assurance_level: string;
  patient_cpid?: string;
}

export interface AuthzDecideResponse {
  decision: 'ALLOW' | 'DENY' | 'STEP_UP_REQUIRED' | 'BREAK_GLASS_REQUIRED';
  policy_version: string;
  reason_codes: string[];
  obligations: Array<{ type: string; level: string }>;
  ttl_seconds: number;
  consent?: { evaluated: boolean; decision?: string };
}

export interface ConsentRecord {
  id: string;
  tenant_id: string;
  fhir_id: string;
  fhir_resource: Record<string, unknown>;
  status: string;
  scope_code: string;
  patient_cpid: string;
  grantor_type: string;
  grantor_ref: string;
  grantee_type: string | null;
  grantee_ref: string | null;
  purpose_of_use: string[];
  action_codes: string[];
  data_classes: string[];
  period_start: string | null;
  period_end: string | null;
  provision_type: string;
  delegation_allowed: boolean;
  version: number;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  audit_id: string;
  tenant_id: string;
  pod_id: string;
  chain_sequence: number;
  occurred_at: string;
  request_id: string;
  correlation_id: string;
  actor_id: string;
  actor_type: string;
  actor_roles: string[];
  action: string;
  decision: string;
  reason_codes: string[];
  policy_version: string | null;
  resource_type: string | null;
  resource_id: string | null;
  prev_hash: string | null;
  record_hash: string;
}

export interface BreakGlassRequest {
  patient_cpid: string;
  justification: string;
  emergency_type?: string;
  step_up_method?: string;
  assurance_level: string;
}

export interface BreakGlassResponse {
  break_glass_id: string;
  elevated_token: string;
  scope: Record<string, unknown>;
  expires_at: string;
  review_status: string;
}

export interface PatientAccessEntry {
  occurred_at: string;
  accessor_type: string;
  accessor_role: string | null;
  facility_ref: string | null;
  action: string;
  purpose_of_use: string | null;
  resource_type: string | null;
  decision: string;
  is_break_glass: boolean;
  is_redacted: boolean;
}

export interface OfflineTokenResponse {
  token_hash: string;
  facility_id: string;
  scope: Record<string, unknown>;
  max_actions: number;
  expires_at: string;
  constraints: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/** POST /authz/decide — Default-deny PDP */
export async function tshepoAuthzDecide(req: AuthzDecideRequest) {
  return invokeKernelFunction<AuthzDecideResponse>('tshepo', {
    body: req as unknown as Record<string, unknown>,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** GET /consents — List consents */
export async function tshepoListConsents(params: { patient_cpid?: string; status?: string; page?: number; limit?: number }) {
  // Edge functions don't support query params easily, so we POST with a list action
  return invokeKernelFunction<{ consents: ConsentRecord[]; total: number }>('tshepo', {
    body: { _route: '/consents', _method: 'GET', ...params },
  });
}

/** POST /consents — Create consent */
export async function tshepoCreateConsent(consent: Partial<ConsentRecord>) {
  return invokeKernelFunction<{ consent: ConsentRecord }>('tshepo', {
    body: { _route: '/consents', ...consent },
  });
}

/** POST /breakglass/request */
export async function tshepoBreakGlassRequest(req: BreakGlassRequest) {
  return invokeKernelFunction<BreakGlassResponse>('tshepo', {
    body: req as unknown as Record<string, unknown>,
  });
}

/** POST /breakglass/review */
export async function tshepoBreakGlassReview(breakGlassId: string, outcome: string, notes?: string) {
  return invokeKernelFunction<{ break_glass_id: string; outcome: string }>('tshepo', {
    body: { break_glass_id: breakGlassId, outcome, notes },
  });
}

/** GET /audit/query */
export async function tshepoAuditQuery(params: { actor_id?: string; action?: string; decision?: string; page?: number; limit?: number }) {
  return invokeKernelFunction<{ records: AuditEntry[]; total: number }>('tshepo', {
    body: { _route: '/audit/query', _method: 'GET', ...params },
  });
}

/** GET /portal/access-history */
export async function tshepoAccessHistory(patientCpid: string, page = 1, limit = 20) {
  return invokeKernelFunction<{ entries: PatientAccessEntry[]; total: number }>('tshepo', {
    body: { _route: '/portal/access-history', _method: 'GET', patient_cpid: patientCpid, page, limit },
  });
}

/** POST /offline/token */
export async function tshepoIssueOfflineToken(facilityId: string, ttlMinutes = 120) {
  return invokeKernelFunction<OfflineTokenResponse>('tshepo', {
    body: { facility_id: facilityId, ttl_minutes: ttlMinutes },
  });
}

/** POST /identity/resolve */
export async function tshepoResolveIdentity(impiloIdHash: string) {
  return invokeKernelFunction<{ health_id: string; cpid: string; crid: string; status: string }>('tshepo', {
    body: { impilo_id_hash: impiloIdHash },
  });
}

/** GET /keys/jwks */
export async function tshepoGetJWKS() {
  return invokeKernelFunction<{ keys: Array<{ kid: string; kty: string; crv: string; use: string }> }>('tshepo', {
    body: { _route: '/keys/jwks', _method: 'GET' },
  });
}
