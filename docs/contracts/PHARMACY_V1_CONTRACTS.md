# Pharmacy Service v1.1 — API Contract Specification

## Base Path
`/pharmacy-v1/v1`

## Authentication & Headers
All requests MUST include TSHEPO mandatory headers:
- `X-Tenant-Id` (required)
- `X-Correlation-Id` (required)
- `X-Device-Fingerprint` (required)
- `X-Purpose-Of-Use` (required)
- `X-Actor-Id` (required)
- `X-Actor-Type` (required)
- `X-Facility-Id` (contextual)
- `X-Workspace-Id` (contextual)
- `X-Shift-Id` (contextual)
- `X-Session-Assurance` (required for step-up gated actions: `HIGH`)

## Error Envelope
```json
{ "code": "ERROR_CODE", "message": "Human-readable message" }
```

### Step-Up Required (HTTP 403)
```json
{
  "code": "STEP_UP_REQUIRED",
  "next": { "method": "OIDC_STEP_UP", "reason": "HIGH_RISK_ACTION" }
}
```

---

## Endpoints

### 1. Worklists
**GET** `/v1/worklists?facilityId=&workspaceId=&storeId=`
Returns active dispense orders (status: NEW, ACCEPTED, PICKING, DISPENSED_PARTIAL, BACKORDERED).

### 2. OROS Order Projection
**POST** `/v1/internal/oros/order-placed`
```json
{
  "oros_order_id": "string",
  "patient_cpid": "CPID-...",
  "items": [{ "drug_code": {"system":"...","code":"...","display":"..."}, "quantity": 1 }],
  "priority": "ROUTINE|URGENT|STAT",
  "facility_id": "string",
  "workspace_id": "string"
}
```
**Response** (201): `{ "dispense_order_id": "DISP-...", "status": "NEW" }`

### 3. Order Detail
**GET** `/v1/dispense-orders/{id}`
Returns order + items + backorders + pickup_proofs.

### 4. Lifecycle Actions

#### Accept
**POST** `/v1/dispense-orders/{id}/accept`
Transitions: NEW → ACCEPTED. Emits: `pharmacy.dispense.accepted`, `oros.workstep.changed`.

#### Pick (FEFO)
**POST** `/v1/dispense-orders/{id}/pick`
Returns FEFO suggestions sorted by expiry. Transitions: → PICKING.

#### Partial Dispense
**POST** `/v1/dispense-orders/{id}/partial`
```json
{ "items": [{ "dispense_item_id": "uuid", "qty_dispensed": 10, "store_id": "MAIN", "bin_id": "DEFAULT", "batch": "B001", "expiry": "2026-12-31" }] }
```
Creates stock movements + backorders for remainder. Emits: `pharmacy.dispense.partial`, `mushex.charge.requested`.

#### Backorder
**POST** `/v1/dispense-orders/{id}/backorder`
Transitions: → BACKORDERED. Emits: `pct.blocker.raised` (AWAITING_MEDS).

#### Complete Dispense
**POST** `/v1/dispense-orders/{id}/complete`
```json
{ "items": [{ "dispense_item_id": "uuid", "qty_dispensed": 30, "store_id": "MAIN", "bin_id": "DEFAULT" }] }
```
Emits: `pharmacy.dispense.completed`, `oros.result.available`, `mushex.charge.requested`, `pct.blocker.cleared`.

### 5. Substitution
**POST** `/v1/dispense-items/{id}/substitute`
```json
{ "new_drug_code": {"system":"...","code":"...","display":"..."}, "reason_code": "GENERIC_EQUIVALENT" }
```
**Response**: `{ "decision": "ALLOWED|DENIED", "reason_codes": [...], "requires_step_up": false }`

### 6. Barcode Lookup
**GET** `/v1/items/lookup-by-barcode?code=BARCODE`
Returns item_code + batch + expiry + stock availability.

### 7. Pickup Proofs
**POST** `/v1/dispense-orders/{id}/pickup/create`
```json
{ "method": "OTP|QR", "is_delegated": false }
```
**Response**: `{ "token": "123456", "expires_at": "...", "is_delegated": false }`

**POST** `/v1/pickup/claim`
```json
{ "token": "123456" }
```
⚠️ Delegated claims require `X-Session-Assurance: HIGH`.

### 8. Returns / Wastage / Reversal

**POST** `/v1/dispense-orders/{id}/return`
```json
{ "items": [{ "item_code": {...}, "quantity": 5, "store_id": "MAIN", "bin_id": "DEFAULT" }] }
```
Emits: `pharmacy.return.recorded`, `mushex.credit.requested`, `oros.correction.intent`.

**POST** `/v1/dispense-orders/{id}/wastage`
Negative stock movement with WASTAGE reason.

