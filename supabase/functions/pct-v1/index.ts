import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint",
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
  requestId: string;
}

function extractCtx(req: Request): { ctx: Ctx | null; err: Response | null } {
  const tenantId = req.headers.get("x-tenant-id");
  const correlationId = req.headers.get("x-correlation-id");
  const actorId = req.headers.get("x-actor-id");
  const actorType = req.headers.get("x-actor-type");
  const purposeOfUse = req.headers.get("x-purpose-of-use");
  const deviceFingerprint = req.headers.get("x-device-fingerprint");
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  const missing: string[] = [];
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!correlationId) missing.push("X-Correlation-Id");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");
  if (!purposeOfUse) missing.push("X-Purpose-Of-Use");
  if (!deviceFingerprint) missing.push("X-Device-Fingerprint");

  if (missing.length > 0) {
    return {
      ctx: null,
      err: new Response(JSON.stringify({
        error: { code: "MISSING_REQUIRED_HEADER", message: `Missing: ${missing.join(", ")}`, details: { missing }, request_id: requestId, correlation_id: correlationId || "" }
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!, correlationId: correlationId!, actorId: actorId!,
      actorType: actorType!, purposeOfUse: purposeOfUse!, deviceFingerprint: deviceFingerprint!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
      requestId,
    },
    err: null,
  };
}

function ok(body: unknown, ctx: Ctx, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": ctx.requestId, "X-Correlation-ID": ctx.correlationId },
  });
}

function err(code: string, message: string, status: number, ctx: Ctx, details: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: { code, message, details, request_id: ctx.requestId, correlation_id: ctx.correlationId } }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function generateULID(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(36).padStart(2, "0").slice(-1)).join("");
  return (t + r).toUpperCase().slice(0, 26);
}

async function emitOutbox(db: ReturnType<typeof getSupabase>, ctx: Ctx, aggregateType: string, aggregateId: string, eventType: string, payload: unknown) {
  await db.from("pct_outbox_events").insert({
    tenant_id: ctx.tenantId, aggregate_type: aggregateType, aggregate_id: aggregateId,
    event_type: eventType, payload_json: payload, correlation_id: ctx.correlationId,
  });
}

