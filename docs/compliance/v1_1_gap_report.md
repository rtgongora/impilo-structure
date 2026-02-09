# Impilo vNext v1.1 — Compliance Gap Report

**Generated:** 2026-02-09  
**Spec Version:** v1.1.0-canonical  
**Prototype Assessed:** Current Lovable codebase  

---

## 1. Executive Summary

The current prototype implements a rich Trust Layer (identity, consent, policy, audit, offline) and clinical workflows, but was built against the original v1.0 architecture. The v1.1 Manifest and Technical Companion Spec introduce **mandatory service contracts, header standards, eventing discipline, idempotency, consistency classes, federation authority controls, and an audit ledger with hash chaining** — none of which exist in the current prototype.

**Critical gaps:** 35 BLOCKER, 18 MAJOR, 12 MINOR items identified.

---

## 2. Gap Checklist

### 2.1 Global Conventions (Tech Companion Spec §A–E)

| # | Requirement | Status | Severity | Location / Notes |
|---|------------|--------|----------|------------------|
| G-01 | Dual API surfaces (`/internal/v1/...` and `/external/v1/...`) | ❌ MISSING | BLOCKER | All edge functions use flat paths (e.g., `/trust-layer/id/issue`). No `/internal/v1` or `/external/v1` prefix. |
| G-02 | `X-Tenant-ID` header mandatory on every request | ❌ MISSING | BLOCKER | No edge function validates `X-Tenant-ID`. Trust-layer function only checks `x-facility-id` and `x-purpose-of-use`. |
| G-03 | `X-Pod-ID` header mandatory on every request | ❌ MISSING | BLOCKER | Not validated anywhere. |
| G-04 | `X-Request-ID` header (generated if missing) | ❌ MISSING | BLOCKER | No request ID generation or propagation. |
| G-05 | `X-Correlation-ID` header propagated across calls/events | ❌ MISSING | BLOCKER | `correlation_id` exists in audit log schema but is never set from request headers. |
| G-06 | 400 error when `X-Tenant-ID` or `X-Pod-ID` missing | ❌ MISSING | BLOCKER | No header validation middleware exists. |
| G-07 | Standard JSON error format (`{error: {code, message, details, request_id, correlation_id}}`) | ❌ MISSING | BLOCKER | All edge functions return ad-hoc error shapes like `{error: "string"}`. |
| G-08 | `Idempotency-Key` header on command endpoints | ❌ MISSING | BLOCKER | No idempotency support anywhere. |
| G-09 | `X-Client-Timeout-MS` honored by services | ❌ MISSING | MAJOR | No timeout handling. |

### 2.2 TSHEPO — Trust & Policy Service (Tech Companion §1.1)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| T-01 | `POST /external/v1/oauth/token` token issuance | ❌ MISSING | BLOCKER | Auth uses Supabase Auth directly. No TSHEPO token endpoint exists. |
| T-02 | `POST /internal/v1/pdp/decide` PDP endpoint | ❌ MISSING | BLOCKER | `PolicyService.evaluateAccess()` exists client-side but no server-side PDP endpoint with v1.1 contract (decision, policy_version, reason_codes, obligations, ttl_seconds). |
| T-03 | PDP returns `ALLOW/DENY/BREAK_GLASS_REQUIRED/STEP_UP_REQUIRED` | ⚠️ PARTIAL | BLOCKER | Client-side policy service returns boolean `allowed` + `breakGlassAvailable`. Missing `STEP_UP_REQUIRED`, `policy_version`, `reason_codes`, `obligations`, `ttl_seconds`. |
| T-04 | `POST /internal/v1/offline/entitlements` endpoint | ❌ MISSING | BLOCKER | `OfflineService.requestOfflineToken()` exists client-side but no server endpoint with v1.1 contract (scope array, constraints, patient_cpid_allowlist). Response must include `entitlement_jwt`, `entitlement_id`, `policy_version`. |
| T-05 | Entitlement JWT signed tokens | ⚠️ PARTIAL | BLOCKER | Token hash generated but not a signed JWT. |
| T-06 | `impilo.tshepo.policy.decision.logged.v1` event | ❌ MISSING | MAJOR | No v1.1 event emission. |

