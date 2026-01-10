/**
 * Chart Access Dialog
 * 
 * Implements HIPAA "minimum necessary" principle by requiring
 * access justification when opening patient charts outside of
 * established care relationships (queue, appointment, etc.)
 * 
 * Standards alignment:
 * - HIPAA Privacy Rule (45 CFR 164.502(b))
 * - IHE Break-the-Glass Profile
 * - Joint Commission patient identification (NPSG.01.01.01)
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Users,
  ClipboardCheck,
  User,
  Scale,
  FlaskConical,
  Loader2,
  Lock,
  Eye,
} from "lucide-react";
import {
  ChartAccessReason,
  ACCESS_REASON_CONFIG,
  PatientIdentificationCheck,
} from "@/types/patientContext";

interface ChartAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientMrn: string;
  patientDob: string;
  onConfirmAccess: (reason: ChartAccessReason, justification?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Users,
  ClipboardCheck,
  AlertTriangle,
  User,
  Scale,
  FlaskConical,
};

export function ChartAccessDialog({
  open,
  onOpenChange,
  patientName,
  patientMrn,
  patientDob,
  onConfirmAccess,
  onCancel,
  isLoading = false,
}: ChartAccessDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ChartAccessReason | null>(null);
  const [justification, setJustification] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState<PatientIdentificationCheck>({
    identifiers: { name: false, dob: false, mrn: false },
    confirmedAt: null,
    confirmedBy: null,
  });

  const selectedConfig = selectedReason ? ACCESS_REASON_CONFIG[selectedReason] : null;
  const requiresJustification = selectedConfig?.requiresJustification ?? false;

  const allIdentifiersConfirmed =
    identityConfirmed.identifiers.name &&
    identityConfirmed.identifiers.dob &&
    identityConfirmed.identifiers.mrn;

  const canProceed =
    selectedReason &&
    allIdentifiersConfirmed &&
    (!requiresJustification || justification.trim().length > 10);

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirmAccess(selectedReason, requiresJustification ? justification : undefined);
  };

  const updateIdentifier = (key: keyof PatientIdentificationCheck["identifiers"], value: boolean) => {
    setIdentityConfirmed(prev => ({
      ...prev,
      identifiers: { ...prev.identifiers, [key]: value },
      confirmedAt: value ? new Date() : null,
    }));
  };

  // Filter reasons shown based on context
  const availableReasons: ChartAccessReason[] = [
    "treatment",
    "care_coordination",
    "quality_review",
    "emergency",
    "patient_request",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Chart Access Authorization
          </DialogTitle>
          <DialogDescription>
            Verify patient identity and provide access justification per HIPAA requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Identity Verification (Joint Commission NPSG.01.01.01) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Step 1: Verify Patient Identity (Two-Identifier Rule)
            </Label>
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{patientName}</p>
                  <p className="text-xs text-muted-foreground">Patient Name</p>
                </div>
                <Checkbox
                  checked={identityConfirmed.identifiers.name}
                  onCheckedChange={(checked) => updateIdentifier("name", !!checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium font-mono">{patientDob}</p>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                </div>
                <Checkbox
                  checked={identityConfirmed.identifiers.dob}
                  onCheckedChange={(checked) => updateIdentifier("dob", !!checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium font-mono">{patientMrn}</p>
                  <p className="text-xs text-muted-foreground">Medical Record Number</p>
                </div>
                <Checkbox
                  checked={identityConfirmed.identifiers.mrn}
                  onCheckedChange={(checked) => updateIdentifier("mrn", !!checked)}
                />
              </div>
            </div>
            {!allIdentifiersConfirmed && (
              <p className="text-xs text-muted-foreground">
                Confirm at least 2 identifiers to proceed (Joint Commission requirement)
              </p>
            )}
          </div>

          {/* Access Reason Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Step 2: Select Access Reason
            </Label>
            <RadioGroup
              value={selectedReason || ""}
              onValueChange={(v) => setSelectedReason(v as ChartAccessReason)}
            >
              <div className="grid grid-cols-1 gap-2">
                {availableReasons.map((reason) => {
                  const config = ACCESS_REASON_CONFIG[reason];
                  const Icon = iconMap[config.icon] || Stethoscope;
                  return (
                    <div
                      key={reason}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedReason === reason
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedReason(reason)}
                    >
                      <RadioGroupItem value={reason} id={reason} />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={reason} className="font-medium cursor-pointer">
                          {config.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                      {config.requiresJustification && (
                        <Badge variant="outline" className="text-xs">
                          Justification Required
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Justification (for elevated access) */}
          {requiresJustification && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Step 3: Provide Justification
              </Label>
              <Textarea
                placeholder="Explain why you need access to this patient's chart..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. This will be logged for compliance.
              </p>
            </div>
          )}

          {/* Emergency Access Warning */}
          {selectedReason === "emergency" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Break-the-Glass Access</AlertTitle>
              <AlertDescription>
                Emergency access is logged and audited. Your supervisor will be notified.
                Access will automatically expire after 4 hours.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canProceed || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Access Chart
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
