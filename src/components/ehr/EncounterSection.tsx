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
      {/* Section Header */}
      <header className="bg-workspace-header border-b border-border px-6 py-4">
        <motion.div
          key={activeMenuItem}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-xl font-semibold text-foreground">{menuItem?.label}</h1>
          <p className="text-sm text-muted-foreground">{menuItem?.description}</p>
        </motion.div>
      </header>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={activeMenuItem}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <SectionComponent />
        </motion.div>
      </div>
    </div>
  );
}
