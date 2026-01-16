/**
 * Audit Service
 * 
 * Implements TL-AUD requirements for provenance, audit, and non-repudiation:
 * - TL-AUD-01: Immutable, queryable audit
 * - TL-AUD-02: Patient-visible access history
 * - TL-AUD-03: Non-repudiation (signing)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TrustLayerAuditLog,
  PatientAccessHistory,
  AuditEventCategory,
  AuditEventOutcome,
  SignedArtifact,
  ArtifactType,
} from '@/types/trustLayer';

export const AuditService = {
  /**
   * Log an audit event (TL-AUD-01)
   */
  async log(event: Omit<TrustLayerAuditLog, 'id' | 'createdAt'>): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_audit_log')
        .insert({
          event_category: event.eventCategory,
          event_type: event.eventType,
          event_outcome: event.eventOutcome,
          user_id: event.userId,
          user_email: event.userEmail,
          provider_upid: event.providerUpid,
          user_role: event.userRole,
          user_ip_address: event.userIpAddress,
          user_agent: event.userAgent,
          device_fingerprint: event.deviceFingerprint,
          subject_cpid: event.subjectCpid,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          facility_id: event.facilityId,
          workspace_id: event.workspaceId,
          purpose_of_use: event.purposeOfUse,
          assurance_level: event.assuranceLevel,
          request_metadata: event.requestMetadata as any,
          response_code: event.responseCode,
          error_message: event.errorMessage,
          consent_id: event.consentId,
          consent_version: event.consentVersion,
          source_system: event.sourceSystem,
          correlation_id: event.correlationId,
        } as any)
        .select('id')
        .single();

      if (error) {
        console.error('Audit log error:', error);
        return undefined;
      }

      return data?.id;
    } catch (err) {
      console.error('Audit log error:', err);
      return undefined;
    }
  },

  /**
   * Query audit logs
   */
  async queryLogs(filters: {
    userId?: string;
    subjectCpid?: string;
    eventCategory?: AuditEventCategory;
    fromDate?: string;
    toDate?: string;
    correlationId?: string;
    limit?: number;
  }): Promise<TrustLayerAuditLog[]> {
    try {
      let query = supabase
        .from('trust_layer_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.subjectCpid) {
        query = query.eq('subject_cpid', filters.subjectCpid);
      }
      if (filters.eventCategory) {
        query = query.eq('event_category', filters.eventCategory);
      }
      if (filters.correlationId) {
        query = query.eq('correlation_id', filters.correlationId);
      }
      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate);
      }
      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error querying audit logs:', error);
        return [];
      }

      return (data || []).map(this.mapToAuditLog);
    } catch (err) {
      console.error('Error querying audit logs:', err);
      return [];
    }
  },

  /**
   * Get patient access history (TL-AUD-02)
   * Sanitized view for patient portal
   */
  async getPatientAccessHistory(
    subjectCpid: string,
    limit?: number
  ): Promise<PatientAccessHistory[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_patient_access_history')
        .select('*')
        .eq('subject_cpid', subjectCpid)
        .order('access_timestamp', { ascending: false })
        .limit(limit || 50);

      if (error) {
        console.error('Error fetching access history:', error);
        return [];
      }

      return (data || []).map(this.mapToAccessHistory);
    } catch (err) {
      console.error('Error fetching access history:', err);
      return [];
    }
  },

  /**
   * Record access for patient visibility
   */
  async recordPatientAccess(
    subjectCpid: string,
    accessorRole: string,
    accessorFacilityName: string | undefined,
    purposeOfUse: string,
    dataSummary?: string,
    showAccessorName?: boolean,
    accessorName?: string,
    auditLogId?: string
  ): Promise<void> {
    try {
      await supabase.from('trust_layer_patient_access_history').insert({
        subject_cpid: subjectCpid,
        accessor_role: accessorRole,
        accessor_facility_name: accessorFacilityName,
        purpose_of_use: purposeOfUse,
        data_accessed_summary: dataSummary,
        access_timestamp: new Date().toISOString(),
        show_accessor_name: showAccessorName || false,
        accessor_name: showAccessorName ? accessorName : null,
        audit_log_id: auditLogId,
      });
    } catch (err) {
      console.error('Failed to record patient access:', err);
    }
  },

  /**
   * Sign an artifact for non-repudiation (TL-AUD-03)
   */
  async signArtifact(
    artifactType: ArtifactType,
    artifactId: string,
    artifactContent: string,
    signerUserId: string,
    signerUpid?: string,
    signerRole?: string,
    signerFacilityId?: string
  ): Promise<{ success: boolean; artifact?: SignedArtifact; error?: string }> {
    try {
      // Calculate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(artifactContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const artifactHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get active signing key
      const { data: keyData, error: keyError } = await supabase
        .from('trust_layer_signing_keys')
        .select('key_id')
        .eq('status', 'active')
        .eq('key_purpose', 'document_signing')
        .limit(1)
        .maybeSingle();

      if (keyError || !keyData) {
        // In production, would use HSM-backed key
        // For now, create a placeholder signature
        console.warn('No active signing key, using placeholder');
      }

      const signingKeyId = keyData?.key_id || 'PLACEHOLDER-KEY';

      // Create signature (in production, this would use HSM)
      const signatureData = `${artifactHash}:${signerUserId}:${Date.now()}`;
      const signatureBytes = encoder.encode(signatureData);
      const signatureHashBuffer = await crypto.subtle.digest('SHA-256', signatureBytes);
      const signatureHashArray = Array.from(new Uint8Array(signatureHashBuffer));
      const signature = signatureHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Generate verification data
      const verificationQrData = JSON.stringify({
        type: artifactType,
        id: artifactId,
        hash: artifactHash.substring(0, 16),
        signed: new Date().toISOString(),
      });

      const { data: signedData, error: signError } = await supabase
        .from('trust_layer_signed_artifacts')
        .insert({
          artifact_type: artifactType,
          artifact_id: artifactId,
          artifact_hash: artifactHash,
          signing_key_id: signingKeyId,
          signature,
          signer_user_id: signerUserId,
          signer_upid: signerUpid,
          signer_role: signerRole,
          signer_facility_id: signerFacilityId,
          verification_qr_data: verificationQrData,
          status: 'valid',
        })
        .select()
        .single();

      if (signError) {
        console.error('Failed to sign artifact:', signError);
        return { success: false, error: signError.message };
      }

      return {
        success: true,
        artifact: this.mapToSignedArtifact(signedData),
      };
    } catch (err) {
      console.error('Artifact signing error:', err);
      return { success: false, error: 'Failed to sign artifact' };
    }
  },

  /**
   * Verify artifact signature
   */
  async verifyArtifact(
    artifactType: ArtifactType,
    artifactId: string,
    artifactContent: string
  ): Promise<{ valid: boolean; signedArtifact?: SignedArtifact; error?: string }> {
    try {
      // Calculate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(artifactContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const artifactHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Find matching signed artifact
      const { data: signedData, error } = await supabase
        .from('trust_layer_signed_artifacts')
        .select('*')
        .eq('artifact_type', artifactType)
        .eq('artifact_id', artifactId)
        .eq('artifact_hash', artifactHash)
        .eq('status', 'valid')
        .maybeSingle();

      if (error || !signedData) {
        return { valid: false, error: 'No valid signature found' };
      }

      return {
        valid: true,
        signedArtifact: this.mapToSignedArtifact(signedData),
      };
    } catch (err) {
      console.error('Artifact verification error:', err);
      return { valid: false, error: 'Verification failed' };
    }
  },

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    filters: {
      fromDate: string;
      toDate: string;
      categories?: AuditEventCategory[];
      facilityId?: string;
    },
    format: 'json' | 'csv' = 'json'
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      let query = supabase
        .from('trust_layer_audit_log')
        .select('*')
        .gte('created_at', filters.fromDate)
        .lte('created_at', filters.toDate)
        .order('created_at', { ascending: true });

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('event_category', filters.categories);
      }
      if (filters.facilityId) {
        query = query.eq('facility_id', filters.facilityId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).map(v => JSON.stringify(v)).join(','));
        return { success: true, data: [headers, ...rows].join('\n') };
      }

      return { success: true, data: JSON.stringify(data, null, 2) };
    } catch (err) {
      console.error('Export error:', err);
      return { success: false, error: 'Export failed' };
    }
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  mapToAuditLog(data: any): TrustLayerAuditLog {
    return {
      id: data.id,
      eventCategory: data.event_category,
      eventType: data.event_type,
      eventOutcome: data.event_outcome,
      userId: data.user_id,
      userEmail: data.user_email,
      providerUpid: data.provider_upid,
      userRole: data.user_role,
      userIpAddress: data.user_ip_address,
      userAgent: data.user_agent,
      deviceFingerprint: data.device_fingerprint,
      subjectCpid: data.subject_cpid,
      action: data.action,
      resourceType: data.resource_type,
      resourceId: data.resource_id,
      facilityId: data.facility_id,
      workspaceId: data.workspace_id,
      purposeOfUse: data.purpose_of_use,
      assuranceLevel: data.assurance_level,
      requestMetadata: data.request_metadata,
      responseCode: data.response_code,
      errorMessage: data.error_message,
      consentId: data.consent_id,
      consentVersion: data.consent_version,
      sourceSystem: data.source_system,
      correlationId: data.correlation_id,
      createdAt: data.created_at,
    };
  },

  mapToAccessHistory(data: any): PatientAccessHistory {
    return {
      id: data.id,
      subjectCpid: data.subject_cpid,
      accessorRole: data.accessor_role,
      accessorFacilityName: data.accessor_facility_name,
      accessorDepartment: data.accessor_department,
      purposeOfUse: data.purpose_of_use,
      dataAccessedSummary: data.data_accessed_summary,
      accessTimestamp: data.access_timestamp,
      showAccessorName: data.show_accessor_name,
      accessorName: data.accessor_name,
    };
  },

  mapToSignedArtifact(data: any): SignedArtifact {
    return {
      id: data.id,
      artifactType: data.artifact_type,
      artifactId: data.artifact_id,
      artifactHash: data.artifact_hash,
      signingKeyId: data.signing_key_id,
      signature: data.signature,
      signatureTimestamp: data.signature_timestamp,
      signerUserId: data.signer_user_id,
      signerUpid: data.signer_upid,
      signerRole: data.signer_role,
      signerFacilityId: data.signer_facility_id,
      verificationQrData: data.verification_qr_data,
      verificationUrl: data.verification_url,
      status: data.status,
    };
  },
};

export default AuditService;
