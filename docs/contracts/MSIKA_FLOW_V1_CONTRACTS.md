# MSIKA Flow v1.1 — Contract Artifacts

## Overview
MSIKA Flow is the commerce and fulfillment orchestration service. This document defines the contracts the Java dev stream builds against.

## State Machine
```
CREATED → VALIDATED → PRICED → PAYMENT_PENDING → PAID → ROUTED → ACCEPTED →
IN_PROGRESS → READY_FOR_PICKUP/OUT_FOR_DELIVERY/BOOKED →
COLLECTED/DELIVERED/ATTENDED → COMPLETED
           ↘ CANCELLED (from most states)
           ↘ REFUND_PENDING → REFUNDED
           ↘ FAILED
```

## API Endpoints

### Cart
- `POST /v1/cart/validate` — Validate cart items against MSIKA Core restrictions

### Orders
- `POST /v1/orders` — Create order (CREATED)
- `GET /v1/orders/{id}` — Get order with lines + events
- `GET /v1/orders` — List orders (?status=&vendor_id=&patient_cpid=)
- `POST /v1/orders/{id}/cancel` — Cancel order
- `POST /v1/orders/{id}/price` — Price order (→ PAYMENT_PENDING)
- `POST /v1/orders/{id}/pay` — Pay via MUSHEX stub (→ PAID)
- `POST /v1/orders/{id}/route` — Route to fulfillment (→ ROUTED)
- `POST /v1/orders/{id}/accept` — Vendor acceptance (→ IN_PROGRESS)
- `POST /v1/orders/{id}/mark-ready` — Mark ready ({mode: PICKUP|DELIVERY|BOOKING})
- `POST /v1/orders/{id}/mark-delivered` — Delivery complete (→ COMPLETED)
- `GET /v1/orders/{id}/tracking` — Order events + routes

### Pickup (Delegated Proof)
- `POST /v1/orders/{id}/pickup/issue` — Issue OTP + QR token (step-up if delegated)
- `POST /v1/pickup/claim` — Claim with OTP or token (rate-limited, one-time use)

### Rx Fulfillment
- `POST /v1/rx/attach-token` — Attach prescription token reference
- `POST /v1/rx/{id}/substitution/propose` — Vendor proposes substitution
- `POST /v1/rx/{id}/substitution/approve` — Patient approves substitution

### Bookings
- `POST /v1/bookings/create` — Create service booking
- `POST /v1/bookings/{id}/reschedule` — Reschedule
- `POST /v1/bookings/{id}/cancel` — Cancel with policy

### Vendors
- `POST /v1/vendors/apply` — Apply as vendor (creates ops review)
- `GET /v1/vendors` — List vendors
- `GET /v1/vendors/{id}/orders` — Vendor's orders

### Ops Console
- `GET /v1/ops/reviews/pending` — Pending reviews
- `POST /v1/ops/reviews/{id}/approve` — Approve review
- `POST /v1/ops/reviews/{id}/reject` — Reject review

### Refunds
- `POST /v1/orders/{id}/refund/request` — Request refund (step-up if > threshold)

### MUSHEX Callbacks (SYSTEM only)
- `POST /v1/internal/mushex/payment-status` — Payment status callback
- `POST /v1/internal/mushex/refund-status` — Refund status callback

## Security Headers (TSHEPO Contract)
All requests MUST include:
- `X-Tenant-Id`, `X-Correlation-Id`, `X-Device-Fingerprint`
- `X-Purpose-Of-Use`, `X-Actor-Id`, `X-Actor-Type`

Step-up (403) triggers: delegated pickup, refunds above threshold, controlled items.

## JSON Schemas

### order.schema.json
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["order_id", "tenant_id", "actor_id", "type", "status"],
  "properties": {
    "order_id": { "type": "string" },
    "tenant_id": { "type": "string" },
    "actor_id": { "type": "string" },
    "actor_type": { "type": "string", "enum": ["PATIENT","PROVIDER","VENDOR","OPS","SYSTEM"] },
    "type": { "type": "string", "enum": ["OTC_PRODUCT_ORDER","RX_FULFILLMENT_ORDER","SERVICE_BOOKING_ORDER","BUNDLE_ORDER"] },
    "status": { "type": "string" },
    "amount_total": { "type": "number" },
    "currency": { "type": "string", "default": "ZAR" },
    "price_snapshot": { "type": "object" },
    "restrictions_snapshot": { "type": "object" }
  }
}
```

### pickup_claim.schema.json
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["order_id"],
  "properties": {
    "order_id": { "type": "string" },
    "otp": { "type": "string", "pattern": "^[0-9]{6}$" },
    "token": { "type": "string", "format": "uuid" }
  },
  "oneOf": [
    { "required": ["otp"] },
    { "required": ["token"] }
  ]
}
```

### price_snapshot.schema.json
```json
{
  "type": "object",
  "required": ["lines", "total", "priced_at"],
  "properties": {
    "lines": { "type": "integer" },
    "total": { "type": "number" },
    "priced_at": { "type": "string", "format": "date-time" }
  }
}
```
