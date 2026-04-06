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
  const { activeMenuItem } = useEHR();
  const menuItem = ENCOUNTER_MENU_ITEMS.find((item) => item.id === activeMenuItem);
  const SectionComponent = sectionComponents[activeMenuItem] || OverviewSection;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Persistent Patient Header */}
      <EncounterPatientHeader />

      {/* Patient Banner - Vitals, Alerts, Episodes */}
      <PatientBanner />

      {/* Section Header */}
      <header className="bg-workspace-header border-b border-border px-4 py-2">
        <motion.div
          key={activeMenuItem}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3"
        >
          <h1 className="text-base font-semibold text-foreground">{menuItem?.label}</h1>
          <span className="text-xs text-muted-foreground">{menuItem?.description}</span>
        </motion.div>
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
