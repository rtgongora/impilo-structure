import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import { format, parseISO, isToday, isBefore, addMinutes, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface ScheduledDose {
  id: string;
  medication_order_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  medication_order?: {
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    route: string;
    patient_id: string;
    patient?: {
      first_name: string;
      last_name: string;
      mrn: string;
    };
  };
}

interface MedicationDueAlertsProps {
  className?: string;
  limit?: number;
}

export function MedicationDueAlerts({ className, limit = 10 }: MedicationDueAlertsProps) {
  const [dueAlerts, setDueAlerts] = useState<ScheduledDose[]>([]);
  const [overdueAlerts, setOverdueAlerts] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendNotification, permission } = usePushNotifications();

  const fetchDueMedications = async () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    const thirtyMinutesLater = format(addMinutes(now, 30), 'HH:mm');

    try {
      // Fetch scheduled doses for today that are due soon or overdue
      const { data, error } = await supabase
        .from('medication_schedule_times')
        .select(`
          id,
          medication_order_id,
          scheduled_date,
          scheduled_time,
          status,
          medication_orders!medication_schedule_times_medication_order_id_fkey (
            medication_name,
            dosage,
            dosage_unit,
            route,
            patient_id,
            patients!medication_orders_patient_id_fkey (
              first_name,
              last_name,
              mrn
            )
          )
        `)
        .eq('scheduled_date', todayStr)
        .eq('status', 'scheduled')
        .order('scheduled_time', { ascending: true })
        .limit(limit * 2);

      if (error) throw error;

      const doses = (data || []).map((d: any) => ({
        ...d,
        medication_order: d.medication_orders ? {
          ...d.medication_orders,
          patient: d.medication_orders.patients,
        } : undefined,
      }));

      // Separate overdue and upcoming
      const overdue: ScheduledDose[] = [];
      const upcoming: ScheduledDose[] = [];

      doses.forEach((dose: ScheduledDose) => {
        if (dose.scheduled_time < currentTime) {
          overdue.push(dose);
        } else if (dose.scheduled_time <= thirtyMinutesLater) {
          upcoming.push(dose);
        }
      });

      setOverdueAlerts(overdue.slice(0, limit));
      setDueAlerts(upcoming.slice(0, limit));

      // Send notifications for overdue medications
      if (permission === 'granted' && overdue.length > 0) {
        overdue.slice(0, 3).forEach((dose) => {
          const patientName = dose.medication_order?.patient
            ? `${dose.medication_order.patient.first_name} ${dose.medication_order.patient.last_name}`
            : 'Unknown Patient';

          sendNotification('Overdue Medication', {
            body: `${dose.medication_order?.medication_name || 'Medication'} for ${patientName} was due at ${dose.scheduled_time}`,
            tag: `overdue-${dose.id}`,
            requireInteraction: true,
          });
        });
      }
    } catch (error) {
      console.error('Failed to fetch due medications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueMedications();
    
    // Refresh every minute to update due times
    const interval = setInterval(fetchDueMedications, 60000);
    
    return () => clearInterval(interval);
  }, [permission]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('medication-schedules')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_schedule_times',
        },
        () => {
          fetchDueMedications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsAdministered = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('medication_schedule_times')
        .update({
          status: 'given',
          administered_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Medication marked as administered');
      fetchDueMedications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const dismissAlert = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('medication_schedule_times')
        .update({
          status: 'missed',
          notes: 'Dismissed from alerts',
        })
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Alert dismissed');
      fetchDueMedications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to dismiss');
    }
  };

  const totalAlerts = overdueAlerts.length + dueAlerts.length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Medication Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading alerts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Medication Alerts
            {totalAlerts > 0 && (
              <Badge variant="destructive">{totalAlerts}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {totalAlerts === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm">No medication alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue
                  </h4>
                  {overdueAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      isOverdue
                      onAdminister={() => markAsAdministered(alert.id)}
                      onDismiss={() => dismissAlert(alert.id)}
                    />
                  ))}
                </div>
              )}

              {dueAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    Due Soon
                  </h4>
                  {dueAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      isOverdue={false}
                      onAdminister={() => markAsAdministered(alert.id)}
                      onDismiss={() => dismissAlert(alert.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: ScheduledDose;
  isOverdue: boolean;
  onAdminister: () => void;
  onDismiss: () => void;
}

function AlertItem({ alert, isOverdue, onAdminister, onDismiss }: AlertItemProps) {
  const patientName = alert.medication_order?.patient
    ? `${alert.medication_order.patient.first_name} ${alert.medication_order.patient.last_name}`
    : 'Unknown Patient';

  return (
    <div
      className={`p-3 rounded-lg border ${
        isOverdue
          ? 'bg-destructive/5 border-destructive/30'
          : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {alert.medication_order?.medication_name || 'Unknown Medication'}
            </span>
            <Badge variant="outline" className="text-xs shrink-0">
              {alert.scheduled_time}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {alert.medication_order?.dosage} {alert.medication_order?.dosage_unit} •{' '}
            {alert.medication_order?.route}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Patient: {patientName}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
            title="Mark as administered"
            onClick={onAdminister}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Dismiss"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
