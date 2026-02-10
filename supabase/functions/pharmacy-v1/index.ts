import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-correlation-id, x-device-fingerprint, x-purpose-of-use, x-actor-id, x-actor-type, x-facility-id, x-workspace-id, x-shift-id, x-session-assurance",
};

const REQUIRED_HEADERS = ["x-tenant-id","x-correlation-id","x-device-fingerprint","x-purpose-of-use","x-actor-id","x-actor-type"];

function validateHeaders(req: Request): { valid: boolean; missing?: string[]; headers?: Record<string,string> } {
  const missing = REQUIRED_HEADERS.filter(h => !req.headers.get(h));
  if (missing.length) return { valid: false, missing };
  const headers: Record<string,string> = {};
  for (const h of [...REQUIRED_HEADERS, "x-facility-id", "x-workspace-id", "x-shift-id", "x-session-assurance"]) {
    const v = req.headers.get(h);
    if (v) headers[h] = v;
  }
  return { valid: true, headers };
}

function err(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ code, message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function stepUpRequired(reason = "HIGH_RISK_ACTION") {
  return new Response(JSON.stringify({ code: "STEP_UP_REQUIRED", next: { method: "OIDC_STEP_UP", reason } }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function genULID(): string {
  const t = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const r = Array.from({ length: 16 }, () => Math.random().toString(36)[2] || "0").join("").toUpperCase();
  return t + r;
}

async function logIntent(db: any, tenantId: string, correlationId: string, eventType: string, entityType: string, entityId: string, payload: any) {
  await db.schema("intents").from("event_log").insert({ tenant_id: tenantId, event_type: eventType, entity_type: entityType, entity_id: entityId, payload, correlation_id: correlationId });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/pharmacy-v1/, "");
  const method = req.method;

  const validation = validateHeaders(req);
  if (!validation.valid) return err(400, "MISSING_HEADERS", `Missing: ${validation.missing!.join(", ")}`);
  const h = validation.headers!;
  const tenantId = h["x-tenant-id"];
  const actorId = h["x-actor-id"];
  const correlationId = h["x-correlation-id"];
  const facilityId = h["x-facility-id"] || "";
  const workspaceId = h["x-workspace-id"] || "";
  const assurance = h["x-session-assurance"] || "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);

  try {
    // ===== WORKLISTS =====
    if (method === "GET" && path === "/v1/worklists") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      const wsId = url.searchParams.get("workspaceId");
      const storeId = url.searchParams.get("storeId");
      let q = db.schema("pharm").from("dispense_orders").select("*").eq("tenant_id", tenantId).in("status", ["NEW","ACCEPTED","PICKING","DISPENSED_PARTIAL","BACKORDERED"]).order("priority", { ascending: true }).order("created_at", { ascending: true });
      if (fId) q = q.eq("facility_id", fId);
      if (wsId) q = q.eq("workspace_id", wsId);
      const { data, error } = await q.limit(200);
      if (error) return err(500, "DB_ERROR", error.message);
      return ok({ orders: data });
    }

    // ===== OROS ORDER PLACED (webhook consumer) =====
    if (method === "POST" && path === "/v1/internal/oros/order-placed") {
      const body = await req.json();
      const { oros_order_id, patient_cpid, items, priority, facility_id: fid, workspace_id: wsid } = body;
      if (!oros_order_id || !patient_cpid || !items?.length) return err(400, "INVALID_INPUT", "Missing required fields");
      const dispenseOrderId = "DISP-" + genULID();
      const { error: oErr } = await db.schema("pharm").from("dispense_orders").insert({
        dispense_order_id: dispenseOrderId, tenant_id: tenantId, facility_id: fid || facilityId,
        workspace_id: wsid || workspaceId || null, patient_cpid, oros_order_id, priority: priority || "ROUTINE", status: "NEW",
      });
      if (oErr) return err(500, "DB_ERROR", oErr.message);
      const itemRows = items.map((it: any) => ({
        dispense_order_id: dispenseOrderId, drug_code: it.drug_code || it.code, qty_requested: it.quantity || it.qty_requested || 1,
        unit: it.unit || null, route: it.route || null, no_substitution: it.no_substitution || false,
      }));
      await db.schema("pharm").from("dispense_items").insert(itemRows);
      await logIntent(db, tenantId, correlationId, "pharmacy.dispense.created", "dispense_order", dispenseOrderId, { oros_order_id, patient_cpid });
      return ok({ dispense_order_id: dispenseOrderId, status: "NEW" }, 201);
    }

    // ===== DISPENSE ORDER DETAIL =====
    const orderMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)$/);
    if (method === "GET" && orderMatch) {
      const id = orderMatch[1];
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      const { data: items } = await db.schema("pharm").from("dispense_items").select("*").eq("dispense_order_id", id);
      const { data: backorders } = await db.schema("pharm").from("backorders").select("*").eq("dispense_order_id", id);
      const { data: proofs } = await db.schema("pharm").from("pickup_proofs").select("*").eq("dispense_order_id", id);
      return ok({ ...order, items, backorders, pickup_proofs: proofs });
    }

    // ===== ACCEPT =====
    const acceptMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/accept$/);
    if (method === "POST" && acceptMatch) {
      const id = acceptMatch[1];
      const { error: uErr } = await db.schema("pharm").from("dispense_orders").update({ status: "ACCEPTED", updated_at: new Date().toISOString() }).eq("dispense_order_id", id).eq("status", "NEW");
      if (uErr) return err(500, "DB_ERROR", uErr.message);
      await logIntent(db, tenantId, correlationId, "pharmacy.dispense.accepted", "dispense_order", id, { actor_id: actorId });
      await logIntent(db, tenantId, correlationId, "oros.workstep.changed", "dispense_order", id, { step: "DISPENSE", status: "IN_PROGRESS" });
      return ok({ status: "ACCEPTED" });
    }

    // ===== PICK (FEFO suggestions) =====
    const pickMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/pick$/);
    if (method === "POST" && pickMatch) {
      const id = pickMatch[1];
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      const { data: items } = await db.schema("pharm").from("dispense_items").select("*").eq("dispense_order_id", id).in("status", ["PENDING","PICKED"]);
      // FEFO: get stock positions sorted by expiry
      const suggestions = [];
      for (const item of (items || [])) {
        const { data: positions } = await db.schema("pharm").from("stock_positions").select("*")
          .eq("facility_id", order.facility_id).gt("qty_on_hand", 0)
          .order("expiry", { ascending: true, nullsFirst: false }).limit(5);
        // Filter by matching item_code
        const matching = (positions || []).filter((p: any) => 
          JSON.stringify(p.item_code) === JSON.stringify(item.drug_code)
        );
        suggestions.push({ item, fefo_suggestions: matching.length > 0 ? matching : positions?.slice(0, 3) || [] });
      }
      await db.schema("pharm").from("dispense_orders").update({ status: "PICKING", updated_at: new Date().toISOString() }).eq("dispense_order_id", id);
      return ok({ suggestions });
    }

    // ===== BARCODE LOOKUP =====
    if (method === "GET" && path === "/v1/items/lookup-by-barcode") {
      const code = url.searchParams.get("code");
      if (!code) return err(400, "INVALID_INPUT", "Missing barcode code");
      const { data } = await db.schema("pharm").from("item_barcodes").select("*").eq("tenant_id", tenantId).eq("barcode_value", code).single();
      if (!data) return err(404, "NOT_FOUND", "Barcode not found");
      // Check stock availability
      const { data: stock } = await db.schema("pharm").from("stock_positions").select("*").eq("facility_id", facilityId).containedBy("item_code", data.item_code).gt("qty_on_hand", 0);
      return ok({ ...data, stock_available: stock || [] });
    }

    // ===== PARTIAL DISPENSE =====
    const partialMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/partial$/);
    if (method === "POST" && partialMatch) {
      const id = partialMatch[1];
      const body = await req.json();
      const { items: partialItems } = body; // [{ dispense_item_id, qty_dispensed, store_id, bin_id, batch, expiry }]
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      for (const pi of (partialItems || [])) {
        await db.schema("pharm").from("dispense_items").update({ qty_dispensed: pi.qty_dispensed, status: "PARTIAL" }).eq("dispense_item_id", pi.dispense_item_id);
        // Stock movement
        const { data: item } = await db.schema("pharm").from("dispense_items").select("*").eq("dispense_item_id", pi.dispense_item_id).single();
        if (item) {
          await db.schema("pharm").from("stock_movements").insert({
            tenant_id: tenantId, facility_id: order.facility_id, store_id: pi.store_id || "MAIN", bin_id: pi.bin_id || "DEFAULT",
            item_code: item.drug_code, batch: pi.batch, expiry: pi.expiry, qty_delta: -pi.qty_dispensed,
            reason: "DISPENSE", ref_type: "DISPENSE_ORDER", ref_id: id, created_by_actor_id: actorId,
          });
          // Update stock position
          const { data: pos } = await db.schema("pharm").from("stock_positions").select("*")
            .eq("facility_id", order.facility_id).eq("store_id", pi.store_id || "MAIN").eq("bin_id", pi.bin_id || "DEFAULT").limit(1).maybeSingle();
          if (pos) {
            await db.schema("pharm").from("stock_positions").update({ qty_on_hand: Math.max(0, pos.qty_on_hand - pi.qty_dispensed), updated_at: new Date().toISOString() }).eq("id", pos.id);
          }
          // Create backorder for remainder
          const remaining = item.qty_requested - pi.qty_dispensed;
          if (remaining > 0) {
            await db.schema("pharm").from("backorders").insert({
              dispense_order_id: id, dispense_item_id: pi.dispense_item_id, qty_remaining: remaining, status: "OPEN",
            });
          }
        }
      }
      await db.schema("pharm").from("dispense_orders").update({ status: "DISPENSED_PARTIAL", updated_at: new Date().toISOString() }).eq("dispense_order_id", id);
      await logIntent(db, tenantId, correlationId, "pharmacy.dispense.partial", "dispense_order", id, { items: partialItems });
      await logIntent(db, tenantId, correlationId, "mushex.charge.requested", "dispense_order", id, { type: "PARTIAL_DISPENSE" });
      return ok({ status: "DISPENSED_PARTIAL" });
    }

    // ===== BACKORDER =====
    const backorderMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/backorder$/);
    if (method === "POST" && backorderMatch) {
      const id = backorderMatch[1];
      const body = await req.json();
      await db.schema("pharm").from("dispense_orders").update({ status: "BACKORDERED", updated_at: new Date().toISOString() }).eq("dispense_order_id", id);
      await logIntent(db, tenantId, correlationId, "pharmacy.backorder.created", "dispense_order", id, body);
      await logIntent(db, tenantId, correlationId, "pct.blocker.raised", "dispense_order", id, { reason: "AWAITING_MEDS" });
      return ok({ status: "BACKORDERED" });
    }

    // ===== COMPLETE DISPENSE =====
    const completeMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/complete$/);
    if (method === "POST" && completeMatch) {
      const id = completeMatch[1];
      const body = await req.json();
      const { items: completeItems } = body; // [{ dispense_item_id, qty_dispensed, store_id, bin_id, batch, expiry }]
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      for (const ci of (completeItems || [])) {
        await db.schema("pharm").from("dispense_items").update({ qty_dispensed: ci.qty_dispensed, status: "COMPLETE" }).eq("dispense_item_id", ci.dispense_item_id);
        const { data: item } = await db.schema("pharm").from("dispense_items").select("*").eq("dispense_item_id", ci.dispense_item_id).single();
        if (item) {
          await db.schema("pharm").from("stock_movements").insert({
            tenant_id: tenantId, facility_id: order.facility_id, store_id: ci.store_id || "MAIN", bin_id: ci.bin_id || "DEFAULT",
            item_code: item.drug_code, batch: ci.batch, expiry: ci.expiry, qty_delta: -ci.qty_dispensed,
            reason: "DISPENSE", ref_type: "DISPENSE_ORDER", ref_id: id, created_by_actor_id: actorId,
          });
        }
      }
      // Close backorders
      await db.schema("pharm").from("backorders").update({ status: "FILLED" }).eq("dispense_order_id", id).eq("status", "OPEN");
      await db.schema("pharm").from("dispense_orders").update({ status: "DISPENSED_COMPLETE", updated_at: new Date().toISOString() }).eq("dispense_order_id", id);
      await logIntent(db, tenantId, correlationId, "pharmacy.dispense.completed", "dispense_order", id, {});
      await logIntent(db, tenantId, correlationId, "oros.result.available", "dispense_order", id, { kind: "PHARMACY", summary: { outcome: "DISPENSED_COMPLETE" } });
      await logIntent(db, tenantId, correlationId, "mushex.charge.requested", "dispense_order", id, { type: "COMPLETE_DISPENSE" });
      await logIntent(db, tenantId, correlationId, "pct.blocker.cleared", "dispense_order", id, { reason: "MEDS_DISPENSED" });
      return ok({ status: "DISPENSED_COMPLETE" });
    }

    // ===== SUBSTITUTION =====
    const subMatch = path.match(/^\/v1\/dispense-items\/([^/]+)\/substitute$/);
    if (method === "POST" && subMatch) {
      const itemId = subMatch[1];
      const body = await req.json();
      const { new_drug_code, reason_code } = body;
      const { data: item } = await db.schema("pharm").from("dispense_items").select("*, dispense_orders!inner(*)").eq("dispense_item_id", itemId).single();
      if (!item) return err(404, "NOT_FOUND", "Item not found");
      if (item.no_substitution) return ok({ decision: "DENIED", reason_codes: ["NO_SUBSTITUTION_FLAG"], requires_step_up: false });
      // Check substitution rules
      const { data: rules } = await db.schema("pharm").from("substitution_rules").select("*").eq("tenant_id", tenantId).eq("facility_id", (item as any).dispense_orders?.facility_id || "").eq("enabled", true);
      const noSubRule = (rules || []).find((r: any) => r.rule_type === "NO_SUBSTITUTION");
      if (noSubRule) return ok({ decision: "DENIED", reason_codes: ["FACILITY_NO_SUBSTITUTION"], requires_step_up: false });
      const genericRule = (rules || []).find((r: any) => r.rule_type === "GENERIC_ALLOWED");
      // Check formulary
      const { data: formularyEntry } = await db.schema("pharm").from("formulary").select("*").eq("tenant_id", tenantId).eq("facility_id", (item as any).dispense_orders?.facility_id || "").limit(1).maybeSingle();
      const substitution = { original: item.drug_code, replacement: new_drug_code, reason_code, decided_at: new Date().toISOString(), decided_by: actorId };
      await db.schema("pharm").from("dispense_items").update({ drug_code: new_drug_code, substitution, status: "SUBSTITUTED" }).eq("dispense_item_id", itemId);
      await logIntent(db, tenantId, correlationId, "pharmacy.substitution.approved", "dispense_item", itemId, substitution);
      return ok({ decision: "ALLOWED", reason_codes: [genericRule ? "GENERIC_ALLOWED" : "APPROVED"], requires_step_up: false, substitution });
    }

    // ===== PICKUP PROOF CREATE =====
    const pickupCreateMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/pickup\/create$/);
    if (method === "POST" && pickupCreateMatch) {
      const id = pickupCreateMatch[1];
      const body = await req.json();
      const { method: proofMethod, is_delegated } = body;
      const token = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
      // Simple hash for prototype
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
      await db.schema("pharm").from("pickup_proofs").insert({
        dispense_order_id: id, method: proofMethod || "OTP", token_hash: tokenHash, expires_at: expiresAt, is_delegated: is_delegated || false,
      });
      await logIntent(db, tenantId, correlationId, "pharmacy.pickup.proof.issued", "dispense_order", id, { method: proofMethod, is_delegated });
      return ok({ token, method: proofMethod || "OTP", expires_at: expiresAt, is_delegated: is_delegated || false });
    }

    // ===== PICKUP CLAIM =====
    if (method === "POST" && path === "/v1/pickup/claim") {
      const body = await req.json();
      const { token } = body;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      const { data: proof } = await db.schema("pharm").from("pickup_proofs").select("*").eq("token_hash", tokenHash).eq("status", "ISSUED").single();
      if (!proof) return err(404, "NOT_FOUND", "Invalid or expired token");
      if (new Date(proof.expires_at) < new Date()) {
        await db.schema("pharm").from("pickup_proofs").update({ status: "EXPIRED" }).eq("pickup_proof_id", proof.pickup_proof_id);
        return err(410, "EXPIRED", "Token has expired");
      }
      if (proof.is_delegated && assurance !== "HIGH") return stepUpRequired("DELEGATED_PICKUP_CLAIM");
      await db.schema("pharm").from("pickup_proofs").update({ status: "CLAIMED", claimed_by_actor_id: actorId, claimed_at: new Date().toISOString() }).eq("pickup_proof_id", proof.pickup_proof_id);
      await logIntent(db, tenantId, correlationId, "pharmacy.pickup.claimed", "pickup_proof", proof.pickup_proof_id, { dispense_order_id: proof.dispense_order_id });
      return ok({ status: "CLAIMED", dispense_order_id: proof.dispense_order_id });
    }

    // ===== RETURN =====
    const returnMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/return$/);
    if (method === "POST" && returnMatch) {
      const id = returnMatch[1];
      const body = await req.json();
      const { items: returnItems } = body;
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      for (const ri of (returnItems || [])) {
        await db.schema("pharm").from("stock_movements").insert({
          tenant_id: tenantId, facility_id: order.facility_id, store_id: ri.store_id || "MAIN", bin_id: ri.bin_id || "DEFAULT",
          item_code: ri.item_code, batch: ri.batch, expiry: ri.expiry, qty_delta: ri.quantity,
          reason: "RETURN", ref_type: "DISPENSE_ORDER", ref_id: id, created_by_actor_id: actorId,
        });
      }
      await logIntent(db, tenantId, correlationId, "pharmacy.return.recorded", "dispense_order", id, { items: returnItems });
      await logIntent(db, tenantId, correlationId, "mushex.credit.requested", "dispense_order", id, { type: "RETURN" });
      await logIntent(db, tenantId, correlationId, "oros.correction.intent", "dispense_order", id, { reason: "RETURN" });
      return ok({ status: "RETURN_RECORDED" });
    }

    // ===== WASTAGE =====
    const wastageMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/wastage$/);
    if (method === "POST" && wastageMatch) {
      const id = wastageMatch[1];
      const body = await req.json();
      const { items: wastageItems } = body;
      const { data: order } = await db.schema("pharm").from("dispense_orders").select("*").eq("dispense_order_id", id).single();
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      for (const wi of (wastageItems || [])) {
        await db.schema("pharm").from("stock_movements").insert({
          tenant_id: tenantId, facility_id: order.facility_id, store_id: wi.store_id || "MAIN", bin_id: wi.bin_id || "DEFAULT",
          item_code: wi.item_code, batch: wi.batch, expiry: wi.expiry, qty_delta: -(wi.quantity || 0),
          reason: "WASTAGE", ref_type: "DISPENSE_ORDER", ref_id: id, created_by_actor_id: actorId,
        });
      }
      await logIntent(db, tenantId, correlationId, "pharmacy.wastage.recorded", "dispense_order", id, { items: wastageItems });
      return ok({ status: "WASTAGE_RECORDED" });
    }

    // ===== REVERSAL (step-up required) =====
    const reversalMatch = path.match(/^\/v1\/dispense-orders\/([^/]+)\/reversal$/);
    if (method === "POST" && reversalMatch) {
      if (assurance !== "HIGH") return stepUpRequired("DISPENSE_REVERSAL");
      const id = reversalMatch[1];
      const body = await req.json();
      // Reverse all stock movements
      const { data: movements } = await db.schema("pharm").from("stock_movements").select("*").eq("ref_id", id).eq("reason", "DISPENSE");
      for (const m of (movements || [])) {
        await db.schema("pharm").from("stock_movements").insert({
          tenant_id: m.tenant_id, facility_id: m.facility_id, store_id: m.store_id, bin_id: m.bin_id,
          item_code: m.item_code, batch: m.batch, expiry: m.expiry, qty_delta: -m.qty_delta,
          reason: "REVERSAL", ref_type: "DISPENSE_ORDER", ref_id: id, created_by_actor_id: actorId,
        });
      }
      await db.schema("pharm").from("dispense_orders").update({ status: "REVERSED", updated_at: new Date().toISOString() }).eq("dispense_order_id", id);
      await logIntent(db, tenantId, correlationId, "pharmacy.reversal.completed", "dispense_order", id, { reason: body.reason });
      await logIntent(db, tenantId, correlationId, "mushex.credit.requested", "dispense_order", id, { type: "REVERSAL" });
      await logIntent(db, tenantId, correlationId, "oros.correction.intent", "dispense_order", id, { reason: "REVERSAL" });
      await logIntent(db, tenantId, correlationId, "pct.blocker.raised", "dispense_order", id, { reason: "REVERSAL_PENDING" });
      return ok({ status: "REVERSED" });
    }

    // ===== RECONCILIATION PENDING =====
    if (method === "GET" && path === "/v1/reconcile/stock/pending") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("pharm").from("reconcile_queue").select("*").eq("status", "PENDING").order("confidence", { ascending: false });
      if (fId) q = q.eq("facility_id", fId);
      const { data } = await q.limit(100);
      return ok({ items: data || [] });
    }

    // ===== RECONCILIATION RESOLVE (step-up required) =====
    const reconcileResolveMatch = path.match(/^\/v1\/reconcile\/stock\/([^/]+)\/resolve$/);
    if (method === "POST" && reconcileResolveMatch) {
      if (assurance !== "HIGH") return stepUpRequired("STOCK_RECONCILIATION_RESOLVE");
      const recId = reconcileResolveMatch[1];
      await db.schema("pharm").from("reconcile_queue").update({ status: "RESOLVED", ops_notes: (await req.json()).ops_notes || "" }).eq("rec_id", recId);
      await logIntent(db, tenantId, correlationId, "pharmacy.reconcile.resolved", "reconcile_queue", recId, {});
      return ok({ status: "RESOLVED" });
    }

    // ===== CAPABILITIES =====
    if (method === "GET" && path === "/v1/capabilities/effective") {
      const tid = url.searchParams.get("tenant_id") || tenantId;
      const fid = url.searchParams.get("facility_id") || facilityId;
      const { data } = await db.schema("cap").from("tenant_facility_capabilities").select("*").eq("tenant_id", tid).eq("facility_id", fid).maybeSingle();
      return ok(data || { uses_external_elmis: false, elmis_hybrid_mode: false, elmis_adapter_preference: "REST" });
    }

    // ===== INTERNAL HOOKS (intent creators) =====
    if (method === "POST" && path === "/v1/internal/mushex/charge") {
      const body = await req.json();
      await logIntent(db, tenantId, correlationId, "mushex.charge.requested", body.entity_type || "dispense_order", body.entity_id || "unknown", body);
      return ok({ logged: true });
    }
    if (method === "POST" && path === "/v1/internal/oros/status") {
      const body = await req.json();
      await logIntent(db, tenantId, correlationId, body.event_type || "oros.workstep.changed", body.entity_type || "dispense_order", body.entity_id || "unknown", body);
      return ok({ logged: true });
    }
    if (method === "POST" && path === "/v1/internal/pct/blocker") {
      const body = await req.json();
      await logIntent(db, tenantId, correlationId, body.event_type || "pct.blocker.raised", body.entity_type || "dispense_order", body.entity_id || "unknown", body);
      return ok({ logged: true });
    }

    // ===== STOCK POSITIONS =====
    if (method === "GET" && path === "/v1/stock/positions") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      const storeId = url.searchParams.get("storeId");
      let q = db.schema("pharm").from("stock_positions").select("*").eq("facility_id", fId);
      if (storeId) q = q.eq("store_id", storeId);
      const { data } = await q.order("updated_at", { ascending: false }).limit(200);
      return ok({ positions: data || [] });
    }

    // ===== STOCK MOVEMENTS =====
    if (method === "GET" && path === "/v1/stock/movements") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("pharm").from("stock_movements").select("*").eq("facility_id", fId);
      const { data } = await q.order("created_at", { ascending: false }).limit(200);
      return ok({ movements: data || [] });
    }

    // ===== EVENTS/INTENTS =====
    if (method === "GET" && path === "/v1/events") {
      let q = db.schema("intents").from("event_log").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      const entityId = url.searchParams.get("entity_id");
      if (entityId) q = q.eq("entity_id", entityId);
      const { data } = await q.limit(200);
      return ok({ events: data || [] });
    }

    return err(404, "NOT_FOUND", `Unknown route: ${method} ${path}`);
  } catch (e: any) {
    return err(500, "INTERNAL_ERROR", e.message || "Unexpected error");
  }
});
