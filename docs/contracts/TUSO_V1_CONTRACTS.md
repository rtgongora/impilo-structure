# TUSO v1 — API Contract Specification

## Overview
TUSO (Facility Operations Service) manages facilities, workspaces, resources, bookings, shifts, configuration, telemetry, and control tower alerts. All endpoints enforce TSHEPO-gated mandatory headers and return the standard v1.1 error envelope.

## Base Path
`/tuso-v1/`

## Mandatory Headers (all requests)
| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-Id | ✅ | Tenant identifier |
| X-Correlation-Id | ✅ | Correlation chain ID |
| X-Device-Fingerprint | ✅ | Device fingerprint |
| X-Purpose-Of-Use | ✅ | Purpose code |
| X-Actor-Id | ✅ | Acting user ID |
| X-Actor-Type | ✅ | Actor type (provider/admin) |
| X-Pod-Id | Optional | Pod identifier (defaults national) |
| X-Facility-Id | Context | When facility-scoped |
| X-Workspace-Id | Context | When workspace-scoped |
| X-Shift-Id | Context | When shift-scoped |

## Standard Error Envelope
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {},
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

## Endpoints

### A) Facilities
| Method | Path | Description |
|--------|------|-------------|
| GET | /facilities | List facilities |
| POST | /facilities | Create facility |
| GET | /facilities/{id} | Get facility (enriched) |
| PATCH | /facilities/{id} | Update facility (versioned) |
| POST | /facilities/merge | Request merge (spine guard) |

### B) Workspaces
| Method | Path | Description |
|--------|------|-------------|
| GET | /facilities/{id}/workspaces | List workspaces |
| POST | /facilities/{id}/workspaces | Create workspace |
| GET | /workspaces/{id} | Get workspace + rules |
| PUT | /workspaces/{id} | Update workspace |
| POST | /workspaces/{id}/override | Log override (reason required) |

### C) Shifts
| Method | Path | Description |
|--------|------|-------------|
| GET | /facilities/{id}/start-shift/options | Get eligible workspaces |
| POST | /facilities/{id}/start-shift | Start shift context |

### D) Resources & Bookings
| Method | Path | Description |
|--------|------|-------------|
| GET | /facilities/{id}/resources | List resources |
| POST | /facilities/{id}/resources | Create resource |
| POST | /resources/{id}/bookings | Create booking (conflict detection) |
| GET | /resources/{id}/bookings | List bookings |
| DELETE | /bookings/{id} | Cancel booking |
| GET | /facilities/{id}/calendars/slots | Get calendar slots |

### E) Configuration
| Method | Path | Description |
|--------|------|-------------|
| GET | /facilities/{id}/config/effective | Get merged config |
| PUT | /facilities/{id}/config | Save new version |
| GET | /facilities/{id}/config/history | Version history |
| POST | /facilities/{id}/config/rollback | Rollback to version |

### F) Telemetry & Control Tower
| Method | Path | Description |
|--------|------|-------------|
| POST | /telemetry/pct | Ingest PCT data |
| POST | /telemetry/oros | Ingest OROS data |
| GET | /control-tower/facilities/{id}/summary | Facility summary |
| GET | /control-tower/alerts | List alerts |
| POST | /control-tower/alerts/{id}/resolve | Resolve alert |

### G) GOFR Sync
| Method | Path | Description |
|--------|------|-------------|
| POST | /gofr/sync | Trigger sync |
| GET | /gofr/sync-log | Get sync history |

## JSON Schemas

### Facility Profile
```json
{
  "id": "uuid",
  "tenant_id": "string",
  "name": "string",
  "status": "ACTIVE|CLOSED|MERGED|INACTIVE",
  "ownership": "GOVT|PRIVATE|FAITH|OTHER",
  "level": "string",
  "type_code": "string|null",
  "parent_facility_id": "uuid|null",
  "identifiers": [],
  "geo": {},
  "contacts": [],
  "capabilities": [],
  "readiness": {}
}
```

### Booking Request
```json
{
  "start_at": "ISO8601",
  "end_at": "ISO8601",
  "reason": "string|null"
}
```

### Booking Conflict Error
```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Time slot conflicts",
    "details": { "conflicting_ids": ["uuid"] },
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

### Event Envelope (emitted to vito_event_envelopes)
```json
{
  "schema_version": 1,
  "event_id": "uuid",
  "producer": "tuso-service",
  "event_type": "tuso.*",
  "occurred_at": "ISO8601",
  "tenant_id": "string",
  "pod_id": "string",
  "request_id": "uuid",
  "correlation_id": "uuid",
  "actor_id": "string",
  "actor_type": "string",
  "purpose_of_use": "string",
  "payload": {}
}
```

## ZIBO Validation Modes
- **STRICT**: Reject unknown codes → 422 INVALID_CODE
- **LENIENT**: Accept but mark validation_status = UNVALIDATED

## Dual Emit Mode
- **DUAL**: Write both audit + event envelope
- **V1_1_ONLY**: Event envelope only
- **LEGACY_ONLY**: Audit only

## Federation Authority Guard
Merge operations require `spine_status = ONLINE`. If offline/degraded → 503 FEDERATION_AUTHORITY_UNAVAILABLE.
