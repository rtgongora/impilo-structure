# Impilo vNext — Complete Site Map (v2)

> Exhaustive route table extracted from `src/App.tsx`. Every route in the prototype.
>
> **DO NOT CHANGE** route paths, component names, or guard rules.

---

## Route Table

| # | Route | Zone | Auth | Layout | Sidebar Context | Page Component | Purpose |
|---|-------|------|------|--------|----------------|----------------|---------|
| 1 | `/auth` | Public | No | None (standalone) | N/A | `Auth` | Login method selection + all auth flows |
| 2 | `/reset-password` | Public | No | None (standalone) | N/A | `ResetPassword` | Set new password after reset email |
| 3 | `/forgot-password` | Public | No | None (standalone) | N/A | `ForgotPassword` | Request password reset email |
| 4 | `/` | Work | Yes | ModuleHome (custom) | `home` | `ModuleHome` | 3-tab hub: Work / My Professional / My Life |
| 5 | `/dashboard` | Work | Yes | AppLayout | `home` | `Dashboard` | Provider worklist, tasks, alerts |
| 6 | `/encounter` | Clinical | Yes | EHRLayout | `clinical` | `Encounter` | EHR — no patient selected state |
| 7 | `/encounter/:encounterId` | Clinical | Yes | EHRLayout | `clinical` | `Encounter` | EHR — active patient encounter |
| 8 | `/queue` | Clinical | Yes | AppLayout | `clinical` | `Queue` | Patient queue & triage |
| 9 | `/beds` | Clinical | Yes | AppLayout | `clinical` | `Beds` | Bed/ward management |
| 10 | `/appointments` | Scheduling | Yes | AppLayout | `scheduling` | `Appointments` | Appointment list & management |
| 11 | `/patients` | Clinical | Yes | AppLayout | `clinical` | `Patients` | Patient search & registry |
| 12 | `/stock` | Operations | Yes | AppLayout | `operations` | `Stock` | Inventory & reordering |
| 13 | `/consumables` | Operations | Yes | AppLayout | `operations` | `Consumables` | Usage & administration |
| 14 | `/charges` | Operations | Yes | AppLayout | `operations` | `Charges` | Service & item charges |
| 15 | `/registration` | Work | Yes | AppLayout | `home` | `Registration` | New patient intake & ID |
| 16 | `/profile` | Work | Yes | AppLayout | `home` | `ProfileSettings` | User account & preferences |
| 17 | `/admin` | Admin | Yes | AppLayout | `admin` | `AdminDashboard` | System settings, users, security, audit |
| 18 | `/pharmacy` | Clinical | Yes | AppLayout | `clinical` | `Pharmacy` | Medication dispensing |
| 19 | `/theatre` | Scheduling | Yes | AppLayout | `scheduling` | `Theatre` | Surgical scheduling |
| 20 | `/payments` | Operations | Yes | AppLayout | `operations` | `Payments` | Patient billing & collections |
| 21 | `/pacs` | Clinical | Yes | AppLayout | `clinical` | `PACS` | Radiology & diagnostic imaging |
| 22 | `/lims` | Clinical | Yes | AppLayout | `clinical` | `LIMS` | Lab orders & results |
| 23 | `/portal` | Portal | No | None (standalone) | `portal` | `Portal` | Patient portal (public) |
| 24 | `/install` | Public | No | None (standalone) | N/A | `Install` | PWA installation page |
| 25 | `/odoo` | Admin | Yes | AppLayout | `admin` | `Odoo` | ERP integration |
| 26 | `/reports` | Work | Yes | AppLayout | `home` | `Reports` | Dashboards & analytics |
| 27 | `/orders` | Clinical | Yes | AppLayout | `clinical` | `Orders` | Clinical order entry |
| 28 | `/handoff` | Clinical | Yes | AppLayout | `clinical` | `Handoff` | Shift handoff reports |
| 29 | `/help` | Work | Yes | AppLayout | `home` | `HelpDesk` | FAQs, guides, documentation |
| 30 | `/catalogue` | Marketplace | No | None (standalone) | N/A | `ProductCatalogue` | Public health products catalogue |
| 31 | `/marketplace` | Marketplace | No | None (standalone) | N/A | `HealthMarketplace` | Public marketplace |
| 32 | `/admin/product-registry` | Admin | Yes | AppLayout | `admin` | `ProductManagement` | Product registry admin |
| 33 | `/fulfillment` | Marketplace | Yes | AppLayout | `home` | `PrescriptionFulfillment` | Rx bidding & vendor selection |
| 34 | `/vendor-portal` | Marketplace | Yes | AppLayout | `home` | `VendorPortal` | Vendor request/bid portal |
| 35 | `/scheduling` | Scheduling | Yes | AppLayout | `scheduling` | `AppointmentScheduling` | Advanced scheduling tools |
| 36 | `/scheduling/theatre` | Scheduling | Yes | AppLayout | `scheduling` | `TheatreScheduling` | Surgical suite calendar |
| 37 | `/scheduling/noticeboard` | Scheduling | Yes | AppLayout | `scheduling` | `ProviderNoticeboard` | Announcements & updates |
| 38 | `/scheduling/resources` | Scheduling | Yes | AppLayout | `scheduling` | `ResourceCalendar` | Rooms, equipment calendar |
| 39 | `/id-services` | Work | Yes | AppLayout | `home` | `IdServices` | Generate, validate, recover IDs |
| 40 | `/communication` | Work | Yes | AppLayout | `home` | `Communication` | Messages, pages & calls |
| 41 | `/social` | Portal | Yes | AppLayout | `portal` | `Social` | Social hub |
| 42 | `/kiosk` | Public | No | None (standalone) | N/A | `Kiosk` | Self-service check-in terminal |
| 43 | `/registry-management` | Registry | Yes | AppLayout | `registry` | `RegistryManagement` | HIE registry management |
| 44 | `/hpr` | Registry | Yes | AppLayout | `registry` | `HealthProviderRegistry` | Health Provider Registry |
| 45 | `/facility-registry` | Registry | Yes | AppLayout | `registry` | `FacilityRegistry` | Master Facility List |
| 46 | `/client-registry` | Registry | Yes | AppLayout | `registry` | `ClientRegistry` | National Health ID Registry |
| 47 | `/operations` | Operations | Yes | AppLayout | `operations` | `Operations` | Shifts, roster & workforce |
| 48 | `/above-site` | Admin | Yes | AppLayout | `admin` | `AboveSiteDashboard` | District/provincial/national oversight |
| 49 | `/telemedicine` | Clinical | Yes | AppLayout | `clinical` | `Telemedicine` | Teleconsultation hub |
| 50 | `/sorting` | Clinical | Yes | AppLayout | `clinical` | `PatientSorting` | Front desk arrival & triage |
| 51 | `/discharge` | Clinical | Yes | AppLayout | `clinical` | `Discharge` | Discharges, deaths & exits |
| 52 | `/workspace-management` | Admin | Yes | AppLayout | `admin` | `WorkspaceManagement` | Workspace configuration |
| 53 | `/landela` | Admin | Yes | AppLayout | `admin` | `Landela` | Document management & scanning |
| 54 | `/shared/:type/:token` | Public | No | None (standalone) | N/A | `SharedSummary` | Public shared summary (token-gated) |
| 55 | `/admin/tshepo/consents` | Kernel | Yes | AppLayout | `admin` | `TshepoConsentAdmin` | TSHEPO consent management |
| 56 | `/admin/tshepo/audit` | Kernel | Yes | AppLayout | `admin` | `TshepoAuditSearch` | TSHEPO audit ledger search |
| 57 | `/admin/tshepo/breakglass` | Kernel | Yes | AppLayout | `admin` | `TshepoBreakGlass` | TSHEPO break-glass review |
| 58 | `/admin/tshepo/access-history` | Kernel | Yes | AppLayout | `admin` | `TshepoPatientAccessHistory` | Patient data access history |
| 59 | `/admin/tshepo/offline` | Kernel | Yes | AppLayout | `admin` | `TshepoOfflineStatus` | Offline entitlements status |
| 60 | `/admin/vito/patients` | Kernel | Yes | AppLayout | `admin` | `VitoPatients` | VITO client registry browser |
| 61 | `/admin/vito/merges` | Kernel | Yes | AppLayout | `admin` | `VitoMergeQueue` | VITO identity merge queue |
| 62 | `/admin/vito/events` | Kernel | Yes | AppLayout | `admin` | `VitoEventsViewer` | VITO event stream viewer |
| 63 | `/admin/vito/audit` | Kernel | Yes | AppLayout | `admin` | `VitoAuditViewer` | VITO audit trail |
| 64 | `/admin/tuso/facilities` | Kernel | Yes | AppLayout | `admin` | `TusoFacilities` | TUSO facility management |
| 65 | `/admin/tuso/workspaces` | Kernel | Yes | AppLayout | `admin` | `TusoWorkspaces` | TUSO workspace management |
| 66 | `/admin/tuso/start-shift` | Kernel | Yes | AppLayout | `admin` | `TusoStartShift` | TUSO shift start flow |
| 67 | `/admin/tuso/resources` | Kernel | Yes | AppLayout | `admin` | `TusoResources` | TUSO resource management |
| 68 | `/admin/tuso/config` | Kernel | Yes | AppLayout | `admin` | `TusoConfig` | TUSO configuration |
| 69 | `/admin/tuso/control-tower` | Kernel | Yes | AppLayout | `admin` | `TusoControlTower` | TUSO control tower |
| 70 | `/admin/varapi/providers` | Kernel | Yes | AppLayout | `admin` | `VarapiProviders` | VARAPI provider management |
| 71 | `/admin/varapi/privileges` | Kernel | Yes | AppLayout | `admin` | `VarapiPrivileges` | VARAPI privilege management |
| 72 | `/admin/varapi/councils` | Kernel | Yes | AppLayout | `admin` | `VarapiCouncils` | VARAPI council management |
| 73 | `/admin/varapi/tokens` | Kernel | Yes | AppLayout | `admin` | `VarapiTokens` | VARAPI token management |
| 74 | `/admin/varapi/portal` | Kernel | Yes | AppLayout | `admin` | `VarapiPortal` | VARAPI provider self-service |
| 75 | `/admin/butano/timeline` | Kernel | Yes | AppLayout | `admin` | `ButanoTimeline` | BUTANO SHR clinical timeline |
| 76 | `/admin/butano/ips` | Kernel | Yes | AppLayout | `admin` | `ButanoIPS` | BUTANO International Patient Summary |
| 77 | `/admin/butano/visit-summary` | Kernel | Yes | AppLayout | `admin` | `ButanoVisitSummary` | BUTANO visit summary viewer |
| 78 | `/admin/butano/reconciliation` | Kernel | Yes | AppLayout | `admin` | `ButanoReconciliation` | BUTANO data reconciliation |
| 79 | `/admin/butano/stats` | Kernel | Yes | AppLayout | `admin` | `ButanoStats` | BUTANO statistics dashboard |
| 80 | `/admin/suite/docs` | Kernel | Yes | AppLayout | `admin` | `SuiteDocsConsole` | Landela docs console |
| 81 | `/admin/suite/portal` | Kernel | Yes | AppLayout | `admin` | `SuiteSelfService` | Credentials self-service |
| 82 | `/admin/pct/work` | Kernel | Yes | AppLayout | `admin` | `PctWorkTab` | PCT work queue |
| 83 | `/admin/pct/control-tower` | Kernel | Yes | AppLayout | `admin` | `PctControlTower` | PCT control tower |
| 84 | `/admin/zibo` | Kernel | Yes | AppLayout | `admin` | `ZiboAdmin` | ZIBO terminology service |
| 85 | `/admin/oros` | Kernel | Yes | AppLayout | `admin` | `OrosAdmin` | OROS orders & results |
| 86 | `/admin/pharmacy` | Kernel | Yes | AppLayout | `admin` | `PharmacyAdmin` | Pharmacy service admin |
| 87 | `/admin/inventory` | Kernel | Yes | AppLayout | `admin` | `InventoryAdmin` | Inventory & supply chain |
| 88 | `/admin/msika-core` | Kernel | Yes | AppLayout | `admin` | `MsikaCoreAdmin` | MSIKA products & services |
| 89 | `/admin/msika-flow` | Kernel | Yes | AppLayout | `admin` | `MsikaFlowAdmin` | MSIKA commerce & fulfillment |
| 90 | `/admin/costa` | Kernel | Yes | AppLayout | `admin` | `CostaAdmin` | COSTA costing engine |
| 91 | `/admin/mushex` | Kernel | Yes | AppLayout | `admin` | `MushexAdmin` | MUSHEX payment switch & claims |
| 92 | `/admin/indawo` | Kernel | Yes | AppLayout | `admin` | `IndawoAdmin` | INDAWO site & premises registry |
| 93 | `/admin/ubomi` | Kernel | Yes | AppLayout | `admin` | `UbomiAdmin` | UBOMI CRVS interface |
| 94 | `/public-health` | Public Health | Yes | AppLayout | `public-health` | `PublicHealthOps` | Public health operations hub |
| 95 | `/coverage` | Coverage | Yes | AppLayout | `coverage` | `CoverageOperations` | Coverage & payer operations |
| 96 | `/ai-governance` | AI | Yes | AppLayout | `ai` | `AIGovernance` | AI governance & insights |
| 97 | `/omnichannel` | Omnichannel | Yes | AppLayout | `omnichannel` | `OmnichannelHub` | Omnichannel access hub |
| 98 | `*` | Public | No | None | N/A | `NotFound` | 404 page |

