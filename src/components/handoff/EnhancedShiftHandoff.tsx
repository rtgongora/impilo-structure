import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Users,
  FileText,
  Loader2,
  Save,
  Send,
  XCircle,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShift } from "@/contexts/ShiftContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingTask {
  id: string;
  type: "queue_item" | "order" | "result" | "follow_up" | "consult";
  title: string;
  patient_id?: string;
  patient_name?: string;
  priority: "critical" | "high" | "medium" | "low";
  description?: string;
  due_time?: string;
  can_reassign: boolean;
}

interface HandoffAction {
  taskId: string;
  action: "reassign" | "complete" | "escalate" | "defer";
  assignTo?: string;
  notes?: string;
}

interface OnDutyProvider {
  id: string;
  name: string;
  workspace_name: string;
}

export function EnhancedShiftHandoff() {
  const { user, profile } = useAuth();
  const { activeShift, shiftDuration, endShift, actionLoading } = useShift();

  const [loading, setLoading] = useState(true);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [handoffActions, setHandoffActions] = useState<Map<string, HandoffAction>>(new Map());
  const [generalNotes, setGeneralNotes] = useState("");
  const [onDutyProviders, setOnDutyProviders] = useState<OnDutyProvider[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [unresolvedWarning, setUnresolvedWarning] = useState(false);

  useEffect(() => {
    fetchPendingTasks();
    fetchOnDutyProviders();
  }, []);

  const fetchPendingTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const tasks: PendingTask[] = [];

      // 1. Fetch queue items assigned to this provider
      const { data: queueItems } = await supabase
        .from("queue_items")
        .select("id, status, ticket_number, reason_for_visit, priority, patient_id")
        .eq("assigned_provider_id", user.id)
        .in("status", ["called", "in_service", "paused"])
        .order("priority");

      (queueItems || []).forEach((q: any) => {
        tasks.push({
          id: q.id,
          type: "queue_item",
          title: `Queue: ${q.ticket_number}`,
          patient_id: q.patient_id,
          patient_name: undefined,
          priority: mapPriority(q.priority),
          description: q.reason_for_visit,
          can_reassign: true,
        });
      });

      // 2. Fetch pending lab results needing review
      const { data: labResults }: { data: any[] | null } = await (supabase
        .from("lab_results")
        .select("id, test_name, result_status, patient_id")
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(10) as any);

      (labResults || []).forEach((r: any) => {
        tasks.push({
          id: r.id,
          type: "result",
          title: `Result: ${r.test_name || 'Lab Result'}`,
          patient_id: r.patient_id,
          patient_name: undefined,
          priority: r.result_status === "critical" ? "critical" : "medium",
          can_reassign: true,
        });
      });

      // 3. Fetch pending orders
      const { data: pendingOrders } = await supabase
        .from("medication_orders")
        .select("id, medication_name, status, patient_id")
        .eq("status", "pending")
        .limit(10);

      (pendingOrders || []).forEach((o: any) => {
        tasks.push({
          id: o.id,
          type: "order",
          title: `Order: ${o.medication_name}`,
          patient_id: o.patient_id,
          patient_name: undefined,
          priority: "medium",
          can_reassign: true,
        });
      });

      setPendingTasks(tasks);

      // Initialize default actions for each task
      const defaultActions = new Map<string, HandoffAction>();
      tasks.forEach(t => {
        defaultActions.set(t.id, {
          taskId: t.id,
          action: t.priority === "critical" ? "escalate" : "reassign",
        });
      });
      setHandoffActions(defaultActions);
    } catch (error) {
      console.error("Error fetching pending tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnDutyProviders = async () => {
    try {
      // Get providers currently on shift at same facility
      const { data } = await supabase
        .from("shifts")
        .select("provider_id")
        .eq("status", "active")
        .eq("facility_id", activeShift?.facility_id || "")
        .neq("provider_id", user?.id);

      const providers: OnDutyProvider[] = (data || []).map((s: any) => ({
        id: s.provider_id,
        name: "On-duty Provider",
        workspace_name: "Workspace",
      }));

      setOnDutyProviders(providers);
    } catch (error) {
      console.error("Error fetching on-duty providers:", error);
    }
  };

  const updateTaskAction = (taskId: string, action: HandoffAction["action"], assignTo?: string, notes?: string) => {
    const newActions = new Map(handoffActions);
    newActions.set(taskId, {
      taskId,
      action,
      assignTo,
      notes,
    });
    setHandoffActions(newActions);
  };

  const handleEndShift = async () => {
    // Check for unresolved critical tasks
    const unresolvedCritical = pendingTasks.filter(t => {
      const action = handoffActions.get(t.id);
      return t.priority === "critical" && (!action || (action.action === "reassign" && !action.assignTo));
    });

    if (unresolvedCritical.length > 0) {
      setUnresolvedWarning(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmEndShift = async () => {
    try {
      // 1. Process all task actions
      for (const [taskId, action] of handoffActions.entries()) {
        const task = pendingTasks.find(t => t.id === taskId);
        if (!task) continue;

        switch (action.action) {
          case "reassign":
            if (action.assignTo) {
              await reassignTask(task, action.assignTo, action.notes);
            }
            break;
          case "complete":
            await markTaskComplete(task);
            break;
          case "escalate":
            await escalateTask(task, action.notes);
            break;
          case "defer":
            // Leave as is but log
            await logDeferral(task, action.notes);
            break;
        }
      }

      // 2. Create handoff record
      await supabase.from("shift_handoffs").insert({
        outgoing_user_id: user?.id,
        shift_date: new Date().toISOString().split("T")[0],
        shift_time: format(new Date(), "HH:mm"),
        general_notes: generalNotes,
        status: "completed",
        tasks_handed_off: pendingTasks.length,
        task_actions: Object.fromEntries(handoffActions),
      });

      // 3. End the shift
      await endShift(generalNotes, `Shift completed with ${pendingTasks.length} tasks handed off`);
      
      setShowConfirmDialog(false);
      toast.success("Shift ended successfully");
    } catch (error) {
      console.error("Error ending shift:", error);
      toast.error("Failed to end shift");
    }
  };

  const reassignTask = async (task: PendingTask, providerId: string, notes?: string) => {
    if (task.type === "queue_item") {
      await supabase
        .from("queue_items")
        .update({ 
          assigned_provider_id: providerId,
          notes: notes ? `[Handoff] ${notes}` : undefined,
        })
        .eq("id", task.id);
    }
    // Add similar logic for other task types
  };

  const markTaskComplete = async (task: PendingTask) => {
    if (task.type === "queue_item") {
      await supabase
        .from("queue_items")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", task.id);
    }
  };

  const escalateTask = async (task: PendingTask, notes?: string) => {
    // Create escalation record
    await supabase.from("clinical_alerts").insert({
      patient_id: task.patient_id,
      alert_type: "handoff_escalation",
      title: `Escalated: ${task.title}`,
      message: notes || "Escalated during shift handoff",
      severity: task.priority === "critical" ? "critical" : "high",
    });
  };

  const logDeferral = async (task: PendingTask, notes?: string) => {
    // Log for audit purposes
    await supabase.from("audit_logs").insert({
      entity_type: "shift_handoff",
      entity_id: activeShift?.shift_id,
      action: "task_deferred",
      performed_by: user?.id || "",
      metadata: { task_id: task.id, task_title: task.title, notes },
    });
  };

  const getPriorityBadge = (priority: PendingTask["priority"]) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const criticalTasks = pendingTasks.filter(t => t.priority === "critical");
  const allTasksResolved = pendingTasks.every(t => {
    const action = handoffActions.get(t.id);
    return action && (action.action !== "reassign" || action.assignTo);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">End Shift & Handoff</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM d, yyyy")} • 
                  Shift Duration: <strong>{formatDuration(shiftDuration)}</strong>
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg font-mono py-1 px-3">
              {pendingTasks.length} Pending Tasks
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Critical Warning */}
      {criticalTasks.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Tasks Require Attention</AlertTitle>
          <AlertDescription>
            You have {criticalTasks.length} critical task(s) that must be resolved before ending your shift.
          </AlertDescription>
        </Alert>
      )}

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pending Tasks to Hand Off
          </CardTitle>
          <CardDescription>
            Assign each task to an incoming provider or mark as complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
              <p className="font-medium">All tasks completed!</p>
              <p className="text-sm">You can end your shift without any pending handoffs.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {pendingTasks.map(task => {
                  const action = handoffActions.get(task.id);
                  return (
                    <Card key={task.id} className={task.priority === "critical" ? "border-destructive" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityBadge(task.priority)}
                              <span className="font-medium">{task.title}</span>
                            </div>
                            {task.patient_name && (
                              <p className="text-sm text-muted-foreground">{task.patient_name}</p>
                            )}
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={action?.action || "reassign"}
                              onValueChange={(v) => updateTaskAction(task.id, v as HandoffAction["action"])}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reassign">Reassign</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="escalate">Escalate</SelectItem>
                                <SelectItem value="defer">Defer</SelectItem>
                              </SelectContent>
                            </Select>

                            {action?.action === "reassign" && (
                              <Select
                                value={action.assignTo || ""}
                                onValueChange={(v) => updateTaskAction(task.id, "reassign", v)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  {onDutyProviders.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      <div className="flex flex-col">
                                        <span>{p.name}</span>
                                        <span className="text-xs text-muted-foreground">{p.workspace_name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handoff Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any general notes for the incoming shift..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchPendingTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button 
          onClick={handleEndShift}
          disabled={actionLoading || !allTasksResolved}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Complete Handoff & End Shift
        </Button>
      </div>

      {/* Unresolved Warning Dialog */}
      <Dialog open={unresolvedWarning} onOpenChange={setUnresolvedWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Unresolved Critical Tasks
            </DialogTitle>
            <DialogDescription>
              You have critical tasks that are not assigned to a provider. 
              Please assign all critical tasks before ending your shift.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setUnresolvedWarning(false)}>
              Go Back and Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm End Shift Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm End Shift</DialogTitle>
            <DialogDescription>
              You are about to end your shift and hand off {pendingTasks.length} task(s).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Total shift duration: <strong>{formatDuration(shiftDuration)}</strong></span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEndShift} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              End Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mapPriority(priority: string): PendingTask["priority"] {
  switch (priority) {
    case "emergency": return "critical";
    case "very_urgent":
    case "urgent": return "high";
    case "routine": return "medium";
    default: return "low";
  }
}
