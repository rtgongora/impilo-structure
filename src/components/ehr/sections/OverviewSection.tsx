import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEHR } from "@/contexts/EHRContext";
import {
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Activity,
  Pill,
  FileText,
  Clock,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { format, differenceInDays, formatDistanceToNow } from "date-fns";
import {
  MOCK_VITALS,
  MOCK_ALERTS,
  MOCK_EPISODES,
  MOCK_PATHWAYS,
  MOCK_TASKS,
  MOCK_DIAGNOSES,
} from "@/data/mockClinicalData";
import { LiveVitalsMonitor } from "@/components/ehr/LiveVitalsMonitor";
import { AllergiesAlert } from "@/components/ehr/AllergiesAlert";
import { PatientDocumentsPanel } from "@/components/landela/PatientDocumentsPanel";

function VitalCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  trend, 
  isAbnormal 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  unit: string; 
  trend?: "up" | "down" | "stable";
  isAbnormal?: boolean;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  return (
    <div className={`p-3 rounded-lg border ${isAbnormal ? 'bg-critical-muted border-critical/30' : 'bg-card border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-4 h-4 ${isAbnormal ? 'text-critical' : 'text-muted-foreground'}`} />
        {trend && (
          <TrendIcon className={`w-3 h-3 ${trend === 'up' ? 'text-critical' : trend === 'down' ? 'text-success' : 'text-muted-foreground'}`} />
        )}
      </div>
      <div className={`text-xl font-semibold ${isAbnormal ? 'text-critical' : 'text-foreground'}`}>
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function AlertBadge({ alert }: { alert: typeof MOCK_ALERTS[0] }) {
  const severityColors = {
    critical: "bg-critical text-critical-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-primary/10 text-primary",
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      alert.severity === 'critical' ? 'bg-critical/10 border border-critical/30' :
      alert.severity === 'warning' ? 'bg-warning/10 border border-warning/30' :
      'bg-muted border border-border'
    }`}>
      <AlertTriangle className={`w-4 h-4 ${
        alert.severity === 'critical' ? 'text-critical' :
        alert.severity === 'warning' ? 'text-warning' :
        'text-primary'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{alert.title}</div>
        <div className="text-xs text-muted-foreground truncate">{alert.description}</div>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: typeof MOCK_TASKS[0] }) {
  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-warning" />,
    in_progress: <Activity className="w-4 h-4 text-primary" />,
    completed: <CheckCircle2 className="w-4 h-4 text-success" />,
    overdue: <AlertCircle className="w-4 h-4 text-critical" />,
    cancelled: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
  };
  
  const priorityColors = {
    routine: "text-muted-foreground",
    urgent: "text-warning",
    stat: "text-critical",
  };
  
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {statusIcons[task.status]}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{task.title}</div>
        {task.dueAt && (
          <div className={`text-xs ${priorityColors[task.priority]}`}>
            Due {formatDistanceToNow(task.dueAt, { addSuffix: true })}
          </div>
        )}
      </div>
      <Badge variant={task.priority === 'stat' ? 'destructive' : task.priority === 'urgent' ? 'secondary' : 'outline'} className="text-xs">
        {task.priority}
      </Badge>
    </div>
  );
}

export function OverviewSection() {
  const { currentEncounter, setActiveMenuItem } = useEHR();
  const { patient } = currentEncounter;
  const los = differenceInDays(new Date(), currentEncounter.admissionDate);
  const pendingTasks = MOCK_TASKS.filter(t => t.status === 'pending');
  const primaryDiagnosis = MOCK_DIAGNOSES.find(d => d.isPrimary);

  return (
    <div className="space-y-6">

      {/* Clinical Alerts & Allergies */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">CLINICAL ALERTS</h3>
          <div className="space-y-2">
            {MOCK_ALERTS.slice(0, 3).map(alert => (
              <AlertBadge key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">ALLERGIES</h3>
          <AllergiesAlert patientId={patient.id || currentEncounter.id} />
        </div>
      </div>

      {/* Live Vitals Monitor */}
      <LiveVitalsMonitor encounterId={currentEncounter.id} />

      <div className="grid grid-cols-3 gap-6">
        {/* Active Episodes & Pathways */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Episodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_EPISODES.map(episode => (
              <div key={episode.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{episode.name}</span>
                  <Badge variant="outline" className="text-xs">{episode.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Since {format(episode.startDate, "MMM yyyy")}
                </div>
              </div>
            ))}
            {MOCK_PATHWAYS.map(pathway => (
              <div key={pathway.id} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{pathway.name}</span>
                  <span className="text-xs text-muted-foreground">{pathway.progress}%</span>
                </div>
                <Progress value={pathway.progress} className="h-1.5" />
                {pathway.nextVisitDate && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Next: {format(pathway.nextVisitDate, "dd MMM yyyy")}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pending Tasks</CardTitle>
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pendingTasks.slice(0, 5).map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
            {pendingTasks.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View all {pendingTasks.length} tasks
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Encounter Details & Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Encounter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Admitted:</span>
              <span>{format(currentEncounter.admissionDate, "dd MMM yyyy, HH:mm")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Attending:</span>
              <span>{currentEncounter.attendingPhysician}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>{currentEncounter.location}</span>
            </div>

            {/* Compact Documents Widget */}
            <div className="border-t border-border pt-3 mt-3">
              <PatientDocumentsPanel
                patientId={patient.id || currentEncounter.id}
                encounterId={currentEncounter.id}
                compact={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
