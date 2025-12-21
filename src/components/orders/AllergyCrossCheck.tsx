import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AllergyMatch {
  allergen: string;
  medication: string;
  matchType: "exact" | "class" | "cross-reactive";
  severity: "high" | "moderate" | "low";
  recommendation: string;
}

interface AllergyCrossCheckProps {
  open: boolean;
  medicationName: string;
  medicationClass?: string;
  patientAllergies: string[];
  onProceed: () => void;
  onCancel: () => void;
}

// Common drug-allergy cross-reactivity mappings
const crossReactivityMap: Record<string, string[]> = {
  // Penicillins
  penicillin: ["amoxicillin", "ampicillin", "piperacillin", "cephalosporins"],
  amoxicillin: ["penicillin", "ampicillin", "cephalosporins"],
  
  // Cephalosporins
  cephalosporin: ["cefazolin", "ceftriaxone", "cefuroxime", "penicillin"],
  
  // NSAIDs
  aspirin: ["ibuprofen", "naproxen", "diclofenac", "nsaids"],
  nsaid: ["aspirin", "ibuprofen", "naproxen", "diclofenac", "ketorolac"],
  ibuprofen: ["aspirin", "naproxen", "nsaids"],
  
  // Sulfonamides
  sulfa: ["sulfamethoxazole", "sulfasalazine", "trimethoprim-sulfamethoxazole"],
  
  // Opioids
  morphine: ["codeine", "hydromorphone", "oxycodone"],
  codeine: ["morphine", "hydromorphone"],
  
  // ACE Inhibitors
  "ace inhibitor": ["lisinopril", "enalapril", "ramipril", "captopril"],
  lisinopril: ["enalapril", "ramipril", "captopril"],
};

export function AllergyCrossCheck({
  open,
  medicationName,
  medicationClass,
  patientAllergies,
  onProceed,
  onCancel,
}: AllergyCrossCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [allergyMatches, setAllergyMatches] = useState<AllergyMatch[]>([]);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    if (open && patientAllergies.length > 0) {
      checkAllergies();
    } else if (open && patientAllergies.length === 0) {
      setCheckComplete(true);
      setAllergyMatches([]);
    }
  }, [open, medicationName, patientAllergies]);

  const checkAllergies = async () => {
    setIsChecking(true);
    setAllergyMatches([]);
    setCheckComplete(false);

    try {
      const matches: AllergyMatch[] = [];
      const medNameLower = medicationName.toLowerCase();

      for (const allergy of patientAllergies) {
        const allergyLower = allergy.toLowerCase();

        // Check for exact match
        if (medNameLower.includes(allergyLower) || allergyLower.includes(medNameLower)) {
          matches.push({
            allergen: allergy,
            medication: medicationName,
            matchType: "exact",
            severity: "high",
            recommendation: "DO NOT ADMINISTER. Patient has documented allergy to this exact medication.",
          });
          continue;
        }

        // Check for cross-reactivity
        const crossReactive = crossReactivityMap[allergyLower];
        if (crossReactive) {
          const isCrossReactive = crossReactive.some(
            (drug) => medNameLower.includes(drug) || drug.includes(medNameLower)
          );
          if (isCrossReactive) {
            matches.push({
              allergen: allergy,
              medication: medicationName,
              matchType: "cross-reactive",
              severity: "moderate",
              recommendation: `Potential cross-reactivity with ${allergy}. Consult pharmacist before administration.`,
            });
            continue;
          }
        }

        // Check medication class
        if (medicationClass) {
          const classLower = medicationClass.toLowerCase();
          if (classLower.includes(allergyLower) || allergyLower.includes(classLower)) {
            matches.push({
              allergen: allergy,
              medication: medicationName,
              matchType: "class",
              severity: "high",
              recommendation: `Patient is allergic to ${allergy} class medications. DO NOT ADMINISTER.`,
            });
          }
        }
      }

      // If no local matches found, use AI for deeper analysis
      if (matches.length === 0 && patientAllergies.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke("ai-diagnostic", {
            body: {
              type: "drug-interaction",
              patientData: {
                medications: [],
                allergies: patientAllergies,
                newMedication: medicationName,
              },
            },
          });

          if (!error && data?.interactions) {
            for (const interaction of data.interactions) {
              if (interaction.severity !== "none") {
                matches.push({
                  allergen: interaction.drug1 || patientAllergies[0],
                  medication: medicationName,
                  matchType: "cross-reactive",
                  severity: interaction.severity === "severe" ? "high" : "moderate",
                  recommendation: interaction.recommendation || "Review with pharmacist.",
                });
              }
            }
          }
        } catch (aiError) {
          console.error("AI allergy check failed:", aiError);
          // Continue with local check results
        }
      }

      setAllergyMatches(matches);
    } catch (error) {
      console.error("Error checking allergies:", error);
      toast.error("Failed to complete allergy check");
    } finally {
      setIsChecking(false);
      setCheckComplete(true);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          color: "bg-destructive/10 text-destructive border-destructive/30",
          icon: XCircle,
          label: "High Risk",
        };
      case "moderate":
        return {
          color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
          icon: AlertTriangle,
          label: "Moderate Risk",
        };
      default:
        return {
          color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
          icon: AlertCircle,
          label: "Low Risk",
        };
    }
  };

  const hasHighRisk = allergyMatches.some((m) => m.severity === "high");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Allergy Cross-Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Checking medication:</p>
            <p className="font-medium">{medicationName}</p>
          </div>

          {/* Patient Allergies */}
          <div className="p-3 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">Documented Allergies:</p>
            {patientAllergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patientAllergies.map((allergy, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No documented allergies
              </p>
            )}
          </div>

          {/* Loading State */}
          {isChecking && (
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Checking for allergy interactions...
              </p>
            </div>
          )}

          {/* Results */}
          {checkComplete && !isChecking && (
            <>
              {allergyMatches.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    No Allergy Conflicts Detected
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Safe to proceed with medication administration
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${hasHighRisk ? "bg-destructive/10 border border-destructive/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
                    <div className="flex items-center gap-2">
                      {hasHighRisk ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">
                        {allergyMatches.length} Allergy Alert{allergyMatches.length !== 1 ? "s" : ""} Found
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {allergyMatches.map((match, idx) => {
                        const config = getSeverityConfig(match.severity);
                        const SeverityIcon = config.icon;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${config.color}`}
                          >
                            <div className="flex items-start gap-2">
                              <SeverityIcon className="h-4 w-4 mt-0.5 shrink-0" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {match.matchType === "exact"
                                      ? "Exact Match"
                                      : match.matchType === "class"
                                      ? "Drug Class"
                                      : "Cross-Reactive"}
                                  </Badge>
                                  <Badge variant="outline" className={config.color}>
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium">
                                  Allergen: {match.allergen}
                                </p>
                                <p className="text-xs mt-1">{match.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {checkComplete && !hasHighRisk && (
            <Button onClick={onProceed}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Proceed
            </Button>
          )}
          {checkComplete && hasHighRisk && (
            <Button variant="destructive" onClick={onCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Do Not Administer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
