# TSHEPO — Trust Layer / Decision Plane

## Service Brief v2.0

**Updated:** 2026-02-10  
**Owner:** Platform Security / Trust Architecture  
**Status:** Brief for human-led implementation  

---

## 1. Positioning

**TSHEPO is Impilo's Trust Layer and Decision Plane.** It decides whether any interaction is allowed, based on identity, policy, consent, and provenance — then enforces that decision at the gateway and service level.

### What TSHEPO Is

| Capability | Description |
|-----------|-------------|
| Identity Resolution & Tokenisation | Resolves Impilo IDs to internal identifiers (CRID/CPID) without exposing PII. Issues scoped, short-lived tokens. |
| Authentication & Session Assurance | Validates OIDC sessions (Keycloak primary, eSignet optional for citizen step-up). Manages session LoA, device binding, offline sessions. |
| Authorization & Policy Enforcement | RBAC/ABAC + purpose-of-use evaluation. Serves as Envoy `ext_authz` backend. |
| Consent Management | Stores and evaluates FHIR R4 Consent resources. Enforced by policy layer. |
| Provenance & Audit | Tamper-evident, hash-chained audit ledger. Non-repudiation. Patient-visible access history. |
| Offline Trust Controls | Issues bounded, facility-scoped offline capability tokens. O-CPID issuance + reconciliation. |
| Service-to-Service Trust | mTLS identity verification, Ed25519 signing, key rotation, JWKS endpoint. |

### What TSHEPO Is NOT

| Not TSHEPO | Belongs To |
|-----------|------------|
| Client/Patient Registry (demographics, Health ID issuance, matching) | **VITO** |
| Provider Registry (practitioner identity, credentials) | **VARAPI** |
| Facility Registry (hierarchy, capabilities, service catalogue) | **THUSO** |
| Shared Health Record (clinical data, FHIR resources) | **BUTANO** |
| EHR/Portal application logic | **Application layer** |
| Product/Tariff registry | **MSIKA** |

TSHEPO only provides **enforcement contracts and decisions** that those services call.

---

## 2. Platform Assumptions (Implementation Constraints)

These are fixed infrastructure decisions. TSHEPO must be designed within these bounds:

| Layer | Technology | Notes |
|-------|-----------|-------|
| Gateway | **Envoy** (primary), Kong (optional-lite fallback) | `ext_authz` gRPC filter for policy enforcement |
| Database | **PostgreSQL 16** | Audit ledger, consent store, token metadata |
| Cache | **Redis** | Session cache, PDP decision cache (TTL-bounded) |
| Messaging | **Kafka** (outbox-style publishing) | Audit events, consent change events |
| Identity Ecosystem | **MOSIP** indirect link (Option A: hidden token reference) | No National ID stored in plaintext |
| Staff Auth | **Keycloak** | OIDC for workforce sessions |
| Citizen Auth | **eSignet** (optional) | For patient portal login, step-up flows |
| Signing | **Ed25519** + mTLS | Service-to-service, QR codes, referral packages |

---

## 3. Non-Negotiable Privacy & Security Principles

> These principles are **hard constraints** — not guidelines. Any design that violates them is rejected.

### 3.1 PII Minimization
TSHEPO stores **no PII**. Only opaque IDs, hashes, and encrypted opaque references.

### 3.2 Split Identifier Architecture

| Domain | Identifier | Contains PII? | Where PII Lives |
|--------|-----------|--------------|-----------------|
| VITO (Client Registry) | CRID + Health ID | ✅ Yes | VITO only |
| BUTANO (SHR) | CPID (clinical pseudonym) | ❌ No | — |
| TSHEPO | Mappings + scoped tokens | ❌ No | — |
| Patient-held | Impilo ID (alias/locator) | ❌ No (must not leak PII) | — |

**Rules:**
- CRID and CPID are **never joined** outside the Trust Layer
- Neither identifier is stored in the other's domain
- National ID/MOSIP links are stored as **opaque tokens only** in the Client Registry zone
- Impilo ID is a memorable locator/alias, **not a credential**
- Internal Health IDs are **never exposed** to clinical applications — they receive only CPIDs

### 3.3 Purpose-Bound, Context-Bound Access
Every access decision is scoped to:
- **Tenant** (organization)
- **Facility** (site)
- **Workspace** (department/unit)
- **Shift** (timeframe)
- **Reason** (purpose of use)

