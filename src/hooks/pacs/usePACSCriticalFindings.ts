import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CriticalFinding {
  id: string;
  study_id: string;
  report_id: string | null;
  finding_description: string;
  severity: 'critical' | 'significant' | 'unexpected';
  notification_required: boolean;
  notification_attempts: number;
  first_notified_at: string | null;
  notified_to: string | null;
  notified_by: string | null;
  notification_method: string | null;
  notification_confirmed_at: string | null;
  confirmation_details: string | null;
  status: 'pending' | 'notifying' | 'notified' | 'confirmed' | 'escalated' | 'failed';
  escalated_to: string | null;
  escalated_at: string | null;
  created_at: string;
  study?: {
    accession_number: string;
    modality: string;
    patient_id: string;
    study_description: string;
  };
}

export function usePACSCriticalFindings() {
  const [findings, setFindings] = useState<CriticalFinding[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFindings = useCallback(async (filters: {
    status?: string;
    severity?: string;
    pending_only?: boolean;
  } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('imaging_critical_findings')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.pending_only) {
        query = query.in('status', ['pending', 'notifying']);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setFindings((data || []) as unknown as CriticalFinding[]);
      setPendingCount((data || []).filter((f: any) => f.status === 'pending' || f.status === 'notifying').length);
    } catch (error) {
      console.error('[PACS Critical] Error fetching findings:', error);
      toast.error('Failed to load critical findings');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCriticalFinding = useCallback(async (findingData: {
    study_id: string;
    report_id?: string;
    finding_description: string;
    severity: CriticalFinding['severity'];
  }) => {
    try {
      const { data, error } = await supabase
        .from('imaging_critical_findings')
        .insert({
          ...findingData,
          notification_required: true,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast.warning('Critical finding recorded - notification required!', {
        duration: 10000,
      });
      await fetchFindings();
      return data;
    } catch (error) {
      console.error('[PACS Critical] Error creating finding:', error);
      toast.error('Failed to record critical finding');
      return null;
    }
  }, [fetchFindings]);

  const recordNotification = useCallback(async (
    findingId: string,
    notificationData: {
      notified_to: string;
      notification_method: 'phone' | 'page' | 'in_person' | 'secure_message';
    }
  ) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('imaging_critical_findings')
        .update({
          status: 'notified',
          notified_to: notificationData.notified_to,
          notified_by: user.data.user?.id,
          notification_method: notificationData.notification_method,
          first_notified_at: new Date().toISOString(),
          notification_attempts: 1,
        } as any)
        .eq('id', findingId);

      if (error) throw error;

      toast.success('Notification recorded');
      await fetchFindings();
    } catch (error) {
      console.error('[PACS Critical] Error recording notification:', error);
      toast.error('Failed to record notification');
    }
  }, [fetchFindings]);

  const confirmNotification = useCallback(async (
    findingId: string,
    confirmationDetails: string
  ) => {
    try {
      const { error } = await supabase
        .from('imaging_critical_findings')
        .update({
          status: 'confirmed',
          notification_confirmed_at: new Date().toISOString(),
          confirmation_details: confirmationDetails,
        } as any)
        .eq('id', findingId);

      if (error) throw error;

      toast.success('Notification confirmed');
      await fetchFindings();
    } catch (error) {
      console.error('[PACS Critical] Error confirming notification:', error);
      toast.error('Failed to confirm notification');
    }
  }, [fetchFindings]);

  const escalateFinding = useCallback(async (
    findingId: string,
    escalatedTo: string
  ) => {
    try {
      const { error } = await supabase
        .from('imaging_critical_findings')
        .update({
          status: 'escalated',
          escalated_to: escalatedTo,
          escalated_at: new Date().toISOString(),
        } as any)
        .eq('id', findingId);

      if (error) throw error;

      toast.warning('Finding escalated');
      await fetchFindings();
    } catch (error) {
      console.error('[PACS Critical] Error escalating finding:', error);
      toast.error('Failed to escalate finding');
    }
  }, [fetchFindings]);

  // Real-time subscription for critical findings
  useEffect(() => {
    const channel = supabase
      .channel('critical-findings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'imaging_critical_findings',
        },
        (payload) => {
          toast.error('⚠️ New Critical Finding requires notification!', {
            duration: 15000,
          });
          fetchFindings({ pending_only: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFindings]);

  return {
    findings,
    pendingCount,
    loading,
    fetchFindings,
    createCriticalFinding,
    recordNotification,
    confirmNotification,
    escalateFinding,
  };
}
