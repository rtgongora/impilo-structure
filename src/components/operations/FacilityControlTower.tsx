// Facility Control Tower (PCT-OPS-01)
// Real-time operations dashboard for facility supervisors

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
  FlaskConical,
  Activity,
  TrendingUp,
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getFacilityOperationsDashboard,
  getActivePatientsByState,
} from "@/services/patientCareTrackerService";
import type { FacilityOperationsDashboard, PatientCareState, CareState } from "@/types/patientCareTracker";
import { CARE_STATE_CONFIG } from "@/types/patientCareTracker";

interface FacilityControlTowerProps {
  facilityId: string;
  facilityName?: string;
}

export function FacilityControlTower({ facilityId, facilityName }: FacilityControlTowerProps) {
  const [dashboard, setDashboard] = useState<FacilityOperationsDashboard | null>(null);
  const [activePatients, setActivePatients] = useState<PatientCareState[]>([]);
  const [selectedState, setSelectedState] = useState<CareState | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadData();
  }, [facilityId]);

  const loadData = async () => {
    setLoading(true);
    const [dashboardData, patients] = await Promise.all([
      getFacilityOperationsDashboard(facilityId),
      getActivePatientsByState(facilityId),
    ]);
    setDashboard(dashboardData);
    setActivePatients(patients);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredPatients = selectedState === "all"
    ? activePatients
    : activePatients.filter((p) => p.careState === selectedState);

  const getStateIcon = (state: CareState) => {
    switch (state) {
      case "waiting":
        return Clock;
      case "in_service":
        return Activity;
      case "pending_results":
        return FlaskConical;
      case "pending_disposition":
        return AlertTriangle;
      case "ready_discharge":
        return CheckCircle;
      case "transfer_pending":
        return ArrowRightLeft;
      default:
        return Users;
    }
  };

  const metrics = [
    {
      label: "Arrivals Today",
      value: dashboard?.arrivalsToday || 0,
      icon: Users,
      color: "blue",
      trend: "+12%",
    },
    {
      label: "Sorting Pending",
      value: dashboard?.sortingPending || 0,
      icon: Clock,
      color: "yellow",
      alert: (dashboard?.sortingPending || 0) > 5,
    },
    {
      label: "Queue Backlog",
      value: dashboard?.queueBacklog || 0,
      icon: Users,
      color: "orange",
      alert: (dashboard?.queueBacklog || 0) > 20,
    },
    {
      label: "Investigations Pending",
      value: dashboard?.investigationsPending || 0,
      icon: FlaskConical,
      color: "purple",
    },
    {
      label: "Ready for Discharge",
      value: dashboard?.readyForDischarge || 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Transfers Pending",
      value: dashboard?.transfersPending || 0,
      icon: ArrowRightLeft,
      color: "cyan",
    },
    {
      label: "Stalled Flows",
      value: dashboard?.stalledFlows || 0,
      icon: AlertTriangle,
      color: "red",
      alert: (dashboard?.stalledFlows || 0) > 0,
    },
  ];

  const stateBreakdown = Object.entries(CARE_STATE_CONFIG).map(([state, config]) => ({
    state: state as CareState,
    ...config,
    count: activePatients.filter((p) => p.careState === state).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Control Tower</h1>
          <p className="text-muted-foreground">
            {facilityName || "Facility"} • Last updated: {format(new Date(), "h:mm a")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className={metric.alert ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 text-${metric.color}-600`} />
                  {metric.trend && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {metric.trend}
                    </Badge>
                  )}
                  {metric.alert && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* State Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient Care States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {stateBreakdown.map((item) => {
              const Icon = getStateIcon(item.state);
              return (
                <Button
                  key={item.state}
                  variant={selectedState === item.state ? "secondary" : "outline"}
                  className="h-auto py-3 flex-col"
                  onClick={() => setSelectedState(item.state === selectedState ? "all" : item.state)}
                >
                  <Icon className={`h-5 w-5 mb-1 text-${item.color}-600`} />
                  <span className="text-lg font-bold">{item.count}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Patients */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Active Patients ({filteredPatients.length})
            </CardTitle>
            {selectedState !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedState("all")}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patients in this state
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                {filteredPatients.map((patient) => {
                  const stateConfig = CARE_STATE_CONFIG[patient.careState];
                  const StateIcon = getStateIcon(patient.careState);
                  const waitTime = patient.stateStartedAt
                    ? Math.round((Date.now() - new Date(patient.stateStartedAt).getTime()) / 60000)
                    : 0;

                  return (
                    <Card
                      key={patient.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        patient.hasStalledFlow ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" : ""
                      } ${patient.actionOverdue ? "border-orange-500" : ""}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full bg-${stateConfig.color}-100`}>
                              <StateIcon className={`h-4 w-4 text-${stateConfig.color}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Patient #{patient.patientId.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.currentWorkspaceName || patient.currentServicePoint || "Unknown location"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {waitTime}m
                          </Badge>
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">State:</span>
                            <span className="font-medium">{stateConfig.label}</span>
                          </div>
                          {patient.responsibleProviderName && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Provider:</span>
                              <span>{patient.responsibleProviderName}</span>
                            </div>
                          )}
                          {patient.nextExpectedAction && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Next:</span>
                              <span className="truncate max-w-24">{patient.nextExpectedAction}</span>
                            </div>
                          )}
                        </div>

                        {patient.hasStalledFlow && (
                          <div className="mt-2 p-1.5 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {patient.stallReason || "Flow stalled"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
