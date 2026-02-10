// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ================================================================
   MUSHEX v1.1 — National Payment Switch & Claims Switching Layer
   Edge Function: mushex-v1
   ================================================================ */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-correlation-id, x-device-fingerprint, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-step-up, idempotency-key",
};

// ── Helpers ──────────────────────────────────────────────────────
function ulid(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 16);
  return (t + r).toUpperCase();
}

function json(body: unknown, status = 200, ctx?: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(ctx?.correlationId ? { "X-Correlation-ID": ctx.correlationId } : {}),
    },
  });
}

function err(code: string, message: string, status: number, ctx: any, details: any = {}): Response {
  return json({ error: { code, message, details, correlation_id: ctx.correlationId } }, status, ctx);
}

// ── TSHEPO Header Validation ────────────────────────────────────
interface TshepoCtx {
  tenantId: string;
  correlationId: string;
  deviceFingerprint: string;
  purposeOfUse: string;
  actorId: string;
  actorType: string;
  facilityId?: string;
  workspaceId?: string;
  stepUp: boolean;
}

function extractTshepo(req: Request): { ctx: TshepoCtx | null; error: Response | null } {
  const correlationId = req.headers.get("x-correlation-id") || ulid();
  const tenantId = req.headers.get("x-tenant-id");
  const deviceFingerprint = req.headers.get("x-device-fingerprint");
  const purposeOfUse = req.headers.get("x-purpose-of-use");
  const actorId = req.headers.get("x-actor-id");
  const actorType = req.headers.get("x-actor-type");

  const missing: string[] = [];
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");

  if (missing.length > 0) {
    return {
      ctx: null,
      error: json(
        { error: { code: "MISSING_REQUIRED_HEADER", message: `Missing: ${missing.join(", ")}`, correlation_id: correlationId } },
        400
      ),
    };
  }

  const validTypes = ["PATIENT", "PROVIDER", "FACILITY_FINANCE", "INSURER", "OPS", "SYSTEM"];
  if (!validTypes.includes(actorType!)) {
    return {
      ctx: null,
      error: json({ error: { code: "INVALID_ACTOR_TYPE", message: `Actor type must be one of: ${validTypes.join(", ")}`, correlation_id: correlationId } }, 400),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!,
      correlationId,
      deviceFingerprint: deviceFingerprint || "unknown",
      purposeOfUse: purposeOfUse || "PAYMENT",
      actorId: actorId!,
      actorType: actorType!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      stepUp: req.headers.get("x-step-up") === "TRUE",
    },
    error: null,
  };
}

function requireStepUp(ctx: TshepoCtx): Response | null {
  if (ctx.stepUp) return null;
  return json(
    { code: "STEP_UP_REQUIRED", next: { method: "OIDC_STEP_UP", reason: "HIGH_RISK_ACTION" } },
    403,
    ctx
  );
}

function requireActorType(ctx: TshepoCtx, ...types: string[]): Response | null {
  if (types.includes(ctx.actorType)) return null;
  return err("FORBIDDEN", `Actor type ${ctx.actorType} not authorized`, 403, ctx);
}

// ── DB Client ───────────────────────────────────────────────────
function getDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "mushex" } }
  );
}

function getSecDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "mushex_sec" } }
  );
}

function getOutboxDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "outbox" } }
  );
}

function getAuditDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "audit" } }
  );
}

// ── Outbox + Audit helpers ──────────────────────────────────────
async function emitEvent(ctx: TshepoCtx, eventType: string, entityType: string, entityId: string, payload: any) {
  const db = getOutboxDb();
  await db.from("events").insert({
    id: ulid(),
    tenant_id: ctx.tenantId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    correlation_id: ctx.correlationId,
  });
}

async function auditLog(ctx: TshepoCtx, action: string, entityType: string, entityId: string, before: any = null, after: any = null) {
  const db = getAuditDb();
  await db.from("mushex_log").insert({
    id: ulid(),
    tenant_id: ctx.tenantId,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_state: before,
    after_state: after,
    correlation_id: ctx.correlationId,
  });
}

// ── Ledger Posting ──────────────────────────────────────────────
async function postJournal(ctx: TshepoCtx, refType: string, refId: string, debit: string, credit: string, amount: number, intentId?: string) {
  const db = getDb();
  await db.from("ledger_entries").insert({
    entry_id: ulid(),
    tenant_id: ctx.tenantId,
    intent_id: intentId || null,
    reference_type: refType,
    reference_id: refId,
    debit_account: debit,
    credit_account: credit,
    amount,
    currency: "ZAR",
  });
}

