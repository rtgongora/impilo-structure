# Claude Opus Replication Brief — Impilo vNext Prototype

> **Generated from live codebase inspection. This is the canonical reference for 1:1 prototype replication.**

---

# 0) Instructions to Claude Opus (Read First)

## Mission
Replicate the Impilo vNext prototype UI/UX **exactly**. Every route, layout, label, toast, menu item, sidebar behavior, and data interaction must match the original prototype. This is not a redesign exercise.

## Forbidden
- Do NOT rename labels, buttons, headings, or toast messages.
- Do NOT alter navigation flows, route paths, or layout structures.
- Do NOT "improve" or "simplify" any UX patterns.
- Do NOT invent routes, components, or strings not documented here.

## Acceptance Criteria
1. **UI string diff = zero**: Every literal string in the UI must match exactly.
2. **Route map = exact match**: All 98 routes must exist with correct guards and layouts.
3. **Layout + navigation = exact match**: Sidebar context switching, header behavior, and EHR layout must be pixel-accurate to structure.
4. **Golden path flows**: All 5 golden paths must complete successfully.

## Unknown Handling
If an item is marked `UNKNOWN`, pause implementation and request verification. Do not guess. Each UNKNOWN includes the exact file path to inspect.

---

# 1) System Map (All Routes)

## Complete Route Table

