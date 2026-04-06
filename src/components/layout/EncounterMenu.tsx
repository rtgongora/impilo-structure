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
  FolderOpen,
  Circle,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEncounterWizard, SectionStatus } from "@/hooks/useEncounterWizard";
import { useEffect } from "react";

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

const statusColors: Record<SectionStatus, string> = {
  "not-started": "border-muted-foreground/20",
  "in-progress": "border-primary",
  "completed": "border-success",
  "skipped": "border-muted-foreground/10",
  "attention": "border-warning",
};

const statusBg: Record<SectionStatus, string> = {
  "not-started": "",
  "in-progress": "bg-primary/5",
  "completed": "bg-success/5",
  "skipped": "",
  "attention": "bg-warning/5",
};

export function EncounterMenu() {
  const { activeMenuItem, setActiveMenuItem, isCriticalEventActive, activeWorkspace, openWorkspace, closeWorkspace } = useEHR();
  const wizard = useEncounterWizard();

  useEffect(() => {
    wizard.markVisited(activeMenuItem);
  }, [activeMenuItem]);

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
        "w-56 bg-encounter-bg border-l border-border flex flex-col transition-opacity duration-200",
        isDeemphasized && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header with Progress */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Encounter Record
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={wizard.progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground font-semibold">{wizard.progress}%</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {wizard.attentionSections.length > 0
            ? `${wizard.attentionSections.length} sections need attention`
            : "All sections reviewed"}
        </p>
      </div>

      {/* Patient File Button */}
      <div className="px-3 py-2 border-b border-border">
        <Button
          variant={isPatientFileOpen ? "secondary" : "outline"}
          size="sm"
          className="w-full justify-start gap-2 h-9 text-sm"
          onClick={handlePatientFileClick}
        >
          <FolderOpen className="h-4 w-4" />
          Patient File
          {isPatientFileOpen && (
            <Badge variant="secondary" className="ml-auto text-[10px] h-4">Active</Badge>
          )}
        </Button>
      </div>

      {/* Menu Items - Full height cards */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {ENCOUNTER_MENU_ITEMS.map((item, index) => {
            const Icon = iconMap[item.icon];
            const isActive = activeMenuItem === item.id;
            const status = wizard.sectionStatuses[item.id];
            const recommendation = wizard.recommendations[item.id];
            const isRecommendedNext = wizard.recommendedNext === item.id;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <button
                  onClick={() => setActiveMenuItem(item.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 border-l-2",
                    "hover:bg-encounter-item-hover group",
                    statusColors[status],
                    statusBg[status],
                    isActive
                      ? "bg-encounter-item-active-bg border-l-primary shadow-sm"
                      : "",
                    isRecommendedNext && !isActive && "ring-1 ring-primary/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors shrink-0 mt-0.5",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : status === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground group-hover:bg-primary-muted group-hover:text-primary"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-foreground" : "text-foreground/80"
                      )}>
                        {item.label}
                      </span>
                      {isRecommendedNext && !isActive && (
                        <Sparkles className="w-3 h-3 text-primary shrink-0 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                      {recommendation.reason}
                    </span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last saved: 2 min ago</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-active" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
