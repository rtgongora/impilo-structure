# VITO v1.1 — API Contract Specification

> Executable reference brief for the human-led Java/Spring Boot dev stream.
> This document describes the contract semantics that the Lovable prototype enforces.

---

## 1. Mandatory Request Headers

All VITO v1.1 endpoints MUST receive and validate these headers:

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Always | Tenant identifier |
| `X-Pod-Id` | Always | Pod/deployment identifier |
| `X-Request-Id` | Always (auto-gen if absent) | Unique request identifier |
| `X-Correlation-Id` | Always (auto-gen if absent) | Distributed trace correlation |
| `X-Device-Fingerprint` | Always | Device identity hash |
| `X-Purpose-Of-Use` | Always | TREATMENT / PAYMENT / OPERATIONS / etc. |
| `X-Actor-Id` | Always | Authenticated actor identifier |
| `X-Actor-Type` | Always | provider / admin / system / patient |
| `X-Facility-Id` | Contextual | Current facility scope |
| `X-Workspace-Id` | Contextual | Current workspace scope |
| `X-Shift-Id` | Contextual | Current shift scope |
| `Idempotency-Key` | Mutating requests | UUID for request deduplication |

**Rejection**: Missing mandatory headers → HTTP 400 with standard error envelope.

---

## 2. Standard Error Envelope

All errors MUST return:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message",
    "details": {},
    "request_id": "from X-Request-Id",
    "correlation_id": "from X-Correlation-Id"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `MISSING_REQUIRED_HEADER` | 400 | Mandatory header absent |
| `MISSING_IDEMPOTENCY_KEY` | 400 | Mutating request without Idempotency-Key |
| `INVALID_REQUEST` | 400 | Malformed request body |
| `NOT_FOUND` | 404 | Resource not found |
| `IDENTITY_CONFLICT` | 409 | Duplicate health_id |
| `IDEMPOTENCY_CONFLICT` | 409 | Same key, different body |
| `FEDERATION_AUTHORITY_UNAVAILABLE` | 503 | spine_status != ONLINE |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## 3. Endpoints

### 3.1 POST /vito/v1_1/patients

Create a patient identity reference (no PII).

**Request Body**:
```json
{ "health_id": "HID-000123", "crid": "CRID-456", "cpid": "CPID-789" }
```

**Response** (201):
```json
{ "patient": { "id": "uuid", "health_id": "...", "crid": "...", "cpid": "...", "status": "active" }, "action": "created" }
```

### 3.2 PATCH /vito/v1_1/patients/{health_id}

Update identity refs.

**Request Body**: `{ "crid": "new-value", "status": "inactive" }`

**Response** (200): `{ "patient": {...}, "action": "updated", "changed_fields": ["crid", "status"] }`

### 3.3 POST /vito/v1_1/patients/merge

Merge patients. **Requires** `spine_status=ONLINE` (federation authority guard).

**Request Body**:
```json
{ "survivor_health_id": "HID-001", "merged_health_ids": ["HID-002", "HID-003"], "reason": "Duplicate registration" }
```

**Response** (200): `{ "merge_request": {...}, "action": "merged" }`

**Blocked** (503): Returns `FEDERATION_AUTHORITY_UNAVAILABLE` when spine_status != ONLINE.

### 3.4 GET /vito/v1_1/events

Query event envelopes.

**Query Params**: `request_id`, `correlation_id`, `event_type`, `limit`

### 3.5 GET /vito/v1_1/audit

Query audit entries.

**Query Params**: `request_id`, `correlation_id`, `actor_id`, `limit`

---

## 4. Event Envelope Schema

```json
{
  "schema_version": 1,
  "event_id": "uuid",
  "producer": "vito-service",
  "event_type": "vito.patient.created",
  "occurred_at": "2026-02-10T00:00:00Z",
  "tenant_id": "string",
  "pod_id": "string",
  "request_id": "string",
  "correlation_id": "string",
  "actor_id": "string",
  "actor_type": "string",
  "purpose_of_use": "string",
  "subject_type": "patient",
  "subject_id": "string",
  "payload": {
    "op": "CREATE | UPDATE | MERGE",
    "before": null,
    "after": {},
    "changed_fields": ["*"]
  }
}
```

### Event Type Prefixes
- `vito.patient.created`
- `vito.patient.updated`
- `vito.patient.merged`
- `vito.patient.merge.denied`

### Validation Rules
- `schema_version` >= 1
- `producer` = "vito-service"
- `event_type` MUST start with "vito."

---

## 5. Idempotency Behavior

| Scenario | Behavior |
|----------|----------|
| New key | Process request, store (key, hash, response) |
| Same key + same body hash | Return cached response (replay) |
| Same key + different body hash | Return 409 `IDEMPOTENCY_CONFLICT` |
| Expired key (>24h) | Treat as new |

**Hash**: SHA-256 of canonicalized JSON (sorted keys).

---

## 6. Dual Emit Mode

Config key: `emit_mode` with values:

| Mode | Behavior |
|------|----------|
| `DUAL` | Write both v1.1 event envelope + legacy audit record |
| `V1_1_ONLY` | Write only v1.1 event envelope |
| `LEGACY_ONLY` | Write only legacy audit record |

---

## 7. Federation Authority Guard

Applies to: `POST /patients/merge`

**Rule**: If `vito_config.spine_status != 'ONLINE'` → DENY with:
- HTTP 503
- Error code: `FEDERATION_AUTHORITY_UNAVAILABLE`
- Audit entry with decision=DENY
- Event envelope for `vito.patient.merge.denied`

Spine status values: `ONLINE`, `OFFLINE`, `DEGRADED`
