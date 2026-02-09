import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withKernelMiddleware, kernelError, kernelSuccess, KernelContext } from "../_shared/middleware.ts";

// Rate limiting state (per-instance, in production use Redis/KV)
const rateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const existing = rateLimits.get(key);

  if (!existing || now - existing.windowStart > windowSeconds * 1000) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

function generateSecureRandom(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => charset[byte % charset.length])
    .join("");
}

serve(withKernelMiddleware(async (req: Request, ctx: KernelContext) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const path = url.pathname.replace("/trust-layer", "");
  const method = req.method;

  // Get auth context
  const authHeader = req.headers.get("authorization");
  const facilityId = req.headers.get("x-facility-id");
  const purposeOfUse = req.headers.get("x-purpose-of-use") || "treatment";

  // Validate JWT for protected endpoints
  let userId: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
    }
  }

  // ============================================
  // POST /id/issue - Issue new identity
  // ============================================
  if (method === "POST" && path === "/id/issue") {
    if (!userId) {
      return kernelError("AUTH_INVALID_CREDENTIALS", "Unauthorized", 401, ctx);
    }

    const rateKey = `issue:${userId}:${facilityId || "global"}`;
    if (!checkRateLimit(rateKey, 10, 60)) {
      return kernelError("RATE_LIMITED", "Rate limit exceeded", 429, ctx);
    }

    const { data, error } = await supabase.rpc("trust_layer_issue_identity", {
      p_issuer_user_id: userId,
      p_issuer_facility_id: facilityId,
    });

    if (error) {
      console.error(`[${ctx.requestId}] Issue identity error:`, error);
      return kernelError("INTERNAL_ERROR", "Failed to issue identity", 500, ctx);
    }

    // Audit log with correlation
    await supabase.from("trust_layer_audit_log").insert({
      event_category: "identity_resolution",
      event_type: "identity_issued",
      event_outcome: "success",
      user_id: userId,
      action: "issue_identity",
      resource_type: "identity_mapping",
      resource_id: data?.[0]?.health_id,
      facility_id: facilityId,
      purpose_of_use: purposeOfUse,
      correlation_id: ctx.correlationId,
    });

    return kernelSuccess({
      success: true,
      healthId: data?.[0]?.health_id,
      impiloId: data?.[0]?.impilo_id,
      cpid: data?.[0]?.cpid,
    }, ctx);
  }

  // ============================================
  // POST /id/resolve/clinical - Resolve Impilo ID to CPID
  // ============================================
  if (method === "POST" && path === "/id/resolve/clinical") {
    if (!userId) {
      return kernelError("AUTH_INVALID_CREDENTIALS", "Unauthorized", 401, ctx);
    }

    const body = await req.json();
    const { impiloId } = body;

    if (!impiloId) {
      return kernelError("INVALID_REQUEST", "impiloId required", 400, ctx);
    }

    const rateKey = `resolve:${userId}:${facilityId || "global"}`;
    if (!checkRateLimit(rateKey, 100, 60)) {
      await supabase.from("trust_layer_audit_log").insert({
        event_category: "identity_resolution",
        event_type: "resolve_clinical",
        event_outcome: "failure",
        user_id: userId,
        action: "resolve_identity",
        facility_id: facilityId,
        purpose_of_use: purposeOfUse,
        error_message: "rate_limited",
        correlation_id: ctx.correlationId,
      });
      return kernelError("RATE_LIMITED", "Rate limit exceeded", 429, ctx);
    }

    const { data, error } = await supabase.rpc("trust_layer_resolve_clinical", {
      p_impilo_id: impiloId,
    });

    // Anti-enumeration: indistinguishable errors
    if (error || !data || data.length === 0) {
      await supabase.from("trust_layer_audit_log").insert({
        event_category: "identity_resolution",
        event_type: "resolve_clinical",
        event_outcome: "failure",
        user_id: userId,
        action: "resolve_identity",
        facility_id: facilityId,
        purpose_of_use: purposeOfUse,
        request_metadata: { impilo_id_prefix: impiloId.substring(0, 4) + "***" },
        correlation_id: ctx.correlationId,
      });
      return kernelError("INVALID_REQUEST", "Resolution failed", 404, ctx);
    }

    const result = data[0];

    // Check consent (unless emergency)
    if (!result.consent_active && purposeOfUse !== "emergency") {
      await supabase.from("trust_layer_audit_log").insert({
        event_category: "identity_resolution",
        event_type: "resolve_clinical",
        event_outcome: "failure",
        user_id: userId,
        action: "resolve_identity",
        subject_cpid: result.cpid,
        facility_id: facilityId,
        purpose_of_use: purposeOfUse,
        error_message: "consent_required",
        correlation_id: ctx.correlationId,
      });
      return kernelError("POLICY_DENY", "Consent required for access", 403, ctx);
    }

    // Success - log and return
    await supabase.from("trust_layer_audit_log").insert({
      event_category: "identity_resolution",
      event_type: "resolve_clinical",
      event_outcome: "success",
      user_id: userId,
      action: "resolve_identity",
      resource_type: "identity_mapping",
      resource_id: result.cpid,
      subject_cpid: result.cpid,
      facility_id: facilityId,
      purpose_of_use: purposeOfUse,
      correlation_id: ctx.correlationId,
    });

    // Generate short-lived access token (scoped)
    const accessToken = `tl_${generateSecureRandom(32)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from("trust_layer_access_tokens").insert({
      token_hash: accessToken,
      user_id: userId,
      subject_cpid: result.cpid,
      scope: "clinical",
      purpose_of_use: purposeOfUse,
      facility_id: facilityId,
      expires_at: expiresAt,
    });

    return kernelSuccess({
      success: true,
      cpid: result.cpid,
      status: result.status,
      consentActive: result.consent_active,
      accessToken,
      expiresAt,
    }, ctx);
  }

  // ============================================
  // POST /id/resolve/registry - Resolve Impilo ID to CRID
  // ============================================
  if (method === "POST" && path === "/id/resolve/registry") {
    if (!userId) {
      return kernelError("AUTH_INVALID_CREDENTIALS", "Unauthorized", 401, ctx);
    }

    const body = await req.json();
    const { impiloId } = body;

    if (!impiloId) {
      return kernelError("INVALID_REQUEST", "impiloId required", 400, ctx);
    }

    const rateKey = `registry:${userId}`;
    if (!checkRateLimit(rateKey, 50, 60)) {
      return kernelError("RATE_LIMITED", "Rate limit exceeded", 429, ctx);
    }

    const { data, error } = await supabase.rpc("trust_layer_resolve_registry", {
      p_impilo_id: impiloId,
    });

    if (error || !data || data.length === 0) {
      return kernelError("INVALID_REQUEST", "Resolution failed", 404, ctx);
    }

    const result = data[0];

    await supabase.from("trust_layer_audit_log").insert({
      event_category: "identity_resolution",
      event_type: "resolve_registry",
      event_outcome: "success",
      user_id: userId,
      action: "resolve_identity",
      resource_type: "identity_mapping",
      resource_id: result.crid,
      facility_id: facilityId,
      purpose_of_use: purposeOfUse,
      correlation_id: ctx.correlationId,
    });

    return kernelSuccess({
      success: true,
      crid: result.crid,
      status: result.status,
    }, ctx);
  }

  // ============================================
  // POST /id/rotate/impiloId - Rotate Impilo ID
  // ============================================
  if (method === "POST" && path === "/id/rotate/impiloId") {
    if (!userId) {
      return kernelError("AUTH_INVALID_CREDENTIALS", "Unauthorized", 401, ctx);
    }

    const body = await req.json();
    const { healthId, reason } = body;

    if (!healthId || !reason) {
      return kernelError("INVALID_REQUEST", "healthId and reason required", 400, ctx);
    }

    const digits1 = String(Math.floor(Math.random() * 900) + 100);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 24));
    const digits2 = String(Math.floor(Math.random() * 900) + 100);
    const check = Math.floor(Math.random() * 10);
    const newImpiloId = `IMP-${digits1}${letter}${digits2}${check}`;

    const { data: current } = await supabase
      .from("trust_layer_identity_mapping")
      .select("impilo_id, version")
      .eq("health_id", healthId)
      .single();

    if (!current) {
      return kernelError("INVALID_REQUEST", "Identity not found", 404, ctx);
    }

    await supabase.from("trust_layer_alias_history").insert({
      health_id: healthId,
      alias_type: "impilo_id",
      old_value: current.impilo_id,
      new_value: newImpiloId,
      rotation_reason: reason,
      rotated_by: userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabase
      .from("trust_layer_identity_mapping")
      .update({
        impilo_id: newImpiloId,
        rotated_at: new Date().toISOString(),
        rotation_reason: reason,
        version: current.version + 1,
      })
      .eq("health_id", healthId);

    await supabase.from("trust_layer_audit_log").insert({
      event_category: "identity_resolution",
      event_type: "alias_rotated",
      event_outcome: "success",
      user_id: userId,
      action: "rotate_impilo_id",
      resource_type: "identity_mapping",
      resource_id: healthId,
      facility_id: facilityId,
      request_metadata: { reason },
      correlation_id: ctx.correlationId,
    });

    return kernelSuccess({
      success: true,
      newImpiloId,
      revocationEvent: {
        oldImpiloId: current.impilo_id,
        revokedAt: new Date().toISOString(),
        gracePeriodEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }, ctx);
  }

  // ============================================
  // POST /id/offline/reconcile - Reconcile O-CPIDs
  // ============================================
  if (method === "POST" && path === "/id/offline/reconcile") {
    if (!userId) {
      return kernelError("AUTH_INVALID_CREDENTIALS", "Unauthorized", 401, ctx);
    }

    const body = await req.json();
    const { offlineCpids } = body;

    if (!Array.isArray(offlineCpids)) {
      return kernelError("INVALID_REQUEST", "offlineCpids array required", 400, ctx);
    }

    const results: Array<{ oCpid: string; outcome: string; reconciledCpid?: string }> = [];
    let reconciled = 0;
    let merged = 0;
    let rejected = 0;

    for (const offline of offlineCpids) {
      const { data: existing } = await supabase
        .from("trust_layer_offline_cpid")
        .select("*")
        .eq("o_cpid", offline.oCpid)
        .maybeSingle();

      if (existing) {
        results.push({ oCpid: offline.oCpid, outcome: "already_processed" });
        continue;
      }

      const { error } = await supabase.from("trust_layer_offline_cpid").insert({
        o_cpid: offline.oCpid,
        generating_device_id: offline.generatingDeviceId,
        generating_facility_id: offline.generatingFacilityId,
        generating_user_id: offline.generatingUserId,
        status: "provisional",
        sync_attempted_at: new Date().toISOString(),
      });

      if (error) {
        rejected++;
        results.push({ oCpid: offline.oCpid, outcome: "rejected" });
      } else {
        reconciled++;
        results.push({ oCpid: offline.oCpid, outcome: "pending_reconciliation" });
      }
    }

    return kernelSuccess({ success: true, reconciled, merged, rejected, results }, ctx);
  }

  // 404 for unknown routes
  return kernelError("INVALID_REQUEST", "Not found", 404, ctx);
}));
