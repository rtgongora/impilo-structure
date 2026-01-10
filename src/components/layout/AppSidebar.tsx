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
  Shield,
  GitMerge,
  FileCheck,
  BookOpen,
  Network,
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
  roles?: string[];
}

function getPageContextFromPath(pathname: string): PageContext {
  if (pathname.startsWith('/facility-registry') || 
      pathname.startsWith('/hpr') || 
      pathname.startsWith('/client-registry') ||
      pathname.startsWith('/registry')) {
    return "registry";
  }
  if (pathname.startsWith('/encounter') || 
      pathname.startsWith('/beds') || 
      pathname.startsWith('/queue') ||
      pathname.startsWith('/patients')) {
    return "clinical";
  }
  if (pathname.startsWith('/stock') || 
      pathname.startsWith('/consumables') ||
      pathname.startsWith('/charges') ||
      pathname.startsWith('/payments')) {
    return "operations";
  }
  if (pathname.startsWith('/scheduling') || 
      pathname.startsWith('/appointments') ||
      pathname.startsWith('/theatre')) {
    return "scheduling";
  }
  if (pathname.startsWith('/admin')) {
    return "admin";
  }
  if (pathname.startsWith('/portal') || 
      pathname.startsWith('/social')) {
    return "portal";
  }
  return "home";
}

const registryNavItems: NavItem[] = [
  { label: "Back to Home", icon: Home, path: "/", description: "Return to dashboard" },
  { label: "Client Registry", icon: Users, path: "/client-registry", description: "National Health ID Registry" },
  { label: "Provider Registry", icon: UserCheck, path: "/hpr", description: "Health Provider Registry" },
  { label: "Facility Registry", icon: Building2, path: "/facility-registry", description: "Master Facility List" },
];

const registryToolsItems: NavItem[] = [
  { label: "Data Reconciliation", icon: GitMerge, path: "/facility-registry?tab=reconciliation" },
  { label: "Change Requests", icon: FileCheck, path: "/facility-registry?tab=changes" },
  { label: "Reference Data", icon: BookOpen, path: "/facility-registry?tab=reference" },
  { label: "Reports", icon: BarChart3, path: "/facility-registry?tab=reports" },
];

const registryAdminItems: NavItem[] = [
  { label: "Access Control", icon: Shield, path: "/admin" },
  { label: "API & Integrations", icon: Network, path: "/admin?tab=integrations" },
  { label: "Audit Log", icon: FileText, path: "/admin?tab=audit" },
];

const clinicalPriorityItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "My Worklist", icon: ClipboardList, path: "/queue" },
  { label: "Communication", icon: MessageSquare, path: "/communication" },
];

const clinicalNavItems: NavItem[] = [
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter" },
  { label: "Bed Management", icon: Bed, path: "/beds" },
  { label: "Appointments", icon: Calendar, path: "/appointments" },
  { label: "Patients", icon: Users, path: "/patients" },
];

const ordersNavItems: NavItem[] = [
  { label: "Order Entry", icon: ShoppingCart, path: "/orders" },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy" },
  { label: "Laboratory", icon: FlaskConical, path: "/lims" },
  { label: "PACS Imaging", icon: FileText, path: "/pacs" },
  { label: "Shift Handoff", icon: ArrowRightLeft, path: "/handoff" },
];

const operationsNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "Stock Management", icon: Package, path: "/stock" },
  { label: "Consumables", icon: Syringe, path: "/consumables" },
  { label: "Charges", icon: Receipt, path: "/charges" },
  { label: "Payments", icon: DollarSign, path: "/payments" },
  { label: "Theatre", icon: Building2, path: "/theatre" },
];

const schedulingNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "Appointments", icon: CalendarDays, path: "/scheduling" },
  { label: "Theatre Booking", icon: Building2, path: "/scheduling/theatre" },
  { label: "Noticeboard", icon: Megaphone, path: "/scheduling/noticeboard" },
  { label: "Resources", icon: LayoutGrid, path: "/scheduling/resources" },
];

const portalNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "My Health", icon: Heart, path: "/portal" },
  { label: "Social Hub", icon: Users, path: "/social" },
  { label: "Marketplace", icon: Store, path: "/marketplace" },
  { label: "Communication", icon: MessageSquare, path: "/communication" },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "System Settings", icon: Settings, path: "/admin" },
  { label: "User Management", icon: Users, path: "/admin?tab=users" },
  { label: "Security", icon: Shield, path: "/admin?tab=security" },
  { label: "Audit Logs", icon: FileText, path: "/admin?tab=audit" },
  { label: "Integrations", icon: Network, path: "/admin?tab=integrations" },
];

const homePriorityItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "My Worklist", icon: ClipboardList, path: "/queue" },
  { label: "Communication", icon: MessageSquare, path: "/communication" },
  { label: "Social Hub", icon: Users, path: "/social" },
];

const homeQuickAccessItems: NavItem[] = [
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter" },
  { label: "Appointments", icon: Calendar, path: "/appointments" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy" },
];

const homeSystemItems: NavItem[] = [
  { label: "ID Services", icon: Fingerprint, path: "/id-services" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Help Desk", icon: HelpCircle, path: "/help" },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  userRole?: string;
}

function NavSection({ title, items, collapsed, userRole }: NavSectionProps) {
  const location = useLocation();

  const visibleItems = items.filter((item) => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-2">
      {!collapsed && (
        <h3 className="px-2 mb-1 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]));
          
          const linkContent = (
            <NavLink
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <span className="font-medium">{item.label}</span>
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

  useEffect(() => {
    const newContext = getPageContextFromPath(location.pathname);
    if (newContext !== pageContext) {
      setPageContext(newContext);
    }
  }, [location.pathname, pageContext, setPageContext]);

  const renderNavigation = () => {
    switch (pageContext) {
      case "registry":
        return (
          <>
            <NavSection title="Registry" items={registryNavItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Tools" items={registryToolsItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Admin" items={registryAdminItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      case "clinical":
        return (
          <>
            <NavSection title="Quick Access" items={clinicalPriorityItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Clinical" items={clinicalNavItems} collapsed={collapsed} userRole={userRole} />
            <NavSection title="Orders" items={ordersNavItems} collapsed={collapsed} userRole={userRole} />
          </>
        );
      case "operations":
        return <NavSection title="Operations" items={operationsNavItems} collapsed={collapsed} userRole={userRole} />;
      case "scheduling":
        return <NavSection title="Scheduling" items={schedulingNavItems} collapsed={collapsed} userRole={userRole} />;
      case "portal":
        return <NavSection title="Portal" items={portalNavItems} collapsed={collapsed} userRole={userRole} />;
      case "admin":
        return <NavSection title="Admin" items={adminNavItems} collapsed={collapsed} userRole={userRole} />;
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

  const showWorkspaceSelector = pageContext === "clinical" || pageContext === "home";

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200",
        collapsed ? "w-12" : "w-48"
      )}
    >
      {/* Logo */}
      <div className="h-12 flex items-center justify-between px-2 border-b border-sidebar-border">
        {!collapsed && (
          <img src={impiloLogo} alt="Impilo" className="h-6 w-auto" />
        )}
        {collapsed && (
          <img src={impiloLogo} alt="Impilo" className="h-5 w-auto mx-auto" />
        )}
      </div>

      {/* Workspace Selector */}
      {showWorkspaceSelector && (
        <WorkspaceSelector
          currentView={currentView}
          onViewChange={setCurrentView}
          collapsed={collapsed}
        />
      )}

      {/* Context indicator */}
      {!showWorkspaceSelector && !collapsed && (
        <div className="px-2 py-2 border-b border-sidebar-border">
          <div className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            {pageContext === "registry" && "Registry"}
            {pageContext === "operations" && "Operations"}
            {pageContext === "scheduling" && "Scheduling"}
            {pageContext === "portal" && "Portal"}
            {pageContext === "admin" && "Admin"}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2 px-1.5">
        {renderNavigation()}
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="p-1.5 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center h-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span className="text-[10px]">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
