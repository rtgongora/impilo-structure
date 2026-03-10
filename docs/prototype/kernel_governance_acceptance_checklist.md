# Kernel & Governance — Acceptance Checklist

> Per-page criteria a replica implementation must satisfy to be considered identical.

---

## TSHEPO Consent Management (`/admin/tshepo/consents`)

- [ ] Page title "TSHEPO Consent Management" with Shield icon
- [ ] "New Consent" button opens Dialog titled "Create FHIR R4 Consent"
- [ ] Dialog fields: Patient CPID, Grantor Reference, Grantee Reference, Purpose of Use (5 options), Provision Type (permit/deny)
- [ ] Submit generates `fhir_id` via `crypto.randomUUID()`, inserts into `tshepo_consents` with `tenant_id: 'default-tenant'`
- [ ] Create button disabled when CPID or grantor empty
- [ ] Table columns: FHIR ID (truncated 20 chars) | Patient CPID | Provision (badge) | Purpose | Status (badge) | Created | Actions
- [ ] Revoke button (destructive, XCircle icon) only visible for `status === 'active'`
- [ ] Revoke sets `status: 'rejected'`, `revoked_at: now`, `revocation_reason: 'Admin revocation'`
- [ ] Search by CPID + Status filter (active/rejected/all), default: active
- [ ] Loading: "Loading...", Empty: "No consents found"
- [ ] Toasts: "Consent revoked", "Revocation failed", "Consent created", "Creation failed"

---

## TSHEPO Audit Ledger (`/admin/tshepo/audit`)

- [ ] Title "TSHEPO Audit Ledger" with BookOpen icon + "Hash-Chained" badge (Link2 icon, outline)
- [ ] 3 filter controls: Actor ID input, Action input, Decision select (All/Allow/Deny/Break Glass/System)
- [ ] Table in ScrollArea h-[600px] with 8 columns: # | Time | Actor | Action | Decision | Reason | Resource | Hash
- [ ] Decision badges: ALLOW=green, DENY=destructive, BREAK_GLASS=amber, other=secondary
- [ ] Hash column shows first 8 chars with full hash in title attribute
- [ ] Pagination: 50 per page, "{total} records" footer, Previous/Next buttons
- [ ] Queries `tshepo_audit_ledger` ordered by `chain_sequence DESC`

---

## Break-Glass Access (`/admin/tshepo/breakglass`)

- [ ] Title "Break-Glass Access" with Zap icon (amber) + pending count badge (destructive)
- [ ] 2 tabs: "Review Queue ({count})" and "History"
- [ ] Review Queue: each pending item as Card with amber border, showing emergency_type, CPID, actor, time, expiry, justification
- [ ] 3 review action buttons: Approve (green), Flag for Review (orange outline), Violation (destructive)
- [ ] Each has Textarea for review notes
- [ ] History tab: Table with 7 columns, status badges (pending_review/approved/flagged/violation)
- [ ] Queries `trust_layer_break_glass` table
- [ ] Review updates `review_queue_status`, `review_outcome`, `reviewed_at`, `review_notes`

---

## My Access History (`/admin/tshepo/access-history`)

- [ ] Title "My Access History" with Eye icon
- [ ] Description text about transparency and redaction
- [ ] CPID input, query only fires when truthy
- [ ] Table: Date | Accessor Role | Facility | Action | Purpose | Decision | Notes
- [ ] Break-glass rows highlighted with `bg-amber-500/5` + amber "Emergency" badge
- [ ] Redacted entries show "Redacted" badge with Shield icon
- [ ] Pagination: 20 per page, conditional footer
- [ ] Queries `tshepo_patient_access_log` — limited column select (no PII)

---

## Offline Trust & Reconciliation (`/admin/tshepo/offline`)

- [ ] Title "Offline Trust & Reconciliation" with WifiOff icon
- [ ] Top-right badges: "{n} Active Tokens" + "{n} Provisional O-CPIDs"
- [ ] 3 stat cards: Active Offline Tokens, Awaiting Reconciliation (amber), Reconciled O-CPIDs (green)
- [ ] 2 tabs: "O-CPIDs ({count})" and "Offline Tokens ({count})"
- [ ] O-CPID table: O-CPID | Status | Facility | Created | Reconciled CPID | Actions
- [ ] Reconcile button only for `status === 'provisional'`, sets `status: 'pending_reconciliation'`
- [ ] Tokens table: Token (hash truncated 12) | Status (computed: revoked/expired/active) | Facility | Scope | Actions Used ({used}/{max}) | Issued | Expires
- [ ] Queries `trust_layer_offline_tokens` and `trust_layer_offline_cpid`

---

## VITO Patients (`/admin/vito/patients`)

- [ ] Title "VITO Patients" + subtitle "Identity refs only — no PII stored"
- [ ] Back button navigates to `/admin`
- [ ] Search by health_id, crid, cpid (ilike with OR)
- [ ] Table: Health ID | CRID | CPID | Status | Created — null values show "—"
- [ ] Create dialog: Health ID (required), CRID (optional), CPID (optional)
- [ ] Inserts into `vito_patients` with `tenant_id: 'default-tenant'`

---

## VITO Merge Queue (`/admin/vito/merges`)

- [ ] Title "VITO Merge Queue" + subtitle "Federation-guarded patient merge requests"
- [ ] Spine Status banner: reads `vito_config` table, shows spine_status + emit_mode
- [ ] When spine offline: destructive border, AlertTriangle, "Merges blocked" text, "New Merge" button disabled
- [ ] Federation guard: merge creation throws error if `spine_status !== 'ONLINE'`
- [ ] Create merge: Survivor Health ID, Merged IDs (comma-separated), Reason (textarea) — all required
- [ ] Table: Survivor | Merged IDs | Status | Reason | Requested By | Created

