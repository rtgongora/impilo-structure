# Impilo vNext — Seed Fixtures Specification

> Minimal, consistent dataset for the replica prototype to match the Lovable build visually.
> All values are deterministic — use fixed UUIDs for cross-referencing.

---

## UUID Convention

All seed UUIDs use the pattern `00000000-0000-4000-a000-{12-char-hex}` for easy identification.

```
Tenant:   t1 = 00000000-0000-4000-a000-000000000t01  (National Spine)
          t2 = 00000000-0000-4000-a000-000000000t02  (Private Pod)
Facility: f1..f4
Provider: p01..p10
Patient:  pt01..pt20
```

For readability below, short aliases are used. Actual inserts should use full UUIDs.

---

## 1. Tenants (2)

### `butano_tenants`
| tenant_id | name |
|-----------|------|
| `NATIONAL` | National Health Spine |
| `PRIVATE-POD-01` | Sunrise Health Group |

### `vito_config`
| tenant_id | config_key | config_value |
|-----------|------------|--------------|
| `default-tenant` | `spine_status` | `ONLINE` |
| `default-tenant` | `emit_mode` | `DUAL` |

---

## 2. Facilities (4)

### `tuso_facilities`
| id (alias) | tenant_id | name | level | ownership | status | type_code |
|------------|-----------|------|-------|-----------|--------|-----------|
| f1 | NATIONAL | Mbuya Nehanda Clinic | primary | public | ACTIVE | PHC |
| f2 | NATIONAL | Parirenyatwa District Hospital | district | public | ACTIVE | DH |
| f3 | NATIONAL | Harare Provincial Hospital | provincial | public | ACTIVE | PH |
| f4 | PRIVATE-POD-01 | Sunrise Medical Centre | primary | private | ACTIVE | PMC |

### `tuso_workspaces` (8 — 2 per facility)
| id (alias) | facility_id | name | workspace_type_code | active |
|------------|-------------|------|---------------------|--------|
| ws-f1-opd | f1 | OPD Consulting Room 1 | OPD | true |
| ws-f1-phc | f1 | Primary Care Station | PHC | true |
| ws-f2-lab | f2 | Laboratory | LAB | true |
| ws-f2-ward | f2 | Male Medical Ward | WARD | true |
| ws-f3-icu | f3 | Intensive Care Unit | ICU | true |
| ws-f3-theatre | f3 | Theatre Suite A | THEATRE | true |
| ws-f4-opd | f4 | Consulting Room A | OPD | true |
| ws-f4-pharm | f4 | Dispensary | PHARM | true |

---

## 3. Providers (10)

### `profiles` + linked `health_providers`
| # | display_name | role | specialty | provider_registry_id | facility_id | email (auth.users) |
|---|-------------|------|-----------|---------------------|-------------|-------------------|
| p01 | Sarah Moyo | doctor | General Medicine | VARAPI-2025-ZW000001-A1B2 | f1 | sarah.moyo@impilo.health |
| p02 | Tendai Ncube | nurse | Nursing | VARAPI-2025-ZW000002-C3D4 | f1 | tendai.ncube@impilo.health |
| p03 | Grace Mutasa | specialist | Radiology | VARAPI-2025-ZW000003-E5F6 | f2 | grace.mutasa@impilo.health |
| p04 | Farai Chikwava | pharmacist | Pharmacy | VARAPI-2025-ZW000004-G7H8 | f2 | farai.chikwava@impilo.health |
| p05 | Rumbi Mhaka | lab_tech | Pathology | VARAPI-2025-ZW000005-I9J0 | f2 | rumbi.mhaka@impilo.health |
| p06 | Takudzwa Banda | doctor | Surgery | VARAPI-2025-ZW000006-K1L2 | f3 | takudzwa.banda@impilo.health |
| p07 | Chipo Dube | nurse | Midwifery | VARAPI-2025-ZW000007-M3N4 | f3 | chipo.dube@impilo.health |
| p08 | Blessing Nyathi | admin | Admin | VARAPI-2025-ZW000008-O5P6 | f1 | blessing.nyathi@impilo.health |
| p09 | Tafadzwa Mpofu | doctor | Paediatrics | VARAPI-2025-ZW000009-Q7R8 | f4 | tafadzwa.mpofu@impilo.health |
| p10 | Nyasha Gumbo | receptionist | Registration | VARAPI-2025-ZW000010-S9T0 | f4 | nyasha.gumbo@impilo.health |

