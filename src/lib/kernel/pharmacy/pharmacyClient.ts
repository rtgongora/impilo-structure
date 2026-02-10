/**
 * Pharmacy Service v1.1 — Typed SDK Client
 * Auto-injects TSHEPO headers for all requests.
 */

const PHARM_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pharmacy-v1`;

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
  const res = await fetch(`${PHARM_BASE}${path}`, {
    method,
    headers: tshepoHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

function callWithAssurance(method: string, path: string, body?: unknown) {
  const headers = tshepoHeaders();
  headers["X-Session-Assurance"] = "HIGH";
  return fetch(`${PHARM_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(r => r.json());
}

export const pharmacyClient = {
  // Worklists
  getWorklist: (params: { facilityId?: string; workspaceId?: string; storeId?: string }) => {
    const sp = new URLSearchParams();
    if (params.facilityId) sp.set("facilityId", params.facilityId);
    if (params.workspaceId) sp.set("workspaceId", params.workspaceId);
    if (params.storeId) sp.set("storeId", params.storeId);
    return call("GET", `/v1/worklists?${sp.toString()}`);
  },

  // OROS order projection
  receiveOrosOrder: (data: { oros_order_id: string; patient_cpid: string; items: any[]; priority?: string; facility_id?: string; workspace_id?: string }) =>
    call("POST", "/v1/internal/oros/order-placed", data),

  // Order detail
  getOrder: (id: string) => call("GET", `/v1/dispense-orders/${id}`),

  // Lifecycle
  acceptOrder: (id: string) => call("POST", `/v1/dispense-orders/${id}/accept`),
  pickOrder: (id: string) => call("POST", `/v1/dispense-orders/${id}/pick`),
  partialDispense: (id: string, items: any[]) => call("POST", `/v1/dispense-orders/${id}/partial`, { items }),
  backorder: (id: string, data?: any) => call("POST", `/v1/dispense-orders/${id}/backorder`, data || {}),
  completeDispense: (id: string, items: any[]) => call("POST", `/v1/dispense-orders/${id}/complete`, { items }),

  // Substitution
  substituteItem: (itemId: string, data: { new_drug_code: any; reason_code: string }) =>
    call("POST", `/v1/dispense-items/${itemId}/substitute`, data),

  // Barcode lookup
  lookupBarcode: (code: string) => call("GET", `/v1/items/lookup-by-barcode?code=${encodeURIComponent(code)}`),

  // Pickup proofs
  createPickupProof: (id: string, data: { method: "OTP" | "QR"; is_delegated?: boolean }) =>
    call("POST", `/v1/dispense-orders/${id}/pickup/create`, data),
  claimPickup: (token: string) => call("POST", "/v1/pickup/claim", { token }),

  // Returns / wastage / reversal
  returnItems: (id: string, items: any[]) => call("POST", `/v1/dispense-orders/${id}/return`, { items }),
  recordWastage: (id: string, items: any[]) => call("POST", `/v1/dispense-orders/${id}/wastage`, { items }),
  reverseDispense: (id: string, reason: string) => callWithAssurance("POST", `/v1/dispense-orders/${id}/reversal`, { reason }),

  // Reconciliation
  getPendingReconciliation: (facilityId?: string) => call("GET", `/v1/reconcile/stock/pending${facilityId ? `?facilityId=${facilityId}` : ""}`),
  resolveReconciliation: (recId: string, opsNotes?: string) => callWithAssurance("POST", `/v1/reconcile/stock/${recId}/resolve`, { ops_notes: opsNotes }),

  // Capabilities
  getCapabilities: (tenantId?: string, facilityId?: string) => {
    const sp = new URLSearchParams();
    if (tenantId) sp.set("tenant_id", tenantId);
    if (facilityId) sp.set("facility_id", facilityId);
    return call("GET", `/v1/capabilities/effective?${sp.toString()}`);
  },

  // Stock
  getStockPositions: (facilityId?: string, storeId?: string) => {
    const sp = new URLSearchParams();
    if (facilityId) sp.set("facilityId", facilityId);
    if (storeId) sp.set("storeId", storeId);
    return call("GET", `/v1/stock/positions?${sp.toString()}`);
  },
  getStockMovements: (facilityId?: string) => call("GET", `/v1/stock/movements${facilityId ? `?facilityId=${facilityId}` : ""}`),

  // Events
  getEvents: (entityId?: string) => call("GET", `/v1/events${entityId ? `?entity_id=${entityId}` : ""}`),

  // Internal hooks
  postMusheXCharge: (data: any) => call("POST", "/v1/internal/mushex/charge", data),
  postOrosStatus: (data: any) => call("POST", "/v1/internal/oros/status", data),
  postPctBlocker: (data: any) => call("POST", "/v1/internal/pct/blocker", data),
};
