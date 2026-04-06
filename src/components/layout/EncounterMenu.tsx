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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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

const statusIcons: Record<SectionStatus, React.ComponentType<{ className?: string }>> = {
  "not-started": Circle,
  "in-progress": CircleDot,
  "completed": CheckCircle2,
  "skipped": Circle,
  "attention": AlertCircle,
};

const statusColors: Record<SectionStatus, string> = {
  "not-started": "text-muted-foreground/40",
  "in-progress": "text-primary",
  "completed": "text-success",
  "skipped": "text-muted-foreground/30",
  "attention": "text-warning",
};

export function EncounterMenu() {
  const { activeMenuItem, setActiveMenuItem, isCriticalEventActive, activeWorkspace, openWorkspace, closeWorkspace } = useEHR();
  const wizard = useEncounterWizard();

  // Mark section as visited when navigating
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
        "w-52 bg-encounter-bg border-l border-border flex flex-col transition-opacity duration-200",
        isDeemphasized && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header with Progress */}
      <div className="px-3 py-2 border-b border-border space-y-1.5">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Encounter Record
        </h2>
        <div className="flex items-center gap-2">
          <Progress value={wizard.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{wizard.progress}%</span>
        </div>
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
      <TooltipProvider delayDuration={300}>
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {ENCOUNTER_MENU_ITEMS.map((item, index) => {
              const Icon = iconMap[item.icon];
              const isActive = activeMenuItem === item.id;
              const status = wizard.sectionStatuses[item.id];
              const recommendation = wizard.recommendations[item.id];
              const isRecommendedNext = wizard.recommendedNext === item.id;
              const StatusIcon = statusIcons[status];

              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveMenuItem(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-150",
                          "hover:bg-encounter-item-hover group",
                          isActive
                            ? "bg-encounter-item-active-bg text-encounter-item-active font-medium"
                            : "text-foreground/80",
                          isRecommendedNext && !isActive && "ring-1 ring-primary/30 bg-primary/5"
                        )}
                      >
                        {/* Status indicator */}
                        <StatusIcon className={cn("w-3 h-3 shrink-0", statusColors[status])} />
                        
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
                        <span className="text-xs truncate flex-1 min-w-0">{item.label}</span>
                        
                        {isRecommendedNext && !isActive && (
                          <Sparkles className="w-3 h-3 text-primary shrink-0 animate-pulse" />
                        )}
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-encounter-item-active shrink-0" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs max-w-[180px]">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-muted-foreground">{recommendation.reason}</div>
                      {recommendation.priority === "high" && (
                        <Badge variant="outline" className="mt-1 text-[9px] h-4 bg-warning/10 text-warning border-warning/30">
                          Needs attention
                        </Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </TooltipProvider>

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
