/**
 * Impilo vNext v1.1 — Offline Entitlement Types
 *
 * Per Tech Companion Spec §1.1.3 + Manifest v1.1 Law 7.
 * Entitlements are time-bounded, scope-bounded, device-bound, and auditable.
 */

/**
 * Supported offline action scopes.
 */
export type OfflineScope =
  | 'clinical.capture.vitals'
  | 'clinical.capture.notes'
  | 'clinical.read.timeline'
  | 'clinical.create.encounter_shell'
  | 'clinical.upload.doc_metadata'
  | string; // extensible

/**
 * Entitlement constraints that bind usage context.
 */
export interface EntitlementConstraints {
  facility_id?: string;
  purpose_of_use?: string;
  patient_cpid_allowlist?: string[];
}

/**
 * Request body for POST /internal/v1/offline/entitlements.
 */
export interface EntitlementIssuanceRequest {
  device_id: string;
  subject_id: string;
  scope: OfflineScope[];
  valid_from: string; // RFC3339
  valid_to: string;   // RFC3339
  constraints?: EntitlementConstraints;
}

/**
 * Internal entitlement payload (signed content).
 */
export interface EntitlementPayload {
  entitlement_id: string;
  device_id: string;
  subject_id: string;
  tenant_id: string;
  pod_id: string;
  scope: OfflineScope[];
  valid_from: string;
  valid_to: string;
  constraints: EntitlementConstraints;
  policy_version: string;
  kid: string; // signing key ID
  issued_at: string;
}

/**
 * Signed entitlement token (prototype: base64-encoded JSON + signature).
 * Production: JWT signed by HSM/KMS.
 */
export interface SignedEntitlement {
  entitlement_jwt: string;
  entitlement_id: string;
  policy_version: string;
}

/**
 * Stored entitlement record.
 */
export interface EntitlementRecord {
  entitlement_id: string;
  tenant_id: string;
  pod_id: string;
  device_id: string;
  subject_id: string;
  scope: OfflineScope[];
  valid_from: string;
  valid_to: string;
  constraints: EntitlementConstraints;
  policy_version: string;
  kid: string;
  status: 'ACTIVE' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
  issued_at: string;
  consumed_at?: string;
  revoked_at?: string;
}

/**
 * Result of offline entitlement verification.
 */
export interface EntitlementVerificationResult {
  valid: boolean;
  entitlement_id: string;
  reason?: string;
  payload?: EntitlementPayload;
}

/**
 * Offline entitlement error codes.
 */
export const ENTITLEMENT_ERRORS = {
  ENTITLEMENT_NOT_ALLOWED: 'ENTITLEMENT_NOT_ALLOWED',
  DEVICE_NOT_TRUSTED: 'DEVICE_NOT_TRUSTED',
  ENTITLEMENT_EXPIRED: 'ENTITLEMENT_EXPIRED',
  ENTITLEMENT_REVOKED: 'ENTITLEMENT_REVOKED',
  ENTITLEMENT_SCOPE_MISMATCH: 'ENTITLEMENT_SCOPE_MISMATCH',
  ENTITLEMENT_SIGNATURE_INVALID: 'ENTITLEMENT_SIGNATURE_INVALID',
  ENTITLEMENT_KID_UNKNOWN: 'ENTITLEMENT_KID_UNKNOWN',
  ENTITLEMENT_CONSTRAINT_VIOLATION: 'ENTITLEMENT_CONSTRAINT_VIOLATION',
} as const;

export type EntitlementErrorCode = typeof ENTITLEMENT_ERRORS[keyof typeof ENTITLEMENT_ERRORS];
