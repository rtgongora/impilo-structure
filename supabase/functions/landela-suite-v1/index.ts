import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-correlation-id, x-device-fingerprint, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-decision-id, x-break-glass, x-consent-decision",
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
  decisionId?: string;
  breakGlass: boolean;
}

function extractCtx(req: Request): { ctx: Ctx | null; err: Response | null } {
  const h = (n: string) => req.headers.get(n);
  const missing: string[] = [];
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

  if (missing.length > 0) {
    return {
      ctx: null,
      err: json({ error: { code: "MISSING_REQUIRED_HEADER", message: `Missing: ${missing.join(", ")}`, details: { missing_headers: missing } } }, 400),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!, correlationId: correlationId!, actorId: actorId!,
      actorType: actorType!, purposeOfUse: purposeOfUse!, deviceFingerprint: deviceFingerprint!,
      facilityId: h("x-facility-id") || undefined,
      workspaceId: h("x-workspace-id") || undefined,
      shiftId: h("x-shift-id") || undefined,
      decisionId: h("x-decision-id") || undefined,
      breakGlass: h("x-break-glass") === "true",
    },
    err: null,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function auditLog(db: any, ctx: Ctx, eventType: string, opts: { subjectType?: string; subjectId?: string; resourceType?: string; resourceId?: string; details?: Record<string, unknown> } = {}) {
  await db.from("suite_audit_events").insert({
    tenant_id: ctx.tenantId, event_type: eventType,
    subject_type: opts.subjectType, subject_id: opts.subjectId,
    resource_type: opts.resourceType, resource_id: opts.resourceId,
    actor_id: ctx.actorId, actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse, correlation_id: ctx.correlationId,
    device_fingerprint: ctx.deviceFingerprint,
    facility_id: ctx.facilityId, workspace_id: ctx.workspaceId,
    shift_id: ctx.shiftId, decision_id: ctx.decisionId,
    break_glass: ctx.breakGlass, details_json: opts.details || {},
  });
}

// ==================== ROUTING ====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, err } = extractCtx(req);
  if (!ctx) return err!;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/landela-suite-v1/, "");
  const method = req.method;
  const db = getDb();

  try {
    // ---- DOCS ----
    if (method === "POST" && path === "/v1/docs/upload") return await docsUpload(db, ctx, req);
    if (method === "GET" && path.match(/^\/v1\/docs\/([^/]+)\/metadata$/)) return await docsGetMeta(db, ctx, path);
    if (method === "PUT" && path.match(/^\/v1\/docs\/([^/]+)\/metadata$/)) return await docsUpdateMeta(db, ctx, req, path);
    if (method === "POST" && path.match(/^\/v1\/docs\/([^/]+)\/signed-url$/)) return await docsSignedUrl(db, ctx, req, path);
    if (method === "POST" && path === "/v1/docs/search") return await docsSearch(db, ctx, req);
    if (method === "POST" && path.match(/^\/v1\/docs\/([^/]+)\/lifecycle\/(.+)$/)) return await docsLifecycle(db, ctx, req, path);

    // ---- CREDENTIALS ----
    if (method === "POST" && path === "/v1/credentials/issue") return await credIssue(db, ctx, req);
    if (method === "GET" && path.match(/^\/v1\/credentials\/([^/]+)$/)) return await credGet(db, ctx, path);
    if (method === "POST" && path.match(/^\/v1\/credentials\/([^/]+)\/revoke$/)) return await credRevoke(db, ctx, req, path);
    if (method === "GET" && path.match(/^\/v1\/verify\/(.+)$/)) return await credVerify(db, ctx, path);

    // ---- PRINT ----
    if (method === "POST" && path === "/v1/print/request") return await printRequest(db, ctx, req);
    if (method === "GET" && path === "/v1/print/jobs") return await printList(db, ctx, url);
    if (method === "POST" && path.match(/^\/v1\/print\/jobs\/([^/]+)\/render$/)) return await printRender(db, ctx, path);
    if (method === "POST" && path.match(/^\/v1\/print\/jobs\/([^/]+)\/mark-printed$/)) return await printStatus(db, ctx, path, "PRINTED");
    if (method === "POST" && path.match(/^\/v1\/print\/jobs\/([^/]+)\/mark-collected$/)) return await printStatus(db, ctx, path, "COLLECTED");

    // ---- SHARE ----
    if (method === "POST" && path === "/v1/share/create") return await shareCreate(db, ctx, req);
    if (method === "POST" && path.match(/^\/v1\/share\/([^/]+)\/otp\/send$/)) return await shareOtpSend(db, ctx, path);
    if (method === "POST" && path.match(/^\/v1\/share\/([^/]+)\/claim$/)) return await shareClaim(db, ctx, req, path);
    if (method === "GET" && path.match(/^\/v1\/share\/([^/]+)\/status$/)) return await shareStatus(db, ctx, path);
    if (method === "POST" && path.match(/^\/v1\/share\/([^/]+)\/revoke$/)) return await shareRevoke(db, ctx, path);

    // ---- INTERNAL ----
    if (method === "POST" && path === "/v1/internal/documentreference/push") return await docRefPush(db, ctx, req);
    if (method === "GET" && path === "/v1/internal/stats") return await internalStats(db, ctx);

    // ---- HIGH-RISK QUEUE ----
    if (method === "GET" && path === "/v1/high-risk-queue") return await hrqList(db, ctx);
    if (method === "POST" && path.match(/^\/v1\/high-risk-queue\/([^/]+)\/(approve|reject)$/)) return await hrqDecide(db, ctx, req, path);

    return json({ error: { code: "NOT_FOUND", message: "Unknown route" } }, 404);
  } catch (e) {
    console.error("Unhandled:", e);
    return json({ error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Internal error" } }, 500);
  }
});

// ==================== DOCUMENT HANDLERS ====================

async function docsUpload(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  const { subject_type, subject_id, document_type_code, source, mime_type, confidentiality, tags, issuer, hash_sha256 } = body;
  if (!subject_type || !subject_id || !document_type_code || !source) {
    return json({ error: { code: "INVALID_REQUEST", message: "Missing required fields" } }, 400);
  }

  // Determine storage provider from tenant config
  const { data: cfg } = await db.from("suite_tenant_config").select("document_mode").eq("tenant_id", ctx.tenantId).single();
  const storageProvider = cfg?.document_mode || "INTERNAL";
  const storageKey = `${ctx.tenantId}/${Date.now()}_${crypto.randomUUID()}`;

  const { data: doc, error } = await db.from("suite_documents").insert({
    tenant_id: ctx.tenantId, subject_type, subject_id, document_type_code,
    source, issuer, created_by_actor_id: ctx.actorId,
    confidentiality: confidentiality || "NORMAL",
    hash_sha256, mime_type: mime_type || "application/octet-stream",
    storage_provider: storageProvider, storage_object_key: storageKey,
    external_ref: storageProvider === "LANDELA" ? `landela-mock-${crypto.randomUUID()}` : null,
    tags: tags || [],
  }).select().single();

  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);

  // Create initial version
  await db.from("suite_document_versions").insert({ document_id: doc.id, version_number: 1 });
  await auditLog(db, ctx, "doc.upload", { subjectType: subject_type, subjectId: subject_id, resourceType: "document", resourceId: doc.id });

  return json({ document: doc }, 201);
}

