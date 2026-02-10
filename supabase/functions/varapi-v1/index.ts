/**
 * VARAPI v1.1 — Provider Registry + Council Ops + Token/Bio Edge Function
 * Executable reference brief for human-led dev stream.
 */
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
  requestId: string;
  actorId: string;
  actorType: string;
  purposeOfUse: string;
  deviceFingerprint: string;
  facilityId?: string;
  workspaceId?: string;
  shiftId?: string;
}

function err(code: string, message: string, status: number, ctx: Partial<Ctx>, details: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    error: { code, message, details, request_id: ctx.requestId || "", correlation_id: ctx.correlationId || "" }
  }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function ok(body: unknown, ctx: Ctx, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": ctx.requestId, "X-Correlation-ID": ctx.correlationId },
  });
}

function extractCtx(req: Request): { ctx: Ctx | null; error: Response | null } {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const correlationId = req.headers.get("x-correlation-id") || "";
  const tenantId = req.headers.get("x-tenant-id") || "";
  const actorId = req.headers.get("x-actor-id") || "";
  const actorType = req.headers.get("x-actor-type") || "";
  const purposeOfUse = req.headers.get("x-purpose-of-use") || "";
  const deviceFingerprint = req.headers.get("x-device-fingerprint") || "";

  const missing: string[] = [];
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!correlationId) missing.push("X-Correlation-Id");
  if (!deviceFingerprint) missing.push("X-Device-Fingerprint");
  if (!purposeOfUse) missing.push("X-Purpose-Of-Use");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");

  if (missing.length > 0) {
    return { ctx: null, error: err("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, { requestId, correlationId }, { missing_headers: missing }) };
  }

  return {
    ctx: {
      tenantId, correlationId, requestId, actorId, actorType, purposeOfUse, deviceFingerprint,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
    },
    error: null,
  };
}

function getDb() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// Generate ULID-like public ID
function genPublicId(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b % 32]).join("");
  return (t + r).slice(0, 26);
}

// Generate VA token: VA- + 10 digits + 1 check char
function genVAToken(): string {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => (b % 10).toString()).join("");
  const sum = digits.split("").reduce((a, d) => a + parseInt(d), 0);
  const check = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[sum % 26];
  return `VA-${digits}${check}`;
}

