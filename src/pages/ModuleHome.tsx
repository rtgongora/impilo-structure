import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  Bed,
  Calendar,
  Stethoscope,
  ShoppingCart,
  ArrowRightLeft,
  Syringe,
  Building2,
  DollarSign,
  FileText,
  Package,
  BarChart3,
  UserPlus,
  Settings,
  FlaskConical,
  Receipt,
  ClipboardList,
  LogOut,
  User,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

interface ModuleItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  roles?: string[];
}

interface ModuleCategory {
  id: string;
  title: string;
  description: string;
  modules: ModuleItem[];
}

const moduleCategories: ModuleCategory[] = [
  {
    id: "clinical",
    title: "Clinical Care",
    description: "Patient encounters, assessments, and care delivery",
    modules: [
      { id: "dashboard", label: "My Dashboard", description: "Your worklist, tasks, and alerts", icon: ClipboardList, path: "/dashboard", color: "bg-primary" },
      { id: "ehr", label: "Patient Encounters", description: "Clinical documentation & care", icon: Stethoscope, path: "/encounter", color: "bg-blue-500", roles: ["doctor", "nurse", "specialist"] },
      { id: "queue", label: "Patient Queue", description: "Waiting patients & triage", icon: Users, path: "/queue", color: "bg-orange-500" },
      { id: "beds", label: "Bed Management", description: "Ward status & admissions", icon: Bed, path: "/beds", color: "bg-purple-500" },
      { id: "handoff", label: "Shift Handoff", description: "Care continuity reports", icon: ArrowRightLeft, path: "/handoff", color: "bg-teal-500", roles: ["doctor", "nurse"] },
    ],
  },
  {
    id: "orders",
    title: "Orders & Diagnostics",
    description: "Lab, imaging, pharmacy, and clinical orders",
    modules: [
      { id: "orders", label: "Order Entry", description: "Medications, labs, & imaging", icon: ShoppingCart, path: "/orders", color: "bg-green-500", roles: ["doctor", "nurse", "specialist"] },
      { id: "pharmacy", label: "Pharmacy", description: "Dispensing & medication tracking", icon: Syringe, path: "/pharmacy", color: "bg-pink-500" },
      { id: "lims", label: "Laboratory", description: "Lab orders & results", icon: FlaskConical, path: "/lims", color: "bg-amber-500" },
      { id: "pacs", label: "Imaging (PACS)", description: "Radiology & diagnostic imaging", icon: FileText, path: "/pacs", color: "bg-indigo-500" },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling & Registration",
    description: "Appointments, patient registration, and theatre",
    modules: [
      { id: "appointments", label: "Appointments", description: "Clinic & provider scheduling", icon: Calendar, path: "/appointments", color: "bg-cyan-500" },
      { id: "registration", label: "Patient Registration", description: "New patient intake & ID", icon: UserPlus, path: "/registration", color: "bg-emerald-500" },
      { id: "patients", label: "Patient Registry", description: "Search & manage patients", icon: Users, path: "/patients", color: "bg-slate-500" },
      { id: "theatre", label: "Theatre Booking", description: "Surgical scheduling", icon: Building2, path: "/theatre", color: "bg-rose-500" },
    ],
  },
  {
    id: "finance",
    title: "Finance & Billing",
    description: "Payments, charges, and financial operations",
    modules: [
      { id: "payments", label: "Payments", description: "Patient billing & collections", icon: DollarSign, path: "/payments", color: "bg-green-600" },
      { id: "charges", label: "Encounter Charges", description: "Service & item charges", icon: Receipt, path: "/charges", color: "bg-yellow-600" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Supply Chain",
    description: "Stock management and consumables tracking",
    modules: [
      { id: "stock", label: "Stock Management", description: "Inventory & reordering", icon: Package, path: "/stock", color: "bg-orange-600" },
      { id: "consumables", label: "Consumables", description: "Usage & administration", icon: Syringe, path: "/consumables", color: "bg-red-500" },
    ],
  },
  {
    id: "admin",
    title: "Administration & Reports",
    description: "System settings, analytics, and integrations",
    modules: [
      { id: "reports", label: "Reports & Analytics", description: "Dashboards & insights", icon: BarChart3, path: "/reports", color: "bg-violet-500" },
      { id: "odoo", label: "Odoo ERP", description: "ERP integration", icon: Building2, path: "/odoo", color: "bg-gray-600", roles: ["admin"] },
      { id: "admin", label: "System Admin", description: "Users, security & settings", icon: Settings, path: "/admin", color: "bg-gray-700", roles: ["admin"] },
    ],
  },
  {
    id: "support",
    title: "Help & Support",
    description: "FAQs, user guides, and system documentation",
    modules: [
      { id: "help", label: "Help Desk", description: "FAQs, guides & documentation", icon: HelpCircle, path: "/help", color: "bg-teal-500" },
    ],
  },
];

export default function ModuleHome() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role || "nurse";

  const getDisplayTitle = () => {
    const role = profile?.role;
    const name = profile?.display_name || "User";
    if (role === "doctor" || role === "specialist") {
      return `Dr ${name}`;
    } else if (role === "nurse") {
      return `Nurse ${name}`;
    }
    return name;
  };

  const getVisibleModules = (modules: ModuleItem[]) => {
    return modules.filter((module) => {
      if (!module.roles) return true;
      return module.roles.includes(userRole);
    });
  };

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={impiloLogo} alt="Impilo" className="h-10 w-auto" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role} • {profile?.department || "General"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {getDisplayTitle()}
          </h2>
          <p className="text-muted-foreground mt-1">
            Select a module to get started with your work today.
          </p>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="px-3 py-1">Quick Access</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                <ClipboardList className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <span className="font-medium">My Dashboard</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group"
              onClick={() => navigate("/queue")}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <Users className="h-6 w-6 text-blue-500 group-hover:text-white" />
              </div>
              <span className="font-medium">Patient Queue</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all group"
              onClick={() => navigate("/registration")}
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <UserPlus className="h-6 w-6 text-green-500 group-hover:text-white" />
              </div>
              <span className="font-medium">Register Patient</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all group"
              onClick={() => navigate("/encounter")}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <Stethoscope className="h-6 w-6 text-purple-500 group-hover:text-white" />
              </div>
              <span className="font-medium">Clinical EHR</span>
            </Button>
          </div>
        </div>

        {/* Module Categories */}
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-8 pb-8">
            {moduleCategories.map((category) => {
              const visibleModules = getVisibleModules(category.modules);
              if (visibleModules.length === 0) return null;

              return (
                <section key={category.id}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleModules.map((module) => (
                      <Card
                        key={module.id}
                        className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                        onClick={() => handleModuleClick(module.path)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center`}>
                              <module.icon className="h-5 w-5 text-white" />
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-base mb-1">{module.label}</CardTitle>
                          <CardDescription className="text-xs">{module.description}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
