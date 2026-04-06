import { useEHR } from "@/contexts/EHRContext";
import { TOP_BAR_ACTIONS } from "@/types/ehr";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
  X,
  ShieldCheck,
  Lock,
  
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

// All actions shown as icon-only with tooltips

export function TopBar() {
  const { 
    activeTopBarAction, 
    setActiveTopBarAction, 
    isCriticalEventActive, 
    currentEncounter,
    hasActivePatient,
    patientContext,
    closeChart,
  } = useEHR();
  const navigate = useNavigate();


  return (
    <header className="h-14 min-h-[3.5rem] shrink-0 bg-topbar-bg text-topbar-foreground flex items-center justify-between px-3 border-b border-topbar-bg/20 shadow-sm">
      {/* Left: Back, Home, Logo & Actions */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
            asChild
          >
            <Link to="/">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <img src={impiloLogo} alt="Impilo" className="h-6 w-auto" />
        
        {/* Top Bar Actions - Only show if patient is active */}
        {hasActivePatient && (
          <>
            <div className="h-5 w-px bg-topbar-muted/30" />
            <TooltipProvider delayDuration={200}>
               <nav className="flex items-center gap-1">
                {TOP_BAR_ACTIONS.map((action) => {
                  const Icon = iconMap[action.icon];
                  const isActive = activeTopBarAction === action.id;
                  
                  return (
                    <Tooltip key={action.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-9 gap-1.5 text-xs text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10
                            ${isActive ? "bg-topbar-foreground/15 text-topbar-foreground" : ""}
                          `}
                          onClick={() => setActiveTopBarAction(isActive ? null : action.id)}
                        >
                          <Icon className="w-4 h-4" />
                          {action.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {action.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                
                <div className="h-5 w-px bg-topbar-muted/30 mx-0.5" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 text-xs text-topbar-muted hover:text-topbar-foreground hover:bg-topbar-foreground/10"
                      asChild
                    >
                      <Link to="/registration">
                        <UserPlus className="w-4 h-4" />
                        Register
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Register
                  </TooltipContent>
                </Tooltip>
              </nav>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Center: Patient Context - Only show if patient is active */}
      {hasActivePatient && currentEncounter && (
        <div className="flex items-center gap-2 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-topbar-muted hover:text-destructive hover:bg-destructive/10 gap-1 text-xs"
              >
                <X className="w-3.5 h-3.5" />
                Close Chart
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close Patient Chart?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will close {currentEncounter.patient.name}'s chart and return you to your worklist.
                  Any unsaved changes may be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Working</AlertDialogCancel>
                <AlertDialogAction onClick={() => closeChart("/queue")}>
                  Close Chart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Center: No patient message when not active */}
      {!hasActivePatient && (
        <div className="text-center">
          <div className="text-xs text-topbar-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            No Patient Selected
          </div>
        </div>
      )}

      {/* Right: Search & Workspace */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasActivePatient && <PatientSearch />}

        {hasActivePatient && <div className="h-5 w-px bg-topbar-muted/30" />}

        {hasActivePatient && <ActiveWorkspaceIndicator compact />}
      </div>
    </header>
  );
}