| # | Route | Zone | Layout | Auth | Sidebar Context | Primary Purpose | Page Component |
|---|-------|------|--------|------|-----------------|-----------------|----------------|
| 1 | `/auth` | Public | None (standalone) | No | N/A | Login with 4 pathways | `Auth` |
| 2 | `/reset-password` | Public | None | No | N/A | Password reset form | `ResetPassword` |
| 3 | `/forgot-password` | Public | None | No | N/A | Forgot password email request | `ForgotPassword` |
| 4 | `/portal` | Public | None | No | N/A | Patient portal | `Portal` → `PatientPortal` |
| 5 | `/install` | Public | None | No | N/A | PWA installation page | `Install` |
| 6 | `/kiosk` | Public | None | No | N/A | Self-service check-in terminal | `Kiosk` |
| 7 | `/catalogue` | Public | None | No | N/A | Health products catalogue | `ProductCatalogue` |
| 8 | `/marketplace` | Public | None | No | N/A | Health marketplace | `HealthMarketplace` |
| 9 | `/shared/:type/:token` | Public | None | No (token-gated) | N/A | Shared clinical summary | `SharedSummary` |
| 10 | `/` | Home | ModuleHome (custom) | Yes | `home` | Three-tab module hub | `ModuleHome` |
| 11 | `/dashboard` | Work | AppLayout | Yes | `home` | Personal clinical dashboard | `Dashboard` |
| 12 | `/encounter` | Clinical | EHRLayout (via EHRProvider) | Yes | `clinical` | EHR — no patient selected | `Encounter` |
| 13 | `/encounter/:encounterId` | Clinical | EHRLayout (via EHRProvider) | Yes | `clinical` | EHR — active patient chart | `Encounter` |
| 14 | `/queue` | Clinical | AppLayout | Yes | `clinical` | Patient queue / worklist | `Queue` |
| 15 | `/beds` | Clinical | AppLayout | Yes | `clinical` | Bed management / ward map | `Beds` |
| 16 | `/appointments` | Scheduling | AppLayout | Yes | `scheduling` | Appointment management | `Appointments` |
| 17 | `/patients` | Clinical | AppLayout | Yes | `clinical` | Patient registry search | `Patients` |
| 18 | `/stock` | Operations | AppLayout | Yes | `operations` | Inventory management | `Stock` |
| 19 | `/consumables` | Operations | AppLayout | Yes | `operations` | Consumables tracking | `Consumables` |
| 20 | `/charges` | Operations | AppLayout | Yes | `operations` | Encounter service charges | `Charges` |
| 21 | `/registration` | Scheduling | AppLayout | Yes | `home` | Patient registration | `Registration` |
| 22 | `/profile` | Support | AppLayout | Yes | `home` | Profile settings | `ProfileSettings` |
| 23 | `/admin` | Admin | AppLayout | Yes | `admin` | System admin dashboard | `AdminDashboard` |
| 24 | `/pharmacy` | Orders | AppLayout | Yes | `home` | Pharmacy dispensing | `Pharmacy` |
| 25 | `/theatre` | Scheduling | AppLayout | Yes | `scheduling` | Theatre booking | `Theatre` |
| 26 | `/payments` | Finance | AppLayout | Yes | `operations` | Patient billing | `Payments` |
| 27 | `/pacs` | Orders | AppLayout | Yes | `home` | PACS radiology | `PACS` |
| 28 | `/lims` | Orders | AppLayout | Yes | `home` | Laboratory system | `LIMS` |
| 29 | `/odoo` | Admin | AppLayout | Yes | `home` | ERP integration | `Odoo` |
| 30 | `/reports` | Admin | AppLayout | Yes | `home` | Reports & analytics | `Reports` |
| 31 | `/orders` | Orders | AppLayout | Yes | `home` | Clinical order entry | `Orders` |
| 32 | `/handoff` | Clinical | AppLayout | Yes | `home` | Shift handoff reports | `Handoff` |
| 33 | `/help` | Support | AppLayout | Yes | `home` | Help desk | `HelpDesk` |
| 34 | `/admin/product-registry` | Admin | AppLayout | Yes | `admin` | Product registry management | `ProductManagement` |
| 35 | `/fulfillment` | Marketplace | AppLayout | Yes | `home` | Prescription fulfillment | `PrescriptionFulfillment` |
| 36 | `/vendor-portal` | Marketplace | AppLayout | Yes | `home` | Vendor bid submission | `VendorPortal` |
| 37 | `/scheduling` | Scheduling | AppLayout | Yes | `scheduling` | Advanced scheduling | `AppointmentScheduling` |
| 38 | `/scheduling/theatre` | Scheduling | AppLayout | Yes | `scheduling` | Theatre scheduling | `TheatreScheduling` |
| 39 | `/scheduling/noticeboard` | Scheduling | AppLayout | Yes | `scheduling` | Provider noticeboard | `ProviderNoticeboard` |
| 40 | `/scheduling/resources` | Scheduling | AppLayout | Yes | `scheduling` | Resource calendar | `ResourceCalendar` |
| 41 | `/id-services` | Identity | AppLayout | Yes | `home` | ID generation/validation | `IdServices` |
| 42 | `/communication` | Clinical | AppLayout | Yes | `home` | Messages, pages, calls | `Communication` |
| 43 | `/social` | My Life | AppLayout | Yes | `portal` | Social hub | `Social` |
| 44 | `/registry-management` | Admin | AppLayout | Yes | `home` | HIE registry management | `RegistryManagement` |
| 45 | `/hpr` | Registries | AppLayout | Yes | `registry` | Health Provider Registry | `HealthProviderRegistry` |
| 46 | `/facility-registry` | Registries | AppLayout | Yes | `registry` | Facility Registry | `FacilityRegistry` |
| 47 | `/client-registry` | Registries | AppLayout | Yes | `registry` | Client Registry | `ClientRegistry` |
| 48 | `/operations` | Operations | AppLayout | Yes | `home` | Operations dashboard | `Operations` |
| 49 | `/above-site` | Admin | AppLayout | Yes | `home` | Above-site oversight | `AboveSiteDashboard` |
| 50 | `/telemedicine` | Consults | AppLayout | Yes | `home` | Telemedicine hub | `Telemedicine` |
| 51 | `/sorting` | Clinical | AppLayout | Yes | `home` | Patient arrival sorting | `PatientSorting` |
| 52 | `/discharge` | Clinical | AppLayout | Yes | `home` | Discharge workflow | `Discharge` |
| 53 | `/workspace-management` | Admin | AppLayout | Yes | `home` | Workspace config | `WorkspaceManagement` |
| 54 | `/landela` | Admin | AppLayout | Yes | `home` | Document management | `Landela` |
| 55 | `/admin/tshepo/consents` | Kernel/TSHEPO | AppLayout | Yes | `admin` | Consent admin | `TshepoConsentAdmin` |
| 56 | `/admin/tshepo/audit` | Kernel/TSHEPO | AppLayout | Yes | `admin` | Audit search | `TshepoAuditSearch` |
| 57 | `/admin/tshepo/breakglass` | Kernel/TSHEPO | AppLayout | Yes | `admin` | Break-glass review | `TshepoBreakGlass` |
| 58 | `/admin/tshepo/access-history` | Kernel/TSHEPO | AppLayout | Yes | `admin` | Patient access history | `TshepoPatientAccessHistory` |
| 59 | `/admin/tshepo/offline` | Kernel/TSHEPO | AppLayout | Yes | `admin` | Offline status | `TshepoOfflineStatus` |
| 60 | `/admin/vito/patients` | Kernel/VITO | AppLayout | Yes | `admin` | Patient registry admin | `VitoPatients` |
| 61 | `/admin/vito/merges` | Kernel/VITO | AppLayout | Yes | `admin` | Merge queue | `VitoMergeQueue` |
| 62 | `/admin/vito/events` | Kernel/VITO | AppLayout | Yes | `admin` | Events viewer | `VitoEventsViewer` |
| 63 | `/admin/vito/audit` | Kernel/VITO | AppLayout | Yes | `admin` | Audit viewer | `VitoAuditViewer` |
| 64 | `/admin/tuso/facilities` | Kernel/TUSO | AppLayout | Yes | `admin` | Facility admin | `TusoFacilities` |
| 65 | `/admin/tuso/workspaces` | Kernel/TUSO | AppLayout | Yes | `admin` | Workspace admin | `TusoWorkspaces` |
| 66 | `/admin/tuso/start-shift` | Kernel/TUSO | AppLayout | Yes | `admin` | Start shift admin | `TusoStartShift` |
| 67 | `/admin/tuso/resources` | Kernel/TUSO | AppLayout | Yes | `admin` | Resource admin | `TusoResources` |
| 68 | `/admin/tuso/config` | Kernel/TUSO | AppLayout | Yes | `admin` | Config admin | `TusoConfig` |
| 69 | `/admin/tuso/control-tower` | Kernel/TUSO | AppLayout | Yes | `admin` | Control tower | `TusoControlTower` |
| 70 | `/admin/varapi/providers` | Kernel/VARAPI | AppLayout | Yes | `admin` | Provider admin | `VarapiProviders` |
| 71 | `/admin/varapi/privileges` | Kernel/VARAPI | AppLayout | Yes | `admin` | Privileges admin | `VarapiPrivileges` |
| 72 | `/admin/varapi/councils` | Kernel/VARAPI | AppLayout | Yes | `admin` | Councils admin | `VarapiCouncils` |
| 73 | `/admin/varapi/tokens` | Kernel/VARAPI | AppLayout | Yes | `admin` | Tokens admin | `VarapiTokens` |
| 74 | `/admin/varapi/portal` | Kernel/VARAPI | AppLayout | Yes | `admin` | Provider portal | `VarapiPortal` |
| 75 | `/admin/butano/timeline` | Kernel/BUTANO | AppLayout | Yes | `admin` | SHR timeline | `ButanoTimeline` |
| 76 | `/admin/butano/ips` | Kernel/BUTANO | AppLayout | Yes | `admin` | IPS viewer | `ButanoIPS` |
| 77 | `/admin/butano/visit-summary` | Kernel/BUTANO | AppLayout | Yes | `admin` | Visit summary | `ButanoVisitSummary` |
| 78 | `/admin/butano/reconciliation` | Kernel/BUTANO | AppLayout | Yes | `admin` | Reconciliation | `ButanoReconciliation` |
| 79 | `/admin/butano/stats` | Kernel/BUTANO | AppLayout | Yes | `admin` | Stats dashboard | `ButanoStats` |
| 80 | `/admin/suite/docs` | Kernel/Landela | AppLayout | Yes | `admin` | Docs console | `SuiteDocsConsole` |
| 81 | `/admin/suite/portal` | Kernel/Landela | AppLayout | Yes | `admin` | Self-service portal | `SuiteSelfService` |
| 82 | `/admin/pct/work` | Kernel/PCT | AppLayout | Yes | `admin` | PCT work tab | `PctWorkTab` |
| 83 | `/admin/pct/control-tower` | Kernel/PCT | AppLayout | Yes | `admin` | PCT control tower | `PctControlTower` |
| 84 | `/admin/zibo` | Kernel/ZIBO | AppLayout | Yes | `admin` | Terminology service | `ZiboAdmin` |
| 85 | `/admin/oros` | Kernel/OROS | AppLayout | Yes | `admin` | Orders & Results | `OrosAdmin` |
| 86 | `/admin/pharmacy` | Kernel/Pharmacy | AppLayout | Yes | `admin` | Pharmacy admin | `PharmacyAdmin` |
| 87 | `/admin/inventory` | Kernel/Inventory | AppLayout | Yes | `admin` | Inventory admin | `InventoryAdmin` |
| 88 | `/admin/msika-core` | Kernel/MSIKA | AppLayout | Yes | `admin` | Products & tariff | `MsikaCoreAdmin` |
| 89 | `/admin/msika-flow` | Kernel/MSIKA | AppLayout | Yes | `admin` | Commerce & fulfillment | `MsikaFlowAdmin` |
| 90 | `/admin/costa` | Kernel/COSTA | AppLayout | Yes | `admin` | Costing engine | `CostaAdmin` |
| 91 | `/admin/mushex` | Kernel/MUSHEX | AppLayout | Yes | `admin` | Payment switch | `MushexAdmin` |
| 92 | `/admin/indawo` | Kernel/INDAWO | AppLayout | Yes | `admin` | Site & premises | `IndawoAdmin` |
| 93 | `/admin/ubomi` | Kernel/UBOMI | AppLayout | Yes | `admin` | CRVS interface | `UbomiAdmin` |
| 94 | `/public-health` | Public Health | AppLayout | Yes | `public-health` | Public health ops | `PublicHealthOps` |
| 95 | `/coverage` | Coverage | AppLayout | Yes | `coverage` | Coverage operations | `CoverageOperations` |
| 96 | `/ai-governance` | AI | AppLayout | Yes | `ai` | AI governance | `AIGovernance` |
| 97 | `/omnichannel` | Experience | AppLayout | Yes | `omnichannel` | Omnichannel hub | `OmnichannelHub` |
| 98 | `*` | Error | None | No | N/A | 404 page | `NotFound` |