async function docsGetMeta(db: any, ctx: Ctx, path: string) {
  const id = path.split("/")[3];
  const { data, error } = await db.from("suite_documents").select("*").eq("id", id).eq("tenant_id", ctx.tenantId).single();
  if (error || !data) return json({ error: { code: "NOT_FOUND", message: "Document not found" } }, 404);
  await auditLog(db, ctx, "doc.read_metadata", { resourceType: "document", resourceId: id });
  return json({ document: data });
}

async function docsUpdateMeta(db: any, ctx: Ctx, req: Request, path: string) {
  const id = path.split("/")[3];
  const body = await req.json();
  const allowed = ["tags", "confidentiality", "document_type_code"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (body[k] !== undefined) updates[k] = body[k]; }

  const { error } = await db.from("suite_documents").update(updates).eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, "doc.update_metadata", { resourceType: "document", resourceId: id, details: updates });
  return json({ success: true });
}

async function docsSignedUrl(db: any, ctx: Ctx, req: Request, path: string) {
  const id = path.split("/")[3];
  const body = await req.json();
  const scope = body.scope || "DOWNLOAD";
  const ttl = body.ttl_seconds || 3600;
  const token = crypto.randomUUID().replace(/-/g, "").substring(0, 24);

  const { error } = await db.from("suite_signed_links").insert({
    document_id: id, token, expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
    scope, created_by_actor_id: ctx.actorId,
  });
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, "doc.signed_url_created", { resourceType: "document", resourceId: id, details: { scope, ttl } });
  return json({ token, expires_in_seconds: ttl, scope });
}

