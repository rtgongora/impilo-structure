/**
 * Live Vitals Monitor
 * Displays real patient vital signs from database with real-time updates
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useVitalSigns } from "@/hooks/useVitalSigns";

interface VitalConfig {
  id: string;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
  color: string;
  iconColor: string;
  dbField: string;
}

const VITAL_CONFIGS: VitalConfig[] = [
  {
    id: "sbp",
    label: "Systolic BP",
    unit: "mmHg",
    icon: Heart,
    normalRange: { min: 90, max: 140 },
    criticalRange: { min: 80, max: 180 },
    color: "hsl(var(--critical))",
    iconColor: "text-critical",
    dbField: "blood_pressure_systolic",
  },
  {
    id: "dbp",
    label: "Diastolic BP",
    unit: "mmHg",
    icon: Heart,
    normalRange: { min: 60, max: 90 },
    criticalRange: { min: 50, max: 110 },
    color: "hsl(var(--critical))",
    iconColor: "text-critical",
    dbField: "blood_pressure_diastolic",
  },
  {
    id: "hr",
    label: "Heart Rate",
    unit: "bpm",
    icon: Activity,
    normalRange: { min: 60, max: 100 },
    criticalRange: { min: 40, max: 150 },
    color: "hsl(var(--success))",
    iconColor: "text-success",
    dbField: "pulse_rate",
  },
  {
    id: "temp",
    label: "Temperature",
    unit: "°C",
    icon: Thermometer,
    normalRange: { min: 36.1, max: 37.5 },
    criticalRange: { min: 35, max: 39.5 },
    color: "hsl(var(--warning))",
    iconColor: "text-warning",
    dbField: "temperature",
  },
  {
    id: "rr",
    label: "Resp. Rate",
    unit: "/min",
    icon: Wind,
    normalRange: { min: 12, max: 20 },
    criticalRange: { min: 8, max: 30 },
    color: "hsl(var(--primary))",
    iconColor: "text-primary",
    dbField: "respiratory_rate",
  },
  {
    id: "spo2",
    label: "SpO₂",
    unit: "%",
    icon: Droplets,
    normalRange: { min: 95, max: 100 },
    criticalRange: { min: 90, max: 100 },
    color: "hsl(210 100% 50%)",
    iconColor: "text-blue-500",
    dbField: "oxygen_saturation",
  },
];

type VitalStatus = "normal" | "warning" | "critical";

const getVitalStatus = (value: number | null, config: VitalConfig): VitalStatus => {
  if (value === null) return "normal";
  if (value < config.criticalRange.min || value > config.criticalRange.max) {
    return "critical";
  }
  if (value < config.normalRange.min || value > config.normalRange.max) {
    return "warning";
  }
  return "normal";
};

interface VitalReading {
  value: number;
  timestamp: Date;
}

const getTrendDirection = (readings: VitalReading[]): "up" | "down" | "stable" => {
  if (readings.length < 2) return "stable";
  const recent = readings.slice(-3);
  const first = recent[0].value;
  const last = recent[recent.length - 1].value;
  const diff = last - first;
  const threshold = first * 0.05;
  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "stable";
};

interface LiveVitalsMonitorProps {
  encounterId?: string;
  compact?: boolean;
}

export function LiveVitalsMonitor({ encounterId, compact = true }: LiveVitalsMonitorProps) {
  const { vitals, latestVitals, isLoading } = useVitalSigns(encounterId);
  const [isFlashing, setIsFlashing] = useState<Record<string, boolean>>({});

  // Build trend data from vitals history
  const buildTrendData = (dbField: string): VitalReading[] => {
    return vitals
      .filter((v: any) => v[dbField] !== null)
      .map((v: any) => ({
        value: v[dbField] as number,
        timestamp: new Date(v.recorded_at),
      }))
      .slice(-12);
  };

  // Flash effect for critical vitals
  useEffect(() => {
    const criticalVitals: string[] = [];
    VITAL_CONFIGS.forEach((config) => {
      const value = latestVitals?.[config.dbField as keyof typeof latestVitals] as number | null;
      if (value && getVitalStatus(value, config) === "critical") {
        criticalVitals.push(config.id);
      }
    });

    if (criticalVitals.length > 0) {
      const interval = setInterval(() => {
        setIsFlashing((prev) => {
          const newState: Record<string, boolean> = {};
          criticalVitals.forEach((id) => {
            newState[id] = !prev[id];
          });
          return newState;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [latestVitals]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading vitals...</span>
      </div>
    );
  }

  if (!latestVitals) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="w-4 h-4" />
        <span>No vitals recorded</span>
      </div>
    );
  }

  const statusStyles = {
    normal: "bg-muted/50 border-border",
    warning: "bg-warning/10 border-warning/50",
    critical: "border-critical/50",
  };

  const valueStyles = {
    normal: "text-foreground",
    warning: "text-warning",
    critical: "text-critical",
  };

  // Filter to show unique vitals (combine BP into one display)
  const displayConfigs = VITAL_CONFIGS.filter((c) => c.id !== "dbp");

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {displayConfigs.map((config) => {
            const value = latestVitals[config.dbField as keyof typeof latestVitals] as number | null;
            if (value === null) return null;

            // For BP, show combined value
            if (config.id === "sbp") {
              const sbp = latestVitals.blood_pressure_systolic;
              const dbp = latestVitals.blood_pressure_diastolic;
              if (!sbp || !dbp) return null;

              const sbpStatus = getVitalStatus(sbp, VITAL_CONFIGS[0]);
              const dbpStatus = getVitalStatus(dbp, VITAL_CONFIGS[1]);
              const worstStatus = sbpStatus === "critical" || dbpStatus === "critical"
                ? "critical"
                : sbpStatus === "warning" || dbpStatus === "warning"
                  ? "warning"
                  : "normal";

              return (
                <Tooltip key="bp">
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                        statusStyles[worstStatus],
                        worstStatus === "critical" && isFlashing["sbp"] ? "bg-critical/20" : worstStatus === "critical" ? "bg-critical/10" : ""
                      )}
                    >
                      <Heart className="w-4 h-4 text-critical" />
                      <span className={cn("font-mono font-semibold text-sm", valueStyles[worstStatus])}>
                        {sbp}/{dbp}
                      </span>
                      {worstStatus !== "normal" && (
                        <AlertTriangle className={cn("w-3.5 h-3.5", worstStatus === "critical" ? "text-critical" : "text-warning")} />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Blood Pressure</div>
                      <div className="text-muted-foreground">
                        Systolic: {sbp} (Normal: 90-140)
                      </div>
                      <div className="text-muted-foreground">
                        Diastolic: {dbp} (Normal: 60-90)
                      </div>
                      <div className="text-xs mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(latestVitals.recorded_at), "HH:mm")}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            const status = getVitalStatus(value, config);
            const trendData = buildTrendData(config.dbField);
            const trendDirection = getTrendDirection(trendData);
            const Icon = config.icon;
            const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;

            return (
              <Tooltip key={config.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                      statusStyles[status],
                      status === "critical" && isFlashing[config.id] ? "bg-critical/20" : status === "critical" ? "bg-critical/10" : ""
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.iconColor)} />
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-mono font-semibold text-sm", valueStyles[status])}>
                        {config.id === "temp" ? value.toFixed(1) : value}
                      </span>
                      <span className="text-xs text-muted-foreground">{config.unit}</span>
                    </div>
                    {status !== "normal" && (
                      <AlertTriangle className={cn("w-3.5 h-3.5", status === "critical" ? "text-critical" : "text-warning")} />
                    )}
                    <TrendIcon className={cn(
                      "w-3.5 h-3.5",
                      trendDirection === "up" ? "text-critical" : trendDirection === "down" ? "text-success" : "text-muted-foreground"
                    )} />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-0 overflow-hidden">
                  <div className="p-3 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{config.label}</span>
                      <Badge variant="outline" className={cn("text-xs", statusStyles[status])}>
                        {status}
                      </Badge>
                    </div>
                    {trendData.length > 1 && (
                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData.map((r) => ({ value: r.value, time: format(r.timestamp, "HH:mm") }))}>
                            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={config.color}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Normal: {config.normalRange.min}-{config.normalRange.max}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(latestVitals.recorded_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // Extended view
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Blood Pressure Card - Combined */}
      {latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg border bg-muted/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-critical" />
            <span className="text-xs font-medium text-muted-foreground">Blood Pressure</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold">
              {latestVitals.blood_pressure_systolic}/{latestVitals.blood_pressure_diastolic}
            </span>
            <span className="text-sm text-muted-foreground">mmHg</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Normal: 90-140 / 60-90</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(latestVitals.recorded_at), "HH:mm")}
            </span>
          </div>
        </motion.div>
      )}

      {/* Other vitals */}
      {VITAL_CONFIGS.filter((c) => !["sbp", "dbp"].includes(c.id)).map((config) => {
        const value = latestVitals[config.dbField as keyof typeof latestVitals] as number | null;
        if (value === null) return null;

        const status = getVitalStatus(value, config);
        const Icon = config.icon;

        return (
          <motion.div
            key={config.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("p-3 rounded-lg border transition-all", statusStyles[status])}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", config.iconColor)} />
                <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
              </div>
              {status !== "normal" && (
                <Badge variant="outline" className={cn(
                  "text-xs",
                  status === "critical" ? "bg-critical/20 text-critical border-critical/50" : "bg-warning/20 text-warning border-warning/50"
                )}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {status}
                </Badge>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-mono font-bold", valueStyles[status])}>
                  {config.id === "temp" ? value.toFixed(1) : value}
                </span>
                <span className="text-sm text-muted-foreground">{config.unit}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Range: {config.normalRange.min}-{config.normalRange.max}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(latestVitals.recorded_at), "HH:mm")}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