---

# 2) Global Layout & Navigation Rules

## Provider Tree (App.tsx)

```
QueryClientProvider
  └── AuthProvider
       └── FacilityProvider
            └── WorkspaceProvider
                 └── ShiftProvider
                      └── TooltipProvider
                           ├── Toaster (radix)
                           ├── Sonner (sonner)
                           └── BrowserRouter → Routes
```

## Layout System

### Layout 1: No Layout (Public Pages)
**Used by**: `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/install`, `/kiosk`, `/catalogue`, `/marketplace`, `/shared/:type/:token`, `*` (404)

These pages render standalone with no sidebar or header. Each implements its own full-page layout.

### Layout 2: ModuleHome (Custom Layout)
**Used by**: `/` only

Custom full-screen layout with:
- **Header**: sticky top bar with logo, workspace indicator, user dropdown (h-14)
- **Main**: flex-1 with tabs (Work / My Professional / My Life)
- **Floating Emergency Button**: fixed bottom-right, red pulsing circle with AlertTriangle icon

The ModuleHome does NOT use AppLayout. It has its own header with different controls than AppHeader.

### Layout 3: AppLayout
**Used by**: All authenticated routes EXCEPT `/`, `/encounter`, `/encounter/:encounterId`

Structure (file: `src/components/layout/AppLayout.tsx`):
```
div.h-screen.flex.overflow-hidden.bg-background
  ├── AppSidebar (left)
  └── div.flex-1.flex.flex-col.overflow-hidden.min-w-0
       ├── AppHeader (top, h-12)
       └── main.flex-1.overflow-auto.overscroll-contain
            └── {children}
```

### Layout 4: EHRLayout
**Used by**: `/encounter`, `/encounter/:encounterId` (only when `hasActivePatient === true`)

Wrapped in `EHRProvider` and `ProviderContextProvider`.

Structure (file: `src/components/layout/EHRLayout.tsx`):
```
div.h-screen.flex.flex-col.overflow-hidden
  ├── TopBar (h-14, dark bg)
  ├── PatientBanner (collapsible demographics)
  └── div.flex-1.flex.overflow-hidden
       ├── MainWorkArea (flex-1)
       └── EncounterMenu (w-64, right sidebar)
```

When `isCriticalEventActive`: outer div gets `ring-4 ring-critical ring-inset critical-mode`.

When no active patient: shows `NoPatientSelected` component (not EHRLayout).

## Sidebar Context System

The `AppSidebar` (file: `src/components/layout/AppSidebar.tsx`) dynamically switches navigation based on `pageContext`, which is derived from the current URL pathname.

### Context Detection Function (`getPageContextFromPath`):

```typescript
function getPageContextFromPath(pathname: string): PageContext {
  if (pathname.startsWith('/facility-registry') || 
      pathname.startsWith('/hpr') || 
      pathname.startsWith('/client-registry') ||
      pathname.startsWith('/registry')) → "registry"
  
  if (pathname.startsWith('/encounter') || 
      pathname.startsWith('/beds') || 
      pathname.startsWith('/queue') ||
      pathname.startsWith('/patients')) → "clinical"
  
  if (pathname.startsWith('/stock') || 
      pathname.startsWith('/consumables') ||
      pathname.startsWith('/charges') ||
      pathname.startsWith('/payments')) → "operations"
  
  if (pathname.startsWith('/scheduling') || 
      pathname.startsWith('/appointments') ||
      pathname.startsWith('/theatre')) → "scheduling"
  
  if (pathname.startsWith('/public-health')) → "public-health"
  if (pathname.startsWith('/coverage')) → "coverage"
  if (pathname.startsWith('/ai-governance')) → "ai"
  if (pathname.startsWith('/omnichannel')) → "omnichannel"
  if (pathname.startsWith('/admin')) → "admin"
  if (pathname.startsWith('/portal') || pathname.startsWith('/social')) → "portal"
  
  default → "home"
}
```

### Navigation Items Per Context

#### home
- **Quick Access**: Dashboard (`/`), My Worklist (`/queue`), Communication (`/communication`), Social Hub (`/social`)
- **Clinical**: Clinical EHR (`/encounter`), Appointments (`/appointments`), Patients (`/patients`), Pharmacy (`/pharmacy`)
- **System**: ID Services (`/id-services`), Reports (`/reports`), Help Desk (`/help`)

#### clinical
- **Quick Access**: Dashboard (`/`), My Worklist (`/queue`), Communication (`/communication`)
- **Clinical**: Clinical EHR (`/encounter`), Bed Management (`/beds`), Appointments (`/appointments`), Patients (`/patients`)
- **Orders**: Order Entry (`/orders`), Pharmacy (`/pharmacy`), Laboratory (`/lims`), PACS Imaging (`/pacs`), Shift Handoff (`/handoff`)

#### operations
- **Operations**: Dashboard (`/`), Stock Management (`/stock`), Consumables (`/consumables`), Charges (`/charges`), Payments (`/payments`), Theatre (`/theatre`)

#### scheduling
- **Scheduling**: Dashboard (`/`), Appointments (`/scheduling`), Theatre Booking (`/scheduling/theatre`), Noticeboard (`/scheduling/noticeboard`), Resources (`/scheduling/resources`)

#### registry
- **Registry**: Back to Home (`/`), Client Registry (`/client-registry`), Provider Registry (`/hpr`), Facility Registry (`/facility-registry`)
- **Tools**: Data Reconciliation, Change Requests, Reference Data, Reports (all point to `/facility-registry?tab=...`)
- **Admin**: Access Control (`/admin`), API & Integrations (`/admin?tab=integrations`), Audit Log (`/admin?tab=audit`)

