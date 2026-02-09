/**
 * Impilo vNext v1.1 — Kernel Client
 * 
 * Client-side request interceptor that automatically injects mandatory
 * v1.1 headers on all outbound API calls:
 * - X-Tenant-ID
 * - X-Pod-ID
 * - X-Request-ID (generated per request)
 * - X-Correlation-ID (propagated or generated)
 * 
 * This wraps the Supabase functions invoke and can be used for
 * any kernel service call.
 */

import { supabase } from '@/integrations/supabase/client';
import type { KernelRequestContext, V1_1ErrorResponse } from './types';

// Default tenant/pod for prototype — in production these come from auth context
let currentTenantId = 'default-tenant';
let currentPodId = 'national';
let currentCorrelationId: string | null = null;

/**
 * Generate a UUID v4.
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Set the active tenant context (called after auth/workspace selection).
 */
export function setTenantContext(tenantId: string, podId: string): void {
  currentTenantId = tenantId;
  currentPodId = podId;
}

/**
 * Set a correlation ID for the current operation chain.
 * Call this at the start of a user-initiated action to trace across calls.
 */
export function setCorrelationId(correlationId?: string): string {
  currentCorrelationId = correlationId || generateUUID();
  return currentCorrelationId;
}

/**
 * Get the current request context with all mandatory headers.
 */
export function getRequestContext(): KernelRequestContext {
  return {
    tenantId: currentTenantId,
    podId: currentPodId,
    requestId: generateUUID(),
    correlationId: currentCorrelationId || generateUUID(),
  };
}

/**
 * Build the mandatory v1.1 headers object.
 */
export function getKernelHeaders(ctx?: KernelRequestContext): Record<string, string> {
  const context = ctx || getRequestContext();
  return {
    'X-Tenant-ID': context.tenantId,
    'X-Pod-ID': context.podId,
    'X-Request-ID': context.requestId,
    'X-Correlation-ID': context.correlationId,
  };
}

/**
 * Invoke a kernel edge function with all v1.1 mandatory headers injected.
 * 
 * This is the primary way to call any Ring 0 service from the client.
 * It wraps supabase.functions.invoke with header injection and
 * standard error handling.
 */
export async function invokeKernelFunction<T = unknown>(
  functionName: string,
  options: {
    body?: Record<string, unknown>;
    method?: string;
    headers?: Record<string, string>;
    correlationId?: string;
  } = {}
): Promise<{ data: T | null; error: V1_1ErrorResponse | null; context: KernelRequestContext }> {
  const ctx = getRequestContext();
  if (options.correlationId) {
    ctx.correlationId = options.correlationId;
  }

  const headers = {
    ...getKernelHeaders(ctx),
    ...options.headers,
  };

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: options.body,
    headers,
  });

  if (error) {
    // Try to parse as v1.1 error
    const v1_1Error: V1_1ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Unknown error',
        details: {},
        request_id: ctx.requestId,
        correlation_id: ctx.correlationId,
      },
    };
    return { data: null, error: v1_1Error, context: ctx };
  }

  // Check if the response itself contains a v1.1 error
  if (data?.error?.code) {
    return { data: null, error: data as V1_1ErrorResponse, context: ctx };
  }

  return { data: data as T, error: null, context: ctx };
}

/**
 * Get current tenant ID (for context display/debugging).
 */
export function getCurrentTenantId(): string {
  return currentTenantId;
}

/**
 * Get current pod ID.
 */
export function getCurrentPodId(): string {
  return currentPodId;
}
