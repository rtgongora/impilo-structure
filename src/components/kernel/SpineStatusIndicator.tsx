/**
 * Impilo vNext v1.1 — Spine Status Indicator
 * 
 * Shows the National Spine connectivity status.
 * Used in headers/toolbars for screens with federation-guarded actions.
 */

import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SpineStatus } from '@/hooks/useFederationGuard';

interface SpineStatusIndicatorProps {
  status: SpineStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<SpineStatus, { label: string; className: string }> = {
  online: { label: 'Spine Online', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  offline: { label: 'Spine Offline', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  degraded: { label: 'Spine Degraded', className: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  checking: { label: 'Checking...', className: 'bg-muted text-muted-foreground' },
};

export function SpineStatusIndicator({ status, compact = false }: SpineStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  const icon = status === 'checking' 
    ? <Loader2 className="h-3 w-3 animate-spin" />
    : status === 'offline'
      ? <WifiOff className="h-3 w-3" />
      : <Wifi className="h-3 w-3" />;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${config.className}`}>
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>{config.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {icon}
      {config.label}
    </Badge>
  );
}
