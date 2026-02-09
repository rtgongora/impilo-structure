# Impilo vNext v1.1 — Spec Conflicts & Prototype Limitations

**Created:** 2026-02-09  
**Applies to:** Lovable Cloud prototype  

---

## 1. TSHEPO Token Issuance (`POST /external/v1/oauth/token`)

**What the spec requires:** Custom OAuth2 token issuance endpoint with TSHEPO as the identity provider.

**What could not be done:** The prototype uses Lovable Cloud's built-in authentication (Supabase Auth) for user management. Building a custom OAuth2 token issuer requires:
- Custom JWT signing with configurable keys
- Grant type handling (password, client_credentials, refresh_token)
- Audience-scoped tokens

**What was implemented instead:** Supabase Auth issues JWTs. The `kernelClient` injects v1.1 headers on all requests. The trust-layer edge function validates Supabase JWTs and treats them as TSHEPO-equivalent tokens.

**What is needed to fully comply:** Deploy a standalone TSHEPO token service with HSM-backed signing keys, custom claims (roles, facility_id, assurance_level), and proper audience scoping.

---

## 2. API Path Prefixes (`/internal/v1/` and `/external/v1/`)

**What the spec requires:** All services expose dual API surfaces with `/internal/v1/` and `/external/v1/` path prefixes.

**What could not be done:** Lovable Cloud edge functions are routed by function name (e.g., `/trust-layer/...`), not by arbitrary path prefixes. The platform does not support a gateway layer that rewrites paths.

**What was implemented instead:** Edge functions retain their current path structure but implement all v1.1 header validation, error formatting, and correlation propagation. The middleware layer is path-agnostic and will work when migrated to a proper gateway.

**What is needed to fully comply:** Deploy behind an Envoy/Istio gateway that maps:
- `/internal/v1/patients/*` → VITO service
- `/external/v1/patients/*` → VITO service (with external policy)
- etc.

---

## 3. Schema Registry

**What the spec requires:** Apicurio or equivalent schema registry. CI blocks incompatible schema changes. Events validated against registered schemas before publish.

**What could not be done:** No schema registry infrastructure available in Lovable Cloud.

**What was implemented instead:** Schema validation is done in-code using the event envelope type definitions. The `schema_version` field is mandatory on all events (enforced by TypeScript types and runtime checks in the event emitter).

**What is needed to fully comply:** Deploy Apicurio Schema Registry. Integrate with CI pipeline. Event emitter validates against registered schemas via HTTP call before publish.

---

## 4. Envoy Gateway + OPA

**What the spec requires:** Envoy ext_authz filter calling OPA, which calls TSHEPO PDP. Policy decision headers injected after allow.

**What could not be done:** No gateway or OPA infrastructure in Lovable Cloud. Edge functions handle their own auth.

**What was implemented instead:** PDP checks are done directly in edge function code via the TSHEPO PDP edge function. The `withKernelMiddleware` wrapper provides equivalent header validation.

**What is needed to fully comply:** Deploy Envoy + OPA sidecar. Configure ext_authz to call TSHEPO PDP. Inject `X-Policy-Decision`, `X-Policy-Version`, `X-Decision-Reason` headers.

---

## 5. mTLS for Federation

**What the spec requires:** All pod-to-spine calls require mTLS with JWT aud=federation and X-Pod-ID verified against cert CN/SAN.

**What could not be done:** Lovable Cloud does not support custom TLS certificates or mTLS.

**What was implemented instead:** Federation authority checks are implemented at the application level (checking `X-Pod-ID` header and pod authority configuration). No cryptographic binding between pod identity and transport.

**What is needed to fully comply:** Deploy with mutual TLS termination at the gateway. Issue pod-specific client certificates. Verify CN/SAN matches `X-Pod-ID`.

---

## 6. HSM-backed Signing Keys

**What the spec requires:** HSM integration for entitlement signing keys, CPID pseudonymization keys, with rotation schedules.

**What could not be done:** No HSM available in Lovable Cloud.

**What was implemented instead:** HMAC signing using `crypto.subtle` for entitlement tokens and artifact signatures. Signing keys stored in database (prototype only).

**What is needed to fully comply:** Integrate with AWS CloudHSM or HashiCorp Vault Transit for key management. Implement key rotation.

---

## 7. Append-Only Audit Ledger

**What the spec requires:** Immutable table with no updates/deletes, hash chaining per record.

**What was implemented (Wave 2):** Hash chaining is implemented via database trigger. UPDATE/DELETE blocked by trigger on the audit ledger table.

**Limitation:** PostgreSQL does not provide cryptographic immutability guarantees. A superuser could theoretically bypass triggers.

**What is needed to fully comply:** Use AWS QLDB for managed immutability, or implement WAL-based tamper detection.