// ── Fraud Detection ─────────────────────────────────────────────
async function checkFraud(ctx: TshepoCtx, intentId: string, amount: number, sourceType: string, sourceId: string) {
  const db = getDb();
  // Check for duplicate payment (same source within 5 min)
  const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
  const { data: dupes } = await db
    .from("payment_intents")
    .select("intent_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("source_id", sourceId)
    .eq("source_type", sourceType)
    .gte("created_at", fiveMinAgo)
    .neq("intent_id", intentId);

  if (dupes && dupes.length > 0) {
    await db.from("fraud_flags").insert({
      id: ulid(),
      tenant_id: ctx.tenantId,
      kind: "DUPLICATE_PAYMENT",
      severity: "HIGH",
      entity_type: "payment_intent",
      entity_id: intentId,
      evidence: { duplicate_intents: dupes.map((d: any) => d.intent_id), source_id: sourceId, amount },
    });
    await db.from("ops_reviews").insert({
      id: ulid(),
      tenant_id: ctx.tenantId,
      queue_type: "FRAUD",
      entity_type: "fraud_flag",
      entity_id: intentId,
    });
  }
}

// ── Adapter Framework ───────────────────────────────────────────
function sandboxAdapter() {
  return {
    processPayment: async (_attempt: any) => ({
      adapter_ref: `SANDBOX-${ulid()}`,
      status: "PAID" as const,
      raw_summary: { simulator: true, paid_at: new Date().toISOString() },
    }),
    processRefund: async (_refund: any) => ({
      adapter_ref: `SANDBOX-REF-${ulid()}`,
      status: "COMPLETED" as const,
    }),
    verifyWebhook: (_body: string, _sig: string) => true,
  };
}

function mobileMoneyAdapter() {
  return {
    processPayment: async (_attempt: any) => ({
      adapter_ref: `MOMO-${ulid()}`,
      status: "PENDING" as const,
      raw_summary: { provider: "mobile_money", initiated_at: new Date().toISOString() },
    }),
    processRefund: async (_refund: any) => ({
      adapter_ref: `MOMO-REF-${ulid()}`,
      status: "PENDING" as const,
    }),
    verifyWebhook: (_body: string, _sig: string) => true,
  };
}

function bankTransferAdapter() {
  return {
    processPayment: async (_attempt: any) => ({
      adapter_ref: `BANK-${ulid()}`,
      status: "PENDING" as const,
      raw_summary: { provider: "bank_transfer", initiated_at: new Date().toISOString() },
    }),
    processRefund: async (_refund: any) => ({
      adapter_ref: `BANK-REF-${ulid()}`,
      status: "PENDING" as const,
    }),
    verifyWebhook: (_body: string, _sig: string) => true,
  };
}

function cardAdapter() {
  return {
    processPayment: async (_attempt: any) => ({
      adapter_ref: `CARD-${ulid()}`,
      status: "PENDING" as const,
      raw_summary: { provider: "card_gateway", initiated_at: new Date().toISOString() },
    }),
    processRefund: async (_refund: any) => ({
      adapter_ref: `CARD-REF-${ulid()}`,
      status: "PENDING" as const,
    }),
    verifyWebhook: (_body: string, _sig: string) => true,
  };
}

function getAdapter(type: string) {
  switch (type) {
    case "SANDBOX": return sandboxAdapter();
    case "MOBILE_MONEY": return mobileMoneyAdapter();
    case "BANK_TRANSFER": return bankTransferAdapter();
    case "CARD": return cardAdapter();
    default: return sandboxAdapter();
  }
}

// ── Crypto Helpers (token hashing) ──────────────────────────────
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Rate Limiting ───────────────────────────────────────────────
async function checkRateLimit(key: string, maxCount: number, windowSec: number): Promise<{ allowed: boolean; locked: boolean }> {
  const db = getSecDb();
  const { data: existing } = await db.from("rate_limits").select("*").eq("key", key).single();

  if (existing) {
    if (existing.locked_until && new Date(existing.locked_until) > new Date()) {
      return { allowed: false, locked: true };
    }
    const windowStart = new Date(Date.now() - windowSec * 1000);
    if (new Date(existing.updated_at) < windowStart) {
      await db.from("rate_limits").update({ count: 1, locked_until: null, updated_at: new Date().toISOString() }).eq("key", key);
      return { allowed: true, locked: false };
    }
    if (existing.count >= maxCount) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await db.from("rate_limits").update({ locked_until: lockUntil, updated_at: new Date().toISOString() }).eq("key", key);
      return { allowed: false, locked: true };
    }
    await db.from("rate_limits").update({ count: existing.count + 1, updated_at: new Date().toISOString() }).eq("key", key);
    return { allowed: true, locked: false };
  }

  await db.from("rate_limits").insert({ key, window_seconds: windowSec, count: 1 });
  return { allowed: true, locked: false };
}

// ================================================================
//  ROUTE HANDLERS
// ================================================================