async function docsSearch(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  let query = db.from("suite_documents").select("*").eq("tenant_id", ctx.tenantId);
  if (body.subject_type) query = query.eq("subject_type", body.subject_type);
  if (body.subject_id) query = query.eq("subject_id", body.subject_id);
  if (body.document_type_code) query = query.eq("document_type_code", body.document_type_code);
  if (body.lifecycle_state) query = query.eq("lifecycle_state", body.lifecycle_state);
  if (body.confidentiality) query = query.eq("confidentiality", body.confidentiality);
  query = query.order("created_at", { ascending: false }).limit(body.limit || 50);

  const { data, error } = await query;
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, "doc.search", { details: { filters: body, result_count: data?.length || 0 } });
  return json({ documents: data || [], total: data?.length || 0 });
}

async function docsLifecycle(db: any, ctx: Ctx, req: Request, path: string) {
  const parts = path.split("/");
  const id = parts[3];
  const action = parts[5]; // archive|revoke|supersede|delete
  const body = await req.json().catch(() => ({}));

  const stateMap: Record<string, string> = { archive: "ARCHIVED", revoke: "REVOKED", supersede: "SUPERSEDED", delete: "DELETED" };
  const newState = stateMap[action];
  if (!newState) return json({ error: { code: "INVALID_REQUEST", message: "Unknown lifecycle action" } }, 400);

  const { error } = await db.from("suite_documents").update({ lifecycle_state: newState }).eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);

  // Queue high-risk actions
  if (["REVOKED", "DELETED"].includes(newState)) {
    await db.from("suite_high_risk_queue").insert({
      tenant_id: ctx.tenantId, action_type: action.toUpperCase(), document_id: id,
      requested_by_actor_id: ctx.actorId, reason: body.reason || "No reason provided", status: "APPROVED",
      decided_by_actor_id: ctx.actorId, decided_at: new Date().toISOString(),
    });
  }

  await auditLog(db, ctx, `doc.lifecycle.${action}`, { resourceType: "document", resourceId: id, details: { new_state: newState, reason: body.reason } });
  return json({ success: true, lifecycle_state: newState });
}

// ==================== CREDENTIAL HANDLERS ====================

async function credIssue(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  const { subject_type, subject_id, credential_type, issuer, payload, expires_at } = body;
  if (!subject_type || !subject_id || !credential_type) {
    return json({ error: { code: "INVALID_REQUEST", message: "Missing required fields" } }, 400);
  }

  const qrToken = crypto.randomUUID().replace(/-/g, "");
  const { data: cred, error } = await db.from("suite_credentials").insert({
    tenant_id: ctx.tenantId, subject_type, subject_id, credential_type,
    issuer: issuer || "SYSTEM", qr_ref_token: qrToken,
    payload_json: payload || {}, signing_kid: `kid-${ctx.tenantId}-${Date.now()}`,
    expires_at, created_by_actor_id: ctx.actorId,
  }).select().single();

  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);

  // Create mock PDF document artifact
  const { data: artifactDoc } = await db.from("suite_documents").insert({
    tenant_id: ctx.tenantId, subject_type, subject_id,
    document_type_code: "CREDENTIAL_PDF", source: "GENERATED",
    created_by_actor_id: ctx.actorId, mime_type: "application/pdf",
    storage_provider: "INTERNAL", storage_object_key: `creds/${cred.id}/certificate.pdf`,
  }).select().single();

  if (artifactDoc) {
    await db.from("suite_credential_documents").insert({ credential_id: cred.id, landela_document_id: artifactDoc.id, kind: "PDF" });
  }

  await auditLog(db, ctx, "credential.issue", { subjectType: subject_type, subjectId: subject_id, resourceType: "credential", resourceId: cred.id });
  return json({ credential: cred, qr_ref_token: qrToken }, 201);
}

