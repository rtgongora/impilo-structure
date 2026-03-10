# Impilo vNext — Site Map

> Auto-generated from prototype codebase. All routes extracted from `src/App.tsx`.

---

## Route Summary

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 1 | `/auth` | Auth | Public (unauth) | Public |
| 2 | `/reset-password` | ResetPassword | Public | Public |
| 3 | `/forgot-password` | ForgotPassword | Public | Public |
| 4 | `/portal` | Portal | Public (no ProtectedRoute) | Public / My Life |
| 5 | `/install` | Install | Public | Public |
| 6 | `/kiosk` | Kiosk | Public (no ProtectedRoute) | Public |
| 7 | `/catalogue` | ProductCatalogue | Public (no ProtectedRoute) | Public / Marketplace |
| 8 | `/marketplace` | HealthMarketplace | Public (no ProtectedRoute) | Public / Marketplace |
| 9 | `/shared/:type/:token` | SharedSummary | Public (token-gated) | Public |
| 10 | `/` | ModuleHome | Authenticated | Home (Work / My Professional / My Life tabs) |
| 11 | `/dashboard` | Dashboard | Authenticated | Work |
| 12 | `/encounter` | Encounter | Authenticated | Work / Clinical |
| 13 | `/encounter/:encounterId` | Encounter | Authenticated | Work / Clinical |
| 14 | `/queue` | Queue | Authenticated | Work / Clinical |
| 15 | `/beds` | Beds | Authenticated | Work / Clinical |
| 16 | `/appointments` | Appointments | Authenticated | Work / Scheduling |
| 17 | `/patients` | Patients | Authenticated | Work / Clinical |
| 18 | `/stock` | Stock | Authenticated | Work / Operations |
| 19 | `/consumables` | Consumables | Authenticated | Work / Operations |
| 20 | `/charges` | Charges | Authenticated | Work / Operations |
| 21 | `/registration` | Registration | Authenticated | Work / Scheduling |
| 22 | `/profile` | ProfileSettings | Authenticated | Support |
| 23 | `/admin` | AdminDashboard | Authenticated | Ops/Admin |
| 24 | `/pharmacy` | Pharmacy | Authenticated | Work / Orders |
| 25 | `/theatre` | Theatre | Authenticated | Work / Scheduling |
| 26 | `/payments` | Payments | Authenticated | Work / Finance |
| 27 | `/pacs` | PACS | Authenticated | Work / Orders |
| 28 | `/lims` | LIMS | Authenticated | Work / Orders |
| 29 | `/odoo` | Odoo | Authenticated | Ops/Admin |
| 30 | `/reports` | Reports | Authenticated | Ops/Admin |
| 31 | `/orders` | Orders | Authenticated | Work / Orders |
| 32 | `/handoff` | Handoff | Authenticated | Work / Clinical |
| 33 | `/help` | HelpDesk | Authenticated | Support |
| 34 | `/admin/product-registry` | ProductManagement | Authenticated | Ops/Admin |
| 35 | `/fulfillment` | PrescriptionFulfillment | Authenticated | Work / Marketplace |
| 36 | `/vendor-portal` | VendorPortal | Authenticated | Work / Marketplace |
| 37 | `/scheduling` | AppointmentScheduling | Authenticated | Work / Scheduling |
| 38 | `/scheduling/theatre` | TheatreScheduling | Authenticated | Work / Scheduling |
| 39 | `/scheduling/noticeboard` | ProviderNoticeboard | Authenticated | Work / Scheduling |
| 40 | `/scheduling/resources` | ResourceCalendar | Authenticated | Work / Scheduling |
| 41 | `/id-services` | IdServices | Authenticated | Work / Identity |
| 42 | `/communication` | Communication | Authenticated | Work / Clinical |
| 43 | `/social` | Social | Authenticated | My Life |
| 44 | `/registry-management` | RegistryManagement | Authenticated | Ops/Admin |
| 45 | `/hpr` | HealthProviderRegistry | Authenticated | Registries |
| 46 | `/facility-registry` | FacilityRegistry | Authenticated | Registries |
| 47 | `/client-registry` | ClientRegistry | Authenticated | Registries |
| 48 | `/operations` | Operations | Authenticated | Work / Operations |
| 49 | `/above-site` | AboveSiteDashboard | Authenticated | Ops/Admin |
| 50 | `/telemedicine` | Telemedicine | Authenticated | Work / Consults |
| 51 | `/sorting` | PatientSorting | Authenticated | Work / Clinical |
| 52 | `/discharge` | Discharge | Authenticated | Work / Clinical |
| 53 | `/workspace-management` | WorkspaceManagement | Authenticated | Ops/Admin |
| 54 | `/landela` | Landela | Authenticated | Ops/Admin |
| 55 | `/public-health` | PublicHealthOps | Authenticated | Public Health |
| 56 | `/coverage` | CoverageOperations | Authenticated | Coverage & Financing |
| 57 | `/ai-governance` | AIGovernance | Authenticated | Intelligence & AI |
| 58 | `/omnichannel` | OmnichannelHub | Authenticated | Experience |

