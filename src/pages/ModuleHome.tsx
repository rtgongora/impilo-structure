import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRoles, ModuleAccessRole } from "@/hooks/useUserRoles";
import { useModuleAvailability } from "@/hooks/useFacilityCapabilities";
import { FacilityCapability } from "@/contexts/FacilityContext";
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
import { ExpandableCategoryCard } from "@/components/home/ExpandableCategoryCard";
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
  Lock,
  Search,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmergencyHub } from "@/components/emergency/EmergencyHub";
import impiloLogo from "@/assets/impilo-logo.png";

// Category icons mapping for expandable cards
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "clinical": Stethoscope,
  "consults-referrals": Video,
  "orders": ShoppingCart,
  "scheduling": Calendar,
  "marketplace": Store,
  "finance": DollarSign,
  "inventory": Package,
  "identity": Shield,
  "registries": Database,
  "admin": Settings,
  "clinical-tools": Activity,
  "support": HelpCircle,
};

// Category colors mapping
const categoryColors: Record<string, string> = {
  "clinical": "bg-blue-500",
  "consults-referrals": "bg-teal-500",
  "orders": "bg-green-500",
  "scheduling": "bg-cyan-500",
  "marketplace": "bg-purple-500",
  "finance": "bg-emerald-500",
  "inventory": "bg-orange-500",
  "identity": "bg-indigo-500",
  "registries": "bg-rose-500",
  "admin": "bg-slate-600",
  "clinical-tools": "bg-pink-500",
  "support": "bg-teal-500",
};

interface ModuleItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  roles?: ModuleAccessRole[];
  requiresAuth?: boolean;
  // Facility capability requirements - module shows if user's facility has ANY of these capabilities
  capabilities?: FacilityCapability[];
}

interface ModuleCategory {
  id: string;
  title: string;
  description: string;
  modules: ModuleItem[];
  roles?: ModuleAccessRole[]; // Category-level role restriction
  requiresAuth?: boolean;
  // Facility capability requirements - category shows if user's facility has ANY of these capabilities  
  capabilities?: FacilityCapability[];
}

