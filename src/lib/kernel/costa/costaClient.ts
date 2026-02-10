/**
 * COSTA v1.1 — Typed SDK Client
 */
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/costa-v1`;

function tshepoHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "X-Tenant-Id": "demo-tenant",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Actor-Id": "demo-actor",
    "X-Actor-Type": "OPS",
    "X-Device-Fingerprint": "lovable-dev",
    "X-Purpose-Of-Use": "BILLING",
    "X-Facility-Id": "demo-facility",
  };
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${EDGE_URL}${path}`, {
    method,
    headers: tshepoHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function callWithStepUp(method: string, path: string, body?: unknown) {
  const headers = { ...tshepoHeaders(), "X-Step-Up": "TRUE" };
  const res = await fetch(`${EDGE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Public API ──
export const costaClient = {
  // Estimates
  createEstimate: (lines: any[], patientCpid?: string, exemptionInputs?: any) =>
    call("POST", "/v1/estimate", { lines, patient_cpid: patientCpid, exemption_inputs: exemptionInputs }),

  // Bills
  createDraftBill: (data: any) => call("POST", "/v1/bills/draft", data),
  getBill: (billId: string) => call("GET", `/v1/bills/${billId}`),
  listBills: (status?: string) => call("GET", `/v1/bills${status ? `?status=${status}` : ""}`),
  recomputeBill: (billId: string) => call("POST", `/v1/bills/${billId}/recompute`),
  submitForApproval: (billId: string) => call("POST", `/v1/bills/${billId}/submit-approval`),
  approveBill: (billId: string, note?: string) => callWithStepUp("POST", `/v1/bills/${billId}/approve`, { note }),
  finalizeBill: (billId: string) => call("POST", `/v1/bills/${billId}/finalize`),
  issueInvoice: (billId: string) => call("POST", `/v1/bills/${billId}/issue-invoice`),
  createPaymentIntent: (billId: string) => call("POST", `/v1/bills/${billId}/create-payment-intent`),
  requestRefund: (billId: string, amount: number, reason: string) =>
    call("POST", `/v1/bills/${billId}/refund`, { amount, reason }),

  // Tariffs
  listTariffs: () => call("GET", "/v1/tariffs"),
  importTariffs: (tariffs: any[]) => callWithStepUp("POST", "/v1/tariffs/import", { tariffs }),

  // Rulesets
  listRulesets: () => call("GET", "/v1/rulesets"),
  publishRuleset: (rulesetId: string) => callWithStepUp("POST", "/v1/rulesets/publish", { ruleset_id: rulesetId }),

  // Exemptions & Insurance
  listExemptions: () => call("GET", "/v1/exemptions"),
  listInsurancePlans: () => call("GET", "/v1/insurance-plans"),

  // Audit
  getBillAudit: (billId: string) => call("GET", `/v1/audit/bill/${billId}`),

  // Event ingestion
  ingestEvents: (events: any[]) => call("POST", "/v1/internal/events/ingest", { events }),

  // MUSHEX callbacks
  paymentStatus: (paymentIntentId: string, status: string) =>
    call("POST", "/v1/internal/mushex/payment-status", { payment_intent_id: paymentIntentId, status }),
  refundStatus: (costaRefundId: string, status: string, refundId?: string) =>
    call("POST", "/v1/internal/mushex/refund-status", { costa_refund_id: costaRefundId, status, refund_id: refundId }),
};
