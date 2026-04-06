import { CriticalEventButton } from "@/components/ehr/CriticalEventButton";
import { CDSAlertBadge } from "@/components/ehr/ClinicalDecisionSupport";
import { AIDiagnosticAssistant } from "@/components/ehr/AIDiagnosticAssistant";
import { AlertBadge } from "@/components/alerts/ClinicalAlerts";
import { useEHR } from "@/contexts/EHRContext";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClinicalToolbar() {
  const { hasActivePatient, activeTopBarAction, setActiveTopBarAction } = useEHR();

  if (!hasActivePatient) return null;

  const isPathwaysActive = activeTopBarAction === "pathways";

  return (
    <div className="h-9 min-h-[2.25rem] shrink-0 bg-muted/50 border-b flex items-center px-3">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">Clinical Tools</span>
        <div className="h-4 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 gap-1.5 text-xs ${isPathwaysActive ? "bg-primary/10 text-primary" : ""}`}
          onClick={() => setActiveTopBarAction(isPathwaysActive ? null : "pathways")}
        >
          <Route className="w-3.5 h-3.5" />
          Care Pathways
        </Button>
        <AIDiagnosticAssistant />
        <CDSAlertBadge />
        <AlertBadge />

        <div className="flex-1" />

        <CriticalEventButton />
      </div>
    </div>
  );
}
