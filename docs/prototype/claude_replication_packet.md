# Claude Replication Packet — Impilo vNext Prototype

> **DO NOT REDESIGN. DO NOT SIMPLIFY. DO NOT CHANGE UI STRINGS.**
> This document is the canonical source of truth for exact 1:1 replication of the Lovable prototype.

---

## 1. Prototype Summary

### What This Prototype Is

Impilo vNext is a comprehensive Health Information Exchange (HIE) platform implementing an EHR, sovereign registries, and clinical workflows. The prototype spans:

- **Public zone**: Auth, Portal, Kiosk, Install, Marketplace, Catalogue, SharedSummary
- **Work zone**: ModuleHome (hub), Dashboard, Queue, Encounter (EHR), Beds, Patients, Registration, Pharmacy, Theatre, PACS, LIMS, Orders, Handoff, Communication, Telemedicine, PatientSorting, Discharge, Operations
- **Registries zone**: ClientRegistry, HealthProviderRegistry, FacilityRegistry, RegistryManagement
- **Admin zone**: AdminDashboard, ProductManagement, WorkspaceManagement, AboveSiteDashboard
- **Kernel zone** (30+ admin surfaces): TSHEPO (5 pages), VITO (4 pages), TUSO (6 pages), VARAPI (5 pages), BUTANO (5 pages), Suite (2 pages), PCT (2 pages), ZIBO, OROS, Pharmacy, Inventory, MSIKA Core, MSIKA Flow, COSTA, MUSHEX, INDAWO, UBOMI
- **Governance zone**: PublicHealthOps, CoverageOperations, AIGovernance, OmnichannelHub
- **Portal zone**: Portal (PatientPortal), Social
- **Scheduling zone**: AppointmentScheduling, TheatreScheduling, ProviderNoticeboard, ResourceCalendar
- **Finance zone**: Payments, Charges, PrescriptionFulfillment, VendorPortal
- **Other**: Reports, HelpDesk, ProfileSettings, Landela, IdServices, Odoo

### Design System Summary

