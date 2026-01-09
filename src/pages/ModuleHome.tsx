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
import { PatientPortal } from "@/components/portal/PatientPortal";
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
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmergencySOS } from "@/components/portal/EmergencySOS";
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
      { id: "patients-registry", label: "Client Registry (MOSIP)", description: "Master patient index & Impilo ID", icon: Users, path: "/id-services", color: "bg-blue-500" },
      { id: "providers", label: "Provider Registry (Varapi)", description: "iHRIS healthcare workers", icon: Stethoscope, path: "/id-services", color: "bg-teal-500" },
      { id: "facilities", label: "Facility Registry (Thuso)", description: "GOFR health facilities", icon: Building2, path: "/id-services", color: "bg-purple-500" },
      { id: "terminology", label: "Terminology Service", description: "ICD-11, SNOMED-CT, LOINC codes", icon: BookOpen, path: "/id-services", color: "bg-amber-500" },
      { id: "shr", label: "Shared Health Record", description: "FHIR-based patient records", icon: FileHeart, path: "/id-services", color: "bg-rose-500" },
      { id: "ndr", label: "National Data Repository", description: "Aggregated facility reporting", icon: Database, path: "/id-services", color: "bg-indigo-500" },
      { id: "product-registry", label: "Product Registry", description: "Health products catalogue", icon: Package, path: "/admin/product-registry", color: "bg-green-500", roles: ["admin"] },
      { id: "fhir-viewer", label: "FHIR Resources", description: "HL7 FHIR interoperability viewer", icon: FileCheck, path: "/admin", color: "bg-cyan-500", roles: ["admin"] },
    ],
  },
  {
    id: "admin",
    title: "Administration & Reports",
    description: "System settings, analytics, and integrations",
    modules: [
      { id: "reports", label: "Reports & Analytics", description: "Dashboards & insights", icon: BarChart3, path: "/reports", color: "bg-violet-500" },
      { id: "report-builder", label: "Custom Reports", description: "Build custom reports & queries", icon: FileCheck, path: "/reports", color: "bg-indigo-500" },
      { id: "odoo", label: "Odoo ERP", description: "ERP integration", icon: Building2, path: "/odoo", color: "bg-gray-600", roles: ["admin"] },
      { id: "admin", label: "System Admin", description: "Users, security & settings", icon: Settings, path: "/admin", color: "bg-gray-700", roles: ["admin"] },
    ],
  },
  {
    id: "clinical-tools",
    title: "Clinical Tools",
    description: "Advanced clinical documentation and utilities",
    modules: [
      { id: "voice-dictation", label: "Voice Dictation", description: "Speech-to-text for notes", icon: Activity, path: "/encounter", color: "bg-rose-500", roles: ["doctor", "nurse", "specialist"] },
      { id: "sync", label: "Offline Sync", description: "Conflict resolution & sync status", icon: ArrowRightLeft, path: "/admin", color: "bg-slate-600", roles: ["admin"] },
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
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
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
        <div className="lg:hidden mb-3 sm:mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-1.5 sm:gap-2 pb-2">
              {socialNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "outline"}
                  size="sm"
                  className={`text-xs h-8 px-2.5 sm:px-3 ${activeSection === item.id ? "bg-purple-500 hover:bg-purple-600" : ""}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden xs:inline">{item.label}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {(() => {
              const currentItem = socialNavItems.find(item => item.id === activeSection);
              const Icon = currentItem?.icon || MessageSquare;
              return (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">{currentItem?.label}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{currentItem?.description}</p>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="lg:hidden">
            <HealthDocumentScanner variant="button" className="bg-purple-500 hover:bg-purple-600 text-white text-xs h-8" />
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={impiloLogo} alt="Impilo" className="h-8 sm:h-10 w-auto" />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-full">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role} • {profile?.department || "General"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Welcome back, {getDisplayTitle()}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Select a module to get started.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto p-1">
            <TabsTrigger value="work" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:hidden">Work</span>
              <span className="hidden sm:inline">My Work</span>
              <span className="xs:hidden">Work</span>
            </TabsTrigger>
            <TabsTrigger value="portal" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Health Portal</span>
              <span className="sm:hidden">Health</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Social Hub</span>
              <span className="sm:hidden">Social</span>
            </TabsTrigger>
          </TabsList>

          {/* My Work Tab */}
          <TabsContent value="work" className="mt-0 space-y-4 sm:space-y-8">
            {/* Communication Quick Access */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">Communication</Badge>
                  <p className="hidden md:block text-sm text-muted-foreground">Messages, pages & calls</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => navigate("/communication")}>
                  <span className="hidden sm:inline">Open Hub</span>
                  <span className="sm:hidden">Hub</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-3 hover:bg-accent"
                  onClick={() => navigate("/communication?tab=messages")}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-xs sm:text-sm">Messages</p>
                      <p className="hidden sm:block text-xs text-muted-foreground">Chat with teams</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-3 hover:bg-accent"
                  onClick={() => navigate("/communication?tab=pages")}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-xs sm:text-sm">Pages</p>
                      <p className="hidden sm:block text-xs text-muted-foreground">Urgent alerts</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-3 hover:bg-accent"
                  onClick={() => navigate("/communication?tab=calls")}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-xs sm:text-sm">Calls</p>
                      <p className="hidden sm:block text-xs text-muted-foreground">Voice & video</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Document Scanner */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-gradient-to-r from-primary/10 to-blue-500/10">
                    <ScanLine className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Document </span>Scanner
                  </Badge>
                  <p className="hidden md:block text-sm text-muted-foreground">Scan prescriptions, lab results & more</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <HealthDocumentScanner variant="card" />
                <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed">
                  <CardContent className="py-4 sm:pt-6 flex flex-col items-center gap-2 sm:gap-3 text-center">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Recent Scans</p>
                      <p className="text-xs text-muted-foreground">No documents scanned yet</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* My Practice Section */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
                    <Briefcase className="h-3 w-3 mr-1" />
                    My Practice
                  </Badge>
                  <p className="hidden md:block text-sm text-muted-foreground">Manage your practice operations</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => navigate("/practice")}>
                  <span className="hidden sm:inline">Practice Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/appointments")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-teal-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-teal-500 transition-colors">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Schedule</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">Appointments</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/patients")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-blue-500 transition-colors">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Patients</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">My patients</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/charges")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-green-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-green-500 transition-colors">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Billing</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">Revenue & claims</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/reports")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-purple-500 transition-colors">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Analytics</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">Performance</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/admin")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-orange-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-orange-500 transition-colors">
                      <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Staff</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">Team & roles</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-teal-500/50 transition-all group"
                  onClick={() => navigate("/stock")}
                >
                  <CardContent className="p-2.5 sm:pt-5 sm:pb-4 text-center">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-amber-500 transition-colors">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 group-hover:text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium">Inventory</p>
                    <p className="hidden sm:block text-xs text-muted-foreground">Supplies & stock</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">Quick Access</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                  onClick={() => navigate("/dashboard")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                    <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">Dashboard</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group"
                  onClick={() => navigate("/queue")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500 group-hover:text-white" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">Queue</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all group"
                  onClick={() => navigate("/pharmacy")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Pill className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600 group-hover:text-white" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">Prescribe</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all group"
                  onClick={() => navigate("/orders")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-cyan-600/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <ClipboardCheck className="h-4 w-4 sm:h-6 sm:w-6 text-cyan-600 group-hover:text-white" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">Orders</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all group"
                  onClick={() => navigate("/registration")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <UserPlus className="h-4 w-4 sm:h-6 sm:w-6 text-green-500 group-hover:text-white" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">Register</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-6 flex flex-col items-center gap-1.5 sm:gap-3 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all group"
                  onClick={() => navigate("/encounter")}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500 group-hover:text-white" />
                  </div>
                  <span className="font-medium text-[10px] sm:text-sm">EHR</span>
                </Button>
              </div>
            </div>

            {/* Module Categories */}
            <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
              {workModuleCategories.map((category) => {
                const visibleModules = getVisibleModules(category.modules);
                if (visibleModules.length === 0) return null;

                return (
                  <section key={category.id}>
                    <div className="mb-2 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold">{category.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                      {visibleModules.map((module) => (
                        <Card
                          key={module.id}
                          className="cursor-pointer hover:shadow-md sm:hover:shadow-lg hover:border-primary/50 transition-all group"
                          onClick={() => handleModuleClick(module.path)}
                        >
                          <CardHeader className="p-3 sm:pb-3 sm:p-6">
                            <div className="flex items-start justify-between">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg ${module.color} flex items-center justify-center`}>
                                <module.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <CardTitle className="text-xs sm:text-base mb-0.5 sm:mb-1">{module.label}</CardTitle>
                            <CardDescription className="text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-none">{module.description}</CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </TabsContent>

          {/* My Personal Health Portal Tab - Practitioner as Patient */}
          <TabsContent value="portal" className="mt-0">
            <PatientPortal />
          </TabsContent>

          {/* Health Social Hub Tab */}
          <TabsContent value="social" className="mt-0">
            <SocialHubLayout />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Emergency SOS Button - Always Visible */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-2xl z-50 flex items-center justify-center animate-pulse hover:animate-none"
            aria-label="Emergency SOS"
          >
            <AlertTriangle className="h-8 w-8 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <EmergencySOS />
        </DialogContent>
      </Dialog>
    </div>
  );
}
