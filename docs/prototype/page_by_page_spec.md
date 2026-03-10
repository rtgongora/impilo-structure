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

- Search bar with filter
- Tabs: "all" (default), others UNKNOWN/NOT OBSERVED
- Patient table from Supabase `patients` table
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

All kernel admin pages are wrapped in `<ProtectedRoute>`. The detailed content of each kernel admin surface is primarily composed of specialized components under `src/components/` subdirectories.

### TSHEPO Trust Layer (5 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/tshepo/consents` | TshepoConsentAdmin | Manage patient consents |
| `/admin/tshepo/audit` | TshepoAuditSearch | Search audit ledger entries |
| `/admin/tshepo/breakglass` | TshepoBreakGlass | Break-glass emergency access requests |
| `/admin/tshepo/access-history` | TshepoPatientAccessHistory | Patient data access history |
| `/admin/tshepo/offline` | TshepoOfflineStatus | Offline entitlement status & management |

### VITO Patient Registry (4 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/vito/patients` | VitoPatients | Master patient index search |
| `/admin/vito/merges` | VitoMergeQueue | Duplicate merge queue |
| `/admin/vito/events` | VitoEventsViewer | Client registry event log |
| `/admin/vito/audit` | VitoAuditViewer | VITO audit trail viewer |

### TUSO Facility Registry (6 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/tuso/facilities` | TusoFacilities | Facility registry management |
| `/admin/tuso/workspaces` | TusoWorkspaces | Workspace configuration |
| `/admin/tuso/start-shift` | TusoStartShift | Shift start workflow |
| `/admin/tuso/resources` | TusoResources | Physical resource management |
| `/admin/tuso/config` | TusoConfig | TUSO configuration |
| `/admin/tuso/control-tower` | TusoControlTower | Real-time facility operations |

### VARAPI Provider Registry (5 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/varapi/providers` | VarapiProviders | Provider search & management |
| `/admin/varapi/privileges` | VarapiPrivileges | Privilege matrix management |
| `/admin/varapi/councils` | VarapiCouncils | Professional council integration |
| `/admin/varapi/tokens` | VarapiTokens | API token management |
| `/admin/varapi/portal` | VarapiPortal | Provider self-service portal |

### BUTANO Shared Health Record (5 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/butano/timeline` | ButanoTimeline | FHIR longitudinal timeline |
| `/admin/butano/ips` | ButanoIPS | International Patient Summary |
| `/admin/butano/visit-summary` | ButanoVisitSummary | Visit summary viewer |
| `/admin/butano/reconciliation` | ButanoReconciliation | CPID reconciliation queue |
| `/admin/butano/stats` | ButanoStats | SHR statistics dashboard |

### Landela + Credentials Suite (2 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/suite/docs` | SuiteDocsConsole | Document management console |
| `/admin/suite/portal` | SuiteSelfService | Credential self-service portal |

### PCT Patient Care Tracker (2 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/pct/work` | PctWorkTab | PCT work management |
| `/admin/pct/control-tower` | PctControlTower | PCT control tower |

### Other Kernel Services (10 pages)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/zibo` | ZiboAdmin | ZIBO Terminology Service (ICD-11, SNOMED-CT, LOINC) |
| `/admin/oros` | OrosAdmin | OROS Orders & Results service |
| `/admin/pharmacy` | PharmacyAdmin | Pharmacy service administration |
| `/admin/inventory` | InventoryAdmin | Inventory & supply chain service |
| `/admin/msika-core` | MsikaCoreAdmin | MSIKA Core Products & Tariff Registry |
| `/admin/msika-flow` | MsikaFlowAdmin | MSIKA Flow Commerce & Fulfillment |
| `/admin/costa` | CostaAdmin | COSTA Costing Engine |
| `/admin/mushex` | MushexAdmin | MUSHEX Payment Switch & Claims |
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
