import { useState } from "react";
import {
  Activity,
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
  User,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description?: string;
  roles?: string[]; // Which roles can see this item
}

// Priority items that appear first for everyone
const priorityNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Overview & worklist" },
  { label: "My Worklist", icon: ClipboardList, path: "/queue", description: "Your assigned work" },
];

// Role-specific primary items
const clinicalNavItems: NavItem[] = [
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters", roles: ["doctor", "nurse", "specialist"] },
  { label: "Bed Management", icon: Bed, path: "/beds", description: "Ward & bed status", roles: ["doctor", "nurse", "admin"] },
  { label: "Appointments", icon: Calendar, path: "/appointments", description: "Scheduling" },
  { label: "Patients", icon: Users, path: "/patients", description: "Patient registry" },
];

const ordersNavItems: NavItem[] = [
  { label: "Order Entry", icon: ShoppingCart, path: "/orders", description: "Clinical orders", roles: ["doctor", "nurse", "specialist"] },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy", description: "Medication dispensing" },
  { label: "Laboratory", icon: FlaskConical, path: "/lims", description: "Lab results" },
  { label: "PACS Imaging", icon: FileText, path: "/pacs", description: "Medical imaging" },
  { label: "Shift Handoff", icon: ArrowRightLeft, path: "/handoff", description: "Handoff reports", roles: ["doctor", "nurse"] },
];

const operationsNavItems: NavItem[] = [
  { label: "Theatre", icon: Building2, path: "/theatre", description: "Surgical scheduling" },
  { label: "Payments", icon: DollarSign, path: "/payments", description: "Billing & payments" },
  { label: "Charges", icon: Receipt, path: "/charges", description: "Encounter charges" },
  { label: "Stock", icon: Package, path: "/stock", description: "Inventory" },
  { label: "Consumables", icon: Syringe, path: "/consumables", description: "Usage tracking" },
];

const systemNavItems: NavItem[] = [
  { label: "Reports", icon: BarChart3, path: "/reports", description: "Analytics" },
  { label: "Registration", icon: UserPlus, path: "/registration", description: "Patient registration" },
  { label: "Help Desk", icon: HelpCircle, path: "/help", description: "FAQs & guides" },
  { label: "Odoo ERP", icon: Building2, path: "/odoo", description: "ERP integration", roles: ["admin"] },
  { label: "Admin", icon: Settings, path: "/admin", description: "System settings", roles: ["admin"] },
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
    <div className="mb-4">
      {!collapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          const linkContent = (
            <NavLink
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
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
  const { currentView, setCurrentView } = useWorkspace();
  const { profile } = useAuth();
  const userRole = profile?.role || "nurse";

  // Determine which sections to show based on role
  const isAdmin = userRole === "admin";
  const isClinical = ["doctor", "nurse", "specialist"].includes(userRole);

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">Impilo EHR</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Healthcare System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Workspace Selector */}
      <WorkspaceSelector
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={collapsed}
      />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 px-2">
        {/* Priority section - always first */}
        <NavSection title="Quick Access" items={priorityNavItems} collapsed={collapsed} userRole={userRole} />
        
        {/* Clinical section - prominent for clinical roles */}
        {isClinical && (
          <NavSection title="Clinical" items={clinicalNavItems} collapsed={collapsed} userRole={userRole} />
        )}
        
        {/* Orders section */}
        <NavSection title="Orders & Results" items={ordersNavItems} collapsed={collapsed} userRole={userRole} />
        
        {/* Operations section */}
        <NavSection title="Operations" items={operationsNavItems} collapsed={collapsed} userRole={userRole} />
        
        {/* System section - shown last but visible to those who need it */}
        <NavSection title="System" items={systemNavItems} collapsed={collapsed} userRole={userRole} />
        
        {/* For non-clinical roles, show clinical items at end */}
        {!isClinical && (
          <NavSection title="Clinical" items={clinicalNavItems} collapsed={collapsed} userRole={userRole} />
        )}
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