---

## VITO Events (`/admin/vito/events`)

- [ ] Title "VITO Events" + subtitle "v1.1 event envelope viewer"
- [ ] Filter by correlation_id, request_id, or event_type
- [ ] Table: Event Type (badge) | Subject | Producer | Schema V | Actor | Occurred | detail button
- [ ] Detail dialog: full JSON in `<pre>` block (max-w-2xl, max-h-[80vh])

---

## VITO Audit Log (`/admin/vito/audit`)

- [ ] Title "VITO Audit Log" + subtitle "Opaque audit entries — no PII"
- [ ] Filter by correlation_id, request_id, actor_id, action
- [ ] Table: Action | Decision (badge) | Actor | Resource | Purpose | Created

---

## BUTANO — CPID Timeline (`/admin/butano/timeline`)

- [ ] CPID input + resource type filter (9 FHIR types + "All Types") + Search button
- [ ] Results as cards with resource_type, fhir_id, encounter_id, last_updated_at
- [ ] Provisional resources: yellow border + "Provisional" badge with AlertTriangle
- [ ] Summary text: "Showing {n} of {total} records for {CPID}"
- [ ] Queries `butano_fhir_resources` with tenant_id + subject_cpid filters

---

## BUTANO — IPS Viewer (`/admin/butano/ips`)

- [ ] CPID input + "Generate IPS" button
- [ ] 8-tab section display: Allergies, Problems, Medications, Immunizations, Vitals, Labs, Procedures, Care Plans
- [ ] Each tab has icon + label + count badge
- [ ] Vitals vs Labs split by `category[0].coding[0].code` (vital-signs vs laboratory)
- [ ] Each resource shown as raw FHIR JSON in `<pre>` block

---

## BUTANO — Visit Summary (`/admin/butano/visit-summary`)

- [ ] Encounter ID input + "Fetch Summary" button
- [ ] Encounter resource shown separately in card with `<pre>` JSON
- [ ] Linked resources shown as cards with resource_type badge + JSON

---

## BUTANO — Reconciliation Queue (`/admin/butano/reconciliation`)

- [ ] O-CPID → CPID input pair + "Start Reconciliation" button
- [ ] Reconciliation process: insert job → rewrite all matching FHIR resources → update job
- [ ] Each rewritten resource: `subject_cpid` updated, `is_provisional: false`, meta tag added
- [ ] Jobs list as cards with status icon (green/red/yellow) + from→to + timestamp + status badge
- [ ] Toast: "Reconciled {n} records from {O-CPID} → {CPID}"

---

## BUTANO — SHR Stats (`/admin/butano/stats`)

- [ ] 3 stat cards: Total Resources, Resource Types count, PII Violations count
- [ ] Resources by Type: sorted by count descending, each showing type name + last updated + count badge
- [ ] PII Violation Log: shown only if violations exist, destructive title, shows violation_type, resource_type, paths, timestamp
- [ ] Refresh button reloads both datasets

---

## ZIBO Terminology Governance (`/admin/zibo`)

- [ ] 6 tabs: Artifacts, Import, Packs, Assignments, Logs, Dev
- [ ] Artifact lifecycle: DRAFT → PUBLISHED → DEPRECATED → RETIRED with color-coded badges
- [ ] 8 FHIR types in artifact creation: CodeSystem, ValueSet, ConceptMap, NamingSystem, StructureDefinition, ImplementationGuide, Bundle, Parameters
- [ ] Import: FHIR Bundle JSON + CSV codelist with optional ValueSet creation
- [ ] Packs: CRUD + publish DRAFT packs
- [ ] Assignments: scope type (TENANT/FACILITY/WORKSPACE) + policy mode (STRICT/LENIENT)
- [ ] All calls via `ziboClient` → `zibo-v1` edge function

---

## MSIKA Core Products & Tariff Registry (`/admin/msika-core`)

- [ ] 7 tabs: Catalogs, Items, Search, Import, Mappings, Packs, Intents
- [ ] Catalog lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED
- [ ] 6 item kinds with distinct icons: PRODUCT, SERVICE, ORDERABLE, CHARGEABLE, CAPABILITY_FACILITY, CAPABILITY_PROVIDER
- [ ] CSV import with job stats (total, invalid, deduped, pending_review)
- [ ] Mapping queue with Approve/Reject actions
- [ ] All calls via `msikaCoreCient` SDK → `msika-core-v1` edge function

---

## MUSHEX Payment Switch Console (`/admin/mushex`)

- [ ] Title "MUSHEX v1.1 Console" (text-3xl) with DollarSign icon
- [ ] Step-Up Mode toggle in header — affects all operations
- [ ] STEP_UP_REQUIRED error handling with specific message
- [ ] 6 tabs: Payments, Remittance, Claims, Settlements, Ops/Fraud, Ledger
- [ ] Payment adapters: SANDBOX, MOBILE_MONEY, BANK_TRANSFER, CARD
- [ ] Remittance: Issue Slip + Claim (intent_id + token + OTP)
- [ ] Settlements: date range picker + Release Payouts (step-up required)
- [ ] Response JSON displayed in `<pre>` block (max-h-96)
- [ ] All calls via `mushexClient` → `mushex-v1` edge function with TSHEPO headers
