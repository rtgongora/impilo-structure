import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  FileText,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface HomeMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  lastFilled?: string;
  source: "patient" | "pharmacy" | "ehr";
  status: "continue" | "hold" | "discontinue" | "modify" | "pending";
  notes?: string;
}

interface MedicationReconciliationProps {
  patientId: string;
  encounterId: string;
  transitionType: "admission" | "transfer" | "discharge";
}

export function MedicationReconciliation({
  patientId,
  encounterId,
  transitionType,
}: MedicationReconciliationProps) {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [homeMedications, setHomeMedications] = useState<HomeMedication[]>([]);
  const [inpatientMedications, setInpatientMedications] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState<HomeMedication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reconciliationComplete, setReconciliationComplete] = useState(false);

  // New medication form state
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFrequency, setNewMedFrequency] = useState("");
  const [newMedPrescriber, setNewMedPrescriber] = useState("");

  useEffect(() => {
    fetchMedications();
  }, [patientId, encounterId]);

  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      // Fetch current inpatient medication orders
      const { data: orders, error } = await supabase
        .from("medication_orders")
        .select("*")
        .eq("patient_id", patientId)
        .eq("encounter_id", encounterId)
        .in("status", ["active", "on_hold"]);

      if (error) throw error;
      setInpatientMedications(orders || []);

      // Mock home medications - in real app would come from pharmacy integration
      const mockHomeMeds: HomeMedication[] = [
        {
          id: "hm1",
          name: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily",
          prescriber: "Dr. Smith",
          lastFilled: "2024-01-15",
          source: "pharmacy",
          status: "pending",
        },
        {
          id: "hm2",
          name: "Lisinopril",
          dosage: "10mg",
          frequency: "Once daily",
          prescriber: "Dr. Johnson",
          lastFilled: "2024-01-10",
          source: "pharmacy",
          status: "pending",
        },
        {
          id: "hm3",
          name: "Aspirin",
          dosage: "81mg",
          frequency: "Once daily",
          source: "patient",
          status: "pending",
        },
      ];
      setHomeMedications(mockHomeMeds);
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast.error("Failed to load medications");
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedicationStatus = (
    medId: string,
    status: HomeMedication["status"],
    notes?: string
  ) => {
    setHomeMedications((prev) =>
      prev.map((med) =>
        med.id === medId ? { ...med, status, notes: notes || med.notes } : med
      )
    );
  };

  const addHomeMedication = () => {
    if (!newMedName || !newMedDosage || !newMedFrequency) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newMed: HomeMedication = {
      id: `hm-${Date.now()}`,
      name: newMedName,
      dosage: newMedDosage,
      frequency: newMedFrequency,
      prescriber: newMedPrescriber || undefined,
      source: "patient",
      status: "pending",
    };

    setHomeMedications((prev) => [...prev, newMed]);
    setShowAddDialog(false);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFrequency("");
    setNewMedPrescriber("");
    toast.success("Medication added to reconciliation list");
  };

  const completeReconciliation = async () => {
    const pendingMeds = homeMedications.filter((m) => m.status === "pending");
    if (pendingMeds.length > 0) {
      toast.error("Please reconcile all medications before completing");
      return;
    }

    setIsSubmitting(true);
    try {
      // In real app, would save reconciliation record to database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReconciliationComplete(true);
      toast.success("Medication reconciliation completed");
    } catch (error) {
      console.error("Error completing reconciliation:", error);
      toast.error("Failed to complete reconciliation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: HomeMedication["status"]) => {
    switch (status) {
      case "continue":
        return {
          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
          icon: CheckCircle,
          label: "Continue",
        };
      case "hold":
        return {
          color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
          icon: Clock,
          label: "Hold",
        };
      case "discontinue":
        return {
          color: "bg-destructive/10 text-destructive border-destructive/30",
          icon: XCircle,
          label: "Discontinue",
        };
      case "modify":
        return {
          color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
          icon: RefreshCw,
          label: "Modify",
        };
      default:
        return {
          color: "bg-muted text-muted-foreground",
          icon: AlertTriangle,
          label: "Pending",
        };
    }
  };

  const getSourceBadge = (source: HomeMedication["source"]) => {
    switch (source) {
      case "pharmacy":
        return <Badge variant="secondary">Pharmacy</Badge>;
      case "ehr":
        return <Badge variant="outline">EHR</Badge>;
      default:
        return <Badge variant="outline">Patient Reported</Badge>;
    }
  };

  const pendingCount = homeMedications.filter((m) => m.status === "pending").length;
  const reconciledCount = homeMedications.length - pendingCount;

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medication Reconciliation
              <Badge variant="outline" className="ml-2 capitalize">
                {transitionType}
              </Badge>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Med
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Reconciliation Progress</p>
                <p className="text-xs text-muted-foreground">
                  {reconciledCount} of {homeMedications.length} medications reconciled
                </p>
              </div>
            </div>
            {reconciliationComplete ? (
              <Badge className="bg-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline">{pendingCount} pending</Badge>
            )}
          </div>

          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="home">Home Medications</TabsTrigger>
              <TabsTrigger value="inpatient">Current Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-0">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {homeMedications.map((med) => {
                    const statusConfig = getStatusConfig(med.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={med.id}
                        className={`p-3 rounded-lg border ${statusConfig.color} transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center">
                              <Pill className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{med.name}</h4>
                                {getSourceBadge(med.source)}
                              </div>
                              <p className="text-sm opacity-80">
                                {med.dosage} • {med.frequency}
                              </p>
                              {med.prescriber && (
                                <p className="text-xs opacity-60">
                                  Prescribed by: {med.prescriber}
                                </p>
                              )}
                              {med.notes && (
                                <p className="text-xs mt-1 italic">{med.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {med.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMed(med);
                                  setShowReconcileDialog(true);
                                }}
                              >
                                Reconcile
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="inpatient" className="mt-0">
              <ScrollArea className="h-[350px]">
                {inpatientMedications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No current medication orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inpatientMedications.map((med) => (
                      <div
                        key={med.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Pill className="h-4 w-4 text-primary" />
                          <div>
                            <h4 className="font-medium">{med.medication_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} {med.dosage_unit} • {med.route} •{" "}
                              {med.frequency}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Complete Button */}
          <div className="pt-4 mt-4 border-t">
            <Button
              className="w-full"
              onClick={completeReconciliation}
              disabled={pendingCount > 0 || isSubmitting || reconciliationComplete}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : reconciliationComplete ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {reconciliationComplete
                ? "Reconciliation Complete"
                : `Complete Reconciliation (${pendingCount} pending)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Home Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Medication Name *</Label>
              <Input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Enter medication name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dosage *</Label>
                <Input
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Input
                  value={newMedFrequency}
                  onChange={(e) => setNewMedFrequency(e.target.value)}
                  placeholder="e.g., Twice daily"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prescriber (optional)</Label>
              <Input
                value={newMedPrescriber}
                onChange={(e) => setNewMedPrescriber(e.target.value)}
                placeholder="Enter prescriber name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addHomeMedication}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile Medication</DialogTitle>
          </DialogHeader>
          {selectedMed && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedMed.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMed.dosage} • {selectedMed.frequency}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>
                <Select
                  value={selectedMed.status}
                  onValueChange={(v) =>
                    updateMedicationStatus(
                      selectedMed.id,
                      v as HomeMedication["status"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continue">Continue</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="modify">Modify</SelectItem>
                    <SelectItem value="discontinue">Discontinue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add reconciliation notes..."
                  value={selectedMed.notes || ""}
                  onChange={(e) =>
                    updateMedicationStatus(
                      selectedMed.id,
                      selectedMed.status,
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMed?.status !== "pending") {
                  setShowReconcileDialog(false);
                  setSelectedMed(null);
                  toast.success("Medication reconciled");
                } else {
                  toast.error("Please select a decision");
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
