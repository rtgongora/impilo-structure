/**
 * Policy Decision Point (PDP) Service
 * 
 * Implements TL-AUTHZ requirements for authorization and policy enforcement:
 * - TL-AUTHZ-01: Central ABAC + RBAC
 * - TL-AUTHZ-02: Workspace and duty enforcement
 * - TL-AUTHZ-03: Above-site roles
 * - TL-AUTHZ-04: Break-glass mechanism
 */

import { supabase } from '@/integrations/supabase/client';
import { ConsentService } from './consentService';
import type {
  PolicyDecisionRequest,
  PolicyDecisionResult,
  TrustLayerPolicy,
  BreakGlassRequest,
  BreakGlassAccess,
  PurposeOfUse,
} from '@/types/trustLayer';

export const PolicyService = {
  /**
   * Evaluate access request against policies (TL-AUTHZ-01)
   * Central Policy Decision Point
   */
  async evaluateAccess(request: PolicyDecisionRequest): Promise<PolicyDecisionResult> {
    const denialReasons: string[] = [];
    const appliedPolicies: string[] = [];

    try {
      // Step 1: Get applicable policies
      const policies = await this.getApplicablePolicies(request);
      
      // Step 2: Check consent if accessing patient data
      let consentSatisfied = true;
      let consentRequired = false;

      if (request.subjectCpid) {
        consentRequired = true;
        const consentCheck = await ConsentService.checkConsent({
          subjectCpid: request.subjectCpid,
          requesterUpid: request.providerUpid || '',
          purpose: request.purpose,
          facilityId: request.facilityId,
        });

        consentSatisfied = consentCheck.hasConsent;
        if (!consentSatisfied) {
          denialReasons.push('No valid consent for access');
        }
      }

      // Step 3: Evaluate ABAC policies
      for (const policy of policies) {
        const evaluation = this.evaluatePolicy(policy, request);
        appliedPolicies.push(policy.policyId);

        if (!evaluation.allowed) {
          denialReasons.push(...evaluation.reasons);
        }
      }

      // Step 4: Check if break-glass is available
      const breakGlassAvailable = request.purpose === 'emergency' || 
        (denialReasons.length > 0 && await this.isBreakGlassEligible(request.userId));

      // Step 5: Log decision
      const auditLogId = await this.logPolicyDecision(request, {
        allowed: denialReasons.length === 0 && consentSatisfied,
        denialReasons,
        appliedPolicies,
      });

      return {
        allowed: denialReasons.length === 0 && consentSatisfied,
        denialReasons,
        appliedPolicies,
        consentRequired,
        consentSatisfied,
        breakGlassAvailable,
        auditLogId,
      };
    } catch (err) {
      console.error('Policy evaluation error:', err);
      return {
        allowed: false,
        denialReasons: ['Policy evaluation failed'],
        appliedPolicies: [],
        consentRequired: false,
        consentSatisfied: false,
        breakGlassAvailable: false,
      };
    }
  },

  /**
   * Activate break-glass access (TL-AUTHZ-04)
   */
  async activateBreakGlass(request: BreakGlassRequest): Promise<{ success: boolean; access?: BreakGlassAccess; error?: string }> {
    try {
      const expiresInHours = request.expiresInHours || 4;

      const { data, error } = await supabase.rpc('trust_layer_record_break_glass', {
        p_user_id: request.userId,
        p_subject_cpid: request.subjectCpid,
        p_justification: request.justification,
        p_emergency_type: request.emergencyType,
        p_facility_id: request.facilityId || null,
        p_expires_in_hours: expiresInHours,
      });

      if (error) {
        console.error('Break-glass activation error:', error);
        return { success: false, error: error.message };
      }

      // Fetch the created record
      const { data: accessRecord, error: fetchError } = await supabase
        .from('trust_layer_break_glass')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Failed to fetch break-glass record:', fetchError);
        return { success: false, error: 'Break-glass activated but failed to fetch record' };
      }

      return {
        success: true,
        access: this.mapToBreakGlassAccess(accessRecord),
      };
    } catch (err) {
      console.error('Break-glass activation error:', err);
      return { success: false, error: 'Failed to activate break-glass access' };
    }
  },

  /**
   * Check active break-glass access
   */
  async getActiveBreakGlass(
    userId: string,
    subjectCpid: string
  ): Promise<BreakGlassAccess | null> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_break_glass')
        .select('*')
        .eq('user_id', userId)
        .eq('subject_cpid', subjectCpid)
        .gt('access_expires_at', new Date().toISOString())
        .is('access_ended_at', null)
        .order('access_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return this.mapToBreakGlassAccess(data);
    } catch (err) {
      console.error('Error checking break-glass access:', err);
      return null;
    }
  },

  /**
   * End break-glass access
   */
  async endBreakGlass(accessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trust_layer_break_glass')
        .update({ access_ended_at: new Date().toISOString() })
        .eq('id', accessId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error ending break-glass access:', err);
      return { success: false, error: 'Failed to end break-glass access' };
    }
  },

  /**
   * Get pending break-glass reviews (for reviewers)
   */
  async getPendingBreakGlassReviews(
    facilityId?: string
  ): Promise<BreakGlassAccess[]> {
    try {
      let query = supabase
        .from('trust_layer_break_glass')
        .select('*')
        .eq('review_status', 'pending')
        .order('access_started_at', { ascending: false });

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pending reviews:', error);
        return [];
      }

      return (data || []).map(this.mapToBreakGlassAccess);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      return [];
    }
  },

  /**
   * Review break-glass access (TL-AUTHZ-04)
   */
  async reviewBreakGlass(
    accessId: string,
    reviewerId: string,
    outcome: 'approved' | 'flagged' | 'violation',
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trust_layer_break_glass')
        .update({
          review_status: outcome,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          review_outcome: outcome,
          requires_follow_up: outcome === 'violation',
        })
        .eq('id', accessId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Audit log
      await supabase.from('trust_layer_audit_log').insert({
        event_category: 'break_glass',
        event_type: 'break_glass_reviewed',
        event_outcome: 'success',
        user_id: reviewerId,
        action: `review_${outcome}`,
        resource_type: 'break_glass',
        resource_id: accessId,
      });

      return { success: true };
    } catch (err) {
      console.error('Error reviewing break-glass:', err);
      return { success: false, error: 'Failed to submit review' };
    }
  },

  /**
   * Create or update a policy
   */
  async upsertPolicy(
    policy: Omit<TrustLayerPolicy, 'id'>
  ): Promise<{ success: boolean; policy?: TrustLayerPolicy; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_policies')
        .upsert({
          policy_id: policy.policyId,
          policy_name: policy.policyName,
          policy_version: policy.policyVersion,
          policy_type: policy.policyType,
          attributes: policy.attributes as any,
          conditions: policy.conditions as any,
          actions: policy.actions,
          effect: policy.effect,
          applies_to_roles: policy.appliesToRoles,
          applies_to_facilities: policy.appliesToFacilities,
          applies_to_data_classes: policy.appliesToDataClasses,
          priority: policy.priority,
          is_active: policy.isActive,
          effective_from: policy.effectiveFrom,
          effective_to: policy.effectiveTo,
          description: policy.description,
          rationale: policy.rationale,
          regulatory_reference: policy.regulatoryReference,
        } as any, { onConflict: 'policy_id' })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert policy:', error);
        return { success: false, error: error.message };
      }

      return { success: true, policy: this.mapToPolicy(data) };
    } catch (err) {
      console.error('Policy upsert error:', err);
      return { success: false, error: 'Failed to create/update policy' };
    }
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  async getApplicablePolicies(request: PolicyDecisionRequest): Promise<TrustLayerPolicy[]> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_policies')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error || !data) {
        return [];
      }

      // Filter policies that apply to this request
      return data
        .filter(p => {
          // Check if policy applies to the requested action
          if (p.actions && !p.actions.includes(request.action) && !p.actions.includes('*')) {
            return false;
          }

          // Check if policy applies to the requester's facility
          if (p.applies_to_facilities && request.facilityId) {
            if (!p.applies_to_facilities.includes(request.facilityId)) {
              return false;
            }
          }

          // Check effective dates
          const now = new Date();
          if (p.effective_from && new Date(p.effective_from) > now) {
            return false;
          }
          if (p.effective_to && new Date(p.effective_to) < now) {
            return false;
          }

          return true;
        })
        .map(this.mapToPolicy);
    } catch (err) {
      console.error('Error fetching policies:', err);
      return [];
    }
  },

  evaluatePolicy(
    policy: TrustLayerPolicy,
    request: PolicyDecisionRequest
  ): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Evaluate conditions from policy
    const conditions = policy.conditions as Record<string, unknown>;

    // Check required attributes
    const requiredAttributes = policy.attributes as Record<string, unknown>;
    if (requiredAttributes.requiresConsent && !request.subjectCpid) {
      reasons.push('Patient context required');
    }

    if (requiredAttributes.requiresFacility && !request.facilityId) {
      reasons.push('Facility context required');
    }

    if (requiredAttributes.requiresWorkspace && !request.workspaceId) {
      reasons.push('Workspace context required');
    }

    // Check purpose-of-use restrictions
    if (conditions.allowedPurposes) {
      const allowed = conditions.allowedPurposes as string[];
      if (!allowed.includes(request.purpose)) {
        reasons.push(`Purpose '${request.purpose}' not allowed by policy ${policy.policyId}`);
      }
    }

    // Check data classification restrictions
    if (conditions.deniedDataClasses && request.dataClasses) {
      const denied = conditions.deniedDataClasses as string[];
      const overlap = request.dataClasses.filter(c => denied.includes(c));
      if (overlap.length > 0) {
        reasons.push(`Access to data classes [${overlap.join(', ')}] denied`);
      }
    }

    // If policy effect is 'deny', flip the logic
    if (policy.effect === 'deny') {
      return { allowed: reasons.length > 0, reasons };
    }

    return { allowed: reasons.length === 0, reasons };
  },

  async isBreakGlassEligible(userId: string): Promise<boolean> {
    // Check if user has a role that can use break-glass
    try {
      const { data } = await supabase.rpc('is_licensed_practitioner', { _user_id: userId });
      return data === true;
    } catch {
      return false;
    }
  },

  async logPolicyDecision(
    request: PolicyDecisionRequest,
    result: { allowed: boolean; denialReasons: string[]; appliedPolicies: string[] }
  ): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('trust_layer_audit_log')
        .insert({
          event_category: 'authorization',
          event_type: 'policy_decision',
          event_outcome: result.allowed ? 'success' : 'failure',
          user_id: request.userId,
          provider_upid: request.providerUpid,
          subject_cpid: request.subjectCpid,
          action: request.action,
          resource_type: request.resourceType,
          resource_id: request.resourceId,
          facility_id: request.facilityId,
          workspace_id: request.workspaceId,
          purpose_of_use: request.purpose,
          request_metadata: {
            applied_policies: result.appliedPolicies,
            denial_reasons: result.denialReasons,
            data_classes: request.dataClasses,
          },
        })
        .select('id')
        .single();

      return data?.id;
    } catch (err) {
      console.error('Failed to log policy decision:', err);
      return undefined;
    }
  },

  mapToPolicy(data: any): TrustLayerPolicy {
    return {
      id: data.id,
      policyId: data.policy_id,
      policyName: data.policy_name,
      policyVersion: data.policy_version,
      policyType: data.policy_type,
      attributes: data.attributes,
      conditions: data.conditions,
      actions: data.actions,
      effect: data.effect,
      appliesToRoles: data.applies_to_roles,
      appliesToFacilities: data.applies_to_facilities,
      appliesToDataClasses: data.applies_to_data_classes,
      priority: data.priority,
      isActive: data.is_active,
      effectiveFrom: data.effective_from,
      effectiveTo: data.effective_to,
      description: data.description,
      rationale: data.rationale,
      regulatoryReference: data.regulatory_reference,
    };
  },

  mapToBreakGlassAccess(data: any): BreakGlassAccess {
    return {
      id: data.id,
      userId: data.user_id,
      providerUpid: data.provider_upid,
      subjectCpid: data.subject_cpid,
      justification: data.justification,
      emergencyType: data.emergency_type,
      accessedDataClasses: data.accessed_data_classes,
      accessScope: data.access_scope,
      accessStartedAt: data.access_started_at,
      accessExpiresAt: data.access_expires_at,
      accessEndedAt: data.access_ended_at,
      reviewStatus: data.review_status,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
    };
  },
};

export default PolicyService;