// Work modules (excluding myhealth and support which go to other tabs)
// NOTE: Categories WITHOUT roles are visible to ALL authenticated users
// Modules WITHOUT roles are visible to ALL users who can see the category
const workModuleCategories: ModuleCategory[] = [
  {
    id: "clinical",
    title: "Clinical Care",
    description: "Patient encounters, assessments, and care delivery",
    // No category-level restriction - all authenticated users can see this category
    modules: [
      { id: "dashboard", label: "My Dashboard", description: "Your worklist, tasks, and alerts", icon: ClipboardList, path: "/dashboard", color: "bg-primary" },
      { id: "communication", label: "Communication", description: "Messages, pages & calls", icon: MessageSquare, path: "/communication", color: "bg-primary" },
      { id: "sorting", label: "Patient Sorting", description: "Front desk: arrival & triage", icon: ClipboardCheck, path: "/sorting", color: "bg-orange-500" },
      { id: "ehr", label: "Patient Encounters", description: "Clinical documentation & care", icon: Stethoscope, path: "/encounter", color: "bg-blue-500", roles: ["doctor", "nurse", "specialist", "admin"] },
      { id: "queue", label: "Patient Queue", description: "Waiting patients & triage", icon: Users, path: "/queue", color: "bg-orange-500" },
      { id: "beds", label: "Bed Management", description: "Ward status & admissions", icon: Bed, path: "/beds", color: "bg-purple-500", roles: ["doctor", "nurse", "admin"], capabilities: ["inpatient"] },
      { id: "operations", label: "Operations & Roster", description: "Shifts, roster & workforce", icon: Clock, path: "/operations", color: "bg-cyan-600" },
      { id: "handoff", label: "Shift Handoff", description: "Care continuity reports", icon: ArrowRightLeft, path: "/handoff", color: "bg-teal-500", roles: ["doctor", "nurse", "admin"], capabilities: ["inpatient", "emergency_24hr"] },
    ],
  },
  {
    id: "consults-referrals",
    title: "Consults & Referrals",
    description: "Telemedicine, specialist consults, and inter-facility referrals",
    modules: [
      { id: "telemedicine-hub", label: "Telemedicine Hub", description: "Full-circle teleconsultation workflow", icon: Video, path: "/telemedicine", color: "bg-primary" },
      { id: "referrals", label: "Referrals", description: "Outgoing & incoming referrals", icon: ArrowRightLeft, path: "/telemedicine?tab=referrals", color: "bg-blue-500", roles: ["doctor", "nurse", "specialist", "admin"] },
      { id: "consults", label: "Consultations", description: "Specialist consultations & reviews", icon: Stethoscope, path: "/telemedicine?tab=consults", color: "bg-teal-500", roles: ["doctor", "specialist", "admin"] },
      { id: "case-reviews", label: "Case Reviews & Boards", description: "M&M and specialist boards", icon: Users, path: "/telemedicine?tab=boards", color: "bg-purple-500", roles: ["doctor", "specialist", "admin"] },
    ],
  },
  {
    id: "orders",
    title: "Orders & Diagnostics",
    description: "Lab, imaging, pharmacy, and clinical orders",
    modules: [
      { id: "orders", label: "Order Entry", description: "Medications, labs, & imaging", icon: ShoppingCart, path: "/orders", color: "bg-green-500", roles: ["doctor", "nurse", "specialist", "admin"] },
      { id: "eprescriptions", label: "ePrescriptions", description: "Electronic prescriptions & formulary", icon: Pill, path: "/pharmacy", color: "bg-emerald-600", roles: ["doctor", "specialist", "pharmacist", "admin"], capabilities: ["pharmacy", "pharmacy_basic"] },
      { id: "eorders", label: "E-Orders", description: "Electronic clinical orders", icon: ClipboardCheck, path: "/orders", color: "bg-cyan-600", roles: ["doctor", "nurse", "specialist", "admin"] },
      { id: "pharmacy", label: "Pharmacy", description: "Dispensing & medication tracking", icon: Syringe, path: "/pharmacy", color: "bg-pink-500", roles: ["pharmacist", "doctor", "nurse", "admin"], capabilities: ["pharmacy", "pharmacy_basic", "dispensing"] },
      { id: "lims", label: "Laboratory", description: "Lab orders & results", icon: FlaskConical, path: "/lims", color: "bg-amber-500", roles: ["lab_tech", "doctor", "nurse", "specialist", "admin"], capabilities: ["laboratory", "lims", "specimen_collection"] },
      { id: "pacs", label: "Imaging (PACS)", description: "Radiology & diagnostic imaging", icon: FileText, path: "/pacs", color: "bg-indigo-500", roles: ["radiologist", "doctor", "specialist", "admin"], capabilities: ["pacs", "radiology"] },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling & Registration",
    description: "Appointments, patient registration, and theatre",
    modules: [
      { id: "sorting", label: "Patient Sorting", description: "Arrival, triage & queue assignment", icon: ClipboardCheck, path: "/sorting", color: "bg-orange-500" },
      { id: "appointments", label: "Appointments", description: "Clinic & provider scheduling", icon: Calendar, path: "/appointments", color: "bg-cyan-500" },
      { id: "registration", label: "Patient Registration", description: "New patient intake & ID", icon: UserPlus, path: "/registration", color: "bg-emerald-500" },
      { id: "patients", label: "Patient Registry", description: "Search & manage patients", icon: Users, path: "/patients", color: "bg-slate-500" },
      { id: "theatre", label: "Theatre Booking", description: "Surgical scheduling", icon: Building2, path: "/theatre", color: "bg-rose-500", roles: ["doctor", "specialist", "nurse", "admin"], capabilities: ["theatre"] },
    ],
  },
  {
    id: "marketplace",
    title: "Health Products & Marketplace",
    description: "Browse products, compare vendors, and order supplies",
    // No category-level restriction - accessible to all
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
    roles: ['admin', 'receptionist', 'doctor', 'nurse'],
    modules: [
      { id: "payments", label: "Payments", description: "Patient billing & collections", icon: DollarSign, path: "/payments", color: "bg-green-600", roles: ["admin", "receptionist"] },
      { id: "charges", label: "Encounter Charges", description: "Service & item charges", icon: Receipt, path: "/charges", color: "bg-yellow-600" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Supply Chain",
    description: "Stock management and consumables tracking",
    roles: ['admin', 'pharmacist', 'nurse'],
    modules: [
      { id: "stock", label: "Stock Management", description: "Inventory & reordering", icon: Package, path: "/stock", color: "bg-orange-600", roles: ["admin", "pharmacist"] },
      { id: "consumables", label: "Consumables", description: "Usage & administration", icon: Syringe, path: "/consumables", color: "bg-red-500" },
    ],
  },
  {
    id: "identity",
    title: "Identity Services",
    description: "Generate, validate, and recover health IDs",
    roles: ['admin', 'registrar', 'receptionist', 'hie_admin', 'doctor', 'nurse'],
    modules: [
      { id: "id-services", label: "ID Services Hub", description: "Generate, validate & recover IDs", icon: Shield, path: "/id-services?tab=generate", color: "bg-primary", roles: ["admin", "registrar", "hie_admin"] },
      { id: "phid-generation", label: "Patient PHID", description: "Generate Patient Health IDs", icon: UserCog, path: "/id-services?tab=generate", color: "bg-blue-500", roles: ["admin", "registrar", "receptionist", "hie_admin"] },
      { id: "provider-id", label: "Provider ID (Varapi)", description: "Generate healthcare worker IDs", icon: Stethoscope, path: "/id-services?tab=generate", color: "bg-teal-500", roles: ["admin", "hie_admin"] },
      { id: "facility-id", label: "Facility ID (Thuso)", description: "Generate facility identifiers", icon: Building2, path: "/id-services?tab=generate", color: "bg-purple-500", roles: ["admin", "hie_admin"] },
      { id: "id-recovery", label: "ID Recovery", description: "Recover lost or forgotten IDs", icon: Shield, path: "/id-services?tab=recovery", color: "bg-amber-500" },
      { id: "id-validate", label: "ID Validation", description: "Verify ID authenticity", icon: Search, path: "/id-services?tab=validate", color: "bg-green-500" },
      { id: "id-batch", label: "Batch Generation", description: "Generate IDs in bulk", icon: Package, path: "/id-services?tab=batch", color: "bg-orange-500", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "registries",
    title: "HIE Registries",
    description: "Health information exchange registries and services",
    roles: ['admin', 'hie_admin', 'doctor', 'specialist'],
    modules: [
      { id: "patients-registry", label: "Client Registry (MOSIP)", description: "Master patient index & Health ID", icon: Users, path: "/client-registry", color: "bg-blue-500", roles: ["admin", "hie_admin", "registrar"] },
      { id: "providers", label: "Provider Registry (Varapi)", description: "National HPR & IdP", icon: Stethoscope, path: "/hpr", color: "bg-teal-500", roles: ["admin", "hie_admin"] },
      { id: "facilities", label: "Facility Registry (Thuso)", description: "GOFR health facilities", icon: Building2, path: "/facility-registry", color: "bg-purple-500", roles: ["admin", "hie_admin"] },
      { id: "terminology", label: "Terminology Service", description: "ICD-11, SNOMED-CT, LOINC codes", icon: BookOpen, path: "/terminology", color: "bg-amber-500" },
      { id: "shr", label: "Shared Health Record", description: "FHIR-based patient records", icon: FileHeart, path: "/shr", color: "bg-rose-500", roles: ["admin", "hie_admin"] },
      { id: "ndr", label: "National Data Repository", description: "Aggregated facility reporting", icon: Database, path: "/ndr", color: "bg-indigo-500", roles: ["admin", "hie_admin"] },
      { id: "product-registry", label: "Product Registry", description: "Health products catalogue", icon: Package, path: "/admin/product-registry", color: "bg-green-500", roles: ["admin"] },
      { id: "fhir-viewer", label: "FHIR Resources", description: "HL7 FHIR interoperability viewer", icon: FileCheck, path: "/admin", color: "bg-cyan-500", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "admin",
    title: "Administration & Reports",
    description: "System settings, analytics, and integrations",
    roles: ['admin', 'doctor', 'specialist'],
    modules: [
      { id: "reports", label: "Reports & Analytics", description: "Dashboards & insights", icon: BarChart3, path: "/reports", color: "bg-violet-500" },
      { id: "report-builder", label: "Custom Reports", description: "Build custom reports & queries", icon: FileCheck, path: "/reports", color: "bg-indigo-500", roles: ["admin"] },
      { id: "odoo", label: "Odoo ERP", description: "ERP integration", icon: Building2, path: "/odoo", color: "bg-gray-600", roles: ["admin"] },
      { id: "admin", label: "System Admin", description: "Users, security & settings", icon: Settings, path: "/admin", color: "bg-gray-700", roles: ["admin"] },
    ],
  },
  {
    id: "clinical-tools",
    title: "Clinical Tools",
    description: "Advanced clinical documentation and utilities",
    roles: ['doctor', 'nurse', 'specialist', 'admin'],
    modules: [
      { id: "voice-dictation", label: "Voice Dictation", description: "Speech-to-text for notes", icon: Activity, path: "/encounter", color: "bg-rose-500" },
      { id: "sync", label: "Offline Sync", description: "Conflict resolution & sync status", icon: ArrowRightLeft, path: "/admin", color: "bg-slate-600", roles: ["admin"] },
    ],
  },
  {
    id: "support",
    title: "Help & Support",
    description: "FAQs, user guides, and system documentation",
    // No restriction - always visible
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
  const { canAccessModule, isAdmin, loading: rolesLoading } = useUserRoles();
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

  const { hasAnyCapability, isLoaded: facilitiesLoaded } = useModuleAvailability();

  // Filter modules based on role-based access control AND facility capabilities
  const getVisibleModules = (modules: ModuleItem[]) => {
    return modules.filter((module) => {
      // Check role access
      if (!canAccessModule(module.roles)) return false;
      
      // Check facility capabilities (if specified)
      if (module.capabilities && module.capabilities.length > 0 && facilitiesLoaded) {
        if (!hasAnyCapability(module.capabilities)) return false;
      }
      
      return true;
    });
  };

  // Filter categories based on category-level role restrictions AND facility capabilities
  const getVisibleCategories = (categories: ModuleCategory[]) => {
    return categories
      .map((category) => {
        // Check if user can access this category by role
        if (!canAccessModule(category.roles)) return null;
        
        // Check facility capabilities at category level
        if (category.capabilities && category.capabilities.length > 0 && facilitiesLoaded) {
          if (!hasAnyCapability(category.capabilities)) return null;
        }
        
        // Filter modules within the category
        const visibleModules = getVisibleModules(category.modules);
        
        // Only show category if it has visible modules
        if (visibleModules.length === 0) return null;
        
        return { ...category, modules: visibleModules };
      })
      .filter((cat): cat is ModuleCategory => cat !== null);
  };

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  const visibleCategories = getVisibleCategories(workModuleCategories);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-12">
            <img src={impiloLogo} alt="Impilo" className="h-7 w-auto" />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-full">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium leading-tight">{profile?.display_name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize leading-tight">{profile?.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => signOut()}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fill Screen */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full h-full">
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Welcome, {getDisplayTitle()}</h2>
              <p className="text-sm text-muted-foreground">Select a module to get started</p>
            </div>
          </div>

          {/* Tabs - Fill remaining space */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 h-10 p-1 mb-4">
              <TabsTrigger value="work" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Briefcase className="h-4 w-4" />
                Work
              </TabsTrigger>
              <TabsTrigger value="portal" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Heart className="h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                Social
              </TabsTrigger>
            </TabsList>

            {/* My Work Tab */}
            <TabsContent value="work" className="mt-0 flex-1 flex flex-col gap-4 min-h-0">
              {/* Communication and Quick Access - More prominent */}
              <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                {/* Communication Noticeboard */}
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Communication Noticeboard
                    </h3>
                    <HealthDocumentScanner variant="button" className="h-10" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=messages")}
                    >
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Messages
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=pages")}
                    >
                      <Bell className="h-5 w-5 text-warning" />
                      Pages
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=calls")}
                    >
                      <Phone className="h-5 w-5 text-success" />
                      Calls
                    </Button>
                  </div>
                </div>
                
                {/* Quick Access */}
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Quick Access
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base hover:bg-primary hover:text-primary-foreground group"
                      onClick={() => navigate("/dashboard")}
                    >
                      <ClipboardList className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base hover:bg-blue-500 hover:text-white group"
                      onClick={() => navigate("/queue")}
                    >
                      <Users className="h-5 w-5 text-blue-500 group-hover:text-white" />
                      Queue
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base hover:bg-emerald-600 hover:text-white group"
                      onClick={() => navigate("/pharmacy")}
                    >
                      <Pill className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                      Prescribe
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 px-4 flex items-center gap-2 text-base hover:bg-green-500 hover:text-white group"
                      onClick={() => navigate("/registration")}
                    >
                      <UserPlus className="h-5 w-5 text-green-500 group-hover:text-white" />
                      Register
                    </Button>
                  </div>
                </div>
              </div>

              {/* Module Categories - Compact horizontal cards */}
              <section className="flex-1 min-h-0 overflow-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {/* My Practice as first card */}
                  <ExpandableCategoryCard
                    id="my-practice"
                    title="My Practice"
                    description="Manage your practice operations"
                    modules={[
                      { id: "schedule", label: "Schedule", description: "Appointments", icon: Calendar, path: "/appointments", color: "bg-teal-500" },
                      { id: "patients", label: "Patients", description: "Patient panel", icon: Users, path: "/patients", color: "bg-blue-500" },
                      { id: "billing", label: "Billing", description: "Charges", icon: Wallet, path: "/charges", color: "bg-green-500" },
                      { id: "analytics", label: "Analytics", description: "Reports", icon: TrendingUp, path: "/reports", color: "bg-purple-500" },
                      { id: "staff", label: "Staff", description: "Administration", icon: UserCog, path: "/admin", color: "bg-orange-500" },
                      { id: "inventory", label: "Inventory", description: "Stock", icon: Package, path: "/stock", color: "bg-amber-500" },
                    ]}
                    icon={Briefcase}
                    color="bg-teal-500"
                    onModuleClick={handleModuleClick}
                    defaultExpanded={false}
                  />
                  {visibleCategories.map((category) => (
                    <ExpandableCategoryCard
                      key={category.id}
                      id={category.id}
                      title={category.title}
                      description={category.description}
                      modules={category.modules}
                      icon={categoryIcons[category.id] || Stethoscope}
                      color={categoryColors[category.id] || "bg-primary"}
                      roles={category.roles}
                      onModuleClick={handleModuleClick}
                      defaultExpanded={false}
                    />
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* My Personal Health Portal Tab */}
            <TabsContent value="portal" className="mt-0 flex-1 overflow-auto">
              <PatientPortal />
            </TabsContent>

            {/* Health Social Hub Tab */}
            <TabsContent value="social" className="mt-0 flex-1 overflow-auto">
              <SocialHubLayout />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating Emergency Button - Always Visible */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-2xl z-50 flex items-center justify-center animate-pulse hover:animate-none"
            aria-label="Emergency"
          >
            <AlertTriangle className="h-8 w-8 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <EmergencyHub />
        </DialogContent>
      </Dialog>
    </div>
  );
}