### 3.4 Default Deny
All requests are denied unless explicitly allowed by policy evaluation. Break-glass requires step-up + explicit reason + enhanced audit + post-event review queue.

### 3.5 Anti-Enumeration
Resolution endpoints must:
- Rate-limit all lookups
- Return indistinguishable errors for "not found" vs "not allowed"
- Log all resolution attempts

---

## 4. TSHEPO Sub-Domains (7 Sections)

### 4.1 Identity Resolution & Tokenisation

**Responsibility:** Resolve patient identifiers across domains without exposing PII. Issue short-lived, scoped tokens for downstream service calls.

#### Flows

| Flow | Input | Output | Notes |
|------|-------|--------|-------|
| Impilo ID → Health ID | Impilo ID (patient-held alias) | VITO verifier/lookup hash (opaque) | No plaintext — hash-based lookup via VITO |
| Health ID → CRID/CPID | Health ID (internal) | CRID (registry) + CPID (clinical) | Mapping maintained in TSHEPO |
| CPID generation | CRID + context | Deterministic CPID | Pseudonymization — not reversible without TSHEPO |
| O-CPID issuance (offline) | Facility context + offline token | Provisional O-CPID | Short-lived, facility-scoped |
| O-CPID reconciliation | O-CPID + online context | Canonical CPID | Deferred — runs on reconnect |
| Scoped token issuance | Actor + purpose + resource | Short-lived access token | Audience-scoped, claims-embedded |

#### Data Stored
- `cpid_mapping`: `{crid_hash, cpid, created_at, facility_scope}` — no PII
- `ocpid_pending`: `{ocpid, facility_id, issued_at, reconciled_at, canonical_cpid}` — no PII
- `mosip_link_ref`: `{opaque_ref_hash, encrypted_opaque_ref, proofed_at}` — no National ID

### 4.2 Authentication & Session Assurance

**Responsibility:** Validate identity sessions, manage assurance levels, enforce step-up, support device binding and offline sessions.

#### Flows

| Flow | Trigger | Behaviour |
|------|---------|-----------|
| Session validation | Every API call (via gateway) | Validate Keycloak OIDC token; extract claims (roles, facility, assurance) |
| eSignet validation | Citizen portal login, patient step-up | Optional — validate eSignet OIDC token when configured |
| Step-up trigger | Action requires higher LoA | Return `STEP_UP_REQUIRED` decision; UI prompts MFA/biometric |
| Device binding | Login from new device | Record `device_fingerprint`; flag untrusted until confirmed |
| Device reputation | Repeat access from known device | Signal to PDP: `device_trust = HIGH/LOW/UNKNOWN` |
| Offline session | Connectivity lost | Issue bounded capability token (see §4.6) |

#### Step-Up Required Actions
These actions MUST trigger step-up if current session assurance is insufficient:
- Patient token recovery + ID re-issuance
- Delegated pickup creation
- Privilege views across many facilities
- Break-glass events
- Certificate downloads (optional, feature-flagged)

#### Device Fingerprint Rules
| Platform | Method | Storage |
|----------|--------|---------|
| Mobile | Stable random UUID stored securely per install | Keychain/Keystore |
| Web | `SHA-256(User-Agent + platform + localStorage UUID)` | localStorage |

**Never** use IMEI, serial number, or hardware identifiers.

### 4.3 Authorization & Policy Enforcement (The Brain)

**Responsibility:** Make ALLOW/DENY/STEP_UP/BREAK_GLASS decisions for every request, based on identity, role, context, purpose, and consent.

#### Decision Model

```
Input:
  actor: { user_id, roles[], facility_id, assurance_level, device_trust }
  action: "clinical.prescribe.controlled_substance"
  resource: { patient_cpid, encounter_id, ... }
  context: { tenant_id, pod_id, workspace_id, shift_id, purpose_of_use }

Output:
  decision: ALLOW | DENY | STEP_UP_REQUIRED | BREAK_GLASS_REQUIRED
  policy_version: "2026-02-10.1"
  reason_codes: ["CONSENT_OK", "PRIVILEGE_OK"]
  obligations: [{ type: "AUDIT", level: "MANDATORY" }]
  ttl_seconds: 30
```

