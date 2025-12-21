import { Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QueuePatient } from "./QueuePatientCard";

interface QueueStatsProps {
  patients: QueuePatient[];
}

export function QueueStats({ patients }: QueueStatsProps) {
  const waiting = patients.filter(p => p.status === 'waiting').length;
  const inConsultation = patients.filter(p => p.status === 'in-consultation' || p.status === 'called').length;
  const completed = patients.filter(p => p.status === 'completed').length;
  
  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const avgWaitTime = waitingPatients.length > 0
    ? Math.floor(waitingPatients.reduce((sum, p) => sum + (new Date().getTime() - p.arrivalTime.getTime()), 0) / waitingPatients.length / 60000)
    : 0;

  const criticalCount = patients.filter(p => 
    (p.triageLevel === 'red' || p.triageLevel === 'orange') && p.status === 'waiting'
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{waiting}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inConsultation}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgWaitTime}<span className="text-sm font-normal">m</span></p>
              <p className="text-xs text-muted-foreground">Avg Wait</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${criticalCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
              <AlertCircle className={`h-5 w-5 ${criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
