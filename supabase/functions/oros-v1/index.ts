import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ──
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, x-session-assurance, idempotency-key",
};

// ── TSHEPO Context ──
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

function extractCtx(req: Request): { ctx: Ctx | null; err: Response | null } {
  const h = (n: string) => req.headers.get(n);
  const tenantId = h("x-tenant-id");
  const correlationId = h("x-correlation-id");
  const actorId = h("x-actor-id");
  const actorType = h("x-actor-type");
  const purposeOfUse = h("x-purpose-of-use");
  const deviceFingerprint = h("x-device-fingerprint");

  const missing: string[] = [];
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!correlationId) missing.push("X-Correlation-Id");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");
  if (!purposeOfUse) missing.push("X-Purpose-Of-Use");
  if (!deviceFingerprint) missing.push("X-Device-Fingerprint");

  if (missing.length > 0) {
    return { ctx: null, err: jsonRes(400, { error: { code: "MISSING_REQUIRED_HEADER", message: `Missing: ${missing.join(", ")}`, details: { missing_headers: missing } } }) };
  }

  return {
    ctx: {
      tenantId: tenantId!, correlationId: correlationId!, actorId: actorId!,
      actorType: actorType!, purposeOfUse: purposeOfUse!, deviceFingerprint: deviceFingerprint!,
      facilityId: h("x-facility-id") || undefined,
      workspaceId: h("x-workspace-id") || undefined,
      shiftId: h("x-shift-id") || undefined,
      sessionAssurance: h("x-session-assurance") || undefined,
    },
    err: null,
  };
}

function jsonRes(status: number, body: unknown, ctx?: Ctx): Response {
  const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
  if (ctx) headers["X-Correlation-Id"] = ctx.correlationId;
  return new Response(JSON.stringify(body), { status, headers });
}

function stepUpRequired(ctx: Ctx, reason: string): Response {
  return jsonRes(403, { error: { code: "STEP_UP_REQUIRED", message: "Step-up authentication required", next: { method: "OIDC_STEP_UP", reason } } }, ctx);
}

function requireStepUp(ctx: Ctx, reason: string): Response | null {
  if (ctx.sessionAssurance && ctx.sessionAssurance.toUpperCase() === "HIGH") return null;
  return stepUpRequired(ctx, reason);
}

function getDb() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function generateULID(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(36)).join("").substring(0, 16);
  return (t + r).toUpperCase().substring(0, 26);
}

async function logEvent(db: any, ctx: Ctx, eventType: string, entityType: string, entityId: string, payload: unknown = {}) {
  await db.from("oros_event_log").insert({ tenant_id: ctx.tenantId, event_type: eventType, entity_type: entityType, entity_id: entityId, payload, correlation_id: ctx.correlationId });
}

// ── Default worksteps by order type ──
function defaultWorksteps(type: string): string[] {
  switch (type) {
    case "LAB": return ["ORDER_PLACED", "SPECIMEN_COLLECTION", "SPECIMEN_RECEIVED", "ANALYSIS", "REPORTING", "CLOSE_OUT"];
    case "IMAGING": return ["ORDER_PLACED", "IMAGING_ACQUISITION", "IMAGING_REPORTING", "CLOSE_OUT"];
    case "PHARMACY": return ["ORDER_PLACED", "DISPENSE", "ADMINISTER", "CLOSE_OUT"];
    default: return ["ORDER_PLACED", "CLOSE_OUT"];
  }
}

function routeTarget(type: string, caps: any): { target: string; adapter: string } {
  if (type === "LAB" && caps?.uses_external_lims) return { target: "LIMS", adapter: caps.adapter_preferences?.lims || "REST" };
  if (type === "IMAGING" && caps?.uses_external_pacs) return { target: "PACS", adapter: caps.adapter_preferences?.pacs || "REST" };
  if (type === "PHARMACY" && caps?.uses_external_pharmacy) return { target: "PHARMACY", adapter: caps.adapter_preferences?.pharmacy || "REST" };
  return { target: "INTERNAL", adapter: "NONE" };
}

