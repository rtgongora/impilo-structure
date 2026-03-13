# Impilo vNext — Changes Since February 15, 2026

> **Generated**: March 13, 2026
> **Scope**: All changes to the Lovable prototype since February 15, 2026
> **Purpose**: Integration guide for merging prototype changes into the production codebase

---

## ⚠️ Important Note on Change Detection

This changelog was compiled from the current project state. Git history is not directly accessible from the Lovable editor. The **docs/prototype/final/** files are confirmed new (created March 13, 2026). For all other files, this document provides a **complete project inventory** organized by module so your team can diff against your Feb 15 baseline.

---

## Table of Contents

1. [Summary of Changes](#1-summary-of-changes)
2. [Newly Created Files (Confirmed)](#2-newly-created-files-confirmed)
3. [Complete Project File Inventory](#3-complete-project-file-inventory)
4. [Database Migrations](#4-database-migrations)
5. [Edge Functions](#5-edge-functions)
6. [Integration Notes](#6-integration-notes)

---

## 1. Summary of Changes

### Confirmed New (Created After Feb 15, 2026)

| Area | Description |
|------|-------------|
| **Replication Brief** | 8 canonical specification documents in `docs/prototype/final/` — complete rebuild-ready specs for Claude Opus replication |

### Likely Modified (Based on Active Development Areas)

| Area | Description |
|------|-------------|
| **Omnichannel Hub** | `/omnichannel` page with AI Agent tab, channel management, experience analytics |
| **Public Health Ops** | `/public-health` jurisdiction packs and surveillance dashboards |
| **Coverage Operations** | `/coverage` payer operations and claims adjudication |
| **AI Governance** | `/ai-governance` model registry and bias monitoring |
| **Page Spec Completions** | Various pages may have received UI polish, string corrections, or component refinements |

---

## 2. Newly Created Files (Confirmed)

These files were created on March 13, 2026 during the specification compilation session:

```
docs/prototype/final/00_executive_summary.md
docs/prototype/final/01_site_map.md
docs/prototype/final/02_page_by_page_spec.md
docs/prototype/final/03_component_inventory.md
docs/prototype/final/04_api_surface_map.md
docs/prototype/final/05_state_and_storage.md
docs/prototype/final/06_golden_paths.md
docs/prototype/final/07_opus_execution_contract.md
```

### File Descriptions

#### `00_executive_summary.md`
Executive overview of the prototype: 16 functional zones, auth model, tenancy hierarchy (Auth → Facility → Workspace → Shift), tech stack (React 19 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase + Framer Motion).

#### `01_site_map.md`
Complete catalog of all 98 routes from `src/App.tsx`. Each route mapped to: zone/module, auth guard requirement, layout wrapper (`AppLayout` / `EHRLayout` / `ModuleHome` / standalone), sidebar context, and entry points.

#### `02_page_by_page_spec.md`
Full page-by-page specification for every route. Includes: purpose, auth/guard, layout regions, component file paths, exact UI strings (headings, buttons, placeholders, toasts, empty states), step-by-step behavior, data/API mapping (Supabase queries, RPC calls, edge functions), permissions, and acceptance checklists.

#### `03_component_inventory.md`
Every shared/reusable component referenced across page specs. Documents: file path, props interface, pages that consume it, state it reads/writes, and side effects (queries, RPC, edge function calls).

#### `04_api_surface_map.md`
Exhaustive mapping of: 40+ Supabase RPC functions (name, params, returns, used-by pages), 31 edge functions (endpoint, payloads, used-by pages), all Supabase tables with columns and relationships, RLS policy notes, and storage buckets.

#### `05_state_and_storage.md`
React context tree documentation (`AuthProvider` > `FacilityProvider` > `WorkspaceProvider` > `ShiftProvider` > `EHRProvider`). All `sessionStorage`/`localStorage` keys. Auth token/session model. Workspace selection persistence logic.

#### `06_golden_paths.md`
6 end-to-end click-path scripts: (A) Email Login → ModuleHome, (B) Provider ID + Biometric → Workspace → ModuleHome, (C) Queue → Encounter → Close, (D) Admin → TSHEPO Audit, (E) Marketplace flow, (F) Registry browse. Each references exact routes and UI strings.

#### `07_opus_execution_contract.md`
"No deviation" protocol for Claude Opus replication. 11-phase implementation order covering all 98 routes. Acceptance checklist mapping to per-page checklists. Scope boundaries and verification criteria.

---

## 3. Complete Project File Inventory

Below is the full file inventory of the project, organized by directory. Use this to diff against your Feb 15, 2026 snapshot.

### Root Config Files

```
src/App.tsx                          — Router with all 98 routes, provider tree
src/App.css                          — Global CSS overrides
src/index.css                        — Design system tokens (HSL variables, gradients, shadows)
src/main.tsx                         — React entry point
src/vite-env.d.ts                    — Vite type declarations
src/tailwind.config.lov.json         — Lovable-specific Tailwind overrides
```

### Pages (`src/pages/`)

| File | Route | Description |
|------|-------|-------------|
| `ModuleHome.tsx` | `/` | Module home with 3 tabs (Work/Professional/Life), emergency FAB, workspace hub |
| `Auth.tsx` | `/auth` | 4 login pathways: Provider ID+Biometric, Patient Portal, Staff Email, System Maintenance |
| `ResetPassword.tsx` | `/reset-password` | Password reset form |
| `ForgotPassword.tsx` | `/forgot-password` | Forgot password email request |
| `Dashboard.tsx` | `/dashboard` | Provider worklist dashboard |
| `Encounter.tsx` | `/encounter`, `/encounter/:id` | EHR encounter workspace with 8-section menu |
| `Queue.tsx` | `/queue` | Patient queue management |
| `Beds.tsx` | `/beds` | Bed/ward management |
| `Appointments.tsx` | `/appointments` | Appointment management |
| `Patients.tsx` | `/patients` | Patient registry browser |
| `Registration.tsx` | `/registration` | Patient registration wizard |
| `Pharmacy.tsx` | `/pharmacy` | Pharmacy dispensing |
| `Theatre.tsx` | `/theatre` | Theatre/OR management |
| `Orders.tsx` | `/orders` | Clinical orders hub |
| `LIMS.tsx` | `/lims` | Laboratory information system |
| `PACS.tsx` | `/pacs` | PACS imaging viewer |
| `Handoff.tsx` | `/handoff` | Shift handoff |
| `PatientSorting.tsx` | `/sorting` | Patient triage/sorting |
| `Discharge.tsx` | `/discharge` | Discharge workflows |
| `Communication.tsx` | `/communication` | Messages, pages, calls |
| `Telemedicine.tsx` | `/telemedicine` | Teleconsultation hub |
| `Stock.tsx` | `/stock` | Stock/inventory management |
| `Consumables.tsx` | `/consumables` | Consumables tracking |
| `Charges.tsx` | `/charges` | Charge capture |
| `Payments.tsx` | `/payments` | Payment processing |
| `Operations.tsx` | `/operations` | Facility operations |
| `Reports.tsx` | `/reports` | Reporting dashboard |
| `ProfileSettings.tsx` | `/profile` | User profile settings |
| `AdminDashboard.tsx` | `/admin` | Admin dashboard |
| `AboveSiteDashboard.tsx` | `/above-site` | Above-site/jurisdictional oversight |
| `WorkspaceManagement.tsx` | `/workspace-management` | Workspace administration |
| `Landela.tsx` | `/landela` | Document management |
| `Odoo.tsx` | `/odoo` | Odoo ERP integration |
| `HelpDesk.tsx` | `/help` | Help desk / support |
| `RegistryManagement.tsx` | `/registry-management` | Registry admin hub |
| `HealthProviderRegistry.tsx` | `/hpr` | Health provider registry |
| `FacilityRegistry.tsx` | `/facility-registry` | Facility registry |
| `ClientRegistry.tsx` | `/client-registry` | Client/patient registry |
| `IdServices.tsx` | `/id-services` | ID generation & validation |
| `Social.tsx` | `/social` | Social/community features |
| `Portal.tsx` | `/portal` | Patient portal (public) |
| `Install.tsx` | `/install` | PWA install page (public) |
| `Kiosk.tsx` | `/kiosk` | Self-service kiosk (public) |
| `ProductCatalogue.tsx` | `/catalogue` | Product catalogue (public) |
| `HealthMarketplace.tsx` | `/marketplace` | Health marketplace (public) |
| `PrescriptionFulfillment.tsx` | `/fulfillment` | Rx fulfillment bidding |
| `VendorPortal.tsx` | `/vendor-portal` | Vendor bid management |
| `SharedSummary.tsx` | `/shared/:type/:token` | Public shared summary viewer |
| `PublicHealthOps.tsx` | `/public-health` | Public health operations |
| `CoverageOperations.tsx` | `/coverage` | Coverage/payer operations |
| `AIGovernance.tsx` | `/ai-governance` | AI governance dashboard |
| `OmnichannelHub.tsx` | `/omnichannel` | Omnichannel experience hub |
| `NotFound.tsx` | `*` | 404 page |

### Admin Pages (`src/pages/admin/`)

| File | Route | Kernel Module |
|------|-------|---------------|
| `TshepoConsentAdmin.tsx` | `/admin/tshepo/consents` | TSHEPO — Consent management |
| `TshepoAuditSearch.tsx` | `/admin/tshepo/audit` | TSHEPO — Audit log search |
| `TshepoBreakGlass.tsx` | `/admin/tshepo/breakglass` | TSHEPO — Break-glass access |
| `TshepoPatientAccessHistory.tsx` | `/admin/tshepo/access-history` | TSHEPO — Patient access history |
| `TshepoOfflineStatus.tsx` | `/admin/tshepo/offline` | TSHEPO — Offline sync status |
| `VitoPatients.tsx` | `/admin/vito/patients` | VITO — Patient identity browser |
| `VitoMergeQueue.tsx` | `/admin/vito/merges` | VITO — Duplicate merge queue |
| `VitoEventsViewer.tsx` | `/admin/vito/events` | VITO — Identity events viewer |
| `VitoAuditViewer.tsx` | `/admin/vito/audit` | VITO — Identity audit log |
| `TusoFacilities.tsx` | `/admin/tuso/facilities` | TUSO — Facility management |
| `TusoWorkspaces.tsx` | `/admin/tuso/workspaces` | TUSO — Workspace management |
| `TusoStartShift.tsx` | `/admin/tuso/start-shift` | TUSO — Shift initiation |
| `TusoResources.tsx` | `/admin/tuso/resources` | TUSO — Resource allocation |
| `TusoConfig.tsx` | `/admin/tuso/config` | TUSO — Configuration |
| `TusoControlTower.tsx` | `/admin/tuso/control-tower` | TUSO — Control tower |
| `VarapiProviders.tsx` | `/admin/varapi/providers` | VARAPI — Provider registry |
| `VarapiPrivileges.tsx` | `/admin/varapi/privileges` | VARAPI — Privilege management |
| `VarapiCouncils.tsx` | `/admin/varapi/councils` | VARAPI — Council management |
| `VarapiTokens.tsx` | `/admin/varapi/tokens` | VARAPI — API tokens |
| `VarapiPortal.tsx` | `/admin/varapi/portal` | VARAPI — Provider self-service |
| `ButanoTimeline.tsx` | `/admin/butano/timeline` | BUTANO — Patient timeline |
| `ButanoIPS.tsx` | `/admin/butano/ips` | BUTANO — International Patient Summary |
| `ButanoVisitSummary.tsx` | `/admin/butano/visit-summary` | BUTANO — Visit summary |
| `ButanoReconciliation.tsx` | `/admin/butano/reconciliation` | BUTANO — Data reconciliation |
| `ButanoStats.tsx` | `/admin/butano/stats` | BUTANO — Statistics dashboard |
| `SuiteDocsConsole.tsx` | `/admin/suite/docs` | Suite — Document console |
| `SuiteSelfService.tsx` | `/admin/suite/portal` | Suite — Self-service portal |
| `PctWorkTab.tsx` | `/admin/pct/work` | PCT — Work queue |
| `PctControlTower.tsx` | `/admin/pct/control-tower` | PCT — Control tower |
| `ZiboAdmin.tsx` | `/admin/zibo` | ZIBO — Terminology service |
| `OrosAdmin.tsx` | `/admin/oros` | OROS — Orders & results |
| `PharmacyAdmin.tsx` | `/admin/pharmacy` | Pharmacy service admin |
| `InventoryAdmin.tsx` | `/admin/inventory` | Inventory admin |
| `MsikaCoreAdmin.tsx` | `/admin/msika-core` | MSIKA Core — Product registry |
| `MsikaFlowAdmin.tsx` | `/admin/msika-flow` | MSIKA Flow — Commerce |
| `CostaAdmin.tsx` | `/admin/costa` | COSTA — Costing engine |
| `MushexAdmin.tsx` | `/admin/mushex` | MUSHEX — Payment switch |
| `IndawoAdmin.tsx` | `/admin/indawo` | INDAWO — Site registry |
| `UbomiAdmin.tsx` | `/admin/ubomi` | UBOMI — CRVS interface |
| `ProductManagement.tsx` | `/admin/product-registry` | Product management |

### Scheduling Pages (`src/pages/scheduling/`)

```
AppointmentScheduling.tsx            — /scheduling — Appointment scheduling
TheatreScheduling.tsx                — /scheduling/theatre — Theatre scheduling
ProviderNoticeboard.tsx              — /scheduling/noticeboard — Provider noticeboard
ResourceCalendar.tsx                 — /scheduling/resources — Resource calendar
```

### Contexts (`src/contexts/`)

```
AuthContext.tsx                      — Auth state, session, sign-in/out, profile
EHRContext.tsx                       — Active encounter, patient, sections, chart lock
FacilityContext.tsx                  — Active facility, capabilities, department
ProviderContext.tsx                  — Provider identity, role, specialty
ShiftContext.tsx                     — Shift tracking, duration, handoff state
WorkspaceContext.tsx                 — Active workspace, workstation, page context
```

### Hooks (`src/hooks/`)

```
use-mobile.tsx                       — Mobile breakpoint detection
use-toast.ts                         — Toast notification hook
useAboveSiteInterventions.ts         — Above-site intervention CRUD
useAboveSiteRole.ts                  — Above-site role resolution
useActiveWorkContext.ts              — Active work context resolution
useBedData.ts                        — Bed management data
useBillingData.ts                    — Billing/charge data
useCPDTracker.ts                     — CPD point tracking
useCPDTracking.ts                    — CPD tracking state
useCarePlanData.ts                   — Care plan items
useChargeCapture.ts                  — Charge capture workflow
useClaimsData.ts                     — Insurance claims
useClientQueue.ts                    — Client queue management
useClientRegistryData.ts             — Client registry CRUD
useClinicalAlerts.ts                 — Clinical alert management
useClinicalNotes.ts                  — Clinical notes CRUD
useClinicalObservations.ts           — Vital signs / observations
useCostEngine.ts                     — COSTA costing engine client
useDashboardData.ts                  — Dashboard metrics
useFacilityCapabilities.ts           — Facility capability checks
useFacilityData.ts                   — Facility data queries
useFederationGuard.ts                — Federation/tenant guard
useFulfillmentActions.ts             — Fulfillment order actions
useHelpdesk.ts                       — Helpdesk ticket CRUD
useIdempotentMutation.ts             — Idempotent mutation wrapper
useKernelError.ts                    — Kernel error formatting
useKernelRequest.ts                  — Kernel edge function caller
useLabData.ts                        — Lab orders/results
useLandelaNotifications.ts           — Landela doc notifications
useLicenseCheck.ts                   — Provider license validation
useMedicationReconciliation.ts       — Med reconciliation workflow
useMultiParticipantSession.ts        — Multi-participant telehealth
useOrderQueueIntegration.ts          — Order-to-queue bridge
usePACSViewer.ts                     — PACS viewer state
usePIIProtection.ts                  — PII masking/protection
usePatientAllergies.ts               — Patient allergy data
usePatientProblems.ts                — Patient problem list
usePatientSorting.ts                 — Triage sorting logic
usePaymentData.ts                    — Payment processing
usePaymentOrchestrator.ts            — MUSHEX payment orchestrator
usePermissions.ts                    — Role/permission checks
usePortalMarketplaceIntegration.ts   — Portal-marketplace bridge
usePrescriptionData.ts               — Prescription data
usePresence.ts                       — User presence/online status
useProfessionalEmails.ts             — Professional email integration
useProfileRegistry.ts                — Profile registry sync
useProviderFacilities.ts             — Provider facility assignments
useProviderQueues.ts                 — Provider queue assignments
usePushNotifications.ts              — Push notification management
useQueueAppointments.ts              — Queue-appointment bridge
useQueueData.ts                      — Queue data queries
useQueueManagement.ts                — Queue management actions
useReferralData.ts                   — Referral CRUD
useReferralPackageBuilder.ts         — Referral package composition
useRegistryAdmin.ts                  — Registry admin operations
useRegistryRecords.ts                — Registry record CRUD
useRegistrySync.ts                   — Registry sync status
useReportingData.ts                  — Report generation
useResultAcknowledgments.ts          — Lab result acknowledgments
useRosterData.ts                     — Staff roster data
useShiftManagement.ts                — Shift start/end/handoff
useSpecimenData.ts                   — Specimen tracking
useStockManagement.ts                — Stock CRUD
useSummaries.ts                      — Summary generation
useSystemRoles.ts                    — System role management
useTeleconsultSession.ts             — Teleconsult session management
useTeleconsultSessionDraft.ts        — Teleconsult draft state
useTeleconsultation.ts               — Teleconsultation workflow
useTelemedicinePools.ts              — Virtual pool management
useTelemedicineRecording.ts          — Call recording consent
useTelemedicineRoles.ts              — Telemedicine role checks
useTelemedicineTrustLayer.ts         — Telemedicine trust/consent
useTheatreData.ts                    — Theatre booking/scheduling
useTrainingCatalog.ts                — Training module catalog
useUserRoles.ts                      — User role queries
useVirtualPools.ts                   — Virtual pool management
useVitalSigns.ts                     — Vital signs recording
useVoiceCalling.ts                   — Voice call management
useWebRTC.ts                         — WebRTC peer connection
useWorkspaceData.ts                  — Workspace data queries
useWorkspaceMemberships.ts           — Workspace membership CRUD
```

#### LIMS Hooks (`src/hooks/lims/`)

```
index.ts
useLabAnalyzers.ts                   — Lab analyzer integration
useLabCriticalAlerts.ts              — Critical lab alert management
useLabOrderEntry.ts                  — Lab order entry workflow
useLabQC.ts                          — Quality control (Levey-Jennings)
useLabResultValidation.ts            — Result validation workflow
useLabTestCatalog.ts                 — Test catalog management
```

#### PACS Hooks (`src/hooks/pacs/`)

```
index.ts
usePACSAdmin.ts                      — PACS admin operations
usePACSConsults.ts                   — PACS consultation requests
usePACSCriticalFindings.ts           — Critical finding alerts
usePACSWorklist.ts                   — Radiologist worklist
```

### Components (`src/components/`)

#### Layout (`src/components/layout/`)

```
AppLayout.tsx                        — Main app shell (sidebar + header + content)
AppHeader.tsx                        — Top header (search, facility, notifications, user)
AppSidebar.tsx                       — Side navigation (11 context-dependent configs)
EHRLayout.tsx                        — EHR shell (TopBar + PatientBanner + WorkArea + Menu)
EncounterMenu.tsx                    — 8-item encounter section menu
TopBar.tsx                           — EHR top bar with action buttons
MainWorkArea.tsx                     — EHR main content area
FacilitySelector.tsx                 — Facility dropdown
WorkspaceSelector.tsx                — Workspace dropdown
ActiveWorkspaceIndicator.tsx         — Workspace status badge
```

#### Auth (`src/components/auth/`)

```
ProtectedRoute.tsx                   — Auth guard wrapper
ProviderIdLookup.tsx                 — Provider ID lookup form
BiometricAuth.tsx                    — Biometric verification
WorkspaceSelection.tsx               — Workspace/department picker
AboveSiteContextSelection.tsx        — Above-site context picker
ClientAuth.tsx                       — Patient portal auth
SystemMaintenanceAuth.tsx            — Maintenance mode auth
EmailVerificationStatus.tsx          — Email verification display
PasswordValidator.tsx                — Password strength validator
PermissionsDisplay.tsx               — Permission display component
RoleGate.tsx                         — Role-based visibility gate
TwoFactorSetup.tsx                   — 2FA setup flow
TwoFactorVerify.tsx                  — 2FA verification
UserMenu.tsx                         — User dropdown menu
```

#### EHR (`src/components/ehr/`)

```
PatientBanner.tsx                    — Patient identification banner
TopBarPanel.tsx                      — Top bar action panel
AIDiagnosticAssistant.tsx            — AI diagnostic support
AllergiesAlert.tsx                   — Allergy warning display
ChartAccessDialog.tsx                — Chart access/close dialog
ClinicalDecisionSupport.tsx          — CDS alerts
CriticalEventButton.tsx              — Critical event trigger
CriticalEventWorkspace.tsx           — Critical event workspace
EncounterSection.tsx                 — Section content renderer
LiveVitalsMonitor.tsx                — Real-time vitals display
MedicationAdministrationRecord.tsx   — MAR display
NoPatientSelected.tsx                — Empty state for no patient
PostEncounterNavigation.tsx          — Post-encounter routing
SecureChartAccessFlow.tsx            — Secure chart access flow
VitalsMonitor.tsx                    — Vitals monitoring panel
WorkspaceView.tsx                    — Workspace view container
```

##### EHR Sections (`src/components/ehr/sections/`)

```
OverviewSection.tsx                  — Encounter overview
AssessmentSection.tsx                — Clinical assessment
ProblemsSection.tsx                  — Active problems list
LiveProblemsSection.tsx              — Live problems management
OrdersSection.tsx                    — Orders & results
CareSection.tsx                      — Care & management plans
ConsultsSection.tsx                  — Consults & referrals
NotesSection.tsx                     — Notes & attachments
OutcomeSection.tsx                   — Visit outcome
```

##### EHR Consults Sub-sections (`src/components/ehr/sections/consults/`)

```
ConsultationsTab.tsx                 — Consultations list
ReferralsTab.tsx                     — Referrals list
TeleconsultsTab.tsx                  — Teleconsult sessions
```

##### EHR Beds (`src/components/ehr/beds/`)

```
BedManagement.tsx                    — Ward/bed management
BedCard.tsx                          — Individual bed card
BedActionDialog.tsx                  — Bed action (admit/transfer/discharge)
WardStats.tsx                        — Ward statistics
```

##### EHR Care (`src/components/ehr/care/`)

```
NursingCarePlan.tsx                  — Nursing care plan
NursingInterventions.tsx             — Nursing interventions
TreatmentGoals.tsx                   — Treatment goal tracking
```

##### EHR Clerking (`src/components/ehr/clerking/`)

```
ClerkingFormEditor.tsx               — Clerking form editor
ClerkingTemplateSelector.tsx         — Template selection
```

##### EHR Consults (`src/components/ehr/consults/`)

```
ConsultsDashboard.tsx                — Consults overview dashboard
ReferralBuilder.tsx                  — Referral creation form
ReferralPackageBuilderDialog.tsx     — Referral package dialog
ReferralPackageViewer.tsx            — Referral package viewer
OutgoingReferralWorkflow.tsx         — Outgoing referral workflow
IncomingConsultWorkflow.tsx          — Incoming consult workflow
ConsultationResponseBuilder.tsx      — Consult response builder
TeleconsultSession.tsx               — Teleconsult session
TeleconsultStatusTracker.tsx         — Teleconsult status
TelehealthDashboard.tsx              — Telehealth overview
TelehealthChatSidebar.tsx            — Chat sidebar in telehealth
TelemedicineModeSelection.tsx        — Mode selection (video/audio/chat)
TelemedicineWorkflow.tsx             — Telemedicine workflow
FullCircleTelemedicineHub.tsx        — Full-circle telemedicine
LiveSessionWorkspace.tsx             — Live session workspace
VideoCallPanel.tsx                   — Video call UI
InstantCallOverlay.tsx               — Instant call overlay
InstantCommunicationPanel.tsx        — Instant communication
AsyncReviewSession.tsx               — Async review session
AsynchronousReviewPane.tsx           — Async review pane
CompletionNote.tsx                   — Completion note form
RecordingIndicator.tsx               — Recording status indicator
AddParticipantDialog.tsx             — Add participant to call
index.ts                             — Barrel export
```

##### EHR Consult Sessions (`src/components/ehr/consults/sessions/`)

```
VideoCallSession.tsx                 — Video call session
AudioCallSession.tsx                 — Audio call session
ChatSession.tsx                      — Chat session
ScheduledAppointmentSession.tsx      — Scheduled appointment
CaseReviewBoardSession.tsx           — Case review board
index.ts
```

##### EHR Discharge (`src/components/ehr/discharge/`)

```
DischargeWorkflow.tsx                — EHR-embedded discharge
```

##### EHR Orders (`src/components/ehr/orders/`)

```
OrderSetsSystem.tsx                  — Order set management
OrderSetCard.tsx                     — Order set display card
OrderSetDialog.tsx                   — Order set dialog
orderSetsData.ts                     — Order set mock data
```

##### EHR Queue (`src/components/ehr/queue/`)

```
QueueManagement.tsx                  — Queue management
QueueManagementLive.tsx              — Live queue management
QueuePatientCard.tsx                 — Patient card in queue
QueueStats.tsx                       — Queue statistics
AddPatientDialog.tsx                 — Add patient to queue
```

##### EHR Workspaces (`src/components/ehr/workspaces/`)

```
AnaesthesiaPreOpWorkspace.tsx        — Anaesthesia pre-op
BurnsWorkspace.tsx                   — Burns workspace
ChemotherapyWorkspace.tsx            — Chemotherapy
DialysisWorkspace.tsx                — Dialysis
LabourDeliveryWorkspace.tsx          — Labour & delivery
MinorProcedureWorkspace.tsx          — Minor procedures
NeonatalResusWorkspace.tsx           — Neonatal resuscitation
PatientFileWorkspace.tsx             — General patient file
PhysiotherapyWorkspace.tsx           — Physiotherapy
PoisoningWorkspace.tsx               — Poisoning management
PsychotherapyWorkspace.tsx           — Psychotherapy
RadiotherapyWorkspace.tsx            — Radiotherapy
ResuscitationWorkspace.tsx           — Resuscitation
SexualAssaultWorkspace.tsx           — Sexual assault (J88)
TeleconsultationWorkspace.tsx        — Teleconsultation
TheatreWorkspace.tsx                 — Theatre/OR
TraumaWorkspace.tsx                  — Trauma
VirtualCareWorkspace.tsx             — Virtual care
```

#### Home (`src/components/home/`)

```
WorkplaceSelectionHub.tsx            — Workplace/context selection
ExpandableCategoryCard.tsx           — Module category card
MyProfessionalHub.tsx                — Professional tab content
PersonalHub.tsx                      — Personal tab content
```

#### Queue (`src/components/queue/`)

```
QueueWorkstation.tsx                 — Queue workstation view
QueueItemCard.tsx                    — Queue item card
SecureQueueCard.tsx                  — Secure/masked queue card
QueueMetricsBar.tsx                  — Queue metrics display
AddToQueueDialog.tsx                 — Add-to-queue dialog
QueueConfigManager.tsx               — Queue configuration
QueuePathwayEditor.tsx               — Queue pathway editor
QueueAppointmentsPanel.tsx           — Appointments in queue
QueueToEncounterBridge.tsx           — Queue-to-encounter bridge
SupervisorDashboard.tsx              — Supervisor overview
index.ts
```

#### Clinical (`src/components/clinical/`)

```
SOAPNoteEditor.tsx                   — SOAP note editor
LiveSOAPNoteEditor.tsx               — Live SOAP note editor
MedicationOrders.tsx                 — Medication order entry
MedicationReconciliationWorkflow.tsx — Med reconciliation
ResultsReviewPanel.tsx               — Results review
VitalsRecorder.tsx                   — Vitals recording form
```

#### Orders (`src/components/orders/`)

```
OrderEntrySystem.tsx                 — Order entry system
PatientOrdersView.tsx                — Patient orders view
PatientSelector.tsx                  — Patient selection
MedicationAdministration.tsx         — Medication administration
MedicationReconciliation.tsx         — Med reconciliation
MedicationTimeline.tsx               — Medication timeline
MARTimelineView.tsx                  — MAR timeline view
NurseMedDashboard.tsx                — Nurse medication dashboard
DrugInteractionChecker.tsx           — Drug interaction check
AllergyCrossCheck.tsx                — Allergy cross-check
BarcodeScanner.tsx                   — Barcode scanning
SignaturePad.tsx                     — Digital signature
```

#### Lab (`src/components/lab/`)

```
LIMSIntegration.tsx                  — LIMS integration hub
LabOrderEntryForm.tsx                — Lab order entry
LabResultsSystem.tsx                 — Results system
LabResultValidationWorkflow.tsx      — Result validation
LabAnalyzerDashboard.tsx             — Analyzer management
LabCriticalAlertsDashboard.tsx       — Critical alerts
LeveyJenningsChart.tsx               — QC Levey-Jennings chart
SpecimenCollection.tsx               — Specimen collection
SpecimenChainOfCustody.tsx           — Specimen chain of custody
```

#### Imaging (`src/components/imaging/`)

```
PACSViewer.tsx                       — PACS viewer
DicomCanvas.tsx                      — DICOM canvas renderer
RadiologistWorklist.tsx              — Radiologist worklist
CriticalFindingsManager.tsx          — Critical findings
HangingProtocols.tsx                 — Hanging protocols
MPRViewer.tsx                        — Multi-planar reconstruction
PACSAdminDashboard.tsx               — PACS admin
TeleradiologyHub.tsx                 — Teleradiology
index.ts
```

#### Pharmacy (`src/components/pharmacy/`)

```
EPrescriptionBuilder.tsx             — E-prescription builder
MedicationDispensing.tsx             — Medication dispensing
FiveRightsVerification.tsx           — 5-rights verification
```

#### Sorting (`src/components/sorting/`)

```
PatientSortingDesk.tsx               — Sorting desk
SortingWorkflow.tsx                  — Sorting workflow
SortingSessionCard.tsx               — Sorting session card
SortingMetricsPanel.tsx              — Sorting metrics
SortingCompletionDialog.tsx          — Completion dialog
index.ts
```

#### Discharge (`src/components/discharge/`)

```
DischargeDashboard.tsx               — Discharge dashboard
DischargeWorkflowPanel.tsx           — Workflow panel
DischargeWorkflowStepper.tsx         — Workflow stepper
ClearanceChecklist.tsx               — Clearance checklist
DeathDeclarationForm.tsx             — Death declaration
index.ts
types.ts
```

#### Handoff (`src/components/handoff/`)

```
EnhancedShiftHandoff.tsx             — Enhanced shift handoff
ShiftHandoffReport.tsx               — Handoff report
HandoffHistory.tsx                   — Handoff history
HandoffNotifications.tsx             — Handoff notifications
```

#### Communication (`src/components/communication/`)

```
CommunicationHub.tsx                 — Communication hub
ClinicalMessaging.tsx                — Clinical messaging
ClinicalPaging.tsx                   — Clinical paging
VoiceCall.tsx                        — Voice call
```

#### Portal (`src/components/portal/`)

```
PatientPortal.tsx                    — Patient portal shell
HealthIdCard.tsx                     — Health ID card display
HealthIdCreationWizard.tsx           — Health ID creation
HealthIdManager.tsx                  — Health ID management
HealthRecordsViewer.tsx              — Health records viewer
PortalCheckin.tsx                    — Portal check-in
PortalOrdersResults.tsx              — Portal orders/results
PortalQueueStatus.tsx                — Portal queue status
PrescriptionRefillRequest.tsx        — Prescription refill
RemoteQueueRequestDialog.tsx         — Remote queue join
ServiceDiscovery.tsx                 — Service discovery
TelehealthSession.tsx                — Telehealth session
EmergencySOS.tsx                     — Emergency SOS
```

##### Portal Modules (`src/components/portal/modules/`)

```
PortalAppointments.tsx               — Portal appointments
PortalCommunities.tsx                — Portal communities
PortalConsentDashboard.tsx           — Portal consent management
PortalHealthTimeline.tsx             — Portal health timeline
PortalMarketplace.tsx                — Portal marketplace
PortalMedications.tsx                — Portal medications
PortalRemoteMonitoring.tsx           — Remote monitoring
PortalSecureMessaging.tsx            — Secure messaging
PortalWallet.tsx                     — Health wallet
PortalWellness.tsx                   — Wellness hub
```

##### Portal PHR (`src/components/portal/modules/phr/`)

```
PortalPHRHub.tsx                     — PHR hub
AllergyList.tsx                      — Allergy list
ConditionsList.tsx                   — Conditions list
ClinicalDocuments.tsx                — Clinical documents
HealthDataExport.tsx                 — Health data export
IPSViewer.tsx                        — IPS viewer
ImmunizationRecords.tsx              — Immunizations
index.ts
```

##### Portal Wellness (`src/components/portal/modules/wellness/`)

```
WellnessActivityTracker.tsx          — Activity tracker
WellnessCareBridge.tsx               — Care bridge
WellnessChallenges.tsx               — Challenges
WellnessCommunities.tsx              — Communities
WellnessEvents.tsx                   — Events
WellnessMarketplace.tsx              — Marketplace
WellnessMoodTracker.tsx              — Mood tracker
WellnessNutritionSleep.tsx           — Nutrition & sleep
WellnessVitalsTracker.tsx            — Vitals tracker
```

#### Registration (`src/components/registration/`)

```
RegistrationWizard.tsx               — Patient registration wizard
DuplicateSearchStep.tsx              — Duplicate search
AddressCapture.tsx                   — Address capture
BiometricCapture.tsx                 — Biometric capture
ConsentCapture.tsx                   — Consent capture
MedicalAidCapture.tsx                — Medical aid capture
VisitCreation.tsx                    — Visit creation
IAMArchitecture.tsx                  — IAM architecture display
```

#### Payments (`src/components/payments/`)

```
CashierBillingDashboard.tsx          — Cashier billing dashboard
PaymentGateway.tsx                   — Payment gateway
PaymentMethods.tsx                   — Payment methods
CashReconciliation.tsx               — Cash reconciliation
InsuranceClaims.tsx                  — Insurance claims
ClaimsManagement.tsx                 — Claims management
CostTrackingDashboard.tsx            — Cost tracking
HealthWallet.tsx                     — Health wallet
RemittanceProcessing.tsx             — Remittance processing
RemittanceViewer.tsx                 — Remittance viewer
CBZBankIntegration.tsx               — CBZ Bank integration
```

#### Stock (`src/components/stock/`)

```
StockAlertsDashboard.tsx             — Stock alerts
StockCountWorkflow.tsx               — Stock count workflow
PurchaseOrderManager.tsx             — Purchase order management
```

#### Charges (`src/components/charges/`)

```
ChargeCaptureQueue.tsx               — Charge capture queue
PricingRulesManager.tsx              — Pricing rules
```

#### Facility (`src/components/facility/`)

```
FacilityDashboard.tsx                — Facility dashboard
FacilityList.tsx                     — Facility list
FacilityDetailPanel.tsx              — Facility detail panel
FacilityRegistrationWizard.tsx       — Facility registration
FacilityMapView.tsx                  — Facility map
FacilityReconciliation.tsx           — Facility reconciliation
FacilityReferenceData.tsx            — Reference data
FacilityReports.tsx                  — Facility reports
FacilityChangeRequests.tsx           — Change requests
```

#### HPR (`src/components/hpr/`)

```
HPRDashboard.tsx                     — HPR dashboard
HPRAuditLog.tsx                      — HPR audit log
HPRReports.tsx                       — HPR reports
ProviderRegistrationWizard.tsx       — Provider registration
ProviderDetailPanel.tsx              — Provider detail
ProviderEditForm.tsx                 — Provider edit form
ProviderRecordForms.tsx              — Provider records
ProviderDocumentsTab.tsx             — Provider documents
ProviderCPDTab.tsx                   — Provider CPD
LicenseRenewalTab.tsx                — License renewal
MyCMEDashboard.tsx                   — CME dashboard
ProfessionalCouncilsManager.tsx      — Council management
BulkUploadDialog.tsx                 — Bulk upload
EligibilityTester.tsx                — Eligibility testing
IHRISProviderPanel.tsx               — iHRIS integration
IdPEventsPanel.tsx                   — IdP events
ReferenceDataManager.tsx             — Reference data
```

#### Client Registry (`src/components/clientRegistry/`)

```
ClientRegistryDashboard.tsx          — Dashboard
ClientList.tsx                       — Client list
ClientDetailPanel.tsx                — Client detail
ClientRegistrationWizard.tsx         — Registration wizard
ClientDuplicateQueue.tsx             — Duplicate queue
ClientMergeHistoryPanel.tsx          — Merge history
ClientMatchingRules.tsx              — Matching rules
ClientRegistryReports.tsx            — Reports
HealthIdVerification.tsx             — Health ID verification
```

#### CRVS (`src/components/crvs/`)

```
CRVSDashboard.tsx                    — CRVS dashboard
BirthNotificationForm.tsx            — Birth notification
DeathNotificationForm.tsx            — Death notification
MCCDForm.tsx                         — Medical certificate of cause of death
VerbalAutopsyForm.tsx                — Verbal autopsy
RegistrarQueue.tsx                   — Registrar queue
CertificatesList.tsx                 — Certificates list
CommunitySubmissions.tsx             — Community submissions
QualityFlags.tsx                     — Quality flags
index.ts
types.ts
```

#### Social (`src/components/social/`)

```
TimelineFeed.tsx                     — Timeline feed
NewsFeedWidget.tsx                   — News feed
CommunitiesList.tsx                  — Communities
ClubsList.tsx                        — Clubs
CrowdfundingCampaigns.tsx            — Crowdfunding
ProfessionalPages.tsx                — Professional pages
```

#### Marketplace (`src/components/marketplace/`)

```
BidNotifications.tsx                 — Bid notifications
PackageDeals.tsx                     — Package deals
VendorRating.tsx                     — Vendor ratings
```

#### Fulfillment (`src/components/fulfillment/`)

```
OrderDetailsDialog.tsx               — Order details dialog
OrderStatusActions.tsx               — Order status actions
OrderTrackingTimeline.tsx            — Order tracking timeline
```

#### Other Components

```
src/components/admin/ForcePasswordReset.tsx
src/components/admin/IpWhitelist.tsx
src/components/admin/LockedAccounts.tsx
src/components/admin/SecurityEvents.tsx
src/components/admin/SessionsManagement.tsx
src/components/admin/SystemSettings.tsx
src/components/alerts/ClinicalAlerts.tsx
src/components/alerts/EscalatingMedicationAlerts.tsx
src/components/alerts/MedicationDueAlerts.tsx
src/components/analytics/CustomReportBuilder.tsx
src/components/analytics/ReportingDashboard.tsx
src/components/booking/AdvancePayment.tsx
src/components/booking/BookingConfirmation.tsx
src/components/booking/BookingManager.tsx
src/components/booking/SelfCheckInKiosk.tsx
src/components/booking/TheatreBookingSystem.tsx
src/components/dashboard/ProviderDashboardTabs.tsx
src/components/dashboard/WorkspaceDashboard.tsx
src/components/dashboard/WorkspaceViews.tsx
src/components/documents/ClinicalDocumentScanner.tsx
src/components/documents/HealthDocumentScanner.tsx
src/components/emergency/EmergencyHub.tsx
src/components/inbox/ProviderInbox.tsx
src/components/integrations/OdooIntegration.tsx
src/components/interoperability/FHIRResourceViewer.tsx
src/components/kernel/KernelErrorAlert.tsx
src/components/kernel/SpineStatusIndicator.tsx
src/components/landela/LandelaDocumentUpload.tsx
src/components/landela/LandelaDocumentViewer.tsx
src/components/landela/PatientDocumentsPanel.tsx
src/components/notifications/PushNotificationPrompt.tsx
src/components/operations/FacilityControlTower.tsx
src/components/patient/DocumentsLibrary.tsx
src/components/patient/VisitsTimeline.tsx
src/components/patients/PatientProfile.tsx
src/components/patients/PatientRegistrationForm.tsx
src/components/professional/EmailIntegrationSetup.tsx
src/components/professional/LandelaNotificationsPanel.tsx
src/components/professional/ProfessionalEmailPanel.tsx
src/components/profile/ActivityExport.tsx
src/components/profile/AvatarUpload.tsx
src/components/profile/ClientRegistryCard.tsx
src/components/profile/LoginHistory.tsx
src/components/profile/PasswordChange.tsx
src/components/profile/ProviderRegistryCard.tsx
src/components/profile/TrustedDevices.tsx
src/components/profile/UserSessions.tsx
src/components/roster/CoverRequestWorkflow.tsx
src/components/roster/OnDutyView.tsx
src/components/roster/RosterDashboard.tsx
src/components/roster/index.ts
src/components/scheduling/AppointmentSlotPicker.tsx
src/components/search/PatientSearch.tsx
src/components/shared/DrugUnitsSelect.tsx
src/components/shift/EligibilityCheck.tsx
src/components/shift/ShiftControlPanel.tsx
src/components/shift/ShiftIndicator.tsx
src/components/shift/WorkspaceSelectorEnhanced.tsx
src/components/shift/index.ts
src/components/summaries/PatientSummaryViewer.tsx
src/components/summaries/SummaryActions.tsx
src/components/summaries/VisitSummaryViewer.tsx
src/components/summaries/index.ts
src/components/sync/OfflineConflictResolver.tsx
src/components/timeline/PatientTimeline.tsx
src/components/trust-layer/BreakGlassModal.tsx
src/components/trust-layer/IdentityVerificationBadge.tsx
src/components/trust-layer/PatientAccessHistory.tsx
src/components/trust-layer/TrustLayerConsentBadge.tsx
src/components/trust-layer/TrustLayerStatusIndicator.tsx
src/components/trust-layer/index.ts
src/components/voice/VoiceCommandButton.tsx
src/components/voice/VoiceDictation.tsx
src/components/NavLink.tsx
src/components/aboveSite/CreateInterventionDialog.tsx
src/components/aboveSite/InterventionCard.tsx
src/components/aboveSite/InterventionsList.tsx
```

### Services (`src/services/`)

```
dicomService.ts                      — DICOM file parsing
fhirImagingService.ts                — FHIR imaging adapter
hprService.ts                        — HPR API service
idGenerationService.ts               — ID generation (PHID, MRN)
idpService.ts                        — Identity provider service
ihrisService.ts                      — iHRIS integration
patientCareTrackerService.ts         — Patient care tracker
phidService.ts                       — PHID service
providerIdService.ts                 — Provider ID service
registryServices.ts                  — Registry services
summaryGenerationService.ts          — Summary generation
```

#### Trust Layer Service (`src/services/trustLayer/`)

```
auditService.ts                      — Audit logging
consentService.ts                    — Consent management
idMintService.ts                     — ID minting
offlineService.ts                    — Offline support
policyService.ts                     — Policy evaluation
index.ts
```

### Kernel Client Libraries (`src/lib/kernel/`)

```
index.ts                             — Barrel export
kernelClient.ts                      — Base kernel HTTP client
errorFormatter.ts                    — Error formatting
types.ts                             — Shared kernel types
```

#### Kernel Module Clients

```
src/lib/kernel/audit/                — Audit client
src/lib/kernel/butano/               — BUTANO SHR client
src/lib/kernel/consistency/           — Consistency checks
src/lib/kernel/costa/                — COSTA costing client
src/lib/kernel/events/               — Event bus client
src/lib/kernel/idempotency/          — Idempotency client
src/lib/kernel/inventory/            — Inventory client
src/lib/kernel/msika-core/           — MSIKA Core client
src/lib/kernel/msika-flow/           — MSIKA Flow client
src/lib/kernel/msika/               — MSIKA shared
src/lib/kernel/mushex/              — MUSHEX payment client
src/lib/kernel/offlineEntitlements/  — Offline entitlements
src/lib/kernel/oros/                 — OROS orders client
src/lib/kernel/pct/                  — PCT client
src/lib/kernel/pharmacy/             — Pharmacy client
src/lib/kernel/security/             — Security client
src/lib/kernel/suite/                — Suite client
src/lib/kernel/tshepo/              — TSHEPO consent client
src/lib/kernel/tuso/                — TUSO workspace client
src/lib/kernel/varapi/              — VARAPI provider client
src/lib/kernel/vito/                — VITO identity client
src/lib/kernel/wave2/               — Wave 2 migration
src/lib/kernel/wave3/               — Wave 3 migration
src/lib/kernel/wave4/               — Wave 4 migration
src/lib/kernel/zibo/                — ZIBO terminology client
```

### Types (`src/types/`)

```
aboveSite.ts                         — Above-site types
clientRegistry.ts                    — Client registry types
clinical.ts                          — Clinical data types
clinicalSpaces.ts                    — Clinical workspace types
ehr.ts                               — EHR types
facility.ts                          — Facility types
hpr.ts                               — HPR types
ihris.ts                             — iHRIS types
patientCareTracker.ts                — Patient care tracker types
patientContext.ts                    — Patient context types
queue.ts                             — Queue types
registry.ts                         — Registry types
roster.ts                           — Roster types
sorting.ts                          — Sorting types
summary.ts                          — Summary types
telehealth.ts                       — Telehealth types
trustLayer.ts                       — Trust layer types
workspace.ts                        — Workspace types
workspaces.ts                       — Workspaces types
```

### Data & Utils

```
src/data/clerkingTemplates.ts        — Clerking template definitions
src/data/mockClinicalData.ts         — Mock clinical data
src/utils/WebRTCManager.ts           — WebRTC connection manager
src/utils/medicationScheduleGenerator.ts — Medication schedule generator
src/lib/api/landela.ts               — Landela API client
src/lib/utils.ts                     — General utilities (cn, etc.)
```

### Assets

```
src/assets/impilo-logo.png           — Impilo logo (PNG)
public/favicon.ico                   — Favicon (ICO)
public/favicon.png                   — Favicon (PNG)
public/placeholder.svg               — Placeholder image
public/robots.txt                    — Robots.txt
```

### Test

```
src/test/setup.ts                    — Test setup (vitest)
```

---

## 4. Database Migrations

All migrations are in `supabase/migrations/`. The last migration before Feb 15 is dated **Feb 10, 2026**. No migrations were created after Feb 15, 2026.

### Migrations from Feb 10, 2026 (last batch before cutoff)

These are the most recent migrations and may need review if your baseline is from before Feb 10:

```
20260210030208_fa0a96b2-8365-42a9-81eb-5945ba9c8102.sql
20260210031507_5a744a95-e5fe-4c68-b08d-7fbd2c06cc1c.sql
20260210033039_5fb37930-dd9c-4099-a18c-e847d70126e0.sql
20260210034051_c346eb90-a1cb-4340-9a7a-e6a15116f91f.sql
20260210041035_76a8813e-4af8-45de-a89f-bbbe5c0b8fef.sql
20260210041902_34008205-aa6e-4294-8ac0-e41995ff1b01.sql
20260210043748_ac408bb3-b8f1-4b92-95ad-e36883f096da.sql
20260210044636_c60f10c2-a17d-4a28-8949-c78ebdfa1519.sql
20260210074941_32446d44-6c9c-46ed-aa4a-84d11dc8f973.sql
20260210081733_f578ee3e-103b-42f4-9018-d823543f3f34.sql
20260210084121_6d689997-4ba2-4a68-bbfe-3f5cb8d7997c.sql
20260210091320_9e752e2f-9cea-4378-b78a-64cd795e2fa0.sql
20260210092602_c38d451b-651c-4614-a0f3-936b74498180.sql
20260210094845_03d6f986-c18c-4d45-ab24-3e5a8d96468a.sql
20260210102139_a4dfaea6-6324-4fde-9768-726aeafe3ce7.sql
20260210200812_bd27a33e-dc4a-433a-8647-72d078eeaf20.sql
```

---

## 5. Edge Functions

All edge functions in `supabase/functions/`:

| Function | Description |
|----------|-------------|
| `_shared/` | Shared utilities (CORS, auth helpers) |
| `ai-diagnostic/` | AI diagnostic assistant |
| `butano-v1/` | BUTANO SHR operations |
| `cleanup-sessions/` | Session cleanup |
| `costa-v1/` | COSTA costing engine |
| `dicomweb/` | DICOM web proxy |
| `emergency-triage/` | Emergency triage AI |
| `geolocate-ip/` | IP geolocation |
| `inventory-v1/` | Inventory management |
| `landela-process-document/` | Landela document processing |
| `landela-suite-v1/` | Landela Suite operations |
| `msika-core-v1/` | MSIKA Core operations |
| `msika-flow-v1/` | MSIKA Flow commerce |
| `mushex-v1/` | MUSHEX payment switch |
| `odoo-integration/` | Odoo ERP integration |
| `oros-v1/` | OROS orders & results |
| `pct-v1/` | PCT patient care tracker |
| `pharmacy-v1/` | Pharmacy service |
| `seed-test-users/` | Test user seeding |
| `send-password-reset/` | Password reset email |
| `send-role-notification/` | Role change notification |
| `send-secure-id/` | Secure ID delivery |
| `send-security-notification/` | Security alert email |
| `send-verification-email/` | Email verification |
| `totp-management/` | TOTP 2FA management |
| `track-login-attempt/` | Login attempt tracking |
| `trust-layer/` | Trust layer evaluation |
| `tshepo/` | TSHEPO consent/audit |
| `tuso-v1/` | TUSO workspace service |
| `varapi-v1/` | VARAPI provider service |
| `vito-v1-1/` | VITO v1.1 identity service |
| `zibo-v1/` | ZIBO terminology service |

---

## 6. Integration Notes

### Recommended Diff Strategy

1. **Clone your Feb 15 baseline** into a separate directory
2. **Copy this project's `src/` directory** and diff file-by-file using `diff -rq`
3. **Focus on these high-change areas first**:
   - `src/pages/OmnichannelHub.tsx` — Omnichannel hub (user was actively viewing this)
   - `src/pages/PublicHealthOps.tsx` — Public health operations
   - `src/pages/CoverageOperations.tsx` — Coverage operations
   - `src/pages/AIGovernance.tsx` — AI governance
   - `docs/prototype/final/*` — All 8 files are confirmed new
4. **Database**: No new migrations after Feb 10, 2026
5. **Edge functions**: Diff `supabase/functions/` directory

### Files That Should NOT Be Modified

```
src/integrations/supabase/client.ts  — Auto-generated
src/integrations/supabase/types.ts   — Auto-generated
supabase/config.toml                 — Auto-generated
.env                                 — Auto-generated
```

### Provider Tree (Wrap Order)

```
QueryClientProvider > AuthProvider > FacilityProvider > WorkspaceProvider > ShiftProvider
```

Encounter pages additionally wrap in: `ProviderContextProvider > EHRProvider`

---

## Documentation Files

### `docs/prototype/` (Specification Drafts)

```
api_contracts_observed.md
api_surface_map.md
claude_build_order_plan.md
claude_opus_replication_brief.md
claude_replication_master_brief.md
claude_replication_packet.md
component_contracts.md
component_inventory.md
data_dictionary.md
golden_path_scripts.md
kernel_governance_acceptance_checklist.md
page_by_page_spec.md
seed_fixtures_spec.md
site_map.md
state_and_storage.md
storage_and_state_map.md
ui_strings_catalog.md
unknowns_and_gaps.md
unknowns_resolved_report.md
```

### `docs/prototype/flows/`

```
golden_path_admin_audit.md
golden_path_clinical_encounter.md
golden_path_login_to_module_home.md
golden_path_marketplace.md
golden_path_registry_browse.md
```

### `docs/contracts/` (Kernel API Contracts)

```
BUTANO_V1_CONTRACTS.md
COSTA_V1_CONTRACTS.md
INVENTORY_V1_CONTRACTS.md
LANDELA_SUITE_V1_CONTRACTS.md
MSIKA_CORE_V1_CONTRACTS.md
MSIKA_FLOW_V1_CONTRACTS.md
MUSHEX_V1_CONTRACTS.md
OROS_V1_CONTRACTS.md
PCT_V1_CONTRACTS.md
PHARMACY_V1_CONTRACTS.md
TSHEPO_API_CONTRACTS.md
TUSO_V1_CONTRACTS.md
VARAPI_V1_CONTRACTS.md
VITO_V1_1_CONTRACTS.md
ZIBO_V1_CONTRACTS.md
```

### Other Docs

```
docs/compliance/v1_1_gap_report.md
docs/migration/manifest_diff.md
docs/migration/wave_migration_plan.md
docs/services/TSHEPO_SERVICE_BRIEF.md
docs/spec_conflicts/lovable_v1_1_upgrade.md
docs/DESIGN_SYSTEM.md
docs/IMPILO_EHR_COMPLETE_JOURNEY.md
docs/IMPILO_EHR_REQUIREMENTS.md
docs/IMPILO_PATIENT_JOURNEY.md
docs/IMPILO_PROVIDER_JOURNEY.md
docs/IMPILO_ROADMAP.md
docs/IMPILO_TELEMEDICINE_REFERRAL_WORKFLOWS.md
docs/IMPILO_UI_FLOW_DOCUMENTATION.md
docs/PHID_Functional_Requirements.docx
docs/butano_events.md
docs/ci_notes.md
docs/offline_entitlements.md
```

---

*End of changelog. For questions about specific file changes, diff individual files against your Feb 15 baseline.*
