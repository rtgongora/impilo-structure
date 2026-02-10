/**
 * Impilo vNext v1.1 — Idempotent Mutation Hook
 * 
 * Wraps write operations (POST/PUT/PATCH) with:
 * - Auto-generated Idempotency-Key header
 * - Double-submit prevention
 * - Safe retry behavior (same key + same body = cached response)
 * - Graceful "already processed" handling
 */

import { useState, useCallback, useRef } from 'react';
import { invokeKernelFunction, setCorrelationId } from '@/lib/kernel/kernelClient';
import type { V1_1ErrorResponse, KernelRequestContext } from '@/lib/kernel/types';

export interface IdempotentMutationOptions {
  /** Function name to invoke */
  functionName: string;
  /** Called on success */
  onSuccess?: (data: unknown, context: KernelRequestContext) => void;
  /** Called on error */
  onError?: (error: V1_1ErrorResponse, context: KernelRequestContext) => void;
  /** Called when a duplicate submission is detected (same key returned cached result) */
  onAlreadyProcessed?: (data: unknown, context: KernelRequestContext) => void;
}

export interface IdempotentMutationResult {
  /** Execute the mutation */
  mutate: (body: Record<string, unknown>, idempotencyKey?: string) => Promise<void>;
  /** Whether a mutation is in flight */
  isLoading: boolean;
  /** Whether this was a cached/duplicate response */
  wasAlreadyProcessed: boolean;
  /** Last error */
  error: V1_1ErrorResponse | null;
  /** Last successful data */
  data: unknown | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for write operations that require idempotency.
 * 
 * Prevents double-submit at the UI level and sends Idempotency-Key
 * header so the backend can enforce at-most-once semantics.
 */
export function useIdempotentMutation(options: IdempotentMutationOptions): IdempotentMutationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [wasAlreadyProcessed, setWasAlreadyProcessed] = useState(false);
  const [error, setError] = useState<V1_1ErrorResponse | null>(null);
  const [data, setData] = useState<unknown | null>(null);
  const inflightKey = useRef<string | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setWasAlreadyProcessed(false);
    setError(null);
    setData(null);
    inflightKey.current = null;
  }, []);

  const mutate = useCallback(async (body: Record<string, unknown>, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();

    // Prevent double-submit: if same key is already in flight, ignore
    if (inflightKey.current === key) {
      return;
    }

    inflightKey.current = key;
    setIsLoading(true);
    setError(null);
    setWasAlreadyProcessed(false);

    const correlationId = setCorrelationId();

    try {
      const result = await invokeKernelFunction(options.functionName, {
        body,
        correlationId,
        headers: {
          'Idempotency-Key': key,
        },
      });

      if (result.error) {
        // Check if this is an "already processed" scenario
        // (backend returned the cached result for the same idempotency key)
        if (result.error.error.code === 'IDEMPOTENCY_CONFLICT') {
          setError(result.error);
          options.onError?.(result.error, result.context);
        } else {
          setError(result.error);
          options.onError?.(result.error, result.context);
        }
      } else {
        setData(result.data);
        options.onSuccess?.(result.data, result.context);
      }
    } catch (err) {
      // Network or unexpected error — safe to retry with same key
      const fallbackError: V1_1ErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Request failed',
          details: { retryable: true, idempotency_key: key },
          request_id: '',
          correlation_id: correlationId,
        },
      };
      setError(fallbackError);
      options.onError?.(fallbackError, { tenantId: '', podId: '', requestId: '', correlationId });
    } finally {
      setIsLoading(false);
      inflightKey.current = null;
    }
  }, [options]);

  return { mutate, isLoading, wasAlreadyProcessed, error, data, reset };
}
