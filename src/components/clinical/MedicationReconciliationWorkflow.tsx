/**
 * Medication Reconciliation Workflow
 * Full med rec process for admission/transfer/discharge
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play,
  FileCheck,
  Shield,
  ArrowRight,
} from "lucide-react";
import { 
  useMedicationReconciliation, 
  type HomeMedication, 
  type ReconciledMedication,
  type ReconciliationType,
  type MedicationSource,
} from "@/hooks/useMedicationReconciliation";

interface MedicationReconciliationWorkflowProps {
  encounterId: string;
  patientId: string;
  visitId?: string;
  performedBy: string;
}

export function MedicationReconciliationWorkflow({
  encounterId,
  patientId,
  visitId,
  performedBy,
}: MedicationReconciliationWorkflowProps) {
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [newMed, setNewMed] = useState<HomeMedication>({
    name: "",
    dose: "",
    frequency: "",
    route: "oral",
    indication: "",
  });
  const [reconciliationType, setReconciliationType] = useState<ReconciliationType>("admission");
  const [source, setSource] = useState<MedicationSource>("patient");

  const {
    reconciliation,
    isLoading,
    startReconciliation,
    updateHomeMedications,
    reconcileMedications,
    completeReconciliation,
    verifyReconciliation,
  } = useMedicationReconciliation(encounterId);

  const handleStartReconciliation = () => {
    startReconciliation.mutate({
      patient_id: patientId,
      encounter_id: encounterId,
      visit_id: visitId,
      reconciliation_type: reconciliationType,
      source,
      performed_by: performedBy,
    });
  };

  const handleAddMedication = () => {
    if (!reconciliation || !newMed.name) return;

    const updatedMeds = [...reconciliation.home_medications, newMed];
    updateHomeMedications.mutate({
      id: reconciliation.id,
      medications: updatedMeds,
      source,
    });
    setNewMed({ name: "", dose: "", frequency: "", route: "oral", indication: "" });
    setIsAddMedOpen(false);
  };

  const handleRemoveMedication = (index: number) => {
    if (!reconciliation) return;
    
    const updatedMeds = reconciliation.home_medications.filter((_, i) => i !== index);
    updateHomeMedications.mutate({
      id: reconciliation.id,
      medications: updatedMeds,
    });
  };

  const handleReconcileMed = (index: number, action: ReconciledMedication['action'], reason?: string) => {
    if (!reconciliation) return;

    const homeMed = reconciliation.home_medications[index];
    const reconciledMed: ReconciledMedication = {
      ...homeMed,
      action,
      reason,
    };

    const existing = [...reconciliation.reconciled_medications];
    const existingIndex = existing.findIndex(m => m.name === homeMed.name);
    
    if (existingIndex >= 0) {
      existing[existingIndex] = reconciledMed;
    } else {
      existing.push(reconciledMed);
    }

    reconcileMedications.mutate({
      id: reconciliation.id,
      reconciled: existing,
    });
  };

  const handleComplete = () => {
    if (!reconciliation) return;
    completeReconciliation.mutate({ id: reconciliation.id });
  };

  const handleVerify = () => {
    if (!reconciliation) return;
    verifyReconciliation.mutate({ id: reconciliation.id, verified_by: performedBy });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-success/10 text-success border-success/30";
      case "completed": return "bg-primary/10 text-primary border-primary/30";
      default: return "bg-warning/10 text-warning border-warning/30";
    }
  };

  const getActionColor = (action: ReconciledMedication['action']) => {
    switch (action) {
      case "continue": return "bg-success/10 text-success";
      case "discontinue": return "bg-destructive/10 text-destructive";
      case "modify": return "bg-warning/10 text-warning";
      case "hold": return "bg-orange-500/10 text-orange-600";
      case "substitute": return "bg-primary/10 text-primary";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No reconciliation started yet
  if (!reconciliation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start medication reconciliation to document and verify the patient's home medications.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reconciliation Type</Label>
              <Select value={reconciliationType} onValueChange={(v) => setReconciliationType(v as ReconciliationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="discharge">Discharge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Information Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as MedicationSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="caregiver">Caregiver</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="medical_record">Medical Record</SelectItem>
                  <SelectItem value="medication_list">Medication List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleStartReconciliation} disabled={startReconciliation.isPending}>
            {startReconciliation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Reconciliation
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active reconciliation
  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(reconciliation.status)}>
                {reconciliation.status === "verified" && <Shield className="h-3 w-3 mr-1" />}
                {reconciliation.status === "completed" && <FileCheck className="h-3 w-3 mr-1" />}
                {reconciliation.status.charAt(0).toUpperCase() + reconciliation.status.slice(1).replace("_", " ")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {reconciliation.reconciliation_type.charAt(0).toUpperCase() + reconciliation.reconciliation_type.slice(1)} Med Rec
              </span>
              <span className="text-sm text-muted-foreground">
                Source: {reconciliation.source}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {reconciliation.status === "in_progress" && (
                <Button onClick={handleComplete} disabled={completeReconciliation.isPending}>
                  {completeReconciliation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Complete
                </Button>
              )}
              {reconciliation.status === "completed" && (
                <Button onClick={handleVerify} disabled={verifyReconciliation.isPending}>
                  {verifyReconciliation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Verify
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Medications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Home Medications</CardTitle>
            {reconciliation.status === "in_progress" && (
              <Dialog open={isAddMedOpen} onOpenChange={setIsAddMedOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background">
                  <DialogHeader>
                    <DialogTitle>Add Home Medication</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Medication Name *</Label>
                      <Input
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                        placeholder="e.g., Metformin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dose</Label>
                        <Input
                          value={newMed.dose}
                          onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Input
                          value={newMed.frequency}
                          onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Route</Label>
                        <Select value={newMed.route} onValueChange={(v) => setNewMed({ ...newMed, route: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="oral">Oral</SelectItem>
                            <SelectItem value="iv">IV</SelectItem>
                            <SelectItem value="im">IM</SelectItem>
                            <SelectItem value="sc">Subcutaneous</SelectItem>
                            <SelectItem value="topical">Topical</SelectItem>
                            <SelectItem value="inhaled">Inhaled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Indication</Label>
                        <Input
                          value={newMed.indication}
                          onChange={(e) => setNewMed({ ...newMed, indication: e.target.value })}
                          placeholder="e.g., Diabetes"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMedOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddMedication} disabled={!newMed.name}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Indication</TableHead>
                  <TableHead>Action</TableHead>
                  {reconciliation.status === "in_progress" && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliation.home_medications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No home medications recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  reconciliation.home_medications.map((med, index) => {
                    const reconciled = reconciliation.reconciled_medications.find(m => m.name === med.name);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.dose || "—"}</TableCell>
                        <TableCell>{med.frequency || "—"}</TableCell>
                        <TableCell className="capitalize">{med.route || "—"}</TableCell>
                        <TableCell>{med.indication || "—"}</TableCell>
                        <TableCell>
                          {reconciliation.status === "in_progress" ? (
                            <Select
                              value={reconciled?.action || ""}
                              onValueChange={(v) => handleReconcileMed(index, v as ReconciledMedication['action'])}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="continue">Continue</SelectItem>
                                <SelectItem value="discontinue">Discontinue</SelectItem>
                                <SelectItem value="modify">Modify</SelectItem>
                                <SelectItem value="hold">Hold</SelectItem>
                                <SelectItem value="substitute">Substitute</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : reconciled ? (
                            <Badge className={getActionColor(reconciled.action)}>
                              {reconciled.action.charAt(0).toUpperCase() + reconciled.action.slice(1)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        {reconciliation.status === "in_progress" && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveMedication(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Discrepancies */}
      {reconciliation.discrepancies.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Discrepancies Found ({reconciliation.discrepancies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reconciliation.discrepancies.map((disc, index) => (
                <div key={index} className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{disc.medication}</span>
                    <Badge variant="outline" className="capitalize">
                      {disc.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{disc.description}</p>
                  {disc.resolved && (
                    <p className="text-sm text-success mt-1">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      Resolution: {disc.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
