import { useEHR } from "@/contexts/EHRContext";
import { TOP_BAR_ACTIONS } from "@/types/ehr";
import {
  Boxes,
  Route,
  Package,
  Receipt,
  AlertTriangle,
  Users,
  Bed,
  ClipboardList,
  UserPlus,
  ShoppingCart,
  Pill,
  Calendar,
  CreditCard,
  ClipboardCheck,
  ArrowLeft,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CriticalEventButton } from "@/components/ehr/CriticalEventButton";
import { CDSAlertBadge } from "@/components/ehr/ClinicalDecisionSupport";
import { AIDiagnosticAssistant } from "@/components/ehr/AIDiagnosticAssistant";
import { AlertBadge } from "@/components/alerts/ClinicalAlerts";
import { UserMenu } from "@/components/auth/UserMenu";
import { ActiveWorkspaceIndicator } from "@/components/layout/ActiveWorkspaceIndicator";
import { Link, useNavigate } from "react-router-dom";
import { PatientSearch } from "@/components/search/PatientSearch";
import impiloLogo from "@/assets/impilo-logo.png";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Boxes,
  Route,
  Package,
  Receipt,
  Users,
  Bed,
  ClipboardList,
  ShoppingCart,
  Pill,
  Calendar,
  CreditCard,
  ClipboardCheck,
};

export function TopBar() {
  const { activeTopBarAction, setActiveTopBarAction, isCriticalEventActive, currentEncounter } = useEHR();
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-topbar-bg text-topbar-foreground flex items-center justify-between px-4 border-b border-topbar-bg/20 shadow-sm">
      {/* Left: Back, Home, Logo & Actions */}
      <div className="flex items-center gap-4">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
            asChild
          >
            <Link to="/">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <img src={impiloLogo} alt="Impilo" className="h-7 w-auto" />
        </div>
        
        <div className="h-6 w-px bg-topbar-muted/30 mx-2" />
        
        {/* Top Bar Actions */}
        <nav className="flex items-center gap-1">
          {TOP_BAR_ACTIONS.map((action) => {
            const Icon = iconMap[action.icon];
            const isActive = activeTopBarAction === action.id;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className={`
                  text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10
                  ${isActive ? "bg-topbar-foreground/15 text-topbar-foreground" : ""}
                `}
                onClick={() => setActiveTopBarAction(isActive ? null : action.id)}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {action.label}
              </Button>
            );
          })}
          
          <div className="h-5 w-px bg-topbar-muted/30 mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            className="text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
            asChild
          >
            <Link to="/registration">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Register
            </Link>
          </Button>
        </nav>
      </div>

      {/* Center: Patient Context */}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-sm font-medium">{currentEncounter.patient.name}</div>
          <div className="text-xs text-topbar-muted">
            {currentEncounter.patient.mrn} • {currentEncounter.patient.ward} • {currentEncounter.patient.bed}
          </div>
        </div>
        {currentEncounter.patient.allergies.length > 0 && (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Allergies
          </Badge>
        )}
      </div>

      {/* Right: Critical Event, CDS & User */}
      <div className="flex items-center gap-2">
        {/* Patient Search */}
        <PatientSearch />

        <div className="h-6 w-px bg-topbar-muted/30" />

        {/* Active Workspace Indicator */}
        <ActiveWorkspaceIndicator compact />

        <div className="h-6 w-px bg-topbar-muted/30" />

        {/* AI Diagnostic Assistant */}
        <AIDiagnosticAssistant />

        {/* Clinical Alerts */}
        <AlertBadge />

        {/* Clinical Decision Support */}
        <CDSAlertBadge />

        {/* Critical Event Button - Always Visible */}
        <CriticalEventButton />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
