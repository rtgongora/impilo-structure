import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, subMonths } from "date-fns";

export type DateRange = "today" | "week" | "month" | "quarter" | "year";

function getDateRange(range: DateRange): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function usePatientStats(dateRange: DateRange) {
  return useQuery({
    queryKey: ["patient-stats", dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);
      
      // Get total patients
      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Get encounters in date range
      const { data: encounters } = await supabase
        .from("encounters")
        .select("id, encounter_type, admission_date")
        .gte("admission_date", start.toISOString())
        .lte("admission_date", end.toISOString());

      // Count by type
      const outpatient = encounters?.filter(e => e.encounter_type === "outpatient").length || 0;
      const inpatient = encounters?.filter(e => e.encounter_type === "inpatient").length || 0;
      const emergency = encounters?.filter(e => e.encounter_type === "emergency").length || 0;

      // Get previous period for comparison
      const { start: prevStart, end: prevEnd } = getDateRange(dateRange);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      const prevEndDate = new Date(end.getTime() - daysDiff * 24 * 60 * 60 * 1000);

      const { data: prevEncounters } = await supabase
        .from("encounters")
        .select("id", { count: "exact" })
        .gte("admission_date", prevStartDate.toISOString())
        .lte("admission_date", prevEndDate.toISOString());

      const currentTotal = (encounters?.length || 0);
      const prevTotal = (prevEncounters?.length || 0);
      const percentChange = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0;

      return {
        totalPatients: totalPatients || 0,
        currentPeriodEncounters: currentTotal,
        outpatient,
        inpatient,
        emergency,
        percentChange
      };
    },
  });
}

export function useBedOccupancy() {
  return useQuery({
    queryKey: ["bed-occupancy"],
    queryFn: async () => {
      const { data: beds } = await supabase
        .from("beds")
        .select("ward_name, status");

      if (!beds) return [];

      // Group by ward
      const wardMap = beds.reduce((acc, bed) => {
        if (!acc[bed.ward_name]) {
          acc[bed.ward_name] = { total: 0, occupied: 0 };
        }
        acc[bed.ward_name].total++;
        if (bed.status === "occupied") {
          acc[bed.ward_name].occupied++;
        }
        return acc;
      }, {} as Record<string, { total: number; occupied: number }>);

      return Object.entries(wardMap).map(([ward, stats]) => ({
        ward,
        total: stats.total,
        occupied: stats.occupied,
        available: stats.total - stats.occupied,
        occupancyRate: Math.round((stats.occupied / stats.total) * 100)
      }));
    },
  });
}

export function useAppointmentStats(dateRange: DateRange) {
  return useQuery({
    queryKey: ["appointment-stats", dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);

      const { data: appointments, count } = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .gte("scheduled_start", start.toISOString())
        .lte("scheduled_start", end.toISOString());

      const completed = appointments?.filter(a => a.status === "completed").length || 0;
      const scheduled = appointments?.filter(a => a.status === "scheduled").length || 0;
      const cancelled = appointments?.filter(a => a.status === "cancelled").length || 0;

      return {
        total: count || 0,
        completed,
        scheduled,
        cancelled,
      };
    },
  });
}

export function useRevenueStats(dateRange: DateRange) {
  return useQuery({
    queryKey: ["revenue-stats", dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);

      const { data: charges } = await supabase
        .from("encounter_charges")
        .select("total_amount, charged_at, is_voided")
        .gte("charged_at", start.toISOString())
        .lte("charged_at", end.toISOString())
        .eq("is_voided", false);

      const totalRevenue = charges?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;

      // Group by month for chart
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(new Date(), 5 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthCharges = charges?.filter(c => {
          const chargeDate = new Date(c.charged_at);
          return chargeDate >= monthStart && chargeDate <= monthEnd;
        }) || [];

        return {
          month: format(monthDate, "MMM"),
          revenue: monthCharges.reduce((sum, c) => sum + Number(c.total_amount), 0),
        };
      });

      return {
        totalRevenue,
        monthlyData,
      };
    },
  });
}

export function useEncounterTrends() {
  return useQuery({
    queryKey: ["encounter-trends"],
    queryFn: async () => {
      const monthlyData = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const monthDate = subMonths(new Date(), 11 - i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const { data: encounters } = await supabase
            .from("encounters")
            .select("encounter_type")
            .gte("admission_date", monthStart.toISOString())
            .lte("admission_date", monthEnd.toISOString());

          return {
            month: format(monthDate, "MMM"),
            outpatient: encounters?.filter(e => e.encounter_type === "outpatient").length || 0,
            inpatient: encounters?.filter(e => e.encounter_type === "inpatient").length || 0,
            emergency: encounters?.filter(e => e.encounter_type === "emergency").length || 0,
          };
        })
      );

      return monthlyData;
    },
  });
}

export function useDiagnosisStats() {
  return useQuery({
    queryKey: ["diagnosis-stats"],
    queryFn: async () => {
      const { data: encounters } = await supabase
        .from("encounters")
        .select("primary_diagnosis")
        .not("primary_diagnosis", "is", null);

      if (!encounters) return [];

      // Count diagnoses
      const diagnosisCounts = encounters.reduce((acc, e) => {
        const diagnosis = e.primary_diagnosis || "Unknown";
        acc[diagnosis] = (acc[diagnosis] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(diagnosisCounts)
        .map(([name, count]) => ({ name, count, trend: "stable" as const, change: 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
  });
}
