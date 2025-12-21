import { useState } from "react";
import { OrderEntrySystem } from "@/components/orders/OrderEntrySystem";
import { PatientSelector } from "@/components/orders/PatientSelector";
import { PatientOrdersView } from "@/components/orders/PatientOrdersView";
import { MedicationAdministration } from "@/components/orders/MedicationAdministration";
import { MedicationTimeline } from "@/components/orders/MedicationTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, ClipboardList, Syringe, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SelectedPatient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  encounterId?: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Order Entry System</h1>
        </div>
      </header>
      <main className="container mx-auto p-6">
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
              <TabsList className="mb-4">
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
              </TabsList>

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
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
