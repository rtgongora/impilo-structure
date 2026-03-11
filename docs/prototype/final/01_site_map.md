# 01 — Complete Site Map

> Every route in the prototype extracted from `src/App.tsx`. 98 routes total.

## Route Table

| # | Route | Zone | Auth | Layout | Sidebar Context | Page Component | Purpose |
|---|-------|------|------|--------|----------------|----------------|---------|
| 1 | `/auth` | Auth | Public | Standalone | n/a | `Auth.tsx` | Login method selection + email login + provider ID flows |
| 2 | `/reset-password` | Auth | Public | Standalone | n/a | `ResetPassword.tsx` | Set new password after reset link |
| 3 | `/forgot-password` | Auth | Public | Standalone | n/a | `ForgotPassword.tsx` | Request password reset email |
| 4 | `/` | Home | Protected | ModuleHome (custom) | home | `ModuleHome.tsx` | 3-tab hub: Work, My Professional, My Life |
| 5 | `/dashboard` | Work | Protected | AppLayout | home | `Dashboard.tsx` | Provider worklist, tasks, alerts |
| 6 | `/encounter` | Clinical | Protected | EHRLayout | clinical | `Encounter.tsx` | EHR - no patient (selection screen) |
| 7 | `/encounter/:encounterId` | Clinical | Protected | EHRLayout | clinical | `Encounter.tsx` | EHR - active patient encounter |
| 8 | `/queue` | Clinical | Protected | AppLayout | clinical | `Queue.tsx` | Patient queue & triage |
| 9 | `/beds` | Clinical | Protected | AppLayout | clinical | `Beds.tsx` | Ward bed management & admissions |
| 10 | `/appointments` | Scheduling | Protected | AppLayout | scheduling | `Appointments.tsx` | Clinic appointment list |
| 11 | `/patients` | Clinical | Protected | AppLayout | clinical | `Patients.tsx` | Patient search & registry |
| 12 | `/stock` | Operations | Protected | AppLayout | operations | `Stock.tsx` | Inventory & reordering |
| 13 | `/consumables` | Operations | Protected | AppLayout | operations | `Consumables.tsx` | Usage & administration tracking |
| 14 | `/charges` | Operations | Protected | AppLayout | operations | `Charges.tsx` | Encounter charges & billing |
| 15 | `/registration` | Clinical | Protected | AppLayout | home | `Registration.tsx` | New patient intake & ID |
| 16 | `/profile` | Settings | Protected | AppLayout | home | `ProfileSettings.tsx` | Account & preferences |
| 17 | `/admin` | Admin | Protected | AppLayout | admin | `AdminDashboard.tsx` | System settings, users, audit |
| 18 | `/pharmacy` | Clinical | Protected | AppLayout | clinical | `Pharmacy.tsx` | Dispensing & medication tracking |
| 19 | `/theatre` | Scheduling | Protected | AppLayout | scheduling | `Theatre.tsx` | Surgical booking |
| 20 | `/payments` | Operations | Protected | AppLayout | operations | `Payments.tsx` | Patient billing & collections |
| 21 | `/pacs` | Clinical | Protected | AppLayout | clinical | `PACS.tsx` | Radiology & DICOM imaging |
| 22 | `/lims` | Clinical | Protected | AppLayout | clinical | `LIMS.tsx` | Lab orders & results |
| 23 | `/portal` | Portal | Public | Standalone | portal | `Portal.tsx` | Patient self-service portal |
| 24 | `/install` | Public | Public | Standalone | n/a | `Install.tsx` | PWA install instructions |
| 25 | `/odoo` | Admin | Protected | AppLayout | admin | `Odoo.tsx` | ERP integration |
| 26 | `/reports` | Admin | Protected | AppLayout | home | `Reports.tsx` | Dashboards & analytics |
| 27 | `/orders` | Clinical | Protected | AppLayout | clinical | `Orders.tsx` | Clinical order entry |
| 28 | `/handoff` | Clinical | Protected | AppLayout | clinical | `Handoff.tsx` | Shift handoff reports |
| 29 | `/help` | Support | Protected | AppLayout | home | `HelpDesk.tsx` | FAQs, guides, tickets |
| 30 | `/catalogue` | Marketplace | Public | Standalone | n/a | `ProductCatalogue.tsx` | Browse health products |
| 31 | `/marketplace` | Marketplace | Public | Standalone | n/a | `HealthMarketplace.tsx` | Compare prices & order |
| 32 | `/admin/product-registry` | Marketplace | Protected | AppLayout | admin | `admin/ProductManagement.tsx` | Product catalogue management |
| 33 | `/fulfillment` | Marketplace | Protected | AppLayout | home | `PrescriptionFulfillment.tsx` | Rx bidding & vendor selection |
| 34 | `/vendor-portal` | Marketplace | Protected | AppLayout | home | `VendorPortal.tsx` | Vendor bid management |
| 35 | `/scheduling` | Scheduling | Protected | AppLayout | scheduling | `scheduling/AppointmentScheduling.tsx` | Advanced scheduling tools |
| 36 | `/scheduling/theatre` | Scheduling | Protected | AppLayout | scheduling | `scheduling/TheatreScheduling.tsx` | Surgical suite calendar |
| 37 | `/scheduling/noticeboard` | Scheduling | Protected | AppLayout | scheduling | `scheduling/ProviderNoticeboard.tsx` | Announcements & updates |
| 38 | `/scheduling/resources` | Scheduling | Protected | AppLayout | scheduling | `scheduling/ResourceCalendar.tsx` | Room & equipment calendar |
| 39 | `/id-services` | Identity | Protected | AppLayout | home | `IdServices.tsx` | Health ID generation/validation/recovery |
| 40 | `/communication` | Clinical | Protected | AppLayout | clinical | `Communication.tsx` | Messages, pages, calls |
| 41 | `/social` | Portal | Protected | AppLayout | portal | `Social.tsx` | Professional networking |
| 42 | `/kiosk` | Public | Public | Standalone | n/a | `Kiosk.tsx` | Self-service check-in |
| 43 | `/registry-management` | Registry | Protected | AppLayout | registry | `RegistryManagement.tsx` | HIE registry management |
| 44 | `/hpr` | Registry | Protected | AppLayout | registry | `HealthProviderRegistry.tsx` | Health provider registry |
| 45 | `/facility-registry` | Registry | Protected | AppLayout | registry | `FacilityRegistry.tsx` | Master facility list |
| 46 | `/client-registry` | Registry | Protected | AppLayout | registry | `ClientRegistry.tsx` | National health ID registry |
| 47 | `/operations` | Operations | Protected | AppLayout | operations | `Operations.tsx` | Operations & roster hub |
| 48 | `/above-site` | Admin | Protected | AppLayout | admin | `AboveSiteDashboard.tsx` | District/provincial oversight |
| 49 | `/telemedicine` | Clinical | Protected | AppLayout | clinical | `Telemedicine.tsx` | Teleconsultation hub |
| 50 | `/sorting` | Clinical | Protected | AppLayout | clinical | `PatientSorting.tsx` | Front desk: arrival & triage |
| 51 | `/discharge` | Clinical | Protected | AppLayout | clinical | `Discharge.tsx` | Discharge, death & exit workflows |
| 52 | `/workspace-management` | Admin | Protected | AppLayout | admin | `WorkspaceManagement.tsx` | Workspace configuration |
| 53 | `/landela` | Admin | Protected | AppLayout | admin | `Landela.tsx` | Document management & scanning |
| 54 | `/shared/:type/:token` | Public | Public | Standalone | n/a | `SharedSummary.tsx` | Token-secured shared summaries |
| 55 | `/admin/tshepo/consents` | Kernel | Protected | AppLayout | admin | `admin/TshepoConsentAdmin.tsx` | TSHEPO consent management |
| 56 | `/admin/tshepo/audit` | Kernel | Protected | AppLayout | admin | `admin/TshepoAuditSearch.tsx` | TSHEPO audit ledger search |
| 57 | `/admin/tshepo/breakglass` | Kernel | Protected | AppLayout | admin | `admin/TshepoBreakGlass.tsx` | Break-glass access review |
| 58 | `/admin/tshepo/access-history` | Kernel | Protected | AppLayout | admin | `admin/TshepoPatientAccessHistory.tsx` | Patient access history |
| 59 | `/admin/tshepo/offline` | Kernel | Protected | AppLayout | admin | `admin/TshepoOfflineStatus.tsx` | Offline entitlement status |
| 60 | `/admin/vito/patients` | Kernel | Protected | AppLayout | admin | `admin/VitoPatients.tsx` | VITO patient records |
| 61 | `/admin/vito/merges` | Kernel | Protected | AppLayout | admin | `admin/VitoMergeQueue.tsx` | VITO merge request queue |
| 62 | `/admin/vito/events` | Kernel | Protected | AppLayout | admin | `admin/VitoEventsViewer.tsx` | VITO event log viewer |
| 63 | `/admin/vito/audit` | Kernel | Protected | AppLayout | admin | `admin/VitoAuditViewer.tsx` | VITO audit trail |
| 64 | `/admin/tuso/facilities` | Kernel | Protected | AppLayout | admin | `admin/TusoFacilities.tsx` | TUSO facility registry |
| 65 | `/admin/tuso/workspaces` | Kernel | Protected | AppLayout | admin | `admin/TusoWorkspaces.tsx` | TUSO workspace config |
| 66 | `/admin/tuso/start-shift` | Kernel | Protected | AppLayout | admin | `admin/TusoStartShift.tsx` | TUSO shift start |
| 67 | `/admin/tuso/resources` | Kernel | Protected | AppLayout | admin | `admin/TusoResources.tsx` | TUSO resource management |
| 68 | `/admin/tuso/config` | Kernel | Protected | AppLayout | admin | `admin/TusoConfig.tsx` | TUSO configuration |
| 69 | `/admin/tuso/control-tower` | Kernel | Protected | AppLayout | admin | `admin/TusoControlTower.tsx` | TUSO control tower |
| 70 | `/admin/varapi/providers` | Kernel | Protected | AppLayout | admin | `admin/VarapiProviders.tsx` | VARAPI provider registry |
| 71 | `/admin/varapi/privileges` | Kernel | Protected | AppLayout | admin | `admin/VarapiPrivileges.tsx` | VARAPI privilege management |
| 72 | `/admin/varapi/councils` | Kernel | Protected | AppLayout | admin | `admin/VarapiCouncils.tsx` | VARAPI council config |
| 73 | `/admin/varapi/tokens` | Kernel | Protected | AppLayout | admin | `admin/VarapiTokens.tsx` | VARAPI token management |
| 74 | `/admin/varapi/portal` | Kernel | Protected | AppLayout | admin | `admin/VarapiPortal.tsx` | VARAPI self-service portal |
| 75 | `/admin/butano/timeline` | Kernel | Protected | AppLayout | admin | `admin/ButanoTimeline.tsx` | BUTANO clinical timeline |
| 76 | `/admin/butano/ips` | Kernel | Protected | AppLayout | admin | `admin/ButanoIPS.tsx` | BUTANO IPS assembly |
| 77 | `/admin/butano/visit-summary` | Kernel | Protected | AppLayout | admin | `admin/ButanoVisitSummary.tsx` | BUTANO visit summary |
| 78 | `/admin/butano/reconciliation` | Kernel | Protected | AppLayout | admin | `admin/ButanoReconciliation.tsx` | BUTANO OCPID reconciliation |
| 79 | `/admin/butano/stats` | Kernel | Protected | AppLayout | admin | `admin/ButanoStats.tsx` | BUTANO statistics |
| 80 | `/admin/suite/docs` | Kernel | Protected | AppLayout | admin | `admin/SuiteDocsConsole.tsx` | Landela document console |
| 81 | `/admin/suite/portal` | Kernel | Protected | AppLayout | admin | `admin/SuiteSelfService.tsx` | Landela self-service portal |
| 82 | `/admin/pct/work` | Kernel | Protected | AppLayout | admin | `admin/PctWorkTab.tsx` | PCT work tab |
| 83 | `/admin/pct/control-tower` | Kernel | Protected | AppLayout | admin | `admin/PctControlTower.tsx` | PCT control tower |
| 84 | `/admin/zibo` | Kernel | Protected | AppLayout | admin | `admin/ZiboAdmin.tsx` | ZIBO terminology governance |
| 85 | `/admin/oros` | Kernel | Protected | AppLayout | admin | `admin/OrosAdmin.tsx` | OROS orders & results admin |
| 86 | `/admin/pharmacy` | Kernel | Protected | AppLayout | admin | `admin/PharmacyAdmin.tsx` | Pharmacy service admin |
| 87 | `/admin/inventory` | Kernel | Protected | AppLayout | admin | `admin/InventoryAdmin.tsx` | Inventory service admin |
| 88 | `/admin/msika-core` | Kernel | Protected | AppLayout | admin | `admin/MsikaCoreAdmin.tsx` | MSIKA products & tariff registry |
| 89 | `/admin/msika-flow` | Kernel | Protected | AppLayout | admin | `admin/MsikaFlowAdmin.tsx` | MSIKA commerce & fulfillment |
| 90 | `/admin/costa` | Kernel | Protected | AppLayout | admin | `admin/CostaAdmin.tsx` | COSTA costing engine admin |
| 91 | `/admin/mushex` | Kernel | Protected | AppLayout | admin | `admin/MushexAdmin.tsx` | MUSHEX payment switch admin |
| 92 | `/admin/indawo` | Kernel | Protected | AppLayout | admin | `admin/IndawoAdmin.tsx` | INDAWO site & premises registry |
| 93 | `/admin/ubomi` | Kernel | Protected | AppLayout | admin | `admin/UbomiAdmin.tsx` | UBOMI CRVS interface |
| 94 | `/public-health` | Specialized | Protected | AppLayout | public-health | `PublicHealthOps.tsx` | Public health operations hub |
| 95 | `/coverage` | Specialized | Protected | AppLayout | coverage | `CoverageOperations.tsx` | Coverage & payer operations |
| 96 | `/ai-governance` | Specialized | Protected | AppLayout | ai | `AIGovernance.tsx` | AI governance & insights |
| 97 | `/omnichannel` | Specialized | Protected | AppLayout | omnichannel | `OmnichannelHub.tsx` | Omnichannel experience hub |
| 98 | `*` | System | Public | Standalone | n/a | `NotFound.tsx` | 404 page |

## Sidebar Context Resolution

From `src/components/layout/AppSidebar.tsx` function `getPageContextFromPath`:

```
/facility-registry, /hpr, /client-registry, /registry → "registry"
/encounter, /beds, /queue, /patients → "clinical"
/stock, /consumables, /charges, /payments → "operations"
/scheduling, /appointments, /theatre → "scheduling"
/public-health → "public-health"
/coverage → "coverage"
/ai-governance → "ai"
/omnichannel → "omnichannel"
/admin → "admin"
/portal, /social → "portal"
everything else → "home"
```

## Route Guard Rules

- `ProtectedRoute` component checks `useAuth().user` — if null and not loading, redirects to `/auth` with `state.from` for return navigation
- Loading state shows centered `"Loading..."` with pulse animation
- No workspace/shift guard exists in the router — workspace context is enforced at the ModuleHome level (shows WorkplaceSelectionHub if no active context)
