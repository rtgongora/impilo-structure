/**
 * Impilo vNext v1.1 — Kernel Error Hook
 * 
 * Parses the standard v1.1 error envelope and provides
 * UI-friendly error state for consistent rendering across screens.
 */

import { useState, useCallback, useMemo } from 'react';
import type { V1_1ErrorResponse, V1_1ErrorCode } from '@/lib/kernel/types';

export interface KernelErrorState {
  /** Whether an error is currently active */
  hasError: boolean;
  /** The error code (e.g., POLICY_DENY, IDEMPOTENCY_CONFLICT) */
  code: V1_1ErrorCode | null;
  /** Human-readable error message */
  message: string | null;
  /** Additional error details */
  details: Record<string, unknown> | null;
  /** Request ID for support/debugging */
  requestId: string | null;
  /** Correlation ID for tracing */
  correlationId: string | null;
  /** UI-friendly severity level */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Whether the user can retry this action */
  isRetryable: boolean;
}

/** Map error codes to severity and retryability */
const ERROR_CLASSIFICATION: Record<string, { severity: KernelErrorState['severity']; retryable: boolean }> = {
  INTERNAL_ERROR: { severity: 'critical', retryable: true },
  PDP_UNAVAILABLE: { severity: 'critical', retryable: true },
  RATE_LIMITED: { severity: 'warning', retryable: true },
  STALE_CONTEXT: { severity: 'warning', retryable: true },
  POLICY_DENY: { severity: 'error', retryable: false },
  AUTH_REQUIRED: { severity: 'error', retryable: false },
  AUTH_INVALID_CREDENTIALS: { severity: 'error', retryable: false },
  STEP_UP_REQUIRED: { severity: 'warning', retryable: false },
  BREAK_GLASS_REQUIRED: { severity: 'warning', retryable: false },
  IDEMPOTENCY_KEY_REQUIRED: { severity: 'error', retryable: false },
  IDEMPOTENCY_CONFLICT: { severity: 'warning', retryable: false },
  IDENTITY_CONFLICT: { severity: 'error', retryable: false },
  FEDERATION_NOT_AUTHORIZED: { severity: 'error', retryable: false },
  FEDERATION_AUTHORITY_VIOLATION: { severity: 'error', retryable: false },
  MISSING_REQUIRED_HEADER: { severity: 'error', retryable: false },
  INVALID_REQUEST: { severity: 'error', retryable: false },
  EFFECTIVE_DATE_CONFLICT: { severity: 'warning', retryable: false },
};

export function useKernelError() {
  const [errorState, setErrorState] = useState<KernelErrorState>({
    hasError: false,
    code: null,
    message: null,
    details: null,
    requestId: null,
    correlationId: null,
    severity: 'error',
    isRetryable: false,
  });

  /**
   * Set error from a v1.1 error response.
   */
  const setError = useCallback((error: V1_1ErrorResponse | null) => {
    if (!error) {
      clearError();
      return;
    }

    const classification = ERROR_CLASSIFICATION[error.error.code] || { severity: 'error' as const, retryable: false };

    setErrorState({
      hasError: true,
      code: error.error.code,
      message: error.error.message,
      details: error.error.details,
      requestId: error.error.request_id,
      correlationId: error.error.correlation_id,
      severity: classification.severity,
      isRetryable: classification.retryable,
    });
  }, []);

  /**
   * Parse an unknown error (catch blocks) into kernel error state.
   */
  const setFromUnknown = useCallback((err: unknown) => {
    if (err && typeof err === 'object' && 'error' in err) {
      setError(err as V1_1ErrorResponse);
      return;
    }

    setErrorState({
      hasError: true,
      code: 'INTERNAL_ERROR',
      message: err instanceof Error ? err.message : 'An unexpected error occurred',
      details: null,
      requestId: null,
      correlationId: null,
      severity: 'critical',
      isRetryable: true,
    });
  }, [setError]);

  /**
   * Clear the current error state.
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      code: null,
      message: null,
      details: null,
      requestId: null,
      correlationId: null,
      severity: 'error',
      isRetryable: false,
    });
  }, []);

  return {
    ...errorState,
    setError,
    setFromUnknown,
    clearError,
  };
}
