import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Home,
  FlaskConical,
  Receipt,
  ClipboardList,
  HelpCircle,
  CalendarDays,
  Megaphone,
  LayoutGrid,
  Fingerprint,
  MessageSquare,
  Database,
  Shield,
  GitMerge,
  FileCheck,
  BookOpen,
  Network,
  Globe,
  UserCheck,
  Heart,
  Store,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { useWorkspace, PageContext } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import impiloLogo from "@/assets/impilo-logo.png";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description?: string;
  roles?: string[]; // Which roles can see this item
}

// Map routes to page contexts
function getPageContextFromPath(pathname: string): PageContext {
  // Registry pages
  if (pathname.startsWith('/facility-registry') || 
      pathname.startsWith('/hpr') || 
      pathname.startsWith('/client-registry') ||
      pathname.startsWith('/registry')) {
    return "registry";
  }
  // Clinical pages
  if (pathname.startsWith('/encounter') || 
      pathname.startsWith('/beds') || 
      pathname.startsWith('/queue') ||
      pathname.startsWith('/patients')) {
    return "clinical";
  }
  // Operations pages
  if (pathname.startsWith('/stock') || 
      pathname.startsWith('/consumables') ||
      pathname.startsWith('/charges') ||
      pathname.startsWith('/payments')) {
    return "operations";
  }
  // Scheduling pages
  if (pathname.startsWith('/scheduling') || 
      pathname.startsWith('/appointments') ||
      pathname.startsWith('/theatre')) {
    return "scheduling";
  }
  // Admin pages
  if (pathname.startsWith('/admin')) {
    return "admin";
  }
  // Portal pages
  if (pathname.startsWith('/portal') || 
      pathname.startsWith('/social')) {
    return "portal";
  }
  return "home";
}

// Registry-specific navigation
const registryNavItems: NavItem[] = [
  { label: "Back to Home", icon: Home, path: "/", description: "Return to dashboard" },
  { label: "Client Registry", icon: Users, path: "/client-registry", description: "National Health ID Registry" },
  { label: "Provider Registry", icon: UserCheck, path: "/hpr", description: "Health Provider Registry" },
  { label: "Facility Registry", icon: Building2, path: "/facility-registry", description: "Master Facility List" },
];

const registryToolsItems: NavItem[] = [
  { label: "Data Reconciliation", icon: GitMerge, path: "/facility-registry?tab=reconciliation", description: "Merge & deduplicate" },
  { label: "Change Requests", icon: FileCheck, path: "/facility-registry?tab=changes", description: "Pending approvals" },
  { label: "Reference Data", icon: BookOpen, path: "/facility-registry?tab=reference", description: "Lookup tables" },
  { label: "Reports", icon: BarChart3, path: "/facility-registry?tab=reports", description: "Registry analytics" },
];

const registryAdminItems: NavItem[] = [
  { label: "Access Control", icon: Shield, path: "/admin", description: "Permissions & roles" },
  { label: "API & Integrations", icon: Network, path: "/admin?tab=integrations", description: "External systems" },
  { label: "Audit Log", icon: FileText, path: "/admin?tab=audit", description: "Activity history" },
];

// Clinical navigation
const clinicalPriorityItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Overview & worklist" },
  { label: "My Worklist", icon: ClipboardList, path: "/queue", description: "Your assigned work" },
  { label: "Communication", icon: MessageSquare, path: "/communication", description: "Messages & pages" },
];

const clinicalNavItems: NavItem[] = [
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters" },
  { label: "Bed Management", icon: Bed, path: "/beds", description: "Ward & bed status" },
  { label: "Appointments", icon: Calendar, path: "/appointments", description: "Scheduling" },
  { label: "Patients", icon: Users, path: "/patients", description: "Patient registry" },
];

const ordersNavItems: NavItem[] = [
  { label: "Order Entry", icon: ShoppingCart, path: "/orders", description: "Clinical orders" },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy", description: "Medication dispensing" },
  { label: "Laboratory", icon: FlaskConical, path: "/lims", description: "Lab results" },
  { label: "PACS Imaging", icon: FileText, path: "/pacs", description: "Medical imaging" },
  { label: "Shift Handoff", icon: ArrowRightLeft, path: "/handoff", description: "Handoff reports" },
];

// Operations navigation
const operationsNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Return to home" },
  { label: "Stock Management", icon: Package, path: "/stock", description: "Inventory" },
  { label: "Consumables", icon: Syringe, path: "/consumables", description: "Usage tracking" },
  { label: "Charges", icon: Receipt, path: "/charges", description: "Encounter charges" },
  { label: "Payments", icon: DollarSign, path: "/payments", description: "Billing & payments" },
  { label: "Theatre", icon: Building2, path: "/theatre", description: "Surgical scheduling" },
];

// Scheduling navigation
const schedulingNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Return to home" },
  { label: "Appointments", icon: CalendarDays, path: "/scheduling", description: "Clinic scheduling" },
  { label: "Theatre Booking", icon: Building2, path: "/scheduling/theatre", description: "OR scheduling" },
  { label: "Noticeboard", icon: Megaphone, path: "/scheduling/noticeboard", description: "Announcements" },
  { label: "Resources", icon: LayoutGrid, path: "/scheduling/resources", description: "Room & equipment" },
];

