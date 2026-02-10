# Impilo vNext v1.1 — Compliance Gap Report

**Generated:** 2026-02-09  
**Updated:** 2026-02-10 (Contract Sync)  
**Spec Version:** v1.1.0-canonical  
**Status:** ⏸️ Wave work paused — syncing to updated platform contracts  

---

## 1. Executive Summary

The prototype has completed Waves 1–3 of the v1.1 migration, implementing eventing, idempotency, audit ledger, and Class A consistency primitives in the kernel layer. The execution workstream has now moved to Claude-based implementation for backend services.

**Lovable's role** is now to reflect the v1.1 contract rules in UI flows, hooks, and error handling — NOT to implement backend service internals.

**Resolved:** 19 items (across Waves 0–3 kernel work + contract sync)  
**Remaining:** Items deferred to external implementation or post-sync waves  

---

## 2. Gap Checklist

### 2.1 Global Conventions (Tech Companion Spec §A–E)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| G-01 | Dual API surfaces (`/internal/v1/...` and `/external/v1/...`) | 🔄 EXTERNAL | BLOCKER | Backend routing — implemented externally |
| G-02 | `X-Tenant-ID` header mandatory | ✅ DONE | — | `kernelClient.ts` auto-injects; `middleware.ts` validates server-side |
| G-03 | `X-Pod-ID` header mandatory | ✅ DONE | — | Same as G-02 |
| G-04 | `X-Request-ID` header (generated if missing) | ✅ DONE | — | Auto-generated per request in kernel client |
| G-05 | `X-Correlation-ID` propagated | ✅ DONE | — | `useKernelRequest` hook + kernel client |
| G-06 | 400 error on missing tenant/pod headers | ✅ DONE | — | Middleware returns standard error |
| G-07 | Standard JSON error format | ✅ DONE | — | `errorFormatter.ts` + `useKernelError` hook + `KernelErrorAlert` component |
| G-08 | `Idempotency-Key` on command endpoints | ✅ DONE | — | `useIdempotentMutation` hook + kernel idempotency module |
| G-09 | `X-Client-Timeout-MS` honored | ❌ DEFERRED | MINOR | Post-sync |

### 2.2 TSHEPO — Trust & Policy Service

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| T-01 | Token issuance endpoint | 🔄 EXTERNAL | — | Backend service |
| T-02 | PDP `/internal/v1/pdp/decide` | ✅ DONE | — | Kernel `tshepo/pdpService.ts` (prototype) |
| T-03 | PDP decision values | ✅ DONE | — | ALLOW/DENY/BREAK_GLASS/STEP_UP |
| T-04 | Offline entitlements | ❌ DEFERRED | — | Wave 4 (paused) |
| T-05 | Entitlement JWT | ❌ DEFERRED | — | Wave 4 (paused) |
| T-06 | Policy decision event | ✅ DONE | — | Audit ledger logs every PDP decision |

### 2.3 VITO — Client Registry

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| V-01 | Upsert endpoint | 🔄 EXTERNAL | — | Backend service; kernel has `vitoPatientUpsert` prototype |
| V-02 | Query endpoint | 🔄 EXTERNAL | — | Backend service |
| V-03 | Merge endpoint | 🔄 EXTERNAL | — | Backend service; kernel has `vitoPatientMerge` prototype |
| V-04 | Merge federation authority guard | ✅ DONE (UI) | — | `useFederationGuard` + `SpineStatusIndicator` in Duplicate Queue |
| V-05 | `patient.created.v1` event | ✅ DONE | — | Wave 1 |
| V-06 | `patient.updated.v1` event | ✅ DONE | — | Wave 1 |
| V-07 | `patient.merged.v1` event | ✅ DONE | — | Wave 1 |

### 2.4 MSIKA — Product & Service Registry

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| M-01 | Product create endpoint | 🔄 EXTERNAL | — | Backend service |
| M-02 | Tariff update (Class A) | ✅ DONE | — | `msikaTariffUpdate` + Class A enforcer (prototype) |
| M-03 | External product read | 🔄 EXTERNAL | — | Backend service |
| M-04 | Product events | 🔄 EXTERNAL | — | Backend service |
| M-05 | Tariff event + audit | ✅ DONE | — | Wave 3 |

### 2.5 BUTANO — Shared Health Record

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| B-01–B-04 | All BUTANO items | 🔄 EXTERNAL | — | Backend service (deferred) |

### 2.6 Eventing Standard

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| E-01–E-06 | All eventing items | ✅ DONE | Wave 1 complete |

### 2.7 Consistency & Safety

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| C-01 | Class A sync PDP | ✅ DONE | MSIKA reference impl |
| C-02 | Class B bounded-stale | ❌ DEFERRED | Post-sync |
| C-03 | Class C offline entitlements | ❌ DEFERRED | Wave 4 paused |

### 2.8 Audit Ledger

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| A-01 | Append-only | ✅ DONE | Wave 2 |
| A-02 | Hash chaining | ✅ DONE | Wave 2 |
| A-03 | Mandatory audit events | ✅ DONE | PDP, merge, tariff all audited |

### 2.9 UI/UX Contract Alignment (NEW)

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| U-10 | `useKernelRequest` hook for context headers | ✅ DONE | Contract sync |
| U-11 | `useIdempotentMutation` for write ops | ✅ DONE | Contract sync |
| U-12 | `useFederationGuard` for protected actions | ✅ DONE | Contract sync |
| U-13 | `useKernelError` for standard error rendering | ✅ DONE | Contract sync |
| U-14 | `KernelErrorAlert` component | ✅ DONE | Contract sync |
| U-15 | `SpineStatusIndicator` component | ✅ DONE | Contract sync |
| U-16 | Merge buttons disabled when spine offline | ✅ DONE | ClientDuplicateQueue |

---

## 3. Severity Summary

| Category | Total | Resolved | External | Deferred |
|----------|-------|----------|----------|----------|
| Kernel (Waves 0–3) | 28 | 19 | 5 | 4 |
| UI Contract Sync | 7 | 7 | 0 | 0 |

---

## 4. What Lovable Assumes (v1.1 Contract)

1. **All API calls** inject `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID` via `kernelClient.ts`
2. **All write operations** use `Idempotency-Key` via `useIdempotentMutation`
3. **Protected actions** (patient merge, tariff update) check federation authority via `useFederationGuard`
4. **All errors** follow `{error: {code, message, details, request_id, correlation_id}}` and render via `KernelErrorAlert`
5. **Events** follow `impilo.{service}.{entity}.{action}.v{N}` naming with v1.1 envelope
6. **Producers** use `{service}-service` naming (e.g., `vito-service`)
