import { useState } from "react";
import { CriticalEventButton } from "@/components/ehr/CriticalEventButton";
import { CDSAlertBadge } from "@/components/ehr/ClinicalDecisionSupport";
import { AIDiagnosticAssistant } from "@/components/ehr/AIDiagnosticAssistant";
import { AlertBadge } from "@/components/alerts/ClinicalAlerts";
import { ClinicalReferences } from "@/components/ehr/ClinicalReferences";
import { DrugDatabaseSheet, InteractionCheckerSheet, CalculatorsSheet, ConditionsBrowserSheet, FormularySheet } from "@/components/ehr/MedscapeTools";
import { ActiveCDSBanner } from "@/components/ehr/ActiveCDSBanner";
import { SystemFeedbackStrip } from "@/components/ehr/SystemFeedbackStrip";
import { useEHR } from "@/contexts/EHRContext";
import { Route, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ClinicalToolbar() {
  const { hasActivePatient, activeTopBarAction, setActiveTopBarAction } = useEHR();
  const [cdsEnabled, setCdsEnabled] = useState(true);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);

  if (!hasActivePatient) return null;

  const isPathwaysActive = activeTopBarAction === "pathways";

  return (
    <div className="shrink-0 border-b">
      <SystemFeedbackStrip />

      <div className="h-11 min-h-[2.75rem] bg-muted/50 flex items-center px-3 overflow-x-auto">
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0 mr-1.5">Tools</span>
          <div className="h-4 w-px bg-border mr-0.5 shrink-0" />

          <DrugDatabaseSheet />
          <ConditionsBrowserSheet />
          <InteractionCheckerSheet />
          <CalculatorsSheet />
          <FormularySheet />

          <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 text-xs shrink-0 ${isPathwaysActive ? "bg-primary/10 text-primary" : ""}`}
            onClick={() => setActiveTopBarAction(isPathwaysActive ? null : "pathways")}
          >
            <Route className="w-3.5 h-3.5" />
            Pathways
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setAiAssistEnabled(!aiAssistEnabled)}>
                {aiAssistEnabled ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{aiAssistEnabled ? "Disable" : "Enable"} AI Assist</TooltipContent>
          </Tooltip>
          {aiAssistEnabled && <AIDiagnosticAssistant />}

          <ClinicalReferences />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setCdsEnabled(!cdsEnabled)}>
                {cdsEnabled ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{cdsEnabled ? "Disable" : "Enable"} Clinical Decision Support</TooltipContent>
          </Tooltip>
          {cdsEnabled && <CDSAlertBadge />}

          <AlertBadge />
          <div className="flex-1" />
          <CriticalEventButton />
          <div className="h-4 w-px bg-border mx-0.5 shrink-0" />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
            <Users className="w-3.5 h-3.5" />
            Directory
          </Button>
        </div>
      </div>
      
      {cdsEnabled && <ActiveCDSBanner />}
    </div>
  );
}
