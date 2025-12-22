import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Pill,
  ClipboardCheck,
  Store,
  BookOpen,
  Database,
  Heart,
  MessageSquare,
  Bell,
  Phone,
  Briefcase,
  Activity,
  Video,
  FileHeart,
  Wallet,
  Shield,
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

// Provider/Staff work modules
const providerWorkCategories: ModuleCategory[] = [
  {
    id: "clinical",
    title: "Clinical Care",
    description: "Patient encounters, assessments, and care delivery",
    modules: [
      { id: "dashboard", label: "My Dashboard", description: "Your worklist, tasks, and alerts", icon: ClipboardList, path: "/dashboard", color: "bg-primary" },
      { id: "communication", label: "Communication", description: "Messages, pages & calls", icon: MessageSquare, path: "/communication", color: "bg-primary" },
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
      { id: "eprescriptions", label: "ePrescriptions", description: "Electronic prescriptions & formulary", icon: Pill, path: "/pharmacy", color: "bg-emerald-600", roles: ["doctor", "nurse", "specialist", "pharmacist"] },
      { id: "eorders", label: "E-Orders", description: "Electronic clinical orders", icon: ClipboardCheck, path: "/orders", color: "bg-cyan-600", roles: ["doctor", "nurse", "specialist"] },
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
    id: "marketplace",
    title: "Health Products & Marketplace",
    description: "Browse products, compare vendors, and order supplies",
    modules: [
      { id: "catalogue", label: "Health Products Catalogue", description: "Browse approved health products", icon: BookOpen, path: "/catalogue", color: "bg-blue-600" },
      { id: "marketplace", label: "Health Marketplace", description: "Compare prices & order from vendors", icon: Store, path: "/marketplace", color: "bg-green-600" },
      { id: "fulfillment", label: "Prescription Fulfillment", description: "Bidding & vendor selection for Rx", icon: ShoppingCart, path: "/fulfillment", color: "bg-purple-600", roles: ["doctor", "nurse", "pharmacist", "admin"] },
      { id: "vendor-portal", label: "Vendor Portal", description: "View requests & submit bids", icon: Building2, path: "/vendor-portal", color: "bg-orange-600", roles: ["vendor", "pharmacist", "admin"] },
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
    id: "registries",
    title: "HIE Registries",
    description: "Health information exchange registries and services",
    modules: [
      { id: "patients-registry", label: "Client Registry", description: "Master patient index (MPI)", icon: Users, path: "/patients", color: "bg-blue-500" },
      { id: "facilities", label: "Facility Registry", description: "GOFR health facilities", icon: Building2, path: "/admin", color: "bg-purple-500", roles: ["admin"] },
      { id: "providers", label: "Provider Registry", description: "iHRIS healthcare workers", icon: Stethoscope, path: "/admin", color: "bg-teal-500", roles: ["admin"] },
      { id: "product-registry", label: "Product Registry", description: "Manage products & vendors", icon: Database, path: "/admin/product-registry", color: "bg-indigo-500", roles: ["admin"] },
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

// Patient/Individual health portal modules
const patientHealthModules: ModuleItem[] = [
  { id: "health-records", label: "My Health Records", description: "View your medical history & documents", icon: FileHeart, path: "/portal", color: "bg-pink-500" },
  { id: "appointments", label: "My Appointments", description: "Book & manage your appointments", icon: Calendar, path: "/portal", color: "bg-blue-500" },
  { id: "prescriptions", label: "My Prescriptions", description: "View active medications & refills", icon: Pill, path: "/portal", color: "bg-emerald-500" },
  { id: "lab-results", label: "Lab Results", description: "Access your test results", icon: FlaskConical, path: "/portal", color: "bg-amber-500" },
  { id: "telehealth", label: "Telehealth", description: "Video consultations with providers", icon: Video, path: "/portal", color: "bg-purple-500" },
  { id: "health-wallet", label: "Health Wallet", description: "Payments, insurance & benefits", icon: Wallet, path: "/payments", color: "bg-green-500" },
  { id: "find-provider", label: "Find a Provider", description: "Search doctors & facilities", icon: Stethoscope, path: "/social?tab=pages", color: "bg-indigo-500" },
  { id: "insurance", label: "Insurance & Claims", description: "Manage your coverage", icon: Shield, path: "/payments", color: "bg-teal-500" },
];

// Provider health portal modules (their own health as providers)
const providerHealthModules: ModuleItem[] = [
  { id: "my-health", label: "My Health Portal", description: "Your personal health records", icon: Heart, path: "/portal", color: "bg-pink-500" },
  { id: "wellness", label: "Staff Wellness", description: "Wellness programs & resources", icon: Activity, path: "/portal", color: "bg-green-500" },
  { id: "help", label: "Help & Support", description: "FAQs & documentation", icon: HelpCircle, path: "/help", color: "bg-teal-500" },
];

type TabType = "work" | "social" | "health";

export default function ModuleHome() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role || "nurse";
  
  // Determine if user is a provider/staff or patient/individual
  const isProvider = ["doctor", "nurse", "specialist", "pharmacist", "admin", "receptionist", "lab_tech"].includes(userRole);
  
  // Default tab based on role
  const [activeTab, setActiveTab] = useState<TabType>(isProvider ? "work" : "health");

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

  const renderWorkTab = () => (
    <>
      {/* Communication Quick Access */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">Communication</Badge>
            <p className="hidden sm:block text-sm text-muted-foreground">Messages, pages & calls</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/communication")}>
            Open Hub
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto p-5 flex items-center justify-between hover:bg-accent"
            onClick={() => navigate("/communication?tab=messages")}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">Chat with teams</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-5 flex items-center justify-between hover:bg-accent"
            onClick={() => navigate("/communication?tab=pages")}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div className="text-left">
                <p className="font-medium">Pages</p>
                <p className="text-xs text-muted-foreground">Urgent alerts</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-5 flex items-center justify-between hover:bg-accent"
            onClick={() => navigate("/communication?tab=calls")}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium">Calls</p>
                <p className="text-xs text-muted-foreground">Voice & video</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="px-3 py-1">Quick Access</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
              <ClipboardList className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="font-medium text-sm">My Dashboard</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group"
            onClick={() => navigate("/queue")}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Users className="h-6 w-6 text-blue-500 group-hover:text-white" />
            </div>
            <span className="font-medium text-sm">Patient Queue</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all group"
            onClick={() => navigate("/pharmacy")}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Pill className="h-6 w-6 text-emerald-600 group-hover:text-white" />
            </div>
            <span className="font-medium text-sm">ePrescriptions</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all group"
            onClick={() => navigate("/orders")}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <ClipboardCheck className="h-6 w-6 text-cyan-600 group-hover:text-white" />
            </div>
            <span className="font-medium text-sm">E-Orders</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all group"
            onClick={() => navigate("/registration")}
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <UserPlus className="h-6 w-6 text-green-500 group-hover:text-white" />
            </div>
            <span className="font-medium text-sm">Register Patient</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all group"
            onClick={() => navigate("/encounter")}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Stethoscope className="h-6 w-6 text-purple-500 group-hover:text-white" />
            </div>
            <span className="font-medium text-sm">Clinical EHR</span>
          </Button>
        </div>
      </div>

      {/* Module Categories */}
      <ScrollArea className="h-[calc(100vh-520px)]">
        <div className="space-y-8 pb-8">
          {providerWorkCategories.map((category) => {
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
    </>
  );

  const renderSocialTab = () => (
    <>
      {/* Social Hub Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 bg-pink-500/10 text-pink-600">Social Hub</Badge>
            <p className="hidden sm:block text-sm text-muted-foreground">Connect, share & support your community</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/social")}>
            Open Hub
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group"
            onClick={() => navigate("/social?tab=feed")}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <MessageSquare className="h-6 w-6 text-blue-500 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Timeline</p>
              <p className="text-[10px] text-muted-foreground group-hover:text-white/70">News & updates</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all group"
            onClick={() => navigate("/social?tab=communities")}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Users className="h-6 w-6 text-purple-500 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Communities</p>
              <p className="text-[10px] text-muted-foreground group-hover:text-white/70">Support groups</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all group"
            onClick={() => navigate("/social?tab=clubs")}
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Heart className="h-6 w-6 text-green-500 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Clubs</p>
              <p className="text-[10px] text-muted-foreground group-hover:text-white/70">Wellness & fitness</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all group"
            onClick={() => navigate("/social?tab=pages")}
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Building2 className="h-6 w-6 text-indigo-500 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Pages</p>
              <p className="text-[10px] text-muted-foreground group-hover:text-white/70">Professionals</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all group"
            onClick={() => navigate("/social?tab=crowdfunding")}
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Heart className="h-6 w-6 text-pink-500 group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Crowdfunding</p>
              <p className="text-[10px] text-muted-foreground group-hover:text-white/70">Support causes</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Featured Content */}
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-4">Discover Communities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/social?tab=communities")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Health Support Groups</CardTitle>
                    <CardDescription className="text-xs">Connect with others on similar health journeys</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/social?tab=clubs")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Wellness Clubs</CardTitle>
                    <CardDescription className="text-xs">Join fitness & wellness activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/social?tab=crowdfunding")}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Medical Fundraising</CardTitle>
                    <CardDescription className="text-xs">Support medical causes & treatments</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Find Healthcare Providers</h3>
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/social?tab=pages")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Stethoscope className="h-7 w-7 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Browse Professional Pages</h4>
                    <p className="text-sm text-muted-foreground">Find doctors, specialists & healthcare facilities</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );

  const renderHealthTab = () => {
    const modules = isProvider ? providerHealthModules : patientHealthModules;
    
    return (
      <>
        {/* Health Portal Header */}
        <div className="mb-8">
          <div className="rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">My Health Portal</h3>
                <p className="text-muted-foreground">
                  {isProvider 
                    ? "Access your personal health records & wellness resources" 
                    : "Your complete health hub - records, appointments & more"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Health Modules Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => handleModuleClick(module.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center`}>
                    <module.icon className="h-6 w-6 text-white" />
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

        {/* Patient-specific sections */}
        {!isProvider && (
          <div className="mt-8 space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-5 flex items-center justify-between hover:bg-accent"
                  onClick={() => navigate("/portal")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Book Appointment</p>
                      <p className="text-xs text-muted-foreground">Schedule a visit</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-5 flex items-center justify-between hover:bg-accent"
                  onClick={() => navigate("/portal")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Video className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Start Telehealth</p>
                      <p className="text-xs text-muted-foreground">Virtual consultation</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-5 flex items-center justify-between hover:bg-accent"
                  onClick={() => navigate("/portal")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Refill Prescription</p>
                      <p className="text-xs text-muted-foreground">Request medication refill</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </section>
          </div>
        )}
      </>
    );
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
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {getDisplayTitle()}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isProvider 
              ? "Select a module to get started with your work today."
              : "Manage your health, connect with providers, and explore wellness resources."}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {isProvider ? (
                <>
                  <TabsTrigger value="work" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Work</span>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Social</span>
                  </TabsTrigger>
                  <TabsTrigger value="health" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">My Health</span>
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="health" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">My Health</span>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Social</span>
                  </TabsTrigger>
                  <TabsTrigger value="work" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Marketplace</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        {activeTab === "work" && renderWorkTab()}
        {activeTab === "social" && renderSocialTab()}
        {activeTab === "health" && renderHealthTab()}
      </main>
    </div>
  );
}