// POST /v1/payment-intents
async function createPaymentIntent(body: any, ctx: TshepoCtx): Promise<Response> {
  const { source_type, source_id, amount, currency, facility_id, metadata, adapter_type } = body;
  if (!source_type || !source_id || !amount) {
    return err("VALIDATION_ERROR", "source_type, source_id, amount required", 400, ctx);
  }

  const db = getDb();
  const intentId = ulid();

  await db.from("payment_intents").insert({
    intent_id: intentId,
    tenant_id: ctx.tenantId,
    facility_id: facility_id || ctx.facilityId,
    source_type,
    source_id,
    currency: currency || "ZAR",
    amount_total: amount,
    status: "CREATED",
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    metadata: metadata || {},
  });

  await checkFraud(ctx, intentId, amount, source_type, source_id);

  // If adapter specified, create attempt and process immediately
  if (adapter_type) {
    const adapter = getAdapter(adapter_type);
    const attemptId = ulid();
    const result = await adapter.processPayment({ intent_id: intentId, amount, currency: currency || "ZAR" });

    await db.from("payment_attempts").insert({
      id: attemptId,
      intent_id: intentId,
      adapter_type,
      adapter_ref: result.adapter_ref,
      status: result.status,
      completed_at: result.status === "PAID" ? new Date().toISOString() : null,
      raw_summary: result.raw_summary,
    });

    const newStatus = result.status === "PAID" ? "PAID" : "PENDING";
    const amountPaid = result.status === "PAID" ? amount : 0;

    await db.from("payment_intents").update({
      status: newStatus,
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    }).eq("intent_id", intentId);

    if (result.status === "PAID") {
      await postJournal(ctx, "PAYMENT", intentId, "PATIENT_CASH", "FACILITY_REVENUE", amount, intentId);
      // Issue receipt
      const receiptId = ulid();
      await db.from("receipts").insert({
        receipt_id: receiptId,
        intent_id: intentId,
        landela_doc_id: `LDOC-${receiptId.slice(0, 8)}`,
        summary: { amount, currency: currency || "ZAR", source_type, source_id, paid_at: new Date().toISOString() },
      });
    }

    await emitEvent(ctx, "mushex.payment.intent.created", "payment_intent", intentId, { status: newStatus, amount });
    await auditLog(ctx, "payment_intent.created", "payment_intent", intentId, null, { status: newStatus, amount, adapter_type });

    return json({ intent_id: intentId, status: newStatus, amount_paid: amountPaid, adapter_ref: result.adapter_ref }, 201, ctx);
  }

  await emitEvent(ctx, "mushex.payment.intent.created", "payment_intent", intentId, { status: "CREATED", amount });
  await auditLog(ctx, "payment_intent.created", "payment_intent", intentId, null, { status: "CREATED", amount });

  return json({ intent_id: intentId, status: "CREATED", amount_total: amount }, 201, ctx);
}

// GET /v1/payment-intents/:id
async function getPaymentIntent(intentId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data, error: fetchErr } = await db.from("payment_intents").select("*").eq("intent_id", intentId).single();
  if (fetchErr || !data) return err("NOT_FOUND", "Intent not found", 404, ctx);
  // Fetch attempts
  const { data: attempts } = await db.from("payment_attempts").select("*").eq("intent_id", intentId);
  return json({ ...data, attempts: attempts || [] }, 200, ctx);
}

// POST /v1/payment-intents/:id/cancel
async function cancelIntent(intentId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intentId).single();
  if (!intent) return err("NOT_FOUND", "Intent not found", 404, ctx);
  if (!["CREATED", "PENDING"].includes(intent.status)) {
    return err("INVALID_STATE", `Cannot cancel intent in ${intent.status} status`, 409, ctx);
  }
  await db.from("payment_intents").update({ status: "CANCELLED", updated_at: new Date().toISOString() }).eq("intent_id", intentId);
  await emitEvent(ctx, "mushex.payment.status.changed", "payment_intent", intentId, { from: intent.status, to: "CANCELLED" });
  await auditLog(ctx, "payment_intent.cancelled", "payment_intent", intentId, { status: intent.status }, { status: "CANCELLED" });
  return json({ intent_id: intentId, status: "CANCELLED" }, 200, ctx);
}

// POST /v1/payment-intents/:id/issue-remittance-slip
async function issueRemittanceSlip(intentId: string, ctx: TshepoCtx): Promise<Response> {
  const rlKey = `remittance_issue:${ctx.tenantId}:${intentId}`;
  const { allowed, locked } = await checkRateLimit(rlKey, 5, 300);
  if (!allowed) return err("RATE_LIMITED", locked ? "Locked for 15 minutes" : "Too many requests", 429, ctx);

  const db = getDb();
  const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intentId).single();
  if (!intent) return err("NOT_FOUND", "Intent not found", 404, ctx);
  if (!["CREATED", "PENDING"].includes(intent.status)) {
    return err("INVALID_STATE", "Intent must be CREATED or PENDING", 409, ctx);
  }

  // Generate 128-bit token + 6-digit OTP
  const tokenBytes = crypto.getRandomValues(new Uint8Array(16));
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const tokenHash = await hashToken(token);
  const otpHash = await hashToken(otp);

  const remittanceId = ulid();
  await db.from("remittance_tokens").insert({
    id: remittanceId,
    intent_id: intentId,
    token_hash: tokenHash,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    status: "ISSUED",
  });

  await auditLog(ctx, "remittance.issued", "remittance_token", remittanceId, null, { intent_id: intentId });

  return json({
    remittance_id: remittanceId,
    token,
    otp,
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    qr_payload: JSON.stringify({ intent_id: intentId, token, expires: Date.now() + 30 * 60000 }),
  }, 201, ctx);
}

