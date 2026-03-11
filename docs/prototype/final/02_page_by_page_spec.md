# 02 — Page-by-Page Specification

> This document covers the fully-inspected pages in detail. For pages where only the route and layout are known, the page component file path is provided for direct inspection.

---

## Route: `/auth`

### Purpose
Login method selection hub with 4 pathways.

### Auth/Guard
Public. No auth required. Authenticated users are redirected to `/` (or to above-site-context if they have above-site roles).

### Layout Regions
- **Standalone layout** (no AppLayout)
- **Left Panel** (desktop only, `hidden lg:flex`, `lg:w-1/2`): branded gradient panel
- **Right Panel** (`flex-1`): auth forms, max-w-md centered

### Left Panel (Desktop)
- Background: `bg-gradient-to-br from-primary via-primary/90 to-primary/80`
- Decorative: two blurred circles (white/20, white/10) + SVG grid pattern (white, 0.5 stroke)
- Logo: `<img>` impilo-logo.png, `h-14`, `brightness-0 invert`
- H1: `"Digital Health Platform"` (text-4xl font-bold font-display)
- P: `"Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."` (text-xl)
- 3 badges in flex row:
  1. Heart icon → `"Patient-Centered"`
  2. Shield icon → `"Secure"`
  3. Activity icon → `"Real-time"`
- Footer: `"© 2025 Impilo Health. All rights reserved."`

### Right Panel — Method Select (view="method-select")
- Mobile logo (lg:hidden): h-12, long-press 1.5s reveals maintenance + toast `"Maintenance mode revealed"` (duration 2000)
- H2: `"Welcome back"` (text-3xl font-bold font-display)
- P: `"Choose your preferred login method"`
- 4 cards (vertical, space-y-4):
  1. **Fingerprint** icon, h-14 w-14 → `"Provider ID & Biometric"` / `"For clinical staff with registered Provider ID"` → sets view to "lookup"
  2. **UserCircle** icon → `"Patient Portal"` / `"Access your health records & appointments"` → sets view to "client-auth"
  3. **Mail** icon → `"Staff Email Login"` / `"For admin and system users"` → sets view to "email-login"
  4. **Wrench** icon (shown only when `showMaintenanceOption` is true) → `"System Maintenance"` / `"Platform admins & developers only"` → sets view to "system-maintenance"
- Footer: Shield icon + `"Secure authentication powered by Impilo"`

### Maintenance Reveal Triggers
- URL param: `?mode=maintenance`
- Keyboard: `Ctrl+Shift+M`
- Mobile: long-press on logo image for 1.5s

### Right Panel — Email Login (view="email-login")
- Card: `border-0 shadow-xl`
- Logo: h-10 centered
- CardTitle: `"Sign in"` (text-2xl font-display)
- CardDescription: `"Enter your email and password to continue"`
- Field 1: Label `"Email address"`, type email, placeholder `"you@example.com"`, h-12, required
- Field 2: Label `"Password"`, placeholder `"••••••••"`, h-12, required, toggle Eye/EyeOff icon
- Link: `"Forgot password?"` → navigates to `/forgot-password`
- Submit button: `"Sign In"` (h-12, w-full) / loading state: spinner + `"Signing in..."`
- Back button: ghost, h-12, w-full, ArrowLeft + `"Back to login options"`

### Data Interactions
- Email login: `supabase.auth.signInWithPassword({ email, password })`
- Toast success: `"Welcome back!"` / `"You have been logged in successfully."`
- Toast error: `"Login failed"` / `error.message`
- Navigates to `/` on success

### Right Panel — Provider ID Flow
- view="lookup": `<ProviderIdLookup>` component (`src/components/auth/ProviderIdLookup.tsx`)
- view="biometric": `<BiometricAuth>` component (`src/components/auth/BiometricAuth.tsx`), requiredMethods=["fingerprint", "facial", "iris"]
- view="workspace": `<WorkspaceSelection>` component (`src/components/auth/WorkspaceSelection.tsx`)
- view="above-site-context": `<AboveSiteContextSelection>` component (`src/components/auth/AboveSiteContextSelection.tsx`)
- view="client-auth": `<ClientAuth>` component (`src/components/auth/ClientAuth.tsx`)
- view="system-maintenance": `<SystemMaintenanceAuth>` component (`src/components/auth/SystemMaintenanceAuth.tsx`)

