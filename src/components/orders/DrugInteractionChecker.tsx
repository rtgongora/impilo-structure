import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DrugInteraction {
  drugs: string[];
  severity: "critical" | "major" | "moderate" | "minor";
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

interface InteractionResult {
  interactions: DrugInteraction[];
  safetyAlerts: string[];
  monitoringRequired: string[];
}

interface DrugInteractionCheckerProps {
  newMedication: string;
  currentMedications: string[];
  patientAllergies?: string[];
  patientConditions?: string[];
  onProceed: () => void;
  onCancel: () => void;
  open: boolean;
}

export function DrugInteractionChecker({
  newMedication,
  currentMedications,
  patientAllergies = [],
  patientConditions = [],
  onProceed,
  onCancel,
  open,
}: DrugInteractionCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkInteractions = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const allMedications = [...currentMedications, newMedication];

      const { data, error: fnError } = await supabase.functions.invoke("ai-diagnostic", {
        body: {
          type: "drug-interaction",
          patientData: {
            medications: allMedications,
            allergies: patientAllergies,
            conditions: patientConditions,
          },
        },
      });

      if (fnError) throw fnError;

      if (data?.result) {
        setResult(data.result as InteractionResult);
      } else {
        setResult({ interactions: [], safetyAlerts: [], monitoringRequired: [] });
      }
    } catch (err) {
      console.error("Error checking interactions:", err);
      setError("Failed to check drug interactions. You may proceed with caution.");
      toast.error("Drug interaction check failed");
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "major":
        return "bg-orange-500 text-white";
      case "moderate":
        return "bg-yellow-500 text-black";
      case "minor":
        return "bg-blue-500 text-white";
      default:
        return "bg-muted";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "major":
        return <ShieldAlert className="h-4 w-4" />;
      case "moderate":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const hasCriticalInteractions = result?.interactions.some(
    (i) => i.severity === "critical" || i.severity === "major"
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Drug Interaction Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication being added */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Adding medication:</p>
            <p className="font-medium text-primary">{newMedication}</p>
          </div>

          {/* Current medications */}
          {currentMedications.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current medications:</p>
              <div className="flex flex-wrap gap-1">
                {currentMedications.map((med, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {med}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Check button or results */}
          {!result && !isChecking && !error && (
            <Button onClick={checkInteractions} className="w-full">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Check for Interactions
            </Button>
          )}

          {isChecking && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing drug interactions...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {/* No interactions */}
                {result.interactions.length === 0 && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      No significant interactions detected
                    </p>
                  </div>
                )}

                {/* Interactions list */}
                {result.interactions.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-sm">Interactions Found:</p>
                    {result.interactions.map((interaction, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          interaction.severity === "critical"
                            ? "border-red-500/50 bg-red-500/10"
                            : interaction.severity === "major"
                            ? "border-orange-500/50 bg-orange-500/10"
                            : interaction.severity === "moderate"
                            ? "border-yellow-500/50 bg-yellow-500/10"
                            : "border-blue-500/50 bg-blue-500/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(interaction.severity)}
                            <span className="font-medium text-sm">
                              {interaction.drugs.join(" + ")}
                            </span>
                          </div>
                          <Badge className={getSeverityColor(interaction.severity)}>
                            {interaction.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Effect:</strong> {interaction.clinicalEffect}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Mechanism:</strong> {interaction.mechanism}
                        </p>
                        <p className="text-sm font-medium">
                          <strong>Recommendation:</strong> {interaction.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Safety alerts */}
                {result.safetyAlerts.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Safety Alerts:</p>
                    {result.safetyAlerts.map((alert, i) => (
                      <div key={i} className="p-2 rounded bg-muted text-sm">
                        • {alert}
                      </div>
                    ))}
                  </div>
                )}

                {/* Monitoring required */}
                {result.monitoringRequired.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Monitoring Required:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.monitoringRequired.map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Action buttons */}
          {(result || error) && (
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel Administration
              </Button>
              <Button
                className="flex-1"
                variant={hasCriticalInteractions ? "destructive" : "default"}
                onClick={onProceed}
              >
                {hasCriticalInteractions ? "Proceed Anyway" : "Proceed"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}