All share password: `Impilo2025!`

### `user_roles`
| user (by provider) | role |
|--------------------|------|
| p08 (Blessing) | admin |

---

## 4. Patients (20) — No PII in BUTANO Views

### `patients`
| # | mrn | first_name | last_name | date_of_birth | gender | is_active |
|---|-----|-----------|-----------|---------------|--------|-----------|
| pt01 | MRN-2025-000001 | Tatenda | Sithole | 1985-03-14 | male | true |
| pt02 | MRN-2025-000002 | Rudo | Chirwa | 1990-07-22 | female | true |
| pt03 | MRN-2025-000003 | Kudakwashe | Mlambo | 1978-11-05 | male | true |
| pt04 | MRN-2025-000004 | Tsitsi | Ngwenya | 2001-01-30 | female | true |
| pt05 | MRN-2025-000005 | Simba | Musiiwa | 1965-06-18 | male | true |
| pt06 | MRN-2025-000006 | Maita | Pfende | 1995-09-12 | female | true |
| pt07 | MRN-2025-000007 | Tapiwa | Murwira | 2010-04-03 | male | true |
| pt08 | MRN-2025-000008 | Fadzai | Tembo | 1988-12-25 | female | true |
| pt09 | MRN-2025-000009 | Tinashe | Chigumba | 1972-08-07 | male | true |
| pt10 | MRN-2025-000010 | Rutendo | Mapfumo | 2003-02-14 | female | true |
| pt11 | MRN-2025-000011 | Munyaradzi | Sibanda | 1980-05-20 | male | true |
| pt12 | MRN-2025-000012 | Yeukai | Zvikaramba | 1992-10-08 | female | true |
| pt13 | MRN-2025-000013 | Tawanda | Magaya | 1975-01-15 | male | true |
| pt14 | MRN-2025-000014 | Chenai | Mukono | 1998-06-30 | female | true |
| pt15 | MRN-2025-000015 | Fungai | Hwata | 2005-11-11 | male | true |
| pt16 | MRN-2025-000016 | Nyarai | Dziva | 1983-04-25 | female | true |
| pt17 | MRN-2025-000017 | Kudzai | Marange | 1970-09-01 | male | true |
| pt18 | MRN-2025-000018 | Tambudzai | Chidziva | 2000-03-08 | female | true |
| pt19 | MRN-2025-000019 | Tendai | Gavhi | 1987-07-19 | male | true |
| pt20 | MRN-2025-000020 | Shamiso | Makoni | 1993-12-02 | female | false |

### `vito_patients` (CPID/CRID mapping — PII-free)
| health_id | crid | cpid | tenant_id | status |
|-----------|------|------|-----------|--------|
| HID-0000000001-ABCD-7 | CR-20250101-000001-XY12 | CPID-NAT-000001 | default-tenant | active |
| HID-0000000002-EFGH-3 | CR-20250101-000002-AB34 | CPID-NAT-000002 | default-tenant | active |
| HID-0000000003-IJKL-9 | CR-20250101-000003-CD56 | CPID-NAT-000003 | default-tenant | active |
| HID-0000000004-MNOP-5 | CR-20250101-000004-EF78 | CPID-NAT-000004 | default-tenant | active |
| HID-0000000005-QRST-1 | CR-20250101-000005-GH90 | CPID-NAT-000005 | default-tenant | active |
| HID-0000000006-UVWX-8 | CR-20250101-000006-IJ12 | CPID-NAT-000006 | default-tenant | active |
| HID-0000000007-YZ01-4 | CR-20250101-000007-KL34 | CPID-NAT-000007 | default-tenant | active |
| HID-0000000008-2345-0 | CR-20250101-000008-MN56 | CPID-NAT-000008 | default-tenant | active |
| HID-0000000009-6789-6 | CR-20250101-000009-OP78 | CPID-NAT-000009 | default-tenant | active |
| HID-0000000010-ABCE-2 | CR-20250101-000010-QR90 | CPID-NAT-000010 | default-tenant | active |
| HID-0000000011-DFGH-8 | — | CPID-NAT-000011 | default-tenant | active |
| HID-0000000012-IJKM-4 | — | CPID-NAT-000012 | default-tenant | active |
| HID-0000000013-NOPQ-0 | — | CPID-NAT-000013 | default-tenant | active |
| HID-0000000014-RSTU-6 | — | CPID-NAT-000014 | default-tenant | active |
| HID-0000000015-VWXY-2 | — | CPID-NAT-000015 | default-tenant | active |
| HID-0000000016-Z012-8 | — | CPID-NAT-000016 | default-tenant | active |
| HID-0000000017-3456-4 | — | CPID-NAT-000017 | default-tenant | active |
| HID-0000000018-789A-0 | — | CPID-NAT-000018 | default-tenant | active |
| HID-0000000019-BCDE-6 | — | CPID-NAT-000019 | default-tenant | active |
| HID-0000000020-FGHI-2 | — | CPID-NAT-000020 | default-tenant | inactive |

