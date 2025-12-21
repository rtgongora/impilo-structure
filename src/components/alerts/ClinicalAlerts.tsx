import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  Bell,
  Heart,
  Activity,
  Pill,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useClinicalAlerts, ClinicalAlert } from "@/hooks/useClinicalAlerts";
import { Skeleton } from "@/components/ui/skeleton";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "vitals" | "medication" | "lab" | "protocol" | "system";

const severityConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: {
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/30",
    icon: AlertTriangle,
  },
  warning: {
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/30",
    icon: AlertTriangle,
  },
  info: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: Bell,
  },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vitals: Heart,
  vital_abnormal: Heart,
  medication: Pill,
  medication_due: Pill,
  lab: Activity,
  lab_critical: Activity,
  protocol: Clock,
  allergy: AlertTriangle,
  fall_risk: AlertTriangle,
  system: Bell,
};

interface ClinicalAlertsProps {
  encounterId?: string;
  patientId?: string;
  showHeader?: boolean;
}

export function ClinicalAlerts({ encounterId, patientId, showHeader = true }: ClinicalAlertsProps) {
  const { 
    alerts, 
    activeAlerts, 
    criticalCount, 
    warningCount, 
    loading,
    acknowledgeAlert, 
    resolveAlert 
  } = useClinicalAlerts(patientId, encounterId);
  
  const [filter, setFilter] = useState<string>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
  };

  const handleDismiss = async (alertId: string) => {
    await resolveAlert(alertId);
  };

  const AlertCard = ({ alert }: { alert: ClinicalAlert }) => {
    const config = severityConfig[alert.severity] || severityConfig.info;
    const CategoryIcon = categoryIcons[alert.alert_type] || Bell;
    const SeverityIcon = config.icon;

    return (
      <Card className={`border ${config.bgColor} ${alert.is_acknowledged ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <SeverityIcon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <Badge
                  variant={
                    alert.severity === "critical"
                      ? "destructive"
                      : alert.severity === "warning"
                      ? "default"
                      : "secondary"
                  }
                  className="shrink-0"
                >
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              
              {alert.patient && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="font-medium">
                    {alert.patient.first_name} {alert.patient.last_name}
                  </span>
                  <span className="text-muted-foreground">({alert.patient.mrn})</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CategoryIcon className="w-3 h-3" />
                  <span className="capitalize">{alert.alert_type.replace("_", " ")}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                </div>
                
                {!alert.is_acknowledged ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Acknowledge
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Acknowledged
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && <Skeleton className="h-8 w-48" />}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Clinical Alerts</h3>
            <p className="text-sm text-muted-foreground">
              {activeAlerts.length} active alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Critical</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="default">{warningCount} Warning</Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(["all", "critical", "warning", "info"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No alerts to display
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Alert Badge Component for TopBar
export function AlertBadge() {
  const { activeAlerts, criticalCount } = useClinicalAlerts();

  if (activeAlerts.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${
            criticalCount > 0
              ? "text-destructive hover:text-destructive hover:bg-destructive/10"
              : "text-warning hover:text-warning hover:bg-warning/10"
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white ${
              criticalCount > 0 ? "bg-destructive" : "bg-warning"
            }`}
          >
            {activeAlerts.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Clinical Alerts
          </SheetTitle>
          <SheetDescription>
            Review and acknowledge patient alerts
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ClinicalAlerts showHeader={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
