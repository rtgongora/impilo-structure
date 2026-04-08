import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRoles, ModuleAccessRole } from "@/hooks/useUserRoles";
import { useModuleAvailability } from "@/hooks/useFacilityCapabilities";
import { useActiveWorkContext, AccessMode } from "@/hooks/useActiveWorkContext";
import { FacilityCapability } from "@/contexts/FacilityContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkplaceSelectionHub } from "@/components/home/WorkplaceSelectionHub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HealthDocumentScanner } from "@/components/documents/HealthDocumentScanner";
import { PersonalHub } from "@/components/home/PersonalHub";
import { MyProfessionalHub } from "@/components/home/MyProfessionalHub";
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
  UserCheck,
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
  TestTube2,
  Scan,
  ChevronDown,
  Gauge,
  Monitor,
  Download,
  LayoutGrid,
  DoorOpen,
  RefreshCw,
  MapPin,
  Settings,
  Radio,
  PhoneCall,
  Headphones,
  Bot,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmergencyHub } from "@/components/emergency/EmergencyHub";
import { toast } from "sonner";
import impiloLogo from "@/assets/impilo-logo.png";
import { cn } from "@/lib/utils";

// Category icons mapping for expandable cards
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "clinical": Stethoscope,
  "facility-ops": Gauge,
  "finance-supply": DollarSign,
  "public-health-oversight": Activity,
  "platform-registries": Database,
  "support": HelpCircle,
};

// Category colors mapping
const categoryColors: Record<string, string> = {
  "clinical": "bg-blue-500",
  "facility-ops": "bg-rose-600",
  "finance-supply": "bg-emerald-600",
  "public-health-oversight": "bg-amber-600",
  "platform-registries": "bg-indigo-600",
  "support": "bg-teal-500",
};

// Context relevance tags — which access modes prioritize which categories
const categoryContextRelevance: Record<string, AccessMode[]> = {
  "clinical": ["clinical", "remote_clinical", "independent", "emergency"],
  "facility-ops": ["clinical", "independent"],
  "finance-supply": ["clinical", "independent", "oversight"],
  "public-health-oversight": ["oversight", "oversight_drill", "community", "remote_admin"],
  "platform-registries": ["oversight", "support"],
  "support": [],
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
  capabilities?: FacilityCapability[];
}

interface ModuleCategory {
  id: string;
  title: string;
  description: string;
  modules: ModuleItem[];
  roles?: ModuleAccessRole[];
  requiresAuth?: boolean;
  capabilities?: FacilityCapability[];
}

