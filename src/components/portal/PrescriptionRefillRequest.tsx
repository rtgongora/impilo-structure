import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Pill, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Building2,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  lastFilled: string;
  refillsRemaining: number;
  daysSupply: number;
  pharmacy: string;
}

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "1",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    prescribedBy: "Dr. Smith",
    lastFilled: "2024-12-15",
    refillsRemaining: 2,
    daysSupply: 30,
    pharmacy: "Impilo Pharmacy - Main"
  },
  {
    id: "2",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    prescribedBy: "Dr. Johnson",
    lastFilled: "2024-12-01",
    refillsRemaining: 0,
    daysSupply: 30,
    pharmacy: "Impilo Pharmacy - Main"
  },
  {
    id: "3",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily at bedtime",
    prescribedBy: "Dr. Moyo",
    lastFilled: "2024-12-20",
    refillsRemaining: 3,
    daysSupply: 90,
    pharmacy: "Impilo Pharmacy - East"
  }
];

const PHARMACIES = [
  { id: "1", name: "Impilo Pharmacy - Main", address: "123 Health St, Harare" },
  { id: "2", name: "Impilo Pharmacy - East", address: "456 Medical Ave, Harare" },
  { id: "3", name: "City Pharmacy", address: "789 Central Rd, Harare" },
];

export function PrescriptionRefillRequest() {
  const { toast } = useToast();
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [selectedPharmacy, setSelectedPharmacy] = useState("1");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "options" | "confirm" | "success">("select");

  const handleMedToggle = (medId: string) => {
    setSelectedMeds(prev => 
      prev.includes(medId) 
        ? prev.filter(id => id !== medId)
        : [...prev, medId]
    );
  };

  const selectedMedications = MOCK_MEDICATIONS.filter(m => selectedMeds.includes(m.id));

  const handleSubmit = () => {
    setStep("success");
    toast({
      title: "Refill Request Submitted",
      description: `${selectedMeds.length} medication(s) requested for refill`,
    });
  };

  if (step === "success") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Refill Request Submitted!</h3>
          <p className="text-muted-foreground mb-6">
            Your prescription refill request has been sent. You'll receive a notification when it's ready.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm font-medium mb-2">Request Summary</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{selectedMeds.length} medication(s) requested</p>
              <p>Delivery: {deliveryMethod === "pickup" ? "Pharmacy Pickup" : "Home Delivery"}</p>
              <p>Estimated ready: Within 24-48 hours</p>
            </div>
          </div>
          <Button onClick={() => {
            setStep("select");
            setSelectedMeds([]);
          }}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Request Prescription Refill
        </CardTitle>
        <CardDescription>
          {step === "select" && "Select medications to refill"}
          {step === "options" && "Choose delivery options"}
          {step === "confirm" && "Review and confirm your request"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "select" && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {MOCK_MEDICATIONS.map((med) => {
                const needsRenewal = med.refillsRemaining === 0;
                const isSelected = selectedMeds.includes(med.id);
                
                return (
                  <div
                    key={med.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-all",
                      isSelected && "border-primary bg-primary/5",
                      needsRenewal && "border-warning/50"
                    )}
                    onClick={() => !needsRenewal && handleMedToggle(med.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={needsRenewal}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{med.name} {med.dosage}</p>
                          {needsRenewal ? (
                            <Badge variant="outline" className="text-warning border-warning">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Needs Renewal
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {med.refillsRemaining} refills left
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{med.frequency}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last filled: {med.lastFilled}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {med.prescribedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    {needsRenewal && (
                      <p className="text-xs text-warning mt-2 pl-7">
                        This prescription requires renewal by your provider
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {step === "options" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Delivery Method</Label>
              <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "pickup" | "delivery")}>
                <div className={cn(
                  "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer",
                  deliveryMethod === "pickup" && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Pharmacy Pickup</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pick up at your preferred pharmacy
                    </p>
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer mt-2",
                  deliveryMethod === "delivery" && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Home Delivery</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Delivered to your registered address
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {deliveryMethod === "pickup" && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Pharmacy</Label>
                <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pharmacy" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHARMACIES.map((pharm) => (
                      <SelectItem key={pharm.id} value={pharm.id}>
                        <div>
                          <p className="font-medium">{pharm.name}</p>
                          <p className="text-xs text-muted-foreground">{pharm.address}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any special instructions or notes for the pharmacist..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Medications to Refill</p>
              <div className="space-y-2">
                {selectedMedications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      {med.name} {med.dosage}
                    </span>
                    <span className="text-muted-foreground">{med.daysSupply} day supply</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Delivery Details</p>
              <div className="text-sm text-muted-foreground">
                {deliveryMethod === "pickup" ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {PHARMACIES.find(p => p.id === selectedPharmacy)?.name}
                      </p>
                      <p>{PHARMACIES.find(p => p.id === selectedPharmacy)?.address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-0.5" />
                    <p>Home delivery to registered address</p>
                  </div>
                )}
              </div>
            </div>

            {notes && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        {step !== "select" && (
          <Button variant="outline" onClick={() => setStep(step === "confirm" ? "options" : "select")}>
            Back
          </Button>
        )}
        {step === "select" && (
          <Button 
            className="ml-auto" 
            disabled={selectedMeds.length === 0}
            onClick={() => setStep("options")}
          >
            Continue ({selectedMeds.length} selected)
          </Button>
        )}
        {step === "options" && (
          <Button onClick={() => setStep("confirm")}>
            Review Request
          </Button>
        )}
        {step === "confirm" && (
          <Button onClick={handleSubmit}>
            Submit Refill Request
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
