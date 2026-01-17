/**
 * Patient Allergies Alert Component
 * Displays patient allergies from database with verification status
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Shield, ShieldAlert, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePatientAllergies } from "@/hooks/usePatientAllergies";
import { format } from "date-fns";

interface AllergiesAlertProps {
  patientId?: string;
  compact?: boolean;
  providerId?: string;
}

export function AllergiesAlert({ patientId, compact = true, providerId }: AllergiesAlertProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { 
    activeAllergies, 
    hasActiveAllergies, 
    hasCriticalAllergies, 
    isLoading,
    verifyAllergy 
  } = usePatientAllergies(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading allergies...</span>
      </div>
    );
  }

  if (!hasActiveAllergies) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
        <Shield className="w-4 h-4 text-success" />
        <span className="text-sm font-medium text-success">NKDA</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>No Known Drug Allergies</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const severityColors = {
    mild: "bg-warning/10 text-warning border-warning/30",
    moderate: "bg-warning/20 text-warning border-warning/50",
    severe: "bg-critical/20 text-critical border-critical/50",
    life_threatening: "bg-critical/30 text-critical border-critical",
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case "life_threatening": return "Life-threatening";
      case "severe": return "Severe";
      case "moderate": return "Moderate";
      case "mild": return "Mild";
      default: return "Unknown";
    }
  };

  const handleVerify = (allergyId: string) => {
    if (providerId) {
      verifyAllergy.mutate({ id: allergyId, verified_by: providerId });
    }
  };

  if (compact) {
    return (
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogTrigger asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
              hasCriticalAllergies 
                ? "bg-critical/10 border-critical/30" 
                : "bg-warning/10 border-warning/30"
            )}
          >
            {hasCriticalAllergies ? (
              <ShieldAlert className="w-4 h-4 text-critical" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
            <div className="text-sm">
              <span className={cn("font-medium", hasCriticalAllergies ? "text-critical" : "text-warning")}>
                Allergies:
              </span>
              <span className="ml-1 text-foreground">
                {activeAllergies.slice(0, 3).map(a => a.allergen_display).join(", ")}
                {activeAllergies.length > 3 && ` +${activeAllergies.length - 3} more`}
              </span>
            </div>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-critical" />
              Patient Allergies ({activeAllergies.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-1">
              {activeAllergies.map((allergy) => (
                <motion.div
                  key={allergy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    severityColors[allergy.reaction_severity || "mild"]
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {allergy.allergen_display}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {allergy.allergen_type}
                        </Badge>
                        {allergy.criticality === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            High Criticality
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {allergy.reaction_manifestations && allergy.reaction_manifestations.length > 0 && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Reactions:</span>{" "}
                            {allergy.reaction_manifestations.join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Severity: {getSeverityLabel(allergy.reaction_severity)}</span>
                          {allergy.onset_date && (
                            <span>Onset: {format(new Date(allergy.onset_date), "MMM d, yyyy")}</span>
                          )}
                          <span className="capitalize">
                            Status: {allergy.verification_status}
                          </span>
                        </div>
                        {allergy.notes && (
                          <div className="text-muted-foreground text-xs mt-2 italic">
                            {allergy.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {allergy.verification_status === "confirmed" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : providerId ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVerify(allergy.id)}
                          disabled={verifyAllergy.isPending}
                        >
                          {verifyAllergy.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          Verify
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-critical" />
        Active Allergies ({activeAllergies.length})
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {activeAllergies.map((allergy) => (
            <motion.div
              key={allergy.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "px-3 py-2 rounded-md border",
                severityColors[allergy.reaction_severity || "mild"]
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{allergy.allergen_display}</span>
                  {allergy.criticality === "high" && (
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  )}
                </div>
                {allergy.verification_status === "confirmed" && (
                  <Check className="w-4 h-4 text-success" />
                )}
              </div>
              {allergy.reaction_manifestations && allergy.reaction_manifestations.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 ml-6">
                  {allergy.reaction_manifestations.join(", ")}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