// POST /v1/remittance/claim
async function claimRemittance(body: any, ctx: TshepoCtx): Promise<Response> {
  const { intent_id, token, otp } = body;
  if (!intent_id || !token || !otp) return err("VALIDATION_ERROR", "intent_id, token, otp required", 400, ctx);

  const rlKey = `remittance_claim:${ctx.tenantId}:${intent_id}`;
  const { allowed, locked } = await checkRateLimit(rlKey, 5, 60);
  if (!allowed) return err("RATE_LIMITED", locked ? "Brute force protection: locked 15 min" : "Too many attempts", 429, ctx);

  const db = getDb();
  const tokenHash = await hashToken(token);
  const otpHash = await hashToken(otp);

  const { data: remittance } = await db
    .from("remittance_tokens")
    .select("*")
    .eq("intent_id", intent_id)
    .eq("token_hash", tokenHash)
    .eq("status", "ISSUED")
    .single();

  if (!remittance) return err("INVALID_TOKEN", "Token not found or expired", 401, ctx);
  if (new Date(remittance.expires_at) < new Date()) {
    await db.from("remittance_tokens").update({ status: "EXPIRED" }).eq("id", remittance.id);
    return err("TOKEN_EXPIRED", "Remittance token expired", 410, ctx);
  }
  if (remittance.otp_hash !== otpHash) return err("INVALID_OTP", "OTP does not match", 401, ctx);

  await db.from("remittance_tokens").update({
    status: "CLAIMED",
    claimed_at: new Date().toISOString(),
    claim_meta: { actor_id: ctx.actorId, device: ctx.deviceFingerprint, facility_id: ctx.facilityId },
  }).eq("id", remittance.id);

  // Process payment via sandbox
  const adapter = sandboxAdapter();
  const attemptId = ulid();
  const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intent_id).single();
  const result = await adapter.processPayment({ intent_id, amount: intent.amount_total });

  await db.from("payment_attempts").insert({
    id: attemptId,
    intent_id,
    adapter_type: "SANDBOX",
    adapter_ref: result.adapter_ref,
    status: "PAID",
    completed_at: new Date().toISOString(),
    raw_summary: result.raw_summary,
  });

  await db.from("payment_intents").update({
    status: "PAID",
    amount_paid: intent.amount_total,
    updated_at: new Date().toISOString(),
  }).eq("intent_id", intent_id);

  await postJournal(ctx, "PAYMENT", intent_id, "PATIENT_CASH", "FACILITY_REVENUE", intent.amount_total, intent_id);

  const receiptId = ulid();
  await db.from("receipts").insert({
    receipt_id: receiptId,
    intent_id,
    landela_doc_id: `LDOC-${receiptId.slice(0, 8)}`,
    summary: { amount: intent.amount_total, paid_via: "remittance", claimed_at: new Date().toISOString() },
  });

  await emitEvent(ctx, "mushex.payment.status.changed", "payment_intent", intent_id, { from: intent.status, to: "PAID" });
  await auditLog(ctx, "remittance.claimed", "remittance_token", remittance.id, { status: "ISSUED" }, { status: "CLAIMED" });

  return json({ intent_id, status: "PAID", receipt_id: receiptId }, 200, ctx);
}

// POST /v1/payment-intents/:id/refund
async function refundIntent(intentId: string, body: any, ctx: TshepoCtx): Promise<Response> {
  const { amount, reason } = body;
  if (!amount || !reason) return err("VALIDATION_ERROR", "amount, reason required", 400, ctx);

  if (amount > 1000) {
    const stepUpErr = requireStepUp(ctx);
    if (stepUpErr) return stepUpErr;
  }

  const db = getDb();
  const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intentId).single();
  if (!intent) return err("NOT_FOUND", "Intent not found", 404, ctx);
  if (intent.status !== "PAID") return err("INVALID_STATE", "Can only refund PAID intents", 409, ctx);
  if (amount > intent.amount_paid) return err("INVALID_AMOUNT", "Refund exceeds paid amount", 400, ctx);

  const refundId = ulid();
  const adapter = getAdapter("SANDBOX");
  const result = await adapter.processRefund({ refund_id: refundId, amount });

  await db.from("refunds").insert({
    refund_id: refundId,
    intent_id: intentId,
    amount,
    reason,
    status: "COMPLETED",
    adapter_ref: result.adapter_ref,
  });

  await db.from("payment_intents").update({
    status: "REFUNDED",
    amount_paid: intent.amount_paid - amount,
    updated_at: new Date().toISOString(),
  }).eq("intent_id", intentId);

  await postJournal(ctx, "REFUND", refundId, "REFUNDS_PAYABLE", "PATIENT_CASH", amount, intentId);

  // Fraud: check repeated refunds
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data: recentRefunds } = await db.from("refunds").select("refund_id").eq("intent_id", intentId).gte("created_at", oneHourAgo);
  if (recentRefunds && recentRefunds.length > 2) {
    await db.from("fraud_flags").insert({
      id: ulid(), tenant_id: ctx.tenantId, kind: "REPEATED_REFUNDS", severity: "MEDIUM",
      entity_type: "payment_intent", entity_id: intentId,
      evidence: { refund_count: recentRefunds.length, window: "1h" },
    });
    await db.from("ops_reviews").insert({
      id: ulid(), tenant_id: ctx.tenantId, queue_type: "FRAUD",
      entity_type: "fraud_flag", entity_id: intentId,
    });
  }

  await emitEvent(ctx, "mushex.refund.status.changed", "refund", refundId, { intent_id: intentId, amount, status: "COMPLETED" });
  await auditLog(ctx, "refund.completed", "refund", refundId, null, { amount, reason });

  return json({ refund_id: refundId, status: "COMPLETED", amount }, 200, ctx);
}

// GET /v1/receipts/:intentId
async function getReceipt(intentId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data } = await db.from("receipts").select("*").eq("intent_id", intentId).single();
  if (!data) return err("NOT_FOUND", "Receipt not found", 404, ctx);
  return json(data, 200, ctx);
}