#### portal
- **Portal**: Dashboard (`/`), My Health (`/portal`), Social Hub (`/social`), Marketplace (`/marketplace`), Communication (`/communication`)

#### public-health
- **Public Health**: Dashboard (`/`), Operations Hub (`/public-health`), Surveillance (`/public-health?tab=surveillance`), Outbreaks (`/public-health?tab=outbreaks`), Inspections (`/public-health?tab=inspections`), Campaigns (`/public-health?tab=campaigns`), INDAWO Sites (`/admin/indawo`)

#### coverage
- **Coverage & Financing**: Dashboard (`/`), Coverage Hub (`/coverage`), Eligibility (`/coverage?tab=eligibility`), Claims (`/coverage?tab=claims`), Settlement (`/coverage?tab=settlement`), Schemes (`/coverage?tab=schemes`)

#### ai
- **AI & Intelligence**: Dashboard (`/`), AI Governance (`/ai-governance`), Insights (`/ai-governance?tab=insights`), Model Registry (`/ai-governance?tab=models`)

#### omnichannel
- **Omnichannel Access**: Dashboard (`/`), Channel Overview (`/omnichannel`), SMS Journeys (`/omnichannel?tab=sms`), USSD Menus (`/omnichannel?tab=ussd`), IVR / Voice (`/omnichannel?tab=ivr`), Callbacks (`/omnichannel?tab=callbacks`), Trust Rules (`/omnichannel?tab=disclosure`), AI Agent (`/omnichannel?tab=ai-agent`)

#### admin
- **Admin**: Dashboard (`/`), System Settings (`/admin`), User Management (`/admin?tab=users`), Security (`/admin?tab=security`), Audit Logs (`/admin?tab=audit`), Integrations (`/admin?tab=integrations`)

### Sidebar Structure

- **Width**: expanded = `w-48`, collapsed = `w-12`
- **Logo**: `src/assets/impilo-logo.png`, h-6 expanded / h-5 collapsed
- **Workspace Selector**: shown only when `pageContext === "clinical" || pageContext === "home"`
- **Context Label**: shown when NOT `clinical`/`home` and NOT collapsed. Exact labels:
  - `"registry"` → "Registry"
  - `"operations"` → "Operations"
  - `"scheduling"` → "Scheduling"
  - `"portal"` → "Portal"
  - `"admin"` → "Admin"
  - `"public-health"` → "Public Health"
  - `"coverage"` → "Coverage & Financing"
  - `"ai"` → "AI & Intelligence"
  - `"omnichannel"` → "Omnichannel"
- **Collapse button**: text "Collapse" with ChevronLeft icon when expanded; ChevronRight only when collapsed

### Active State Rules
Nav item is active when:
```typescript
location.pathname === item.path || 
(item.path !== "/" && location.pathname.startsWith(item.path.split('?')[0]))
```
Active style: `bg-sidebar-primary text-sidebar-primary-foreground`

## AppHeader Behavior

File: `src/components/layout/AppHeader.tsx` (h-12)

**Left section**:
- Home button (variant="default", shows only when NOT on `/`): icon Home + text "Home"
- Back button (variant="ghost", shows when NOT on `/` and NOT on `/dashboard`): icon ArrowLeft + text "Back"
- Title (from prop, shown with divider)

**Center section**:
- `PatientSearch` component (max-w-xs)

**Right section**:
- `FacilitySelector` (hidden on mobile, `hidden md:block`)
- `ActiveWorkspaceIndicator` (hidden on small screens, `hidden lg:block`)
- `VoiceCommandButton`
- `HandoffNotifications`
- Bell icon with badge "3" (hardcoded)
- User dropdown:
  - Label: "My Account"
  - Items: "Profile Settings" (→ `/profile`), separator, "Sign Out" (destructive)

## Route Guard: ProtectedRoute

File: `src/components/auth/ProtectedRoute.tsx`

Behavior:
1. While `loading === true`: shows centered "Loading..." text with pulse animation
2. If `user === null`: redirects to `/auth` with `state={{ from: location }}`
3. Otherwise: renders children

---

# 3) UI String Canon (Do Not Change)

> **DO NOT CHANGE** — Every string listed here must match exactly in any replica.

## Global Shell

### AppHeader
- Home button: "Home"
- Back button: "Back"
- Bell badge: "3"
- Dropdown label: "My Account"
- Dropdown item 1: "Profile Settings"
- Dropdown item 2: "Sign Out"

### AppSidebar
- Collapse button text: "Collapse"
- Context labels: "Registry", "Operations", "Scheduling", "Portal", "Admin", "Public Health", "Coverage & Financing", "AI & Intelligence", "Omnichannel"

### ProtectedRoute
- Loading text: "Loading..."

## Auth Page (`/auth`)

### Method Select View
- Heading: "Welcome back"
- Subtext: "Choose your preferred login method"
- Button 1 title: "Provider ID & Biometric"
- Button 1 description: "For clinical staff with registered Provider ID"
- Button 2 title: "Patient Portal"
- Button 2 description: "Access your health records & appointments"
- Button 3 title: "Staff Email Login"
- Button 3 description: "For admin and system users"
- Button 4 title: "System Maintenance" (hidden by default)
- Button 4 description: "Platform admins & developers only"
- Footer: "Secure authentication powered by Impilo"
- Toast (maintenance reveal via long-press): "Maintenance mode revealed"

### Left Branding Panel (Desktop, `hidden lg:flex lg:w-1/2`)
- Heading: "Digital Health Platform"
- Subtext: "Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."
- Badge 1: "Patient-Centered" (Heart icon)
- Badge 2: "Secure" (Shield icon)
- Badge 3: "Real-time" (Activity icon)
- Footer: "© 2025 Impilo Health. All rights reserved."

### Email Login View
- Card title: "Sign in"
- Card description: "Enter your email and password to continue"
- Email label: "Email address"
- Email placeholder: "you@example.com"
- Password label: "Password"
- Password placeholder: "••••••••"
- Forgot link: "Forgot password?"
- Submit button: "Sign In"
- Submit loading: "Signing in..."
- Back button: "Back to login options"
- Toast success: title="Welcome back!" description="You have been logged in successfully."
- Toast failure: title="Login failed" description=`{error.message}`

### Provider Login Flow
- Toast success: title="Welcome, {provider.fullName}!" description="Logged in to {department} at/in {workstation/workspace.name}"
- Toast link error: "No user account linked to this Provider ID"
- Toast demo error: "Demo login not available for this provider"
- Toast failure: "Failed to complete authentication"
- Toast general: "Failed to complete login"

### Biometric
- Toast failure: title="Biometric verification failed" description=`{error}`

### Maintenance Reveal
- Keyboard shortcut: `Ctrl+Shift+M`
- URL param: `?mode=maintenance`
- Mobile: long-press on logo (1500ms timer)
- Toast: "Maintenance mode revealed" (duration: 2000)

