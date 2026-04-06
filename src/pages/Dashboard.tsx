import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MedicationDueAlerts } from "@/components/alerts/MedicationDueAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NurseMedDashboard } from "@/components/orders/NurseMedDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { DepartmentView, TeamView } from "@/components/dashboard/WorkspaceViews";
import { ProviderDashboardTabs } from "@/components/dashboard/ProviderDashboardTabs";
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
  User,
  MessageSquare,
  Phone,
  Bell,
  Inbox,
  Send,
  TestTube2,
} from "lucide-react";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("worklist");
  const { patients, tasks, orders, referrals, results, stats, loading } = useDashboardData();
  const { currentView } = useWorkspace();

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
      case "Active": return <Badge variant="default" className="text-[10px]">Active</Badge>;
      case "In Progress": return <Badge variant="secondary" className="text-[10px]">In Progress</Badge>;
      case "Pending Review": return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
      case "Discharge Pending": return <Badge className="bg-success/20 text-success text-[10px]">Discharge</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const quickActions = [
    { label: "Queues & Wards", icon: Users, path: "/queue", color: "bg-primary" },
    { label: "Beds", icon: Bed, path: "/beds", color: "bg-secondary" },
    { label: "Register", icon: UserPlus, path: "/registration", color: "bg-success" },
    { label: "Appointments", icon: Calendar, path: "/appointments", color: "bg-warning" },
    { label: "Inbox", icon: Inbox, path: "/orders", color: "bg-info" },
  ];

  const communicationActions = [
    { label: "Messages", icon: MessageSquare, path: "/communication", tab: "messages", color: "bg-primary", count: 5 },
    { label: "Pages", icon: Bell, path: "/communication", tab: "pages", color: "bg-warning", count: 2 },
    { label: "Calls", icon: Phone, path: "/communication", tab: "calls", color: "bg-success", count: 0 },
  ];

  const renderWorkspaceContent = () => {
    switch (currentView) {
      case "department":
        return <DepartmentView />;
      case "team":
        return <TeamView />;
      default:
        return renderPersonalView();
    }
  };

  const renderPersonalView = () => (
    <div className="section-gap">
      {/* Communication Hub - Compact */}
      <Card className="border-primary/20">
        <CardContent className="p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Communication</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/communication")} className="h-6 px-2 text-[10px]">
              View All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {communicationActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-12 flex flex-col items-center justify-center gap-1 relative p-1"
                onClick={() => navigate(`${action.path}?tab=${action.tab}`)}
              >
                <div className={`p-1.5 rounded-md ${action.color}`}>
                  <action.icon className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-medium">{action.label}</span>
                {action.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-destructive">
                    {action.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - 6 columns */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { icon: Users, value: stats.myPatients, label: "My Patients", color: "bg-primary/10 text-primary" },
          { icon: ClipboardList, value: stats.pendingTasks, label: "Pending", color: "bg-warning/10 text-warning" },
          { icon: Send, value: stats.activeReferrals, label: "Referrals", color: "bg-info/10 text-info" },
          { icon: TestTube2, value: stats.pendingResults, label: "Results", color: "bg-secondary/10 text-secondary" },
          { icon: AlertCircle, value: stats.criticalAlerts, label: "Critical", color: "bg-critical/10 text-critical" },
          { icon: CheckCircle2, value: stats.completedToday, label: "Done Today", color: "bg-success/10 text-success" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-2 flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-5 w-6" />
                ) : (
                  <p className="text-lg font-bold leading-none">{stat.value}</p>
                )}
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-14 flex flex-col items-center justify-center gap-1"
            onClick={() => navigate(action.path)}
          >
            <div className={`p-1.5 rounded-md ${action.color}`}>
              <action.icon className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Worklist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-2.5 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <CardTitle>My Worklist</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant={activeTab === "worklist" ? "default" : "outline"} 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setActiveTab("worklist")}
                  >
                    Patients
                  </Button>
                  <Button 
                    variant={activeTab === "tasks" ? "default" : "outline"} 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setActiveTab("tasks")}
                  >
                    Tasks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2.5 pt-0">
              <ScrollArea className="h-[280px]">
                {activeTab === "worklist" ? (
                  <div className="space-y-1.5">
                    {loading ? (
                      [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
                    ) : patients.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No assigned patients
                      </div>
                    ) : (
                      patients.map((patient) => (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between p-2 rounded-md border hover:bg-accent cursor-pointer"
                          onClick={() => patient.encounterId && navigate(`/encounter?id=${patient.encounterId}`)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-0.5 h-10 rounded-full ${getPriorityColor(patient.priority)}`} />
                            <div>
                              <p className="text-xs font-medium">{patient.name}</p>
                              <p className="text-[10px] text-muted-foreground">{patient.mrn}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <Bed className="h-2.5 w-2.5" />
                                {patient.ward || "—"} • {patient.bed || "—"}
                              </div>
                              {getStatusBadge(patient.status)}
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {loading ? (
                      [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No pending tasks
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 rounded-md border hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-0.5 h-8 rounded-full ${getPriorityColor(task.priority)}`} />
                            <div>
                              <p className="text-xs font-medium">{task.title}</p>
                              <Badge variant="outline" className="text-[9px] h-4">{task.type}</Badge>
                            </div>
                          </div>
                          <Badge variant={task.due === "Overdue" ? "destructive" : "secondary"} className="text-[10px]">
                            {task.due}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-3">
          <MedicationDueAlerts />
          <NurseMedDashboard />
        </div>
      </div>

      {/* Clinical Overview */}
      <ProviderDashboardTabs
        orders={orders}
        referrals={referrals}
        results={results}
        stats={stats}
        loading={loading}
      />
    </div>
  );

  return (
    <AppLayout>
      <div className="p-3">
        {/* Welcome - Compact */}
        <div className="mb-3">
          <h2 className="text-base font-bold">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {profile?.display_name?.split(" ")[0]}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>

        {renderWorkspaceContent()}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
