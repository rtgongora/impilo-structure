# PCT v1.1 — API Contracts (Executable Reference Brief)

## Base URL
`/functions/v1/pct-v1`

## TSHEPO Headers (Mandatory)
All requests MUST include:
- `X-Tenant-Id` — Tenant identifier
- `X-Correlation-Id` — Request correlation UUID
- `X-Actor-Id` — Actor performing the action
- `X-Actor-Type` — PROVIDER | ADMIN | SYSTEM
- `X-Purpose-Of-Use` — TREATMENT | OPERATIONS | ADMIN
- `X-Device-Fingerprint` — Device UUID

Optional context headers:
- `X-Facility-Id`, `X-Workspace-Id`, `X-Shift-Id`

## Endpoints

### A) Work/Shift Context
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/work/start` | Start shift session |
| POST | `/v1/work/end` | End shift session |
| GET | `/v1/work/context` | Get active session |

### B) Patient Sorting
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/patients/search` | Search by CPID |
| POST | `/v1/journeys/start` | Create arrival journey |
| POST | `/v1/journeys/{id}/triage` | Record triage |
| POST | `/v1/journeys/{id}/route` | Route to workspace |

### C) Queues
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/queues?facilityId=&workspaceId=` | List queues |
| POST | `/v1/queues/{id}/enqueue` | Add to queue |
| POST | `/v1/queues/{id}/call-next` | Call next item |
| POST | `/v1/queue-items/{id}/status` | Update status |
| POST | `/v1/queue-items/{id}/transfer` | Transfer item |

### D) Encounters
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/journeys/{id}/encounter/start` | Start encounter |
| POST | `/v1/encounters/{id}/complete` | Complete encounter |
| GET | `/v1/patient/{cpid}/timeline` | Patient timeline |

### E) Admissions / Discharge / Death
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/journeys/{id}/admit` | Request admission |
| POST | `/v1/admissions/{id}/assign-bed` | Assign bed |
| POST | `/v1/admissions/{id}/transfer` | Transfer ward |
| POST | `/v1/journeys/{id}/discharge/start` | Start discharge |
| GET | `/v1/discharge/{caseId}/status` | Discharge status |
| POST | `/v1/discharge/{caseId}/clear-blocker` | Clear blocker |
| POST | `/v1/journeys/{id}/death/record` | Record death |

### F) Ops / Control Tower
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/ops/control-tower?facilityId=` | Full dashboard |
| GET | `/v1/ops/bottlenecks?facilityId=` | Long-wait items |

### G) Integration Webhooks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/integrations/mushex/payment-status-changed` | MUSHEX payment |
| POST | `/v1/integrations/oros/order-status-changed` | OROS order |
| POST | `/v1/integrations/oros/result-available` | OROS result |
| POST | `/v1/integrations/tuso/workspace-updated` | TUSO workspace |

## Event Semantics (Outbox)
Published events stored in `pct_outbox_events`:
- `pct.journey.created`, `pct.journey.state_changed`
- `pct.queue.item.created`, `pct.queue.item.updated`
- `pct.encounter.started`, `pct.encounter.completed`
- `pct.admission.created`, `pct.admission.updated`
- `pct.discharge.started`, `pct.discharge.blocked`, `pct.discharge.cleared`, `pct.discharge.completed`
- `pct.death.recorded`, `pct.death.notified`, `pct.death.completed`

Consumed events (via webhooks):
- `oros.order.status_changed`, `oros.result.available`
- `mushex.payment.status_changed`
- `tuso.workspace.updated`

## Error Envelope
```json
{
  "error": {
    "code": "MISSING_REQUIRED_HEADER",
    "message": "Missing: X-Tenant-Id",
    "details": { "missing": ["X-Tenant-Id"] },
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

## Step-Up Response (403)
```json
{
  "code": "STEP_UP_REQUIRED",
  "next": { "method": "OIDC_STEP_UP", "reason": "HIGH_RISK_ACTION" }
}
```

## Data Models

### Journey States
`ARRIVED → REG_PENDING → TRIAGED → ROUTED → IN_QUEUE → IN_ENCOUNTER → ADMITTED → DISCHARGE_IN_PROGRESS → DISCHARGED`
Alternative terminal: `DEATH_IN_PROGRESS → DECEASED` or `CANCELLED`

### Queue Item States
`WAITING → CALLED → IN_SERVICE → COMPLETED | NO_SHOW | LEFT | PAUSED`

### Discharge Blockers
Array of `{ type: string, detail: string }` — e.g., `BILLING_PAYMENT_PENDING`, `PHARMACY_PENDING`, `SUMMARY_REQUIRED`

### Triage Acuity Scale
`RED | ORANGE | YELLOW | GREEN | BLUE`
