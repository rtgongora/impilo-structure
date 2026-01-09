import { TopBarAction, TOP_BAR_ACTIONS } from "@/types/ehr";
import { useEHR } from "@/contexts/EHRContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Boxes, Route, Package, Receipt, Plus, Pill, Calendar, CreditCard } from "lucide-react";
import { QueueManagement } from "./queue/QueueManagement";
import { BedManagement } from "./beds/BedManagement";
import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { MedicationDispensing } from "@/components/pharmacy/MedicationDispensing";
import { TheatreBookingSystem } from "@/components/booking/TheatreBookingSystem";
import { PaymentGateway } from "@/components/payments/PaymentGateway";

interface TopBarPanelProps {
  action: TopBarAction;
}

const WORKSPACES = [
  { id: "theatre", name: "Theatre", description: "Surgical procedures" },
  { id: "labour", name: "Labour & Delivery", description: "Obstetric care" },
  { id: "trauma", name: "Trauma", description: "Trauma resuscitation" },
  { id: "resuscitation", name: "Resuscitation", description: "Code Blue / Rapid Response" },
  { id: "burns", name: "Burns Care", description: "Burns management" },
  { id: "procedure", name: "Minor Procedure", description: "Minor procedures" },
  { id: "chemotherapy", name: "Chemotherapy", description: "Cancer treatment cycles" },
  { id: "radiotherapy", name: "Radiotherapy", description: "Radiation therapy" },
  { id: "dialysis", name: "Dialysis", description: "Renal replacement therapy" },
  { id: "physiotherapy", name: "Physiotherapy", description: "Physical rehabilitation" },
  { id: "psychotherapy", name: "Psychotherapy", description: "Mental health therapy" },
  { id: "sexual_assault", name: "Sexual Assault", description: "Forensic examination" },
  { id: "poisoning", name: "Poisoning", description: "Overdose management" },
  { id: "neonatal_resus", name: "Neonatal Resuscitation", description: "Newborn resuscitation" },
  { id: "anaesthesia_preop", name: "Anaesthesia Pre-Op", description: "Pre-operative assessment" },
  { id: "teleconsultation", name: "Teleconsultation", description: "Remote specialist consultation" },
  { id: "virtual_care", name: "Virtual Care", description: "Telemedicine patient visits" },
];

const CARE_PATHWAYS = [
  { id: "anc", name: "Antenatal Care (ANC)", description: "Pregnancy monitoring" },
  { id: "hiv", name: "HIV Care", description: "HIV management programme" },
  { id: "tb", name: "TB Treatment", description: "Tuberculosis management" },
  { id: "ncd", name: "NCD Management", description: "Chronic disease care" },
  { id: "immunization", name: "Immunization", description: "Vaccination schedules" },
];

export function TopBarPanel({ action }: TopBarPanelProps) {
  const { setActiveTopBarAction, openWorkspace } = useEHR();
  const actionConfig = TOP_BAR_ACTIONS.find((a) => a.id === action);

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
        return (
          <div className="grid grid-cols-3 gap-4">
            {WORKSPACES.map((ws) => (
              <Card
                key={ws.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                onClick={() => openWorkspace(ws.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Boxes className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{ws.name}</h3>
                      <p className="text-sm text-muted-foreground">{ws.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "pathways":
        return (
          <div className="grid grid-cols-3 gap-4">
            {CARE_PATHWAYS.map((pathway) => (
              <Card
                key={pathway.id}
                className="cursor-pointer hover:border-accent hover:shadow-md transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Route className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{pathway.name}</h3>
                      <p className="text-sm text-muted-foreground">{pathway.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <p className="text-sm text-muted-foreground">Select an option or review current items</p>
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
