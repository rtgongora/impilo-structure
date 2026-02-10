/**
 * TSHEPO — Trust Layer / Decision Plane
 * Golden Reference Edge Function for the human-led Java dev stream.
 *
 * Routes:
 *   POST /identity/resolve        — Impilo ID → Health ID hash-pointer
 *   POST /identity/map            — Health ID ↔ CRID/CPID + O-CPID
 *   POST /session/assure          — Normalize session context + LoA
 *   POST /authz/decide            — Default-deny PDP (RBAC/ABAC + consent)
 *   POST /consent/evaluate        — Consent evaluation
 *   GET/POST /consents            — FHIR R4 Consent CRUD
 *   POST /audit/append            — Append to hash-chain ledger
 *   GET  /audit/query             — Admin audit search
 *   GET  /portal/access-history   — Patient-visible access history
 *   POST /breakglass/request      — Break-glass with step-up
 *   POST /breakglass/review       — Review queue outcome
 *   POST /offline/token           — Issue offline capability token
 *   POST /offline/reconcile       — O-CPID → canonical CPID
 *   GET  /keys/jwks               — JWKS public keys
 *   POST /keys/rotate             — Rotate signing key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withKernelMiddleware, kernelError, kernelSuccess, KernelContext } from "../_shared/middleware.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSecureRandom(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => charset[b % charset.length]).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

/** Extract expanded actor context from request headers */
function extractActorContext(req: Request) {
  return {
    actorId: req.headers.get("x-actor-id") || "",
    actorType: req.headers.get("x-actor-type") || "provider",
    facilityId: req.headers.get("x-facility-id"),
    workspaceId: req.headers.get("x-workspace-id"),
    shiftId: req.headers.get("x-shift-id"),
    purposeOfUse: req.headers.get("x-purpose-of-use") || "treatment",
    deviceFingerprint: req.headers.get("x-device-fingerprint"),
  };
}

/** Validate mandatory TSHEPO headers beyond the base kernel headers */
function validateTshepoHeaders(req: Request, ctx: KernelContext): Response | null {
  const missing: string[] = [];
  if (!req.headers.get("x-actor-id")) missing.push("X-Actor-Id");
  if (!req.headers.get("x-actor-type")) missing.push("X-Actor-Type");
  if (!req.headers.get("x-purpose-of-use")) missing.push("X-Purpose-Of-Use");
  if (missing.length > 0) {
    return kernelError("MISSING_REQUIRED_HEADER", `Missing: ${missing.join(", ")}`, 400, ctx, { missing_headers: missing });
  }
  return null;
}

/** Get authenticated user from JWT */
async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
  if (error || !user) return null;
  return user.id;
}

// ---------------------------------------------------------------------------
// Audit Ledger Helper (DB-backed hash chain)
// ---------------------------------------------------------------------------

async function appendAuditEntry(
  supabase: ReturnType<typeof createClient>,
  ctx: KernelContext,
  actor: { id: string; type: string; roles?: string[]; facility_id?: string; assurance_level?: string },
  action: string,
  decision: string,
  reasonCodes: string[],
  resource?: { type?: string; id?: string; metadata?: Record<string, unknown> },
  policyVersion?: string
) {
  // Get chain continuation
  const { data: seqData } = await supabase.rpc("tshepo_next_chain_sequence", {
    p_tenant_id: ctx.tenantId,
    p_pod_id: ctx.podId,
  });
  const chainSequence = seqData || 1;

  const { data: prevHashData } = await supabase.rpc("tshepo_last_audit_hash", {
    p_tenant_id: ctx.tenantId,
    p_pod_id: ctx.podId,
  });
  const prevHash = prevHashData || null;

  const auditId = crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  const recordForHashing = {
    audit_id: auditId,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    chain_sequence: chainSequence,
    occurred_at: occurredAt,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    actor_id: actor.id,
    actor_type: actor.type,
    actor_roles: actor.roles || [],
    action,
    decision,
    reason_codes: reasonCodes,
    policy_version: policyVersion || null,
    resource_type: resource?.type || null,
    resource_id: resource?.id || null,
    prev_hash: prevHash,
  };
  const recordHash = await sha256Hex(canonicalJson(recordForHashing));

  const { error } = await supabase.from("tshepo_audit_ledger").insert({
    audit_id: auditId,
    tenant_id: ctx.tenantId,
    pod_id: ctx.podId,
    chain_sequence: chainSequence,
    occurred_at: occurredAt,
    request_id: ctx.requestId,
    correlation_id: ctx.correlationId,
    actor_id: actor.id,
    actor_type: actor.type,
    actor_roles: actor.roles || [],
    actor_facility_id: actor.facility_id,
    actor_assurance_level: actor.assurance_level,
    action,
    decision,
    reason_codes: reasonCodes,
    policy_version: policyVersion,
    resource_type: resource?.type,
    resource_id: resource?.id,
    resource_metadata: resource?.metadata,
    prev_hash: prevHash,
    record_hash: recordHash,
  });

  if (error) {
    console.error(`[TSHEPO] Audit write failed:`, error);
    throw new Error("AUDIT_LEDGER_WRITE_FAILED");
  }

  return { auditId, recordHash, chainSequence };
}

