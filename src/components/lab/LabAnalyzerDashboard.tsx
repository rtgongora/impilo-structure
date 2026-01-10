import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLabAnalyzers, type LabAnalyzer } from "@/hooks/lims/useLabAnalyzers";
import { useQCRuns, useQCLots, checkWestgardRules } from "@/hooks/lims/useLabQC";
import { LeveyJenningsChart } from "./LeveyJenningsChart";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Wrench,
  Wifi,
  WifiOff,
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export function LabAnalyzerDashboard() {
  const { analyzers, loading, stats, refetch, updateAnalyzerStatus } = useLabAnalyzers();
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<LabAnalyzer | null>(null);
  const [showQCDialog, setShowQCDialog] = useState(false);

  const getStatusIcon = (status: LabAnalyzer["status"]) => {
    switch (status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "calibrating":
        return <Settings className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: LabAnalyzer["status"]) => {
    const variants: Record<string, string> = {
      online: "bg-green-500",
      offline: "bg-gray-500",
      maintenance: "bg-orange-500",
      error: "bg-red-500",
      calibrating: "bg-blue-500",
    };
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Analyzers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.online}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.error}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageUptime.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyzer Grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analyzers</h2>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-3 text-center text-muted-foreground py-8">Loading analyzers...</p>
        ) : analyzers.length === 0 ? (
          <p className="col-span-3 text-center text-muted-foreground py-8">No analyzers configured</p>
        ) : (
          analyzers.map(analyzer => (
            <Card key={analyzer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getStatusIcon(analyzer.status)}
                    {analyzer.name}
                  </CardTitle>
                  {getStatusBadge(analyzer.status)}
                </div>
                <CardDescription>{analyzer.manufacturer} {analyzer.model}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{analyzer.department || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Connection</p>
                    <p className="font-medium">{analyzer.connection_type?.toUpperCase() || "Manual"}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime</span>
                    <span>{analyzer.uptime_percent}%</span>
                  </div>
                  <Progress value={analyzer.uptime_percent} className="h-2" />
                </div>

                {analyzer.next_maintenance_at && (
                  <div className="text-xs text-muted-foreground">
                    Next maintenance: {format(new Date(analyzer.next_maintenance_at), "dd MMM yyyy")}
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedAnalyzer(analyzer)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        QC
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>QC Dashboard - {analyzer.name}</DialogTitle>
                      </DialogHeader>
                      <AnalyzerQCPanel analyzerId={analyzer.id} />
                    </DialogContent>
                  </Dialog>
                  
                  <Select 
                    value={analyzer.status}
                    onValueChange={(value) => updateAnalyzerStatus(analyzer.id, value as LabAnalyzer["status"])}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="calibrating">Calibrating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyzerQCPanel({ analyzerId }: { analyzerId: string }) {
  const { runs, loading, recordQCRun, reviewQCRun } = useQCRuns(analyzerId);
  const { lots } = useQCLots(analyzerId);
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [qcValue, setQcValue] = useState("");

  const handleRecordQC = async () => {
    if (!selectedLot || !qcValue) return;
    await recordQCRun(selectedLot, analyzerId, parseFloat(qcValue));
    setQcValue("");
  };

  const getStatusBadge = (status: string, violations?: string[] | null) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "rejected":
        return (
          <Badge variant="destructive">
            Rejected {violations?.length ? `(${violations.join(", ")})` : ""}
          </Badge>
        );
      case "warning":
        return <Badge className="bg-orange-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getZScoreIndicator = (zScore: number | null) => {
    if (zScore === null) return null;
    if (zScore > 2) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (zScore < -2) return <TrendingDown className="h-4 w-4 text-red-500" />;
    if (Math.abs(zScore) > 1) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  return (
    <Tabs defaultValue="record">
      <TabsList>
        <TabsTrigger value="record">Record QC</TabsTrigger>
        <TabsTrigger value="history">QC History</TabsTrigger>
        <TabsTrigger value="chart">Levey-Jennings</TabsTrigger>
      </TabsList>

      <TabsContent value="record" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record QC Run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>QC Lot</Label>
                <Select value={selectedLot} onValueChange={setSelectedLot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select QC lot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.material_name} - {lot.level} (Lot: {lot.lot_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Result Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={qcValue}
                  onChange={(e) => setQcValue(e.target.value)}
                  placeholder="Enter QC value..."
                />
              </div>
            </div>

            {selectedLot && lots.find(l => l.id === selectedLot) && (
              <div className="p-3 bg-accent/50 rounded-lg text-sm">
                <p>
                  <strong>Target:</strong> {lots.find(l => l.id === selectedLot)?.target_mean} ± {lots.find(l => l.id === selectedLot)?.target_sd} {lots.find(l => l.id === selectedLot)?.unit}
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleRecordQC}
              disabled={!selectedLot || !qcValue}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record QC Run
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-auto">
              {loading ? (
                <p className="text-center py-4 text-muted-foreground">Loading...</p>
              ) : runs.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No QC runs recorded</p>
              ) : (
                runs.slice(0, 20).map(run => (
                  <div key={run.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {getZScoreIndicator(run.z_score)}
                        <span className="font-medium">{run.result_value}</span>
                        <span className="text-muted-foreground">{run.qc_lot?.unit}</span>
                        {run.z_score !== null && (
                          <span className="text-xs text-muted-foreground">
                            (z={run.z_score.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {run.qc_lot?.material_name} • {format(new Date(run.run_time), "dd MMM HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(run.status, run.westgard_rules_violated)}
                      {run.status === "pending" && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reviewQCRun(run.id, true)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chart">
        <LeveyJenningsChartWrapper runs={runs} lots={lots} />
      </TabsContent>
    </Tabs>
  );
}

function LeveyJenningsChartWrapper({ runs, lots }: { runs: any[]; lots: any[] }) {
  const [selectedLotId, setSelectedLotId] = useState<string>("");

  // Transform runs into chart data format
  const chartData = useMemo(() => {
    const filteredRuns = selectedLotId 
      ? runs.filter(r => r.qc_lot_id === selectedLotId)
      : runs;
    
    const lot = lots.find(l => l.id === selectedLotId);
    
    return filteredRuns.map(run => ({
      id: run.id,
      run_date: run.run_time,
      measured_value: run.result_value,
      target_value: lot?.target_mean || run.qc_lot?.target_mean || 100,
      sd: lot?.target_sd || run.qc_lot?.target_sd || 5,
      lot_number: run.qc_lot?.lot_number || "Unknown",
      westgard_status: run.status === "accepted" ? "pass" : run.status === "rejected" ? "fail" : "warning",
      westgard_rules_violated: run.westgard_rules_violated || []
    }));
  }, [runs, lots, selectedLotId]);

  const selectedLot = lots.find(l => l.id === selectedLotId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>QC Material:</Label>
        <Select value={selectedLotId} onValueChange={setSelectedLotId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select QC material..." />
          </SelectTrigger>
          <SelectContent>
            {lots.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.material_name} - {lot.level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedLotId ? (
        <LeveyJenningsChart 
          data={chartData}
          testName={selectedLot?.material_name || "QC"}
          unit={selectedLot?.unit || ""}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Select a QC material to view the Levey-Jennings chart
          </CardContent>
        </Card>
      )}
    </div>
  );
}
