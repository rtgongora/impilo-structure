import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, x-decision-id, x-break-glass, x-consent-decision",
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
  consentDecision?: string;
  requestId: string;
}

function err(code: string, msg: string, status: number, ctx: Partial<Ctx>) {
  return new Response(JSON.stringify({
    error: { code, message: msg, details: {}, request_id: ctx.requestId || "", correlation_id: ctx.correlationId || "" }
  }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function ok(body: unknown, ctx: Ctx, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": ctx.requestId, "X-Correlation-ID": ctx.correlationId },
  });
}

function extractCtx(req: Request): { ctx: Ctx | null; error: Response | null } {
  const h = (n: string) => req.headers.get(n);
  const rid = h("x-request-id") || crypto.randomUUID();
  const cid = h("x-correlation-id");
  const tid = h("x-tenant-id");
  const aid = h("x-actor-id");
  const at = h("x-actor-type");
  const pou = h("x-purpose-of-use");
  const df = h("x-device-fingerprint");

  const missing: string[] = [];
  if (!tid) missing.push("X-Tenant-Id");
  if (!cid) missing.push("X-Correlation-Id");
  if (!aid) missing.push("X-Actor-Id");
  if (!at) missing.push("X-Actor-Type");
  if (!pou) missing.push("X-Purpose-Of-Use");
  if (!df) missing.push("X-Device-Fingerprint");

  if (missing.length > 0) {
    return { ctx: null, error: err("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, { requestId: rid, correlationId: cid || "" }) };
  }

  return {
    ctx: {
      tenantId: tid!, correlationId: cid!, actorId: aid!, actorType: at!,
      purposeOfUse: pou!, deviceFingerprint: df!, requestId: rid,
      facilityId: h("x-facility-id") || undefined, workspaceId: h("x-workspace-id") || undefined,
      shiftId: h("x-shift-id") || undefined, decisionId: h("x-decision-id") || undefined,
      breakGlass: h("x-break-glass") === "true", consentDecision: h("x-consent-decision") || undefined,
    },
    error: null,
  };
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── PII Detection ──
const PII_PATTERNS = [
  /Patient\.name/i, /Patient\.telecom/i, /Patient\.address/i,
  /"name"\s*:\s*\[/, /"telecom"\s*:\s*\[/, /"address"\s*:\s*\[/,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // email
];

const PII_PATHS = ["name", "telecom", "address", "contact", "photo"];

function detectPII(resource: Record<string, unknown>): string[] {
  const violations: string[] = [];
  const raw = JSON.stringify(resource);
  PII_PATTERNS.forEach((p, i) => { if (p.test(raw)) violations.push(`pattern_${i}`); });
  for (const p of PII_PATHS) {
    if (resource[p] !== undefined && resource[p] !== null) violations.push(`field:${p}`);
  }
  // Check subject is CPID/O-CPID only
  if (resource.resourceType === "Patient") {
    const idents = (resource as any).identifier;
    if (Array.isArray(idents)) {
      for (const id of idents) {
        if (id.system && !id.system.includes("cpid") && !id.system.includes("o-cpid")) {
          violations.push("non_cpid_identifier");
        }
      }
    }
  }
  return violations;
}

function buildMeta(ctx: Ctx, isProvisional: boolean) {
  const tags: string[] = [`tenant:${ctx.tenantId}`, `purpose:${ctx.purposeOfUse}`];
  if (ctx.facilityId) tags.push(`facility:${ctx.facilityId}`);
  if (ctx.workspaceId) tags.push(`workspace:${ctx.workspaceId}`);
  if (ctx.breakGlass) tags.push("break-glass");
  if (isProvisional) tags.push("provisional");
  return {
    tags, audit: {
      actor_id: ctx.actorId, actor_type: ctx.actorType, purpose_of_use: ctx.purposeOfUse,
      correlation_id: ctx.correlationId, device_fingerprint: ctx.deviceFingerprint,
      facility_id: ctx.facilityId, workspace_id: ctx.workspaceId,
      break_glass: ctx.breakGlass, decision_id: ctx.decisionId,
    },
  };
}

const VALID_TYPES = new Set([
  "Encounter", "Condition", "AllergyIntolerance", "MedicationRequest", "MedicationStatement",
  "Observation", "DiagnosticReport", "Procedure", "Immunization", "CarePlan", "ServiceRequest",
  "DocumentReference", "Binary", "Appointment", "ImagingStudy", "Patient",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/butano-v1/, "");
  const { ctx, error: ctxErr } = extractCtx(req);
  if (!ctx) return ctxErr!;

  const sb = getSupabase();

  try {
    // ═══ FHIR-ish endpoints ═══
    const fhirMatch = path.match(/^\/fhir\/([A-Za-z]+)(?:\/(.+))?$/);
    if (fhirMatch) {
      const resourceType = fhirMatch[1];
      const fhirId = fhirMatch[2];
      if (!VALID_TYPES.has(resourceType)) return err("INVALID_RESOURCE_TYPE", `Unsupported: ${resourceType}`, 400, ctx);

      // GET single
      if (req.method === "GET" && fhirId) {
        const { data } = await sb.from("butano_fhir_resources")
          .select("*").eq("tenant_id", ctx.tenantId).eq("fhir_id", fhirId).single();
        if (!data) return err("NOT_FOUND", "Resource not found", 404, ctx);
        return ok(data.resource_json, ctx);
      }

      // GET search
      if (req.method === "GET" && !fhirId) {
        let q = sb.from("butano_fhir_resources")
          .select("*").eq("tenant_id", ctx.tenantId).eq("resource_type", resourceType)
          .order("last_updated_at", { ascending: false }).limit(100);
        const subject = url.searchParams.get("subject");
        if (subject) q = q.eq("subject_cpid", subject);
        const encounter = url.searchParams.get("encounter");
        if (encounter) q = q.eq("encounter_id", encounter);
        const { data } = await q;
        return ok({ resourceType: "Bundle", total: data?.length || 0, entry: (data || []).map((r: any) => ({ resource: r.resource_json })) }, ctx);
      }

      // POST create
      if (req.method === "POST" && !fhirId) {
        const body = await req.json();
        const piiViolations = detectPII(body);
        if (piiViolations.length > 0) {
          await sb.from("butano_pii_violations").insert({
            tenant_id: ctx.tenantId, resource_type: resourceType,
            violation_type: "WRITE_REJECTED", violation_paths: piiViolations,
            actor_id: ctx.actorId, correlation_id: ctx.correlationId,
          });
          return err("PII_VIOLATION", "Payload contains prohibited PII fields", 422, ctx);
        }
        const subjectCpid = body.subject?.reference?.replace("Patient/", "") || body.subject?.identifier?.value || "";
        const isProvisional = subjectCpid.startsWith("O-CPID-");
        const newFhirId = body.id || crypto.randomUUID();
        const meta = buildMeta(ctx, isProvisional);
        const { data, error: insertErr } = await sb.from("butano_fhir_resources").insert({
          tenant_id: ctx.tenantId, resource_type: resourceType, fhir_id: newFhirId,
          subject_cpid: subjectCpid, encounter_id: body.encounter?.reference?.replace("Encounter/", "") || null,
          effective_at: body.effectiveDateTime || body.period?.start || null,
          is_provisional: isProvisional, meta_json: meta,
          resource_json: { ...body, id: newFhirId, meta: { ...meta, lastUpdated: new Date().toISOString() } },
        }).select().single();
        if (insertErr) return err("WRITE_FAILED", insertErr.message, 500, ctx);
        // Outbox
        await sb.from("butano_outbox_events").insert({
          tenant_id: ctx.tenantId, event_type: "butano.resource.created",
          payload_json: { resource_type: resourceType, fhir_id: newFhirId, subject_cpid: subjectCpid, is_provisional: isProvisional },
        });
        return ok(data!.resource_json, ctx, 201);
      }

      // PUT update
      if (req.method === "PUT" && fhirId) {
        const body = await req.json();
        const piiViolations = detectPII(body);
        if (piiViolations.length > 0) {
          await sb.from("butano_pii_violations").insert({
            tenant_id: ctx.tenantId, resource_type: resourceType, fhir_id: fhirId,
            violation_type: "UPDATE_REJECTED", violation_paths: piiViolations,
            actor_id: ctx.actorId, correlation_id: ctx.correlationId,
          });
          return err("PII_VIOLATION", "Payload contains prohibited PII fields", 422, ctx);
        }
        const subjectCpid = body.subject?.reference?.replace("Patient/", "") || body.subject?.identifier?.value || "";
        const isProvisional = subjectCpid.startsWith("O-CPID-");
        const meta = buildMeta(ctx, isProvisional);
        const { data, error: upErr } = await sb.from("butano_fhir_resources")
          .update({
            resource_json: { ...body, id: fhirId, meta: { ...meta, lastUpdated: new Date().toISOString() } },
            meta_json: meta, is_provisional: isProvisional, subject_cpid: subjectCpid,
            last_updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", ctx.tenantId).eq("fhir_id", fhirId).select().single();
        if (upErr || !data) return err("NOT_FOUND", "Resource not found or update failed", 404, ctx);
        await sb.from("butano_outbox_events").insert({
          tenant_id: ctx.tenantId, event_type: "butano.resource.updated",
          payload_json: { resource_type: resourceType, fhir_id: fhirId, subject_cpid: subjectCpid },
        });
        return ok(data.resource_json, ctx);
      }

      return err("METHOD_NOT_ALLOWED", "Method not allowed", 405, ctx);
    }

    // ═══ IPS Summary ═══
    if (path.match(/^\/v1\/summary\/ips\//) && req.method === "GET") {
      const cpid = path.split("/").pop()!;
      const types = ["AllergyIntolerance", "Condition", "MedicationRequest", "MedicationStatement",
        "Immunization", "Observation", "Procedure", "CarePlan"];
      const { data } = await sb.from("butano_fhir_resources")
        .select("resource_type, resource_json, last_updated_at")
        .eq("tenant_id", ctx.tenantId).eq("subject_cpid", cpid)
        .in("resource_type", types).order("last_updated_at", { ascending: false });
      const sections: Record<string, unknown[]> = {};
      for (const r of data || []) {
        const t = r.resource_type;
        if (!sections[t]) sections[t] = [];
        sections[t].push(r.resource_json);
      }
      return ok({
        resourceType: "Bundle", type: "document", identifier: { value: `IPS-${cpid}` },
        timestamp: new Date().toISOString(), subject_cpid: cpid,
        sections: {
          allergies: sections["AllergyIntolerance"] || [],
          problems: sections["Condition"] || [],
          medications: [...(sections["MedicationRequest"] || []), ...(sections["MedicationStatement"] || [])],
          immunizations: sections["Immunization"] || [],
          vitals: (sections["Observation"] || []).filter((o: any) => o.category?.[0]?.coding?.[0]?.code === "vital-signs"),
          labs: (sections["Observation"] || []).filter((o: any) => o.category?.[0]?.coding?.[0]?.code === "laboratory"),
          procedures: sections["Procedure"] || [],
          carePlans: sections["CarePlan"] || [],
        },
        total_resources: (data || []).length,
      }, ctx);
    }

    // ═══ Visit Summary ═══
    if (path.match(/^\/v1\/summary\/visit\//) && req.method === "GET") {
      const encId = path.split("/").pop()!;
      const { data } = await sb.from("butano_fhir_resources")
        .select("resource_type, resource_json, last_updated_at")
        .eq("tenant_id", ctx.tenantId).eq("encounter_id", encId)
        .order("last_updated_at", { ascending: false });
      const encounter = (data || []).find((r: any) => r.resource_type === "Encounter");
      const others = (data || []).filter((r: any) => r.resource_type !== "Encounter");
      return ok({
        resourceType: "Bundle", type: "document", identifier: { value: `VISIT-${encId}` },
        timestamp: new Date().toISOString(), encounter_id: encId,
        encounter: encounter?.resource_json || null,
        resources: others.map((r: any) => ({ resourceType: r.resource_type, resource: r.resource_json })),
        total_resources: (data || []).length,
      }, ctx);
    }

    // ═══ Timeline ═══
    if (path.match(/^\/v1\/timeline\//) && req.method === "GET") {
      const cpid = path.replace("/v1/timeline/", "").split("?")[0];
      const since = url.searchParams.get("since");
      const type = url.searchParams.get("type");
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = 50;
      let q = sb.from("butano_fhir_resources")
        .select("id, resource_type, fhir_id, encounter_id, effective_at, last_updated_at, is_provisional, meta_json", { count: "exact" })
        .eq("tenant_id", ctx.tenantId).eq("subject_cpid", cpid)
        .order("last_updated_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (since) q = q.gte("last_updated_at", since);
      if (type) q = q.eq("resource_type", type);
      const { data, count } = await q;
      return ok({
        items: (data || []).map((r: any) => ({
          id: r.id, resource_type: r.resource_type, fhir_id: r.fhir_id,
          encounter_id: r.encounter_id, effective_at: r.effective_at,
          last_updated_at: r.last_updated_at, is_provisional: r.is_provisional,
          tags: r.meta_json?.tags || [],
        })),
        page, page_size: pageSize, total: count || 0,
      }, ctx);
    }

    // ═══ Reconcile Subject ═══
    if (path === "/v1/internal/reconcile-subject" && req.method === "POST") {
      const { from_ocpid, to_cpid } = await req.json();
      if (!from_ocpid || !to_cpid) return err("INVALID_REQUEST", "from_ocpid and to_cpid required", 400, ctx);

      // Create job
      const { data: job } = await sb.from("butano_reconciliation_queue").insert({
        tenant_id: ctx.tenantId, from_ocpid, to_cpid, status: "RUNNING",
      }).select().single();

      // Create mapping
      await sb.from("butano_subject_mappings").insert({
        tenant_id: ctx.tenantId, from_subject: from_ocpid, to_subject: to_cpid,
        status: "RUNNING", requested_by_actor_id: ctx.actorId,
      });

      // Rewrite records
      const { data: affected } = await sb.from("butano_fhir_resources")
        .select("id, meta_json").eq("tenant_id", ctx.tenantId).eq("subject_cpid", from_ocpid);
      let rewritten = 0;
      for (const rec of affected || []) {
        const tags = [...(rec.meta_json?.tags || []), `reconciled_from:${from_ocpid}`];
        await sb.from("butano_fhir_resources").update({
          subject_cpid: to_cpid, is_provisional: false,
          meta_json: { ...rec.meta_json, tags },
          last_updated_at: new Date().toISOString(),
        }).eq("id", rec.id);
        rewritten++;
      }

      // Complete job
      const summary = { records_rewritten: rewritten, from_ocpid, to_cpid };
      await sb.from("butano_reconciliation_queue").update({
        status: "COMPLETED", updated_at: new Date().toISOString(),
      }).eq("job_id", job!.job_id);
      await sb.from("butano_subject_mappings").update({
        status: "COMPLETED", completed_at: new Date().toISOString(), summary_json: summary,
      }).eq("tenant_id", ctx.tenantId).eq("from_subject", from_ocpid).eq("status", "RUNNING");

      // Outbox
      await sb.from("butano_outbox_events").insert({
        tenant_id: ctx.tenantId, event_type: "butano.reconcile.completed", payload_json: summary,
      });

      return ok({ status: "COMPLETED", ...summary }, ctx);
    }

    // ═══ Health / Tenants ═══
    if (path === "/v1/internal/health/tenants" && req.method === "GET") {
      const { data } = await sb.from("butano_tenants").select("*");
      return ok({ tenants: data || [] }, ctx);
    }

    // ═══ Stats ═══
    if (path === "/v1/internal/stats" && req.method === "GET") {
      const { data } = await sb.from("butano_fhir_resources")
        .select("resource_type, last_updated_at")
        .eq("tenant_id", ctx.tenantId).order("last_updated_at", { ascending: false });
      const counts: Record<string, { count: number; last_updated: string }> = {};
      for (const r of data || []) {
        if (!counts[r.resource_type]) counts[r.resource_type] = { count: 0, last_updated: r.last_updated_at };
        counts[r.resource_type].count++;
      }
      return ok({ tenant_id: ctx.tenantId, resource_stats: counts, total: (data || []).length }, ctx);
    }

    // ═══ Reconciliation Queue ═══
    if (path === "/v1/internal/reconciliation/queue" && req.method === "GET") {
      const { data } = await sb.from("butano_reconciliation_queue")
        .select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(100);
      return ok({ jobs: data || [] }, ctx);
    }

    // ═══ PII Violations ═══
    if (path === "/v1/internal/pii-violations" && req.method === "GET") {
      const { data } = await sb.from("butano_pii_violations")
        .select("*").eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(100);
      return ok({ violations: data || [] }, ctx);
    }

    return err("NOT_FOUND", `Unknown endpoint: ${path}`, 404, ctx);
  } catch (e) {
    console.error(`[${ctx.requestId}] Error:`, e);
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Internal error", 500, ctx);
  }
});
