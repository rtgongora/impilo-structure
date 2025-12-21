import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addHours, setHours, setMinutes, format } from "date-fns";

export interface TheatreBooking {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  theatre_room: string;
  procedure_name: string;
  procedure_code: string | null;
  surgeon_id: string | null;
  anaesthetist_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  priority: string;
  pre_op_notes: string | null;
  post_op_notes: string | null;
  equipment_required: string[] | null;
  created_by: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

export function useTheatreBookings(selectedDate?: Date) {
  const [bookings, setBookings] = useState<TheatreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("theatre_bookings")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .order("scheduled_start", { ascending: true });

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte("scheduled_start", startOfDay.toISOString())
          .lte("scheduled_start", endOfDay.toISOString());
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (booking: {
    patient_id: string;
    encounter_id?: string;
    theatre_room: string;
    procedure_name: string;
    procedure_code?: string;
    surgeon_id?: string;
    anaesthetist_id?: string;
    scheduled_date: Date;
    start_time: string;
    duration: number;
    priority?: string;
    pre_op_notes?: string;
    equipment_required?: string[];
  }) => {
    if (!user) return null;

    try {
      const [hours, minutes] = booking.start_time.split(":").map(Number);
      const scheduledStart = setMinutes(setHours(booking.scheduled_date, hours), minutes);
      const scheduledEnd = addHours(scheduledStart, booking.duration / 60);

      const { data, error: insertError } = await supabase
        .from("theatre_bookings")
        .insert({
          patient_id: booking.patient_id,
          encounter_id: booking.encounter_id,
          theatre_room: booking.theatre_room,
          procedure_name: booking.procedure_name,
          procedure_code: booking.procedure_code,
          surgeon_id: booking.surgeon_id,
          anaesthetist_id: booking.anaesthetist_id,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          priority: booking.priority || "elective",
          pre_op_notes: booking.pre_op_notes,
          equipment_required: booking.equipment_required,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchBookings();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const updates: Record<string, any> = { status };
      
      if (status === "in-progress") {
        updates.actual_start = new Date().toISOString();
      } else if (status === "completed") {
        updates.actual_end = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("theatre_bookings")
        .update(updates)
        .eq("id", bookingId);

      if (updateError) throw updateError;
      await fetchBookings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    await updateBookingStatus(bookingId, "cancelled");
  };

  useEffect(() => {
    fetchBookings();
  }, [user, selectedDate?.toDateString()]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBookingStatus,
    cancelBooking,
  };
}
