/**
 * VITO v1.1 — Edge Function (Executable Reference Brief)
 *
 * Endpoints:
 *   POST /patients          — create identity ref (no PII)
 *   PATCH /patients/:id     — update identity ref
 *   POST /patients/merge    — merge (federation guard + idempotency)
 *   GET  /events            — query event envelopes
 *   GET  /audit             — query audit entries
 *   GET  /config            — read emit_mode + spine_status
 *   PATCH /config           — update config
 *
 * Enforces: mandatory headers, idempotency, event envelope, dual emit, federation guard.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

// ── Types ──────────────────────────────────────────────────

interface VitoContext {
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

// ── Helpers ────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  ctx: Partial<VitoContext>,
  details: Record<string, unknown> = {}
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        details,
        request_id: ctx.requestId ?? "",
        correlation_id: ctx.correlationId ?? "",
      },
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

function jsonResponse(body: unknown, ctx: VitoContext, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Request-ID": ctx.requestId,
      "X-Correlation-ID": ctx.correlationId,
    },
  });
}

// ── Header extraction + validation ─────────────────────────

const MANDATORY_HEADERS = [
  "x-tenant-id",
  "x-pod-id",
  "x-device-fingerprint",
  "x-purpose-of-use",
  "x-actor-id",
  "x-actor-type",
];

function extractContext(req: Request): { ctx: VitoContext | null; err: Response | null } {
  const requestId = req.headers.get("x-request-id") || uuid();
  const correlationId = req.headers.get("x-correlation-id") || uuid();
  const partial: Partial<VitoContext> = { requestId, correlationId };

  const missing: string[] = [];
  for (const h of MANDATORY_HEADERS) {
    if (!req.headers.get(h)) missing.push(h);
  }
  if (missing.length > 0) {
    return {
      ctx: null,
      err: errorResponse(
        "MISSING_REQUIRED_HEADER",
        `Missing required headers: ${missing.join(", ")}`,
        400,
        partial,
        { missing_headers: missing }
      ),
    };
  }

  return {
    ctx: {
      tenantId: req.headers.get("x-tenant-id")!,
      podId: req.headers.get("x-pod-id")!,
      requestId,
      correlationId,
      actorId: req.headers.get("x-actor-id")!,
      actorType: req.headers.get("x-actor-type")!,
      purposeOfUse: req.headers.get("x-purpose-of-use")!,
      deviceFingerprint: req.headers.get("x-device-fingerprint")!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
    },
    err: null,
  };
}

// ── SHA-256 for idempotency ────────────────────────────────

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce<Record<string, unknown>>((s, k) => {
        s[k] = (v as Record<string, unknown>)[k];
        return s;
      }, {});
    }
    return v;
  });
}

// ── DB client ──────────────────────────────────────────────

function db() {
  return createClient(supabaseUrl, serviceKey);
}

// ── Config helpers ─────────────────────────────────────────

async function getConfig(tenantId: string, key: string): Promise<string | null> {
  const { data } = await db()
    .from("vito_config")
    .select("config_value")
    .eq("tenant_id", tenantId)
    .eq("config_key", key)
    .single();
  return data?.config_value ?? null;
}

// ── Audit helper ───────────────────────────────────────────

async function writeAudit(ctx: VitoContext, action: string, decision: string, resourceType?: string, resourceId?: string, details?: Record<string, unknown>) {
  await db().from("vito_audit_log").insert({
    tenant_id: ctx.tenantId,
    action,
    decision,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse,
    resource_type: resourceType,
    resource_id: resourceId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    pod_id: ctx.podId,
    facility_id: ctx.facilityId,
    details: details || {},
  });
}

// ── Event envelope helper ──────────────────────────────────

async function writeEventEnvelope(
  ctx: VitoContext,
  eventType: string,
  subjectId: string,
  payload: Record<string, unknown>,
  emitMode: string
) {
  if (emitMode === "LEGACY_ONLY") {
    // Write legacy audit only, no v1.1 envelope
    await writeAudit(ctx, `legacy.${eventType}`, "SYSTEM", "patient", subjectId, payload);
    return;
  }

  // Enforce event_type prefix
  if (!eventType.startsWith("vito.")) {
    throw new Error(`event_type must start with "vito." — got "${eventType}"`);
  }

  const envelope = {
    schema_version: 1,
    event_id: uuid(),
    producer: "vito-service",
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse,
    subject_type: "patient",
    subject_id: subjectId,
    payload,
  };

  await db().from("vito_event_envelopes").insert(envelope);

  if (emitMode === "DUAL") {
    // Also write legacy-style audit
    await writeAudit(ctx, `legacy.${eventType}`, "SYSTEM", "patient", subjectId, payload);
  }
}

// ── Idempotency check ──────────────────────────────────────

async function checkIdempotency(
  ctx: VitoContext,
  idempotencyKey: string,
  endpoint: string,
  body: unknown
): Promise<{ action: "proceed" | "cached" | "conflict"; cached?: { status: number; body: unknown } }> {
  const hash = await sha256(canonicalJson(body));
  const { data: existing } = await db()
    .from("vito_idempotency_keys")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (!existing) {
    // Store new
    await db().from("vito_idempotency_keys").insert({
      tenant_id: ctx.tenantId,
      actor_id: ctx.actorId,
      endpoint,
      idempotency_key: idempotencyKey,
      request_hash: hash,
    });
    return { action: "proceed" };
  }

  if (existing.request_hash === hash) {
    return {
      action: "cached",
      cached: { status: existing.response_status || 200, body: existing.response_body },
    };
  }

  return { action: "conflict" };
}

async function storeIdempotencyResult(tenantId: string, key: string, status: number, body: unknown) {
  await db()
    .from("vito_idempotency_keys")
    .update({ response_status: status, response_body: body })
    .eq("tenant_id", tenantId)
    .eq("idempotency_key", key);
}

// ── Route handlers ─────────────────────────────────────────

async function handleCreatePatient(req: Request, ctx: VitoContext): Promise<Response> {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return errorResponse("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required for mutating requests", 400, ctx);
  }

  const body = await req.json();
  const { health_id, crid, cpid } = body;
  if (!health_id) {
    return errorResponse("INVALID_REQUEST", "health_id is required", 400, ctx);
  }

  const idem = await checkIdempotency(ctx, idempotencyKey, "POST /patients", body);
  if (idem.action === "cached") return jsonResponse(idem.cached!.body, ctx, idem.cached!.status);
  if (idem.action === "conflict") {
    await writeAudit(ctx, "idempotency.conflict", "DENY", "patient", health_id);
    return errorResponse("IDEMPOTENCY_CONFLICT", "Idempotency-Key already used with a different request body", 409, ctx, { idempotency_key: idempotencyKey });
  }

  const { data, error } = await db().from("vito_patients").insert({
    tenant_id: ctx.tenantId,
    health_id,
    crid: crid || null,
    cpid: cpid || null,
    created_by: ctx.actorId,
  }).select().single();

  if (error) {
    if (error.code === "23505") {
      return errorResponse("IDENTITY_CONFLICT", `Patient with health_id ${health_id} already exists`, 409, ctx);
    }
    return errorResponse("INTERNAL_ERROR", error.message, 500, ctx);
  }

  const emitMode = (await getConfig(ctx.tenantId, "emit_mode")) || "DUAL";
  await writeEventEnvelope(ctx, "vito.patient.created", health_id, {
    op: "CREATE", before: null, after: { health_id, crid, cpid }, changed_fields: ["*"],
  }, emitMode);
  await writeAudit(ctx, "vito.patient.create", "SYSTEM", "patient", health_id);

  const responseBody = { patient: data, action: "created" };
  await storeIdempotencyResult(ctx.tenantId, idempotencyKey, 201, responseBody);
  return jsonResponse(responseBody, ctx, 201);
}

async function handleUpdatePatient(req: Request, ctx: VitoContext, healthId: string): Promise<Response> {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return errorResponse("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required for mutating requests", 400, ctx);
  }

  const body = await req.json();
  const idem = await checkIdempotency(ctx, idempotencyKey, `PATCH /patients/${healthId}`, body);
  if (idem.action === "cached") return jsonResponse(idem.cached!.body, ctx, idem.cached!.status);
  if (idem.action === "conflict") {
    return errorResponse("IDEMPOTENCY_CONFLICT", "Idempotency-Key already used with a different request body", 409, ctx, { idempotency_key: idempotencyKey });
  }

  // Get before state
  const { data: before } = await db().from("vito_patients")
    .select("*").eq("tenant_id", ctx.tenantId).eq("health_id", healthId).single();

  if (!before) {
    return errorResponse("NOT_FOUND", `Patient ${healthId} not found`, 404, ctx);
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const changedFields: string[] = [];
  for (const key of ["crid", "cpid", "status"]) {
    if (body[key] !== undefined && body[key] !== before[key]) {
      updates[key] = body[key];
      changedFields.push(key);
    }
  }

  const { data: after, error } = await db().from("vito_patients")
    .update(updates).eq("id", before.id).select().single();

  if (error) return errorResponse("INTERNAL_ERROR", error.message, 500, ctx);

  const emitMode = (await getConfig(ctx.tenantId, "emit_mode")) || "DUAL";
  await writeEventEnvelope(ctx, "vito.patient.updated", healthId, {
    op: "UPDATE", before: { health_id: healthId, ...before }, after: { health_id: healthId, ...after }, changed_fields: changedFields,
  }, emitMode);
  await writeAudit(ctx, "vito.patient.update", "SYSTEM", "patient", healthId, { changed_fields: changedFields });

  const responseBody = { patient: after, action: "updated", changed_fields: changedFields };
  await storeIdempotencyResult(ctx.tenantId, idempotencyKey, 200, responseBody);
  return jsonResponse(responseBody, ctx);
}

async function handleMerge(req: Request, ctx: VitoContext): Promise<Response> {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return errorResponse("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required for mutating requests", 400, ctx);
  }

  const body = await req.json();
  const { survivor_health_id, merged_health_ids, reason } = body;

  if (!survivor_health_id || !merged_health_ids?.length || !reason) {
    return errorResponse("INVALID_REQUEST", "survivor_health_id, merged_health_ids, and reason are required", 400, ctx);
  }

  // Federation authority guard
  const spineStatus = (await getConfig(ctx.tenantId, "spine_status")) || "OFFLINE";
  if (spineStatus !== "ONLINE") {
    const emitMode = (await getConfig(ctx.tenantId, "emit_mode")) || "DUAL";
    await writeEventEnvelope(ctx, "vito.patient.merge.denied", survivor_health_id, {
      op: "MERGE", reason: "FEDERATION_AUTHORITY_UNAVAILABLE", spine_status: spineStatus,
    }, emitMode);
    await writeAudit(ctx, "vito.patient.merge.denied", "DENY", "patient", survivor_health_id, {
      reason: "FEDERATION_AUTHORITY_UNAVAILABLE", spine_status: spineStatus,
    });
    return errorResponse(
      "FEDERATION_AUTHORITY_UNAVAILABLE",
      `Patient merge requires spine_status=ONLINE. Current status: ${spineStatus}`,
      503,
      ctx,
      { spine_status: spineStatus }
    );
  }

  const idem = await checkIdempotency(ctx, idempotencyKey, "POST /patients/merge", body);
  if (idem.action === "cached") return jsonResponse(idem.cached!.body, ctx, idem.cached!.status);
  if (idem.action === "conflict") {
    return errorResponse("IDEMPOTENCY_CONFLICT", "Idempotency-Key already used with a different request body", 409, ctx, { idempotency_key: idempotencyKey });
  }

  // Create merge request
  const { data: mergeReq, error: mergeErr } = await db().from("vito_merge_requests").insert({
    tenant_id: ctx.tenantId,
    survivor_health_id,
    merged_health_ids,
    requested_by: ctx.actorId,
    reason,
    status: "approved",
    reviewed_by: ctx.actorId,
    reviewed_at: new Date().toISOString(),
    idempotency_key: idempotencyKey,
  }).select().single();

  if (mergeErr) return errorResponse("INTERNAL_ERROR", mergeErr.message, 500, ctx);

  // Create aliases
  for (const fromId of merged_health_ids) {
    await db().from("vito_patient_aliases").insert({
      tenant_id: ctx.tenantId,
      from_health_id: fromId,
      to_health_id: survivor_health_id,
      alias_type: "merge",
      merge_request_id: mergeReq.id,
    });
    // Mark merged patients as inactive
    await db().from("vito_patients")
      .update({ status: "merged", updated_at: new Date().toISOString() })
      .eq("tenant_id", ctx.tenantId)
      .eq("health_id", fromId);
  }

  const emitMode = (await getConfig(ctx.tenantId, "emit_mode")) || "DUAL";
  await writeEventEnvelope(ctx, "vito.patient.merged", survivor_health_id, {
    op: "MERGE", before: null, after: { survivor_health_id, merged_health_ids, reason },
    changed_fields: ["survivor_health_id", "merged_health_ids"],
  }, emitMode);
  await writeAudit(ctx, "vito.patient.merge", "SYSTEM", "patient", survivor_health_id, {
    merged_health_ids, reason,
  });

  const responseBody = { merge_request: mergeReq, action: "merged" };
  await storeIdempotencyResult(ctx.tenantId, idempotencyKey, 200, responseBody);
  return jsonResponse(responseBody, ctx);
}

async function handleGetEvents(req: Request, ctx: VitoContext): Promise<Response> {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id");
  const correlationId = url.searchParams.get("correlation_id");
  const eventType = url.searchParams.get("event_type");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  let query = db().from("vito_event_envelopes").select("*").eq("tenant_id", ctx.tenantId).order("occurred_at", { ascending: false }).limit(limit);
  if (requestId) query = query.eq("request_id", requestId);
  if (correlationId) query = query.eq("correlation_id", correlationId);
  if (eventType) query = query.eq("event_type", eventType);

  const { data, error } = await query;
  if (error) return errorResponse("INTERNAL_ERROR", error.message, 500, ctx);
  return jsonResponse({ events: data, count: data?.length || 0 }, ctx);
}

async function handleGetAudit(req: Request, ctx: VitoContext): Promise<Response> {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id");
  const correlationId = url.searchParams.get("correlation_id");
  const actorId = url.searchParams.get("actor_id");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  let query = db().from("vito_audit_log").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(limit);
  if (requestId) query = query.eq("request_id", requestId);
  if (correlationId) query = query.eq("correlation_id", correlationId);
  if (actorId) query = query.eq("actor_id", actorId);

  const { data, error } = await query;
  if (error) return errorResponse("INTERNAL_ERROR", error.message, 500, ctx);
  return jsonResponse({ audit_entries: data, count: data?.length || 0 }, ctx);
}

async function handleGetConfig(ctx: VitoContext): Promise<Response> {
  const { data } = await db().from("vito_config").select("*").eq("tenant_id", ctx.tenantId);
  const config: Record<string, string> = {};
  for (const row of data || []) config[row.config_key] = row.config_value;
  return jsonResponse({ config }, ctx);
}

async function handleUpdateConfig(req: Request, ctx: VitoContext): Promise<Response> {
  const body = await req.json();
  const { config_key, config_value } = body;
  if (!config_key || !config_value) {
    return errorResponse("INVALID_REQUEST", "config_key and config_value required", 400, ctx);
  }

  const validKeys: Record<string, string[]> = {
    emit_mode: ["LEGACY_ONLY", "V1_1_ONLY", "DUAL"],
    spine_status: ["ONLINE", "OFFLINE", "DEGRADED"],
  };

  if (validKeys[config_key] && !validKeys[config_key].includes(config_value)) {
    return errorResponse("INVALID_REQUEST", `${config_key} must be one of: ${validKeys[config_key].join(", ")}`, 400, ctx);
  }

  const { error } = await db().from("vito_config")
    .update({ config_value, updated_at: new Date().toISOString(), updated_by: ctx.actorId })
    .eq("tenant_id", ctx.tenantId).eq("config_key", config_key);

  if (error) return errorResponse("INTERNAL_ERROR", error.message, 500, ctx);

  await writeAudit(ctx, `vito.config.update.${config_key}`, "SYSTEM", "config", config_key, { new_value: config_value });
  return jsonResponse({ updated: true, config_key, config_value }, ctx);
}

// ── Router ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { ctx, err } = extractContext(req);
  if (!ctx) return err!;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/vito-v1-1/, "");

    // POST /patients
    if (req.method === "POST" && path === "/patients") {
      return await handleCreatePatient(req, ctx);
    }

    // POST /patients/merge
    if (req.method === "POST" && path === "/patients/merge") {
      return await handleMerge(req, ctx);
    }

    // PATCH /patients/:health_id
    const patchMatch = path.match(/^\/patients\/(.+)$/);
    if (req.method === "PATCH" && patchMatch) {
      return await handleUpdatePatient(req, ctx, decodeURIComponent(patchMatch[1]));
    }

    // GET /events
    if (req.method === "GET" && path === "/events") {
      return await handleGetEvents(req, ctx);
    }

    // GET /audit
    if (req.method === "GET" && path === "/audit") {
      return await handleGetAudit(req, ctx);
    }

    // GET /config
    if (req.method === "GET" && path === "/config") {
      return await handleGetConfig(ctx);
    }

    // PATCH /config
    if (req.method === "PATCH" && path === "/config") {
      return await handleUpdateConfig(req, ctx);
    }

    return errorResponse("NOT_FOUND", `Unknown route: ${req.method} ${path}`, 404, ctx);
  } catch (e) {
    console.error("[vito-v1-1] Unhandled error:", e);
    return errorResponse("INTERNAL_ERROR", e instanceof Error ? e.message : "Unknown error", 500, ctx);
  }
});
