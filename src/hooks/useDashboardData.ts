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

export interface DashboardOrder {
  id: string;
  orderName: string;
  orderType: string;
  status: string;
  priority: string;
  patientName: string;
  patientMrn: string;
  orderedAt: string;
  patientId?: string;
  encounterId?: string;
}

export interface DashboardReferral {
  id: string;
  patientName: string;
  patientMrn: string;
  referralType: string;
  specialty: string;
  urgency: string;
  status: string;
  createdAt: string;
  fromFacility?: string;
  toFacility?: string;
}

export interface DashboardResult {
  id: string;
  testName: string;
  resultType: string;
  status: string;
  patientName: string;
  patientMrn: string;
  reportedAt: string;
  isCritical: boolean;
}

export interface AggregateStats {
  myPatients: number;
  pendingTasks: number;
  criticalAlerts: number;
  completedToday: number;
  pendingOrders: number;
  pendingResults: number;
  activeReferrals: number;
  pendingConsults: number;
}

export function useDashboardData() {
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [referrals, setReferrals] = useState<DashboardReferral[]>([]);
  const [results, setResults] = useState<DashboardResult[]>([]);
  const [stats, setStats] = useState<AggregateStats>({
    myPatients: 0,
    pendingTasks: 0,
    criticalAlerts: 0,
    completedToday: 0,
    pendingOrders: 0,
    pendingResults: 0,
    activeReferrals: 0,
    pendingConsults: 0,
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
        const { data: clinicalOrders } = await supabase
          .from("clinical_orders")
          .select(`
            id,
            order_name,
            order_type,
            priority,
            status,
            created_at,
            patient_id,
            encounter_id,
            patient:patients(first_name, last_name, mrn)
          `)
          .in("status", ["pending", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(50);

        if (clinicalOrders) {
          // Tasks from orders
          const dashboardTasks: DashboardTask[] = clinicalOrders.slice(0, 10).map((order) => ({
            id: order.id,
            title: order.order_name,
            type: order.order_type,
            due: getDueStatus(order.created_at),
            priority: order.priority as "critical" | "high" | "medium" | "low",
            patientId: order.patient_id,
            encounterId: order.encounter_id,
          }));
          setTasks(dashboardTasks);

          // Orders list
          const dashboardOrders: DashboardOrder[] = clinicalOrders.map((order) => ({
            id: order.id,
            orderName: order.order_name,
            orderType: order.order_type,
            status: order.status,
            priority: order.priority,
            patientName: order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : "Unknown",
            patientMrn: order.patient?.mrn || "",
            orderedAt: getRelativeTime(order.created_at),
            patientId: order.patient_id,
            encounterId: order.encounter_id,
          }));
          setOrders(dashboardOrders);
        }

        // Fetch referrals
        const { data: referralData } = await supabase
          .from("referrals")
          .select(`
            id,
            referral_type,
            to_department,
            from_department,
            urgency,
            status,
            created_at,
            patient:patients(first_name, last_name, mrn)
          `)
          .in("status", ["pending", "accepted", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(20);

        if (referralData) {
          const dashboardReferrals: DashboardReferral[] = referralData.map((ref) => ({
            id: ref.id,
            patientName: ref.patient ? `${ref.patient.first_name} ${ref.patient.last_name}` : "Unknown",
            patientMrn: ref.patient?.mrn || "",
            referralType: ref.referral_type || "Consultation",
            specialty: ref.to_department || "General",
            urgency: ref.urgency || "routine",
            status: ref.status,
            createdAt: getRelativeTime(ref.created_at),
            fromFacility: ref.from_department || undefined,
            toFacility: ref.to_department || undefined,
          }));
          setReferrals(dashboardReferrals);
        }

        // Fetch lab results with lab_order for patient info
        const { data: labResults } = await supabase
          .from("lab_results")
          .select(`
            id,
            test_name,
            status,
            is_critical,
            released_at,
            performed_at,
            lab_order:lab_orders(
              patient:patients(first_name, last_name, mrn)
            )
          `)
          .in("status", ["pending", "preliminary", "final"])
          .order("created_at", { ascending: false })
          .limit(20);

        if (labResults) {
          const dashboardResults: DashboardResult[] = labResults.map((result) => {
            const patient = result.lab_order?.patient;
            return {
              id: result.id,
              testName: result.test_name,
              resultType: "lab",
              status: result.status,
              patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown",
              patientMrn: patient?.mrn || "",
              reportedAt: result.released_at ? getRelativeTime(result.released_at) : 
                          result.performed_at ? getRelativeTime(result.performed_at) : "Pending",
              isCritical: result.is_critical || false,
            };
          });
          setResults(dashboardResults);
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

        const { count: pendingResultsCount } = await supabase
          .from("lab_results")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "preliminary"]);

        const { count: activeReferralsCount } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "accepted", "in_progress"]);

        setStats({
          myPatients: activeEncounters || 0,
          pendingTasks: pendingOrders || 0,
          criticalAlerts: criticalAlerts || 0,
          completedToday: completedToday || 0,
          pendingOrders: pendingOrders || 0,
          pendingResults: pendingResultsCount || 0,
          activeReferrals: activeReferralsCount || 0,
          pendingConsults: activeReferralsCount || 0,
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
    orders,
    referrals,
    results,
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
