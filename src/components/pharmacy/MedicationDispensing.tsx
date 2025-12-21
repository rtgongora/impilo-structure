import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Pill, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Package,
  User,
  Clock,
  Printer,
  QrCode,
  Barcode,
  FileText,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface PrescriptionItem {
  id: string;
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  dispensedQuantity?: number;
  status: "pending" | "verified" | "dispensed" | "partial";
  stockLevel: number;
  batchNumber?: string;
  expiryDate?: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientMrn: string;
  prescribedBy: string;
  prescribedAt: string;
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "in-progress" | "completed" | "on-hold";
  items: PrescriptionItem[];
}

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "1",
    prescriptionNumber: "RX-2024-0001",
    patientName: "John Doe",
    patientMrn: "MRN-2024-000001",
    prescribedBy: "Dr. Smith",
    prescribedAt: "2024-01-15T09:30:00",
    priority: "routine",
    status: "pending",
    items: [
      {
        id: "1a",
        medicationName: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        dosage: "500mg",
        frequency: "TDS",
        duration: "7 days",
        quantity: 21,
        instructions: "Take with food",
        status: "pending",
        stockLevel: 150,
        batchNumber: "BTH-2024-001",
        expiryDate: "2025-06-30"
      },
      {
        id: "1b",
        medicationName: "Paracetamol 1g",
        genericName: "Paracetamol",
        dosage: "1g",
        frequency: "QID PRN",
        duration: "5 days",
        quantity: 20,
        instructions: "Maximum 4 doses per day",
        status: "pending",
        stockLevel: 500,
        batchNumber: "BTH-2024-002",
        expiryDate: "2025-12-31"
      }
    ]
  },
  {
    id: "2",
    prescriptionNumber: "RX-2024-0002",
    patientName: "Jane Smith",
    patientMrn: "MRN-2024-000002",
    prescribedBy: "Dr. Johnson",
    prescribedAt: "2024-01-15T10:15:00",
    priority: "urgent",
    status: "pending",
    items: [
      {
        id: "2a",
        medicationName: "Metformin 500mg",
        genericName: "Metformin",
        dosage: "500mg",
        frequency: "BD",
        duration: "30 days",
        quantity: 60,
        instructions: "Take with meals",
        status: "pending",
        stockLevel: 45,
        batchNumber: "BTH-2024-003",
        expiryDate: "2025-03-15"
      }
    ]
  },
  {
    id: "3",
    prescriptionNumber: "RX-2024-0003",
    patientName: "Robert Brown",
    patientMrn: "MRN-2024-000003",
    prescribedBy: "Dr. Williams",
    prescribedAt: "2024-01-15T11:00:00",
    priority: "stat",
    status: "pending",
    items: [
      {
        id: "3a",
        medicationName: "Adrenaline 1:1000",
        genericName: "Epinephrine",
        dosage: "1mg/mL",
        frequency: "STAT",
        duration: "Single dose",
        quantity: 1,
        instructions: "IM injection for anaphylaxis",
        status: "pending",
        stockLevel: 25,
        batchNumber: "BTH-2024-004",
        expiryDate: "2024-06-30"
      }
    ]
  }
];