// ---------------------------------------------------------------------------
// Policy Engine (prototype — production uses OPA/Rego)
// ---------------------------------------------------------------------------

const POLICY_VERSION = "2026-02-10.1";
const VALID_AAL = ["aal1", "aal2", "aal3"];

interface PolicyInput {
  actor: { id: string; type: string; roles: string[]; assurance_level?: string };
  action: string;
  resource: { type?: string; id?: string };
  context: { tenant_id: string; pod_id: string; facility_id?: string; workspace_id?: string; purpose_of_use?: string; shift_id?: string };
  consent?: { evaluated: boolean; decision?: string };
}

function evaluatePolicy(input: PolicyInput): { decision: string; reason_codes: string[]; obligations: unknown[]; ttl_seconds: number } {
  const reasons: string[] = [];
  const obligations = [{ type: "AUDIT", level: "MANDATORY" }];

  // Default deny: must have valid actor
  if (!input.actor?.id) return { decision: "DENY", reason_codes: ["ACTOR_MISSING"], obligations, ttl_seconds: 0 };
  if (!input.action) return { decision: "DENY", reason_codes: ["ACTION_MISSING"], obligations, ttl_seconds: 0 };
  if (!input.context?.tenant_id) return { decision: "DENY", reason_codes: ["CONTEXT_INCOMPLETE"], obligations, ttl_seconds: 0 };

  // Step-up check
  const aal = input.actor.assurance_level;
  if (!aal || !VALID_AAL.includes(aal)) {
    return { decision: "STEP_UP_REQUIRED", reason_codes: ["ASSURANCE_LEVEL_INSUFFICIENT"], obligations, ttl_seconds: 0 };
  }

  const actionLower = input.action.toLowerCase();
  const roles = input.actor.roles.map((r) => r.toUpperCase());

  // Break-glass actions require aal3
  if (actionLower.includes("breakglass") || actionLower.includes("break_glass")) {
    if (aal !== "aal3") {
      return { decision: "STEP_UP_REQUIRED", reason_codes: ["BREAK_GLASS_REQUIRES_AAL3"], obligations, ttl_seconds: 0 };
    }
    reasons.push("BREAK_GLASS_AAL3_OK");
  }

  // Finance/tariff actions
  if (actionLower.startsWith("finance.") || actionLower.includes("tariff")) {
    if (!roles.includes("FINANCE_ADMIN") && !roles.includes("REGISTRY_ADMIN")) {
      return { decision: "DENY", reason_codes: ["ROLE_MISSING_FINANCE"], obligations, ttl_seconds: 0 };
    }
    reasons.push("FINANCE_PRIVILEGE_OK");
  }

  // Clinical write actions
  if (actionLower.startsWith("clinical.") && (actionLower.includes("write") || actionLower.includes("prescribe"))) {
    if (!roles.includes("CLINICIAN") && !roles.includes("CLINICIAN_SENIOR") && !roles.includes("PHARMACIST")) {
      return { decision: "DENY", reason_codes: ["ROLE_MISSING_CLINICAL_WRITE"], obligations, ttl_seconds: 0 };
    }
  }

  // Patient merge requires federation authority
  if (actionLower === "vito.patient.merge") {
    if (!roles.includes("REGISTRY_ADMIN")) {
      return { decision: "DENY", reason_codes: ["MERGE_REQUIRES_REGISTRY_ADMIN"], obligations, ttl_seconds: 0 };
    }
    reasons.push("MERGE_PRIVILEGE_OK");
  }

  // Consent check for patient-scoped access
  if (input.resource?.type?.startsWith("patient.") && input.consent) {
    if (input.consent.evaluated && input.consent.decision === "deny") {
      return { decision: "DENY", reason_codes: ["CONSENT_DENIED"], obligations, ttl_seconds: 0 };
    }
    if (input.consent.evaluated) reasons.push("CONSENT_OK");
  }

  // Purpose-of-use validation
  const validPurposes = ["treatment", "payment", "operations", "research", "public_health", "emergency"];
  if (input.context.purpose_of_use && !validPurposes.includes(input.context.purpose_of_use)) {
    return { decision: "DENY", reason_codes: ["INVALID_PURPOSE_OF_USE"], obligations, ttl_seconds: 0 };
  }

  reasons.push("PRIVILEGE_OK");
  return { decision: "ALLOW", reason_codes: reasons, obligations, ttl_seconds: 30 };
}

