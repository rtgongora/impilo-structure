import { AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEHR } from "@/contexts/EHRContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CriticalEventType } from "@/types/ehr";

const CRITICAL_EVENT_TYPES: { id: CriticalEventType; label: string; description: string }[] = [
  { id: "code-blue", label: "Code Blue", description: "Cardiac/Respiratory Arrest" },
  { id: "rapid-response", label: "Rapid Response", description: "Clinical Deterioration" },
  { id: "resuscitation", label: "Resuscitation", description: "Emergency Resuscitation" },
  { id: "emergency", label: "Emergency", description: "General Emergency" },
];

export function CriticalEventButton() {
  const { isCriticalEventActive, activateCriticalEvent } = useEHR();
  const [open, setOpen] = useState(false);

  const handleActivate = (type: CriticalEventType) => {
    activateCriticalEvent(type, "Manual activation");
    setOpen(false);
  };

  if (isCriticalEventActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-critical text-critical-foreground animate-pulse">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-semibold">CRITICAL EVENT ACTIVE</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-critical/10 border-critical text-critical hover:bg-critical hover:text-critical-foreground critical-pulse"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Critical Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-critical flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Activate Critical Event
          </DialogTitle>
          <DialogDescription>
            Select the type of critical event to activate emergency protocols.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {CRITICAL_EVENT_TYPES.map((event) => (
            <Button
              key={event.id}
              variant="outline"
              className="h-auto p-4 justify-start text-left border-2 hover:border-critical hover:bg-critical-muted"
              onClick={() => handleActivate(event.id)}
            >
              <div>
                <div className="font-semibold text-foreground">{event.label}</div>
                <div className="text-sm text-muted-foreground">{event.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
