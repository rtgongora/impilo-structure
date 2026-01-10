import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientQueueItem {
  id: string;
  ticket_number: string;
  status: string;
  priority: string;
  queue_name: string;
  service_type: string;
  arrival_time: string;
  called_at: string | null;
  estimated_wait_minutes: number | null;
  position_band: 'next' | 'soon' | 'later' | 'unknown';
  position: number;
  facility_name: string;
}

export interface ClientQueueNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  sent_at: string;
  read_at: string | null;
  acknowledged_at: string | null;
  requires_action: boolean;
  action_type: string | null;
}

export interface ClientQueueRequest {
  id: string;
  service_type: string;
  requested_date: string;
  status: string;
  facility_name: string;
  queue_name: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function useClientQueue(patientId?: string) {
  const [queueItems, setQueueItems] = useState<ClientQueueItem[]>([]);
  const [notifications, setNotifications] = useState<ClientQueueNotification[]>([]);
  const [requests, setRequests] = useState<ClientQueueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueueStatus = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active queue items for this patient
      const { data: items, error: itemsError } = await supabase
        .from('queue_items')
        .select(`
          id,
          ticket_number,
          status,
          priority,
          arrival_time,
          called_at,
          sequence_number,
          queue:queue_definitions(
            id,
            name,
            service_type,
            facility:facilities(name)
          )
        `)
        .eq('patient_id', patientId)
        .in('status', ['waiting', 'called', 'in_service', 'paused'])
        .order('arrival_time', { ascending: false });

      if (itemsError) throw itemsError;

      // Calculate position bands for waiting items
      const processedItems: ClientQueueItem[] = await Promise.all(
        (items || []).map(async (item: any) => {
          let position = 0;
          let estimatedWait: number | null = null;
          let positionBand: 'next' | 'soon' | 'later' | 'unknown' = 'unknown';

          if (item.status === 'waiting' && item.queue) {
            // Get position in queue
            const { count } = await supabase
              .from('queue_items')
              .select('*', { count: 'exact', head: true })
              .eq('queue_id', item.queue.id)
              .eq('status', 'waiting')
              .lt('sequence_number', item.sequence_number);

            position = (count || 0) + 1;
            estimatedWait = position * 10; // Rough estimate: 10 min per patient

            if (position <= 2) positionBand = 'next';
            else if (position <= 5) positionBand = 'soon';
            else positionBand = 'later';
          }

          return {
            id: item.id,
            ticket_number: item.ticket_number,
            status: item.status,
            priority: item.priority,
            queue_name: item.queue?.name || 'Unknown Queue',
            service_type: item.queue?.service_type || 'unknown',
            arrival_time: item.arrival_time,
            called_at: item.called_at,
            estimated_wait_minutes: estimatedWait,
            position_band: positionBand,
            position,
            facility_name: item.queue?.facility?.name || 'Unknown Facility',
          };
        })
      );

      setQueueItems(processedItems);
    } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchNotifications = useCallback(async () => {
    if (!patientId) return;

    try {
      const { data, error: notifError } = await supabase
        .from('client_queue_notifications')
        .select('*')
        .eq('patient_id', patientId)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (notifError) throw notifError;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [patientId]);

  const fetchRequests = useCallback(async () => {
    if (!patientId) return;

    try {
      const { data, error: reqError } = await supabase
        .from('client_queue_requests')
        .select(`
          id,
          service_type,
          requested_date,
          status,
          rejection_reason,
          created_at,
          facility:facilities(name),
          queue:queue_definitions(name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reqError) throw reqError;
      setRequests(
        (data || []).map((r: any) => ({
          id: r.id,
          service_type: r.service_type,
          requested_date: r.requested_date,
          status: r.status,
          facility_name: r.facility?.name || 'Unknown',
          queue_name: r.queue?.name || null,
          rejection_reason: r.rejection_reason,
          created_at: r.created_at,
        }))
      );
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  }, [patientId]);

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('client_queue_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      toast.error('Failed to mark notification as read');
      return;
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  // Acknowledge notification
  const acknowledgeNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('client_queue_notifications')
      .update({
        acknowledged_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      toast.error('Failed to acknowledge notification');
      return;
    }

    toast.success('Notification acknowledged');
    fetchNotifications();
  };

  // Client step-out action
  const stepOutOfQueue = async (queueItemId: string, reason: string) => {
    const { error } = await supabase
      .from('queue_items')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    if (error) {
      toast.error('Failed to step out of queue');
      return false;
    }

    toast.success('You have stepped out. Your position will be held temporarily.');
    fetchQueueStatus();
    return true;
  };

  // Client cancel action
  const cancelQueueEntry = async (queueItemId: string, reason: string) => {
    const { error } = await supabase
      .from('queue_items')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    if (error) {
      toast.error('Failed to cancel queue entry');
      return false;
    }

    toast.success('Queue entry cancelled');
    fetchQueueStatus();
    return true;
  };

  // Resume after step-out
  const resumeInQueue = async (queueItemId: string) => {
    const { error } = await supabase
      .from('queue_items')
      .update({
        status: 'waiting',
        resumed_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    if (error) {
      toast.error('Failed to resume in queue');
      return false;
    }

    toast.success('You are back in the queue');
    fetchQueueStatus();
    return true;
  };

  // Submit remote queue request
  const submitQueueRequest = async (request: {
    facility_id: string;
    service_type: string;
    requested_date: string;
    reason_for_visit?: string;
  }) => {
    if (!patientId) {
      toast.error('Patient not identified');
      return false;
    }

    const { error } = await supabase.from('client_queue_requests').insert({
      patient_id: patientId,
      facility_id: request.facility_id,
      service_type: request.service_type,
      requested_date: request.requested_date,
      reason_for_visit: request.reason_for_visit,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to submit queue request');
      return false;
    }

    toast.success('Queue request submitted for review');
    fetchRequests();
    return true;
  };

  // Cancel pending request
  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('client_queue_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to cancel request');
      return false;
    }

    toast.success('Request cancelled');
    fetchRequests();
    return true;
  };

  // Initial fetch
  useEffect(() => {
    fetchQueueStatus();
    fetchNotifications();
    fetchRequests();
  }, [fetchQueueStatus, fetchNotifications, fetchRequests]);

  // Real-time subscriptions
  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel(`client-queue-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          fetchQueueStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_queue_notifications',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const newNotif = payload.new as ClientQueueNotification;
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Show toast for new notifications
          if (newNotif.priority === 'urgent' || newNotif.priority === 'high') {
            toast.info(newNotif.title, { description: newNotif.message });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, fetchQueueStatus]);

  return {
    queueItems,
    notifications,
    requests,
    loading,
    error,
    unreadCount: notifications.filter((n) => !n.read_at).length,
    refetch: () => {
      fetchQueueStatus();
      fetchNotifications();
      fetchRequests();
    },
    markNotificationRead,
    acknowledgeNotification,
    stepOutOfQueue,
    cancelQueueEntry,
    resumeInQueue,
    submitQueueRequest,
    cancelRequest,
  };
}
