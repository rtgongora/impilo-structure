import { WorkspaceData } from "@/types/ehr";
import { useEHR } from "@/contexts/EHRContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { TheatreWorkspace } from "./workspaces/TheatreWorkspace";
import { TraumaWorkspace } from "./workspaces/TraumaWorkspace";
import { LabourDeliveryWorkspace } from "./workspaces/LabourDeliveryWorkspace";
import { ResuscitationWorkspace } from "./workspaces/ResuscitationWorkspace";
import { MinorProcedureWorkspace } from "./workspaces/MinorProcedureWorkspace";
import { BurnsWorkspace } from "./workspaces/BurnsWorkspace";
import { ChemotherapyWorkspace } from "./workspaces/ChemotherapyWorkspace";
import { RadiotherapyWorkspace } from "./workspaces/RadiotherapyWorkspace";
import { DialysisWorkspace } from "./workspaces/DialysisWorkspace";
import { PhysiotherapyWorkspace } from "./workspaces/PhysiotherapyWorkspace";
import { PsychotherapyWorkspace } from "./workspaces/PsychotherapyWorkspace";
import { SexualAssaultWorkspace } from "./workspaces/SexualAssaultWorkspace";
import { PoisoningWorkspace } from "./workspaces/PoisoningWorkspace";
import { NeonatalResusWorkspace } from "./workspaces/NeonatalResusWorkspace";
import { AnaesthesiaPreOpWorkspace } from "./workspaces/AnaesthesiaPreOpWorkspace";
import { TeleconsultationWorkspace } from "./workspaces/TeleconsultationWorkspace";
import { VirtualCareWorkspace } from "./workspaces/VirtualCareWorkspace";

interface WorkspaceViewProps {
  workspace: WorkspaceData;
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const { closeWorkspace } = useEHR();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - workspace.startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [workspace.startTime]);

  const renderWorkspaceContent = () => {
    switch (workspace.type.toLowerCase()) {
      case "theatre":
        return <TheatreWorkspace />;
      case "trauma":
        return <TraumaWorkspace />;
      case "labour & delivery":
      case "labour_delivery":
        return <LabourDeliveryWorkspace />;
      case "resuscitation":
      case "code blue":
      case "code_blue":
      case "rapid_response":
        return <ResuscitationWorkspace />;
      case "minor procedure":
      case "minor_procedure":
        return <MinorProcedureWorkspace />;
      case "burns":
      case "burns care":
        return <BurnsWorkspace />;
      case "chemotherapy":
        return <ChemotherapyWorkspace />;
      case "radiotherapy":
        return <RadiotherapyWorkspace />;
      case "dialysis":
        return <DialysisWorkspace />;
      case "physiotherapy":
        return <PhysiotherapyWorkspace />;
      case "psychotherapy":
        return <PsychotherapyWorkspace />;
      case "sexual assault":
      case "sexual_assault":
        return <SexualAssaultWorkspace />;
      case "poisoning":
      case "overdose":
        return <PoisoningWorkspace />;
      case "neonatal resuscitation":
      case "neonatal_resus":
        return <NeonatalResusWorkspace />;
      case "anaesthesia pre-op":
      case "anaesthesia_preop":
        return <AnaesthesiaPreOpWorkspace />;
      case "teleconsultation":
        return <TeleconsultationWorkspace />;
      case "virtual care":
      case "virtual_care":
        return <VirtualCareWorkspace />;
      default:
        return (
          <div className="p-6 text-center text-muted-foreground">
            <p>Workspace template for "{workspace.type}" is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-workspace-bg">
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">{workspace.type} Workspace</h1>
            <div className="flex items-center gap-4 text-primary-foreground/80 text-sm mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Started: {workspace.startTime.toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {workspace.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm opacity-80">Elapsed Time</div>
            <div className="text-2xl font-mono font-semibold elapsed-time">{elapsedTime}</div>
          </div>
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            Active
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={closeWorkspace}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {renderWorkspaceContent()}
        </div>
      </div>
    </div>
  );
}
