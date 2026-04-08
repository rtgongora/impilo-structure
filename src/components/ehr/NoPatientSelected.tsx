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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Calendar,
  Search,
  ClipboardList,
  ShieldCheck,
  Home,
  Clock,
  UserCheck,
  AlertTriangle,
  Bell,
  Activity,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  TrendingUp,
  ChevronRight,
  PlayCircle,
  Package,
  Scan,
  ArrowDownUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  Image,
  Microscope,
  Send,
  Inbox,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";
import { useProviderQueues } from "@/hooks/useProviderQueues";
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

// Results requiring review
const mockResults = [
  { id: "1", type: "lab", title: "CBC + Diff", patient: "T. Moyo", status: "ready", time: "10 min ago", abnormal: true },
  { id: "2", type: "lab", title: "Renal Function Panel", patient: "S. Banda", status: "ready", time: "25 min ago", abnormal: false },
  { id: "3", type: "imaging", title: "Chest X-Ray", patient: "M. Dube", status: "ready", time: "1 hr ago", abnormal: true },
  { id: "4", type: "imaging", title: "CT Abdomen", patient: "E. Ncube", status: "ready", time: "2 hrs ago", abnormal: false },
  { id: "5", type: "pathology", title: "Biopsy Report", patient: "L. Khumalo", status: "ready", time: "3 hrs ago", abnormal: true },
];

// Stock and supply alerts
const mockStockAlerts = [
  { id: "1", type: "low_stock", item: "Paracetamol 500mg", level: "Critical", quantity: "50 units", reorderPoint: "200 units" },
  { id: "2", type: "low_stock", item: "Normal Saline 1L", level: "Warning", quantity: "120 units", reorderPoint: "150 units" },
  { id: "3", type: "expiring", item: "Amoxicillin 250mg", level: "Warning", quantity: "200 units", expiryDate: "2026-02-15" },
  { id: "4", type: "out_of_stock", item: "IV Cannula 22G", level: "Critical", quantity: "0 units", reorderPoint: "100 units" },
];

// Pending approvals and requests
const mockApprovals = [
  { id: "1", type: "prescription", title: "Controlled substance Rx", patient: "J. Moyo", requestedBy: "Dr. Banda", time: "30 min ago" },
  { id: "2", type: "leave", title: "Leave request", requestedBy: "Nurse P. Ncube", dates: "15-17 Jan", time: "2 hrs ago" },
  { id: "3", type: "override", title: "Allergy override", patient: "T. Sibanda", medication: "Penicillin V", time: "1 hr ago" },
];

// Referrals and consults
const mockReferrals = [
  { id: "1", direction: "incoming", specialty: "Cardiology", patient: "M. Chuma", from: "Dr. Ndlovu", time: "45 min ago", status: "pending" },
  { id: "2", direction: "response", specialty: "Orthopaedics", patient: "S. Phiri", from: "Dr. Mukwena", time: "2 hrs ago", status: "completed" },
  { id: "3", direction: "incoming", specialty: "Psychiatry", patient: "E. Moyo", from: "Casualty", time: "3 hrs ago", status: "urgent" },
];

// Handoff items from previous shift
const mockHandoffItems = [
  { id: "1", patient: "L. Banda", ward: "Med A", priority: "high", note: "Monitor BP q2h - started new antihypertensive", from: "Dr. Moyo" },
  { id: "2", patient: "J. Ncube", ward: "Surg B", priority: "medium", note: "Post-op day 1 - check drain output", from: "Dr. Sithole" },
  { id: "3", patient: "P. Dube", ward: "ICU", priority: "high", note: "Ventilator weaning trial at 10:00", from: "Dr. Chuma" },
];

const mockStats = {
  patientsSeenToday: 18,
  pendingTasks: 7,
  activeAlerts: 3,
  resultsReady: 5,
  stockAlerts: 4,
  pendingApprovals: 3,
};

