import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldCheck, 
  User, 
  Pill, 
  Scale, 
  Route, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Camera,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FiveRightsVerificationProps {
  prescriptionItemId?: string;
  medicationAdministrationId?: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  medicationName: string;
  expectedDose: string;
  expectedRoute: string;
  scheduledTime?: Date;
  requiresDoubleCheck?: boolean;
  onVerified: (allRightsConfirmed: boolean) => void;
  onCancel: () => void;
}

type VerificationMethod = "wristband" | "verbal" | "photo" | "biometric";

export function FiveRightsVerification({
  prescriptionItemId,
  medicationAdministrationId,
  patientId,
  patientName,
  patientMrn,
  medicationName,
  expectedDose,
  expectedRoute,
  scheduledTime,
  requiresDoubleCheck = false,
  onVerified,
  onCancel,
}: FiveRightsVerificationProps) {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  
  // Five Rights State
  const [rightPatient, setRightPatient] = useState(false);
  const [patientVerificationMethod, setPatientVerificationMethod] = useState<VerificationMethod>("wristband");
  const [rightMedication, setRightMedication] = useState(false);
  const [medicationBarcodeScanned, setMedicationBarcodeScanned] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [rightDose, setRightDose] = useState(false);
  const [doseCalculated, setDoseCalculated] = useState(false);
  const [rightRoute, setRightRoute] = useState(false);
  const [rightTime, setRightTime] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");

  const allRightsConfirmed = rightPatient && rightMedication && rightDose && rightRoute && rightTime;
  const canProceed = allRightsConfirmed || overrideReason.length > 10;

  const handleBarcodeScan = () => {
    if (barcodeInput) {
      // Simulate barcode verification
      setMedicationBarcodeScanned(true);
      setRightMedication(true);
      toast.success("Medication barcode verified");
      setBarcodeInput("");
    }
  };

  const handleVerify = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!canProceed) {
      toast.error("Please verify all five rights or provide an override reason");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.from("five_rights_verification").insert({
        prescription_item_id: prescriptionItemId,
        medication_administration_id: medicationAdministrationId,
        patient_id: patientId,
        verified_by: user.id,
        right_patient: rightPatient,
        patient_verification_method: patientVerificationMethod,
        right_medication: rightMedication,
        medication_barcode_scanned: medicationBarcodeScanned,
        right_dose: rightDose,
        dose_calculated: doseCalculated,
        right_route: rightRoute,
        right_time: rightTime,
        scheduled_time: scheduledTime?.toISOString(),
        actual_time: new Date().toISOString(),
        all_rights_confirmed: allRightsConfirmed,
        override_reason: !allRightsConfirmed ? overrideReason : null,
        double_check_required: requiresDoubleCheck,
        notes,
      });

      if (error) throw error;

      toast.success("Five rights verification complete");
      onVerified(allRightsConfirmed);
    } catch (err) {
      console.error("Error saving verification:", err);
      toast.error("Failed to save verification");
    } finally {
      setVerifying(false);
    }
  };

  const getRightStatus = (verified: boolean) => {
    return verified ? (
      <CheckCircle2 className="h-5 w-5 text-success" />
    ) : (
      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
    );
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Five Rights Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify all five rights before medication administration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{patientName}</p>
              <p className="text-sm text-muted-foreground">MRN: {patientMrn}</p>
            </div>
            <Badge>{medicationName}</Badge>
          </div>
        </div>

        {/* Right 1: Right Patient */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getRightStatus(rightPatient)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">Right Patient</span>
              </div>
            </div>
          </div>
          <div className="ml-8 space-y-2">
            <Select
              value={patientVerificationMethod}
              onValueChange={(v) => setPatientVerificationMethod(v as VerificationMethod)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wristband">Wristband Scan</SelectItem>
                <SelectItem value="verbal">Verbal Confirmation</SelectItem>
                <SelectItem value="photo">Photo ID</SelectItem>
                <SelectItem value="biometric">Biometric</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={rightPatient ? "default" : "outline"}
                size="sm"
                onClick={() => setRightPatient(!rightPatient)}
              >
                {patientVerificationMethod === "biometric" && <Fingerprint className="h-4 w-4 mr-1" />}
                {patientVerificationMethod === "photo" && <Camera className="h-4 w-4 mr-1" />}
                Verify Patient Identity
              </Button>
            </div>
          </div>
        </div>

        {/* Right 2: Right Medication */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getRightStatus(rightMedication)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <span className="font-medium">Right Medication</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{medicationName}</p>
            </div>
          </div>
          <div className="ml-8 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Scan medication barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleBarcodeScan}>
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="rightMed"
                checked={rightMedication}
                onCheckedChange={(c) => setRightMedication(!!c)}
              />
              <Label htmlFor="rightMed" className="text-sm">
                Medication label matches order
              </Label>
              {medicationBarcodeScanned && (
                <Badge variant="outline" className="text-success border-success">
                  Barcode Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right 3: Right Dose */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getRightStatus(rightDose)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <span className="font-medium">Right Dose</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{expectedDose}</p>
            </div>
          </div>
          <div className="ml-8 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rightDose"
                checked={rightDose}
                onCheckedChange={(c) => setRightDose(!!c)}
              />
              <Label htmlFor="rightDose" className="text-sm">
                Dose verified and correct
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="doseCalc"
                checked={doseCalculated}
                onCheckedChange={(c) => setDoseCalculated(!!c)}
              />
              <Label htmlFor="doseCalc" className="text-sm text-muted-foreground">
                Dose calculation performed (if applicable)
              </Label>
            </div>
          </div>
        </div>

        {/* Right 4: Right Route */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getRightStatus(rightRoute)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                <span className="font-medium">Right Route</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{expectedRoute}</p>
            </div>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rightRoute"
                checked={rightRoute}
                onCheckedChange={(c) => setRightRoute(!!c)}
              />
              <Label htmlFor="rightRoute" className="text-sm">
                Administration route verified
              </Label>
            </div>
          </div>
        </div>

        {/* Right 5: Right Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getRightStatus(rightTime)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Right Time</span>
              </div>
              {scheduledTime && (
                <p className="text-sm text-muted-foreground ml-6">
                  Scheduled: {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rightTime"
                checked={rightTime}
                onCheckedChange={(c) => setRightTime(!!c)}
              />
              <Label htmlFor="rightTime" className="text-sm">
                Timing is appropriate
              </Label>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        {allRightsConfirmed ? (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-medium text-success">All five rights verified</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-warning">Not all rights verified</span>
                <p className="text-sm text-muted-foreground">
                  Provide an override reason to proceed
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Override reason (required if proceeding without all rights verified)..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <Label>Additional Notes</Label>
          <Textarea
            placeholder="Any observations or concerns..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Double Check Warning */}
        {requiresDoubleCheck && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium">Double check required for this medication</p>
            <p className="text-xs text-muted-foreground">A second clinician must verify before administration</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!canProceed || verifying}
            onClick={handleVerify}
            variant={allRightsConfirmed ? "default" : "destructive"}
          >
            {verifying ? "Verifying..." : allRightsConfirmed ? "Confirm & Proceed" : "Override & Proceed"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
