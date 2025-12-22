import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthDocumentScanner } from "@/components/documents/HealthDocumentScanner";
import { TimelineFeed } from "@/components/social/TimelineFeed";
import { CommunitiesList } from "@/components/social/CommunitiesList";
import { ClubsList } from "@/components/social/ClubsList";
import { ProfessionalPages } from "@/components/social/ProfessionalPages";
import { CrowdfundingCampaigns } from "@/components/social/CrowdfundingCampaigns";
import { NewsFeedWidget } from "@/components/social/NewsFeedWidget";
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
  FileHeart,
  Video,
  CreditCard,
  Shield,
  ScanLine,
  Trophy,
  Megaphone,
  Clock,
  TrendingUp,
  FileCheck,
  UserCog,
  Wallet,
  Target,
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

// Work modules (excluding myhealth and support which go to other tabs)
const workModuleCategories: ModuleCategory[] = [
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

type SocialSection = 'timeline' | 'communities' | 'clubs' | 'pages' | 'crowdfunding';

const socialNavItems = [
  { id: 'timeline' as SocialSection, label: 'Timeline', icon: MessageSquare, description: 'Your health feed' },
  { id: 'communities' as SocialSection, label: 'Communities', icon: Users, description: 'Support groups' },
  { id: 'clubs' as SocialSection, label: 'Clubs', icon: Trophy, description: 'Wellness & fitness' },
  { id: 'pages' as SocialSection, label: 'Pages', icon: Building2, description: 'Professionals' },
  { id: 'crowdfunding' as SocialSection, label: 'Fundraising', icon: Megaphone, description: 'Support causes' },
];

function SocialHubLayout() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SocialSection>('timeline');

  const renderSocialContent = () => {
    switch (activeSection) {
      case 'timeline':
        return <TimelineFeed />;
      case 'communities':
        return <CommunitiesList onSelectCommunity={() => {}} />;
      case 'clubs':
        return <ClubsList onSelectClub={() => {}} />;
      case 'pages':
        return <ProfessionalPages onSelectPage={() => {}} />;
      case 'crowdfunding':
        return <CrowdfundingCampaigns />;
      default:
        return <TimelineFeed />;
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Sidebar Navigation */}
      <div className="hidden lg:block w-64 shrink-0">
        <Card className="sticky top-24">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Social Hub</CardTitle>
                <CardDescription className="text-xs">Connect & share</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {socialNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    activeSection === item.id
                      ? 'bg-purple-500/10 text-purple-600 font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${activeSection === item.id ? 'text-purple-500' : ''}`} />
                  <div>
                    <p className="text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Document Scanner */}
        <Card className="mt-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <ScanLine className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Share Docs</p>
                <p className="text-xs text-muted-foreground">Scan & share</p>
              </div>
            </div>
            <HealthDocumentScanner variant="button" className="w-full bg-purple-500 hover:bg-purple-600 text-white" />
          </CardContent>
        </Card>

        {/* Health Marketplace */}
        <Card className="mt-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Marketplace</p>
                <p className="text-xs text-muted-foreground">Shop health products</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-green-500/30 hover:bg-green-500 hover:text-white"
              onClick={() => navigate("/marketplace")}
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>

        {/* Communication Hub */}
        <Card className="mt-4 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border-indigo-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Communication</p>
                <p className="text-xs text-muted-foreground">Messages & calls</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-indigo-500/30 hover:bg-indigo-500 hover:text-white"
              onClick={() => navigate("/communication")}
            >
              Open Hub
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {socialNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(item.id)}
                  className={activeSection === item.id ? "bg-purple-500 hover:bg-purple-600" : ""}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {(() => {
              const currentItem = socialNavItems.find(item => item.id === activeSection);
              const Icon = currentItem?.icon || MessageSquare;
              return (
                <>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{currentItem?.label}</h3>
                    <p className="text-sm text-muted-foreground">{currentItem?.description}</p>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="lg:hidden">
            <HealthDocumentScanner variant="button" className="bg-purple-500 hover:bg-purple-600 text-white" />
          </div>
        </div>

        {/* Content */}
        {renderSocialContent()}
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          <NewsFeedWidget />
        </div>
      </div>
    </div>
  );
}

export default function ModuleHome() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role || "nurse";
  const [activeTab, setActiveTab] = useState("work");

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
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {getDisplayTitle()}
          </h2>
          <p className="text-muted-foreground mt-1">
            Select a module to get started.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="work" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">My Work</span>
              <span className="sm:hidden">Work</span>
            </TabsTrigger>
            <TabsTrigger value="portal" className="flex items-center gap-2 py-3 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">My Personal Health Portal</span>
              <span className="sm:hidden">Health</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Health Social Hub</span>
              <span className="sm:hidden">Social</span>
            </TabsTrigger>
          </TabsList>

          {/* My Work Tab */}
          <TabsContent value="work" className="mt-0">
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

            {/* Document Scanner */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-primary/10 to-blue-500/10">
                    <ScanLine className="h-3 w-3 mr-1" />
                    Document Scanner
                  </Badge>
                  <p className="hidden sm:block text-sm text-muted-foreground">Scan prescriptions, lab results & more</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HealthDocumentScanner variant="card" />
                <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed">
                  <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Recent Scans</p>
                      <p className="text-xs text-muted-foreground">No documents scanned yet</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* My Practice Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
                    <Briefcase className="h-3 w-3 mr-1" />
                    My Practice
                  </Badge>
                  <p className="hidden sm:block text-sm text-muted-foreground">Manage your practice operations</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/practice")}>
                  Practice Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/appointments")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-teal-500/10 flex items-center justify-center mb-2 group-hover:bg-teal-500 transition-colors">
                      <Calendar className="h-5 w-5 text-teal-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Schedule</p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/patients")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500 transition-colors">
                      <Users className="h-5 w-5 text-blue-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Patient Panel</p>
                    <p className="text-xs text-muted-foreground">My patients</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/charges")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-green-500/10 flex items-center justify-center mb-2 group-hover:bg-green-500 transition-colors">
                      <Wallet className="h-5 w-5 text-green-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Billing</p>
                    <p className="text-xs text-muted-foreground">Revenue & claims</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/reports")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center mb-2 group-hover:bg-purple-500 transition-colors">
                      <TrendingUp className="h-5 w-5 text-purple-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/admin")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-orange-500/10 flex items-center justify-center mb-2 group-hover:bg-orange-500 transition-colors">
                      <UserCog className="h-5 w-5 text-orange-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Staff</p>
                    <p className="text-xs text-muted-foreground">Team & roles</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/stock")}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center mb-2 group-hover:bg-amber-500 transition-colors">
                      <Package className="h-5 w-5 text-amber-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium">Inventory</p>
                    <p className="text-xs text-muted-foreground">Supplies & stock</p>
                  </CardContent>
                </Card>
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
                {workModuleCategories.map((category) => {
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
          </TabsContent>

          {/* My Personal Health Portal Tab */}
          <TabsContent value="portal" className="mt-0">
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 rounded-2xl p-8 border border-pink-200/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">My Health Portal</h3>
                    <p className="text-muted-foreground">Access your personal health records, appointments, and more</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={() => navigate("/portal")}
                >
                  Open My Health Portal
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {/* Communication Hub for Portal */}
              <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-indigo-200/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Communication Hub</h4>
                      <p className="text-sm text-muted-foreground">Messages, pages & calls with your care team</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate("/communication?tab=messages")}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Messages
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate("/communication?tab=pages")}>
                      <Bell className="h-4 w-4 mr-1" />
                      Pages
                    </Button>
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white" size="sm" onClick={() => navigate("/communication")}>
                      <Phone className="h-4 w-4 mr-1" />
                      Open Hub
                    </Button>
                  </div>
                </div>
              </div>

              {/* Document Scanner for Portal */}
              <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-xl p-6 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                      <ScanLine className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Scan Health Documents</h4>
                      <p className="text-sm text-muted-foreground">Upload prescriptions, lab results, insurance cards & more</p>
                    </div>
                  </div>
                  <HealthDocumentScanner variant="button" className="bg-primary hover:bg-primary/90 text-primary-foreground" />
                </div>
              </div>

              {/* E-Prescriptions & E-Orders Quick Access */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-200/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Prescriptions & Orders</h4>
                      <p className="text-sm text-muted-foreground">View your prescriptions, request refills & track orders</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => navigate("/pharmacy")}>
                      <Pill className="h-4 w-4 mr-2" />
                      My Prescriptions
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => navigate("/orders")}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                  </div>
                </div>
              </div>

              {/* Health Marketplace Quick Access */}
              <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-green-200/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Health Marketplace</h4>
                      <p className="text-sm text-muted-foreground">Browse health products, compare prices & order from trusted vendors</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/catalogue")}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Catalogue
                    </Button>
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => navigate("/marketplace")}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Open Marketplace
                    </Button>
                  </div>
                </div>
              </div>

              {/* Portal Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                        <FileHeart className="h-6 w-6 text-pink-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">Health Records</CardTitle>
                    <CardDescription className="text-xs">View your medical history, lab results, and documents</CardDescription>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">My Appointments</CardTitle>
                    <CardDescription className="text-xs">Schedule and manage your healthcare appointments</CardDescription>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Pill className="h-6 w-6 text-emerald-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">My Medications</CardTitle>
                    <CardDescription className="text-xs">Track prescriptions and request refills</CardDescription>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-purple-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">Telehealth</CardTitle>
                    <CardDescription className="text-xs">Virtual consultations with your care team</CardDescription>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-amber-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">Vitals & Tracking</CardTitle>
                    <CardDescription className="text-xs">Monitor your health metrics and vitals</CardDescription>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg hover:border-pink-500/50 transition-all group"
                  onClick={() => navigate("/portal")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-green-500" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">Billing & Payments</CardTitle>
                    <CardDescription className="text-xs">View bills and make payments online</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Health Social Hub Tab */}
          <TabsContent value="social" className="mt-0">
            <SocialHubLayout />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
