/**
 * Impilo vNext v1.1 — Kernel Error Alert Component
 * 
 * Renders a v1.1 standard error envelope as a consistent
 * alert across all screens.
 */

import { AlertCircle, AlertTriangle, Info, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { KernelErrorState } from '@/hooks/useKernelError';

interface KernelErrorAlertProps {
  error: KernelErrorState;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    variant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    variant: 'default' as const,
  },
  error: {
    icon: AlertCircle,
    variant: 'destructive' as const,
  },
  critical: {
    icon: ShieldAlert,
    variant: 'destructive' as const,
  },
};

/** Human-friendly titles for common error codes */
const ERROR_TITLES: Record<string, string> = {
  POLICY_DENY: 'Access Denied',
  STEP_UP_REQUIRED: 'Additional Verification Required',
  BREAK_GLASS_REQUIRED: 'Emergency Access Required',
  PDP_UNAVAILABLE: 'Policy Service Unavailable',
  IDEMPOTENCY_CONFLICT: 'Request Conflict',
  IDEMPOTENCY_KEY_REQUIRED: 'Missing Request Key',
  FEDERATION_NOT_AUTHORIZED: 'Federation Authority Required',
  FEDERATION_AUTHORITY_VIOLATION: 'Authority Violation',
  RATE_LIMITED: 'Rate Limited',
  AUTH_REQUIRED: 'Authentication Required',
  INTERNAL_ERROR: 'System Error',
  STALE_CONTEXT: 'Stale Data',
  EFFECTIVE_DATE_CONFLICT: 'Date Conflict',
};

export function KernelErrorAlert({ error, onRetry, onDismiss, showDetails = false }: KernelErrorAlertProps) {
  if (!error.hasError) return null;

  const config = SEVERITY_CONFIG[error.severity];
  const Icon = config.icon;
  const title = (error.code && ERROR_TITLES[error.code]) || 'Error';

  return (
    <Alert variant={config.variant} className="relative">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        
        {error.isRetryable && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}

        {showDetails && (error.requestId || error.correlationId) && (
          <div className="mt-2 text-xs text-muted-foreground font-mono space-y-0.5">
            {error.requestId && <div>Request: {error.requestId}</div>}
            {error.correlationId && <div>Correlation: {error.correlationId}</div>}
            {error.code && <div>Code: {error.code}</div>}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
