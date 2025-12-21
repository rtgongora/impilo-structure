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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description?: string;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/", description: "Overview & worklist" },
  { label: "Clinical EHR", icon: Stethoscope, path: "/encounter", description: "Patient encounters" },
  { label: "Patient Queue", icon: Users, path: "/queue", description: "Queue management" },
  { label: "Bed Management", icon: Bed, path: "/beds", description: "Ward & bed status" },
  { label: "Appointments", icon: Calendar, path: "/appointments", description: "Scheduling" },
  { label: "Patients", icon: Users, path: "/patients", description: "Patient registry" },
];

const clinicalNavItems: NavItem[] = [
  { label: "Order Entry", icon: ShoppingCart, path: "/orders", description: "Clinical orders" },
  { label: "Pharmacy", icon: Syringe, path: "/pharmacy", description: "Medication dispensing" },
  { label: "Laboratory", icon: FlaskConical, path: "/lims", description: "Lab results" },
  { label: "PACS Imaging", icon: FileText, path: "/pacs", description: "Medical imaging" },
  { label: "Shift Handoff", icon: ArrowRightLeft, path: "/handoff", description: "Handoff reports" },
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
  { label: "Odoo ERP", icon: Building2, path: "/odoo", description: "ERP integration" },
  { label: "Admin", icon: Settings, path: "/admin", description: "System settings" },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  collapsed: boolean;
}

function NavSection({ title, items, collapsed }: NavSectionProps) {
  const location = useLocation();

  return (
    <div className="mb-4">
      {!collapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
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

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 px-2">
        <NavSection title="Main" items={mainNavItems} collapsed={collapsed} />
        <NavSection title="Clinical" items={clinicalNavItems} collapsed={collapsed} />
        <NavSection title="Operations" items={operationsNavItems} collapsed={collapsed} />
        <NavSection title="System" items={systemNavItems} collapsed={collapsed} />
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
