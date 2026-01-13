import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Pill,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  ShoppingCart,
  Bell,
  History,
  FileText,
  ChevronRight,
  Package,
  Store
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  refillsRemaining: number;
  daysSupplyRemaining: number;
  status: "active" | "expired" | "pending-refill" | "discontinued";
  instructions?: string;
  allergies?: string[];
}

interface Prescription {
  id: string;
  rxNumber: string;
  medications: string[];
  prescribedDate: string;
  prescribedBy: string;
  status: "issued" | "pending" | "dispensed" | "delivered" | "expired";
  pharmacy?: string;
  estimatedReady?: string;
}

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "1",
    name: "Metformin 500mg",
    dosage: "500mg",
    frequency: "Twice daily with meals",
    prescribedBy: "Dr. Smith",
    prescribedDate: "2024-01-01",
    refillsRemaining: 2,
    daysSupplyRemaining: 15,
    status: "active",
    instructions: "Take with food to reduce stomach upset"
  },
  {
    id: "2",
    name: "Lisinopril 10mg",
    dosage: "10mg",
    frequency: "Once daily in the morning",
    prescribedBy: "Dr. Johnson",
    prescribedDate: "2024-01-01",
    refillsRemaining: 0,
    daysSupplyRemaining: 3,
    status: "pending-refill",
    instructions: "Take at the same time each day"
  },
  {
    id: "3",
    name: "Atorvastatin 20mg",
    dosage: "20mg",
    frequency: "Once daily at bedtime",
    prescribedBy: "Dr. Johnson",
    prescribedDate: "2023-12-01",
    refillsRemaining: 1,
    daysSupplyRemaining: 45,
    status: "active",
    instructions: "Best taken at night for optimal effect"
  },
  {
    id: "4",
    name: "Aspirin 81mg",
    dosage: "81mg",
    frequency: "Once daily",
    prescribedBy: "Dr. Johnson",
    prescribedDate: "2023-10-15",
    refillsRemaining: 5,
    daysSupplyRemaining: 60,
    status: "active"
  }
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "1",
    rxNumber: "RX-2024-0123",
    medications: ["Lisinopril 10mg x 30"],
    prescribedDate: "2024-01-18",
    prescribedBy: "Dr. Johnson",
    status: "issued",
    estimatedReady: "Ready for pickup"
  },
  {
    id: "2",
    rxNumber: "RX-2024-0089",
    medications: ["Metformin 500mg x 60", "Atorvastatin 20mg x 30"],
    prescribedDate: "2024-01-01",
    prescribedBy: "Dr. Smith",
    status: "dispensed",
    pharmacy: "City Pharmacy"
  }
];

const MOCK_PHARMACIES = [
  { id: "1", name: "City Pharmacy", distance: "0.5 km", inStock: true, price: 15.00 },
  { id: "2", name: "MedPlus Pharmacy", distance: "1.2 km", inStock: true, price: 12.50 },
  { id: "3", name: "HealthMart", distance: "2.0 km", inStock: false, price: 14.00 },
];

