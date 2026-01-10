import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { SortingDeskMetrics, TRIAGE_URGENCY_CONFIG } from "@/types/sorting";

interface SortingMetricsPanelProps {
  metrics: SortingDeskMetrics | null;
  loading?: boolean;
}

export function SortingMetricsPanel({ metrics, loading }: SortingMetricsPanelProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading metrics...
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium">No Data Available</h3>
          <p className="text-sm text-muted-foreground">
            Metrics will appear once sorting sessions are processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Arrivals</p>
                <p className="text-3xl font-bold">{metrics.total_arrivals}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Triaged</p>
                <p className="text-3xl font-bold">{metrics.total_triaged}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Immediate Care</p>
                <p className="text-3xl font-bold text-red-600">{metrics.immediate_care_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
                <p className="text-3xl font-bold">{formatTime(metrics.avg_processing_time)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Triage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${TRIAGE_URGENCY_CONFIG.emergency.bgColor}`}>
              <p className={`text-sm font-medium ${TRIAGE_URGENCY_CONFIG.emergency.color}`}>
                Emergency
              </p>
              <p className={`text-2xl font-bold ${TRIAGE_URGENCY_CONFIG.emergency.color}`}>
                {metrics.emergency_count}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${TRIAGE_URGENCY_CONFIG.very_urgent.bgColor}`}>
              <p className={`text-sm font-medium ${TRIAGE_URGENCY_CONFIG.very_urgent.color}`}>
                Very Urgent
              </p>
              <p className={`text-2xl font-bold ${TRIAGE_URGENCY_CONFIG.very_urgent.color}`}>
                {metrics.very_urgent_count}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${TRIAGE_URGENCY_CONFIG.urgent.bgColor}`}>
              <p className={`text-sm font-medium ${TRIAGE_URGENCY_CONFIG.urgent.color}`}>
                Urgent
              </p>
              <p className={`text-2xl font-bold ${TRIAGE_URGENCY_CONFIG.urgent.color}`}>
                {metrics.urgent_count}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${TRIAGE_URGENCY_CONFIG.routine.bgColor}`}>
              <p className={`text-sm font-medium ${TRIAGE_URGENCY_CONFIG.routine.color}`}>
                Routine
              </p>
              <p className={`text-2xl font-bold ${TRIAGE_URGENCY_CONFIG.routine.color}`}>
                {metrics.routine_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Alert */}
      {metrics.pending_count > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-700">
                  {metrics.pending_count} session{metrics.pending_count > 1 ? 's' : ''} pending
                </p>
                <p className="text-sm text-orange-600">
                  Patients awaiting triage or routing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