// POST /v1/claims
async function createClaim(body: any, ctx: TshepoCtx): Promise<Response> {
  const { bill_id, insurer_id, facility_id, totals, bill_pack_json } = body;
  if (!bill_id || !insurer_id) return err("VALIDATION_ERROR", "bill_id, insurer_id required", 400, ctx);

  const db = getDb();
  const claimId = ulid();
  await db.from("claims").insert({
    claim_id: claimId,
    tenant_id: ctx.tenantId,
    facility_id: facility_id || ctx.facilityId || "unknown",
    bill_id,
    insurer_id,
    totals: totals || {},
    bill_pack_json: bill_pack_json || {},
  });

  await db.from("claim_events").insert({
    id: ulid(), claim_id: claimId, from_state: "NEW", to_state: "DRAFT", actor_id: ctx.actorId, reason: "Claim created",
  });

  await emitEvent(ctx, "mushex.claim.created", "claim", claimId, { bill_id, insurer_id });
  await auditLog(ctx, "claim.created", "claim", claimId, null, { bill_id, insurer_id });

  return json({ claim_id: claimId, status: "DRAFT" }, 201, ctx);
}

// GET /v1/claims/:id
async function getClaim(claimId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data } = await db.from("claims").select("*").eq("claim_id", claimId).single();
  if (!data) return err("NOT_FOUND", "Claim not found", 404, ctx);
  const { data: events } = await db.from("claim_events").select("*").eq("claim_id", claimId).order("created_at", { ascending: true });
  const { data: attachments } = await db.from("claim_attachments").select("*").eq("claim_id", claimId);
  const { data: adjudication } = await db.from("adjudications").select("*").eq("claim_id", claimId).single();
  return json({ ...data, events: events || [], attachments: attachments || [], adjudication: adjudication || null }, 200, ctx);
}

// POST /v1/claims/:id/submit
async function submitClaim(claimId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data: claim } = await db.from("claims").select("*").eq("claim_id", claimId).single();
  if (!claim) return err("NOT_FOUND", "Claim not found", 404, ctx);
  if (claim.status !== "DRAFT") return err("INVALID_STATE", "Claim must be DRAFT to submit", 409, ctx);

  await db.from("claims").update({ status: "SUBMITTED", submitted_at: new Date().toISOString() }).eq("claim_id", claimId);
  await db.from("claim_events").insert({
    id: ulid(), claim_id: claimId, from_state: "DRAFT", to_state: "SUBMITTED", actor_id: ctx.actorId,
  });

  await emitEvent(ctx, "mushex.claim.submitted", "claim", claimId, { insurer_id: claim.insurer_id });
  await auditLog(ctx, "claim.submitted", "claim", claimId, { status: "DRAFT" }, { status: "SUBMITTED" });

  return json({ claim_id: claimId, status: "SUBMITTED" }, 200, ctx);
}

// POST /v1/claims/:id/adjudication (internal)
async function adjudicateClaim(claimId: string, body: any, ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "SYSTEM", "OPS", "INSURER");
  if (typeErr) return typeErr;

  const { decision, patient_residual, insurer_payable } = body;
  const db = getDb();
  const { data: claim } = await db.from("claims").select("*").eq("claim_id", claimId).single();
  if (!claim) return err("NOT_FOUND", "Claim not found", 404, ctx);

  await db.from("adjudications").insert({
    id: ulid(), claim_id: claimId, decision: decision || {},
    patient_residual: patient_residual || 0, insurer_payable: insurer_payable || 0,
  });

  const newStatus = patient_residual > 0 ? "PARTIAL" : "ADJUDICATED";
  await db.from("claims").update({ status: newStatus, adjudicated_at: new Date().toISOString() }).eq("claim_id", claimId);
  await db.from("claim_events").insert({
    id: ulid(), claim_id: claimId, from_state: claim.status, to_state: newStatus, actor_id: ctx.actorId,
  });

  // If patient residual > 0, create payment intent for residual
  let residualIntentId: string | null = null;
  if (patient_residual > 0) {
    residualIntentId = ulid();
    await db.from("payment_intents").insert({
      intent_id: residualIntentId,
      tenant_id: ctx.tenantId,
      facility_id: claim.facility_id,
      source_type: "COSTA_BILL",
      source_id: claim.bill_id,
      amount_total: patient_residual,
      status: "CREATED",
      expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      metadata: { claim_id: claimId, type: "patient_residual" },
    });
  }

  // Ledger: insurer receivable
  if (insurer_payable > 0) {
    await postJournal(ctx, "CLAIM", claimId, "INSURER_RECEIVABLE", "FACILITY_REVENUE", insurer_payable);
  }

  await emitEvent(ctx, "mushex.claim.adjudicated", "claim", claimId, { decision, patient_residual, insurer_payable });
  await auditLog(ctx, "claim.adjudicated", "claim", claimId, { status: claim.status }, { status: newStatus, patient_residual, insurer_payable });

  return json({ claim_id: claimId, status: newStatus, patient_residual, insurer_payable, residual_intent_id: residualIntentId }, 200, ctx);
}

