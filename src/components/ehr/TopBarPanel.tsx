import { TopBarAction, TOP_BAR_ACTIONS } from "@/types/ehr";
import { useEHR } from "@/contexts/EHRContext";
import { useFacilityCapabilities } from "@/contexts/FacilityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, MapPin, Route, Package, Receipt, Plus, AlertTriangle, Activity, Stethoscope, Calendar, Lock } from "lucide-react";
import { QueueManagement } from "./queue/QueueManagement";
import { BedManagement } from "./beds/BedManagement";
import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { MedicationDispensing } from "@/components/pharmacy/MedicationDispensing";
import { TheatreBookingSystem } from "@/components/booking/TheatreBookingSystem";
import { PaymentGateway } from "@/components/payments/PaymentGateway";
import { Badge } from "@/components/ui/badge";
import { 
  getAvailablePhysicalWorkspaces,
  getAvailableEmergencyProtocols,
  getAvailableTreatmentWorkflows,
  getAvailableLongitudinalProgrammes,
  type CarePathway 
} from "@/types/clinicalSpaces";

interface TopBarPanelProps {
  action: TopBarAction;
}

const getCategoryIcon = (category: CarePathway["category"]) => {
  switch (category) {
    case "emergency_protocol":
      return <AlertTriangle className="w-5 h-5" />;
    case "treatment_workflow":
      return <Activity className="w-5 h-5" />;
    case "procedure_workflow":
      return <Stethoscope className="w-5 h-5" />;
    case "longitudinal_programme":
      return <Calendar className="w-5 h-5" />;
    default:
      return <Route className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: CarePathway["category"]) => {
  switch (category) {
    case "emergency_protocol":
      return "bg-destructive/10 text-destructive";
    case "treatment_workflow":
      return "bg-primary/10 text-primary";
    case "procedure_workflow":
      return "bg-accent/10 text-accent-foreground";
    case "longitudinal_programme":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary/10 text-secondary-foreground";
  }
};

export function TopBarPanel({ action }: TopBarPanelProps) {
  const { setActiveTopBarAction, openWorkspace, activateCriticalEvent } = useEHR();
  const { capabilities, levelOfCare } = useFacilityCapabilities();
  const actionConfig = TOP_BAR_ACTIONS.find((a) => a.id === action);

  // Get facility-filtered workspaces and pathways
  const availableWorkspaces = getAvailablePhysicalWorkspaces(capabilities, levelOfCare);
  const emergencyProtocols = getAvailableEmergencyProtocols(capabilities, levelOfCare);
  const treatmentWorkflows = getAvailableTreatmentWorkflows(capabilities, levelOfCare);
  const longitudinalProgrammes = getAvailableLongitudinalProgrammes(capabilities, levelOfCare);

  const handlePathwayActivation = (pathway: CarePathway) => {
    if (pathway.isEmergency) {
      // Map to critical event type
      const eventTypeMap: Record<string, string> = {
        code_blue: "code_blue",
        rapid_response: "rapid_response",
        trauma_activation: "trauma",
        neonatal_resuscitation: "neonatal_resus",
        obstetric_emergency: "obstetric_emergency",
        stroke_code: "stroke_code",
        stemi_code: "stemi_code",
      };
      activateCriticalEvent(eventTypeMap[pathway.id] as any, `Activated from pathway selector`);
    } else {
      // Open as workspace/pathway overlay
      openWorkspace(pathway.name);
    }
    setActiveTopBarAction(null);
  };

  const renderContent = () => {
    switch (action) {
      case "queue":
        return <QueueManagement />;
      case "beds":
        return <BedManagement />;
      case "handoff":
        return <ShiftHandoffReport />;
      case "pharmacy":
        return <MedicationDispensing />;
      case "theatre":
        return <TheatreBookingSystem />;
      case "payments":
        return <PaymentGateway />;
      
      case "workspaces":
        // Physical Workspaces - actual locations (filtered by facility capabilities)
        const highAcuityWorkspaces = availableWorkspaces.filter(ws => ws.category === "high_acuity");
        const specialtyWorkspaces = availableWorkspaces.filter(ws => ws.category === "specialty");
        const generalWorkspaces = availableWorkspaces.filter(ws => ws.category === "general");
        
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Physical Workspaces</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Locations available at this facility based on its capabilities
              </p>
            </div>
            
            {/* High Acuity Spaces */}
            {highAcuityWorkspaces.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">High Acuity</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {highAcuityWorkspaces.map((ws) => (
                    <Card
                      key={ws.id}
                      className="cursor-pointer hover:border-destructive hover:shadow-md transition-all border-l-4 border-l-destructive"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{ws.name}</h3>
                            <p className="text-xs text-muted-foreground">{ws.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Specialty Spaces */}
            {specialtyWorkspaces.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Specialty</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {specialtyWorkspaces.map((ws) => (
                    <Card
                      key={ws.id}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{ws.name}</h3>
                            <p className="text-xs text-muted-foreground">{ws.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* General Spaces */}
            {generalWorkspaces.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">General</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {generalWorkspaces.map((ws) => (
                    <Card
                      key={ws.id}
                      className="cursor-pointer hover:border-accent hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{ws.name}</h3>
                            <p className="text-xs text-muted-foreground">{ws.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {availableWorkspaces.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No workspaces available at this facility level</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "pathways":
        // Care Pathways - clinical workflows (filtered by facility capabilities)
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Care Pathways</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Clinical workflows available at this facility based on its capabilities
              </p>
            </div>
            
            {/* Emergency Protocols */}
            {emergencyProtocols.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span>Emergency Protocols</span>
                  <Badge variant="destructive" className="text-xs">Critical Events</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {emergencyProtocols.map((pathway) => (
                    <Card
                      key={pathway.id}
                      className="cursor-pointer hover:border-destructive hover:shadow-md transition-all border-l-4 border-l-destructive bg-destructive/5"
                      onClick={() => handlePathwayActivation(pathway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{pathway.name}</h3>
                            <p className="text-xs text-muted-foreground">{pathway.description}</p>
                            {pathway.teamRequired && (
                              <p className="text-xs text-destructive mt-1">
                                Team: {pathway.teamRequired.length} roles
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Treatment & Procedure Workflows */}
            {treatmentWorkflows.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Treatment & Procedure Workflows</span>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {treatmentWorkflows.map((pathway) => (
                    <Card
                      key={pathway.id}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handlePathwayActivation(pathway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(pathway.category)}`}>
                            {getCategoryIcon(pathway.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{pathway.name}</h3>
                            <p className="text-xs text-muted-foreground">{pathway.description}</p>
                            {pathway.typicalDuration && (
                              <p className="text-xs text-primary mt-1">~{pathway.typicalDuration}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Longitudinal Programmes */}
            {longitudinalProgrammes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Longitudinal Programmes</span>
                  <Badge variant="outline" className="text-xs">Reshapes Encounter</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {longitudinalProgrammes.map((pathway) => (
                    <Card
                      key={pathway.id}
                      className="cursor-pointer hover:border-accent hover:shadow-md transition-all"
                      onClick={() => handlePathwayActivation(pathway)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{pathway.name}</h3>
                            <p className="text-xs text-muted-foreground">{pathway.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no pathways available */}
            {emergencyProtocols.length === 0 && treatmentWorkflows.length === 0 && longitudinalProgrammes.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No care pathways available at this facility level</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "consumables":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Consumables used in current encounter</p>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Consumable
              </Button>
            </div>
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                No consumables recorded for this encounter
              </CardContent>
            </Card>
          </div>
        );

      case "charges":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Charges are automatically generated from orders, procedures, and consumables
            </p>
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                No charges generated yet
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel Header */}
      <header className="bg-workspace-header border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{actionConfig?.label}</h1>
          <p className="text-sm text-muted-foreground">
            {action === "workspaces" && "Physical locations where clinical work takes place"}
            {action === "pathways" && "Clinical workflows activatable from any workspace"}
            {action !== "workspaces" && action !== "pathways" && "Select an option or review current items"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setActiveTopBarAction(null)}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
    </div>
  );
}