### TSHEPO Trust Layer Admin Surfaces

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 59 | `/admin/tshepo/consents` | TshepoConsentAdmin | Authenticated | Kernel / TSHEPO |
| 60 | `/admin/tshepo/audit` | TshepoAuditSearch | Authenticated | Kernel / TSHEPO |
| 61 | `/admin/tshepo/breakglass` | TshepoBreakGlass | Authenticated | Kernel / TSHEPO |
| 62 | `/admin/tshepo/access-history` | TshepoPatientAccessHistory | Authenticated | Kernel / TSHEPO |
| 63 | `/admin/tshepo/offline` | TshepoOfflineStatus | Authenticated | Kernel / TSHEPO |

### VITO v1.1 Admin Surfaces (Patient Registry)

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 64 | `/admin/vito/patients` | VitoPatients | Authenticated | Kernel / VITO |
| 65 | `/admin/vito/merges` | VitoMergeQueue | Authenticated | Kernel / VITO |
| 66 | `/admin/vito/events` | VitoEventsViewer | Authenticated | Kernel / VITO |
| 67 | `/admin/vito/audit` | VitoAuditViewer | Authenticated | Kernel / VITO |

### TUSO Admin Surfaces (Facility Registry)

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 68 | `/admin/tuso/facilities` | TusoFacilities | Authenticated | Kernel / TUSO |
| 69 | `/admin/tuso/workspaces` | TusoWorkspaces | Authenticated | Kernel / TUSO |
| 70 | `/admin/tuso/start-shift` | TusoStartShift | Authenticated | Kernel / TUSO |
| 71 | `/admin/tuso/resources` | TusoResources | Authenticated | Kernel / TUSO |
| 72 | `/admin/tuso/config` | TusoConfig | Authenticated | Kernel / TUSO |
| 73 | `/admin/tuso/control-tower` | TusoControlTower | Authenticated | Kernel / TUSO |

### VARAPI Admin Surfaces (Provider Registry)

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 74 | `/admin/varapi/providers` | VarapiProviders | Authenticated | Kernel / VARAPI |
| 75 | `/admin/varapi/privileges` | VarapiPrivileges | Authenticated | Kernel / VARAPI |
| 76 | `/admin/varapi/councils` | VarapiCouncils | Authenticated | Kernel / VARAPI |
| 77 | `/admin/varapi/tokens` | VarapiTokens | Authenticated | Kernel / VARAPI |
| 78 | `/admin/varapi/portal` | VarapiPortal | Authenticated | Kernel / VARAPI |

### BUTANO SHR Surfaces (Shared Health Record)

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 79 | `/admin/butano/timeline` | ButanoTimeline | Authenticated | Kernel / BUTANO |
| 80 | `/admin/butano/ips` | ButanoIPS | Authenticated | Kernel / BUTANO |
| 81 | `/admin/butano/visit-summary` | ButanoVisitSummary | Authenticated | Kernel / BUTANO |
| 82 | `/admin/butano/reconciliation` | ButanoReconciliation | Authenticated | Kernel / BUTANO |
| 83 | `/admin/butano/stats` | ButanoStats | Authenticated | Kernel / BUTANO |

### Landela + Credentials Suite

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 84 | `/admin/suite/docs` | SuiteDocsConsole | Authenticated | Kernel / Landela |
| 85 | `/admin/suite/portal` | SuiteSelfService | Authenticated | Kernel / Landela |

### PCT v1.1 (Patient Care Tracker)

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 86 | `/admin/pct/work` | PctWorkTab | Authenticated | Kernel / PCT |
| 87 | `/admin/pct/control-tower` | PctControlTower | Authenticated | Kernel / PCT |

### Additional Kernel Service Surfaces

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 88 | `/admin/zibo` | ZiboAdmin | Authenticated | Kernel / ZIBO |
| 89 | `/admin/oros` | OrosAdmin | Authenticated | Kernel / OROS |
| 90 | `/admin/pharmacy` | PharmacyAdmin | Authenticated | Kernel / Pharmacy |
| 91 | `/admin/inventory` | InventoryAdmin | Authenticated | Kernel / Inventory |
| 92 | `/admin/msika-core` | MsikaCoreAdmin | Authenticated | Kernel / MSIKA Core |
| 93 | `/admin/msika-flow` | MsikaFlowAdmin | Authenticated | Kernel / MSIKA Flow |
| 94 | `/admin/costa` | CostaAdmin | Authenticated | Kernel / COSTA |
| 95 | `/admin/mushex` | MushexAdmin | Authenticated | Kernel / MUSHEX |
| 96 | `/admin/indawo` | IndawoAdmin | Authenticated | Kernel / INDAWO |
| 97 | `/admin/ubomi` | UbomiAdmin | Authenticated | Kernel / UBOMI |

### Catch-All

| # | Route | Page Component | Access | Zone |
|---|-------|---------------|--------|------|
| 98 | `*` | NotFound | Public | Error |

---

## Zone Grouping

