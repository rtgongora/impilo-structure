# Impilo vNext v1.1 — Wave Migration Plan

**Version:** 1.0  
**Created:** 2026-02-09  
**Spec Reference:** vNext Manifest v1.1 + Technical Companion Spec v1.1  

---

## Wave 0 — Baseline Plumbing (BLOCKING)

### Objective
Enforce mandatory headers, standard error format, and correlation propagation on ALL edge function endpoints.

### Deliverables
1. **Request context middleware** (`src/lib/kernel/requestContext.ts`)
   - Extracts and validates `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID`
   - Generates `X-Request-ID` if missing
   - Returns 400 with standard error format if `X-Tenant-ID` or `X-Pod-ID` missing

2. **Standard error formatter** (`src/lib/kernel/errorFormatter.ts`)
   - Produces `{error: {code, message, details, request_id, correlation_id}}`
   - Error code enum for all v1.1 codes

3. **Edge function middleware** (`supabase/functions/_shared/middleware.ts`)
   - Server-side header validation for all edge functions
   - Standard error responses
   - Correlation ID propagation

4. **Client-side request interceptor** (`src/lib/kernel/kernelClient.ts`)
   - Automatically injects `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID` on all API calls
   - Tenant/Pod context provider

5. **Updated edge functions** — All existing functions wrapped with middleware

### Exit Criteria
- [ ] Every edge function endpoint returns 400 with standard error format when `X-Tenant-ID` or `X-Pod-ID` missing
- [ ] `X-Request-ID` generated if not provided
- [ ] `X-Correlation-ID` appears in response headers and audit log entries
- [ ] Standard error format used in all error responses
- [ ] Client-side interceptor injects headers on all outbound calls

### Rollback
- Remove middleware wrapper; edge functions revert to direct handling
- Client interceptor is additive and can be disabled via config flag

---

## Wave 1 — Eventing v1.1 (Delta + Schema Gate) ✅ COMPLETE

### Objective
Introduce v1.1 event envelope, schema validation, and partition_key. Update VITO to emit v1.1 delta events.

### Deliverables
1. **Event types** (`src/lib/kernel/events/types.ts`) — `ImpiloEventEnvelopeV11`, `ImpiloDeltaPayload`, `ImpiloSnapshotPayload`, `EmitMode`, `EventPublishResult`
2. **Schema gate** (`src/lib/kernel/events/validator.ts`) — `validateEventOrThrow()` blocks publish when `schema_version` missing/invalid, envelope fields missing, or `meta.partition_key` absent
3. **Event emitter** (`src/lib/kernel/events/emitter.ts`) — `emitV11()`, `emitWithPolicy()` with `EMIT_MODE` (`V1_ONLY | V1_1_ONLY | DUAL`), in-memory event bus with listener support
4. **VITO events** (`src/lib/kernel/events/vitoEvents.ts`) — `emitPatientCreated()`, `emitPatientUpdated()`, `emitPatientMerged()` with delta payloads, CPID/CRID partition key resolution
5. **Automated tests** (`src/lib/kernel/events/__tests__/wave1.test.ts`) — 18 tests covering schema gate blocking, VITO event emission, EMIT_MODE toggle

### How to Verify
1. Run tests: `npx vitest run src/lib/kernel/events/__tests__/wave1.test.ts`
2. Import and call `emitPatientCreated()` with a `KernelRequestContext` — observe console log with event type and partition key
3. Call `getStoredEvents()` to inspect emitted events
4. Try emitting an event with `schema_version: 0` — it will be blocked by the schema gate

### Exit Criteria
- [x] VITO emits v1.1 `created/updated/merged` events with all required envelope fields
- [x] `meta.partition_key` present on all events (CPID preferred, CRID fallback)
- [x] Schema gate blocks events without `schema_version` or with invalid envelopes
- [x] `EMIT_MODE` toggle works (V1_ONLY / V1_1_ONLY / DUAL)

### Rollback
- Set `EMIT_MODE=V1_ONLY` to disable v1.1 events

