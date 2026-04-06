import { CriticalEventButton } from "@/components/ehr/CriticalEventButton";
import { CDSAlertBadge } from "@/components/ehr/ClinicalDecisionSupport";
import { AIDiagnosticAssistant } from "@/components/ehr/AIDiagnosticAssistant";
import { AlertBadge } from "@/components/alerts/ClinicalAlerts";
import { useEHR } from "@/contexts/EHRContext";

export function ClinicalToolbar() {
  const { hasActivePatient } = useEHR();

  if (!hasActivePatient) return null;

  return (
    <div className="h-9 min-h-[2.25rem] shrink-0 bg-muted/50 border-b flex items-center justify-between px-3">
      {/* Left: Clinical decision support tools */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Clinical Tools</span>
        <div className="h-4 w-px bg-border" />
        <AIDiagnosticAssistant />
        <CDSAlertBadge />
        <AlertBadge />
      </div>

      {/* Right: Critical Event */}
      <div className="flex items-center gap-2">
        <CriticalEventButton />
      </div>
    </div>
  );
}
