/**
 * Provider Dashboard / Clinical Workspace Landing
 * 
 * Displayed when accessing /encounter without a valid patient context.
 * Shows provider's queues, tasks, alerts, and work organization tools.
 * Guides users to proper patient selection workflows.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Search,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Home,
  Clock,
  UserCheck,
  AlertTriangle,
  Bell,
  Activity,
  CheckCircle2,
  Timer,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  TrendingUp,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useShift } from "@/contexts/ShiftContext";
import impiloLogo from "@/assets/impilo-logo.png";
import { cn } from "@/lib/utils";

// Mock data for dashboard - in production would come from hooks/API
const mockQueueData = [
  { id: "opd", name: "OPD General", waiting: 12, avgWait: "23 min", nextPatient: "T. Moyo" },
  { id: "follow-up", name: "Follow-Up", waiting: 5, avgWait: "15 min", nextPatient: "S. Banda" },
  { id: "urgent", name: "Urgent Care", waiting: 3, avgWait: "8 min", nextPatient: "J. Chuma", priority: "urgent" },
];

const mockTasks = [
  { id: "1", type: "lab", title: "Review lab results", patient: "M. Sibanda", time: "15 min ago", priority: "high" },
  { id: "2", type: "rx", title: "Prescription renewal", patient: "E. Mutasa", time: "1 hr ago", priority: "medium" },
  { id: "3", type: "note", title: "Complete discharge summary", patient: "L. Ndlovu", time: "2 hrs ago", priority: "medium" },
  { id: "4", type: "consult", title: "Pending consult response", patient: "R. Phiri", time: "3 hrs ago", priority: "low" },
];

const mockAlerts = [
  { id: "1", type: "critical", title: "Critical Lab Value", patient: "M. Sibanda", message: "K+ 6.2 mEq/L", time: "5 min ago" },
  { id: "2", type: "medication", title: "Medication Due", patient: "J. Chuma", message: "IV Antibiotics overdue", time: "15 min ago" },
  { id: "3", type: "escalation", title: "Deteriorating Patient", patient: "P. Mwale", message: "NEWS score increased to 7", time: "20 min ago" },
];

const mockStats = {
  patientsSeenToday: 18,
  pendingTasks: 7,
  activeAlerts: 3,
  avgConsultTime: "12 min",
};

export function NoPatientSelected() {
  const navigate = useNavigate();
  const { isOnShift, activeShift } = useShift();
  const [activeTab, setActiveTab] = useState("queues");

  const handleCallPatient = (queueId: string) => {
    // In production: call next patient from queue and navigate to encounter
    navigate(`/queue?action=call&queue=${queueId}`);
  };

  const handleViewTask = (taskId: string) => {
    // Navigate to task/patient
    navigate(`/encounter/${taskId}?source=worklist`);
  };

  const handleViewAlert = (alertId: string) => {
    // Navigate to alert/patient
    navigate(`/encounter/${alertId}?source=alert`);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "lab": return FlaskConical;
      case "rx": return Pill;
      case "note": return FileText;
      case "consult": return Stethoscope;
      default: return ClipboardList;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "critical":
      case "urgent":
        return "text-destructive bg-destructive/10";
      case "medium":
      case "medication":
        return "text-warning bg-warning/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-topbar-bg text-topbar-foreground flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <img src={impiloLogo} alt="Impilo" className="h-7 w-auto" />
          <Badge variant="outline" className="text-topbar-muted border-topbar-muted/30">
            Clinical Workspace
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Shift Status Badge */}
          {isOnShift && activeShift && (
            <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
              <Activity className="h-3 w-3 mr-1" />
              On Shift
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-topbar-muted hover:text-topbar-foreground"
            asChild
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-6">
        {/* Shift Status Alert */}
        {!isOnShift && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not on Shift</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>You must start your shift before accessing patient charts.</span>
              <Button size="sm" variant="outline" asChild>
                <Link to="/operations">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Shift
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isOnShift && activeShift && (
          <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-success" />
              <div>
                <span className="font-medium">{activeShift.facility_name}</span>
                <span className="text-muted-foreground mx-2">•</span>
                <span className="text-muted-foreground">{activeShift.current_workspace_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Shift started at 08:00
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patients Today</p>
                  <p className="text-2xl font-bold text-primary">{mockStats.patientsSeenToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold text-warning">{mockStats.pendingTasks}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-destructive">{mockStats.activeAlerts}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Consult</p>
                  <p className="text-2xl font-bold text-success">{mockStats.avgConsultTime}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Work Area with Tabs */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="queues" className="gap-2">
                <Users className="h-4 w-4" />
                My Queues
                <Badge variant="secondary" className="ml-1">{mockQueueData.reduce((sum, q) => sum + q.waiting, 0)}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Tasks
                <Badge variant="secondary" className="ml-1">{mockTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <Bell className="h-4 w-4" />
                Alerts
                {mockAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{mockAlerts.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Queues Tab */}
            <TabsContent value="queues" className="flex-1 mt-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockQueueData.map((queue) => (
                  <Card 
                    key={queue.id} 
                    className={cn(
                      "hover:border-primary transition-colors cursor-pointer",
                      queue.priority === "urgent" && "border-destructive/50 bg-destructive/5"
                    )}
                    onClick={() => navigate(`/queue?queue=${queue.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">{queue.name}</CardTitle>
                        {queue.priority === "urgent" && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold">{queue.waiting}</p>
                          <p className="text-xs text-muted-foreground">Waiting</p>
                        </div>
                        <div>
                          <p className="text-lg font-medium">{queue.avgWait}</p>
                          <p className="text-xs text-muted-foreground">Avg Wait</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Next: </span>
                          <span className="font-medium">{queue.nextPatient}</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallPatient(queue.id);
                          }}
                          disabled={!isOnShift}
                        >
                          Call Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Quick Actions Card */}
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Find Patient</h3>
                      <p className="text-sm text-muted-foreground">Search by name, ID, or MRN</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/patients")}>
                      Patient Search
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="flex-1 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pending Tasks</CardTitle>
                  <CardDescription>Tasks requiring your attention</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {mockTasks.map((task) => {
                        const Icon = getTaskIcon(task.type);
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewTask(task.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                getPriorityColor(task.priority)
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      task.priority === "high" && "border-destructive text-destructive"
                                    )}
                                  >
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {task.patient} • {task.time}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="flex-1 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-destructive" />
                    Clinical Alerts
                  </CardTitle>
                  <CardDescription>Requires immediate attention</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {mockAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "flex items-center justify-between p-4 cursor-pointer transition-colors",
                            alert.type === "critical" 
                              ? "bg-destructive/5 hover:bg-destructive/10" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleViewAlert(alert.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              getPriorityColor(alert.type)
                            )}>
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{alert.title}</h4>
                                <Badge 
                                  variant={alert.type === "critical" ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {alert.type}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {alert.patient} • {alert.time}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="destructive">
                            Respond
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            All chart access is logged per HIPAA and institutional policy
          </p>
        </div>
      </div>
    </div>
  );
}
