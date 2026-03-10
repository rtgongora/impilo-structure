# Impilo vNext — Page-by-Page Functional Specification

> Exhaustive as-built documentation of every page/route in the Impilo vNext prototype.
> Generated from codebase analysis. Labels are copied exactly as found in code.

---

## Table of Contents

1. [Public Pages](#public-pages)
2. [Home / Module Hub](#home--module-hub)
3. [Work Zone — Clinical](#work-zone--clinical)
4. [Work Zone — Orders & Diagnostics](#work-zone--orders--diagnostics)
5. [Work Zone — Consults & Referrals](#work-zone--consults--referrals)
6. [Work Zone — Scheduling & Registration](#work-zone--scheduling--registration)
7. [Work Zone — Marketplace](#work-zone--marketplace)
8. [Work Zone — Finance](#work-zone--finance)
9. [Work Zone — Operations](#work-zone--operations)
10. [Work Zone — Identity](#work-zone--identity)
11. [Registries](#registries)
12. [My Life / Social](#my-life--social)
13. [Ops/Admin](#opsadmin)
14. [Kernel Service Admin Surfaces](#kernel-service-admin-surfaces)
15. [Public Health & Governance Planes](#public-health--governance-planes)

---

## Public Pages

---

### Page: Auth (Login)

- **Route**: `/auth`
- **Zone**: Public
- **Access**: Unauthenticated users. Redirects authenticated users to `/` (or `/above-site` for above-site users).
- **Entry Points**: Direct navigation, redirect from `ProtectedRoute`

#### 1) Layout & Regions

Split layout:
- **Left panel** (hidden on mobile `lg:hidden`): Branding panel, `lg:w-1/2`. Gradient background `from-primary via-primary/90 to-primary/80`. Contains:
  - Impilo logo (top-left, white inverted, h-14)
  - Decorative blurred circles (absolute positioned)
  - Grid pattern overlay (opacity-5)
  - Headline: "Digital Health Platform"
  - Subtitle: "Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."
  - Three feature badges: "Patient-Centered" (Heart icon), "Secure" (Shield icon), "Real-time" (Activity icon)
  - Footer: "© 2025 Impilo Health. All rights reserved."
- **Right panel** (`flex-1`): Auth forms, centered, max-w-md, p-6 lg:p-12

#### 2) Auth Views (State Machine)

`AuthView` type: `"method-select" | "lookup" | "biometric" | "workspace" | "email-login" | "above-site-context" | "client-auth" | "system-maintenance"`

##### View: method-select (Default)

Header:
- Mobile: Impilo logo centered (long-press reveals maintenance option after 1500ms, toast "Maintenance mode revealed")
- Desktop: Logo on left panel
- Title: "Welcome back" (text-3xl font-bold)
- Subtitle: "Choose your preferred login method" (text-muted-foreground)

Four login pathway buttons (rounded-xl border cards, hover shadow):

1. **"Provider ID & Biometric"**
   - Icon: Fingerprint (h-7 w-7, primary color, bg-primary/10)
   - Description: "For clinical staff with registered Provider ID"
   - Action: → `view = "lookup"`

2. **"Patient Portal"**
   - Icon: UserCircle (h-7 w-7, accent color, bg-accent/20)
   - Description: "Access your health records & appointments"
   - Action: → `view = "client-auth"`

3. **"Staff Email Login"**
   - Icon: Mail (h-7 w-7, secondary color, bg-secondary/20)
   - Description: "For admin and system users"
   - Action: → `view = "email-login"`

4. **"System Maintenance"** (HIDDEN by default)
   - Only visible when: URL has `?mode=maintenance`, OR Ctrl+Shift+M pressed, OR mobile long-press on logo
   - Icon: Wrench (h-7 w-7, amber-600, bg-amber-500/20)
   - Description: "Platform admins & developers only"
   - Border: amber-500/30
   - Action: → `view = "system-maintenance"`

Footer: Shield icon + "Secure authentication powered by Impilo"

##### View: email-login

Card (border-0, shadow-xl):
- Header: Impilo logo (h-10), Title "Sign in" (text-2xl), Description "Enter your email and password to continue"
- Form fields:
  1. **Email address** — type=email, placeholder "you@example.com", required, h-12
  2. **Password** — type=password, placeholder "••••••••", required, h-12, toggle show/hide (Eye/EyeOff icon)
     - "Forgot password?" link → navigates to `/forgot-password`
- Buttons:
  - "Sign In" (h-12, full width, shows spinner "Signing in..." when submitting)
  - "Back to login options" (ghost, h-12, ArrowLeft icon) → `view = "method-select"`
- API: `supabase.auth.signInWithPassword({ email, password })`
- Success: toast "Welcome back!" / "You have been logged in successfully." → navigate "/"
- Error: toast "Login failed" with error.message

##### View: lookup

Renders `<ProviderIdLookup>` component
- onProviderFound → sets provider & facility, → `view = "biometric"`
- onCancel → `view = "method-select"`

##### View: biometric

Renders `<BiometricAuth>` component
- providerId from lookup step
- requiredMethods: `["fingerprint", "facial", "iris"]`
- onVerified → calls `handleBiometricVerified` → looks up profile by provider_registry_id → `view = "workspace"`
- onFailed → toast error, back to lookup
- onCancel → `view = "method-select"`

##### View: workspace

Renders `<WorkspaceSelection>` component
- Shows facility & provider from previous steps
- onWorkspaceSelected → sign in with mapped demo email, store workspace in sessionStorage, toast welcome → navigate "/"
- onBack → `view = "biometric"`

**Demo login mapping** (hardcoded in prototype):
| Provider ID | Email |
|------------|-------|
| VARAPI-2025-ZW000001-A1B2 | sarah.moyo@impilo.health |
| VARAPI-2025-ZW000002-C3D4 | tendai.ncube@impilo.health |
| VARAPI-2025-ZW000003-E5F6 | grace.mutasa@impilo.health |
| VARAPI-2025-ZW000004-G7H8 | farai.chikwava@impilo.health |
| VARAPI-2025-ZW000005-I9J0 | rumbi.mhaka@impilo.health |

All use password: `Impilo2025!`

##### View: above-site-context

Renders `<AboveSiteContextSelection>` (only if user has above-site roles)
- Shows roles, available contexts
- onContextSelected → starts session → navigate "/above-site"
- onBack → sign out → `view = "method-select"`

##### View: client-auth

Renders `<ClientAuth>` component
- onBack → `view = "method-select"`

##### View: system-maintenance

Renders `<SystemMaintenanceAuth>` component
- onBack → `view = "method-select"`

#### 9) Replication Checklist

- [ ] Split layout with branding left, auth right
- [ ] Four login pathways with exact labels and icons
- [ ] System Maintenance hidden by default, revealed via URL param, keyboard shortcut, or mobile long-press
- [ ] Provider ID → Biometric → Workspace multi-step flow
- [ ] Email/password form with show/hide toggle and forgot password link
- [ ] Demo email mapping for provider logins
- [ ] Above-site context selection for users with above-site roles
- [ ] Loading spinner during auth state check
- [ ] Redirect to "/" when already authenticated

---

### Page: Reset Password

- **Route**: `/reset-password`
- **Zone**: Public
- **Access**: Public (token from email link)
- **Component**: `ResetPassword`
- **Purpose**: Set new password after receiving reset email

---

### Page: Forgot Password

- **Route**: `/forgot-password`
- **Zone**: Public
- **Access**: Public
- **Component**: `ForgotPassword`
- **Purpose**: Request password reset email

---

### Page: Portal

- **Route**: `/portal`
- **Zone**: Public / My Life
- **Access**: No ProtectedRoute wrapper (publicly accessible)
- **Component**: `Portal`
- **Purpose**: Patient self-service health portal

---

### Page: Install (PWA)

- **Route**: `/install`
- **Zone**: Public
- **Access**: Public
- **Component**: `Install`
- **Purpose**: PWA installation instructions and prompt

---

### Page: Kiosk

- **Route**: `/kiosk`
- **Zone**: Public
- **Access**: Public (no ProtectedRoute)
- **Component**: `Kiosk`
- **Purpose**: Self-service patient check-in terminal

---

### Page: Product Catalogue

- **Route**: `/catalogue`
- **Zone**: Public / Marketplace
- **Access**: Public (no ProtectedRoute)
- **Component**: `ProductCatalogue`
- **Purpose**: Browse approved health products

---

### Page: Health Marketplace

- **Route**: `/marketplace`
- **Zone**: Public / Marketplace
- **Access**: Public (no ProtectedRoute)
- **Component**: `HealthMarketplace`
- **Purpose**: Compare prices and order from vendors

---

### Page: Shared Summary

- **Route**: `/shared/:type/:token`
- **Zone**: Public
- **Access**: Token-gated (valid sharing token required)
- **Component**: `SharedSummary`
- **Purpose**: View shared clinical summary (discharge summary, IPS, etc.) via unique token

---

### Page: Not Found

- **Route**: `*` (catch-all)
- **Zone**: Public
- **Component**: `NotFound`
- **Purpose**: 404 error page

---

## Home / Module Hub

### Page: Module Home

- **Route**: `/`
- **Zone**: Home
- **Access**: Authenticated (ProtectedRoute)
- **Entry Points**: Login redirect, Home button, logo click
- **Component**: `ModuleHome` (830 lines)

#### 1) Layout & Regions

Full-screen flex column, `bg-gradient-to-br from-background via-background to-muted/30`:

**Header** (sticky, h-14, backdrop-blur-md, border-b):
- Left: Impilo logo (h-8)
- Right:
  - Active Workspace indicator (hidden md:flex, shows facility name with MapPin icon, "Switch Workplace" on click)
  - User profile dropdown (Avatar + name + role)

**Main content** (flex-1, p-4, max-w-7xl):
- Welcome header (only when workspace selected): "Welcome, {title}" + "Working from: {facilityName}"
- Three-tab interface filling remaining height

**Floating Emergency Button** (fixed bottom-6 right-6, h-16 w-16, bg-destructive, rounded-full, animate-pulse):
- AlertTriangle icon (h-8 w-8 white)
- Opens Dialog with `<EmergencyHub />` component (max-w-2xl)

#### 2) Tab Structure

Tab bar: `grid-cols-3` for providers, `grid-cols-1` for clients

| Tab | Label | Icon | Active Style |
|-----|-------|------|-------------|
| work | Work | Briefcase | bg-primary, text-primary-foreground |
| professional | My Professional | Stethoscope | gradient from-teal-500 to-cyan-500, text-white |
| personal | My Life | Heart | gradient from-pink-500 to-purple-500, text-white |

- Clients (`role === "client" || "patient"`) only see "My Life" tab, default to it
- Providers see all 3 tabs, default to "work"

#### 3) Work Tab Content

**State gate**: If no active work context → shows `<WorkplaceSelectionHub>` (facility picker). Otherwise shows modules.

**WorkplaceSelectionHub** (749 lines):
- Shows provider profile summary
- Lists all affiliated facilities (from `useProviderFacilities` hook)
- Each facility card shows: name, type, level of care, capabilities, PIC/Primary badge
- Additional access modes:
  - Above-Site Oversight (for users with above-site roles)
  - Combined View (multi-facility)
  - Remote/Telehealth
  - Support Mode
  - Independent Practice
  - Emergency Work
  - Community Outreach

**When workspace selected**, Work tab shows:

1. **Communication Noticeboard** (bg-card border rounded-lg p-4):
   - Title: "Communication Noticeboard" with MessageSquare icon
   - `<HealthDocumentScanner>` button
   - Three buttons (h-12): Messages, Pages, Calls → navigate to `/communication?tab=...`

2. **Quick Access** (bg-card border rounded-lg p-4):
   - Title: "Quick Access" with Zap icon
   - Eight buttons (h-12, hover color change): EHR, Dashboard, Queue, Prescribe, Register, Lab, Radiology, Schedule

3. **Module Categories Grid** (grid-cols-3 lg:grid-cols-4 gap-3):
   - First card: "Practice Management" (hardcoded modules: Schedule, Patients, Billing, Analytics, Staff, Inventory)
   - Remaining cards: `visibleCategories` filtered by role + facility capabilities
   - Each card is `<ExpandableCategoryCard>` — click opens Dialog with module grid

**Module Categories** (17 categories total):

| ID | Title | Role Restriction |
|----|-------|-----------------|
| clinical | Clinical Care | None (all users) |
| consults-referrals | Consults & Referrals | None |
| orders | Orders & Diagnostics | None |
| scheduling | Scheduling & Registration | None |
| marketplace | Health Products & Marketplace | None |
| finance | Finance & Billing | admin, receptionist, doctor, nurse |
| inventory | Inventory & Supply Chain | admin, pharmacist, nurse |
| identity | Identity Services | admin, registrar, receptionist, hie_admin, doctor, nurse |
| registries | Kernel & Sovereign Registries | admin, hie_admin, doctor, specialist |
| public-health | Public Health & Local Authority | admin, hie_admin, doctor, nurse |
| coverage | Coverage, Financing & Payer | admin, hie_admin, receptionist |
| ai-intelligence | Intelligence, Automation & AI | admin, hie_admin, doctor, specialist |
| experience | Experience, Omnichannel & Access | None |
| admin | Governance & Configuration | admin, doctor, specialist, hie_admin |
| clinical-tools | Clinical Tools | doctor, nurse, specialist, admin |
| support | Help & Support | None |

Each module within categories has: id, label, description, icon, path, color, optional roles[], optional capabilities[]

#### 4) My Professional Tab

Renders `<MyProfessionalHub>` (615 lines):
- Five sub-tabs: Dashboard, Affiliations, My Patients, Schedule, Credentials
- **Dashboard**: Priority alerts (critical results, pending signatures, missed callbacks)
- **Affiliations**: Multi-facility shift control with Start Shift button per facility
- **My Patients**: Global patient panel across all facilities (search, filter by context)
- **Schedule**: Today's appointments and shifts
- **Credentials**: CPD tracker (points earned/pending/required), license status
- Includes `<LandelaNotificationsPanel>` and `<ProfessionalEmailPanel>`
- Uses mock data for demonstration

#### 5) My Life Tab

Renders `<PersonalHub>` (541 lines):
- Two sections toggle: Health | Social
- **Health section** tabs: Home, Timeline, Medications, Appointments, Wallet, Communities, Monitoring, Messaging, Marketplace, Wellness
  - Uses Portal module components (PortalHealthTimeline, PortalMedications, etc.)
  - Quick actions grid with health service buttons
  - `<EmergencySOS>`, `<PortalQueueStatus>`, `<HealthIdManager>`, `<ServiceDiscovery>`
- **Social section** tabs: Timeline, Communities, Clubs, Pages, Crowdfunding
  - Uses Social components (TimelineFeed, CommunitiesList, ClubsList, ProfessionalPages, CrowdfundingCampaigns)
  - `<NewsFeedWidget>`

#### 6) User Profile Dropdown

Trigger: Avatar button with name + role
Content (w-64):
- User info: Avatar (h-12), name, role badge, specialty
- "Switch Workplace" (if active context)
- "View Profile" → `/profile`
- "Account Settings" → `/profile`
- "Security & Privacy" → `/profile`
- "Admin Dashboard" → `/admin` (only if isAdmin)
- "Sign Out" → sign out + toast + navigate "/auth"

#### 9) Replication Checklist

- [ ] Three-tab layout (Work/Professional/Life) with role-based visibility
- [ ] WorkplaceSelectionHub with all 8 access mode options
- [ ] Communication Noticeboard with Messages/Pages/Calls buttons
- [ ] Quick Access bar with 8 action buttons
- [ ] Module category grid with ExpandableCategoryCard dialogs
- [ ] Role-based AND capability-based module filtering
- [ ] Floating Emergency button (bottom-right, pulsing)
- [ ] Profile dropdown with workspace switch and sign out
- [ ] Mock data for Professional tab (CPD, patients, schedule)

---

## Work Zone — Clinical

### Page: Encounter (EHR)

- **Route**: `/encounter` and `/encounter/:encounterId`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Component**: `Encounter` → wraps in `<ProviderContextProvider>` + `<EHRProvider>` → `<EncounterContent>`

#### 1) Layout & Regions (EHRLayout — unique to this route)

**DOES NOT use AppLayout/AppSidebar**. Uses `<EHRLayout>`:

```
┌─────────────────────────────────────────────────┐
│                    TOP BAR (h-14)                 │
├─────────────────────────────────────────────────┤
│                  PATIENT BANNER                  │
├──────────────────────────┬──────────────────────┤
│                          │                      │
│     MAIN WORK AREA       │   ENCOUNTER MENU     │
│     (flex-1)             │   (w-64)             │
│                          │                      │
└──────────────────────────┴──────────────────────┘
```

If `isCriticalEventActive`: ring-4 ring-critical ring-inset

##### States:
1. **No encounterId** → `<NoPatientSelected>` (patient selection UI)
2. **Loading** → Centered spinner "Loading patient chart..."
3. **Error** → Error card with "Unable to Load Chart" + buttons: Go Back, Back to Queue, Home
4. **Active patient** → Full `<EHRLayout>`

#### 2) TopBar (h-14)

Background: bg-topbar-bg, text-topbar-foreground, border-b, shadow-sm

Left section:
- Back button (ArrowLeft) → navigate(-1)
- Home button (Home) → Link to "/"
- Impilo logo (h-7)
- Divider (h-6 w-px)
- **Top Bar Actions** (only when hasActivePatient): Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges
  - Each toggles corresponding panel in MainWorkArea
  - Register button → Link to "/registration"

Center section (when hasActivePatient + currentEncounter):
- "Chart Locked" badge (green, Lock icon)
- Patient name (text-sm font-medium)
- Patient details: MRN • Ward • Bed (text-xs)
- Allergies badge (yellow, AlertTriangle icon) if allergies present
- "Close Chart" button → AlertDialog confirmation → closeChart("/queue")

Center (when !hasActivePatient):
- "No Patient Selected" with ShieldCheck icon

Right section:
- PatientSearch (only with active patient)
- Divider
- ActiveWorkspaceIndicator (compact, only with active patient)
- AIDiagnosticAssistant
- AlertBadge (clinical alerts)
- CDSAlertBadge (clinical decision support)
- CriticalEventButton
- UserMenu (always visible)

#### 3) Encounter Menu (Right Nav, w-64)

Header: "Encounter Record" / "Clinical Documentation"

**Patient File Button**: Toggle button for patient file workspace

**Menu Items** (from ENCOUNTER_MENU_ITEMS):
| ID | Label | Icon |
|----|-------|------|
| overview | Overview | LayoutDashboard |
| assessment | Assessment | ClipboardCheck |
| problems | Problems & Diagnoses | Stethoscope |
| orders | Orders & Results | FileText |
| care | Care & Management | Heart |
| consults | Consults & Referrals | Users |
| notes | Notes & Attachments | FileEdit |
| outcome | Visit Outcome | CheckCircle |

De-emphasized (opacity-50, pointer-events-none) during critical events or non-patient-file workspaces.

#### 4) Main Work Area

Priority rendering:
1. **Critical Event** → `<CriticalEventWorkspace>`
2. **Active Workspace** → `<WorkspaceView>`
3. **Top Bar Action** → `<TopBarPanel>`
4. **Default** → `<EncounterSection>` (renders based on activeMenuItem)

AnimatePresence with framer-motion transitions.

#### 9) Replication Checklist

- [ ] EHRLayout with TopBar + PatientBanner + MainWorkArea + EncounterMenu
- [ ] Patient context loading from URL encounterId
- [ ] Chart access flow with source parameter (queue/appointment/worklist = pre-authorized)
- [ ] 10 TopBar action buttons that toggle panels
- [ ] 8 Encounter Menu items
- [ ] Critical event mode with ring border
- [ ] Chart lock indicator and close confirmation dialog

---

### Page: Dashboard

- **Route**: `/dashboard`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Dashboard">`

#### Content

Tabs: "worklist" (default), "department", "team", others via `<ProviderDashboardTabs>`

**Header Stats** (when not department/team view): Quick action cards for Queue, Beds, Register, Appointments, Inbox

**Communication Actions**: Messages (count 5), Pages (count 2), Calls (count 0)

**Workspace-aware content**: Switches based on `currentView`:
- "department" → `<DepartmentView>`
- "team" → `<TeamView>`
- default → worklist with patients, tasks, orders, referrals, results

Data source: `useDashboardData()` hook → Supabase queries

---

### Page: Queue Management

- **Route**: `/queue`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Queue Management">`

#### Tabs (6 tabs)

| Tab | Label | Icon | Component |
|-----|-------|------|-----------|
| workstation | Workstation | Users | QueueWorkstation |
| supervisor | Supervisor | LayoutDashboard | SupervisorDashboard |
| bookings | Bookings | CalendarDays | BookingManager |
| check-in | Check-In | QrCode | SelfCheckInKiosk |
| config | Config | Settings | QueueConfigManager |
| pathways | Pathways | GitBranch | QueuePathwayEditor |

Header has `<AddToQueueDialog>` button.

Data: `useQueueManagement()` hook → Supabase `queue_definitions` table

---

### Page: Bed Management

- **Route**: `/beds`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Bed Management">`
- **Component**: `<BedManagement />`

---

### Page: Patient Sorting

- **Route**: `/sorting`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Component**: `PatientSorting`
- **Purpose**: Front desk arrival, triage, and queue assignment

---

### Page: Discharge & Exit

- **Route**: `/discharge`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Component**: `<DischargeDashboard />`
- **Purpose**: Discharge workflows, death workflows, exit management

---

### Page: Shift Handoff

- **Route**: `/handoff`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Component**: `Handoff`
- **Purpose**: Care continuity reports during shift changes

---

### Page: Communication

- **Route**: `/communication`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Component**: `Communication`
- **Purpose**: Secure messaging, clinical pages, voice calls
- **Query params**: `?tab=messages|pages|calls`

---

### Page: Patients

- **Route**: `/patients`
- **Zone**: Work / Clinical
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Patient Registry">`

#### Content

- Search bar (client-side filter on first_name, last_name, mrn, phone_primary)
- Tabs: "all" (default), "active" (filters `is_active === true`), "inactive" (filters `is_active === false`) — all client-side filtering on pre-fetched data (`src/pages/Patients.tsx:62-72`)
- Patient table from Supabase `patients` table (fetched via `supabase.from("patients").select("*").order("created_at", { ascending: false })`)
  - Columns: MRN, Name (first+last), DOB, Gender, Phone, Email, City, Status
  - Row click → opens `<PatientProfile>` in Dialog
- Register button → opens `<PatientRegistrationForm>` in Dialog
- Export button

---

## Work Zone — Orders & Diagnostics

### Page: Orders

- **Route**: `/orders`
- **Zone**: Work / Orders
- **Access**: Authenticated
- **Component**: `Orders`
- **Purpose**: Clinical order entry (medications, labs, imaging)

---

### Page: Pharmacy

- **Route**: `/pharmacy`
- **Zone**: Work / Orders
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Pharmacy">`
- **Content**: `<MedicationDispensing />`

---

### Page: LIMS (Laboratory)

- **Route**: `/lims`
- **Zone**: Work / Orders
- **Access**: Authenticated
- **Layout**: `<AppLayout title="Laboratory Information System">`
- **Content**: `<LIMSIntegration />`

---

### Page: PACS (Imaging)

- **Route**: `/pacs`
- **Zone**: Work / Orders
- **Access**: Authenticated
- **Layout**: `<AppLayout title="PACS Imaging">`

#### Tabs (5 tabs)

| Tab | Label | Icon | Component |
|-----|-------|------|-----------|
| worklist | Worklist | ListTodo | RadiologistWorklist |
| viewer | Viewer | Monitor | PACSViewer |
| teleradiology | Teleradiology | Globe | TeleradiologyHub |
| critical | Critical Findings | AlertTriangle | CriticalFindingsManager |
| admin | Admin | Settings | PACSAdminDashboard |

---

## Work Zone — Consults & Referrals

### Page: Telemedicine

- **Route**: `/telemedicine`
- **Zone**: Work / Consults
- **Access**: Authenticated
- **Component**: `<FullCircleTelemedicineHub>` (full-screen, no AppLayout)
- **Query params**: `?tab=referrals|consults|boards`
- **Purpose**: Full-circle teleconsultation including referrals, specialist consults, and case review boards

---

## Work Zone — Scheduling & Registration

### Page: Appointments

- **Route**: `/appointments`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `Appointments`

---

### Page: Registration

- **Route**: `/registration`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Layout**: `<AppLayout>`

#### Views (state machine: "menu" | "registration" | "visit" | "iam")

**Menu view** (default):
Three cards (grid-cols-1 md:grid-cols-3):
1. "New Client Registration" — Demographics, Biometric ID, FHIR Consent → RegistrationWizard
2. "Create New Visit" — Patient Lookup, Biometric Verify, Visit Details → VisitCreation
3. "IAM & Consent Architecture" — KeyCloak, eSignet, FHIR Consent → IAMArchitecture

Each sub-view has Back button to return to menu.

Success toasts:
- Registration: "Patient registered successfully!" with name
- Visit: "Visit created successfully!" / "The patient has been checked in."

---

### Page: Scheduling

- **Route**: `/scheduling`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `AppointmentScheduling`

---

### Page: Theatre Scheduling

- **Route**: `/scheduling/theatre`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `TheatreScheduling`

---

### Page: Provider Noticeboard

- **Route**: `/scheduling/noticeboard`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `ProviderNoticeboard`

---

### Page: Resource Calendar

- **Route**: `/scheduling/resources`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `ResourceCalendar`

---

### Page: Theatre Booking

- **Route**: `/theatre`
- **Zone**: Work / Scheduling
- **Access**: Authenticated
- **Component**: `Theatre`

---

## Work Zone — Marketplace

### Page: Prescription Fulfillment

- **Route**: `/fulfillment`
- **Zone**: Work / Marketplace
- **Access**: Authenticated
- **Component**: `PrescriptionFulfillment`
- **Purpose**: Bidding and vendor selection for prescriptions

---

### Page: Vendor Portal

- **Route**: `/vendor-portal`
- **Zone**: Work / Marketplace
- **Access**: Authenticated
- **Component**: `VendorPortal`
- **Purpose**: View fulfillment requests and submit bids

---

## Work Zone — Finance

### Page: Payments

- **Route**: `/payments`
- **Zone**: Work / Finance
- **Access**: Authenticated
- **Component**: `Payments`

---

### Page: Charges

- **Route**: `/charges`
- **Zone**: Work / Finance
- **Access**: Authenticated
- **Component**: `Charges`

---

## Work Zone — Operations

### Page: Stock Management

- **Route**: `/stock`
- **Zone**: Work / Operations
- **Access**: Authenticated
- **Component**: `Stock`

---

### Page: Consumables

- **Route**: `/consumables`
- **Zone**: Work / Operations
- **Access**: Authenticated
- **Component**: `Consumables`

---

### Page: Operations & Roster

- **Route**: `/operations`
- **Zone**: Work / Operations
- **Access**: Authenticated
- **Component**: `Operations`
- **Query params**: `?tab=control-tower`

---

## Work Zone — Identity

### Page: ID Services

- **Route**: `/id-services`
- **Zone**: Work / Identity
- **Access**: Authenticated
- **Component**: `IdServices`
- **Query params**: `?tab=generate|recovery|validate|batch`
- **Purpose**: Generate, validate, and recover health IDs (PHID, Provider, Facility)

---

## Registries

### Page: Client Registry (VITO)

- **Route**: `/client-registry`
- **Zone**: Registries
- **Access**: Authenticated
- **Component**: `ClientRegistry`
- **Purpose**: National Health ID Registry with CRID/CPID mapping

---

### Page: Health Provider Registry (VARAPI)

- **Route**: `/hpr`
- **Zone**: Registries
- **Access**: Authenticated
- **Component**: `HealthProviderRegistry`
- **Purpose**: Practitioner identity, licenses, privileges

---

### Page: Facility Registry (TUSO)

- **Route**: `/facility-registry`
- **Zone**: Registries
- **Access**: Authenticated
- **Component**: `FacilityRegistry`
- **Query params**: `?tab=reconciliation|changes|reference|reports`
- **Purpose**: Master Facility List (MFL)

---

### Page: Registry Management

- **Route**: `/registry-management`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `RegistryManagement`
- **Purpose**: HIE registry management console

---

## My Life / Social

### Page: Social Hub

- **Route**: `/social`
- **Zone**: My Life
- **Access**: Authenticated
- **Component**: `Social`
- **Purpose**: Communities, posts, crowdfunding, professional pages

---

## Ops/Admin

### Page: Admin Dashboard

- **Route**: `/admin`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `AdminDashboard`
- **Query params**: `?tab=users|security|audit|integrations`

---

### Page: Above-Site Dashboard

- **Route**: `/above-site`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `AboveSiteDashboard`
- **Purpose**: District, provincial, and national oversight dashboard

---

### Page: Reports & Analytics

- **Route**: `/reports`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `Reports`

---

### Page: Odoo ERP Integration

- **Route**: `/odoo`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `Odoo`

---

### Page: Profile Settings

- **Route**: `/profile`
- **Zone**: Support
- **Access**: Authenticated
- **Component**: `ProfileSettings`

---

### Page: Help Desk

- **Route**: `/help`
- **Zone**: Support
- **Access**: Authenticated
- **Component**: `HelpDesk`

---

### Page: Workspace Management

- **Route**: `/workspace-management`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `WorkspaceManagement`

---

### Page: Landela DMS

- **Route**: `/landela`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `Landela`
- **Purpose**: Document management and scanning system

---

### Page: Product Registry Admin

- **Route**: `/admin/product-registry`
- **Zone**: Ops/Admin
- **Access**: Authenticated
- **Component**: `ProductManagement`

---

## Kernel Service Admin Surfaces

All kernel admin pages are wrapped in `<ProtectedRoute>`. Access: Authenticated (no additional role gate in code; routing is the only guard). Each page is a self-contained component in `src/pages/admin/`.

---

### Page: TSHEPO Consent Management

- **Route**: `/admin/tshepo/consents`
- **Component**: `TshepoConsentAdmin` (`src/pages/admin/TshepoConsentAdmin.tsx`)
- **Layout**: No AppLayout — bare `div.space-y-6.p-6`
- **Header**: Shield icon + "TSHEPO Consent Management" (h1 text-2xl font-bold) + "New Consent" button (opens Dialog)

#### Filters
- Search input: placeholder "Search by Patient CPID..." (pl-9 with Search icon)
- Status Select: options "Active" (value `active`), "Revoked" (value `rejected`), "All" (value `all`). Default: `active`

#### Table
Columns (exact header text): FHIR ID | Patient CPID | Provision | Purpose | Status | Created | Actions

- FHIR ID: `font-mono text-xs`, truncated to 20 chars + "..."
- Patient CPID: `font-mono text-xs`
- Provision: Badge — `default` variant for "permit", `destructive` for "deny"
- Purpose: Joins `purpose_of_use[]` with ", "
- Status: Badge — `default` for "active", `secondary` otherwise
- Created: `toLocaleDateString()`
- Actions: "Revoke" button (destructive, with XCircle icon) — only shown when `status === 'active'`

**Loading state**: "Loading..." in center cell (colSpan 7)
**Empty state**: "No consents found" in center cell (colSpan 7)

#### Create Consent Dialog
- Title: "Create FHIR R4 Consent"
- Fields (in order):
  1. **Patient CPID** — Input, placeholder "CPID-..."
  2. **Grantor Reference** — Input
  3. **Grantee Reference** — Input
  4. **Purpose of Use** — Select: Treatment (default), Payment, Operations, Research, Public Health
  5. **Provision Type** — Select: Permit (default), Deny
  6. **Scope Code** — hardcoded to `patient-privacy` (not editable in UI)
- Submit button: "Create Consent" — disabled when `!patient_cpid || !grantor_ref`

#### API Calls
- **Fetch**: `supabase.from('tshepo_consents').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(50)` + optional `.eq('patient_cpid', searchCpid)` + optional `.eq('status', statusFilter)`
- **Revoke**: `supabase.from('tshepo_consents').update({ status: 'rejected', revoked_at: now, revocation_reason: 'Admin revocation' }).eq('id', consentId)`
- **Create**: `supabase.from('tshepo_consents').insert({ tenant_id: 'default-tenant', fhir_id: 'Consent/{uuid}', fhir_resource: { resourceType: 'Consent', id, status: 'active' }, patient_cpid, grantor_ref, grantee_ref, purpose_of_use: [value], provision_type, scope_code, action_codes: [], data_classes: [] })`

#### Toasts
- Revoke success: "Consent revoked"
- Revoke error: "Revocation failed"
- Create success: "Consent created"
- Create error: "Creation failed"

---

### Page: TSHEPO Audit Ledger

- **Route**: `/admin/tshepo/audit`
- **Component**: `TshepoAuditSearch` (`src/pages/admin/TshepoAuditSearch.tsx`)
- **Header**: BookOpen icon + "TSHEPO Audit Ledger" (h1) + Badge "Hash-Chained" (with Link2 icon, variant outline)

#### Filters (flex row, wrapping)
1. **Actor ID** — Input, placeholder "Filter by Actor ID..." (with Search icon)
2. **Action** — Input, placeholder "Filter by action..." (w-48)
3. **Decision** — Select (w-36): All Decisions (default `all`), Allow (`ALLOW`), Deny (`DENY`), Break Glass (`BREAK_GLASS`), System (`SYSTEM`)

#### Table (inside ScrollArea h-[600px])
Columns: # | Time | Actor | Action | Decision | Reason | Resource | Hash

- #: `chain_sequence` (font-mono text-xs)
- Time: `occurred_at` via `toLocaleString()` (text-xs whitespace-nowrap)
- Actor: `actor_id` truncated to 12 chars + "..." (font-mono text-xs, max-w-24 truncate)
- Action: `action` (font-mono text-xs)
- Decision: Badge color-coded — ALLOW → green (`bg-green-600`), DENY → destructive, BREAK_GLASS → amber (`bg-amber-600`), other → secondary
- Reason: `reason_codes[]` joined with ", " (text-xs, max-w-32 truncate)
- Resource: `resource_type:resource_id` (first 8 chars of ID)
- Hash: `record_hash` first 8 chars + "..." (title attribute shows full hash)

#### Pagination
- Page size: 50
- Footer: "{total} records" text + Previous/Next buttons
- Previous disabled when `page <= 1`

#### API Calls
- **Fetch**: `supabase.from('tshepo_audit_ledger').select('*', { count: 'exact' }).order('chain_sequence', { ascending: false }).range((page-1)*50, page*50-1)` + optional `.eq('actor_id', actorFilter)` + optional `.ilike('action', '%{actionFilter}%')` + optional `.eq('decision', decisionFilter)`

**Loading**: "Loading audit chain..."
**Empty**: "No audit records found"

---

### Page: Break-Glass Access

- **Route**: `/admin/tshepo/breakglass`
- **Component**: `TshepoBreakGlass` (`src/pages/admin/TshepoBreakGlass.tsx`)
- **Header**: Zap icon (amber) + "Break-Glass Access" (h1) + Badge (destructive) showing pending count when > 0

#### Tabs
1. **Review Queue** — label includes count: "Review Queue ({count})"
2. **History**

#### Review Queue Tab
Each pending item rendered as a Card with `border-amber-500/30`:
- **Header row**: AlertTriangle icon + "Emergency Access — {emergency_type}" + status Badge
- **Details grid** (2 cols): Patient CPID (font-mono), Actor (truncated), Time, Expires, Justification (col-span-2)
- **Review controls**: Textarea (placeholder "Review notes...", h-16) + 3 buttons:
  - "Approve" (green bg-green-600)
  - "Flag for Review" (outline, orange border)
  - "Violation" (destructive)

**Loading**: "Loading..."
**Empty**: "No pending reviews"

#### History Tab — Table
Columns: Time | Actor | Patient CPID | Emergency Type | Justification | Status | Outcome

- Status badges: pending_review → amber "Pending Review" (with Clock), approved → green (CheckCircle), flagged → orange (AlertTriangle), violation → destructive (XCircle)

#### API Calls
- **Pending**: `supabase.from('trust_layer_break_glass').select('*').eq('review_queue_status', 'pending_review').order('access_started_at', { ascending: false })`
- **All events**: `supabase.from('trust_layer_break_glass').select('*').order('access_started_at', { ascending: false }).limit(100)`
- **Review**: `supabase.from('trust_layer_break_glass').update({ review_queue_status: 'reviewed', review_outcome: outcome, reviewed_at: now, review_notes }).eq('id', id)`

#### Toasts
- Review success: "Review submitted"

---

### Page: My Access History

- **Route**: `/admin/tshepo/access-history`
- **Component**: `TshepoPatientAccessHistory` (`src/pages/admin/TshepoPatientAccessHistory.tsx`)
- **Header**: Eye icon + "My Access History" (h1)
- **Description text**: "View a transparent record of who accessed your health information, when, and why. Accessor identities are redacted for privacy."

#### Input
- Patient CPID input, placeholder "Enter your Patient CPID..." (max-w-md)
- Query only enabled when `patientCpid` is truthy

#### Table
Columns: Date | Accessor Role | Facility | Action | Purpose | Decision | Notes

- Date: `occurred_at` via `toLocaleString()` (text-xs whitespace-nowrap)
- Accessor Role: `accessor_role || accessor_type`
- Facility: "Facility {first 8 chars}..." or "—"
- Decision: Badge — `default` for ALLOW, `destructive` otherwise
- Notes: Break-glass → amber Badge "Emergency" (AlertTriangle icon); Redacted → secondary Badge "Redacted" (Shield icon)
- Rows with `is_break_glass` get class `bg-amber-500/5`

#### Pagination
- Page size: 20
- Footer: "{total} total records" + Previous/Next (Next disabled when `page * limit >= total`)

#### API Calls
- **Fetch**: `supabase.from('tshepo_patient_access_log').select('occurred_at, accessor_type, accessor_role, facility_ref, action, purpose_of_use, resource_type, decision, is_break_glass, is_redacted', { count: 'exact' }).eq('patient_cpid', patientCpid).order('occurred_at', { ascending: false }).range(...)`

**Pre-search**: "Enter your CPID to view access history"
**Loading**: "Loading..."
**Empty**: "No access records found"

---

### Page: Offline Trust & Reconciliation

- **Route**: `/admin/tshepo/offline`
- **Component**: `TshepoOfflineStatus` (`src/pages/admin/TshepoOfflineStatus.tsx`)
- **Header**: WifiOff icon (amber) + "Offline Trust & Reconciliation" (h1) + 2 Badges in top-right: "{n} Active Tokens" (Key icon), "{n} Provisional O-CPIDs" (Fingerprint icon)

#### Stats Cards (3 columns)
1. **Active Offline Tokens** — count (text-3xl font-bold)
2. **Awaiting Reconciliation** — count (amber text)
3. **Reconciled O-CPIDs** — count (green text)

#### Tabs
1. **O-CPIDs** — count in label
2. **Offline Tokens** — count in label

#### O-CPIDs Table
Columns: O-CPID | Status | Facility | Created | Reconciled CPID | Actions

- Status badges: reconciled → green, provisional → amber, pending_reconciliation → outline, other → secondary
- Actions: "Reconcile" button (outline, RefreshCw icon) only for `status === 'provisional'`

#### Tokens Table
Columns: Token | Status | Facility | Scope | Actions Used | Issued | Expires

- Token: `token_hash` first 12 chars + "..."
- Status: revoked → destructive, expired (computed from `expires_at`) → secondary, else → green "Active"
- Actions Used: `{actions_used}/{max_actions}`

#### API Calls
- **Tokens**: `supabase.from('trust_layer_offline_tokens').select('*').order('issued_at', { ascending: false }).limit(50)`
- **O-CPIDs**: `supabase.from('trust_layer_offline_cpid').select('*').order('created_at', { ascending: false }).limit(100)`
- **Reconcile**: `supabase.from('trust_layer_offline_cpid').update({ status: 'pending_reconciliation', sync_attempted_at: now }).eq('o_cpid', oCpid)`

#### Toasts
- Reconcile success: "Reconciliation queued"

---

### Page: VITO Patients

- **Route**: `/admin/vito/patients`
- **Component**: `VitoPatients` (`src/pages/admin/VitoPatients.tsx`)
- **Header**: Back button (→ `/admin`) + "VITO Patients" (h1) + subtitle "Identity refs only — no PII stored"

#### Search
- Input with Search icon, placeholder "Search by health_id, crid, cpid..."
- Query: `.or('health_id.ilike.%q%, crid.ilike.%q%, cpid.ilike.%q%')`

#### Table
Columns: Health ID | CRID | CPID | Status | Created

- All ID columns: `font-mono text-xs`
- Status: Badge `default` for active, `secondary` otherwise
- "—" for null CRID/CPID

#### Create Dialog
- Title: "Create Patient Identity Ref"
- Fields: Health ID (opaque, placeholder "e.g. HID-000123"), CRID (optional), CPID (optional)
- Submit: "Create" — disabled when `!newHealthId || isPending`
- API: `supabase.from('vito_patients').insert({ tenant_id: 'default-tenant', health_id, crid, cpid, created_by: 'admin' })`

**Loading**: "Loading..." | **Empty**: "No patients found"
**Toast**: success "Patient identity ref created"

---

### Page: VITO Merge Queue

- **Route**: `/admin/vito/merges`
- **Component**: `VitoMergeQueue` (`src/pages/admin/VitoMergeQueue.tsx`)
- **Header**: Back button + "VITO Merge Queue" + subtitle "Federation-guarded patient merge requests"

#### Spine Status Banner
- Card with conditional `border-destructive` class when spine offline
- Shows: "Spine Status:" + Badge (default/destructive) + "Emit Mode:" + Badge (outline)
- When offline: AlertTriangle icon + "Merges blocked — federation authority unavailable"
- Status from: `supabase.from('vito_config').select('*').eq('tenant_id', 'default-tenant')` parsed as key-value map

#### Merge Table
Columns: Survivor | Merged IDs | Status | Reason | Requested By | Created

#### Create Merge Dialog
- Title: "Create Merge Request"
- Fields: Survivor Health ID (Input), Merged Health IDs (Input, comma-separated, placeholder "HID-002, HID-003"), Reason (Textarea)
- Submit disabled when `!survivorId || !mergedIds || !reason || isPending` or `!spineOnline`
- **Federation Guard**: If `!spineOnline`, throws Error with message including spine_status
- API: `supabase.from('vito_merge_requests').insert({ tenant_id: 'default-tenant', survivor_health_id, merged_health_ids: ids[], requested_by: 'admin', reason, status: 'approved', reviewed_by: 'admin', reviewed_at: now })`

---

### Page: VITO Events

- **Route**: `/admin/vito/events`
- **Component**: `VitoEventsViewer` (`src/pages/admin/VitoEventsViewer.tsx`)
- **Header**: "VITO Events" + subtitle "v1.1 event envelope viewer"
- **Filter**: Input placeholder "Filter by correlation_id, request_id, or event_type..."
- **Query**: `.or('correlation_id.eq.{f}, request_id.eq.{f}, event_type.ilike.%{f}%')`

#### Table
Columns: Event Type | Subject | Producer | Schema V | Actor | Occurred | (eye icon)

- Event Type: Badge outline font-mono
- Detail dialog: JSON.stringify with pretty-print in `<pre>` inside max-w-2xl max-h-[80vh] Dialog

**API**: `supabase.from('vito_event_envelopes').select('*').order('occurred_at', { ascending: false }).limit(100)`

---

### Page: VITO Audit Log

- **Route**: `/admin/vito/audit`
- **Component**: `VitoAuditViewer` (`src/pages/admin/VitoAuditViewer.tsx`)
- **Header**: "VITO Audit Log" + subtitle "Opaque audit entries — no PII"
- **Filter**: Input placeholder "Filter by correlation_id, request_id, actor_id, or action..."

#### Table
Columns: Action | Decision | Actor | Resource | Purpose | Created

- Decision: Badge destructive for DENY, default otherwise
- Resource: `{resource_type}/{resource_id}` or "—"

**API**: `supabase.from('vito_audit_log').select('*').order('created_at', { ascending: false }).limit(100)` + optional `.or('correlation_id.eq.{f}, request_id.eq.{f}, actor_id.ilike.%{f}%, action.ilike.%{f}%')`

---

### Page: BUTANO — CPID Timeline

- **Route**: `/admin/butano/timeline`
- **Component**: `ButanoTimeline` (`src/pages/admin/ButanoTimeline.tsx`)
- **Header**: "BUTANO — CPID Timeline" + subtitle "PII-free longitudinal clinical record viewer"

#### Search Controls
- CPID input (placeholder "Enter CPID (e.g. CPID-12345)")
- Resource type Select: "All Types" + 9 FHIR types (Encounter, Condition, AllergyIntolerance, MedicationRequest, Observation, DiagnosticReport, Procedure, Immunization, CarePlan)
- Search button

#### Results
- Summary: "Showing {n} of {total} records for {CPID}" (Badge outline)
- Cards for each resource: FileText icon + resource_type (font-medium) + Provisional badge (yellow, AlertTriangle) if `is_provisional` + fhir_id + encounter_id + Clock icon with `last_updated_at`
- Provisional cards have `border-yellow-500/50`

**API**: `supabase.from('butano_fhir_resources').select('id, resource_type, fhir_id, encounter_id, effective_at, last_updated_at, is_provisional, meta_json', { count: 'exact' }).eq('tenant_id', 'default-tenant').eq('subject_cpid', cpid).order('last_updated_at', { ascending: false }).limit(100)` + optional `.eq('resource_type', typeFilter)`

---

### Page: BUTANO — IPS Viewer

- **Route**: `/admin/butano/ips`
- **Component**: `ButanoIPS` (`src/pages/admin/ButanoIPS.tsx`)
- **Header**: "BUTANO — IPS Viewer" + subtitle "International Patient Summary (PII-free)"
- **Input**: CPID input + "Generate IPS" button

#### IPS Sections (Tabs)
8 sections, each with icon + label + count Badge:
1. Allergies (Bug icon) — AllergyIntolerance
2. Problems (Stethoscope) — Condition
3. Medications (Pill) — MedicationRequest + MedicationStatement
4. Immunizations (Syringe) — Immunization
5. Vitals (Activity) — Observation where `category[0].coding[0].code === 'vital-signs'`
6. Labs (FlaskConical) — Observation where `category[0].coding[0].code === 'laboratory'`
7. Procedures (Shield) — Procedure
8. Care Plans (ClipboardList) — CarePlan

Each section: renders FHIR JSON in `<pre>` blocks. Empty: "No records in this section."

**API**: `supabase.from('butano_fhir_resources').select('resource_type, resource_json, last_updated_at').eq('tenant_id', 'default-tenant').eq('subject_cpid', cpid).in('resource_type', [...]).order('last_updated_at', { ascending: false })`

---

### Page: BUTANO — Visit Summary

- **Route**: `/admin/butano/visit-summary`
- **Component**: `ButanoVisitSummary` (`src/pages/admin/ButanoVisitSummary.tsx`)
- **Input**: Encounter ID + "Fetch Summary" button
- Shows: Encounter card (`<pre>` JSON) + linked resources list with resource_type Badge + JSON

**API**: `supabase.from('butano_fhir_resources').select('resource_type, resource_json, last_updated_at').eq('tenant_id', 'default-tenant').eq('encounter_id', encounterId).order('last_updated_at', { ascending: false })`

---

### Page: BUTANO — Reconciliation Queue

- **Route**: `/admin/butano/reconciliation`
- **Component**: `ButanoReconciliation` (`src/pages/admin/ButanoReconciliation.tsx`)
- **Header**: "BUTANO — Reconciliation Queue" + subtitle "O-CPID → CPID subject reconciliation"

#### New Reconciliation Card
- Two inputs: O-CPID (placeholder "O-CPID (e.g. O-CPID-ABC123)") → CPID (placeholder "CPID (e.g. CPID-12345)")
- "Start Reconciliation" button (GitMerge icon)
- Process: (1) insert job with status RUNNING, (2) fetch all FHIR resources matching O-CPID, (3) update each record's `subject_cpid` to CPID + set `is_provisional: false` + add `reconciled_from:` meta tag, (4) update job to COMPLETED

#### Jobs List
- Card per job: StatusIcon (CheckCircle green / XCircle destructive / Clock yellow) + "from → to" + timestamp + status Badge

**API**: Insert to `butano_reconciliation_queue`, select/update `butano_fhir_resources`
**Toast**: "Reconciled {n} records from {O-CPID} → {CPID}"

---

### Page: BUTANO — SHR Stats

- **Route**: `/admin/butano/stats`
- **Component**: `ButanoStats` (`src/pages/admin/ButanoStats.tsx`)
- **Header**: "BUTANO — SHR Stats" + subtitle "Resource counts and PII violation log" + Refresh button

#### Stats Cards (3 columns)
1. Total Resources (Database icon, primary)
2. Resource Types count (Clock icon, primary)
3. PII Violations count (ShieldAlert icon, destructive)

#### Resources by Type
- Sorted by count descending. Each row: type name + "Last: {date}" + count Badge

#### PII Violation Log
- Shown only when violations exist. Title in destructive color.
- Each row: `violation_type — resource_type` + "Paths: {paths.join(', ')}" + timestamp

**API**:
- Resources: `supabase.from('butano_fhir_resources').select('resource_type, last_updated_at').eq('tenant_id', 'default-tenant')`
- Violations: `supabase.from('butano_pii_violations').select('*').eq('tenant_id', 'default-tenant').order('created_at', { ascending: false }).limit(20)`

---

### Page: ZIBO Terminology Governance

- **Route**: `/admin/zibo`
- **Component**: `ZiboAdmin` (`src/pages/admin/ZiboAdmin.tsx`)
- **Header**: "ZIBO — Terminology Governance" + subtitle "Artifact lifecycle, packs, assignments, validation observability"

#### 6 Tabs (grid-cols-6)
1. **Artifacts** — CRUD for FHIR terminology artifacts (CodeSystem, ValueSet, ConceptMap, etc.). Lifecycle: DRAFT → PUBLISHED → DEPRECATED → RETIRED. Status-colored badges. Edit DRAFT with JSON textarea. Actions: Publish (DRAFT→PUBLISHED), Deprecate (PUBLISHED→DEPRECATED), Retire (DEPRECATED→RETIRED).
2. **Import** — FHIR Bundle JSON import + CSV codelist import (name, system URL, version, codes as `code,display` per line, optional ValueSet creation)
3. **Packs** — Create/list terminology packs (pack_id, name, version). Publish DRAFT packs.
4. **Assignments** — Assign packs to scopes (TENANT/FACILITY/WORKSPACE) with policy mode (STRICT/LENIENT). Effective assignment lookup by facility+workspace.
5. **Logs** — Validation logs with facility_id and service_name filters, limit 50.
6. **Dev** — Validate coding (system + code) and map codes (source system/code → target system).

**API**: All via `ziboClient` functions calling `supabase.functions.invoke('zibo-v1', ...)` edge function.

---

### Page: MSIKA Core Products & Tariff Registry

- **Route**: `/admin/msika-core`
- **Component**: `MsikaCoreAdmin` (`src/pages/admin/MsikaCoreAdmin.tsx`)
- **Header**: "MSIKA Core" + subtitle "Products & Services Registry"

#### 7 Tabs (grid-cols-7)
1. **Catalogs** — CRUD with lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED. Actions: Submit (DRAFT), Approve (REVIEW), Publish (APPROVED). Columns: ID, Name, Scope (NATIONAL/TENANT), Version, Status.
2. **Items** — Select catalog, then CRUD items. Item kinds: PRODUCT, SERVICE, ORDERABLE, CHARGEABLE, CAPABILITY_FACILITY, CAPABILITY_PROVIDER. Each has icon. Fields: Kind, Code, Name, Description, Tags.
3. **Search** — Full-text search with kind filter. Columns: Kind, Code, Name, Tags.
4. **Import** — CSV import with headers row. Shows job stats (total, invalid, deduped, pending_review).
5. **Mappings** — Pending external-to-internal mapping queue. Approve/Reject actions.
6. **Packs** — Benefit/formulary packs.
7. **Intents** — Procurement intents.

**API**: All via `msikaCoreCient` SDK calling `supabase.functions.invoke('msika-core-v1', ...)` edge function.

---

### Page: MUSHEX Payment Switch Console

- **Route**: `/admin/mushex`
- **Component**: `MushexAdmin` (`src/pages/admin/MushexAdmin.tsx`)
- **Header**: DollarSign icon + "MUSHEX v1.1 Console" (text-3xl) + subtitle "National Payment Switch & Claims Switching" + Step-Up Mode toggle button

#### Step-Up Mode
- Toggle button in header: "Disabled" (outline) / "✅ Enabled" (default)
- STEP_UP_REQUIRED errors show: "⚠️ STEP_UP_REQUIRED — Enable step-up mode and retry."

#### 6 Tabs (grid-cols-6)
1. **Payments** — Create Payment Intent (source type: COSTA_BILL/MSIKA_ORDER/ADHOC, amount in ZAR, adapter: SANDBOX/MOBILE_MONEY/BANK_TRANSFER/CARD) + Lookup Intent by ID.
2. **Remittance** — Issue Remittance Slip (by intent ID) + Claim Remittance (intent_id + token + OTP).
3. **Claims** — Create Claim (bill_id, hardcoded insurer/facility/totals/lines) + Lookup/Submit Claim.
4. **Settlements** — Run Settlement (period start/end date pickers) + Lookup/Release Settlement (step-up required for release).
5. **Ops/Fraud** — Load Pending Reviews + Load Fraud Flags buttons.
6. **Ledger** — Load Balances button.

#### Response Display
- JSON result shown in `<pre>` block (max-h-96 overflow-auto)
- Error Alert (destructive) with AlertTriangle icon

**API**: All via `mushexClient` calling `supabase.functions.invoke('mushex-v1', ...)` with TSHEPO-compliant headers (tenantId, actorId, actorType, facilityId, deviceFingerprint, purposeOfUse).

---

### Other Kernel Service Admin Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/tuso/facilities` | TusoFacilities | Facility registry management |
| `/admin/tuso/workspaces` | TusoWorkspaces | Workspace configuration |
| `/admin/tuso/start-shift` | TusoStartShift | Shift start workflow |
| `/admin/tuso/resources` | TusoResources | Physical resource management |
| `/admin/tuso/config` | TusoConfig | TUSO configuration |
| `/admin/tuso/control-tower` | TusoControlTower | Real-time facility operations |
| `/admin/varapi/providers` | VarapiProviders | Provider search & management |
| `/admin/varapi/privileges` | VarapiPrivileges | Privilege matrix management |
| `/admin/varapi/councils` | VarapiCouncils | Professional council integration |
| `/admin/varapi/tokens` | VarapiTokens | API token management |
| `/admin/varapi/portal` | VarapiPortal | Provider self-service portal |
| `/admin/suite/docs` | SuiteDocsConsole | Document management console |
| `/admin/suite/portal` | SuiteSelfService | Credential self-service portal |
| `/admin/pct/work` | PctWorkTab | PCT work management |
| `/admin/pct/control-tower` | PctControlTower | PCT control tower |
| `/admin/oros` | OrosAdmin | OROS Orders & Results service |
| `/admin/pharmacy` | PharmacyAdmin | Pharmacy service administration |
| `/admin/inventory` | InventoryAdmin | Inventory & supply chain service |
| `/admin/msika-flow` | MsikaFlowAdmin | MSIKA Flow Commerce & Fulfillment |
| `/admin/costa` | CostaAdmin | COSTA Costing Engine |
| `/admin/indawo` | IndawoAdmin | INDAWO Site & Premises Registry |
| `/admin/ubomi` | UbomiAdmin | UBOMI CRVS Interface (birth/death) |

---

## Public Health & Governance Planes

### Page: Public Health Operations

- **Route**: `/public-health`
- **Zone**: Public Health
- **Access**: Authenticated
- **Component**: `PublicHealthOps`
- **Query params**: `?tab=surveillance|outbreaks|inspections|campaigns`
- **Purpose**: Disease surveillance, outbreak management, inspections, campaigns

---

### Page: Coverage Operations

- **Route**: `/coverage`
- **Zone**: Coverage & Financing
- **Access**: Authenticated
- **Component**: `CoverageOperations`
- **Query params**: `?tab=eligibility|claims|settlement|schemes`
- **Purpose**: Eligibility checks, claims lifecycle, settlement, scheme administration

---

### Page: AI Governance

- **Route**: `/ai-governance`
- **Zone**: Intelligence & AI
- **Access**: Authenticated
- **Component**: `AIGovernance`
- **Query params**: `?tab=insights|models`
- **Purpose**: Model registry, drift monitoring, AI insight panels

---

### Page: Omnichannel Hub

- **Route**: `/omnichannel`
- **Zone**: Experience
- **Access**: Authenticated
- **Component**: `OmnichannelHub`
- **Query params**: `?tab=sms|ussd|ivr|callbacks|disclosure|ai-agent`
- **Purpose**: SMS journeys, USSD menus, IVR, callback queues, trust rules, AI agent

---

## Global Shell Components

### AppLayout (Standard pages)

```
┌────────────────────────────────────┐
│ AppSidebar │ AppHeader (h-12)      │
│ (w-48 or  │───────────────────────│
│  w-12     │                       │
│ collapsed)│  <main> children      │
│           │                       │
└────────────────────────────────────┘
```

- Sidebar: Collapsible (w-48 ↔ w-12), context-aware navigation
- Header: Home button, Back button, title, PatientSearch (center), FacilitySelector, ActiveWorkspaceIndicator, VoiceCommandButton, HandoffNotifications, Bell (3 notifications), User dropdown

### EHRLayout (Encounter pages only)

```
┌─────────────────────────────────────┐
│            TOP BAR (h-14)            │
├─────────────────────────────────────┤
│          PATIENT BANNER              │
├────────────────────┬────────────────┤
│   MAIN WORK AREA   │ ENCOUNTER MENU │
│                    │    (w-64)      │
└────────────────────┴────────────────┘
```

- No sidebar
- TopBar with clinical actions
- Patient Banner with demographics
- Encounter Menu with 8 clinical documentation sections
