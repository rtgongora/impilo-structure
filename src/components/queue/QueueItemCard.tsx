import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  MoreVertical, 
  Phone, 
  Play, 
  Pause, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  User,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { QueueItem } from '@/types/queue';
import { 
  QUEUE_PRIORITY_LABELS, 
  QUEUE_STATUS_LABELS,
  QUEUE_ENTRY_TYPE_LABELS,
} from '@/types/queue';

interface QueueItemCardProps {
  item: QueueItem;
  onCall?: () => void;
  onStartService?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onTransfer?: () => void;
  onEscalate?: () => void;
  onNoShow?: () => void;
  onOpenPatient?: () => void;
  compact?: boolean;
}

export function QueueItemCard({
  item,
  onCall,
  onStartService,
  onPause,
  onResume,
  onComplete,
  onTransfer,
  onEscalate,
  onNoShow,
  onOpenPatient,
  compact = false,
}: QueueItemCardProps) {
  const priorityInfo = QUEUE_PRIORITY_LABELS[item.priority];
  const statusInfo = QUEUE_STATUS_LABELS[item.status];

  const getWaitTime = () => {
    const arrival = new Date(item.arrival_time);
    return formatDistanceToNow(arrival, { addSuffix: false });
  };

  const patientName = item.patient
    ? `${item.patient.first_name} ${item.patient.last_name}`
    : item.health_id || 'Unknown Patient';

  const isPriorityHigh = ['emergency', 'very_urgent'].includes(item.priority);

  if (compact) {
    return (
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border ${
          isPriorityHigh ? 'border-red-200 bg-red-50/50' : 'border-border'
        } hover:bg-muted/50 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`font-mono font-bold text-lg ${priorityInfo.color}`}>
            {item.ticket_number}
          </div>
          <div>
            <p className="font-medium text-sm">{patientName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{getWaitTime()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={priorityInfo.color}>
            {priorityInfo.label}
          </Badge>
          {item.status === 'waiting' && onCall && (
            <Button size="sm" onClick={onCall}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}
          {item.status === 'called' && onStartService && (
            <Button size="sm" onClick={onStartService}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`${isPriorityHigh ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Ticket Number */}
            <div 
              className={`h-14 w-14 rounded-lg flex items-center justify-center ${priorityInfo.bgColor}`}
            >
              <span className={`font-mono font-bold text-lg ${priorityInfo.color}`}>
                {item.ticket_number}
              </span>
            </div>

            {/* Patient Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{patientName}</h3>
                {item.is_escalated && (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </div>
              {item.patient?.mrn && (
                <p className="text-sm text-muted-foreground">MRN: {item.patient.mrn}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getWaitTime()}
                </span>
                <span>{QUEUE_ENTRY_TYPE_LABELS[item.entry_type]}</span>
              </div>
              {item.reason_for_visit && (
                <p className="text-sm mt-1">{item.reason_for_visit}</p>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="secondary" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onOpenPatient && (
                  <DropdownMenuItem onClick={onOpenPatient}>
                    <User className="h-4 w-4 mr-2" />
                    View Patient
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {item.status === 'waiting' && onCall && (
                  <DropdownMenuItem onClick={onCall}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Patient
                  </DropdownMenuItem>
                )}
                {item.status === 'called' && onStartService && (
                  <DropdownMenuItem onClick={onStartService}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Service
                  </DropdownMenuItem>
                )}
                {item.status === 'in_service' && onPause && (
                  <DropdownMenuItem onClick={onPause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {item.status === 'paused' && onResume && (
                  <DropdownMenuItem onClick={onResume}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                {item.status === 'in_service' && onComplete && (
                  <DropdownMenuItem onClick={onComplete}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onTransfer && (
                  <DropdownMenuItem onClick={onTransfer}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Transfer
                  </DropdownMenuItem>
                )}
                {onEscalate && (
                  <DropdownMenuItem onClick={onEscalate}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Escalate Priority
                  </DropdownMenuItem>
                )}
                {['waiting', 'called'].includes(item.status) && onNoShow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onNoShow} className="text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark No-Show
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
          {item.status === 'waiting' && onCall && (
            <Button size="sm" onClick={onCall}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}
          {item.status === 'called' && (
            <>
              {onStartService && (
                <Button size="sm" onClick={onStartService}>
                  <Play className="h-4 w-4 mr-1" />
                  Start Service
                </Button>
              )}
              {onNoShow && (
                <Button size="sm" variant="outline" onClick={onNoShow}>
                  <XCircle className="h-4 w-4 mr-1" />
                  No-Show
                </Button>
              )}
            </>
          )}
          {item.status === 'in_service' && (
            <>
              {onOpenPatient && (
                <Button size="sm" variant="default" onClick={onOpenPatient}>
                  <User className="h-4 w-4 mr-1" />
                  Open Chart
                </Button>
              )}
              {onComplete && (
                <Button size="sm" variant="outline" onClick={onComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
              {onPause && (
                <Button size="sm" variant="ghost" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
            </>
          )}
          {item.status === 'paused' && onResume && (
            <Button size="sm" onClick={onResume}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          {onTransfer && (
            <Button size="sm" variant="outline" onClick={onTransfer}>
              <ArrowRight className="h-4 w-4 mr-1" />
              Transfer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