#### Policy Layers (Evaluated in Order)
1. **Header validation** — reject if mandatory headers missing
2. **Session assurance** — reject if LoA insufficient for action
3. **RBAC** — role-based permission check
4. **ABAC** — attribute-based (facility type, shift status, workspace scope)
5. **Purpose-of-use** — validate declared purpose against policy
6. **Consent** — evaluate patient consent for this actor/purpose (see §4.4)
7. **Federation authority** — some actions require spine online (see §4.6)

#### Envoy Integration (ext_authz)
```
Envoy route → ext_authz gRPC call → TSHEPO PDP
                                       ├── validates headers
                                       ├── builds decision input
                                       ├── evaluates policies
                                       ├── consults consent store
                                       ├── returns ALLOW + header mutations
                                       │   (X-Policy-Decision, X-Policy-Version,
                                       │    X-Decision-Reason, X-Actor-Id)
                                       └── OR returns DENY + error envelope
```

#### Policy Bundles
- Policies are versioned (e.g., `2026-02-10.1`)
- `policy_version` appears in every decision and audit record
- OPA/Rego-like behavior (implementation detail for dev team)
- Policy updates require staged rollout + audit

### 4.4 Consent & Preference Management

**Responsibility:** Store, evaluate, and enforce patient consent. FHIR R4 Consent resources are authoritative.

#### Consent Model

| Field | Description |
|-------|-------------|
| Resource type | FHIR R4 `Consent` |
| Subject | CPID (not CRID — no PII in consent store) |
| Scope | `patient-privacy`, `treatment`, `research` |
| Status | `active`, `rejected`, `inactive` |
| Period | Time-bounded validity |
| Purpose | Purpose-of-use codes (TREATMENT, PAYMENT, OPERATIONS, RESEARCH, EMERGENCY) |
| Actor | Who is granted/denied (by role, specific practitioner, organization) |

#### Flows

| Flow | Description |
|------|-------------|
| Record consent | Capture during registration/encounter; store as FHIR R4 Consent |
| Evaluate consent | PDP queries consent store during authorization decisions |
| Revoke consent | Patient-initiated; immediate effect on future access decisions |
| Delegate consent | Grant time-limited access to specific actor for specific purpose |
| Share-link governance | Short-lived access links governed by consent rules |

#### Consent Evaluation Points
Consent MUST be consulted by the PDP when:
- Accessing patient clinical data (BUTANO)
- Sharing data across facilities (federation)
- Research access
- Break-glass (consent is overridden but audit is enhanced)

### 4.5 Provenance, Audit & Non-Repudiation

**Responsibility:** "Who accessed what, when, why, and under what authority." Tamper-evident. Non-repudiable.

#### Audit Record Schema

| Field | Type | Required |
|-------|------|----------|
| `audit_id` | UUID | ✅ |
| `tenant_id` | string | ✅ |
| `pod_id` | string | ✅ |
| `occurred_at` | RFC3339 | ✅ |
| `request_id` | UUID | ✅ |
| `correlation_id` | UUID | ✅ |
| `actor` | `{ subject_id, roles[], facility_id?, assurance_level? }` | ✅ |
| `action` | string (e.g., `tshepo.pdp.decide`) | ✅ |
| `decision` | `ALLOW \| DENY \| BREAK_GLASS \| SYSTEM` | ✅ |
| `reason_codes` | string[] | ✅ |
| `policy_version` | string \| null | ✅ |
| `resource` | object (contextual — CPID, tariff_id, etc.) | ✅ |
| `prev_hash` | string \| null | ✅ (hash-chain) |
| `record_hash` | SHA-256 | ✅ (hash-chain) |

