# Impilo vNext v1.1 — Wave Migration Plan

**Version:** 3.0  
**Updated:** 2026-02-10  
**Status:** 🟢 Wave 4 COMPLETE  
**Spec Reference:** vNext Manifest v1.1 + Technical Companion Spec v1.1.0-canonical  

---

## Wave 0 — Baseline Plumbing ✅ COMPLETE (Kernel Layer)

### Deliverables (Implemented)
1. **Kernel client** (`src/lib/kernel/kernelClient.ts`) — Auto-injects `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID`
2. **Edge function middleware** (`supabase/functions/_shared/middleware.ts`) — Server-side header validation + standard error responses
3. **Error formatter** (`src/lib/kernel/errorFormatter.ts`) — Standard `{error: {code, message, details, request_id, correlation_id}}`
4. **Type system** (`src/lib/kernel/types.ts`) — All v1.1 error codes, context types, event envelopes

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

## Wave 4 — Offline Entitlements + BUTANO Events ✅ COMPLETE

### Deliverables (Implemented)

#### A. Offline Entitlements (`src/lib/kernel/offlineEntitlements/`)
| File | Purpose |
|------|---------|
| `types.ts` | EntitlementPayload, SignedEntitlement, scopes, constraints, error codes |
| `crypto.ts` | KMS abstraction — ECDSA P-256 signing/verification, key rotation via kid |
| `store.ts` | In-memory entitlement record store (production: Postgres) |
| `issuer.ts` | `issueEntitlement()` — PDP check → sign → audit → emit → store |
| `verifier.ts` | `verifyEntitlementOffline()` — signature + expiry + scope + constraints |
| `events.ts` | Event emitters: issued/revoked/consumed |
| `index.ts` | Module exports |

**Key Design Decisions:**
- Ed25519 signing simulated via ECDSA P-256 (Web Crypto limitation)
- Key rotation via `kid` (key ID) — verifiers accept any known kid
- Max validity window: 6 hours
- PDP ALLOW required before issuance
- Audit record written before response (mandatory)
- Entitlement scope is strict subset of online PDP allowance

#### B. BUTANO Events (`src/lib/kernel/butano/events.ts`)
| Event | Partition Key |
|-------|---------------|
| `impilo.butano.fhir.resource.created.v1` | patient_cpid |
| `impilo.butano.fhir.resource.updated.v1` | patient_cpid |
| `impilo.butano.reconcile.completed.v1` | to_cpid |

**Payload rules:**
- PII-free — no names, contact info, or national IDs
- Delta-first payloads (op, before, after, changed_fields)
- All emits go through schema gate + dual-emit policy

#### C. Updated Kernel Exports
- `src/lib/kernel/index.ts` — exports offline entitlements + BUTANO events
- `src/lib/kernel/types.ts` — added entitlement error codes

#### D. Documentation
- `docs/migration/manifest_diff.md` — Full diff of Manifest v1.0 → v1.1
- `docs/offline_entitlements.md` — Issuance, verification, revocation, security
- `docs/butano_events.md` — Topic contracts, payloads, partitioning

#### E. Tests (`src/lib/kernel/wave4/__tests__/wave4.test.ts`)
- Entitlement issuance blocked if PDP denies
- Entitlement issuance requires audit write before response
- Offline verification passes for valid signature + expiry
- Offline verification fails for wrong scope/expired/kid mismatch
- BUTANO event emitters publish correct v1.1 envelope and partition_key
- Wave 1–3 backward compatibility maintained

---

## Out of Scope for Lovable

| Item | Reason |
|------|--------|
| VITO v1.1 endpoint controllers | Backend implemented externally |
| BUTANO/MSIKA/TSHEPO internals | Backend implemented externally |
| Java service code | Not applicable to Lovable |
| Full federation pod registration | Infrastructure concern |
| HSM/KMS integration | Uses Web Crypto abstraction |
| Schema Registry infrastructure | Prototype uses in-memory validation |
