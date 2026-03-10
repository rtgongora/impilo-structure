# Golden Path Scripts — Impilo vNext Prototype

> Deterministic click-by-click scripts for the 7 required end-to-end flows.
> Each step includes exact UI labels, expected outcomes, data mutations, and failure points.

---

## Flow 1: Public Landing → Login → ModuleHome

### Preconditions
- No active session (logged out)
- Demo provider accounts seeded (e.g. `sarah.moyo@impilo.health` / `Impilo2025!`)
- Provider Registry records exist for VARAPI IDs (e.g. `VARAPI-2025-ZW000001-A1B2`)

### Steps

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/auth` | Auth page loads. Left panel (hidden on mobile): branded gradient with Impilo logo, "Digital Health Platform" heading, three feature pills ("Patient-Centered", "Secure", "Real-time"), copyright "© 2025 Impilo Health". Right panel: "Welcome back" heading, "Choose your preferred login method" subtitle. |
| 2 | Observe method-select cards | Four cards visible (in order): **"Provider ID & Biometric"** (Fingerprint icon, subtitle "For clinical staff with registered Provider ID"), **"Patient Portal"** (UserCircle icon, subtitle "Access your health records & appointments"), **"Staff Email Login"** (Mail icon, subtitle "For admin and system users"). Fourth card **"System Maintenance"** only visible if URL has `?mode=maintenance`, user pressed `Ctrl+Shift+M`, or (mobile) long-pressed logo ≥1.5s. |
| 3 | Click **"Staff Email Login"** card | View transitions to `email-login`. Shows card with title "Staff Login", fields: Email (text, placeholder none), Password (password with eye toggle), "Sign In" button, "Forgot password?" link, "← Back to login options" link. |
| 4 | Enter `sarah.moyo@impilo.health` in Email, `Impilo2025!` in Password | Fields populated. |
| 5 | Click **"Sign In"** button | `supabase.auth.signInWithPassword()` called. On success: toast **"Welcome back!"** with description "You have been logged in successfully." → `navigate("/")`. |
| 6 | ModuleHome (`/`) loads | Header: Impilo logo left, workspace indicator (if context set), profile avatar dropdown right. Three tabs: **"Work"** (default for providers), **"My Professional"**, **"My Life"**. Work tab shows `WorkplaceSelectionHub` if no active context, or expandable category cards if context is set. |

### Alternative: Provider ID & Biometric Flow

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 3a | Click **"Provider ID & Biometric"** | View → `lookup`. `ProviderIdLookup` component renders. |
| 4a | Enter Provider ID (e.g. `VARAPI-2025-ZW000001-A1B2`) and select facility | Provider found → `handleProviderFound()` sets provider+facility state. View → `biometric`. |
| 5a | Complete biometric simulation in `BiometricAuth` | `handleBiometricVerified(method, confidence)` called. Looks up `profiles` by `provider_registry_id`. View → `workspace`. |
| 6a | `WorkspaceSelection` renders: select Department, Physical Workspace, optional Workstation | User picks department + workspace. |
| 7a | Click submit in WorkspaceSelection | `handleWorkspaceSelected()` → sign in with mapped demo email, store workspace to `sessionStorage('activeWorkspace')`, insert `provider_registry_logs`, toast **"Welcome, {fullName}!"** with description "Logged in to {department} at {workstation\|workspace}", `navigate("/")`. |

### Data Mutations
- `supabase.auth.signInWithPassword()` creates auth session
- Provider flow: `sessionStorage.setItem('activeWorkspace', JSON.stringify({...}))`, insert into `provider_registry_logs`

### Common Failures
- Wrong credentials → toast.error **"Login failed"** with Supabase error description
- Provider ID not found → toast.error **"No user account linked to this Provider ID"**, view resets to `lookup`
- Demo email not in `emailMap` → toast.error **"Demo login not available for this provider"**

---

## Flow 2: Start Shift → Queue → Patient Journey → Start Encounter

### Preconditions
- Logged in as provider (e.g. doctor role)
- Facilities and workspaces configured in `tuso_facilities` / `tuso_workspaces`
- Queue definitions exist in `queue_definitions`
- At least one patient in `queue_items` with status `waiting`

### Steps

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | From ModuleHome Work tab, if `WorkplaceSelectionHub` shown, select a work context (facility) | `useActiveWorkContext` stores selection. Category cards appear. |
| 2 | Find **"Clinical Care"** category, expand it, click **"Patient Queue"** | Navigates to `/queue`. `AppLayout` wraps page with title "Queue Management". |
| 3 | Queue page loads | Header: "Queue Management" (text-sm font-bold), subtitle "Manage patient queues across service points". **"+ Add to Queue"** button (top-right via `AddToQueueDialog`). Six tabs: **Workstation** (default), **Supervisor**, **Bookings**, **Check-In**, **Config**, **Pathways**. |
| 4 | On **Workstation** tab | `QueueWorkstation` component renders. Shows queue selector, list of waiting patients with ticket numbers, priority badges, wait times. |
| 5 | Click **"Call Next"** or select a patient row | Patient called to service. Status updates to `in_service`. `queue_items` row updated, `queue_transitions` row inserted via trigger `queue_item_status_change()`. |
| 6 | Click patient name/row or **"Open Chart"** action | Navigates to `/encounter/{encounterId}?source=queue&queueId={queueId}`. |
| 7 | Encounter page loads | `EHRProvider` + `ProviderContextProvider` wrap content. Since `source=queue`, `isPreAuthorized = true` → no access justification dialog. `EHRLayout` renders with `TopBar`, `PatientBanner`, `EncounterMenu`. |

### Alternative: Start Shift via TUSO Admin

| # | Action | Expected Outcome |
|---|--------|-----------------|
| A1 | Navigate to `/admin/tuso/start-shift` | Page: "Start Shift" heading with Play icon. Facility dropdown populated from `tuso_facilities` (status=ACTIVE). |
| A2 | Select a facility | Workspaces load from `tuso_workspaces` (facility_id match, active=true). Each workspace shown as checkbox row with name + type code. |
| A3 | Check one or more workspaces | `selectedWorkspaces` array updated. |
| A4 | Click **"Start Shift"** button | Insert into `tuso_shifts` (tenant_id, facility_id, actor_id, status=ACTIVE). Insert into `tuso_shift_workspace_assignments` for each selected workspace. Toast **"Shift started"**. Button changes to **"Shift Active"** (disabled, with CheckCircle icon). Active Shifts card appears below. |

### Data Mutations
- `queue_items` status updated → triggers `queue_item_status_change()` which inserts `queue_transitions`, calculates `wait_time_minutes`
- `tuso_shifts` insert, `tuso_shift_workspace_assignments` inserts

### Common Failures
- No workspaces selected → Start Shift button disabled
- No queue items → Workstation shows empty state
- Encounter not found → Error screen: red "!" circle, "Failed to load patient chart", buttons: "Go Back", "Back to Queue", "Go Home"

---

## Flow 3: VITO — Patient Search → Create/Upsert → Merge

### Preconditions
- Logged in with admin or hie_admin role
- `vito_patients` table exists
- `vito_merge_requests` table exists
- `vito_config` table has `spine_status` key for tenant `default-tenant`

### Steps

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | From ModuleHome, expand **"Kernel & Sovereign Registries"**, click **"Client Registry (VITO)"** | Navigates to `/client-registry`. (Full client registry page.) |
| 1a | **Alternative**: Navigate to `/admin/vito/patients` directly | VITO Patients admin page loads. Header: ArrowLeft button → `/admin`, "VITO Patients" heading, subtitle "Identity refs only — no PII stored". |
| 2 | Observe search + table | Card titled "Patient Identity Registry". **"+ Create"** button (top-right). Search input with Search icon. Table columns: Health ID, CRID, CPID, Spine Status, Created. |
| 3 | Type a search term in filter input | Debounced query: `supabase.from('vito_patients').select('*').or('health_id.ilike.%{search}%,crid.ilike.%{search}%,cpid.ilike.%{search}%')`. Table filters live. |
| 4 | Click **"+ Create"** button | Dialog opens. Title: "Create Patient Identity Ref". Fields (in order): **Health ID (opaque)** (text, placeholder "e.g. HID-000123"), **CRID (optional)** (text), **CPID (optional)** (text). **"Create"** button. |
| 5 | Fill Health ID = `HID-TEST-001`, click **"Create"** | `supabase.from('vito_patients').insert({ tenant_id: 'default-tenant', health_id, crid, cpid, created_by: 'admin' })`. On success: toast **"Patient identity ref created"**, dialog closes, query invalidated, table refreshes. |
| 6 | Navigate to `/admin/vito/merges` | VITO Merge Queue page. Header: "VITO Merge Queue", subtitle "Federation-guarded patient merge requests". |
| 7 | Observe spine status | Badge top-right area. If `spine_status !== 'ONLINE'`: amber AlertTriangle banner: **"Federation Authority: Spine is {status}. Merges are blocked until spine is ONLINE."** |
| 8 | Click **"+ New Merge Request"** button | Dialog: "Create Merge Request". Fields: **Survivor Health ID** (text), **Merged Health IDs** (text, comma-separated), **Reason** (textarea). If spine offline → Create button click throws error toast with message `"Merge blocked: spine_status={status}. Federation authority required."` |
| 9 | (If spine ONLINE) Fill fields, click **"Create Merge"** | Insert into `vito_merge_requests` with status `approved`, reviewed_by `admin`. Toast **"Merge request created"**. Table refreshes. |

### Data Mutations
- `vito_patients` insert (create)
- `vito_merge_requests` insert (merge)
- Queries: `vito_config` read for spine_status

### Common Failures
- Spine offline → merge blocked with error toast (Federation Authority Guard)
- Duplicate health_id → Supabase unique constraint error surfaced via `toast.error(e.message)`

---

## Flow 4: OROS — Place Order → Worklist Accept → Post Result → Clinician Acknowledge

### Preconditions
- Logged in (any authenticated user)
- OROS edge function deployed at `{SUPABASE_URL}/functions/v1/oros-v1`
- TSHEPO headers auto-injected by `orosClient` (from localStorage: `oros_tenant_id`, `oros_actor_id`, etc.)

### Steps

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/oros` | Page: "OROS v1.1 — Orders & Results Orchestration" heading with Activity icon + "PII-Minimized" badge. 7 tabs: **Worklists**, **Place Order**, **Order Detail**, **Reconciliation**, **Capabilities**, **Event Log**, **Writeback Intents**. |
| 2 | Click **"Place Order"** tab | Card: "Place New Order", subtitle "CPID-only, PII-minimized". Fields (2-col grid): **Facility ID** (default "FAC-001"), **Patient CPID** (placeholder "CPID-..."), **Type** (select: LAB/IMAGING/PHARMACY/PROCEDURE), **Priority** (select: ROUTINE/URGENT/STAT), **Code System** (default "http://loinc.org"), **Code** (placeholder "2093-3"), **Display** (placeholder "Cholesterol", full-width). **"Place Order"** button (disabled until CPID filled). |
| 3 | Fill: CPID = `CPID-TEST-001`, Type = `LAB`, Code = `2093-3`, Display = `Cholesterol` | Fields populated. |
| 4 | Click **"Place Order"** | `orosClient.placeOrder({...})` → POST to `/v1/orders`. Response shown in `<pre>` block below button. Toast **"Order placed: {order_id}"**. Copy the `order_id`. |
| 5 | Click **"Worklists"** tab | Card: "Department Worklists", subtitle "Actionable orders filtered by facility and type". Fields: **Facility ID** (text), **Type** (select: All/LAB/IMAGING/PHARMACY). **"Load Worklist"** button. |
| 6 | Enter Facility ID = `FAC-001`, Type = `LAB`, click **"Load Worklist"** | `orosClient.getWorklists({...})` called. Table renders with columns: Order ID, Type, Priority, Status, CPID, Placed, Actions. Newly placed order appears with status `PLACED` and two action buttons: **"Accept"** + **"Reject"**. |
| 7 | Click **"Accept"** on the order row | `orosClient.acceptOrder(orderId)` called. Toast **"Order accepted"**. Worklist reloads; order status → `ACCEPTED`. |
| 8 | Click **"Order Detail"** tab | Card: "Order Detail". Field: **Order ID** (text, placeholder "ORD-..."). **"Load"** button. |
| 9 | Enter the order ID from step 4, click **"Load"** | `orosClient.getOrder(orderId)` called. Shows: status badge (`ACCEPTED`), type badge, priority badge, CPID. Sections: **Worksteps** (list of step cards with status + Start/Complete buttons), **Results** ("No results yet." + **"Post Result"** button), **Acknowledgements** (empty list). |
| 10 | (Optional) In Worksteps, click **"Start"** on a pending step | `orosClient.startWorkstep(stepId)`. Toast **"Step started"**. Step status → `IN_PROGRESS`, button changes to **"Complete"**. |
| 11 | (Optional) Click **"Complete"** on in-progress step | `orosClient.completeWorkstep(stepId)`. Toast **"Step completed"**. Step status → `DONE`. |
| 12 | Click **"Post Result"** button | `orosClient.postResult(orderId, { kind: order.type, summary: { note: "Lab result submitted" } })`. Toast **"Result posted"**. Order reloads; results section shows result card with kind badge + timestamp. Order status → `RESULT_AVAILABLE`. |
| 13 | In Acknowledgements section, **"Acknowledge (Clinician)"** button now visible (only when status = `RESULT_AVAILABLE`) | Button rendered. |
| 14 | Click **"Acknowledge (Clinician)"** | `orosClient.ackOrder(orderId, "CLINICIAN", "Reviewed and noted")`. Toast **"Acknowledged"**. Order reloads; ack entry appears: "CLINICIAN by {actor_id} at {timestamp}". |

