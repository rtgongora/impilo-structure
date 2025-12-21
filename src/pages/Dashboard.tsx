import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PatientSearch } from "@/components/search/PatientSearch";
import { HandoffNotifications } from "@/components/handoff/HandoffNotifications";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { VoiceCommandButton } from "@/components/voice/VoiceCommandButton";
import { MedicationDueAlerts } from "@/components/alerts/MedicationDueAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NurseMedDashboard } from "@/components/orders/NurseMedDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  Bell, 
  Activity, 
  Bed,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Stethoscope,
  Package,
  BarChart3,
  Building2,
  Syringe,
  DollarSign,
  ShoppingCart,
  ArrowRightLeft
} from "lucide-react";

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("worklist");
  const { patients, tasks, stats, loading } = useDashboardData();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return <Badge variant="default">Active</Badge>;
      case "In Progress": return <Badge variant="secondary">In Progress</Badge>;
      case "Pending Review": return <Badge variant="outline">Pending Review</Badge>;
      case "Discharge Pending": return <Badge className="bg-green-100 text-green-800">Discharge Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const quickActions = [
    { label: "Patient Queue", icon: Users, path: "/queue", action: "queue", color: "bg-blue-500" },
    { label: "Bed Management", icon: Bed, path: "/beds", action: "beds", color: "bg-purple-500" },
    { label: "New Registration", icon: UserPlus, path: "/registration", color: "bg-green-500" },
    { label: "Appointments", icon: Calendar, path: "/appointments", color: "bg-orange-500" },
  ];

  const systemModules = [
    { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters & documentation" },
    { label: "Order Entry", icon: ShoppingCart, path: "/orders", description: "Clinical orders & prescriptions" },
    { label: "Shift Handoff", icon: ArrowRightLeft, path: "/handoff", description: "Shift handoff reports" },
    { label: "Appointments", icon: Calendar, path: "/appointments", description: "Schedule & manage appointments" },
    { label: "Patients", icon: Users, path: "/patients", description: "Patient registry & records" },
    { label: "Pharmacy", icon: Syringe, path: "/pharmacy", description: "Medication dispensing" },
    { label: "Theatre Booking", icon: Building2, path: "/theatre", description: "Surgical scheduling" },
    { label: "Payments", icon: DollarSign, path: "/payments", description: "Billing & payments" },
    { label: "PACS Imaging", icon: FileText, path: "/pacs", description: "Medical imaging viewer" },
    { label: "Laboratory", icon: Activity, path: "/lims", description: "Lab results & orders" },
    { label: "Stock Management", icon: Package, path: "/stock", description: "Inventory & supplies" },
    { label: "Consumables", icon: Syringe, path: "/consumables", description: "Track consumable usage" },
    { label: "Charges & Billing", icon: DollarSign, path: "/charges", description: "Encounter charges" },
    { label: "Reports", icon: BarChart3, path: "/reports", description: "Analytics & dashboards" },
    { label: "Odoo ERP", icon: Building2, path: "/odoo", description: "ERP integration" },
    { label: "Administration", icon: Building2, path: "/admin", description: "System settings" },
    { label: "Patient Portal", icon: UserPlus, path: "/portal", description: "Patient self-service" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">Impilo EHR</h1>
                <p className="text-xs text-muted-foreground">Electronic Health Records</p>
              </div>
            </div>
          </div>

          {/* Patient Search */}
          <PatientSearch />

          <div className="flex items-center gap-3">
            {/* Voice Commands */}
            <VoiceCommandButton onCommand={(cmd, action) => console.log(action, cmd)} />

            {/* Handoff Notifications */}
            <HandoffNotifications />

            {/* General Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.display_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
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
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-orange-600" />
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
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
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
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
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

          {/* Medication Dashboard */}
          <div className="lg:col-span-1 space-y-6">
            <MedicationDueAlerts />
            <NurseMedDashboard />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          notification.type === "critical" 
                            ? "border-l-red-500 bg-red-50" 
                            : notification.type === "success"
                            ? "border-l-green-500 bg-green-50"
                            : "border-l-blue-500 bg-blue-50"
                        }`}
                      >
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* System Modules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Modules</CardTitle>
                <CardDescription>Quick access to system areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemModules.map((module) => (
                    <Button
                      key={module.label}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => navigate(module.path)}
                    >
                      <module.icon className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{module.label}</p>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default Dashboard;
