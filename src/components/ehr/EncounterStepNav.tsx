import { useEHR } from "@/contexts/EHRContext";
import { useEncounterWizard } from "@/hooks/useEncounterWizard";
import { ENCOUNTER_MENU_ITEMS } from "@/types/ehr";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";

export function EncounterStepNav() {
  const { activeMenuItem, setActiveMenuItem } = useEHR();
  const wizard = useEncounterWizard();

  const prev = wizard.prevSection(activeMenuItem);
  const next = wizard.nextSection(activeMenuItem);
  const prevLabel = prev ? ENCOUNTER_MENU_ITEMS.find(i => i.id === prev)?.label : null;
  const nextLabel = next ? ENCOUNTER_MENU_ITEMS.find(i => i.id === next)?.label : null;

  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
      {/* Previous */}
      <div>
        {prev && (
          <Button
            variant="ghost"
            size="default"
            className="text-sm gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setActiveMenuItem(prev)}
          >
            <ChevronLeft className="w-4 h-4" />
            {prevLabel}
          </Button>
        )}
      </div>

      {/* Mark Complete */}
      <Button
        variant="outline"
        size="default"
        className="text-sm gap-2"
        onClick={() => wizard.markCompleted(activeMenuItem)}
        disabled={wizard.sectionStatuses[activeMenuItem] === "completed"}
      >
        <CheckCircle2 className="w-4 h-4" />
        {wizard.sectionStatuses[activeMenuItem] === "completed" ? "Completed" : "Mark Complete"}
      </Button>

      {/* Next / Recommended */}
      <div className="flex items-center gap-2">
        {wizard.recommendedNext && wizard.recommendedNext !== activeMenuItem && wizard.recommendedNext !== next && (
          <Button
            variant="ghost"
            size="default"
            className="text-sm gap-2 text-primary"
            onClick={() => setActiveMenuItem(wizard.recommendedNext!)}
          >
            <Sparkles className="w-4 h-4" />
            {ENCOUNTER_MENU_ITEMS.find(i => i.id === wizard.recommendedNext)?.label}
          </Button>
        )}
        {next && (
          <Button
            variant="ghost"
            size="default"
            className="text-sm gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setActiveMenuItem(next)}
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