// POST /v1/claims/:id/dispute
async function disputeClaim(claimId: string, body: any, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data: claim } = await db.from("claims").select("*").eq("claim_id", claimId).single();
  if (!claim) return err("NOT_FOUND", "Claim not found", 404, ctx);

  await db.from("claims").update({ status: "RESUBMIT_PENDING" }).eq("claim_id", claimId);
  await db.from("claim_events").insert({
    id: ulid(), claim_id: claimId, from_state: claim.status, to_state: "RESUBMIT_PENDING",
    actor_id: ctx.actorId, reason: body.reason || "Dispute filed",
  });
  await db.from("ops_reviews").insert({
    id: ulid(), tenant_id: ctx.tenantId, queue_type: "CLAIMS_DISPUTE",
    entity_type: "claim", entity_id: claimId, notes: body.reason,
  });

  return json({ claim_id: claimId, status: "RESUBMIT_PENDING" }, 200, ctx);
}

// POST /v1/settlements/run
async function runSettlement(body: any, ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "SYSTEM", "OPS", "FACILITY_FINANCE");
  if (typeErr) return typeErr;

  const { period_start, period_end } = body;
  const db = getDb();

  // Aggregate PAID intents in period
  const { data: intents } = await db
    .from("payment_intents")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "PAID")
    .gte("created_at", period_start)
    .lte("created_at", period_end);

  const totalPaid = (intents || []).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);

  // Subtract refunds
  const intentIds = (intents || []).map((i: any) => i.intent_id);
  let totalRefunds = 0;
  if (intentIds.length > 0) {
    const { data: refunds } = await db.from("refunds").select("amount").in("intent_id", intentIds).eq("status", "COMPLETED");
    totalRefunds = (refunds || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  }

  const platformFee = (totalPaid - totalRefunds) * 0.02;
  const netPayable = totalPaid - totalRefunds - platformFee;

  const settlementId = ulid();
  await db.from("settlements").insert({
    settlement_id: settlementId,
    tenant_id: ctx.tenantId,
    period_start,
    period_end,
    status: "READY",
    totals: { total_paid: totalPaid, total_refunds: totalRefunds, platform_fee: platformFee, net_payable: netPayable, intent_count: intentIds.length },
  });

  // Create payout batch
  const batchId = ulid();
  await db.from("payout_batches").insert({
    batch_id: batchId,
    settlement_id: settlementId,
    adapter_type: "SANDBOX",
    status: "DRAFT",
    destination_ref: { type: "facility", tenant_id: ctx.tenantId },
  });

  // Create payout items by facility
  const facilityTotals: Record<string, number> = {};
  for (const intent of intents || []) {
    const fid = intent.facility_id || "default";
    facilityTotals[fid] = (facilityTotals[fid] || 0) + Number(intent.amount_paid);
  }
  for (const [fid, total] of Object.entries(facilityTotals)) {
    const netFacility = total * (1 - 0.02);
    if (netFacility > 0) {
      await db.from("payout_items").insert({
        id: ulid(), batch_id: batchId, payee_type: "FACILITY", payee_ref: fid, amount: netFacility,
      });
    }
  }

  // Platform fee ledger
  if (platformFee > 0) {
    await postJournal(ctx, "SETTLEMENT", settlementId, "FACILITY_REVENUE", "PLATFORM_FEES", platformFee);
  }
  await postJournal(ctx, "SETTLEMENT", settlementId, "PATIENT_CASH", "SETTLEMENT_PAYABLE", netPayable);

  await emitEvent(ctx, "mushex.settlement.created", "settlement", settlementId, { net_payable: netPayable });
  await auditLog(ctx, "settlement.created", "settlement", settlementId, null, { totals: { totalPaid, totalRefunds, platformFee, netPayable } });

  return json({ settlement_id: settlementId, batch_id: batchId, totals: { total_paid: totalPaid, total_refunds: totalRefunds, platform_fee: platformFee, net_payable: netPayable } }, 201, ctx);
}

// GET /v1/settlements/:id
async function getSettlement(settlementId: string, ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data } = await db.from("settlements").select("*").eq("settlement_id", settlementId).single();
  if (!data) return err("NOT_FOUND", "Settlement not found", 404, ctx);
  const { data: batches } = await db.from("payout_batches").select("*").eq("settlement_id", settlementId);
  let items: any[] = [];
  if (batches && batches.length > 0) {
    const { data: payoutItems } = await db.from("payout_items").select("*").in("batch_id", batches.map((b: any) => b.batch_id));
    items = payoutItems || [];
  }
  return json({ ...data, batches: batches || [], payout_items: items }, 200, ctx);
}

