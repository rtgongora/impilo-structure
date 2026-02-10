# Landela + Credentials Suite v1.1 — API Contract Specification

## Overview

This document defines the stable API contracts for the Landela Adapter, Document Store, Credential Verification Service (CVS), Card Print Agent, and Share Slip/Delegated Pickup service.

All endpoints enforce TSHEPO headers. All responses follow the standard error envelope.

---

## 1. TSHEPO Headers (Required)

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | ✅ | Tenant isolation scope |
| `X-Correlation-Id` | ✅ | End-to-end trace ID |
| `X-Device-Fingerprint` | ✅ | Non-PII device identifier |
| `X-Purpose-Of-Use` | ✅ | TREATMENT, PAYMENT, OPERATIONS, etc. |
| `X-Actor-Id` | ✅ | Acting subject identifier |
| `X-Actor-Type` | ✅ | PRACTITIONER, SYSTEM, PATIENT, etc. |
| `X-Facility-Id` | Context | Facility context |
| `X-Workspace-Id` | Context | Workspace context |
| `X-Shift-Id` | Context | Shift context |
| `X-Decision-Id` | Optional | TSHEPO decision reference |
| `X-Break-Glass` | Optional | Emergency override flag |
| `X-Consent-Decision` | Optional | PERMIT/DENY pass-through |

## 2. Standard Error Envelope

```json
{
  "error": {
    "code": "MISSING_REQUIRED_HEADER",
    "message": "Missing: X-Tenant-Id, X-Actor-Id",
    "details": { "missing_headers": ["X-Tenant-Id", "X-Actor-Id"] }
  }
}
```

## 3. Landela Adapter API

### POST /v1/docs/upload
Creates a document record with dual-mode storage routing.

**Request Body:**
```json
{
  "subject_type": "CLIENT | PROVIDER | FACILITY | ENCOUNTER | REFERRAL | OTHER",
  "subject_id": "string",
  "document_type_code": "string (ZIBO-coded)",
  "source": "SCANNED | UPLOADED | GENERATED",
  "mime_type": "string",
  "confidentiality": "NORMAL | RESTRICTED | HIGHLY_RESTRICTED",
  "tags": ["string"],
  "hash_sha256": "string (optional)",
  "issuer": "string (optional)"
}
```

**Response:** `201 Created`
```json
{ "document": { "id": "uuid", "storage_provider": "INTERNAL|LANDELA", ... } }
```

### GET /v1/docs/{id}/metadata
### PUT /v1/docs/{id}/metadata
### POST /v1/docs/{id}/signed-url
### POST /v1/docs/search
### POST /v1/docs/{id}/lifecycle/{archive|revoke|supersede|delete}

## 4. Credential Verification Service (CVS)

### POST /v1/credentials/issue
```json
{
  "subject_type": "CLIENT | PROVIDER | FACILITY",
  "subject_id": "string",
  "credential_type": "LICENSE | CERTIFICATE | CARD_ASSERTION | OTHER",
  "issuer": "string",
  "payload": {},
  "expires_at": "ISO8601 (optional)"
}
```

### GET /v1/credentials/{id}
### POST /v1/credentials/{id}/revoke
### GET /v1/verify/{qr_ref_token}

**Verify Response (enumeration-resistant):**
```json
{ "verification": { "status": "VALID | EXPIRED | REVOKED | NOT_FOUND" } }
```

## 5. Card Print Agent

### POST /v1/print/request
### GET /v1/print/jobs?subject=...
### POST /v1/print/jobs/{id}/render
### POST /v1/print/jobs/{id}/mark-printed
### POST /v1/print/jobs/{id}/mark-collected

Template types: `PROVIDER_CARD`, `CLIENT_CARD`, `FACILITY_BADGE`, `SHARE_SLIP_PDF`, `EMERGENCY_CAPSULE_PDF`

## 6. Share Slip / Delegated Pickup

### POST /v1/share/create
### POST /v1/share/{token}/otp/send
### POST /v1/share/{token}/claim
### GET /v1/share/{token}/status
### POST /v1/share/{token}/revoke

Proof methods: `OTP`, `QR`, `BOTH`

## 7. Internal Endpoints

### POST /v1/internal/documentreference/push
Pushes a DocumentReference to BUTANO SHR.

### GET /v1/internal/stats
Returns aggregate counts across all suite tables.

## 8. Dual-Mode Behavior

The `suite_tenant_config.document_mode` field controls routing:
- `INTERNAL`: Files stored in Supabase Storage (S3-compatible)
- `LANDELA`: Files routed to external Landela system (mocked in prototype)

The API surface is identical regardless of mode.

## 9. Privacy Rules

### Never Store:
- PII in audit events (names, phone numbers, addresses)
- Raw secret tokens in logs
- Unencrypted OTPs (only hashes)
- National ID numbers in tags or metadata

### Always Store:
- Opaque subject IDs (CPID, provider_public_id)
- SHA-256 document hashes
- Actor IDs (opaque)
- Correlation IDs for traceability

## 10. Step-Up Response

```json
{
  "code": "STEP_UP_REQUIRED",
  "next": { "method": "OIDC_STEP_UP", "reason": "SENSITIVE_ACTION" }
}
```

## 11. Rate Limit Response

```json
{
  "code": "RATE_LIMITED",
  "retry_after_seconds": 60
}
```
