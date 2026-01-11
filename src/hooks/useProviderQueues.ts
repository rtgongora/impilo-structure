import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QueueSummary {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  waiting: number;
  inService: number;
  avgWaitMinutes: number | null;
  nextPatientName: string | null;
  nextPatientId: string | null;
  hasUrgent: boolean;
  colorCode: string | null;
}

export function useProviderQueues(facilityId?: string) {
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active queue definitions
      const { data: queueDefs, error: queueError } = await supabase
        .from("queue_definitions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (queueError) throw queueError;

      if (!queueDefs || queueDefs.length === 0) {
        setQueues([]);
        setTotalWaiting(0);
        return;
      }

      // Fetch all active queue items with patient info
      const { data: queueItems, error: itemsError } = await supabase
        .from("queue_items")
        .select(`
          id,
          queue_id,
          patient_id,
          status,
          priority,
          created_at,
          called_at,
          patient:patients(id, first_name, last_name)
        `)
        .in("status", ["waiting", "called", "in_service"])
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      // Aggregate data per queue
      let total = 0;
      const queueSummaries: QueueSummary[] = queueDefs.map((qd) => {
        const items = (queueItems || []).filter((qi) => qi.queue_id === qd.id);
        const waitingItems = items.filter((qi) => qi.status === "waiting");
        const inServiceItems = items.filter((qi) => qi.status === "in_service");
        const hasUrgent = items.some(
          (qi) => qi.priority === "emergency" || qi.priority === "urgent"
        );

        // Calculate average wait time for waiting items
        let avgWaitMinutes: number | null = null;
        if (waitingItems.length > 0) {
          const now = new Date();
          const totalWaitMs = waitingItems.reduce((sum, qi) => {
            const created = new Date(qi.created_at);
            return sum + (now.getTime() - created.getTime());
          }, 0);
          avgWaitMinutes = Math.round(totalWaitMs / waitingItems.length / 60000);
        }

        // Get next patient (first waiting, ordered by priority then created_at)
        const priorityOrder = ["emergency", "urgent", "high", "routine", "scheduled", "low"];
        const sortedWaiting = [...waitingItems].sort((a, b) => {
          const aPriority = priorityOrder.indexOf(a.priority || "routine");
          const bPriority = priorityOrder.indexOf(b.priority || "routine");
          if (aPriority !== bPriority) return aPriority - bPriority;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const nextPatient = sortedWaiting[0]?.patient;
        total += waitingItems.length;

        return {
          id: qd.id,
          name: qd.name,
          description: qd.description,
          serviceType: qd.service_type,
          waiting: waitingItems.length,
          inService: inServiceItems.length,
          avgWaitMinutes,
          nextPatientName: nextPatient
            ? `${nextPatient.first_name?.charAt(0)}. ${nextPatient.last_name}`
            : null,
          nextPatientId: sortedWaiting[0]?.patient_id || null,
          hasUrgent,
          colorCode: qd.color_code,
        };
      });

      // Filter out empty queues and sort by waiting count
      const activeQueues = queueSummaries
        .filter((q) => q.waiting > 0 || q.inService > 0)
        .sort((a, b) => {
          // Urgent first, then by waiting count
          if (a.hasUrgent !== b.hasUrgent) return a.hasUrgent ? -1 : 1;
          return b.waiting - a.waiting;
        });

      setQueues(activeQueues);
      setTotalWaiting(total);
    } catch (err) {
      console.error("Error fetching provider queues:", err);
      setError("Failed to load queue data");
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchQueues();

    // Subscribe to realtime updates for queue_items
    const channel = supabase
      .channel("provider-queues")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_items",
        },
        () => {
          fetchQueues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueues]);

  return {
    queues,
    loading,
    totalWaiting,
    error,
    refetch: fetchQueues,
  };
}
