import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pill,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Syringe,
  AlertTriangle,
  User,
  Scan,
  Pen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BarcodeScanner } from "./BarcodeScanner";
import { SignaturePad } from "./SignaturePad";

interface MedicationOrder {
  id: string;
  medication_name: string;
  generic_name: string | null;
  dosage: string;
  dosage_unit: string;
  route: string;
  frequency: string;
  status: string;
  start_date: string;
  is_prn: boolean | null;
  instructions: string | null;
  barcode: string | null;
}

interface MedicationAdministrationProps {
  patientId: string;
  encounterId: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "bg-emerald-500/10 text-emerald-500", label: "Active" },
  completed: { color: "bg-muted text-muted-foreground", label: "Completed" },
  discontinued: { color: "bg-destructive/10 text-destructive", label: "Discontinued" },
  on_hold: { color: "bg-amber-500/10 text-amber-500", label: "On Hold" },
};

export function MedicationAdministration({ patientId, encounterId }: MedicationAdministrationProps) {
  const { user, profile } = useAuth();
  const [medications, setMedications] = useState<MedicationOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  
  const [adminStatus, setAdminStatus] = useState<"given" | "not_given">("given");
  const [dosageGiven, setDosageGiven] = useState("");
  const [routeUsed, setRouteUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonNotGiven, setReasonNotGiven] = useState("");

  useEffect(() => {
    fetchMedications();
  }, [patientId, encounterId]);

  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("medication_orders")
        .select("*")
        .eq("patient_id", patientId)
        .eq("encounter_id", encounterId)
        .in("status", ["active", "on_hold"])
        .order("start_date", { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast.error("Failed to load medications");
    } finally {
      setIsLoading(false);
    }
  };

  const openAdminDialog = (med: MedicationOrder) => {
    setSelectedMed(med);
    setDosageGiven(`${med.dosage} ${med.dosage_unit}`);
    setRouteUsed(med.route);
    setAdminStatus("given");
    setNotes("");
    setReasonNotGiven("");
    setSignatureUrl(null);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeVerified = () => {
    setShowBarcodeScanner(false);
    setShowAdminDialog(true);
  };

  const proceedToSignature = () => {
    if (adminStatus === "given" && !dosageGiven) {
      toast.error("Please enter the dosage given");
      return;
    }
    if (adminStatus === "not_given" && !reasonNotGiven) {
      toast.error("Please provide a reason for not giving medication");
      return;
    }
    setShowAdminDialog(false);
    setShowSignaturePad(true);
  };

  const handleSignatureComplete = (url: string) => {
    setSignatureUrl(url);
    setShowSignaturePad(false);
    handleAdminister(url);
  };

  const handleAdminister = async (sigUrl?: string) => {
    if (!selectedMed || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("medication_administrations").insert({
        medication_order_id: selectedMed.id,
        encounter_id: encounterId,
        administered_by: user.id,
        status: adminStatus,
        dosage_given: adminStatus === "given" ? dosageGiven : selectedMed.dosage + " " + selectedMed.dosage_unit,
        route_used: routeUsed,
        notes: notes || null,
        reason_not_given: adminStatus === "not_given" ? reasonNotGiven : null,
        signature_url: sigUrl || signatureUrl,
      });
      if (error) throw error;
      toast.success(`${selectedMed.medication_name} administered and signed`);
      setSelectedMed(null);
      fetchMedications();
    } catch (error) {
      console.error("Error recording administration:", error);
      toast.error("Failed to record administration");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            Medication Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active medication orders</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {medications.map((med) => {
                  const statusInfo = statusConfig[med.status] || statusConfig.active;
                  return (
                    <div key={med.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Pill className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{med.medication_name}</h4>
                              {med.is_prn && <Badge variant="outline" className="text-xs">PRN</Badge>}
                              <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{med.dosage} {med.dosage_unit}</span>
                              <span>•</span>
                              <span>{med.route}</span>
                              <span>•</span>
                              <span>{med.frequency}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => openAdminDialog(med)} disabled={med.status !== "active"}>
                          <Scan className="h-4 w-4 mr-1" />
                          Administer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedMed && (
        <BarcodeScanner
          open={showBarcodeScanner}
          expectedBarcode={selectedMed.barcode || undefined}
          medicationName={selectedMed.medication_name}
          onVerified={handleBarcodeVerified}
          onCancel={() => { setShowBarcodeScanner(false); setSelectedMed(null); }}
        />
      )}

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5" />
              Record Administration
            </DialogTitle>
          </DialogHeader>
          {selectedMed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Medication Verified</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedMed.medication_name}</h4>
                <p className="text-sm text-muted-foreground">{selectedMed.dosage} {selectedMed.dosage_unit} • {selectedMed.route}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Nurse: <strong>{profile?.display_name || "Unknown"}</strong></span>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={adminStatus} onValueChange={(v) => setAdminStatus(v as "given" | "not_given")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="given">Given</SelectItem>
                    <SelectItem value="not_given">Not Given</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {adminStatus === "given" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input value={dosageGiven} onChange={(e) => setDosageGiven(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Route</Label>
                    <Input value={routeUsed} onChange={(e) => setRouteUsed(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Reason Not Given</Label>
                  <Textarea value={reasonNotGiven} onChange={(e) => setReasonNotGiven(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>Cancel</Button>
            <Button onClick={proceedToSignature}><Pen className="h-4 w-4 mr-2" />Sign & Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignaturePad
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSignatureComplete={handleSignatureComplete}
        nurseName={profile?.display_name || "Unknown"}
      />
    </>
  );
}