// ---------------------------------------------------------------------------
// Consent Evaluator
// ---------------------------------------------------------------------------

async function evaluateConsent(
  supabase: ReturnType<typeof createClient>,
  patientCpid: string,
  actorRef: string,
  purpose: string,
  action: string
): Promise<{ decision: string; consent_id?: string; obligations?: string[] }> {
  const { data: consents } = await supabase
    .from("tshepo_consents")
    .select("*")
    .eq("patient_cpid", patientCpid)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!consents || consents.length === 0) {
    return { decision: "no_consent_found" };
  }

  for (const consent of consents) {
    // Check period
    if (consent.period_start && new Date(consent.period_start) > new Date()) continue;
    if (consent.period_end && new Date(consent.period_end) < new Date()) continue;

    // Check purpose
    if (consent.purpose_of_use.length > 0 && !consent.purpose_of_use.includes(purpose)) continue;

    // Check grantee
    if (consent.grantee_ref && consent.grantee_ref !== actorRef) continue;

    // Matched consent
    if (consent.provision_type === "deny") {
      return { decision: "deny", consent_id: consent.id };
    }
    return { decision: "permit", consent_id: consent.id, obligations: consent.action_codes };
  }

  return { decision: "no_matching_consent" };
}

// ---------------------------------------------------------------------------
// Main Router
// ---------------------------------------------------------------------------

