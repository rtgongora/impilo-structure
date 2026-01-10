import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  source_facility_id: string | null;
  modality_match: string[] | null;
  body_part_match: string[] | null;
  study_description_pattern: string | null;
  target_worklist_id: string | null;
  target_facility_id: string | null;
  auto_assign_to: string | null;
  set_priority: string | null;
  notify_providers: string[] | null;
  created_at: string;
}

export interface PrefetchRule {
  id: string;
  name: string;
  is_active: boolean;
  modality: string[] | null;
  body_part: string[] | null;
  lookback_days: number;
  max_priors: number;
  same_modality_only: boolean;
  same_body_part_only: boolean;
}

export interface LifecyclePolicy {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  modality: string[] | null;
  facility_id: string | null;
  patient_age_category: 'pediatric' | 'adult' | 'all' | null;
  hot_storage_days: number;
  warm_storage_days: number;
  cold_storage_days: number;
  deletion_after_days: number | null;
}

export interface HangingProtocol {
  id: string;
  name: string;
  description: string | null;
  modality: string;
  body_part: string | null;
  is_default: boolean;
  is_active: boolean;
  layout_type: string;
  viewport_config: any[];
  initial_window_preset: string | null;
  auto_link_scrolling: boolean;
  auto_compare_priors: boolean;
}

export interface DeidentificationJob {
  id: string;
  study_ids: string[];
  purpose: 'research' | 'training' | 'quality_assurance' | 'external_consult';
  project_name: string | null;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  rejection_reason: string | null;
  remove_patient_name: boolean;
  remove_patient_id: boolean;
  remove_dates: boolean;
  output_format: 'dicom' | 'nifti' | 'png';
  output_location: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  study_id: string | null;
  series_id: string | null;
  instance_id: string | null;
  report_id: string | null;
  action: string;
  actor_id: string;
  actor_facility_id: string | null;
  purpose_of_use: string | null;
  access_method: string | null;
  client_ip: string | null;
  is_emergency_access: boolean;
  emergency_justification: string | null;
  created_at: string;
}

