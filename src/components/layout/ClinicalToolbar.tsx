import { CriticalEventButton } from "@/components/ehr/CriticalEventButton";
import { CDSAlertBadge } from "@/components/ehr/ClinicalDecisionSupport";
import { AIDiagnosticAssistant } from "@/components/ehr/AIDiagnosticAssistant";
import { AlertBadge } from "@/components/alerts/ClinicalAlerts";
import { ClinicalReferences } from "@/components/ehr/ClinicalReferences";
import { ActiveCDSBanner } from "@/components/ehr/ActiveCDSBanner";
import { useEHR } from "@/contexts/EHRContext";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClinicalToolbar() {
  const { hasActivePatient, activeTopBarAction, setActiveTopBarAction } = useEHR();

  if (!hasActivePatient) return null;

  const isPathwaysActive = activeTopBarAction === "pathways";

  return (
    <div className="shrink-0 border-b">
      {/* Toolbar row */}
      <div className="h-11 min-h-[2.75rem] bg-muted/50 flex items-center px-3">
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0 mr-2">Clinical Tools</span>
          <div className="h-4 w-px bg-border mr-1" />
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 text-xs flex-1 max-w-[160px] ${isPathwaysActive ? "bg-primary/10 text-primary" : ""}`}
            onClick={() => setActiveTopBarAction(isPathwaysActive ? null : "pathways")}
          >
            <Route className="w-3.5 h-3.5" />
            Care Pathways
          </Button>
          <AIDiagnosticAssistant />
          <ClinicalReferences />
          <CDSAlertBadge />
          <AlertBadge />

          <div className="flex-1" />

          <CriticalEventButton />
        </div>
      </div>
      
      {/* Active CDS Guidance Banner */}
      <ActiveCDSBanner />
    </div>
  );
}
