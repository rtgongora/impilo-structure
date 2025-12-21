import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MedicationDueAlerts } from "@/components/alerts/MedicationDueAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NurseMedDashboard } from "@/components/orders/NurseMedDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  Bed,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("worklist");
  const { patients, tasks, stats, loading } = useDashboardData();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-critical";
      case "high": return "bg-warning";
      case "medium": return "bg-warning/60";
      case "low": return "bg-success";
      default: return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return <Badge variant="default">Active</Badge>;
      case "In Progress": return <Badge variant="secondary">In Progress</Badge>;
      case "Pending Review": return <Badge variant="outline">Pending Review</Badge>;
      case "Discharge Pending": return <Badge className="bg-success/20 text-success">Discharge Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const quickActions = [
    { label: "Patient Queue", icon: Users, path: "/queue", color: "bg-primary" },
    { label: "Bed Management", icon: Bed, path: "/beds", color: "bg-secondary" },
    { label: "New Registration", icon: UserPlus, path: "/registration", color: "bg-success" },
    { label: "Appointments", icon: Calendar, path: "/appointments", color: "bg-warning" },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {profile?.display_name?.split(" ")[0]}
          </h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.myPatients}</p>
                )}
                <p className="text-xs text-muted-foreground">Active Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-warning" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                )}
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-critical/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-critical" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.criticalAlerts}</p>
                )}
                <p className="text-xs text-muted-foreground">Critical Alerts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                )}
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent"
              onClick={() => navigate(action.path)}
            >
              <div className={`p-2 rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Worklist Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Worklist</CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="worklist">Patients</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="worklist" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {loading ? (
                          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
                        ) : patients.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No active patients</p>
                          </div>
                        ) : (
                          patients.map((patient) => (
                            <div
                              key={patient.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => patient.encounterId && navigate(`/encounter?id=${patient.encounterId}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-1 h-12 rounded-full ${getPriorityColor(patient.priority)}`} />
                                <div>
                                  <p className="font-medium">{patient.name}</p>
                                  <p className="text-sm text-muted-foreground">{patient.mrn}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bed className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{patient.ward || "—"} • {patient.bed || "—"}</span>
                                </div>
                                {getStatusBadge(patient.status)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {patient.lastUpdate}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {loading ? (
                          [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                        ) : tasks.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No pending tasks</p>
                          </div>
                        ) : (
                          tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-1 h-10 rounded-full ${getPriorityColor(task.priority)}`} />
                                <div>
                                  <p className="font-medium text-sm">{task.title}</p>
                                  <Badge variant="outline" className="text-xs">{task.type}</Badge>
                                </div>
                              </div>
                              <Badge 
                                variant={task.due === "Overdue" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {task.due}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Medications & Alerts */}
          <div className="space-y-6">
            <MedicationDueAlerts />
            <NurseMedDashboard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
