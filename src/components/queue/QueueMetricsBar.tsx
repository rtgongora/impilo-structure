import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { QueueMetrics } from '@/types/queue';

interface QueueMetricsBarProps {
  metrics: QueueMetrics | null;
  slaTargetMinutes?: number;
}

export function QueueMetricsBar({ metrics, slaTargetMinutes }: QueueMetricsBarProps) {
  if (!metrics) return null;

  const isBreachingSLA = slaTargetMinutes && metrics.longest_wait_minutes 
    ? metrics.longest_wait_minutes > slaTargetMinutes 
    : false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.queue_length}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {metrics.avg_wait_minutes ? Math.round(metrics.avg_wait_minutes) : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Avg Wait (min)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={isBreachingSLA ? 'border-red-200 bg-red-50/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              isBreachingSLA ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              {isBreachingSLA ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-orange-600" />
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${isBreachingSLA ? 'text-red-600' : ''}`}>
                {metrics.longest_wait_minutes ? Math.round(metrics.longest_wait_minutes) : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Longest Wait</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.in_service_count}</p>
              <p className="text-xs text-muted-foreground">In Service</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.completed_today}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
