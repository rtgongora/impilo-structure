/**
 * PCT v1.1 — Typed SDK Client
 * All calls attach mandatory TSHEPO headers.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE = `${SUPABASE_URL}/functions/v1/pct-v1`;

function getDevHeaders(): Record<string, string> {
  return {
    "X-Tenant-Id": localStorage.getItem("pct_tenant_id") || "dev-tenant",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Actor-Id": localStorage.getItem("pct_actor_id") || "dev-actor",
    "X-Actor-Type": localStorage.getItem("pct_actor_type") || "PROVIDER",
    "X-Purpose-Of-Use": "TREATMENT",
    "X-Device-Fingerprint": localStorage.getItem("pct_device_fp") || crypto.randomUUID(),
    "X-Facility-Id": localStorage.getItem("pct_facility_id") || "",
    "X-Workspace-Id": localStorage.getItem("pct_workspace_id") || "",
    "X-Shift-Id": localStorage.getItem("pct_shift_id") || "",
  };
}

async function pctFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      ...getDevHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// Work/Shift
export const startWork = (facility_id: string, workspace_id: string, duty_mode = "CLINICAL", context_json = {}) =>
  pctFetch("/v1/work/start", "POST", { facility_id, workspace_id, duty_mode, context_json });
export const endWork = (session_id: string) => pctFetch("/v1/work/end", "POST", { session_id });
export const getWorkContext = () => pctFetch("/v1/work/context", "GET");

// Patient search
export const searchPatients = (cpid?: string) => pctFetch("/v1/patients/search", "POST", { cpid });

// Journeys
export const startJourney = (patient_cpid: string, facility_id?: string, referral_source?: string) =>
  pctFetch("/v1/journeys/start", "POST", { patient_cpid, facility_id, referral_source });
export const triageJourney = (journeyId: string, acuity: string, vitals?: unknown, notes?: string) =>
  pctFetch(`/v1/journeys/${journeyId}/triage`, "POST", { acuity, vitals, notes });
export const routeJourney = (journeyId: string, workspace_id: string) =>
  pctFetch(`/v1/journeys/${journeyId}/route`, "POST", { workspace_id });

// Queues
export const getQueues = (facilityId?: string, workspaceId?: string) => {
  const params = new URLSearchParams();
  if (facilityId) params.set("facilityId", facilityId);
  if (workspaceId) params.set("workspaceId", workspaceId);
  return pctFetch(`/v1/queues?${params}`, "GET");
};
export const enqueue = (queueId: string, journey_id: string, priority?: number) =>
  pctFetch(`/v1/queues/${queueId}/enqueue`, "POST", { journey_id, priority });
export const callNext = (queueId: string) => pctFetch(`/v1/queues/${queueId}/call-next`, "POST", {});
export const updateQueueItemStatus = (itemId: string, status: string) =>
  pctFetch(`/v1/queue-items/${itemId}/status`, "POST", { status });
export const transferQueueItem = (itemId: string, target_queue_id: string, notes?: string) =>
  pctFetch(`/v1/queue-items/${itemId}/transfer`, "POST", { target_queue_id, notes });

// Encounters
export const startEncounter = (journeyId: string, workspace_id?: string, provider_id?: string) =>
  pctFetch(`/v1/journeys/${journeyId}/encounter/start`, "POST", { workspace_id, provider_id });
export const completeEncounter = (encounterId: string) =>
  pctFetch(`/v1/encounters/${encounterId}/complete`, "POST", {});
export const getPatientTimeline = (cpid: string) => pctFetch(`/v1/patient/${cpid}/timeline`, "GET");

// Admissions
export const admitPatient = (journeyId: string, ward_id: string, bed_id?: string) =>
  pctFetch(`/v1/journeys/${journeyId}/admit`, "POST", { ward_id, bed_id });
export const assignBed = (admissionId: string, bed_id: string) =>
  pctFetch(`/v1/admissions/${admissionId}/assign-bed`, "POST", { bed_id });

// Discharge
export const startDischarge = (journeyId: string, discharge_type = "ROUTINE", blockers?: unknown[]) =>
  pctFetch(`/v1/journeys/${journeyId}/discharge/start`, "POST", { discharge_type, blockers });
export const getDischargeStatus = (caseId: string) => pctFetch(`/v1/discharge/${caseId}/status`, "GET");
export const clearDischargeBlocker = (caseId: string, blocker_type: string) =>
  pctFetch(`/v1/discharge/${caseId}/clear-blocker`, "POST", { blocker_type });

// Death
export const recordDeath = (journeyId: string, cert_doc_id?: string) =>
  pctFetch(`/v1/journeys/${journeyId}/death/record`, "POST", { cert_doc_id });

// Ops
export const getControlTower = (facilityId: string) =>
  pctFetch(`/v1/ops/control-tower?facilityId=${facilityId}`, "GET");
export const getBottlenecks = (facilityId: string) =>
  pctFetch(`/v1/ops/bottlenecks?facilityId=${facilityId}`, "GET");