// ── Router ──
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, err } = extractCtx(req);
  if (!ctx) return err!;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/oros-v1/, "");
  const method = req.method;
  const db = getDb();

  try {
    // ── Orders ──
    if (method === "POST" && path === "/v1/orders") return await placeOrder(db, req, ctx);
    if (method === "GET" && /^\/v1\/orders\/[^/]+$/.test(path)) return await getOrder(db, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/orders\/[^/]+\/cancel$/.test(path)) return await cancelOrder(db, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/orders\/[^/]+\/accept$/.test(path)) return await acceptOrder(db, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/orders\/[^/]+\/reject$/.test(path)) return await rejectOrder(db, req, path.split("/")[3], ctx);

    // ── Worklists ──
    if (method === "GET" && path === "/v1/worklists") return await getWorklists(db, url, ctx);

    // ── Worksteps ──
    if (method === "POST" && /^\/v1\/worksteps\/[^/]+\/start$/.test(path)) return await startWorkstep(db, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/worksteps\/[^/]+\/complete$/.test(path)) return await completeWorkstep(db, path.split("/")[3], ctx);

    // ── Results ──
    if (method === "POST" && /^\/v1\/orders\/[^/]+\/results$/.test(path) && !/mark-critical/.test(path)) return await postResult(db, req, path.split("/")[3], ctx);
    if (method === "GET" && /^\/v1\/orders\/[^/]+\/results$/.test(path)) return await getResults(db, path.split("/")[3], ctx);
    if (method === "POST" && /mark-critical$/.test(path)) {
      const parts = path.split("/");
      return await markCritical(db, parts[3], parts[5], ctx);
    }

    // ── Acknowledgements ──
    if (method === "POST" && /^\/v1\/orders\/[^/]+\/ack$/.test(path)) return await ackOrder(db, req, path.split("/")[3], ctx);

    // ── Routing ──
    if (method === "GET" && /^\/v1\/routes\/[^/]+$/.test(path)) return await getRoute(db, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/retry\/[^/]+$/.test(path)) return await retryRoute(db, path.split("/")[3], ctx);

    // ── Reconciliation ──
    if (method === "GET" && path === "/v1/reconcile/pending") return await getReconcilePending(db, url, ctx);
    if (method === "POST" && /^\/v1\/reconcile\/[^/]+\/match$/.test(path)) return await matchReconcile(db, req, path.split("/")[3], ctx);
    if (method === "POST" && /^\/v1\/reconcile\/[^/]+\/resolve$/.test(path)) return await resolveReconcile(db, path.split("/")[3], ctx);

    // ── Capabilities ──
    if (method === "GET" && path === "/v1/capabilities/effective") return await getCapabilities(db, url, ctx);
    if (method === "POST" && path === "/v1/capabilities") return await upsertCapabilities(db, req, ctx);

    // ── Writeback intents ──
    if (method === "POST" && path === "/v1/internal/butano/writeback") return await createWritebackIntent(db, req, ctx, "BUTANO");
    if (method === "POST" && path === "/v1/internal/pct/hook") return await createWritebackIntent(db, req, ctx, "PCT");
    if (method === "GET" && path === "/v1/writeback-intents") return await getWritebackIntents(db, url, ctx);

    // ── Event log ──
    if (method === "GET" && path === "/v1/events") return await getEvents(db, url, ctx);

    return jsonRes(404, { error: { code: "NOT_FOUND", message: `No route: ${method} ${path}` } }, ctx);
  } catch (e) {
    console.error(`[${ctx.correlationId}] Error:`, e);
    return jsonRes(500, { error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Internal error" } }, ctx);
  }
});

// ═══════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════

