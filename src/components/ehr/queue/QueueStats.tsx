import { Users, Clock, TrendingUp, AlertCircle, Video, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QueuePatient } from "./QueuePatientCard";

interface QueueStatsProps {
  patients: QueuePatient[];
}

export function QueueStats({ patients }: QueueStatsProps) {
  const waiting = patients.filter(p => p.status === 'waiting').length;
  const inConsultation = patients.filter(p => p.status === 'in-consultation' || p.status === 'called').length;
  const completed = patients.filter(p => p.status === 'completed' || p.status === 'discharged').length;
  const virtualQueue = patients.filter(p => p.visitType === 'virtual' && p.status === 'waiting').length;
  
  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const avgWaitTime = waitingPatients.length > 0
    ? Math.floor(waitingPatients.reduce((sum, p) => sum + (new Date().getTime() - p.arrivalTime.getTime()), 0) / waitingPatients.length / 60000)
    : 0;

  const criticalCount = patients.filter(p => 
    (p.triageLevel === 'red' || p.triageLevel === 'orange') && p.status === 'waiting'
  ).length;

  const stats = [
    {
      label: "Waiting",
      value: waiting,
      icon: Users,
      color: "bg-[hsl(var(--warning-muted))]",
      iconColor: "text-[hsl(var(--warning))]",
    },
    {
      label: "In Progress",
      value: inConsultation,
      icon: TrendingUp,
      color: "bg-[hsl(var(--primary-muted))]",
      iconColor: "text-[hsl(var(--primary))]",
    },
    {
      label: "Attended",
      value: completed,
      icon: CheckCircle2,
      color: "bg-[hsl(var(--success-muted))]",
      iconColor: "text-[hsl(var(--success))]",
    },
    {
      label: "Virtual",
      value: virtualQueue,
      icon: Video,
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Critical",
      value: criticalCount,
      icon: AlertCircle,
      color: criticalCount > 0 ? "bg-[hsl(var(--critical-muted))]" : "bg-muted",
      iconColor: criticalCount > 0 ? "text-[hsl(var(--critical))]" : "text-muted-foreground",
    },
    {
      label: "Avg Wait",
      value: `${avgWaitTime}m`,
      icon: Clock,
      color: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
