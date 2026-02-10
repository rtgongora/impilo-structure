/**
 * ZIBO Terminology Service v1.1 — Client SDK
 * Auto-injects TSHEPO mandatory headers on all calls.
 */
import { supabase } from '@/integrations/supabase/client';
import { getKernelHeaders, getRequestContext } from '../kernelClient';

async function ziboCall<T>(path: string, method: string = 'GET', body?: unknown): Promise<T> {
  const ctx = getRequestContext();
  const headers = getKernelHeaders(ctx);
  const bodyObj = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { data, error } = await supabase.functions.invoke('zibo-v1', {
    body: { _route: path, _method: method, ...bodyObj },
    headers,
  });
  if (error) throw new Error(error.message);
  return data as T;
}

// We need to use fetch directly since supabase.functions.invoke doesn't support query params well
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function ziboFetch<T>(path: string, method: string = 'GET', body?: unknown): Promise<T> {
  const ctx = getRequestContext();
  const headers: Record<string, string> = {
    ...getKernelHeaders(ctx),
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'apikey': SUPABASE_KEY,
  };
  const url = `${SUPABASE_URL}/functions/v1/zibo-v1${path}`;
  const opts: RequestInit = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  return data as T;
}

// ─── Artifacts ───
export interface ZiboArtifact {
  id: string;
  tenant_id: string;
  fhir_type: string;
  canonical_url: string;
  version: string;
  status: string;
  content_json: unknown;
  hash: string;
  created_by_actor_id: string;
  created_at: string;
}

export const ziboCreateDraftArtifact = (body: Partial<ZiboArtifact>) =>
  ziboFetch<ZiboArtifact>('/v1/artifacts/draft', 'POST', body);

export const ziboUpdateDraftArtifact = (id: string, body: Partial<ZiboArtifact>) =>
  ziboFetch<ZiboArtifact>(`/v1/artifacts/draft/${id}`, 'PUT', body);

export const ziboPublishArtifact = (id: string) =>
  ziboFetch<ZiboArtifact>(`/v1/artifacts/${id}/publish`, 'POST');

export const ziboDeprecateArtifact = (id: string) =>
  ziboFetch<ZiboArtifact>(`/v1/artifacts/${id}/deprecate`, 'POST');

export const ziboRetireArtifact = (id: string) =>
  ziboFetch<ZiboArtifact>(`/v1/artifacts/${id}/retire`, 'POST');

export const ziboGetArtifactByCanonical = (canonical_url: string, version?: string, scope?: string) =>
  ziboFetch<ZiboArtifact | null>(`/v1/artifacts/by-canonical?canonical_url=${encodeURIComponent(canonical_url)}${version ? `&version=${version}` : ''}${scope ? `&tenant_scope=${scope}` : ''}`);

export const ziboListArtifacts = (status?: string, tenant_id?: string) =>
  ziboFetch<{ artifacts: ZiboArtifact[] }>(`/v1/artifacts?${status ? `status=${status}&` : ''}${tenant_id ? `tenant_id=${tenant_id}` : ''}`);

// ─── Import/Export ───
export const ziboImportFhirBundle = (bundle: unknown, tenant_id?: string) =>
  ziboFetch<{ imported: number; results: unknown[] }>('/v1/import/fhir-bundle', 'POST', { ...bundle as object, tenant_id });

export const ziboImportCsvCodelist = (body: { name: string; system_url: string; version?: string; codes: Array<{ code: string; display: string }>; create_valueset?: boolean; tenant_id?: string }) =>
  ziboFetch<{ code_system: ZiboArtifact; value_set: ZiboArtifact | null; codes_count: number }>('/v1/import/csv-codelist', 'POST', body);

export const ziboExportPack = (pack_id: string, version: string, tenant_id?: string) =>
  ziboFetch<unknown>(`/v1/export/pack?pack_id=${pack_id}&version=${version}${tenant_id ? `&tenant_id=${tenant_id}` : ''}`);

// ─── Packs ───
export interface ZiboPack {
  pack_id: string;
  tenant_id: string;
  name: string;
  version: string;
  status: string;
  manifest_json: unknown;
  created_at: string;
}

