import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduledMedication {
  id: string;
  medication_name: string;
  dosage: string;
  dosage_unit: string;
  route: string;
  frequency: string;
  nextDue: Date;
  status: "due" | "upcoming" | "overdue";
  timeRemaining: string;
  progressPercent: number;
}

interface MedicationTimelineProps {
  patientId: string;
  encounterId: string;
}

const frequencyToHours: Record<string, number> = {
  "Once daily": 24,
  "Twice daily": 12,
  "Three times daily": 8,
  "Four times daily": 6,
  "Every 4 hours": 4,
  "Every 6 hours": 6,
  "Every 8 hours": 8,
  "Every 12 hours": 12,
  "Every 24 hours": 24,
  "PRN": 0,
  "Stat": 0,
};

export function MedicationTimeline({ patientId, encounterId }: MedicationTimelineProps) {
  const [medications, setMedications] = useState<ScheduledMedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchMedications();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [patientId, encounterId]);

  useEffect(() => {
    // Recalculate times when current time updates
    if (medications.length > 0) {
      updateMedicationTimes();
    }
  }, [currentTime]);

  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      // Fetch active medication orders
      const { data: orders, error: ordersError } = await supabase
        .from("medication_orders")
        .select("*")
        .eq("patient_id", patientId)
        .eq("encounter_id", encounterId)
        .eq("status", "active")
        .eq("is_prn", false);

      if (ordersError) throw ordersError;

      // Fetch scheduled times for today
      const today = new Date().toISOString().split('T')[0];
      const { data: scheduledTimes, error: scheduleError } = await supabase
        .from("medication_schedule_times")
        .select("*")
        .in("medication_order_id", (orders || []).map(o => o.id))
        .eq("scheduled_date", today)
        .order("scheduled_time", { ascending: true });

      // Fetch latest administrations for each medication (fallback)
      const { data: administrations, error: adminError } = await supabase
        .from("medication_administrations")
        .select("*")
        .eq("encounter_id", encounterId)
        .eq("status", "given")
        .order("administered_at", { ascending: false });

      if (adminError) throw adminError;

      // Calculate next due times
      const now = new Date();
      const scheduledMeds: ScheduledMedication[] = (orders || []).map((order) => {
        const intervalHours = frequencyToHours[order.frequency] || 8;
        
        // Check for scheduled times first
        const orderSchedule = (scheduledTimes || []).find(s => s.medication_order_id === order.id && s.status === 'scheduled');
        
        let nextDue: Date;
        if (orderSchedule) {
          // Use actual scheduled time
          const [hours, minutes] = orderSchedule.scheduled_time.split(':').map(Number);
          nextDue = new Date();
          nextDue.setHours(hours, minutes, 0, 0);
        } else {
          // Fallback to calculated time based on last administration
          const lastAdmin = (administrations || []).find(
            (a) => a.medication_order_id === order.id
          );

          if (lastAdmin) {
            nextDue = new Date(new Date(lastAdmin.administered_at).getTime() + intervalHours * 60 * 60 * 1000);
          } else {
            nextDue = new Date(order.start_date);
            if (nextDue < now) {
              nextDue = now;
            }
          }
        }

        const timeDiff = nextDue.getTime() - now.getTime();
        const minutesRemaining = Math.floor(timeDiff / (1000 * 60));
        const hoursRemaining = Math.floor(minutesRemaining / 60);

        let status: "due" | "upcoming" | "overdue" = "upcoming";
        let timeRemaining = "";
        let progressPercent = 0;

        if (timeDiff < 0) {
          status = "overdue";
          const overdueMinutes = Math.abs(minutesRemaining);
          if (overdueMinutes >= 60) {
            timeRemaining = `${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}m overdue`;
          } else {
            timeRemaining = `${overdueMinutes}m overdue`;
          }
          progressPercent = 100;
        } else if (minutesRemaining <= 30) {
          status = "due";
          timeRemaining = `Due in ${minutesRemaining}m`;
          progressPercent = 90;
        } else if (hoursRemaining < 1) {
          status = "due";
          timeRemaining = `Due in ${minutesRemaining}m`;
          progressPercent = 80;
        } else {
          timeRemaining = `${hoursRemaining}h ${minutesRemaining % 60}m`;
          progressPercent = Math.max(0, 100 - (timeDiff / (intervalHours * 60 * 60 * 1000)) * 100);
        }

        return {
          id: order.id,
          medication_name: order.medication_name,
          dosage: order.dosage,
          dosage_unit: order.dosage_unit,
          route: order.route,
          frequency: order.frequency,
          nextDue,
          status,
          timeRemaining,
          progressPercent,
        };
      });

      // Sort by urgency: overdue first, then due, then upcoming
      scheduledMeds.sort((a, b) => {
        const priority = { overdue: 0, due: 1, upcoming: 2 };
        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return a.nextDue.getTime() - b.nextDue.getTime();
      });

      setMedications(scheduledMeds);
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast.error("Failed to load medication schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedicationTimes = () => {
    // Lightweight update of times without re-fetching
    setMedications((prev) => 
      prev.map((med) => {
        const now = currentTime;
        const timeDiff = med.nextDue.getTime() - now.getTime();
        const minutesRemaining = Math.floor(timeDiff / (1000 * 60));
        const hoursRemaining = Math.floor(minutesRemaining / 60);

        let status: "due" | "upcoming" | "overdue" = med.status;
        let timeRemaining = med.timeRemaining;

        if (timeDiff < 0) {
          status = "overdue";
          const overdueMinutes = Math.abs(minutesRemaining);
          if (overdueMinutes >= 60) {
            timeRemaining = `${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}m overdue`;
          } else {
            timeRemaining = `${overdueMinutes}m overdue`;
          }
        } else if (minutesRemaining <= 30) {
          status = "due";
          timeRemaining = `Due in ${minutesRemaining}m`;
        } else if (hoursRemaining < 1) {
          status = "due";
          timeRemaining = `Due in ${minutesRemaining}m`;
        } else {
          status = "upcoming";
          timeRemaining = `${hoursRemaining}h ${minutesRemaining % 60}m`;
        }

        return { ...med, status, timeRemaining };
      })
    );
  };

  const statusConfig = {
    overdue: {
      color: "bg-destructive/10 text-destructive border-destructive/30",
      icon: AlertTriangle,
      progressColor: "bg-destructive",
    },
    due: {
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: Timer,
      progressColor: "bg-amber-500",
    },
    upcoming: {
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: Clock,
      progressColor: "bg-emerald-500",
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Medication Schedule
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchMedications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No scheduled medications</p>
            <p className="text-sm">PRN medications are not shown here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {medications.map((med) => {
                const config = statusConfig[med.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={med.id}
                    className={`p-4 rounded-lg border ${config.color}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{med.medication_name}</h4>
                          <p className="text-sm opacity-80">
                            {med.dosage} {med.dosage_unit} • {med.route}
                          </p>
                          <p className="text-xs opacity-60">{med.frequency}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {med.status === "overdue" ? "Overdue" : med.status === "due" ? "Due Now" : "Upcoming"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{med.timeRemaining}</span>
                        </div>
                        <span className="text-xs opacity-60">
                          Next: {med.nextDue.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <Progress 
                        value={med.progressPercent} 
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {medications.filter((m) => m.status === "overdue").length} overdue
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Timer className="h-4 w-4" />
              {medications.filter((m) => m.status === "due").length} due now
            </div>
          </div>
          <div className="text-muted-foreground">
            {medications.length} total scheduled
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
