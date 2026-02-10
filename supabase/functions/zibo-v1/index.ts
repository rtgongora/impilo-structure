import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, idempotency-key",
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
}

function extractCtx(req: Request): { ctx: Ctx | null; err: Response | null } {
  const tenantId = req.headers.get("x-tenant-id");
  const correlationId = req.headers.get("x-correlation-id");
  const actorId = req.headers.get("x-actor-id");
  const actorType = req.headers.get("x-actor-type");
  const purposeOfUse = req.headers.get("x-purpose-of-use");
  const deviceFingerprint = req.headers.get("x-device-fingerprint");

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
      err: jsonRes(400, {
        error: {
          code: "MISSING_REQUIRED_HEADER",
          message: `Missing: ${missing.join(", ")}`,
          details: { missing_headers: missing },
        },
      }),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!,
      correlationId: correlationId!,
      actorId: actorId!,
      actorType: actorType!,
      purposeOfUse: purposeOfUse!,
      deviceFingerprint: deviceFingerprint!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
    },
    err: null,
  };
}

function jsonRes(status: number, body: unknown, ctx?: Ctx): Response {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (ctx) headers["X-Correlation-Id"] = ctx.correlationId;
  return new Response(JSON.stringify(body), { status, headers });
}

function getDb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function computeHash(canonical_url: string, version: string, content_json: unknown): string {
  const raw = `${canonical_url}|${version}|${JSON.stringify(content_json)}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, "0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ctx, err } = extractCtx(req);
  if (!ctx) return err!;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/zibo-v1/, "");
  const db = getDb();

  try {
    // ─── ARTIFACTS ───
    if (path === "/v1/artifacts/draft" && req.method === "POST") {
      const body = await req.json();
      const hash = computeHash(body.canonical_url, body.version, body.content_json);
      const { data, error } = await db.from("zibo_artifacts").insert({
        tenant_id: body.tenant_id || ctx.tenantId,
        fhir_type: body.fhir_type,
        canonical_url: body.canonical_url,
        version: body.version,
        status: "DRAFT",
        content_json: body.content_json,
        hash,
        created_by_actor_id: ctx.actorId,
      }).select().single();
      if (error) return jsonRes(400, { error: { code: "INSERT_FAILED", message: error.message, details: {} } }, ctx);
      return jsonRes(201, data, ctx);
    }

    if (path.match(/^\/v1\/artifacts\/draft\/[^/]+$/) && req.method === "PUT") {
      const id = path.split("/").pop()!;
      const body = await req.json();
      // Check DRAFT
      const { data: existing } = await db.from("zibo_artifacts").select("status").eq("id", id).single();
      if (!existing || existing.status !== "DRAFT") {
        return jsonRes(409, { error: { code: "IMMUTABLE", message: "Only DRAFT artifacts can be edited", details: {} } }, ctx);
      }
      const hash = computeHash(body.canonical_url || "", body.version || "", body.content_json);
      const { data, error } = await db.from("zibo_artifacts").update({
        content_json: body.content_json,
        fhir_type: body.fhir_type,
        canonical_url: body.canonical_url,
        version: body.version,
        hash,
      }).eq("id", id).select().single();
      if (error) return jsonRes(400, { error: { code: "UPDATE_FAILED", message: error.message, details: {} } }, ctx);
      return jsonRes(200, data, ctx);
    }

    if (path.match(/^\/v1\/artifacts\/[^/]+\/publish$/) && req.method === "POST") {
      const id = path.split("/")[3];
      const { data: existing } = await db.from("zibo_artifacts").select("status").eq("id", id).single();
      if (!existing || existing.status !== "DRAFT") {
        return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: "Only DRAFT → PUBLISHED allowed", details: {} } }, ctx);
      }
      const { data } = await db.from("zibo_artifacts").update({ status: "PUBLISHED" }).eq("id", id).select().single();
      return jsonRes(200, data, ctx);
    }

    if (path.match(/^\/v1\/artifacts\/[^/]+\/deprecate$/) && req.method === "POST") {
      const id = path.split("/")[3];
      const { data: existing } = await db.from("zibo_artifacts").select("status").eq("id", id).single();
      if (!existing || existing.status !== "PUBLISHED") {
        return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: "Only PUBLISHED → DEPRECATED", details: {} } }, ctx);
      }
      const { data } = await db.from("zibo_artifacts").update({ status: "DEPRECATED" }).eq("id", id).select().single();
      return jsonRes(200, data, ctx);
    }

    if (path.match(/^\/v1\/artifacts\/[^/]+\/retire$/) && req.method === "POST") {
      const id = path.split("/")[3];
      const { data: existing } = await db.from("zibo_artifacts").select("status").eq("id", id).single();
      if (!existing || existing.status !== "DEPRECATED") {
        return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: "Only DEPRECATED → RETIRED", details: {} } }, ctx);
      }
      const { data } = await db.from("zibo_artifacts").update({ status: "RETIRED" }).eq("id", id).select().single();
      return jsonRes(200, data, ctx);
    }

    if (path === "/v1/artifacts/by-canonical" && req.method === "GET") {
      const canonical = url.searchParams.get("canonical_url");
      const version = url.searchParams.get("version");
      const scope = url.searchParams.get("tenant_scope") || "TENANT_PLUS_NATIONAL";
      let query = db.from("zibo_artifacts").select("*").eq("canonical_url", canonical!);
      if (version) query = query.eq("version", version);
      if (scope === "NATIONAL_ONLY") {
        query = query.eq("tenant_id", "NATIONAL");
      } else {
        query = query.in("tenant_id", [ctx.tenantId, "NATIONAL"]);
      }
      const { data } = await query.order("tenant_id", { ascending: false }).limit(1);
      return jsonRes(200, data?.[0] || null, ctx);
    }

    if (path === "/v1/artifacts" && req.method === "GET") {
      const status = url.searchParams.get("status");
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      let query = db.from("zibo_artifacts").select("*").in("tenant_id", [tenant, "NATIONAL"]);
      if (status) query = query.eq("status", status);
      const { data } = await query.order("created_at", { ascending: false }).limit(100);
      return jsonRes(200, { artifacts: data || [] }, ctx);
    }

    // ─── IMPORT ───
    if (path === "/v1/import/fhir-bundle" && req.method === "POST") {
      const body = await req.json();
      const entries = body.entry || [];
      const results: unknown[] = [];
      for (const entry of entries) {
        const resource = entry.resource;
        if (!resource) continue;
        const hash = computeHash(resource.url || "", resource.version || "1.0.0", resource);
        const { data, error } = await db.from("zibo_artifacts").upsert({
          tenant_id: body.tenant_id || ctx.tenantId,
          fhir_type: resource.resourceType,
          canonical_url: resource.url || `urn:temp:${crypto.randomUUID()}`,
          version: resource.version || "1.0.0",
          status: "DRAFT",
          content_json: resource,
          hash,
          created_by_actor_id: ctx.actorId,
        }, { onConflict: "tenant_id,canonical_url,version", ignoreDuplicates: false }).select().single();
        results.push(error ? { error: error.message } : data);
      }
      return jsonRes(200, { imported: results.length, results }, ctx);
    }

    if (path === "/v1/import/csv-codelist" && req.method === "POST") {
      const body = await req.json();
      // body: { name, system_url, version, codes: [{code, display}], create_valueset?: bool, tenant_id? }
      const codes = body.codes || [];
      const csConcepts = codes.map((c: { code: string; display: string }) => ({ code: c.code, display: c.display }));
      const csResource = {
        resourceType: "CodeSystem",
        url: body.system_url,
        name: body.name,
        version: body.version || "1.0.0",
        status: "draft",
        content: "complete",
        concept: csConcepts,
      };
      const hash = computeHash(body.system_url, body.version || "1.0.0", csResource);
      const { data: csArtifact } = await db.from("zibo_artifacts").upsert({
        tenant_id: body.tenant_id || ctx.tenantId,
        fhir_type: "CodeSystem",
        canonical_url: body.system_url,
        version: body.version || "1.0.0",
        status: "DRAFT",
        content_json: csResource,
        hash,
        created_by_actor_id: ctx.actorId,
      }, { onConflict: "tenant_id,canonical_url,version" }).select().single();

      let vsArtifact = null;
      if (body.create_valueset) {
        const vsUrl = body.system_url + "/vs";
        const vsResource = {
          resourceType: "ValueSet",
          url: vsUrl,
          name: body.name + " ValueSet",
          version: body.version || "1.0.0",
          status: "draft",
          compose: { include: [{ system: body.system_url }] },
        };
        const vsHash = computeHash(vsUrl, body.version || "1.0.0", vsResource);
        const { data } = await db.from("zibo_artifacts").upsert({
          tenant_id: body.tenant_id || ctx.tenantId,
          fhir_type: "ValueSet",
          canonical_url: vsUrl,
          version: body.version || "1.0.0",
          status: "DRAFT",
          content_json: vsResource,
          hash: vsHash,
          created_by_actor_id: ctx.actorId,
        }, { onConflict: "tenant_id,canonical_url,version" }).select().single();
        vsArtifact = data;
      }
      return jsonRes(200, { code_system: csArtifact, value_set: vsArtifact, codes_count: codes.length }, ctx);
    }

    // ─── EXPORT ───
    if (path === "/v1/export/pack" && req.method === "GET") {
      const packId = url.searchParams.get("pack_id")!;
      const version = url.searchParams.get("version")!;
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      const { data: packArts } = await db.from("zibo_pack_artifacts")
        .select("artifact_id").eq("pack_id", packId).eq("pack_version", version).eq("tenant_id", tenant);
      const ids = (packArts || []).map((r: { artifact_id: string }) => r.artifact_id);
      const { data: artifacts } = await db.from("zibo_artifacts").select("content_json").in("id", ids);
      const bundle = {
        resourceType: "Bundle",
        type: "collection",
        entry: (artifacts || []).map((a: { content_json: unknown }) => ({ resource: a.content_json })),
      };
      return jsonRes(200, bundle, ctx);
    }

    // ─── PACKS ───
    if (path === "/v1/packs/draft" && req.method === "POST") {
      const body = await req.json();
      const { data, error } = await db.from("zibo_packs").insert({
        pack_id: body.pack_id,
        tenant_id: body.tenant_id || ctx.tenantId,
        name: body.name,
        version: body.version,
        status: "DRAFT",
        manifest_json: body.manifest_json || {},
      }).select().single();
      if (error) return jsonRes(400, { error: { code: "INSERT_FAILED", message: error.message, details: {} } }, ctx);
      return jsonRes(201, data, ctx);
    }

    if (path.match(/^\/v1\/packs\/draft\/[^/]+\/[^/]+$/) && req.method === "PUT") {
      const parts = path.split("/");
      const packId = parts[4];
      const version = parts[5];
      const body = await req.json();
      const tenant = body.tenant_id || ctx.tenantId;
      const { data } = await db.from("zibo_packs").update({
        name: body.name,
        manifest_json: body.manifest_json,
      }).eq("pack_id", packId).eq("version", version).eq("tenant_id", tenant).eq("status", "DRAFT").select().single();
      if (!data) return jsonRes(409, { error: { code: "IMMUTABLE", message: "Only DRAFT packs editable", details: {} } }, ctx);
      // Update pack_artifacts
      if (body.artifact_ids) {
        await db.from("zibo_pack_artifacts").delete().eq("pack_id", packId).eq("pack_version", version).eq("tenant_id", tenant);
        const rows = body.artifact_ids.map((aid: string) => ({ pack_id: packId, pack_version: version, tenant_id: tenant, artifact_id: aid }));
        if (rows.length > 0) await db.from("zibo_pack_artifacts").insert(rows);
      }
      return jsonRes(200, data, ctx);
    }

    if (path.match(/^\/v1\/packs\/[^/]+\/[^/]+\/publish$/) && req.method === "POST") {
      const parts = path.split("/");
      const packId = parts[3];
      const version = parts[4];
      const body = await req.json().catch(() => ({}));
      const tenant = body.tenant_id || ctx.tenantId;
      const { data } = await db.from("zibo_packs").update({ status: "PUBLISHED" })
        .eq("pack_id", packId).eq("version", version).eq("tenant_id", tenant).eq("status", "DRAFT").select().single();
      if (!data) return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: "Only DRAFT → PUBLISHED", details: {} } }, ctx);
      return jsonRes(200, data, ctx);
    }

    if (path.match(/^\/v1\/packs\/[^/]+\/[^/]+\/deprecate$/) && req.method === "POST") {
      const parts = path.split("/");
      const packId = parts[3];
      const version = parts[4];
      const body = await req.json().catch(() => ({}));
      const tenant = body.tenant_id || ctx.tenantId;
      const { data } = await db.from("zibo_packs").update({ status: "DEPRECATED" })
        .eq("pack_id", packId).eq("version", version).eq("tenant_id", tenant).eq("status", "PUBLISHED").select().single();
      if (!data) return jsonRes(409, { error: { code: "INVALID_TRANSITION", message: "Only PUBLISHED → DEPRECATED", details: {} } }, ctx);
      return jsonRes(200, data, ctx);
    }

    if (path === "/v1/packs/list" && req.method === "GET") {
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      const status = url.searchParams.get("status");
      let query = db.from("zibo_packs").select("*").in("tenant_id", [tenant, "NATIONAL"]);
      if (status) query = query.eq("status", status);
      const { data } = await query.order("created_at", { ascending: false });
      return jsonRes(200, { packs: data || [] }, ctx);
    }

    // ─── ASSIGNMENTS ───
    if (path === "/v1/assignments" && req.method === "POST") {
      const body = await req.json();
      const { data, error } = await db.from("zibo_assignments").insert({
        tenant_id: body.tenant_id || ctx.tenantId,
        scope_type: body.scope_type,
        scope_id: body.scope_id,
        pack_tenant_id: body.pack_tenant_id || "NATIONAL",
        pack_id: body.pack_id,
        pack_version: body.pack_version,
        policy_mode: body.policy_mode || "LENIENT",
      }).select().single();
      if (error) return jsonRes(400, { error: { code: "INSERT_FAILED", message: error.message, details: {} } }, ctx);
      return jsonRes(201, data, ctx);
    }

    if (path === "/v1/assignments/effective" && req.method === "GET") {
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      const facilityId = url.searchParams.get("facility_id");
      const workspaceId = url.searchParams.get("workspace_id");

      // Resolution: WORKSPACE > FACILITY > TENANT > NATIONAL default
      let assignment = null;
      if (workspaceId) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "WORKSPACE").eq("scope_id", workspaceId).limit(1).single();
        if (data) assignment = data;
      }
      if (!assignment && facilityId) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "FACILITY").eq("scope_id", facilityId).limit(1).single();
        if (data) assignment = data;
      }
      if (!assignment) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "TENANT").eq("scope_id", tenant).limit(1).single();
        if (data) assignment = data;
      }

      if (!assignment) {
        return jsonRes(200, { policy_mode: "LENIENT", packs: [], resolved_from: "FALLBACK" }, ctx);
      }

      return jsonRes(200, {
        policy_mode: assignment.policy_mode,
        packs: [{ pack_id: assignment.pack_id, version: assignment.pack_version, pack_tenant_id: assignment.pack_tenant_id }],
        resolved_from: assignment.scope_type,
      }, ctx);
    }

    if (path === "/v1/assignments" && req.method === "GET") {
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      const { data } = await db.from("zibo_assignments").select("*").eq("tenant_id", tenant).order("created_at", { ascending: false });
      return jsonRes(200, { assignments: data || [] }, ctx);
    }

    // ─── VALIDATION (sync) ───
    if (path === "/v1/validate/coding" && req.method === "POST") {
      const body = await req.json();
      const coding = body.coding;
      const context = body.context || {};
      const requestedMode = body.requested_mode;
      const tenant = context.tenant_id || ctx.tenantId;
      const facilityId = context.facility_id;
      const workspaceId = context.workspace_id;
      const serviceName = context.service_name || "unknown";

      // Resolve effective policy
      let effectiveMode = "LENIENT";
      let assignmentData = null;
      if (workspaceId) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "WORKSPACE").eq("scope_id", workspaceId).limit(1).single();
        if (data) assignmentData = data;
      }
      if (!assignmentData && facilityId) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "FACILITY").eq("scope_id", facilityId).limit(1).single();
        if (data) assignmentData = data;
      }
      if (!assignmentData) {
        const { data } = await db.from("zibo_assignments").select("*")
          .eq("tenant_id", tenant).eq("scope_type", "TENANT").eq("scope_id", tenant).limit(1).single();
        if (data) assignmentData = data;
      }
      if (assignmentData) effectiveMode = assignmentData.policy_mode;
      // requested can only make stricter
      if (requestedMode === "STRICT") effectiveMode = "STRICT";

      // Validate: look for system+code in CodeSystem artifacts
      const { data: codeSystems } = await db.from("zibo_artifacts").select("content_json")
        .in("tenant_id", [tenant, "NATIONAL"])
        .eq("fhir_type", "CodeSystem")
        .in("status", ["PUBLISHED", "DRAFT"]);

      let found = false;
      for (const cs of codeSystems || []) {
        const content = cs.content_json as { url?: string; concept?: Array<{ code: string }> };
        if (content.url !== coding.system) continue;
        const concepts = content.concept || [];
        if (concepts.some((c: { code: string }) => c.code === coding.code)) {
          found = true;
          break;
        }
      }

      // Check mappings for suggestions
      const { data: mappings } = await db.from("zibo_mappings_index").select("*")
        .eq("source_system", coding.system).eq("source_code", coding.code).limit(5);

      const issues: unknown[] = [];
      if (!found) {
        issues.push({
          code: "UNKNOWN_CODE",
          severity: effectiveMode === "STRICT" ? "ERROR" : "WARN",
          message: `Code '${coding.code}' not found in system '${coding.system}'`,
        });
      }

      const valid = effectiveMode === "STRICT" ? found : true;
      const result = {
        valid,
        mode: effectiveMode,
        unvalidated: !found && effectiveMode === "LENIENT",
        issues,
        suggested_mappings: (mappings || []).map((m: { target_system: string; target_code: string; confidence: number }) => ({
          target_system: m.target_system,
          target_code: m.target_code,
          confidence: m.confidence,
        })),
      };

      // Log validation
      if (issues.length > 0) {
        await db.from("zibo_validation_logs").insert({
          tenant_id: tenant,
          facility_id: facilityId,
          service_name: serviceName,
          severity: found ? "INFO" : (effectiveMode === "STRICT" ? "ERROR" : "WARN"),
          issue_code: found ? "VALID" : "UNKNOWN_CODE",
          canonical_url: coding.system,
          details_json: { coding, result },
        });
      }

      return jsonRes(200, result, ctx);
    }

    if (path === "/v1/validate/resource" && req.method === "POST") {
      const body = await req.json();
      const resource = body.resource;
      const context = body.context || {};
      const tenant = context.tenant_id || ctx.tenantId;

      // Scan for Coding occurrences (basic JSON traversal)
      const codings: Array<{ system: string; code: string; display?: string; path: string }> = [];
      function findCodings(obj: unknown, path: string) {
        if (!obj || typeof obj !== "object") return;
        const o = obj as Record<string, unknown>;
        if (o.system && o.code && typeof o.system === "string" && typeof o.code === "string") {
          codings.push({ system: o.system as string, code: o.code as string, display: o.display as string | undefined, path });
        }
        for (const [k, v] of Object.entries(o)) {
          if (Array.isArray(v)) v.forEach((item, i) => findCodings(item, `${path}.${k}[${i}]`));
          else if (typeof v === "object") findCodings(v, `${path}.${k}`);
        }
      }
      findCodings(resource, "$");

      // Validate each coding
      const allIssues: unknown[] = [];
      let errorCount = 0, warnCount = 0;
      for (const c of codings) {
        // Quick check
        const { data: codeSystems } = await db.from("zibo_artifacts").select("content_json")
          .in("tenant_id", [tenant, "NATIONAL"]).eq("fhir_type", "CodeSystem").in("status", ["PUBLISHED", "DRAFT"]);
        let found = false;
        for (const cs of codeSystems || []) {
          const content = cs.content_json as { url?: string; concept?: Array<{ code: string }> };
          if (content.url !== c.system) continue;
          if ((content.concept || []).some((cc: { code: string }) => cc.code === c.code)) { found = true; break; }
        }
        if (!found) {
          allIssues.push({ path: c.path, code: "UNKNOWN_CODE", severity: "WARN", system: c.system, coding_code: c.code });
          warnCount++;
        }
      }

      return jsonRes(200, {
        total_codings: codings.length,
        issues: allIssues,
        summary: { errors: errorCount, warnings: warnCount, valid: codings.length - errorCount - warnCount },
      }, ctx);
    }

    // ─── VALIDATION (async) ───
    if (path === "/v1/validate/job" && req.method === "POST") {
      const body = await req.json();
      const { data } = await db.from("zibo_validation_jobs").insert({
        tenant_id: body.tenant_id || ctx.tenantId,
        facility_id: body.facility_id,
        requested_policy_mode: body.requested_policy_mode,
        payload_json: body.payload_json,
        status: "QUEUED",
      }).select().single();
      // Process immediately (prototype)
      if (data) {
        await db.from("zibo_validation_jobs").update({ status: "DONE", result_json: { note: "Processed immediately in prototype" }, completed_at: new Date().toISOString() }).eq("job_id", data.job_id);
      }
      return jsonRes(201, data, ctx);
    }

    if (path.match(/^\/v1\/validate\/job\/[^/]+$/) && req.method === "GET") {
      const jobId = path.split("/").pop()!;
      const { data } = await db.from("zibo_validation_jobs").select("*").eq("job_id", jobId).single();
      return jsonRes(200, data, ctx);
    }

    // ─── MAPPING ───
    if (path === "/v1/map" && req.method === "POST") {
      const body = await req.json();
      const { data } = await db.from("zibo_mappings_index").select("*")
        .eq("source_system", body.source_system).eq("source_code", body.source_code);
      let filtered = data || [];
      if (body.target_system) filtered = filtered.filter((m: { target_system: string }) => m.target_system === body.target_system);
      if (filtered.length === 0) {
        return jsonRes(200, { found: false, mappings: [] }, ctx);
      }
      filtered.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);
      return jsonRes(200, { found: true, best_match: filtered[0], mappings: filtered }, ctx);
    }

    // ─── VALIDATION LOGS ───
    if (path === "/v1/logs" && req.method === "GET") {
      const tenant = url.searchParams.get("tenant_id") || ctx.tenantId;
      const facilityId = url.searchParams.get("facility_id");
      const serviceName = url.searchParams.get("service_name");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      let query = db.from("zibo_validation_logs").select("*").eq("tenant_id", tenant);
      if (facilityId) query = query.eq("facility_id", facilityId);
      if (serviceName) query = query.eq("service_name", serviceName);
      const { data } = await query.order("created_at", { ascending: false }).limit(limit);
      return jsonRes(200, { logs: data || [] }, ctx);
    }

    return jsonRes(404, { error: { code: "NOT_FOUND", message: `Unknown route: ${path}`, details: {} } }, ctx);
  } catch (e) {
    console.error("ZIBO error:", e);
    return jsonRes(500, { error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Unknown", details: {} } }, ctx);
  }
});
