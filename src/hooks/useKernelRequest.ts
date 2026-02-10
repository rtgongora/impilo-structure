/**
 * Impilo vNext v1.1 — Kernel Request Hook
 * 
 * Wraps API calls with mandatory v1.1 context headers.
 * Provides correlation ID tracking and standard error parsing.
 */

import { useCallback, useRef } from 'react';
import { invokeKernelFunction, setCorrelationId, getRequestContext } from '@/lib/kernel/kernelClient';
import type { KernelRequestContext, V1_1ErrorResponse } from '@/lib/kernel/types';

export interface KernelRequestOptions {
  /** Override correlation ID (otherwise auto-generated per operation chain) */
  correlationId?: string;
  /** Additional headers */
  headers?: Record<string, string>;
}

export interface KernelRequestResult<T> {
  data: T | null;
  error: V1_1ErrorResponse | null;
  context: KernelRequestContext;
}

/**
 * Hook that provides kernel-aware API calling with automatic
 * context header injection (X-Tenant-ID, X-Pod-ID, X-Request-ID, X-Correlation-ID).
 */
export function useKernelRequest() {
  const activeCorrelationId = useRef<string | null>(null);

  /**
   * Start a new correlation chain (call at the beginning of a user-initiated action).
   */
  const startCorrelation = useCallback((id?: string) => {
    activeCorrelationId.current = setCorrelationId(id);
    return activeCorrelationId.current;
  }, []);

  /**
   * Invoke a kernel function with all v1.1 headers injected.
   */
  const invoke = useCallback(async <T = unknown>(
    functionName: string,
    body?: Record<string, unknown>,
    options?: KernelRequestOptions
  ): Promise<KernelRequestResult<T>> => {
    return invokeKernelFunction<T>(functionName, {
      body,
      correlationId: options?.correlationId || activeCorrelationId.current || undefined,
      headers: options?.headers,
    });
  }, []);

  /**
   * Get the current request context (for display/debugging).
   */
  const getContext = useCallback(() => getRequestContext(), []);

  return {
    invoke,
    startCorrelation,
    getContext,
  };
}