async function placeOrder(db: any, req: Request, ctx: Ctx) {
  const body = await req.json();
  const { facility_id, patient_cpid, type, priority, zibo_order_code, items } = body;
  if (!facility_id || !patient_cpid || !type) return jsonRes(400, { error: { code: "INVALID_REQUEST", message: "Missing facility_id, patient_cpid, or type" } }, ctx);

  const orderId = `ORD-${generateULID()}`;

  // Resolve capabilities for routing
  const { data: caps } = await db.from("cap_tenant_facility_capabilities").select("*").eq("tenant_id", ctx.tenantId).eq("facility_id", facility_id).maybeSingle();
  const hybridEnabled = caps?.hybrid_mode_enabled || false;
  const rt = routeTarget(type, caps);
  const routingMode = rt.target === "INTERNAL" ? "INTERNAL" : hybridEnabled ? "HYBRID" : "ADAPTER";

  // Insert order
  const { error: oErr } = await db.from("oros_orders").insert({
    order_id: orderId, tenant_id: ctx.tenantId, facility_id, patient_cpid,
    type, priority: priority || "ROUTINE", status: "PLACED",
    placed_at: new Date().toISOString(), placed_by_actor_id: ctx.actorId,
    zibo_order_code: zibo_order_code || null, routing_mode: routingMode,
  });
  if (oErr) return jsonRes(500, { error: { code: "DB_ERROR", message: oErr.message } }, ctx);

  // Insert items
  if (items?.length) {
    const rows = items.map((it: any) => ({ order_id: orderId, code: it.code, quantity: it.quantity || 1, instructions: it.instructions, specimen_type: it.specimen_type, body_site: it.body_site, metadata: it.metadata || {} }));
    await db.from("oros_order_items").insert(rows);
  }

  // Create worksteps
  const steps = defaultWorksteps(type);
  const stepRows = steps.map((st) => ({ order_id: orderId, step_type: st, status: st === "ORDER_PLACED" ? "DONE" : "PENDING" }));
  await db.from("oros_worksteps").insert(stepRows);

  // Create routing
  await db.from("oros_routing").insert({ order_id: orderId, route_target: rt.target, adapter_mode: rt.adapter, status: rt.target === "INTERNAL" ? "ACKED" : "PENDING" });

  // SLA timer
  await db.from("oros_sla_timers").insert({ order_id: orderId, stage: "PLACED" });

  // Writeback intents
  await db.from("oros_writeback_intents").insert([
    { order_id: orderId, target: "BUTANO", intent_type: "CREATE_SERVICEREQUEST", payload: { order_id: orderId, type, zibo_order_code } },
    { order_id: orderId, target: "PCT", intent_type: "PCT_EXPECTED_WORKSTEPS", payload: { order_id: orderId, steps } },
  ]);

  // Events
  await logEvent(db, ctx, "oros.order.placed", "order", orderId, { type, priority, facility_id, routing_mode: routingMode });
  await logEvent(db, ctx, "oros.order.routed", "order", orderId, { route_target: rt.target, adapter_mode: rt.adapter });

  return jsonRes(201, { order_id: orderId, status: "PLACED", routing_mode: routingMode, route_target: rt.target }, ctx);
}

async function getOrder(db: any, orderId: string, ctx: Ctx) {
  const { data: order } = await db.from("oros_orders").select("*").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);

  const [items, steps, results, route, acks] = await Promise.all([
    db.from("oros_order_items").select("*").eq("order_id", orderId),
    db.from("oros_worksteps").select("*").eq("order_id", orderId),
    db.from("oros_results").select("*").eq("order_id", orderId),
    db.from("oros_routing").select("*").eq("order_id", orderId).maybeSingle(),
    db.from("oros_acknowledgements").select("*").eq("order_id", orderId),
  ]);

  return jsonRes(200, { ...order, items: items.data || [], worksteps: steps.data || [], results: results.data || [], routing: route.data, acknowledgements: acks.data || [] }, ctx);
}

async function cancelOrder(db: any, orderId: string, ctx: Ctx) {
  const { data: order } = await db.from("oros_orders").select("status").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);
  const terminal = ["COMPLETED", "CANCELLED", "REJECTED", "FAILED"];
  if (terminal.includes(order.status)) return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: `Cannot cancel from ${order.status}` } }, ctx);

  await db.from("oros_orders").update({ status: "CANCELLED" }).eq("order_id", orderId);
  await logEvent(db, ctx, "oros.order.cancelled", "order", orderId, { previous_status: order.status });
  return jsonRes(200, { order_id: orderId, status: "CANCELLED" }, ctx);
}

async function acceptOrder(db: any, orderId: string, ctx: Ctx) {
  const { data: order } = await db.from("oros_orders").select("status").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);
  if (order.status !== "PLACED") return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: `Cannot accept from ${order.status}` } }, ctx);

  await db.from("oros_orders").update({ status: "ACCEPTED" }).eq("order_id", orderId);
  await db.from("oros_acknowledgements").insert({ order_id: orderId, ack_type: "DEPT", actor_id: ctx.actorId });
  await logEvent(db, ctx, "oros.order.accepted", "order", orderId, {});
  return jsonRes(200, { order_id: orderId, status: "ACCEPTED" }, ctx);
}

