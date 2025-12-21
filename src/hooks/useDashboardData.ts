import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardPatient {
  id: string;
  name: string;
  mrn: string;
  ward: string | null;
  bed: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  lastUpdate: string;
  encounterId?: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  type: string;
  due: "Overdue" | "Today" | "Tomorrow";
  priority: "critical" | "high" | "medium" | "low";
  patientId?: string;
  encounterId?: string;
}

export function useDashboardData() {
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [stats, setStats] = useState({
    myPatients: 0,
    pendingTasks: 0,
    criticalAlerts: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch active encounters with patients
        const { data: encounters } = await supabase
          .from("encounters")
          .select(`
            id,
            status,
            ward,
            bed,
            triage_category,
            updated_at,
            patient:patients(id, first_name, last_name, mrn)
          `)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(20);

        if (encounters) {
          const dashboardPatients: DashboardPatient[] = encounters.map((enc) => ({
            id: enc.patient?.id || "",
            name: `${enc.patient?.first_name} ${enc.patient?.last_name}`,
            mrn: enc.patient?.mrn || "",
            ward: enc.ward,
            bed: enc.bed,
            priority: mapTriageToPriority(enc.triage_category),
            status: enc.status === "active" ? "Active" : enc.status,
            lastUpdate: getRelativeTime(enc.updated_at),
            encounterId: enc.id,
          }));
          setPatients(dashboardPatients);
        }

        // Fetch pending clinical orders as tasks
        const { data: orders } = await supabase
          .from("clinical_orders")
          .select(`
            id,
            order_name,
            order_type,
            priority,
            created_at,
            patient_id,
            encounter_id
          `)
          .in("status", ["pending", "in_progress"])
          .order("created_at", { ascending: true })
          .limit(10);

        if (orders) {
          const dashboardTasks: DashboardTask[] = orders.map((order) => ({
            id: order.id,
            title: order.order_name,
            type: order.order_type,
            due: getDueStatus(order.created_at),
            priority: order.priority as "critical" | "high" | "medium" | "low",
            patientId: order.patient_id,
            encounterId: order.encounter_id,
          }));
          setTasks(dashboardTasks);
        }

        // Fetch stats
        const { count: activeEncounters } = await supabase
          .from("encounters")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        const { count: pendingOrders } = await supabase
          .from("clinical_orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "in_progress"]);

        const { count: criticalAlerts } = await supabase
          .from("clinical_alerts")
          .select("*", { count: "exact", head: true })
          .eq("severity", "critical")
          .eq("is_resolved", false);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: completedToday } = await supabase
          .from("clinical_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("completed_at", today.toISOString());

        setStats({
          myPatients: activeEncounters || 0,
          pendingTasks: pendingOrders || 0,
          criticalAlerts: criticalAlerts || 0,
          completedToday: completedToday || 0,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return {
    patients,
    tasks,
    stats,
    loading,
  };
}

function mapTriageToPriority(triage: string | null): "critical" | "high" | "medium" | "low" {
  switch (triage?.toLowerCase()) {
    case "resuscitation":
    case "red":
      return "critical";
    case "emergent":
    case "orange":
      return "high";
    case "urgent":
    case "yellow":
      return "medium";
    default:
      return "low";
  }
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getDueStatus(createdAt: string): "Overdue" | "Today" | "Tomorrow" {
  const now = new Date();
  const created = new Date(createdAt);
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) return "Overdue";
  if (hoursSinceCreation > 12) return "Today";
  return "Tomorrow";
}
