import { useState } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  
  // Administration form state
  const [adminStatus, setAdminStatus] = useState<"given" | "not_given">("given");
  const [dosageGiven, setDosageGiven] = useState("");
  const [routeUsed, setRouteUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonNotGiven, setReasonNotGiven] = useState("");

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

  useState(() => {
    fetchMedications();
  });

  const openAdminDialog = (med: MedicationOrder) => {
    setSelectedMed(med);
    setDosageGiven(`${med.dosage} ${med.dosage_unit}`);
    setRouteUsed(med.route);
    setAdminStatus("given");
    setNotes("");
    setReasonNotGiven("");
    setShowAdminDialog(true);
  };

  const handleAdminister = async () => {
    if (!selectedMed || !user) return;

    if (adminStatus === "given" && !dosageGiven) {
      toast.error("Please enter the dosage given");
      return;
    }

    if (adminStatus === "not_given" && !reasonNotGiven) {
      toast.error("Please provide a reason for not giving medication");
      return;
    }

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
      });

      if (error) throw error;

      toast.success(
        adminStatus === "given" 
          ? `${selectedMed.medication_name} administered successfully` 
          : "Administration recorded as not given"
      );
      setShowAdminDialog(false);
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
                    <div
                      key={med.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Pill className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{med.medication_name}</h4>
                              {med.is_prn && (
                                <Badge variant="outline" className="text-xs">PRN</Badge>
                              )}
                              <Badge variant="outline" className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            {med.generic_name && (
                              <p className="text-xs text-muted-foreground">{med.generic_name}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{med.dosage} {med.dosage_unit}</span>
                              <span>•</span>
                              <span>{med.route}</span>
                              <span>•</span>
                              <span>{med.frequency}</span>
                            </div>
                            {med.instructions && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {med.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => openAdminDialog(med)}
                          disabled={med.status !== "active"}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
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

      {/* Administration Dialog */}
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
              {/* Medication Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedMed.medication_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMed.dosage} {selectedMed.dosage_unit} • {selectedMed.route} • {selectedMed.frequency}
                </p>
              </div>

              {/* Nurse Info */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Administering Nurse: <strong>{profile?.display_name || "Unknown"}</strong></span>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label>Administration Status</Label>
                <Select value={adminStatus} onValueChange={(v) => setAdminStatus(v as "given" | "not_given")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="given">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Given
                      </div>
                    </SelectItem>
                    <SelectItem value="not_given">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        Not Given
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adminStatus === "given" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dosage Given</Label>
                      <Input
                        value={dosageGiven}
                        onChange={(e) => setDosageGiven(e.target.value)}
                        placeholder="e.g., 500 mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Route Used</Label>
                      <Input
                        value={routeUsed}
                        onChange={(e) => setRouteUsed(e.target.value)}
                        placeholder="e.g., PO, IV"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any observations or notes..."
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Reason Not Given
                  </Label>
                  <Textarea
                    value={reasonNotGiven}
                    onChange={(e) => setReasonNotGiven(e.target.value)}
                    placeholder="Patient refused, NPO status, adverse reaction, etc."
                    rows={3}
                  />
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time: {new Date().toLocaleString()}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdminister} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Administration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
