/**
 * Impilo vNext v1.1 — Kernel Client
 * 
 * Client-side request interceptor that automatically injects mandatory
 * v1.1 headers on all outbound API calls:
 * - X-Tenant-ID, X-Pod-ID, X-Request-ID, X-Correlation-ID (base)
 * - X-Actor-Id, X-Actor-Type, X-Purpose-Of-Use (TSHEPO mandatory)
 * - X-Device-Fingerprint (generated per install)
 * - X-Facility-Id, X-Workspace-Id, X-Shift-Id (context)
 */

import { supabase } from '@/integrations/supabase/client';
import type { KernelRequestContext, V1_1ErrorResponse } from './types';

// Default context — in production these come from auth context
let currentTenantId = 'default-tenant';
let currentPodId = 'national';
let currentCorrelationId: string | null = null;
let currentActorId = '';
let currentActorType = 'provider';
let currentPurposeOfUse = 'treatment';
let currentFacilityId: string | null = null;
let currentWorkspaceId: string | null = null;
let currentShiftId: string | null = null;
let deviceFingerprint: string | null = null;

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate device fingerprint per TSHEPO spec:
 * Web: hash(UA + platform + localStorage UUID)
 * Never IMEI/serial.
 */
function getDeviceFingerprint(): string {
  if (deviceFingerprint) return deviceFingerprint;

  // Check localStorage for stable UUID
  let stableUuid = '';
  try {
    stableUuid = localStorage.getItem('impilo_device_uuid') || '';
    if (!stableUuid) {
      stableUuid = generateUUID();
      localStorage.setItem('impilo_device_uuid', stableUuid);
    }
  } catch {
    stableUuid = generateUUID();
  }

  // Hash: UA + platform + stable UUID
  const raw = `${navigator.userAgent}:${navigator.platform}:${stableUuid}`;
  // Simple hash for prototype — production uses SHA-256
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  deviceFingerprint = `web-${Math.abs(hash).toString(36)}-${stableUuid.substring(0, 8)}`;
  return deviceFingerprint;
}

export function setTenantContext(tenantId: string, podId: string): void {
  currentTenantId = tenantId;
  currentPodId = podId;
}

export function setActorContext(actorId: string, actorType: string = 'provider'): void {
  currentActorId = actorId;
  currentActorType = actorType;
}

export function setPurposeOfUse(purpose: string): void {
  currentPurposeOfUse = purpose;
}

export function setFacilityContext(facilityId: string | null, workspaceId: string | null = null, shiftId: string | null = null): void {
  currentFacilityId = facilityId;
  currentWorkspaceId = workspaceId;
  currentShiftId = shiftId;
}

export function setCorrelationId(correlationId?: string): string {
  currentCorrelationId = correlationId || generateUUID();
  return currentCorrelationId;
}

export function getRequestContext(): KernelRequestContext {
  return {
    tenantId: currentTenantId,
    podId: currentPodId,
    requestId: generateUUID(),
    correlationId: currentCorrelationId || generateUUID(),
  };
}

/**
 * Build ALL mandatory v1.1 headers including TSHEPO expanded set.
 */
export function getKernelHeaders(ctx?: KernelRequestContext): Record<string, string> {
  const context = ctx || getRequestContext();
  const headers: Record<string, string> = {
    'X-Tenant-ID': context.tenantId,
    'X-Pod-ID': context.podId,
    'X-Request-ID': context.requestId,
    'X-Correlation-ID': context.correlationId,
    'X-Actor-Id': currentActorId,
    'X-Actor-Type': currentActorType,
    'X-Purpose-Of-Use': currentPurposeOfUse,
    'X-Device-Fingerprint': getDeviceFingerprint(),
  };

  // Context headers — only when set
  if (currentFacilityId) headers['X-Facility-Id'] = currentFacilityId;
  if (currentWorkspaceId) headers['X-Workspace-Id'] = currentWorkspaceId;
  if (currentShiftId) headers['X-Shift-Id'] = currentShiftId;

  return headers;
}

/**
 * Invoke a kernel edge function with all v1.1 mandatory headers injected.
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

  if (data?.error?.code) {
    return { data: null, error: data as V1_1ErrorResponse, context: ctx };
  }

  return { data: data as T, error: null, context: ctx };
}

export function getCurrentTenantId(): string { return currentTenantId; }
export function getCurrentPodId(): string { return currentPodId; }
export function getCurrentActorId(): string { return currentActorId; }
