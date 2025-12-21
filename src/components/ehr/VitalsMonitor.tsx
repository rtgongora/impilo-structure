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

interface VitalReading {
  value: number;
  timestamp: Date;
}

interface VitalConfig {
  id: string;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
  color: string;
  iconColor: string;
}

interface VitalData {
  current: number | string;
  trend: VitalReading[];
  lastUpdated: Date;
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
  },
];

// Generate mock historical data
const generateTrendData = (baseValue: number, variance: number, count: number): VitalReading[] => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    value: baseValue + (Math.random() - 0.5) * variance * 2,
    timestamp: new Date(now.getTime() - (count - i - 1) * 15 * 60 * 1000), // 15 min intervals
  }));
};

// Mock vitals data with trends
const MOCK_VITALS_DATA: Record<string, VitalData> = {
  sbp: {
    current: 142,
    trend: generateTrendData(135, 10, 12),
    lastUpdated: new Date(),
  },
  dbp: {
    current: 88,
    trend: generateTrendData(82, 8, 12),
    lastUpdated: new Date(),
  },
  hr: {
    current: 78,
    trend: generateTrendData(75, 8, 12),
    lastUpdated: new Date(),
  },
  temp: {
    current: 38.2,
    trend: generateTrendData(37.8, 0.5, 12),
    lastUpdated: new Date(),
  },
  rr: {
    current: 18,
    trend: generateTrendData(16, 3, 12),
    lastUpdated: new Date(),
  },
  spo2: {
    current: 94,
    trend: generateTrendData(96, 2, 12),
    lastUpdated: new Date(),
  },
};

type VitalStatus = "normal" | "warning" | "critical";

const getVitalStatus = (value: number, config: VitalConfig): VitalStatus => {
  if (value < config.criticalRange.min || value > config.criticalRange.max) {
    return "critical";
  }
  if (value < config.normalRange.min || value > config.normalRange.max) {
    return "warning";
  }
  return "normal";
};

const getTrendDirection = (trend: VitalReading[]): "up" | "down" | "stable" => {
  if (trend.length < 2) return "stable";
  const recent = trend.slice(-3);
  const first = recent[0].value;
  const last = recent[recent.length - 1].value;
  const diff = last - first;
  const threshold = (first * 0.05); // 5% threshold
  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "stable";
};

interface VitalCardProps {
  config: VitalConfig;
  data: VitalData;
  compact?: boolean;
}

function VitalCard({ config, data, compact = false }: VitalCardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const currentValue = typeof data.current === "number" ? data.current : parseFloat(data.current as string);
  const status = getVitalStatus(currentValue, config);
  const trendDirection = getTrendDirection(data.trend);
  const Icon = config.icon;

  // Flash effect for abnormal values
  useEffect(() => {
    if (status === "critical") {
      const interval = setInterval(() => {
        setIsFlashing((prev) => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsFlashing(false);
    }
  }, [status]);

  const statusStyles = {
    normal: "bg-muted/50 border-border",
    warning: "bg-warning/10 border-warning/50",
    critical: cn(
      "border-critical/50",
      isFlashing ? "bg-critical/20" : "bg-critical/10"
    ),
  };

  const valueStyles = {
    normal: "text-foreground",
    warning: "text-warning",
    critical: "text-critical",
  };

  const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;

  const chartData = data.trend.map((reading) => ({
    value: reading.value,
    time: format(reading.timestamp, "HH:mm"),
  }));

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
              statusStyles[status]
            )}
          >
            <Icon className={cn("w-4 h-4", config.iconColor)} />
            <div className="flex items-center gap-1.5">
              <span className={cn("font-mono font-semibold text-sm", valueStyles[status])}>
                {currentValue.toFixed(config.id === "temp" ? 1 : 0)}
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
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Normal: {config.normalRange.min}-{config.normalRange.max}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(data.lastUpdated, "HH:mm")}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        statusStyles[status]
      )}
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
            {currentValue.toFixed(config.id === "temp" ? 1 : 0)}
          </span>
          <span className="text-sm text-muted-foreground">{config.unit}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className={cn(
            "w-3.5 h-3.5",
            trendDirection === "up" ? "text-critical" : trendDirection === "down" ? "text-success" : "text-muted-foreground"
          )} />
          {trendDirection === "up" ? "Rising" : trendDirection === "down" ? "Falling" : "Stable"}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-10 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
        <span>Range: {config.normalRange.min}-{config.normalRange.max}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {format(data.lastUpdated, "HH:mm")}
        </span>
      </div>
    </motion.div>
  );
}

