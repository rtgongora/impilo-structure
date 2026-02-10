# COSTA v1.1 — API Contracts (Executable Reference)

## Overview
COSTA is the Impilo Costing Engine. This document defines the API surface the Java team builds against.

## Base URL
`POST/GET /costa-v1/v1/...`

## TSHEPO Headers (Required)
All requests must include:
- `X-Tenant-Id` — tenant identifier
- `X-Correlation-Id` — trace correlation
- `X-Actor-Id` — acting user/system
- `X-Actor-Type` — PATIENT|PROVIDER|VENDOR|OPS|SYSTEM
- `X-Device-Fingerprint` — device identifier
- `X-Purpose-Of-Use` — BILLING|TREATMENT|etc.
- `X-Facility-Id` — facility context (required for costing)

## Endpoints

### POST /v1/estimate
Create a cost/charge estimate without persisting a bill.

**Request:**
```json
{
  "lines": [
    { "msika_code": "CONS-001", "kind": "SERVICE", "qty": 1, "cost_method": "TARIFF" },
    { "msika_code": "LAB-CBC", "kind": "SERVICE", "qty": 1, "drivers": { "tests": 1 } }
  ],
  "patient_cpid": "cpid-xxx",
  "exemption_inputs": { "age_eligible": true, "category": "under5" }
}
```

**Response:** `200`
```json
{
  "lines": [{ "msika_code": "...", "cost_trace": {...}, "charge_trace": {...} }],
  "totals": { "cost": 150.0, "charge": 225.0 },
  "allocation": { "patient_amount": 100, "insurer_amount": 125, "write_off_amount": 0 }
}
```

### POST /v1/bills/draft
Create a draft bill with computed lines.

### GET /v1/bills/{id}
Get bill with lines, parties, and traces.

### POST /v1/bills/{id}/recompute
Recompute all lines using current tariffs/rules. Fails for FINAL bills.

### POST /v1/bills/{id}/submit-approval
Transition bill to APPROVAL_PENDING.

### POST /v1/bills/{id}/approve ⚠️ Step-Up Required
Approve a bill. Requires `X-Step-Up: TRUE`.

### POST /v1/bills/{id}/finalize
Lock bill as FINAL. Prevents further mutation.

### POST /v1/bills/{id}/issue-invoice
Generate invoice record.

### POST /v1/bills/{id}/create-payment-intent
Create MUSHEX payment intent stub.

### POST /v1/bills/{id}/refund ⚠️ Step-Up above ZAR 1000
Request refund. Step-up required for amounts > 1000.

### GET /v1/rulesets
List charging rulesets.

### POST /v1/rulesets/publish ⚠️ Step-Up Required
Publish a ruleset.

### POST /v1/tariffs/import ⚠️ Step-Up Required
Bulk import tariffs from CSV-like payload.

### GET /v1/audit/bill/{id}
Audit trail for a bill.

### POST /v1/internal/events/ingest
Ingest domain events (PCT, OROS, Pharmacy, Inventory, MSIKA Flow).

### POST /v1/internal/mushex/payment-status
MUSHEX payment callback.

### POST /v1/internal/mushex/refund-status
MUSHEX refund callback.

## Cost Method Engines

| Method | Description |
|--------|-------------|
| MICRO | resource_units × unit_cost from unit_cost_sources |
| ABC | overhead pool allocation by driver rates |
| TARIFF | tariff table lookup by msika_code + effective date |
| STANDARD | fixed standard unit cost with variance capture |
| STOCK_AVG | moving weighted average from inventory events |

## Charging Rules Schema
```json
{
  "rules": [
    { "type": "MARKUP", "kind": "*", "value": 30, "priority": 1 },
    { "type": "TIME_SURCHARGE", "from_hour": 18, "to_hour": 6, "value": 15, "priority": 2 },
    { "type": "BUNDLE_INCLUDE", "msika_code": "SURG-DRAPE", "bundle_code": "THEATRE_PACK", "priority": 3 },
    { "type": "EXCLUSION", "kind": "SERVICE", "msika_code": "CONS-001", "reason": "waived_if_admitted", "priority": 4 }
  ]
}
```

## Bill Status Lifecycle
`DRAFT` → `APPROVAL_PENDING` → `FINAL` → (locked)
`DRAFT` → `FINAL_EXTERNAL` (external mode)
`FINAL` → `VOID` (post-close adjustment with approval)

## JSON Schemas

### bill_header.schema.json
```json
{
  "type": "object",
  "properties": {
    "bill_id": { "type": "string" },
    "tenant_id": { "type": "string" },
    "facility_id": { "type": "string" },
    "status": { "enum": ["DRAFT","APPROVAL_PENDING","FINAL","FINAL_EXTERNAL","VOID"] },
    "currency": { "type": "string", "default": "ZAR" },
    "totals": { "type": "object" },
    "lock_version": { "type": "integer" }
  }
}
```

### cost_trace.schema.json
```json
{
  "type": "object",
  "properties": {
    "method": { "enum": ["MICRO","ABC","TARIFF","STANDARD","STOCK_AVG"] },
    "unit_cost": { "type": "number" },
    "driver_units": { "type": "number" },
    "drivers": { "type": "object" },
    "pools": { "type": "array" },
    "tariff_code": { "type": "string" }
  }
}
```

## Dual Mode Behavior
- **INTERNAL**: COSTA produces invoice/bill totals and payment intent
- **EXTERNAL**: COSTA produces canonical charge pack + trace, marks as FINAL_EXTERNAL
- **HYBRID**: mix; bill lines can be INTERNAL or EXTERNAL marked in trace

Configured via `costa.capability_profiles` per tenant/facility.