async function credGet(db: any, ctx: Ctx, path: string) {
  const id = path.split("/")[3];
  const { data, error } = await db.from("suite_credentials").select("*, suite_credential_documents(*, suite_documents(*))").eq("id", id).eq("tenant_id", ctx.tenantId).single();
  if (error || !data) return json({ error: { code: "NOT_FOUND", message: "Credential not found" } }, 404);
  await auditLog(db, ctx, "credential.read", { resourceType: "credential", resourceId: id });
  return json({ credential: data });
}

async function credRevoke(db: any, ctx: Ctx, req: Request, path: string) {
  const id = path.split("/")[3];
  const body = await req.json();
  if (!body.reason) return json({ error: { code: "INVALID_REQUEST", message: "Reason required" } }, 400);

  const { error: e1 } = await db.from("suite_credentials").update({ status: "REVOKED" }).eq("id", id).eq("tenant_id", ctx.tenantId);
  if (e1) return json({ error: { code: "DB_ERROR", message: e1.message } }, 500);

  await db.from("suite_revocations").insert({ credential_id: id, reason: body.reason, revoked_by_actor_id: ctx.actorId });
  await auditLog(db, ctx, "credential.revoke", { resourceType: "credential", resourceId: id, details: { reason: body.reason } });
  return json({ success: true, status: "REVOKED" });
}

async function credVerify(db: any, ctx: Ctx, path: string) {
  const token = path.split("/")[3];
  const { data } = await db.from("suite_credentials").select("id, status, expires_at").eq("qr_ref_token", token).single();

  // Enumeration-resistant: always same shape
  if (!data) return json({ verification: { status: "NOT_FOUND" } });
  if (data.status === "REVOKED") return json({ verification: { status: "REVOKED" } });
  if (data.expires_at && new Date(data.expires_at) < new Date()) return json({ verification: { status: "EXPIRED" } });
  return json({ verification: { status: "VALID" } });
}

// ==================== PRINT HANDLERS ====================

async function printRequest(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  const { data, error } = await db.from("suite_print_jobs").insert({
    tenant_id: ctx.tenantId, subject_type: body.subject_type, subject_id: body.subject_id,
    template_type: body.template_type, requested_by_actor_id: ctx.actorId,
    facility_id: body.facility_id || ctx.facilityId, payload_json: body.payload || {},
  }).select().single();

  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, "print.request", { resourceType: "print_job", resourceId: data.id });
  return json({ print_job: data }, 201);
}

async function printList(db: any, ctx: Ctx, url: URL) {
  const subject = url.searchParams.get("subject");
  let query = db.from("suite_print_jobs").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(50);
  if (subject) query = query.eq("subject_id", subject);
  const { data } = await query;
  return json({ print_jobs: data || [] });
}

async function printRender(db: any, ctx: Ctx, path: string) {
  const id = path.split("/")[4];
  // Mock render: create PDF document
  const { data: job } = await db.from("suite_print_jobs").select("*").eq("id", id).eq("tenant_id", ctx.tenantId).single();
  if (!job) return json({ error: { code: "NOT_FOUND", message: "Job not found" } }, 404);

  const { data: doc } = await db.from("suite_documents").insert({
    tenant_id: ctx.tenantId, subject_type: job.subject_type, subject_id: job.subject_id,
    document_type_code: "PRINT_OUTPUT", source: "GENERATED", created_by_actor_id: ctx.actorId,
    mime_type: "application/pdf", storage_provider: "INTERNAL",
    storage_object_key: `prints/${id}/output.pdf`,
  }).select().single();

  await db.from("suite_print_jobs").update({ status: "RENDERED", output_landela_document_id: doc?.id }).eq("id", id);
  await auditLog(db, ctx, "print.render", { resourceType: "print_job", resourceId: id });
  return json({ success: true, status: "RENDERED", output_document_id: doc?.id });
}

