/**
 * VITO v1.1 Client — typed SDK for calling the vito-v1-1 edge function.
 */

import { invokeKernelFunction } from '../kernelClient';

export interface VitoPatientRef {
  id: string;
  tenant_id: string;
  health_id: string;
  crid: string | null;
  cpid: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VitoMergeRequest {
  id: string;
  tenant_id: string;
  survivor_health_id: string;
  merged_health_ids: string[];
  requested_by: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface VitoEventEnvelope {
  id: string;
  schema_version: number;
  event_id: string;
  producer: string;
  event_type: string;
  occurred_at: string;
  tenant_id: string;
  pod_id: string;
  request_id: string;
  correlation_id: string;
  actor_id: string;
  actor_type: string;
  purpose_of_use: string;
  subject_type: string;
  subject_id: string;
  payload: Record<string, unknown>;
}

export interface VitoAuditEntry {
  id: string;
  tenant_id: string;
  action: string;
  decision: string;
  actor_id: string;
  actor_type: string;
  resource_type: string | null;
  resource_id: string | null;
  request_id: string;
  correlation_id: string;
  created_at: string;
  details: Record<string, unknown>;
}

export interface VitoConfig {
  emit_mode: string;
  spine_status: string;
  [key: string]: string;
}

// Helper to add idempotency key header
function withIdempotency(headers?: Record<string, string>): Record<string, string> {
  return { ...headers, 'Idempotency-Key': crypto.randomUUID() };
}

export async function createPatient(healthId: string, crid?: string, cpid?: string) {
  return invokeKernelFunction<{ patient: VitoPatientRef; action: string }>('vito-v1-1', {
    body: { health_id: healthId, crid, cpid },
    method: 'POST',
    headers: withIdempotency(),
  });
}

export async function updatePatient(healthId: string, updates: { crid?: string; cpid?: string; status?: string }) {
  return invokeKernelFunction<{ patient: VitoPatientRef; action: string }>('vito-v1-1', {
    body: { ...updates, _path: `/patients/${healthId}` },
    method: 'PATCH',
    headers: withIdempotency(),
  });
}

export async function mergePatients(survivorHealthId: string, mergedHealthIds: string[], reason: string) {
  return invokeKernelFunction<{ merge_request: VitoMergeRequest; action: string }>('vito-v1-1', {
    body: { survivor_health_id: survivorHealthId, merged_health_ids: mergedHealthIds, reason, _path: '/patients/merge' },
    method: 'POST',
    headers: withIdempotency(),
  });
}

export async function getEvents(filters?: { request_id?: string; correlation_id?: string; event_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.request_id) params.set('request_id', filters.request_id);
  if (filters?.correlation_id) params.set('correlation_id', filters.correlation_id);
  if (filters?.event_type) params.set('event_type', filters.event_type);
  const qs = params.toString();

  return invokeKernelFunction<{ events: VitoEventEnvelope[]; count: number }>('vito-v1-1', {
    body: { _path: '/events', _query: qs },
    method: 'GET',
  });
}

export async function getAuditEntries(filters?: { request_id?: string; correlation_id?: string; actor_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.request_id) params.set('request_id', filters.request_id);
  if (filters?.correlation_id) params.set('correlation_id', filters.correlation_id);
  if (filters?.actor_id) params.set('actor_id', filters.actor_id);
  const qs = params.toString();

  return invokeKernelFunction<{ audit_entries: VitoAuditEntry[]; count: number }>('vito-v1-1', {
    body: { _path: '/audit', _query: qs },
    method: 'GET',
  });
}

export async function getVitoConfig() {
  return invokeKernelFunction<{ config: VitoConfig }>('vito-v1-1', {
    body: { _path: '/config' },
    method: 'GET',
  });
}

export async function updateVitoConfig(key: string, value: string) {
  return invokeKernelFunction<{ updated: boolean }>('vito-v1-1', {
    body: { config_key: key, config_value: value, _path: '/config' },
    method: 'PATCH',
  });
}