// Simulate HMAC hash (prototype — real impl uses server-side HMAC with pepper)
async function computeHash(token: string): Promise<string> {
  const enc = new TextEncoder().encode(token.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Simulate Argon2 verifier (prototype uses SHA-512 as stand-in)
async function computeVerifier(token: string): Promise<string> {
  const enc = new TextEncoder().encode("argon2id$" + token.toUpperCase());
  const hash = await crypto.subtle.digest("SHA-512", enc);
  return "argon2id$" + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function validateZibo(db: any, tenantId: string, codeSystem: string, code: string): Promise<{ valid: boolean; status: string }> {
  const { data: config } = await db.from("varapi_tenant_config").select("zibo_validation_mode").eq("tenant_id", tenantId).limit(1).single();
  const mode = config?.zibo_validation_mode || "LENIENT";
  const { data: codeRow } = await db.from("varapi_code_sets").select("code").eq("code_system", codeSystem).eq("code", code).eq("active", true).limit(1).single();
  if (codeRow) return { valid: true, status: "VALID" };
  if (mode === "STRICT") return { valid: false, status: "INVALID" };
  return { valid: true, status: "UNVALIDATED" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/varapi-v1/, "");
  const method = req.method;
  const { ctx, error: ctxErr } = extractCtx(req);
  if (!ctx) return ctxErr!;
  const db = getDb();

  try {
    // ─── PROVIDERS ───
    if (path === "/providers" && method === "POST") {
      const body = await req.json();
      const publicId = genPublicId();
      const ziboResult = body.cadre_code ? await validateZibo(db, ctx.tenantId, "cadre", body.cadre_code) : { valid: true, status: "UNVALIDATED" };
      if (!ziboResult.valid) return err("ZIBO_VALIDATION_FAILED", `Unknown cadre code: ${body.cadre_code}`, 422, ctx);
      
      const { error: insErr } = await db.from("varapi_providers").insert({
        provider_public_id: publicId,
        tenant_id: ctx.tenantId,
        status: "PENDING",
        cadre_code: body.cadre_code,
        primary_council_id: body.primary_council_id || null,
        profile_json: body.profile || {},
      });
      if (insErr) return err("INSERT_FAILED", insErr.message, 500, ctx);

      await db.from("varapi_outbox_events").insert({ tenant_id: ctx.tenantId, event_type: "PROVIDER_CREATED", payload_json: { provider_public_id: publicId, actor_id: ctx.actorId } });
      return ok({ provider_public_id: publicId, status: "PENDING", cadre_validation_status: ziboResult.status }, ctx, 201);
    }

    if (path.match(/^\/providers\/[^/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      const { data } = await db.from("varapi_providers").select("*").eq("provider_public_id", id).eq("tenant_id", ctx.tenantId).single();
      if (!data) return err("NOT_FOUND", "Provider not found", 404, ctx);
      return ok(data, ctx);
    }

    if (path === "/providers/search" && method === "POST") {
      const body = await req.json();
      let query = db.from("varapi_providers").select("provider_public_id, tenant_id, status, cadre_code, created_at").eq("tenant_id", ctx.tenantId);
      if (body.status) query = query.eq("status", body.status);
      if (body.cadre_code) query = query.eq("cadre_code", body.cadre_code);
      const { data } = await query.limit(body.limit || 50);
      return ok({ results: data || [], count: data?.length || 0 }, ctx);
    }

    if (path.match(/^\/providers\/[^/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { error: upErr } = await db.from("varapi_providers").update({ profile_json: body.profile, cadre_code: body.cadre_code, updated_at: new Date().toISOString() }).eq("provider_public_id", id).eq("tenant_id", ctx.tenantId);
      if (upErr) return err("UPDATE_FAILED", upErr.message, 500, ctx);
      return ok({ updated: true }, ctx);
    }

    if (path.match(/^\/providers\/[^/]+\/status$/) && method === "POST") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { error: upErr } = await db.from("varapi_providers").update({ status: body.status, updated_at: new Date().toISOString() }).eq("provider_public_id", id).eq("tenant_id", ctx.tenantId);
      if (upErr) return err("UPDATE_FAILED", upErr.message, 500, ctx);
      // Log license event if license_id provided
      if (body.license_id) {
        await db.from("varapi_license_events").insert({ license_id: body.license_id, tenant_id: ctx.tenantId, event_type: body.event_type || "ISSUED", actor_id: ctx.actorId, actor_type: ctx.actorType });
        if (body.license_status) {
          await db.from("varapi_licenses").update({ license_status: body.license_status, updated_at: new Date().toISOString() }).eq("id", body.license_id);
        }
      }
      await db.from("varapi_outbox_events").insert({ tenant_id: ctx.tenantId, event_type: "PROVIDER_STATUS_CHANGED", payload_json: { provider_public_id: id, new_status: body.status, actor_id: ctx.actorId } });
      return ok({ updated: true, status: body.status }, ctx);
    }

    // ─── PRIVILEGES ───
    if (path.match(/^\/providers\/[^/]+\/privileges\/grant$/) && method === "POST") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { data: priv, error: privErr } = await db.from("varapi_privileges").insert({
        provider_public_id: id, tenant_id: ctx.tenantId, facility_id: body.facility_id, workspace_id: body.workspace_id,
        scope_json: body.scope || {}, status: "PENDING", supervising_authority_json: body.supervising_authority || {},
      }).select().single();
      if (privErr) return err("INSERT_FAILED", privErr.message, 500, ctx);
      await db.from("varapi_outbox_events").insert({ tenant_id: ctx.tenantId, event_type: "PRIVILEGE_REQUESTED", payload_json: { privilege_id: priv.id, provider_public_id: id } });
      return ok({ privilege_id: priv.id, status: "PENDING" }, ctx, 201);
    }

    if (path.match(/^\/providers\/[^/]+\/privileges\/revoke$/) && method === "POST") {
      const id = path.split("/")[2];
      const body = await req.json();
      await db.from("varapi_privileges").update({ status: "REVOKED", updated_at: new Date().toISOString() }).eq("id", body.privilege_id).eq("tenant_id", ctx.tenantId);
      await db.from("varapi_outbox_events").insert({ tenant_id: ctx.tenantId, event_type: "PRIVILEGE_REVOKED", payload_json: { privilege_id: body.privilege_id } });
      return ok({ revoked: true }, ctx);
    }

    if (path.match(/^\/providers\/[^/]+\/privileges$/) && method === "GET") {
      const id = path.split("/")[2];
      const { data } = await db.from("varapi_privileges").select("*").eq("provider_public_id", id).eq("tenant_id", ctx.tenantId);
      return ok({ privileges: data || [] }, ctx);
    }

    // ─── PRIVILEGE APPROVALS ───
    if (path.match(/^\/privileges\/[^/]+\/decision$/) && method === "POST") {
      const privId = path.split("/")[2];
      const body = await req.json();
      if (!body.decision_reason) return err("MISSING_FIELD", "decision_reason is required", 400, ctx);
      await db.from("varapi_privilege_approvals").insert({ privilege_id: privId, tenant_id: ctx.tenantId, decision: body.decision, decided_by_actor_id: ctx.actorId, decision_reason: body.decision_reason });
      if (body.decision === "APPROVE") {
        await db.from("varapi_privileges").update({ status: "APPROVED", updated_at: new Date().toISOString() }).eq("id", privId);
      } else {
        await db.from("varapi_privileges").update({ status: "REVOKED", updated_at: new Date().toISOString() }).eq("id", privId);
      }
      return ok({ decided: true, decision: body.decision }, ctx);
    }

    // ─── ELIGIBILITY CHECK ───
    if (path === "/eligibility/check" && method === "POST") {
      const body = await req.json();
      let providerPublicId = body.providerPublicId;

      // If vaToken provided, look up by hash (enumeration-resistant)
      if (body.vaToken && !providerPublicId) {
        const lookupHash = await computeHash(body.vaToken);
        const { data: tokenRow } = await db.from("varapi_provider_tokens").select("provider_public_id, status").eq("lookup_hash", lookupHash).eq("status", "ACTIVE").single();
        if (tokenRow) providerPublicId = tokenRow.provider_public_id;
      }

      // Enumeration resistance: always return same structure
      if (!providerPublicId) {
        return ok({ eligible: false, reasons: ["IDENTITY_NOT_RESOLVED"], license_window: null, required_step_up: false, allowed_facilities: [], allowed_workspaces: [] }, ctx);
      }

      const { data: provider } = await db.from("varapi_providers").select("*").eq("provider_public_id", providerPublicId).eq("tenant_id", ctx.tenantId).single();
      if (!provider) {
        return ok({ eligible: false, reasons: ["IDENTITY_NOT_RESOLVED"], license_window: null, required_step_up: false, allowed_facilities: [], allowed_workspaces: [] }, ctx);
      }

      const reasons: string[] = [];
      let eligible = provider.status === "ACTIVE";
      if (!eligible) reasons.push("PROVIDER_NOT_ACTIVE");

      const { data: licenses } = await db.from("varapi_licenses").select("*").eq("provider_public_id", providerPublicId).eq("tenant_id", ctx.tenantId).eq("license_status", "VALID").order("valid_to", { ascending: false }).limit(1);
      const license = licenses?.[0];
      if (!license) { eligible = false; reasons.push("NO_VALID_LICENSE"); }

      const { data: privs } = await db.from("varapi_privileges").select("facility_id, workspace_id").eq("provider_public_id", providerPublicId).eq("tenant_id", ctx.tenantId).eq("status", "APPROVED");
      const allowedFacilities = [...new Set((privs || []).map(p => p.facility_id).filter(Boolean))];
      const allowedWorkspaces = [...new Set((privs || []).map(p => p.workspace_id).filter(Boolean))];

      if (body.facility_id && !allowedFacilities.includes(body.facility_id)) {
        eligible = false; reasons.push("FACILITY_NOT_PRIVILEGED");
      }

      const requireStepUp = body.bulk_export || body.certificate_download || false;

      return ok({
        eligible,
        reasons: reasons.length ? reasons : ["ELIGIBLE"],
        license_window: license ? { valid_from: license.valid_from, valid_to: license.valid_to } : null,
        required_step_up: requireStepUp,
        allowed_facilities: allowedFacilities,
        allowed_workspaces: allowedWorkspaces,
      }, ctx);
    }

    // ─── PROVIDER TOKEN FLOWS ───
    if (path === "/provider-token/issue" && method === "POST") {
      const body = await req.json();
      const token = genVAToken();
      const lookupHash = await computeHash(token);
      const verifier = await computeVerifier(token);

      const { error: tokErr } = await db.from("varapi_provider_tokens").insert({
        tenant_id: ctx.tenantId, provider_public_id: body.provider_public_id,
        lookup_hash: lookupHash, argon2_verifier: verifier, status: "ACTIVE",
      });
      if (tokErr) return err("INSERT_FAILED", tokErr.message, 500, ctx);
      await db.from("varapi_outbox_events").insert({ tenant_id: ctx.tenantId, event_type: "TOKEN_ISSUED", payload_json: { provider_public_id: body.provider_public_id } });
      // ONE-TIME reveal
      return ok({ token, provider_public_id: body.provider_public_id, warning: "This token is shown ONCE. Store it securely." }, ctx, 201);
    }

    if (path === "/provider-token/rotate" && method === "POST") {
      const body = await req.json();
      if (!body.current_token) return err("MISSING_FIELD", "current_token required", 400, ctx);
      const currentHash = await computeHash(body.current_token);
      const { data: existing } = await db.from("varapi_provider_tokens").select("id, provider_public_id").eq("lookup_hash", currentHash).eq("status", "ACTIVE").single();
      // Enumeration resistant
      if (!existing) return ok({ rotated: false, message: "If valid, a new token will be issued." }, ctx);

      await db.from("varapi_provider_tokens").update({ status: "ROTATED", rotated_at: new Date().toISOString() }).eq("id", existing.id);
      const newToken = genVAToken();
      const newHash = await computeHash(newToken);
      const newVerifier = await computeVerifier(newToken);
      await db.from("varapi_provider_tokens").insert({ tenant_id: ctx.tenantId, provider_public_id: existing.provider_public_id, lookup_hash: newHash, argon2_verifier: newVerifier, status: "ACTIVE" });
      return ok({ rotated: true, token: newToken, warning: "This token is shown ONCE." }, ctx);
    }

    if (path === "/provider-token/recovery/start" && method === "POST") {
      // Always generic response — enumeration resistance
      return ok({ message: "If a valid provider is associated, a recovery flow will be initiated.", required_step_up: true }, ctx);
    }

    if (path === "/provider-token/recovery/verify" && method === "POST") {
      const body = await req.json();
      // Step-up modeled
      if (!body.step_up_confirmed) return ok({ verified: false, required_step_up: true, message: "Step-up authentication required for token recovery." }, ctx);
      // Biometric ref or council-assisted
      if (body.biometric_ref) {
        const { data: binding } = await db.from("varapi_biometric_bindings").select("provider_public_id").eq("biometric_ref", body.biometric_ref).eq("status", "BOUND").eq("tenant_id", ctx.tenantId).single();
        if (!binding) return ok({ verified: false, message: "If valid, recovery will proceed." }, ctx);
        // Issue new token
        const newToken = genVAToken();
        const hash = await computeHash(newToken);
        const verifier = await computeVerifier(newToken);
        await db.from("varapi_provider_tokens").update({ status: "ROTATED", rotated_at: new Date().toISOString() }).match({ provider_public_id: binding.provider_public_id, status: "ACTIVE" });
        await db.from("varapi_provider_tokens").insert({ tenant_id: ctx.tenantId, provider_public_id: binding.provider_public_id, lookup_hash: hash, argon2_verifier: verifier, status: "ACTIVE" });
        return ok({ verified: true, token: newToken, warning: "One-time reveal." }, ctx);
      }
      return ok({ verified: false, message: "If valid, recovery will proceed." }, ctx);
    }

    // ─── COUNCILS ───
    if (path === "/councils" && method === "POST") {
      const body = await req.json();
      const ziboResult = body.council_type_code ? await validateZibo(db, ctx.tenantId, "council_type", body.council_type_code) : { valid: true, status: "UNVALIDATED" };
      if (!ziboResult.valid) return err("ZIBO_VALIDATION_FAILED", `Unknown council type: ${body.council_type_code}`, 422, ctx);
      const { data, error: insErr } = await db.from("varapi_councils").insert({ tenant_id: ctx.tenantId, name: body.name, council_type_code: body.council_type_code, mode: body.mode || "SOR", external_system_ref: body.external_system_ref }).select().single();
      if (insErr) return err("INSERT_FAILED", insErr.message, 500, ctx);
      return ok(data, ctx, 201);
    }

    if (path === "/councils" && method === "GET") {
      const { data } = await db.from("varapi_councils").select("*").eq("tenant_id", ctx.tenantId);
      return ok({ councils: data || [] }, ctx);
    }

    if (path.match(/^\/councils\/[^/]+\/imports$/) && method === "POST") {
      const councilId = path.split("/")[2];
      const body = await req.json();
      const { data, error: insErr } = await db.from("varapi_import_runs").insert({ tenant_id: ctx.tenantId, council_id: councilId, source_type: body.source_type || "CSV", status: "QUEUED" }).select().single();
      if (insErr) return err("INSERT_FAILED", insErr.message, 500, ctx);
      return ok(data, ctx, 201);
    }

    // ─── RECONCILIATION ───
    if (path === "/reconciliation/queue" && method === "GET") {
      const { data } = await db.from("varapi_reconciliation_cases").select("*").eq("tenant_id", ctx.tenantId).eq("status", "OPEN").order("created_at", { ascending: false });
      return ok({ cases: data || [] }, ctx);
    }

    if (path.match(/^\/reconciliation\/[^/]+\/decision$/) && method === "POST") {
      const caseId = path.split("/")[2];
      const body = await req.json();
      if (!body.decision_reason) return err("MISSING_FIELD", "decision_reason required", 400, ctx);
      await db.from("varapi_reconciliation_actions").insert({ case_id: caseId, tenant_id: ctx.tenantId, decision: body.decision, decision_reason: body.decision_reason, decided_by: ctx.actorId });
      await db.from("varapi_reconciliation_cases").update({ status: "DECIDED" }).eq("case_id", caseId);
      return ok({ decided: true }, ctx);
    }

    // ─── FHIR MAPPING ───
    if (path.match(/^\/fhir\/practitioner\/[^/]+$/) && method === "GET") {
      const id = path.split("/")[3];
      const { data: p } = await db.from("varapi_providers").select("*").eq("provider_public_id", id).single();
      if (!p) return err("NOT_FOUND", "Practitioner not found", 404, ctx);
      const { data: licenses } = await db.from("varapi_licenses").select("license_status, valid_from, valid_to").eq("provider_public_id", id).eq("license_status", "VALID").limit(1);
      return ok({
        resourceType: "Practitioner",
        id: p.provider_public_id,
        identifier: [{ system: "urn:varapi:provider-public-id", value: p.provider_public_id }],
        active: p.status === "ACTIVE",
        qualification: licenses?.map(l => ({ period: { start: l.valid_from, end: l.valid_to } })) || [],
      }, ctx);
    }

    if (path.match(/^\/fhir\/bundle\/provider\/[^/]+$/) && method === "GET") {
      const id = path.split("/")[4];
      const { data: p } = await db.from("varapi_providers").select("*").eq("provider_public_id", id).single();
      if (!p) return err("NOT_FOUND", "Provider not found", 404, ctx);
      const { data: privs } = await db.from("varapi_privileges").select("*").eq("provider_public_id", id).eq("status", "APPROVED");
      return ok({
        resourceType: "Bundle", type: "collection",
        entry: [
          { resource: { resourceType: "Practitioner", id: p.provider_public_id, active: p.status === "ACTIVE" } },
          ...(privs || []).map(pr => ({ resource: { resourceType: "PractitionerRole", practitioner: { reference: `Practitioner/${p.provider_public_id}` }, location: pr.facility_id ? [{ reference: `Location/${pr.facility_id}` }] : [] } })),
        ],
      }, ctx);
    }

    // ─── PORTAL ───
    if (path === "/portal/me" && method === "GET") {
      const { data: p } = await db.from("varapi_providers").select("*").eq("provider_public_id", ctx.actorId).single();
      if (!p) return ok({ message: "Provider profile not found for current actor." }, ctx);
      const { data: licenses } = await db.from("varapi_licenses").select("*").eq("provider_public_id", ctx.actorId).order("valid_to", { ascending: false });
      const { data: privs } = await db.from("varapi_privileges").select("*").eq("provider_public_id", ctx.actorId).eq("status", "APPROVED");
      return ok({ provider: p, licenses: licenses || [], privileges: privs || [] }, ctx);
    }

    if (path === "/portal/cpd" && method === "GET") {
      const { data: cycles } = await db.from("varapi_cpd_cycles").select("*").eq("provider_public_id", ctx.actorId).eq("tenant_id", ctx.tenantId).order("cycle_year", { ascending: false });
      const { data: events } = await db.from("varapi_cpd_events").select("*").eq("provider_public_id", ctx.actorId).eq("tenant_id", ctx.tenantId).order("occurred_at", { ascending: false }).limit(50);
      return ok({ cycles: cycles || [], events: events || [] }, ctx);
    }

    if (path === "/portal/cpd/evidence" && method === "POST") {
      const body = await req.json();
      const { data, error: insErr } = await db.from("varapi_cpd_evidence").insert({ tenant_id: ctx.tenantId, cpd_event_id: body.cpd_event_id, document_id: body.document_id, status: "SUBMITTED" }).select().single();
      if (insErr) return err("INSERT_FAILED", insErr.message, 500, ctx);
      return ok(data, ctx, 201);
    }

    if (path === "/portal/certificates" && method === "GET") {
      const { data } = await db.from("varapi_documents").select("*").eq("owner_type", "PROVIDER").eq("owner_id", ctx.actorId).eq("doc_type", "CERTIFICATE").eq("tenant_id", ctx.tenantId);
      return ok({ certificates: data || [] }, ctx);
    }

    if (path.match(/^\/portal\/certificates\/[^/]+\/download$/) && method === "GET") {
      // Step-up modeled
      return ok({ required_step_up: true, message: "Certificate download requires step-up authentication. Confirm identity to proceed." }, ctx);
    }

    return err("NOT_FOUND", `Unknown endpoint: ${method} ${path}`, 404, ctx);
  } catch (e) {
    console.error(`[${ctx.requestId}] Error:`, e);
    return err("INTERNAL_ERROR", e instanceof Error ? e.message : "Internal error", 500, ctx);
  }
});
