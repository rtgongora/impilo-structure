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

## Wave 2 — Idempotency + Audit Ledger ✅ COMPLETE

### Objective
Add idempotency support for VITO command endpoints. Implement tamper-evident audit ledger with hash chaining.

### Deliverables
1. **Idempotency types** (`src/lib/kernel/idempotency/types.ts`) — `IdempotencyRecord` with composite key (key, tenant_id, pod_id, route)
2. **Canonical hashing** (`src/lib/kernel/idempotency/hash.ts`) — Stable JSON serialization + SHA-256 for deterministic request body comparison
3. **Idempotency store** (`src/lib/kernel/idempotency/store.ts`) — In-memory store with lock-based concurrent protection, TTL support
4. **Idempotency middleware** (`src/lib/kernel/idempotency/middleware.ts`) — `requireIdempotencyKey()`, `checkIdempotency()`, `storeIdempotencyResult()` with correct conflict semantics (same key+same body → cached, same key+different body → 409 `IDEMPOTENCY_CONFLICT`)
5. **Audit types** (`src/lib/kernel/audit/types.ts`) — `AuditRecord` with actor, decision, reason_codes, policy_version, prev_hash, record_hash
6. **Audit ledger** (`src/lib/kernel/audit/ledger.ts`) — Append-only, hash-chained (SHA-256), per tenant+pod chains, `verifyChain()`, `listByCorrelationId()`
7. **Policy decision logger** (`src/lib/kernel/audit/policyDecisionLogger.ts`) — Reusable `logPolicyDecision()` for PDP decisions, merges, tariff updates
8. **VITO commands** (`src/lib/kernel/vito/commands.ts`) — `vitoPatientUpsert()` and `vitoPatientMerge()` integrating idempotency + audit + v1.1 eventing
9. **New error codes** — `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `AUDIT_LEDGER_WRITE_FAILED` added to `V1_1_ERROR_CODES`
10. **Automated tests** (`src/lib/kernel/wave2/__tests__/wave2.test.ts`) — 19 tests covering hashing, idempotency guard, audit chain, VITO integration

### How to Verify
1. Run tests: `npx vitest run src/lib/kernel/wave2/__tests__/wave2.test.ts`
2. Import and call `vitoPatientUpsert()` with a `KernelRequestContext` + `Idempotency-Key` — observe event + audit record
3. Call again with same key+body — get cached response, no duplicate events/audit
4. Call with same key+different body — get 409 `IDEMPOTENCY_CONFLICT`
5. Call `verifyChain()` — confirms hash chain integrity
6. Call `listByCorrelationId()` — filters audit records by correlation chain

### Exit Criteria
- [x] Repeated `Idempotency-Key` with same body returns same response (no duplicate side effects)
- [x] Repeated `Idempotency-Key` with different body returns 409 `IDEMPOTENCY_CONFLICT`
- [x] Audit ledger records have `prev_hash` → `record_hash` chain (SHA-256)
- [x] No UPDATE/DELETE operations exist in audit code (append-only by design)
- [x] Audit records queryable by `correlation_id`
- [x] VITO upsert + merge write mandatory audit records
- [x] Missing `Idempotency-Key` returns 400 `IDEMPOTENCY_KEY_REQUIRED`

### Rollback
- Idempotency middleware can be bypassed by calling domain functions directly
- Audit ledger is additive (no data loss on rollback)

---

## Wave 3 — Consistency Class A + PDP (TSHEPO) ✅ COMPLETE

### Objective
Implement TSHEPO `/internal/v1/pdp/decide` endpoint. Enforce PDP authorization for MSIKA tariff updates (Class A).

### Deliverables
1. **TSHEPO PDP types** (`src/lib/kernel/tshepo/types.ts`) — `PDPSubject`, `PDPDecideRequest`, `PDPDecideResponse`, `PDPDecisionValue`, `PDPObligation`
2. **PDP rule engine** (`src/lib/kernel/tshepo/pdpEngine.ts`) — Deterministic evaluator: assurance level check, finance/tariff role gating, controlled substance gating, default ALLOW
3. **PDP service** (`src/lib/kernel/tshepo/pdpService.ts`) — `pdpDecide()` evaluates policy + mandatory audit ledger write; fails 500 if audit fails
4. **Actor context** (`src/lib/kernel/security/actorContext.ts`) — `getActorFromHeaders()` extracts subject, roles, facility, assurance from headers; throws 401 AUTH_REQUIRED if missing
5. **PDP client** (`src/lib/kernel/consistency/pdpClient.ts`) — `decidePdp()` wraps PDP call; prototype calls in-process, production would HTTP
6. **Class A enforcer** (`src/lib/kernel/consistency/classAEnforcer.ts`) — `enforceClassAOrThrow()` maps DENY→403, STEP_UP→412, BREAK_GLASS→403, unavailable→503
7. **MSIKA tariff update** (`src/lib/kernel/msika/commands.ts`) — `msikaTariffUpdate()` integrates: idempotency → PDP Class A → domain validation → commit → event → audit → store idempotency
8. **New error codes** — `POLICY_DENY`, `PDP_UNAVAILABLE`, `STEP_UP_REQUIRED`, `BREAK_GLASS_REQUIRED`, `AUTH_REQUIRED` added to `V1_1_ERROR_CODES`
9. **Automated tests** (`src/lib/kernel/wave3/__tests__/wave3.test.ts`) — 20 tests covering PDP engine, PDP service audit, Class A enforcer, actor context, MSIKA integration

### How to Verify
1. Run tests: `npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts`
2. Import `msikaTariffUpdate()` with a `FINANCE_ADMIN` actor + `aal2` → succeeds, emits event, writes 2 audit records (PDP + MSIKA)
3. Call with `CLINICIAN` role → throws `POLICY_DENY`
4. Call with missing assurance level → throws `STEP_UP_REQUIRED`
5. Verify audit chain integrity with `verifyChain()`

### Exit Criteria
- [x] PDP returns `ALLOW/DENY/BREAK_GLASS_REQUIRED/STEP_UP_REQUIRED`
- [x] Tariff update denied when PDP denies
- [x] PDP unavailable → 503 `PDP_UNAVAILABLE` (no silent allow)
- [x] Every PDP decision logged to audit ledger
- [x] MSIKA tariff update emits `impilo.msika.tariff.updated.v1` delta event

### Rollback
- PDP enforcement can be set to `PERMISSIVE` mode (log but don't block)
- Class A enforcer is called explicitly — remove the call to revert to unenforced

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