## ModuleHome (`/`)

### Header
- Welcome: "Welcome, {displayTitle}" where displayTitle uses Dr/Nurse prefix based on role
- Subtitle: "Working from: {facilityName or contextLabel}"

### Tabs
- Tab 1: "Work" (Briefcase icon)
- Tab 2: "My Professional" (Stethoscope icon)
- Tab 3: "My Life" (Heart icon)

### User Dropdown Menu
- "View Profile"
- "Account Settings"
- "Security & Privacy"
- "Admin Dashboard" (admin only)
- "Sign Out"
- Workplace button: "{facilityName}" / "Switch Workplace"
- Sign out toast: "Signed out successfully"

### Communication Noticeboard
- Section title: "Communication Noticeboard"
- Buttons: "Messages", "Pages", "Calls"

### Quick Access
- Section title: "Quick Access"
- Buttons: "EHR", "Dashboard", "Queue", "Prescribe", "Register", "Lab", "Radiology", "Schedule"

### Module Categories (exact titles and descriptions)
1. "Practice Management" / "Manage your practice or facility"
2. "Clinical Care" / "Patient encounters, assessments, and care delivery"
3. "Consults & Referrals" / "Telemedicine, specialist consults, and inter-facility referrals"
4. "Orders & Diagnostics" / "Lab, imaging, pharmacy, and clinical orders"
5. "Scheduling & Registration" / "Appointments, patient registration, and theatre"
6. "Health Products & Marketplace" / "Browse products, compare vendors, and order supplies"
7. "Finance & Billing" / "Payments, charges, and financial operations"
8. "Inventory & Supply Chain" / "Stock management and consumables tracking"
9. "Identity Services" / "Generate, validate, and recover health IDs"
10. "Kernel & Sovereign Registries" / "Ring 0 shared sovereign services — TSHEPO, VITO, VARAPI, TUSO, INDAWO, MSIKA, ZIBO, BUTANO, UBOMI, MUSHEX"
11. "Public Health & Local Authority" / "Surveillance, outbreaks, inspections, campaigns, complaints — configured per jurisdiction pack"
12. "Coverage, Financing & Payer" / "Schemes, membership, eligibility, claims, settlement — native platform capability"
13. "Intelligence, Automation & AI" / "Governed AI insights, model registry, inference records — I1/I2/I3 classification"
14. "Experience, Omnichannel & Access" / "SMS, USSD, IVR, WhatsApp, call-centre, community-worker, and facility-desk access — no citizen left behind"
15. "Governance & Configuration" / "System settings, audit, jurisdiction packs, and platform administration"
16. "Clinical Tools" / "Advanced clinical documentation and utilities"
17. "Help & Support" / "FAQs, user guides, system utilities and documentation"

### Emergency Button
- `aria-label="Emergency"`

## EHR TopBar

### Top Bar Actions (exact labels in order)
1. "Queue" (Users icon)
2. "Beds" (Bed icon)
3. "Pharmacy" (Pill icon)
4. "Theatre Booking" (Calendar icon)
5. "Payments" (CreditCard icon)
6. "Shift Handoff" (ClipboardCheck icon)
7. "Workspaces" (Boxes icon)
8. "Care Pathways" (Route icon)
9. "Consumables" (Package icon)
10. "Charges" (Receipt icon)

Plus a separator, then: "Register" (UserPlus icon, links to `/registration`)

### Patient Context (when active)
- Badge: "Chart Locked" (Lock icon, green)
- Patient: `{name}` / `{mrn} • {ward} • {bed}`
- Allergies badge: "Allergies" (AlertTriangle icon, amber)
- Close button: "Close Chart"

### Close Chart Dialog
- Title: "Close Patient Chart?"
- Description: "This will close {patientName}'s chart and return you to your worklist. Any unsaved changes may be lost."
- Cancel: "Continue Working"
- Confirm: "Close Chart"

### No Patient Selected
- Text: "No Patient Selected" (ShieldCheck icon)

## Encounter Menu (Right sidebar, w-64)

- Header: "Encounter Record"
- Subtitle: "Clinical Documentation"
- Button: "Patient File" / "Active" (when open)
- Menu items (exactly 8, non-extensible):
  1. "Overview" / "Patient summary and status" (LayoutDashboard)
  2. "Assessment" / "Clinical assessments" (ClipboardCheck)
  3. "Problems & Diagnoses" / "Active problems and diagnoses" (Stethoscope)
  4. "Orders & Results" / "Lab orders and results" (FileText)
  5. "Care & Management" / "Care plans and management" (Heart)
  6. "Consults & Referrals" / "Specialist consultations" (Users)
  7. "Notes & Attachments" / "Clinical notes and documents" (FileEdit)
  8. "Visit Outcome" / "Encounter disposition" (CheckCircle)
- Footer: "Last saved: 2 min ago" / "Active"

## Mock Patient Data
- Name: "Sarah M. Johnson"
- DOB: "1985-03-15"
- MRN: "MRN-2024-001847"
- Allergies: ["Penicillin", "Sulfa drugs"]
- Ward: "Ward 4A"
- Bed: "Bed 12"
- Gender: "female"
- Encounter type: "inpatient"
- Attending: "Dr. James Mwangi"
- Location: "Ward 4A - Medical"

---

# 4) Page-by-Page Specs (Every Route)

> For brevity of this master file, page specs are grouped by zone. For detailed per-page specs, see `docs/prototype/page_specs/`.

## `/auth` — Auth Page

### Purpose
Login entry point with 4 authentication pathways.

### Layout
Split layout: left panel (branding, `hidden lg:flex lg:w-1/2`) + right panel (auth forms, `flex-1`).

### Views (state machine: `AuthView`)
- `method-select`: 3-4 login pathway buttons
- `lookup`: `ProviderIdLookup` component
- `biometric`: `BiometricAuth` component
- `workspace`: `WorkspaceSelection` component
- `email-login`: Email/password form card
- `above-site-context`: `AboveSiteContextSelection` (for above-site users)
- `client-auth`: `ClientAuth` component
- `system-maintenance`: `SystemMaintenanceAuth` component

### Data Interactions
- `supabase.auth.signInWithPassword` (email login)
- `profiles` table: lookup by `provider_registry_id`
- `provider_registry_logs` table: insert on successful biometric login
- Edge function: `track-login-attempt` (called during signIn)
- `sessionStorage.setItem('activeWorkspace', JSON.stringify({...}))` on workspace selection

### Responsive
- Left branding panel: `hidden lg:flex`
- Mobile logo: shown `lg:hidden`, supports long-press for maintenance reveal

## `/` — ModuleHome

### Purpose
Central hub with 3 tabs: Work (module grid), My Professional (CPD, credentials), My Life (personal health, social).