### 2.3 VITO — Client Registry (Tech Companion §1.2)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| V-01 | `PUT /internal/v1/patients/{crid}` upsert | ❌ MISSING | BLOCKER | No VITO service endpoint. Client registry is managed via `client_registry` table directly. |
| V-02 | `GET /external/v1/patients?identifier=...` query | ❌ MISSING | BLOCKER | No external patient query endpoint. |
| V-03 | `POST /internal/v1/patients/merge` | ❌ MISSING | BLOCKER | No merge endpoint. |
| V-04 | Merge restricted to national-authoritative pods | ❌ MISSING | BLOCKER | No federation authority check. |
| V-05 | `impilo.vito.patient.created.v1` event | ❌ MISSING | MAJOR | No v1.1 events emitted. |
| V-06 | `impilo.vito.patient.updated.v1` event | ❌ MISSING | MAJOR | No v1.1 events emitted. |
| V-07 | `impilo.vito.patient.merged.v1` event | ❌ MISSING | MAJOR | No v1.1 events emitted. |

### 2.4 MSIKA — Product & Service Registry (Tech Companion §1.3)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| M-01 | `POST /internal/v1/products` create | ❌ MISSING | BLOCKER | No MSIKA service endpoint. Product catalog managed via DB tables directly. |
| M-02 | `PUT /internal/v1/tariffs/{tariff_id}` (Class A, PDP required) | ❌ MISSING | BLOCKER | No tariff update endpoint. No PDP enforcement. |
| M-03 | `GET /external/v1/products?...` external read | ❌ MISSING | BLOCKER | No external product endpoint. |
| M-04 | `impilo.msika.product.created/updated.v1` events | ❌ MISSING | MAJOR | No events. |
| M-05 | `impilo.msika.tariff.updated.v1` event + audit | ❌ MISSING | MAJOR | No events, no audit for tariff changes. |
| M-06 | `impilo.msika.snapshot.products.v1` snapshot topic | ❌ MISSING | MAJOR | No snapshot events. |

### 2.5 BUTANO — Shared Health Record (Tech Companion §1.4)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| B-01 | `/internal/v1/fhir/*` endpoints | ❌ MISSING | BLOCKER | No FHIR endpoints. `fhirImagingService.ts` exists but is not a v1.1 compliant service. |
| B-02 | `/external/v1/fhir/*` with SMART scopes | ❌ MISSING | BLOCKER | No external FHIR endpoints. |
| B-03 | `Patient.id = CPID` identity rule | ⚠️ PARTIAL | BLOCKER | Trust Layer issues CPIDs but FHIR resources don't reference them. |
| B-04 | `impilo.butano.fhir.resource.created/updated.v1` events | ❌ MISSING | MAJOR | No events. |

### 2.6 Eventing Standard (Tech Companion §2)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| E-01 | Topic naming: `impilo.{service}.{domain}.{entity}.{action}.v{N}` | ❌ MISSING | BLOCKER | No event topics exist. |
| E-02 | Mandatory envelope fields (event_id, event_type, schema_version, correlation_id, causation_id, idempotency_key, producer, tenant_id, pod_id, occurred_at, emitted_at, subject_type, subject_id, payload, meta) | ❌ MISSING | BLOCKER | No event envelope. |
| E-03 | Delta events (op: CREATE/UPDATE/DELETE/MERGE/REVOKE, before, after, changed_fields) | ❌ MISSING | BLOCKER | No delta events. |
| E-04 | `meta.partition_key` on every event | ❌ MISSING | BLOCKER | No partition keys. |
| E-05 | Schema validation gate blocks invalid events | ❌ MISSING | BLOCKER | No schema registry or validation. |
| E-06 | `EMIT_MODE: V1_ONLY | V1_1_ONLY | DUAL` support | ❌ MISSING | MAJOR | No emission modes. |

