/**
 * MUSHEX v1.1 — Typed SDK Client
 * National Payment Switch & Claims Switching Layer
 */

const MUSHEX_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mushex-v1`;

interface MushexHeaders {
  tenantId: string;
  actorId: string;
  actorType: string;
  correlationId?: string;
  facilityId?: string;
  deviceFingerprint?: string;
  purposeOfUse?: string;
  stepUp?: boolean;
}

function buildHeaders(h: MushexHeaders): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "X-Tenant-Id": h.tenantId,
    "X-Actor-Id": h.actorId,
    "X-Actor-Type": h.actorType,
    "X-Correlation-Id": h.correlationId || crypto.randomUUID(),
    ...(h.facilityId ? { "X-Facility-Id": h.facilityId } : {}),
    ...(h.deviceFingerprint ? { "X-Device-Fingerprint": h.deviceFingerprint } : {}),
    ...(h.purposeOfUse ? { "X-Purpose-Of-Use": h.purposeOfUse } : {}),
    ...(h.stepUp ? { "X-Step-Up": "TRUE" } : {}),
  };
}

async function mushexFetch(path: string, method: string, headers: MushexHeaders, body?: any) {
  const res = await fetch(`${MUSHEX_BASE}${path}`, {
    method,
    headers: buildHeaders(headers),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const mushexClient = {
  // Payment Intents
  createPaymentIntent: (h: MushexHeaders, body: {
    source_type: string; source_id: string; amount: number;
    currency?: string; facility_id?: string; metadata?: any; adapter_type?: string;
  }) => mushexFetch("/v1/payment-intents", "POST", h, body),

  getPaymentIntent: (h: MushexHeaders, intentId: string) =>
    mushexFetch(`/v1/payment-intents/${intentId}`, "GET", h),

  cancelPaymentIntent: (h: MushexHeaders, intentId: string) =>
    mushexFetch(`/v1/payment-intents/${intentId}/cancel`, "POST", h),

  issueRemittanceSlip: (h: MushexHeaders, intentId: string) =>
    mushexFetch(`/v1/payment-intents/${intentId}/issue-remittance-slip`, "POST", h),

  claimRemittance: (h: MushexHeaders, body: { intent_id: string; token: string; otp: string }) =>
    mushexFetch("/v1/remittance/claim", "POST", h, body),

  refundPaymentIntent: (h: MushexHeaders, intentId: string, body: { amount: number; reason: string }) =>
    mushexFetch(`/v1/payment-intents/${intentId}/refund`, "POST", h, body),

  getReceipt: (h: MushexHeaders, intentId: string) =>
    mushexFetch(`/v1/receipts/${intentId}`, "GET", h),

  // Claims
  createClaim: (h: MushexHeaders, body: { bill_id: string; insurer_id: string; facility_id?: string; totals?: any; bill_pack_json?: any }) =>
    mushexFetch("/v1/claims", "POST", h, body),

  getClaim: (h: MushexHeaders, claimId: string) =>
    mushexFetch(`/v1/claims/${claimId}`, "GET", h),

  submitClaim: (h: MushexHeaders, claimId: string) =>
    mushexFetch(`/v1/claims/${claimId}/submit`, "POST", h),

  adjudicateClaim: (h: MushexHeaders, claimId: string, body: { decision: any; patient_residual: number; insurer_payable: number }) =>
    mushexFetch(`/v1/claims/${claimId}/adjudication`, "POST", h, body),

  disputeClaim: (h: MushexHeaders, claimId: string, body: { reason: string }) =>
    mushexFetch(`/v1/claims/${claimId}/dispute`, "POST", h, body),

  // Settlements
  runSettlement: (h: MushexHeaders, body: { period_start: string; period_end: string }) =>
    mushexFetch("/v1/settlements/run", "POST", h, body),

  getSettlement: (h: MushexHeaders, settlementId: string) =>
    mushexFetch(`/v1/settlements/${settlementId}`, "GET", h),

  releasePayouts: (h: MushexHeaders, settlementId: string) =>
    mushexFetch(`/v1/settlements/${settlementId}/release-payouts`, "POST", h),

  // Ops/Fraud
  getPendingReviews: (h: MushexHeaders) =>
    mushexFetch("/v1/ops/reviews/pending", "GET", h),

  approveReview: (h: MushexHeaders, reviewId: string, body: { approve: boolean; notes?: string }) =>
    mushexFetch(`/v1/ops/reviews/${reviewId}/approve`, "POST", h, body),

  getFraudFlags: (h: MushexHeaders) =>
    mushexFetch("/v1/fraud/flags", "GET", h),

  // Ledger
  getLedgerBalance: (h: MushexHeaders) =>
    mushexFetch("/v1/ledger/balance", "GET", h),

  // Internal
  ingestEvent: (h: MushexHeaders, body: { event_type: string; entity_type?: string; entity_id?: string; payload?: any }) =>
    mushexFetch("/v1/internal/events/ingest", "POST", h, body),

  adapterWebhook: (h: MushexHeaders, adapterType: string, body: { intent_id: string; status: string; adapter_ref?: string }) =>
    mushexFetch(`/v1/adapters/${adapterType}/webhook`, "POST", h, body),
};

export type { MushexHeaders };
