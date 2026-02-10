import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-correlation-id, x-device-fingerprint, x-purpose-of-use, x-actor-id, x-actor-type, x-facility-id, x-workspace-id, x-shift-id, x-session-assurance, idempotency-key",
};

const REQUIRED_HEADERS = ["x-tenant-id","x-correlation-id","x-device-fingerprint","x-purpose-of-use","x-actor-id","x-actor-type"];

function validateHeaders(req: Request): { valid: boolean; missing?: string[]; headers?: Record<string,string> } {
  const missing = REQUIRED_HEADERS.filter(h => !req.headers.get(h));
  if (missing.length) return { valid: false, missing };
  const headers: Record<string,string> = {};
  for (const h of [...REQUIRED_HEADERS, "x-facility-id", "x-workspace-id", "x-shift-id", "x-session-assurance", "idempotency-key"]) {
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

async function logAudit(db: any, tenantId: string, action: string, entityType: string, entityId: string, actorId: string, purposeOfUse: string, correlationId: string, details: any = {}) {
  await db.schema("audit").from("audit_log").insert({ tenant_id: tenantId, action, entity_type: entityType, entity_id: entityId, actor_id: actorId, purpose_of_use: purposeOfUse, correlation_id: correlationId, details });
}

type RouteMode = "INTERNAL" | "EXTERNAL" | "HYBRID";

async function getRouteMode(db: any, tenantId: string, facilityId: string): Promise<RouteMode> {
  const { data } = await db.schema("cap").from("tenant_facility_capabilities").select("internal_inventory_enabled, external_inventory_enabled, inventory_hybrid_enabled").eq("tenant_id", tenantId).eq("facility_id", facilityId).maybeSingle();
  if (!data) return "INTERNAL";
  if (data.inventory_hybrid_enabled) return "HYBRID";
  if (data.external_inventory_enabled) return "EXTERNAL";
  return "INTERNAL";
}

async function postLedgerAndProjection(db: any, event: any, mode: RouteMode) {
  // Always write ledger for INTERNAL and HYBRID
  if (mode !== "EXTERNAL") {
    const { error: le } = await db.schema("inv").from("ledger_events").insert(event);
    if (le) throw new Error(`Ledger insert failed: ${le.message}`);

    // Update projection
    const key = { tenant_id: event.tenant_id, facility_id: event.facility_id, store_id: event.store_id, bin_id: event.bin_id || null, item_code: event.item_code, batch: event.batch || null, expiry: event.expiry || null };
    const { data: existing } = await db.schema("inv").from("on_hand_projection").select("id, qty_on_hand").eq("tenant_id", key.tenant_id).eq("facility_id", key.facility_id).eq("store_id", key.store_id).is("bin_id", key.bin_id).eq("item_code", key.item_code).is("batch", key.batch).is("expiry", key.expiry).maybeSingle();

    if (existing) {
      await db.schema("inv").from("on_hand_projection").update({ qty_on_hand: existing.qty_on_hand + event.qty_delta, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await db.schema("inv").from("on_hand_projection").insert({ ...key, qty_on_hand: event.qty_delta });
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/inventory-v1/, "");
  const method = req.method;

  const validation = validateHeaders(req);
  if (!validation.valid) return err(400, "MISSING_HEADERS", `Missing: ${validation.missing!.join(", ")}`);
  const h = validation.headers!;
  const tenantId = h["x-tenant-id"];
  const actorId = h["x-actor-id"];
  const correlationId = h["x-correlation-id"];
  const facilityId = h["x-facility-id"] || "";
  const purposeOfUse = h["x-purpose-of-use"] || "";
  const assurance = h["x-session-assurance"] || "";
  const idempotencyKey = h["idempotency-key"] || "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);

  try {
    // ========== ITEMS ==========

    // POST /v1/items/import (step-up for bulk)
    if (method === "POST" && path === "/v1/items/import") {
      if (assurance !== "HIGH") return stepUpRequired("BULK_IMPORT");
      const body = await req.json();
      const items: any[] = body.items || [];
      let imported = 0;
      for (const item of items) {
        const { error } = await db.schema("inv").from("items").upsert({ tenant_id: tenantId, item_code: item.item_code, name: item.name, uom: item.uom || "EA", zibo_refs: item.zibo_refs || null, is_controlled: item.is_controlled || false }, { onConflict: "tenant_id,item_code" });
        if (!error) imported++;
        if (item.barcodes) {
          for (const bc of item.barcodes) {
            await db.schema("inv").from("item_barcodes").upsert({ tenant_id: tenantId, item_code: item.item_code, barcode_type: bc.barcode_type || "INTERNAL", barcode_value: bc.barcode_value, batch: bc.batch || null, expiry: bc.expiry || null }, { onConflict: "tenant_id,barcode_value" });
          }
        }
      }
      await logIntent(db, tenantId, correlationId, "inventory.items.imported", "ITEM_BATCH", genULID(), { count: imported });
      await logAudit(db, tenantId, "ITEMS_IMPORTED", "ITEM_BATCH", genULID(), actorId, purposeOfUse, correlationId, { count: imported });
      return ok({ imported });
    }

    // GET /v1/items/lookup-by-barcode
    if (method === "GET" && path === "/v1/items/lookup-by-barcode") {
      const code = url.searchParams.get("code");
      if (!code) return err(400, "MISSING_PARAM", "code is required");
      const { data: bc } = await db.schema("inv").from("item_barcodes").select("*").eq("tenant_id", tenantId).eq("barcode_value", code).maybeSingle();
      if (!bc) return err(404, "NOT_FOUND", "Barcode not found");
      const { data: item } = await db.schema("inv").from("items").select("*").eq("tenant_id", tenantId).eq("item_code", bc.item_code).maybeSingle();
      // Get on-hand
      const { data: onhand } = await db.schema("inv").from("on_hand_projection").select("facility_id, store_id, bin_id, qty_on_hand").eq("tenant_id", tenantId).eq("item_code", bc.item_code);
      return ok({ barcode: bc, item, availability: onhand || [] });
    }

    // ========== ON-HAND ==========

    if (method === "GET" && path === "/v1/onhand") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("inv").from("on_hand_projection").select("*").eq("tenant_id", tenantId);
      if (fId) q = q.eq("facility_id", fId);
      const storeId = url.searchParams.get("storeId");
      if (storeId) q = q.eq("store_id", storeId);
      const binId = url.searchParams.get("binId");
      if (binId) q = q.eq("bin_id", binId);
      const itemCode = url.searchParams.get("itemCode");
      if (itemCode) q = q.eq("item_code", itemCode);
      const { data, error } = await q.order("item_code");
      if (error) return err(500, "DB_ERROR", error.message);
      return ok({ positions: data });
    }

    // ========== LEDGER OPERATIONS ==========

    const ledgerOps: Record<string, string> = {
      "/v1/ledger/receipt": "RECEIPT",
      "/v1/ledger/issue": "ISSUE",
      "/v1/ledger/transfer": "TRANSFER_OUT",
      "/v1/ledger/adjust": "ADJUSTMENT",
      "/v1/ledger/wastage": "WASTAGE",
      "/v1/ledger/return": "RETURN",
    };

    if (method === "POST" && ledgerOps[path]) {
      const eventType = ledgerOps[path];
      // Step-up for adjustments
      if (eventType === "ADJUSTMENT" && assurance !== "HIGH") return stepUpRequired("STOCK_ADJUSTMENT");

      const body = await req.json();
      const mode = await getRouteMode(db, tenantId, body.facility_id || facilityId);
      await logAudit(db, tenantId, `LEDGER_${eventType}`, "LEDGER_EVENT", genULID(), actorId, purposeOfUse, correlationId, { mode, event_type: eventType });

      // Idempotency check
      const idemKey = body.idempotency_key || idempotencyKey || null;
      if (idemKey) {
        const { data: dup } = await db.schema("inv").from("ledger_events").select("event_id").eq("idempotency_key", idemKey).maybeSingle();
        if (dup) return ok({ duplicate: true, event_id: dup.event_id });
      }

      // Controlled item enforcement
      if (["RECEIPT", "ISSUE"].includes(eventType)) {
        const { data: item } = await db.schema("inv").from("items").select("is_controlled").eq("tenant_id", tenantId).eq("item_code", body.item_code).maybeSingle();
        if (item?.is_controlled && (!body.batch || !body.expiry)) {
          return err(400, "BATCH_REQUIRED", "Controlled items require batch and expiry");
        }
      }

      const event = {
        tenant_id: tenantId,
        facility_id: body.facility_id || facilityId,
        store_id: body.store_id,
        bin_id: body.bin_id || null,
        event_type: eventType,
        item_code: body.item_code,
        batch: body.batch || null,
        expiry: body.expiry || null,
        qty_delta: eventType === "ISSUE" || eventType === "WASTAGE" || eventType === "TRANSFER_OUT" ? -Math.abs(body.qty) : Math.abs(body.qty),
        uom: body.uom || "EA",
        reason: body.reason || eventType,
        ref_type: body.ref_type || null,
        ref_id: body.ref_id || null,
        idempotency_key: idemKey,
        created_by_actor_id: actorId,
      };

      await postLedgerAndProjection(db, event, mode);

      // Transfer: also create TRANSFER_IN at destination
      if (path === "/v1/ledger/transfer" && body.to_store_id) {
        const transferIn = { ...event, event_type: "TRANSFER_IN", store_id: body.to_store_id, bin_id: body.to_bin_id || null, qty_delta: Math.abs(body.qty), idempotency_key: idemKey ? `${idemKey}_IN` : null };
        await postLedgerAndProjection(db, transferIn, mode);
      }

      // Emit intents
      await logIntent(db, tenantId, correlationId, "inventory.ledger.event.created", "LEDGER_EVENT", event.item_code, { event_type: eventType, qty_delta: event.qty_delta });
      await logIntent(db, tenantId, correlationId, "inventory.onhand.updated", "PROJECTION", event.item_code, { facility_id: event.facility_id, store_id: event.store_id });

      if (mode === "EXTERNAL" || mode === "HYBRID") {
        await logIntent(db, tenantId, correlationId, `elmis.post.${eventType.toLowerCase()}`, "ELMIS_INTENT", event.item_code, body);
      }

      return ok({ success: true, event_type: eventType, mode });
    }

    // ========== FEFO SUGGEST ==========

    if (method === "POST" && path === "/v1/fefo/suggest") {
      const body = await req.json();
      let q = db.schema("inv").from("on_hand_projection").select("*").eq("tenant_id", tenantId).eq("facility_id", body.facility_id || facilityId).eq("store_id", body.store_id).eq("item_code", body.item_code).gt("qty_on_hand", 0).order("expiry", { ascending: true, nullsFirst: false });
      if (body.bin_id) q = q.eq("bin_id", body.bin_id);
      const { data: rows } = await q;
      if (!rows || rows.length === 0) return ok({ picks: [], message: "No stock available" });

      let remaining = body.qty_required;
      const picks: any[] = [];
      for (const row of rows) {
        if (remaining <= 0) break;
        const pickQty = Math.min(row.qty_on_hand, remaining);
        picks.push({ ...row, pick_qty: pickQty });
        remaining -= pickQty;
      }

      // Barcode scan validation
      if (body.barcode) {
        const { data: bc } = await db.schema("inv").from("item_barcodes").select("*").eq("tenant_id", tenantId).eq("barcode_value", body.barcode).maybeSingle();
        const scanValid = bc && bc.item_code === body.item_code && (!bc.batch || picks.some(p => p.batch === bc.batch));
        return ok({ picks, remaining, scan_valid: scanValid, scanned_barcode: bc });
      }

      return ok({ picks, remaining });
    }

    // ========== STOCK COUNTS ==========

    // POST /v1/counts — create session
    if (method === "POST" && path === "/v1/counts") {
      const body = await req.json();
      const sessionId = genULID();
      const { error } = await db.schema("inv").from("count_sessions").insert({ session_id: sessionId, tenant_id: tenantId, facility_id: body.facility_id || facilityId, store_id: body.store_id, bin_scope: body.bin_scope || null, status: "DRAFT", created_by_actor_id: actorId });
      if (error) return err(500, "DB_ERROR", error.message);
      await logAudit(db, tenantId, "COUNT_CREATED", "COUNT_SESSION", sessionId, actorId, purposeOfUse, correlationId);
      return ok({ session_id: sessionId, status: "DRAFT" }, 201);
    }

    // POST /v1/counts/:id/lines
    const countLinesMatch = path.match(/^\/v1\/counts\/([^/]+)\/lines$/);
    if (method === "POST" && countLinesMatch) {
      const sessionId = countLinesMatch[1];
      const body = await req.json();
      const lines = body.lines || [body];
      for (const line of lines) {
        await db.schema("inv").from("count_lines").insert({ session_id: sessionId, item_code: line.item_code, batch: line.batch || null, expiry: line.expiry || null, qty_counted: line.qty_counted || 0, scanned: line.scanned || false });
      }
      return ok({ added: lines.length });
    }

    // POST /v1/counts/:id/submit
    const countSubmitMatch = path.match(/^\/v1\/counts\/([^/]+)\/submit$/);
    if (method === "POST" && countSubmitMatch) {
      const sessionId = countSubmitMatch[1];
      await db.schema("inv").from("count_sessions").update({ status: "SUBMITTED", submitted_at: new Date().toISOString() }).eq("session_id", sessionId);
      await logAudit(db, tenantId, "COUNT_SUBMITTED", "COUNT_SESSION", sessionId, actorId, purposeOfUse, correlationId);
      return ok({ session_id: sessionId, status: "SUBMITTED" });
    }

    // POST /v1/counts/:id/approve (step-up)
    const countApproveMatch = path.match(/^\/v1\/counts\/([^/]+)\/approve$/);
    if (method === "POST" && countApproveMatch) {
      if (assurance !== "HIGH") return stepUpRequired("COUNT_APPROVAL");
      const sessionId = countApproveMatch[1];
      const mode = await getRouteMode(db, tenantId, facilityId);

      // Get session + lines
      const { data: session } = await db.schema("inv").from("count_sessions").select("*").eq("session_id", sessionId).single();
      const { data: lines } = await db.schema("inv").from("count_lines").select("*").eq("session_id", sessionId);

      // For each line, compute variance and generate COUNT_ADJUST ledger events
      const variances: any[] = [];
      for (const line of (lines || [])) {
        const { data: proj } = await db.schema("inv").from("on_hand_projection").select("qty_on_hand").eq("tenant_id", tenantId).eq("facility_id", session.facility_id).eq("store_id", session.store_id).eq("item_code", line.item_code).is("batch", line.batch || null).is("expiry", line.expiry || null).maybeSingle();

        const systemQty = proj?.qty_on_hand || 0;
        const variance = line.qty_counted - systemQty;
        if (variance !== 0) {
          const adjustEvent = {
            tenant_id: tenantId,
            facility_id: session.facility_id,
            store_id: session.store_id,
            bin_id: null,
            event_type: "COUNT_ADJUST",
            item_code: line.item_code,
            batch: line.batch,
            expiry: line.expiry,
            qty_delta: variance,
            uom: "EA",
            reason: "Stock count adjustment",
            ref_type: "COUNT_SESSION",
            ref_id: sessionId,
            idempotency_key: `COUNT_${sessionId}_${line.id}`,
            created_by_actor_id: actorId,
          };
          await postLedgerAndProjection(db, adjustEvent, mode);
          variances.push({ item_code: line.item_code, batch: line.batch, system_qty: systemQty, counted: line.qty_counted, variance });
        }
      }

      await db.schema("inv").from("count_sessions").update({ status: "APPROVED", approved_at: new Date().toISOString(), approved_by_actor_id: actorId }).eq("session_id", sessionId);
      await logIntent(db, tenantId, correlationId, "inventory.count.completed", "COUNT_SESSION", sessionId, { variances });
      if (mode === "EXTERNAL" || mode === "HYBRID") {
        await logIntent(db, tenantId, correlationId, "elmis.post.count", "COUNT_SESSION", sessionId, { variances });
      }
      await logAudit(db, tenantId, "COUNT_APPROVED", "COUNT_SESSION", sessionId, actorId, purposeOfUse, correlationId, { variances });
      return ok({ session_id: sessionId, status: "APPROVED", variances });
    }

    // ========== REQUISITIONS ==========

    if (method === "POST" && path === "/v1/requisitions") {
      const body = await req.json();
      const reqId = genULID();
      await db.schema("inv").from("requisitions").insert({ req_id: reqId, tenant_id: tenantId, facility_id: body.facility_id || facilityId, from_store_id: body.from_store_id, to_store_id: body.to_store_id, status: "DRAFT", created_by_actor_id: actorId });
      if (body.lines) {
        for (const line of body.lines) {
          await db.schema("inv").from("requisition_lines").insert({ req_id: reqId, item_code: line.item_code, qty_requested: line.qty_requested });
        }
      }
      await logAudit(db, tenantId, "REQUISITION_CREATED", "REQUISITION", reqId, actorId, purposeOfUse, correlationId);
      return ok({ req_id: reqId, status: "DRAFT" }, 201);
    }

    const reqApproveMatch = path.match(/^\/v1\/requisitions\/([^/]+)\/approve$/);
    if (method === "POST" && reqApproveMatch) {
      const reqId = reqApproveMatch[1];
      await db.schema("inv").from("requisitions").update({ status: "APPROVED", approved_at: new Date().toISOString() }).eq("req_id", reqId);
      await logAudit(db, tenantId, "REQUISITION_APPROVED", "REQUISITION", reqId, actorId, purposeOfUse, correlationId);
      return ok({ req_id: reqId, status: "APPROVED" });
    }

    const reqFulfillMatch = path.match(/^\/v1\/requisitions\/([^/]+)\/fulfill$/);
    if (method === "POST" && reqFulfillMatch) {
      const reqId = reqFulfillMatch[1];
      const { data: reqData } = await db.schema("inv").from("requisitions").select("*").eq("req_id", reqId).single();
      const { data: lines } = await db.schema("inv").from("requisition_lines").select("*").eq("req_id", reqId);
      const mode = await getRouteMode(db, tenantId, reqData.facility_id);

      for (const line of (lines || [])) {
        // ISSUE from to_store (fulfilling)
        const issueEvent = {
          tenant_id: tenantId, facility_id: reqData.facility_id, store_id: reqData.to_store_id, bin_id: null,
          event_type: "ISSUE", item_code: line.item_code, batch: null, expiry: null,
          qty_delta: -Math.abs(line.qty_requested), uom: "EA", reason: "Requisition fulfillment",
          ref_type: "REQUISITION", ref_id: reqId, idempotency_key: `REQ_ISSUE_${reqId}_${line.id}`, created_by_actor_id: actorId,
        };
        await postLedgerAndProjection(db, issueEvent, mode);

        // TRANSFER_IN to from_store (requesting)
        const receiveEvent = { ...issueEvent, event_type: "TRANSFER_IN", store_id: reqData.from_store_id, qty_delta: Math.abs(line.qty_requested), idempotency_key: `REQ_IN_${reqId}_${line.id}` };
        await postLedgerAndProjection(db, receiveEvent, mode);

        await db.schema("inv").from("requisition_lines").update({ qty_fulfilled: line.qty_requested }).eq("id", line.id);
      }

      await db.schema("inv").from("requisitions").update({ status: "FULFILLED", fulfilled_at: new Date().toISOString() }).eq("req_id", reqId);
      await logIntent(db, tenantId, correlationId, "inventory.requisition.fulfilled", "REQUISITION", reqId, { lines_count: lines?.length });
      if (mode === "EXTERNAL" || mode === "HYBRID") {
        await logIntent(db, tenantId, correlationId, "elmis.post.requisition_fulfilled", "REQUISITION", reqId, {});
      }
      await logAudit(db, tenantId, "REQUISITION_FULFILLED", "REQUISITION", reqId, actorId, purposeOfUse, correlationId);
      return ok({ req_id: reqId, status: "FULFILLED" });
    }

    // ========== HANDOVER ==========

    if (method === "POST" && path === "/v1/handover/start") {
      const body = await req.json();
      const handoverId = genULID();
      await db.schema("inv").from("handovers").insert({ handover_id: handoverId, tenant_id: tenantId, facility_id: body.facility_id || facilityId, store_id: body.store_id, from_actor_id: body.from_actor_id || actorId, to_actor_id: body.to_actor_id, status: "STARTED" });
      await logAudit(db, tenantId, "HANDOVER_STARTED", "HANDOVER", handoverId, actorId, purposeOfUse, correlationId);
      return ok({ handover_id: handoverId, status: "STARTED" }, 201);
    }

    const handoverSignMatch = path.match(/^\/v1\/handover\/([^/]+)\/sign$/);
    if (method === "POST" && handoverSignMatch) {
      const handoverId = handoverSignMatch[1];
      const { data: ho } = await db.schema("inv").from("handovers").select("*").eq("handover_id", handoverId).single();
      if (!ho) return err(404, "NOT_FOUND", "Handover not found");

      let newStatus = ho.status;
      const updates: any = {};
      if (ho.status === "STARTED") {
        updates.signed_outgoing_at = new Date().toISOString();
        newStatus = "SIGNED_OUTGOING";
      } else if (ho.status === "SIGNED_OUTGOING") {
        updates.signed_incoming_at = new Date().toISOString();
        newStatus = "COMPLETE";
      } else {
        return err(400, "INVALID_STATE", `Cannot sign handover in status ${ho.status}`);
      }
      updates.status = newStatus;
      await db.schema("inv").from("handovers").update(updates).eq("handover_id", handoverId);
      await logAudit(db, tenantId, `HANDOVER_${newStatus}`, "HANDOVER", handoverId, actorId, purposeOfUse, correlationId);
      return ok({ handover_id: handoverId, status: newStatus });
    }

    // ========== RECONCILIATION ==========

    if (method === "GET" && path === "/v1/reconcile/pending") {
      const { data } = await db.schema("inv").from("reconcile_queue").select("*").eq("tenant_id", tenantId).eq("status", "PENDING").order("confidence", { ascending: false });
      return ok({ items: data || [] });
    }

    const reconcileMatch = path.match(/^\/v1\/reconcile\/([^/]+)\/resolve$/);
    if (method === "POST" && reconcileMatch) {
      if (assurance !== "HIGH") return stepUpRequired("RECONCILIATION_RESOLVE");
      const recId = reconcileMatch[1];
      const body = await req.json();
      await db.schema("inv").from("reconcile_queue").update({ status: "RESOLVED", resolved_by_actor_id: actorId, resolved_at: new Date().toISOString() }).eq("rec_id", recId);

      // Optionally generate adjustment
      if (body.generate_adjustment) {
        const mode = await getRouteMode(db, tenantId, body.facility_id || facilityId);
        const adjustEvent = {
          tenant_id: tenantId, facility_id: body.facility_id || facilityId, store_id: body.store_id, bin_id: null,
          event_type: "ADJUSTMENT", item_code: body.item_code, batch: body.batch || null, expiry: body.expiry || null,
          qty_delta: body.qty_delta, uom: body.uom || "EA", reason: "Reconciliation adjustment",
          ref_type: "RECONCILE", ref_id: recId, idempotency_key: `RECON_${recId}`, created_by_actor_id: actorId,
        };
        await postLedgerAndProjection(db, adjustEvent, mode);
        if (mode === "EXTERNAL" || mode === "HYBRID") {
          await logIntent(db, tenantId, correlationId, "elmis.post.adjustment", "RECONCILE", recId, body);
        }
      }

      await logAudit(db, tenantId, "RECONCILE_RESOLVED", "RECONCILE", recId, actorId, purposeOfUse, correlationId, body);
      return ok({ rec_id: recId, status: "RESOLVED" });
    }

    // ========== CONSUMPTION POSTING (clinical) ==========

    if (method === "POST" && path === "/v1/internal/consumption/post") {
      const body = await req.json();
      const fId = body.facility_id || facilityId;
      const mode = await getRouteMode(db, tenantId, fId);

      for (const item of (body.items || [])) {
        const issueEvent = {
          tenant_id: tenantId, facility_id: fId, store_id: body.store_id, bin_id: null,
          event_type: "ISSUE", item_code: item.item_code, batch: item.batch || null, expiry: item.expiry || null,
          qty_delta: -Math.abs(item.qty), uom: item.uom || "EA", reason: "Consumption posting",
          ref_type: body.ref_type, ref_id: body.ref_id, idempotency_key: null, created_by_actor_id: actorId,
        };
        await postLedgerAndProjection(db, issueEvent, mode);
      }

      await logIntent(db, tenantId, correlationId, "inventory.consumption.posted", "CONSUMPTION", body.ref_id || genULID(), { ref_type: body.ref_type, items_count: body.items?.length });
      if (mode === "EXTERNAL" || mode === "HYBRID") {
        await logIntent(db, tenantId, correlationId, "elmis.post.consumption", "CONSUMPTION", body.ref_id || genULID(), body);
      }
      await logAudit(db, tenantId, "CONSUMPTION_POSTED", "CONSUMPTION", body.ref_id || "", actorId, purposeOfUse, correlationId, { items_count: body.items?.length });
      return ok({ success: true, mode });
    }

    // ========== FACILITIES / STORES / BINS CRUD ==========

    if (method === "GET" && path === "/v1/facilities") {
      const { data } = await db.schema("inv").from("facilities").select("*").eq("tenant_id", tenantId);
      return ok({ facilities: data || [] });
    }

    if (method === "GET" && path === "/v1/stores") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("inv").from("stores").select("*").eq("tenant_id", tenantId);
      if (fId) q = q.eq("facility_id", fId);
      const { data } = await q;
      return ok({ stores: data || [] });
    }

    if (method === "GET" && path === "/v1/bins") {
      const storeId = url.searchParams.get("storeId");
      if (!storeId) return err(400, "MISSING_PARAM", "storeId required");
      const { data } = await db.schema("inv").from("bins").select("*").eq("store_id", storeId);
      return ok({ bins: data || [] });
    }

    // ========== LEDGER HISTORY ==========

    if (method === "GET" && path === "/v1/ledger/history") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("inv").from("ledger_events").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200);
      if (fId) q = q.eq("facility_id", fId);
      const storeId = url.searchParams.get("storeId");
      if (storeId) q = q.eq("store_id", storeId);
      const itemCode = url.searchParams.get("itemCode");
      if (itemCode) q = q.eq("item_code", itemCode);
      const { data } = await q;
      return ok({ events: data || [] });
    }

    // ========== EVENTS/INTENTS ==========

    if (method === "GET" && path === "/v1/events") {
      const { data } = await db.schema("intents").from("event_log").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100);
      return ok({ events: data || [] });
    }

    // ========== HANDOVER LIST ==========

    if (method === "GET" && path === "/v1/handovers") {
      const fId = url.searchParams.get("facilityId") || facilityId;
      let q = db.schema("inv").from("handovers").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      if (fId) q = q.eq("facility_id", fId);
      const { data } = await q;
      return ok({ handovers: data || [] });
    }

    // ========== COUNT SESSIONS LIST ==========

    if (method === "GET" && path === "/v1/counts") {
      let q = db.schema("inv").from("count_sessions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      const { data } = await q;
      return ok({ sessions: data || [] });
    }

    // ========== REQUISITIONS LIST ==========

    if (method === "GET" && path === "/v1/requisitions") {
      let q = db.schema("inv").from("requisitions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      const { data } = await q;
      return ok({ requisitions: data || [] });
    }

    return err(404, "NOT_FOUND", `No handler for ${method} ${path}`);
  } catch (e: any) {
    console.error("inventory-v1 error:", e);
    return err(500, "INTERNAL_ERROR", e.message || "Internal server error");
  }
});