### Provider ID Login Data Flow
1. ProviderIdLookup calls back with `(providerData, facilityData)`
2. BiometricAuth calls back with `(method, confidence)`
3. Auth.tsx looks up `profiles` table by `provider_registry_id`
4. If no profile: toast.error `"No user account linked to this Provider ID"`
5. WorkspaceSelection calls back with `(selection)` containing department, physicalWorkspace, workstation
6. Auth.tsx signs in using hardcoded demo email/password mapping
7. Stores workspace in sessionStorage key `activeWorkspace`
8. Inserts into `provider_registry_logs` table
9. Toast: `"Welcome, {fullName}!"` / `"Logged in to {department} at {workstation}"`
10. Navigates to `/`

### Toasts
- `"Welcome back!"` / `"You have been logged in successfully."` (email login success)
- `"Login failed"` / error.message (email login failure)
- `"No user account linked to this Provider ID"` (provider lookup failure)
- `"Failed to complete authentication"` (auth error)
- `"Demo login not available for this provider"` (unmapped provider)
- `"Biometric verification failed"` / error string (biometric failure)
- `"Welcome, {fullName}!"` / `"Logged in to {department} at {workstation}"` (provider login success)
- `"Maintenance mode revealed"` (mobile long-press, duration 2000)
- `"Failed to complete sign in"` / error.message (provider sign-in error)
- `"Failed to complete login"` (workspace selection error)

---

## Route: `/`

### Purpose
Module home — 3-tab hub for all platform features.

### Auth/Guard
Protected (ProtectedRoute).

### Layout
Custom (not AppLayout). Structure: sticky header + full-height tabs + floating emergency FAB.

### Header
- Logo: h-8
- Right side:
  - Workspace button (shown when `hasActiveContext`): outline, hidden md:flex, MapPin + facility name + RefreshCw → calls `switchContext`
  - Profile dropdown: Avatar h-8 w-8

### Profile Dropdown
- Header: Avatar h-12 + display_name + role Badge + specialty
- Mobile workspace item (if active context): MapPin + facility name + `"Switch Workplace"` + RefreshCw
- `"View Profile"` → `/profile`
- `"Account Settings"` → `/profile`
- `"Security & Privacy"` → `/profile`
- (admin only) `"Admin Dashboard"` → `/admin`
- `"Sign Out"` → toast `"Signed out successfully"` → `/auth`

### Welcome Section (when context active)
- H2: `"Welcome, {Dr/Nurse/}{name}"`
- P: `"Working from: {facilityName}"`

### Tabs
- Providers see 3 tabs, clients see 1 tab
- Tab 1: `"Work"` (Briefcase icon), active style: `bg-primary text-primary-foreground`
- Tab 2: `"My Professional"` (Stethoscope icon), active style: gradient teal→cyan
- Tab 3: `"My Life"` (Heart icon), active style: gradient pink→purple

### Work Tab — No Context
Shows `<WorkplaceSelectionHub>` with 8 access mode callbacks: onFacilitySelect, onAboveSiteSelect, onCombinedViewSelect, onRemoteSelect, onSupportModeSelect, onIndependentPracticeSelect, onEmergencyWorkSelect, onCommunityOutreachSelect

### Work Tab — With Context
1. **Communication Noticeboard**: heading with MessageSquare icon + `"Communication Noticeboard"` + HealthDocumentScanner button. Three buttons: `"Messages"` (MessageSquare), `"Pages"` (Bell), `"Calls"` (Phone)
2. **Quick Access**: heading with Zap icon + `"Quick Access"`. 8 buttons: `"EHR"`, `"Dashboard"`, `"Queue"`, `"Prescribe"`, `"Register"`, `"Lab"`, `"Radiology"`, `"Schedule"`
3. **Module Categories**: grid-cols-3 lg:grid-cols-4. First card is always "Practice Management" with 6 sub-modules: Schedule, Patients, Billing, Analytics, Staff, Inventory. Then 17 `<ExpandableCategoryCard>` components from `workModuleCategories` array.