---

## Wave 2 — Idempotency + Audit Ledger

### Objective
Add idempotency support for VITO and MSIKA command endpoints. Implement tamper-evident audit ledger with hash chaining.

### Deliverables
1. **Idempotency store** (DB table: `idempotency_keys`)
2. **Idempotency middleware** (same key + same body → same result; same key + different body → 409 `IDENTITY_CONFLICT`)
3. **Audit ledger table** with `prev_hash`, `record_hash` columns
4. **Audit ledger trigger** (auto-computes hash chain on INSERT, blocks UPDATE/DELETE)
5. **Mandatory audit emissions** for: VITO merge, MSIKA tariff update, authority violations

### Exit Criteria
- [ ] Repeated `Idempotency-Key` with same body returns same response
- [ ] Repeated `Idempotency-Key` with different body returns 409
- [ ] Audit ledger records have `prev_hash` → `record_hash` chain
- [ ] UPDATE/DELETE blocked on audit ledger table
- [ ] Audit records queryable by `correlation_id`

### Rollback
- Idempotency middleware can be bypassed via config
- Audit ledger is additive (no data loss on rollback)

---

## Wave 3 — Consistency Class A + PDP (TSHEPO)

### Objective
Implement TSHEPO `/internal/v1/pdp/decide` endpoint. Enforce PDP authorization for MSIKA tariff updates (Class A).

### Deliverables
1. **TSHEPO PDP decide edge function** returning `decision`, `policy_version`, `reason_codes`, `obligations`, `ttl_seconds`
2. **MSIKA tariff update edge function** calling PDP before commit
3. **Break-glass pathway** when PDP unavailable (if action supports it)
4. **Decision audit events** (`impilo.tshepo.policy.decision.logged.v1`)

### Exit Criteria
- [ ] PDP returns `ALLOW/DENY/BREAK_GLASS_REQUIRED/STEP_UP_REQUIRED`
- [ ] Tariff update denied when PDP denies
- [ ] Tariff update requires break-glass when PDP unavailable (per config)
- [ ] Every PDP decision logged to audit ledger

### Rollback
- PDP enforcement can be set to `PERMISSIVE` mode (log but don't block)

---

## Wave 4 — Offline Entitlements (Class C) + BUTANO Events

### Objective
Issue signed entitlement JWTs for offline capture. Emit BUTANO resource events.

### Deliverables
1. **TSHEPO offline entitlements endpoint** (`/internal/v1/offline/entitlements`)
2. **Entitlement JWT signing** (prototype HMAC signing acceptable; interfaces match spec)
3. **Entitlement verification** in offline capture flows
4. **BUTANO FHIR resource events** (`impilo.butano.fhir.resource.created/updated.v1`)
5. **Partition key** = `patient_cpid` on BUTANO events

### Exit Criteria
- [ ] Entitlement JWT issued with `scope`, `constraints`, `patient_cpid_allowlist`
- [ ] Offline capture requires valid entitlement
- [ ] BUTANO events emitted with `partition_key = patient_cpid`

### Rollback
- Entitlement enforcement can be disabled via config flag
- BUTANO events are additive

---

## Post-Wave Items (Not in Prototype Scope)

| Item | Wave | Notes |
|------|------|-------|
| TSHEPO token issuance (`/external/v1/oauth/token`) | Post-4 | Requires custom token issuer; prototype uses Supabase Auth |
| Full VITO contract (upsert, query, merge endpoints) | Post-4 | Edge functions needed |
| Full MSIKA contract (product CRUD) | Post-4 | Edge functions needed |
| Full BUTANO FHIR endpoints | Post-4 | Requires FHIR server or FHIR-compliant edge functions |
| Federation pod registration | Post-4 | Requires mTLS infrastructure |
| `X-Client-Timeout-MS` enforcement | Post-4 | Nice-to-have |
| 3-Zone UI labeling | Post-4 | UI polish |
| Kernel Admin module | Post-4 | UI surface |
