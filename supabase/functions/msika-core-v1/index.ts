/**
 * MSIKA Core v1.1 — Products & Services Registry Edge Function
 * 
 * Catalog lifecycle (DRAFT→REVIEW→APPROVED→PUBLISHED), items CRUD,
 * FTS search, packs API, imports, mapping workflow, validation.
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

function generateULID(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from({ length: 16 }, () => Math.random().toString(36)[2] || "0").join("");
  return (t + r).slice(0, 26).toUpperCase();
}

function jsonResp(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function errResp(code: string, message: string, status: number, details: Record<string, unknown> = {}): Response {
  return jsonResp({ error: { code, message, details } }, status);
}

function stepUpResp(reason = "HIGH_RISK_ACTION"): Response {
  return jsonResp(
    { error: { code: "STEP_UP_REQUIRED", message: "Step-up authentication required", next: { method: "OIDC_STEP_UP", reason } } },
    403
  );
}

function validateHeaders(req: Request): { ctx: Ctx | null; error: Response | null } {
  const missing: string[] = [];
  const h = (n: string) => req.headers.get(n);
  const tenantId = h("x-tenant-id");
  const correlationId = h("x-correlation-id");
  const deviceFingerprint = h("x-device-fingerprint");
  const purposeOfUse = h("x-purpose-of-use");
  const actorId = h("x-actor-id");
  const actorType = h("x-actor-type");

  if (!tenantId) missing.push("X-Tenant-Id");
  if (!correlationId) missing.push("X-Correlation-Id");
  if (!deviceFingerprint) missing.push("X-Device-Fingerprint");
  if (!purposeOfUse) missing.push("X-Purpose-Of-Use");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");

  if (missing.length > 0) {
    return { ctx: null, error: errResp("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, { missing_headers: missing }) };
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
    error: null,
  };
}

function requireStepUp(ctx: Ctx): Response | null {
  if (ctx.sessionAssurance?.toUpperCase() !== "HIGH") return stepUpResp();
  return null;
}

function getDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function auditLog(db: any, ctx: Ctx, action: string, entityType: string, entityId: string, details: any = {}) {
  await db.schema("audit").from("audit_log").insert({
    tenant_id: ctx.tenantId, action, entity_type: entityType, entity_id: entityId,
    actor_id: ctx.actorId, purpose_of_use: ctx.purposeOfUse,
    correlation_id: ctx.correlationId, details,
  });
}

async function emitIntent(db: any, ctx: Ctx, eventType: string, entityType: string, entityId: string, payload: any = {}) {
  await db.schema("intents").from("event_log").insert({
    tenant_id: ctx.tenantId, event_type: eventType, entity_type: entityType,
    entity_id: entityId, payload, correlation_id: ctx.correlationId,
  });
}

// ── Catalog Lifecycle ─────────────────────────────────────────────
async function handleCatalogs(req: Request, ctx: Ctx, path: string[], method: string): Promise<Response> {
  const db = getDb();

  // POST /v1/catalogs
  if (method === "POST" && path.length === 2) {
    const body = await req.json();
    const catalogId = generateULID();
    const { error } = await db.schema("msika").from("catalogs").insert({
      catalog_id: catalogId, scope: body.scope || "TENANT",
      tenant_id: body.scope === "NATIONAL" ? null : ctx.tenantId,
      name: body.name, version: body.version || "0.1.0",
      created_by_actor_id: ctx.actorId, parent_catalog_id: body.parent_catalog_id || null,
    });
    if (error) return errResp("DB_ERROR", error.message, 500);
    await auditLog(db, ctx, "catalog.created", "catalog", catalogId, { scope: body.scope });
    return jsonResp({ catalog_id: catalogId, status: "DRAFT" }, 201);
  }

  // GET /v1/catalogs
  if (method === "GET" && path.length === 2) {
    const url = new URL(req.url);
    let q = db.schema("msika").from("catalogs").select("*").order("created_at", { ascending: false });
    const scope = url.searchParams.get("scope");
    const status = url.searchParams.get("status");
    const tenantId = url.searchParams.get("tenantId");
    if (scope) q = q.eq("scope", scope);
    if (status) q = q.eq("status", status);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q;
    if (error) return errResp("DB_ERROR", error.message, 500);
    return jsonResp(data);
  }

  // Catalog actions: /v1/catalogs/{id}/...
  if (path.length >= 4) {
    const catalogId = path[2];
    const action = path[3];

    const { data: catalog, error: fetchErr } = await db.schema("msika").from("catalogs").select("*").eq("catalog_id", catalogId).single();
    if (fetchErr || !catalog) return errResp("NOT_FOUND", "Catalog not found", 404);

    if (action === "submit-review" && method === "POST") {
      if (catalog.status !== "DRAFT") return errResp("INVALID_STATE", "Catalog must be DRAFT", 409);
      await db.schema("msika").from("catalogs").update({ status: "REVIEW", updated_at: new Date().toISOString() }).eq("catalog_id", catalogId);
      await auditLog(db, ctx, "catalog.submitted_review", "catalog", catalogId);
      return jsonResp({ status: "REVIEW" });
    }

    if (action === "approve" && method === "POST") {
      if (catalog.scope === "NATIONAL") { const s = requireStepUp(ctx); if (s) return s; }
      if (catalog.status !== "REVIEW") return errResp("INVALID_STATE", "Catalog must be in REVIEW", 409);
      await db.schema("msika").from("catalogs").update({ status: "APPROVED", updated_at: new Date().toISOString() }).eq("catalog_id", catalogId);
      await auditLog(db, ctx, "catalog.approved", "catalog", catalogId);
      return jsonResp({ status: "APPROVED" });
    }

    if (action === "publish" && method === "POST") {
      const s = requireStepUp(ctx); if (s) return s;
      if (catalog.status !== "APPROVED") return errResp("INVALID_STATE", "Catalog must be APPROVED", 409);
      // Compute checksum
      const { data: items } = await db.schema("msika").from("catalog_items").select("item_id,canonical_code,kind,display_name,restrictions").eq("catalog_id", catalogId).order("canonical_code");
      const checksumInput = JSON.stringify(items || []);
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(checksumInput));
      const checksum = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      await db.schema("msika").from("catalogs").update({
        status: "PUBLISHED", published_at: new Date().toISOString(),
        checksum_sha256: checksum, updated_at: new Date().toISOString(),
      }).eq("catalog_id", catalogId);
      await auditLog(db, ctx, "catalog.published", "catalog", catalogId, { checksum });
      await emitIntent(db, ctx, "msika.core.catalog.published", "catalog", catalogId, { version: catalog.version, checksum });
      return jsonResp({ status: "PUBLISHED", checksum_sha256: checksum });
    }

    if (action === "rollback" && method === "POST" && path.length >= 5) {
      const s = requireStepUp(ctx); if (s) return s;
      const targetVersion = path[4];
      const { data: source } = await db.schema("msika").from("catalogs")
        .select("*").eq("version", targetVersion).eq("status", "PUBLISHED")
        .eq(catalog.scope === "NATIONAL" ? "scope" : "tenant_id", catalog.scope === "NATIONAL" ? "NATIONAL" : ctx.tenantId)
        .single();
      if (!source) return errResp("NOT_FOUND", "Published version not found", 404);
      const newId = generateULID();
      await db.schema("msika").from("catalogs").insert({
        catalog_id: newId, scope: source.scope, tenant_id: source.tenant_id,
        name: `${source.name} (rollback)`, version: `${source.version}-rollback`,
        parent_catalog_id: source.catalog_id, created_by_actor_id: ctx.actorId,
      });
      // Clone items
      const { data: srcItems } = await db.schema("msika").from("catalog_items").select("*").eq("catalog_id", source.catalog_id);
      if (srcItems?.length) {
        const cloned = srcItems.map((i: any) => ({ ...i, item_id: generateULID(), catalog_id: newId }));
        await db.schema("msika").from("catalog_items").insert(cloned);
      }
      await auditLog(db, ctx, "catalog.rollback", "catalog", newId, { from_version: targetVersion });
      return jsonResp({ catalog_id: newId, status: "DRAFT" }, 201);
    }
  }

  return errResp("NOT_FOUND", "Unknown catalog endpoint", 404);
}

// ── Items CRUD ────────────────────────────────────────────────────
async function handleItems(req: Request, ctx: Ctx, path: string[], method: string): Promise<Response> {
  const db = getDb();

  // POST /v1/catalogs/{id}/items
  if (method === "POST" && path[0] === "catalogs" && path.length === 4 && path[3] === "items") {
    const catalogId = path[2];
    const { data: catalog } = await db.schema("msika").from("catalogs").select("status").eq("catalog_id", catalogId).single();
    if (!catalog) return errResp("NOT_FOUND", "Catalog not found", 404);
    if (catalog.status === "PUBLISHED") return errResp("FROZEN", "Cannot edit PUBLISHED catalog", 409);

    const body = await req.json();
    const itemId = generateULID();
    const { error } = await db.schema("msika").from("catalog_items").insert({
      item_id: itemId, catalog_id: catalogId, kind: body.kind,
      canonical_code: body.canonical_code, display_name: body.display_name,
      description: body.description, synonyms: body.synonyms || [],
      tags: body.tags || [], restrictions: body.restrictions || {},
      zibo_bindings: body.zibo_bindings || {}, metadata: body.metadata || {},
    });
    if (error) return errResp("DB_ERROR", error.message, 500);

    // Insert detail row based on kind
    if (body.kind === "PRODUCT" && body.product_details) {
      await db.schema("msika").from("product_details").insert({ item_id: itemId, ...body.product_details });
    } else if (body.kind === "SERVICE" && body.service_details) {
      await db.schema("msika").from("service_details").insert({ item_id: itemId, ...body.service_details });
    } else if (body.kind === "ORDERABLE" && body.orderable_details) {
      await db.schema("msika").from("orderable_details").insert({ item_id: itemId, ...body.orderable_details });
    } else if (body.kind === "CHARGEABLE" && body.chargeable_details) {
      await db.schema("msika").from("chargeable_details").insert({ item_id: itemId, ...body.chargeable_details });
    } else if ((body.kind === "CAPABILITY_FACILITY" || body.kind === "CAPABILITY_PROVIDER") && body.capability_link) {
      await db.schema("msika").from("capability_links").insert({
        id: generateULID(), item_id: itemId, capability_type: body.kind === "CAPABILITY_FACILITY" ? "FACILITY" : "PROVIDER",
        applies_to_scope: body.capability_link.applies_to_scope || {},
      });
    }

    await auditLog(db, ctx, "item.created", "catalog_item", itemId, { kind: body.kind, catalog_id: catalogId });
    return jsonResp({ item_id: itemId }, 201);
  }

  // PUT /v1/items/{itemId}
  if (method === "PUT" && path[0] === "items" && path.length === 2) {
    const itemId = path[1];
    const body = await req.json();
    const { data: existing } = await db.schema("msika").from("catalog_items").select("*, catalogs!inner(status)").eq("item_id", itemId).single();
    if (!existing) return errResp("NOT_FOUND", "Item not found", 404);
    if ((existing as any).catalogs?.status === "PUBLISHED") return errResp("FROZEN", "Cannot edit items in PUBLISHED catalog", 409);
    if (body.lock_version !== undefined && body.lock_version !== existing.lock_version) {
      return errResp("CONFLICT", "Optimistic lock conflict", 409, { expected: body.lock_version, actual: existing.lock_version });
    }
    const updates: any = { updated_at: new Date().toISOString(), lock_version: existing.lock_version + 1 };
    for (const f of ["display_name", "description", "synonyms", "tags", "restrictions", "zibo_bindings", "metadata"]) {
      if (body[f] !== undefined) updates[f] = body[f];
    }
    await db.schema("msika").from("catalog_items").update(updates).eq("item_id", itemId);
    await auditLog(db, ctx, "item.updated", "catalog_item", itemId);
    return jsonResp({ item_id: itemId, lock_version: updates.lock_version });
  }

  // GET /v1/items/{itemId}
  if (method === "GET" && path[0] === "items" && path.length === 2) {
    const itemId = path[1];
    const { data } = await db.schema("msika").from("catalog_items").select("*").eq("item_id", itemId).single();
    if (!data) return errResp("NOT_FOUND", "Item not found", 404);
    // Fetch detail row
    let details = null;
    if (data.kind === "PRODUCT") {
      const r = await db.schema("msika").from("product_details").select("*").eq("item_id", itemId).single();
      details = r.data;
    } else if (data.kind === "SERVICE") {
      const r = await db.schema("msika").from("service_details").select("*").eq("item_id", itemId).single();
      details = r.data;
    } else if (data.kind === "ORDERABLE") {
      const r = await db.schema("msika").from("orderable_details").select("*").eq("item_id", itemId).single();
      details = r.data;
    } else if (data.kind === "CHARGEABLE") {
      const r = await db.schema("msika").from("chargeable_details").select("*").eq("item_id", itemId).single();
      details = r.data;
    }
    return jsonResp({ ...data, details });
  }

  return errResp("NOT_FOUND", "Unknown items endpoint", 404);
}

// ── Search ────────────────────────────────────────────────────────
async function handleSearch(req: Request, ctx: Ctx): Promise<Response> {
  const db = getDb();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const kind = url.searchParams.get("kind");
  const tag = url.searchParams.get("tag");
  const tenantId = url.searchParams.get("tenantId");
  const restriction = url.searchParams.get("restriction");

  // Get latest published catalogs
  let catalogQuery = db.schema("msika").from("catalogs").select("catalog_id").eq("status", "PUBLISHED");
  if (tenantId) {
    catalogQuery = catalogQuery.or(`tenant_id.eq.${tenantId},scope.eq.NATIONAL`);
  }
  const { data: catalogs } = await catalogQuery;
  const catalogIds = (catalogs || []).map((c: any) => c.catalog_id);
  if (!catalogIds.length) return jsonResp([]);

  let query = db.schema("msika").from("catalog_items").select("item_id,catalog_id,kind,canonical_code,display_name,synonyms,tags,restrictions,zibo_bindings").in("catalog_id", catalogIds);

  if (q) query = query.textSearch("fts_vector", q.split(/\s+/).join(" & "), { type: "plain" });
  if (kind) query = query.eq("kind", kind);
  if (tag) query = query.contains("tags", [tag]);
  if (restriction) query = query.contains("restrictions", { [restriction]: { enabled: true } });

  query = query.limit(50);
  const { data, error } = await query;
  if (error) return errResp("DB_ERROR", error.message, 500);

  // Redact internal metadata for public browse
  const isPublic = ctx.purposeOfUse === "PUBLIC_BROWSE";
  const results = (data || []).map((item: any) => isPublic ? { item_id: item.item_id, kind: item.kind, canonical_code: item.canonical_code, display_name: item.display_name, tags: item.tags } : item);
  return jsonResp(results);
}

// ── Packs ─────────────────────────────────────────────────────────
async function handlePacks(req: Request, ctx: Ctx, path: string[]): Promise<Response> {
  const db = getDb();
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const ifNoneMatch = req.headers.get("if-none-match");

  // Determine pack type from path
  let packKind: string;
  let packName: string;
  if (path[2] === "orderables") { packKind = "ORDERABLE"; packName = "orderables"; }
  else if (path[2] === "item-master") { packKind = "PRODUCT"; packName = "item-master"; }
  else if (path[2] === "chargeables") { packKind = "CHARGEABLE"; packName = "chargeables"; }
  else if (path[2] === "capabilities" && path[3] === "facility") { packKind = "CAPABILITY_FACILITY"; packName = "capabilities.facility"; }
  else if (path[2] === "capabilities" && path[3] === "provider") { packKind = "CAPABILITY_PROVIDER"; packName = "capabilities.provider"; }
  else return errResp("NOT_FOUND", "Unknown pack type", 404);

  // Get latest NATIONAL published catalog
  const { data: nationalCat } = await db.schema("msika").from("catalogs")
    .select("catalog_id,checksum_sha256,version").eq("scope", "NATIONAL").eq("status", "PUBLISHED")
    .order("published_at", { ascending: false }).limit(1).single();

  let mergedChecksum = nationalCat?.checksum_sha256 || "";
  let catalogIds = nationalCat ? [nationalCat.catalog_id] : [];

  // If tenantId, get tenant overlay
  if (tenantId) {
    const { data: tenantCat } = await db.schema("msika").from("catalogs")
      .select("catalog_id,checksum_sha256,version").eq("scope", "TENANT").eq("tenant_id", tenantId).eq("status", "PUBLISHED")
      .order("published_at", { ascending: false }).limit(1).single();
    if (tenantCat) {
      catalogIds.push(tenantCat.catalog_id);
      mergedChecksum = mergedChecksum + ":" + tenantCat.checksum_sha256;
    }
  }

  const etag = `"${mergedChecksum}"`;
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: corsHeaders });
  }

  if (!catalogIds.length) return jsonResp({ pack: packName, items: [], checksum: null }, 200, { ETag: '""' });

  // Fetch items of the right kind from all relevant catalogs
  let query = db.schema("msika").from("catalog_items").select("*").in("catalog_id", catalogIds).eq("kind", packKind === "PRODUCT" ? packKind : packKind);
  if (packKind === "PRODUCT") query = query.eq("kind", "PRODUCT");
  else query = query.eq("kind", packKind);

  const { data: items } = await query;

  // Tenant overlay merge: tenant items override national by canonical_code
  const merged = new Map<string, any>();
  for (const item of (items || [])) {
    merged.set(item.canonical_code, item);
  }

  return jsonResp(
    { pack: packName, version: nationalCat?.version, items: Array.from(merged.values()), checksum: mergedChecksum },
    200,
    { ETag: etag }
  );
}

// ── Imports ───────────────────────────────────────────────────────
async function handleImports(req: Request, ctx: Ctx, path: string[], method: string): Promise<Response> {
  const db = getDb();

  // POST /v1/import/csv
  if (method === "POST" && path[2] === "csv") {
    const s = requireStepUp(ctx); if (s) return s;
    const body = await req.json();
    const jobId = generateULID();

    await db.schema("msika_imp").from("import_jobs").insert({
      job_id: jobId, tenant_id: ctx.tenantId, source_id: body.source_id || null,
      status: "RUNNING", created_by_actor_id: ctx.actorId,
    });

    const rows: any[] = body.rows || [];
    let invalidCount = 0, dedupCount = 0, stagedCount = 0;
    const normalizedKeys = new Set<string>();
    const stagingRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      if (!row.display_name) errors.push("missing display_name");
      if (!row.kind) errors.push("missing kind");

      // Compute normalized key for dedup
      const normKey = [row.display_name, row.strength, row.form, row.pack_size].filter(Boolean).join("|").toLowerCase().trim();
      let status = "STAGED";
      let dedupReason: string | null = null;

      if (errors.length) { status = "INVALID"; invalidCount++; }
      else if (normalizedKeys.has(normKey)) { status = "DEDUPED"; dedupReason = "duplicate_normalized_key"; dedupCount++; }
      else { normalizedKeys.add(normKey); stagedCount++; status = "PENDING_REVIEW"; }

      stagingRows.push({
        job_id: jobId, row_num: i + 1, raw: row, normalized_key: normKey,
        dedup_reason: dedupReason, validation_errors: errors.length ? errors : null, status,
      });
    }

    if (stagingRows.length) {
      await db.schema("msika_imp").from("import_staging_items").insert(stagingRows);
    }

    const stats = { total: rows.length, invalid: invalidCount, deduped: dedupCount, pending_review: stagedCount };
    await db.schema("msika_imp").from("import_jobs").update({ status: "COMPLETED", stats, completed_at: new Date().toISOString() }).eq("job_id", jobId);
    await auditLog(db, ctx, "import.csv.completed", "import_job", jobId, stats);
    return jsonResp({ job_id: jobId, stats }, 201);
  }

  // GET /v1/import/jobs/{id}
  if (method === "GET" && path[2] === "jobs" && path.length === 4) {
    const jobId = path[3];
    const { data: job } = await db.schema("msika_imp").from("import_jobs").select("*").eq("job_id", jobId).single();
    if (!job) return errResp("NOT_FOUND", "Job not found", 404);
    const { data: staging } = await db.schema("msika_imp").from("import_staging_items").select("*").eq("job_id", jobId).order("row_num");
    return jsonResp({ ...job, staging_items: staging || [] });
  }

  // POST /v1/import/sources
  if (method === "POST" && path[2] === "sources" && path.length === 3) {
    const body = await req.json();
    const sourceId = generateULID();
    await db.schema("msika").from("external_sources").insert({
      source_id: sourceId, tenant_id: ctx.tenantId, name: body.name,
      mode: body.mode || "CSV", config_encrypted: body.config || {},
    });
    return jsonResp({ source_id: sourceId }, 201);
  }

  return errResp("NOT_FOUND", "Unknown import endpoint", 404);
}

// ── Mappings ──────────────────────────────────────────────────────
async function handleMappings(req: Request, ctx: Ctx, path: string[], method: string): Promise<Response> {
  const db = getDb();

  // GET /v1/mappings/pending
  if (method === "GET" && path[2] === "pending") {
    const { data } = await db.schema("msika").from("external_mappings").select("*").eq("status", "PENDING").order("confidence", { ascending: false });
    return jsonResp(data || []);
  }

  // POST /v1/mappings/{id}/approve
  if (method === "POST" && path.length === 4 && path[3] === "approve") {
    const mappingId = path[2];
    const { data: mapping } = await db.schema("msika").from("external_mappings").select("*").eq("id", mappingId).single();
    if (!mapping) return errResp("NOT_FOUND", "Mapping not found", 404);
    // Check if impacts NATIONAL
    const { data: item } = await db.schema("msika").from("catalog_items").select("catalog_id").eq("item_id", mapping.internal_item_id).single();
    if (item) {
      const { data: cat } = await db.schema("msika").from("catalogs").select("scope").eq("catalog_id", item.catalog_id).single();
      if (cat?.scope === "NATIONAL") { const s = requireStepUp(ctx); if (s) return s; }
    }
    await db.schema("msika").from("external_mappings").update({ status: "APPROVED", reviewer_actor_id: ctx.actorId, reviewed_at: new Date().toISOString() }).eq("id", mappingId);
    await auditLog(db, ctx, "mapping.approved", "external_mapping", mappingId);
    await emitIntent(db, ctx, "msika.core.mapping.approved", "external_mapping", mappingId);
    return jsonResp({ status: "APPROVED" });
  }

  // POST /v1/mappings/{id}/reject
  if (method === "POST" && path.length === 4 && path[3] === "reject") {
    const mappingId = path[2];
    await db.schema("msika").from("external_mappings").update({ status: "REJECTED", reviewer_actor_id: ctx.actorId, reviewed_at: new Date().toISOString() }).eq("id", mappingId);
    await auditLog(db, ctx, "mapping.rejected", "external_mapping", mappingId);
    return jsonResp({ status: "REJECTED" });
  }

  return errResp("NOT_FOUND", "Unknown mappings endpoint", 404);
}

// ── Validation ────────────────────────────────────────────────────
async function handleValidate(req: Request, ctx: Ctx, path: string[]): Promise<Response> {
  const body = await req.json();

  if (path[2] === "item") {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!body.kind) errors.push("kind is required");
    if (!body.canonical_code) errors.push("canonical_code is required");
    if (!body.display_name) errors.push("display_name is required");
    if (body.restrictions) {
      const validFlags = ["prescription_required", "facility_only", "provider_only_order", "controlled_item", "age_restricted", "cold_chain_required", "hazardous_handling_required", "requires_schedule", "requires_referral", "requires_licenced_provider"];
      for (const key of Object.keys(body.restrictions)) {
        if (!validFlags.includes(key)) warnings.push(`Unknown restriction flag: ${key}`);
        const val = body.restrictions[key];
        if (val && typeof val.enabled !== "boolean") errors.push(`restrictions.${key}.enabled must be boolean`);
      }
    }
    if (body.zibo_bindings && typeof body.zibo_bindings !== "object") errors.push("zibo_bindings must be an object");
    return jsonResp({ valid: errors.length === 0, errors, warnings });
  }

  if (path[2] === "pack") {
    const errors: string[] = [];
    if (!body.pack) errors.push("pack name is required");
    if (!Array.isArray(body.items)) errors.push("items must be an array");
    return jsonResp({ valid: errors.length === 0, errors });
  }

  return errResp("NOT_FOUND", "Unknown validation endpoint", 404);
}

// ── Router ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, error } = validateHeaders(req);
  if (!ctx) return error!;

  const url = new URL(req.url);
  const fullPath = url.pathname.replace(/^\/msika-core-v1\/?/, "").replace(/^\//, "");
  const path = fullPath.split("/").filter(Boolean);
  console.log(`[msika-core] ${method} /${path.join("/")}`);
  const method = req.method;

  try {
    // /v1/catalogs/...
    if (path[0] === "v1" && path[1] === "catalogs") return await handleCatalogs(req, ctx, path.slice(1), method);
    // /v1/items/...
    if (path[0] === "v1" && path[1] === "items") return await handleItems(req, ctx, path.slice(1), method);
    // POST /v1/catalogs/{id}/items routes to items handler
    if (path[0] === "v1" && path[1] === "catalogs" && path.length >= 4 && path[3] === "items") return await handleItems(req, ctx, path.slice(1), method);
    // /v1/search
    if (path[0] === "v1" && path[1] === "search" && method === "GET") return await handleSearch(req, ctx);
    // /v1/packs/...
    if (path[0] === "v1" && path[1] === "packs") return await handlePacks(req, ctx, path.slice(1));
    // /v1/import/...
    if (path[0] === "v1" && path[1] === "import") return await handleImports(req, ctx, path.slice(1), method);
    // /v1/mappings/...
    if (path[0] === "v1" && path[1] === "mappings") return await handleMappings(req, ctx, path.slice(1), method);
    // /v1/validate/...
    if (path[0] === "v1" && path[1] === "validate" && method === "POST") return await handleValidate(req, ctx, path.slice(1));

    return errResp("NOT_FOUND", `Unknown endpoint: ${method} ${fullPath}`, 404);
  } catch (err) {
    console.error("Unhandled error:", err);
    return errResp("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal error", 500);
  }
});
