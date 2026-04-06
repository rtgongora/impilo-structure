import { TopBar } from "./TopBar";
import { UtilityStrip } from "./UtilityStrip";
import { ClinicalToolbar } from "./ClinicalToolbar";
import { EncounterMenu } from "./EncounterMenu";
import { MainWorkArea } from "./MainWorkArea";
import { HelpMenu } from "@/components/help/HelpMenu";
import { useEHR } from "@/contexts/EHRContext";
import { cn } from "@/lib/utils";

export function EHRLayout() {
  const { isCriticalEventActive } = useEHR();

  return (
    <div
      className={cn(
        "h-screen flex flex-col overflow-hidden transition-all duration-300",
        isCriticalEventActive && "ring-4 ring-critical ring-inset critical-mode"
      )}
    >
      {/* CONTEXT BAR - Who, What, Where */}
      <UtilityStrip />

      {/* TOP BAR - Action & Status Layer */}
      <TopBar />

      {/* CLINICAL TOOLBAR - AI, CDS, Alerts, Critical Events */}
      <ClinicalToolbar />

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* MAIN WORK AREA - Focus Zone */}
        <MainWorkArea />

        {/* RIGHT NAV - Encounter Menu (Record Layer) */}
        <EncounterMenu />
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-16 right-5 z-50">
        <HelpMenu variant="floating" />
      </div>
    </div>
  );
}
