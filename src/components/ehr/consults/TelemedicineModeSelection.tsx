import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

interface TelemedicineModeSelectionProps {
  urgency: ReferralUrgency;
  selectedModes: TelemedicineMode[];
  preferredMode: TelemedicineMode | null;
  onModesChange: (modes: TelemedicineMode[]) => void;
  onPreferredModeChange: (mode: TelemedicineMode) => void;
  scheduledAt?: string;
  onScheduleChange?: (date: string) => void;
}

interface ModeOption {
  id: TelemedicineMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended: ReferralUrgency[];
  requiresScheduling: boolean;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "async",
    label: "Asynchronous Review",
    description: "Specialist reviews your referral package and record at a convenient time, then writes a consultation report without live interaction",
    icon: FileText,
    recommended: ["routine"],
    requiresScheduling: false,
  },
  {
    id: "chat",
    label: "Chat & Instant Messaging",
    description: "Case-linked text conversation between clinicians with the patient record always accessible",
    icon: MessageSquare,
    recommended: ["routine", "urgent"],
    requiresScheduling: false,
  },
  {
    id: "audio",
    label: "Audio / VOIP Call",
    description: "Live voice call held inside the platform and linked to the referral",
    icon: Phone,
    recommended: ["urgent", "stat"],
    requiresScheduling: false,
  },
  {
    id: "video",
    label: "Video Consultation",
    description: "Full audio and video consultation with shared imaging and partial examination capability",
    icon: Video,
    recommended: ["urgent", "stat", "emergency"],
    requiresScheduling: false,
  },
  {
    id: "scheduled",
    label: "Scheduled Teleconsult",
    description: "Booked teleconsult slot, aligned to specialist clinic times and rosters",
    icon: Calendar,
    recommended: ["routine"],
    requiresScheduling: true,
  },
  {
    id: "board",
    label: "Case Review / MDT Board",
    description: "Multi-clinician live session for high-complexity or cross-disciplinary decisions with a designated lead reviewer",
    icon: Users,
    recommended: ["routine", "urgent"],
    requiresScheduling: true,
  },
];

export function TelemedicineModeSelection({
  urgency,
  selectedModes,
  preferredMode,
  onModesChange,
  onPreferredModeChange,
  scheduledAt,
  onScheduleChange,
}: TelemedicineModeSelectionProps) {
  const toggleMode = (mode: TelemedicineMode) => {
    if (selectedModes.includes(mode)) {
      const newModes = selectedModes.filter(m => m !== mode);
      onModesChange(newModes);
      // If removing the preferred mode, set the first remaining mode as preferred
      if (preferredMode === mode && newModes.length > 0) {
        onPreferredModeChange(newModes[0]);
      }
    } else {
      onModesChange([...selectedModes, mode]);
      // If this is the first mode, set it as preferred
      if (selectedModes.length === 0) {
        onPreferredModeChange(mode);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Acceptable Consultation Modes</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select all modes that are acceptable for this consultation. The specialist will choose based on availability and clinical need.
        </p>
      </div>

      <div className="grid gap-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedModes.includes(option.id);
          const isRecommended = option.recommended.includes(urgency);
          const isPreferred = preferredMode === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                "cursor-pointer transition-all",
                isSelected && "ring-2 ring-primary",
                isPreferred && "bg-primary/5"
              )}
              onClick={() => toggleMode(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMode(option.id)}
                    />
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{option.label}</h4>
                      {isRecommended && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                          Recommended
                        </Badge>
                      )}
                      {isPreferred && (
                        <Badge className="text-xs">
                          Preferred
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>

                    {/* Scheduling input for scheduled modes */}
                    {isSelected && option.requiresScheduling && onScheduleChange && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                        <Label className="text-xs">Preferred Date/Time</Label>
                        <input
                          type="datetime-local"
                          value={scheduledAt || ""}
                          onChange={(e) => onScheduleChange(e.target.value)}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {isSelected && selectedModes.length > 1 && (
                    <Button
                      variant={isPreferred ? "default" : "ghost"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreferredModeChange(option.id);
                      }}
                    >
                      {isPreferred ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Preferred
                        </>
                      ) : (
                        "Set as Preferred"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Mode Override */}
      {urgency === "emergency" && !selectedModes.includes("video") && !selectedModes.includes("audio") && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Emergency Referral</p>
              <p className="text-sm text-muted-foreground">
                For emergency cases, video or audio consultation is strongly recommended for immediate specialist guidance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedModes.length === 0 && (
        <p className="text-sm text-destructive">
          Please select at least one consultation mode
        </p>
      )}
    </div>
  );
}