**Total: 98 routes** (including catch-all)

---

## Layout Mapping Summary

| Layout | When Used | Structure |
|--------|-----------|----------|
| **None (standalone)** | `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/install`, `/catalogue`, `/marketplace`, `/kiosk`, `/shared/:type/:token`, `*` | Full-page, no shell chrome |
| **ModuleHome (custom)** | `/` only | Custom header (logo + profile dropdown) → 3-tab hub (Work/My Professional/My Life) → floating emergency FAB |
| **AppLayout** | Most protected routes | `AppSidebar` (left) + `AppHeader` (top) + scrollable `<main>` content |
| **EHRLayout** | `/encounter`, `/encounter/:encounterId` | `TopBar` (top) + `PatientBanner` + `MainWorkArea` (center) + `EncounterMenu` (right nav) |

---

## Sidebar Context Derivation Rules

From `getPageContextFromPath()` in `src/components/layout/AppSidebar.tsx`:

| URL Prefix | Context | Sidebar Sections Shown |
|------------|---------|----------------------|
| `/facility-registry`, `/hpr`, `/client-registry`, `/registry` | `registry` | Registry · Tools · Admin |
| `/encounter`, `/beds`, `/queue`, `/patients` | `clinical` | Quick Access · Clinical · Orders |
| `/stock`, `/consumables`, `/charges`, `/payments` | `operations` | Operations |
| `/scheduling`, `/appointments`, `/theatre` | `scheduling` | Scheduling |
| `/public-health` | `public-health` | Public Health |
| `/coverage` | `coverage` | Coverage & Financing |
| `/ai-governance` | `ai` | AI & Intelligence |
| `/omnichannel` | `omnichannel` | Omnichannel Access |
| `/admin` | `admin` | Admin |
| `/portal`, `/social` | `portal` | Portal |
| Everything else | `home` | Quick Access · Clinical · System |

---

## Auth Guard Summary

- **Public routes** (no `ProtectedRoute`): `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/install`, `/catalogue`, `/marketplace`, `/kiosk`, `/shared/:type/:token`, `*`
- **Protected routes**: All other 88 routes — redirects to `/auth` if no authenticated session