### Data Mutations
- All via OROS edge function: orders, worksteps, results, acknowledgements stored server-side
- TSHEPO headers injected on every call (tenant, actor, correlation, device fingerprint, purpose)

### Common Failures
- Edge function not deployed → fetch fails → toast.error **"Failed to place order"** / **"Failed to load worklist"** etc.
- Empty CPID → Place Order button disabled
- Order not found → toast.error **"Failed to load order"**

---

## Flow 5: MSIKA — Tariff/Catalog Update Flow

### Preconditions
- Logged in with admin or hie_admin role
- MSIKA Core edge function deployed OR `msika_catalogs`/`msika_items` tables exist
- `msikaCoreCient` SDK imported

### Steps

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/msika-core` | Header: ArrowLeft → `/admin`, "MSIKA Core" heading, "Products & Services Registry" subtitle. 7 tabs (grid layout): **Catalogs**, **Items**, **Search**, **Import**, **Mappings**, **Packs**, **Intents**. |
| 2 | On **Catalogs** tab | Card listing catalogs. **"+ Create Catalog"** button. Each catalog row shows: name, scope (NATIONAL/TENANT), status badge (DRAFT/REVIEW/APPROVED/PUBLISHED), version, actions. |
| 3 | Click **"+ Create Catalog"** | Dialog with fields: **Name** (text), **Scope** (select: NATIONAL/TENANT). **"Create"** button. |
| 4 | Fill Name = `Test Tariff 2027`, Scope = `TENANT`, click **"Create"** | `sdk.createCatalog({...})` called. Toast on success. Dialog closes. Catalog list refreshes with new entry in `DRAFT` status. |
| 5 | Click **"Items"** tab | Items list with search. **"+ Add Item"** button. Table columns depend on implementation but include: name, kind (PRODUCT/SERVICE/etc.), code, amount, status. |
| 6 | Click **"+ Add Item"** | Form/dialog for item creation. Fields include: **Name**, **Kind** (select: PRODUCT/SERVICE/ORDERABLE/CHARGEABLE/CAPABILITY_FACILITY/CAPABILITY_PROVIDER), **Code**, **Amount**, etc. |
| 7 | Fill item details, submit | Item created. Toast confirms. |
| 8 | Return to **Catalogs**, find the catalog, trigger lifecycle action (e.g. "Submit for Review") | Catalog status changes: DRAFT → REVIEW. |
| 9 | (If authorized) Approve → Publish | Status: REVIEW → APPROVED → PUBLISHED. Each transition may require TSHEPO PDP check (Class A consistency for national baseline). |

### Data Mutations
- `msika_catalogs` insert/update
- `msika_items` insert/update
- Catalog lifecycle status transitions
- TSHEPO PDP decision logged for national baseline changes

### Common Failures
- SDK call fails → toast.error with message
- National baseline change without PDP ALLOW → blocked (Class A enforcement)

---

## Flow 6: Offline Entitlements — Issue → Verify → Consume → Revoke

### Surfacing Status
**The offline entitlement lifecycle (issue/verify/consume/revoke) is NOT directly surfaced as a dedicated admin UI page.** The kernel module exists at:
- `src/lib/kernel/offlineEntitlements/issuer.ts` — `issueEntitlement()`
- `src/lib/kernel/offlineEntitlements/verifier.ts` — `verifyEntitlementOffline()`
- `src/lib/kernel/offlineEntitlements/lifecycle.ts` — `revokeEntitlement()`, `consumeEntitlement()`

### What IS surfaced
The **TSHEPO Offline Status** page at `/admin/tshepo/offline` shows:
- **Offline Tokens** tab: table from `trust_layer_offline_tokens` (columns: Token ID, Scope, Status badge [Active/Expired/Revoked], Issued, Expires)
- **O-CPIDs** tab: table from `trust_layer_offline_cpid` (columns: O-CPID, Status badge [Provisional/Reconciled/Pending], Created)
- Stats cards: count of active tokens, provisional O-CPIDs
- **"Queue Reconciliation"** button per provisional O-CPID → updates status to `pending_reconciliation`

### Script (for the surfaced UI)

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/tshepo/offline` | Page: "Offline Trust & Reconciliation" with WifiOff icon. Top-right badges: "{n} Active Tokens", "{n} Provisional O-CPIDs". Three stats cards. Two tabs: **Offline Tokens**, **O-CPIDs**. |
| 2 | View **Offline Tokens** tab | Table from `trust_layer_offline_tokens`. Columns: token fields. Status badges: green "Active" (if not revoked and not expired), red "Revoked", gray "Expired". |
| 3 | View **O-CPIDs** tab | Table from `trust_layer_offline_cpid`. Status badges: amber "Provisional", green "Reconciled", outline "Pending". |
| 4 | Click **"Queue Reconciliation"** on a provisional O-CPID row | `trust_layer_offline_cpid` updated: `status='pending_reconciliation'`, `sync_attempted_at=now()`. Toast **"Reconciliation queued"**. Query invalidated, table refreshes. |

