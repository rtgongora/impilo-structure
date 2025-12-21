import { AnimatePresence, motion } from "framer-motion";
import { useEHR } from "@/contexts/EHRContext";
import { EncounterSection } from "@/components/ehr/EncounterSection";
import { WorkspaceView } from "@/components/ehr/WorkspaceView";
import { CriticalEventWorkspace } from "@/components/ehr/CriticalEventWorkspace";
import { TopBarPanel } from "@/components/ehr/TopBarPanel";

export function MainWorkArea() {
  const { activeWorkspace, activeCriticalEvent, activeTopBarAction } = useEHR();

  return (
    <main className="flex-1 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Priority 1: Critical Event Workspace */}
        {activeCriticalEvent && activeCriticalEvent.status === "active" ? (
          <motion.div
            key="critical-event"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-full"
          >
            <CriticalEventWorkspace event={activeCriticalEvent} />
          </motion.div>
        ) : activeWorkspace ? (
          /* Priority 2: Active Workspace */
          <motion.div
            key="workspace"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full"
          >
            <WorkspaceView workspace={activeWorkspace} />
          </motion.div>
        ) : activeTopBarAction ? (
          /* Priority 3: Top Bar Panel */
          <motion.div
            key="topbar-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full"
          >
            <TopBarPanel action={activeTopBarAction} />
          </motion.div>
        ) : (
          /* Default: Encounter Section */
          <motion.div
            key="encounter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <EncounterSection />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
