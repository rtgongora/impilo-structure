# Impilo vNext v1.1 — Wave Migration Plan

**Version:** 2.0  
**Updated:** 2026-02-10  
**Status:** ⏸️ PAUSED — Syncing to updated platform contracts  
**Spec Reference:** vNext Manifest v1.1 + Technical Companion Spec v1.1  

---

## Architecture Evolution Notice

> **As of 2026-02-10**, the execution workstream has moved to Claude-based implementation.
> The Lovable prototype is being re-aligned to the updated platform direction.
> Wave work (1–4) is **paused** until this sync is complete.

### What Changed

The platform introduced a **shared enforcement kernel** that defines mandatory rules for:
- Service-to-service data/event exchange
- Federation/offline authority scenarios
- Idempotent command semantics
- Standard error envelopes

This impacts Lovable because:
1. **UI flows** must assume mandatory headers/identity context exist in requests
2. **Protected actions** (patient merge, tariff update) are federation-authority guarded and may be blocked when the national spine is offline
3. **Write operations** (POST/PUT/PATCH) must support idempotency keys to prevent duplicate submissions
4. **Error rendering** must consume the standard error envelope format consistently

---

## Wave 0 — Baseline Plumbing ✅ COMPLETE (Kernel Layer)

### Deliverables (Implemented)
1. **Kernel client** (`src/lib/kernel/kernelClient.ts`) — Auto-injects `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID`
2. **Edge function middleware** (`supabase/functions/_shared/middleware.ts`) — Server-side header validation + standard error responses
3. **Error formatter** (`src/lib/kernel/errorFormatter.ts`) — Standard `{error: {code, message, details, request_id, correlation_id}}`
4. **Type system** (`src/lib/kernel/types.ts`) — All v1.1 error codes, context types, event envelopes

### What Lovable Reflects
- All API calls go through `invokeKernelFunction()` which injects mandatory headers
- Tenant/Pod context is set via `setTenantContext()`
- Errors follow standard envelope format

---

## Wave 1 — Eventing v1.1 (Delta + Schema Gate) ✅ COMPLETE

### Deliverables (Implemented)
- `ImpiloEventEnvelopeV11` with blocking schema gate
- VITO delta events: `patient.created/updated/merged.v1`
- `EMIT_MODE` (V1_ONLY / V1_1_ONLY / DUAL)
- `meta.partition_key` enforced on all events

---

## Wave 2 — Idempotency + Audit Ledger ✅ COMPLETE

### Deliverables (Implemented)
- Idempotency middleware with canonical hashing (SHA-256)
- Audit ledger: append-only, hash-chained (prev_hash → record_hash)
- VITO commands integrated: upsert + merge use idempotency + audit

---

## Wave 3 — Consistency Class A + PDP (TSHEPO) ✅ COMPLETE

### Deliverables (Implemented)
- TSHEPO PDP engine with deterministic rule evaluation
- Class A enforcer: synchronous PDP before commit
- MSIKA tariff update as reference implementation
- Actor context extraction from headers

---

## ⏸️ Current Focus: Contract Sync (Wave 0–1 Updates)

### Objective
Align the Lovable prototype's UI flows and assumptions with the updated v1.1 platform contracts, without implementing backend service internals.

### What Lovable Must Reflect

#### A. Request Context (Headers)
All UI flows assume these headers are injected on every request:
| Header | Source | UI Representation |
|--------|--------|-------------------|
| `X-Tenant-ID` | Active workspace/org selection | Shown in workspace context bar |
| `X-Pod-ID` | Facility/site node | Shown in facility context |
| `X-Request-ID` | Auto-generated per request | Available in error details |
| `X-Correlation-ID` | Propagated across call chains | Available in error details |

#### B. Idempotency for Write Operations
- All POST/PUT/PATCH actions use `Idempotency-Key` header
- UI prevents double-submit via `useIdempotentMutation` hook
- "Already processed" responses shown gracefully (not as errors)
- Retry behavior is safe by default

#### C. Federation Authority Guard
Protected actions requiring National Spine authority:
| Action | Service | Authority Required |
|--------|---------|-------------------|
| Patient merge | VITO | National spine must be online |
| Tariff update | MSIKA | National spine must be online |

UI must show:
- Spine connectivity status indicator
- Clear blocking message when authority unavailable
- Disabled controls for guarded actions when offline

#### D. Event Envelope Contract
Services emit events following v1.1 envelope:
- `schema_version ≥ 1`
- `tenant_id`, `pod_id` from context
- Producer naming: `{service}-service` (e.g., `vito-service`)
- Event types: `impilo.{service}.{entity}.{action}.v{N}`

#### E. Standard Error Envelope
All errors map to:
```json
{
  "error": {
    "code": "STRING_ENUM",
    "message": "Human readable message",
    "details": {},
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

React hooks: `useKernelError` provides consistent error rendering.

### UI Hooks Added
| Hook | Purpose |
|------|---------|
| `useKernelRequest` | Wraps API calls with context headers + correlation |
| `useIdempotentMutation` | Write operations with idempotency key + safe retry |
| `useFederationGuard` | Checks spine authority before protected actions |
| `useKernelError` | Parses standard error envelope for UI rendering |

### Screens Updated
| Screen | Changes |
|--------|---------|
| Client Registry | Merge actions guarded by federation authority check |
| Product Catalogue | Write operations use idempotent mutations |
| All error states | Consume standard error envelope fields |

---

## Wave 4 — Offline Entitlements + BUTANO Events (PAUSED)

Deferred until contract sync is complete and Claude-based implementation stabilizes.

---

## Out of Scope for Lovable

| Item | Reason |
|------|--------|
| VITO v1.1 endpoint controllers | Backend implemented externally |
| BUTANO/MSIKA/TSHEPO internals | Backend implemented externally |
| Java service code | Not applicable to Lovable |
| Full federation pod registration | Infrastructure concern |