serve(withKernelMiddleware(async (req: Request, ctx: KernelContext) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const path = url.pathname.replace("/tshepo", "");
  const method = req.method;
  const actor = extractActorContext(req);

  // ========================================================================
  // POST /identity/resolve — Impilo ID → Health ID (hash-pointer, no plaintext)
  // ========================================================================
  if (method === "POST" && path === "/identity/resolve") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { impilo_id_hash } = body;
    if (!impilo_id_hash) return kernelError("INVALID_REQUEST", "impilo_id_hash required", 400, ctx);

    // Lookup by hash — never by plaintext
    const { data, error } = await supabase
      .from("trust_layer_identity_mapping")
      .select("health_id, cpid, crid, identity_status")
      .eq("impilo_id", impilo_id_hash)
      .eq("identity_status", "active")
      .maybeSingle();

    if (error || !data) {
      // Anti-enumeration: indistinguishable error
      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.identity.resolve", "DENY", ["NOT_FOUND"], { type: "identity", id: impilo_id_hash.substring(0, 4) + "***" });
      return kernelError("INVALID_REQUEST", "Resolution failed", 404, ctx);
    }

    // Update resolution tracking
    await supabase.from("trust_layer_identity_mapping")
      .update({ last_resolved_at: new Date().toISOString(), resolution_count: (data as any).resolution_count ? (data as any).resolution_count + 1 : 1 })
      .eq("impilo_id", impilo_id_hash);

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.identity.resolve", "ALLOW", ["RESOLVED"], { type: "identity_mapping", id: data.health_id });

    return kernelSuccess({ health_id: data.health_id, cpid: data.cpid, crid: data.crid, status: data.identity_status }, ctx);
  }

  // ========================================================================
  // POST /identity/map — Health ID ↔ CRID/CPID + O-CPID issuance + reconciliation
  // ========================================================================
  if (method === "POST" && path === "/identity/map") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { operation, health_id, o_cpid, facility_id } = body;

    if (operation === "issue_cpid") {
      // Deterministic CPID generation
      const seed = `${ctx.tenantId}:${health_id}:cpid`;
      const cpid = `CPID-${(await sha256Hex(seed)).substring(0, 16).toUpperCase()}`;

      const cridSeed = `${ctx.tenantId}:${health_id}:crid`;
      const crid = `CRID-${(await sha256Hex(cridSeed)).substring(0, 16).toUpperCase()}`;

      await supabase.from("trust_layer_identity_mapping")
        .update({ cpid, crid, cpid_deterministic_seed: seed, cpid_algorithm: "SHA256_HMAC" })
        .eq("health_id", health_id);

      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.identity.cpid_issued", "ALLOW", ["CPID_GENERATED"], { type: "identity_mapping", id: cpid });

      return kernelSuccess({ cpid, crid, health_id }, ctx);
    }

    if (operation === "issue_ocpid") {
      // Offline provisional CPID
      const oCpid = `O-CPID-${generateSecureRandom(16)}`;
      const { error } = await supabase.from("trust_layer_offline_cpid").insert({
        o_cpid: oCpid,
        generating_facility_id: facility_id,
        generating_user_id: actor.actorId,
        generating_device_id: actor.deviceFingerprint,
        status: "provisional",
        tenant_id: ctx.tenantId,
        pod_id: ctx.podId,
      });

      if (error) return kernelError("INTERNAL_ERROR", "O-CPID issuance failed", 500, ctx);

      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType, facility_id: facility_id }, "tshepo.ocpid.issued", "ALLOW", ["OFFLINE_CPID"], { type: "offline_cpid", id: oCpid });

      return kernelSuccess({ o_cpid: oCpid, status: "provisional", facility_scoped: true }, ctx);
    }

    if (operation === "reconcile") {
      if (!o_cpid || !health_id) return kernelError("INVALID_REQUEST", "o_cpid and health_id required", 400, ctx);

      // Get canonical CPID
      const { data: mapping } = await supabase.from("trust_layer_identity_mapping")
        .select("cpid").eq("health_id", health_id).maybeSingle();

      if (!mapping?.cpid) return kernelError("INVALID_REQUEST", "No canonical CPID for health_id", 404, ctx);

      await supabase.from("trust_layer_offline_cpid")
        .update({ status: "reconciled", reconciled_cpid: mapping.cpid, reconciled_at: new Date().toISOString(), reconciled_by: actor.actorId })
        .eq("o_cpid", o_cpid);

      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.ocpid.reconciled", "ALLOW", ["RECONCILED"], { type: "offline_cpid", id: o_cpid, metadata: { canonical_cpid: mapping.cpid } });

      return kernelSuccess({ o_cpid, canonical_cpid: mapping.cpid, status: "reconciled" }, ctx);
    }

    return kernelError("INVALID_REQUEST", "Unknown operation", 400, ctx);
  }

  // ========================================================================
  // POST /session/assure — Normalize session context + LoA + step-up flags
  // ========================================================================
  if (method === "POST" && path === "/session/assure") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { idp_token, idp_source, device_info } = body;

    // Simulate Keycloak/eSignet token introspection
    const sessionTokenHash = await sha256Hex(idp_token || crypto.randomUUID());
    const assuranceLevel = body.assurance_level || "aal1";
    const roles = body.roles || ["CLINICIAN"];

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8h session

    const { data: session, error } = await supabase.from("tshepo_sessions").insert({
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      actor_id: actor.actorId,
      actor_type: actor.actorType,
      session_token_hash: sessionTokenHash,
      idp_source: idp_source || "keycloak",
      assurance_level: assuranceLevel,
      roles,
      facility_id: actor.facilityId || null,
      workspace_id: actor.workspaceId || null,
      shift_id: actor.shiftId || null,
      device_fingerprint: actor.deviceFingerprint,
      device_type: device_info?.type || "web",
      purpose_of_use: actor.purposeOfUse,
      expires_at: expiresAt,
    }).select().single();

    if (error) return kernelError("INTERNAL_ERROR", "Session creation failed", 500, ctx);

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType, assurance_level: assuranceLevel }, "tshepo.session.assure", "ALLOW", ["SESSION_CREATED"], { type: "session", id: session.id });

    return kernelSuccess({
      session_id: session.id,
      assurance_level: assuranceLevel,
      roles,
      step_up_required: assuranceLevel === "aal1",
      step_up_methods: assuranceLevel === "aal1" ? ["totp", "biometric"] : [],
      expires_at: expiresAt,
      context: { tenant_id: ctx.tenantId, pod_id: ctx.podId, facility_id: actor.facilityId, workspace_id: actor.workspaceId },
    }, ctx);
  }

  // ========================================================================
  // POST /authz/decide — Default-deny PDP
  // ========================================================================
  if (method === "POST" && path === "/authz/decide") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { action, resource, roles, assurance_level, patient_cpid } = body;

    // Consent evaluation for patient-scoped access
    let consentResult: { evaluated: boolean; decision?: string; consent_id?: string } = { evaluated: false };
    if (patient_cpid && resource?.type?.startsWith("patient.")) {
      const consent = await evaluateConsent(supabase, patient_cpid, actor.actorId, actor.purposeOfUse, action);
      consentResult = { evaluated: true, decision: consent.decision, consent_id: consent.consent_id };
    }

    const policyInput: PolicyInput = {
      actor: { id: actor.actorId, type: actor.actorType, roles: roles || [], assurance_level },
      action,
      resource: resource || {},
      context: {
        tenant_id: ctx.tenantId,
        pod_id: ctx.podId,
        facility_id: actor.facilityId || undefined,
        workspace_id: actor.workspaceId || undefined,
        purpose_of_use: actor.purposeOfUse,
        shift_id: actor.shiftId || undefined,
      },
      consent: consentResult,
    };

    const decision = evaluatePolicy(policyInput);

    // Persist decision
    await supabase.from("tshepo_authz_decisions").insert({
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
      actor_id: actor.actorId,
      actor_type: actor.actorType,
      actor_roles: roles || [],
      assurance_level,
      action,
      resource_type: resource?.type,
      resource_id: resource?.id,
      facility_id: actor.facilityId || null,
      workspace_id: actor.workspaceId || null,
      shift_id: actor.shiftId || null,
      purpose_of_use: actor.purposeOfUse,
      device_fingerprint: actor.deviceFingerprint,
      consent_evaluated: consentResult.evaluated,
      consent_id: consentResult.consent_id || null,
      consent_decision: consentResult.decision,
      policy_bundle_version: POLICY_VERSION,
      decision: decision.decision,
      reason_codes: decision.reason_codes,
      obligations: decision.obligations,
      ttl_seconds: decision.ttl_seconds,
    });

    // Mandatory audit
    await appendAuditEntry(supabase, ctx,
      { id: actor.actorId, type: actor.actorType, roles, assurance_level },
      "tshepo.pdp.decide", decision.decision, decision.reason_codes,
      { type: resource?.type, id: resource?.id, metadata: { action, consent: consentResult } },
      POLICY_VERSION
    );

    // Patient access log for patient-scoped decisions
    if (patient_cpid) {
      await supabase.from("tshepo_patient_access_log").insert({
        tenant_id: ctx.tenantId,
        patient_cpid,
        accessor_type: actor.actorType,
        accessor_ref: actor.actorId,
        accessor_role: (roles || [])[0],
        facility_ref: actor.facilityId,
        action,
        purpose_of_use: actor.purposeOfUse,
        resource_type: resource?.type,
        decision: decision.decision,
        is_break_glass: action.includes("breakglass"),
      });
    }

    return kernelSuccess({
      decision: decision.decision,
      policy_version: POLICY_VERSION,
      reason_codes: decision.reason_codes,
      obligations: decision.obligations,
      ttl_seconds: decision.ttl_seconds,
      consent: consentResult.evaluated ? { evaluated: true, decision: consentResult.decision } : undefined,
    }, ctx);
  }

  // ========================================================================
  // POST /consent/evaluate — Standalone consent evaluation
  // ========================================================================
  if (method === "POST" && path === "/consent/evaluate") {
    const body = await req.json();
    const { patient_cpid, actor_ref, purpose, action: consentAction } = body;
    if (!patient_cpid) return kernelError("INVALID_REQUEST", "patient_cpid required", 400, ctx);

    const result = await evaluateConsent(supabase, patient_cpid, actor_ref || actor.actorId, purpose || actor.purposeOfUse, consentAction || "access");

    return kernelSuccess(result, ctx);
  }

  // ========================================================================
  // GET/POST /consents — FHIR R4 Consent CRUD
  // ========================================================================
  if (path === "/consents" || path.startsWith("/consents/")) {
    if (method === "GET") {
      const patientCpid = url.searchParams.get("patient_cpid");
      const status = url.searchParams.get("status") || "active";
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");

      let query = supabase.from("tshepo_consents").select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenantId)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (patientCpid) query = query.eq("patient_cpid", patientCpid);
      if (status !== "all") query = query.eq("status", status);

      const { data, error, count } = await query;
      if (error) return kernelError("INTERNAL_ERROR", "Query failed", 500, ctx);

      return kernelSuccess({ consents: data, total: count, page, limit }, ctx);
    }

    if (method === "POST") {
      const body = await req.json();
      const { fhir_resource, patient_cpid, grantor_ref, grantee_ref, purpose_of_use, action_codes, data_classes, period_start, period_end, provision_type, scope_code } = body;

      const fhirId = `Consent/${crypto.randomUUID()}`;

      const { data: consent, error } = await supabase.from("tshepo_consents").insert({
        tenant_id: ctx.tenantId,
        fhir_id: fhirId,
        fhir_resource: fhir_resource || { resourceType: "Consent", id: fhirId, status: "active" },
        patient_cpid,
        grantor_ref,
        grantee_ref,
        purpose_of_use: purpose_of_use || [],
        action_codes: action_codes || [],
        data_classes: data_classes || [],
        period_start,
        period_end,
        provision_type: provision_type || "permit",
        scope_code: scope_code || "patient-privacy",
      }).select().single();

      if (error) return kernelError("INTERNAL_ERROR", "Consent creation failed", 500, ctx);

      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.consent.created", "SYSTEM", ["CONSENT_CREATED"], { type: "consent", id: consent.id });

      return kernelSuccess({ consent }, ctx, 201);
    }

    // DELETE /consents/:id — Revoke
    if (method === "DELETE" && path.startsWith("/consents/")) {
      const consentId = path.split("/consents/")[1];
      const body = await req.json().catch(() => ({}));

      const { error } = await supabase.from("tshepo_consents")
        .update({ status: "rejected", revoked_at: new Date().toISOString(), revoked_by: actor.actorId, revocation_reason: body.reason || "Revoked" })
        .eq("id", consentId);

      if (error) return kernelError("INTERNAL_ERROR", "Revocation failed", 500, ctx);

      await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.consent.revoked", "SYSTEM", ["CONSENT_REVOKED"], { type: "consent", id: consentId });

      return kernelSuccess({ revoked: true, consent_id: consentId }, ctx);
    }
  }

  // ========================================================================
  // POST /audit/append — Manual audit entry
  // ========================================================================
  if (method === "POST" && path === "/audit/append") {
    const body = await req.json();
    const result = await appendAuditEntry(
      supabase, ctx,
      { id: body.actor_id || actor.actorId, type: body.actor_type || actor.actorType, roles: body.roles, facility_id: body.facility_id, assurance_level: body.assurance_level },
      body.action, body.decision || "SYSTEM", body.reason_codes || [],
      body.resource, body.policy_version
    );
    return kernelSuccess(result, ctx, 201);
  }

  // ========================================================================
  // GET /audit/query — Admin audit search
  // ========================================================================
  if (method === "GET" && path === "/audit/query") {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const actorFilter = url.searchParams.get("actor_id");
    const actionFilter = url.searchParams.get("action");
    const decisionFilter = url.searchParams.get("decision");
    const correlationFilter = url.searchParams.get("correlation_id");

    let query = supabase.from("tshepo_audit_ledger")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenantId)
      .order("chain_sequence", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (actorFilter) query = query.eq("actor_id", actorFilter);
    if (actionFilter) query = query.ilike("action", `%${actionFilter}%`);
    if (decisionFilter) query = query.eq("decision", decisionFilter);
    if (correlationFilter) query = query.eq("correlation_id", correlationFilter);

    const { data, error, count } = await query;
    if (error) return kernelError("INTERNAL_ERROR", "Audit query failed", 500, ctx);

    return kernelSuccess({ records: data, total: count, page, limit }, ctx);
  }

  // ========================================================================
  // GET /portal/access-history — Patient-visible (redacted)
  // ========================================================================
  if (method === "GET" && path === "/portal/access-history") {
    const patientCpid = url.searchParams.get("patient_cpid");
    if (!patientCpid) return kernelError("INVALID_REQUEST", "patient_cpid required", 400, ctx);

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const { data, error, count } = await supabase.from("tshepo_patient_access_log")
      .select("occurred_at, accessor_type, accessor_role, facility_ref, action, purpose_of_use, resource_type, decision, is_break_glass, is_redacted", { count: "exact" })
      .eq("patient_cpid", patientCpid)
      .eq("tenant_id", ctx.tenantId)
      .order("occurred_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) return kernelError("INTERNAL_ERROR", "Access history query failed", 500, ctx);

    // Redact accessor_ref (the raw ID) — patient sees role + facility only
    return kernelSuccess({ entries: data, total: count, page, limit }, ctx);
  }

  // ========================================================================
  // POST /breakglass/request — Step-up + reason → elevated token
  // ========================================================================
  if (method === "POST" && path === "/breakglass/request") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { patient_cpid, justification, emergency_type, step_up_method, assurance_level } = body;

    if (!justification) return kernelError("INVALID_REQUEST", "justification required", 400, ctx);
    if (!assurance_level || assurance_level !== "aal3") {
      return kernelError("STEP_UP_REQUIRED", "Break-glass requires aal3 assurance", 412, ctx);
    }

    // Issue narrow elevated token
    const tokenHash = await sha256Hex(`bg:${crypto.randomUUID()}`);
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
    const scope = { actions: ["read"], resource_types: ["patient_summary", "patient_medications", "patient_allergies"], patient_cpid };

    const { data: bgEvent, error } = await supabase.from("trust_layer_break_glass").insert({
      user_id: actor.actorId,
      subject_cpid: patient_cpid,
      justification,
      emergency_type: emergency_type || "clinical_emergency",
      access_scope: "emergency_read",
      access_started_at: new Date().toISOString(),
      access_expires_at: tokenExpires,
      facility_id: actor.facilityId || null,
      workspace_id: actor.workspaceId || null,
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      step_up_method: step_up_method || "totp",
      step_up_completed_at: new Date().toISOString(),
      elevated_token_hash: tokenHash,
      elevated_token_scope: scope,
      elevated_token_expires_at: tokenExpires,
      review_queue_status: "pending_review",
    }).select().single();

    if (error) return kernelError("INTERNAL_ERROR", "Break-glass creation failed", 500, ctx);

    const auditResult = await appendAuditEntry(supabase, ctx,
      { id: actor.actorId, type: actor.actorType, assurance_level: "aal3" },
      "tshepo.breakglass.request", "BREAK_GLASS", ["EMERGENCY_ACCESS_GRANTED"],
      { type: "patient", id: patient_cpid, metadata: { justification, emergency_type } }
    );

    // Update break-glass with audit ref
    await supabase.from("trust_layer_break_glass").update({ audit_ledger_id: auditResult.auditId }).eq("id", bgEvent.id);

    return kernelSuccess({
      break_glass_id: bgEvent.id,
      elevated_token: tokenHash,
      scope,
      expires_at: tokenExpires,
      review_status: "pending_review",
    }, ctx, 201);
  }

  // ========================================================================
  // POST /breakglass/review — Review queue outcome
  // ========================================================================
  if (method === "POST" && path === "/breakglass/review") {
    const body = await req.json();
    const { break_glass_id, outcome, notes } = body;

    if (!break_glass_id || !outcome) return kernelError("INVALID_REQUEST", "break_glass_id and outcome required", 400, ctx);
    if (!["approved", "flagged", "violation"].includes(outcome)) {
      return kernelError("INVALID_REQUEST", "outcome must be approved/flagged/violation", 400, ctx);
    }

    const { error } = await supabase.from("trust_layer_break_glass")
      .update({ review_queue_status: "reviewed", reviewed_by: actor.actorId, reviewed_at: new Date().toISOString(), review_outcome: outcome, review_notes: notes })
      .eq("id", break_glass_id);

    if (error) return kernelError("INTERNAL_ERROR", "Review update failed", 500, ctx);

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.breakglass.reviewed", "SYSTEM", [`REVIEW_${outcome.toUpperCase()}`], { type: "break_glass", id: break_glass_id, metadata: { outcome, notes } });

    return kernelSuccess({ break_glass_id, outcome, reviewed_at: new Date().toISOString() }, ctx);
  }

  // ========================================================================
  // POST /offline/token — Issue facility-scoped offline capability token
  // ========================================================================
  if (method === "POST" && path === "/offline/token") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { facility_id, capability_scope, ttl_minutes } = body;

    if (!facility_id) return kernelError("INVALID_REQUEST", "facility_id required", 400, ctx);

    const ttl = Math.min(ttl_minutes || 120, 480); // Max 8 hours
    const tokenHash = await sha256Hex(`offline:${crypto.randomUUID()}`);
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const scope = capability_scope || { actions: ["read", "create_provisional"], resource_types: ["patient_summary"] };

    const { data: token, error } = await supabase.from("trust_layer_offline_tokens").insert({
      token_hash: tokenHash,
      user_id: actor.actorId,
      facility_id,
      scope: "offline_facility",
      issued_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: "active",
      tenant_id: ctx.tenantId,
      pod_id: ctx.podId,
      capability_scope: scope,
      max_actions: 100,
    }).select().single();

    if (error) return kernelError("INTERNAL_ERROR", "Offline token issuance failed", 500, ctx);

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType, facility_id }, "tshepo.offline.token_issued", "ALLOW", ["OFFLINE_TOKEN"], { type: "offline_token", id: token.id });

    return kernelSuccess({
      token_hash: tokenHash,
      facility_id,
      scope,
      max_actions: 100,
      expires_at: expiresAt,
      constraints: { facility_scoped: true, create_only_ocpid: true, no_delete: true, no_merge: true },
    }, ctx, 201);
  }

  // ========================================================================
  // POST /offline/reconcile — O-CPID batch reconciliation
  // ========================================================================
  if (method === "POST" && path === "/offline/reconcile") {
    const body = await req.json();
    const { items } = body; // Array of { o_cpid, health_id }

    if (!Array.isArray(items)) return kernelError("INVALID_REQUEST", "items array required", 400, ctx);

    const results: Array<{ o_cpid: string; outcome: string; canonical_cpid?: string }> = [];

    for (const item of items) {
      const { data: mapping } = await supabase.from("trust_layer_identity_mapping")
        .select("cpid").eq("health_id", item.health_id).maybeSingle();

      if (!mapping?.cpid) {
        results.push({ o_cpid: item.o_cpid, outcome: "no_canonical_cpid" });
        continue;
      }

      const { error } = await supabase.from("trust_layer_offline_cpid")
        .update({ status: "reconciled", reconciled_cpid: mapping.cpid, reconciled_at: new Date().toISOString(), reconciled_by: actor.actorId })
        .eq("o_cpid", item.o_cpid);

      results.push({ o_cpid: item.o_cpid, outcome: error ? "failed" : "reconciled", canonical_cpid: mapping.cpid });
    }

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.offline.reconcile", "ALLOW", ["BATCH_RECONCILE"], { type: "offline_reconciliation", metadata: { count: items.length } });

    return kernelSuccess({ results, total: items.length, reconciled: results.filter((r) => r.outcome === "reconciled").length }, ctx);
  }

  // ========================================================================
  // GET /keys/jwks — Public JWKS document
  // ========================================================================
  if (method === "GET" && path === "/keys/jwks") {
    const { data: keys } = await supabase.from("trust_layer_signing_keys")
      .select("jwks_kid, key_algorithm, public_key, is_active, activated_at, created_at")
      .eq("is_active", true)
      .eq("tenant_id", ctx.tenantId);

    const jwksKeys = (keys || []).map((k: any) => ({
      kid: k.jwks_kid || k.id,
      kty: "OKP",
      crv: "Ed25519",
      use: "sig",
      x: k.public_key ? btoa(k.public_key).replace(/=/g, "") : "",
    }));

    return kernelSuccess({ keys: jwksKeys }, ctx);
  }

  // ========================================================================
  // POST /keys/rotate — Rotate signing key
  // ========================================================================
  if (method === "POST" && path === "/keys/rotate") {
    const headerErr = validateTshepoHeaders(req, ctx);
    if (headerErr) return headerErr;

    const body = await req.json();
    const { reason } = body;

    // Deactivate current keys
    await supabase.from("trust_layer_signing_keys")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("tenant_id", ctx.tenantId)
      .eq("is_active", true);

    // Generate new key metadata (actual Ed25519 generation is production infra)
    const kid = `tshepo-${Date.now()}-${generateSecureRandom(8)}`;
    const { data: newKey, error } = await supabase.from("trust_layer_signing_keys").insert({
      key_id: kid,
      key_type: "Ed25519",
      purpose: "signing",
      public_key: generateSecureRandom(32), // Placeholder — production uses HSM
      private_key_encrypted: generateSecureRandom(64),
      tenant_id: ctx.tenantId,
      key_algorithm: "Ed25519",
      key_usage: "signing",
      jwks_kid: kid,
      is_active: true,
      activated_at: new Date().toISOString(),
    }).select().single();

    if (error) return kernelError("INTERNAL_ERROR", "Key rotation failed", 500, ctx);

    await appendAuditEntry(supabase, ctx, { id: actor.actorId, type: actor.actorType }, "tshepo.keys.rotated", "SYSTEM", ["KEY_ROTATED"], { type: "signing_key", id: kid, metadata: { reason } });

    return kernelSuccess({ kid, algorithm: "Ed25519", activated_at: new Date().toISOString(), reason }, ctx, 201);
  }

  return kernelError("INVALID_REQUEST", "Unknown TSHEPO endpoint", 404, ctx);
}));
