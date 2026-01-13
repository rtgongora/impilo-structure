import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subDays, addDays } from "date-fns";

export type AppointmentViewFilter = 'today' | 'overdue' | 'upcoming' | 'all';

export interface QueueAppointment {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  queue_id: string | null;
  appointment_type: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  department: string | null;
  location: string | null;
  room: string | null;
  reason: string | null;
  priority: string | null;
  booking_reference: string | null;
  checked_in_at: string | null;
  queue_item_id: string | null;
  follow_up_needed: boolean | null;
  follow_up_reason: string | null;
  missed_at: string | null;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    mrn: string;
  } | null;
  queue?: {
    id: string;
    name: string;
    service_type: string;
  } | null;
}

export interface QueueAppointmentCounts {
  expected: number;
  checkedIn: number;
  attended: number;
  noShow: number;
  followUp: number;
  walkIn: number;
}

export function useQueueAppointments(queueId?: string, filter: AppointmentViewFilter = 'today') {
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [counts, setCounts] = useState<QueueAppointmentCounts>({
    expected: 0,
    checkedIn: 0,
    attended: 0,
    noShow: 0,
    followUp: 0,
    walkIn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(id, first_name, last_name, mrn),
          queue:queue_definitions(id, name, service_type)
        `)
        .order("scheduled_start", { ascending: true });

      // Filter by queue if specified
      if (queueId) {
        query = query.eq("queue_id", queueId);
      }

      // Apply date filters based on view
      switch (filter) {
        case 'today':
          query = query
            .gte("scheduled_start", todayStart.toISOString())
            .lte("scheduled_start", todayEnd.toISOString());
          break;
        case 'overdue':
          // Past appointments that weren't completed
          query = query
            .lt("scheduled_start", todayStart.toISOString())
            .in("status", ["scheduled", "confirmed", "no-show"]);
          break;
        case 'upcoming':
          // Future appointments (next 7 days)
          query = query
            .gt("scheduled_start", todayEnd.toISOString())
            .lte("scheduled_start", addDays(todayEnd, 7).toISOString());
          break;
        case 'all':
          // Last 7 days to next 7 days
          query = query
            .gte("scheduled_start", subDays(todayStart, 7).toISOString())
            .lte("scheduled_start", addDays(todayEnd, 7).toISOString());
          break;
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const appointmentList = data || [];
      setAppointments(appointmentList);

      // Calculate counts
      const expected = appointmentList.filter(
        a => ["scheduled", "confirmed"].includes(a.status) && !a.checked_in_at
      ).length;
      
      const checkedIn = appointmentList.filter(
        a => a.checked_in_at && a.status !== "completed"
      ).length;
      
      const attended = appointmentList.filter(
        a => a.status === "completed"
      ).length;
      
      const noShow = appointmentList.filter(
        a => a.status === "no-show"
      ).length;
      
      const followUp = appointmentList.filter(
        a => a.follow_up_needed === true
      ).length;

      // Walk-ins would be queue items without an appointment_id
      // This is tracked separately in queue_items

      setCounts({
        expected,
        checkedIn,
        attended,
        noShow,
        followUp,
        walkIn: 0, // Calculated from queue_items separately
      });

    } catch (err) {
      console.error("Error fetching queue appointments:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [queueId, filter]);

  // Check in an appointment - create queue item
  const checkInAppointment = async (appointmentId: string, queueId: string) => {
    try {
      // Get appointment details
      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .select("*, patient:patients(id, first_name, last_name)")
        .eq("id", appointmentId)
        .single();

      if (aptError) throw aptError;

      // Create queue item
      const { data: queueItem, error: queueError } = await supabase
        .from("queue_items")
        .insert({
          queue_id: queueId,
          patient_id: appointment.patient_id,
          appointment_id: appointmentId,
          entry_type: "appointment",
          priority: appointment.priority === "urgent" ? "urgent" : "scheduled",
          reason_for_visit: appointment.reason,
          arrival_time: new Date().toISOString(),
          arrival_date: format(new Date(), "yyyy-MM-dd"),
          status: "waiting",
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Update appointment with check-in time and queue item link
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          checked_in_at: new Date().toISOString(),
          queue_item_id: queueItem.id,
          status: "checked-in",
        })
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      await fetchAppointments();
      return queueItem;
    } catch (err) {
      console.error("Error checking in appointment:", err);
      throw err;
    }
  };

  // Mark appointment as follow-up needed
  const markFollowUpNeeded = async (appointmentId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          follow_up_needed: true,
          follow_up_reason: reason,
          follow_up_created_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;
      await fetchAppointments();
    } catch (err) {
      console.error("Error marking follow-up:", err);
      throw err;
    }
  };

  // Mark appointment as completed
  const completeAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          actual_end: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;
      await fetchAppointments();
    } catch (err) {
      console.error("Error completing appointment:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    counts,
    loading,
    error,
    refetch: fetchAppointments,
    checkInAppointment,
    markFollowUpNeeded,
    completeAppointment,
  };
}
