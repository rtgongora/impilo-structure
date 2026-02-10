# Impilo vNext — Manifest v1.1 Diff Report

**Generated:** 2026-02-10  
**Source Documents:** vNext Manifest v1.0 → v1.1, Technical Companion Spec v1.1.0-canonical  

---

## 1. Architectural Laws Changes

### Added (v1.1)
| Law | Description |
|-----|-------------|
| Law 7 | **Offline Is a Formal Policy Matrix** — Offline support requires explicit per-action allowance, signed entitlements (scope, time window, device binding, patient constraints), conflict resolution rules, mandatory audit events |
| Law 8 | **Workload Partitioning** — Separate Clinical, Telemetry/IoT, and Analytics buses; mixing prohibited |
| Law 9 | **Service Count Discipline** — Module-first, split-later; sovereign services only for shared DPI primitives |

### Changed (v1.0 → v1.1)
| Law | Change |
|-----|--------|
| Law 1 (Identity) | Added: cryptographic CPID derivation (HSM/KMS-backed), rotation support, cross-tenant correlation controls |
| Law 3 (Events) | Added: `causation_id`, `idempotency_key`, `pod_id` as mandatory envelope fields |
| Law 4 (Projections → Delta-First) | Reframed: delta events are default; snapshots for recovery/backfill only; full-state-per-event prohibited for large domains |
| Law 5 (renamed) | Was "Projection Strategy" → now "Projection Strategy With Bounded Staleness"; projections must implement ordering, replay, poison message, backfill, staleness reporting |
| Law 6 (Safety) | Was "Clinical Safety Matrix" → now "Clinical Safety Consistency Classes" with explicit Class A/B/C enforcement patterns and max staleness values |

---

## 2. Ring 0 Service Changes

### Added Services
| Service | Role |
|---------|------|
| UBOMI | CRVS Interface (births/deaths linkage) |

### Changed Services
| Service | Changes |
|---------|---------|
| TSHEPO | Added: offline entitlement issuance (POST /internal/v1/offline/entitlements), device identity & attestation, step-up auth integration, risk scoring hooks |
| BUTANO | Added: explicit FHIR profile governance, canonical resource list defined (Patient/Encounter/Observation/Condition/MedicationRequest/MedicationDispense/AllergyIntolerance/Procedure/Immunization/DiagnosticReport), new events: `impilo.butano.fhir.resource.created.v1`, `impilo.butano.fhir.resource.updated.v1` |
| MUSHEX | Expanded: claims processing, billing, settlement switching; fraud signals; audit requirements |
| MSIKA | Added: snapshot topic `impilo.msika.snapshot.products.v1` |

### New Platform Primitives (Mandatory)
- Schema Registry + Contract Testing Harness
- Audit Ledger Service (tamper-evident)
- Key Management & Secrets Service (KMS/HSM)
- Developer Platform Portal (SDKs, sandbox, API keys)

---

## 3. API Contract Changes

### New Endpoints
| Endpoint | Service | Purpose |
|----------|---------|---------|
| `POST /internal/v1/offline/entitlements` | TSHEPO | Issue offline entitlements for edge devices |
| `POST /external/v1/federation/pods/register` | TSHEPO | Pod registration handshake |
| `POST /internal/v1/federation/pods/{pod_id}/approve` | TSHEPO | Pod approval |

### Header Changes
| Header | Change |
|--------|--------|
| `X-Client-Timeout-MS` | **NEW** — Internal callers must set; services must honor and fail fast |
| `X-Policy-Decision` | **NEW** — Injected by gateway after OPA allow |
| `X-Policy-Version` | **NEW** — Policy version used for decision |
| `X-Decision-Reason` | **NEW** — Reason codes from policy decision |

---

## 4. Event Contract Changes