// POST /v1/settlements/:id/release-payouts
async function releasePayouts(settlementId: string, ctx: TshepoCtx): Promise<Response> {
  const stepUpErr = requireStepUp(ctx);
  if (stepUpErr) return stepUpErr;

  const db = getDb();
  const { data: settlement } = await db.from("settlements").select("*").eq("settlement_id", settlementId).single();
  if (!settlement) return err("NOT_FOUND", "Settlement not found", 404, ctx);
  if (settlement.status !== "READY") return err("INVALID_STATE", "Settlement must be READY", 409, ctx);

  await db.from("settlements").update({ status: "RELEASED" }).eq("settlement_id", settlementId);
  await db.from("payout_batches").update({ status: "RELEASED", released_at: new Date().toISOString() }).eq("settlement_id", settlementId);

  // Mark items as paid (sandbox)
  const { data: batches } = await db.from("payout_batches").select("batch_id").eq("settlement_id", settlementId);
  if (batches) {
    for (const b of batches) {
      await db.from("payout_items").update({ status: "PAID" }).eq("batch_id", b.batch_id);
    }
  }

  await db.from("settlements").update({ status: "COMPLETED" }).eq("settlement_id", settlementId);
  await db.from("payout_batches").update({ status: "COMPLETED" }).eq("settlement_id", settlementId);

  // Reverse settlement payable
  await postJournal(ctx, "SETTLEMENT", settlementId, "SETTLEMENT_PAYABLE", "PATIENT_CASH", Number(settlement.totals?.net_payable || 0));

  await emitEvent(ctx, "mushex.settlement.batch.released", "settlement", settlementId, { status: "COMPLETED" });
  await auditLog(ctx, "settlement.released", "settlement", settlementId, { status: "READY" }, { status: "COMPLETED" });

  return json({ settlement_id: settlementId, status: "COMPLETED" }, 200, ctx);
}

// GET /v1/ops/reviews/pending
async function getPendingReviews(ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "OPS", "SYSTEM");
  if (typeErr) return typeErr;
  const db = getDb();
  const { data } = await db.from("ops_reviews").select("*").eq("tenant_id", ctx.tenantId).eq("status", "PENDING").order("created_at", { ascending: false }).limit(50);
  return json({ reviews: data || [] }, 200, ctx);
}

// POST /v1/ops/reviews/:id/approve
async function approveReview(reviewId: string, body: any, ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "OPS", "SYSTEM");
  if (typeErr) return typeErr;
  const db = getDb();
  await db.from("ops_reviews").update({ status: body.approve ? "APPROVED" : "REJECTED", assigned_to: ctx.actorId, notes: body.notes || null }).eq("id", reviewId);
  return json({ id: reviewId, status: body.approve ? "APPROVED" : "REJECTED" }, 200, ctx);
}

// GET /v1/fraud/flags
async function getFraudFlags(ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "OPS", "SYSTEM");
  if (typeErr) return typeErr;
  const db = getDb();
  const { data } = await db.from("fraud_flags").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(50);
  return json({ flags: data || [] }, 200, ctx);
}

// POST /v1/internal/events/ingest
async function ingestEvent(body: any, ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "SYSTEM");
  if (typeErr) return typeErr;

  const { event_type, entity_type, entity_id, payload } = body;
  if (!event_type) return err("VALIDATION_ERROR", "event_type required", 400, ctx);

  const db = getDb();

  // Handle specific event types
  if (event_type === "mushex.payment.status_changed") {
    const { intent_id, status, adapter_ref } = payload || {};
    if (intent_id && status) {
      const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intent_id).single();
      if (intent) {
        const updates: any = { status, updated_at: new Date().toISOString() };
        if (status === "PAID") updates.amount_paid = intent.amount_total;
        await db.from("payment_intents").update(updates).eq("intent_id", intent_id);

        if (status === "PAID") {
          await postJournal(ctx, "PAYMENT", intent_id, "PATIENT_CASH", "FACILITY_REVENUE", intent.amount_total, intent_id);
          const receiptId = ulid();
          await db.from("receipts").insert({
            receipt_id: receiptId, intent_id, landela_doc_id: `LDOC-${receiptId.slice(0, 8)}`,
            summary: { amount: intent.amount_total, event_driven: true },
          });
        }

        if (adapter_ref) {
          await db.from("payment_attempts").update({ status, completed_at: new Date().toISOString() }).eq("adapter_ref", adapter_ref);
        }
      }
    }
  }

  await emitEvent(ctx, event_type, entity_type || "unknown", entity_id || ulid(), payload || {});
  return json({ ingested: true, event_type }, 200, ctx);
}

// POST /v1/adapters/:type/webhook
async function adapterWebhook(adapterType: string, body: any, ctx: TshepoCtx): Promise<Response> {
  const typeErr = requireActorType(ctx, "SYSTEM");
  if (typeErr) return typeErr;

  const adapter = getAdapter(adapterType);
  // In production: verify signature from headers
  // adapter.verifyWebhook(rawBody, sig)

  const { intent_id, status, adapter_ref } = body;
  if (!intent_id) return err("VALIDATION_ERROR", "intent_id required", 400, ctx);

  const db = getDb();
  const { data: intent } = await db.from("payment_intents").select("*").eq("intent_id", intent_id).single();
  if (!intent) return err("NOT_FOUND", "Intent not found", 404, ctx);

  if (adapter_ref) {
    await db.from("payment_attempts").update({ status, completed_at: new Date().toISOString() }).eq("adapter_ref", adapter_ref);
  }

  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "PAID") updates.amount_paid = intent.amount_total;
  await db.from("payment_intents").update(updates).eq("intent_id", intent_id);

  if (status === "PAID") {
    await postJournal(ctx, "PAYMENT", intent_id, "PATIENT_CASH", "FACILITY_REVENUE", intent.amount_total, intent_id);
    const receiptId = ulid();
    await db.from("receipts").insert({
      receipt_id: receiptId, intent_id, landela_doc_id: `LDOC-${receiptId.slice(0, 8)}`,
      summary: { amount: intent.amount_total, webhook: true },
    });
  }

  await emitEvent(ctx, "mushex.payment.status.changed", "payment_intent", intent_id, { from: intent.status, to: status });

  return json({ intent_id, status }, 200, ctx);
}

