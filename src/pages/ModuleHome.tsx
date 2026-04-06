import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRoles, ModuleAccessRole } from "@/hooks/useUserRoles";
import { useModuleAvailability } from "@/hooks/useFacilityCapabilities";
import { useActiveWorkContext } from "@/hooks/useActiveWorkContext";
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
  "public-health": Activity,
  "coverage": Shield,
  "ai-intelligence": BarChart3,
  "kernel": Database,
  "experience": Radio,
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
  "public-health": "bg-amber-600",
  "coverage": "bg-violet-600",
  "ai-intelligence": "bg-cyan-600",
  "kernel": "bg-slate-700",
  "experience": "bg-teal-600",
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
      { id: "queue", label: "Queues & Wards", description: "Patient flow: intake, triage, queues & ward management", icon: Users, path: "/queue", color: "bg-orange-500", prominent: true },
      { id: "ehr", label: "Patient Encounters", description: "Clinical documentation & care", icon: Stethoscope, path: "/encounter", color: "bg-blue-500", roles: ["doctor", "nurse", "specialist", "admin"] },
      { id: "beds", label: "Bed Management", description: "Ward status & admissions", icon: Bed, path: "/beds", color: "bg-purple-500", roles: ["doctor", "nurse", "admin"], capabilities: ["inpatient"] },
      { id: "discharge", label: "Discharge & Exit", description: "Discharges, deaths & exits", icon: DoorOpen, path: "/discharge", color: "bg-amber-600", roles: ["doctor", "nurse", "admin"] },
      { id: "control-tower", label: "Control Tower", description: "Real-time facility operations", icon: Gauge, path: "/operations?tab=control-tower", color: "bg-rose-600", roles: ["admin", "nurse", "doctor"] },
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
      { id: "pacs", label: "Imaging (PACS)", description: "Radiology & diagnostic imaging", icon: FileText, path: "/pacs", color: "bg-indigo-500", roles: ["radiographer", "doctor", "specialist", "admin"], capabilities: ["pacs", "radiology"] },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling & Registration",
    description: "Appointments, patient registration, and theatre",
    modules: [
      { id: "queue-intake", label: "Patient Intake & Sorting", description: "Arrival, triage & queue assignment", icon: ClipboardCheck, path: "/queue", color: "bg-orange-500" },
      { id: "appointments", label: "Appointments", description: "Clinic & provider scheduling", icon: Calendar, path: "/appointments", color: "bg-cyan-500" },
      { id: "scheduling", label: "Appointment Scheduling", description: "Advanced scheduling tools", icon: Calendar, path: "/scheduling", color: "bg-blue-500", roles: ["admin", "receptionist", "doctor", "nurse"] },
      { id: "noticeboard", label: "Provider Noticeboard", description: "Announcements & scheduling updates", icon: Megaphone, path: "/scheduling/noticeboard", color: "bg-amber-500" },
      { id: "resources", label: "Resource Calendar", description: "Rooms, equipment & assets", icon: LayoutGrid, path: "/scheduling/resources", color: "bg-indigo-500", roles: ["admin", "receptionist"] },
      { id: "registration", label: "Patient Registration", description: "New patient intake & ID", icon: UserPlus, path: "/registration", color: "bg-emerald-500" },
      { id: "patients", label: "Patient Registry", description: "Search & manage patients", icon: Users, path: "/patients", color: "bg-slate-500" },
      { id: "theatre", label: "Theatre Booking", description: "Surgical scheduling", icon: Building2, path: "/theatre", color: "bg-rose-500", roles: ["doctor", "specialist", "nurse", "admin"], capabilities: ["theatre"] },
      { id: "theatre-scheduling", label: "Theatre Scheduling", description: "Surgical suite calendar", icon: Calendar, path: "/scheduling/theatre", color: "bg-pink-500", roles: ["doctor", "specialist", "admin"], capabilities: ["theatre"] },
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
    title: "Kernel & Sovereign Registries",
    description: "Ring 0 shared sovereign services — TSHEPO, VITO, VARAPI, TUSO, INDAWO, MSIKA, ZIBO, BUTANO, UBOMI, MUSHEX",
    roles: ['admin', 'hie_admin', 'doctor', 'specialist'],
    modules: [
      { id: "patients-registry", label: "Client Registry (VITO)", description: "Master patient index, CRID/CPID mapping", icon: Users, path: "/client-registry", color: "bg-blue-500", roles: ["admin", "hie_admin", "registrar"] },
      { id: "providers", label: "Provider Registry (VARAPI)", description: "Practitioner identity & privileges", icon: Stethoscope, path: "/hpr", color: "bg-teal-500", roles: ["admin", "hie_admin"] },
      { id: "facilities", label: "Facility Registry (TUSO)", description: "Health service-delivery facilities", icon: Building2, path: "/facility-registry", color: "bg-purple-500", roles: ["admin", "hie_admin"] },
      { id: "indawo", label: "Site & Premises (INDAWO)", description: "Regulated premises & public-health sites", icon: MapPin, path: "/admin/indawo", color: "bg-emerald-600", roles: ["admin", "hie_admin"] },
      { id: "terminology", label: "Terminology (ZIBO)", description: "ICD-11, SNOMED-CT, LOINC governance", icon: BookOpen, path: "/admin/zibo", color: "bg-amber-500", roles: ["admin", "hie_admin"] },
      { id: "shr", label: "Shared Health Record (BUTANO)", description: "FHIR longitudinal clinical memory", icon: FileHeart, path: "/admin/butano/timeline", color: "bg-rose-500", roles: ["admin", "hie_admin"] },
      { id: "ubomi", label: "CRVS Interface (UBOMI)", description: "Birth/death linkage & reconciliation", icon: Heart, path: "/admin/ubomi", color: "bg-pink-500", roles: ["admin", "hie_admin"] },
      { id: "msika", label: "Product & Tariff (MSIKA)", description: "Orderables, billables, benefit catalogs", icon: Package, path: "/admin/msika-core", color: "bg-green-500", roles: ["admin", "hie_admin"] },
      { id: "mushex", label: "Finance Engine (MUSHEX)", description: "Claims switch, settlement rail", icon: DollarSign, path: "/admin/mushex", color: "bg-indigo-500", roles: ["admin", "hie_admin"] },
      { id: "tshepo", label: "Trust Layer (TSHEPO)", description: "IAM, PDP, consent, audit, offline trust", icon: Shield, path: "/admin/tshepo/consents", color: "bg-slate-700", roles: ["admin", "hie_admin"] },
      { id: "product-registry", label: "Product Registry", description: "Health products catalogue", icon: Package, path: "/admin/product-registry", color: "bg-green-500", roles: ["admin"] },
      { id: "fhir-viewer", label: "FHIR Resources", description: "HL7 FHIR interoperability viewer", icon: FileCheck, path: "/admin", color: "bg-cyan-500", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "public-health",
    title: "Public Health & Local Authority",
    description: "Surveillance, outbreaks, inspections, campaigns, complaints — configured per jurisdiction pack",
    roles: ['admin', 'hie_admin', 'doctor', 'nurse'],
    modules: [
      { id: "ph-ops", label: "Public Health Operations", description: "Full public-health operations hub", icon: Activity, path: "/public-health", color: "bg-amber-600" },
      { id: "surveillance", label: "Surveillance / eIDSR", description: "Disease surveillance & alerts", icon: Target, path: "/public-health?tab=surveillance", color: "bg-red-500", roles: ["admin", "hie_admin"] },
      { id: "outbreaks", label: "Outbreaks & Incidents", description: "Outbreak management & response", icon: AlertTriangle, path: "/public-health?tab=outbreaks", color: "bg-red-600", roles: ["admin", "hie_admin", "doctor"] },
      { id: "inspections", label: "Inspections", description: "Site inspection scheduling & findings", icon: ClipboardCheck, path: "/public-health?tab=inspections", color: "bg-blue-600" },
      { id: "campaigns", label: "Campaigns & Outreach", description: "Immunization, NTD, vector control", icon: Megaphone, path: "/public-health?tab=campaigns", color: "bg-green-600" },
      { id: "indawo-sites", label: "INDAWO Sites", description: "Regulated premises registry", icon: MapPin, path: "/admin/indawo", color: "bg-emerald-500", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "coverage",
    title: "Coverage, Financing & Payer",
    description: "Schemes, membership, eligibility, claims, settlement — native platform capability",
    roles: ['admin', 'hie_admin', 'receptionist'],
    modules: [
      { id: "coverage-ops", label: "Coverage Operations", description: "Full payer operations hub", icon: Shield, path: "/coverage", color: "bg-violet-600" },
      { id: "eligibility", label: "Eligibility & Entitlement", description: "Real-time eligibility checks (F1)", icon: UserCheck, path: "/coverage?tab=eligibility", color: "bg-green-600" },
      { id: "claims", label: "Claims & Adjudication", description: "Electronic claims lifecycle", icon: FileText, path: "/coverage?tab=claims", color: "bg-purple-600" },
      { id: "settlement", label: "Settlement & Remittance", description: "13-state settlement lifecycle", icon: DollarSign, path: "/coverage?tab=settlement", color: "bg-emerald-600" },
      { id: "schemes", label: "Schemes & Products", description: "Plan administration & benefit rules", icon: Briefcase, path: "/coverage?tab=schemes", color: "bg-blue-600", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "ai-intelligence",
    title: "Intelligence, Automation & AI",
    description: "Governed AI insights, model registry, inference records — I1/I2/I3 classification",
    roles: ['admin', 'hie_admin', 'doctor', 'specialist'],
    modules: [
      { id: "ai-governance", label: "AI Governance Hub", description: "Model registry, drift monitoring, overrides", icon: BarChart3, path: "/ai-governance", color: "bg-cyan-600" },
      { id: "ai-insights", label: "AI Insight Panels", description: "Summarization, anomaly detection, trends", icon: TrendingUp, path: "/ai-governance?tab=insights", color: "bg-blue-600" },
      { id: "ai-models", label: "Model Registry", description: "Approved models, versions, audit", icon: Settings, path: "/ai-governance?tab=models", color: "bg-purple-600", roles: ["admin", "hie_admin"] },
    ],
  },
  {
    id: "experience",
    title: "Experience, Omnichannel & Access",
    description: "SMS, USSD, IVR, WhatsApp, call-centre, community-worker, and facility-desk access — no citizen left behind",
    modules: [
      { id: "omnichannel-hub", label: "Omnichannel Hub", description: "All access channels in one view", icon: Radio, path: "/omnichannel", color: "bg-teal-600" },
      { id: "sms-journeys", label: "SMS Journeys", description: "Text-based health interactions", icon: MessageSquare, path: "/omnichannel?tab=sms", color: "bg-amber-500" },
      { id: "ussd-menus", label: "USSD Menus", description: "Feature-phone access — no data needed", icon: Phone, path: "/omnichannel?tab=ussd", color: "bg-amber-600" },
      { id: "ivr-voice", label: "IVR / Voice", description: "Voice-guided access & callbacks", icon: PhoneCall, path: "/omnichannel?tab=ivr", color: "bg-purple-500" },
      { id: "callbacks", label: "Callbacks & Escalation", description: "Human handoff & callback queue", icon: Headphones, path: "/omnichannel?tab=callbacks", color: "bg-rose-500" },
      { id: "disclosure-rules", label: "Trust & Disclosure Rules", description: "Channel-aware data disclosure config", icon: Shield, path: "/omnichannel?tab=disclosure", color: "bg-indigo-600", roles: ["admin", "hie_admin"] },
      { id: "ai-agent", label: "AI Interaction Agent", description: "Governed AI across channels", icon: Bot, path: "/omnichannel?tab=ai-agent", color: "bg-cyan-600" },
    ],
  },
  {
    id: "admin",
    title: "Governance & Configuration",
    description: "System settings, audit, jurisdiction packs, and platform administration",
    roles: ['admin', 'doctor', 'specialist', 'hie_admin'],
    modules: [
      { id: "above-site", label: "Above-Site Dashboard", description: "District, provincial & national oversight", icon: TrendingUp, path: "/above-site", color: "bg-rose-600", roles: ["admin", "hie_admin"] },
      { id: "landela", label: "Landela DMS", description: "Document management & scanning", icon: ScanLine, path: "/landela", color: "bg-cyan-600" },
      { id: "reports", label: "Reports & Analytics", description: "Dashboards & insights", icon: BarChart3, path: "/reports", color: "bg-violet-500" },
      { id: "registry-management", label: "Registry Management", description: "Manage HIE registries", icon: Database, path: "/registry-management", color: "bg-purple-600", roles: ["admin", "hie_admin"] },
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
    description: "FAQs, user guides, system utilities and documentation",
    // No restriction - always visible
    modules: [
      { id: "help", label: "Help Desk", description: "FAQs, guides & documentation", icon: HelpCircle, path: "/help", color: "bg-teal-500" },
      { id: "profile", label: "Profile Settings", description: "Your account & preferences", icon: User, path: "/profile", color: "bg-slate-500" },
      { id: "kiosk", label: "Patient Kiosk", description: "Self-service check-in terminal", icon: Monitor, path: "/kiosk", color: "bg-blue-600" },
      { id: "install", label: "Install App", description: "Download PWA for offline use", icon: Download, path: "/install", color: "bg-green-600" },
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
  
  // Default to personal tab for clients, work tab for providers
  const [activeTab, setActiveTab] = useState(isClient ? "personal" : "work");
  
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

  const visibleCategories = getVisibleCategories(workModuleCategories);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Compact Header with Profile Menu */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center justify-between h-14">
            <img src={impiloLogo} alt="Impilo" className="h-8 w-auto" />

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
      <main className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full h-full">
          {/* Welcome Header - Only show when workspace is selected */}
          {hasActiveContext && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Welcome, {getDisplayTitle()}</h2>
                <p className="text-sm text-muted-foreground">
                  Working from: {activeContext?.facilityName || activeContext?.contextLabel}
                </p>
              </div>
            </div>
          )}

          {/* Tabs - Fill remaining space */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className={`grid w-full h-10 p-1 mb-4 ${isClient ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {!isClient && (
                <>
                  <TabsTrigger value="work" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Briefcase className="h-4 w-4" />
                    Work
                  </TabsTrigger>
                  <TabsTrigger value="professional" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    <Stethoscope className="h-4 w-4" />
                    My Professional
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="personal" className="flex items-center justify-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <Heart className="h-4 w-4" />
                My Life
              </TabsTrigger>
            </TabsList>

            {/* My Work Tab */}
            <TabsContent value="work" className="mt-0 flex-1 flex flex-col gap-3 min-h-0">
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
              {/* Communication and Quick Access - Stacked vertically */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                {/* Communication Noticeboard */}
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Communication Noticeboard
                    </h3>
                    <HealthDocumentScanner variant="button" className="h-10" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=messages")}
                    >
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Messages
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=pages")}
                    >
                      <Bell className="h-5 w-5 text-warning" />
                      Pages
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base"
                      onClick={() => navigate("/communication?tab=calls")}
                    >
                      <Phone className="h-5 w-5 text-success" />
                      Calls
                    </Button>
                  </div>
                </div>
                
                {/* Quick Access */}
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Quick Access
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-red-600 hover:text-white group"
                      onClick={() => navigate("/encounter")}
                    >
                      <FileHeart className="h-5 w-5 text-red-600 group-hover:text-white" />
                      EHR
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-primary hover:text-primary-foreground group"
                      onClick={() => navigate("/dashboard")}
                    >
                      <ClipboardList className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-blue-500 hover:text-white group"
                      onClick={() => navigate("/queue")}
                    >
                      <Users className="h-5 w-5 text-blue-500 group-hover:text-white" />
                      Queues & Wards
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-emerald-600 hover:text-white group"
                      onClick={() => navigate("/pharmacy")}
                    >
                      <Pill className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                      Prescribe
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-green-500 hover:text-white group"
                      onClick={() => navigate("/registration")}
                    >
                      <UserPlus className="h-5 w-5 text-green-500 group-hover:text-white" />
                      Register
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-purple-500 hover:text-white group"
                      onClick={() => navigate("/lab")}
                    >
                      <TestTube2 className="h-5 w-5 text-purple-500 group-hover:text-white" />
                      Lab
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-rose-500 hover:text-white group"
                      onClick={() => navigate("/radiology")}
                    >
                      <Scan className="h-5 w-5 text-rose-500 group-hover:text-white" />
                      Radiology
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5 flex items-center gap-2 text-base hover:bg-orange-500 hover:text-white group"
                      onClick={() => navigate("/appointments")}
                    >
                      <Calendar className="h-5 w-5 text-orange-500 group-hover:text-white" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>

              {/* Module Categories - Larger cards, 3-4 per row */}
              <section className="flex-1 min-h-0 overflow-auto">
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 h-full" style={{ gridAutoRows: '1fr' }}>
                  {/* Practice/Facility Management as first card */}
                  <ExpandableCategoryCard
                    id="my-practice"
                    title="Practice Management"
                    description="Manage your practice or facility"
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
