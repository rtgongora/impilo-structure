/**
 * Landela + Credentials Suite — Typed SDK Client
 * Wraps all suite edge function endpoints with TSHEPO header injection.
 */

import { supabase } from "@/integrations/supabase/client";

const DEV_HEADERS = {
  "x-tenant-id": "dev-tenant",
  "x-correlation-id": crypto.randomUUID(),
  "x-device-fingerprint": "web-dev-prototype",
  "x-purpose-of-use": "TREATMENT",
  "x-actor-id": "dev-actor",
  "x-actor-type": "PRACTITIONER",
};

async function invoke<T = unknown>(path: string, options?: { method?: string; body?: Record<string, unknown> }): Promise<T> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/landela-suite-v1${path}`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      ...DEV_HEADERS,
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${token}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: { message: resp.statusText } }));
    throw new Error(err.error?.message || resp.statusText);
  }
  return resp.json();
}

export const suiteClient = {
  // Documents
  uploadDoc: (body: Record<string, unknown>) => invoke<{ document: any }>("/v1/docs/upload", { method: "POST", body }),
  getDocMeta: (id: string) => invoke<{ document: any }>(`/v1/docs/${id}/metadata`),
  updateDocMeta: (id: string, body: Record<string, unknown>) => invoke(`/v1/docs/${id}/metadata`, { method: "PUT", body }),
  getSignedUrl: (id: string, scope = "DOWNLOAD") => invoke<{ token: string }>(`/v1/docs/${id}/signed-url`, { method: "POST", body: { scope } }),
  searchDocs: (filters: Record<string, unknown>) => invoke<{ documents: any[]; total: number }>("/v1/docs/search", { method: "POST", body: filters }),
  archiveDoc: (id: string, reason?: string) => invoke(`/v1/docs/${id}/lifecycle/archive`, { method: "POST", body: { reason } }),
  revokeDoc: (id: string, reason: string) => invoke(`/v1/docs/${id}/lifecycle/revoke`, { method: "POST", body: { reason } }),
  supersedeDoc: (id: string, reason: string) => invoke(`/v1/docs/${id}/lifecycle/supersede`, { method: "POST", body: { reason } }),
  deleteDoc: (id: string, reason: string) => invoke(`/v1/docs/${id}/lifecycle/delete`, { method: "POST", body: { reason } }),

  // Credentials
  issueCredential: (body: Record<string, unknown>) => invoke<{ credential: any; qr_ref_token: string }>("/v1/credentials/issue", { method: "POST", body }),
  getCredential: (id: string) => invoke<{ credential: any }>(`/v1/credentials/${id}`),
  revokeCredential: (id: string, reason: string) => invoke(`/v1/credentials/${id}/revoke`, { method: "POST", body: { reason } }),
  verifyCredential: (qrToken: string) => invoke<{ verification: { status: string } }>(`/v1/verify/${qrToken}`),

  // Print
  requestPrint: (body: Record<string, unknown>) => invoke<{ print_job: any }>("/v1/print/request", { method: "POST", body }),
  listPrintJobs: (subject?: string) => invoke<{ print_jobs: any[] }>(`/v1/print/jobs${subject ? `?subject=${subject}` : ""}`),
  renderPrint: (id: string) => invoke(`/v1/print/jobs/${id}/render`, { method: "POST" }),
  markPrinted: (id: string) => invoke(`/v1/print/jobs/${id}/mark-printed`, { method: "POST" }),
  markCollected: (id: string) => invoke(`/v1/print/jobs/${id}/mark-collected`, { method: "POST" }),

  // Share
  createShare: (body: Record<string, unknown>) => invoke<{ share_link: any }>("/v1/share/create", { method: "POST", body }),
  sendOtp: (token: string) => invoke(`/v1/share/${token}/otp/send`, { method: "POST" }),
  claimShare: (token: string, otp: string) => invoke(`/v1/share/${token}/claim`, { method: "POST", body: { otp } }),
  getShareStatus: (token: string) => invoke<{ share_link: any }>(`/v1/share/${token}/status`),
  revokeShare: (token: string) => invoke(`/v1/share/${token}/revoke`, { method: "POST" }),

  // Internal
  pushDocRef: (body: Record<string, unknown>) => invoke("/v1/internal/documentreference/push", { method: "POST", body }),
  getStats: () => invoke<{ stats: Record<string, number> }>("/v1/internal/stats"),

  // High-Risk Queue
  listHRQ: () => invoke<{ queue: any[] }>("/v1/high-risk-queue"),
  approveHRQ: (id: string, reason?: string) => invoke(`/v1/high-risk-queue/${id}/approve`, { method: "POST", body: { reason } }),
  rejectHRQ: (id: string, reason?: string) => invoke(`/v1/high-risk-queue/${id}/reject`, { method: "POST", body: { reason } }),
};