async function printStatus(db: any, ctx: Ctx, path: string, status: string) {
  const id = path.split("/")[4];
  const { error } = await db.from("suite_print_jobs").update({ status }).eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, `print.${status.toLowerCase()}`, { resourceType: "print_job", resourceId: id });
  return json({ success: true, status });
}

// ==================== SHARE HANDLERS ====================

async function shareCreate(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  const { data, error } = await db.from("suite_share_links").insert({
    tenant_id: ctx.tenantId, target_type: body.target_type || "DOCUMENT",
    target_ref: body.target_ref, proof_method: body.proof_method || "OTP",
    created_by_actor_id: ctx.actorId,
    expires_at: body.expires_at || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
  }).select().single();

  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);

  await db.from("suite_share_events").insert({ share_link_id: data.id, event_type: "CREATED", actor_id: ctx.actorId, correlation_id: ctx.correlationId });
  await auditLog(db, ctx, "share.create", { resourceType: "share_link", resourceId: data.id });
  return json({ share_link: data }, 201);
}

async function shareOtpSend(db: any, ctx: Ctx, path: string) {
  const token = path.split("/")[3];
  const { data: link } = await db.from("suite_share_links").select("id").eq("token", token).eq("tenant_id", ctx.tenantId).single();
  if (!link) return json({ error: { code: "NOT_FOUND", message: "Link not found" } }, 404);

  await db.from("suite_share_events").insert({ share_link_id: link.id, event_type: "OTP_SENT", actor_id: ctx.actorId, correlation_id: ctx.correlationId, meta_json: { mock_otp: "123456" } });
  await auditLog(db, ctx, "share.otp_sent", { resourceType: "share_link", resourceId: link.id });
  return json({ success: true, message: "OTP sent (mock: 123456)" });
}

async function shareClaim(db: any, ctx: Ctx, req: Request, path: string) {
  const token = path.split("/")[3];
  const body = await req.json();
  const { data: link } = await db.from("suite_share_links").select("*").eq("token", token).single();

  if (!link) return json({ error: { code: "NOT_FOUND", message: "Link not found" } }, 404);
  if (link.status !== "ACTIVE") return json({ error: { code: "LINK_NOT_ACTIVE", message: `Link is ${link.status}` } }, 409);
  if (new Date(link.expires_at) < new Date()) {
    await db.from("suite_share_links").update({ status: "EXPIRED" }).eq("id", link.id);
    return json({ error: { code: "LINK_EXPIRED", message: "Share link has expired" } }, 410);
  }

  // Record claim attempt
  await db.from("suite_share_events").insert({ share_link_id: link.id, event_type: "CLAIM_ATTEMPT", actor_id: ctx.actorId, correlation_id: ctx.correlationId });

  // Mock OTP validation (accept "123456")
  if (link.proof_method !== "QR" && body.otp !== "123456") {
    return json({ error: { code: "INVALID_OTP", message: "Invalid OTP" } }, 403);
  }

  await db.from("suite_share_links").update({ status: "CLAIMED", claimed_at: new Date().toISOString(), claimed_by_actor_id: ctx.actorId }).eq("id", link.id);
  await db.from("suite_share_events").insert({ share_link_id: link.id, event_type: "CLAIMED", actor_id: ctx.actorId, correlation_id: ctx.correlationId });
  await auditLog(db, ctx, "share.claimed", { resourceType: "share_link", resourceId: link.id });
  return json({ success: true, target_type: link.target_type, target_ref: link.target_ref });
}

async function shareStatus(db: any, ctx: Ctx, path: string) {
  const token = path.split("/")[3];
  const { data: link } = await db.from("suite_share_links").select("status, expires_at, proof_method, target_type, claimed_at").eq("token", token).single();
  if (!link) return json({ error: { code: "NOT_FOUND", message: "Link not found" } }, 404);
  return json({ share_link: link });
}

