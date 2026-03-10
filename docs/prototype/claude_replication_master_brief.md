# Impilo vNext — Claude Replication Master Brief

> **Purpose**: This is the single canonical document for replicating the Impilo vNext prototype end-to-end with zero ambiguity. All sections are authoritative and conflict-free — resolved from source code inspection.
>
> **Date**: 2026-03-10
>
> **Authoritative source hierarchy**: `src/` code > `types.ts` schema > `page_by_page_spec.md` > other docs

---

## Table of Contents

1. [Purpose & Non-Negotiables](#1-purpose--non-negotiables)
2. [App Shell & Navigation](#2-app-shell--navigation)
3. [Route Catalog](#3-route-catalog)
4. [Page-by-Page UI Specs](#4-page-by-page-ui-specs)
5. [Component Contract Inventory](#5-component-contract-inventory)
6. [Data + API Layer Map](#6-data--api-layer-map)
7. [State & Storage Model](#7-state--storage-model)
8. [Seed Data & Demo Readiness](#8-seed-data--demo-readiness)
9. [Golden Path Verification Scripts](#9-golden-path-verification-scripts)
10. [Acceptance Criteria](#10-acceptance-criteria)

---

## 1. Purpose & Non-Negotiables

### Mandate

The replica **must match the Lovable prototype** in layout, labels, routing, behavior, and data flows. This is a behavioral-fidelity replication, not a redesign.

### Hard Rules

1. **No redesigns.** Every page, tab, button, and label must match the spec exactly.
2. **No simplifications.** All 98 routes must exist. No "we'll add this later."
3. **No missing routes.** The catch-all 404 must exist. Every `/admin/*` kernel route must exist.
4. **No invented behavior.** If the spec says "mock data," use mock data. If it says "Supabase query," use that query.
5. **No PII in SHR.** BUTANO views must only show CPIDs, never patient names/IDs.
6. **Hash chain integrity.** Audit records must have valid `prev_hash` → `record_hash` SHA-256 chains.

### Application Zones (Confirmed)

| Zone | Description | Example Routes |
|------|-------------|---------------|
| **Public** | No auth required | `/auth`, `/portal`, `/kiosk`, `/catalogue`, `/marketplace`, `/install`, `/shared/:type/:token` |
| **Work** | Clinical, orders, scheduling, operations, finance, identity | `/encounter`, `/queue`, `/beds`, `/orders`, `/pharmacy`, `/lims`, `/pacs`, `/appointments`, `/scheduling/*`, `/payments`, `/stock` |
| **Registries** | National registries | `/client-registry`, `/hpr`, `/facility-registry` |
| **Kernel** | Service admin surfaces | `/admin/tshepo/*`, `/admin/vito/*`, `/admin/tuso/*`, `/admin/varapi/*`, `/admin/butano/*`, `/admin/zibo`, `/admin/oros`, `/admin/msika-core`, `/admin/mushex`, etc. |
| **Governance** | Public health, coverage, AI, omnichannel | `/public-health`, `/coverage`, `/ai-governance`, `/omnichannel` |
| **Admin/Ops** | System admin, above-site, reports | `/admin`, `/above-site`, `/reports`, `/odoo`, `/workspace-management` |
| **My Life** | Personal health & social | `/social`, `/portal` |
| **Support** | Help, profile | `/help`, `/profile` |

---

## 2. App Shell & Navigation

### Two Layout Templates

#### AppLayout (Standard — most pages)

```
┌──────────────────────────────────────┐
│ AppSidebar │ AppHeader (h-12)         │
│ (w-48 or   │─────────────────────────│
│  w-12      │                         │
│ collapsed) │  <main> children         │
│            │                         │
└──────────────────────────────────────┘
```

- **File**: `src/components/layout/AppLayout.tsx`
- **Props**: `children: ReactNode`, `title?: string`
- **Composition**: `<AppSidebar>` + `<AppHeader title={title}>` + `<main>`

#### EHRLayout (Encounter only — `/encounter` and `/encounter/:encounterId`)

```
┌──────────────────────────────────────┐
│              TOP BAR (h-14)           │
├──────────────────────────────────────┤
│           PATIENT BANNER              │
├─────────────────────┬────────────────┤
│   MAIN WORK AREA    │ ENCOUNTER MENU │
│   (flex-1)          │   (w-64)       │
└─────────────────────┴────────────────┘
```

- **File**: `src/components/layout/EHRLayout.tsx`
- No sidebar. Uses `EHRContext` for all state.
- Critical event mode: `ring-4 ring-critical ring-inset`

#### ModuleHome (Custom — `/` only)

- Full-screen flex column, no AppLayout/AppSidebar
- Custom header (h-14, backdrop-blur-md)
- Three-tab interface (Work / My Professional / My Life)
- Floating Emergency Button (fixed bottom-6 right-6)

### Sidebar Context Routing

`AppSidebar` dynamically changes navigation based on `pageContext` derived from URL:

| Page Context | Trigger Paths | Nav Sections |
|-------------|--------------|-------------|
| `home` | `/` (default) | Quick Access, Clinical, System |
| `clinical` | `/encounter`, `/beds`, `/queue`, `/patients` | Quick Access, Clinical, Orders |
| `operations` | `/stock`, `/consumables`, `/charges`, `/payments` | Operations |
| `scheduling` | `/scheduling`, `/appointments`, `/theatre` | Scheduling |
| `registry` | `/facility-registry`, `/hpr`, `/client-registry` | Registry, Tools, Admin |
| `portal` | `/portal`, `/social` | Portal |
| `public-health` | `/public-health` | Public Health |
| `coverage` | `/coverage` | Coverage & Financing |
| `ai` | `/ai-governance` | AI & Intelligence |
| `omnichannel` | `/omnichannel` | Omnichannel Access |
| `admin` | `/admin` | Admin |

### AppHeader Contents

Left: Home button, Back button, title
Center: `<PatientSearch>` (⌘K/Ctrl+K)
Right: `<FacilitySelector>`, `<ActiveWorkspaceIndicator>`, `<VoiceCommandButton>`, `<HandoffNotifications>`, Bell (3 notifications), User dropdown

### Route Guards

- `<ProtectedRoute>`: Redirects to `/auth` if not authenticated. Used on all Work/Admin/Kernel routes.
- Public routes (`/auth`, `/portal`, `/kiosk`, `/catalogue`, `/marketplace`, `/install`, `/shared/:type/:token`) have no `ProtectedRoute`.
- Above-site role check: If user has above-site roles on login, redirects to `/above-site` context selection.

### Global Components (Present on Every Authenticated Page)

- `<PatientSearch>` — Dialog with ⌘K shortcut, debounced Supabase query
- `<Toaster>` (sonner) — Toast notifications
- React Query `<QueryClientProvider>`
- Context hierarchy: `AuthProvider` → `FacilityProvider` → `WorkspaceProvider` → `ShiftProvider` → `TooltipProvider` → `BrowserRouter`

---

## 3. Route Catalog

### Complete Route Table (98 routes)

| # | Route | Component | Access | Layout | Zone |
|---|-------|-----------|--------|--------|------|
| 1 | `/auth` | Auth | Public | Custom (split) | Public |
| 2 | `/reset-password` | ResetPassword | Public | Custom | Public |
| 3 | `/forgot-password` | ForgotPassword | Public | Custom | Public |
| 4 | `/portal` | Portal | Public | Custom | My Life |
| 5 | `/install` | Install | Public | Custom | Public |
| 6 | `/kiosk` | Kiosk | Public | Custom | Public |
| 7 | `/catalogue` | ProductCatalogue | Public | Custom | Public |
| 8 | `/marketplace` | HealthMarketplace | Public | Custom | Public |
| 9 | `/shared/:type/:token` | SharedSummary | Token-gated | Custom | Public |
| 10 | `/` | ModuleHome | Auth | Custom (3-tab) | Home |
| 11 | `/dashboard` | Dashboard | Auth | AppLayout | Work |
| 12 | `/encounter` | Encounter | Auth | EHRLayout | Work |
| 13 | `/encounter/:encounterId` | Encounter | Auth | EHRLayout | Work |
| 14 | `/queue` | Queue | Auth | AppLayout | Work |
| 15 | `/beds` | Beds | Auth | AppLayout | Work |
| 16 | `/appointments` | Appointments | Auth | AppLayout | Work |
| 17 | `/patients` | Patients | Auth | AppLayout | Work |
| 18 | `/stock` | Stock | Auth | AppLayout | Work |
| 19 | `/consumables` | Consumables | Auth | AppLayout | Work |
| 20 | `/charges` | Charges | Auth | AppLayout | Work |
| 21 | `/registration` | Registration | Auth | AppLayout | Work |
| 22 | `/profile` | ProfileSettings | Auth | AppLayout | Support |
| 23 | `/admin` | AdminDashboard | Auth | AppLayout | Admin |
| 24 | `/pharmacy` | Pharmacy | Auth | AppLayout | Work |
| 25 | `/theatre` | Theatre | Auth | AppLayout | Work |
| 26 | `/payments` | Payments | Auth | AppLayout | Work |
| 27 | `/pacs` | PACS | Auth | AppLayout | Work |
| 28 | `/lims` | LIMS | Auth | AppLayout | Work |
| 29 | `/odoo` | Odoo | Auth | AppLayout | Admin |
| 30 | `/reports` | Reports | Auth | AppLayout | Admin |
| 31 | `/orders` | Orders | Auth | AppLayout | Work |
| 32 | `/handoff` | Handoff | Auth | AppLayout | Work |
| 33 | `/help` | HelpDesk | Auth | AppLayout | Support |
| 34 | `/admin/product-registry` | ProductManagement | Auth | AppLayout | Admin |
| 35 | `/fulfillment` | PrescriptionFulfillment | Auth | AppLayout | Work |
| 36 | `/vendor-portal` | VendorPortal | Auth | AppLayout | Work |
| 37 | `/scheduling` | AppointmentScheduling | Auth | AppLayout | Work |
| 38 | `/scheduling/theatre` | TheatreScheduling | Auth | AppLayout | Work |
| 39 | `/scheduling/noticeboard` | ProviderNoticeboard | Auth | AppLayout | Work |
| 40 | `/scheduling/resources` | ResourceCalendar | Auth | AppLayout | Work |
| 41 | `/id-services` | IdServices | Auth | AppLayout | Work |
| 42 | `/communication` | Communication | Auth | AppLayout | Work |
| 43 | `/social` | Social | Auth | AppLayout | My Life |
| 44 | `/registry-management` | RegistryManagement | Auth | AppLayout | Admin |
| 45 | `/hpr` | HealthProviderRegistry | Auth | AppLayout | Registries |
| 46 | `/facility-registry` | FacilityRegistry | Auth | AppLayout | Registries |
| 47 | `/client-registry` | ClientRegistry | Auth | AppLayout | Registries |
| 48 | `/operations` | Operations | Auth | AppLayout | Work |
| 49 | `/above-site` | AboveSiteDashboard | Auth | AppLayout | Admin |
| 50 | `/telemedicine` | Telemedicine | Auth | Full-screen | Work |
| 51 | `/sorting` | PatientSorting | Auth | AppLayout | Work |
| 52 | `/discharge` | Discharge | Auth | AppLayout | Work |
| 53 | `/workspace-management` | WorkspaceManagement | Auth | AppLayout | Admin |
| 54 | `/landela` | Landela | Auth | AppLayout | Admin |
| 55 | `/public-health` | PublicHealthOps | Auth | AppLayout | Governance |
| 56 | `/coverage` | CoverageOperations | Auth | AppLayout | Governance |
| 57 | `/ai-governance` | AIGovernance | Auth | AppLayout | Governance |
| 58 | `/omnichannel` | OmnichannelHub | Auth | AppLayout | Governance |
| 59 | `/admin/tshepo/consents` | TshepoConsentAdmin | Auth | Bare (p-6) | Kernel |
| 60 | `/admin/tshepo/audit` | TshepoAuditSearch | Auth | Bare (p-6) | Kernel |
| 61 | `/admin/tshepo/breakglass` | TshepoBreakGlass | Auth | Bare (p-6) | Kernel |
| 62 | `/admin/tshepo/access-history` | TshepoPatientAccessHistory | Auth | Bare (p-6) | Kernel |
| 63 | `/admin/tshepo/offline` | TshepoOfflineStatus | Auth | Bare (p-6) | Kernel |
| 64 | `/admin/vito/patients` | VitoPatients | Auth | Bare (p-6) | Kernel |
| 65 | `/admin/vito/merges` | VitoMergeQueue | Auth | Bare (p-6) | Kernel |
| 66 | `/admin/vito/events` | VitoEventsViewer | Auth | Bare (p-6) | Kernel |
| 67 | `/admin/vito/audit` | VitoAuditViewer | Auth | Bare (p-6) | Kernel |
| 68 | `/admin/tuso/facilities` | TusoFacilities | Auth | Bare (p-6) | Kernel |
| 69 | `/admin/tuso/workspaces` | TusoWorkspaces | Auth | Bare (p-6) | Kernel |
| 70 | `/admin/tuso/start-shift` | TusoStartShift | Auth | Bare (p-6) | Kernel |
| 71 | `/admin/tuso/resources` | TusoResources | Auth | Bare (p-6) | Kernel |
| 72 | `/admin/tuso/config` | TusoConfig | Auth | Bare (p-6) | Kernel |
| 73 | `/admin/tuso/control-tower` | TusoControlTower | Auth | Bare (p-6) | Kernel |
| 74 | `/admin/varapi/providers` | VarapiProviders | Auth | Bare (p-6) | Kernel |
| 75 | `/admin/varapi/privileges` | VarapiPrivileges | Auth | Bare (p-6) | Kernel |
| 76 | `/admin/varapi/councils` | VarapiCouncils | Auth | Bare (p-6) | Kernel |
| 77 | `/admin/varapi/tokens` | VarapiTokens | Auth | Bare (p-6) | Kernel |
| 78 | `/admin/varapi/portal` | VarapiPortal | Auth | Bare (p-6) | Kernel |
| 79 | `/admin/butano/timeline` | ButanoTimeline | Auth | Bare (p-6) | Kernel |
| 80 | `/admin/butano/ips` | ButanoIPS | Auth | Bare (p-6) | Kernel |
| 81 | `/admin/butano/visit-summary` | ButanoVisitSummary | Auth | Bare (p-6) | Kernel |
| 82 | `/admin/butano/reconciliation` | ButanoReconciliation | Auth | Bare (p-6) | Kernel |
| 83 | `/admin/butano/stats` | ButanoStats | Auth | Bare (p-6) | Kernel |
| 84 | `/admin/suite/docs` | SuiteDocsConsole | Auth | Bare (p-6) | Kernel |
| 85 | `/admin/suite/portal` | SuiteSelfService | Auth | Bare (p-6) | Kernel |
| 86 | `/admin/pct/work` | PctWorkTab | Auth | Bare (p-6) | Kernel |
| 87 | `/admin/pct/control-tower` | PctControlTower | Auth | Bare (p-6) | Kernel |
| 88 | `/admin/zibo` | ZiboAdmin | Auth | Bare (p-6) | Kernel |
| 89 | `/admin/oros` | OrosAdmin | Auth | Bare (p-6) | Kernel |
| 90 | `/admin/pharmacy` | PharmacyAdmin | Auth | Bare (p-6) | Kernel |
| 91 | `/admin/inventory` | InventoryAdmin | Auth | Bare (p-6) | Kernel |
| 92 | `/admin/msika-core` | MsikaCoreAdmin | Auth | Bare (p-6) | Kernel |
| 93 | `/admin/msika-flow` | MsikaFlowAdmin | Auth | Bare (p-6) | Kernel |
| 94 | `/admin/costa` | CostaAdmin | Auth | Bare (p-6) | Kernel |
| 95 | `/admin/mushex` | MushexAdmin | Auth | Bare (p-6) | Kernel |
| 96 | `/admin/indawo` | IndawoAdmin | Auth | Bare (p-6) | Kernel |
| 97 | `/admin/ubomi` | UbomiAdmin | Auth | Bare (p-6) | Kernel |
| 98 | `*` | NotFound | Public | Custom | Error |

**Cross-reference**: Full page specs → [Section 4](#4-page-by-page-ui-specs), detailed in `docs/prototype/page_by_page_spec.md`

---

## 4. Page-by-Page UI Specs

> The exhaustive page-by-page specification is maintained in `docs/prototype/page_by_page_spec.md` (1557 lines). Below is a summary of every page with key details. For field-level precision, consult the referenced file directly.

### 4.1 Public Pages

#### `/auth` — Auth (Login)

- **Layout**: Split — branded gradient left panel (hidden mobile), auth forms right panel (max-w-md)
- **State machine**: `method-select` → `lookup` → `biometric` → `workspace` → success OR `email-login` → success
- **Four login pathways**: "Provider ID & Biometric" (Fingerprint), "Patient Portal" (UserCircle), "Staff Email Login" (Mail), "System Maintenance" (hidden, Wrench — revealed via `?mode=maintenance`, Ctrl+Shift+M, or mobile long-press ≥1.5s)
- **Email login**: Email + Password (toggle show/hide) + "Sign In" button + "Forgot password?" link
- **Provider flow**: ProviderIdLookup → BiometricAuth → WorkspaceSelection → sign in with mapped demo email
- **Demo mapping**: 5 VARAPI IDs → 5 emails, all password `Impilo2025!`
- **API**: `supabase.auth.signInWithPassword()`, pre/post calls to `track-login-attempt` edge function
- **Success toast**: "Welcome back!" / "You have been logged in successfully."
- **No deviation**: Exact four-card layout, exact label text, exact icon choices

#### `/reset-password`, `/forgot-password` — Password flows
#### `/portal` — Patient self-service portal (public, no ProtectedRoute)
#### `/install` — PWA installation page
#### `/kiosk` — Self-service check-in terminal (public)
#### `/catalogue` — Health products catalogue (public)
#### `/marketplace` — Health marketplace (public)
#### `/shared/:type/:token` — Token-gated shared clinical summary
#### `*` — 404 Not Found page

### 4.2 Home / Module Hub (`/`)

- **Three tabs**: Work (Briefcase), My Professional (Stethoscope), My Life (Heart)
- **Client users** see only My Life tab
- **Work tab gate**: No active context → `<WorkplaceSelectionHub>` (8 access modes). With context → Communication Noticeboard + Quick Access (8 buttons) + Module Categories (17 categories, role+capability filtered)
- **My Professional tab**: `<MyProfessionalHub>` — 5 sub-tabs (Dashboard, Affiliations, My Patients, Schedule, Credentials), mock data
- **My Life tab**: `<PersonalHub>` — Health section (10+ tabs) + Social section (5 tabs)
- **Floating Emergency Button**: fixed bottom-6 right-6, h-16 w-16, bg-destructive, animate-pulse, opens EmergencyHub dialog

### 4.3 Encounter/EHR (`/encounter`, `/encounter/:encounterId`)

- **EHRLayout** (NOT AppLayout)
- **TopBar** (h-14): Back, Home, logo, 10 action buttons (Queue, Beds, Pharmacy, Theatre, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges), patient context, CriticalEventButton, AIDiagnosticAssistant, UserMenu
- **PatientBanner**: Demographics, alerts, active episodes
- **EncounterMenu** (w-64): 8 items (Overview, Assessment, Problems & Diagnoses, Orders & Results, Care & Management, Consults & Referrals, Notes & Attachments, Visit Outcome)
- **MainWorkArea**: Priority rendering: CriticalEvent → Workspace → TopBarPanel → EncounterSection
- **States**: No patient → NoPatientSelected; Loading → spinner; Error → error card; Active → full EHRLayout
- **Chart access**: source=queue/appointment/worklist → pre-authorized (no dialog). Otherwise → ChartAccessDialog

### 4.4 Clinical Pages

| Route | Title | Key Components |
|-------|-------|---------------|
| `/dashboard` | Dashboard | ProviderDashboardTabs, DepartmentView, TeamView, useDashboardData() |
| `/queue` | Queue Management | 6 tabs: Workstation, Supervisor, Bookings, Check-In, Config, Pathways |
| `/beds` | Bed Management | BedManagement component |
| `/patients` | Patient Registry | 3 tabs (all/active/inactive), client-side filter, PatientProfile dialog |
| `/sorting` | Patient Sorting | Triage & queue assignment |
| `/discharge` | Discharge & Exit | DischargeDashboard |
| `/handoff` | Shift Handoff | Care continuity reports |
| `/communication` | Communication | ?tab=messages\|pages\|calls |

### 4.5 Orders & Diagnostics

| Route | Title | Key Components |
|-------|-------|---------------|
| `/orders` | Clinical Orders | Order entry (meds, labs, imaging) |
| `/pharmacy` | Pharmacy | MedicationDispensing |
| `/lims` | Laboratory | LIMSIntegration |
| `/pacs` | PACS Imaging | 5 tabs: Worklist, Viewer, Teleradiology, Critical Findings, Admin |

### 4.6 Scheduling & Registration

| Route | Key Details |
|-------|------------|
| `/appointments` | Appointment management |
| `/registration` | 3-view state machine: menu → registration/visit/iam |
| `/scheduling` | Advanced scheduling |
| `/scheduling/theatre` | Surgical suite scheduling |
| `/scheduling/noticeboard` | Provider announcements |
| `/scheduling/resources` | Resource calendar |
| `/theatre` | Theatre booking |

### 4.7 Finance, Operations, Identity, Marketplace

| Route | Purpose |
|-------|---------|
| `/payments` | Patient billing & collections |
| `/charges` | Encounter service charges |
| `/stock` | Inventory/stock management |
| `/consumables` | Consumables tracking |
| `/operations` | Operations dashboard & roster (?tab=control-tower) |
| `/id-services` | ID generation/validation/recovery (?tab=generate\|recovery\|validate\|batch) |
| `/fulfillment` | Prescription fulfillment bidding |
| `/vendor-portal` | Vendor bid submission |

### 4.8 Registries

| Route | Service | Purpose |
|-------|---------|---------|
| `/client-registry` | VITO | National Health ID Registry |
| `/hpr` | VARAPI | Health Provider Registry |
| `/facility-registry` | TUSO | Master Facility List |

### 4.9 Kernel Service Admin Surfaces

All kernel admin pages: No AppLayout wrapper — bare `div.space-y-6.p-6`. Back button (ArrowLeft → `/admin`) where present. Full specs in `docs/prototype/page_by_page_spec.md` lines 1001-1475.

#### TSHEPO (Trust Layer)

| Route | Component | Key Features |
|-------|-----------|-------------|
| `/admin/tshepo/consents` | TshepoConsentAdmin | FHIR R4 consent CRUD, revoke. Table: FHIR ID, CPID, Provision, Purpose, Status. Create dialog: 5 fields. |
| `/admin/tshepo/audit` | TshepoAuditSearch | Hash-chained ledger viewer. 3 filters (Actor, Action, Decision). 8-column table. Pagination 50/page. |
| `/admin/tshepo/breakglass` | TshepoBreakGlass | Review Queue + History tabs. Pending items as amber Cards. 3 review actions (Approve/Flag/Violation). |
| `/admin/tshepo/access-history` | TshepoPatientAccessHistory | CPID input → access log. Break-glass rows `bg-amber-500/5`. Pagination 20/page. |
| `/admin/tshepo/offline` | TshepoOfflineStatus | 3 stat cards. O-CPIDs tab + Offline Tokens tab. Reconcile button for provisional O-CPIDs. |

#### VITO (Client Registry)

| Route | Component | Key Features |
|-------|-----------|-------------|
| `/admin/vito/patients` | VitoPatients | Search by health_id/crid/cpid. Create dialog. "No PII stored" subtitle. |
| `/admin/vito/merges` | VitoMergeQueue | Federation Authority Guard (spine_status check). Merge blocked when spine offline. |
| `/admin/vito/events` | VitoEventsViewer | v1.1 event envelope viewer. Detail dialog with full JSON. |
| `/admin/vito/audit` | VitoAuditViewer | Opaque audit — no PII. Filter by correlation/request/actor/action. |

#### BUTANO (Shared Health Record)

| Route | Component | Key Features |
|-------|-----------|-------------|
| `/admin/butano/timeline` | ButanoTimeline | CPID input + type filter. Provisional resources: yellow border + badge. |
| `/admin/butano/ips` | ButanoIPS | 8-tab IPS viewer (Allergies, Problems, Medications, Immunizations, Vitals, Labs, Procedures, Care Plans). |
| `/admin/butano/visit-summary` | ButanoVisitSummary | Encounter ID input → FHIR resources as JSON cards. |
| `/admin/butano/reconciliation` | ButanoReconciliation | O-CPID → CPID reconciliation. Multi-step: insert job → rewrite resources → update job. |
| `/admin/butano/stats` | ButanoStats | 3 stat cards. Resource counts by type. PII violation log. |

#### Other Kernel Services

| Route | Component | Key Features |
|-------|-----------|-------------|
| `/admin/zibo` | ZiboAdmin | 6 tabs: Artifacts, Import, Packs, Assignments, Logs, Dev. Artifact lifecycle: DRAFT→PUBLISHED→DEPRECATED→RETIRED. |
| `/admin/oros` | OrosAdmin | 7 tabs: Worklists, Place Order, Order Detail, Reconciliation, Capabilities, Event Log, Writeback. Full order lifecycle. |
| `/admin/msika-core` | MsikaCoreAdmin | 7 tabs: Catalogs, Items, Search, Import, Mappings, Packs, Intents. Catalog lifecycle: DRAFT→REVIEW→APPROVED→PUBLISHED. |
| `/admin/mushex` | MushexAdmin | 6 tabs: Payments, Remittance, Claims, Settlements, Ops/Fraud, Ledger. Step-Up Mode toggle. |
| `/admin/tuso/*` | Tuso* | Facilities, Workspaces, Start Shift, Resources, Config, Control Tower. |
| `/admin/varapi/*` | Varapi* | Providers, Privileges, Councils, Tokens, Portal. |
| `/admin/suite/*` | Suite* | Docs console, Self-service portal. |
| `/admin/pct/*` | Pct* | Work tab, Control tower. |
| `/admin/costa` | CostaAdmin | Costing engine. |
| `/admin/indawo` | IndawoAdmin | Site & premises registry. |
| `/admin/ubomi` | UbomiAdmin | CRVS (birth/death notifications). |
| `/admin/pharmacy` | PharmacyAdmin | Pharmacy service admin. |
| `/admin/inventory` | InventoryAdmin | Inventory service admin. |
| `/admin/msika-flow` | MsikaFlowAdmin | Commerce & fulfillment. |

### 4.10 Governance Planes

| Route | Component | Tabs |
|-------|-----------|------|
| `/public-health` | PublicHealthOps | surveillance, outbreaks, inspections, campaigns |
| `/coverage` | CoverageOperations | eligibility, claims, settlement, schemes |
| `/ai-governance` | AIGovernance | insights, models |
| `/omnichannel` | OmnichannelHub | sms, ussd, ivr, callbacks, disclosure, ai-agent |

---

## 5. Component Contract Inventory

> Full inventory in `docs/prototype/component_inventory.md`. Summary below.

### Shell Components (Shared)

| Component | File | Used By | Key Props |
|-----------|------|---------|-----------|
| AppLayout | `src/components/layout/AppLayout.tsx` | Most auth pages | `children, title?` |
| EHRLayout | `src/components/layout/EHRLayout.tsx` | `/encounter` only | None (uses EHRContext) |
| AppSidebar | `src/components/layout/AppSidebar.tsx` | AppLayout | None (context-driven) |
| AppHeader | `src/components/layout/AppHeader.tsx` | AppLayout | `title?` |
| TopBar | `src/components/layout/TopBar.tsx` | EHRLayout | None (uses EHRContext) |
| EncounterMenu | `src/components/layout/EncounterMenu.tsx` | EHRLayout | None |
| MainWorkArea | `src/components/layout/MainWorkArea.tsx` | EHRLayout | None |
| PatientBanner | `src/components/ehr/PatientBanner.tsx` | EHRLayout | — |
| ProtectedRoute | `src/components/auth/ProtectedRoute.tsx` | Route wrapper | `children` |
| PatientSearch | `src/components/search/PatientSearch.tsx` | AppHeader, TopBar | — |

### Home Components

| Component | File | Key Props |
|-----------|------|-----------|
| WorkplaceSelectionHub | `src/components/home/WorkplaceSelectionHub.tsx` (749 lines) | 8 callback props for access modes |
| MyProfessionalHub | `src/components/home/MyProfessionalHub.tsx` (615 lines) | `onStartShift, onSwitchToWork` |
| PersonalHub | `src/components/home/PersonalHub.tsx` (541 lines) | None |
| ExpandableCategoryCard | `src/components/home/ExpandableCategoryCard.tsx` | `id, title, description, modules[], icon, color, roles?, onModuleClick` |

### Auth Components

| Component | File | Used By |
|-----------|------|---------|
| ProviderIdLookup | `src/components/auth/ProviderIdLookup.tsx` | Auth (lookup view) |
| BiometricAuth | `src/components/auth/BiometricAuth.tsx` | Auth (biometric view) |
| WorkspaceSelection | `src/components/auth/WorkspaceSelection.tsx` | Auth (workspace view) |
| AboveSiteContextSelection | `src/components/auth/AboveSiteContextSelection.tsx` | Auth (above-site view) |
| ClientAuth | `src/components/auth/ClientAuth.tsx` | Auth (client view) |
| SystemMaintenanceAuth | `src/components/auth/SystemMaintenanceAuth.tsx` | Auth (maintenance view) |

### Component Directory Summary

| Directory | Count | Purpose |
|-----------|-------|---------|
| `src/components/ui/` | ~40+ | shadcn/ui base components |
| `src/components/ehr/` | 15+ | EHR clinical |
| `src/components/layout/` | 10 | Shell and layout |
| `src/components/home/` | 4 | Module home hub |
| `src/components/auth/` | 7+ | Authentication |
| `src/components/portal/` | 15+ | Patient portal |
| `src/components/social/` | 6+ | Social hub |
| `src/components/queue/` | 5+ | Queue management |
| `src/components/imaging/` | 5 | PACS/radiology |
| `src/components/kernel/` | varies | Kernel service UIs |
| `src/components/admin/` | varies | Admin panels |
| `src/components/discharge/` | varies | Discharge workflows |

---

## 6. Data + API Layer Map

> Full reference: `docs/prototype/data_dictionary.md` (603 lines) and `docs/prototype/api_surface_map.md` (253 lines)

### 6.1 Key Tables by Domain

#### Auth & Identity
| Table | Key Columns | Pages |
|-------|-------------|-------|
| `profiles` | user_id, display_name, role, specialty, department, provider_registry_id | All (AuthContext) |
| `user_roles` | user_id, role (enum: admin, moderator, user) | Role checks |
| `user_sessions` | user_id, session_token, is_active, last_activity_at | Session tracking |

#### Patient Domain
| Table | Key Columns | Pages |
|-------|-------------|-------|
| `patients` | mrn, first_name, last_name, date_of_birth, gender, allergies, is_active | /patients, PatientSearch, /dashboard |
| `encounters` | patient_id, status, ward, bed, triage_category | /encounter, /dashboard |
| `clinical_orders` | order_name, order_type, priority, status, patient_id, encounter_id | /orders, /dashboard |

#### Queue & Scheduling
| Table | Key Columns | Triggers |
|-------|-------------|----------|
| `queue_definitions` | name, service_type, facility_id | — |
| `queue_items` | queue_id, patient_id, status, ticket_number, sequence_number | `queue_item_before_insert()`, `queue_item_status_change()` |
| `appointments` | patient_id, provider_id, scheduled_start/end, status | `flag_missed_appointments()` |

#### TUSO (Facility Operations)
| Table | Pages |
|-------|-------|
| `tuso_facilities` | /admin/tuso/facilities, /admin/tuso/start-shift |
| `tuso_workspaces` | /admin/tuso/workspaces, /admin/tuso/start-shift |
| `tuso_shifts` | /admin/tuso/start-shift |

#### VITO (Client Registry)
| Table | Pages |
|-------|-------|
| `vito_patients` | /admin/vito/patients |
| `vito_merge_requests` | /admin/vito/merges |
| `vito_config` | /admin/vito/merges (spine_status) |
| `vito_audit_log` | /admin/vito/audit |
| `vito_event_envelopes` | /admin/vito/events |

#### TSHEPO (Trust Layer)
| Table | Pages |
|-------|-------|
| `tshepo_audit_ledger` | /admin/tshepo/audit |
| `tshepo_consents` | /admin/tshepo/consents |
| `trust_layer_break_glass` | /admin/tshepo/breakglass |
| `tshepo_patient_access_log` | /admin/tshepo/access-history |
| `trust_layer_offline_tokens` | /admin/tshepo/offline |
| `trust_layer_offline_cpid` | /admin/tshepo/offline |
| `offline_entitlements` | Kernel code only (not surfaced in UI) |

#### BUTANO (SHR)
| Table | Pages |
|-------|-------|
| `butano_fhir_resources` | /admin/butano/timeline, /admin/butano/ips, /admin/butano/visit-summary |
| `butano_reconciliation_queue` | /admin/butano/reconciliation |
| `butano_pii_violations` | /admin/butano/stats |

#### Finance
| Table | Pages |
|-------|-------|
| `charge_sheets` | /charges |
| `invoices` | /payments |

### 6.2 Edge Functions

| Function | Purpose | Called By |
|----------|---------|----------|
| `track-login-attempt` | Login tracking & lockout | Auth page (pre/post login) |
| `geolocate-ip` | IP geolocation for sessions | AuthContext (post-session-create) |
| `oros-v1` | Orders & Results orchestration | OrosAdmin via `orosClient` |
| `zibo-v1` | Terminology governance | ZiboAdmin via `ziboClient` |
| `msika-core-v1` | Products & tariff registry | MsikaCoreAdmin via `msikaCoreCient` |
| `mushex-v1` | Payment switch & claims | MushexAdmin via `mushexClient` |
| `butano-v1` | SHR operations | BUTANO pages |
| `vito-v1-1` | Patient registry operations | VITO pages |
| `costa-v1` | Costing engine | CostaAdmin |
| `tuso-v1` | Facility operations | TusoAdmin pages |
| `varapi-v1` | Provider operations | VarapiAdmin pages |
| `seed-test-users` | Test user seeding | Dev/setup |
| `cleanup-sessions` | Session cleanup cron | Automated |

### 6.3 Key Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `generate_impilo_id()` | Composite CR + SHR ID |
| `generate_health_id()` | Health ID with Luhn check digit |
| `generate_upid()` | Unique Provider ID |
| `check_provider_eligibility()` | Roles/privileges at facility |
| `get_provider_facilities()` | User's affiliated facilities |
| `get_user_workspaces()` | Workspace memberships |
| `get_active_shift()` | Current active shift |
| `has_role()` / `has_above_site_role()` / `has_platform_role()` | Role checks (SECURITY DEFINER) |
| `can_access_patient()` | Patient access authorization |
| `can_access_facility_in_jurisdiction()` | Jurisdiction-based access |
| `tshepo_next_chain_sequence()` / `tshepo_last_audit_hash()` | Audit chain helpers |

### 6.4 Realtime Subscriptions

22 tables with realtime enabled:

`beds`, `shift_handoffs`, `clinical_messages`, `clinical_pages`, `voice_calls`, `teleconsult_signals`, `call_sessions`, `call_ice_candidates`, `medication_schedule_times`, `posts`, `post_comments`, `campaign_donations`, `idp_revocation_events`, `client_registry`, `client_duplicate_queue`, `sorting_sessions`, `lab_critical_alerts`, `client_queue_notifications`, `client_queue_requests`, `teleconsult_responses`, `landela_notifications`, `trust_layer_consent`, `trust_layer_break_glass`

---

## 7. State & Storage Model

> Full reference: `docs/prototype/state_and_storage.md`

### 7.1 Authentication

- **Provider**: Supabase Auth (`@supabase/supabase-js`)
- **Client**: `src/integrations/supabase/client.ts` (auto-generated, DO NOT EDIT)
- **Auth Context** (`src/contexts/AuthContext.tsx`): Provides `user`, `session`, `profile`, `loading`, `signUp`, `signIn`, `signOut`, `refreshProfile`
- **Auth flow**: (1) `onAuthStateChange` listener first, (2) `getSession()` check, (3) SIGNED_IN → fetch profile + create session in `user_sessions`, (4) SIGNED_OUT → end session
- **Login attempt tracking**: Pre-login call to `track-login-attempt` (checks lockout), post-success call
- **Session activity**: Updated every 5 minutes via `setInterval`

### 7.2 Context Provider Hierarchy

```
QueryClientProvider
  └── AuthProvider
        └── FacilityProvider
              └── WorkspaceProvider
                    └── ShiftProvider
                          └── TooltipProvider
                                └── BrowserRouter / Routes
```

| Context | Key State | Methods |
|---------|-----------|---------|
| AuthContext | user, session, profile, loading | signUp, signIn, signOut, refreshProfile |
| FacilityContext | currentFacility, availableFacilities | hasCapability(), isAtLeastLevel() |
| WorkspaceContext | currentView (personal/department/team), currentDepartment, careSetting, pageContext (10 values) | — |
| ShiftContext | activeShift, isOnShift, shiftDuration (updated 60s), loading, actionLoading | startShift(), endShift(), transferWorkspace(), refreshShift() |
| EHRContext | patientContext, currentEncounter, activeMenuItem (8 values), activeTopBarAction (10 actions), activeWorkspace, activeCriticalEvent | (only on `/encounter` routes) |
| ProviderContext | provider (mock), worklist (mock), stats (mock) | (only on `/encounter` routes) |

### 7.3 Storage Keys

| Key | Storage | Set By | Schema |
|-----|---------|--------|--------|
| `activeWorkspace` | sessionStorage | WorkspaceSelection (auth flow) | `{ department, physicalWorkspace: { id, name }, workstation, facility, loginTime }` |
| `recentPatients` | localStorage | PatientSearch | Array of patient objects (max 5) |
| `oros_tenant_id`, `oros_actor_id` | localStorage | OrosAdmin | String values for TSHEPO headers |

### 7.4 Feature Visibility Controls

- **Role-based**: Module `roles[]` arrays in ModuleHome category definitions
- **Capability-based**: Module `capabilities[]` checked against facility capabilities
- **URL secrets**: `?mode=maintenance` for maintenance login
- **Keyboard shortcuts**: Ctrl+Shift+M for maintenance mode reveal
- No formal feature flag system exists.

---

## 8. Seed Data & Demo Readiness

> Full specification: `docs/prototype/seed_fixtures_spec.md`

### 8.1 Fixture Summary

| Entity | Count | Key Details |
|--------|-------|-------------|
| Tenants | 2 | NATIONAL (National Health Spine), PRIVATE-POD-01 (Sunrise Health Group) |
| Facilities | 4 | Clinic (f1), District Hospital (f2), Provincial Hospital (f3), Private Centre (f4) |
| Workspaces | 8 | 2 per facility (OPD, LAB, WARD, ICU, THEATRE, PHARM, PHC) |
| Providers | 10 | 5 doctors/nurses, 1 pharmacist, 1 lab tech, 1 admin, 1 receptionist |
| Patients | 20 | pt01-pt20, with MRNs, pt20 is inactive |
| VITO Identity Refs | 20 | HID/CRID/CPID mappings, PII-free |
| Orders | 10 | Lab/imaging/pharmacy in various states |
| Charge Sheets | 5 | Various statuses |
| Invoices | 5 | paid/sent/draft/partially_paid |
| Audit Records | 10 | Hash-chained, includes 1 break-glass (a05) |
| Break-Glass Events | 1 | Trauma case, pending review |
| Offline Entitlements | 6 | ACTIVE/CONSUMED/REVOKED states |
| Offline Tokens | 3 | active/revoked |
| Offline O-CPIDs | 3 | provisional/reconciled/pending_reconciliation |
| Queue Definitions | 2 | OPD General + Laboratory |
| Queue Items | 5 | Various states |
| Shifts | 2 | Active shifts for p01 and p05 |

### 8.2 Demo Credentials

All providers use password: **`Impilo2025!`**

| Provider | Email | VARAPI ID | Role |
|----------|-------|-----------|------|
| Sarah Moyo | sarah.moyo@impilo.health | VARAPI-2025-ZW000001-A1B2 | doctor |
| Tendai Ncube | tendai.ncube@impilo.health | VARAPI-2025-ZW000002-C3D4 | nurse |
| Grace Mutasa | grace.mutasa@impilo.health | VARAPI-2025-ZW000003-E5F6 | specialist |
| Farai Chikwava | farai.chikwava@impilo.health | VARAPI-2025-ZW000004-G7H8 | pharmacist |
| Rumbi Mhaka | rumbi.mhaka@impilo.health | VARAPI-2025-ZW000005-I9J0 | lab_tech |
| Blessing Nyathi | blessing.nyathi@impilo.health | VARAPI-2025-ZW000008-O5P6 | admin |

### 8.3 Seed Data → Page Mapping

| Seed Data | Pages That Need It |
|-----------|--------------------|
| auth.users + profiles | All authenticated pages |
| patients | /patients, PatientSearch, /dashboard, /queue, /encounter |
| vito_patients + vito_config | /admin/vito/* |
| tuso_facilities + tuso_workspaces | /admin/tuso/*, WorkplaceSelectionHub |
| queue_definitions + queue_items | /queue |
| clinical_orders | /orders, /dashboard |
| tshepo_audit_ledger | /admin/tshepo/audit |
| trust_layer_break_glass | /admin/tshepo/breakglass |
| trust_layer_offline_tokens + trust_layer_offline_cpid | /admin/tshepo/offline |
| charge_sheets + invoices | /charges, /payments |

### 8.4 Seeding Order (FK-safe)

1. `butano_tenants` → 2. `tuso_facilities` → 3. `tuso_workspaces` → 4. auth.users → 5. `profiles` → 6. `health_providers` → 7. `user_roles` → 8. `patients` → 9. `vito_config` → 10. `vito_patients` → 11. `encounters` → 12. `queue_definitions` → 13. `queue_items` → 14. `clinical_orders` → 15. `charge_sheets` (needs visits) → 16. `invoices` → 17. `tshepo_audit_ledger` (compute hashes) → 18. `trust_layer_break_glass` → 19. `offline_entitlements` → 20. `trust_layer_offline_tokens` → 21. `trust_layer_offline_cpid` → 22. `tuso_shifts`

---

## 9. Golden Path Verification Scripts

> Verbatim from `docs/prototype/golden_path_scripts.md`. These are deterministic click-by-click scripts.

### Flow 1: Public Landing → Login → ModuleHome

**Preconditions**: No active session. Demo accounts seeded.

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/auth` | Split layout. Left: branded gradient, "Digital Health Platform", 3 feature pills. Right: "Welcome back", 4 login cards. |
| 2 | Click **"Staff Email Login"** | Card with "Sign in" title, Email + Password fields, "Sign In" button. |
| 3 | Enter `sarah.moyo@impilo.health` / `Impilo2025!` | Fields populated. |
| 4 | Click **"Sign In"** | Toast: **"Welcome back!"** → navigate to `/`. |
| 5 | ModuleHome loads | 3 tabs visible: Work, My Professional, My Life. Work tab default. |

**Alternative: Provider ID flow**: Click "Provider ID & Biometric" → enter VARAPI ID → biometric simulation → workspace selection → auto-login with mapped email → navigate to `/`.

**Failures**: Wrong credentials → toast.error "Login failed". Provider ID not found → toast.error "No user account linked to this Provider ID".

### Flow 2: Start Shift → Queue → Encounter

**Preconditions**: Logged in as provider. Facilities/workspaces/queues seeded.

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Select facility in WorkplaceSelectionHub | Category cards appear. |
| 2 | Navigate to `/queue` | 6 tabs. Workstation default. |
| 3 | Click "Call Next" or select patient | Patient status → `in_service`. |
| 4 | Click "Open Chart" | Navigate to `/encounter/{id}`. EHRLayout renders. |

**Alt: TUSO Start Shift** at `/admin/tuso/start-shift`: Select facility → check workspaces → "Start Shift" → insert `tuso_shifts` + `tuso_shift_workspace_assignments`.

### Flow 3: VITO — Patient Search → Create → Merge

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/vito/patients` | Search + table. "+ Create" button. |
| 2 | Click "+ Create", fill Health ID, click "Create" | Insert into `vito_patients`. Toast: "Patient identity ref created". |
| 3 | Navigate to `/admin/vito/merges` | Spine status banner. If offline: "Merges blocked". |
| 4 | (If online) Create merge request | Insert into `vito_merge_requests`. Federation Guard enforced. |

### Flow 4: OROS — Place Order → Accept → Result → Acknowledge

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/oros`, "Place Order" tab | Fill CPID, Type, Code, Display. |
| 2 | Click "Place Order" | POST to `oros-v1`. Toast: "Order placed: {id}". |
| 3 | "Worklists" tab → Load | Order appears with "Accept" + "Reject" buttons. |
| 4 | Click "Accept" | Status → ACCEPTED. |
| 5 | "Order Detail" → Load order → "Post Result" | Status → RESULT_AVAILABLE. |
| 6 | Click "Acknowledge (Clinician)" | Ack entry appears in order detail. |

### Flow 5: MSIKA — Tariff/Catalog Update

| # | Action | Expected Outcome |
|---|--------|-----------------|
| 1 | Navigate to `/admin/msika-core`, Catalogs tab | Create Catalog → DRAFT status. |
| 2 | Lifecycle: Submit for Review → Approve → Publish | DRAFT → REVIEW → APPROVED → PUBLISHED. |

### Flow 6: Offline Entitlements (Partially Surfaced)

**Surfaced UI** at `/admin/tshepo/offline`:
- Offline Tokens tab: view token status (active/expired/revoked)
- O-CPIDs tab: view provisional/reconciled. Click "Queue Reconciliation" → sets `pending_reconciliation`

**NOT surfaced** (code-only): Ed25519 issuance, offline verification, explicit consume/revoke buttons.

### Flow 7: Audit — View → Filter → Detail

**TSHEPO** (`/admin/tshepo/audit`): 3 filters (Actor, Action, Decision). 8-column table. Pagination 50/page. No export button.

**VITO** (`/admin/vito/audit`): Single filter input. 6-column table. Limit 100. No export button.

**Export/Download**: NOT SURFACED in either audit viewer.

---

## 10. Acceptance Criteria

> Comprehensive checklist combining global requirements and kernel/governance-specific criteria from `docs/prototype/kernel_governance_acceptance_checklist.md`.

### 10.1 Global Acceptance Criteria

- [ ] All 98 routes render without errors
- [ ] `ProtectedRoute` redirects unauthenticated users to `/auth`
- [ ] Public routes accessible without authentication
- [ ] AppLayout renders correctly with collapsible sidebar (w-48 ↔ w-12)
- [ ] EHRLayout renders only on `/encounter` routes (no sidebar)
- [ ] ModuleHome 3-tab layout with role-based tab visibility
- [ ] Client/patient users see only "My Life" tab
- [ ] WorkplaceSelectionHub shows all 8 access modes
- [ ] Module categories filtered by role AND facility capabilities
- [ ] Floating Emergency Button present on ModuleHome (pulsing, bottom-right)
- [ ] PatientSearch accessible via ⌘K/Ctrl+K with 300ms debounce
- [ ] Recent patients stored in localStorage (max 5)
- [ ] Auth state machine: method-select → lookup → biometric → workspace → success
- [ ] Email login with show/hide password toggle
- [ ] System Maintenance hidden by default, 3 reveal methods
- [ ] Demo provider email mapping works (5 VARAPI IDs → 5 emails)
- [ ] Session tracking: create on SIGNED_IN, update every 5 min, end on SIGNED_OUT
- [ ] Toast messages match exact strings in spec
- [ ] Context provider hierarchy: Auth → Facility → Workspace → Shift → Tooltip → Router
- [ ] Above-site role detection → redirect to above-site context selection
- [ ] Sidebar context changes based on URL path (10 page contexts)

### 10.2 EHR/Encounter Acceptance

- [ ] TopBar with 10 action buttons
- [ ] EncounterMenu with 8 items
- [ ] MainWorkArea priority rendering: CriticalEvent → Workspace → TopBarPanel → EncounterSection
- [ ] Chart access: source=queue/appointment/worklist → pre-authorized
- [ ] Chart lock indicator and close confirmation dialog
- [ ] Critical event mode with ring-4 border
- [ ] AnimatePresence transitions (framer-motion)

### 10.3 TSHEPO (Trust Layer) Acceptance

- [ ] Consent Management: FHIR R4 CRUD, 5-field create dialog, revoke with XCircle
- [ ] Audit Ledger: hash-chained badge, 3 filters, 8-column table, pagination 50/page
- [ ] Decision badges: ALLOW=green, DENY=destructive, BREAK_GLASS=amber, other=secondary
- [ ] Break-Glass: Review Queue with amber cards, 3 action buttons (Approve/Flag/Violation)
- [ ] Break-glass history: 4 status badges (pending_review/approved/flagged/violation)
- [ ] Access History: CPID input, break-glass rows `bg-amber-500/5`, redacted badge
- [ ] Offline: 3 stat cards, O-CPIDs tab + Tokens tab, Reconcile button for provisional only
- [ ] Token status computed: revoked (if `revoked_at`), expired (if `expires_at < now`), else active

### 10.4 VITO (Client Registry) Acceptance

- [ ] Patients: "Identity refs only — no PII stored" subtitle
- [ ] Search by health_id, crid, cpid (OR ilike)
- [ ] Create dialog: Health ID required, CRID/CPID optional
- [ ] Merge Queue: Federation Authority Guard — spine_status check from `vito_config`
- [ ] Spine offline → destructive border + "Merges blocked" + merge creation throws error
- [ ] Events: v1.1 envelope viewer with full JSON detail dialog
- [ ] Audit: "Opaque audit entries — no PII" subtitle

### 10.5 BUTANO (SHR) Acceptance

- [ ] Timeline: CPID input + resource type filter (9 types + All)
- [ ] Provisional resources: yellow border + "Provisional" badge with AlertTriangle
- [ ] IPS: 8-tab section viewer, vitals vs labs split by category code
- [ ] Visit Summary: Encounter ID input → FHIR JSON cards
- [ ] Reconciliation: O-CPID → CPID multi-step process (insert job → rewrite → complete)
- [ ] Stats: 3 cards + resource counts + PII violation log (destructive, shown only if violations exist)
- [ ] Zero PII in any BUTANO view — only CPIDs

### 10.6 Other Kernel Services Acceptance

- [ ] ZIBO: 6 tabs, artifact lifecycle (DRAFT→PUBLISHED→DEPRECATED→RETIRED), 8 FHIR types
- [ ] OROS: 7 tabs, full order lifecycle (Place→Accept→Start/Complete Steps→Post Result→Acknowledge)
- [ ] MSIKA Core: 7 tabs, catalog lifecycle (DRAFT→REVIEW→APPROVED→PUBLISHED), 6 item kinds
- [ ] MUSHEX: 6 tabs, Step-Up Mode toggle, STEP_UP_REQUIRED error handling
- [ ] TUSO Start Shift: facility dropdown → workspace checkboxes → insert shift + workspace assignments
- [ ] All edge function calls use TSHEPO-compliant headers

### 10.7 Data Integrity Acceptance

- [ ] Audit ledger records have valid hash chain (prev_hash → record_hash)
- [ ] Queue items auto-generate sequence_number and ticket_number via triggers
- [ ] Offline entitlements use Ed25519 algorithm (alg field)
- [ ] Health IDs include Luhn check digit
- [ ] Seed data follows exact UUID convention and FK ordering

### 10.8 Not Surfaced (Document Only)

The following exist in code but have no dedicated UI surface:

- Ed25519 entitlement issuance (`src/lib/kernel/offlineEntitlements/issuer.ts`)
- Offline verification (`src/lib/kernel/offlineEntitlements/verifier.ts`)
- Explicit entitlement consume/revoke (`src/lib/kernel/offlineEntitlements/lifecycle.ts`)
- Audit export/download (neither TSHEPO nor VITO audit viewers have export)
- Full offline data sync engine (only `OfflineConflictResolver.tsx` exists)

---

## Appendix: Source File Index

| Document | Purpose | Lines |
|----------|---------|-------|
| `docs/prototype/site_map.md` | All 98 routes with zone groupings | 286 |
| `docs/prototype/page_by_page_spec.md` | Field-level page specifications | 1557 |
| `docs/prototype/component_inventory.md` | Component file paths, props, usage | 392 |
| `docs/prototype/api_surface_map.md` | API calls, edge functions, RPC | 253 |
| `docs/prototype/state_and_storage.md` | Auth, contexts, storage patterns | 285 |
| `docs/prototype/data_dictionary.md` | Table schemas with types and FK | 603 |
| `docs/prototype/seed_fixtures_spec.md` | Deterministic seed dataset | 325 |
| `docs/prototype/golden_path_scripts.md` | 7 click-through verification scripts | 281 |
| `docs/prototype/kernel_governance_acceptance_checklist.md` | Per-page acceptance criteria | 193 |
| `docs/prototype/unknowns_resolved_report.md` | Resolved unknowns with code pointers | 13 |

---

## Appendix: Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS + tailwindcss-animate |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | React Context + React Query (TanStack) |
| Routing | react-router-dom v6 |
| Animation | framer-motion |
| Backend | Supabase (Auth, Postgres, Edge Functions, Realtime, Storage) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Date | date-fns |
| PWA | vite-plugin-pwa |
| Testing | vitest + @testing-library/react |
| DICOM | @cornerstonejs/dicom-image-loader + dicom-parser |
| Crypto | @noble/curves (Ed25519) |
