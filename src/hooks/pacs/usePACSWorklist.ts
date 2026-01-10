import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorklistStudy {
  id: string;
  study_instance_uid: string;
  accession_number: string | null;
  patient_id: string;
  patient_name?: string;
  modality: string;
  study_description: string | null;
  study_date: string;
  body_part: string | null;
  priority: 'stat' | 'urgent' | 'routine';
  workflow_status: string;
  number_of_series: number;
  number_of_instances: number;
  facility_id: string | null;
  facility_name?: string;
  assignment?: {
    id: string;
    assigned_to: string;
    assigned_at: string;
    status: string;
    started_at: string | null;
  };
  tat_minutes?: number;
  has_priors?: boolean;
  prior_count?: number;
}

export interface Worklist {
  id: string;
  name: string;
  description: string | null;
  facility_id: string | null;
  modality_filter: string[] | null;
  body_part_filter: string[] | null;
  priority_filter: string[] | null;
  is_active: boolean;
  study_count?: number;
}

export interface WorklistFilters {
  worklist_id?: string;
  modality?: string;
  priority?: string;
  status?: string;
  assigned_to?: string;
  unassigned?: boolean;
  date_from?: string;
  date_to?: string;
}

export function usePACSWorklist() {
  const [worklists, setWorklists] = useState<Worklist[]>([]);
  const [studies, setStudies] = useState<WorklistStudy[]>([]);
  const [selectedWorklist, setSelectedWorklist] = useState<Worklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [tatStats, setTatStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    avgTatMinutes: 0,
    statPending: 0,
  });

  const fetchWorklists = useCallback(async (facilityId?: string) => {
    try {
      let query = supabase
        .from('imaging_worklists')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (facilityId) {
        query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWorklists((data || []) as unknown as Worklist[]);
    } catch (error) {
      console.error('[PACS Worklist] Error fetching worklists:', error);
      toast.error('Failed to load worklists');
    }
  }, []);

  const fetchWorklistStudies = useCallback(async (filters: WorklistFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('imaging_studies')
        .select(`
          *,
          imaging_assignments!inner(id, assigned_to, assigned_at, status, started_at, is_current)
        `)
        .order('study_date', { ascending: false })
        .order('priority', { ascending: true });

      if (filters.modality) {
        query = query.eq('modality', filters.modality);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.status) {
        query = query.eq('workflow_status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('study_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('study_date', filters.date_to);
      }
      if (filters.assigned_to) {
        query = query.eq('imaging_assignments.assigned_to', filters.assigned_to);
      }
      if (filters.unassigned) {
        query = query.is('imaging_assignments.assigned_to', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mappedStudies: WorklistStudy[] = (data || []).map((study: any) => ({
        id: study.id,
        study_instance_uid: study.study_instance_uid,
        accession_number: study.accession_number,
        patient_id: study.patient_id,
        modality: study.modality,
        study_description: study.study_description,
        study_date: study.study_date,
        body_part: study.body_part,
        priority: study.priority,
        workflow_status: study.workflow_status || study.status,
        number_of_series: study.number_of_series,
        number_of_instances: study.number_of_instances,
        facility_id: study.facility_id,
        assignment: study.imaging_assignments?.[0] || null,
      }));

      setStudies(mappedStudies);

      // Calculate TAT stats
      const pending = mappedStudies.filter(s => s.workflow_status === 'received' || s.workflow_status === 'ready_for_read').length;
      const inProgress = mappedStudies.filter(s => s.assignment?.status === 'in_progress').length;
      const completed = mappedStudies.filter(s => s.workflow_status === 'final_reported').length;
      const statPending = mappedStudies.filter(s => s.priority === 'stat' && s.workflow_status !== 'final_reported').length;

      setTatStats({ pending, inProgress, completed, avgTatMinutes: 0, statPending });
    } catch (error) {
      console.error('[PACS Worklist] Error fetching studies:', error);
      // Fallback to basic query without assignments
      try {
        const { data, error: fallbackError } = await supabase
          .from('imaging_studies')
          .select('*')
          .order('study_date', { ascending: false });

        if (fallbackError) throw fallbackError;
        setStudies((data || []) as unknown as WorklistStudy[]);
      } catch (e) {
        toast.error('Failed to load worklist studies');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const assignStudy = useCallback(async (
    studyId: string,
    assignedTo: string,
    worklistId?: string,
    priority?: 'stat' | 'urgent' | 'routine'
  ) => {
    try {
      // Mark previous assignments as not current
      await supabase
        .from('imaging_assignments')
        .update({ is_current: false } as any)
        .eq('study_id', studyId)
        .eq('is_current', true);

      // Create new assignment
      const { error } = await supabase
        .from('imaging_assignments')
        .insert({
          study_id: studyId,
          assigned_to: assignedTo,
          worklist_id: worklistId,
          priority: priority || 'routine',
          status: 'pending',
          is_current: true,
        } as any);

      if (error) throw error;

      // Update study workflow status
      await supabase
        .from('imaging_studies')
        .update({ workflow_status: 'ready_for_read' } as any)
        .eq('id', studyId);

      toast.success('Study assigned successfully');
      await fetchWorklistStudies();
    } catch (error) {
      console.error('[PACS Worklist] Error assigning study:', error);
      toast.error('Failed to assign study');
    }
  }, [fetchWorklistStudies]);

  const startReading = useCallback(async (assignmentId: string, studyId: string) => {
    try {
      const { error } = await supabase
        .from('imaging_assignments')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        } as any)
        .eq('id', assignmentId);

      if (error) throw error;

      // Log audit
      await supabase.from('imaging_audit_log').insert({
        study_id: studyId,
        action: 'view',
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        purpose_of_use: 'clinical_care',
        access_method: 'viewer',
      } as any);

      toast.success('Started reading study');
    } catch (error) {
      console.error('[PACS Worklist] Error starting read:', error);
      toast.error('Failed to start reading');
    }
  }, []);

  const reassignStudy = useCallback(async (
    studyId: string,
    newAssignee: string,
    reason: string
  ) => {
    try {
      // Update old assignment
      await supabase
        .from('imaging_assignments')
        .update({
          status: 'reassigned',
          is_current: false,
          reassign_reason: reason,
        } as any)
        .eq('study_id', studyId)
        .eq('is_current', true);

      // Create new assignment
      await assignStudy(studyId, newAssignee);
    } catch (error) {
      console.error('[PACS Worklist] Error reassigning study:', error);
      toast.error('Failed to reassign study');
    }
  }, [assignStudy]);

  const fetchTATMetrics = useCallback(async (facilityId?: string, modality?: string) => {
    try {
      let query = supabase
        .from('imaging_tat_metrics')
        .select('*')
        .not('total_tat', 'is', null);

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }
      if (modality) {
        query = query.eq('modality', modality);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const avgTat = data.reduce((sum: number, m: any) => sum + (m.total_tat || 0), 0) / data.length;
        setTatStats(prev => ({ ...prev, avgTatMinutes: Math.round(avgTat) }));
      }
    } catch (error) {
      console.error('[PACS Worklist] Error fetching TAT metrics:', error);
    }
  }, []);

  return {
    worklists,
    studies,
    selectedWorklist,
    loading,
    tatStats,
    setSelectedWorklist,
    fetchWorklists,
    fetchWorklistStudies,
    assignStudy,
    startReading,
    reassignStudy,
    fetchTATMetrics,
  };
}
