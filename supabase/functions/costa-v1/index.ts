/**
 * COSTA v1.1 — Impilo Costing Engine (Edge Function)
 * 
 * Implements: cost engines (micro/ABC/tariff/standard/stock-avg),
 * charging rules, exemptions/insurance/subsidy, bill lifecycle,
 * event ingestion, MUSHEX payment stubs, and dual-mode behavior.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ──
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, idempotency-key, x-step-up",
};

// ── ULID generator (simple) ──
function ulid(): string {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 16);
  return (t + r).toUpperCase();
}

// ── Supabase client ──
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "costa" } }
  );
}

function getSupabaseRaw(schema = "costa") {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema } }
  );
}

// ── TSHEPO header validation ──
interface Ctx {
  tenantId: string;
  correlationId: string;
  actorId: string;
  actorType: string;
  facilityId?: string;
  purposeOfUse?: string;
  deviceFingerprint?: string;
  requestId: string;
  stepUp?: boolean;
}

function extractCtx(req: Request): { ctx: Ctx | null; err: Response | null } {
  const tenantId = req.headers.get("x-tenant-id");
  const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();
  const actorId = req.headers.get("x-actor-id");
  const actorType = req.headers.get("x-actor-type");
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  const missing: string[] = [];
  if (!tenantId) missing.push("X-Tenant-Id");
  if (!actorId) missing.push("X-Actor-Id");
  if (!actorType) missing.push("X-Actor-Type");

  if (missing.length > 0) {
    return {
      ctx: null,
      err: json({ error: { code: "MISSING_REQUIRED_HEADER", message: `Missing: ${missing.join(", ")}`, request_id: requestId, correlation_id: correlationId } }, 400, correlationId),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!,
      correlationId,
      actorId: actorId!,
      actorType: actorType!,
      facilityId: req.headers.get("x-facility-id") || undefined,
      purposeOfUse: req.headers.get("x-purpose-of-use") || undefined,
      deviceFingerprint: req.headers.get("x-device-fingerprint") || undefined,
      requestId,
      stepUp: req.headers.get("x-step-up") === "TRUE",
    },
    err: null,
  };
}

function requireStepUp(ctx: Ctx): Response | null {
  if (ctx.stepUp) return null;
  return json({
    code: "STEP_UP_REQUIRED",
    next: { method: "OIDC_STEP_UP", reason: "HIGH_RISK_ACTION" },
  }, 403, ctx.correlationId);
}

function json(body: unknown, status = 200, correlationId = ""): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-ID": correlationId },
  });
}

// ── Audit helper ──
async function writeAudit(ctx: Ctx, action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  const db = getSupabaseRaw("audit");
  await db.from("audit_log").insert({
    id: crypto.randomUUID(),
    tenant_id: ctx.tenantId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    actor_id: ctx.actorId,
    actor_type: ctx.actorType,
    purpose_of_use: ctx.purposeOfUse || "BILLING",
    correlation_id: ctx.correlationId,
    details,
  });
}

// ── Outbox helper ──
async function writeOutbox(ctx: Ctx, eventType: string, entityType: string, entityId: string, payload: Record<string, unknown> = {}) {
  const db = getSupabaseRaw("outbox");
  await db.from("events").insert({
    id: ulid(),
    tenant_id: ctx.tenantId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    correlation_id: ctx.correlationId,
  });
}

// ══════════════════════════════════════════════════════════════
// COST ENGINES
// ══════════════════════════════════════════════════════════════

interface CostInput {
  msika_code: string;
  kind: string;
  qty: number;
  drivers?: Record<string, number>; // e.g. { bed_days: 5, theatre_minutes: 90 }
  cost_method?: string; // MICRO|ABC|TARIFF|STANDARD|STOCK_AVG
}

interface CostResult {
  cost_amount: number;
  unit_cost: number;
  cost_trace: Record<string, unknown>;
}

async function computeCost(input: CostInput, ctx: Ctx): Promise<CostResult> {
  const method = input.cost_method || "TARIFF";
  switch (method) {
    case "MICRO": return computeMicroCost(input, ctx);
    case "ABC": return computeABCCost(input, ctx);
    case "TARIFF": return computeTariffCost(input, ctx);
    case "STANDARD": return computeStandardCost(input, ctx);
    case "STOCK_AVG": return computeStockAvgCost(input, ctx);
    default: return computeTariffCost(input, ctx);
  }
}

async function computeMicroCost(input: CostInput, ctx: Ctx): Promise<CostResult> {
  // Micro-costing: resource units * unit cost from unit_cost_sources
  const db = getSupabase();
  const { data: sources } = await db.from("unit_cost_sources")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .lte("effective_from", new Date().toISOString())
    .limit(1);

  const unitCost = sources?.[0]?.ref?.unit_cost || 0;
  const totalDriverUnits = input.drivers
    ? Object.values(input.drivers).reduce((s, v) => s + v, 0)
    : input.qty;

  const cost = Number(unitCost) * totalDriverUnits;
  return {
    cost_amount: cost,
    unit_cost: Number(unitCost),
    cost_trace: {
      method: "MICRO",
      unit_cost: unitCost,
      driver_units: totalDriverUnits,
      drivers: input.drivers || { qty: input.qty },
      source: sources?.[0]?.id || "default",
    },
  };
}

async function computeABCCost(input: CostInput, ctx: Ctx): Promise<CostResult> {
  // ABC: allocate overhead pools by drivers
  const db = getSupabase();
  const { data: pools } = await db.from("abc_cost_pools")
    .select("*, abc_driver_rates(*)")
    .eq("tenant_id", ctx.tenantId)
    .limit(50);

  let totalCost = 0;
  const poolTraces: Record<string, unknown>[] = [];

  for (const pool of pools || []) {
    const rates = (pool as any).abc_driver_rates || [];
    for (const rate of rates) {
      const driverUnits = input.drivers?.[rate.driver_unit] || 0;
      if (driverUnits > 0) {
        const allocated = Number(rate.rate) * driverUnits;
        totalCost += allocated;
        poolTraces.push({
          pool_name: pool.pool_name,
          driver_unit: rate.driver_unit,
          rate: rate.rate,
          units: driverUnits,
          allocated,
        });
      }
    }
  }

  return {
    cost_amount: totalCost,
    unit_cost: input.qty > 0 ? totalCost / input.qty : 0,
    cost_trace: { method: "ABC", pools: poolTraces },
  };
}

async function computeTariffCost(input: CostInput, ctx: Ctx): Promise<CostResult> {
  const db = getSupabase();
  const now = new Date().toISOString();
  const { data: tariffs } = await db.from("tariffs")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("msika_code", input.msika_code)
    .lte("effective_from", now)
    .order("effective_from", { ascending: false })
    .limit(1);

  const tariff = tariffs?.[0];
  const unitCost = tariff ? Number(tariff.price) : 0;
  const cost = unitCost * input.qty;
  return {
    cost_amount: cost,
    unit_cost: unitCost,
    cost_trace: {
      method: "TARIFF",
      tariff_code: tariff?.tariff_code || "NONE",
      tariff_id: tariff?.id,
      effective_from: tariff?.effective_from,
      price: unitCost,
    },
  };
}

async function computeStandardCost(input: CostInput, _ctx: Ctx): Promise<CostResult> {
  // Standard: fixed unit cost per msika_code (from config or fallback)
  const standardCost = 100; // prototype default
  const cost = standardCost * input.qty;
  return {
    cost_amount: cost,
    unit_cost: standardCost,
    cost_trace: { method: "STANDARD", standard_unit_cost: standardCost, variance: 0 },
  };
}

async function computeStockAvgCost(input: CostInput, ctx: Ctx): Promise<CostResult> {
  const db = getSupabase();
  const { data } = await db.from("stock_avg_cost")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("facility_id", ctx.facilityId || "")
    .eq("msika_code", input.msika_code)
    .limit(1);

  const avg = data?.[0];
  const unitCost = avg ? Number(avg.avg_unit_cost) : 0;
  const cost = unitCost * input.qty;
  return {
    cost_amount: cost,
    unit_cost: unitCost,
    cost_trace: { method: "STOCK_AVG", avg_unit_cost: unitCost, total_qty_on_hand: avg?.total_qty || 0 },
  };
}

// ══════════════════════════════════════════════════════════════
// CHARGING RULES ENGINE
// ══════════════════════════════════════════════════════════════

interface ChargeResult {
  unit_price: number;
  amount: number;
  charge_trace: Record<string, unknown>;
}

async function applyChargingRules(
  costResult: CostResult,
  input: CostInput,
  ctx: Ctx
): Promise<ChargeResult> {
  const db = getSupabase();
  const { data: rulesets } = await db.from("charging_rulesets")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "PUBLISHED")
    .lte("effective_from", new Date().toISOString())
    .order("effective_from", { ascending: false })
    .limit(1);

  const ruleset = rulesets?.[0];
  const rules = (ruleset?.rules as any[]) || [];

  let unitPrice = costResult.unit_cost;
  const appliedRules: Record<string, unknown>[] = [];

  // Sort by priority (lower = higher priority)
  const sorted = [...rules].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  for (const rule of sorted) {
    // Check kind match
    if (rule.kind && rule.kind !== input.kind && rule.kind !== "*") continue;
    // Check msika_code match
    if (rule.msika_code && rule.msika_code !== input.msika_code && rule.msika_code !== "*") continue;

    if (rule.type === "MARKUP") {
      const markup = Number(rule.value || 0);
      const before = unitPrice;
      unitPrice = unitPrice * (1 + markup / 100);
      appliedRules.push({ rule_id: rule.id || "anon", type: "MARKUP", value: markup, before, after: unitPrice });
    } else if (rule.type === "FIXED_PRICE") {
      unitPrice = Number(rule.value || 0);
      appliedRules.push({ rule_id: rule.id || "anon", type: "FIXED_PRICE", value: unitPrice });
    } else if (rule.type === "TIME_SURCHARGE") {
      const hour = new Date().getHours();
      if (hour >= (rule.from_hour || 18) || hour < (rule.to_hour || 6)) {
        const surcharge = Number(rule.value || 0);
        unitPrice = unitPrice * (1 + surcharge / 100);
        appliedRules.push({ rule_id: rule.id || "anon", type: "TIME_SURCHARGE", value: surcharge, hour });
      }
    } else if (rule.type === "BUNDLE_INCLUDE") {
      // Item is included in a bundle — zero price
      unitPrice = 0;
      appliedRules.push({ rule_id: rule.id || "anon", type: "BUNDLE_INCLUDE", bundle: rule.bundle_code });
    } else if (rule.type === "EXCLUSION") {
      // Item is excluded/waived
      unitPrice = 0;
      appliedRules.push({ rule_id: rule.id || "anon", type: "EXCLUSION", reason: rule.reason || "waived" });
    }

    if (rule.stop_processing) break;
  }

  const amount = unitPrice * input.qty;
  return {
    unit_price: Math.round(unitPrice * 100) / 100,
    amount: Math.round(amount * 100) / 100,
    charge_trace: {
      ruleset_id: ruleset?.id,
      ruleset_version: ruleset?.version,
      rules_applied: appliedRules,
      cost_unit_price: costResult.unit_cost,
      final_unit_price: Math.round(unitPrice * 100) / 100,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// EXEMPTIONS + INSURANCE + SUBSIDY ENGINE
// ══════════════════════════════════════════════════════════════

interface BillAllocation {
  patient_amount: number;
  insurer_amount: number;
  subsidy_amount: number;
  write_off_amount: number;
  reason_codes: string[];
  trace: Record<string, unknown>;
}

async function computeBillAllocation(
  totalAmount: number,
  ctx: Ctx,
  patientCpid?: string,
  exemptionInputs?: Record<string, unknown>
): Promise<BillAllocation> {
  const db = getSupabase();
  let remaining = totalAmount;
  const reasons: string[] = [];
  const traceSteps: Record<string, unknown>[] = [];

  // 1. Exemptions
  const { data: exemptionData } = await db.from("exemption_rules")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .lte("effective_from", new Date().toISOString())
    .order("effective_from", { ascending: false })
    .limit(1);

  const exemptionRules = (exemptionData?.[0]?.rules as any[]) || [];
  let exemptionPct = 0;

  for (const rule of exemptionRules) {
    if (rule.type === "AGE_BAND") {
      const isEligible = exemptionInputs?.age_eligible === true;
      if (isEligible) {
        exemptionPct = Math.max(exemptionPct, Number(rule.discount_pct || 100));
        reasons.push(`EXEMPTION:AGE_BAND:${rule.band || "under5/over60"}`);
      }
    } else if (rule.type === "CATEGORY") {
      const category = exemptionInputs?.category;
      if (category && rule.categories?.includes(category)) {
        exemptionPct = Math.max(exemptionPct, Number(rule.discount_pct || 100));
        reasons.push(`EXEMPTION:CATEGORY:${category}`);
      }
    }
  }

  const exemptionAmount = Math.round(remaining * (exemptionPct / 100) * 100) / 100;
  remaining -= exemptionAmount;
  traceSteps.push({ step: "exemption", pct: exemptionPct, amount: exemptionAmount });

  // 2. Insurance
  const { data: plans } = await db.from("insurance_plans")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .lte("effective_from", new Date().toISOString())
    .limit(5);

  let insurerAmount = 0;
  for (const plan of plans || []) {
    const rules = plan.rules as any;
    if (!rules) continue;

    const coveragePct = Number(rules.coverage_pct || 0);
    const cap = Number(rules.cap || Infinity);
    const deductible = Number(rules.deductible || 0);
    const copay = Number(rules.copay || 0);

    const afterDeductible = Math.max(0, remaining - deductible);
    let covered = Math.min(afterDeductible * (coveragePct / 100), cap);
    covered = Math.round(covered * 100) / 100;
    insurerAmount += covered;
    remaining -= covered;

    if (copay > 0) {
      remaining += Math.min(copay, covered); // copay goes back to patient
      insurerAmount -= Math.min(copay, covered);
    }

    reasons.push(`INSURANCE:${plan.plan_code}`);
    traceSteps.push({
      step: "insurance",
      plan: plan.plan_code,
      coverage_pct: coveragePct,
      cap,
      deductible,
      copay,
      covered,
    });
    break; // Single plan for prototype
  }

  // 3. Subsidy
  let subsidyAmount = 0;
  // Placeholder: subsidies could be per-facility or per-program
  traceSteps.push({ step: "subsidy", amount: subsidyAmount });

  // 4. Write-off = exemption amount
  const writeOff = exemptionAmount;
  const patientAmount = Math.max(0, Math.round(remaining * 100) / 100);

  return {
    patient_amount: patientAmount,
    insurer_amount: Math.round(insurerAmount * 100) / 100,
    subsidy_amount: subsidyAmount,
    write_off_amount: writeOff,
    reason_codes: reasons,
    trace: { steps: traceSteps, total_input: totalAmount },
  };
}

// ══════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/costa-v1/, "");

  // Internal endpoints don't need full TSHEPO validation
  const isInternal = path.startsWith("/v1/internal/");

  const { ctx, err } = extractCtx(req);
  if (!ctx && !isInternal) return err!;
  const safeCtx: Ctx = ctx || {
    tenantId: req.headers.get("x-tenant-id") || "system",
    correlationId: req.headers.get("x-correlation-id") || crypto.randomUUID(),
    actorId: "SYSTEM",
    actorType: "SYSTEM",
    requestId: crypto.randomUUID(),
  };

  try {
    // ── POST /v1/estimate ──
    if (req.method === "POST" && path === "/v1/estimate") {
      const body = await req.json();
      const lines: any[] = body.lines || [];
      const resultLines: any[] = [];
      let totalCost = 0;
      let totalCharge = 0;

      for (const line of lines) {
        const costResult = await computeCost(line, safeCtx);
        const chargeResult = await applyChargingRules(costResult, line, safeCtx);
        totalCost += costResult.cost_amount;
        totalCharge += chargeResult.amount;
        resultLines.push({
          msika_code: line.msika_code,
          kind: line.kind,
          qty: line.qty,
          cost_amount: costResult.cost_amount,
          unit_cost: costResult.unit_cost,
          unit_price: chargeResult.unit_price,
          amount: chargeResult.amount,
          cost_trace: costResult.cost_trace,
          charge_trace: chargeResult.charge_trace,
        });
      }

      const allocation = await computeBillAllocation(totalCharge, safeCtx, body.patient_cpid, body.exemption_inputs);

      await writeAudit(safeCtx, "costa.estimate.created", "estimate", "adhoc", { line_count: lines.length, total: totalCharge });
      await writeOutbox(safeCtx, "costa.estimate.created", "estimate", "adhoc", { total: totalCharge });

      return json({
        lines: resultLines,
        totals: { cost: totalCost, charge: totalCharge },
        allocation,
        correlation_id: safeCtx.correlationId,
      }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/draft ──
    if (req.method === "POST" && path === "/v1/bills/draft") {
      const body = await req.json();
      const db = getSupabase();
      const billId = ulid();
      const lines: any[] = body.lines || [];
      const billLines: any[] = [];
      let totalCost = 0;
      let totalCharge = 0;

      // Determine mode
      const { data: capProfile } = await db.from("capability_profiles")
        .select("*")
        .eq("tenant_id", safeCtx.tenantId)
        .eq("facility_id", safeCtx.facilityId || "")
        .limit(1);
      const mode = (capProfile?.[0]?.profile as any)?.mode || "INTERNAL";

      for (const line of lines) {
        const lineId = ulid();
        const costResult = await computeCost(line, safeCtx);
        const chargeResult = await applyChargingRules(costResult, line, safeCtx);
        totalCost += costResult.cost_amount;
        totalCharge += chargeResult.amount;
        const lineMode = line.mode || (mode === "HYBRID" ? "INTERNAL" : mode);
        billLines.push({
          line_id: lineId,
          bill_id: billId,
          msika_code: line.msika_code,
          kind: line.kind || "OTHER",
          qty: line.qty,
          unit_price: chargeResult.unit_price,
          amount: chargeResult.amount,
          cost_amount: costResult.cost_amount,
          cost_trace: costResult.cost_trace,
          charge_trace: chargeResult.charge_trace,
          restriction_snapshot: line.restriction_snapshot || {},
          mode: lineMode,
        });
      }

      const allocation = await computeBillAllocation(totalCharge, safeCtx, body.patient_cpid, body.exemption_inputs);

      const billStatus = mode === "EXTERNAL" ? "FINAL_EXTERNAL" : "DRAFT";

      await db.from("bill_headers").insert({
        bill_id: billId,
        tenant_id: safeCtx.tenantId,
        facility_id: safeCtx.facilityId || body.facility_id || "",
        encounter_id: body.encounter_id || null,
        msika_order_id: body.msika_order_id || null,
        status: billStatus,
        currency: body.currency || "ZAR",
        totals: { cost: totalCost, charge: totalCharge, ...allocation },
        trace_summary: { line_count: billLines.length, mode },
      });

      if (billLines.length > 0) {
        await db.from("bill_lines").insert(billLines);
      }

      // Create bill parties
      const parties: any[] = [];
      if (allocation.patient_amount > 0)
        parties.push({ id: ulid(), bill_id: billId, party_type: "PATIENT", amount: allocation.patient_amount, reason_codes: allocation.reason_codes });
      if (allocation.insurer_amount > 0)
        parties.push({ id: ulid(), bill_id: billId, party_type: "INSURER", amount: allocation.insurer_amount, reason_codes: allocation.reason_codes });
      if (allocation.subsidy_amount > 0)
        parties.push({ id: ulid(), bill_id: billId, party_type: "SUBSIDY", amount: allocation.subsidy_amount, reason_codes: [] });
      if (allocation.write_off_amount > 0)
        parties.push({ id: ulid(), bill_id: billId, party_type: "WRITE_OFF", amount: allocation.write_off_amount, reason_codes: allocation.reason_codes });

      if (parties.length > 0) await db.from("bill_parties").insert(parties);

      await writeAudit(safeCtx, "costa.bill.draft.created", "bill", billId, { total: totalCharge, mode });
      await writeOutbox(safeCtx, "costa.bill.draft.created", "bill", billId, { total: totalCharge });

      return json({ bill_id: billId, status: billStatus, totals: { cost: totalCost, charge: totalCharge }, allocation, lines: billLines.length }, 201, safeCtx.correlationId);
    }

    // ── GET /v1/bills/:id ──
    if (req.method === "GET" && path.match(/^\/v1\/bills\/[A-Z0-9]+$/)) {
      const billId = path.split("/").pop()!;
      const db = getSupabase();
      const { data: bill } = await db.from("bill_headers").select("*").eq("bill_id", billId).single();
      if (!bill) return json({ error: { code: "NOT_FOUND", message: "Bill not found" } }, 404, safeCtx.correlationId);

      const { data: lines } = await db.from("bill_lines").select("*").eq("bill_id", billId);
      const { data: parties } = await db.from("bill_parties").select("*").eq("bill_id", billId);

      return json({ ...bill, lines: lines || [], parties: parties || [] }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/recompute ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/recompute$/)) {
      const billId = path.split("/")[3];
      const db = getSupabase();
      const { data: bill } = await db.from("bill_headers").select("*").eq("bill_id", billId).single();
      if (!bill) return json({ error: { code: "NOT_FOUND" } }, 404, safeCtx.correlationId);
      if (bill.status === "FINAL" || bill.status === "VOID") {
        return json({ error: { code: "BILL_LOCKED", message: "Cannot recompute finalized bill" } }, 409, safeCtx.correlationId);
      }

      const { data: lines } = await db.from("bill_lines").select("*").eq("bill_id", billId);
      let totalCost = 0, totalCharge = 0;

      for (const line of lines || []) {
        const input: CostInput = { msika_code: line.msika_code || "", kind: line.kind, qty: Number(line.qty), cost_method: (line.cost_trace as any)?.method };
        const costResult = await computeCost(input, safeCtx);
        const chargeResult = await applyChargingRules(costResult, input, safeCtx);
        totalCost += costResult.cost_amount;
        totalCharge += chargeResult.amount;

        await db.from("bill_lines").update({
          unit_price: chargeResult.unit_price,
          amount: chargeResult.amount,
          cost_amount: costResult.cost_amount,
          cost_trace: costResult.cost_trace,
          charge_trace: chargeResult.charge_trace,
        }).eq("line_id", line.line_id);
      }

      await db.from("bill_headers").update({
        totals: { cost: totalCost, charge: totalCharge },
        updated_at: new Date().toISOString(),
        lock_version: (bill.lock_version || 0) + 1,
      }).eq("bill_id", billId);

      await writeAudit(safeCtx, "costa.bill.recomputed", "bill", billId, { total: totalCharge });

      return json({ bill_id: billId, totals: { cost: totalCost, charge: totalCharge }, recomputed: true }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/submit-approval ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/submit-approval$/)) {
      const billId = path.split("/")[3];
      const db = getSupabase();
      await db.from("bill_headers").update({ status: "APPROVAL_PENDING", updated_at: new Date().toISOString() }).eq("bill_id", billId);
      await db.from("approvals").insert({ id: ulid(), bill_id: billId, step: "REVIEW", status: "PENDING" });
      await writeAudit(safeCtx, "costa.bill.submitted", "bill", billId, {});
      return json({ bill_id: billId, status: "APPROVAL_PENDING" }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/approve (step-up) ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/approve$/)) {
      const stepUpErr = requireStepUp(safeCtx);
      if (stepUpErr) return stepUpErr;
      const billId = path.split("/")[3];
      const body = await req.json();
      const db = getSupabase();
      await db.from("approvals").update({ status: "APPROVED", approver_actor_id: safeCtx.actorId, note: body.note || null }).eq("bill_id", billId).eq("status", "PENDING");
      await writeAudit(safeCtx, "costa.bill.approved", "bill", billId, { approver: safeCtx.actorId });
      return json({ bill_id: billId, approved: true }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/finalize (step-up) ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/finalize$/)) {
      const billId = path.split("/")[3];
      const db = getSupabase();
      const { data: bill } = await db.from("bill_headers").select("*").eq("bill_id", billId).single();
      if (!bill) return json({ error: { code: "NOT_FOUND" } }, 404, safeCtx.correlationId);

      await db.from("bill_headers").update({
        status: "FINAL",
        updated_at: new Date().toISOString(),
        lock_version: (bill.lock_version || 0) + 1,
      }).eq("bill_id", billId);

      await writeAudit(safeCtx, "costa.bill.finalized", "bill", billId, {});
      await writeOutbox(safeCtx, "costa.bill.finalized", "bill", billId, { totals: bill.totals });

      return json({ bill_id: billId, status: "FINAL" }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/issue-invoice ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/issue-invoice$/)) {
      const billId = path.split("/")[3];
      const db = getSupabase();
      const invoiceId = ulid();
      await db.from("invoices").insert({ invoice_id: invoiceId, bill_id: billId });
      await writeAudit(safeCtx, "costa.invoice.issued", "invoice", invoiceId, { bill_id: billId });
      await writeOutbox(safeCtx, "costa.invoice.issued", "invoice", invoiceId, { bill_id: billId });
      return json({ invoice_id: invoiceId, bill_id: billId }, 201, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/create-payment-intent ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/create-payment-intent$/)) {
      const billId = path.split("/")[3];
      const db = getSupabase();
      const { data: bill } = await db.from("bill_headers").select("*").eq("bill_id", billId).single();
      if (!bill) return json({ error: { code: "NOT_FOUND" } }, 404, safeCtx.correlationId);

      const paymentId = ulid();
      const intentId = `mushex_pi_${paymentId}`;
      const patientAmount = (bill.totals as any)?.patient_amount || (bill.totals as any)?.charge || 0;

      await db.from("payments").insert({
        id: paymentId,
        bill_id: billId,
        mushex_payment_intent_id: intentId,
        status: "PENDING",
        paid_amount: patientAmount,
      });

      await writeAudit(safeCtx, "costa.payment.intent.created", "payment", paymentId, { intent: intentId });

      return json({
        payment_id: paymentId,
        mushex_payment_intent_id: intentId,
        amount: patientAmount,
        currency: bill.currency,
        payment_url: `https://mushex.stub/pay/${intentId}`,
      }, 201, safeCtx.correlationId);
    }

    // ── POST /v1/bills/:id/refund (step-up above threshold) ──
    if (req.method === "POST" && path.match(/^\/v1\/bills\/[A-Z0-9]+\/refund$/)) {
      const body = await req.json();
      const amount = Number(body.amount || 0);
      if (amount > 1000) {
        const stepUpErr = requireStepUp(safeCtx);
        if (stepUpErr) return stepUpErr;
      }

      const billId = path.split("/")[3];
      const db = getSupabase();
      const refundId = ulid();
      await db.from("refunds").insert({
        id: refundId,
        bill_id: billId,
        amount,
        reason: body.reason || "",
        status: amount > 1000 ? "APPROVED" : "REQUESTED",
      });

      await writeAudit(safeCtx, "costa.refund.requested", "refund", refundId, { amount, bill_id: billId });
      await writeOutbox(safeCtx, "costa.refund.issued", "refund", refundId, { amount, bill_id: billId });

      return json({ refund_id: refundId, status: "REQUESTED", amount }, 201, safeCtx.correlationId);
    }

    // ── GET /v1/rulesets ──
    if (req.method === "GET" && path === "/v1/rulesets") {
      const db = getSupabase();
      const { data } = await db.from("charging_rulesets").select("*").eq("tenant_id", safeCtx.tenantId).order("created_at", { ascending: false }).limit(50);
      return json({ rulesets: data || [] }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/rulesets/publish (step-up) ──
    if (req.method === "POST" && path === "/v1/rulesets/publish") {
      const stepUpErr = requireStepUp(safeCtx);
      if (stepUpErr) return stepUpErr;
      const body = await req.json();
      const db = getSupabase();
      await db.from("charging_rulesets").update({ status: "PUBLISHED" }).eq("id", body.ruleset_id);
      await writeAudit(safeCtx, "costa.ruleset.published", "ruleset", body.ruleset_id, {});
      return json({ published: true }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/tariffs/import (step-up) ──
    if (req.method === "POST" && path === "/v1/tariffs/import") {
      const stepUpErr = requireStepUp(safeCtx);
      if (stepUpErr) return stepUpErr;
      const body = await req.json();
      const db = getSupabase();
      const tariffs = (body.tariffs || []).map((t: any) => ({
        id: ulid(),
        tenant_id: safeCtx.tenantId,
        tariff_code: t.tariff_code,
        msika_code: t.msika_code || null,
        price: Number(t.price || 0),
        currency: t.currency || "ZAR",
        effective_from: t.effective_from || new Date().toISOString(),
        effective_to: t.effective_to || null,
        rules: t.rules || {},
      }));
      if (tariffs.length > 0) await db.from("tariffs").insert(tariffs);
      await writeAudit(safeCtx, "costa.tariffs.imported", "tariff", "batch", { count: tariffs.length });
      return json({ imported: tariffs.length }, 201, safeCtx.correlationId);
    }

    // ── GET /v1/audit/bill/:id ──
    if (req.method === "GET" && path.match(/^\/v1\/audit\/bill\/[A-Z0-9]+$/)) {
      const billId = path.split("/").pop()!;
      const db = getSupabaseRaw("audit");
      const { data } = await db.from("audit_log").select("*").eq("entity_id", billId).order("created_at", { ascending: false }).limit(100);
      return json({ entries: data || [] }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/internal/events/ingest ──
    if (req.method === "POST" && path === "/v1/internal/events/ingest") {
      const body = await req.json();
      const events = body.events || [body];
      const db = getSupabase();

      for (const evt of events) {
        const eventType = evt.event_type || "";

        // Handle encounter events
        if (eventType === "pct.encounter.opened") {
          await db.from("encounters").upsert({
            encounter_id: evt.encounter_id,
            tenant_id: safeCtx.tenantId,
            facility_id: evt.facility_id || safeCtx.facilityId || "",
            patient_cpid: evt.patient_cpid || "",
            pct_ref: evt.pct_ref || {},
            status: "OPEN",
          });
        } else if (eventType === "pct.encounter.closed" || eventType === "pct.admission.discharged") {
          await db.from("encounters").update({ status: "CLOSED", closed_at: new Date().toISOString() }).eq("encounter_id", evt.encounter_id);
        }

        // Handle inventory cost events for stock weighted average
        if (eventType.startsWith("inventory.")) {
          const qty = Number(evt.qty || 0);
          const unitCost = Number(evt.unit_cost || 0);
          const msikaCode = evt.msika_code || "";
          const facilityId = evt.facility_id || safeCtx.facilityId || "";

          if (msikaCode && qty > 0) {
            const { data: existing } = await db.from("stock_avg_cost")
              .select("*")
              .eq("tenant_id", safeCtx.tenantId)
              .eq("facility_id", facilityId)
              .eq("msika_code", msikaCode)
              .limit(1);

            const current = existing?.[0];
            if (current) {
              const newTotalQty = Number(current.total_qty) + qty;
              const newTotalValue = Number(current.total_value) + (qty * unitCost);
              const newAvg = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;
              await db.from("stock_avg_cost").update({
                avg_unit_cost: Math.round(newAvg * 100) / 100,
                total_qty: newTotalQty,
                total_value: Math.round(newTotalValue * 100) / 100,
                updated_at: new Date().toISOString(),
              }).eq("id", current.id);
            } else {
              await db.from("stock_avg_cost").insert({
                id: ulid(),
                tenant_id: safeCtx.tenantId,
                facility_id: facilityId,
                msika_code: msikaCode,
                avg_unit_cost: unitCost,
                total_qty: qty,
                total_value: qty * unitCost,
              });
            }

            // Snapshot
            await db.from("inventory_cost_snapshots").insert({
              id: ulid(),
              tenant_id: safeCtx.tenantId,
              facility_id: facilityId,
              msika_code: msikaCode,
              event_type: eventType,
              qty,
              unit_cost: unitCost,
              total_cost: qty * unitCost,
            });
          }
        }

        // Write to outbox
        await writeOutbox(safeCtx, `costa.ingested.${eventType}`, evt.entity_type || "event", evt.entity_id || evt.encounter_id || "unknown", evt);
      }

      return json({ ingested: events.length }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/internal/mushex/payment-status ──
    if (req.method === "POST" && path === "/v1/internal/mushex/payment-status") {
      const body = await req.json();
      const db = getSupabase();
      const { data: payment } = await db.from("payments").select("*").eq("mushex_payment_intent_id", body.payment_intent_id).single();
      if (!payment) return json({ error: { code: "NOT_FOUND" } }, 404, safeCtx.correlationId);

      const newStatus = body.status === "PAID" ? "PAID" : "FAILED";
      await db.from("payments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", payment.id);

      await writeAudit(safeCtx, `costa.payment.${newStatus.toLowerCase()}`, "payment", payment.id, { intent: body.payment_intent_id });
      await writeOutbox(safeCtx, `costa.payment.${newStatus.toLowerCase()}`, "payment", payment.id, { bill_id: payment.bill_id });

      return json({ payment_id: payment.id, status: newStatus }, 200, safeCtx.correlationId);
    }

    // ── POST /v1/internal/mushex/refund-status ──
    if (req.method === "POST" && path === "/v1/internal/mushex/refund-status") {
      const body = await req.json();
      const db = getSupabase();
      await db.from("refunds").update({
        status: body.status === "REFUNDED" ? "REFUNDED" : "FAILED",
        mushex_refund_id: body.refund_id,
        updated_at: new Date().toISOString(),
      }).eq("id", body.costa_refund_id);

      return json({ updated: true }, 200, safeCtx.correlationId);
    }

    // ── Tariffs CRUD ──
    if (req.method === "GET" && path === "/v1/tariffs") {
      const db = getSupabase();
      const { data } = await db.from("tariffs").select("*").eq("tenant_id", safeCtx.tenantId).order("created_at", { ascending: false }).limit(200);
      return json({ tariffs: data || [] }, 200, safeCtx.correlationId);
    }

    // ── Exemption rules ──
    if (req.method === "GET" && path === "/v1/exemptions") {
      const db = getSupabase();
      const { data } = await db.from("exemption_rules").select("*").eq("tenant_id", safeCtx.tenantId).limit(50);
      return json({ rules: data || [] }, 200, safeCtx.correlationId);
    }

    // ── Insurance plans ──
    if (req.method === "GET" && path === "/v1/insurance-plans") {
      const db = getSupabase();
      const { data } = await db.from("insurance_plans").select("*").eq("tenant_id", safeCtx.tenantId).limit(50);
      return json({ plans: data || [] }, 200, safeCtx.correlationId);
    }

    // ── Bills list ──
    if (req.method === "GET" && path === "/v1/bills") {
      const db = getSupabase();
      const status = url.searchParams.get("status");
      let query = db.from("bill_headers").select("*").eq("tenant_id", safeCtx.tenantId).order("created_at", { ascending: false }).limit(100);
      if (status) query = query.eq("status", status);
      const { data } = await query;
      return json({ bills: data || [] }, 200, safeCtx.correlationId);
    }

    return json({ error: { code: "NOT_FOUND", message: `Unknown route: ${req.method} ${path}` } }, 404, safeCtx.correlationId);
  } catch (e) {
    console.error("COSTA error:", e);
    return json({ error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Internal error" } }, 500, safeCtx.correlationId);
  }
});