export function usePACSAdmin() {
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [prefetchRules, setPrefetchRules] = useState<PrefetchRule[]>([]);
  const [lifecyclePolicies, setLifecyclePolicies] = useState<LifecyclePolicy[]>([]);
  const [hangingProtocols, setHangingProtocols] = useState<HangingProtocol[]>([]);
  const [deidentJobs, setDeidentJobs] = useState<DeidentificationJob[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Routing Rules
  const fetchRoutingRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imaging_routing_rules')
        .select('*')
        .order('priority');

      if (error) throw error;
      setRoutingRules((data || []) as unknown as RoutingRule[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching routing rules:', error);
    }
  }, []);

  const saveRoutingRule = useCallback(async (rule: Partial<RoutingRule>) => {
    try {
      if (rule.id) {
        const { error } = await supabase
          .from('imaging_routing_rules')
          .update(rule as any)
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('imaging_routing_rules')
          .insert(rule as any);
        if (error) throw error;
      }
      toast.success('Routing rule saved');
      await fetchRoutingRules();
    } catch (error) {
      console.error('[PACS Admin] Error saving routing rule:', error);
      toast.error('Failed to save routing rule');
    }
  }, [fetchRoutingRules]);

  // Prefetch Rules
  const fetchPrefetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imaging_prefetch_rules')
        .select('*')
        .order('name');

      if (error) throw error;
      setPrefetchRules((data || []) as unknown as PrefetchRule[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching prefetch rules:', error);
    }
  }, []);

  // Lifecycle Policies
  const fetchLifecyclePolicies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imaging_lifecycle_policies')
        .select('*')
        .order('name');

      if (error) throw error;
      setLifecyclePolicies((data || []) as unknown as LifecyclePolicy[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching lifecycle policies:', error);
    }
  }, []);

  // Hanging Protocols
  const fetchHangingProtocols = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imaging_hanging_protocols')
        .select('*')
        .order('modality', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setHangingProtocols((data || []) as unknown as HangingProtocol[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching hanging protocols:', error);
    }
  }, []);

  const getHangingProtocol = useCallback(async (modality: string, bodyPart?: string) => {
    try {
      let query = supabase
        .from('imaging_hanging_protocols')
        .select('*')
        .eq('modality', modality)
        .eq('is_active', true);

      if (bodyPart) {
        query = query.or(`body_part.eq.${bodyPart},body_part.is.null`);
      }

      const { data, error } = await query
        .order('is_default', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as unknown as HangingProtocol;
    } catch (error) {
      console.error('[PACS Admin] Error getting hanging protocol:', error);
      return null;
    }
  }, []);

  // De-identification Jobs
  const fetchDeidentJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imaging_deidentification_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeidentJobs((data || []) as unknown as DeidentificationJob[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching deident jobs:', error);
    }
  }, []);

  const requestDeidentification = useCallback(async (jobData: {
    study_ids: string[];
    purpose: DeidentificationJob['purpose'];
    project_name?: string;
    remove_patient_name?: boolean;
    remove_patient_id?: boolean;
    remove_dates?: boolean;
    output_format?: DeidentificationJob['output_format'];
  }) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('imaging_deidentification_jobs')
        .insert({
          ...jobData,
          requested_by: user.data.user?.id,
          status: 'pending',
          remove_patient_name: jobData.remove_patient_name ?? true,
          remove_patient_id: jobData.remove_patient_id ?? true,
          remove_dates: jobData.remove_dates ?? false,
          output_format: jobData.output_format ?? 'dicom',
        } as any)
        .select()
        .single();

      if (error) throw error;
      toast.success('De-identification request submitted for approval');
      await fetchDeidentJobs();
      return data;
    } catch (error) {
      console.error('[PACS Admin] Error requesting deidentification:', error);
      toast.error('Failed to submit de-identification request');
      return null;
    }
  }, [fetchDeidentJobs]);

  const approveDeidentJob = useCallback(async (jobId: string) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('imaging_deidentification_jobs')
        .update({
          status: 'approved',
          approved_by: user.data.user?.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', jobId);

      if (error) throw error;
      toast.success('De-identification job approved');
      await fetchDeidentJobs();
    } catch (error) {
      console.error('[PACS Admin] Error approving job:', error);
      toast.error('Failed to approve job');
    }
  }, [fetchDeidentJobs]);

  // Audit Log
  const fetchAuditLog = useCallback(async (filters: {
    study_id?: string;
    actor_id?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('imaging_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);

      if (filters.study_id) {
        query = query.eq('study_id', filters.study_id);
      }
      if (filters.actor_id) {
        query = query.eq('actor_id', filters.actor_id);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAuditLog((data || []) as unknown as AuditLogEntry[]);
    } catch (error) {
      console.error('[PACS Admin] Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logAuditEvent = useCallback(async (eventData: {
    study_id?: string;
    series_id?: string;
    instance_id?: string;
    report_id?: string;
    action: string;
    purpose_of_use?: string;
    access_method?: string;
    is_emergency_access?: boolean;
    emergency_justification?: string;
  }) => {
    try {
      const user = await supabase.auth.getUser();
      
      await supabase.from('imaging_audit_log').insert({
        ...eventData,
        actor_id: user.data.user?.id,
      } as any);
    } catch (error) {
      console.error('[PACS Admin] Error logging audit event:', error);
    }
  }, []);

  return {
    routingRules,
    prefetchRules,
    lifecyclePolicies,
    hangingProtocols,
    deidentJobs,
    auditLog,
    loading,
    fetchRoutingRules,
    saveRoutingRule,
    fetchPrefetchRules,
    fetchLifecyclePolicies,
    fetchHangingProtocols,
    getHangingProtocol,
    fetchDeidentJobs,
    requestDeidentification,
    approveDeidentJob,
    fetchAuditLog,
    logAuditEvent,
  };
}