### Public (No authentication required)
- `/auth` — Login page with 4 auth pathways
- `/reset-password` — Password reset form
- `/forgot-password` — Forgot password email request
- `/portal` — Patient portal (self-service health hub)
- `/install` — PWA installation page
- `/kiosk` — Self-service patient check-in terminal
- `/catalogue` — Health products catalogue (read-only browsing)
- `/marketplace` — Health marketplace (vendor comparison)
- `/shared/:type/:token` — Publicly shared clinical summary (token-gated)
- `*` — 404 Not Found

### Home (Module Hub)
- `/` — ModuleHome: Three-tab hub (Work / My Professional / My Life)
  - **Work tab**: Workplace selection → module category grid
  - **My Professional tab**: CPD, credentials, affiliations, schedule
  - **My Life tab**: Personal health, social, portal access

### Work Zone
#### Clinical
- `/encounter`, `/encounter/:encounterId` — EHR clinical encounter (uses EHRLayout with TopBar + MainWorkArea + EncounterMenu)
- `/queue` — Patient queue / worklist
- `/beds` — Bed management / ward map
- `/patients` — Patient registry search
- `/sorting` — Patient arrival sorting / triage
- `/discharge` — Discharge workflow dashboard
- `/handoff` — Shift handoff reports
- `/communication` — Messages, pages, calls
- `/dashboard` — Personal clinical dashboard / worklist

#### Orders & Diagnostics
- `/orders` — Clinical order entry
- `/pharmacy` — Pharmacy dispensing
- `/lims` — Laboratory information system
- `/pacs` — PACS radiology imaging

#### Consults & Referrals
- `/telemedicine` — Full-circle telemedicine hub

#### Scheduling & Registration
- `/appointments` — Appointment management
- `/scheduling` — Advanced appointment scheduling
- `/scheduling/theatre` — Surgical suite scheduling
- `/scheduling/noticeboard` — Provider announcements
- `/scheduling/resources` — Resource calendar
- `/registration` — New patient registration
- `/theatre` — Theatre booking

#### Marketplace
- `/fulfillment` — Prescription fulfillment bidding
- `/vendor-portal` — Vendor bid submission

#### Finance
- `/payments` — Patient billing & collections
- `/charges` — Encounter service charges

#### Operations
- `/stock` — Inventory / stock management
- `/consumables` — Consumables tracking
- `/operations` — Operations dashboard & roster

#### Identity
- `/id-services` — ID generation, validation, recovery

### Registries
- `/client-registry` — VITO Client Registry (National Health ID)
- `/hpr` — VARAPI Health Provider Registry
- `/facility-registry` — TUSO Facility Registry

### My Life
- `/social` — Social hub (communities, posts, marketplace)

### Ops/Admin
- `/admin` — System admin dashboard
- `/above-site` — Above-site oversight dashboard
- `/reports` — Reports & analytics
- `/odoo` — ERP integration
- `/registry-management` — HIE registry management
- `/workspace-management` — Workspace configuration
- `/landela` — Document management system

### Kernel Service Admin Surfaces
- `/admin/tshepo/*` — TSHEPO Trust Layer (consents, audit, break-glass, access history, offline)
- `/admin/vito/*` — VITO Patient Registry (patients, merges, events, audit)
- `/admin/tuso/*` — TUSO Facility Registry (facilities, workspaces, shifts, resources, config, control tower)
- `/admin/varapi/*` — VARAPI Provider Registry (providers, privileges, councils, tokens, portal)
- `/admin/butano/*` — BUTANO SHR (timeline, IPS, visit summary, reconciliation, stats)
- `/admin/suite/*` — Landela Suite (docs console, self-service portal)
- `/admin/pct/*` — PCT Patient Care Tracker (work tab, control tower)
- `/admin/zibo` — ZIBO Terminology Service
- `/admin/oros` — OROS Orders & Results
- `/admin/pharmacy` — Pharmacy Service Admin
- `/admin/inventory` — Inventory Service Admin
- `/admin/msika-core` — MSIKA Core Products & Tariff Registry
- `/admin/msika-flow` — MSIKA Flow Commerce & Fulfillment
- `/admin/costa` — COSTA Costing Engine
- `/admin/mushex` — MUSHEX Payment Switch & Claims
- `/admin/indawo` — INDAWO Site & Premises Registry
- `/admin/ubomi` — UBOMI CRVS Interface
- `/admin/product-registry` — Product Registry Management

### Public Health & Governance
- `/public-health` — Public Health & Local Authority Operations
- `/coverage` — Coverage, Financing & Payer Operations
- `/ai-governance` — Intelligence, Automation & AI Governance
- `/omnichannel` — Omnichannel & Experience Hub

---

## Sidebar Context Routing

The `AppSidebar` dynamically changes its navigation items based on `pageContext`, derived from the current URL path:

| Page Context | Trigger Paths | Navigation Sections |
|-------------|--------------|-------------------|
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

**Note**: The `/encounter` route uses a DIFFERENT layout (`EHRLayout`) with `TopBar` + `PatientBanner` + `MainWorkArea` + `EncounterMenu` instead of the standard `AppLayout` with `AppSidebar` + `AppHeader`.