async function rejectOrder(db: any, req: Request, orderId: string, ctx: Ctx) {
  const body = await req.json();
  const { data: order } = await db.from("oros_orders").select("status").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);
  if (!["PLACED", "ACCEPTED"].includes(order.status)) return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: `Cannot reject from ${order.status}` } }, ctx);

  await db.from("oros_orders").update({ status: "REJECTED" }).eq("order_id", orderId);
  await logEvent(db, ctx, "oros.order.rejected", "order", orderId, { reason: body.reason });
  return jsonRes(200, { order_id: orderId, status: "REJECTED" }, ctx);
}

async function getWorklists(db: any, url: URL, ctx: Ctx) {
  const facilityId = url.searchParams.get("facilityId");
  const type = url.searchParams.get("type");
  const workspaceId = url.searchParams.get("workspaceId");

  let q = db.from("oros_orders").select("*").eq("tenant_id", ctx.tenantId).in("status", ["PLACED", "ACCEPTED", "IN_PROGRESS", "PARTIAL_RESULT", "RESULT_AVAILABLE"]);
  if (facilityId) q = q.eq("facility_id", facilityId);
  if (type) q = q.eq("type", type);
  q = q.order("priority", { ascending: true }).order("placed_at", { ascending: true }).limit(100);

  const { data, error } = await q;
  if (error) return jsonRes(500, { error: { code: "DB_ERROR", message: error.message } }, ctx);
  return jsonRes(200, { items: data || [], count: data?.length || 0 }, ctx);
}

async function startWorkstep(db: any, stepId: string, ctx: Ctx) {
  const { data: step } = await db.from("oros_worksteps").select("*").eq("workstep_id", stepId).maybeSingle();
  if (!step) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Workstep not found" } }, ctx);
  if (step.status !== "PENDING") return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: `Cannot start from ${step.status}` } }, ctx);

  await db.from("oros_worksteps").update({ status: "IN_PROGRESS", started_at: new Date().toISOString(), assigned_to_actor_id: ctx.actorId }).eq("workstep_id", stepId);
  // Transition order to IN_PROGRESS if not already
  await db.from("oros_orders").update({ status: "IN_PROGRESS" }).eq("order_id", step.order_id).in("status", ["PLACED", "ACCEPTED"]);
  await logEvent(db, ctx, "oros.workstep.changed", "workstep", stepId, { order_id: step.order_id, step_type: step.step_type, new_status: "IN_PROGRESS" });
  return jsonRes(200, { workstep_id: stepId, status: "IN_PROGRESS" }, ctx);
}

async function completeWorkstep(db: any, stepId: string, ctx: Ctx) {
  const { data: step } = await db.from("oros_worksteps").select("*").eq("workstep_id", stepId).maybeSingle();
  if (!step) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Workstep not found" } }, ctx);
  if (step.status !== "IN_PROGRESS") return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: `Cannot complete from ${step.status}` } }, ctx);

  await db.from("oros_worksteps").update({ status: "DONE", completed_at: new Date().toISOString() }).eq("workstep_id", stepId);

  // Check if all non-CLOSE_OUT steps done
  const { data: allSteps } = await db.from("oros_worksteps").select("*").eq("order_id", step.order_id);
  const remaining = (allSteps || []).filter((s: any) => s.workstep_id !== stepId && s.status !== "DONE" && s.status !== "SKIPPED" && s.step_type !== "CLOSE_OUT");
  if (remaining.length === 0) {
    // Auto-complete CLOSE_OUT
    await db.from("oros_worksteps").update({ status: "DONE", completed_at: new Date().toISOString() }).eq("order_id", step.order_id).eq("step_type", "CLOSE_OUT");
  }

  await logEvent(db, ctx, "oros.workstep.changed", "workstep", stepId, { order_id: step.order_id, step_type: step.step_type, new_status: "DONE" });
  return jsonRes(200, { workstep_id: stepId, status: "DONE" }, ctx);
}