export function NoPatientSelected() {
  const navigate = useNavigate();
  const { isOnShift, activeShift } = useShift();
  const [activeTab, setActiveTab] = useState("queues");
  const { queues, loading: queuesLoading, totalWaiting, refetch: refetchQueues } = useProviderQueues();

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

        {/* Quick Stats - 6 cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">{mockStats.patientsSeenToday}</p>
                  <p className="text-xs text-muted-foreground">Seen Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold text-warning">{mockStats.pendingTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold text-destructive">{mockStats.activeAlerts}</p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border-info/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-xl font-bold text-info">{mockStats.resultsReady}</p>
                  <p className="text-xs text-muted-foreground">Results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-500">{mockStats.stockAlerts}</p>
                  <p className="text-xs text-muted-foreground">Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-500">{mockStats.pendingApprovals}</p>
                  <p className="text-xs text-muted-foreground">Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Find Patient - Prominent Search Bar */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Find Patient</h3>
              <p className="text-sm text-muted-foreground">Search by name, ID, or MRN</p>
            </div>
            <Button onClick={() => navigate("/patients")} className="shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Patient Search
            </Button>
          </CardContent>
        </Card>

        {/* Main Work Area with Tabs */}
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start flex-nowrap overflow-x-auto">
              <TabsTrigger value="queues" className="gap-1.5 whitespace-nowrap flex-1">
                <Users className="h-4 w-4" />
                Queues
                <Badge variant="secondary" className="ml-1">{totalWaiting}</Badge>
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-1.5 whitespace-nowrap flex-1">
                <FlaskConical className="h-4 w-4" />
                Results
                <Badge variant="secondary" className="ml-1">{mockResults.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5 whitespace-nowrap flex-1">
                <ClipboardList className="h-4 w-4" />
                Tasks
                <Badge variant="secondary" className="ml-1">{mockTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-1.5 whitespace-nowrap flex-1">
                <Bell className="h-4 w-4" />
                Alerts
                {mockAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{mockAlerts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-1.5 whitespace-nowrap flex-1">
                <Send className="h-4 w-4" />
                Referrals
                <Badge variant="secondary" className="ml-1">{mockReferrals.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-1.5 whitespace-nowrap flex-1">
                <Package className="h-4 w-4" />
                Stock
                {mockStockAlerts.filter(s => s.level === "Critical").length > 0 && (
                  <Badge variant="destructive" className="ml-1">{mockStockAlerts.filter(s => s.level === "Critical").length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="handoff" className="gap-1.5 whitespace-nowrap flex-1">
                <ArrowDownUp className="h-4 w-4" />
                Handoff
                <Badge variant="secondary" className="ml-1">{mockHandoffItems.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Queues Tab */}
            <TabsContent value="queues" className="flex-1 mt-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {totalWaiting} patient{totalWaiting !== 1 ? 's' : ''} waiting across {queues.length} queue{queues.length !== 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={() => refetchQueues()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              
              {queuesLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-32" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-10 w-16" />
                          <Skeleton className="h-10 w-16" />
                        </div>
                        <Skeleton className="h-8 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : queues.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Active Queues</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      There are no patients waiting in any queue right now.
                    </p>
                    <Button variant="outline" onClick={() => navigate("/queue")}>
                      Go to Queue Management
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queues.map((queue) => (
                    <Card 
                      key={queue.id} 
                      className={cn(
                        "hover:border-primary transition-colors cursor-pointer",
                        queue.hasUrgent && "border-destructive/50 bg-destructive/5"
                      )}
                      onClick={() => navigate(`/queue?queue=${queue.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium">{queue.name}</CardTitle>
                          {queue.hasUrgent && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </div>
                        {queue.description && (
                          <CardDescription className="text-xs">{queue.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-2xl font-bold">{queue.waiting}</p>
                            <p className="text-xs text-muted-foreground">Waiting</p>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-primary">{queue.inService}</p>
                            <p className="text-xs text-muted-foreground">In Service</p>
                          </div>
                          <div>
                            <p className="text-lg font-medium">
                              {queue.avgWaitMinutes !== null ? `${queue.avgWaitMinutes}m` : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Wait</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Next: </span>
                            <span className="font-medium">{queue.nextPatientName || 'None'}</span>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallPatient(queue.id);
                            }}
                            disabled={!isOnShift || queue.waiting === 0}
                          >
                            Call Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                </div>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-info" />
                    Results Ready for Review
                  </CardTitle>
                  <CardDescription>Lab, imaging, and pathology results pending your review</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
                    <div className="divide-y">
                      {mockResults.map((result) => {
                        const Icon = result.type === "lab" ? FlaskConical : result.type === "imaging" ? Image : Microscope;
                        return (
                          <div
                            key={result.id}
                            className={cn(
                              "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50",
                              result.abnormal && "bg-warning/5"
                            )}
                            onClick={() => navigate(`/encounter/${result.id}?source=results`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                result.abnormal ? "bg-warning/20 text-warning" : "bg-info/20 text-info"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{result.title}</h4>
                                  {result.abnormal && (
                                    <Badge variant="outline" className="text-xs border-warning text-warning">
                                      Abnormal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {result.patient} • {result.time}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pending Tasks</CardTitle>
                  <CardDescription>Tasks requiring your attention</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
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
            <TabsContent value="alerts" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-destructive" />
                    Clinical Alerts
                  </CardTitle>
                  <CardDescription>Requires immediate attention</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
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

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Referrals & Consults
                  </CardTitle>
                  <CardDescription>Incoming referrals and consult responses</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
                    <div className="divide-y">
                      {mockReferrals.map((referral) => (
                        <div
                          key={referral.id}
                          className={cn(
                            "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50",
                            referral.status === "urgent" && "bg-destructive/5"
                          )}
                          onClick={() => navigate(`/encounter/${referral.id}?source=referral`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              referral.direction === "incoming" ? "bg-primary/20 text-primary" : "bg-success/20 text-success"
                            )}>
                              {referral.direction === "incoming" ? <Inbox className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{referral.specialty}</h4>
                                <Badge 
                                  variant={referral.status === "urgent" ? "destructive" : referral.status === "completed" ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {referral.direction === "incoming" ? "Incoming" : "Response"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {referral.patient} • From: {referral.from}
                              </p>
                              <p className="text-xs text-muted-foreground">{referral.time}</p>
                            </div>
                          </div>
                          <Button size="sm" variant={referral.status === "urgent" ? "destructive" : "outline"}>
                            {referral.direction === "incoming" ? "Accept" : "View"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stock Alerts Tab */}
            <TabsContent value="stock" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    Stock & Supply Alerts
                  </CardTitle>
                  <CardDescription>Inventory issues requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
                    <div className="divide-y">
                      {mockStockAlerts.map((stock) => (
                        <div
                          key={stock.id}
                          className={cn(
                            "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50",
                            stock.level === "Critical" && "bg-destructive/5"
                          )}
                          onClick={() => navigate("/stock")}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              stock.level === "Critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                            )}>
                              {stock.type === "out_of_stock" ? <XCircle className="h-5 w-5" /> : 
                               stock.type === "expiring" ? <Clock className="h-5 w-5" /> : 
                               <AlertOctagon className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{stock.item}</h4>
                                <Badge 
                                  variant={stock.level === "Critical" ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {stock.level}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {stock.type === "expiring" 
                                  ? `Expires: ${stock.expiryDate}` 
                                  : `Current: ${stock.quantity} (Min: ${stock.reorderPoint})`}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            {stock.type === "out_of_stock" ? "Order" : "View"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Handoff Tab */}
            <TabsContent value="handoff" className="flex-1 mt-4 overflow-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowDownUp className="h-4 w-4 text-purple-500" />
                    Shift Handoff Items
                  </CardTitle>
                  <CardDescription>Patients handed off from previous shift</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px]">
                    <div className="divide-y">
                      {mockHandoffItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50",
                            item.priority === "high" && "bg-warning/5"
                          )}
                          onClick={() => navigate(`/encounter/${item.id}?source=handoff`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              item.priority === "high" ? "bg-warning/20 text-warning" : "bg-purple-500/20 text-purple-500"
                            )}>
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.patient}</h4>
                                <Badge variant="outline" className="text-xs">{item.ward}</Badge>
                                {item.priority === "high" && (
                                  <Badge variant="outline" className="text-xs border-warning text-warning">Priority</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.note}</p>
                              <p className="text-xs text-muted-foreground">From: {item.from}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            View
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
