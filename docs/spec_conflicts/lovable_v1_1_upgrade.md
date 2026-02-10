# Impilo vNext v1.1 — Spec Conflicts & Prototype Limitations

**Created:** 2026-02-09  
**Updated:** 2026-02-10 (TSHEPO brief alignment)  
**Applies to:** Lovable Cloud prototype  

---

## 1. TSHEPO Token Issuance (`POST /external/v1/oauth/token`)

**What the spec requires:** Custom OAuth2 token issuance endpoint with TSHEPO as the identity provider. Keycloak as primary IdP for workforce; optional eSignet for citizen flows.

**What could not be done:** The prototype uses Lovable Cloud's built-in authentication (Supabase Auth). Building a custom OAuth2 token issuer requires custom JWT signing, grant type handling, and audience-scoped tokens.

**What was implemented instead:** Supabase Auth issues JWTs. The `kernelClient` injects v1.1 headers on all requests. The trust-layer edge function validates Supabase JWTs and treats them as TSHEPO-equivalent tokens.

**What is needed to fully comply:** Deploy Keycloak as primary IdP. TSHEPO issues scoped tokens via its own signing service (Ed25519, HSM-backed). Optional eSignet integration for patient portal step-up. See `docs/services/TSHEPO_SERVICE_BRIEF.md` §4.2.

---

## 2. API Path Prefixes (`/internal/v1/` and `/external/v1/`)

**What the spec requires:** Dual API surfaces with Envoy route separation. External routes get full auth + consent check; internal routes use mTLS + service identity.

**What could not be done:** Lovable Cloud edge functions are routed by function name.

**What was implemented instead:** Edge functions retain current paths but implement all v1.1 header validation, error formatting, and correlation propagation. Middleware is path-agnostic.

**What is needed to fully comply:** Deploy behind Envoy with ext_authz gRPC filter calling TSHEPO PDP. See `docs/services/TSHEPO_SERVICE_BRIEF.md` §9.

---

## 3. Schema Registry

**What the spec requires:** Apicurio or equivalent. CI blocks incompatible schema changes.

**What could not be done:** No schema registry infrastructure in Lovable Cloud.

**What was implemented instead:** In-code schema validation via event envelope types + `validateEventOrThrow()`.

**What is needed to fully comply:** Deploy Apicurio Schema Registry with CI integration.

---

## 4. Envoy Gateway + ext_authz

**What the spec requires:** Envoy ext_authz filter calling TSHEPO PDP (gRPC). Policy decision headers injected after ALLOW. Route separation: public / external / internal / admin.

**What could not be done:** No gateway or OPA infrastructure in Lovable Cloud.

**What was implemented instead:** PDP checks done in edge function code via kernel `tshepo/pdpService.ts`. The `withKernelMiddleware` wrapper provides equivalent header validation.

**What is needed to fully comply:** Deploy Envoy + configure ext_authz per TSHEPO brief §9. Inject `X-Policy-Decision`, `X-Policy-Version`, `X-Decision-Reason`, `X-Actor-Assurance` headers.

---

## 5. mTLS for Service-to-Service & Federation

**What the spec requires:** mTLS with Ed25519 signing. Pod identity verified against cert CN/SAN. JWKS endpoint for key distribution.

**What could not be done:** Lovable Cloud does not support custom TLS certificates.

**What was implemented instead:** Federation authority checks at application level. `useFederationGuard` hook checks spine availability.

**What is needed to fully comply:** Deploy with mutual TLS. Issue service-specific client certificates. Implement JWKS endpoint. See TSHEPO brief §4.7.

---

## 6. HSM-backed Signing Keys

**What the spec requires:** HSM for entitlement signing, CPID pseudonymization, Ed25519 keys with rotation schedules.

**What could not be done:** No HSM in Lovable Cloud.

**What was implemented instead:** HMAC signing via `crypto.subtle`. Software keys stored in database.

**What is needed to fully comply:** AWS CloudHSM or HashiCorp Vault Transit. Key rotation with key IDs (kid).

---

## 7. Append-Only Audit Ledger

**What the spec requires:** Immutable table, hash chaining (Merkle/hash chain), signed audit export bundles.

**What was implemented (Wave 2):** Hash chaining implemented. UPDATE/DELETE blocked by trigger. Chain verification via `verifyChain()`.

**Limitation:** PostgreSQL superuser could theoretically bypass triggers. No signed export bundles yet.

**What is needed to fully comply:** Consider AWS QLDB for managed immutability. Implement Ed25519-signed audit export bundles per TSHEPO brief §4.5.

---

## 8. FHIR R4 Consent Store (NEW)

**What the spec requires:** TSHEPO stores and evaluates FHIR R4 Consent resources. Consent is consulted by PDP during authorization.

**What exists in prototype:** `PortalConsentDashboard` component, `TrustLayerConsentBadge`, consent capture in registration. But consent is not stored as FHIR R4 resources and not evaluated by PDP.

**What is needed to fully comply:** Consent store in TSHEPO (keyed by CPID, no PII). PDP integration per TSHEPO brief §4.4.

---

## 9. Device Fingerprint & Binding (NEW)

**What the spec requires:** `X-Device-Fingerprint` header mandatory. Device trust signals influence PDP decisions.

**What exists in prototype:** Device fingerprinting exists in `TrustLayerStatusIndicator` but not sent as a header or used in PDP decisions.

**What is needed to fully comply:** Client SDK generates fingerprint per TSHEPO brief §4.2. Inject as header. PDP consults device trust.

---

## 10. MOSIP Indirect Link (NEW)

**What the spec requires:** Option A — hidden token reference. No National ID stored in plaintext anywhere.

**What exists in prototype:** Trust Layer references MOSIP conceptually but no proofing workflow or opaque token storage.

**What is needed to fully comply:** Implement proofing workflow + `mosip_link_ref` store per TSHEPO brief §6.

---

## 11. Break-Glass Review Queue (NEW)

**What the spec requires:** Post-event review queue for break-glass events. Supervisor must adjudicate. Review outcome is audited.

**What exists in prototype:** `BreakGlassModal` captures reason and grants temporary access. But no admin review queue.

**What is needed to fully comply:** Break-glass review admin surface per TSHEPO brief §7.

---

## 12. Expanded Header Contract (NEW)

**What the spec requires:** Beyond v1.1 base headers, TSHEPO enforces: `X-Device-Fingerprint`, `X-Purpose-Of-Use`, `X-Actor-Id`, `X-Actor-Type`, and context headers (`X-Facility-Id`, `X-Workspace-Id`, `X-Shift-Id`).

**What exists in prototype:** `kernelClient.ts` injects `X-Tenant-ID`, `X-Pod-ID`, `X-Request-ID`, `X-Correlation-ID`. Actor headers added in Wave 3 (`X-Actor-Subject-ID`, `X-Actor-Roles`).

**What is needed to fully comply:** Expand header contract per TSHEPO brief §5. Rename actor headers to `X-Actor-Id` / `X-Actor-Type` for consistency. Add device fingerprint and purpose-of-use.
