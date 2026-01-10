import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Building2, 
  Calendar, 
  Check, 
  Clock, 
  RotateCcw, 
  Users, 
  Video, 
  X,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Intervention } from '@/hooks/useAboveSiteInterventions';
import { INTERVENTION_TYPE_LABELS } from '@/types/aboveSite';

interface InterventionCardProps {
  intervention: Intervention;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReverse?: (id: string) => void;
  showActions?: boolean;
}

const interventionIcons: Record<string, typeof AlertTriangle> = {
  staff_redeployment: Users,
  coverage_approval: Calendar,
  queue_escalation: Zap,
  virtual_pool_authorization: Video,
  facility_override: Building2,
  emergency_response: AlertTriangle,
};

export function InterventionCard({
  intervention,
  onApprove,
  onReject,
  onReverse,
  showActions = true,
}: InterventionCardProps) {
  const Icon = interventionIcons[intervention.intervention_type] || AlertTriangle;
  const typeInfo = INTERVENTION_TYPE_LABELS[intervention.intervention_type];
  
  const getStatusBadge = () => {
    if (intervention.reversed_at) {
      return <Badge variant="outline" className="text-muted-foreground">Reversed</Badge>;
    }
    if (intervention.is_approved === true) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
    }
    if (intervention.is_approved === false) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getTargetInfo = () => {
    const targets: string[] = [];
    if (intervention.target_facility?.name) {
      targets.push(`Facility: ${intervention.target_facility.name}`);
    }
    if (intervention.target_workspace?.name) {
      targets.push(`Workspace: ${intervention.target_workspace.name}`);
    }
    if (intervention.target_pool?.name) {
      targets.push(`Pool: ${intervention.target_pool.name}`);
    }
    return targets.length > 0 ? targets.join(' • ') : 'No specific target';
  };

  const isPending = intervention.is_approved === null && !intervention.reversed_at;
  const canReverse = intervention.is_approved === true && intervention.is_reversible && !intervention.reversed_at;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{intervention.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {typeInfo?.label || intervention.intervention_type}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {intervention.description && (
          <p className="text-sm text-muted-foreground">{intervention.description}</p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{getTargetInfo()}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDistanceToNow(new Date(intervention.created_at), { addSuffix: true })}</span>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs">
            <span className="text-muted-foreground">Reason: </span>
            {intervention.reason}
          </p>
        </div>

        {intervention.reversed_at && intervention.reversal_reason && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-orange-500">
              <span className="font-medium">Reversal reason: </span>
              {intervention.reversal_reason}
            </p>
          </div>
        )}

        {showActions && (isPending || canReverse) && (
          <div className="flex items-center gap-2 pt-2">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-500 border-green-500/20 hover:bg-green-500/10"
                  onClick={() => onApprove?.(intervention.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => onReject?.(intervention.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {canReverse && (
              <Button
                size="sm"
                variant="outline"
                className="text-orange-500 border-orange-500/20 hover:bg-orange-500/10"
                onClick={() => onReverse?.(intervention.id)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reverse
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
