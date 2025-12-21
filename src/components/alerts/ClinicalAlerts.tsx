import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Thermometer,
  Activity,
  Pill,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "vitals" | "medication" | "lab" | "protocol" | "system";

export interface ClinicalAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  patientId?: string;
  patientName?: string;
  mrn?: string;
  encounterId?: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actionUrl?: string;
  value?: string | number;
  normalRange?: string;
}

const MOCK_ALERTS: ClinicalAlert[] = [
  {
    id: "1",
    title: "Critical Blood Pressure",
    description: "Systolic BP > 180 mmHg requires immediate attention",
    severity: "critical",
    category: "vitals",
    patientName: "Sarah Moyo",
    mrn: "MRN-2025-000001",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    acknowledged: false,
    value: "185/110",
    normalRange: "90-140/60-90",
  },
  {
    id: "2",
    title: "Medication Due",
    description: "Insulin administration overdue by 30 minutes",
    severity: "warning",
    category: "medication",
    patientName: "Tendai Mwari",
    mrn: "MRN-2025-000002",
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "3",
    title: "Abnormal Lab Result",
    description: "Potassium level critically low",
    severity: "critical",
    category: "lab",
    patientName: "James Nyathi",
    mrn: "MRN-2025-000003",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    acknowledged: false,
    value: "2.8 mEq/L",
    normalRange: "3.5-5.0",
  },
  {
    id: "4",
    title: "Sepsis Protocol Triggered",
    description: "qSOFA score ≥2, consider sepsis workup",
    severity: "critical",
    category: "protocol",
    patientName: "Grace Mutamba",
    mrn: "MRN-2025-000004",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "5",
    title: "Fall Risk Assessment Due",
    description: "Patient requires fall risk reassessment",
    severity: "info",
    category: "protocol",
    patientName: "Peter Chiweza",
    mrn: "MRN-2025-000005",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "6",
    title: "Low Oxygen Saturation",
    description: "SpO2 dropped below 92%",
    severity: "warning",
    category: "vitals",
    patientName: "Mary Sibanda",
    mrn: "MRN-2025-000006",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 5 * 60 * 1000),
    value: "89%",
    normalRange: ">94%",
  },
];

const severityConfig: Record<
  AlertSeverity,
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

const categoryIcons: Record<AlertCategory, React.ComponentType<{ className?: string }>> = {
  vitals: Heart,
  medication: Pill,
  lab: Activity,
  protocol: Clock,
  system: Bell,
};

interface ClinicalAlertsProps {
  encounterId?: string;
  showHeader?: boolean;
}

export function ClinicalAlerts({ encounterId, showHeader = true }: ClinicalAlertsProps) {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              acknowledged: true,
              acknowledgedAt: new Date(),
              acknowledgedBy: "Current User",
            }
          : alert
      )
    );
  };

  const handleDismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const AlertCard = ({ alert }: { alert: ClinicalAlert }) => {
    const config = severityConfig[alert.severity];
    const CategoryIcon = categoryIcons[alert.category];
    const SeverityIcon = config.icon;

    return (
      <Card className={`border ${config.bgColor} ${alert.acknowledged ? "opacity-60" : ""}`}>
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
              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              
              {alert.patientName && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="font-medium">{alert.patientName}</span>
                  <span className="text-muted-foreground">({alert.mrn})</span>
                </div>
              )}

              {alert.value && (
                <div className="mt-2 p-2 bg-background rounded border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className={`font-mono font-bold ${config.color}`}>
                      {alert.value}
                    </span>
                  </div>
                  {alert.normalRange && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Normal Range:</span>
                      <span>{alert.normalRange}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CategoryIcon className="w-3 h-3" />
                  <span className="capitalize">{alert.category}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                </div>
                
                {!alert.acknowledged ? (
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
  const [alerts] = useState<ClinicalAlert[]>(MOCK_ALERTS);
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;

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
