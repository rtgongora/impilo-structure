import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Building2, 
  Clock, 
  RefreshCw, 
  Users,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { QueueDefinition } from '@/types/queue';
import { QUEUE_SERVICE_TYPE_LABELS } from '@/types/queue';

interface QueueSummary {
  queue: QueueDefinition;
  waiting: number;
  inService: number;
  avgWait: number | null;
  longestWait: number | null;
  slaBreaches: number;
}

interface SupervisorDashboardProps {
  facilityId?: string;
  onSelectQueue?: (queueId: string) => void;
}

export function SupervisorDashboard({ facilityId, onSelectQueue }: SupervisorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = async () => {
    try {
      // Fetch queues
      let query = supabase
        .from('queue_definitions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data: queuesData } = await query;
      
      if (!queuesData) {
        setQueues([]);
        return;
      }

      // Fetch queue items for today
      const today = new Date().toISOString().split('T')[0];
      const { data: itemsData } = await supabase
        .from('queue_items')
        .select('queue_id, status, arrival_time, priority')
        .eq('arrival_date', today)
        .in('status', ['waiting', 'called', 'in_service']);

      // Compute summaries
      const summaries: QueueSummary[] = queuesData.map((q: QueueDefinition) => {
        const queueItems = (itemsData || []).filter((i: any) => i.queue_id === q.id);
        const waiting = queueItems.filter((i: any) => i.status === 'waiting');
        const inService = queueItems.filter((i: any) => i.status === 'in_service');

        const waitTimes = waiting.map((i: any) => {
          return (Date.now() - new Date(i.arrival_time).getTime()) / 60000;
        });

        const avgWait = waitTimes.length > 0 
          ? waitTimes.reduce((a: number, b: number) => a + b, 0) / waitTimes.length 
          : null;
        const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : null;
        const slaBreaches = q.sla_target_minutes 
          ? waitTimes.filter((w: number) => w > q.sla_target_minutes!).length 
          : 0;

        return {
          queue: q,
          waiting: waiting.length,
          inService: inService.length,
          avgWait,
          longestWait,
          slaBreaches,
        };
      });

      setQueues(summaries);
    } catch (err) {
      console.error('Error fetching supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [facilityId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredQueues = filterType === 'all' 
    ? queues 
    : queues.filter(q => q.queue.service_type === filterType);

  const totalWaiting = queues.reduce((sum, q) => sum + q.waiting, 0);
  const totalInService = queues.reduce((sum, q) => sum + q.inService, 0);
  const totalBreaches = queues.reduce((sum, q) => sum + q.slaBreaches, 0);
  const criticalQueues = queues.filter(q => q.slaBreaches > 0 || (q.longestWait && q.longestWait > 60));

  const getQueueStatusColor = (summary: QueueSummary) => {
    if (summary.slaBreaches > 0) return 'border-red-200 bg-red-50/50';
    if (summary.longestWait && summary.longestWait > 45) return 'border-yellow-200 bg-yellow-50/50';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Queue Supervisor</h2>
          <p className="text-sm text-muted-foreground">Monitor all queues across the facility</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Array.from(new Set(queues.map(q => q.queue.service_type))).map(type => (
                <SelectItem key={type} value={type}>
                  {QUEUE_SERVICE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{queues.length}</p>
                <p className="text-xs text-muted-foreground">Active Queues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWaiting}</p>
                <p className="text-xs text-muted-foreground">Total Waiting</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInService}</p>
                <p className="text-xs text-muted-foreground">In Service</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalBreaches > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                totalBreaches > 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  totalBreaches > 0 ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalBreaches > 0 ? 'text-red-600' : ''}`}>
                  {totalBreaches}
                </p>
                <p className="text-xs text-muted-foreground">SLA Breaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalQueues.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalQueues.map(q => (
                <div
                  key={q.queue.id}
                  className="flex items-center justify-between p-2 rounded bg-white/80 cursor-pointer hover:bg-white"
                  onClick={() => onSelectQueue?.(q.queue.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{q.queue.name}</span>
                    {q.slaBreaches > 0 && (
                      <Badge variant="destructive">{q.slaBreaches} SLA breaches</Badge>
                    )}
                    {q.longestWait && q.longestWait > 60 && (
                      <Badge variant="outline" className="text-orange-600">
                        {Math.round(q.longestWait)}min wait
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Queues</CardTitle>
          <CardDescription>{filteredQueues.length} queues</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredQueues.map(summary => (
                <div
                  key={summary.queue.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${getQueueStatusColor(summary)}`}
                  onClick={() => onSelectQueue?.(summary.queue.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{summary.queue.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {QUEUE_SERVICE_TYPE_LABELS[summary.queue.service_type]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {summary.waiting} waiting
                      </Badge>
                      <Badge variant="secondary">
                        {summary.inService} in service
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Avg: {summary.avgWait ? `${Math.round(summary.avgWait)}min` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Max: {summary.longestWait ? `${Math.round(summary.longestWait)}min` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        SLA: {summary.queue.sla_target_minutes || 60}min
                      </span>
                    </div>
                  </div>

                  {summary.queue.sla_target_minutes && summary.avgWait && (
                    <div className="mt-3">
                      <Progress 
                        value={Math.min((summary.avgWait / summary.queue.sla_target_minutes) * 100, 100)} 
                        className={`h-1.5 ${
                          summary.avgWait > summary.queue.sla_target_minutes 
                            ? '[&>div]:bg-red-500' 
                            : summary.avgWait > summary.queue.sla_target_minutes * 0.8
                            ? '[&>div]:bg-yellow-500'
                            : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
