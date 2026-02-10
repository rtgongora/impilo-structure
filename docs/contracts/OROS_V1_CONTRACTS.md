# OROS v1.1 — Orders & Results Orchestration Service — API Contracts

> Executable Reference Brief for the human-led Java/Spring Boot implementation.

## Base Path
`/oros-v1/v1`

## Authentication
All endpoints require TSHEPO headers:
- `X-Tenant-Id` (required)
- `X-Correlation-Id` (required)
- `X-Actor-Id` (required)
- `X-Actor-Type` (required)
- `X-Purpose-Of-Use` (required)
- `X-Device-Fingerprint` (required)
- `X-Facility-Id` (contextual)
- `X-Workspace-Id` (contextual)
- `X-Shift-Id` (contextual)
- `X-Session-Assurance` (required for step-up gated actions)

## PII Policy
OROS is PII-minimized: uses `patient_cpid` only — no names, addresses, or telecom.

---

## 1. Orders

### POST /v1/orders — Place Order
```json
{
  "facility_id": "FAC-001",
  "patient_cpid": "CPID-abc123",
  "type": "LAB",
  "priority": "URGENT",
  "zibo_order_code": {"system": "http://loinc.org", "code": "2093-3", "display": "Cholesterol"},
  "items": [{"code": {"system": "http://loinc.org", "code": "2093-3"}, "quantity": 1}]
}
```
**Response 201:**
```json
{"order_id": "ORD-...", "status": "PLACED", "routing_mode": "INTERNAL", "route_target": "INTERNAL"}
```

### GET /v1/orders/{orderId}
Returns full order with items, worksteps, results, routing, acknowledgements.

### POST /v1/orders/{orderId}/cancel
Cancels non-terminal order.

### POST /v1/orders/{orderId}/accept
PLACED → ACCEPTED. Creates DEPT acknowledgement.

### POST /v1/orders/{orderId}/reject
PLACED/ACCEPTED → REJECTED. Body: `{"reason": "..."}`.

---

## 2. Worklists

### GET /v1/worklists?facilityId=&type=&workspaceId=
Returns actionable orders sorted by priority + time-in-queue.

---

## 3. Worksteps

### POST /v1/worksteps/{stepId}/start
PENDING → IN_PROGRESS. Order transitions to IN_PROGRESS.

### POST /v1/worksteps/{stepId}/complete
IN_PROGRESS → DONE. Auto-closes CLOSE_OUT when all steps done.

---

## 4. Results

### POST /v1/orders/{orderId}/results
```json
{"kind": "LAB", "summary": {...}, "zibo_result_codes": [...], "doc_ids": [...], "is_critical": false}
```

### GET /v1/orders/{orderId}/results

### POST /v1/orders/{orderId}/results/{resultId}/mark-critical ⚠️ STEP-UP
Requires `X-Session-Assurance: HIGH`. Returns 403 STEP_UP_REQUIRED otherwise.

---

## 5. Acknowledgements

### POST /v1/orders/{orderId}/ack
```json
{"ack_type": "CLINICIAN", "notes": "Reviewed and noted"}
```

---

## 6. Routing

### GET /v1/routes/{orderId}
### POST /v1/retry/{orderId}

---

## 7. Reconciliation

### GET /v1/reconcile/pending?facilityId=
### POST /v1/reconcile/{recId}/match
```json
{"order_id": "ORD-...", "ops_notes": "Matched by accession"}
```
### POST /v1/reconcile/{recId}/resolve ⚠️ STEP-UP

---

## 8. Capabilities

### GET /v1/capabilities/effective?facility_id=
### POST /v1/capabilities

---

## 9. Writeback Intents

### POST /v1/internal/butano/writeback
### POST /v1/internal/pct/hook
### GET /v1/writeback-intents?order_id=

---

## 10. Event Log

### GET /v1/events?order_id=

---

## Error Envelope
```json
{
  "error": {
    "code": "STEP_UP_REQUIRED",
    "message": "Step-up authentication required",
    "next": {"method": "OIDC_STEP_UP", "reason": "HIGH_RISK_ACTION"}
  }
}
```

## Order Status State Machine
```
DRAFT → PLACED → ACCEPTED → IN_PROGRESS → PARTIAL_RESULT/RESULT_AVAILABLE → REVIEWED → RELEASED → COMPLETED
                                                                                                      ↗
PLACED/ACCEPTED → REJECTED
Any non-terminal → CANCELLED
```

## Workstep Types by Order Type
- **LAB**: ORDER_PLACED → SPECIMEN_COLLECTION → SPECIMEN_RECEIVED → ANALYSIS → REPORTING → CLOSE_OUT
- **IMAGING**: ORDER_PLACED → IMAGING_ACQUISITION → IMAGING_REPORTING → CLOSE_OUT
- **PHARMACY**: ORDER_PLACED → DISPENSE → ADMINISTER → CLOSE_OUT

## Writeback Intent Types
- `CREATE_SERVICEREQUEST` → BUTANO
- `CREATE_DIAGNOSTICREPORT` → BUTANO
- `CREATE_OBSERVATIONS` → BUTANO
- `CREATE_MEDDISPENSE` → BUTANO
- `PCT_EXPECTED_WORKSTEPS` → PCT
- `PCT_RESULT_AVAILABLE` → PCT