- **Framework**: React 19 + Vite + Tailwind CSS + TypeScript
- **Component library**: shadcn/ui (radix primitives)
- **Animation**: framer-motion
- **Icons**: lucide-react
- **Theming**: HSL-based CSS custom properties in `index.css`, consumed via `tailwind.config.ts`
- **Semantic tokens**: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--card`, `--sidebar-*`, `--topbar-*`, `--encounter-*`, `--status-*`, `--critical`
- **Typography**: System font stack with `font-display` for headings
- **Spacing**: Tailwind default scale; sidebar width `w-48` expanded / `w-12` collapsed

### Layout System Summary

| Layout | File | Used When |
|--------|------|-----------|
| **No layout (standalone)** | — | `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/kiosk`, `/install`, `/catalogue`, `/marketplace`, `/shared/:type/:token`, `ModuleHome` (`/`) |
| **AppLayout** | `src/components/layout/AppLayout.tsx` | All protected non-clinical pages: Dashboard, Queue, Patients, Stock, Consumables, Charges, Registration, Admin, Pharmacy, Theatre, Payments, PACS, LIMS, Reports, Orders, Handoff, HelpDesk, all `/admin/*` pages, scheduling pages, registries, operations, etc. |
| **EHRLayout** | `src/components/layout/EHRLayout.tsx` | `/encounter` and `/encounter/:encounterId` — clinical documentation |

**AppLayout structure**: `<div h-screen flex>` → `<AppSidebar />` + `<div flex-1 flex-col>` → `<AppHeader />` + `<main overflow-auto>{children}</main>`

**EHRLayout structure**: `<div h-screen flex-col>` → `<TopBar />` + `<PatientBanner />` + `<div flex-1 flex>` → `<MainWorkArea />` + `<EncounterMenu />`

**ModuleHome**: Standalone full-screen layout with its own header, tabs, and module grid. No sidebar.

---

## 2. Global Navigation & Layout Rules

### Route Groups and Layouts

| Route Prefix | Layout | Auth Required | Sidebar Context |
|-------------|--------|---------------|-----------------|
| `/auth` | Standalone | No | — |
| `/reset-password` | Standalone | No | — |
| `/forgot-password` | Standalone | No | — |
| `/` (exact) | ModuleHome (standalone) | Yes | — |
| `/portal` | Standalone | No | — |
| `/kiosk` | Standalone | No | — |
| `/install` | Standalone | No | — |
| `/catalogue` | Standalone | No | — |
| `/marketplace` | Standalone | No | — |
| `/shared/:type/:token` | Standalone | No | — |
| `/encounter*` | EHRLayout | Yes | clinical |
| `/queue`, `/beds`, `/patients` | AppLayout | Yes | clinical |
| `/stock`, `/consumables`, `/charges`, `/payments` | AppLayout | Yes | operations |
| `/scheduling*`, `/appointments`, `/theatre` | AppLayout | Yes | scheduling |
| `/facility-registry`, `/hpr`, `/client-registry`, `/registry*` | AppLayout | Yes | registry |
| `/admin*` | AppLayout | Yes | admin |
| `/portal`, `/social` | AppLayout | Yes | portal |
| `/public-health` | AppLayout | Yes | public-health |
| `/coverage` | AppLayout | Yes | coverage |
| `/ai-governance` | AppLayout | Yes | ai |
| `/omnichannel` | AppLayout | Yes | omnichannel |
| All other protected routes | AppLayout | Yes | home |

### Sidebar Contexts (11 total)

Determined by `getPageContextFromPath()` in `AppSidebar.tsx`:

1. **home** (default): Quick Access (Dashboard, My Worklist, Communication, Social Hub) + Clinical (Clinical EHR, Appointments, Patients, Pharmacy) + System (ID Services, Reports, Help Desk)
2. **clinical**: Quick Access (Dashboard, My Worklist, Communication) + Clinical (Clinical EHR, Bed Management, Appointments, Patients) + Orders (Order Entry, Pharmacy, Laboratory, PACS Imaging, Shift Handoff)
3. **operations**: Operations (Dashboard, Stock Management, Consumables, Charges, Payments, Theatre)
4. **scheduling**: Scheduling (Dashboard, Appointments, Theatre Booking, Noticeboard, Resources)
5. **registry**: Registry (Back to Home, Client Registry, Provider Registry, Facility Registry) + Tools (Data Reconciliation, Change Requests, Reference Data, Reports) + Admin (Access Control, API & Integrations, Audit Log)
6. **admin**: Admin (Dashboard, System Settings, User Management, Security, Audit Logs, Integrations)
7. **portal**: Portal (Dashboard, My Health, Social Hub, Marketplace, Communication)
8. **public-health**: Public Health (Dashboard, Operations Hub, Surveillance, Outbreaks, Inspections, Campaigns, INDAWO Sites)
9. **coverage**: Coverage & Financing (Dashboard, Coverage Hub, Eligibility, Claims, Settlement, Schemes)
10. **ai**: AI & Intelligence (Dashboard, AI Governance, Insights, Model Registry)
11. **omnichannel**: Omnichannel Access (Dashboard, Channel Overview, SMS Journeys, USSD Menus, IVR/Voice, Callbacks, Trust Rules, AI Agent)

### Sidebar Behavior

- **WorkspaceSelector** shown only when `pageContext === "clinical" || pageContext === "home"`
- **Context indicator** shown for all other contexts (displays context name as uppercase label)
- **Collapse**: toggles between `w-48` (expanded) and `w-12` (collapsed). Button text: "Collapse"
- **Logo**: `impiloLogo` always present at top
- **Active state**: `bg-sidebar-primary text-sidebar-primary-foreground`

### AppHeader Behavior

- **Home button** (primary variant): shown on all pages except `/` — text "Home"
- **Back button** (ghost): shown when not on `/` or `/dashboard`
- **Title**: optional `h1` displayed after divider when provided
- **Center**: `<PatientSearch />` always present
- **Right side**: FacilitySelector (hidden on mobile), ActiveWorkspaceIndicator (hidden on mobile/tablet), VoiceCommandButton, HandoffNotifications, Bell icon with badge "3", User dropdown
- **User dropdown items**: "My Account" label, "Profile Settings", separator, "Sign Out" (destructive)

### Guarding Rules

- `<ProtectedRoute>` wraps all authenticated routes, redirects to `/auth` if no user
- Public routes: `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/install`, `/kiosk`, `/catalogue`, `/marketplace`, `/shared/:type/:token`
- Module visibility on ModuleHome is filtered by `useUserRoles` and `useFacilityCapabilities`

---

## 3. AUTH & ENTRY PATHS

### Login Pathways (4 total)

#### 3.1 Provider ID & Biometric
- **Button label**: "Provider ID & Biometric"
- **Description**: "For clinical staff with registered Provider ID"
- **Icon**: Fingerprint
- **Flow**: method-select → lookup (ProviderIdLookup) → biometric (BiometricAuth) → workspace (WorkspaceSelection) → `/`
- **Components**: `ProviderIdLookup`, `BiometricAuth`, `WorkspaceSelection`
- **Toast on success**: `Welcome, {provider.fullName}!` / `Logged in to {department} at {workstation}`
- **sessionStorage key set**: `activeWorkspace` with `{department, physicalWorkspace, workstation, facility, loginTime}`

#### 3.2 Patient Portal
- **Button label**: "Patient Portal"
- **Description**: "Access your health records & appointments"
- **Icon**: UserCircle
- **Flow**: method-select → client-auth (ClientAuth)
- **Component**: `ClientAuth`

#### 3.3 Staff Email Login
- **Button label**: "Staff Email Login"
- **Description**: "For admin and system users"
- **Icon**: Mail
- **Flow**: method-select → email-login form
- **Fields**:
  - Email: label "Email address", placeholder "you@example.com", type email, required
  - Password: label "Password", placeholder "••••••••", required, toggle show/hide
- **"Forgot password?"** link navigates to `/forgot-password`
- **Submit button**: "Sign In" / "Signing in..." (with spinner)
- **Back button**: "Back to login options"
- **Toast on success**: "Welcome back!" / "You have been logged in successfully."
- **Toast on failure**: "Login failed" / `{error.message}`

#### 3.4 System Maintenance (Hidden)
- **Button label**: "System Maintenance"
- **Description**: "Platform admins & developers only"
- **Icon**: Wrench
- **Reveal methods**: URL param `?mode=maintenance`, keyboard shortcut `Ctrl+Shift+M`, mobile long-press on logo (1500ms)
- **Toast on reveal**: "Maintenance mode revealed" (duration 2000)
- **Component**: `SystemMaintenanceAuth`
- **Styling**: amber border/background theme

### Auth Page Layout
- **Desktop**: Split layout — left half is gradient branding panel, right half is auth forms
- **Left panel heading**: "Digital Health Platform"
- **Left panel subtext**: "Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."
- **Left panel badges**: "Patient-Centered", "Secure", "Real-time"
- **Left panel footer**: "© 2025 Impilo Health. All rights reserved."
- **Mobile**: Logo shown at top of right panel (with long-press handler)
- **Bottom text**: "Secure authentication powered by Impilo" with Shield icon

### Above-Site Context (post-login redirect)
- If user has above-site roles (`isAboveSiteUser`), they are redirected to `AboveSiteContextSelection` after auth
- Component: `AboveSiteContextSelection`
- On selection: navigates to `/above-site`

---

## 4. PAGE-BY-PAGE INDEX

| Route | Zone | Layout | Auth | Sidebar Context | Purpose | Key Components | Data Sources |
|-------|------|--------|------|-----------------|---------|---------------|-------------|
| `/auth` | Public | Standalone | No | — | Login | ProviderIdLookup, BiometricAuth, WorkspaceSelection, ClientAuth, SystemMaintenanceAuth | profiles, provider_registry_logs |
| `/reset-password` | Public | Standalone | No | — | Password reset | — | auth.updateUser |
| `/forgot-password` | Public | Standalone | No | — | Request reset | — | auth.resetPasswordForEmail |
| `/` | Work | ModuleHome | Yes | — | Module hub with Work/Professional/Personal tabs | WorkplaceSelectionHub, ExpandableCategoryCard, PersonalHub, MyProfessionalHub, EmergencyHub | profiles, facilities |
| `/dashboard` | Work | AppLayout | Yes | home | Provider worklist | — | appointments, queue_items, encounters |
| `/queue` | Work | AppLayout | Yes | clinical | Patient queue | — | queue_items, queue_definitions |
| `/encounter` | Clinical | EHRLayout | Yes | — | Clinical EHR | TopBar, PatientBanner, MainWorkArea, EncounterMenu | encounters, patients, clinical_observations |
| `/encounter/:encounterId` | Clinical | EHRLayout | Yes | — | Specific encounter | Same as above | Same |
| `/beds` | Clinical | AppLayout | Yes | clinical | Ward/bed management | — | beds |
| `/appointments` | Scheduling | AppLayout | Yes | scheduling | Appointment list | — | appointments |
| `/patients` | Clinical | AppLayout | Yes | clinical | Patient list | — | patients |
| `/stock` | Operations | AppLayout | Yes | operations | Inventory | — | inventory items |
| `/consumables` | Operations | AppLayout | Yes | operations | Consumables tracking | — | consumables |
| `/charges` | Operations | AppLayout | Yes | operations | Charge capture | — | charge_sheets |
| `/registration` | Work | AppLayout | Yes | home | Patient registration | — | patients, client_registry |
| `/profile` | Work | AppLayout | Yes | home | User settings | — | profiles |
| `/admin` | Admin | AppLayout | Yes | admin | System admin | — | profiles, user_sessions |
| `/pharmacy` | Clinical | AppLayout | Yes | clinical | Dispensing | — | prescriptions |
| `/theatre` | Clinical | AppLayout | Yes | scheduling | Surgical bookings | — | theatre_bookings |
| `/payments` | Operations | AppLayout | Yes | operations | Billing/payments | — | payment_intents |
| `/pacs` | Clinical | AppLayout | Yes | clinical | Imaging viewer | — | imaging_orders |
| `/lims` | Clinical | AppLayout | Yes | clinical | Lab system | — | lab_orders |
| `/portal` | Portal | Standalone | No | — | Patient portal | PatientPortal | — |
| `/install` | Public | Standalone | No | — | PWA install | — | — |
| `/odoo` | Work | AppLayout | Yes | home | ERP integration | — | — |
| `/reports` | Work | AppLayout | Yes | home | Reporting | — | — |
| `/orders` | Clinical | AppLayout | Yes | clinical | Order entry | — | clinical_orders |
| `/handoff` | Clinical | AppLayout | Yes | clinical | Shift handoff | — | handoff_reports |
| `/help` | Work | AppLayout | Yes | home | Help desk | — | help_tickets |
| `/catalogue` | Public | Standalone | No | — | Product catalog | — | msika products |
| `/marketplace` | Public | Standalone | No | — | Health marketplace | — | vendors, products |
| `/admin/product-registry` | Admin | AppLayout | Yes | admin | Product management | — | products |
| `/fulfillment` | Work | AppLayout | Yes | home | Rx fulfillment | — | fulfillment_requests |
| `/vendor-portal` | Work | AppLayout | Yes | home | Vendor bids | — | vendor_bids |
| `/scheduling` | Scheduling | AppLayout | Yes | scheduling | Appointment scheduling | — | appointments |
| `/scheduling/theatre` | Scheduling | AppLayout | Yes | scheduling | Theatre scheduling | — | theatre_bookings |
| `/scheduling/noticeboard` | Scheduling | AppLayout | Yes | scheduling | Announcements | — | announcements |
| `/scheduling/resources` | Scheduling | AppLayout | Yes | scheduling | Resource calendar | — | resources |
| `/id-services` | Work | AppLayout | Yes | home | ID generation/validation | — | id_sequence_counters, client_registry |
| `/communication` | Work | AppLayout | Yes | home | Messages/pages/calls | — | message_channels |
| `/social` | Portal | AppLayout | Yes | portal | Social hub | — | posts, communities |
| `/kiosk` | Public | Standalone | No | — | Self-service check-in | — | — |
| `/registry-management` | Registry | AppLayout | Yes | registry | Registry admin | — | — |
| `/hpr` | Registry | AppLayout | Yes | registry | Provider registry | — | health_providers |
| `/facility-registry` | Registry | AppLayout | Yes | registry | Facility registry | — | facilities |
| `/client-registry` | Registry | AppLayout | Yes | registry | Client registry | — | client_registry |
| `/operations` | Work | AppLayout | Yes | home | Facility operations | — | shifts, roster_plans |
| `/above-site` | Admin | AppLayout | Yes | home | District/national oversight | — | above_site_sessions |
| `/telemedicine` | Work | AppLayout | Yes | home | Teleconsult hub | — | teleconsult_sessions |
| `/sorting` | Work | AppLayout | Yes | home | Patient sorting/triage | — | queue_items |
| `/discharge` | Work | AppLayout | Yes | home | Discharge workflow | — | discharge_cases |
| `/workspace-management` | Admin | AppLayout | Yes | home | Workspace config | — | workspaces |
| `/landela` | Work | AppLayout | Yes | home | Document management | — | landela_documents |
| `/shared/:type/:token` | Public | Standalone | No | — | Shared summary | — | clinical_documents |
| `/admin/tshepo/consents` | Kernel | AppLayout | Yes | admin | Consent management | — | trust_layer_consent |
| `/admin/tshepo/audit` | Kernel | AppLayout | Yes | admin | Audit search | — | tshepo_audit_ledger |
| `/admin/tshepo/breakglass` | Kernel | AppLayout | Yes | admin | Break-glass review | — | break_glass events |
| `/admin/tshepo/access-history` | Kernel | AppLayout | Yes | admin | Patient access log | — | access_logs |
| `/admin/tshepo/offline` | Kernel | AppLayout | Yes | admin | Offline entitlements | — | offline_entitlements |
| `/admin/vito/patients` | Kernel | AppLayout | Yes | admin | Client registry (VITO) | — | client_registry |
| `/admin/vito/merges` | Kernel | AppLayout | Yes | admin | Merge queue | — | merge_requests |
| `/admin/vito/events` | Kernel | AppLayout | Yes | admin | Event viewer | — | vito events |
| `/admin/vito/audit` | Kernel | AppLayout | Yes | admin | Audit viewer | — | audit records |
| `/admin/tuso/facilities` | Kernel | AppLayout | Yes | admin | Facility admin | — | facilities |
| `/admin/tuso/workspaces` | Kernel | AppLayout | Yes | admin | Workspace admin | — | workspaces |
| `/admin/tuso/start-shift` | Kernel | AppLayout | Yes | admin | Shift start UI | — | shifts |
| `/admin/tuso/resources` | Kernel | AppLayout | Yes | admin | Resource admin | — | resources |
| `/admin/tuso/config` | Kernel | AppLayout | Yes | admin | Config admin | — | facility_operations_config |
| `/admin/tuso/control-tower` | Kernel | AppLayout | Yes | admin | Control tower | — | telemetry |
| `/admin/varapi/providers` | Kernel | AppLayout | Yes | admin | Provider admin | — | health_providers |
| `/admin/varapi/privileges` | Kernel | AppLayout | Yes | admin | Privilege approval | — | privilege_requests |
| `/admin/varapi/councils` | Kernel | AppLayout | Yes | admin | Council config | — | regulatory_councils |
| `/admin/varapi/tokens` | Kernel | AppLayout | Yes | admin | Token management | — | provider tokens |
| `/admin/varapi/portal` | Kernel | AppLayout | Yes | admin | Provider self-service | — | cpd_activities |
| `/admin/butano/timeline` | Kernel | AppLayout | Yes | admin | Clinical timeline | — | butano_fhir_resources |
| `/admin/butano/ips` | Kernel | AppLayout | Yes | admin | Intl Patient Summary | — | FHIR bundles |
| `/admin/butano/visit-summary` | Kernel | AppLayout | Yes | admin | Visit summary | — | encounters |
| `/admin/butano/reconciliation` | Kernel | AppLayout | Yes | admin | CPID reconciliation | — | butano_reconciliation_queue |
| `/admin/butano/stats` | Kernel | AppLayout | Yes | admin | SHR statistics | — | aggregate queries |
| `/admin/suite/docs` | Kernel | AppLayout | Yes | admin | Document console | — | credential_documents |
| `/admin/suite/portal` | Kernel | AppLayout | Yes | admin | Self-service portal | — | — |
| `/admin/pct/work` | Kernel | AppLayout | Yes | admin | PCT work tab | — | — |
| `/admin/pct/control-tower` | Kernel | AppLayout | Yes | admin | PCT control tower | — | — |
| `/admin/zibo` | Kernel | AppLayout | Yes | admin | Terminology service | — | terminology concepts |
| `/admin/oros` | Kernel | AppLayout | Yes | admin | Orders & results admin | — | clinical_orders |
| `/admin/pharmacy` | Kernel | AppLayout | Yes | admin | Pharmacy service admin | — | prescriptions |
| `/admin/inventory` | Kernel | AppLayout | Yes | admin | Supply chain admin | — | inventory |
| `/admin/msika-core` | Kernel | AppLayout | Yes | admin | Product registry | — | msika products |
| `/admin/msika-flow` | Kernel | AppLayout | Yes | admin | Commerce/fulfillment | — | orders |
| `/admin/costa` | Kernel | AppLayout | Yes | admin | Costing engine | — | cost_models |
| `/admin/mushex` | Kernel | AppLayout | Yes | admin | Payment switch | — | payment_intents |
| `/admin/indawo` | Kernel | AppLayout | Yes | admin | Site & premises | — | premises |
| `/admin/ubomi` | Kernel | AppLayout | Yes | admin | CRVS interface | — | birth_notifications, death_notifications |
| `/public-health` | Governance | AppLayout | Yes | public-health | Public health ops | — | surveillance data |
| `/coverage` | Governance | AppLayout | Yes | coverage | Coverage/payer ops | — | schemes, claims |
| `/ai-governance` | Governance | AppLayout | Yes | ai | AI governance | — | model_registry |
| `/omnichannel` | Governance | AppLayout | Yes | omnichannel | Omnichannel hub | — | channel configs |
| `*` (catch-all) | — | — | No | — | 404 page | NotFound | — |

---

## 5. GOLDEN PATHS

### Path 1: Public → Login → ModuleHome

1. Navigate to `/auth`
2. See split layout: left branding panel ("Digital Health Platform"), right auth options
3. See 3 visible buttons: "Provider ID & Biometric", "Patient Portal", "Staff Email Login"
4. Click "Staff Email Login"
5. See card with title "Sign in", description "Enter your email and password to continue"
6. Enter email `sarah.moyo@impilo.health`, password `Impilo2025!`
7. Click "Sign In"
8. Toast: "Welcome back!" / "You have been logged in successfully."
9. Navigate to `/` (ModuleHome)
10. See header with Impilo logo, user avatar dropdown
11. See 3 tabs: "Work", "My Professional", "My Life"
12. Work tab shows WorkplaceSelectionHub (if no active context) or module categories grid

### Path 2: Shift Start → Queue → Patient → Encounter

1. On ModuleHome Work tab, see WorkplaceSelectionHub
2. Select a facility from the facility list
3. Context activates → module grid appears
4. See "Communication Noticeboard" section with Messages, Pages, Calls buttons
5. See "Quick Access" section with EHR, Dashboard, Queue, Prescribe, Register, Lab, Radiology, Schedule buttons
6. Click "Queue" → navigates to `/queue`
7. AppLayout with sidebar in "clinical" context
8. See patient queue list
9. Select a patient → navigate to `/encounter`
10. EHRLayout activates: TopBar (dark), PatientBanner, MainWorkArea, EncounterMenu (right)
11. Encounter Menu shows: Overview, Assessment, Problems & Diagnoses, Orders & Results, Care & Management, Consults & Referrals, Notes & Attachments, Visit Outcome
12. TopBar shows: Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges

### Path 3: Registry Search

1. From ModuleHome, click "Client Registry (VITO)" under "Kernel & Sovereign Registries"
2. Navigates to `/client-registry`
3. Sidebar switches to "registry" context
4. See: Back to Home, Client Registry, Provider Registry, Facility Registry in sidebar
5. Search/browse client records
6. Click "Provider Registry" in sidebar → navigates to `/hpr`
7. Search/browse provider records
8. Click "Facility Registry" → navigates to `/facility-registry`

### Path 4: Admin Audit & Break-Glass

1. From ModuleHome, click "Trust Layer (TSHEPO)" under "Kernel & Sovereign Registries"
2. Navigates to `/admin/tshepo/consents`
3. Sidebar switches to "admin" context
4. Navigate to `/admin/tshepo/audit` for audit search
5. Navigate to `/admin/tshepo/breakglass` for break-glass review queue

### Path 5: Marketplace Browse

1. Navigate to `/marketplace` (public, no auth required)
2. Browse health products
3. Navigate to `/catalogue` for product catalog
4. If authenticated, navigate to `/fulfillment` for prescription fulfillment

---

## 6. Component Contract Inventory

See `docs/prototype/component_contracts.md` for full inventory.

### Key Layout Components

| Component | File | Props | Used In |
|-----------|------|-------|---------|
| AppLayout | `src/components/layout/AppLayout.tsx` | `children: ReactNode, title?: string` | Most protected pages |
| EHRLayout | `src/components/layout/EHRLayout.tsx` | — (uses EHRContext) | `/encounter*` |
| AppSidebar | `src/components/layout/AppSidebar.tsx` | — (uses WorkspaceContext, AuthContext) | Inside AppLayout |
| AppHeader | `src/components/layout/AppHeader.tsx` | `title?: string` | Inside AppLayout |
| TopBar | `src/components/layout/TopBar.tsx` | — (uses EHRContext) | Inside EHRLayout |
| EncounterMenu | `src/components/layout/EncounterMenu.tsx` | — (uses EHRContext) | Inside EHRLayout |
| MainWorkArea | `src/components/layout/MainWorkArea.tsx` | — | Inside EHRLayout |
| PatientBanner | `src/components/ehr/PatientBanner.tsx` | — (uses EHRContext) | Inside EHRLayout |
| WorkspaceSelector | `src/components/layout/WorkspaceSelector.tsx` | `currentView, onViewChange, collapsed` | Inside AppSidebar |
| FacilitySelector | `src/components/layout/FacilitySelector.tsx` | — | Inside AppHeader |
| ActiveWorkspaceIndicator | `src/components/layout/ActiveWorkspaceIndicator.tsx` | `compact?: boolean` | AppHeader, TopBar |

### Key Auth Components

| Component | File | Used In |
|-----------|------|---------|
| ProtectedRoute | `src/components/auth/ProtectedRoute.tsx` | App.tsx route wrapping |
| ProviderIdLookup | `src/components/auth/ProviderIdLookup.tsx` | Auth page |
| BiometricAuth | `src/components/auth/BiometricAuth.tsx` | Auth page |
| WorkspaceSelection | `src/components/auth/WorkspaceSelection.tsx` | Auth page |
| ClientAuth | `src/components/auth/ClientAuth.tsx` | Auth page |
| SystemMaintenanceAuth | `src/components/auth/SystemMaintenanceAuth.tsx` | Auth page |
| AboveSiteContextSelection | `src/components/auth/AboveSiteContextSelection.tsx` | Auth page |
| UserMenu | `src/components/auth/UserMenu.tsx` | TopBar |

---

## 7. State & Storage Model

### Context Provider Hierarchy (top to bottom in App.tsx)

1. `QueryClientProvider` (react-query)
2. `AuthProvider` — user, session, profile, signUp, signIn, signOut, refreshProfile
3. `FacilityProvider` — currentFacility, availableFacilities, selectFacility, capability checks
4. `WorkspaceProvider` — currentView, currentDepartment, careSetting, pageContext
5. `ShiftProvider` — activeShift, isOnShift, shiftDuration, startShift, endShift, transferWorkspace
6. `TooltipProvider` (radix)

### Auth Model

- `AuthContext` manages: `user` (Supabase User), `session`, `profile` (from `profiles` table), `loading`
- Profile fields: `id, user_id, display_name, role, specialty, department, phone, license_number, avatar_url, facility_id`
- Role values: `'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin' | 'client'`
- Session tracking: `user_sessions` table with `session_token`, `device_info`, `ip_address`
- Activity tracking: updates every 5 minutes via interval
- Login attempt tracking: calls `track-login-attempt` edge function

### Facility Context

- `FacilityContext` stores current facility with capabilities
- sessionStorage key: `impilo_current_facility_id`
- Capabilities: 30+ types (theatre, inpatient, icu, maternity, pharmacy, laboratory, etc.)
- Level of care: primary, secondary, tertiary, quaternary

### Workspace Context

- `WorkspaceContext` manages: currentView (personal/department/team), currentDepartment, careSetting, pageContext
- pageContext is auto-derived from URL path via `getPageContextFromPath()`
- CareSetting auto-derived from department name via `DEPARTMENT_CARE_SETTINGS` map

### Shift Context

- `ShiftContext` manages: activeShift, isOnShift, shiftDuration
- Uses `useWorkspaceData` hook for DB operations

### sessionStorage Keys

| Key | Set By | Content |
|-----|--------|---------|
| `activeWorkspace` | Auth.tsx (provider login) | `{department, physicalWorkspace, workstation, facility, loginTime}` |
| `impilo_current_facility_id` | FacilityContext | UUID of selected facility |

### Active Work Context (non-persisted state)

- `useActiveWorkContext` hook manages the facility/above-site/remote selection on ModuleHome
- Access modes: clinical, oversight, oversight_drill, support, remote_clinical, remote_admin, independent, emergency, community
- Work context types: facility, above_site, remote, combined, support, independent, emergency, community

---

## 8. Data + API Layer Map

### Key Supabase Tables Used

- `profiles` — user profiles linked to auth.users
- `user_sessions` — session tracking
- `facilities` — facility registry
- `facility_capabilities` (view) — computed facility capabilities
- `workspaces` — clinical workspaces within facilities
- `shifts` — active shift records
- `patients` — patient demographics
- `encounters` — clinical encounters
- `queue_items` / `queue_definitions` — patient queue
- `appointments` — scheduling
- `beds` — bed management
- `clinical_orders` — order entry
- `prescriptions` — medications
- `health_providers` — provider registry
- `client_registry` — national client registry
- `provider_affiliations` — provider-facility links
- `tshepo_audit_ledger` — tamper-evident audit chain
- `trust_layer_consent` — patient consent records
- `trust_layer_identity_mapping` — CRID/CPID mapping
- `butano_fhir_resources` — FHIR clinical data
- `above_site_roles` / `above_site_sessions` — oversight roles
- `birth_notifications` / `death_notifications` — CRVS

### Key RPC Functions

- `generate_impilo_id()` — generates composite health ID
- `generate_health_id()` — generates HID
- `generate_client_registry_id()` — generates CR ID
- `generate_shr_id()` — generates SHR ID
- `generate_provider_registry_id(province_code)` — generates VARAPI ID
- `generate_facility_registry_id(province_code)` — generates THUSO ID
- `generate_upid()` — generates Universal Provider ID
- `tshepo_next_chain_sequence(tenant_id, pod_id)` — next audit sequence
- `tshepo_last_audit_hash(tenant_id, pod_id)` — last hash in chain
- `check_provider_eligibility(provider_id, ...)` — eligibility check
- `get_provider_facilities(user_id)` — facilities for provider
- `get_user_workspaces(user_id, facility_id?)` — workspaces
- `get_active_shift(user_id)` — current shift
- `get_queue_metrics(queue_id)` — queue stats
- `trust_layer_resolve_clinical(impilo_id)` — resolve to CPID
- `trust_layer_resolve_registry(impilo_id)` — resolve to CRID

### Edge Functions

- `geolocate-ip` — session geolocation
- `track-login-attempt` — login attempt tracking / account lockout
- `oros-v1` — orders & results service
- `zibo-v1` — terminology validation

### Kernel Client (src/lib/kernel/)

The prototype includes a full kernel library with:
- **Events**: `emitV11()`, `emitWithPolicy()`, `emitPatientCreated/Updated/Merged()`
- **Idempotency**: `requireIdempotencyKey()`, `checkIdempotency()`, `storeIdempotencyResult()`
- **Audit**: `appendAuditRecord()`, `verifyChain()`, `logPolicyDecision()`
- **PDP (TSHEPO)**: `evaluatePolicy()`, `pdpDecide()`
- **VITO commands**: `vitoPatientUpsert()`, `vitoPatientMerge()`
- **MSIKA**: `msikaTariffUpdate()`, `getTariff()`
- **Offline entitlements**: `issueEntitlement()`, `verifyEntitlementOffline()`, `revokeEntitlement()`
- **BUTANO events**: `emitButanoResourceCreated/Updated/ReconcileCompleted()`
- **Security**: `getActorFromHeaders()`

---

## 9. Kernel Semantics in Prototype

### Event Envelopes (ImpiloEventEnvelopeV11)
All events use: `event_id, event_type, schema_version, correlation_id, causation_id, idempotency_key, producer, tenant_id, pod_id, occurred_at, emitted_at, subject_type, subject_id, payload, meta`

### Delta Payloads (ImpiloDeltaPayload)
Operations: `CREATE | UPDATE | DELETE | MERGE | REVOKE` with `before, after, changed_fields`

### Audit Ledger
SHA-256 hash-chained records with `chain_sequence, prev_hash, record_hash`. Verified via `verifyChain()`.

### PDP Decisions
Values: `ALLOW | DENY | BREAK_GLASS_REQUIRED | STEP_UP_REQUIRED`

### Consistency Classes
- Class A: synchronous PDP + audit (tariff updates, merges)
- Class B: eventual consistency
- Class C: async

---

## 10. Responsive Behavior

### Desktop (lg+)
- Full sidebar (w-48), all header elements visible
- ModuleHome: 3-4 column grid for module cards

### Tablet (md)
- FacilitySelector hidden below md
- ActiveWorkspaceIndicator hidden below lg
- Sidebar collapsible

### Mobile (sm)
- Home button text hidden (`hidden sm:inline`)
- User name/role in dropdown hidden below lg
- ModuleHome header: workspace indicator hidden below md
- Auth page: left branding panel hidden below lg

---

## Cross-References

- Page specs: `docs/prototype/page_specs/`
- Golden paths: `docs/prototype/flows/`
- UI strings: `docs/prototype/ui_strings_catalog.md`
- Component contracts: `docs/prototype/component_contracts.md`
- API contracts: `docs/prototype/api_contracts_observed.md`
- State/storage: `docs/prototype/storage_and_state_map.md`
- Unknowns: `docs/prototype/unknowns_and_gaps.md`
