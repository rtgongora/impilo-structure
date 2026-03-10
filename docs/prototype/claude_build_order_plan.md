# Impilo vNext — Claude Build Order Plan

> **Purpose**: Deterministic build sequence for replicating the Impilo vNext prototype. Follow phases in order — each phase's outputs are inputs to the next.
>
> **Authority**: This plan references exact routes, components, and data from the prototype docs suite. Do not invent.

---

## Table of Contents

- [A. Build Phases](#a-build-phases)
- [B. Per-Phase Details](#b-per-phase-details)
- [C. No Guessing Rules](#c-no-guessing-rules)
- [D. Risk List](#d-risk-list)
- [E. Final Acceptance Gate](#e-final-acceptance-gate)

---

## A. Build Phases

| Phase | Name | Depends On | Deliverables |
|-------|------|-----------|--------------|
| 0 | Repo Scaffold + Tooling | — | Vite + React 19 + Tailwind + shadcn/ui + Supabase client |
| 1 | App Shell + Routing + Nav Guards | 0 | All 98 routes, 2 layouts, `ProtectedRoute`, 404 |
| 2 | Shared UI Primitives + Design Tokens | 0 | `index.css` tokens, shadcn components, shared components |
| 3 | Auth Flows | 1, 2 | 4 login pathways, password reset, `AuthContext` |
| 4 | Work Zone Core (Shift, Workspace) | 3 | ModuleHome, shift start, workspace context, facility selection |
| 5 | Registries Zone | 2, 4 | `/client-registry`, `/hpr`, `/facility-registry` |
| 6 | Clinical Pages | 4 | EHRLayout, encounter, queue, beds, orders, pharmacy, LIMS, PACS |
| 7 | Kernel / Governance / Admin | 2, 4 | All `/admin/*` routes (30+), governance pages (4), admin pages |
| 8 | Data + API Wiring | 1–7 | Supabase schema, RPC functions, edge functions, RLS |
| 9 | Seed Fixtures + Demo Verification | 8 | Deterministic dataset per `seed_fixtures_spec.md` |
| 10 | Golden Path Verification | 9 | All 7 flows pass, acceptance checklist green |

---

## B. Per-Phase Details

### Phase 0: Repo Scaffold + Tooling

**Inputs**: None

**Outputs**:
- `package.json` with exact dependency versions from prototype (React 19, Vite, Tailwind, `@supabase/supabase-js ^2.89.0`, `framer-motion`, `recharts`, `lucide-react ^0.462.0`, `react-router-dom ^6.30.1`, `@tanstack/react-query ^5.83.0`, `date-fns ^3.6.0`, `zod ^3.25.76`, `sonner ^1.7.4`, `react-resizable-panels`, `embla-carousel-react`, `html5-qrcode`, `cmdk`, `vaul`, etc.)
- shadcn/ui components installed (all Radix primitives listed in prototype deps)
- `tsconfig.json` with `@/` path alias → `src/`
- `vite.config.ts` with React plugin + PWA plugin
- `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- `src/integrations/supabase/client.ts` configured

**Verification**: `npm run dev` starts without errors. Empty app renders.

**Gate**: Dev server runs, TypeScript compiles, Tailwind classes apply.

---

### Phase 1: App Shell + Routing + Nav Guards

**Inputs**: Phase 0 scaffold

**Outputs**:
- `src/App.tsx` with all 98 routes from `site_map.md`
- `src/components/layout/AppLayout.tsx` — sidebar + header + main
- `src/components/layout/EHRLayout.tsx` — TopBar + PatientBanner + MainWorkArea + EncounterMenu
- `src/components/layout/AppSidebar.tsx` — 10 page contexts (home, clinical, operations, scheduling, registry, portal, public-health, coverage, ai, omnichannel, admin)
- `src/components/layout/AppHeader.tsx` — title, home/back, PatientSearch, FacilitySelector, ActiveWorkspaceIndicator, notifications
- `src/components/auth/ProtectedRoute.tsx` — redirects unauthenticated to `/auth`
- `src/pages/NotFound.tsx` — catch-all 404
- Stub page components for every route (render page name + "Coming soon" if not yet built)

**Pages completed**: None fully — all are stubs.

**Verification**: 
- Navigate to every route listed in `site_map.md` — no 404 except `*`
- Unauthenticated users redirect to `/auth` for protected routes
- Public routes (`/auth`, `/portal`, `/install`, `/kiosk`, `/catalogue`, `/marketplace`, `/shared/:type/:token`) load without auth
- `/encounter` and `/encounter/:id` use `EHRLayout`; all others use `AppLayout`
- ModuleHome `/` uses custom layout (no AppSidebar)

**Gate**: All 98 routes resolve. Layout switching works. Nav guard redirects work.

---

### Phase 2: Shared UI Primitives + Design Tokens

**Inputs**: Phase 0 scaffold

**Outputs**:
- `src/index.css` — HSL design tokens: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--card`, `--popover`, `--sidebar-*`, `--critical` (for EHR critical event mode), dark mode variants
- `tailwind.config.ts` — all tokens mapped to Tailwind classes
- shadcn component customizations (Button, Card, Dialog, Table, Tabs, Badge, Toast, ScrollArea, Select, Input, Textarea, etc.)
- Shared components from `component_inventory.md`:
  - `NavLink` — styled nav wrapper
  - `WorkspaceSelector` — used in sidebar
  - `FacilitySelector` — used in header
  - `ActiveWorkspaceIndicator` — compact/full variants
  - `PatientSearch` — command palette search
  - `VoiceCommandButton`
  - `HandoffNotifications`

**Verification**: Components render with correct tokens in both light/dark mode. No hardcoded colors in component files.

**Gate**: Design system renders consistently. All shared components importable.

---

### Phase 3: Auth Flows

**Inputs**: Phase 1 (routes), Phase 2 (UI primitives)

**Outputs**:
- `src/contexts/AuthContext.tsx` — `user`, `session`, `profile`, `loading`, `signUp`, `signIn`, `signOut`, `refreshProfile`
- `src/pages/Auth.tsx` — split-layout with 4 login pathways:
  1. **Provider ID & Biometric** — `ProviderIdLookup` → `BiometricAuth` → `WorkspaceSelection`
  2. **Patient Portal** — client/member login
  3. **Staff Email Login** — email + password form
  4. **System Maintenance** — hidden (URL `?mode=maintenance`, `Ctrl+Shift+M`, mobile long-press ≥1.5s)
- `src/pages/ForgotPassword.tsx` — `resetPasswordForEmail` with `redirectTo`
- `src/pages/ResetPassword.tsx` — `updateUser({ password })`, checks `type=recovery` in hash
- Auth sub-components:
  - `src/components/auth/ProviderIdLookup.tsx`
  - `src/components/auth/BiometricAuth.tsx`
  - `src/components/auth/WorkspaceSelection.tsx`
- Session tracking: `user_sessions` table insert on SIGNED_IN, update every 5 min, end on SIGNED_OUT
- Login attempt tracking via edge function `track-login-attempt`
- `profiles` table fetch on auth state change

**Pages completed**: `/auth`, `/forgot-password`, `/reset-password`

**Golden paths runnable**: Flow 1 (Public → Login → ModuleHome) — steps 1–6 and alternative 3a–7a

**Verification**:
- Email login: enter credentials → toast "Welcome back!" → navigate to `/`
- Provider ID flow: enter VARAPI ID → biometric sim → workspace select → toast "Welcome, {name}!" → navigate to `/`
- Wrong credentials: toast.error "Login failed"
- Locked account: toast with lock message
- Forgot password sends reset email
- `/reset-password` updates password on recovery token

**Gate**: All 4 login pathways functional. Auth state persists across refresh. `ProtectedRoute` works.

---

### Phase 4: Work Zone Core (Shift, Workspace, ModuleHome)

**Inputs**: Phase 3 (auth)

**Outputs**:
- `src/pages/ModuleHome.tsx` — 3-tab hub (Work / My Professional / My Life)
  - Work tab: `WorkplaceSelectionHub` (no context) or category cards (with context)
  - My Professional tab: CPD, credentials, affiliations, schedule
  - My Life tab: personal health, social, portal
  - Floating Emergency Button (fixed bottom-6 right-6)
- Context providers:
  - `src/contexts/WorkspaceContext.tsx` — active workspace, facility
  - `src/contexts/ShiftContext.tsx` — active shift state
  - `src/contexts/FacilityContext.tsx` — selected facility
- `sessionStorage` key: `activeWorkspace` — JSON with `{ facilityId, workspaceId, workspaceName, department, workstation }`
- Shift start flow (TUSO): facility select → workspace select → start shift → `shifts` table insert
- Pages:
  - `src/pages/Dashboard.tsx` — personal clinical dashboard
  - `src/pages/ProfileSettings.tsx` — `/profile`
  - `src/pages/HelpDesk.tsx` — `/help`

**Pages completed**: `/` (ModuleHome), `/dashboard`, `/profile`, `/help`

**Golden paths runnable**: Flow 2 steps 1–2 (ModuleHome → select context → navigate to queue)

**Verification**:
- ModuleHome renders 3 tabs
- Work tab shows `WorkplaceSelectionHub` when no active context
- Selecting facility stores to `sessionStorage`
- Sidebar context updates based on URL
- Emergency button visible on ModuleHome

**Gate**: Workspace context flows through app. Shift start works. ModuleHome fully interactive.

---

### Phase 5: Registries Zone

**Inputs**: Phase 2 (UI), Phase 4 (workspace context)

**Outputs**:
- `src/pages/ClientRegistry.tsx` — `/client-registry` — VITO client registry search, health ID generation
- `src/pages/HealthProviderRegistry.tsx` — `/hpr` — VARAPI provider search
- `src/pages/FacilityRegistry.tsx` — `/facility-registry` — TUSO facility browser
- `src/pages/RegistryManagement.tsx` — `/registry-management` — HIE management
- `src/pages/IdServices.tsx` — `/id-services` — ID generation, validation, recovery
- Sidebar context: `registry` — triggered by `/facility-registry`, `/hpr`, `/client-registry`

**Pages completed**: `/client-registry`, `/hpr`, `/facility-registry`, `/registry-management`, `/id-services`

**Verification**:
- Sidebar switches to "Registry" context on these routes
- Client registry search queries `client_registry` table
- Health ID generation calls `generate_health_id()` RPC
- Provider registry search queries `health_providers` table

**Gate**: All 5 registry pages render with correct data queries.

---

### Phase 6: Clinical Pages

**Inputs**: Phase 4 (shift/workspace), Phase 2 (UI)

**Outputs**:
- **EHR (Encounter)**:
  - `src/contexts/EHRContext.tsx` — encounter state, active section, critical event, workspace
  - `src/pages/Encounter.tsx` — wraps `EHRProvider` + `EHRLayout`
  - `src/components/layout/TopBar.tsx` — 10 action buttons, CriticalEventButton, CDSAlertBadge, AIDiagnosticAssistant
  - `src/components/layout/EncounterMenu.tsx` — 8 clinical documentation sections
  - `src/components/layout/MainWorkArea.tsx` — renders active section/workspace/panel
  - `src/components/ehr/PatientBanner.tsx` — demographics, alerts, episodes
  - All encounter section components (History, Examination, Assessment, Plan, Notes, Vitals, Medications, Allergies, etc.)
- **Queue**: `src/pages/Queue.tsx` — `/queue` — patient worklist, ticket system, queue metrics
- **Beds**: `src/pages/Beds.tsx` — `/beds` — ward map, bed status
- **Patients**: `src/pages/Patients.tsx` — `/patients` — patient search/registry
- **Sorting**: `src/pages/PatientSorting.tsx` — `/sorting` — triage
- **Discharge**: `src/pages/Discharge.tsx` — `/discharge` — discharge workflow with clearances
- **Handoff**: `src/pages/Handoff.tsx` — `/handoff` — shift handoff reports
- **Communication**: `src/pages/Communication.tsx` — `/communication` — messages, pages, calls
- **Orders**: `src/pages/Orders.tsx` — `/orders` — clinical order entry
- **Pharmacy**: `src/pages/Pharmacy.tsx` — `/pharmacy` — dispensing
- **LIMS**: `src/pages/LIMS.tsx` — `/lims` — lab information
- **PACS**: `src/pages/PACS.tsx` — `/pacs` — radiology imaging (uses `@cornerstonejs/dicom-image-loader`, `dicom-parser`)
- **Telemedicine**: `src/pages/Telemedicine.tsx` — `/telemedicine`
- **Scheduling cluster**:
  - `src/pages/Appointments.tsx` — `/appointments`
  - `src/pages/AppointmentScheduling.tsx` — `/scheduling`
  - `src/pages/TheatreScheduling.tsx` — `/scheduling/theatre`
  - `src/pages/ProviderNoticeboard.tsx` — `/scheduling/noticeboard`
  - `src/pages/ResourceCalendar.tsx` — `/scheduling/resources`
  - `src/pages/Theatre.tsx` — `/theatre`
  - `src/pages/Registration.tsx` — `/registration`
- **Operations cluster**:
  - `src/pages/Stock.tsx` — `/stock`
  - `src/pages/Consumables.tsx` — `/consumables`
  - `src/pages/Charges.tsx` — `/charges`
  - `src/pages/Operations.tsx` — `/operations`
- **Finance**:
  - `src/pages/Payments.tsx` — `/payments`
- **Marketplace**:
  - `src/pages/PrescriptionFulfillment.tsx` — `/fulfillment`
  - `src/pages/VendorPortal.tsx` — `/vendor-portal`

**Pages completed**: 30+ clinical/work pages

**Golden paths runnable**:
- Flow 2 (full): Shift → Queue → Patient → Encounter
- Flow 4 (OROS): Place order → worklist → result → acknowledge

**Verification**:
- `/encounter` uses `EHRLayout` (no sidebar), all other clinical pages use `AppLayout`
- Critical event mode adds `ring-4 ring-critical` border
- Queue ticket generation works
- Encounter menu has 8 sections
- TopBar shows 10 action buttons

**Gate**: EHR encounter fully navigable. Queue→Encounter flow works end-to-end.

---

### Phase 7: Kernel / Governance / Admin

**Inputs**: Phase 2 (UI), Phase 4 (workspace)

**Outputs** (per `kernel_governance_acceptance_checklist.md` and `site_map.md`):

**TSHEPO Trust Layer** (5 pages):
- `/admin/tshepo/consents` — TshepoConsentAdmin
- `/admin/tshepo/audit` — TshepoAuditSearch (hash-chained ledger, 50/page pagination)
- `/admin/tshepo/breakglass` — TshepoBreakGlass (review queue + history tabs)
- `/admin/tshepo/access-history` — TshepoPatientAccessHistory
- `/admin/tshepo/offline` — TshepoOfflineStatus (O-CPIDs + tokens tabs)

**VITO** (4 pages):
- `/admin/vito/patients` — VitoPatients (identity refs only, no PII)
- `/admin/vito/merges` — VitoMergeQueue
- `/admin/vito/events` — VitoEventsViewer
- `/admin/vito/audit` — VitoAuditViewer

**TUSO** (6 pages):
- `/admin/tuso/facilities` — TusoFacilities
- `/admin/tuso/workspaces` — TusoWorkspaces
- `/admin/tuso/start-shift` — TusoStartShift
- `/admin/tuso/resources` — TusoResources
- `/admin/tuso/config` — TusoConfig
- `/admin/tuso/control-tower` — TusoControlTower

**VARAPI** (5 pages):
- `/admin/varapi/providers` — VarapiProviders
- `/admin/varapi/privileges` — VarapiPrivileges
- `/admin/varapi/councils` — VarapiCouncils
- `/admin/varapi/tokens` — VarapiTokens
- `/admin/varapi/portal` — VarapiPortal

**BUTANO** (5 pages):
- `/admin/butano/timeline` — ButanoTimeline (CPID-only, no PII)
- `/admin/butano/ips` — ButanoIPS
- `/admin/butano/visit-summary` — ButanoVisitSummary
- `/admin/butano/reconciliation` — ButanoReconciliation
- `/admin/butano/stats` — ButanoStats

**Suite** (2 pages): `/admin/suite/docs`, `/admin/suite/portal`

**PCT** (2 pages): `/admin/pct/work`, `/admin/pct/control-tower`

**Single-page kernel admins** (10 pages): `/admin/zibo`, `/admin/oros`, `/admin/pharmacy`, `/admin/inventory`, `/admin/msika-core`, `/admin/msika-flow`, `/admin/costa`, `/admin/mushex`, `/admin/indawo`, `/admin/ubomi`

**Other admin**: `/admin` (AdminDashboard), `/admin/product-registry`

**Governance** (4 pages):
- `/public-health` — PublicHealthOps
- `/coverage` — CoverageOperations
- `/ai-governance` — AIGovernance
- `/omnichannel` — OmnichannelHub

**Ops/Admin** (6 pages):
- `/above-site` — AboveSiteDashboard
- `/reports` — Reports
- `/odoo` — Odoo
- `/workspace-management` — WorkspaceManagement
- `/landela` — Landela
- `/registry-management` (already in Phase 5)

**Public pages** (5 pages):
- `/portal` — Portal
- `/install` — Install (PWA)
- `/kiosk` — Kiosk
- `/catalogue` — ProductCatalogue
- `/marketplace` — HealthMarketplace
- `/shared/:type/:token` — SharedSummary

**My Life**: `/social` — Social

**Pages completed**: All remaining pages (50+ pages)

**Golden paths runnable**:
- Flow 3 (VITO search/upsert/merge)
- Flow 5 (MSIKA tariff update)
- Flow 6 (Offline entitlements — monitoring surfaces)
- Flow 7 (Audit viewer)

**Verification per checklist**:
- TSHEPO audit ledger: hash column shows first 8 chars, decision badges color-coded
- VITO patients: subtitle "Identity refs only — no PII stored"
- BUTANO timeline: CPIDs only, never patient names
- Break-glass: pending count badge, 3 review actions

**Gate**: Every `/admin/*` route renders per `kernel_governance_acceptance_checklist.md`. All governance pages render.

---

### Phase 8: Data + API Wiring

**Inputs**: All page phases (1–7)

**Outputs**:
- **Database schema** via migrations (per `data_dictionary.md`):
  - Core: `profiles`, `user_sessions`, `account_lockouts`, `user_roles`
  - Clinical: `patients`, `encounters`, `visits`, `clinical_orders`, `prescriptions`, `queue_definitions`, `queue_items`, `beds`, `care_plans`, `clinical_documents`
  - Registries: `client_registry`, `health_providers`, `provider_licenses`, `provider_affiliations`, `facilities`, `workspaces`, `workspace_memberships`
  - TSHEPO: `tshepo_audit_ledger`, `tshepo_consents`, `trust_layer_break_glass`, `trust_layer_offline_tokens`, `trust_layer_offline_cpid`, `tshepo_patient_access_log`, `trust_layer_consent`, `trust_layer_identity_mapping`
  - VITO: `vito_patients`, `vito_merge_queue`, `vito_events`
  - BUTANO: `butano_fhir_resources`, `butano_document_references`, `butano_reconciliation_queue`, `butano_subject_mappings`, `butano_outbox_events`, `butano_pii_violations`, `butano_tenant_config`, `butano_tenants`
  - Finance: `charge_sheets`, `invoices`, `payments`, `billing_adjustments`, `visit_financial_accounts`, `bed_day_costs`
  - Scheduling: `shifts`, `shift_definitions`, `shift_assignments`, `roster_plans`, `appointments`, `appointment_waitlist`, `theatre_bookings`
  - Operations: `stock_items`, `stock_transactions`, `consumables`
  - Marketplace: `fulfillment_requests`, `vendor_bids`, `vendors`, `vendor_ratings`, `bid_notifications`
  - Social: `posts`, `communities`, `clubs`, `crowdfunding_campaigns`
  - Above-site: `above_site_roles`, `above_site_sessions`, `above_site_audit_log`, `above_site_interventions`, `jurisdiction_assignments`
  - CRVS: `birth_notifications`, `death_notifications`
  - Offline: `offline_entitlements`

- **RLS policies**: Per `data_dictionary.md` — authenticated access, role-based filtering via `has_role()`, `has_platform_role()`, `is_licensed_practitioner()`, `can_access_workspace()`, `can_access_patient()`

- **RPC functions** (per `api_surface_map.md`):
  - `generate_impilo_id()`, `generate_health_id()`, `generate_provider_registry_id()`, `generate_facility_registry_id()`
  - `tshepo_next_chain_sequence()`, `tshepo_last_audit_hash()`
  - `get_provider_facilities()`, `get_user_workspaces()`, `get_active_shift()`, `get_queue_metrics()`
  - `check_provider_eligibility()`, `trust_layer_resolve_clinical()`, `trust_layer_resolve_registry()`
  - `get_above_site_roles()`, `get_jurisdiction_scope()`, `can_access_facility_in_jurisdiction()`

- **Edge functions**:
  - `track-login-attempt` — account lockout logic
  - `geolocate-ip` — session geolocation
  - `oros-v1` — order processing
  - `zibo-v1` — terminology service

- **Triggers** (from schema):
  - `auto_generate_upid` on `health_providers`
  - `auto_generate_health_id` on `client_registry`
  - `queue_item_before_insert` — sequence + ticket generation
  - `visit_before_insert` — visit number generation
  - `update_vendor_rating`, `update_post_counts`, `update_community_member_count`
  - `log_provider_state_transition`, `log_client_state_transition`
  - `emit_client_registry_event`
  - `create_discharge_clearances` on discharge case insert

**Verification**:
- Every page query resolves against the schema
- RPC functions return correct shapes
- Edge functions deploy and respond
- RLS blocks unauthenticated access to protected tables

**Gate**: All API calls from `api_surface_map.md` work. No TypeScript type errors against schema.

---

### Phase 9: Seed Fixtures + Demo Verification

**Inputs**: Phase 8 (schema)

**Outputs** (per `seed_fixtures_spec.md`):
- **Execution order** (22 steps to satisfy FK constraints):
  1. `facilities` (4 records)
  2. `workspaces` (8 records)
  3. Auth users (10 providers via `supabase.auth.admin.createUser`)
  4. `profiles` (10 records)
  5. `health_providers` (10 records)
  6. `provider_licenses` (10 records)
  7. `provider_affiliations` (10 records)
  8. `workspace_memberships` (mappings)
  9. `patients` (20 records)
  10. `client_registry` (20 records)
  11. `vito_patients` (20 records with CPID/CRID)
  12. `trust_layer_identity_mapping` (20 records)
  13. `queue_definitions` (per facility)
  14. `queue_items` (sample waiting patients)
  15. `encounters` + `visits` (sample)
  16. `clinical_orders` (10 orders: 4 lab, 3 imaging, 3 pharmacy, various states)
  17. `charge_sheets` + `invoices` + `payments` (10 billing records)
  18. `tshepo_audit_ledger` (10 hash-chained records including break-glass)
  19. `tshepo_consents` (sample)
  20. `offline_entitlements` (6 records: 2 active, 1 consumed, 1 expired, 1 revoked, 1 pending)
  21. `trust_layer_offline_tokens` + `trust_layer_offline_cpid` (samples)
  22. `butano_fhir_resources` (CPID-keyed, no PII)

- **Tenants**: `spine-national` (National Spine), `private-pod-01` (Private Pod)
- **Facilities**: Mbare Clinic, Harare District Hospital, Parirenyatwa Provincial, MediPrivate

**Verification**:
- Every page that reads data shows populated content (not empty states)
- Queue page shows waiting patients
- Audit ledger shows 10 records with valid hash chain
- VITO patients show identity refs without PII
- BUTANO resources keyed by CPID

**Gate**: All pages render with realistic demo data. No empty states on core pages.

---

### Phase 10: Golden Path Verification + Acceptance

**Inputs**: Phases 1–9 complete

**Outputs**:
- All 7 golden path flows from `golden_path_scripts.md` pass:
  1. ✅ Public → Login → ModuleHome
  2. ✅ Shift start → Queue → Patient → Encounter
  3. ✅ VITO patient search → upsert → merge
  4. ✅ OROS order → worklist → result → acknowledge
  5. ✅ MSIKA tariff update
  6. ✅ Offline entitlement monitoring
  7. ✅ Audit viewer filter → detail → export
- Kernel acceptance checklist from `kernel_governance_acceptance_checklist.md` — all items checked
- Global acceptance criteria from `claude_replication_master_brief.md` §10 — all items checked

**Gate**: Replica declared complete.

---

## C. No Guessing Rules

1. **UI strings are sacred.** If the prototype shows `"Welcome back!"` as a toast, the replica must show `"Welcome back!"` — not `"Welcome!"` or `"Logged in"`.

2. **Every route must exist.** All 98 routes from `site_map.md` must resolve. If a page has no data, show the correct empty state — never a blank page or generic placeholder.

3. **Data-dependent pages use seed fixtures.** If `/queue` needs `queue_items`, the seed must provide them. If it doesn't, the build is incomplete.

4. **API calls must be deterministic stubs until wired.** Before Phase 8, any Supabase call should return mock data matching the exact shape from `types.ts`. After Phase 8, real queries replace stubs. Never return `undefined` or skip the call.

5. **Layout assignment is non-negotiable.**
   - `/encounter` and `/encounter/:id` → `EHRLayout`
   - `/` (ModuleHome) → custom layout (no sidebar)
   - All other protected routes → `AppLayout`
   - Public routes → no layout wrapper or minimal public layout

6. **Sidebar context must match URL.** The 10 page contexts from `site_map.md` § "Sidebar Context Routing" must trigger on the exact paths specified.

7. **No invented components.** Only use components documented in `component_inventory.md`. If you need something not listed, it's a stub with the correct interface — never a redesigned version.

8. **RLS must be correct from Phase 8.** Do not leave tables open. Every table referenced in `data_dictionary.md` must have RLS enabled with appropriate policies.

9. **Hash chains must be valid.** `tshepo_audit_ledger` records must have `prev_hash` pointing to the previous record's `record_hash`. The chain must verify with SHA-256.

10. **BUTANO = CPID only.** No patient names, MRNs, or other PII in any BUTANO view. Subject references use CPID exclusively.

---

## D. Risk List

| # | Risk | Impact | Mitigation |
|---|------|--------|-----------|
| 1 | **Sidebar context not switching** | Navigation feels broken; sidebar shows wrong items | Test every route against the 10-context mapping in `site_map.md`. Use `useLocation()` pathname matching exactly as documented. |
| 2 | **Workspace persistence lost on refresh** | User loses facility/workspace context | Verify `sessionStorage('activeWorkspace')` survives refresh. Context provider must read from storage on mount. |
| 3 | **RLS blocks seed data queries** | Pages show empty states despite seeded data | Seed data must be inserted with correct `user_id` / `tenant_id` references. Test queries as the seeded auth users. |
| 4 | **EHR layout leaks to non-encounter pages** | Clinical pages show wrong layout | Route matching must be exact: only `/encounter` and `/encounter/:encounterId` use `EHRLayout`. All others use `AppLayout`. |
| 5 | **Auth state race condition** | Flash of login page on refresh | `onAuthStateChange` must be registered BEFORE `getSession()`. Loading state must block rendering until resolved. |
| 6 | **Hash chain breaks on audit insert** | TSHEPO audit integrity fails | Use `tshepo_next_chain_sequence()` and `tshepo_last_audit_hash()` RPCs. Never manually assign `chain_sequence`. |
| 7 | **PII leak in BUTANO views** | Compliance violation | BUTANO queries must select only `subject_cpid`, `resource_type`, `fhir_id`, `meta_json` — never join to `patients` or `client_registry`. |
| 8 | **Missing edge functions** | Login attempt tracking, order processing fail silently | Deploy `track-login-attempt`, `geolocate-ip`, `oros-v1`, `zibo-v1` in Phase 8. Stubs must exist before that. |
| 9 | **Queue ticket collision** | Two patients get same ticket | `queue_item_before_insert` trigger must use `get_next_queue_sequence()` with proper serialization. |
| 10 | **ModuleHome tab state not persisting** | User always lands on Work tab | Tab state should be session-local. Default to Work for providers, My Life for patients. Derive from `profile.role`. |

---

## E. Final Acceptance Gate

### Master Checklist

All items below must be ✅ before the replica is declared complete.

#### Golden Path Scripts (`golden_path_scripts.md`)

- [ ] **Flow 1**: Public → Login → ModuleHome — all steps + alternative provider flow
- [ ] **Flow 2**: Shift start → Queue → Patient journey → Encounter — all steps
- [ ] **Flow 3**: VITO patient search → create → merge (or document unsurfaced)
- [ ] **Flow 4**: OROS place order → worklist → result → acknowledge
- [ ] **Flow 5**: MSIKA tariff update lifecycle
- [ ] **Flow 6**: Offline entitlement monitoring surfaces
- [ ] **Flow 7**: Audit viewer → filter → detail → export

#### Kernel & Governance (`kernel_governance_acceptance_checklist.md`)

- [ ] TSHEPO Consent Management — all 12 criteria
- [ ] TSHEPO Audit Ledger — hash-chained, 8 columns, pagination, decision badges
- [ ] Break-Glass Access — review queue + history, 3 actions, pending count badge
- [ ] My Access History — CPID input, redacted entries, break-glass highlighting
- [ ] Offline Trust — O-CPIDs tab, tokens tab, 3 stat cards, reconcile button
- [ ] VITO Patients — "no PII" subtitle, search by health_id/crid/cpid
- [ ] VITO Merge Queue — spine status guard, merge dialog
- [ ] VITO Events — event type filter, auto-refresh toggle
- [ ] VITO Audit — actor + action search, hash verification
- [ ] TUSO Facilities — facility cards with capabilities, status filters
- [ ] TUSO Workspaces — workspace table with service tags
- [ ] TUSO Start Shift — facility → workspace → confirmation flow
- [ ] TUSO Resources — resource calendar grid
- [ ] TUSO Config — configuration panels
- [ ] TUSO Control Tower — real-time metrics dashboard
- [ ] VARAPI Providers — provider search, lifecycle state badges
- [ ] VARAPI Privileges — privilege matrix
- [ ] VARAPI Councils — regulatory council registry
- [ ] VARAPI Tokens — API token management
- [ ] VARAPI Portal — self-service provider portal
- [ ] BUTANO Timeline — CPID-only, resource type filter
- [ ] BUTANO IPS — International Patient Summary viewer
- [ ] BUTANO Visit Summary — encounter-scoped summary
- [ ] BUTANO Reconciliation — O-CPID merge queue
- [ ] BUTANO Stats — resource counts, tenant metrics

#### Global Acceptance (from `claude_replication_master_brief.md` §10)

- [ ] All 98 routes resolve (no unhandled routes)
- [ ] 404 catch-all works for invalid paths
- [ ] AppLayout used for standard pages, EHRLayout for encounter, custom for ModuleHome
- [ ] Sidebar context switches correctly for all 10 contexts
- [ ] Auth flow works for all 4 pathways
- [ ] `ProtectedRoute` redirects unauthenticated users to `/auth`
- [ ] Public routes accessible without auth
- [ ] Profile fetch on auth state change
- [ ] Session tracking (insert, 5-min heartbeat, end)
- [ ] Toast messages match exact strings from specs
- [ ] Design tokens used throughout — no hardcoded colors
- [ ] Dark mode support
- [ ] Responsive: sidebar collapses, mobile-friendly auth
- [ ] All seed data renders correctly on data-dependent pages
- [ ] No PII in BUTANO views
- [ ] Hash chain integrity in TSHEPO audit ledger
- [ ] RLS enabled on all tables with appropriate policies
- [ ] Edge functions deployed and responding
- [ ] PWA manifest configured (`/install` page functional)

---

*End of Build Order Plan*