---

## 5. Orders (10) — Various States

### Via OROS edge function (stored server-side). Seed equivalent for `clinical_orders`:
| # | order_name | order_type | priority | status | patient (pt#) | ordered_by (p#) |
|---|-----------|------------|----------|--------|--------------|-----------------|
| o01 | Full Blood Count | lab | ROUTINE | pending | pt01 | p01 |
| o02 | Chest X-Ray | imaging | URGENT | in_progress | pt02 | p01 |
| o03 | Paracetamol 500mg | pharmacy | ROUTINE | completed | pt03 | p01 |
| o04 | Liver Function Test | lab | STAT | pending | pt04 | p06 |
| o05 | CT Abdomen | imaging | URGENT | pending | pt05 | p03 |
| o06 | Amoxicillin 250mg | pharmacy | ROUTINE | in_progress | pt06 | p09 |
| o07 | Renal Panel | lab | ROUTINE | completed | pt07 | p01 |
| o08 | Ultrasound Pelvis | imaging | ROUTINE | cancelled | pt08 | p03 |
| o09 | Blood Culture | lab | STAT | pending | pt09 | p06 |
| o10 | Metformin 500mg | pharmacy | ROUTINE | pending | pt10 | p09 |

---

## 6. Billing / Payment Intents (10)

### `charge_sheets`
| # | patient | service_code | service_name | unit_price | quantity | total_amount | net_amount | status |
|---|---------|-------------|-------------|-----------|---------|-------------|-----------|--------|
| cs01 | pt01 | CONS-001 | General Consultation | 350.00 | 1 | 350.00 | 350.00 | captured |
| cs02 | pt02 | XRAY-001 | Chest X-Ray | 450.00 | 1 | 450.00 | 450.00 | captured |
| cs03 | pt03 | PHARM-001 | Paracetamol 500mg | 12.50 | 2 | 25.00 | 25.00 | billed |
| cs04 | pt04 | LAB-001 | Liver Function Test | 280.00 | 1 | 280.00 | 280.00 | pending |
| cs05 | pt05 | IMG-002 | CT Abdomen | 2500.00 | 1 | 2500.00 | 2500.00 | pending |

### `invoices`
| # | invoice_number | patient | payer_type | total_amount | amount_paid | balance_due | status | currency |
|---|---------------|---------|-----------|-------------|-------------|------------|--------|----------|
| inv01 | INV-2025-000001 | pt01 | self_pay | 350.00 | 350.00 | 0.00 | paid | ZAR |
| inv02 | INV-2025-000002 | pt02 | insurance | 450.00 | 0.00 | 450.00 | sent | ZAR |
| inv03 | INV-2025-000003 | pt03 | self_pay | 25.00 | 25.00 | 0.00 | paid | ZAR |
| inv04 | INV-2025-000004 | pt04 | insurance | 280.00 | 0.00 | 280.00 | draft | ZAR |
| inv05 | INV-2025-000005 | pt05 | self_pay | 2500.00 | 500.00 | 2000.00 | partially_paid | ZAR |

