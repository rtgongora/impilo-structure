# VARAPI v1.1 — API Contract Specification

## Base Path
`/varapi/v1/internal/` (TSHEPO-gated internal endpoints)
`/varapi/v1/portal/` (Provider-facing portal)
`/varapi/v1/fhir/` (FHIR mapping exports)

## Required Headers (all endpoints)
| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-Id | ✅ | Tenant identifier |
| X-Correlation-Id | ✅ | Correlation chain ID |
| X-Device-Fingerprint | ✅ | Stable device UUID (mobile) or hash(UA+platform+UUID) (web) |
| X-Purpose-Of-Use | ✅ | TREATMENT/ADMIN_OPS/AUDIT/etc |
| X-Actor-Id | ✅ | Acting subject identifier |
| X-Actor-Type | ✅ | ADMIN/PROVIDER/SYSTEM |
| X-Facility-Id | Context | Facility scope |
| X-Workspace-Id | Context | Workspace scope |
| X-Shift-Id | Context | Active shift reference |

## Standard Error Envelope
```json
{
  "error": {
    "code": "MISSING_REQUIRED_HEADER",
    "message": "Missing: X-Tenant-Id, X-Correlation-Id",
    "details": { "missing_headers": ["X-Tenant-Id", "X-Correlation-Id"] },
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

## Provider Identifiers (Security Model)
- **provider_public_id**: ULID (26 chars, safe to expose)
- **VA Token**: `VA-` + 10 digits + 1 check letter — NEVER stored as plaintext
  - `lookup_hash`: HMAC(pepper, normalize(token)) — unique index for lookup
  - `argon2_verifier`: Argon2id(normalize(token)) — verification only
- **biometric_ref**: opaque reference binding only (no templates)

## Endpoints

### Providers
| Method | Path | Description |
|--------|------|-------------|
| POST | /providers | Create provider (returns provider_public_id) |
| GET | /providers/{id} | Get provider profile |
| POST | /providers/search | Search (masked sensitive fields) |
| PUT | /providers/{id} | Update profile |
| POST | /providers/{id}/status | Change status + log license event |

### Privileges
| Method | Path | Description |
|--------|------|-------------|
| POST | /providers/{id}/privileges/grant | Request privilege (creates PENDING) |
| POST | /providers/{id}/privileges/revoke | Revoke privilege |
| GET | /providers/{id}/privileges | List privileges |
| POST | /privileges/{privId}/decision | Approve/reject (requires decision_reason) |

### Eligibility
| Method | Path | Description |
|--------|------|-------------|
| POST | /eligibility/check | Check eligibility (enumeration-resistant) |

**Response Schema:**
```json
{
  "eligible": true,
  "reasons": ["ELIGIBLE"],
  "license_window": { "valid_from": "...", "valid_to": "..." },
  "required_step_up": false,
  "allowed_facilities": ["uuid1"],
  "allowed_workspaces": ["uuid2"]
}
```

### Token Flows
| Method | Path | Description |
|--------|------|-------------|
| POST | /provider-token/issue | Issue new VA token (one-time reveal) |
| POST | /provider-token/rotate | Rotate existing token |
| POST | /provider-token/recovery/start | Start recovery (generic response) |
| POST | /provider-token/recovery/verify | Verify recovery (step-up required) |

### Councils
| Method | Path | Description |
|--------|------|-------------|
| POST | /councils | Create council |
| GET | /councils | List councils |
| POST | /councils/{id}/imports | Create import run |

### Reconciliation
| Method | Path | Description |
|--------|------|-------------|
| GET | /reconciliation/queue | Open cases |
| POST | /reconciliation/{caseId}/decision | Decide case |

### FHIR Mapping
| Method | Path | Description |
|--------|------|-------------|
| GET | /fhir/practitioner/{id} | FHIR Practitioner resource |
| GET | /fhir/bundle/provider/{id} | FHIR Bundle (Practitioner + PractitionerRoles) |

### Portal
| Method | Path | Description |
|--------|------|-------------|
| GET | /portal/me | Provider self-service profile |
| GET | /portal/cpd | CPD cycles + events |
| POST | /portal/cpd/evidence | Submit CPD evidence |
| GET | /portal/certificates | List certificates |
| GET | /portal/certificates/{id}/download | Download (step-up required) |

## Dual-Mode Configuration
```json
{
  "registry_mode": "SOR | EXTERNAL_SYNC | HYBRID",
  "zibo_validation_mode": "STRICT | LENIENT",
  "council.mode": "SOR | EXTERNAL_SYNC | ORG_HR"
}
```

## ZIBO Validation Behavior
- **STRICT**: Unknown codes → 422 ZIBO_VALIDATION_FAILED
- **LENIENT**: Unknown codes → accepted, validation_status = UNVALIDATED

## Database Tables
22 tables: varapi_tenant_config, varapi_councils, varapi_council_users, varapi_providers, varapi_provider_contacts, varapi_provider_identifiers, varapi_provider_specialties, varapi_provider_council_affiliations, varapi_licenses, varapi_license_events, varapi_privileges, varapi_privilege_approvals, varapi_provider_tokens, varapi_biometric_bindings, varapi_import_runs, varapi_reconciliation_cases, varapi_reconciliation_actions, varapi_documents, varapi_cpd_cycles, varapi_cpd_events, varapi_cpd_evidence, varapi_outbox_events, varapi_code_sets