export const ziboCreateDraftPack = (body: { pack_id: string; name: string; version: string; tenant_id?: string; manifest_json?: unknown }) =>
  ziboFetch<ZiboPack>('/v1/packs/draft', 'POST', body);

export const ziboUpdateDraftPack = (pack_id: string, version: string, body: { name?: string; manifest_json?: unknown; artifact_ids?: string[]; tenant_id?: string }) =>
  ziboFetch<ZiboPack>(`/v1/packs/draft/${pack_id}/${version}`, 'PUT', body);

export const ziboPublishPack = (pack_id: string, version: string, tenant_id?: string) =>
  ziboFetch<ZiboPack>(`/v1/packs/${pack_id}/${version}/publish`, 'POST', { tenant_id });

export const ziboListPacks = (tenant_id?: string, status?: string) =>
  ziboFetch<{ packs: ZiboPack[] }>(`/v1/packs/list?${tenant_id ? `tenant_id=${tenant_id}&` : ''}${status ? `status=${status}` : ''}`);

// ─── Assignments ───
export interface ZiboAssignment {
  id: string;
  tenant_id: string;
  scope_type: string;
  scope_id: string;
  pack_tenant_id: string;
  pack_id: string;
  pack_version: string;
  policy_mode: string;
  created_at: string;
}

export const ziboCreateAssignment = (body: Partial<ZiboAssignment>) =>
  ziboFetch<ZiboAssignment>('/v1/assignments', 'POST', body);

export const ziboGetEffectiveAssignment = (tenant_id?: string, facility_id?: string, workspace_id?: string) =>
  ziboFetch<{ policy_mode: string; packs: Array<{ pack_id: string; version: string; pack_tenant_id: string }>; resolved_from: string }>(
    `/v1/assignments/effective?${tenant_id ? `tenant_id=${tenant_id}&` : ''}${facility_id ? `facility_id=${facility_id}&` : ''}${workspace_id ? `workspace_id=${workspace_id}` : ''}`
  );

export const ziboListAssignments = (tenant_id?: string) =>
  ziboFetch<{ assignments: ZiboAssignment[] }>(`/v1/assignments?${tenant_id ? `tenant_id=${tenant_id}` : ''}`);

// ─── Validation ───
export interface ValidateCodingResult {
  valid: boolean;
  mode: string;
  unvalidated?: boolean;
  issues: Array<{ code: string; severity: string; message: string }>;
  suggested_mappings: Array<{ target_system: string; target_code: string; confidence: number }>;
}

export const ziboValidateCoding = (coding: { system: string; code: string; display?: string }, context?: { tenant_id?: string; facility_id?: string; workspace_id?: string; service_name?: string }, requested_mode?: string) =>
  ziboFetch<ValidateCodingResult>('/v1/validate/coding', 'POST', { coding, context, requested_mode });

export const ziboValidateResource = (resource: unknown, context?: unknown) =>
  ziboFetch<{ total_codings: number; issues: unknown[]; summary: { errors: number; warnings: number; valid: number } }>('/v1/validate/resource', 'POST', { resource, context });

// ─── Mapping ───
export const ziboMapCode = (source_system: string, source_code: string, target_system?: string) =>
  ziboFetch<{ found: boolean; best_match?: unknown; mappings: unknown[] }>('/v1/map', 'POST', { source_system, source_code, target_system });

// ─── Logs ───
export interface ZiboValidationLog {
  id: string;
  tenant_id: string;
  facility_id: string | null;
  service_name: string;
  severity: string;
  issue_code: string;
  canonical_url: string | null;
  version: string | null;
  details_json: unknown;
  created_at: string;
}

export const ziboGetValidationLogs = (tenant_id?: string, facility_id?: string, service_name?: string, limit?: number) =>
  ziboFetch<{ logs: ZiboValidationLog[] }>(`/v1/logs?${tenant_id ? `tenant_id=${tenant_id}&` : ''}${facility_id ? `facility_id=${facility_id}&` : ''}${service_name ? `service_name=${service_name}&` : ''}${limit ? `limit=${limit}` : ''}`);
