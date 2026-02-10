/**
 * Inventory Service v1.1 — Typed SDK Client
 * Auto-injects TSHEPO headers for all requests.
 */

const INV_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inventory-v1`;

function tshepoHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "X-Tenant-Id": localStorage.getItem("oros_tenant_id") || "NATIONAL",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Actor-Id": localStorage.getItem("oros_actor_id") || "dev-actor",
    "X-Actor-Type": localStorage.getItem("oros_actor_type") || "PROVIDER",
    "X-Purpose-Of-Use": "OPERATIONS",
    "X-Device-Fingerprint": localStorage.getItem("device_fingerprint") || crypto.randomUUID(),
    ...(localStorage.getItem("oros_facility_id") ? { "X-Facility-Id": localStorage.getItem("oros_facility_id")! } : {}),
    ...(localStorage.getItem("oros_workspace_id") ? { "X-Workspace-Id": localStorage.getItem("oros_workspace_id")! } : {}),
  };
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${INV_BASE}${path}`, { method, headers: tshepoHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
  return res.json();
}

function callWithAssurance(method: string, path: string, body?: unknown) {
  const headers = tshepoHeaders();
  headers["X-Session-Assurance"] = "HIGH";
  return fetch(`${INV_BASE}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) }).then(r => r.json());
}

export const inventoryClient = {
  // Items
  importItems: (items: any[]) => callWithAssurance("POST", "/v1/items/import", { items }),
  lookupBarcode: (code: string) => call("GET", `/v1/items/lookup-by-barcode?code=${encodeURIComponent(code)}`),

  // On-hand
  getOnHand: (params: { facilityId?: string; storeId?: string; binId?: string; itemCode?: string }) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    return call("GET", `/v1/onhand?${sp.toString()}`);
  },

  // Ledger operations
  receipt: (body: any) => call("POST", "/v1/ledger/receipt", body),
  issue: (body: any) => call("POST", "/v1/ledger/issue", body),
  transfer: (body: any) => call("POST", "/v1/ledger/transfer", body),
  adjust: (body: any) => callWithAssurance("POST", "/v1/ledger/adjust", body),
  wastage: (body: any) => call("POST", "/v1/ledger/wastage", body),
  returnStock: (body: any) => call("POST", "/v1/ledger/return", body),

  // FEFO
  fefoSuggest: (body: any) => call("POST", "/v1/fefo/suggest", body),

  // Counts
  createCount: (body: any) => call("POST", "/v1/counts", body),
  addCountLines: (sessionId: string, lines: any[]) => call("POST", `/v1/counts/${sessionId}/lines`, { lines }),
  submitCount: (sessionId: string) => call("POST", `/v1/counts/${sessionId}/submit`),
  approveCount: (sessionId: string) => callWithAssurance("POST", `/v1/counts/${sessionId}/approve`),
  listCounts: () => call("GET", "/v1/counts"),

  // Requisitions
  createRequisition: (body: any) => call("POST", "/v1/requisitions", body),
  approveRequisition: (reqId: string) => call("POST", `/v1/requisitions/${reqId}/approve`),
  fulfillRequisition: (reqId: string) => call("POST", `/v1/requisitions/${reqId}/fulfill`),
  listRequisitions: () => call("GET", "/v1/requisitions"),

  // Handover
  startHandover: (body: any) => call("POST", "/v1/handover/start", body),
  signHandover: (handoverId: string) => call("POST", `/v1/handover/${handoverId}/sign`),
  listHandovers: (facilityId?: string) => call("GET", `/v1/handovers${facilityId ? `?facilityId=${facilityId}` : ""}`),

  // Reconciliation
  getPendingReconcile: () => call("GET", "/v1/reconcile/pending"),
  resolveReconcile: (recId: string, body?: any) => callWithAssurance("POST", `/v1/reconcile/${recId}/resolve`, body || {}),

  // Consumption posting
  postConsumption: (body: any) => call("POST", "/v1/internal/consumption/post", body),

  // Reference data
  getFacilities: () => call("GET", "/v1/facilities"),
  getStores: (facilityId?: string) => call("GET", `/v1/stores${facilityId ? `?facilityId=${facilityId}` : ""}`),
  getBins: (storeId: string) => call("GET", `/v1/bins?storeId=${storeId}`),

  // History
  getLedgerHistory: (params: { facilityId?: string; storeId?: string; itemCode?: string }) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    return call("GET", `/v1/ledger/history?${sp.toString()}`);
  },

  // Events
  getEvents: () => call("GET", "/v1/events"),
};
