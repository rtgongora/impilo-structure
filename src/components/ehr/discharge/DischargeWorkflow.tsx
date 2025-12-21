import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Home,
  Pill,
  Calendar,
  FileText,
  AlertTriangle,
  User,
  Phone,
  Printer,
  Send,
  Clock,
  ClipboardCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

interface DischargeWorkflowProps {
  encounterId: string;
  patientName: string;
  mrn: string;
  ward?: string;
  bed?: string;
  onComplete?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  category: "clinical" | "admin" | "education";
  required: boolean;
  completed: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "dx", label: "Discharge diagnoses documented", category: "clinical", required: true, completed: false },
  { id: "summary", label: "Discharge summary completed", category: "clinical", required: true, completed: false },
  { id: "meds", label: "Medication reconciliation complete", category: "clinical", required: true, completed: false },
  { id: "rx", label: "Prescriptions ordered/dispensed", category: "clinical", required: true, completed: false },
  { id: "vitals", label: "Final vital signs documented", category: "clinical", required: false, completed: false },
  { id: "labs", label: "Pending lab results reviewed", category: "clinical", required: false, completed: false },
  { id: "education", label: "Patient/family education provided", category: "education", required: true, completed: false },
  { id: "instructions", label: "Discharge instructions explained", category: "education", required: true, completed: false },
  { id: "warning", label: "Warning signs discussed", category: "education", required: true, completed: false },
  { id: "followup", label: "Follow-up appointments scheduled", category: "admin", required: true, completed: false },
  { id: "transport", label: "Transport arrangements confirmed", category: "admin", required: false, completed: false },
  { id: "billing", label: "Billing/financial clearance", category: "admin", required: false, completed: false },
  { id: "docs", label: "Discharge documents prepared", category: "admin", required: true, completed: false },
  { id: "sign", label: "Patient signed discharge papers", category: "admin", required: true, completed: false },
];

export function DischargeWorkflow({
  encounterId,
  patientName,
  mrn,
  ward,
  bed,
  onComplete,
}: DischargeWorkflowProps) {
  const [open, setOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const completedCount = checklist.filter((item) => item.completed).length;
  const requiredCount = checklist.filter((item) => item.required).length;
  const requiredCompleted = checklist.filter((item) => item.required && item.completed).length;
  const progress = (completedCount / checklist.length) * 100;
  const canDischarge = requiredCompleted === requiredCount;

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDischarge = async () => {
    if (!canDischarge) {
      toast.error("Please complete all required items before discharge");
      return;
    }

    setIsProcessing(true);
    try {
      // Update encounter status to discharged
      const { error } = await supabase
        .from("encounters")
        .update({
          status: "discharged",
          discharge_date: new Date().toISOString(),
          notes: dischargeNotes || undefined,
        })
        .eq("id", encounterId);

      if (error) throw error;

      // If there's a bed assigned, free it up
      if (bed && ward) {
        await supabase
          .from("beds")
          .update({
            status: "available",
            patient_id: null,
            patient_name: null,
            patient_mrn: null,
            diagnosis: null,
            admission_date: null,
          })
          .eq("bed_number", bed)
          .eq("ward_name", ward);
      }

      toast.success("Patient discharged successfully");
      setOpen(false);
      onComplete?.();
      navigate("/queue");
    } catch (error) {
      console.error("Discharge error:", error);
      toast.error("Failed to discharge patient");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryItems = (category: ChecklistItem["category"]) =>
    checklist.filter((item) => item.category === category);

  const CategorySection = ({
    title,
    icon: Icon,
    category,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    category: ChecklistItem["category"];
  }) => {
    const items = getCategoryItems(category);
    const completed = items.filter((i) => i.completed).length;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {completed}/{items.length}
          </Badge>
        </div>
        <div className="space-y-2 ml-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                item.completed
                  ? "bg-success/10 text-muted-foreground"
                  : "hover:bg-muted/50"
              }`}
            >
              <Checkbox checked={item.completed} />
              <span
                className={`text-sm flex-1 ${
                  item.completed ? "line-through" : ""
                }`}
              >
                {item.label}
              </span>
              {item.required && !item.completed && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              {item.completed && (
                <CheckCircle className="w-4 h-4 text-success" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Home className="w-4 h-4" />
        Discharge Patient
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              Discharge Workflow
            </DialogTitle>
            <DialogDescription>
              Complete the discharge checklist for {patientName}
            </DialogDescription>
          </DialogHeader>

          {/* Patient Info Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{patientName}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono">{mrn}</span>
                {ward && bed && (
                  <>
                    <span>•</span>
                    <span>
                      {ward} / Bed {bed}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round(progress)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discharge Progress</span>
              <span>
                {completedCount} of {checklist.length} items completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {!canDischarge && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {requiredCount - requiredCompleted} required items remaining
              </p>
            )}
          </div>

          <Separator />

          {/* Checklist */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              <CategorySection
                title="Clinical Tasks"
                icon={Stethoscope}
                category="clinical"
              />
              <CategorySection
                title="Patient Education"
                icon={FileText}
                category="education"
              />
              <CategorySection
                title="Administrative"
                icon={ClipboardCheck}
                category="admin"
              />
            </div>
          </ScrollArea>

          <Separator />

          {/* Discharge Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Discharge Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about the discharge..."
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print Summary
            </Button>
            <Button
              onClick={handleDischarge}
              disabled={!canDischarge || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Discharge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
