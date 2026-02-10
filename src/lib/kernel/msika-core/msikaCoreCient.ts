/**
 * MSIKA Core v1.1 — Typed SDK Client
 */
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "msika-core-v1";

function getHeaders(): Record<string, string> {
  return {
    "X-Tenant-Id": "default",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Device-Fingerprint": crypto.randomUUID(),
    "X-Purpose-Of-Use": "ADMINISTRATION",
    "X-Actor-Id": "msika-ui",
    "X-Actor-Type": "USER",
    "X-Session-Assurance": "HIGH",
  };
}

async function call(path: string, method = "GET", body?: unknown) {
  const opts: any = { method, headers: getHeaders() };
  if (body) opts.body = body;
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    ...opts,
    headers: { ...getHeaders(), ...(path ? { "x-path": path } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  // Edge functions via invoke don't support custom paths, so we use query params
  return { data, error };
}

// For direct fetch (bypassing supabase.functions.invoke path limitation)
async function directFetch(path: string, method = "GET", body?: unknown) {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const url = `${supabaseUrl}/functions/v1/${FUNCTION_NAME}/${path}`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token || anonKey;

  const resp = await fetch(url, {
    method,
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = resp.status === 304 ? null : await resp.json();
  return { data, status: resp.status, ok: resp.ok, etag: resp.headers.get("etag") };
}

// ── Catalogs ─────────────────────────────────
export async function listCatalogs(params?: { scope?: string; status?: string; tenantId?: string }) {
  const qs = new URLSearchParams();
  if (params?.scope) qs.set("scope", params.scope);
  if (params?.status) qs.set("status", params.status);
  if (params?.tenantId) qs.set("tenantId", params.tenantId);
  return directFetch(`v1/catalogs?${qs}`, "GET");
}

export async function createCatalog(body: { name: string; scope: string; version?: string }) {
  return directFetch("v1/catalogs", "POST", body);
}

export async function catalogAction(catalogId: string, action: string) {
  return directFetch(`v1/catalogs/${catalogId}/${action}`, "POST");
}

// ── Items ────────────────────────────────────
export async function createItem(catalogId: string, body: any) {
  return directFetch(`v1/catalogs/${catalogId}/items`, "POST", body);
}

export async function getItem(itemId: string) {
  return directFetch(`v1/items/${itemId}`, "GET");
}

export async function updateItem(itemId: string, body: any) {
  return directFetch(`v1/items/${itemId}`, "PUT", body);
}

// ── Search ───────────────────────────────────
export async function searchItems(params: { q?: string; kind?: string; tag?: string; restriction?: string; tenantId?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.kind) qs.set("kind", params.kind);
  if (params.tag) qs.set("tag", params.tag);
  if (params.restriction) qs.set("restriction", params.restriction);
  if (params.tenantId) qs.set("tenantId", params.tenantId);
  return directFetch(`v1/search?${qs}`, "GET");
}

// ── Packs ────────────────────────────────────
export async function getPack(packType: string, tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : "";
  return directFetch(`v1/packs/${packType}${qs}`, "GET");
}

// ── Imports ──────────────────────────────────
export async function importCSV(rows: any[], sourceId?: string) {
  return directFetch("v1/import/csv", "POST", { rows, source_id: sourceId });
}

export async function getImportJob(jobId: string) {
  return directFetch(`v1/import/jobs/${jobId}`, "GET");
}

// ── Mappings ─────────────────────────────────
export async function listPendingMappings() {
  return directFetch("v1/mappings/pending", "GET");
}

export async function approveMapping(id: string) {
  return directFetch(`v1/mappings/${id}/approve`, "POST");
}

export async function rejectMapping(id: string) {
  return directFetch(`v1/mappings/${id}/reject`, "POST");
}

// ── Validate ─────────────────────────────────
export async function validateItem(body: any) {
  return directFetch("v1/validate/item", "POST", body);
}