async function emitTelemetry(db: ReturnType<typeof getSupabase>, ctx: Ctx, eventType: string, payload: unknown) {
  await db.from("pct_telemetry_events").insert({
    tenant_id: ctx.tenantId, facility_id: ctx.facilityId || "unknown",
    workspace_id: ctx.workspaceId, event_type: eventType,
    payload_json: payload, correlation_id: ctx.correlationId,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, err: ctxErr } = extractCtx(req);
  if (!ctx) return ctxErr!;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/pct-v1/, "");
  const method = req.method;
  const db = getSupabase();

  try {
    // ===== A) WORK/SHIFT CONTEXT =====
    if (path === "/v1/work/start" && method === "POST") {
      const body = await req.json();
      const { facility_id, workspace_id, duty_mode } = body;
      const { data, error } = await db.from("pct_workspace_sessions").insert({
        tenant_id: ctx.tenantId, actor_id: ctx.actorId, actor_type: ctx.actorType,
        facility_id, workspace_id, shift_id: ctx.shiftId,
        duty_mode: duty_mode || "CLINICAL",
        context_json: body.context_json || {},
      }).select().single();
      if (error) return err("DB_ERROR", error.message, 500, ctx);
      await emitOutbox(db, ctx, "workspace_session", data.session_id, "pct.work.started", data);
      return ok(data, ctx, 201);
    }

    if (path === "/v1/work/end" && method === "POST") {
      const body = await req.json();
      const { data, error } = await db.from("pct_workspace_sessions")
        .update({ status: "ENDED", ended_at: new Date().toISOString() })
        .eq("session_id", body.session_id).eq("tenant_id", ctx.tenantId)
        .select().single();
      if (error) return err("DB_ERROR", error.message, 500, ctx);
      await emitOutbox(db, ctx, "workspace_session", data.session_id, "pct.work.ended", data);
      return ok(data, ctx);
    }

    if (path === "/v1/work/context" && method === "GET") {
      const { data } = await db.from("pct_workspace_sessions")
        .select("*").eq("tenant_id", ctx.tenantId).eq("actor_id", ctx.actorId)
        .eq("status", "ACTIVE").order("started_at", { ascending: false }).limit(1);
      return ok({ session: data?.[0] || null }, ctx);
    }

    // ===== B) PATIENT SORTING / JOURNEYS =====
    if (path === "/v1/patients/search" && method === "POST") {
      const body = await req.json();
      if (body.cpid) {
        const { data } = await db.from("pct_journeys")
          .select("*").eq("tenant_id", ctx.tenantId).eq("patient_cpid", body.cpid)
          .order("created_at", { ascending: false }).limit(10);
        return ok({ results: data || [], status: "OK" }, ctx);
      }
      return ok({ status: "RESOLUTION_REQUIRED", next: { service: "TSHEPO/VITO" } }, ctx);
    }

    if (path === "/v1/journeys/start" && method === "POST") {
      const body = await req.json();
      const journeyId = generateULID();
      const { data, error } = await db.from("pct_journeys").insert({
        journey_id: journeyId, tenant_id: ctx.tenantId,
        facility_id: body.facility_id || ctx.facilityId || "unknown",
        patient_cpid: body.patient_cpid, state: "ARRIVED",
        referral_source: body.referral_source,
      }).select().single();
      if (error) return err("DB_ERROR", error.message, 500, ctx);
      await emitOutbox(db, ctx, "journey", journeyId, "pct.journey.created", data);
      return ok(data, ctx, 201);
    }

    const journeyMatch = path.match(/^\/v1\/journeys\/([^/]+)/);
    if (journeyMatch) {
      const journeyId = journeyMatch[1];

      if (path.endsWith("/triage") && method === "POST") {
        const body = await req.json();
        const { data, error } = await db.from("pct_triage_records").insert({
          tenant_id: ctx.tenantId, journey_id: journeyId,
          acuity: body.acuity, vitals_json: body.vitals || {},
          notes: body.notes, triaged_by_actor_id: ctx.actorId,
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "TRIAGED", updated_at: new Date().toISOString() }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "journey", journeyId, "pct.journey.state_changed", { state: "TRIAGED", triage: data });
        return ok(data, ctx, 201);
      }

      if (path.endsWith("/route") && method === "POST") {
        const body = await req.json();
        await db.from("pct_journeys").update({
          state: "ROUTED", current_workspace_id: body.workspace_id, updated_at: new Date().toISOString(),
        }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "journey", journeyId, "pct.journey.state_changed", { state: "ROUTED", workspace_id: body.workspace_id });
        return ok({ journey_id: journeyId, state: "ROUTED", workspace_id: body.workspace_id }, ctx);
      }

      if (path.endsWith("/encounter/start") && method === "POST") {
        const body = await req.json();
        const { data, error } = await db.from("pct_encounters").insert({
          tenant_id: ctx.tenantId, journey_id: journeyId,
          workspace_id: body.workspace_id || ctx.workspaceId || "unknown",
          assigned_provider_public_id: body.provider_id || ctx.actorId,
          meta_json: body.meta || {},
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "IN_ENCOUNTER", updated_at: new Date().toISOString() }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "encounter", data.pct_encounter_id, "pct.encounter.started", data);
        return ok(data, ctx, 201);
      }

      if (path.endsWith("/admit") && method === "POST") {
        const body = await req.json();
        const { data, error } = await db.from("pct_admissions").insert({
          tenant_id: ctx.tenantId, journey_id: journeyId,
          ward_id: body.ward_id, bed_id: body.bed_id,
          requested_by_actor_id: ctx.actorId,
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "ADMITTED", updated_at: new Date().toISOString() }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "admission", data.admission_id, "pct.admission.created", data);
        return ok(data, ctx, 201);
      }

      if (path.endsWith("/discharge/start") && method === "POST") {
        const body = await req.json();
        // Check MUSHEX payment status
        const { data: payment } = await db.from("pct_mushex_payment_status")
          .select("*").eq("journey_id", journeyId).eq("tenant_id", ctx.tenantId).maybeSingle();
        const blockers: unknown[] = body.blockers || [];
        if (payment && payment.status === "PENDING") {
          blockers.push({ type: "BILLING_PAYMENT_PENDING", detail: "MUSHEX payment pending" });
        }
        const status = blockers.length > 0 ? "BLOCKED" : "STARTED";
        const { data, error } = await db.from("pct_discharge_cases").insert({
          tenant_id: ctx.tenantId, journey_id: journeyId,
          discharge_type: body.discharge_type || "ROUTINE",
          blockers_json: blockers, status,
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "DISCHARGE_IN_PROGRESS", updated_at: new Date().toISOString() }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "discharge", data.case_id, status === "BLOCKED" ? "pct.discharge.blocked" : "pct.discharge.started", data);
        return ok(data, ctx, 201);
      }

      if (path.endsWith("/death/record") && method === "POST") {
        const body = await req.json();
        const { data, error } = await db.from("pct_death_cases").insert({
          tenant_id: ctx.tenantId, journey_id: journeyId,
          cert_doc_id: body.cert_doc_id,
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "DEATH_IN_PROGRESS", updated_at: new Date().toISOString() }).eq("journey_id", journeyId);
        await emitOutbox(db, ctx, "death", data.case_id, "pct.death.recorded", data);
        return ok(data, ctx, 201);
      }
    }

    // ===== C) QUEUES =====
    if (path === "/v1/queues" && method === "GET") {
      const facilityId = url.searchParams.get("facilityId");
      const workspaceId = url.searchParams.get("workspaceId");
      let query = db.from("pct_queues").select("*").eq("tenant_id", ctx.tenantId).eq("is_active", true);
      if (facilityId) query = query.eq("facility_id", facilityId);
      if (workspaceId) query = query.eq("workspace_id", workspaceId);
      const { data } = await query;
      return ok({ queues: data || [] }, ctx);
    }

    const queueMatch = path.match(/^\/v1\/queues\/([^/]+)/);
    if (queueMatch) {
      const queueId = queueMatch[1];

      if (path.endsWith("/enqueue") && method === "POST") {
        const body = await req.json();
        // Get ticket number
        const { data: queue } = await db.from("pct_queues").select("workspace_id").eq("queue_id", queueId).single();
        const wsId = queue?.workspace_id || "default";
        const today = new Date().toISOString().slice(0, 10);
        // Upsert counter
        const { data: counter } = await db.from("pct_ticket_counters")
          .upsert({ tenant_id: ctx.tenantId, workspace_id: wsId, counter_date: today, last_number: 1 },
            { onConflict: "tenant_id,workspace_id,counter_date" })
          .select().single();
        // Increment
        const nextNum = (counter?.last_number || 0) + 1;
        await db.from("pct_ticket_counters")
          .update({ last_number: nextNum })
          .eq("tenant_id", ctx.tenantId).eq("workspace_id", wsId).eq("counter_date", today);
        const ticketNumber = `${wsId.slice(0, 3).toUpperCase()}-${String(nextNum).padStart(3, "0")}`;

        const priority = body.priority ?? 0;
        const { data, error } = await db.from("pct_queue_items").insert({
          tenant_id: ctx.tenantId, queue_id: queueId, journey_id: body.journey_id,
          priority, ticket_number: ticketNumber,
        }).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await db.from("pct_journeys").update({ state: "IN_QUEUE", current_queue_id: queueId, updated_at: new Date().toISOString() }).eq("journey_id", body.journey_id);
        await emitOutbox(db, ctx, "queue_item", data.item_id, "pct.queue.item.created", data);
        return ok(data, ctx, 201);
      }

      if (path.endsWith("/call-next") && method === "POST") {
        const { data: queue } = await db.from("pct_queues").select("type, rules_json").eq("queue_id", queueId).single();
        let orderCol = "enqueued_at";
        let ascending = true;
        if (queue?.type === "PRIORITY" || queue?.type === "TRIAGE") {
          orderCol = "priority";
          ascending = false; // higher priority first
        }
        const { data: items } = await db.from("pct_queue_items")
          .select("*").eq("queue_id", queueId).eq("status", "WAITING")
          .order(orderCol, { ascending }).limit(1);
        if (!items || items.length === 0) return ok({ item: null, message: "Queue empty" }, ctx);
        const item = items[0];
        const { data: updated } = await db.from("pct_queue_items")
          .update({ status: "CALLED", called_at: new Date().toISOString(), called_by_actor_id: ctx.actorId, last_status_by_actor_id: ctx.actorId })
          .eq("item_id", item.item_id).select().single();
        await emitOutbox(db, ctx, "queue_item", item.item_id, "pct.queue.item.updated", updated);
        return ok(updated, ctx);
      }
    }

    // Queue item status updates
    const qiMatch = path.match(/^\/v1\/queue-items\/([^/]+)/);
    if (qiMatch) {
      const itemId = qiMatch[1];

      if (path.endsWith("/status") && method === "POST") {
        const body = await req.json();
        const updates: Record<string, unknown> = { status: body.status, last_status_by_actor_id: ctx.actorId };
        if (body.status === "IN_SERVICE") updates.started_at = new Date().toISOString();
        if (["COMPLETED", "NO_SHOW", "LEFT"].includes(body.status)) updates.ended_at = new Date().toISOString();
        const { data, error } = await db.from("pct_queue_items").update(updates).eq("item_id", itemId).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await emitOutbox(db, ctx, "queue_item", itemId, "pct.queue.item.updated", data);
        return ok(data, ctx);
      }

      if (path.endsWith("/transfer") && method === "POST") {
        const body = await req.json();
        // Mark current as completed, create new in target queue
        await db.from("pct_queue_items").update({ status: "COMPLETED", ended_at: new Date().toISOString(), last_status_by_actor_id: ctx.actorId }).eq("item_id", itemId);
        const { data: old } = await db.from("pct_queue_items").select("*").eq("item_id", itemId).single();
        const { data: newItem } = await db.from("pct_queue_items").insert({
          tenant_id: ctx.tenantId, queue_id: body.target_queue_id,
          journey_id: old!.journey_id, priority: old!.priority,
          ticket_number: old!.ticket_number, notes: body.notes,
        }).select().single();
        await emitOutbox(db, ctx, "queue_item", newItem!.item_id, "pct.queue.item.created", { ...newItem, transferred_from: itemId });
        return ok(newItem, ctx, 201);
      }
    }

    // ===== D) ENCOUNTERS =====
    const encMatch = path.match(/^\/v1\/encounters\/([^/]+)/);
    if (encMatch) {
      const encId = encMatch[1];
      if (path.endsWith("/complete") && method === "POST") {
        const { data, error } = await db.from("pct_encounters")
          .update({ status: "COMPLETED", ended_at: new Date().toISOString() })
          .eq("pct_encounter_id", encId).select().single();
        if (error) return err("DB_ERROR", error.message, 500, ctx);
        await emitOutbox(db, ctx, "encounter", encId, "pct.encounter.completed", data);
        return ok(data, ctx);
      }
    }

    if (path.match(/^\/v1\/patient\/([^/]+)\/timeline/) && method === "GET") {
      const cpid = path.match(/^\/v1\/patient\/([^/]+)\/timeline/)![1];
      const { data: journeys } = await db.from("pct_journeys").select("*").eq("tenant_id", ctx.tenantId).eq("patient_cpid", cpid).order("created_at", { ascending: false }).limit(20);
      const journeyIds = (journeys || []).map((j: { journey_id: string }) => j.journey_id);
      let encounters: unknown[] = [];
      let queueItems: unknown[] = [];
      let admissions: unknown[] = [];
      if (journeyIds.length > 0) {
        const { data: enc } = await db.from("pct_encounters").select("*").in("journey_id", journeyIds);
        encounters = enc || [];
        const { data: qi } = await db.from("pct_queue_items").select("*").in("journey_id", journeyIds);
        queueItems = qi || [];
        const { data: adm } = await db.from("pct_admissions").select("*").in("journey_id", journeyIds);
        admissions = adm || [];
      }
      return ok({ journeys, encounters, queue_items: queueItems, admissions }, ctx);
    }

    // ===== E) ADMISSIONS / DISCHARGE / DEATH =====
    const admMatch = path.match(/^\/v1\/admissions\/([^/]+)/);
    if (admMatch) {
      const admId = admMatch[1];
      if (path.endsWith("/assign-bed") && method === "POST") {
        const body = await req.json();
        const { data } = await db.from("pct_admissions")
          .update({ bed_id: body.bed_id, status: "ADMITTED", admitted_at: new Date().toISOString(), approved_by_actor_id: ctx.actorId })
          .eq("admission_id", admId).select().single();
        await emitOutbox(db, ctx, "admission", admId, "pct.admission.updated", data);
        return ok(data, ctx);
      }
      if (path.endsWith("/transfer") && method === "POST") {
        const body = await req.json();
        const { data: adm } = await db.from("pct_admissions").select("*").eq("admission_id", admId).single();
        const { data: transfer } = await db.from("pct_transfers").insert({
          tenant_id: ctx.tenantId, journey_id: adm!.journey_id,
          from_json: { ward_id: adm!.ward_id, bed_id: adm!.bed_id },
          to_json: { ward_id: body.ward_id, bed_id: body.bed_id },
        }).select().single();
        await emitOutbox(db, ctx, "admission", admId, "pct.admission.updated", { transfer });
        return ok(transfer, ctx, 201);
      }
    }

    const dcMatch = path.match(/^\/v1\/discharge\/([^/]+)/);
    if (dcMatch) {
      const caseId = dcMatch[1];
      if (path.endsWith("/status") && method === "GET") {
        const { data } = await db.from("pct_discharge_cases").select("*").eq("case_id", caseId).single();
        return ok(data, ctx);
      }
      if (path.endsWith("/clear-blocker") && method === "POST") {
        const body = await req.json();
        const { data: dc } = await db.from("pct_discharge_cases").select("*").eq("case_id", caseId).single();
        const blockers = ((dc?.blockers_json as unknown[]) || []).filter((b: any) => b.type !== body.blocker_type);
        const newStatus = blockers.length === 0 ? "CLEARED" : "BLOCKED";
        const { data } = await db.from("pct_discharge_cases")
          .update({ blockers_json: blockers, status: newStatus, ...(newStatus === "CLEARED" ? {} : {}) })
          .eq("case_id", caseId).select().single();
        const eventType = newStatus === "CLEARED" ? "pct.discharge.cleared" : "pct.discharge.blocked";
        await emitOutbox(db, ctx, "discharge", caseId, eventType, data);
        if (newStatus === "CLEARED") {
          // Auto-complete discharge
          await db.from("pct_discharge_cases").update({ status: "COMPLETED", closed_at: new Date().toISOString() }).eq("case_id", caseId);
          await db.from("pct_journeys").update({ state: "DISCHARGED", updated_at: new Date().toISOString() }).eq("journey_id", dc!.journey_id);
          await emitOutbox(db, ctx, "discharge", caseId, "pct.discharge.completed", { case_id: caseId });
        }
        return ok(data, ctx);
      }
    }

    // ===== F) OPS / CONTROL TOWER =====
    if (path === "/v1/ops/control-tower" && method === "GET") {
      const facilityId = url.searchParams.get("facilityId") || ctx.facilityId || "";
      const { data: queues } = await db.from("pct_queues").select("*").eq("tenant_id", ctx.tenantId).eq("facility_id", facilityId).eq("is_active", true);
      const queueIds = (queues || []).map((q: { queue_id: string }) => q.queue_id);
      let queueStats: unknown[] = [];
      if (queueIds.length > 0) {
        const { data: items } = await db.from("pct_queue_items").select("*").in("queue_id", queueIds).in("status", ["WAITING", "CALLED", "IN_SERVICE"]);
        queueStats = (queues || []).map((q: any) => {
          const qItems = (items || []).filter((i: any) => i.queue_id === q.queue_id);
          return { ...q, waiting: qItems.filter((i: any) => i.status === "WAITING").length, called: qItems.filter((i: any) => i.status === "CALLED").length, in_service: qItems.filter((i: any) => i.status === "IN_SERVICE").length };
        });
      }
      const { data: alerts } = await db.from("pct_alerts").select("*").eq("tenant_id", ctx.tenantId).eq("facility_id", facilityId).eq("status", "OPEN").order("created_at", { ascending: false }).limit(20);
      const { data: admissions } = await db.from("pct_admissions").select("*").eq("tenant_id", ctx.tenantId).in("status", ["ADMITTED", "TRANSFER_PENDING"]);
      const { data: discharges } = await db.from("pct_discharge_cases").select("*").eq("tenant_id", ctx.tenantId).in("status", ["STARTED", "BLOCKED"]);

      // Simple bottleneck detection: items waiting > 30 min
      const now = Date.now();
      const stuckItems = queueStats.length > 0 ? (await db.from("pct_queue_items").select("*").in("queue_id", queueIds).eq("status", "WAITING")).data?.filter((i: any) => (now - new Date(i.enqueued_at).getTime()) > 30 * 60 * 1000) || [] : [];
      if (stuckItems.length > 0) {
        await emitTelemetry(db, ctx, "STUCK_ITEM", { count: stuckItems.length, items: stuckItems.map((i: any) => i.item_id) });
      }

      return ok({ queues: queueStats, alerts: alerts || [], admissions: admissions || [], pending_discharges: discharges || [], stuck_items: stuckItems.length }, ctx);
    }

    if (path === "/v1/ops/bottlenecks" && method === "GET") {
      const facilityId = url.searchParams.get("facilityId") || ctx.facilityId || "";
      const { data: items } = await db.from("pct_queue_items").select("*, pct_queues!inner(facility_id)")
        .eq("pct_queues.facility_id", facilityId).eq("status", "WAITING");
      const now = Date.now();
      const bottlenecks = (items || []).filter((i: any) => (now - new Date(i.enqueued_at).getTime()) > 20 * 60 * 1000)
        .map((i: any) => ({ ...i, wait_minutes: Math.round((now - new Date(i.enqueued_at).getTime()) / 60000) }));
      return ok({ bottlenecks }, ctx);
    }

    // ===== G) INTEGRATION WEBHOOKS =====
    if (path === "/v1/integrations/mushex/payment-status-changed" && method === "POST") {
      const body = await req.json();
      // Idempotency check
      const { data: existing } = await db.from("pct_integration_idempotency")
        .select("*").eq("tenant_id", ctx.tenantId).eq("correlation_id", ctx.correlationId).eq("event_type", "mushex.payment.status_changed").maybeSingle();
      if (existing) return ok({ status: "ALREADY_PROCESSED" }, ctx);

      await db.from("pct_integration_idempotency").insert({ tenant_id: ctx.tenantId, correlation_id: ctx.correlationId, event_type: "mushex.payment.status_changed" });
      await db.from("pct_mushex_payment_status").upsert({
        tenant_id: ctx.tenantId, journey_id: body.journey_id,
        status: body.status, amount_due: body.amount_due || 0,
        amount_paid: body.amount_paid || 0, correlation_id: ctx.correlationId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      // If cleared/waived, clear discharge blocker
      if (body.status === "CLEARED" || body.status === "WAIVED") {
        const { data: dc } = await db.from("pct_discharge_cases").select("*").eq("journey_id", body.journey_id).eq("tenant_id", ctx.tenantId).in("status", ["STARTED", "BLOCKED"]).maybeSingle();
        if (dc) {
          const blockers = ((dc.blockers_json as unknown[]) || []).filter((b: any) => b.type !== "BILLING_PAYMENT_PENDING");
          const newStatus = blockers.length === 0 ? "CLEARED" : "BLOCKED";
          await db.from("pct_discharge_cases").update({ blockers_json: blockers, status: newStatus }).eq("case_id", dc.case_id);
          await emitOutbox(db, ctx, "discharge", dc.case_id, newStatus === "CLEARED" ? "pct.discharge.cleared" : "pct.discharge.blocked", { blockers });
          if (newStatus === "CLEARED") {
            await db.from("pct_discharge_cases").update({ status: "COMPLETED", closed_at: new Date().toISOString() }).eq("case_id", dc.case_id);
            await db.from("pct_journeys").update({ state: "DISCHARGED", updated_at: new Date().toISOString() }).eq("journey_id", body.journey_id);
            await emitOutbox(db, ctx, "discharge", dc.case_id, "pct.discharge.completed", {});
          }
        }
      }
      return ok({ status: "PROCESSED" }, ctx);
    }

    if (path === "/v1/integrations/oros/order-status-changed" && method === "POST") {
      const body = await req.json();
      const { data: existing } = await db.from("pct_integration_idempotency")
        .select("*").eq("tenant_id", ctx.tenantId).eq("correlation_id", ctx.correlationId).eq("event_type", "oros.order.status_changed").maybeSingle();
      if (existing) return ok({ status: "ALREADY_PROCESSED" }, ctx);
      await db.from("pct_integration_idempotency").insert({ tenant_id: ctx.tenantId, correlation_id: ctx.correlationId, event_type: "oros.order.status_changed" });
      await emitOutbox(db, ctx, "integration", body.order_id || "unknown", "oros.order.status_changed", body);
      return ok({ status: "PROCESSED" }, ctx);
    }

    if (path === "/v1/integrations/oros/result-available" && method === "POST") {
      const body = await req.json();
      const { data: existing } = await db.from("pct_integration_idempotency")
        .select("*").eq("tenant_id", ctx.tenantId).eq("correlation_id", ctx.correlationId).eq("event_type", "oros.result.available").maybeSingle();
      if (existing) return ok({ status: "ALREADY_PROCESSED" }, ctx);
      await db.from("pct_integration_idempotency").insert({ tenant_id: ctx.tenantId, correlation_id: ctx.correlationId, event_type: "oros.result.available" });
      await emitOutbox(db, ctx, "integration", body.result_id || "unknown", "oros.result.available", body);
      return ok({ status: "PROCESSED" }, ctx);
    }

    if (path === "/v1/integrations/tuso/workspace-updated" && method === "POST") {
      const body = await req.json();
      const { data: existing } = await db.from("pct_integration_idempotency")
        .select("*").eq("tenant_id", ctx.tenantId).eq("correlation_id", ctx.correlationId).eq("event_type", "tuso.workspace.updated").maybeSingle();
      if (existing) return ok({ status: "ALREADY_PROCESSED" }, ctx);
      await db.from("pct_integration_idempotency").insert({ tenant_id: ctx.tenantId, correlation_id: ctx.correlationId, event_type: "tuso.workspace.updated" });
      await emitOutbox(db, ctx, "integration", body.workspace_id || "unknown", "tuso.workspace.updated", body);
      return ok({ status: "PROCESSED" }, ctx);
    }

    return err("NOT_FOUND", `Unknown route: ${method} ${path}`, 404, ctx);
  } catch (e) {
    console.error(`[${ctx.requestId}] Error:`, e);
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Internal error", 500, ctx);
  }
});
