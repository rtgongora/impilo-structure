import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Building2
} from "lucide-react";

// Mock worklist data - will be replaced with real data
const mockMyPatients = [
  { id: "P001", name: "Sarah M. Johnson", mrn: "MRN-2024-001847", ward: "Ward 4A", bed: "Bed 12", priority: "high", status: "In Progress", lastUpdate: "10 min ago" },
  { id: "P002", name: "James K. Ochieng", mrn: "MRN-2024-001832", ward: "Ward 3B", bed: "Bed 5", priority: "medium", status: "Pending Review", lastUpdate: "25 min ago" },
  { id: "P003", name: "Mary W. Njeri", mrn: "MRN-2024-001856", ward: "ICU", bed: "Bed 2", priority: "critical", status: "Active", lastUpdate: "5 min ago" },
  { id: "P004", name: "Peter M. Kamau", mrn: "MRN-2024-001801", ward: "Ward 2A", bed: "Bed 8", priority: "low", status: "Discharge Pending", lastUpdate: "1 hour ago" },
];

const mockTasks = [
  { id: 1, title: "Review lab results for Sarah Johnson", type: "Lab Review", due: "Overdue", priority: "high" },
  { id: 2, title: "Complete discharge summary - Peter Kamau", type: "Documentation", due: "Today", priority: "medium" },
  { id: 3, title: "Medication reconciliation - Mary Njeri", type: "Medication", due: "Today", priority: "high" },
  { id: 4, title: "Consult response pending - Cardiology", type: "Consult", due: "Tomorrow", priority: "low" },
];

const mockNotifications = [
  { id: 1, message: "Critical lab value: Potassium 6.2 mEq/L for Mary Njeri", time: "5 min ago", type: "critical" },
  { id: 2, message: "New consult request from Dr. Mwangi", time: "15 min ago", type: "info" },
  { id: 3, message: "Discharge order signed for Peter Kamau", time: "1 hour ago", type: "success" },
];

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("worklist");

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
    { label: "Patient Queue", icon: Users, path: "/", action: "queue", color: "bg-blue-500" },
    { label: "Bed Management", icon: Bed, path: "/", action: "beds", color: "bg-purple-500" },
    { label: "New Registration", icon: UserPlus, path: "/registration", color: "bg-green-500" },
    { label: "My Schedule", icon: Calendar, path: "#", color: "bg-orange-500" },
  ];

  const systemModules = [
    { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters & documentation" },
    { label: "Stock Management", icon: Package, path: "#", description: "Inventory & supplies" },
    { label: "Reports", icon: BarChart3, path: "#", description: "Analytics & dashboards" },
    { label: "Administration", icon: Building2, path: "/admin", description: "System settings" },
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

          {/* Current Location Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Central Hospital</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
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
                <p className="text-2xl font-bold">{mockMyPatients.length}</p>
                <p className="text-xs text-muted-foreground">My Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTasks.length}</p>
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
                <p className="text-2xl font-bold">1</p>
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
                <p className="text-2xl font-bold">12</p>
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
                        {mockMyPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => navigate("/")}
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
                                <span className="text-sm">{patient.ward} • {patient.bed}</span>
                              </div>
                              {getStatusBadge(patient.status)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {patient.lastUpdate}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {mockTasks.map((task) => (
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
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default Dashboard;
