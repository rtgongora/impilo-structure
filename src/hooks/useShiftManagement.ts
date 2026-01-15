// Hook to manage shift lifecycle - start, track, end shifts with database integration
// Implements handoff reconciliation and shift coverage tracking

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLicenseCheck } from './useLicenseCheck';
import type { ProviderFacility } from './useProviderFacilities';

export interface ActiveShift {
  id: string;
  facility_id: string;
  facility_name: string;
  workspace_id?: string;
  workspace_name?: string;
  started_at: string;
  ended_at?: string;
  shift_type: 'regular' | 'on_call' | 'locum' | 'emergency' | 'virtual';
  status: 'active' | 'ended' | 'cancelled'; // DB enum constraint
  isOnBreak?: boolean; // Client-side only for UI state
  pending_tasks: number;
  pending_results: number;
  pending_handoffs: number;
}

export interface ShiftHandoffItem {
  id: string;
  type: 'task' | 'result' | 'patient' | 'order';
  title: string;
  patient_name?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'delegated' | 'completed';
  delegated_to?: string;
}

export interface ShiftSummary {
  patients_seen: number;
  orders_placed: number;
  notes_written: number;
  duration_hours: number;
  pending_items: ShiftHandoffItem[];
}

interface UseShiftManagementReturn {
  activeShift: ActiveShift | null;
  loading: boolean;
  error: string | null;
  
  // Shift actions
  startShift: (facility: ProviderFacility, shiftType?: ActiveShift['shift_type']) => Promise<boolean>;
  endShift: (handoffComplete?: boolean) => Promise<boolean>;
  takeBreak: () => Promise<void>;
  resumeFromBreak: () => Promise<void>;
  
  // Handoff management
  getHandoffItems: () => Promise<ShiftHandoffItem[]>;
  delegateItem: (itemId: string, delegateToUserId: string) => Promise<boolean>;
  completeHandoff: () => Promise<boolean>;
  
  // Shift info
  getShiftSummary: () => Promise<ShiftSummary | null>;
  canEndShift: boolean;
  hasActiveShift: boolean;
}

