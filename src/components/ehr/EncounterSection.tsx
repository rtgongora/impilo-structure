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
  const prevItem = prev ? ENCOUNTER_MENU_ITEMS.find(i => i.id === prev) : null;
  const nextItem = next ? ENCOUNTER_MENU_ITEMS.find(i => i.id === next) : null;
  const currentIndex = ENCOUNTER_MENU_ITEMS.findIndex(i => i.id === activeMenuItem);
  const recommendation = wizard.recommendations[activeMenuItem];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Persistent Patient Header */}
      <EncounterPatientHeader />

      {/* Patient Banner - Vitals, Alerts, Episodes */}
      <PatientBanner />

      {/* Wizard Section Header with Navigation */}
      <header className="bg-workspace-header border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Back arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => prev && setActiveMenuItem(prev)}
            disabled={!prev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Center: Step info */}
          <motion.div
            key={activeMenuItem}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 text-center min-w-0"
          >
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                {currentIndex + 1}/{ENCOUNTER_MENU_ITEMS.length}
              </Badge>
              <h1 className="text-sm font-semibold text-foreground">{menuItem?.label}</h1>
              {recommendation.priority === "high" && (
                <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" />
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {recommendation.reason}
            </div>
          </motion.div>

          {/* Right: Forward arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => next && setActiveMenuItem(next)}
            disabled={!next}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {ENCOUNTER_MENU_ITEMS.map((item, idx) => {
            const status = wizard.sectionStatuses[item.id];
            const isActive = item.id === activeMenuItem;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenuItem(item.id)}
                className={`rounded-full transition-all duration-200 ${
                  isActive
                    ? "w-5 h-2 bg-primary"
                    : status === "completed"
                    ? "w-2 h-2 bg-success"
                    : status === "in-progress"
                    ? "w-2 h-2 bg-primary/50"
                    : "w-2 h-2 bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>
      </header>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-4">
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