### New Event Types
| Event Type | Service | Partition Key |
|------------|---------|---------------|
| `impilo.butano.fhir.resource.created.v1` | BUTANO | patient_cpid |
| `impilo.butano.fhir.resource.updated.v1` | BUTANO | patient_cpid |
| `impilo.offline.entitlement.issued.v1` | TSHEPO | tenant_id + actor_id |
| `impilo.offline.entitlement.revoked.v1` | TSHEPO | tenant_id + actor_id |
| `impilo.offline.entitlement.consumed.v1` | TSHEPO | tenant_id + actor_id |
| `impilo.tshepo.federation.pod.approved.v1` | TSHEPO | pod_id |
| `impilo.tshepo.federation.authority_violation.logged.v1` | TSHEPO | pod_id |

### Topic Naming Convention (Formalized)
```
impilo.{service}.{domain}.{entity}.{action}.v{N}
```

### Partition Key Rules (New — Mandatory)
- VITO: `cpid` (or `crid` until CPID assigned)
- BUTANO: `patient_cpid`
- MSIKA: `category_id` (default) or `product_id` for frequent updates
- TSHEPO: `user_id/prid` (auth events) or `patient_cpid` (patient-scoped)

---

## 5. Consistency Model Changes

### Class A/B/C Enforcement (Formalized)
| Class | Pattern | Max Staleness |
|-------|---------|---------------|
| A | Sync PDP check before commit | 0ms |
| B | Projection ok if within threshold | 5–30 min by domain |
| C | Offline with entitlement | N/A (entitlement-bounded) |

### Consistency Mapping Table (Initial 5)
| Action | Class | Notes |
|--------|-------|-------|
| Prescribe Morphine | A | PDP + audit (controlled substance) |
| Update Tariff | A | PDP + effective-date checks |
| Admit Patient | B | 30s staleness threshold |
| Merge Patient Records | A | National-authoritative only |
| Capture Vitals | C | Entitlement + post-sync reconciliation |

---

## 6. Offline Entitlement Model (New)

### Entitlement Structure
- `device_id`, `subject_id`, `scope[]`, `valid_from`, `valid_to`
- `constraints.facility_id` binding
- `patient_cpid_allowlist[]` (optional)
- Response: JWT + `entitlement_id` + `policy_version`

### Error Codes
- `403 ENTITLEMENT_NOT_ALLOWED`
- `409 DEVICE_NOT_TRUSTED`

---

## 7. Federation Protocol (New)

### Pod Registration Flow
1. `POST /external/v1/federation/pods/register` → `PENDING_APPROVAL`
2. Upload attestation
3. `POST /internal/v1/federation/pods/{pod_id}/approve`

### Authority Boundaries
- `NATIONAL_CONSUMER`, `POD_AUTHORITATIVE_WITH_LINKAGE`, `DUAL_AUTHORITY` (prohibited unless explicit)

### Conflict Resolution
- Authority violation → `403 FEDERATION_AUTHORITY_VIOLATION`
- Missing linkage → `422 INVALID_LINKAGE`

---

## 8. Security Hardening (Expanded)
- KMS/HSM-backed keys for CPID pseudonymization and entitlement signing
- Rotation schedule + re-key strategy required
- mTLS mandatory for federation
- Security event pipeline into SIEM

---

## 9. Impact on Lovable Prototype

### No Changes Required (Already Implemented)
- Wave 1: Event envelope with all required fields ✅
- Wave 2: Idempotency + Audit Ledger ✅
- Wave 3: Class A PDP enforcement ✅
- Error response format ✅
- Mandatory headers ✅

### New Implementation Required (Wave 4)
1. **Offline Entitlements** — issuer, verifier, store, crypto (Ed25519 simulated)
2. **BUTANO Events** — resource created/updated/reconcile completed emitters
3. **Class C enforcement pattern** — verify entitlement offline
4. **New error codes** — `ENTITLEMENT_NOT_ALLOWED`, `DEVICE_NOT_TRUSTED`

### Additive Only (No Breaking Changes)
- All Wave 1–3 functionality preserved
- New types added to `types.ts`
- New modules added to kernel index