export function PortalMedications() {
  const [reminders, setReminders] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);

  const urgentRefills = MOCK_MEDICATIONS.filter(m => m.daysSupplyRemaining <= 7 && m.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            My Medications
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage prescriptions, refills, and reminders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Reminders</span>
          <Switch checked={reminders} onCheckedChange={setReminders} />
        </div>
      </div>

      {/* Urgent Refill Alert */}
      {urgentRefills.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium">Refill Needed Soon</p>
                <p className="text-sm text-muted-foreground">
                  {urgentRefills.length} medication(s) running low
                </p>
              </div>
              <Button size="sm">Request Refills</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Medications</TabsTrigger>
          <TabsTrigger value="prescriptions">ePrescriptions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
        </TabsList>

        {/* Current Medications */}
        <TabsContent value="current" className="space-y-4">
          <div className="grid gap-4">
            {MOCK_MEDICATIONS.filter(m => m.status !== "discontinued").map(med => (
              <Card key={med.id} className={med.status === "pending-refill" ? "border-warning/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        med.status === "pending-refill" ? "bg-warning/10" : "bg-primary/10"
                      }`}>
                        <Pill className={`h-5 w-5 ${
                          med.status === "pending-refill" ? "text-warning" : "text-primary"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{med.name}</p>
                          <Badge variant={med.status === "active" ? "default" : "secondary"}>
                            {med.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{med.frequency}</p>
                        {med.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Prescribed by {med.prescribedBy}</span>
                          <span>{med.refillsRemaining} refills left</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{med.daysSupplyRemaining} days left</span>
                      </div>
                      <Progress 
                        value={(med.daysSupplyRemaining / 30) * 100} 
                        className={`h-2 w-24 ${med.daysSupplyRemaining <= 7 ? "[&>div]:bg-warning" : ""}`}
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="mt-2">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refill
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Request Refill</DialogTitle>
                            <DialogDescription>
                              Choose a pharmacy for {med.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 mt-4">
                            {MOCK_PHARMACIES.map(pharmacy => (
                              <div 
                                key={pharmacy.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedPharmacy === pharmacy.id ? "border-primary bg-primary/5" : ""
                                } ${!pharmacy.inStock ? "opacity-50" : ""}`}
                                onClick={() => pharmacy.inStock && setSelectedPharmacy(pharmacy.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Store className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{pharmacy.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {pharmacy.distance} away
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">${pharmacy.price.toFixed(2)}</p>
                                    <Badge variant={pharmacy.inStock ? "default" : "secondary"}>
                                      {pharmacy.inStock ? "In Stock" : "Out of Stock"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button className="flex-1" disabled={!selectedPharmacy}>
                              <Truck className="h-4 w-4 mr-2" />
                              Request Delivery
                            </Button>
                            <Button variant="outline" className="flex-1" disabled={!selectedPharmacy}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Pickup
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ePrescriptions */}
        <TabsContent value="prescriptions" className="space-y-4">
          {MOCK_PRESCRIPTIONS.map(rx => (
            <Card key={rx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      rx.status === "issued" ? "bg-primary/10" :
                      rx.status === "dispensed" ? "bg-success/10" : "bg-muted"
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        rx.status === "issued" ? "text-primary" :
                        rx.status === "dispensed" ? "text-success" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{rx.rxNumber}</p>
                        <Badge variant={
                          rx.status === "issued" ? "default" :
                          rx.status === "dispensed" ? "secondary" : "outline"
                        }>
                          {rx.status}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        {rx.medications.map((med, i) => (
                          <p key={i} className="text-sm text-muted-foreground">{med}</p>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Prescribed: {rx.prescribedDate}</span>
                        <span>By: {rx.prescribedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {rx.pharmacy && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {rx.pharmacy}
                      </p>
                    )}
                    {rx.estimatedReady && (
                      <Badge variant="outline" className="text-xs">
                        {rx.estimatedReady}
                      </Badge>
                    )}
                    {rx.status === "issued" && (
                      <Button size="sm" className="mt-2">
                        Choose Pharmacy
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Medication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                View your complete medication history including discontinued and past medications.
              </p>
              <Button variant="outline" className="w-full">Load History</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies */}
        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Known Allergies & Intolerances
              </CardTitle>
              <CardDescription>
                These are recorded in your medical history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div>
                  <p className="font-medium">Penicillin</p>
                  <p className="text-sm text-muted-foreground">Severe allergic reaction - Anaphylaxis</p>
                </div>
                <Badge variant="destructive">Severe</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium">Sulfa drugs</p>
                  <p className="text-sm text-muted-foreground">Skin rash</p>
                </div>
                <Badge variant="secondary">Moderate</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Ibuprofen</p>
                  <p className="text-sm text-muted-foreground">GI upset</p>
                </div>
                <Badge variant="outline">Mild</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report New Allergy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
