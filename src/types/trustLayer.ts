/**
 * Impilo Trust Layer Types
 * 
 * Comprehensive type definitions for the Trust Layer architecture implementing:
 * - TL-ID: Identity Resolution & Tokenisation
 * - TL-AUTH: Authentication & Session Assurance
 * - TL-AUTHZ: Authorization & Policy Enforcement
 * - TL-CONS: Consent & Preference Management
 * - TL-AUD: Provenance, Audit & Non-Repudiation
 * - TL-OFF: Offline Trust Controls
 * - TL-KEY: Service-to-Service Trust & Keys
 * - TL-MOS: MOSIP as Indirect Link to National ID
 */

// ============================================
// IDENTITY RESOLUTION (TL-ID)
// ============================================

export interface TrustLayerIdentity {
  healthId: string;           // Internal health-domain identifier (never exposed downstream)
  impiloId: string;           // Memorable patient-facing alias
  memorablePhid: string;      // DDDSDDDX format for easy recall
  crid: string;               // Client Registry ID (never in SHR)
  cpid: string;               // Clinical Pseudonym (never in CR)
  status: IdentityStatus;
  version: number;
  issuedAt: string;
  issuedBy?: string;
  issuedAtFacilityId?: string;
}

export type IdentityStatus = 'active' | 'rotated' | 'suspended' | 'merged';

export interface IdentityResolutionRequest {
  impiloId: string;
  scope: 'clinical' | 'registry';
  requesterId: string;
  requesterFacilityId?: string;
  purpose: PurposeOfUse;
}