### 17 Module Categories
1. Clinical Care (10 modules)
2. Consults & Referrals (4 modules)
3. Orders & Diagnostics (6 modules)
4. Scheduling & Registration (9 modules)
5. Health Products & Marketplace (4 modules)
6. Finance & Billing (2 modules)
7. Inventory & Supply Chain (2 modules)
8. Identity Services (7 modules)
9. Kernel & Sovereign Registries (12 modules)
10. Public Health & Local Authority (5 modules)
11. Coverage, Financing & Payer (5 modules)
12. Intelligence, Automation & AI (3 modules)
13. Experience, Omnichannel & Access (7 modules)
14. Governance & Configuration (6 modules)
15. Clinical Tools (2 modules)
16. Help & Support (4 modules)

### My Professional Tab
Renders `<MyProfessionalHub>` component (`src/components/home/MyProfessionalHub.tsx`)

### My Life Tab
Renders `<PersonalHub>` component (`src/components/home/PersonalHub.tsx`)

### Emergency FAB
- Position: fixed bottom-6 right-6
- Size: h-16 w-16 rounded-full
- Style: bg-destructive, shadow-2xl, z-50, animate-pulse (stops on hover)
- Icon: AlertTriangle h-8 w-8 text-white
- Click: opens Dialog with `<EmergencyHub>` component (max-w-2xl, max-h-[90vh])

---

## Route: `/encounter` and `/encounter/:encounterId`

### Purpose
Clinical EHR encounter — the core clinical documentation workspace.

### Auth/Guard
Protected. Wrapped in `<ProviderContextProvider>` then `<EHRProvider>`.

### Layout
**EHRLayout** when patient is active. Structure:
- TopBar (h-14) — dark background (topbar-bg)
- PatientBanner — demographics, alerts, active episodes
- Content area: MainWorkArea (left, flex-1) + EncounterMenu (right, w-64)
- Critical event mode: `ring-4 ring-critical ring-inset critical-mode` on outer container

### No Encounter ID (`/encounter`)
Shows `<NoPatientSelected>` component

### Loading State
Shows Loader2 spinner + `"Loading patient chart..."`

### Error State
- Circle with `"!"` in destructive/10
- H2: `"Unable to Load Chart"`
- P: contextError message (e.g., `"Encounter not found. The patient may have been discharged or the record doesn't exist."`)
- 3 buttons: `"Go Back"` (ArrowLeft), `"Back to Queue"` (Users), `"Home"` (Home)

### TopBar Components (when patient active)
- Left: Back button, Home button (→`/`), Logo (h-7), separator, 10 action buttons: Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges, + Register link
- Center: "Chart Locked" badge (green) + patient name + MRN/ward/bed + Allergies badge (if any) + "Close Chart" button
- Center (no patient): ShieldCheck icon + `"No Patient Selected"`
- Right: PatientSearch, ActiveWorkspaceIndicator, AIDiagnosticAssistant, AlertBadge, CDSAlertBadge, CriticalEventButton, UserMenu

### Close Chart Dialog
- Title: `"Close Patient Chart?"`
- Description: `"This will close {patientName}'s chart and return you to your worklist. Any unsaved changes may be lost."`
- Cancel: `"Continue Working"`
- Confirm: `"Close Chart"` → calls `closeChart("/queue")`

### EncounterMenu (Right Panel, w-64)
- Header: `"Encounter Record"` (uppercase, text-sm) / `"Clinical Documentation"`
- Patient File button: `"Patient File"` with FolderOpen icon
- 8 menu items (from ENCOUNTER_MENU_ITEMS):
  1. `"Overview"` / `"Patient summary and status"` — LayoutDashboard
  2. `"Assessment"` / `"Clinical assessments"` — ClipboardCheck
  3. `"Problems & Diagnoses"` / `"Active problems and diagnoses"` — Stethoscope
  4. `"Orders & Results"` / `"Lab orders and results"` — FileText
  5. `"Care & Management"` / `"Care plans and management"` — Heart
  6. `"Consults & Referrals"` / `"Specialist consultations"` — Users
  7. `"Notes & Attachments"` / `"Clinical notes and documents"` — FileEdit
  8. `"Visit Outcome"` / `"Encounter disposition"` — CheckCircle
- Footer: `"Last saved: 2 min ago"` + green dot + `"Active"`

### Data Interactions
- Encounter load: `supabase.from("encounters").select("id, encounter_number, encounter_type, status, chief_complaint, created_at, patient_id, patients(id, first_name, last_name, date_of_birth, gender, mrn)").eq("id", encounterId).maybeSingle()`
- Chart access logging: `supabase.from("audit_logs").insert({entity_type: "patient_chart", entity_id, action: "chart_access", performed_by, metadata})`
- Chart close logging: `supabase.from("audit_logs").insert({...action: "chart_closed", metadata: {duration_seconds}})`
- Toast on close: `"Chart closed"` (info)

