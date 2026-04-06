import { useState } from "react";
import { OrderEntrySystem } from "@/components/orders/OrderEntrySystem";
import { PatientSelector } from "@/components/orders/PatientSelector";
import { PatientOrdersView } from "@/components/orders/PatientOrdersView";
import { MedicationAdministration } from "@/components/orders/MedicationAdministration";
import { MedicationTimeline } from "@/components/orders/MedicationTimeline";
import { MedicationReconciliation } from "@/components/orders/MedicationReconciliation";
import { MARTimelineView } from "@/components/orders/MARTimelineView";
import { EscalatingMedicationAlerts } from "@/components/alerts/EscalatingMedicationAlerts";
import { ProviderInbox } from "@/components/inbox/ProviderInbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList, Syringe, Timer, FileText, LayoutGrid, AlertTriangle, Inbox } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

interface SelectedPatient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  encounterId?: string;
}

const Orders = () => {
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <AppLayout title="Order Entry System">
      <div className="flex-1 flex flex-col min-h-0 p-6 overflow-auto">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Patient Selector Sidebar */}
          <div className="lg:col-span-1">
            <PatientSelector
              selectedPatientId={selectedPatient?.id || null}
              onSelectPatient={(patient) => setSelectedPatient(patient as SelectedPatient | null)}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="inbox">
                  <Inbox className="h-4 w-4 mr-2" />
                  Provider Inbox
                </TabsTrigger>
                <TabsTrigger value="new">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Orders
                </TabsTrigger>
                <TabsTrigger value="view" disabled={!selectedPatient}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View Orders
                </TabsTrigger>
                <TabsTrigger value="administer" disabled={!selectedPatient}>
                  <Syringe className="h-4 w-4 mr-2" />
                  Administer Meds
                </TabsTrigger>
                <TabsTrigger value="timeline" disabled={!selectedPatient}>
                  <Timer className="h-4 w-4 mr-2" />
                  Med Timeline
                </TabsTrigger>
                <TabsTrigger value="reconcile" disabled={!selectedPatient}>
                  <FileText className="h-4 w-4 mr-2" />
                  Reconciliation
                </TabsTrigger>
                <TabsTrigger value="mar">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  MAR View
                </TabsTrigger>
                <TabsTrigger value="critical">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Critical Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox">
                <ProviderInbox />
              </TabsContent>

              <TabsContent value="new">
                <OrderEntrySystem
                  patientId={selectedPatient?.id}
                  encounterId={undefined}
                />
              </TabsContent>

              <TabsContent value="view">
                {selectedPatient && (
                  <PatientOrdersView patientId={selectedPatient.id} />
                )}
              </TabsContent>

              <TabsContent value="administer">
                {selectedPatient && selectedPatient.encounterId && (
                  <MedicationAdministration
                    patientId={selectedPatient.id}
                    encounterId={selectedPatient.encounterId}
                  />
                )}
                {selectedPatient && !selectedPatient.encounterId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Syringe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active encounter for this patient</p>
                    <p className="text-sm">Medication administration requires an active encounter</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                {selectedPatient && selectedPatient.encounterId && (
                  <MedicationTimeline
                    patientId={selectedPatient.id}
                    encounterId={selectedPatient.encounterId}
                  />
                )}
                {selectedPatient && !selectedPatient.encounterId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active encounter for this patient</p>
                    <p className="text-sm">Medication timeline requires an active encounter</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reconcile">
                {selectedPatient && selectedPatient.encounterId && (
                  <MedicationReconciliation
                    patientId={selectedPatient.id}
                    encounterId={selectedPatient.encounterId}
                    transitionType="admission"
                  />
                )}
                {selectedPatient && !selectedPatient.encounterId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active encounter for this patient</p>
                    <p className="text-sm">Medication reconciliation requires an active encounter</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mar">
                <MARTimelineView />
              </TabsContent>

              <TabsContent value="critical">
                <EscalatingMedicationAlerts />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Orders;
