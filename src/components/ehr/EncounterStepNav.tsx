import { useEHR } from "@/contexts/EHRContext";
import { useEncounterWizard } from "@/hooks/useEncounterWizard";
import { ENCOUNTER_MENU_ITEMS, EncounterMenuItem } from "@/types/ehr";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";

export function EncounterStepNav() {
  const { activeMenuItem, setActiveMenuItem } = useEHR();
  const wizard = useEncounterWizard();

  const prev = wizard.prevSection(activeMenuItem);
  const next = wizard.nextSection(activeMenuItem);
  const prevLabel = prev ? ENCOUNTER_MENU_ITEMS.find(i => i.id === prev)?.label : null;
  const nextLabel = next ? ENCOUNTER_MENU_ITEMS.find(i => i.id === next)?.label : null;
  const recommendation = wizard.recommendations[activeMenuItem];

  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
      {/* Previous */}
      <div>
        {prev && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setActiveMenuItem(prev)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {prevLabel}
          </Button>
        )}
      </div>

      {/* Mark Complete */}
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-7"
        onClick={() => wizard.markCompleted(activeMenuItem)}
        disabled={wizard.sectionStatuses[activeMenuItem] === "completed"}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {wizard.sectionStatuses[activeMenuItem] === "completed" ? "Completed" : "Mark Complete"}
      </Button>

      {/* Next / Recommended */}
      <div className="flex items-center gap-2">
        {wizard.recommendedNext && wizard.recommendedNext !== activeMenuItem && wizard.recommendedNext !== next && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-primary"
            onClick={() => setActiveMenuItem(wizard.recommendedNext!)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {ENCOUNTER_MENU_ITEMS.find(i => i.id === wizard.recommendedNext)?.label}
          </Button>
        )}
        {next && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setActiveMenuItem(next)}
          >
            {nextLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