### Layout
Custom full-screen layout (NOT AppLayout). Header → Tabs → Content.

### Key Behavior
- Default tab: "work" for providers, "personal" for clients (`role === "client" || "patient"`)
- Work tab shows `WorkplaceSelectionHub` when `!hasActiveContext`, module category grid when context selected
- Module visibility filtered by: user role (`canAccessModule`), facility capabilities (`hasAnyCapability`)
- Categories grid: `grid-cols-3 lg:grid-cols-4` with `ExpandableCategoryCard` components

### Components
- `WorkplaceSelectionHub` (src/components/home/WorkplaceSelectionHub.tsx)
- `MyProfessionalHub` (src/components/home/MyProfessionalHub.tsx)
- `PersonalHub` (src/components/home/PersonalHub.tsx)
- `ExpandableCategoryCard` (src/components/home/ExpandableCategoryCard.tsx)
- `HealthDocumentScanner` (src/components/documents/HealthDocumentScanner.tsx)
- `EmergencyHub` (src/components/emergency/EmergencyHub.tsx) — in dialog

## `/encounter` & `/encounter/:encounterId` — EHR Encounter

### Purpose
Clinical documentation workspace with the fixed 3-region layout.

### Layout
Wrapped in `ProviderContextProvider` → `EHRProvider`. Renders:
- Without encounterId: `NoPatientSelected`
- Loading: spinner with "Loading patient chart..."
- Error: "Unable to Load Chart" with Go Back / Back to Queue / Home buttons
- With active patient: `EHRLayout` (TopBar + PatientBanner + MainWorkArea + EncounterMenu)

### MainWorkArea Priority Stack
1. Critical Event (if `activeCriticalEvent.status === "active"`) → `CriticalEventWorkspace`
2. Active Workspace (if `activeWorkspace`) → `WorkspaceView`
3. Top Bar Action (if `activeTopBarAction`) → `TopBarPanel`
4. Default → `EncounterSection`

## Other Pages (Summary)

All other authenticated pages use `AppLayout` (sidebar + header + content). Each page internally implements its own content. Key patterns:

- **Registry pages** (`/client-registry`, `/hpr`, `/facility-registry`): search + table + detail views
- **Admin kernel pages** (`/admin/tshepo/*`, `/admin/vito/*`, etc.): admin CRUD surfaces
- **Operations pages** (`/stock`, `/consumables`, `/charges`, `/payments`): data tables with filters
- **Scheduling pages** (`/scheduling/*`): calendar views, booking forms
- **Governance pages** (`/public-health`, `/coverage`, `/ai-governance`, `/omnichannel`): tabbed dashboards

> **UNKNOWN**: Individual page internals for all 90+ pages. Each requires inspection of its component file. Files are at `src/pages/<Name>.tsx` and `src/pages/admin/<Name>.tsx`.

---

# 5) Golden Flows (Step-by-step click scripts)

## Flow A: Landing/Login → ModuleHome

1. **Navigate to** `/auth` → See split layout with "Welcome back" heading
2. **Click** "Staff Email Login" → Email/password form appears with "Sign in" title
3. **Enter** email in field labeled "Email address" (placeholder: "you@example.com")
4. **Enter** password in field labeled "Password" (placeholder: "••••••••")
5. **Click** "Sign In" button → Loading state shows "Signing in..."
6. **On success**: Toast appears: title="Welcome back!" description="You have been logged in successfully."
7. **Route changes to** `/` → ModuleHome loads
8. **See** Work tab active (default for providers). If no workplace selected, see `WorkplaceSelectionHub`.
9. **Select workplace** → Module category grid appears with Communication Noticeboard and Quick Access sections.

**Data calls**: `supabase.auth.signInWithPassword`, edge function `track-login-attempt`, `profiles` table select, `user_sessions` insert, edge function `geolocate-ip`

## Flow B: Provider ID Login → Workspace Selection → Dashboard

1. **Navigate to** `/auth` → "Welcome back" heading
2. **Click** "Provider ID & Biometric" → `ProviderIdLookup` view
3. **Enter Provider ID** → Provider found, facility loaded
4. **Click verify** → `BiometricAuth` view with fingerprint/facial/iris options
5. **Complete biometric** → Toast if failed: "Biometric verification failed"
6. **On success** → `WorkspaceSelection` view showing facility departments and workspaces
7. **Select department** → Select physical workspace → Select workstation (optional)
8. **Click confirm** → Auth completes with demo email login behind scenes
9. **Toast**: "Welcome, {fullName}!" / "Logged in to {department} at {workstation}"
10. **Route changes to** `/` → sessionStorage `activeWorkspace` set

**Data calls**: `profiles` table (by `provider_registry_id`), `supabase.auth.signInWithPassword` (demo email), `provider_registry_logs` insert, sessionStorage write

## Flow C: Search Patient → Open Patient → Start Encounter

1. **From** ModuleHome, **click** "Queue" in Quick Access → Navigate to `/queue`
2. **Sidebar** switches to `clinical` context (shows Clinical nav items)
3. **See** patient queue/worklist
4. **Click** on a patient in the queue → Navigate to `/encounter/{encounterId}?source=queue`
5. **EHRLayout loads**: TopBar (dark header with action buttons), PatientBanner (demographics, vitals), MainWorkArea (EncounterSection), EncounterMenu (right, w-64)
6. **See** patient banner: "Sarah M. Johnson", MRN-2024-001847, Ward 4A, Bed 12
7. **TopBar shows**: "Chart Locked" badge, patient context, "Allergies" badge, "Close Chart" button
8. **Click** "Assessment" in Encounter Menu → MainWorkArea updates to show assessment content
9. **Click** "Close Chart" → AlertDialog: "Close Patient Chart?" / "Continue Working" / "Close Chart"
10. **Click** "Close Chart" → Navigate to `/queue`

## Flow D: Order Workflow (Clinical)

1. **From** EHR encounter (patient active), **click** "Orders & Results" in Encounter Menu
2. **MainWorkArea** shows orders/results section
3. **In TopBar**, **click** "Pharmacy" → TopBarPanel shows pharmacy overlay
4. **Alternatively**, **click** "Queue" in TopBar → TopBarPanel shows queue overlay

> **UNKNOWN**: Exact order creation form fields and validation — requires inspection of `src/components/ehr/EncounterSection.tsx` and `src/components/ehr/TopBarPanel.tsx`

## Flow E: Admin Audit & Break-Glass Review

1. **Navigate to** `/admin/tshepo/audit` → AppLayout with `admin` sidebar context
2. **See** TSHEPO audit search interface
3. **Navigate to** `/admin/tshepo/breakglass` → Break-glass review surface
4. **Navigate to** `/admin/tshepo/access-history` → Patient access history viewer

