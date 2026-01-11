import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  QueueDefinition, 
  QueueItem, 
  QueueMetrics,
  QueuePriority,
  QueueItemStatus,
  QueueEntryType
} from '@/types/queue';

interface AddToQueueInput {
  queue_id: string;
  patient_id?: string;
  health_id?: string;
  encounter_id?: string;
  appointment_id?: string;
  entry_type?: QueueEntryType;
  reason_for_visit?: string;
  priority?: QueuePriority;
  notes?: string;
}

export function useQueueManagement(facilityId?: string) {
  const { user } = useAuth();
  const [queues, setQueues] = useState<QueueDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue definitions for facility
  const fetchQueues = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('queue_definitions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setQueues((data || []) as QueueDefinition[]);
    } catch (err) {
      console.error('Error fetching queues:', err);
      setError('Failed to load queues');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  return {
    queues,
    loading,
    error,
    refetch: fetchQueues,
  };
}

export function useQueueItems(queueId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!queueId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch queue items - don't filter by date since patients waiting should persist
      const { data, error: fetchError } = await supabase
        .from('queue_items')
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .eq('queue_id', queueId)
        .in('status', ['waiting', 'called', 'in_service', 'paused'])
        .order('priority')
        .order('arrival_time');

      if (fetchError) throw fetchError;
      setItems((data || []) as QueueItem[]);

      // Compute basic metrics
      const waiting = (data || []).filter((i: QueueItem) => i.status === 'waiting');
      const inService = (data || []).filter((i: QueueItem) => i.status === 'in_service');
      
      const waitTimes = waiting.map((i: QueueItem) => {
        const arrival = new Date(i.arrival_time);
        return (Date.now() - arrival.getTime()) / 60000;
      });

      setMetrics({
        queue_length: waiting.length,
        avg_wait_minutes: waitTimes.length > 0 
          ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
          : null,
        longest_wait_minutes: waitTimes.length > 0 
          ? Math.max(...waitTimes) 
          : null,
        in_service_count: inService.length,
        completed_today: 0, // Would need separate query
      });
    } catch (err) {
      console.error('Error fetching queue items:', err);
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchItems();
    
    // Set up realtime subscription
    if (queueId) {
      const channel = supabase
        .channel(`queue_items_${queueId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue_items',
            filter: `queue_id=eq.${queueId}`,
          },
          () => {
            fetchItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [queueId, fetchItems]);

  const addToQueue = async (input: AddToQueueInput): Promise<QueueItem | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('queue_items')
        .insert([{
          queue_id: input.queue_id,
          patient_id: input.patient_id,
          health_id: input.health_id,
          encounter_id: input.encounter_id,
          appointment_id: input.appointment_id,
          entry_type: input.entry_type || 'walk_in',
          reason_for_visit: input.reason_for_visit,
          priority: input.priority || 'routine',
          notes: input.notes,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      toast.success('Added to queue');
      fetchItems();
      return data as QueueItem;
    } catch (err) {
      console.error('Error adding to queue:', err);
      toast.error('Failed to add to queue');
      return null;
    }
  };

  const callNext = async (): Promise<QueueItem | null> => {
    const nextItem = items.find(i => i.status === 'waiting');
    if (!nextItem) {
      toast.info('No patients waiting');
      return null;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'called' as const,
          called_at: new Date().toISOString(),
          assigned_provider_id: user?.id,
        })
        .eq('id', nextItem.id)
        .select()
        .single();

      if (updateError) throw updateError;
      toast.success(`Called ${nextItem.ticket_number}`);
      return data as QueueItem;
    } catch (err) {
      console.error('Error calling next:', err);
      toast.error('Failed to call next patient');
      return null;
    }
  };

  const startService = async (itemId: string): Promise<{ success: boolean; encounterId?: string }> => {
    try {
      // First, get the queue item to check patient and encounter
      const { data: item, error: fetchError } = await supabase
        .from('queue_items')
        .select('*, patient:patients(id, first_name, last_name)')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      let encounterId = item.encounter_id;

      // If no encounter exists, create one
      if (!encounterId && item.patient_id) {
        const encounterNumber = `ENC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { data: newEncounter, error: createError } = await supabase
          .from('encounters')
          .insert({
            patient_id: item.patient_id,
            encounter_number: encounterNumber,
            encounter_type: 'outpatient',
            status: 'active',
            chief_complaint: item.reason_for_visit || 'Queue visit',
          })
          .select()
          .single();

        if (createError) throw createError;
        encounterId = newEncounter.id;
      }

      // Update queue item with encounter ID and status
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'in_service' as const,
          in_service_at: new Date().toISOString(),
          encounter_id: encounterId,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Service started');
      await fetchItems();
      return { success: true, encounterId };
    } catch (err) {
      console.error('Error starting service:', err);
      toast.error('Failed to start service');
      return { success: false };
    }
  };

  const pauseService = async (itemId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'paused' as const,
          paused_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Service paused');
      return true;
    } catch (err) {
      console.error('Error pausing service:', err);
      toast.error('Failed to pause service');
      return false;
    }
  };

  const resumeService = async (itemId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'in_service' as const,
          resumed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Service resumed');
      return true;
    } catch (err) {
      console.error('Error resuming service:', err);
      toast.error('Failed to resume service');
      return false;
    }
  };

  const completeService = async (itemId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'completed' as const,
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Service completed');
      return true;
    } catch (err) {
      console.error('Error completing service:', err);
      toast.error('Failed to complete service');
      return false;
    }
  };

  const transferToQueue = async (
    itemId: string, 
    targetQueueId: string, 
    reason: string
  ): Promise<boolean> => {
    const item = items.find(i => i.id === itemId);
    if (!item) return false;

    try {
      // Create new item in target queue
      const { error: insertError } = await supabase
        .from('queue_items')
        .insert([{
          queue_id: targetQueueId,
          patient_id: item.patient_id,
          health_id: item.health_id,
          encounter_id: item.encounter_id,
          entry_type: 'internal_transfer' as const,
          reason_for_visit: item.reason_for_visit,
          priority: item.priority,
          transferred_from_queue_id: item.queue_id,
          transferred_from_item_id: item.id,
          transfer_reason: reason,
        }]);

      if (insertError) throw insertError;

      // Mark original as transferred
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'transferred' as const,
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Patient transferred');
      return true;
    } catch (err) {
      console.error('Error transferring:', err);
      toast.error('Failed to transfer patient');
      return false;
    }
  };

  const escalatePriority = async (
    itemId: string, 
    newPriority: QueuePriority, 
    reason: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          priority: newPriority,
          priority_changed_at: new Date().toISOString(),
          priority_changed_by: user?.id,
          priority_change_reason: reason,
          is_escalated: true,
          escalation_reason: reason,
          escalated_at: new Date().toISOString(),
          escalated_by: user?.id,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Priority escalated');
      return true;
    } catch (err) {
      console.error('Error escalating:', err);
      toast.error('Failed to escalate priority');
      return false;
    }
  };

  const markNoShow = async (itemId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('queue_items')
        .update({
          status: 'no_show' as const,
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      toast.success('Marked as no-show');
      return true;
    } catch (err) {
      console.error('Error marking no-show:', err);
      toast.error('Failed to mark no-show');
      return false;
    }
  };

  return {
    items,
    metrics,
    loading,
    refetch: fetchItems,
    addToQueue,
    callNext,
    startService,
    pauseService,
    resumeService,
    completeService,
    transferToQueue,
    escalatePriority,
    markNoShow,
  };
}
