/**
 * OROS v1.1 — Typed SDK Client
 * Auto-injects TSHEPO headers for all requests.
 */

const OROS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oros-v1`;

function tshepoHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "X-Tenant-Id": localStorage.getItem("oros_tenant_id") || "NATIONAL",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Actor-Id": localStorage.getItem("oros_actor_id") || "dev-actor",
    "X-Actor-Type": localStorage.getItem("oros_actor_type") || "PROVIDER",
    "X-Purpose-Of-Use": "TREATMENT",
    "X-Device-Fingerprint": localStorage.getItem("device_fingerprint") || crypto.randomUUID(),
    ...(localStorage.getItem("oros_facility_id") ? { "X-Facility-Id": localStorage.getItem("oros_facility_id")! } : {}),
    ...(localStorage.getItem("oros_workspace_id") ? { "X-Workspace-Id": localStorage.getItem("oros_workspace_id")! } : {}),
  };
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${OROS_BASE}${path}`, {
    method,
    headers: tshepoHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

export const orosClient = {
  // Orders
  placeOrder: (data: { facility_id: string; patient_cpid: string; type: string; priority?: string; zibo_order_code?: any; items?: any[] }) =>
    call("POST", "/v1/orders", data),
  getOrder: (orderId: string) => call("GET", `/v1/orders/${orderId}`),
  cancelOrder: (orderId: string) => call("POST", `/v1/orders/${orderId}/cancel`),
  acceptOrder: (orderId: string) => call("POST", `/v1/orders/${orderId}/accept`),
  rejectOrder: (orderId: string, reason: string) => call("POST", `/v1/orders/${orderId}/reject`, { reason }),

  // Worklists
  getWorklists: (params: { facilityId?: string; type?: string; workspaceId?: string }) => {
    const sp = new URLSearchParams();
    if (params.facilityId) sp.set("facilityId", params.facilityId);
    if (params.type) sp.set("type", params.type);
    if (params.workspaceId) sp.set("workspaceId", params.workspaceId);
    return call("GET", `/v1/worklists?${sp.toString()}`);
  },

  // Worksteps
  startWorkstep: (stepId: string) => call("POST", `/v1/worksteps/${stepId}/start`),
  completeWorkstep: (stepId: string) => call("POST", `/v1/worksteps/${stepId}/complete`),

  // Results
  postResult: (orderId: string, data: { kind: string; summary?: any; zibo_result_codes?: any[]; doc_ids?: string[]; is_critical?: boolean; partial?: boolean }) =>
    call("POST", `/v1/orders/${orderId}/results`, data),
  getResults: (orderId: string) => call("GET", `/v1/orders/${orderId}/results`),
  markCritical: (orderId: string, resultId: string) => {
    const headers = tshepoHeaders();
    headers["X-Session-Assurance"] = "HIGH";
    return fetch(`${OROS_BASE}/v1/orders/${orderId}/results/${resultId}/mark-critical`, { method: "POST", headers }).then(r => r.json());
  },

  // Ack
  ackOrder: (orderId: string, ackType: string, notes?: string) =>
    call("POST", `/v1/orders/${orderId}/ack`, { ack_type: ackType, notes }),

  // Routing
  getRoute: (orderId: string) => call("GET", `/v1/routes/${orderId}`),
  retryRoute: (orderId: string) => call("POST", `/v1/retry/${orderId}`),

  // Reconciliation
  getReconcilePending: (facilityId?: string) => call("GET", `/v1/reconcile/pending${facilityId ? `?facilityId=${facilityId}` : ""}`),
  matchReconcile: (recId: string, orderId: string, notes?: string) => call("POST", `/v1/reconcile/${recId}/match`, { order_id: orderId, ops_notes: notes }),
  resolveReconcile: (recId: string) => {
    const headers = tshepoHeaders();
    headers["X-Session-Assurance"] = "HIGH";
    return fetch(`${OROS_BASE}/v1/reconcile/${recId}/resolve`, { method: "POST", headers }).then(r => r.json());
  },

  // Capabilities
  getCapabilities: (facilityId: string) => call("GET", `/v1/capabilities/effective?facility_id=${facilityId}`),
  upsertCapabilities: (data: any) => call("POST", "/v1/capabilities", data),

  // Writeback
  getWritebackIntents: (orderId?: string) => call("GET", `/v1/writeback-intents${orderId ? `?order_id=${orderId}` : ""}`),

  // Events
  getEvents: (orderId?: string) => call("GET", `/v1/events${orderId ? `?order_id=${orderId}` : ""}`),
};