---

## Remaining Routes — Component File Paths

For each remaining route, the page component file path is provided. Claude Opus should inspect the file directly to extract exact UI strings, component composition, form fields, table columns, and data interactions.

| Route | File Path |
|-------|-----------|
| `/reset-password` | `src/pages/ResetPassword.tsx` |
| `/forgot-password` | `src/pages/ForgotPassword.tsx` |
| `/dashboard` | `src/pages/Dashboard.tsx` |
| `/queue` | `src/pages/Queue.tsx` |
| `/beds` | `src/pages/Beds.tsx` |
| `/appointments` | `src/pages/Appointments.tsx` |
| `/patients` | `src/pages/Patients.tsx` |
| `/stock` | `src/pages/Stock.tsx` |
| `/consumables` | `src/pages/Consumables.tsx` |
| `/charges` | `src/pages/Charges.tsx` |
| `/registration` | `src/pages/Registration.tsx` |
| `/profile` | `src/pages/ProfileSettings.tsx` |
| `/admin` | `src/pages/AdminDashboard.tsx` |
| `/pharmacy` | `src/pages/Pharmacy.tsx` |
| `/theatre` | `src/pages/Theatre.tsx` |
| `/payments` | `src/pages/Payments.tsx` |
| `/pacs` | `src/pages/PACS.tsx` |
| `/lims` | `src/pages/LIMS.tsx` |
| `/portal` | `src/pages/Portal.tsx` |
| `/install` | `src/pages/Install.tsx` |
| `/odoo` | `src/pages/Odoo.tsx` |
| `/reports` | `src/pages/Reports.tsx` |
| `/orders` | `src/pages/Orders.tsx` |
| `/handoff` | `src/pages/Handoff.tsx` |
| `/help` | `src/pages/HelpDesk.tsx` |
| `/catalogue` | `src/pages/ProductCatalogue.tsx` |
| `/marketplace` | `src/pages/HealthMarketplace.tsx` |
| `/admin/product-registry` | `src/pages/admin/ProductManagement.tsx` |
| `/fulfillment` | `src/pages/PrescriptionFulfillment.tsx` |
| `/vendor-portal` | `src/pages/VendorPortal.tsx` |
| `/scheduling` | `src/pages/scheduling/AppointmentScheduling.tsx` |
| `/scheduling/theatre` | `src/pages/scheduling/TheatreScheduling.tsx` |
| `/scheduling/noticeboard` | `src/pages/scheduling/ProviderNoticeboard.tsx` |
| `/scheduling/resources` | `src/pages/scheduling/ResourceCalendar.tsx` |
| `/id-services` | `src/pages/IdServices.tsx` |
| `/communication` | `src/pages/Communication.tsx` |
| `/social` | `src/pages/Social.tsx` |
| `/kiosk` | `src/pages/Kiosk.tsx` |
| `/registry-management` | `src/pages/RegistryManagement.tsx` |
| `/hpr` | `src/pages/HealthProviderRegistry.tsx` |
| `/facility-registry` | `src/pages/FacilityRegistry.tsx` |
| `/client-registry` | `src/pages/ClientRegistry.tsx` |
| `/operations` | `src/pages/Operations.tsx` |
| `/above-site` | `src/pages/AboveSiteDashboard.tsx` |
| `/telemedicine` | `src/pages/Telemedicine.tsx` |
| `/sorting` | `src/pages/PatientSorting.tsx` |
| `/discharge` | `src/pages/Discharge.tsx` |
| `/workspace-management` | `src/pages/WorkspaceManagement.tsx` |
| `/landela` | `src/pages/Landela.tsx` |
| `/shared/:type/:token` | `src/pages/SharedSummary.tsx` |
| `/public-health` | `src/pages/PublicHealthOps.tsx` |
| `/coverage` | `src/pages/CoverageOperations.tsx` |
| `/ai-governance` | `src/pages/AIGovernance.tsx` |
| `/omnichannel` | `src/pages/OmnichannelHub.tsx` |
| All `/admin/*` routes | `src/pages/admin/<ComponentName>.tsx` (see site_map.md for exact mapping) |
| `*` | `src/pages/NotFound.tsx` |