interface VitalsMonitorProps {
  compact?: boolean;
}

export function VitalsMonitor({ compact = true }: VitalsMonitorProps) {
  const [vitalsData, setVitalsData] = useState(MOCK_VITALS_DATA);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVitalsData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          const config = VITAL_CONFIGS.find((c) => c.id === key);
          if (!config) return;
          
          const currentValue = typeof updated[key].current === "number" 
            ? updated[key].current as number 
            : parseFloat(updated[key].current as string);
          
          // Small random variation
          const variation = (Math.random() - 0.5) * 2;
          const newValue = currentValue + variation;
          
          updated[key] = {
            ...updated[key],
            current: newValue,
            trend: [
              ...updated[key].trend.slice(1),
              { value: newValue, timestamp: new Date() },
            ],
            lastUpdated: new Date(),
          };
        });
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter to show unique vitals (combine BP into one display)
  const displayConfigs = VITAL_CONFIGS.filter((c) => c.id !== "dbp");

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <AnimatePresence mode="popLayout">
          {displayConfigs.map((config) => {
            const data = vitalsData[config.id];
            if (!data) return null;

            // For BP, show combined value
            if (config.id === "sbp") {
              const sbp = vitalsData.sbp?.current;
              const dbp = vitalsData.dbp?.current;
              const sbpValue = typeof sbp === "number" ? sbp : parseFloat(sbp as string);
              const dbpValue = typeof dbp === "number" ? dbp : parseFloat(dbp as string);
              const sbpStatus = getVitalStatus(sbpValue, VITAL_CONFIGS[0]);
              const dbpStatus = getVitalStatus(dbpValue, VITAL_CONFIGS[1]);
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
                        worstStatus === "normal" ? "bg-muted/50 border-border" :
                        worstStatus === "warning" ? "bg-warning/10 border-warning/50" :
                        "bg-critical/10 border-critical/50"
                      )}
                    >
                      <Heart className="w-4 h-4 text-critical" />
                      <span className={cn(
                        "font-mono font-semibold text-sm",
                        worstStatus === "normal" ? "text-foreground" :
                        worstStatus === "warning" ? "text-warning" : "text-critical"
                      )}>
                        {sbpValue.toFixed(0)}/{dbpValue.toFixed(0)}
                      </span>
                      {worstStatus !== "normal" && (
                        <AlertTriangle className={cn(
                          "w-3.5 h-3.5",
                          worstStatus === "critical" ? "text-critical" : "text-warning"
                        )} />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Blood Pressure</div>
                      <div className="text-muted-foreground">
                        Systolic: {sbpValue.toFixed(0)} (Normal: 90-140)
                      </div>
                      <div className="text-muted-foreground">
                        Diastolic: {dbpValue.toFixed(0)} (Normal: 60-90)
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <VitalCard key={config.id} config={config} data={data} compact />;
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Blood Pressure Card - Combined */}
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
            {(vitalsData.sbp?.current as number)?.toFixed(0)}/{(vitalsData.dbp?.current as number)?.toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">mmHg</span>
        </div>
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vitalsData.sbp?.trend.map((r, i) => ({
              sbp: r.value,
              dbp: vitalsData.dbp?.trend[i]?.value,
            }))}>
              <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
              <Line type="monotone" dataKey="sbp" stroke="hsl(var(--critical))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="dbp" stroke="hsl(var(--critical) / 0.5)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {VITAL_CONFIGS.filter((c) => c.id !== "sbp" && c.id !== "dbp").map((config) => {
        const data = vitalsData[config.id];
        if (!data) return null;
        return <VitalCard key={config.id} config={config} data={data} />;
      })}
    </div>
  );
}