### Not Surfaced
- Direct issuance of Ed25519-signed entitlement JWTs (code-only at `issuer.ts`)
- Offline verification flow (code-only at `verifier.ts`)
- Explicit consume/revoke buttons for entitlements (code-only at `lifecycle.ts`)
- To replicate the full lifecycle, the engineering team should expose these kernel functions via a dedicated admin UI or edge function.

---

## Flow 7: Audit — Open Viewer → Filter → Detail → Export

### Preconditions
- Logged in (authenticated)
- `tshepo_audit_ledger` table has records
- `vito_audit_log` table has records (for VITO audit)

### Script A: TSHEPO Hash-Chained Audit Ledger (`/admin/tshepo/audit`)

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/tshepo/audit` | Page: "TSHEPO Audit Ledger" heading with BookOpen icon + "Hash-Chained" badge (with Link2 icon). |
| 2 | Observe filter controls | Three filters in a row: **Actor ID** (text input with Search icon, placeholder "Filter by Actor ID..."), **Action** (text input, placeholder "Filter by action..."), **Decision** (select: All Decisions / Allow / Deny / Break Glass / System). |
| 3 | Observe table | ScrollArea (h-[600px]). Columns: **#** (chain_sequence), **Time** (occurred_at, locale string), **Actor** (actor_id truncated to 12 chars + "..."), **Action** (font-mono), **Decision** (badge: green "ALLOW" / red "DENY" / amber "BREAK GLASS" / gray secondary for others), **Reason** (reason_codes joined by ", ", truncated), **Resource** (resource_type:resource_id truncated), **Hash** (record_hash truncated to 8 chars + "..."). |
| 4 | Loading state | "Loading audit chain..." centered in table. |
| 5 | Empty state | "No audit records found" centered in table. |
| 6 | Type `DENY` in Actor ID filter | Query re-executes with `eq('actor_id', 'DENY')`. Table filters. |
| 7 | Select **"Break Glass"** from Decision dropdown | Query adds `.eq('decision', 'BREAK_GLASS')`. |
| 8 | Observe pagination | Bottom: "{total} records" left, **"Previous"** + **"Next"** buttons right. Page size = 50. Previous disabled on page 1. |
| 9 | Click **"Next"** | `page` increments. Query range shifts. |

### Script B: VITO Audit Log (`/admin/vito/audit`)

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/vito/audit` | Page: ArrowLeft → `/admin`, "VITO Audit Log" heading, subtitle "Opaque audit entries — no PII". |
| 2 | Observe filter | Search icon + single input (placeholder "Filter by correlation_id, request_id, actor_id, or action..."). |
| 3 | Observe table | Columns: **Action** (font-mono text-xs), **Decision** (badge: red "destructive" if DENY, default otherwise), **Actor** (text-xs), **Resource** (resource_type/resource_id or "—"), **Purpose** (purpose_of_use or "—"), **Created** (locale date string). |
| 4 | Type a correlation_id in filter | Query: `.or('correlation_id.eq.{filter},request_id.eq.{filter},actor_id.ilike.%{filter}%,action.ilike.%{filter}%')`. Table filters live. Limit 100 rows. |
| 5 | Loading state | "Loading..." in single row. |
| 6 | Empty state | "No audit entries" in single row, muted. |

