import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";

interface QCDataPoint {
  id: string;
  run_date: string;
  measured_value: number;
  target_value: number;
  sd: number;
  lot_number: string;
  westgard_status: string;
  westgard_rules_violated: string[];
}

interface LeveyJenningsChartProps {
  data: QCDataPoint[];
  testName: string;
  unit?: string;
  showViolationsOnly?: boolean;
}

export function LeveyJenningsChart({ data, testName, unit = "", showViolationsOnly = false }: LeveyJenningsChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], mean: 0, sd: 0 };

    // Calculate mean and SD from target values (assuming they're consistent)
    const mean = data[0]?.target_value || 0;
    const sd = data[0]?.sd || 1;

    const points = data.map((point, index) => {
      const zScore = (point.measured_value - mean) / sd;
      return {
        index: index + 1,
        date: format(new Date(point.run_date), "MMM d"),
        fullDate: format(new Date(point.run_date), "MMM d, yyyy HH:mm"),
        value: point.measured_value,
        zScore: Math.round(zScore * 100) / 100,
        status: point.westgard_status,
        violations: point.westgard_rules_violated,
        lotNumber: point.lot_number,
        mean,
        plus1SD: mean + sd,
        plus2SD: mean + 2 * sd,
        plus3SD: mean + 3 * sd,
        minus1SD: mean - sd,
        minus2SD: mean - 2 * sd,
        minus3SD: mean - 3 * sd,
      };
    });

    return { points, mean, sd };
  }, [data]);

  const filteredPoints = showViolationsOnly 
    ? chartData.points.filter(p => p.status !== "pass")
    : chartData.points;

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.points.length === 0) return null;

    const values = chartData.points.map(p => p.value);
    const n = values.length;
    const measuredMean = values.reduce((a, b) => a + b, 0) / n;
    const measuredSD = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - measuredMean, 2), 0) / (n - 1));
    const cv = (measuredSD / measuredMean) * 100;

    const passCount = chartData.points.filter(p => p.status === "pass").length;
    const warnCount = chartData.points.filter(p => p.status === "warning").length;
    const failCount = chartData.points.filter(p => p.status === "fail").length;

    // Trend detection (simple linear regression)
    const xMean = (n + 1) / 2;
    let numerator = 0;
    let denominator = 0;
    chartData.points.forEach((p, i) => {
      numerator += (i + 1 - xMean) * (p.value - measuredMean);
      denominator += Math.pow(i + 1 - xMean, 2);
    });
    const slope = numerator / denominator;
    const trend = slope > 0.1 ? "increasing" : slope < -0.1 ? "decreasing" : "stable";

    return {
      measuredMean: Math.round(measuredMean * 100) / 100,
      measuredSD: Math.round(measuredSD * 100) / 100,
      cv: Math.round(cv * 10) / 10,
      passCount,
      warnCount,
      failCount,
      trend,
      totalRuns: n
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <div className="font-medium mb-1">{point.fullDate}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-mono">{point.value} {unit}</span>
          <span className="text-muted-foreground">Z-Score:</span>
          <span className={`font-mono ${Math.abs(point.zScore) > 2 ? "text-destructive" : ""}`}>
            {point.zScore > 0 ? "+" : ""}{point.zScore}
          </span>
          <span className="text-muted-foreground">Lot:</span>
          <span>{point.lotNumber}</span>
          <span className="text-muted-foreground">Status:</span>
          <span>
            <Badge 
              variant="outline" 
              className={
                point.status === "pass" ? "bg-green-500/20 text-green-700" :
                point.status === "warning" ? "bg-amber-500/20 text-amber-700" :
                "bg-destructive/20 text-destructive"
              }
            >
              {point.status}
            </Badge>
          </span>
        </div>
        {point.violations?.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">Violations:</div>
            <div className="flex flex-wrap gap-1">
              {point.violations.map((v: string) => (
                <Badge key={v} variant="outline" className="bg-destructive/20 text-destructive text-xs">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{testName} - Levey-Jennings Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No QC data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{testName} - Levey-Jennings Chart</CardTitle>
          {stats && (
            <div className="flex items-center gap-2">
              {stats.trend === "increasing" && (
                <Badge variant="outline" className="gap-1 bg-amber-500/20 text-amber-700">
                  <TrendingUp className="h-3 w-3" />
                  Trending Up
                </Badge>
              )}
              {stats.trend === "decreasing" && (
                <Badge variant="outline" className="gap-1 bg-amber-500/20 text-amber-700">
                  <TrendingDown className="h-3 w-3" />
                  Trending Down
                </Badge>
              )}
              {stats.failCount > 0 && (
                <Badge variant="outline" className="gap-1 bg-destructive/20 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.failCount} Failures
                </Badge>
              )}
              {stats.failCount === 0 && stats.warnCount === 0 && (
                <Badge variant="outline" className="gap-1 bg-green-500/20 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  In Control
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Mean</div>
              <div className="font-mono font-medium">{stats.measuredMean} {unit}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">SD</div>
              <div className="font-mono font-medium">{stats.measuredSD}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CV%</div>
              <div className="font-mono font-medium">{stats.cv}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Runs</div>
              <div className="font-mono font-medium">{stats.totalRuns}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
              <div className="font-mono font-medium text-green-600">
                {Math.round((stats.passCount / stats.totalRuns) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Warnings/Fails</div>
              <div className="font-mono font-medium">
                <span className="text-amber-600">{stats.warnCount}</span>
                {" / "}
                <span className="text-destructive">{stats.failCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredPoints} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[
                  (dataMin: number) => Math.min(dataMin, chartData.mean - 3.5 * chartData.sd),
                  (dataMax: number) => Math.max(dataMax, chartData.mean + 3.5 * chartData.sd)
                ]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for SD levels */}
              <ReferenceLine 
                y={chartData.mean} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                label={{ value: "Mean", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean + chartData.sd} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: "+1SD", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean - chartData.sd} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: "-1SD", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean + 2 * chartData.sd} 
                stroke="hsl(45 93% 47%)" 
                strokeDasharray="3 3"
                label={{ value: "+2SD", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean - 2 * chartData.sd} 
                stroke="hsl(45 93% 47%)" 
                strokeDasharray="3 3"
                label={{ value: "-2SD", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean + 3 * chartData.sd} 
                stroke="hsl(0 84% 60%)" 
                strokeWidth={2}
                label={{ value: "+3SD", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={chartData.mean - 3 * chartData.sd} 
                stroke="hsl(0 84% 60%)" 
                strokeWidth={2}
                label={{ value: "-3SD", position: "right", fontSize: 10 }}
              />

              {/* Data line */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const color = payload.status === "pass" 
                    ? "hsl(142 76% 36%)"
                    : payload.status === "warning"
                    ? "hsl(45 93% 47%)"
                    : "hsl(0 84% 60%)";
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={5} 
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Fail</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 border-t-2 border-dashed border-amber-500" />
            <span>±2SD</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 border-t-2 border-destructive" />
            <span>±3SD</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