export interface IdentityResolutionResult {
  success: boolean;
  identifier?: string;        // CPID for clinical, CRID for registry
  status?: IdentityStatus;
  consentActive?: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface OfflineCpid {
  oCpid: string;
  generatingDeviceId: string;
  generatingFacilityId?: string;
  generatingUserId?: string;
  status: 'provisional' | 'reconciled' | 'merged' | 'rejected';
  reconciledToHealthId?: string;
  reconciledToCpid?: string;
  mergeConfidence?: number;
  generatedAt: string;
}

export interface AliasRotation {
  healthId: string;
  aliasType: 'impilo_id' | 'cpid' | 'memorable_phid';
  oldValue: string;
  newValue: string;
  rotationReason: string;
  rotatedBy: string;
  expiresAt?: string;
}

// ============================================
// AUTHENTICATION (TL-AUTH)
// ============================================

export type AuthProvider = 'keycloak' | 'esignet';

export interface TrustLayerSession {
  sessionId: string;
  userId: string;
  authProvider: AuthProvider;
  deviceId?: string;
  facilityId?: string;
  workspaceId?: string;
  assuranceLevel: AssuranceLevel;
  mfaVerified: boolean;
  issuedAt: string;
  expiresAt: string;
  isOffline: boolean;
}

export type AssuranceLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface DeviceRegistration {
  id: string;
  deviceFingerprint: string;
  userId: string;
  deviceName?: string;
  deviceType: 'workstation' | 'mobile' | 'tablet' | 'kiosk' | 'other';
  trustLevel: 'unknown' | 'recognized' | 'trusted' | 'managed';
  isTrusted: boolean;
  boundToFacilityId?: string;
  boundToWorkspaceId?: string;
  requiresMfa: boolean;
  lastUsedAt?: string;
}

export interface OfflineToken {
  tokenHash: string;
  userId: string;
  deviceId?: string;
  facilityId?: string;
  workspaceId?: string;
  grantedRoles: string[];
  grantedPrivileges: string[];
  issuedAt: string;
  expiresAt: string;
  maxOfflineDurationHours: number;
  canCacheIdentityMappings: boolean;
  identityCacheTtlHours: number;
  status: 'active' | 'expired' | 'revoked' | 'used';
}

// ============================================
// AUTHORIZATION (TL-AUTHZ)
// ============================================

export type PurposeOfUse = 
  | 'treatment'           // TPO baseline
  | 'payment'             // TPO
  | 'operations'          // TPO
  | 'referral'            // Inter-facility referral
  | 'care_coordination'   // Multi-provider coordination
  | 'emergency'           // Break-glass
  | 'quality_review'      // Quality assurance
  | 'research'            // IRB-approved research
  | 'audit'               // Compliance audit
  | 'legal'               // Legal requirement
  | 'patient_request';    // Patient-initiated

export interface PolicyDecisionRequest {
  userId: string;
  providerUpid?: string;
  subjectCpid?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  facilityId?: string;
  workspaceId?: string;
  purpose: PurposeOfUse;
  dataClasses?: string[];
  sensitivityTags?: string[];
}

export interface PolicyDecisionResult {
  allowed: boolean;
  denialReasons: string[];
  appliedPolicies: string[];
  consentRequired: boolean;
  consentSatisfied: boolean;
  breakGlassAvailable: boolean;
  auditLogId?: string;
}

export interface TrustLayerPolicy {
  id: string;
  policyId: string;
  policyName: string;
  policyVersion: string;
  policyType: 'access_control' | 'consent_enforcement' | 'break_glass' | 'data_classification' | 'audit' | 'offline';
  attributes: Record<string, unknown>;
  conditions: Record<string, unknown>;
  actions: string[];
  effect: 'permit' | 'deny';
  appliesToRoles?: string[];
  appliesToFacilities?: string[];
  appliesToDataClasses?: string[];
  priority: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  rationale?: string;
  regulatoryReference?: string;
}

export interface BreakGlassRequest {
  userId: string;
  subjectCpid: string;
  justification: string;
  emergencyType: 'life_threatening' | 'urgent_care' | 'patient_unresponsive' | 'system_emergency' | 'other';
  facilityId?: string;
  workspaceId?: string;
  expiresInHours?: number;
}

export interface BreakGlassAccess {
  id: string;
  userId: string;
  providerUpid?: string;
  subjectCpid: string;
  justification: string;
  emergencyType: string;
  accessedDataClasses?: string[];
  accessScope: 'full' | 'limited' | 'minimal';
  accessStartedAt: string;
  accessExpiresAt: string;
  accessEndedAt?: string;
  reviewStatus: 'pending' | 'in_review' | 'approved' | 'flagged' | 'violation';
  reviewedBy?: string;
  reviewNotes?: string;
}

// ============================================
// CONSENT MANAGEMENT (TL-CONS)
// ============================================

export type ConsentType =
  | 'care_team_access'        // TPO baseline
  | 'cross_facility_sharing'  // Inter-facility
  | 'referral_sharing'        // Referral package
  | 'telehealth'              // Telemedicine sessions
  | 'sensitive_data_hiv'      // HIV segmentation
  | 'sensitive_data_srh'      // Sexual/reproductive health
  | 'sensitive_data_mh'       // Mental health
  | 'delegate_access'         // Guardian/proxy access
  | 'research_analytics'      // Optional research opt-in
  | 'data_export'             // Patient data export
  | 'emergency_override';     // Pre-consent for emergency access

export type ConsentStatus = 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error';

export interface TrustLayerConsent {
  id: string;
  consentId: string;
  subjectCpid: string;
  consentType: ConsentType;
  scopeFacilityIds?: string[];
  scopeProviderUpids?: string[];
  scopeRoles?: string[];
  purposeOfUse: PurposeOfUse[];
  status: ConsentStatus;
  periodStart: string;
  periodEnd?: string;
  dataClasses?: string[];
  dataSensitivityTags?: string[];
  provisionType: 'permit' | 'deny';
  provisionRules?: Record<string, unknown>;
  verificationMethod?: string;
  patientAcknowledgedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  fhirResource?: object;
  version: number;
  createdAt: string;
  createdBy?: string;
}

export interface ConsentDelegation {
  id: string;
  consentId: string;
  delegateCpid?: string;
  delegateUpid?: string;
  delegateType: 'guardian' | 'proxy' | 'legal_representative' | 'caregiver' | 'next_of_kin';
  delegatedActions: ('view' | 'share' | 'export' | 'manage')[];
  delegationConstraints?: Record<string, unknown>;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  verifiedBy?: string;
  verificationMethod?: string;
  legalDocumentReference?: string;
}

export interface ConsentCheckRequest {
  subjectCpid: string;
  requesterUpid: string;
  purpose: PurposeOfUse;
  facilityId?: string;
  dataClasses?: string[];
  sensitivityTags?: string[];
}

export interface ConsentCheckResult {
  hasConsent: boolean;
  consentId?: string;
  consentType?: ConsentType;
  expiresAt?: string;
  restrictions?: string[];
  denialReason?: string;
}

// ============================================
// AUDIT & PROVENANCE (TL-AUD)
// ============================================

export type AuditEventCategory =
  | 'authentication'
  | 'authorization'
  | 'identity_resolution'
  | 'consent'
  | 'break_glass'
  | 'export'
  | 'disclosure'
  | 'roster'
  | 'offline'
  | 'key_management';

export type AuditEventOutcome = 'success' | 'failure' | 'error' | 'partial';

export interface TrustLayerAuditLog {
  id: string;
  eventCategory: AuditEventCategory;
  eventType: string;
  eventOutcome: AuditEventOutcome;
  userId?: string;
  userEmail?: string;
  providerUpid?: string;
  userRole?: string;
  userIpAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  subjectCpid?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  facilityId?: string;
  workspaceId?: string;
  purposeOfUse?: string;
  assuranceLevel?: string;
  requestMetadata?: Record<string, unknown>;
  responseCode?: string;
  errorMessage?: string;
  consentId?: string;
  consentVersion?: number;
  sourceSystem?: string;
  correlationId?: string;
  createdAt: string;
}

export interface PatientAccessHistory {
  id: string;
  subjectCpid: string;
  accessorRole: string;
  accessorFacilityName?: string;
  accessorDepartment?: string;
  purposeOfUse: string;
  dataAccessedSummary?: string;
  accessTimestamp: string;
  showAccessorName: boolean;
  accessorName?: string;
}

// ============================================
// MOSIP INTEGRATION (TL-MOS)
// ============================================

export type MosipLinkStatus = 'pending' | 'verified' | 'failed' | 'revoked' | 'expired';

export interface MosipLink {
  id: string;
  crid: string;
  mosipLinkToken: string;
  mosipLinkStatus: MosipLinkStatus;
  assuranceLevel?: string;
  identityAssuranceLevel?: string;
  verificationTimestamp?: string;
  verificationMethod?: string;
  verifierFacilityId?: string;
  linkedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
}

// ============================================
// SIGNING & NON-REPUDIATION (TL-KEY)
// ============================================

export type ArtifactType = 'referral' | 'transfer_package' | 'discharge_summary' | 'certificate' | 'crvs_notification' | 'prescription';

export interface SigningKey {
  id: string;
  keyId: string;
  keyPurpose: 'document_signing' | 'token_signing' | 'service_auth' | 'encryption';
  keyAlgorithm: string;
  publicKeyPem: string;
  keyThumbprint: string;
  status: 'pending' | 'active' | 'rotating' | 'retired' | 'compromised';
  activatedAt?: string;
  expiresAt?: string;
}

export interface SignedArtifact {
  id: string;
  artifactType: ArtifactType;
  artifactId: string;
  artifactHash: string;
  signingKeyId: string;
  signature: string;
  signatureTimestamp: string;
  signerUserId?: string;
  signerUpid?: string;
  signerRole?: string;
  signerFacilityId?: string;
  verificationQrData?: string;
  verificationUrl?: string;
  status: 'valid' | 'superseded' | 'revoked';
}

// ============================================
// RATE LIMITING (TL-ID-10)
// ============================================

export type RateLimitType = 'id_resolution' | 'consent_query' | 'break_glass' | 'export';

export interface RateLimitStatus {
  limitKey: string;
  limitType: RateLimitType;
  requestCount: number;
  maxRequests: number;
  windowDurationSeconds: number;
  isLockedOut: boolean;
  lockoutUntil?: string;
  remainingRequests: number;
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface TrustLayerConfig {
  enableOfflineMode: boolean;
  offlineCacheTtlHours: number;
  defaultTokenExpiryMinutes: number;
  breakGlassDefaultHours: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
}

export const DEFAULT_TRUST_LAYER_CONFIG: TrustLayerConfig = {
  enableOfflineMode: true,
  offlineCacheTtlHours: 48,
  defaultTokenExpiryMinutes: 60,
  breakGlassDefaultHours: 4,
  rateLimitWindowSeconds: 60,
  rateLimitMaxRequests: 100,
};

// Display labels
export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  care_team_access: 'Care Team Access',
  cross_facility_sharing: 'Cross-Facility Sharing',
  referral_sharing: 'Referral Sharing',
  telehealth: 'Telehealth Consent',
  sensitive_data_hiv: 'HIV/AIDS Information',
  sensitive_data_srh: 'Sexual & Reproductive Health',
  sensitive_data_mh: 'Mental Health',
  delegate_access: 'Delegate/Proxy Access',
  research_analytics: 'Research & Analytics',
  data_export: 'Data Export',
  emergency_override: 'Emergency Override Pre-consent',
};

export const PURPOSE_OF_USE_LABELS: Record<PurposeOfUse, string> = {
  treatment: 'Treatment',
  payment: 'Payment',
  operations: 'Healthcare Operations',
  referral: 'Referral',
  care_coordination: 'Care Coordination',
  emergency: 'Emergency Access',
  quality_review: 'Quality Review',
  research: 'Research',
  audit: 'Audit',
  legal: 'Legal Requirement',
  patient_request: 'Patient Request',
};

export const BREAK_GLASS_TYPE_LABELS: Record<string, string> = {
  life_threatening: 'Life-Threatening Emergency',
  urgent_care: 'Urgent Care Required',
  patient_unresponsive: 'Patient Unresponsive',
  system_emergency: 'System Emergency',
  other: 'Other Emergency',
};