// GET /v1/ledger/balance
async function getLedgerBalance(ctx: TshepoCtx): Promise<Response> {
  const db = getDb();
  const { data: entries } = await db.from("ledger_entries").select("*").eq("tenant_id", ctx.tenantId);
  const balances: Record<string, number> = {};
  for (const e of entries || []) {
    balances[e.debit_account] = (balances[e.debit_account] || 0) + Number(e.amount);
    balances[e.credit_account] = (balances[e.credit_account] || 0) - Number(e.amount);
  }
  return json({ balances, entry_count: (entries || []).length }, 200, ctx);
}

// ================================================================
//  ROUTER
// ================================================================

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/mushex-v1/, "");
  const method = req.method;

  // Extract TSHEPO context
  const { ctx, error: tshepoError } = extractTshepo(req);
  if (!ctx) return tshepoError!;

  try {
    // Payment Intents
    if (method === "POST" && path === "/v1/payment-intents") {
      return await createPaymentIntent(await req.json(), ctx);
    }
    if (method === "GET" && path.match(/^\/v1\/payment-intents\/([^/]+)$/)) {
      const id = path.match(/^\/v1\/payment-intents\/([^/]+)$/)![1];
      return await getPaymentIntent(id, ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/payment-intents\/([^/]+)\/cancel$/)) {
      const id = path.match(/^\/v1\/payment-intents\/([^/]+)\/cancel$/)![1];
      return await cancelIntent(id, ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/payment-intents\/([^/]+)\/issue-remittance-slip$/)) {
      const id = path.match(/^\/v1\/payment-intents\/([^/]+)\/issue-remittance-slip$/)![1];
      return await issueRemittanceSlip(id, ctx);
    }
    if (method === "POST" && path === "/v1/remittance/claim") {
      return await claimRemittance(await req.json(), ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/payment-intents\/([^/]+)\/refund$/)) {
      const id = path.match(/^\/v1\/payment-intents\/([^/]+)\/refund$/)![1];
      return await refundIntent(id, await req.json(), ctx);
    }
    if (method === "GET" && path.match(/^\/v1\/receipts\/([^/]+)$/)) {
      const id = path.match(/^\/v1\/receipts\/([^/]+)$/)![1];
      return await getReceipt(id, ctx);
    }

    // Claims
    if (method === "POST" && path === "/v1/claims") {
      return await createClaim(await req.json(), ctx);
    }
    if (method === "GET" && path.match(/^\/v1\/claims\/([^/]+)$/)) {
      const id = path.match(/^\/v1\/claims\/([^/]+)$/)![1];
      return await getClaim(id, ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/claims\/([^/]+)\/submit$/)) {
      const id = path.match(/^\/v1\/claims\/([^/]+)\/submit$/)![1];
      return await submitClaim(id, ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/claims\/([^/]+)\/adjudication$/)) {
      const id = path.match(/^\/v1\/claims\/([^/]+)\/adjudication$/)![1];
      return await adjudicateClaim(id, await req.json(), ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/claims\/([^/]+)\/dispute$/)) {
      const id = path.match(/^\/v1\/claims\/([^/]+)\/dispute$/)![1];
      return await disputeClaim(id, await req.json(), ctx);
    }

    // Settlements
    if (method === "POST" && path === "/v1/settlements/run") {
      return await runSettlement(await req.json(), ctx);
    }
    if (method === "GET" && path.match(/^\/v1\/settlements\/([^/]+)$/)) {
      const id = path.match(/^\/v1\/settlements\/([^/]+)$/)![1];
      return await getSettlement(id, ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/settlements\/([^/]+)\/release-payouts$/)) {
      const id = path.match(/^\/v1\/settlements\/([^/]+)\/release-payouts$/)![1];
      return await releasePayouts(id, ctx);
    }

    // Ops/Fraud
    if (method === "GET" && path === "/v1/ops/reviews/pending") {
      return await getPendingReviews(ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/ops\/reviews\/([^/]+)\/approve$/)) {
      const id = path.match(/^\/v1\/ops\/reviews\/([^/]+)\/approve$/)![1];
      return await approveReview(id, await req.json(), ctx);
    }
    if (method === "GET" && path === "/v1/fraud/flags") {
      return await getFraudFlags(ctx);
    }

    // Internal
    if (method === "POST" && path === "/v1/internal/events/ingest") {
      return await ingestEvent(await req.json(), ctx);
    }
    if (method === "POST" && path.match(/^\/v1\/adapters\/([^/]+)\/webhook$/)) {
      const type = path.match(/^\/v1\/adapters\/([^/]+)\/webhook$/)![1];
      return await adapterWebhook(type, await req.json(), ctx);
    }

    // Ledger
    if (method === "GET" && path === "/v1/ledger/balance") {
      return await getLedgerBalance(ctx);
    }

    return err("NOT_FOUND", `Route not found: ${method} ${path}`, 404, ctx);
  } catch (e) {
    console.error(`[${ctx.correlationId}] Error:`, e);
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Internal error", 500, ctx);
  }
});