// Portal navigation
const portalNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Return to home" },
  { label: "My Health", icon: Heart, path: "/portal", description: "Personal health portal" },
  { label: "Social Hub", icon: Users, path: "/social", description: "Communities & timeline" },
  { label: "Marketplace", icon: Store, path: "/marketplace", description: "Health marketplace" },
  { label: "Communication", icon: MessageSquare, path: "/communication", description: "Messages" },
];

// Admin navigation
const adminNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Return to home" },
  { label: "System Settings", icon: Settings, path: "/admin", description: "Configuration" },
  { label: "User Management", icon: Users, path: "/admin?tab=users", description: "Users & roles" },
  { label: "Security", icon: Shield, path: "/admin?tab=security", description: "Access control" },
  { label: "Audit Logs", icon: FileText, path: "/admin?tab=audit", description: "Activity history" },
  { label: "Integrations", icon: Network, path: "/admin?tab=integrations", description: "External systems" },
];

// Home/general navigation
const homePriorityItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Overview & worklist" },
  { label: "My Worklist", icon: ClipboardList, path: "/queue", description: "Your assigned work" },
  { label: "Communication", icon: MessageSquare, path: "/communication", description: "Messages, pages & calls" },
  { label: "Social Hub", icon: Users, path: "/social", description: "Timeline & communities" },
];

const homeQuickAccessItems: NavItem[] = [
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters" },
  { label: "Appointments", icon: Calendar, path: "/appointments", description: "Scheduling" },
  { label: "Patients", icon: Users, path: "/patients", description: "Patient registry" },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy", description: "Medications" },
];

const homeSystemItems: NavItem[] = [
  { label: "ID Services", icon: Fingerprint, path: "/id-services", description: "ID Generation" },
  { label: "Reports", icon: BarChart3, path: "/reports", description: "Analytics" },
  { label: "Help Desk", icon: HelpCircle, path: "/help", description: "Support" },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  userRole?: string;
}

function NavSection({ title, items, collapsed, userRole }: NavSectionProps) {
  const location = useLocation();

  // Filter items by role
  const visibleItems = items.filter((item) => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-3 md:mb-4">
      {!collapsed && (
        <h3 className="px-3 mb-1.5 md:mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-0.5 md:space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]));
          
          const linkContent = (
            <NavLink
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "active:bg-sidebar-accent/80",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 md:h-4 md:w-4 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentView, setCurrentView, pageContext, setPageContext } = useWorkspace();
  const { profile } = useAuth();
  const userRole = profile?.role || "nurse";

  // Update page context based on current route
  useEffect(() => {
    const newContext = getPageContextFromPath(location.pathname);
    if (newContext !== pageContext) {
      setPageContext(newContext);
    }
  }, [location.pathname, pageContext, setPageContext]);

  // Render context-specific navigation
  const renderNavigation = () => {
    switch (pageContext) {
      case "registry":
        return (
          <>
            <NavSection title="Registry" items={registryNavItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Tools" items={registryToolsItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Administration" items={registryAdminItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "clinical":
        return (
          <>
            <NavSection title="Quick Access" items={clinicalPriorityItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Clinical" items={clinicalNavItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Orders & Results" items={ordersNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "operations":
        return (
          <>
            <NavSection title="Operations" items={operationsNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "scheduling":
        return (
          <>
            <NavSection title="Scheduling" items={schedulingNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "portal":
        return (
          <>
            <NavSection title="Portal" items={portalNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "admin":
        return (
          <>
            <NavSection title="Administration" items={adminNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      
      case "home":
      default:
        return (
          <>
            <NavSection title="Quick Access" items={homePriorityItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Clinical" items={homeQuickAccessItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="System" items={homeSystemItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
    }
  };

  // Only show workspace selector for clinical contexts
  const showWorkspaceSelector = pageContext === "clinical" || pageContext === "home";

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56 md:w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 md:h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={impiloLogo} alt="Impilo" className="h-7 md:h-8 w-auto" />
          </div>
        )}
        {collapsed && (
          <img src={impiloLogo} alt="Impilo" className="h-6 w-auto mx-auto" />
        )}
      </div>

      {/* Workspace Selector - only for clinical/home contexts */}
      {showWorkspaceSelector && (
        <WorkspaceSelector
          currentView={currentView}
          onViewChange={setCurrentView}
          collapsed={collapsed}
        />
      )}

      {/* Context indicator for non-home pages */}
      {!showWorkspaceSelector && !collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            {pageContext === "registry" && "Registry Management"}
            {pageContext === "operations" && "Operations"}
            {pageContext === "scheduling" && "Scheduling"}
            {pageContext === "portal" && "Health Portal"}
            {pageContext === "admin" && "Administration"}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3 md:py-4 px-2">
        {renderNavigation()}
      </ScrollArea>

      {/* Collapse Toggle - Touch-friendly */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center min-h-[44px] text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