#### Tamper Evidence
- Hash-chain: each record includes `prev_hash` (previous record's `record_hash`)
- `record_hash` = `SHA-256(canonical_json(record_fields + prev_hash))`
- Chain verification: `verifyChain(tenant_id, pod_id)` → `{ ok, broken_at? }`
- Signed audit export bundles (Ed25519) for regulatory submission

#### Mandatory Audit Events
Every one of the following MUST emit an audit record:
- Every authorization decision (PDP)
- Every token issuance
- Every consent change (create, revoke, delegate)
- Every break-glass event + review outcome
- Every identity resolution / CPID mapping
- Every offline capability token issuance

#### Patient Access History
- Endpoint: `GET /api/v1/my/access-history` (portal)
- Paginated, with redaction rules (actor names may be masked by role)
- Maps to existing `PatientAccessHistory` component in prototype

### 4.6 Offline Trust Controls

**Responsibility:** Enable bounded clinical operations when connectivity to the National Spine is lost.

#### Offline Capability Tokens
| Property | Value |
|----------|-------|
| Scope | Facility-scoped only |
| TTL | Very short (configurable; default 4 hours) |
| Capabilities | Constrained: create encounters, document vitals, basic prescribing |
| Restrictions | No patient merge, no tariff updates, no cross-facility queries, no research access |
| Issuance | On connectivity loss, using cached session + device trust |

#### O-CPID (Offline Clinical Pseudonym ID)
- Issued when canonical CPID cannot be resolved offline
- Format: `O-{facility_prefix}-{random}` (distinguishable from canonical CPIDs)
- Reconciliation: on reconnect, `O-CPID → canonical CPID` mapping is resolved via TSHEPO
- Until reconciled, O-CPID is treated as provisional and flagged in UI

#### Offline Action Constraints

| Action | Allowed Offline? | Notes |
|--------|-----------------|-------|
| Create encounter | ✅ Yes | With O-CPID if needed |
| Document vitals/observations | ✅ Yes | Queued for sync |
| Basic prescribing | ✅ Yes | Constrained formulary |
| Patient merge | ❌ No | Requires National Spine authority |
| Tariff update | ❌ No | Requires National Spine authority |
| Cross-facility query | ❌ No | Requires federation |
| Consent modification | ❌ No | Requires audit chain integrity |
| Break-glass | ⚠️ Limited | Logged locally, reviewed on reconnect |

### 4.7 Service-to-Service Trust & Keys

**Responsibility:** Mutual authentication between services, artifact signing, key management.

| Capability | Implementation |
|-----------|---------------|
| Service identity | mTLS — each service has a client certificate |
| Key algorithm | Ed25519 for signing; X25519 for key agreement |
| Key rotation | Scheduled rotation with key IDs (kid) in JWKS |
| JWKS endpoint | `/.well-known/jwks.json` — public keys for token/signature verification |
| QR code signing | Ed25519 — signed payloads for share links and patient-held QR codes |
| Referral package signing | Ed25519 — signed clinical bundles for cross-facility referrals |
| Key storage | HSM-backed in production; software keys acceptable for dev/staging |

---

## 5. Global Enforcement Contract (Headers)

TSHEPO enforces and/or sets these headers on every request passing through the gateway.

### Always Required (Reject if Missing)

| Header | Source | Description |
|--------|--------|-------------|
| `X-Tenant-Id` | Auth context / workspace selection | Organization/tenant identifier |
| `X-Correlation-Id` | Client SDK / gateway generated | Cross-service trace ID |
| `X-Device-Fingerprint` | Client SDK (see §4.2) | Device identity signal |
| `X-Purpose-Of-Use` | Client context / declared by UI | `TREATMENT`, `PAYMENT`, `OPERATIONS`, `RESEARCH`, `EMERGENCY` |
| `X-Actor-Id` | JWT claims / ext_authz extracted | Authenticated actor identifier |
| `X-Actor-Type` | JWT claims | `PRACTITIONER`, `PATIENT`, `SYSTEM`, `ADMIN` |

### Context Headers (Required When Applicable)

| Header | When Required | Description |
|--------|--------------|-------------|
| `X-Facility-Id` | Clinical operations | Active facility |
| `X-Workspace-Id` | Within-facility context | Department/unit/workstation |
| `X-Shift-Id` | Shift-scoped access | Active shift identifier |
| `X-Pod-Id` | All requests | Site/pod node identifier |
| `X-Request-Id` | All requests (generated if missing) | Per-request trace |

### SDK/Shared Validation Behaviour
For the development team:
1. **Validate** presence and format of all required headers at the gateway (`ext_authz`)
2. **Propagate** consistently across all inter-service calls (correlation ID, actor ID, tenant ID)
3. **Reject** missing/invalid headers with 400 standard error envelope (default deny)
4. **Inject** decision metadata on ALLOW: `X-Policy-Decision`, `X-Policy-Version`, `X-Decision-Reason`

---

## 6. MOSIP Indirect Link — Option A (Hidden Token Reference)

### Design Narrative

TSHEPO supports linking a patient's Impilo identity to their MOSIP (National ID) identity **without storing the National ID number**.

#### Proofing Workflow

```
1. Patient presents National ID at facility
2. System triggers STEP-UP (MFA / biometric verification)
3. Verification request sent to MOSIP via indirect API
4. On success: TSHEPO stores:
   - mosip_link_ref: opaque reference token (from MOSIP)
   - mosip_link_hash: SHA-256(opaque_ref) for lookup
   - encrypted_opaque_ref: AES-256-GCM encrypted opaque ref
   - proofed_at: timestamp
   - proofed_by: actor (audited)
5. National ID number is NEVER stored — not in TSHEPO, not in VITO, not anywhere
```

#### Lookup Flow
- Given a patient CRID, TSHEPO can verify MOSIP linkage exists (boolean)
- TSHEPO can request re-verification via MOSIP using the stored opaque reference
- No plaintext National ID is ever transmitted after proofing completes

---

## 7. Break-Glass (Distinct Feature)

### Flow

```
1. Clinician encounters access denial for a patient record
2. UI presents "Emergency Access" option (break-glass)
3. Clinician must:
   a. Complete step-up authentication (MFA/biometric)
   b. Provide explicit written reason (free-text, minimum length)
   c. Acknowledge enhanced audit logging
4. TSHEPO issues:
   - Temporary elevated access token
   - Narrow scope (specific patient, specific data categories)
   - Short TTL (configurable; default 60 minutes)
5. Mandatory audit record:
   - decision: BREAK_GLASS
   - reason_codes: [clinician-provided reason]
   - Enhanced detail level (full context captured)
6. Post-event: entry added to REVIEW QUEUE for supervisor/compliance review
```

### Admin Oversight
- Break-glass review queue: list of unreviewed events
- Reviewer must mark as `JUSTIFIED` or `UNJUSTIFIED` with notes
- Review outcome is itself audited (non-repudiation)
- Metrics: break-glass frequency by facility, actor, time period

---

## 8. UI Surfaces (Minimal — Prototype Level)

These screens exist or should exist in the Lovable prototype to represent TSHEPO capabilities:

### 8.1 Existing (Already in Prototype)

| Component | Location | TSHEPO Domain |
|-----------|----------|---------------|
| `TrustLayerStatusIndicator` | Header/nav | Session assurance, device trust, offline status, break-glass alerts |
| `PatientAccessHistory` | Portal / encounter | Provenance — "who accessed my data" |
| `BreakGlassModal` | Encounter context | Break-glass request flow |
| `TrustLayerConsentBadge` | Patient banner | Consent status indicator |
| `IdentityVerificationBadge` | Patient context | Identity resolution status |
| `PortalConsentDashboard` | Patient portal (PersonalHub) | Consent management |
| `SpineStatusIndicator` | Registry screens | Federation authority / offline status |
| `KernelErrorAlert` | All screens | Standard error envelope rendering |

### 8.2 Needed (Brief for Implementation)

| Surface | Purpose | Priority |
|---------|---------|----------|
| Break-glass review queue (admin) | Review and adjudicate break-glass events | HIGH |
| Consent management (clinician-facing) | Record/view consent during encounters | HIGH |
| Offline sync status | Show queued items, O-CPID count, reconciliation progress | MEDIUM |
| MOSIP linkage proofing UI | Step-up + verification flow for National ID linking | MEDIUM |
| Audit export (admin) | Generate signed audit bundles for regulatory submission | LOW |
| Policy version display | Show active policy version in admin/debugging context | LOW |

---

## 9. Envoy Gateway Wiring (ext_authz)

### Route Separation

| Route Pattern | Auth Level | ext_authz Behaviour |
|---------------|-----------|---------------------|
| `/external/v1/*` | External (patient portal, third-party) | Full auth + consent check |
| `/internal/v1/*` | Internal (service-to-service) | mTLS + service identity + policy check |
| `/public/*` | Unauthenticated | Rate-limit only; no auth |
| `/admin/v1/*` | Admin | Full auth + elevated role check + audit |

### ext_authz Decision Flow

```
Request → Envoy → ext_authz (gRPC) → TSHEPO PDP
                                       │
                                       ├─ Extract headers (tenant, actor, purpose, device)
                                       ├─ Validate session (Keycloak/eSignet token)
                                       ├─ Build decision input
                                       ├─ Evaluate policy layers (§4.3)
                                       ├─ Consult consent store (if patient data access)
                                       ├─ Write audit record
                                       │
                                       ├─ ALLOW → inject headers:
                                       │   X-Policy-Decision: ALLOW
                                       │   X-Policy-Version: 2026-02-10.1
                                       │   X-Decision-Reason: CONSENT_OK,PRIVILEGE_OK
                                       │   X-Actor-Id: <resolved>
                                       │   X-Actor-Assurance: aal2
                                       │
                                       └─ DENY → return error envelope:
                                           { error: { code: "POLICY_DENY", ... } }
```

---

## 10. Data Model Expectations

### What TSHEPO Stores (No PII)

| Table | Contents | PII? |
|-------|----------|------|
| `cpid_mapping` | CRID hash → CPID | ❌ |
| `ocpid_pending` | O-CPID → facility, status, canonical CPID | ❌ |
| `consent_store` | FHIR R4 Consent (keyed by CPID) | ❌ |
| `audit_ledger` | Hash-chained audit records | ❌ |
| `policy_bundles` | Versioned policy definitions | ❌ |
| `session_cache` | Session metadata (Redis) | ❌ (opaque session refs) |
| `mosip_link_ref` | Encrypted opaque MOSIP references | ❌ |
| `device_registry` | Device fingerprint → trust level | ❌ |
| `break_glass_queue` | Pending review items | ❌ (references by audit_id) |
| `signing_keys` | Ed25519 key pairs + rotation metadata | ❌ |

### What TSHEPO Does NOT Store

- Patient names, DOB, addresses, phone numbers
- National ID numbers
- Clinical data (observations, prescriptions, diagnoses)
- Biometric templates (those live in the biometric subsystem)

---

## 11. Audit Event Catalogue

Every one of these events MUST produce an audit ledger entry:

| Event | Action String | Decision |
|-------|--------------|----------|
| Authorization decision | `tshepo.pdp.decide` | ALLOW/DENY |
| Token issuance | `tshepo.token.issued` | SYSTEM |
| Consent created | `tshepo.consent.created` | SYSTEM |
| Consent revoked | `tshepo.consent.revoked` | SYSTEM |
| Consent delegated | `tshepo.consent.delegated` | SYSTEM |
| Break-glass request | `tshepo.breakglass.requested` | BREAK_GLASS |
| Break-glass reviewed | `tshepo.breakglass.reviewed` | SYSTEM |
| Identity resolved | `tshepo.identity.resolved` | SYSTEM |
| CPID generated | `tshepo.cpid.generated` | SYSTEM |
| O-CPID issued | `tshepo.ocpid.issued` | SYSTEM |
| O-CPID reconciled | `tshepo.ocpid.reconciled` | SYSTEM |
| MOSIP link proofed | `tshepo.mosip.proofed` | SYSTEM |
| Offline token issued | `tshepo.offline.token.issued` | SYSTEM |
| Step-up triggered | `tshepo.stepup.triggered` | DENY (pre-step-up) |
| Key rotated | `tshepo.keys.rotated` | SYSTEM |

---

## 12. Offline Operating Rules (Developer Reference)

### Capability Token Rules
1. Issued only when connectivity loss is detected
2. Facility-scoped: token is valid only at the issuing facility
3. TTL: configurable, default 4 hours, maximum 24 hours
4. Capabilities: constrained set (see §4.6 table)
5. Device must have `device_trust ≥ MEDIUM`
6. Renewed only if original session was valid at time of disconnection

### O-CPID Rules
1. Format: `O-{facility_prefix}-{random_suffix}` — visually distinct from canonical CPIDs
2. Must be reconciled within 72 hours of reconnection
3. If reconciliation fails (no matching patient found), flag for manual review
4. Clinical data created under O-CPID is tagged as provisional until reconciled

### Sync-on-Reconnect
1. Audit records queued offline are replayed to ledger (hash-chain maintained)
2. O-CPIDs are reconciled
3. Break-glass events logged offline are submitted to review queue
4. Consent changes are blocked offline (require audit chain integrity)
