import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/middleware.ts";

// ============================================================
// TUSO v1 — Facility Operations Service (Edge Function)
// Executable reference brief for human dev stream
// ============================================================

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface KernelCtx {
  tenantId: string;
  podId: string;
  requestId: string;
  correlationId: string;
  actorId: string;
  actorType: string;
  purposeOfUse: string;
  deviceFingerprint: string;
  facilityId?: string;
  workspaceId?: string;
  shiftId?: string;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function errorResponse(code: string, message: string, status: number, ctx: Partial<KernelCtx>, details: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({
    error: { code, message, details, request_id: ctx.requestId || "", correlation_id: ctx.correlationId || "" }
  }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": ctx.requestId || "", "X-Correlation-ID": ctx.correlationId || "" }
  });
}

function successResponse(body: unknown, ctx: KernelCtx, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": ctx.requestId, "X-Correlation-ID": ctx.correlationId }
  });
}

function extractContext(req: Request): { ctx: KernelCtx | null; error: Response | null } {
  const requestId = req.headers.get("x-request-id") || generateUUID();
  const correlationId = req.headers.get("x-correlation-id") || generateUUID();
  const partial = { requestId, correlationId };

  const required: Record<string, string | null> = {
    "X-Tenant-Id": req.headers.get("x-tenant-id"),
    "X-Correlation-Id": correlationId,
    "X-Device-Fingerprint": req.headers.get("x-device-fingerprint"),
    "X-Purpose-Of-Use": req.headers.get("x-purpose-of-use"),
    "X-Actor-Id": req.headers.get("x-actor-id"),
    "X-Actor-Type": req.headers.get("x-actor-type"),
  };

  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    return { ctx: null, error: errorResponse("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, partial, { missing_headers: missing }) };
  }

  return {
    ctx: {
      tenantId: required["X-Tenant-Id"]!,
      podId: req.headers.get("x-pod-id") || "national",
      requestId, correlationId,
      actorId: required["X-Actor-Id"]!,
      actorType: required["X-Actor-Type"]!,
      purposeOfUse: required["X-Purpose-Of-Use"]!,
      deviceFingerprint: required["X-Device-Fingerprint"]!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
    },
    error: null
  };
}

async function getConfig(db: any, tenantId: string) {
  const { data } = await db.from("tuso_config").select("*").eq("tenant_id", tenantId).single();
  return data || { emit_mode: "DUAL", zibo_mode: "LENIENT", gofr_enabled: false, spine_status: "ONLINE" };
}

async function writeAudit(db: any, ctx: KernelCtx, action: string, details: Record<string, unknown> = {}) {
  await db.from("vito_audit_log").insert({
    tenant_id: ctx.tenantId,
    action,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    details,
  }).then(() => {});
}

async function emitEvent(db: any, ctx: KernelCtx, config: any, eventType: string, payload: Record<string, unknown>) {
  if (config.emit_mode === "LEGACY_ONLY") return;
  await db.from("vito_event_envelopes").insert({
    schema_version: 1,
    event_id: generateUUID(),
    producer: "tuso-service",
    event_type: `tuso.${eventType}`,
    occurred_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse,
    payload,
  });
}

async function validateCode(db: any, config: any, codeSystem: string, code: string): Promise<{ valid: boolean; status: string }> {
  const { data } = await db.from("tuso_code_sets").select("*").eq("code_system", codeSystem).eq("code", code).eq("active", true).single();
  if (data) return { valid: true, status: "VALID" };
  if (config.zibo_mode === "STRICT") return { valid: false, status: "INVALID" };
  return { valid: true, status: "UNVALIDATED" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, error } = extractContext(req);
  if (!ctx) return error!;

  const db = createClient(supabaseUrl, supabaseKey);
  const config = await getConfig(db, ctx.tenantId);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/tuso-v1\/?/, "");
  const method = req.method;

  try {
    // ---- FACILITIES ----
    if (path === "facilities" && method === "GET") {
      const { data } = await db.from("tuso_facilities").select("*").eq("tenant_id", ctx.tenantId).order("name");
      return successResponse({ facilities: data || [] }, ctx);
    }

    if (path === "facilities" && method === "POST") {
      const body = await req.json();
      let validationStatus = "UNVALIDATED";
      if (body.type_code) {
        const v = await validateCode(db, config, "facility-type", body.type_code);
        if (!v.valid) return errorResponse("INVALID_CODE", `Invalid type_code: ${body.type_code}`, 422, ctx);
        validationStatus = v.status;
      }
      const { data, error: e } = await db.from("tuso_facilities").insert({ ...body, tenant_id: ctx.tenantId }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "facility.created", { facility_id: data.id });
      await emitEvent(db, ctx, config, "facility.created", { op: "create", after: data });
      // Version record
      await db.from("tuso_facility_versions").insert({
        facility_id: data.id, tenant_id: ctx.tenantId, version_no: 1,
        changed_fields: Object.keys(body), after: data, changed_by_actor_id: ctx.actorId
      });
      return successResponse(data, ctx, 201);
    }

    const facilityMatch = path.match(/^facilities\/([^/]+)$/);
    if (facilityMatch && method === "PATCH") {
      const facilityId = facilityMatch[1];
      const body = await req.json();
      const { data: before } = await db.from("tuso_facilities").select("*").eq("id", facilityId).single();
      if (!before) return errorResponse("NOT_FOUND", "Facility not found", 404, ctx);
      const { data, error: e } = await db.from("tuso_facilities").update({ ...body, updated_at: new Date().toISOString() }).eq("id", facilityId).select().single();
      if (e) return errorResponse("UPDATE_FAILED", e.message, 500, ctx);
      const changedFields = Object.keys(body).filter(k => (before as any)[k] !== (body as any)[k]);
      const { data: versions } = await db.from("tuso_facility_versions").select("version_no").eq("facility_id", facilityId).order("version_no", { ascending: false }).limit(1);
      const nextVersion = (versions?.[0]?.version_no || 0) + 1;
      await db.from("tuso_facility_versions").insert({
        facility_id: facilityId, tenant_id: ctx.tenantId, version_no: nextVersion,
        changed_fields: changedFields, before, after: data, changed_by_actor_id: ctx.actorId
      });
      await writeAudit(db, ctx, "facility.updated", { facility_id: facilityId, changed_fields: changedFields });
      await emitEvent(db, ctx, config, "facility.updated", { op: "update", before, after: data, changed_fields: changedFields });
      return successResponse(data, ctx);
    }

    if (facilityMatch && method === "GET") {
      const { data } = await db.from("tuso_facilities").select("*").eq("id", facilityMatch[1]).single();
      if (!data) return errorResponse("NOT_FOUND", "Facility not found", 404, ctx);
      // Enrich with sub-records
      const [ids, geo, contacts, caps, readiness] = await Promise.all([
        db.from("tuso_facility_identifiers").select("*").eq("facility_id", data.id),
        db.from("tuso_facility_geo").select("*").eq("facility_id", data.id).single(),
        db.from("tuso_facility_contacts").select("*").eq("facility_id", data.id),
        db.from("tuso_facility_capabilities").select("*").eq("facility_id", data.id),
        db.from("tuso_facility_readiness").select("*").eq("facility_id", data.id).single(),
      ]);
      return successResponse({ ...data, identifiers: ids.data, geo: geo.data, contacts: contacts.data, capabilities: caps.data, readiness: readiness.data }, ctx);
    }

    // ---- FACILITY MERGES ----
    if (path === "facilities/merge" && method === "POST") {
      if (config.spine_status !== "ONLINE") {
        await writeAudit(db, ctx, "facility.merge.denied", { reason: "spine_offline", spine_status: config.spine_status });
        await emitEvent(db, ctx, config, "facility.merge.denied", { reason: "spine_offline" });
        return errorResponse("FEDERATION_AUTHORITY_UNAVAILABLE", `Spine status: ${config.spine_status}. Merge requires ONLINE.`, 503, ctx);
      }
      const body = await req.json();
      const { data, error: e } = await db.from("tuso_facility_merges").insert({ ...body, tenant_id: ctx.tenantId }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "facility.merge.requested", { merge_id: data.id });
      await emitEvent(db, ctx, config, "facility.merge.requested", { op: "create", after: data });
      return successResponse(data, ctx, 201);
    }

    // ---- WORKSPACES ----
    const wsListMatch = path.match(/^facilities\/([^/]+)\/workspaces$/);
    if (wsListMatch && method === "GET") {
      const { data } = await db.from("tuso_workspaces").select("*").eq("facility_id", wsListMatch[1]).eq("tenant_id", ctx.tenantId);
      return successResponse({ workspaces: data || [] }, ctx);
    }
    if (wsListMatch && method === "POST") {
      const body = await req.json();
      const { data, error: e } = await db.from("tuso_workspaces").insert({ ...body, facility_id: wsListMatch[1], tenant_id: ctx.tenantId }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "workspace.created", { workspace_id: data.id });
      await emitEvent(db, ctx, config, "workspace.created", { op: "create", after: data });
      return successResponse(data, ctx, 201);
    }

    const wsMatch = path.match(/^workspaces\/([^/]+)$/);
    if (wsMatch && method === "GET") {
      const { data } = await db.from("tuso_workspaces").select("*").eq("id", wsMatch[1]).single();
      if (!data) return errorResponse("NOT_FOUND", "Workspace not found", 404, ctx);
      const { data: rules } = await db.from("tuso_workspace_rules").select("*").eq("workspace_id", wsMatch[1]);
      return successResponse({ ...data, rules: rules || [] }, ctx);
    }
    if (wsMatch && method === "PUT") {
      const body = await req.json();
      const { data, error: e } = await db.from("tuso_workspaces").update({ ...body, updated_at: new Date().toISOString() }).eq("id", wsMatch[1]).select().single();
      if (e) return errorResponse("UPDATE_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "workspace.updated", { workspace_id: data.id });
      return successResponse(data, ctx);
    }

    const wsOverrideMatch = path.match(/^workspaces\/([^/]+)\/override$/);
    if (wsOverrideMatch && method === "POST") {
      const body = await req.json();
      if (!body.override_reason) return errorResponse("MISSING_OVERRIDE_REASON", "override_reason is required", 400, ctx);
      const { data, error: e } = await db.from("tuso_workspace_overrides").insert({
        workspace_id: wsOverrideMatch[1], tenant_id: ctx.tenantId,
        actor_id: ctx.actorId, actor_type: ctx.actorType,
        override_reason: body.override_reason, override_payload: body.override_payload || {},
        facility_id: ctx.facilityId || null,
      }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "workspace.override", { workspace_id: wsOverrideMatch[1], reason: body.override_reason });
      await emitEvent(db, ctx, config, "workspace.override", { op: "override", after: data });
      return successResponse(data, ctx, 201);
    }

    // ---- START SHIFT ----
    const shiftOptionsMatch = path.match(/^facilities\/([^/]+)\/start-shift\/options$/);
    if (shiftOptionsMatch && method === "GET") {
      const providerId = url.searchParams.get("providerId") || ctx.actorId;
      const facilityId = shiftOptionsMatch[1];
      // Get all active workspaces
      const { data: workspaces } = await db.from("tuso_workspaces").select("*").eq("facility_id", facilityId).eq("active", true);
      // Check eligibility stubs
      const { data: eligibility } = await db.from("tuso_provider_workspace_eligibility")
        .select("workspace_id, eligible, reason").eq("provider_id", providerId);
      const eligMap = new Map((eligibility || []).map((e: any) => [e.workspace_id, e]));
      const options = (workspaces || []).map((w: any) => {
        const elig = eligMap.get(w.id);
        return { ...w, eligible: elig ? elig.eligible : true, eligibility_reason: elig?.reason || null };
      });
      return successResponse({ options }, ctx);
    }

    const shiftStartMatch = path.match(/^facilities\/([^/]+)\/start-shift$/);
    if (shiftStartMatch && method === "POST") {
      const body = await req.json();
      const { data: shift, error: e } = await db.from("tuso_shifts").insert({
        tenant_id: ctx.tenantId, facility_id: shiftStartMatch[1],
        actor_id: ctx.actorId, status: "ACTIVE",
      }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      if (body.workspace_ids?.length) {
        await db.from("tuso_shift_workspace_assignments").insert(
          body.workspace_ids.map((wid: string) => ({ shift_id: shift.id, workspace_id: wid }))
        );
      }
      await writeAudit(db, ctx, "shift.started", { shift_id: shift.id, facility_id: shiftStartMatch[1] });
      await emitEvent(db, ctx, config, "shift.started", { op: "create", after: shift });
      return successResponse(shift, ctx, 201);
    }

    // ---- RESOURCES & BOOKINGS ----
    const resListMatch = path.match(/^facilities\/([^/]+)\/resources$/);
    if (resListMatch && method === "GET") {
      const { data } = await db.from("tuso_resources").select("*").eq("facility_id", resListMatch[1]);
      return successResponse({ resources: data || [] }, ctx);
    }
    if (resListMatch && method === "POST") {
      const body = await req.json();
      const { data, error: e } = await db.from("tuso_resources").insert({ ...body, facility_id: resListMatch[1], tenant_id: ctx.tenantId }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "resource.created", { resource_id: data.id });
      return successResponse(data, ctx, 201);
    }

    const bookingMatch = path.match(/^resources\/([^/]+)\/bookings$/);
    if (bookingMatch && method === "POST") {
      const body = await req.json();
      // Conflict detection
      const { data: conflicts } = await db.from("tuso_bookings")
        .select("id").eq("resource_id", bookingMatch[1]).eq("status", "CONFIRMED")
        .lt("start_at", body.end_at).gt("end_at", body.start_at);
      if (conflicts && conflicts.length > 0) {
        return errorResponse("BOOKING_CONFLICT", "Time slot conflicts with existing booking", 409, ctx, { conflicting_ids: conflicts.map((c: any) => c.id) });
      }
      const { data, error: e } = await db.from("tuso_bookings").insert({
        ...body, resource_id: bookingMatch[1], tenant_id: ctx.tenantId, booked_by_actor_id: ctx.actorId,
      }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "booking.created", { booking_id: data.id });
      await emitEvent(db, ctx, config, "booking.created", { op: "create", after: data });
      return successResponse(data, ctx, 201);
    }
    if (bookingMatch && method === "GET") {
      const { data } = await db.from("tuso_bookings").select("*").eq("resource_id", bookingMatch[1]).order("start_at");
      return successResponse({ bookings: data || [] }, ctx);
    }

    const bookingDeleteMatch = path.match(/^bookings\/([^/]+)$/);
    if (bookingDeleteMatch && method === "DELETE") {
      const { error: e } = await db.from("tuso_bookings").update({ status: "CANCELLED" }).eq("id", bookingDeleteMatch[1]);
      if (e) return errorResponse("DELETE_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "booking.cancelled", { booking_id: bookingDeleteMatch[1] });
      return successResponse({ cancelled: true }, ctx);
    }

    // ---- CONFIG ----
    const configEffMatch = path.match(/^facilities\/([^/]+)\/config\/effective$/);
    if (configEffMatch && method === "GET") {
      const facilityId = configEffMatch[1];
      const [tenantDef, facilityVer, wsOverrides] = await Promise.all([
        db.from("tuso_config_tenant_defaults").select("config_json").eq("tenant_id", ctx.tenantId).order("version", { ascending: false }).limit(1),
        db.from("tuso_config_facility_versions").select("config_json, version").eq("facility_id", facilityId).order("version", { ascending: false }).limit(1),
        db.from("tuso_config_workspace_overrides").select("workspace_id, config_json").eq("tenant_id", ctx.tenantId),
      ]);
      const effective = {
        ...(tenantDef.data?.[0]?.config_json || {}),
        ...(facilityVer.data?.[0]?.config_json || {}),
      };
      return successResponse({
        effective, facility_version: facilityVer.data?.[0]?.version || 0,
        workspace_overrides: wsOverrides.data || [],
      }, ctx);
    }

    const configPutMatch = path.match(/^facilities\/([^/]+)\/config$/);
    if (configPutMatch && method === "PUT") {
      const body = await req.json();
      const { data: prev } = await db.from("tuso_config_facility_versions").select("version").eq("facility_id", configPutMatch[1]).order("version", { ascending: false }).limit(1);
      const nextVer = (prev?.[0]?.version || 0) + 1;
      const { data, error: e } = await db.from("tuso_config_facility_versions").insert({
        facility_id: configPutMatch[1], tenant_id: ctx.tenantId,
        version: nextVer, config_json: body.config_json || body, created_by: ctx.actorId,
      }).select().single();
      if (e) return errorResponse("INSERT_FAILED", e.message, 500, ctx);
      await writeAudit(db, ctx, "config.updated", { facility_id: configPutMatch[1], version: nextVer });
      return successResponse(data, ctx, 201);
    }

    const configHistMatch = path.match(/^facilities\/([^/]+)\/config\/history$/);
    if (configHistMatch && method === "GET") {
      const { data } = await db.from("tuso_config_facility_versions").select("*").eq("facility_id", configHistMatch[1]).order("version", { ascending: false });
      return successResponse({ versions: data || [] }, ctx);
    }

    const configRollbackMatch = path.match(/^facilities\/([^/]+)\/config\/rollback$/);
    if (configRollbackMatch && method === "POST") {
      const body = await req.json();
      const targetVersion = body.target_version;
      const { data: target } = await db.from("tuso_config_facility_versions").select("config_json")
        .eq("facility_id", configRollbackMatch[1]).eq("version", targetVersion).single();
      if (!target) return errorResponse("NOT_FOUND", "Target version not found", 404, ctx);
      const { data: prev } = await db.from("tuso_config_facility_versions").select("version").eq("facility_id", configRollbackMatch[1]).order("version", { ascending: false }).limit(1);
      const nextVer = (prev?.[0]?.version || 0) + 1;
      const { data } = await db.from("tuso_config_facility_versions").insert({
        facility_id: configRollbackMatch[1], tenant_id: ctx.tenantId,
        version: nextVer, config_json: target.config_json, created_by: ctx.actorId,
      }).select().single();
      await writeAudit(db, ctx, "config.rollback", { facility_id: configRollbackMatch[1], from_version: prev?.[0]?.version, to_version: targetVersion });
      return successResponse(data, ctx, 201);
    }

    // ---- TELEMETRY ----
    if (path === "telemetry/pct" && method === "POST") {
      const body = await req.json();
      await db.from("tuso_telemetry_events").insert({ tenant_id: ctx.tenantId, source: "PCT", facility_id: body.facility_id, payload_json: body });
      if (body.occupied_beds !== undefined) {
        await db.from("tuso_occupancy_snapshots").insert({
          tenant_id: ctx.tenantId, facility_id: body.facility_id,
          occupied_beds: body.occupied_beds, total_beds: body.total_beds || 0, source: "PCT",
        });
      }
      // Simple alert rule check
      if (body.total_beds > 0 && body.occupied_beds / body.total_beds > 0.9) {
        await db.from("tuso_control_tower_alerts").insert({
          tenant_id: ctx.tenantId, facility_id: body.facility_id,
          alert_type: "HIGH_OCCUPANCY", severity: "WARNING",
          message: `Bed occupancy at ${Math.round(body.occupied_beds / body.total_beds * 100)}%`,
        });
      }
      return successResponse({ ingested: true }, ctx);
    }

    if (path === "telemetry/oros" && method === "POST") {
      const body = await req.json();
      await db.from("tuso_telemetry_events").insert({ tenant_id: ctx.tenantId, source: "OROS", facility_id: body.facility_id, payload_json: body });
      // Check queue thresholds
      if (body.queue_wait_minutes && body.queue_wait_minutes > 60) {
        await db.from("tuso_control_tower_alerts").insert({
          tenant_id: ctx.tenantId, facility_id: body.facility_id,
          alert_type: "QUEUE_WAIT_EXCEEDED", severity: "WARNING",
          message: `Queue wait time: ${body.queue_wait_minutes} minutes`,
        });
      }
      return successResponse({ ingested: true }, ctx);
    }

    // ---- CONTROL TOWER ----
    const ctSummaryMatch = path.match(/^control-tower\/facilities\/([^/]+)\/summary$/);
    if (ctSummaryMatch && method === "GET") {
      const fId = ctSummaryMatch[1];
      const [facility, occupancy, alerts, resources] = await Promise.all([
        db.from("tuso_facilities").select("*").eq("id", fId).single(),
        db.from("tuso_occupancy_snapshots").select("*").eq("facility_id", fId).order("captured_at", { ascending: false }).limit(1),
        db.from("tuso_control_tower_alerts").select("*").eq("facility_id", fId).eq("status", "OPEN").order("created_at", { ascending: false }),
        db.from("tuso_resources").select("*").eq("facility_id", fId),
      ]);
      return successResponse({
        facility: facility.data,
        latest_occupancy: occupancy.data?.[0] || null,
        open_alerts: alerts.data || [],
        resources: resources.data || [],
      }, ctx);
    }

    if (path === "control-tower/alerts" && method === "GET") {
      const status = url.searchParams.get("status") || "OPEN";
      let query = db.from("tuso_control_tower_alerts").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status);
      const { data } = await query.limit(100);
      return successResponse({ alerts: data || [] }, ctx);
    }

    const alertResolveMatch = path.match(/^control-tower\/alerts\/([^/]+)\/resolve$/);
    if (alertResolveMatch && method === "POST") {
      const { data } = await db.from("tuso_control_tower_alerts").update({ status: "RESOLVED", resolved_at: new Date().toISOString() }).eq("id", alertResolveMatch[1]).select().single();
      await writeAudit(db, ctx, "alert.resolved", { alert_id: alertResolveMatch[1] });
      return successResponse(data, ctx);
    }

    // ---- GOFR SYNC ----
    if (path === "gofr/sync" && method === "POST") {
      if (!config.gofr_enabled) return errorResponse("GOFR_DISABLED", "GOFR integration is disabled for this tenant", 400, ctx);
      const body = await req.json();
      const { data } = await db.from("tuso_gofr_sync_log").insert({
        tenant_id: ctx.tenantId, direction: body.direction || "IMPORT", status: "PENDING",
      }).select().single();
      // Simulate — in production this triggers actual sync
      await db.from("tuso_gofr_sync_log").update({ status: "COMPLETED", records_processed: 0, completed_at: new Date().toISOString() }).eq("id", data.id);
      return successResponse(data, ctx, 201);
    }

    if (path === "gofr/sync-log" && method === "GET") {
      const { data } = await db.from("tuso_gofr_sync_log").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(50);
      return successResponse({ sync_log: data || [] }, ctx);
    }

    // ---- CALENDAR SLOTS ----
    const calendarSlotsMatch = path.match(/^facilities\/([^/]+)\/calendars\/slots$/);
    if (calendarSlotsMatch && method === "GET") {
      const fId = calendarSlotsMatch[1];
      const { data: resources } = await db.from("tuso_resources").select("id, name, type_code, status").eq("facility_id", fId).eq("status", "AVAILABLE");
      const { data: bookings } = await db.from("tuso_bookings").select("resource_id, start_at, end_at, status, reason")
        .in("resource_id", (resources || []).map((r: any) => r.id)).eq("status", "CONFIRMED");
      return successResponse({ resources: resources || [], bookings: bookings || [] }, ctx);
    }

    return errorResponse("ROUTE_NOT_FOUND", `No handler for ${method} ${path}`, 404, ctx);
  } catch (err) {
    console.error(`[${ctx.requestId}] Error:`, err);
    return errorResponse("INTERNAL_ERROR", err instanceof Error ? err.message : "Unknown error", 500, ctx);
  }
});
