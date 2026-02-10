# MUSHEX v1.1 — API Contracts

## Base URL
`/functions/v1/mushex-v1`

## Required Headers (TSHEPO)
| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-Id | ✅ | Tenant identifier |
| X-Correlation-Id | Auto | Request correlation |
| X-Actor-Id | ✅ | Actor identifier |
| X-Actor-Type | ✅ | PATIENT\|PROVIDER\|FACILITY_FINANCE\|INSURER\|OPS\|SYSTEM |
| X-Device-Fingerprint | ○ | Device fingerprint |
| X-Purpose-Of-Use | ○ | Purpose of use |
| X-Facility-Id | ○ | Facility context |
| X-Step-Up | ○ | "TRUE" for step-up auth |

## Endpoints

### Payments
| Method | Path | Description | Step-Up |
|--------|------|-------------|---------|
| POST | /v1/payment-intents | Create payment intent | No |
| GET | /v1/payment-intents/{id} | Get intent details | No |
| POST | /v1/payment-intents/{id}/cancel | Cancel intent | No |
| POST | /v1/payment-intents/{id}/issue-remittance-slip | Issue delegated pay slip | Rate-limited |
| POST | /v1/remittance/claim | Claim remittance via OTP | Rate-limited |
| POST | /v1/payment-intents/{id}/refund | Refund (>ZAR 1000 requires step-up) | Conditional |
| GET | /v1/receipts/{intentId} | Get receipt | No |

### Claims
| Method | Path | Description | Actor |
|--------|------|-------------|-------|
| POST | /v1/claims | Create claim | Any |
| GET | /v1/claims/{id} | Get claim with events | Any |
| POST | /v1/claims/{id}/submit | Submit to insurer | Any |
| POST | /v1/claims/{id}/adjudication | Record adjudication | SYSTEM/OPS/INSURER |
| POST | /v1/claims/{id}/dispute | File dispute | Any |

### Settlements
| Method | Path | Description | Step-Up |
|--------|------|-------------|---------|
| POST | /v1/settlements/run | Run settlement calculation | No |
| GET | /v1/settlements/{id} | Get settlement details | No |
| POST | /v1/settlements/{id}/release-payouts | Release payouts | ✅ Yes |

### Ops/Fraud
| Method | Path | Description | Actor |
|--------|------|-------------|-------|
| GET | /v1/ops/reviews/pending | List pending reviews | OPS/SYSTEM |
| POST | /v1/ops/reviews/{id}/approve | Approve/reject review | OPS/SYSTEM |
| GET | /v1/fraud/flags | List fraud flags | OPS/SYSTEM |

### Internal
| Method | Path | Description | Actor |
|--------|------|-------------|-------|
| POST | /v1/internal/events/ingest | Ingest external event | SYSTEM |
| POST | /v1/adapters/{type}/webhook | Adapter webhook callback | SYSTEM |

### Ledger
| Method | Path | Description |
|--------|------|-------------|
| GET | /v1/ledger/balance | Get account balances |

## Payment Intent State Machine
```
CREATED → PENDING → AUTHORIZED → PAID → REFUND_PENDING → REFUNDED
                                      → FAILED
         → CANCELLED
```

## Claim State Machine
```
DRAFT → SUBMITTED → RECEIVED → ADJUDICATED → PAID
                                            → PARTIAL
                                            → REJECTED
                              → RESUBMIT_PENDING
```

## Ledger Accounts
- PATIENT_CASH (ASSET)
- FACILITY_REVENUE (INCOME)
- PLATFORM_FEES (INCOME)
- INSURER_RECEIVABLE (ASSET)
- REFUNDS_PAYABLE (LIABILITY)
- SETTLEMENT_PAYABLE (LIABILITY)

## Security
- Remittance tokens: SHA-256 hashed (Argon2id in production)
- OTP: 6-digit, SHA-256 hashed, rate-limited (5 attempts/min, 15-min lockout)
- No PII stored (CPID/CRID only)
- No card PAN or sensitive credentials
- Step-up via X-Step-Up: TRUE header
