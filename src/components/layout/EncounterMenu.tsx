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
        "w-48 bg-encounter-bg border-l border-border flex flex-col transition-opacity duration-200",
        isDeemphasized && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Encounter Record
        </h2>
      </div>

      {/* Patient File Button */}
      <div className="px-2 py-1.5 border-b border-border">
        <Button
          variant={isPatientFileOpen ? "secondary" : "outline"}
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs"
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
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-150",
                    "hover:bg-encounter-item-hover group",
                    isActive
                      ? "bg-encounter-item-active-bg text-encounter-item-active font-medium"
                      : "text-secondary-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-encounter-item text-muted-foreground group-hover:bg-primary-muted group-hover:text-primary"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs truncate flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-3 h-3 text-encounter-item-active shrink-0" />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
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