// Consolidated into 6 thematic groups
const workModuleCategories: ModuleCategory[] = [
  // ─── 1. CLINICAL CARE & ORDERS ───
  {
    id: "clinical",
    title: "Clinical Care & Orders",
    description: "Patient encounters, registration, orders, referrals, scheduling, and diagnostics",
    modules: [
      // Patient Care
      { id: "queue", label: "Queues & Wards", description: "Patient flow: intake, triage, queues & ward management", icon: Users, path: "/queue", color: "bg-orange-500" },
      { id: "beds", label: "Bed Management", description: "Ward status & admissions", icon: Bed, path: "/beds", color: "bg-purple-500", roles: ["doctor", "nurse", "admin"], capabilities: ["inpatient"] },
      { id: "discharge", label: "Discharge & Exit", description: "Discharges, deaths & exits", icon: DoorOpen, path: "/discharge", color: "bg-amber-600", roles: ["doctor", "nurse", "admin"] },
      { id: "landela", label: "Landela DMS", description: "Clinical document management & scanning", icon: ScanLine, path: "/landela", color: "bg-cyan-600" },
      // Orders & Diagnostics
    ],
  },
  // ─── 2. FACILITY OPERATIONS ───
  {
    id: "facility-ops",
    title: "Facility Operations",
    description: "Control tower, shifts, handoffs, communication, and enterprise resource planning",
    modules: [
      { id: "control-tower", label: "Control Tower", description: "Real-time facility operations", icon: Gauge, path: "/operations?tab=control-tower", color: "bg-rose-600", roles: ["admin", "nurse", "doctor"] },
      { id: "operations", label: "Operations & Roster", description: "Shifts, roster & workforce", icon: Clock, path: "/operations", color: "bg-cyan-600" },
      { id: "handoff", label: "Shift Handoff", description: "Care continuity reports", icon: ArrowRightLeft, path: "/handoff", color: "bg-teal-500", roles: ["doctor", "nurse", "admin"], capabilities: ["inpatient", "emergency_24hr"] },
      { id: "dashboard", label: "My Dashboard", description: "Your worklist, tasks, and alerts", icon: ClipboardList, path: "/dashboard", color: "bg-primary" },
      { id: "communication", label: "Communication", description: "Messages, pages & calls", icon: MessageSquare, path: "/communication", color: "bg-primary" },
      { id: "omnichannel-hub", label: "Omnichannel Hub", description: "All access channels in one view", icon: Radio, path: "/omnichannel", color: "bg-teal-600" },
      { id: "noticeboard", label: "Provider Noticeboard", description: "Announcements & scheduling updates", icon: Megaphone, path: "/scheduling/noticeboard", color: "bg-amber-500" },
      { id: "odoo", label: "Odoo ERP", description: "Enterprise resource planning", icon: Building2, path: "/odoo", color: "bg-gray-600", roles: ["admin"] },
    ],
  },
  // ─── 3. FINANCE, SUPPLY & MARKETPLACE ───
  {
    id: "finance-supply",
    title: "Finance, Supply & Marketplace",
    description: "Billing, payments, inventory, stock, marketplace, and coverage operations",
    modules: [
      // Finance & Billing
      { id: "payments", label: "Payments", description: "Patient billing & collections", icon: DollarSign, path: "/payments", color: "bg-green-600", roles: ["admin", "receptionist"] },
      { id: "charges", label: "Encounter Charges", description: "Service & item charges", icon: Receipt, path: "/charges", color: "bg-yellow-600" },
      // Inventory
      { id: "stock", label: "Stock Management", description: "Inventory & reordering", icon: Package, path: "/stock", color: "bg-orange-600", roles: ["admin", "pharmacist"] },
      { id: "consumables", label: "Consumables", description: "Usage & administration", icon: Syringe, path: "/consumables", color: "bg-red-500" },
      // Marketplace
      { id: "catalogue", label: "Health Products Catalogue", description: "Browse approved health products", icon: BookOpen, path: "/catalogue", color: "bg-blue-600" },
      { id: "marketplace", label: "Health Marketplace", description: "Compare prices & order from vendors", icon: Store, path: "/marketplace", color: "bg-green-600" },
      { id: "fulfillment", label: "Prescription Fulfillment", description: "Bidding & vendor selection for Rx", icon: ShoppingCart, path: "/fulfillment", color: "bg-purple-600", roles: ["doctor", "nurse", "pharmacist", "admin"] },
      { id: "vendor-portal", label: "Vendor Portal", description: "View requests & submit bids", icon: Building2, path: "/vendor-portal", color: "bg-orange-600", roles: ["vendor", "pharmacist", "admin"] },
      { id: "mushex", label: "Finance Engine (MUSHEX)", description: "Claims switch, settlement rail", icon: DollarSign, path: "/admin/mushex", color: "bg-indigo-500", roles: ["admin", "hie_admin"] },
      // Coverage
      { id: "coverage-ops", label: "Coverage Operations", description: "Full payer operations hub", icon: Shield, path: "/coverage", color: "bg-violet-600", roles: ["admin", "hie_admin", "receptionist"] },
      { id: "eligibility", label: "Eligibility & Entitlement", description: "Real-time eligibility checks", icon: UserCheck, path: "/coverage?tab=eligibility", color: "bg-green-600", roles: ["admin", "hie_admin", "receptionist"] },
      { id: "claims", label: "Claims & Adjudication", description: "Electronic claims lifecycle", icon: FileText, path: "/coverage?tab=claims", color: "bg-purple-600", roles: ["admin", "hie_admin", "receptionist"] },
    ],
  },
  // ─── 4. PUBLIC HEALTH & OVERSIGHT ───
  {
    id: "public-health-oversight",
    title: "Public Health & Oversight",
    description: "Surveillance, campaigns, above-site dashboards, analytics, and AI governance",
    roles: ['admin', 'hie_admin', 'doctor', 'nurse', 'specialist'],
    modules: [
      // Public Health
      { id: "ph-ops", label: "Public Health Operations", description: "Full public-health operations hub", icon: Activity, path: "/public-health", color: "bg-amber-600" },
      { id: "surveillance", label: "Surveillance / eIDSR", description: "Disease surveillance & alerts", icon: Target, path: "/public-health?tab=surveillance", color: "bg-red-500", roles: ["admin", "hie_admin"] },
      { id: "outbreaks", label: "Outbreaks & Incidents", description: "Outbreak management & response", icon: AlertTriangle, path: "/public-health?tab=outbreaks", color: "bg-red-600", roles: ["admin", "hie_admin", "doctor"] },
      { id: "campaigns", label: "Campaigns & Outreach", description: "Immunization, NTD, vector control", icon: Megaphone, path: "/public-health?tab=campaigns", color: "bg-green-600" },
      { id: "inspections", label: "Inspections", description: "Site inspection scheduling & findings", icon: ClipboardCheck, path: "/public-health?tab=inspections", color: "bg-blue-600" },
      // Oversight & Analytics
      { id: "above-site", label: "Above-Site Dashboard", description: "District, provincial & national oversight", icon: TrendingUp, path: "/above-site", color: "bg-rose-600", roles: ["admin", "hie_admin"] },
      { id: "reports", label: "Reports & Analytics", description: "Dashboards & insights", icon: BarChart3, path: "/reports", color: "bg-violet-500" },
      // AI & Intelligence
      { id: "ai-governance", label: "AI Governance Hub", description: "Model registry, drift monitoring, overrides", icon: BarChart3, path: "/ai-governance", color: "bg-cyan-600", roles: ["admin", "hie_admin"] },
      { id: "ai-insights", label: "AI Insight Panels", description: "Summarization, anomaly detection, trends", icon: TrendingUp, path: "/ai-governance?tab=insights", color: "bg-blue-600" },
    ],
  },
  // ─── 5. PLATFORM & REGISTRIES ───
  {
    id: "platform-registries",
    title: "Platform & Registries",
    description: "Sovereign registries, identity services, omnichannel, and system governance",
    roles: ['admin', 'hie_admin', 'registrar', 'doctor', 'specialist'],
    modules: [
      // Sovereign Registries
      { id: "patients-registry", label: "Client Registry (VITO)", description: "Master patient index, CRID/CPID mapping", icon: Users, path: "/client-registry", color: "bg-blue-500", roles: ["admin", "hie_admin", "registrar"] },
      { id: "providers", label: "Provider Registry (VARAPI)", description: "Practitioner identity & privileges", icon: Stethoscope, path: "/hpr", color: "bg-teal-500", roles: ["admin", "hie_admin"] },
      { id: "facilities", label: "Facility Registry (TUSO)", description: "Health service-delivery facilities", icon: Building2, path: "/facility-registry", color: "bg-purple-500", roles: ["admin", "hie_admin"] },
      { id: "indawo", label: "Site & Premises (INDAWO)", description: "Regulated premises & public-health sites", icon: MapPin, path: "/admin/indawo", color: "bg-emerald-600", roles: ["admin", "hie_admin"] },
      { id: "terminology", label: "Terminology (ZIBO)", description: "ICD-11, SNOMED-CT, LOINC governance", icon: BookOpen, path: "/admin/zibo", color: "bg-amber-500", roles: ["admin", "hie_admin"] },
      { id: "shr", label: "Shared Health Record (BUTANO)", description: "FHIR longitudinal clinical memory", icon: FileHeart, path: "/admin/butano/timeline", color: "bg-rose-500", roles: ["admin", "hie_admin"] },
      { id: "ubomi", label: "CRVS Interface (UBOMI)", description: "Birth/death linkage & reconciliation", icon: Heart, path: "/admin/ubomi", color: "bg-pink-500", roles: ["admin", "hie_admin"] },
      { id: "msika", label: "Product & Tariff (MSIKA)", description: "Orderables, billables, benefit catalogs", icon: Package, path: "/admin/msika-core", color: "bg-green-500", roles: ["admin", "hie_admin"] },
      
      { id: "tshepo", label: "Trust Layer (TSHEPO)", description: "IAM, PDP, consent, audit, offline trust", icon: Shield, path: "/admin/tshepo/consents", color: "bg-slate-700", roles: ["admin", "hie_admin"] },
      // Identity Services
      { id: "id-services", label: "ID Services Hub", description: "Generate, validate & recover IDs", icon: Shield, path: "/id-services?tab=generate", color: "bg-primary", roles: ["admin", "registrar", "hie_admin"] },
      { id: "phid-generation", label: "Patient PHID", description: "Generate Patient Health IDs", icon: UserCog, path: "/id-services?tab=generate", color: "bg-blue-500", roles: ["admin", "registrar", "receptionist", "hie_admin"] },
      // Omnichannel
      // Governance
      { id: "admin", label: "System Admin", description: "Users, security & settings", icon: Settings, path: "/admin", color: "bg-gray-700", roles: ["admin"] },
      { id: "fhir-viewer", label: "FHIR Resources", description: "HL7 FHIR interoperability viewer", icon: FileCheck, path: "/admin", color: "bg-cyan-500", roles: ["admin", "hie_admin"] },
    ],
  },
  // ─── 6. HELP & SUPPORT ───
  {
    id: "support",
    title: "Help & Support",
    description: "FAQs, user guides, system utilities and documentation",
    modules: [
      { id: "help", label: "Help Desk", description: "FAQs, guides & documentation", icon: HelpCircle, path: "/help", color: "bg-teal-500" },
      { id: "profile", label: "Profile Settings", description: "Your account & preferences", icon: User, path: "/profile", color: "bg-slate-500" },
      { id: "install", label: "Install App", description: "Download PWA for offline use", icon: Download, path: "/install", color: "bg-green-600" },
      { id: "sync", label: "Offline Sync", description: "Conflict resolution & sync status", icon: ArrowRightLeft, path: "/admin", color: "bg-slate-600", roles: ["admin"] },
    ],
  },
];
export default function ModuleHome() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { canAccessModule, isAdmin, loading: rolesLoading } = useUserRoles();
  const { 
    activeContext, 
    hasActiveContext, 
    selectFacility, 
    selectAboveSite, 
    selectCombinedView,
    selectRemote,
    selectSupportMode,
    selectIndependentPractice,
    selectEmergencyWork,
    selectCommunityOutreach,
    switchContext 
  } = useActiveWorkContext();
  
  // Detect if user is a client (patient) vs provider
  const isClient = profile?.role === "client" || profile?.role === "patient";
  
  // Respect landing tab from context resolver, then fall back to role-based default
  const [activeTab, setActiveTab] = useState(() => {
    const landingTab = sessionStorage.getItem("impilo_landing_tab");
    if (landingTab) {
      sessionStorage.removeItem("impilo_landing_tab");
      return landingTab;
    }
    return isClient ? "personal" : "work";
  });
  
  const [moduleSearch, setModuleSearch] = useState("");
  
  // Also try to restore active context from session if set by context resolver
  useEffect(() => {
    const storedCtx = sessionStorage.getItem("impilo_active_context");
    if (storedCtx && !hasActiveContext) {
      try {
        const ctx = JSON.parse(storedCtx);
        if (ctx.type === "facility" && ctx.facilityId) {
          // Find matching facility and auto-select
          selectFacility({
            facility_id: ctx.facilityId,
            facility_name: ctx.facilityName || "Facility",
            facility_type: ctx.facilityType || "Unknown",
            level_of_care: ctx.levelOfCare || "primary",
            context_label: ctx.contextLabel || "Staff",
            is_primary: false,
            is_pic: false,
            is_owner: false,
            can_access: true,
            privileges: [],
          });
          sessionStorage.removeItem("impilo_active_context");
        }
      } catch {}
    }
  }, [hasActiveContext, selectFacility]);
  
  // Update tab when profile loads (for cases where profile loads after initial render)
  useEffect(() => {
    if (profile?.role === "client" || profile?.role === "patient") {
      setActiveTab("personal");
    }
  }, [profile?.role]);

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

  // Context-aware dynamic reordering: categories relevant to current access mode float to top
  const visibleCategories = (() => {
    const filtered = getVisibleCategories(workModuleCategories);
    if (!activeContext?.accessMode) return filtered;
    
    const currentMode = activeContext.accessMode;
    return [...filtered].sort((a, b) => {
      const aRelevant = categoryContextRelevance[a.id]?.includes(currentMode) ? 1 : 0;
      const bRelevant = categoryContextRelevance[b.id]?.includes(currentMode) ? 1 : 0;
      return bRelevant - aRelevant; // Relevant categories first
    });
  })();

  const searchFilteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return [];
    const q = moduleSearch.toLowerCase();
    return visibleCategories.flatMap(cat => cat.modules).filter(
      m => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [moduleSearch, visibleCategories]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Compact Header with Profile Menu */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b flex-shrink-0">
        <div className="w-full px-5">
          <div className="flex items-center justify-between h-16">
            <img src={impiloLogo} alt="Impilo" className="h-9 w-auto" />

            <div className="flex items-center gap-3">
              {/* Active Workspace Indicator */}
              {hasActiveContext && activeContext && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-2 h-9 px-3"
                  onClick={switchContext}
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {activeContext.facilityName || activeContext.contextLabel}
                  </span>
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-muted/50 rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium leading-tight">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground capitalize leading-tight">{profile?.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                        <Badge variant="secondary" className="capitalize text-xs w-fit">
                          {profile?.role || 'User'}
                        </Badge>
                        {profile?.specialty && (
                          <p className="text-xs text-muted-foreground">{profile.specialty}</p>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  {/* Current Workspace in dropdown for mobile */}
                  {hasActiveContext && activeContext && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={switchContext} className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{activeContext.facilityName || activeContext.contextLabel}</p>
                          <p className="text-xs text-muted-foreground">Switch Workplace</p>
                        </div>
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Security & Privacy</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut();
                      toast.success("Signed out successfully");
                      navigate("/auth");
                    }} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fill Screen */}
      <main className="flex-1 flex flex-col overflow-hidden px-5 py-4">
        <div className="flex-1 flex flex-col w-full h-full">
          {/* Welcome Header - Only show when workspace is selected */}
          {hasActiveContext && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome, {getDisplayTitle()}</h2>
                <p className="text-base text-muted-foreground">
                  Working from: {activeContext?.facilityName || activeContext?.contextLabel}
                </p>
              </div>
            </div>
          )}

          {/* Tabs - Fill remaining space */}
          <Tabs value={activeTab} onValueChange={(newTab) => {
            if (newTab !== activeTab && hasActiveContext) {
              // Show brief toast confirming context switch
              const tabLabels: Record<string, string> = { work: 'Work', professional: 'My Professional', personal: 'My Life' };
              toast.info(`Switched to ${tabLabels[newTab] || newTab}`, { duration: 1500 });
            }
            setActiveTab(newTab);
          }} className="flex-1 flex flex-col min-h-0">
            <TabsList className={`grid w-full h-12 p-1 mb-4 ${isClient ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {!isClient && (
                <>
                  <TabsTrigger value="work" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:opacity-50">
                    <Briefcase className="h-4 w-4" />
                    Work
                    {activeTab !== 'work' && <Lock className="h-3 w-3 ml-0.5 opacity-60" />}
                  </TabsTrigger>
                  <TabsTrigger value="professional" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=inactive]:opacity-50">
                    <Stethoscope className="h-4 w-4" />
                    My Professional
                    {activeTab !== 'professional' && <Lock className="h-3 w-3 ml-0.5 opacity-60" />}
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="personal" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=inactive]:opacity-50">
                <Heart className="h-4 w-4" />
                My Life
                {activeTab !== 'personal' && <Lock className="h-3 w-3 ml-0.5 opacity-60" />}
              </TabsTrigger>
            </TabsList>

            {/* My Work Tab */}
            <TabsContent value="work" className="mt-0 flex-1 flex flex-col gap-4 min-h-0 overflow-auto">
              {/* Show Workplace Selection Hub if no context selected */}
              {!hasActiveContext ? (
                <WorkplaceSelectionHub
                  onFacilitySelect={selectFacility}
                  onAboveSiteSelect={selectAboveSite}
                  onCombinedViewSelect={selectCombinedView}
                  onRemoteSelect={selectRemote}
                  onSupportModeSelect={selectSupportMode}
                  onIndependentPracticeSelect={selectIndependentPractice}
                  onEmergencyWorkSelect={selectEmergencyWork}
                  onCommunityOutreachSelect={selectCommunityOutreach}
                />
              ) : (
                /* Show modules when workspace is selected */
                <>
              {/* Workspaces & Communication - Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-shrink-0">
                {/* Workspaces Tile */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-primary" />
                      Workspaces
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {activeContext?.facilityName || "No workspace"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Button className="h-14 flex items-center justify-center gap-2 text-base font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md" onClick={() => navigate("/registration")}>
                      <UserPlus className="h-5 w-5" /> Client Intake
                    </Button>
                    <Button
                      className="h-14 flex items-center justify-center gap-2 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md rounded-xl"
                      onClick={() => navigate("/queue")}
                    >
                      <Users className="h-5 w-5" />
                      Queues & Wards
                    </Button>
                    <Button variant="outline" className="h-14 flex items-center justify-center gap-2 text-base rounded-xl" onClick={() => navigate("/operations")}>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" /> Operations
                    </Button>
                    <Button variant="outline" className="h-14 flex items-center justify-center gap-2 text-base rounded-xl" onClick={() => navigate("/workspace-management")}>
                      <Settings className="h-5 w-5 text-muted-foreground" /> Manage
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-xl font-bold text-foreground">12</p>
                      <p className="text-xs text-muted-foreground">Staff On Shift</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-xl font-bold text-foreground">3</p>
                      <p className="text-xs text-muted-foreground">Stock Alerts</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-xl font-bold text-foreground">87%</p>
                      <p className="text-xs text-muted-foreground">Bed Occupancy</p>
                    </div>
                  </div>
                </div>

                {/* Communication Noticeboard */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      Comms
                    </h3>
                    <HealthDocumentScanner variant="button" className="h-10" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-14 px-5 flex items-center gap-2 text-base rounded-xl" onClick={() => navigate("/communication?tab=messages")}>
                      <MessageSquare className="h-5 w-5 text-primary" /> Messages
                    </Button>
                    <Button variant="outline" className="h-14 px-5 flex items-center gap-2 text-base rounded-xl" onClick={() => navigate("/communication?tab=pages")}>
                      <Bell className="h-5 w-5 text-warning" /> Pages
                    </Button>
                    <Button variant="outline" className="h-14 px-5 flex items-center gap-2 text-base rounded-xl" onClick={() => navigate("/communication?tab=calls")}>
                      <Phone className="h-5 w-5 text-success" /> Calls
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-muted/40">
                      <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full">URGENT</Badge>
                      <span className="truncate text-muted-foreground">ICU handover report due</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-xl bg-muted/40">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">NEW</Badge>
                      <span className="truncate text-muted-foreground">Policy update: PPE protocol</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access - Full Width */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm flex-shrink-0">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-amber-500" />
                  Quick Access
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 group transition-all" onClick={() => navigate("/encounter")}>
                    <FileHeart className="h-6 w-6 text-red-600 group-hover:text-white shrink-0" />
                    <span>EHR</span>
                  </Button>
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary group transition-all" onClick={() => navigate("/dashboard")}>
                    <ClipboardList className="h-6 w-6 text-primary group-hover:text-primary-foreground shrink-0" />
                    <span>Dashboard</span>
                  </Button>
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 group transition-all" onClick={() => navigate("/pharmacy")}>
                    <Pill className="h-6 w-6 text-emerald-600 group-hover:text-white shrink-0" />
                    <span>Prescribe</span>
                  </Button>
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-purple-500 hover:text-white hover:border-purple-500 group transition-all" onClick={() => navigate("/lab")}>
                    <TestTube2 className="h-6 w-6 text-purple-500 group-hover:text-white shrink-0" />
                    <span>Lab</span>
                  </Button>
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 group transition-all" onClick={() => navigate("/radiology")}>
                    <Scan className="h-6 w-6 text-rose-500 group-hover:text-white shrink-0" />
                    <span>Radiology</span>
                  </Button>
                  <Button variant="outline" className="h-[4.5rem] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 group transition-all" onClick={() => navigate("/scheduling")}>
                    <Calendar className="h-6 w-6 text-orange-500 group-hover:text-white shrink-0" />
                    <span>Bookings</span>
                  </Button>
                </div>
              </div>

              {/* Module Search + Categories */}
              <section className="flex-1 min-h-0 flex flex-col gap-4">
                {/* Module Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search all modules..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-2xl border bg-card text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                  />
                </div>

                {/* Filtered results or category grid */}
                {moduleSearch.trim() ? (
                  <div className="overflow-auto flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchFilteredModules.map((module) => (
                        <Card
                          key={module.id}
                          className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group rounded-2xl"
                          onClick={() => handleModuleClick(module.path)}
                        >
                          <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
                            <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm", module.color)}>
                              <module.icon className="h-7 w-7 text-white" />
                            </div>
                            <div className="min-w-0 w-full">
                              <p className="text-base font-semibold truncate">{module.label}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {searchFilteredModules.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-base">No modules match "{moduleSearch}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto flex-1">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ gridAutoRows: '1fr' }}>
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
                  </div>
                )}
              </section>
              </>
              )}
            </TabsContent>

            {/* My Professional Tab */}
            <TabsContent value="professional" className="mt-0 overflow-auto">
              <MyProfessionalHub 
                onStartShift={selectFacility} 
                onSwitchToWork={() => setActiveTab('work')}
              />
            </TabsContent>

            {/* Personal Hub Tab (Health + Social unified) */}
            <TabsContent value="personal" className="mt-0 overflow-auto">
              <PersonalHub />
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
