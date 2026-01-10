import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImagingConsult {
  id: string;
  study_id: string;
  study?: {
    accession_number: string;
    modality: string;
    study_description: string;
    study_date: string;
  };
  requesting_facility_id: string | null;
  requesting_facility_name?: string;
  requesting_provider_id: string | null;
  requesting_provider_name?: string;
  consulting_facility_id: string | null;
  consulting_facility_name?: string;
  consulting_provider_id: string | null;
  consulting_provider_name?: string;
  consult_type: 'second_opinion' | 'specialist_review' | 'teleradiology' | 'urgent_read';
  clinical_question: string | null;
  urgency: 'stat' | 'urgent' | 'routine';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';
  response_findings: string | null;
  response_impression: string | null;
  response_recommendations: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  declined_reason: string | null;
  turnaround_minutes: number | null;
  created_at: string;
}

export function usePACSConsults() {
  const [consults, setConsults] = useState<ImagingConsult[]>([]);
  const [selectedConsult, setSelectedConsult] = useState<ImagingConsult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConsults = useCallback(async (filters: {
    status?: string;
    urgency?: string;
    consult_type?: string;
    requesting_facility_id?: string;
    consulting_provider_id?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('imaging_consults')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.urgency) {
        query = query.eq('urgency', filters.urgency);
      }
      if (filters.consult_type) {
        query = query.eq('consult_type', filters.consult_type);
      }
      if (filters.requesting_facility_id) {
        query = query.eq('requesting_facility_id', filters.requesting_facility_id);
      }
      if (filters.consulting_provider_id) {
        query = query.eq('consulting_provider_id', filters.consulting_provider_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConsults((data || []) as unknown as ImagingConsult[]);
    } catch (error) {
      console.error('[PACS Consults] Error fetching consults:', error);
      toast.error('Failed to load consults');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestConsult = useCallback(async (consultData: {
    study_id: string;
    consult_type: ImagingConsult['consult_type'];
    clinical_question: string;
    urgency: ImagingConsult['urgency'];
    consulting_facility_id?: string;
    consulting_provider_id?: string;
  }) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('imaging_consults')
        .insert({
          ...consultData,
          requesting_provider_id: user.data.user?.id,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Consult request submitted');
      await fetchConsults();
      return data;
    } catch (error) {
      console.error('[PACS Consults] Error requesting consult:', error);
      toast.error('Failed to request consult');
      return null;
    }
  }, [fetchConsults]);

  const acceptConsult = useCallback(async (consultId: string) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('imaging_consults')
        .update({
          status: 'accepted',
          consulting_provider_id: user.data.user?.id,
          accepted_at: new Date().toISOString(),
        } as any)
        .eq('id', consultId);

      if (error) throw error;

      toast.success('Consult accepted');
      await fetchConsults();
    } catch (error) {
      console.error('[PACS Consults] Error accepting consult:', error);
      toast.error('Failed to accept consult');
    }
  }, [fetchConsults]);

  const declineConsult = useCallback(async (consultId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('imaging_consults')
        .update({
          status: 'declined',
          declined_reason: reason,
        } as any)
        .eq('id', consultId);

      if (error) throw error;

      toast.success('Consult declined');
      await fetchConsults();
    } catch (error) {
      console.error('[PACS Consults] Error declining consult:', error);
      toast.error('Failed to decline consult');
    }
  }, [fetchConsults]);

  const completeConsult = useCallback(async (consultId: string, response: {
    findings: string;
    impression: string;
    recommendations?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('imaging_consults')
        .update({
          status: 'completed',
          response_findings: response.findings,
          response_impression: response.impression,
          response_recommendations: response.recommendations,
          responded_at: new Date().toISOString(),
        } as any)
        .eq('id', consultId);

      if (error) throw error;

      toast.success('Consult completed');
      await fetchConsults();
    } catch (error) {
      console.error('[PACS Consults] Error completing consult:', error);
      toast.error('Failed to complete consult');
    }
  }, [fetchConsults]);

  return {
    consults,
    selectedConsult,
    loading,
    setSelectedConsult,
    fetchConsults,
    requestConsult,
    acceptConsult,
    declineConsult,
    completeConsult,
  };
}