---

## 7. Audit Records (10) — Including Break-Glass

### `tshepo_audit_ledger`
| # | chain_seq | action | actor_id | decision | reason_codes | resource_type | tenant_id | pod_id |
|---|-----------|--------|----------|----------|-------------|--------------|-----------|--------|
| a01 | 1 | patient.access | actor-p01 | ALLOW | [ROLE_MATCH] | Patient | NATIONAL | pod-1 |
| a02 | 2 | clinical.prescribe | actor-p01 | ALLOW | [ROLE_MATCH, LICENSE_VALID] | Medication | NATIONAL | pod-1 |
| a03 | 3 | patient.access | actor-p02 | DENY | [INSUFFICIENT_ROLE] | Patient | NATIONAL | pod-1 |
| a04 | 4 | finance.refund | actor-p08 | ALLOW | [ADMIN_ROLE] | Invoice | NATIONAL | pod-1 |
| a05 | 5 | patient.access | actor-p06 | BREAK_GLASS | [EMERGENCY_OVERRIDE] | Patient | NATIONAL | pod-1 |
| a06 | 6 | offline.entitlement.issued | SYSTEM | SYSTEM | [PDP_ALLOW] | Entitlement | NATIONAL | pod-1 |
| a07 | 7 | offline.entitlement.consumed | SYSTEM | SYSTEM | [CONSUMED] | Entitlement | NATIONAL | pod-1 |
| a08 | 8 | offline.entitlement.revoked | SYSTEM | SYSTEM | [TOKEN_EXPIRED] | Entitlement | NATIONAL | pod-1 |
| a09 | 9 | patient.merge | actor-p08 | ALLOW | [ADMIN_ROLE, SPINE_ONLINE] | Identity | NATIONAL | pod-1 |
| a10 | 10 | clinical.order.place | actor-p01 | ALLOW | [ROLE_MATCH] | Order | NATIONAL | pod-1 |

Each record must have:
- `audit_id`: unique UUID
- `correlation_id`: matching UUID
- `request_id`: matching UUID
- `record_hash`: SHA-256 hex (compute from record fields)
- `prev_hash`: previous record's `record_hash` (null for a01)
- `occurred_at`: staggered timestamps over last 24h

### `trust_layer_break_glass` (1 — the break-glass from a05)
| Field | Value |
|-------|-------|
| user_id | p06's auth UUID |
| subject_cpid | CPID-NAT-000005 |
| justification | "Unconscious trauma patient, no prior care team access" |
| access_scope | EMERGENCY_FULL |
| emergency_type | trauma |
| step_up_method | biometric |
| review_status | pending |
| review_queue_status | queued |
| access_expires_at | +2h from access_started_at |
| audit_ledger_id | a05's UUID |

---

## 8. Offline Entitlements (6) — Covering All States

### `offline_entitlements`
| # | entitlement_id | subject_id | device_id | status | scope | valid_from | valid_to | kid |
|---|---------------|-----------|-----------|--------|-------|-----------|---------|-----|
| oe01 | ent-seed-001 | actor-p01 | dev-001 | ACTIVE | ["clinical.read","clinical.write"] | now-1h | now+5h | kid-seed-001 |
| oe02 | ent-seed-002 | actor-p02 | dev-002 | ACTIVE | ["clinical.read"] | now-2h | now+4h | kid-seed-001 |
| oe03 | ent-seed-003 | actor-p06 | dev-003 | CONSUMED | ["clinical.read","emergency.access"] | now-5h | now+1h | kid-seed-001 |
| oe04 | ent-seed-004 | actor-p09 | dev-004 | REVOKED | ["clinical.read"] | now-6h | now-1h | kid-seed-001 |
| oe05 | ent-seed-005 | actor-p01 | dev-001 | CONSUMED | ["clinical.read"] | now-10h | now-4h | kid-seed-001 |
| oe06 | ent-seed-006 | actor-p07 | dev-005 | ACTIVE | ["clinical.read","midwifery.write"] | now-30m | now+5.5h | kid-seed-001 |