async function postResult(db: any, req: Request, orderId: string, ctx: Ctx) {
  const body = await req.json();
  const { data: order } = await db.from("oros_orders").select("status").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);

  const { data: result, error } = await db.from("oros_results").insert({
    order_id: orderId, kind: body.kind, summary: body.summary || {},
    zibo_result_codes: body.zibo_result_codes || [], doc_ids: body.doc_ids || [],
    is_critical: body.is_critical || false,
  }).select().single();
  if (error) return jsonRes(500, { error: { code: "DB_ERROR", message: error.message } }, ctx);

  // Transition order
  const newStatus = body.partial ? "PARTIAL_RESULT" : "RESULT_AVAILABLE";
  await db.from("oros_orders").update({ status: newStatus }).eq("order_id", orderId);

  // Writeback intents
  await db.from("oros_writeback_intents").insert([
    { order_id: orderId, target: "BUTANO", intent_type: "CREATE_DIAGNOSTICREPORT", payload: { result_id: result.result_id, kind: body.kind } },
    { order_id: orderId, target: "PCT", intent_type: "PCT_RESULT_AVAILABLE", payload: { order_id: orderId, result_id: result.result_id } },
  ]);

  await logEvent(db, ctx, "oros.result.available", "result", result.result_id, { order_id: orderId, kind: body.kind, is_critical: body.is_critical || false });
  return jsonRes(201, result, ctx);
}

async function getResults(db: any, orderId: string, ctx: Ctx) {
  const { data } = await db.from("oros_results").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
  return jsonRes(200, { results: data || [] }, ctx);
}

async function markCritical(db: any, orderId: string, resultId: string, ctx: Ctx) {
  // Step-up required
  const su = requireStepUp(ctx, "MARK_CRITICAL_RESULT");
  if (su) return su;

  const { error } = await db.from("oros_results").update({ is_critical: true }).eq("result_id", resultId).eq("order_id", orderId);
  if (error) return jsonRes(500, { error: { code: "DB_ERROR", message: error.message } }, ctx);

  await logEvent(db, ctx, "oros.result.critical", "result", resultId, { order_id: orderId });
  return jsonRes(200, { result_id: resultId, is_critical: true }, ctx);
}

async function ackOrder(db: any, req: Request, orderId: string, ctx: Ctx) {
  const body = await req.json();
  const { data: order } = await db.from("oros_orders").select("*").eq("order_id", orderId).maybeSingle();
  if (!order) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Order not found" } }, ctx);

  await db.from("oros_acknowledgements").insert({ order_id: orderId, ack_type: body.ack_type || "CLINICIAN", actor_id: ctx.actorId, notes: body.notes });

  // If CLINICIAN ack on RESULT_AVAILABLE, move to REVIEWED
  if ((body.ack_type === "CLINICIAN" || !body.ack_type) && order.status === "RESULT_AVAILABLE") {
    await db.from("oros_orders").update({ status: "REVIEWED" }).eq("order_id", orderId);
  }

  await logEvent(db, ctx, "oros.ack.received", "order", orderId, { ack_type: body.ack_type || "CLINICIAN" });
  return jsonRes(200, { order_id: orderId, ack_type: body.ack_type || "CLINICIAN" }, ctx);
}

async function getRoute(db: any, orderId: string, ctx: Ctx) {
  const { data } = await db.from("oros_routing").select("*").eq("order_id", orderId).maybeSingle();
  if (!data) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Route not found" } }, ctx);
  return jsonRes(200, data, ctx);
}

async function retryRoute(db: any, orderId: string, ctx: Ctx) {
  const { data } = await db.from("oros_routing").select("*").eq("order_id", orderId).maybeSingle();
  if (!data) return jsonRes(404, { error: { code: "NOT_FOUND", message: "Route not found" } }, ctx);

  await db.from("oros_routing").update({ status: "PENDING", retry_count: (data.retry_count || 0) + 1, updated_at: new Date().toISOString() }).eq("route_id", data.route_id);
  await logEvent(db, ctx, "oros.order.routed", "order", orderId, { retry_count: data.retry_count + 1 });
  return jsonRes(200, { order_id: orderId, retry_count: data.retry_count + 1, status: "PENDING" }, ctx);
}

async function getReconcilePending(db: any, url: URL, ctx: Ctx) {
  const facilityId = url.searchParams.get("facilityId");
  let q = db.from("oros_reconcile_queue").select("*").eq("tenant_id", ctx.tenantId).eq("status", "PENDING");
  if (facilityId) q = q.eq("facility_id", facilityId);
  q = q.order("confidence", { ascending: false }).limit(100);
  const { data } = await q;
  return jsonRes(200, { items: data || [] }, ctx);
}