async function shareRevoke(db: any, ctx: Ctx, path: string) {
  const token = path.split("/")[3];
  const { data: link } = await db.from("suite_share_links").select("id").eq("token", token).eq("tenant_id", ctx.tenantId).single();
  if (!link) return json({ error: { code: "NOT_FOUND", message: "Link not found" } }, 404);

  await db.from("suite_share_links").update({ status: "REVOKED" }).eq("id", link.id);
  await db.from("suite_share_events").insert({ share_link_id: link.id, event_type: "REVOKED", actor_id: ctx.actorId, correlation_id: ctx.correlationId });
  await auditLog(db, ctx, "share.revoke", { resourceType: "share_link", resourceId: link.id });
  return json({ success: true, status: "REVOKED" });
}

// ==================== INTERNAL HANDLERS ====================

async function docRefPush(db: any, ctx: Ctx, req: Request) {
  const body = await req.json();
  const { subject_cpid, landela_document_id, type_code, encounter_id } = body;
  if (!subject_cpid || !landela_document_id) {
    return json({ error: { code: "INVALID_REQUEST", message: "subject_cpid and landela_document_id required" } }, 400);
  }

  // Check if butano tables exist and push
  const fhirId = `docref-${crypto.randomUUID()}`;
  const { error } = await db.from("butano_fhir_resources").insert({
    tenant_id: ctx.tenantId, resource_type: "DocumentReference", fhir_id: fhirId,
    subject_cpid, encounter_id,
    resource_json: { resourceType: "DocumentReference", subject: { identifier: { value: subject_cpid } }, content: [{ attachment: { url: `landela://${landela_document_id}` } }], type: { coding: [{ code: type_code }] } },
    meta_json: { tags: [ctx.tenantId, "document-push"] },
  }).select().single();

  if (error) {
    // Fallback: just record the intent
    await auditLog(db, ctx, "docref.push_failed", { details: { error: error.message, landela_document_id } });
    return json({ success: false, fhir_id: null, error: "BUTANO push failed, recorded in audit" });
  }

  await auditLog(db, ctx, "docref.push", { subjectType: "CLIENT", subjectId: subject_cpid, resourceType: "DocumentReference", resourceId: fhirId });
  return json({ success: true, fhir_id: fhirId });
}

async function internalStats(db: any, ctx: Ctx) {
  const [docs, creds, prints, shares, audits] = await Promise.all([
    db.from("suite_documents").select("lifecycle_state", { count: "exact" }).eq("tenant_id", ctx.tenantId),
    db.from("suite_credentials").select("status", { count: "exact" }).eq("tenant_id", ctx.tenantId),
    db.from("suite_print_jobs").select("status", { count: "exact" }).eq("tenant_id", ctx.tenantId),
    db.from("suite_share_links").select("status", { count: "exact" }).eq("tenant_id", ctx.tenantId),
    db.from("suite_audit_events").select("id", { count: "exact" }).eq("tenant_id", ctx.tenantId),
  ]);

  return json({
    stats: {
      documents: docs.count || 0,
      credentials: creds.count || 0,
      print_jobs: prints.count || 0,
      share_links: shares.count || 0,
      audit_events: audits.count || 0,
    },
  });
}

// ==================== HIGH-RISK QUEUE ====================

async function hrqList(db: any, ctx: Ctx) {
  const { data } = await db.from("suite_high_risk_queue").select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(50);
  return json({ queue: data || [] });
}

async function hrqDecide(db: any, ctx: Ctx, req: Request, path: string) {
  const parts = path.split("/");
  const id = parts[3];
  const decision = parts[4]; // approve|reject
  const body = await req.json().catch(() => ({}));

  const status = decision === "approve" ? "APPROVED" : "REJECTED";
  const { error } = await db.from("suite_high_risk_queue").update({ status, decided_by_actor_id: ctx.actorId, decided_at: new Date().toISOString() }).eq("id", id);
  if (error) return json({ error: { code: "DB_ERROR", message: error.message } }, 500);
  await auditLog(db, ctx, `hrq.${decision}`, { resourceType: "high_risk_queue", resourceId: id, details: { reason: body.reason } });
  return json({ success: true, status });
}
