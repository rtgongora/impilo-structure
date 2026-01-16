/**
 * Break-Glass Access Modal
 * 
 * Emergency access dialog for situations where normal consent-based
 * access is not available but clinical urgency requires access.
 * 
 * Standards:
 * - HIPAA Emergency Access Provisions
 * - Joint Commission NPSG.01.01.01
 * - IHE Emergency Access (EUA) Profile
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Scale,
  Loader2,
} from "lucide-react";
import { BreakGlassRequest, BREAK_GLASS_TYPE_LABELS } from "@/types/trustLayer";
import { policyService } from "@/services/trustLayer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BreakGlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientCpid: string;
  facilityId?: string;
  workspaceId?: string;
  onAccessGranted: (accessId: string, expiresAt: string) => void;
  onAccessDenied?: (reason: string) => void;
}

export function BreakGlassModal({
  open,
  onOpenChange,
  patientName,
  patientCpid,
  facilityId,
  workspaceId,
  onAccessGranted,
  onAccessDenied,
}: BreakGlassModalProps) {
  const [emergencyType, setEmergencyType] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [acknowledgeAudit, setAcknowledgeAudit] = useState(false);
  const [acknowledgeReview, setAcknowledgeReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emergencyTypes = [
    { value: "life_threatening", label: "Life-Threatening Emergency" },
    { value: "urgent_care", label: "Urgent Care Required" },
    { value: "patient_unresponsive", label: "Patient Unresponsive" },
    { value: "system_emergency", label: "System Emergency" },
    { value: "other", label: "Other Emergency Situation" },
  ];

  const canSubmit = 
    emergencyType && 
    justification.length >= 20 && 
    acknowledgeAudit && 
    acknowledgeReview;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const request: BreakGlassRequest = {
        userId: "", // Will be filled by service from auth context
        subjectCpid: patientCpid,
        justification,
        emergencyType: emergencyType as BreakGlassRequest["emergencyType"],
        facilityId,
        workspaceId,
        expiresInHours: emergencyType === "life_threatening" ? 8 : 4,
      };

      const result = await policyService.activateBreakGlass(request);

      if (result.success && result.access) {
        toast.warning("Break-Glass Access Activated", {
          description: `Emergency access granted until ${new Date(result.access.accessExpiresAt).toLocaleTimeString()}. All actions will be audited.`,
          duration: 10000,
        });
        
        onAccessGranted(result.access.id, result.access.accessExpiresAt);
        onOpenChange(false);
      } else {
        const reason = result.error || "Access denied";
        toast.error("Break-Glass Request Denied", {
          description: reason,
        });
        onAccessDenied?.(reason);
      }
    } catch (error) {
      console.error("Break-glass activation error:", error);
      toast.error("Failed to activate break-glass access");
      onAccessDenied?.("System error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setEmergencyType("");
    setJustification("");
    setAcknowledgeAudit(false);
    setAcknowledgeReview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Break-Glass Access Request</DialogTitle>
              <DialogDescription>
                Emergency access to patient record
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High-Risk Action</AlertTitle>
          <AlertDescription className="text-sm">
            Break-glass access bypasses normal consent controls. This action is 
            audited and subject to mandatory review. Only proceed for genuine 
            clinical emergencies.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div>
              <p className="font-medium">{patientName}</p>
              <p className="text-xs text-muted-foreground">
                CPID: {patientCpid.substring(0, 8)}...
              </p>
            </div>
            <Badge variant="outline" className="text-destructive border-destructive">
              No Active Consent
            </Badge>
          </div>

          {/* Emergency Type */}
          <div className="space-y-2">
            <Label htmlFor="emergency-type">
              Emergency Type <span className="text-destructive">*</span>
            </Label>
            <Select value={emergencyType} onValueChange={setEmergencyType}>
              <SelectTrigger id="emergency-type">
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">
              Clinical Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Describe the clinical emergency and why immediate access is required..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters required. {justification.length}/20
            </p>
          </div>

          {/* Acknowledgments */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge-audit"
                checked={acknowledgeAudit}
                onCheckedChange={(checked) => setAcknowledgeAudit(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="acknowledge-audit" className="text-sm font-normal cursor-pointer">
                  <Eye className="w-3 h-3 inline mr-1" />
                  I understand all access will be logged and audited
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge-review"
                checked={acknowledgeReview}
                onCheckedChange={(checked) => setAcknowledgeReview(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="acknowledge-review" className="text-sm font-normal cursor-pointer">
                  <Scale className="w-3 h-3 inline mr-1" />
                  I accept this access is subject to mandatory review
                </Label>
              </div>
            </div>
          </div>

          {/* Access Duration Info */}
          {emergencyType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Access will expire in {emergencyType === "life_threatening" ? "8" : "4"} hours
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 mr-2" />
                Activate Break-Glass
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