> **UNKNOWN**: Exact UI for these admin pages — requires inspection of `src/pages/admin/TshepoAuditSearch.tsx`, `src/pages/admin/TshepoBreakGlass.tsx`, `src/pages/admin/TshepoPatientAccessHistory.tsx`

---

# 6) Component Inventory (Shared + Layout + Context Providers)

## Layout Components

| Component | File | Used On | Key Props |
|-----------|------|---------|-----------|
| `AppLayout` | `src/components/layout/AppLayout.tsx` | All AppLayout routes | `children`, `title?` |
| `AppSidebar` | `src/components/layout/AppSidebar.tsx` | Via AppLayout | None (uses contexts) |
| `AppHeader` | `src/components/layout/AppHeader.tsx` | Via AppLayout | `title?` |
| `EHRLayout` | `src/components/layout/EHRLayout.tsx` | `/encounter` routes | None (uses EHRContext) |
| `TopBar` | `src/components/layout/TopBar.tsx` | Via EHRLayout | None (uses EHRContext) |
| `MainWorkArea` | `src/components/layout/MainWorkArea.tsx` | Via EHRLayout | None (uses EHRContext) |
| `EncounterMenu` | `src/components/layout/EncounterMenu.tsx` | Via EHRLayout | None (uses EHRContext) |
| `PatientBanner` | `src/components/ehr/PatientBanner.tsx` | Via EHRLayout | None (uses EHRContext) |
| `WorkspaceSelector` | `src/components/layout/WorkspaceSelector.tsx` | Via AppSidebar | `currentView`, `onViewChange`, `collapsed?` |
| `FacilitySelector` | `src/components/layout/FacilitySelector.tsx` | Via AppHeader | None (uses FacilityContext) |
| `ActiveWorkspaceIndicator` | `src/components/layout/ActiveWorkspaceIndicator.tsx` | Via AppHeader, TopBar | `className?`, `compact?` |

## Context Providers

| Provider | File | Key State |
|----------|------|-----------|
| `AuthProvider` | `src/contexts/AuthContext.tsx` | `user`, `session`, `profile`, `loading`, `signIn`, `signUp`, `signOut`, `refreshProfile` |
| `FacilityProvider` | `src/contexts/FacilityContext.tsx` | `currentFacility`, `availableFacilities`, `selectFacility`, `hasCapability`, `isAtLeastLevel` |
| `WorkspaceProvider` | `src/contexts/WorkspaceContext.tsx` | `currentView`, `currentDepartment`, `careSetting`, `pageContext` |
| `ShiftProvider` | `src/contexts/ShiftContext.tsx` | `activeShift`, `isOnShift`, `shiftDuration`, `startShift`, `endShift`, `transferWorkspace` |
| `EHRProvider` | `src/contexts/EHRContext.tsx` | `currentEncounter`, `activeMenuItem`, `activeTopBarAction`, `activeWorkspace`, `activeCriticalEvent`, `hasActivePatient`, `openChart`, `closeChart` |
| `ProviderContextProvider` | `src/contexts/ProviderContext.tsx` | Provider-specific clinical context |

## Auth Components

| Component | File | Used On |
|-----------|------|---------|
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | All protected routes in App.tsx |
| `ProviderIdLookup` | `src/components/auth/ProviderIdLookup.tsx` | `/auth` (lookup view) |
| `BiometricAuth` | `src/components/auth/BiometricAuth.tsx` | `/auth` (biometric view) |
| `WorkspaceSelection` | `src/components/auth/WorkspaceSelection.tsx` | `/auth` (workspace view) |
| `AboveSiteContextSelection` | `src/components/auth/AboveSiteContextSelection.tsx` | `/auth` (above-site view) |
| `ClientAuth` | `src/components/auth/ClientAuth.tsx` | `/auth` (client view) |
| `SystemMaintenanceAuth` | `src/components/auth/SystemMaintenanceAuth.tsx` | `/auth` (maintenance view) |
| `UserMenu` | `src/components/auth/UserMenu.tsx` | TopBar (EHR) |

## Shared UI Components

All shadcn/ui components are in `src/components/ui/`. Key custom shared components:

| Component | File | Notes |
|-----------|------|-------|
| `PatientSearch` | `src/components/search/PatientSearch.tsx` | In AppHeader and TopBar |
| `HandoffNotifications` | `src/components/handoff/HandoffNotifications.tsx` | In AppHeader |
| `VoiceCommandButton` | `src/components/voice/VoiceCommandButton.tsx` | In AppHeader |
| `NavLink` | `src/components/NavLink.tsx` | Used in AppSidebar |
| `CriticalEventButton` | `src/components/ehr/CriticalEventButton.tsx` | In TopBar |
| `CDSAlertBadge` | `src/components/ehr/ClinicalDecisionSupport.tsx` | In TopBar |
| `AIDiagnosticAssistant` | `src/components/ehr/AIDiagnosticAssistant.tsx` | In TopBar |
| `AlertBadge` | `src/components/alerts/ClinicalAlerts.tsx` | In TopBar |
| `EmergencyHub` | `src/components/emergency/EmergencyHub.tsx` | ModuleHome floating button dialog |

---

# 7) State & Storage Map

## Auth State

**Profile interface** (from `profiles` table):
```typescript
interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin' | 'client';
  specialty: string | null;
  department: string | null;
  phone: string | null;
  license_number: string | null;
  avatar_url: string | null;
  facility_id: string | null;
}
```

## React Contexts

Provider nesting order (outermost to innermost):
```
AuthProvider → FacilityProvider → WorkspaceProvider → ShiftProvider → TooltipProvider
```

EHR pages add: `ProviderContextProvider → EHRProvider`

## sessionStorage Keys

| Key | Written By | Read By | Shape |
|-----|-----------|---------|-------|
| `activeWorkspace` | Auth.tsx (workspace selection) | ActiveWorkspaceIndicator | `{ department, physicalWorkspace: { name, location, type }, workstation?, facility?, loginTime }` |
| `impilo_current_facility_id` | FacilityContext | FacilityContext | UUID string |

## localStorage Keys

None observed in core prototype code. All persistence is via sessionStorage or Supabase.

## Workspace Context State

- `currentView`: `"personal" | "department" | "team"` — controls sidebar workspace selector
- `currentDepartment`: string — defaults to "Emergency"
- `careSetting`: derived from department mapping (`DEPARTMENT_CARE_SETTINGS`)
- `pageContext`: `PageContext` — drives sidebar navigation switching

## Facility Context State

- `currentFacility`: fetched from `facility_capabilities` view
- Capability gating: `hasCapability(cap)` returns `true` if no facility set (permissive default)
- Stored in sessionStorage as `impilo_current_facility_id`

## Shift Context State

