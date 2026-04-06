import { motion } from "framer-motion";
import { useEHR } from "@/contexts/EHRContext";
import { ENCOUNTER_MENU_ITEMS } from "@/types/ehr";
import { OverviewSection } from "./sections/OverviewSection";
import { AssessmentSection } from "./sections/AssessmentSection";
import { ProblemsSection } from "./sections/ProblemsSection";
import { OrdersSection } from "./sections/OrdersSection";
import { CareSection } from "./sections/CareSection";
import { ConsultsSection } from "./sections/ConsultsSection";
import { NotesSection } from "./sections/NotesSection";
import { OutcomeSection } from "./sections/OutcomeSection";
import { PatientBanner } from "./PatientBanner";
import { EncounterPatientHeader } from "./EncounterPatientHeader";
import { EncounterStepNav } from "./EncounterStepNav";
import { useEncounterWizard } from "@/hooks/useEncounterWizard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const sectionComponents: Record<string, React.ComponentType> = {
  overview: OverviewSection,
  assessment: AssessmentSection,
  problems: ProblemsSection,
  orders: OrdersSection,
  care: CareSection,
  consults: ConsultsSection,
  notes: NotesSection,
  outcome: OutcomeSection,
};

export function EncounterSection() {
  const { activeMenuItem, setActiveMenuItem } = useEHR();
  const menuItem = ENCOUNTER_MENU_ITEMS.find((item) => item.id === activeMenuItem);
  const SectionComponent = sectionComponents[activeMenuItem] || OverviewSection;
  const wizard = useEncounterWizard();

  const prev = wizard.prevSection(activeMenuItem);
  const next = wizard.nextSection(activeMenuItem);
  const currentIndex = ENCOUNTER_MENU_ITEMS.findIndex(i => i.id === activeMenuItem);
  const recommendation = wizard.recommendations[activeMenuItem];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Persistent Patient Header */}
      <EncounterPatientHeader />

      {/* Patient Banner - Vitals, Alerts, Episodes */}
      <PatientBanner />

      {/* Wizard Section Header with Navigation */}
      <header className="bg-workspace-header border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0 rounded-xl"
            onClick={() => prev && setActiveMenuItem(prev)}
            disabled={!prev}
          >
            <ChevronLeft className="w-9 h-9" />
          </Button>

          <motion.div
            key={activeMenuItem}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 text-center min-w-0"
          >
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="text-sm h-7 px-2.5 font-mono tabular-nums">
                {currentIndex + 1}/{ENCOUNTER_MENU_ITEMS.length}
              </Badge>
              <h1 className="text-xl font-bold text-foreground">{menuItem?.label}</h1>
              {recommendation.priority === "high" && (
                <Sparkles className="w-5 h-5 text-warning animate-pulse" />
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1.5">
              {recommendation.reason}
            </div>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0 rounded-xl"
            onClick={() => next && setActiveMenuItem(next)}
            disabled={!next}
          >
            <ChevronRight className="w-9 h-9" />
          </Button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {ENCOUNTER_MENU_ITEMS.map((item) => {
            const status = wizard.sectionStatuses[item.id];
            const isActive = item.id === activeMenuItem;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenuItem(item.id)}
                className={`rounded-full transition-all duration-200 ${
                  isActive
                    ? "w-6 h-2.5 bg-primary"
                    : status === "completed"
                    ? "w-2.5 h-2.5 bg-success"
                    : status === "in-progress"
                    ? "w-2.5 h-2.5 bg-primary/50"
                    : "w-2.5 h-2.5 bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>
      </header>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <motion.div
          key={activeMenuItem}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <SectionComponent />
        </motion.div>
      </div>

      {/* Step Navigation */}
      <EncounterStepNav />
    </div>
  );
}
