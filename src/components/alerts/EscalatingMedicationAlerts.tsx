import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Bell, 
  Clock,
  CheckCircle,
  X
} from "lucide-react";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface CriticalAlert {
  id: string;
  medication_order_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  minutesOverdue: number;
  escalationLevel: 'warning' | 'urgent' | 'critical';
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

interface EscalatingMedicationAlertsProps {
  className?: string;
  onAlertCount?: (count: number) => void;
}

// Escalation thresholds in minutes
const ESCALATION_THRESHOLDS = {
  warning: 15,    // 15 minutes overdue
  urgent: 30,     // 30 minutes overdue
  critical: 60,   // 1 hour overdue
};

// Sound frequencies for different escalation levels
const ALERT_FREQUENCIES = {
  warning: { frequency: 440, duration: 200, repeat: 1 },
  urgent: { frequency: 660, duration: 300, repeat: 2 },
  critical: { frequency: 880, duration: 400, repeat: 3 },
};

export function EscalatingMedicationAlerts({ className, onAlertCount }: EscalatingMedicationAlertsProps) {
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [visualFlash, setVisualFlash] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<Record<string, number>>({});
  const { sendNotification, permission } = usePushNotifications();

  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play alert sound
  const playAlertSound = useCallback((level: 'warning' | 'urgent' | 'critical') => {
    if (!audioEnabled) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const config = ALERT_FREQUENCIES[level];
      
      for (let i = 0; i < config.repeat; i++) {
        setTimeout(() => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.value = config.frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration / 1000);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + config.duration / 1000);
        }, i * (config.duration + 100));
      }
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  }, [audioEnabled, initAudio]);

  const fetchCriticalAlerts = useCallback(async () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    try {
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
        .lt('scheduled_time', currentTime)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const alerts: CriticalAlert[] = (data || []).map((d: any) => {
        const scheduledDateTime = parseISO(`${d.scheduled_date}T${d.scheduled_time}`);
        const minutesOverdue = differenceInMinutes(now, scheduledDateTime);
        
        let escalationLevel: 'warning' | 'urgent' | 'critical' = 'warning';
        if (minutesOverdue >= ESCALATION_THRESHOLDS.critical) {
          escalationLevel = 'critical';
        } else if (minutesOverdue >= ESCALATION_THRESHOLDS.urgent) {
          escalationLevel = 'urgent';
        }

        return {
          ...d,
          minutesOverdue,
          escalationLevel,
          medication_order: d.medication_orders ? {
            ...d.medication_orders,
            patient: d.medication_orders.patients,
          } : undefined,
        };
      }).filter((alert: CriticalAlert) => alert.minutesOverdue >= ESCALATION_THRESHOLDS.warning);

      // Sort by escalation level (critical first) then by overdue time
      alerts.sort((a, b) => {
        const levelOrder = { critical: 0, urgent: 1, warning: 2 };
        if (levelOrder[a.escalationLevel] !== levelOrder[b.escalationLevel]) {
          return levelOrder[a.escalationLevel] - levelOrder[b.escalationLevel];
        }
        return b.minutesOverdue - a.minutesOverdue;
      });

      setCriticalAlerts(alerts);
      onAlertCount?.(alerts.length);

      // Trigger audio for new critical alerts
      const criticalCount = alerts.filter(a => a.escalationLevel === 'critical').length;
      const urgentCount = alerts.filter(a => a.escalationLevel === 'urgent').length;

      if (criticalCount > 0) {
        const shouldPlay = alerts.some(a => {
          const lastPlayed = lastPlayedRef.current[a.id] || 0;
          return Date.now() - lastPlayed > 60000; // Play at most every minute per alert
        });
        
        if (shouldPlay) {
          playAlertSound('critical');
          setVisualFlash(true);
          setTimeout(() => setVisualFlash(false), 1000);
          
          alerts.filter(a => a.escalationLevel === 'critical').forEach(a => {
            lastPlayedRef.current[a.id] = Date.now();
          });

          // Send push notification for critical
          if (permission === 'granted') {
            sendNotification('CRITICAL: Medications Overdue', {
              body: `${criticalCount} medication(s) are over 1 hour overdue!`,
              tag: 'critical-meds',
              requireInteraction: true,
            });
          }
        }
      } else if (urgentCount > 0) {
        const shouldPlay = alerts.some(a => {
          const lastPlayed = lastPlayedRef.current[a.id] || 0;
          return Date.now() - lastPlayed > 120000; // Play at most every 2 minutes
        });

        if (shouldPlay) {
          playAlertSound('urgent');
          alerts.filter(a => a.escalationLevel === 'urgent').forEach(a => {
            lastPlayedRef.current[a.id] = Date.now();
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch critical alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [playAlertSound, permission, sendNotification, onAlertCount]);

  useEffect(() => {
    fetchCriticalAlerts();
    
    // Check every 30 seconds
    const interval = setInterval(fetchCriticalAlerts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCriticalAlerts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('escalating-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_schedule_times',
        },
        () => {
          fetchCriticalAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCriticalAlerts]);

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
      delete lastPlayedRef.current[scheduleId];
      fetchCriticalAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const acknowledgeAlert = async (scheduleId: string) => {
    // Prevent sound from playing for this alert for 5 minutes
    lastPlayedRef.current[scheduleId] = Date.now() + (5 * 60 * 1000);
    toast.success('Alert acknowledged for 5 minutes');
  };

  const getEscalationStyles = (level: 'warning' | 'urgent' | 'critical') => {
    switch (level) {
      case 'critical':
        return {
          card: 'bg-red-50 border-red-500 dark:bg-red-950/30',
          badge: 'bg-red-500 text-white animate-pulse',
          icon: 'text-red-500',
        };
      case 'urgent':
        return {
          card: 'bg-orange-50 border-orange-400 dark:bg-orange-950/30',
          badge: 'bg-orange-500 text-white',
          icon: 'text-orange-500',
        };
      case 'warning':
        return {
          card: 'bg-amber-50 border-amber-300 dark:bg-amber-950/30',
          badge: 'bg-amber-500 text-white',
          icon: 'text-amber-500',
        };
    }
  };

  const formatOverdueTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${className} ${visualFlash ? 'ring-4 ring-red-500 ring-opacity-50' : ''} transition-all`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${criticalAlerts.length > 0 ? 'text-red-500 animate-pulse' : ''}`} />
            Critical Alerts
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                initAudio();
                setAudioEnabled(!audioEnabled);
              }}
              title={audioEnabled ? 'Mute alerts' : 'Enable audio alerts'}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
            <p className="text-sm">No critical medication alerts</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {criticalAlerts.map((alert) => {
                const styles = getEscalationStyles(alert.escalationLevel);
                const patientName = alert.medication_order?.patient
                  ? `${alert.medication_order.patient.first_name} ${alert.medication_order.patient.last_name}`
                  : 'Unknown Patient';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-2 ${styles.card}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />
                          <span className="font-semibold">
                            {alert.medication_order?.medication_name || 'Unknown Medication'}
                          </span>
                          <Badge className={styles.badge}>
                            {alert.escalationLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.medication_order?.dosage} {alert.medication_order?.dosage_unit} •{' '}
                          {alert.medication_order?.route}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Patient:</span> {patientName}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Clock className="h-3 w-3" />
                          <span>Due: {alert.scheduled_time}</span>
                          <span className={`font-bold ${styles.icon}`}>
                            ({formatOverdueTime(alert.minutesOverdue)} overdue)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => markAsAdministered(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Give
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Ack
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>15+ min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>30+ min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>60+ min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
