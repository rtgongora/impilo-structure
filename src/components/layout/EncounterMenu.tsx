import { motion } from "framer-motion";
import { useEHR } from "@/contexts/EHRContext";
import { ENCOUNTER_MENU_ITEMS, EncounterMenuItem } from "@/types/ehr";
import {
  LayoutDashboard,
  ClipboardCheck,
  Stethoscope,
  FileText,
  Heart,
  Users,
  FileEdit,
  CheckCircle,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardCheck,
  Stethoscope,
  FileText,
  Heart,
  Users,
  FileEdit,
  CheckCircle,
};

export function EncounterMenu() {
  const { activeMenuItem, setActiveMenuItem, isCriticalEventActive, activeWorkspace, openWorkspace, closeWorkspace } = useEHR();

  // De-emphasize menu during critical events or active workspaces
  const isDeemphasized = isCriticalEventActive || (activeWorkspace !== null && activeWorkspace.type !== "patient_file");
  const isPatientFileOpen = activeWorkspace?.type === "patient_file";

  const handlePatientFileClick = () => {
    if (isPatientFileOpen) {
      closeWorkspace();
    } else {
      openWorkspace("patient_file");
    }
  };

  return (
    <aside
      className={cn(
        "w-64 bg-encounter-bg border-l border-border flex flex-col transition-opacity duration-200",
        isDeemphasized && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Encounter Record
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Clinical Documentation</p>
      </div>

      {/* Patient File Button */}
      <div className="p-2 border-b border-border">
        <Button
          variant={isPatientFileOpen ? "secondary" : "outline"}
          className="w-full justify-start gap-2"
          onClick={handlePatientFileClick}
        >
          <FolderOpen className="h-4 w-4" />
          Patient File
          {isPatientFileOpen && (
            <span className="ml-auto text-xs text-muted-foreground">Active</span>
          )}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {ENCOUNTER_MENU_ITEMS.map((item, index) => {
            const Icon = iconMap[item.icon];
            const isActive = activeMenuItem === item.id;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setActiveMenuItem(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                    "hover:bg-encounter-item-hover group",
                    isActive
                      ? "bg-encounter-item-active-bg text-encounter-item-active font-medium"
                      : "text-secondary-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-encounter-item text-muted-foreground group-hover:bg-primary-muted group-hover:text-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.label}</div>
                    <div
                      className={cn(
                        "text-xs truncate",
                        isActive ? "text-encounter-item-active/70" : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-encounter-item-active" />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last saved: 2 min ago</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-active" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