- `activeShift`: from `useWorkspaceData` hook (queries `shifts` + `providers` + `facilities` + `workspaces` tables)
- Duration tracked via interval timer (every 60s)

---

# 8) API Surface Map (Observed)

## Supabase Tables Referenced by UI

| Table | Used In | Operations |
|-------|---------|------------|
| `profiles` | AuthContext, Auth.tsx | SELECT (by user_id, by provider_registry_id), UPDATE (last_active_at) |
| `user_sessions` | AuthContext | INSERT, UPDATE, SELECT |
| `facility_capabilities` (view) | FacilityContext | SELECT |
| `facilities` | FacilityContext | SELECT (by gofr_id) |
| `provider_registry_logs` | Auth.tsx | INSERT |
| `health_providers` | Various | SELECT |
| `provider_licenses` | Various | SELECT |
| `provider_affiliations` | Various | SELECT |
| `shifts` | ShiftContext | SELECT, INSERT, UPDATE |
| `workspaces` | WorkspaceSelector | SELECT |
| `workspace_memberships` | Various | SELECT |
| `queue_definitions` | Queue page | SELECT |
| `queue_items` | Queue page | SELECT, INSERT, UPDATE |
| `appointments` | Appointments | SELECT, INSERT, UPDATE |
| `patients` | Patients, Queue | SELECT |
| `encounters` | Encounter | SELECT, INSERT |
| `beds` | Beds | SELECT, UPDATE |
| `clinical_orders` | Orders | SELECT, INSERT |
| `client_registry` | Client Registry | SELECT |
| `above_site_roles` | Auth (above-site) | SELECT |
| `above_site_sessions` | AboveSiteDashboard | SELECT, INSERT |
| `tshepo_audit_ledger` | TSHEPO admin pages | SELECT |
| `trust_layer_consent` | TSHEPO admin | SELECT |
| `butano_fhir_resources` | BUTANO admin | SELECT |

## RPC Functions Referenced

| Function | Called By | Purpose |
|----------|----------|---------|
| `generate_impilo_id` | IdServices | Generate composite health ID |
| `generate_client_registry_id` | Registration | Generate CR ID |
| `generate_provider_registry_id` | HPR | Generate provider ID |
| `generate_facility_registry_id` | Facility Registry | Generate facility ID |
| `tshepo_next_chain_sequence` | TSHEPO audit | Get next chain sequence |
| `tshepo_last_audit_hash` | TSHEPO audit | Get last hash for chain |
| `trust_layer_resolve_clinical` | EHR/clinical | Resolve CPID from Impilo ID |
| `trust_layer_resolve_registry` | Registry | Resolve CRID from Impilo ID |
| `get_provider_facilities` | FacilitySelector | Get facilities for user |
| `get_active_shift` | ShiftContext | Get current shift |
| `get_user_workspaces` | WorkspaceSelection | Get workspaces for user+facility |
| `get_queue_metrics` | Queue | Get queue stats |
| `check_provider_eligibility` | Auth/provider flow | Check provider access |
| `has_role` | RLS policies | Role check |
| `has_above_site_role` | AboveSite | Above-site access check |
| `can_access_workspace` | Workspace access | Workspace permission |
| `get_todays_roster_assignment` | Shift start | Get assigned shift |
| `flag_missed_appointments` | Scheduling | Auto-flag no-shows |

## Edge Functions Referenced

| Function | Called By | Purpose |
|----------|----------|---------|
| `track-login-attempt` | AuthContext.signIn | Track login attempts, check lockout |
| `geolocate-ip` | AuthContext (on sign-in) | Geolocate user session |

---

# 9) UNKNOWN / NOT OBSERVED

| # | Item | Why Unknown | Where to Inspect |
|---|------|-------------|------------------|
| 1 | Individual page internals for 80+ pages | Each page file must be inspected for exact content | `src/pages/*.tsx`, `src/pages/admin/*.tsx`, `src/pages/scheduling/*.tsx` |
| 2 | `EncounterSection` content and sub-views | Not yet inspected | `src/components/ehr/EncounterSection.tsx` |
| 3 | `TopBarPanel` sub-panel content | Not yet inspected | `src/components/ehr/TopBarPanel.tsx` |
| 4 | `WorkspaceView` content | Not yet inspected | `src/components/ehr/WorkspaceView.tsx` |
| 5 | `CriticalEventWorkspace` content | Not yet inspected | `src/components/ehr/CriticalEventWorkspace.tsx` |
| 6 | `NoPatientSelected` exact copy | Not yet inspected | `src/components/ehr/NoPatientSelected.tsx` |
| 7 | `WorkplaceSelectionHub` exact options | Not yet inspected | `src/components/home/WorkplaceSelectionHub.tsx` |
| 8 | `PersonalHub` content | Not yet inspected | `src/components/home/PersonalHub.tsx` |
| 9 | `MyProfessionalHub` content | Not yet inspected | `src/components/home/MyProfessionalHub.tsx` |
| 10 | `PatientSearch` command palette UI | Not yet inspected | `src/components/search/PatientSearch.tsx` |
| 11 | All kernel admin page internals | 40+ admin pages not individually inspected | `src/pages/admin/*.tsx` |
| 12 | `EHRContext` full state shape | Not yet inspected | `src/contexts/EHRContext.tsx` |
| 13 | Exact CSS custom properties / design tokens | Not yet inspected | `src/index.css`, `tailwind.config.ts` |
| 14 | Exact RLS policies on all tables | Not observable from frontend code | Database migration files |
| 15 | `useWorkspaceData` hook implementation | Not yet inspected | `src/hooks/useWorkspaceData.ts` |
| 16 | `useUserRoles` hook and `ModuleAccessRole` type | Not yet inspected | `src/hooks/useUserRoles.ts` |
| 17 | `useActiveWorkContext` hook | Not yet inspected | `src/hooks/useActiveWorkContext.ts` |
| 18 | `useModuleAvailability` / `useFacilityCapabilities` hooks | Not yet inspected | `src/hooks/useFacilityCapabilities.ts` |
| 19 | `useAboveSiteRole` hook | Not yet inspected | `src/hooks/useAboveSiteRole.ts` |
| 20 | All `ProviderIdLookup`, `BiometricAuth`, `WorkspaceSelection` exact form fields | Not yet inspected | `src/components/auth/*.tsx` |
| 21 | `ClientAuth` and `SystemMaintenanceAuth` content | Not yet inspected | `src/components/auth/ClientAuth.tsx`, `src/components/auth/SystemMaintenanceAuth.tsx` |
| 22 | Responsive breakpoint behaviors per page | Varies per component; general patterns use `hidden md:block`, `hidden lg:block` | Each component file |

> **Resolution**: For each UNKNOWN, read the specified file path from the prototype codebase and document the exact content before implementing.