export function useShiftManagement(): UseShiftManagementReturn {
  const { user } = useAuth();
  const { hasActiveLicense } = useLicenseCheck();
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current active shift on mount
  const fetchActiveShift = useCallback(async () => {
    if (!user) {
      setActiveShift(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check shifts table for active shifts
      const { data, error: fetchError } = await supabase
        .from('shifts')
        .select(`
          id,
          facility_id,
          current_workspace_id,
          started_at,
          ended_at,
          status,
          start_method,
          handover_notes
        `)
        .eq('provider_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching active shift:', fetchError);
        // Don't set error - table might be empty
      }

      if (data) {
        // Get facility name
        const { data: facilityData } = await supabase
          .from('facilities')
          .select('name')
          .eq('id', data.facility_id)
          .single();

        setActiveShift({
          id: data.id,
          facility_id: data.facility_id,
          facility_name: facilityData?.name || 'Unknown Facility',
          workspace_id: data.current_workspace_id || undefined,
          started_at: data.started_at,
          ended_at: data.ended_at || undefined,
          shift_type: (data.start_method as ActiveShift['shift_type']) || 'regular',
          status: data.status as ActiveShift['status'],
          pending_tasks: 0,
          pending_results: 0,
          pending_handoffs: 0,
        });
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error('Error in fetchActiveShift:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  // Start a new shift
  const startShift = useCallback(async (
    facility: ProviderFacility,
    shiftType: ActiveShift['shift_type'] = 'regular'
  ): Promise<boolean> => {
    if (!user || !hasActiveLicense) {
      setError('Active license required to start shift');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();

      const { data, error: insertError } = await supabase
        .from('shifts')
        .insert({
          facility_id: facility.facility_id,
          provider_id: user.id,
          started_at: now.toISOString(),
          status: 'active',
          start_method: shiftType,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error starting shift:', insertError);
        setError('Failed to start shift');
        return false;
      }

      // Log to audit
      await supabase.from('audit_logs').insert({
        entity_type: 'shift',
        entity_id: data.id,
        action: 'shift_started',
        performed_by: user.id,
        metadata: {
          facility_id: facility.facility_id,
          facility_name: facility.facility_name,
          shift_type: shiftType,
          started_at: now.toISOString(),
        },
      });

      setActiveShift({
        id: data.id,
        facility_id: facility.facility_id,
        facility_name: facility.facility_name,
        started_at: now.toISOString(),
        shift_type: shiftType,
        status: 'active',
        pending_tasks: 0,
        pending_results: 0,
        pending_handoffs: 0,
      });

      return true;
    } catch (err) {
      console.error('Error in startShift:', err);
      setError('Failed to start shift');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, hasActiveLicense]);

  // End current shift
  const endShift = useCallback(async (handoffComplete: boolean = false): Promise<boolean> => {
    if (!activeShift || !user) return false;

    try {
      setLoading(true);
      
      // Check for pending items
      const handoffItems = await getHandoffItemsInternal();
      const hasPendingItems = handoffItems.some(item => item.status === 'pending');
      
      if (hasPendingItems && !handoffComplete) {
        setError('Complete handoff before ending shift');
        setLoading(false);
        return false;
      }

      const now = new Date();
      const startedAt = new Date(activeShift.started_at);
      const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / (1000 * 60));

      // Update shift record
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          ended_at: now.toISOString(),
          status: 'ended',
          end_method: 'manual',
          total_duration_minutes: durationMinutes,
        })
        .eq('id', activeShift.id);

      if (updateError) {
        console.error('Error ending shift:', updateError);
        setError('Failed to end shift');
        return false;
      }

      // Log to audit
      await supabase.from('audit_logs').insert({
        entity_type: 'shift',
        entity_id: activeShift.id,
        action: 'shift_ended',
        performed_by: user.id,
        metadata: {
          facility_id: activeShift.facility_id,
          ended_at: now.toISOString(),
          duration_minutes: durationMinutes,
          handoff_complete: handoffComplete,
        },
      });

      setActiveShift(null);
      return true;
    } catch (err) {
      console.error('Error in endShift:', err);
      setError('Failed to end shift');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeShift, user]);

  // Take a break (client-side state only - DB doesn't support break status)
  const takeBreak = useCallback(async () => {
    if (!activeShift) return;
    setActiveShift(prev => prev ? { ...prev, isOnBreak: true } : null);
  }, [activeShift]);

  // Resume from break
  const resumeFromBreak = useCallback(async () => {
    if (!activeShift) return;
    setActiveShift(prev => prev ? { ...prev, isOnBreak: false } : null);
  }, [activeShift]);

  // Get handoff items (internal)

  // Get handoff items (internal)
  const getHandoffItemsInternal = async (): Promise<ShiftHandoffItem[]> => {
    // Mock handoff items - in production, query actual pending tasks/results
    return [
      { id: '1', type: 'result', title: 'Critical K+ pending review', patient_name: 'M. Ndlovu', priority: 'critical', status: 'pending' },
      { id: '2', type: 'task', title: 'Discharge summary needed', patient_name: 'T. Moyo', priority: 'high', status: 'pending' },
    ];
  };

  // Get handoff items
  const getHandoffItems = useCallback(async (): Promise<ShiftHandoffItem[]> => {
    return getHandoffItemsInternal();
  }, []);

  // Delegate an item
  const delegateItem = useCallback(async (itemId: string, delegateToUserId: string): Promise<boolean> => {
    // In production, update the actual task/result record
    console.log(`Delegating item ${itemId} to ${delegateToUserId}`);
    return true;
  }, []);

  // Complete handoff
  const completeHandoff = useCallback(async (): Promise<boolean> => {
    if (!activeShift || !user) return false;
    
    // Create handoff record
    await supabase.from('shift_handoffs').insert({
      outgoing_user_id: user.id,
      shift_date: new Date().toISOString().split('T')[0],
      shift_time: 'day',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    
    return true;
  }, [activeShift, user]);

  // Get shift summary
  const getShiftSummary = useCallback(async (): Promise<ShiftSummary | null> => {
    if (!activeShift) return null;

    const handoffItems = await getHandoffItemsInternal();
    const startTime = new Date(activeShift.started_at);
    const now = new Date();
    const durationHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    return {
      patients_seen: 12, // Mock - query actual encounters
      orders_placed: 8,
      notes_written: 15,
      duration_hours: Math.round(durationHours * 10) / 10,
      pending_items: handoffItems,
    };
  }, [activeShift]);

  const canEndShift = activeShift?.status === 'active';
  const hasActiveShift = activeShift !== null && activeShift.status === 'active';

  return {
    activeShift,
    loading,
    error,
    startShift,
    endShift,
    takeBreak,
    resumeFromBreak,
    getHandoffItems,
    delegateItem,
    completeHandoff,
    getShiftSummary,
    canEndShift,
    hasActiveShift,
  };
}
