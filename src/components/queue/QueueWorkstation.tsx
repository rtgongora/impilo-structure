import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Phone, 
  Plus, 
  RefreshCw,
  Users,
  FileText,
} from 'lucide-react';
import { QueueItemCard } from './QueueItemCard';
import { QueueMetricsBar } from './QueueMetricsBar';
import { useQueueManagement, useQueueItems } from '@/hooks/useQueueManagement';
import { Skeleton } from '@/components/ui/skeleton';
import type { QueueDefinition, QueuePriority, QueueItem } from '@/types/queue';
import { QUEUE_SERVICE_TYPE_LABELS, QUEUE_PRIORITY_LABELS } from '@/types/queue';

interface QueueWorkstationProps {
  facilityId?: string;
  initialQueueId?: string;
}

export function QueueWorkstation({ facilityId, initialQueueId }: QueueWorkstationProps) {
  const navigate = useNavigate();
  const { queues, loading: queuesLoading } = useQueueManagement(facilityId);
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>(initialQueueId);
  const [activeTab, setActiveTab] = useState('waiting');
  
  const {
    items,
    metrics,
    loading: itemsLoading,
    refetch,
    callNext,
    startService,
    pauseService,
    resumeService,
    completeService,
    transferToQueue,
    escalatePriority,
    markNoShow,
  } = useQueueItems(selectedQueueId);

  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [transferTargetQueue, setTransferTargetQueue] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [escalatePriorityValue, setEscalatePriorityValue] = useState<QueuePriority>('urgent');
  const [escalateReason, setEscalateReason] = useState('');

  const selectedQueue = queues.find(q => q.id === selectedQueueId);

  const handleTransfer = (itemId: string) => {
    setSelectedItemId(itemId);
    setTransferDialogOpen(true);
  };

  const handleEscalate = (itemId: string) => {
    setSelectedItemId(itemId);
    setEscalateDialogOpen(true);
  };

  const confirmTransfer = async () => {
    if (selectedItemId && transferTargetQueue && transferReason) {
      await transferToQueue(selectedItemId, transferTargetQueue, transferReason);
      setTransferDialogOpen(false);
      setSelectedItemId(null);
      setTransferTargetQueue('');
      setTransferReason('');
    }
  };

  const confirmEscalate = async () => {
    if (selectedItemId && escalateReason) {
      await escalatePriority(selectedItemId, escalatePriorityValue, escalateReason);
      setEscalateDialogOpen(false);
      setSelectedItemId(null);
      setEscalateReason('');
    }
  };

  // Navigate to encounter and start service
  const handleStartServiceAndOpenChart = async (item: QueueItem) => {
    await startService(item.id);
    // Navigate to encounter with queue source for pre-authorization
    const encounterId = item.encounter_id || item.id; // Use encounter_id if exists, else use item id
    navigate(`/encounter/${encounterId}?source=queue`);
  };

  // Open patient chart for in-service items
  const handleOpenChart = (item: QueueItem) => {
    const encounterId = item.encounter_id || item.id;
    navigate(`/encounter/${encounterId}?source=queue`);
  };

  const waitingItems = items.filter(i => i.status === 'waiting');
  const calledItems = items.filter(i => i.status === 'called');
  const inServiceItems = items.filter(i => i.status === 'in_service');
  const pausedItems = items.filter(i => i.status === 'paused');

  if (queuesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Queue Selector & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedQueueId} onValueChange={setSelectedQueueId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a queue..." />
            </SelectTrigger>
            <SelectContent>
              {queues.map(queue => (
                <SelectItem key={queue.id} value={queue.id}>
                  <div className="flex items-center gap-2">
                    <span>{queue.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {QUEUE_SERVICE_TYPE_LABELS[queue.service_type]}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedQueue && (
            <Badge variant="secondary">
              SLA: {selectedQueue.sla_target_minutes || 60} min
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={callNext} disabled={waitingItems.length === 0}>
            <Phone className="h-4 w-4 mr-2" />
            Call Next
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {selectedQueueId && (
        <QueueMetricsBar 
          metrics={metrics} 
          slaTargetMinutes={selectedQueue?.sla_target_minutes || undefined} 
        />
      )}

      {/* Queue Tabs */}
      {selectedQueueId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="waiting">
              Waiting
              {waitingItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">{waitingItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="called">
              Called
              {calledItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">{calledItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_service">
              In Service
              {inServiceItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">{inServiceItems.length}</Badge>
              )}
            </TabsTrigger>
            {pausedItems.length > 0 && (
              <TabsTrigger value="paused">
                Paused
                <Badge variant="secondary" className="ml-2">{pausedItems.length}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="waiting" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {waitingItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No patients waiting</p>
                    </CardContent>
                  </Card>
                ) : (
                  waitingItems.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onCall={() => callNext()}
                      onTransfer={() => handleTransfer(item.id)}
                      onEscalate={() => handleEscalate(item.id)}
                      onNoShow={() => markNoShow(item.id)}
                      onOpenPatient={() => handleOpenChart(item)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="called" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {calledItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p>No patients called</p>
                    </CardContent>
                  </Card>
                ) : (
                  calledItems.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onStartService={() => handleStartServiceAndOpenChart(item)}
                      onNoShow={() => markNoShow(item.id)}
                      onTransfer={() => handleTransfer(item.id)}
                      onOpenPatient={() => handleOpenChart(item)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="in_service" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {inServiceItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p>No patients in service</p>
                    </CardContent>
                  </Card>
                ) : (
                  inServiceItems.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onPause={() => pauseService(item.id)}
                      onComplete={() => completeService(item.id)}
                      onTransfer={() => handleTransfer(item.id)}
                      onOpenPatient={() => handleOpenChart(item)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="paused" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {pausedItems.map(item => (
                  <QueueItemCard
                    key={item.id}
                    item={item}
                    onResume={() => resumeService(item.id)}
                    onComplete={() => completeService(item.id)}
                    onTransfer={() => handleTransfer(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      {!selectedQueueId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Select a queue to view patients</p>
          </CardContent>
        </Card>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Patient</DialogTitle>
            <DialogDescription>
              Transfer this patient to another queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Queue</Label>
              <Select value={transferTargetQueue} onValueChange={setTransferTargetQueue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select queue..." />
                </SelectTrigger>
                <SelectContent>
                  {queues.filter(q => q.id !== selectedQueueId).map(queue => (
                    <SelectItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Transfer</Label>
              <Textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Why is this patient being transferred?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmTransfer}
              disabled={!transferTargetQueue || !transferReason}
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Priority</DialogTitle>
            <DialogDescription>
              Increase the priority of this patient in the queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Priority</Label>
              <Select 
                value={escalatePriorityValue} 
                onValueChange={(v) => setEscalatePriorityValue(v as QueuePriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['emergency', 'very_urgent', 'urgent'] as QueuePriority[]).map(p => (
                    <SelectItem key={p} value={p}>
                      <span className={QUEUE_PRIORITY_LABELS[p].color}>
                        {QUEUE_PRIORITY_LABELS[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Escalation</Label>
              <Textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Why is this patient's priority being escalated?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmEscalate}
              disabled={!escalateReason}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