async function matchReconcile(db: any, req: Request, recId: string, ctx: Ctx) {
  const body = await req.json();
  const { error } = await db.from("oros_reconcile_queue").update({ order_id: body.order_id, status: "MATCHED", ops_notes: body.ops_notes }).eq("rec_id", recId);
  if (error) return jsonRes(500, { error: { code: "DB_ERROR", message: error.message } }, ctx);
  await logEvent(db, ctx, "oros.reconcile.matched", "reconcile", recId, { order_id: body.order_id });
  return jsonRes(200, { rec_id: recId, status: "MATCHED" }, ctx);
}

async function resolveReconcile(db: any, recId: string, ctx: Ctx) {
  // Step-up required
  const su = requireStepUp(ctx, "RECONCILIATION_RESOLVE");
  if (su) return su;

  await db.from("oros_reconcile_queue").update({ status: "RESOLVED" }).eq("rec_id", recId);
  await logEvent(db, ctx, "oros.reconcile.resolved", "reconcile", recId, {});
  return jsonRes(200, { rec_id: recId, status: "RESOLVED" }, ctx);
}

async function getCapabilities(db: any, url: URL, ctx: Ctx) {
  const tenantId = url.searchParams.get("tenant_id") || ctx.tenantId;
  const facilityId = url.searchParams.get("facility_id");
  if (!facilityId) return jsonRes(400, { error: { code: "INVALID_REQUEST", message: "facility_id required" } }, ctx);

  const { data } = await db.from("cap_tenant_facility_capabilities").select("*").eq("tenant_id", tenantId).eq("facility_id", facilityId).maybeSingle();
  return jsonRes(200, data || { tenant_id: tenantId, facility_id: facilityId, uses_external_lims: false, uses_external_pacs: false, uses_external_pharmacy: false, hybrid_mode_enabled: false, adapter_preferences: {} }, ctx);
}

async function upsertCapabilities(db: any, req: Request, ctx: Ctx) {
  const body = await req.json();
  const { data: existing } = await db.from("cap_tenant_facility_capabilities").select("id").eq("tenant_id", body.tenant_id || ctx.tenantId).eq("facility_id", body.facility_id).maybeSingle();

  if (existing) {
    await db.from("cap_tenant_facility_capabilities").update({
      uses_external_lims: body.uses_external_lims ?? false,
      uses_external_pacs: body.uses_external_pacs ?? false,
      uses_external_pharmacy: body.uses_external_pharmacy ?? false,
      hybrid_mode_enabled: body.hybrid_mode_enabled ?? false,
      adapter_preferences: body.adapter_preferences ?? {},
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await db.from("cap_tenant_facility_capabilities").insert({
      tenant_id: body.tenant_id || ctx.tenantId, facility_id: body.facility_id,
      uses_external_lims: body.uses_external_lims ?? false,
      uses_external_pacs: body.uses_external_pacs ?? false,
      uses_external_pharmacy: body.uses_external_pharmacy ?? false,
      hybrid_mode_enabled: body.hybrid_mode_enabled ?? false,
      adapter_preferences: body.adapter_preferences ?? {},
    });
  }

  return jsonRes(200, { status: "ok" }, ctx);
}

async function createWritebackIntent(db: any, req: Request, ctx: Ctx, target: string) {
  const body = await req.json();
  const { data, error } = await db.from("oros_writeback_intents").insert({
    order_id: body.order_id, target, intent_type: body.intent_type, payload: body.payload || {},
  }).select().single();
  if (error) return jsonRes(500, { error: { code: "DB_ERROR", message: error.message } }, ctx);
  return jsonRes(201, data, ctx);
}

async function getWritebackIntents(db: any, url: URL, ctx: Ctx) {
  const orderId = url.searchParams.get("order_id");
  let q = db.from("oros_writeback_intents").select("*");
  if (orderId) q = q.eq("order_id", orderId);
  q = q.order("created_at", { ascending: false }).limit(100);
  const { data } = await q;
  return jsonRes(200, { intents: data || [] }, ctx);
}

async function getEvents(db: any, url: URL, ctx: Ctx) {
  const orderId = url.searchParams.get("order_id");
  let q = db.from("oros_event_log").select("*").eq("tenant_id", ctx.tenantId);
  if (orderId) q = q.eq("entity_id", orderId);
  q = q.order("created_at", { ascending: false }).limit(200);
  const { data } = await q;
  return jsonRes(200, { events: data || [] }, ctx);
}
