import { supabase } from "@/integrations/supabase/client";
import { addDays, format, setHours, setMinutes, parseISO, isAfter } from "date-fns";

interface ScheduleConfig {
  medicationOrderId: string;
  frequency: string;
  startDate: Date;
  durationDays?: number;
}

// Map frequency codes to administration times
const FREQUENCY_SCHEDULES: Record<string, string[]> = {
  'Once daily (OD)': ['08:00'],
  'Twice daily (BD)': ['08:00', '20:00'],
  'Three times daily (TDS)': ['08:00', '14:00', '20:00'],
  'Four times daily (QDS)': ['08:00', '12:00', '16:00', '20:00'],
  'Every 4 hours (Q4H)': ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'],
  'Every 6 hours (Q6H)': ['06:00', '12:00', '18:00', '00:00'],
  'Every 8 hours (Q8H)': ['06:00', '14:00', '22:00'],
  'Every 12 hours (Q12H)': ['08:00', '20:00'],
  'At bedtime (Nocte)': ['21:00'],
  'Stat (immediately)': [], // Handled separately
  'Weekly': ['08:00'], // Once per week
};

export async function generateMedicationSchedule(config: ScheduleConfig): Promise<void> {
  const { medicationOrderId, frequency, startDate, durationDays = 7 } = config;

  // Skip PRN medications - they don't have fixed schedules
  if (frequency === 'As needed (PRN)') {
    return;
  }

  const times = FREQUENCY_SCHEDULES[frequency];
  if (!times || times.length === 0) {
    // For Stat orders, create single immediate schedule
    if (frequency === 'Stat (immediately)') {
      await supabase.from('medication_schedule_times').insert({
        medication_order_id: medicationOrderId,
        scheduled_date: format(startDate, 'yyyy-MM-dd'),
        scheduled_time: format(new Date(), 'HH:mm'),
        status: 'scheduled',
      });
    }
    return;
  }

  const schedules: {
    medication_order_id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
  }[] = [];

  // Handle weekly frequency differently
  const isWeekly = frequency === 'Weekly';
  const totalDays = isWeekly ? Math.ceil(durationDays / 7) * 7 : durationDays;
  const dayIncrement = isWeekly ? 7 : 1;

  for (let day = 0; day < totalDays; day += dayIncrement) {
    const currentDate = addDays(startDate, day);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    for (const time of times) {
      schedules.push({
        medication_order_id: medicationOrderId,
        scheduled_date: dateStr,
        scheduled_time: time,
        status: 'scheduled',
      });
    }
  }

  if (schedules.length > 0) {
    const { error } = await supabase
      .from('medication_schedule_times')
      .insert(schedules);

    if (error) {
      console.error('Failed to generate medication schedules:', error);
      throw error;
    }
  }
}

/**
 * Extend existing medication schedules by adding more days
 */
export async function extendMedicationSchedule(
  medicationOrderId: string,
  frequency: string,
  additionalDays: number
): Promise<void> {
  // Skip PRN medications
  if (frequency === 'As needed (PRN)') {
    return;
  }

  // Get the last scheduled date for this medication
  const { data: lastSchedule, error: fetchError } = await supabase
    .from('medication_schedule_times')
    .select('scheduled_date')
    .eq('medication_order_id', medicationOrderId)
    .order('scheduled_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch last schedule:', fetchError);
    throw fetchError;
  }

  // Start from day after last scheduled date, or today if no schedules exist
  const startDate = lastSchedule 
    ? addDays(parseISO(lastSchedule.scheduled_date), 1)
    : new Date();

  await generateMedicationSchedule({
    medicationOrderId,
    frequency,
    startDate,
    durationDays: additionalDays,
  });
}

/**
 * Regenerate all future schedules for a medication order (useful when frequency changes)
 */
export async function regenerateMedicationSchedule(
  medicationOrderId: string,
  frequency: string,
  durationDays: number
): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Delete all future scheduled (not given/missed) doses
  const { error: deleteError } = await supabase
    .from('medication_schedule_times')
    .delete()
    .eq('medication_order_id', medicationOrderId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', today);

  if (deleteError) {
    console.error('Failed to delete existing schedules:', deleteError);
    throw deleteError;
  }

  // Generate new schedules starting from today
  await generateMedicationSchedule({
    medicationOrderId,
    frequency,
    startDate: new Date(),
    durationDays,
  });
}

/**
 * Renew a medication order by extending schedules
 */
export async function renewMedicationOrder(
  orderId: string,
  newDurationDays: number
): Promise<void> {
  // Get the order details
  const { data: order, error: orderError } = await supabase
    .from('medication_orders')
    .select('frequency, duration')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error('Failed to fetch medication order');
  }

  // Update the order end date
  const newEndDate = addDays(new Date(), newDurationDays);
  await supabase
    .from('medication_orders')
    .update({
      end_date: newEndDate.toISOString(),
      duration: `${newDurationDays} days`,
    })
    .eq('id', orderId);

  // Extend schedules
  await extendMedicationSchedule(orderId, order.frequency, newDurationDays);
}

export function getNextScheduledTime(frequency: string): Date | null {
  const times = FREQUENCY_SCHEDULES[frequency];
  if (!times || times.length === 0) return null;

  const now = new Date();
  const currentTimeStr = format(now, 'HH:mm');

  // Find the next scheduled time today
  for (const time of times) {
    if (time > currentTimeStr) {
      const [hours, minutes] = time.split(':').map(Number);
      return setMinutes(setHours(now, hours), minutes);
    }
  }

  // If no time left today, return first time tomorrow
  const [hours, minutes] = times[0].split(':').map(Number);
  return setMinutes(setHours(addDays(now, 1), hours), minutes);
}

export function parseDuration(duration: string | null): number {
  if (!duration) return 7; // Default 7 days
  
  const match = duration.match(/(\d+)\s*(day|week|month)/i);
  if (!match) return 7;
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'day':
    case 'days':
      return value;
    case 'week':
    case 'weeks':
      return value * 7;
    case 'month':
    case 'months':
      return value * 30;
    default:
      return 7;
  }
}

export { FREQUENCY_SCHEDULES };
