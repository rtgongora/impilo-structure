# Offline Entitlements — Technical Reference

**Version:** 1.1  
**Status:** Wave 4 Complete — Production-Grade  
**Spec Reference:** vNext Manifest v1.1 Law 7 + Tech Companion Spec §1.1.3 + §3.3  

---

## Overview

Offline entitlements enable limited clinical actions on edge devices when connectivity to the TSHEPO PDP is unavailable. They are **time-bounded**, **scope-bounded**, **device-bound**, and **auditable**.

## Issuance Flow

```
1. Device requests entitlement → POST /internal/v1/offline/entitlements
2. TSHEPO validates:
   a. PDP ALLOW decision for requested scope
   b. Device trust status
   c. Subject identity valid
3. On success:
   a. Generate entitlement payload (scope, constraints, expiry)
   b. Sign with Ed25519 key (kid for rotation)
   c. Write audit record (SYSTEM decision)
   d. Emit impilo.offline.entitlement.issued.v1 event
   e. Return signed JWT + entitlement_id + policy_version
```

## Verification (Offline)

```
1. Parse entitlement JWT
2. Verify Ed25519 signature against known public key (kid lookup)
3. Check expiry: valid_from ≤ now ≤ valid_to
4. Check scope: requested action ∈ entitlement.scope
5. Check constraints: facility_id matches (if bound)
6. Check patient allowlist: subject CPID ∈ allowlist (if specified)
7. Write local audit record for consumption
```

## Revocation

Entitlements can be revoked before expiry:
- Set `status = REVOKED` in store
- Emit `impilo.offline.entitlement.revoked.v1` event
- Revocation propagates via high-priority control channel
- Offline devices check revocation list on next sync

## Persistence

Entitlements are stored in `public.offline_entitlements` (Postgres) via `PostgresEntitlementStore`.

| Column | Type | Description |
|--------|------|-------------|
| `entitlement_id` | UUID PK | Unique ID |
| `tenant_id` | TEXT | Tenant partition |
| `pod_id` | TEXT | Pod partition |
| `device_id` | TEXT | Bound device |
| `subject_id` | TEXT | Clinician PRID |
| `kid` | TEXT | Signing key ID |
| `alg` | TEXT | Always `Ed25519` |
| `token_hash` | TEXT UNIQUE | SHA-256 of signed token |
| `status` | TEXT | `ACTIVE` / `CONSUMED` / `REVOKED` / `EXPIRED` |
| `scope` | JSONB | Entitlement scopes |
| `constraints_json` | JSONB | Facility, patient, purpose constraints |
| `policy_version` | TEXT | PDP policy version at issuance |
| `valid_from` / `valid_to` | TIMESTAMPTZ | Time window |
| `consumed_at` / `revoked_at` | TIMESTAMPTZ | Lifecycle timestamps |

**Indexes:**
- `(tenant_id, subject_id, valid_to DESC)` — subject lookup
- `(tenant_id, device_id, valid_to DESC)` — device lookup
- `(status, valid_to)` — expiry scans
- `token_hash UNIQUE` — dedup

**Store Adapter Pattern:**
- Production: `PostgresEntitlementStore` (default when DB available)
- Tests: `InMemoryEntitlementStore` (default in test env)
- Override: `setEntitlementStore(adapter)` at runtime

## Security Assumptions

1. **Ed25519 signing** — Entitlements are signed with Ed25519 keys (prototype uses Web Crypto). Production uses HSM/KMS-backed keys.
2. **Key rotation** — Each key has a `kid` (key ID). Verifiers accept any known kid. Rotation adds new key; old keys remain valid until their entitlements expire.
3. **No broader access** — Entitlement scope is a strict subset of what PDP would allow online.
4. **Time-bounded** — Maximum validity window enforced (prototype: 6 hours).
5. **Device-bound** — `device_id` in entitlement must match requesting device.
6. **Audit trail** — Every issuance and consumption creates an audit record with hash chain.

## Scope Examples

| Scope | Description |
|-------|-------------|
| `clinical.capture.vitals` | Record vital signs |
| `clinical.capture.notes` | Create clinical notes |
| `clinical.read.timeline` | Read patient timeline |
| `clinical.create.encounter_shell` | Create encounter metadata |
| `clinical.upload.doc_metadata` | Upload document metadata |

## Constraints

- `facility_id` — Bind to specific facility
- `patient_cpid_allowlist` — Restrict to specific patients
- `purpose_of_use` — Must align with X-Purpose-Of-Use header

## Events

| Event | Trigger |
|-------|---------|
| `impilo.offline.entitlement.issued.v1` | Entitlement successfully issued |
| `impilo.offline.entitlement.revoked.v1` | Entitlement revoked before expiry |
| `impilo.offline.entitlement.consumed.v1` | Entitlement used for offline action |

All events include: `event_id`, `occurred_at`, `tenant_id`, `partition_key`, `correlation_id`, minimal payload + references.