### Export/Download
**NOT SURFACED.** Neither audit viewer has an export/download button. The data is view-only in-browser. To replicate: the engineering team may add a "Download CSV" action.

### Data Mutations
- Read-only queries against `tshepo_audit_ledger` and `vito_audit_log`
- No writes from audit viewer pages

### Common Failures
- Tables not yet created / empty → empty state messages shown
- Query error → React Query error handling (component may show error or empty state)

---

## Appendix: Key Code Pointers

| Flow | Primary Source Files |
|------|---------------------|
| Auth | `src/pages/Auth.tsx`, `src/components/auth/ProviderIdLookup.tsx`, `src/components/auth/BiometricAuth.tsx`, `src/components/auth/WorkspaceSelection.tsx`, `src/components/auth/ClientAuth.tsx`, `src/components/auth/SystemMaintenanceAuth.tsx` |
| Queue | `src/pages/Queue.tsx`, `src/components/queue/QueueWorkstation.tsx`, `src/components/queue/SupervisorDashboard.tsx`, `src/components/queue/AddToQueueDialog.tsx` |
| Encounter | `src/pages/Encounter.tsx`, `src/contexts/EHRContext.tsx`, `src/components/layout/EHRLayout.tsx`, `src/components/ehr/NoPatientSelected.tsx` |
| VITO | `src/pages/admin/VitoPatients.tsx`, `src/pages/admin/VitoMergeQueue.tsx`, `src/pages/admin/VitoEventsViewer.tsx`, `src/pages/admin/VitoAuditViewer.tsx` |
| OROS | `src/pages/admin/OrosAdmin.tsx`, `src/lib/kernel/oros/orosClient.ts` |
| MSIKA | `src/pages/admin/MsikaCoreAdmin.tsx`, `src/lib/kernel/msika-core/msikaCoreCient.ts` |
| Offline | `src/pages/admin/TshepoOfflineStatus.tsx`, `src/lib/kernel/offlineEntitlements/issuer.ts`, `src/lib/kernel/offlineEntitlements/lifecycle.ts`, `src/lib/kernel/offlineEntitlements/verifier.ts` |
| Audit | `src/pages/admin/TshepoAuditSearch.tsx`, `src/pages/admin/VitoAuditViewer.tsx` |
| Shift | `src/pages/admin/TusoStartShift.tsx`, `src/contexts/ShiftContext.tsx`, `src/hooks/useWorkspaceData.ts` |
| ModuleHome | `src/pages/ModuleHome.tsx`, `src/hooks/useUserRoles.ts`, `src/hooks/useActiveWorkContext.ts` |
