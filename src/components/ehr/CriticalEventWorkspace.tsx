import { motion } from "framer-motion";
import { CriticalEventData, CriticalEventOutcome } from "@/types/ehr";
import { useEHR } from "@/contexts/EHRContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Zap,
  Heart,
  Activity,
  Plus,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CriticalEventWorkspaceProps {
  event: CriticalEventData;
}

const OUTCOME_OPTIONS: { id: CriticalEventOutcome; label: string }[] = [
  { id: "stabilised", label: "Stabilised" },
  { id: "admitted", label: "Admitted" },
  { id: "transferred", label: "Transferred" },
  { id: "escalated", label: "Escalated to Procedure" },
  { id: "death", label: "Death" },
];

export function CriticalEventWorkspace({ event }: CriticalEventWorkspaceProps) {
  const { terminateCriticalEvent, currentEncounter } = useEHR();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [actions, setActions] = useState<{ time: string; action: string; user: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - event.startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [event.startTime]);

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        action: "Action recorded",
        user: "Dr. Mwangi",
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-critical-muted">
      {/* Critical Event Header - High Visibility */}
      <header className="bg-critical text-critical-foreground px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className="w-8 h-8" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide">
                {event.eventType.replace("-", " ")}
              </h1>
              <div className="flex items-center gap-4 text-critical-foreground/90 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {currentEncounter.patient.name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm opacity-80">Event Duration</div>
              <div className="text-3xl font-mono font-bold elapsed-time">{elapsedTime}</div>
            </div>
            <Badge className="bg-critical-foreground text-critical text-lg px-4 py-1">
              ACTIVE
            </Badge>
          </div>
        </div>
      </header>

      {/* Event Content - Simplified Large Controls */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Initial Status */}
          <Card className="border-2 border-critical/30">
            <CardHeader className="bg-critical/10">
              <CardTitle className="text-lg flex items-center gap-2 text-critical">
                <Activity className="w-5 h-5" />
                Initial Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">Trigger</div>
                  <div className="text-lg font-semibold mt-1">{event.trigger}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">Activated By</div>
                  <div className="text-lg font-semibold mt-1">{event.activatingUser}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">Start Time</div>
                  <div className="text-lg font-semibold mt-1 font-mono">
                    {event.startTime.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time-Critical Actions */}
          <Card className="border-2 border-critical/30">
            <CardHeader className="bg-critical/10">
              <CardTitle className="text-lg flex items-center gap-2 text-critical">
                <Clock className="w-5 h-5" />
                Time-Critical Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                  >
                    <span className="font-mono text-sm font-medium text-primary">
                      {action.time}
                    </span>
                    <span className="flex-1">{action.action}</span>
                    <span className="text-sm text-muted-foreground">{action.user}</span>
                  </motion.div>
                ))}
                <Button
                  variant="outline"
                  className="w-full h-14 text-lg border-2 border-dashed hover:border-critical hover:bg-critical-muted"
                  onClick={addAction}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Record Action
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Event Termination */}
          <Card className="border-2 border-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Terminate Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {OUTCOME_OPTIONS.map((outcome) => (
                  <Button
                    key={outcome.id}
                    variant="outline"
                    className={`h-16 text-base ${
                      outcome.id === "death"
                        ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        : "hover:border-primary hover:bg-primary-muted"
                    }`}
                    onClick={() => terminateCriticalEvent(outcome.id)}
                  >
                    {outcome.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
