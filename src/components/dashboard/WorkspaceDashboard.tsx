import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  ListTodo,
  Bell,
  FlaskConical,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShift } from "@/contexts/ShiftContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface DashboardTile {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant: "default" | "warning" | "success" | "destructive";
  action?: () => void;
  actionLabel?: string;
}

interface QueuePatient {
  id: string;
  ticket_number: string;
  patient_name: string;
  reason: string;
  wait_time: string;
  priority: string;
}

interface PendingTask {
  id: string;
  title: string;
  type: "lab_result" | "order" | "consult" | "follow_up";
  patient_name?: string;
  due?: string;
  priority: "high" | "medium" | "low";
}

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  time: string;
  type: string;
}

interface ClinicalAlert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  created_at: string;
}

export function WorkspaceDashboard() {
  const { activeShift, isOnShift } = useShift();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState<DashboardTile[]>([]);
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);

  useEffect(() => {
    if (isOnShift && activeShift?.current_workspace_id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isOnShift, activeShift?.current_workspace_id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const workspaceId = activeShift?.current_workspace_id;
      const today = new Date().toISOString().split("T")[0];

      // Fetch queue data
      const { data: queueData } = await supabase
        .from("queue_items")
        .select(`
          id, ticket_number, reason_for_visit, priority, arrival_time,
          patient:patients(first_name, last_name)
        `)
        .eq("status", "waiting")
        .eq("arrival_date", today)
        .order("priority")
        .order("arrival_time")
        .limit(5);

      const transformedQueue: QueuePatient[] = (queueData || []).map(q => ({
        id: q.id,
        ticket_number: q.ticket_number || "--",
        patient_name: q.patient ? `${q.patient.first_name} ${q.patient.last_name}` : "Unknown",
        reason: q.reason_for_visit || "General",
        wait_time: formatDistanceToNow(new Date(q.arrival_time), { addSuffix: false }),
        priority: q.priority,
      }));
      setQueuePatients(transformedQueue);

      // Fetch pending tasks (results, orders needing review)
      const { data: labResults } = await supabase
        .from("lab_results")
        .select("id, test_name, result_status, patient:patients(first_name, last_name)")
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(5);

      const transformedTasks: PendingTask[] = (labResults || []).map((r: any) => ({
        id: r.id,
        title: `Review: ${r.test_name || 'Lab Result'}`,
        type: "lab_result" as const,
        patient_name: r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : undefined,
        priority: r.result_status === "critical" ? "high" as const : "medium" as const,
      }));
      setPendingTasks(transformedTasks);

      // Fetch today's appointments
      const { data: apptData } = await supabase
        .from("appointments")
        .select("id, scheduled_start, appointment_type, patient:patients(first_name, last_name)")
        .gte("scheduled_start", `${today}T00:00:00`)
        .lte("scheduled_start", `${today}T23:59:59`)
        .eq("status", "confirmed")
        .order("scheduled_start")
        .limit(5);

      const transformedAppointments: UpcomingAppointment[] = (apptData || []).map(a => ({
        id: a.id,
        patient_name: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : "Unknown",
        time: new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: a.appointment_type,
      }));
      setAppointments(transformedAppointments);

      // Build summary tiles
      const summaryTiles: DashboardTile[] = [
        {
          id: "queue",
          title: "Patients Waiting",
          value: transformedQueue.length,
          subtitle: transformedQueue.length > 0 ? `Next: ${transformedQueue[0]?.ticket_number}` : "Queue empty",
          icon: Users,
          variant: transformedQueue.length > 5 ? "warning" : "default",
          actionLabel: "Call Next",
        },
        {
          id: "tasks",
          title: "Pending Tasks",
          value: transformedTasks.length,
          subtitle: transformedTasks.filter(t => t.priority === "high").length > 0 
            ? `${transformedTasks.filter(t => t.priority === "high").length} urgent` 
            : "No urgent tasks",
          icon: ListTodo,
          variant: transformedTasks.filter(t => t.priority === "high").length > 0 ? "destructive" : "default",
        },
        {
          id: "appointments",
          title: "Today's Appointments",
          value: transformedAppointments.length,
          subtitle: transformedAppointments[0]?.time 
            ? `Next at ${transformedAppointments[0].time}` 
            : "No more today",
          icon: Calendar,
          variant: "default",
        },
        {
          id: "completed",
          title: "Completed Today",
          value: 12, // Mock value
          subtitle: "Avg 18min/patient",
          icon: CheckCircle2,
          variant: "success",
        },
      ];
      setTiles(summaryTiles);

      // Mock alerts
      setAlerts([
        {
          id: "1",
          title: "Critical Lab Result",
          message: "Potassium 6.2 mEq/L for John Doe",
          severity: "critical",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVariantClass = (variant: DashboardTile["variant"]) => {
    switch (variant) {
      case "warning": return "border-warning bg-warning/5";
      case "success": return "border-success bg-success/5";
      case "destructive": return "border-destructive bg-destructive/5";
      default: return "";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>;
      case "very_urgent":
        return <Badge className="bg-orange-500">Very Urgent</Badge>;
      case "urgent":
        return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  if (!isOnShift) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">Not on Shift</h3>
          <p className="text-muted-foreground mb-4">
            Start your shift to view your workspace dashboard.
          </p>
          <Button>Start Shift</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {activeShift?.current_workspace_name || "Workspace Dashboard"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeShift?.facility_name}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Clock className="h-3 w-3" />
          On Shift
        </Badge>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === "critical").map(alert => (
        <Card key={alert.id} className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">{alert.title}</h4>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
              <Button size="sm" variant="destructive">View</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(tile => {
          const Icon = tile.icon;
          return (
            <Card key={tile.id} className={getVariantClass(tile.variant)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {tile.actionLabel && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      {tile.actionLabel}
                    </Button>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{tile.value}</p>
                  <p className="text-sm text-muted-foreground">{tile.title}</p>
                  {tile.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{tile.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Queue List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Queue
              </CardTitle>
              <Button size="sm" disabled={queuePatients.length === 0}>
                <Phone className="h-4 w-4 mr-1" />
                Call Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {queuePatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No patients waiting</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {queuePatients.map((patient, idx) => (
                    <div 
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-primary">
                          {patient.ticket_number}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{patient.patient_name}</p>
                          <p className="text-xs text-muted-foreground">{patient.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(patient.priority)}
                        <span className="text-xs text-muted-foreground">{patient.wait_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All caught up!</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.patient_name && (
                            <p className="text-xs text-muted-foreground">{task.patient_name}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={task.priority === "high" ? "destructive" : "secondary"}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No more appointments today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {appointments.map(apt => (
                <div 
                  key={apt.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">{apt.time}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{apt.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
