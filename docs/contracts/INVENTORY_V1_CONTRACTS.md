# Inventory Service v1.1 — API Contracts

## Base Path
`/functions/v1/inventory-v1`

## Required TSHEPO Headers (all endpoints)
| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-Id | ✓ | Tenant identifier |
| X-Correlation-Id | ✓ | Request correlation chain |
| X-Device-Fingerprint | ✓ | Device UUID |
| X-Purpose-Of-Use | ✓ | TREATMENT / OPERATIONS / ADMIN |
| X-Actor-Id | ✓ | Authenticated actor |
| X-Actor-Type | ✓ | PROVIDER / SYSTEM / ADMIN |
| X-Facility-Id | Context | Facility scope |
| X-Workspace-Id | Context | Workspace scope |
| X-Shift-Id | Context | Shift scope |
| X-Session-Assurance | Step-up | `HIGH` for protected actions |
| Idempotency-Key | Context | Dedup key for adapter writes |

## Step-Up Required Actions
- `POST /v1/items/import` (bulk)
- `POST /v1/ledger/adjust` (stock adjustment)
- `POST /v1/counts/{id}/approve` (count approval)
- `POST /v1/reconcile/{id}/resolve` (reconciliation)

---

## Endpoints

### Items
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/items/import` | Bulk upsert items + barcodes (step-up) |
| GET | `/v1/items/lookup-by-barcode?code=` | Barcode → item + availability |

### On-Hand Projection
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/onhand?facilityId=&storeId=&binId=&itemCode=` | Query current stock levels |

### Ledger Operations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/ledger/receipt` | Record goods receipt |
| POST | `/v1/ledger/issue` | Record stock issue |
| POST | `/v1/ledger/transfer` | Transfer between stores |
| POST | `/v1/ledger/adjust` | Stock adjustment (step-up) |
| POST | `/v1/ledger/wastage` | Record wastage |
| POST | `/v1/ledger/return` | Record return |

#### Ledger Request Body
```json
{
  "facility_id": "string",
  "store_id": "string",
  "bin_id": "string?",
  "item_code": "string",
  "batch": "string?",
  "expiry": "date?",
  "qty": "number",
  "uom": "string",
  "reason": "string",
  "ref_type": "string?",
  "ref_id": "string?",
  "idempotency_key": "string?",
  "to_store_id": "string? (transfer only)",
  "to_bin_id": "string? (transfer only)"
}
```

### FEFO Suggest
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/fefo/suggest` | Get FEFO pick suggestions |

#### Request
```json
{
  "facility_id": "string",
  "store_id": "string",
  "bin_id": "string?",
  "item_code": "string",
  "qty_required": "number",
  "barcode": "string? (scan validation)"
}
```

### Stock Counts
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/counts` | Create count session (DRAFT) |
| POST | `/v1/counts/{id}/lines` | Add count lines |
| POST | `/v1/counts/{id}/submit` | Submit for review |
| POST | `/v1/counts/{id}/approve` | Approve + generate adjustments (step-up) |
| GET | `/v1/counts` | List count sessions |

### Requisitions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/requisitions` | Create requisition |
| POST | `/v1/requisitions/{id}/approve` | Approve requisition |
| POST | `/v1/requisitions/{id}/fulfill` | Fulfill (generates ledger events) |
| GET | `/v1/requisitions` | List requisitions |

### Handover
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/handover/start` | Start handover |
| POST | `/v1/handover/{id}/sign` | Sign (outgoing→incoming→complete) |
| GET | `/v1/handovers` | List handovers |

### Reconciliation (Hybrid)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/reconcile/pending` | List pending drift items |
| POST | `/v1/reconcile/{id}/resolve` | Resolve drift (step-up) |

### Consumption Posting (Clinical)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/internal/consumption/post` | Post consumption from Pharmacy/OROS/PCT |

#### Request
```json
{
  "ref_type": "DISPENSE|ORDER|ENCOUNTER",
  "ref_id": "string",
  "facility_id": "string",
  "store_id": "string",
  "items": [{ "item_code": "string", "batch": "string?", "expiry": "date?", "qty": "number" }]
}
```

### Reference Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/facilities` | List facilities |
| GET | `/v1/stores?facilityId=` | List stores |
| GET | `/v1/bins?storeId=` | List bins |

### History & Events
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/ledger/history?facilityId=&storeId=&itemCode=` | Ledger event history |
| GET | `/v1/events` | Integration intent log |

---

## Routing Modes
Determined per `cap.tenant_facility_capabilities`:
- **INTERNAL**: Ledger + projection updates only
- **EXTERNAL**: Intent logging only (eLMIS adapter)
- **HYBRID**: Both + reconciliation queue

## Standard Error Envelope
```json
{ "code": "ERROR_CODE", "message": "Human-readable message" }
```

## Step-Up Required Response
```json
{
  "code": "STEP_UP_REQUIRED",
  "next": { "method": "OIDC_STEP_UP", "reason": "HIGH_RISK_ACTION" }
}
```

## JSON Schemas

### LedgerEvent
```json
{
  "event_id": "uuid",
  "tenant_id": "string",
  "facility_id": "string",
  "store_id": "string",
  "bin_id": "string?",
  "event_type": "RECEIPT|ISSUE|TRANSFER_OUT|TRANSFER_IN|ADJUSTMENT|WASTAGE|RETURN|COUNT|COUNT_ADJUST",
  "item_code": "string",
  "batch": "string?",
  "expiry": "date?",
  "qty_delta": "number",
  "uom": "string",
  "reason": "string",
  "ref_type": "string?",
  "ref_id": "string?",
  "idempotency_key": "string?",
  "created_by_actor_id": "string",
  "created_at": "timestamptz"
}
```

### OnHandRow
```json
{
  "tenant_id": "string",
  "facility_id": "string",
  "store_id": "string",
  "bin_id": "string?",
  "item_code": "string",
  "batch": "string?",
  "expiry": "date?",
  "qty_on_hand": "number",
  "updated_at": "timestamptz"
}
```
