/**
 * VARAPI v1.1 — Typed Client SDK
 * Reference client for prototype UI surfaces.
 */
import { supabase } from '@/integrations/supabase/client';

const VARAPI_FN = 'varapi-v1';

function defaultHeaders(): Record<string, string> {
  return {
    'X-Tenant-Id': 'default-tenant',
    'X-Correlation-Id': crypto.randomUUID(),
    'X-Device-Fingerprint': getDeviceFingerprint(),
    'X-Purpose-Of-Use': 'ADMIN_OPS',
    'X-Actor-Id': 'prototype-actor',
    'X-Actor-Type': 'ADMIN',
    'X-Request-Id': crypto.randomUUID(),
  };
}

function getDeviceFingerprint(): string {
  let fp = localStorage.getItem('varapi_device_fp');
  if (!fp) {
    // Web: hash(userAgent + platform + localStorageUUID)
    fp = crypto.randomUUID();
    localStorage.setItem('varapi_device_fp', fp);
  }
  return fp;
}

async function invoke<T = unknown>(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<{ data: T | null; error: any }> {
  const { data, error } = await supabase.functions.invoke(VARAPI_FN, {
    method: (options.method as any) || 'POST',
    body: options.method === 'GET' ? undefined : (options.body || {}),
    headers: { ...defaultHeaders(), ...options.headers },
  });
  // Edge function path routing: we pass the path in the body for GET-like operations via POST
  return { data: data as T, error };
}

// For GET requests we use POST with _method=GET pattern since supabase functions.invoke doesn't support query params well
async function invokeGet<T = unknown>(path: string, headers?: Record<string, string>): Promise<{ data: T | null; error: any }> {
  const fullHeaders = { ...defaultHeaders(), ...headers };
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${VARAPI_FN}${path}`,
    { method: 'GET', headers: { ...fullHeaders, 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
  );
  const data = await response.json();
  return { data: data as T, error: response.ok ? null : data };
}

async function invokePost<T = unknown>(path: string, body: unknown, headers?: Record<string, string>): Promise<{ data: T | null; error: any }> {
  const fullHeaders = { ...defaultHeaders(), ...headers };
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${VARAPI_FN}${path}`,
    { method: 'POST', headers: { ...fullHeaders, 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await response.json();
  return { data: data as T, error: response.ok ? null : data };
}

async function invokePut<T = unknown>(path: string, body: unknown, headers?: Record<string, string>): Promise<{ data: T | null; error: any }> {
  const fullHeaders = { ...defaultHeaders(), ...headers };
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${VARAPI_FN}${path}`,
    { method: 'PUT', headers: { ...fullHeaders, 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await response.json();
  return { data: data as T, error: response.ok ? null : data };
}

export const varapiClient = {
  // Providers
  createProvider: (body: any) => invokePost('/providers', body),
  getProvider: (id: string) => invokeGet(`/providers/${id}`),
  searchProviders: (body: any) => invokePost('/providers/search', body),
  updateProvider: (id: string, body: any) => invokePut(`/providers/${id}`, body),
  changeStatus: (id: string, body: any) => invokePost(`/providers/${id}/status`, body),
  // Privileges
  grantPrivilege: (id: string, body: any) => invokePost(`/providers/${id}/privileges/grant`, body),
  revokePrivilege: (id: string, body: any) => invokePost(`/providers/${id}/privileges/revoke`, body),
  getPrivileges: (id: string) => invokeGet(`/providers/${id}/privileges`),
  decidePrivilege: (privId: string, body: any) => invokePost(`/privileges/${privId}/decision`, body),
  // Eligibility
  checkEligibility: (body: any) => invokePost('/eligibility/check', body),
  // Tokens
  issueToken: (body: any) => invokePost('/provider-token/issue', body),
  rotateToken: (body: any) => invokePost('/provider-token/rotate', body),
  startRecovery: (body: any) => invokePost('/provider-token/recovery/start', body),
  verifyRecovery: (body: any) => invokePost('/provider-token/recovery/verify', body),
  // Councils
  createCouncil: (body: any) => invokePost('/councils', body),
  getCouncils: () => invokeGet('/councils'),
  createImportRun: (councilId: string, body: any) => invokePost(`/councils/${councilId}/imports`, body),
  // Reconciliation
  getReconciliationQueue: () => invokeGet('/reconciliation/queue'),
  decideReconciliation: (caseId: string, body: any) => invokePost(`/reconciliation/${caseId}/decision`, body),
  // FHIR
  getFhirPractitioner: (id: string) => invokeGet(`/fhir/practitioner/${id}`),
  getFhirBundle: (id: string) => invokeGet(`/fhir/bundle/provider/${id}`),
  // Portal
  getPortalMe: () => invokeGet('/portal/me'),
  getPortalCpd: () => invokeGet('/portal/cpd'),
  submitCpdEvidence: (body: any) => invokePost('/portal/cpd/evidence', body),
  getPortalCertificates: () => invokeGet('/portal/certificates'),
  downloadCertificate: (id: string) => invokeGet(`/portal/certificates/${id}/download`),
};