**POST** `/v1/dispense-orders/{id}/reversal` ⚠️ **Step-up required**
Reverses all DISPENSE movements. Emits: `pharmacy.reversal.completed`, `mushex.credit.requested`, `oros.correction.intent`, `pct.blocker.raised`.

### 9. Reconciliation (Hybrid)
**GET** `/v1/reconcile/stock/pending?facilityId=`
**POST** `/v1/reconcile/stock/{id}/resolve` ⚠️ **Step-up required**

### 10. Stock Visibility
**GET** `/v1/stock/positions?facilityId=&storeId=`
**GET** `/v1/stock/movements?facilityId=`

### 11. Events/Intents
**GET** `/v1/events?entity_id=`

### 12. Internal Hooks (Intent Creators)
**POST** `/v1/internal/mushex/charge`
**POST** `/v1/internal/oros/status`
**POST** `/v1/internal/pct/blocker`

### 13. Capabilities
**GET** `/v1/capabilities/effective?tenant_id=&facility_id=`

---

## JSON Schemas

### DispenseOrder
```json
{
  "dispense_order_id": "text (ULID)",
  "tenant_id": "text",
  "facility_id": "text",
  "workspace_id": "text?",
  "patient_cpid": "text",
  "oros_order_id": "text (unique)",
  "priority": "ROUTINE|URGENT|STAT",
  "status": "NEW|ACCEPTED|PICKING|DISPENSED_PARTIAL|DISPENSED_COMPLETE|BACKORDERED|CANCELLED|REVERSED"
}
```

### DispenseItem
```json
{
  "dispense_item_id": "uuid",
  "drug_code": { "system": "string", "code": "string", "display": "string" },
  "qty_requested": "numeric",
  "qty_dispensed": "numeric",
  "unit": { "system": "...", "code": "...", "display": "..." },
  "route": { "system": "...", "code": "...", "display": "..." },
  "no_substitution": "boolean",
  "status": "PENDING|PICKED|PARTIAL|COMPLETE|BACKORDERED|SUBSTITUTED|CANCELLED",
  "substitution": { "original": {...}, "replacement": {...}, "reason_code": "...", "decided_by": "..." }
}
```

### StockMovement
```json
{
  "movement_id": "uuid",
  "item_code": { "system": "...", "code": "...", "display": "..." },
  "batch": "text?", "expiry": "date?",
  "qty_delta": "numeric (negative for dispense)",
  "reason": "DISPENSE|RETURN|WASTAGE|ADJUSTMENT|REVERSAL|RECEIVE",
  "ref_type": "DISPENSE_ORDER|STOCK_COUNT|ADAPTER_SYNC",
  "ref_id": "text"
}
```

### PickupProof
```json
{
  "pickup_proof_id": "uuid",
  "method": "OTP|QR",
  "status": "ISSUED|CLAIMED|EXPIRED|CANCELLED",
  "is_delegated": "boolean",
  "expires_at": "timestamptz"
}
```

### Backorder
```json
{
  "backorder_id": "uuid",
  "dispense_order_id": "text",
  "dispense_item_id": "uuid",
  "qty_remaining": "numeric",
  "status": "OPEN|FILLED|CANCELLED"
}
```

### ReconcileItem
```json
{
  "rec_id": "uuid",
  "external_key": "text",
  "confidence": "numeric (0-1)",
  "status": "PENDING|MATCHED|RESOLVED",
  "payload": "jsonb"
}
```

---

## Event Types (Intents)
| Event | Target | Description |
|-------|--------|-------------|
| `pharmacy.dispense.created` | — | Order projected from OROS |
| `pharmacy.dispense.accepted` | OROS | Workstep started |
| `pharmacy.dispense.partial` | MusheX | Partial charge |
| `pharmacy.dispense.completed` | OROS, MusheX, PCT | Full completion |
| `pharmacy.substitution.approved` | — | Substitution decision |
| `pharmacy.pickup.proof.issued` | — | Token created |
| `pharmacy.pickup.claimed` | — | Token verified |
| `pharmacy.return.recorded` | MusheX, OROS | Return credit |
| `pharmacy.wastage.recorded` | — | Wastage audit |
| `pharmacy.reversal.completed` | MusheX, OROS, PCT | Full reversal |
| `pharmacy.reconcile.resolved` | — | Stock drift resolved |
| `mushex.charge.requested` | MusheX | Billing charge |
| `mushex.credit.requested` | MusheX | Billing credit |
| `oros.workstep.changed` | OROS | Status update |
| `oros.result.available` | OROS | Dispense outcome |
| `oros.correction.intent` | OROS | Correction |
| `pct.blocker.raised` | PCT | Blocker raised |
| `pct.blocker.cleared` | PCT | Blocker cleared |
