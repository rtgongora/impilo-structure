/**
 * Consent Service
 * 
 * Implements TL-CONS requirements for FHIR-based consent management:
 * - TL-CONS-01: Consent types (TPO, cross-facility, sensitive data, etc.)
 * - TL-CONS-02: Consent attributes (scope, period, constraints)
 * - TL-CONS-03: Real enforcement via PDP
 * - TL-CONS-04: Patient portal functions
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TrustLayerConsent,
  ConsentType,
  ConsentStatus,
  ConsentDelegation,
  ConsentCheckRequest,
  ConsentCheckResult,
  PurposeOfUse,
} from '@/types/trustLayer';

export const ConsentService = {
  /**
   * Create a new consent record
   */
  async createConsent(
    consent: Omit<TrustLayerConsent, 'id' | 'consentId' | 'version' | 'createdAt'>
  ): Promise<{ success: boolean; consent?: TrustLayerConsent; error?: string }> {
    try {
      const consentId = `CONS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

      const { data, error } = await supabase
        .from('trust_layer_consent')
        .insert({
          consent_id: consentId,
          subject_cpid: consent.subjectCpid,
          consent_type: consent.consentType,
          scope_facility_ids: consent.scopeFacilityIds,
          scope_provider_upids: consent.scopeProviderUpids,
          scope_roles: consent.scopeRoles,
          purpose_of_use: consent.purposeOfUse,
          status: consent.status,
          period_start: consent.periodStart,
          period_end: consent.periodEnd,
          data_classes: consent.dataClasses,
          data_sensitivity_tags: consent.dataSensitivityTags,
          provision_type: consent.provisionType,
          provision_rules: consent.provisionRules as any,
          verification_method: consent.verificationMethod,
          patient_acknowledged_at: consent.patientAcknowledgedAt,
          fhir_resource: consent.fhirResource as any,
          created_by: consent.createdBy,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Failed to create consent:', error);
        return { success: false, error: error.message };
      }

      // Audit log
      await this.logConsentEvent('consent_created', consentId, consent.subjectCpid, consent.createdBy);

      return {
        success: true,
        consent: this.mapToConsent(data),
      };
    } catch (err) {
      console.error('Consent creation error:', err);
      return { success: false, error: 'Failed to create consent' };
    }
  },

  /**
   * Check if consent exists for access (TL-CONS-03)
   */
  async checkConsent(request: ConsentCheckRequest): Promise<ConsentCheckResult> {
    try {
      const { data, error } = await supabase.rpc('trust_layer_check_consent', {
        p_subject_cpid: request.subjectCpid,
        p_requester_upid: request.requesterUpid,
        p_purpose: request.purpose,
        p_facility_id: request.facilityId || null,
      });

      if (error) {
        console.error('Consent check error:', error);
        return { hasConsent: false, denialReason: 'Consent check failed' };
      }

      if (!data || data.length === 0 || !data[0].has_consent) {
        return { hasConsent: false, denialReason: 'No active consent found' };
      }

      const result = data[0];
      return {
        hasConsent: true,
        consentId: result.consent_id,
        expiresAt: result.expires_at,
      };
    } catch (err) {
      console.error('Consent check error:', err);
      return { hasConsent: false, denialReason: 'Consent check failed' };
    }
  },

  /**
   * Get consents for a patient (TL-CONS-04)
   */
  async getPatientConsents(subjectCpid: string): Promise<TrustLayerConsent[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_consent')
        .select('*')
        .eq('subject_cpid', subjectCpid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch consents:', error);
        return [];
      }

      return (data || []).map(this.mapToConsent);
    } catch (err) {
      console.error('Error fetching consents:', err);
      return [];
    }
  },

  /**
   * Get active consents for a patient
   */
  async getActiveConsents(subjectCpid: string): Promise<TrustLayerConsent[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_consent')
        .select('*')
        .eq('subject_cpid', subjectCpid)
        .eq('status', 'active')
        .or(`period_end.is.null,period_end.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch active consents:', error);
        return [];
      }

      return (data || []).map(this.mapToConsent);
    } catch (err) {
      console.error('Error fetching active consents:', err);
      return [];
    }
  },

  /**
   * Revoke a consent (TL-CONS-04)
   */
  async revokeConsent(
    consentId: string,
    revokedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_consent')
        .update({
          status: 'inactive',
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          revocation_reason: reason,
        })
        .eq('consent_id', consentId)
        .select()
        .single();

      if (error) {
        console.error('Failed to revoke consent:', error);
        return { success: false, error: error.message };
      }

      // Audit log
      await this.logConsentEvent('consent_revoked', consentId, data.subject_cpid, revokedBy);

      return { success: true };
    } catch (err) {
      console.error('Consent revocation error:', err);
      return { success: false, error: 'Failed to revoke consent' };
    }
  },

  /**
   * Create time-bound sharing link (TL-CONS-04)
   */
  async createSharingLink(
    subjectCpid: string,
    createdBy: string,
    options: {
      expiresInHours: number;
      allowedPurposes: PurposeOfUse[];
      dataClasses?: string[];
    }
  ): Promise<{ success: boolean; shareToken?: string; expiresAt?: string; error?: string }> {
    try {
      // Create a temporary consent for sharing
      const shareToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000);

      const { error } = await supabase
        .from('trust_layer_consent')
        .insert({
          consent_id: `SHARE-${shareToken.substring(0, 8)}`,
          subject_cpid: subjectCpid,
          consent_type: 'data_export',
          purpose_of_use: options.allowedPurposes,
          status: 'active',
          period_start: new Date().toISOString(),
          period_end: expiresAt.toISOString(),
          data_classes: options.dataClasses,
          provision_type: 'permit',
          verification_method: 'patient_generated_link',
          patient_acknowledged_at: new Date().toISOString(),
          created_by: createdBy,
        });

      if (error) {
        console.error('Failed to create sharing link:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        shareToken,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err) {
      console.error('Sharing link creation error:', err);
      return { success: false, error: 'Failed to create sharing link' };
    }
  },

  /**
   * Add consent delegation (guardian/proxy)
   */
  async addDelegation(
    delegation: Omit<ConsentDelegation, 'id'>
  ): Promise<{ success: boolean; delegation?: ConsentDelegation; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_consent_delegation')
        .insert({
          consent_id: delegation.consentId,
          delegate_cpid: delegation.delegateCpid,
          delegate_upid: delegation.delegateUpid,
          delegate_type: delegation.delegateType,
          delegated_actions: delegation.delegatedActions,
          delegation_constraints: delegation.delegationConstraints as any,
          effective_from: delegation.effectiveFrom,
          effective_to: delegation.effectiveTo,
          verified_by: delegation.verifiedBy,
          verification_method: delegation.verificationMethod,
          legal_document_reference: delegation.legalDocumentReference,
          status: 'active',
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Failed to add delegation:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        delegation: this.mapToDelegation(data),
      };
    } catch (err) {
      console.error('Delegation creation error:', err);
      return { success: false, error: 'Failed to add delegation' };
    }
  },

  /**
   * Get delegations for a consent
   */
  async getDelegations(consentId: string): Promise<ConsentDelegation[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_consent_delegation')
        .select('*')
        .eq('consent_id', consentId)
        .eq('status', 'active');

      if (error) {
        console.error('Failed to fetch delegations:', error);
        return [];
      }

      return (data || []).map(this.mapToDelegation);
    } catch (err) {
      console.error('Error fetching delegations:', err);
      return [];
    }
  },

  /**
   * Build FHIR Consent resource
   */
  buildFhirConsent(consent: TrustLayerConsent): object {
    return {
      resourceType: 'Consent',
      id: consent.consentId,
      status: consent.status,
      scope: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/consentscope',
          code: 'patient-privacy',
        }],
      },
      category: [{
        coding: [{
          system: 'http://impilo.org/fhir/consent-type',
          code: consent.consentType,
        }],
      }],
      patient: {
        reference: `Patient/${consent.subjectCpid}`,
      },
      dateTime: consent.createdAt,
      provision: {
        type: consent.provisionType,
        period: {
          start: consent.periodStart,
          end: consent.periodEnd,
        },
        purpose: consent.purposeOfUse.map(p => ({
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
          code: p,
        })),
        class: consent.dataClasses?.map(c => ({
          system: 'http://impilo.org/fhir/data-class',
          code: c,
        })),
        securityLabel: consent.dataSensitivityTags?.map(t => ({
          system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
          code: t,
        })),
      },
    };
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  async logConsentEvent(
    eventType: string,
    consentId: string,
    subjectCpid: string,
    userId?: string
  ): Promise<void> {
    try {
      await supabase.from('trust_layer_audit_log').insert({
        event_category: 'consent',
        event_type: eventType,
        event_outcome: 'success',
        user_id: userId,
        subject_cpid: subjectCpid,
        action: eventType,
        resource_type: 'consent',
        resource_id: consentId,
      });
    } catch (err) {
      console.error('Failed to log consent event:', err);
    }
  },

  mapToConsent(data: any): TrustLayerConsent {
    return {
      id: data.id,
      consentId: data.consent_id,
      subjectCpid: data.subject_cpid,
      consentType: data.consent_type,
      scopeFacilityIds: data.scope_facility_ids,
      scopeProviderUpids: data.scope_provider_upids,
      scopeRoles: data.scope_roles,
      purposeOfUse: data.purpose_of_use,
      status: data.status,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      dataClasses: data.data_classes,
      dataSensitivityTags: data.data_sensitivity_tags,
      provisionType: data.provision_type,
      provisionRules: data.provision_rules,
      verificationMethod: data.verification_method,
      patientAcknowledgedAt: data.patient_acknowledged_at,
      revokedAt: data.revoked_at,
      revokedBy: data.revoked_by,
      revocationReason: data.revocation_reason,
      fhirResource: data.fhir_resource,
      version: data.version,
      createdAt: data.created_at,
      createdBy: data.created_by,
    };
  },

  mapToDelegation(data: any): ConsentDelegation {
    return {
      id: data.id,
      consentId: data.consent_id,
      delegateCpid: data.delegate_cpid,
      delegateUpid: data.delegate_upid,
      delegateType: data.delegate_type,
      delegatedActions: data.delegated_actions,
      delegationConstraints: data.delegation_constraints,
      effectiveFrom: data.effective_from,
      effectiveTo: data.effective_to,
      status: data.status,
      verifiedBy: data.verified_by,
      verificationMethod: data.verification_method,
      legalDocumentReference: data.legal_document_reference,
    };
  },
};

export default ConsentService;
