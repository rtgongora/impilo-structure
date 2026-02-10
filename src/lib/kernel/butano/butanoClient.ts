/**
 * BUTANO v1.1 — Typed SDK for the SHR edge function
 */
import { invokeKernelFunction } from '../kernelClient';

export interface TimelineItem {
  id: string;
  resource_type: string;
  fhir_id: string;
  encounter_id: string | null;
  effective_at: string | null;
  last_updated_at: string;
  is_provisional: boolean;
  tags: string[];
}

export interface TimelineResponse {
  items: TimelineItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface IPSBundle {
  resourceType: string;
  type: string;
  subject_cpid: string;
  timestamp: string;
  sections: {
    allergies: unknown[];
    problems: unknown[];
    medications: unknown[];
    immunizations: unknown[];
    vitals: unknown[];
    labs: unknown[];
    procedures: unknown[];
    carePlans: unknown[];
  };
  total_resources: number;
}

export interface VisitSummaryBundle {
  resourceType: string;
  encounter_id: string;
  encounter: unknown | null;
  resources: { resourceType: string; resource: unknown }[];
  total_resources: number;
}

export interface ReconcileResult {
  status: string;
  records_rewritten: number;
  from_ocpid: string;
  to_cpid: string;
}

export interface ResourceStats {
  tenant_id: string;
  resource_stats: Record<string, { count: number; last_updated: string }>;
  total: number;
}

export interface ReconciliationJob {
  job_id: string;
  tenant_id: string;
  from_ocpid: string;
  to_cpid: string;
  status: string;
  created_at: string;
  updated_at: string;
  error: string | null;
}

export async function getTimeline(cpid: string, opts?: { since?: string; type?: string; page?: number }) {
  const params: Record<string, unknown> = { action: "timeline", cpid, ...opts };
  return invokeKernelFunction<TimelineResponse>("butano-v1", { body: params, method: "GET" });
}

export async function getIPS(cpid: string) {
  return invokeKernelFunction<IPSBundle>("butano-v1", { body: { action: "ips", cpid }, method: "GET" });
}

export async function getVisitSummary(encounterId: string) {
  return invokeKernelFunction<VisitSummaryBundle>("butano-v1", { body: { action: "visit_summary", encounterId }, method: "GET" });
}

export async function reconcileSubject(fromOcpid: string, toCpid: string) {
  return invokeKernelFunction<ReconcileResult>("butano-v1", { body: { action: "reconcile", from_ocpid: fromOcpid, to_cpid: toCpid } });
}

export async function getStats() {
  return invokeKernelFunction<ResourceStats>("butano-v1", { body: { action: "stats" }, method: "GET" });
}

export async function getReconciliationQueue() {
  return invokeKernelFunction<{ jobs: ReconciliationJob[] }>("butano-v1", { body: { action: "recon_queue" }, method: "GET" });
}