For oe03: `consumed_at` = now-3h, `consumed_meta_json` = `{"action":"emergency.access"}`
For oe04: `revoked_at` = now-2h, `revoke_reason` = "Token expired — auto-revoked"

All use:
- `tenant_id` = `NATIONAL`
- `pod_id` = `pod-1`
- `alg` = `Ed25519`
- `policy_version` = `v1.1.0`

### `trust_layer_offline_tokens` (3)
| # | user_id | status | max_actions | actions_used | expires_at |
|---|---------|--------|-------------|-------------|-----------|
| ot01 | p01 | active | 100 | 12 | now+6h |
| ot02 | p06 | active | 50 | 48 | now+2h |
| ot03 | p09 | revoked | 100 | 5 | now-1h |

For ot03: `revoked_at` = now-2h, `revocation_reason` = "Session ended"

### `trust_layer_offline_cpid` (3)
| # | o_cpid | status | generating_device_id |
|---|--------|--------|---------------------|
| oc01 | O-CPID-PROV-000001 | provisional | dev-001 |
| oc02 | O-CPID-PROV-000002 | reconciled | dev-003 |
| oc03 | O-CPID-PROV-000003 | pending_reconciliation | dev-004 |

For oc02: `reconciled_to_cpid` = `CPID-NAT-000005`, `reconciled_at` = now-1h

---

## 9. TUSO Shifts (2 seed)

### `tuso_shifts`
| # | facility_id | actor_id | status | started_at |
|---|-------------|----------|--------|-----------|
| sh01 | f1 | actor-p01 | ACTIVE | now-2h |
| sh02 | f2 | actor-p05 | ACTIVE | now-4h |

---

## 10. Queue Items (5 seed)

### `queue_definitions` (2)
| # | name | service_type |
|---|------|-------------|
| qd01 | OPD General Queue | outpatient |
| qd02 | Laboratory Queue | laboratory |

### `queue_items`
| # | queue_id | patient_id | status | priority | ticket_number |
|---|---------|-----------|--------|----------|--------------|
| qi01 | qd01 | pt01 | waiting | normal | OPD-001 |
| qi02 | qd01 | pt02 | waiting | urgent | OPD-002 |
| qi03 | qd01 | pt04 | in_service | normal | OPD-003 |
| qi04 | qd02 | pt05 | waiting | stat | LAB-001 |
| qi05 | qd02 | pt09 | completed | normal | LAB-002 |

---

## Seeding Order

Execute inserts in this order to satisfy FK constraints:

1. `butano_tenants` → tenants
2. `tuso_facilities` → facilities
3. `tuso_workspaces` → workspaces
4. auth.users (via Supabase Auth API or `seed-test-users` edge function)
5. `profiles` → linked to auth.users
6. `health_providers` → linked to profiles
7. `user_roles` → admin role for p08
8. `patients` → 20 patients
9. `vito_config` → spine_status
10. `vito_patients` → 20 identity refs
11. `encounters` → active encounters for patients in queue
12. `queue_definitions` → 2 queues
13. `queue_items` → 5 items (triggers auto-generate sequence/ticket)
14. `clinical_orders` → 10 orders
15. `charge_sheets` → 5 charges (needs visits created first)
16. `invoices` → 5 invoices
17. `tshepo_audit_ledger` → 10 audit records (compute hashes)
18. `trust_layer_break_glass` → 1 break-glass event
19. `offline_entitlements` → 6 entitlements
20. `trust_layer_offline_tokens` → 3 tokens
21. `trust_layer_offline_cpid` → 3 O-CPIDs
22. `tuso_shifts` → 2 shifts

---

## Notes

- **No PII in BUTANO**: The `butano_fhir_resources` table uses only CPIDs as `subject_cpid`. Never seed names/IDs there.
- **Hash chain integrity**: Audit records must have valid `prev_hash` → `record_hash` chain. Compute SHA-256 of `JSON.stringify({audit_id, action, actor_id, decision, occurred_at})` for each record.
- **Passwords**: All demo users use `Impilo2025!`. The `seed-test-users` edge function handles this.
- **Timestamps**: Use relative timestamps (`now - Xh`) so seed data always looks fresh.
