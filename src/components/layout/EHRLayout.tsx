import { TopBar } from "./TopBar";
import { ClinicalToolbar } from "./ClinicalToolbar";
import { EncounterMenu } from "./EncounterMenu";
import { MainWorkArea } from "./MainWorkArea";
import { PatientBanner } from "@/components/ehr/PatientBanner";
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
      {/* TOP BAR - Action & Status Layer */}
      <TopBar />

      {/* CLINICAL TOOLBAR - AI, CDS, Alerts, Critical Events */}
      <ClinicalToolbar />

      {/* PATIENT BANNER - Vitals, Alerts, Active Episodes */}
      <PatientBanner />

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* MAIN WORK AREA - Focus Zone */}
        <MainWorkArea />

        {/* RIGHT NAV - Encounter Menu (Record Layer) */}
        <EncounterMenu />
      </div>
    </div>
  );
}
