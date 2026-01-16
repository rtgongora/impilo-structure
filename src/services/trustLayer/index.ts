/**
 * Impilo Trust Layer Service
 * 
 * Central orchestration layer for trust operations:
 * - Identity Resolution (ID Mint Black Box)
 * - Authentication & Session Assurance
 * - Authorization & Policy Enforcement (PDP)
 * - Consent Management
 * - Audit & Provenance
 * - Offline Trust Controls
 */

import { IdMintService } from './idMintService';
import { ConsentService } from './consentService';
import { PolicyService } from './policyService';
import { AuditService } from './auditService';
import { OfflineService } from './offlineService';

// Export classes
export * from './idMintService';
export * from './consentService';
export * from './policyService';
export * from './auditService';
export * from './offlineService';

// Export service instances (these are already objects, not classes)
export const idMintService = IdMintService;
export const consentService = ConsentService;
export const policyService = PolicyService;
export const auditService = AuditService;
export const offlineService = OfflineService;
