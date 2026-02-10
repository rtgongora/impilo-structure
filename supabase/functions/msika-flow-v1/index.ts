/**
 * MSIKA Flow v1.1 — Commerce & Fulfillment Edge Function
 * 
 * Order lifecycle, cart validation, pricing, payments (MUSHEX stubs),
 * routing, pickup/claim, vendor management, ops reviews, refunds.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-correlation-id, x-device-fingerprint, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-session-assurance, idempotency-key, if-none-match",
};

interface Ctx {
  tenantId: string;
  correlationId: string;
  actorId: string;
  actorType: string;
  purposeOfUse: string;
  deviceFingerprint: string;
  facilityId?: string;
  workspaceId?: string;
  shiftId?: string;
  sessionAssurance?: string;
}

function ulid(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from({ length: 16 }, () => Math.random().toString(36)[2] || "0").join("");
  return (t + r).slice(0, 26).toUpperCase();
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function err(code: string, message: string, status: number, details: Record<string, unknown> = {}): Response {
  return json({ error: { code, message, details } }, status);
}

function stepUp(reason = "HIGH_RISK_ACTION"): Response {
  return json({ code: "STEP_UP_REQUIRED", next: { method: "OIDC_STEP_UP", reason } }, 403);
}

function extractCtx(req: Request): { ctx: Ctx | null; error: Response | null } {
  const missing: string[] = [];
  const h = (k: string) => req.headers.get(k);
  const tenantId = h("x-tenant-id");
  const correlationId = h("x-correlation-id");
  const actorId = h("x-actor-id");
  const actorType = h("x-actor-type");
  const purposeOfUse = h("x-purpose-of-use");
  const deviceFingerprint = h("x-device-fingerprint");
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!correlationId) missing.push("X-Correlation-Id");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");
  if (!purposeOfUse) missing.push("X-Purpose-Of-Use");
  if (!deviceFingerprint) missing.push("X-Device-Fingerprint");
  if (missing.length) return { ctx: null, error: err("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, { missing }) };
  return {
    ctx: {
      tenantId: tenantId!, correlationId: correlationId!, actorId: actorId!,
      actorType: actorType!, purposeOfUse: purposeOfUse!, deviceFingerprint: deviceFingerprint!,
      facilityId: h("x-facility-id") || undefined,
      workspaceId: h("x-workspace-id") || undefined,
      shiftId: h("x-shift-id") || undefined,
      sessionAssurance: h("x-session-assurance") || undefined,
    },
    error: null,
  };
}

function getDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "msika_flow" } }
  );
}

function getSecDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "msika_flow_sec" } }
  );
}

function getAuditDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "audit" } }
  );
}

function getOutboxDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "outbox" } }
  );
}

async function writeAudit(ctx: Ctx, action: string, entityType: string, entityId: string, details: unknown = {}) {
  const db = getAuditDb();
  await (db as any).from("audit_log").insert({
    id: crypto.randomUUID(),
    tenant_id: ctx.tenantId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse,
    correlation_id: ctx.correlationId,
    details,
  });
}

async function emitEvent(ctx: Ctx, eventType: string, entityType: string, entityId: string, payload: unknown = {}) {
  const db = getOutboxDb();
  await (db as any).from("events").insert({
    id: ulid(),
    tenant_id: ctx.tenantId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    correlation_id: ctx.correlationId,
  });
}

async function writeEvent(db: any, orderId: string, fromState: string | null, toState: string, ctx: Ctx, reasonCode?: string, note?: string) {
  await db.from("order_events").insert({
    id: ulid(), order_id: orderId, from_state: fromState, to_state: toState,
    actor_id: ctx.actorId, actor_type: ctx.actorType, reason_code: reasonCode, note,
  });
}

// Valid state transitions
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ["VALIDATED", "CANCELLED"],
  VALIDATED: ["PRICED", "CANCELLED"],
  PRICED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "FAILED", "CANCELLED"],
  PAID: ["ROUTED", "CANCELLED", "REFUND_PENDING"],
  ROUTED: ["ACCEPTED", "FAILED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "BOOKED", "CANCELLED"],
  READY_FOR_PICKUP: ["COLLECTED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  BOOKED: ["ATTENDED", "CANCELLED"],
  COLLECTED: ["COMPLETED"],
  DELIVERED: ["COMPLETED"],
  ATTENDED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUND_PENDING: ["REFUNDED", "FAILED"],
  REFUNDED: [],
  FAILED: [],
};

function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] || []).includes(to);
}

async function transitionOrder(db: any, orderId: string, toState: string, ctx: Ctx, reason?: string, note?: string): Promise<Response | null> {
  const { data: order, error: fetchErr } = await db.from("orders").select("*").eq("order_id", orderId).single();
  if (fetchErr || !order) return err("NOT_FOUND", "Order not found", 404);
  if (!canTransition(order.status, toState)) {
    return err("INVALID_TRANSITION", `Cannot transition from ${order.status} to ${toState}`, 409, { current: order.status, target: toState });
  }
  const { error: updateErr } = await db.from("orders").update({ status: toState, lock_version: order.lock_version + 1 }).eq("order_id", orderId).eq("lock_version", order.lock_version);
  if (updateErr) return err("CONFLICT", "Optimistic lock conflict", 409);
  await writeEvent(db, orderId, order.status, toState, ctx, reason, note);
  await writeAudit(ctx, `order.${toState.toLowerCase()}`, "ORDER", orderId, { from: order.status, to: toState, reason });
  await emitEvent(ctx, `msika.flow.order.${toState.toLowerCase()}`, "ORDER", orderId, { from: order.status, to: toState });
  return null; // success
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, error: ctxErr } = extractCtx(req);
  if (!ctx) return ctxErr!;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/msika-flow-v1\/?/, "/").replace(/\/+/g, "/");
  const method = req.method;
  const db = getDb();

  try {
    // ========== CART VALIDATION ==========
    if (method === "POST" && path === "/v1/cart/validate") {
      const body = await req.json();
      const items = body.items || [];
      const results = items.map((item: any) => {
        const issues: string[] = [];
        const restrictions: Record<string, any> = {};
        // Stub restriction checks
        if (item.restrictions?.controlled_item?.enabled) {
          issues.push("CONTROLLED_ITEM_REQUIRES_STEP_UP");
          restrictions.controlled_item = item.restrictions.controlled_item;
        }
        if (item.restrictions?.prescription_required?.enabled) {
          issues.push("PRESCRIPTION_REQUIRED");
          restrictions.prescription_required = item.restrictions.prescription_required;
        }
        return { msika_core_code: item.msika_core_code, valid: issues.length === 0, issues, restrictions_snapshot: restrictions };
      });
      return json({ valid: results.every((r: any) => r.valid), items: results });
    }

    // ========== ORDERS CRUD ==========
    if (method === "POST" && path === "/v1/orders") {
      const body = await req.json();
      const orderId = ulid();
      const { error: insertErr } = await db.from("orders").insert({
        order_id: orderId,
        tenant_id: ctx.tenantId,
        actor_id: ctx.actorId,
        actor_type: ctx.actorType,
        patient_cpid: body.patient_cpid || null,
        type: body.type || "OTC_PRODUCT_ORDER",
        status: "CREATED",
        facility_id: body.facility_id || ctx.facilityId || null,
        vendor_id: body.vendor_id || null,
        currency: body.currency || "ZAR",
      });
      if (insertErr) return err("DB_ERROR", insertErr.message, 500);

      // Insert lines
      const lines = (body.lines || []).map((line: any) => ({
        line_id: ulid(),
        order_id: orderId,
        msika_core_code: line.msika_core_code,
        kind: line.kind || "PRODUCT",
        qty: line.qty || 1,
        fulfillment_mode: line.fulfillment_mode || "PHARMACY_PICKUP",
        restrictions: line.restrictions || null,
        substitution_policy: line.substitution_policy || null,
        metadata: line.metadata || null,
      }));
      if (lines.length > 0) {
        await db.from("order_lines").insert(lines);
      }
      await writeEvent(db, orderId, null, "CREATED", ctx);
      await writeAudit(ctx, "order.created", "ORDER", orderId, { type: body.type, line_count: lines.length });
      await emitEvent(ctx, "msika.flow.order.created", "ORDER", orderId, { type: body.type });
      return json({ order_id: orderId, status: "CREATED", lines: lines.map((l: any) => l.line_id) }, 201);
    }

    if (method === "GET" && path.match(/^\/v1\/orders\/[^/]+$/)) {
      const orderId = path.split("/").pop()!;
      const { data: order } = await db.from("orders").select("*").eq("order_id", orderId).single();
      if (!order) return err("NOT_FOUND", "Order not found", 404);
      const { data: lines } = await db.from("order_lines").select("*").eq("order_id", orderId);
      const { data: events } = await db.from("order_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      return json({ ...order, lines: lines || [], events: events || [] });
    }

    // List orders
    if (method === "GET" && path === "/v1/orders") {
      let query = db.from("orders").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(50);
      const status = url.searchParams.get("status");
      const vendorId = url.searchParams.get("vendor_id");
      const patientCpid = url.searchParams.get("patient_cpid");
      if (status) query = query.eq("status", status);
      if (vendorId) query = query.eq("vendor_id", vendorId);
      if (patientCpid) query = query.eq("patient_cpid", patientCpid);
      const { data } = await query;
      return json({ orders: data || [] });
    }

    // Cancel order
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/cancel$/)) {
      const orderId = path.split("/")[3];
      const body = await req.json().catch(() => ({}));
      const result = await transitionOrder(db, orderId, "CANCELLED", ctx, body.reason_code, body.note);
      if (result) return result;
      return json({ order_id: orderId, status: "CANCELLED" });
    }

    // ========== PRICING ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/price$/)) {
      const orderId = path.split("/")[3];
      const { data: order } = await db.from("orders").select("*").eq("order_id", orderId).single();
      if (!order) return err("NOT_FOUND", "Order not found", 404);
      if (order.status !== "CREATED" && order.status !== "VALIDATED") {
        return err("INVALID_STATE", `Cannot price order in ${order.status}`, 409);
      }
      const { data: lines } = await db.from("order_lines").select("*").eq("order_id", orderId);
      // Stub pricing: assign random prices
      let total = 0;
      for (const line of (lines || [])) {
        const unitPrice = Math.round((10 + Math.random() * 490) * 100) / 100;
        const lineTotal = Math.round(unitPrice * (line.qty || 1) * 100) / 100;
        total += lineTotal;
        await db.from("order_lines").update({ unit_price: unitPrice, line_total: lineTotal }).eq("line_id", line.line_id);
      }
      const priceSnapshot = { lines: (lines || []).length, total, priced_at: new Date().toISOString() };
      // Transition through VALIDATED->PRICED->PAYMENT_PENDING
      if (order.status === "CREATED") {
        await db.from("orders").update({ status: "VALIDATED", lock_version: order.lock_version + 1 }).eq("order_id", orderId);
        await writeEvent(db, orderId, "CREATED", "VALIDATED", ctx);
      }
      const { data: updated } = await db.from("orders").select("*").eq("order_id", orderId).single();
      await db.from("orders").update({
        status: "PAYMENT_PENDING", amount_total: total, price_snapshot: priceSnapshot,
        lock_version: (updated?.lock_version || 0) + 1,
      }).eq("order_id", orderId);
      await writeEvent(db, orderId, "VALIDATED", "PRICED", ctx);
      await writeEvent(db, orderId, "PRICED", "PAYMENT_PENDING", ctx);
      await writeAudit(ctx, "order.priced", "ORDER", orderId, { total });
      return json({ order_id: orderId, status: "PAYMENT_PENDING", amount_total: total, price_snapshot: priceSnapshot });
    }

    // ========== PAYMENT (MUSHEX stub) ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/pay$/)) {
      const orderId = path.split("/")[3];
      const { data: order } = await db.from("orders").select("*").eq("order_id", orderId).single();
      if (!order) return err("NOT_FOUND", "Order not found", 404);
      if (order.status !== "PAYMENT_PENDING") return err("INVALID_STATE", `Cannot pay in ${order.status}`, 409);
      const intentId = `mushex_pi_${ulid()}`;
      await db.from("settlements").insert({
        id: ulid(), order_id: orderId, mushex_payment_intent_id: intentId, status: "CREATED",
      });
      // Auto-complete payment (stub)
      await db.from("settlements").update({ status: "PAID" }).eq("mushex_payment_intent_id", intentId);
      await db.from("orders").update({ status: "PAID", lock_version: order.lock_version + 1 }).eq("order_id", orderId);
      await writeEvent(db, orderId, "PAYMENT_PENDING", "PAID", ctx);
      await writeAudit(ctx, "order.paid", "ORDER", orderId, { intent_id: intentId, amount: order.amount_total });
      await emitEvent(ctx, "msika.flow.order.paid", "ORDER", orderId, { intent_id: intentId });
      return json({ order_id: orderId, status: "PAID", mushex_payment_intent_id: intentId });
    }

    // ========== ROUTING ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/route$/)) {
      const orderId = path.split("/")[3];
      const body = await req.json().catch(() => ({}));
      const result = await transitionOrder(db, orderId, "ROUTED", ctx);
      if (result) return result;
      const routeId = ulid();
      await db.from("fulfillment_routes").insert({
        id: routeId, order_id: orderId, route_type: body.route_type || "PHARMACY_PICKUP",
        target_ref: body.target_ref || {}, status: "ROUTED",
      });
      // Create reservations for lines
      const { data: lines } = await db.from("order_lines").select("*").eq("order_id", orderId);
      for (const line of (lines || [])) {
        await db.from("reservations").insert({
          id: ulid(), order_id: orderId, line_id: line.line_id,
          system: "INVENTORY", status: "RESERVED",
          expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        });
      }
      return json({ order_id: orderId, status: "ROUTED", route_id: routeId });
    }

    // ========== VENDOR ACCEPT ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/accept$/)) {
      const orderId = path.split("/")[3];
      const result = await transitionOrder(db, orderId, "ACCEPTED", ctx);
      if (result) return result;
      // Auto-transition to IN_PROGRESS
      await transitionOrder(db, orderId, "IN_PROGRESS", ctx);
      return json({ order_id: orderId, status: "IN_PROGRESS" });
    }

    // ========== MARK READY ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/mark-ready$/)) {
      const orderId = path.split("/")[3];
      const body = await req.json().catch(() => ({}));
      const target = body.mode === "DELIVERY" ? "OUT_FOR_DELIVERY" : body.mode === "BOOKING" ? "BOOKED" : "READY_FOR_PICKUP";
      const result = await transitionOrder(db, orderId, target, ctx);
      if (result) return result;
      return json({ order_id: orderId, status: target });
    }

    // ========== MARK DELIVERED ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/mark-delivered$/)) {
      const orderId = path.split("/")[3];
      let result = await transitionOrder(db, orderId, "DELIVERED", ctx);
      if (result) return result;
      result = await transitionOrder(db, orderId, "COMPLETED", ctx);
      if (result) return result;
      return json({ order_id: orderId, status: "COMPLETED" });
    }

    // ========== ORDER TRACKING ==========
    if (method === "GET" && path.match(/^\/v1\/orders\/[^/]+\/tracking$/)) {
      const orderId = path.split("/")[3];
      const { data: events } = await db.from("order_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      const { data: routes } = await db.from("fulfillment_routes").select("*").eq("order_id", orderId);
      return json({ order_id: orderId, events: events || [], routes: routes || [] });
    }

    // ========== PICKUP TOKEN ISSUE ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/pickup\/issue$/)) {
      const orderId = path.split("/")[3];
      const { data: order } = await db.from("orders").select("*").eq("order_id", orderId).single();
      if (!order) return err("NOT_FOUND", "Order not found", 404);
      if (order.status !== "READY_FOR_PICKUP") return err("INVALID_STATE", "Order not ready for pickup", 409);
      // Check step-up for delegated/controlled
      const body = await req.json().catch(() => ({}));
      if (body.delegated && ctx.sessionAssurance !== "HIGH") return stepUp("DELEGATED_PICKUP");

      const token = crypto.randomUUID();
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      // Hash using SubtleCrypto
      const enc = new TextEncoder();
      const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(token)))).map(b => b.toString(16).padStart(2, "0")).join("");
      const otpHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(otp)))).map(b => b.toString(16).padStart(2, "0")).join("");

      const secDb = getSecDb();
      await (secDb as any).from("pickup_tokens").insert({
        id: ulid(), order_id: orderId, token_hash: tokenHash, otp_hash: otpHash,
        expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), status: "ISSUED",
      });
      await writeAudit(ctx, "pickup.issued", "ORDER", orderId, { delegated: !!body.delegated });
      await emitEvent(ctx, "msika.flow.pickup.issued", "ORDER", orderId, {});
      return json({ order_id: orderId, otp, pickup_url: `/pickup/${token}`, qr_payload: token });
    }

    // ========== PICKUP CLAIM ==========
    if (method === "POST" && path === "/v1/pickup/claim") {
      const body = await req.json();
      const { order_id, otp, token } = body;
      if (!order_id || (!otp && !token)) return err("INVALID_REQUEST", "order_id + otp or token required", 400);

      // Rate limit check
      const secDb = getSecDb();
      const rlKey = `pickup:${ctx.deviceFingerprint}`;
      const { data: rl } = await (secDb as any).from("rate_limits").select("*").eq("key", rlKey).single();
      if (rl?.locked_until && new Date(rl.locked_until) > new Date()) {
        return err("RATE_LIMITED", "Too many attempts. Locked.", 429, { locked_until: rl.locked_until });
      }
      // Increment counter
      if (rl) {
        const newCount = rl.count + 1;
        if (newCount >= 5) {
          const lockedUntil = new Date(Date.now() + 300000).toISOString();
          await (secDb as any).from("rate_limits").update({ count: newCount, locked_until: lockedUntil }).eq("key", rlKey);
          return err("RATE_LIMITED", "Too many attempts. Locked for 5 minutes.", 429, { locked_until: lockedUntil });
        }
        await (secDb as any).from("rate_limits").update({ count: newCount }).eq("key", rlKey);
      } else {
        await (secDb as any).from("rate_limits").insert({ key: rlKey, count: 1, window_seconds: 300 });
      }

      // Verify token/OTP
      const enc = new TextEncoder();
      const hashInput = otp || token;
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(hashInput)))).map(b => b.toString(16).padStart(2, "0")).join("");
      const hashField = otp ? "otp_hash" : "token_hash";
      const { data: tkn } = await (secDb as any).from("pickup_tokens").select("*").eq("order_id", order_id).eq(hashField, hash).eq("status", "ISSUED").single();
      if (!tkn) return err("INVALID_TOKEN", "Invalid or expired token/OTP", 401);
      if (new Date(tkn.expires_at) < new Date()) {
        await (secDb as any).from("pickup_tokens").update({ status: "EXPIRED" }).eq("id", tkn.id);
        return err("TOKEN_EXPIRED", "Token has expired", 401);
      }
      // Claim
      await (secDb as any).from("pickup_tokens").update({
        status: "CLAIMED", claimed_by: ctx.actorId, claimed_actor_type: ctx.actorType,
        claimed_at: new Date().toISOString(), claim_meta: { device_fp: ctx.deviceFingerprint },
      }).eq("id", tkn.id);
      // Reset rate limit
      await (secDb as any).from("rate_limits").delete().eq("key", rlKey);
      // Transition order
      const result1 = await transitionOrder(db, order_id, "COLLECTED", ctx);
      if (!result1) await transitionOrder(db, order_id, "COMPLETED", ctx);
      await writeAudit(ctx, "pickup.claimed", "ORDER", order_id, {});
      await emitEvent(ctx, "msika.flow.pickup.claimed", "ORDER", order_id, {});
      return json({ order_id, status: "COMPLETED", claimed: true });
    }

    // ========== RX TOKEN ATTACH ==========
    if (method === "POST" && path === "/v1/rx/attach-token") {
      const body = await req.json();
      const { order_id, token_ref } = body;
      if (!order_id || !token_ref) return err("INVALID_REQUEST", "order_id and token_ref required", 400);
      // Stub: validate token format
      if (typeof token_ref !== "string" || token_ref.length < 6) {
        return err("INVALID_TOKEN", "Invalid prescription token reference", 400);
      }
      await writeAudit(ctx, "rx.token_attached", "ORDER", order_id, { token_ref: token_ref.substring(0, 8) + "..." });
      return json({ order_id, rx_token_attached: true, validated: true });
    }

    // ========== RX SUBSTITUTION ==========
    if (method === "POST" && path.match(/^\/v1\/rx\/[^/]+\/substitution\/propose$/)) {
      const orderId = path.split("/")[3];
      const body = await req.json();
      await writeAudit(ctx, "rx.substitution.proposed", "ORDER", orderId, { proposed: body });
      return json({ order_id: orderId, substitution_id: ulid(), status: "PENDING_APPROVAL", proposal: body });
    }
    if (method === "POST" && path.match(/^\/v1\/rx\/[^/]+\/substitution\/approve$/)) {
      const orderId = path.split("/")[3];
      await writeAudit(ctx, "rx.substitution.approved", "ORDER", orderId, {});
      return json({ order_id: orderId, status: "APPROVED" });
    }

    // ========== SERVICE BOOKINGS ==========
    if (method === "POST" && path === "/v1/bookings/create") {
      const body = await req.json();
      const orderId = ulid();
      await db.from("orders").insert({
        order_id: orderId, tenant_id: ctx.tenantId, actor_id: ctx.actorId, actor_type: ctx.actorType,
        patient_cpid: body.patient_cpid, type: "SERVICE_BOOKING_ORDER", status: "BOOKED",
        facility_id: body.facility_id || ctx.facilityId,
      });
      await writeEvent(db, orderId, null, "BOOKED", ctx);
      await writeAudit(ctx, "booking.created", "ORDER", orderId, { service: body.service_code });
      return json({ order_id: orderId, status: "BOOKED", booking_id: ulid() }, 201);
    }
    if (method === "POST" && path.match(/^\/v1\/bookings\/[^/]+\/reschedule$/)) {
      const bookingId = path.split("/")[3];
      await writeAudit(ctx, "booking.rescheduled", "BOOKING", bookingId, {});
      return json({ booking_id: bookingId, status: "RESCHEDULED" });
    }
    if (method === "POST" && path.match(/^\/v1\/bookings\/[^/]+\/cancel$/)) {
      const bookingId = path.split("/")[3];
      await writeAudit(ctx, "booking.cancelled", "BOOKING", bookingId, {});
      return json({ booking_id: bookingId, status: "CANCELLED" });
    }

    // ========== VENDORS ==========
    if (method === "POST" && path === "/v1/vendors/apply") {
      const body = await req.json();
      const vendorId = ulid();
      await db.from("vendor_profiles").insert({
        vendor_id: vendorId, tenant_id: ctx.tenantId, type: body.type || "PHARMACY",
        name: body.name, status: "APPLIED", coverage: body.coverage, capabilities: body.capabilities,
      });
      await db.from("ops_reviews").insert({
        id: ulid(), entity_type: "VENDOR", entity_id: vendorId, status: "PENDING",
      });
      await writeAudit(ctx, "vendor.applied", "VENDOR", vendorId, { name: body.name });
      return json({ vendor_id: vendorId, status: "APPLIED" }, 201);
    }

    if (method === "GET" && path === "/v1/vendors") {
      const { data } = await db.from("vendor_profiles").select("*").eq("tenant_id", ctx.tenantId);
      return json({ vendors: data || [] });
    }

    if (method === "GET" && path.match(/^\/v1\/vendors\/[^/]+\/orders$/)) {
      const vendorId = path.split("/")[3];
      const { data } = await db.from("orders").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(50);
      return json({ orders: data || [] });
    }

    // ========== OPS REVIEWS ==========
    if (method === "GET" && path === "/v1/ops/reviews/pending") {
      const { data } = await db.from("ops_reviews").select("*").eq("status", "PENDING").order("created_at", { ascending: false });
      return json({ reviews: data || [] });
    }
    if (method === "POST" && path.match(/^\/v1\/ops\/reviews\/[^/]+\/approve$/)) {
      const reviewId = path.split("/")[4];
      await db.from("ops_reviews").update({ status: "APPROVED" }).eq("id", reviewId);
      await writeAudit(ctx, "ops.review.approved", "OPS_REVIEW", reviewId, {});
      return json({ review_id: reviewId, status: "APPROVED" });
    }
    if (method === "POST" && path.match(/^\/v1\/ops\/reviews\/[^/]+\/reject$/)) {
      const reviewId = path.split("/")[4];
      const body = await req.json().catch(() => ({}));
      await db.from("ops_reviews").update({ status: "REJECTED", notes: body.notes }).eq("id", reviewId);
      await writeAudit(ctx, "ops.review.rejected", "OPS_REVIEW", reviewId, { notes: body.notes });
      return json({ review_id: reviewId, status: "REJECTED" });
    }

    // ========== REFUNDS ==========
    if (method === "POST" && path.match(/^\/v1\/orders\/[^/]+\/refund\/request$/)) {
      const orderId = path.split("/")[3];
      const body = await req.json();
      if (body.amount > 1000 && ctx.sessionAssurance !== "HIGH") return stepUp("REFUND_ABOVE_THRESHOLD");
      const refundId = ulid();
      await db.from("refunds").insert({
        id: refundId, order_id: orderId, amount: body.amount, reason: body.reason || "Customer request", status: "REQUESTED",
      });
      await db.from("ops_reviews").insert({ id: ulid(), entity_type: "REFUND", entity_id: refundId, status: "PENDING" });
      const result = await transitionOrder(db, orderId, "REFUND_PENDING", ctx);
      if (result) return result;
      await writeAudit(ctx, "refund.requested", "ORDER", orderId, { amount: body.amount, refund_id: refundId });
      return json({ refund_id: refundId, status: "REQUESTED", order_status: "REFUND_PENDING" }, 201);
    }

    // ========== MUSHEX CALLBACKS (SYSTEM) ==========
    if (method === "POST" && path === "/v1/internal/mushex/payment-status") {
      const body = await req.json();
      const { mushex_payment_intent_id, status: payStatus } = body;
      await db.from("settlements").update({ status: payStatus }).eq("mushex_payment_intent_id", mushex_payment_intent_id);
      return json({ acknowledged: true });
    }
    if (method === "POST" && path === "/v1/internal/mushex/refund-status") {
      const body = await req.json();
      const { refund_id, status: rStatus } = body;
      await db.from("refunds").update({ status: rStatus, mushex_refund_id: body.mushex_refund_id }).eq("id", refund_id);
      return json({ acknowledged: true });
    }

    return err("NOT_FOUND", `Unknown route: ${method} ${path}`, 404);
  } catch (e) {
    console.error("MSIKA Flow error:", e);
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Internal error", 500);
  }
});