### 2.7 Consistency & Safety (Tech Companion §3)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| C-01 | Class A: sync PDP authorization before commit | ❌ MISSING | BLOCKER | No PDP call before any data mutation. |
| C-02 | Class B: bounded-stale with projection watermark | ❌ MISSING | MAJOR | No staleness tracking. |
| C-03 | Class C: offline entitlement verification | ⚠️ PARTIAL | MAJOR | Offline token exists but not a signed JWT entitlement per spec. |
| C-04 | 409 `STALE_CONTEXT` when projection too old | ❌ MISSING | MAJOR | No staleness detection. |

### 2.8 Audit Ledger (Tech Companion §4.3)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| A-01 | Append-only audit table (no updates/deletes) | ⚠️ PARTIAL | BLOCKER | `trust_layer_audit_log` exists but no immutability constraints (no trigger blocking UPDATE/DELETE). |
| A-02 | Hash chaining (`prev_hash`, `record_hash`) | ❌ MISSING | BLOCKER | No hash chaining. |
| A-03 | Mandatory audit events (PDP decisions, break-glass, consent changes, privilege changes, patient merges, tariff updates, federation actions) | ⚠️ PARTIAL | BLOCKER | Some audit logging exists for identity and break-glass but not for PDP, merges, tariffs, or federation. |

### 2.9 Federation (Tech Companion §5)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| F-01 | Pod registration handshake | ❌ MISSING | MAJOR | No federation support. |
| F-02 | 403 `FEDERATION_NOT_AUTHORIZED` on unauthorized merge | ❌ MISSING | BLOCKER | No authority checks. |
| F-03 | 403 `FEDERATION_AUTHORITY_VIOLATION` on restricted field update | ❌ MISSING | BLOCKER | No authority checks. |
| F-04 | `impilo.tshepo.federation.authority_violation.logged.v1` event | ❌ MISSING | MAJOR | No federation events. |

### 2.10 UI/UX (Manifest §8)

| # | Requirement | Status | Severity | Notes |
|---|------------|--------|----------|-------|
| U-01 | 3-Zone framework (Work / My Professional / My Life) | ⚠️ PARTIAL | MINOR | Navigation exists but zones not explicitly labeled per v1.1. |
| U-02 | Non-interference: kernel ops don't disrupt encounter UI | ⚠️ PARTIAL | MINOR | No explicit "Kernel Admin" module surface. |
| U-03 | Kernel Admin module post-login | ❌ MISSING | MINOR | No dedicated kernel admin surface. |

---

## 3. Severity Summary

| Severity | Count |
|----------|-------|
| BLOCKER | 35 |
| MAJOR | 18 |
| MINOR | 3 |

---

## 4. Migration Wave Plan (Summary)

| Wave | Scope | BLOCKERs Addressed | Exit Criteria |
|------|-------|---------------------|---------------|
| **0** | Baseline Plumbing | G-01 through G-07 (7) | All endpoints return standard 400 on missing headers; correlation IDs in logs + responses |
| **1** | Eventing v1.1 | E-01 through E-06, V-05/06/07 (9) | VITO emits v1.1 delta events with partition_key; schema gate blocks invalid |
| **2** | Idempotency + Audit Ledger | G-08, A-01/02/03, M-05 (5) | Idempotency verified; audit ledger has hash chaining |
| **3** | Consistency Class A + PDP | T-02/03, C-01, M-02 (4) | TSHEPO PDP endpoint works; MSIKA tariff update PDP-enforced |
| **4** | Offline Entitlements + BUTANO | T-04/05, B-01/04, C-03 (5) | Entitlement JWT issued; BUTANO emits resource events |

Remaining items (federation, full VITO/MSIKA/BUTANO contracts, UI) are post-Wave 4.

See `docs/migration/wave_migration_plan.md` for full details.
