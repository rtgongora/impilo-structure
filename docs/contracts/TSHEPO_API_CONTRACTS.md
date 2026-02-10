# TSHEPO Contract Artifacts — Implementation Target for Java Team

## 1. Endpoint Contracts

### Identity Resolution (`tshepo-identity-service`)
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/identity/resolve` | `{ impilo_id_hash: string }` | `{ health_id, cpid, crid, status }` |
| POST | `/identity/map` | `{ operation: "issue_cpid"\|"issue_ocpid"\|"reconcile", health_id?, o_cpid?, facility_id? }` | varies by operation |

### Session Assurance
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/session/assure` | `{ idp_token, idp_source, roles, assurance_level, device_info }` | `{ session_id, assurance_level, roles, step_up_required, expires_at, context }` |

### Authorization (`tshepo-authz-service`)
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/authz/decide` | `{ action, resource, roles, assurance_level, patient_cpid? }` | `{ decision, policy_version, reason_codes, obligations, ttl_seconds, consent? }` |

### Consent (`tshepo-consent-service`)
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/consent/evaluate` | `{ patient_cpid, actor_ref, purpose, action }` | `{ decision, consent_id?, obligations? }` |
| GET | `/consents?patient_cpid=&status=&page=&limit=` | query params | `{ consents[], total, page, limit }` |
| POST | `/consents` | FHIR R4 Consent fields | `{ consent }` |
| DELETE | `/consents/:id` | `{ reason }` | `{ revoked: true }` |

### Audit (`tshepo-audit-service`)
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/audit/append` | `{ actor_id, actor_type, action, decision, reason_codes, resource }` | `{ auditId, recordHash, chainSequence }` |
| GET | `/audit/query?actor_id=&action=&decision=&page=&limit=` | query params | `{ records[], total }` |
| GET | `/portal/access-history?patient_cpid=&page=&limit=` | query params | `{ entries[], total }` (redacted) |

### Break-Glass
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/breakglass/request` | `{ patient_cpid, justification, emergency_type, step_up_method, assurance_level:"aal3" }` | `{ break_glass_id, elevated_token, scope, expires_at }` |
| POST | `/breakglass/review` | `{ break_glass_id, outcome:"approved"\|"flagged"\|"violation", notes }` | `{ break_glass_id, outcome }` |

### Offline (`tshepo-offline-service`)
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/offline/token` | `{ facility_id, capability_scope?, ttl_minutes? }` | `{ token_hash, facility_id, scope, max_actions, expires_at, constraints }` |
| POST | `/offline/reconcile` | `{ items: [{ o_cpid, health_id }] }` | `{ results[], total, reconciled }` |

### Keys (`tshepo-keys-service`)
| Method | Path | Output |
|--------|------|--------|
| GET | `/keys/jwks` | `{ keys: [{ kid, kty:"OKP", crv:"Ed25519", use:"sig" }] }` |
| POST | `/keys/rotate` | `{ kid, algorithm, activated_at, reason }` |

## 2. Mandatory Headers

### Always Required
| Header | Description | Example |
|--------|-------------|---------|
| `X-Tenant-Id` | Organization/tenant context | `moh-za` |
| `X-Pod-Id` | Site/facility node | `national` |
| `X-Request-Id` | Unique per request (UUID v4) | auto-generated |
| `X-Correlation-Id` | Traces across service calls | auto-generated or propagated |
| `X-Actor-Id` | Authenticated user/service ID | `user-uuid` |
| `X-Actor-Type` | `provider`\|`patient`\|`system`\|`service` | `provider` |
| `X-Purpose-Of-Use` | `treatment`\|`payment`\|`operations`\|`research`\|`public_health`\|`emergency` | `treatment` |
| `X-Device-Fingerprint` | Device identifier (see spec) | `web-abc123-def456` |

### Context Headers (when applicable)
| Header | Description |
|--------|-------------|
| `X-Facility-Id` | Current facility UUID |
| `X-Workspace-Id` | Current workspace UUID |
| `X-Shift-Id` | Current shift UUID |

### Device Fingerprint Generation
- **Web**: `hash(UserAgent + platform + localStorage_UUID)` — never IMEI/serial
- **Mobile**: Stable random UUID stored securely per install

## 3. Standard Error Envelope
```json
{
  "error": {
    "code": "POLICY_DENY",
    "message": "Access denied by policy",
    "details": { "reason_codes": ["ROLE_MISSING"] },
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

## 4. PDP Decision Values
| Decision | Meaning |
|----------|---------|
| `ALLOW` | Access granted |
| `DENY` | Access denied (default) |
| `STEP_UP_REQUIRED` | Must complete MFA/LoA uplift |
| `BREAK_GLASS_REQUIRED` | Emergency override needed |

## 5. Audit Hash Chain
Each record contains `prev_hash` (SHA-256 of previous record) and `record_hash` (SHA-256 of current record including prev_hash). Chain is keyed by `(tenant_id, pod_id)` with monotonic `chain_sequence`.

## 6. Consent Evaluation Flow
1. `/authz/decide` receives patient-scoped request
2. If `patient_cpid` present, authz calls consent evaluation
3. Consent service checks active FHIR R4 Consent records
4. Returns `permit`/`deny`/`no_consent_found`
5. Result factored into PDP decision