export function MedicationDispensing() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [dispensingNotes, setDispensingNotes] = useState("");

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.patientMrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "bg-destructive text-destructive-foreground";
      case "urgent": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "in-progress": return "bg-primary text-primary-foreground";
      case "on-hold": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleVerifyItem = (itemId: string) => {
    if (!selectedPrescription) return;
    
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === selectedPrescription.id) {
        return {
          ...rx,
          items: rx.items.map(item => 
            item.id === itemId ? { ...item, status: "verified" as const } : item
          )
        };
      }
      return rx;
    }));
    
    setSelectedPrescription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, status: "verified" as const } : item
        )
      };
    });
    
    toast.success("Item verified");
  };

  const handleDispenseItem = (itemId: string, quantity: number) => {
    if (!selectedPrescription) return;
    
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === selectedPrescription.id) {
        return {
          ...rx,
          items: rx.items.map(item => 
            item.id === itemId ? { 
              ...item, 
              status: quantity >= item.quantity ? "dispensed" as const : "partial" as const,
              dispensedQuantity: quantity
            } : item
          )
        };
      }
      return rx;
    }));
    
    setSelectedPrescription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { 
            ...item, 
            status: quantity >= item.quantity ? "dispensed" as const : "partial" as const,
            dispensedQuantity: quantity
          } : item
        )
      };
    });
    
    toast.success(`Dispensed ${quantity} units`);
  };

  const handleCompletePrescription = () => {
    if (!selectedPrescription) return;
    
    const allDispensed = selectedPrescription.items.every(
      item => item.status === "dispensed" || item.status === "partial"
    );
    
    if (!allDispensed) {
      toast.error("Please dispense all items first");
      return;
    }
    
    setPrescriptions(prev => prev.map(rx => 
      rx.id === selectedPrescription.id ? { ...rx, status: "completed" as const } : rx
    ));
    
    toast.success("Prescription completed");
    setSelectedPrescription(null);
  };

  const handleBarcodeScan = () => {
    if (!barcodeInput) return;
    
    // Simulate barcode lookup
    toast.info(`Scanned: ${barcodeInput}`);
    setBarcodeInput("");
  };

  const handlePrintLabel = () => {
    toast.success("Printing medication label...");
  };

  return (
    <div className="h-full flex gap-4">
      {/* Queue Panel */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Dispensing Queue
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Rx#, patient, MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 p-4 pt-0">
              {filteredPrescriptions.map(rx => (
                <Card 
                  key={rx.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedPrescription?.id === rx.id ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedPrescription(rx)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{rx.prescriptionNumber}</p>
                        <p className="text-sm text-muted-foreground">{rx.patientName}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge className={getPriorityColor(rx.priority)} variant="secondary">
                          {rx.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rx.prescribedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{rx.items.length} items</span>
                    </div>
                    <Badge className={`mt-2 ${getStatusColor(rx.status)}`} variant="secondary">
                      {rx.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dispensing Workspace */}
      {selectedPrescription ? (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedPrescription.prescriptionNumber}</CardTitle>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedPrescription.patientName} ({selectedPrescription.patientMrn})
                  </span>
                  <span>Prescribed by {selectedPrescription.prescribedBy}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintLabel}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print Labels
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCompletePrescription}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <Tabs defaultValue="items" className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="items">Medication Items</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="counseling">Patient Counseling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="flex-1 overflow-auto">
                <div className="space-y-3">
                  {selectedPrescription.items.map(item => (
                    <Card key={item.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{item.medicationName}</h4>
                              <Badge variant="outline">{item.genericName}</Badge>
                              {item.stockLevel < item.quantity && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                              <div>
                                <span className="text-muted-foreground">Dosage:</span>
                                <p className="font-medium">{item.dosage}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Frequency:</span>
                                <p className="font-medium">{item.frequency}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <p className="font-medium">{item.duration}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quantity:</span>
                                <p className="font-medium">{item.quantity} units</p>
                              </div>
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">
                              <strong>Instructions:</strong> {item.instructions}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Batch: {item.batchNumber}
                              </span>
                              <span>Expires: {item.expiryDate}</span>
                              <span>Stock: {item.stockLevel} available</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge className={getStatusColor(item.status)} variant="secondary">
                              {item.status}
                            </Badge>
                            {item.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVerifyItem(item.id)}
                              >
                                Verify
                              </Button>
                            )}
                            {item.status === "verified" && (
                              <Button 
                                size="sm"
                                onClick={() => handleDispenseItem(item.id, item.quantity)}
                                disabled={item.stockLevel < item.quantity}
                              >
                                Dispense
                              </Button>
                            )}
                            {item.status === "dispensed" && (
                              <CheckCircle2 className="h-6 w-6 text-success" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="verification" className="flex-1">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Barcode Verification</h4>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Scan medication barcode..."
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                          className="pl-9"
                        />
                      </div>
                      <Button onClick={handleBarcodeScan}>
                        <QrCode className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-medium mb-2">Verification Checklist</h5>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Right Patient
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Right Medication
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Right Dose
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          Right Route
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          Right Time
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="counseling" className="flex-1">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Patient Counseling Notes</h4>
                    <div className="space-y-4">
                      <div>
                        <Label>Key Counseling Points</Label>
                        <ul className="mt-2 space-y-1 text-sm">
                          {selectedPrescription.items.map(item => (
                            <li key={item.id} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                              <span><strong>{item.medicationName}:</strong> {item.instructions}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          placeholder="Enter any additional counseling notes..."
                          value={dispensingNotes}
                          onChange={(e) => setDispensingNotes(e.target.value)}
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Patient Information Leaflet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Pill className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a prescription to begin dispensing</p>
            <p className="text-sm">Choose from the queue on the left</p>
          </div>
        </Card>
      )}
    </div>
  );
}
