# Impilo EHR/HIE Platform
## Complete UI Flow & Page-by-Page Documentation

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Purpose**: Comprehensive documentation of user interface flows, page layouts, and component architecture

---

# TABLE OF CONTENTS

1. [User Authentication & Login Flow](#1-user-authentication--login-flow)
2. [Module Home Page & Three-Tab Navigation](#2-module-home-page--three-tab-navigation)
3. [Work Tab - Clinical & Operational Modules](#3-work-tab---clinical--operational-modules)
4. [My Professional Tab](#4-my-professional-tab)
5. [My Life Tab (Personal Hub)](#5-my-life-tab-personal-hub)
6. [Queue Management System](#6-queue-management-system)
7. [EHR Clinical Encounter Interface](#7-ehr-clinical-encounter-interface)
8. [Care Pathways & Workspaces](#8-care-pathways--workspaces)
9. [Profile & User Settings](#9-profile--user-settings)
10. [Key Routes Reference](#10-key-routes-reference)

---

# 1. USER AUTHENTICATION & LOGIN FLOW

## 1.1 Authentication Page (`/auth`)

The authentication page uses a **split-layout design** with branding on the left and login options on the right.

### Left Panel (Desktop Only)
- Impilo logo (inverted/white)
- "Digital Health Platform" headline
- Tagline: "Empowering healthcare providers with seamless, secure, and intelligent clinical solutions"
- Feature badges: Patient-Centered, Secure, Real-time
- Footer: "© 2025 Impilo Health"

### Right Panel - Login Method Selection

Four distinct login pathways are presented:

| Login Method | Target Users | Description | Icon |
|-------------|--------------|-------------|------|
| **Provider ID & Biometric** | Clinical staff | For registered healthcare workers with Provider ID | Fingerprint |
| **Patient Portal** | Patients/Clients | Access health records & appointments | UserCircle |
| **Staff Email Login** | Admin/System users | Email/password authentication | Mail |
| **System Maintenance** | Admins/DevTesters | Hidden by default, revealed via Ctrl+Shift+M or URL param `?mode=maintenance` | Wrench |

## 1.2 Provider ID & Biometric Flow (Clinical Staff)

**Step 1: Provider ID Lookup**
- User enters their Provider ID (format: `VARAPI-2025-ZW000001-A1B2`)
- System validates against Provider Registry (Varapi)
- Returns: Provider name, photo, specialty, affiliated facility

**Step 2: Biometric Verification**
- Options: Fingerprint, Facial Recognition, Iris Scan
- Mock/demo fallback for testing
- Returns: Verification confidence score

**Step 3: Workspace Selection**
- User selects Department, Physical Workspace (Ward/Unit), and Workstation
- Session context stored: facility, department, workspace, login time
- Redirects to Module Home (`/`)

## 1.3 Patient Portal Flow

- Login/Signup tabs for clients
- Successful auth redirects to `/portal`
- Does not require workspace selection

## 1.4 Email Login Flow

- Standard email/password authentication
- Used by admin and unregulated staff
- Redirects to Module Home on success

## 1.5 Above-Site Context (For Oversight Users)

- Users with above-site roles (district, provincial, national managers) see additional context selection
- Select jurisdiction scope: Province → District → Programme
- Redirects to Above-Site Dashboard (`/above-site`)

## 1.6 Post-Authentication Redirect Rules

| User Type | Destination |
|-----------|-------------|
| Clinical Provider | `/` (Module Home) |
| Patient/Client | `/portal` |
| Above-Site User | `/above-site` |
| Staff completing workspace selection | `/` |

---

# 2. MODULE HOME PAGE & THREE-TAB NAVIGATION

## 2.1 Module Home Structure (`/`)

The Module Home page features a **three-tab navigation model** that separates clinical work from professional management and personal health.

### Header Section
- User profile avatar with dropdown (Profile, Settings, Logout)
- Facility/workspace indicator
- Active shift status
- Quick action buttons

### Tab System

```
┌─────────────────────────────────────────────────────────────┐
│  [WORK]     [MY PROFESSIONAL]     [MY LIFE]                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tab content area (varies by selected tab)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Tab | Purpose | Access Gate |
|-----|---------|-------------|
| **WORK** | Shift-gated clinical & operational tasks | Active shift required |
| **MY PROFESSIONAL** | Practice management, credentials, CPD | Active license required |
| **MY LIFE** | Personal health records (PHR), social hub | Valid registration (UPID) |

---

# 3. WORK TAB - CLINICAL & OPERATIONAL MODULES

The Work tab displays module categories as expandable cards. Each category contains multiple module tiles.

## 3.1 Module Categories & Tiles

### Clinical Care
| Module | Description | Path | Role Restriction |
|--------|-------------|------|------------------|
| My Dashboard | Your worklist, tasks, and alerts | `/dashboard` | All |
| Communication | Messages, pages & calls | `/communication` | All |
| Patient Sorting | Front desk: arrival & triage | `/sorting` | All |
| Patient Encounters | Clinical documentation & care | `/encounter` | doctor, nurse, specialist, admin |
| Patient Queue | Waiting patients & triage | `/queue` | All |
| Bed Management | Ward status & admissions | `/beds` | doctor, nurse, admin (inpatient facilities) |
| Discharge & Exit | Discharges, deaths & exits | `/discharge` | doctor, nurse, admin |
| Control Tower | Real-time facility operations | `/operations?tab=control-tower` | admin, nurse, doctor |
| Operations & Roster | Shifts, roster & workforce | `/operations` | All |
| Shift Handoff | Care continuity reports | `/handoff` | doctor, nurse, admin (inpatient/emergency) |

### Consults & Referrals
| Module | Description | Path |
|--------|-------------|------|
| Telemedicine Hub | Full-circle teleconsultation workflow | `/telemedicine` |
| Referrals | Outgoing & incoming referrals | `/telemedicine?tab=referrals` |
| Consultations | Specialist consultations & reviews | `/telemedicine?tab=consults` |
| Case Reviews & Boards | M&M and specialist boards | `/telemedicine?tab=boards` |

### Orders & Diagnostics
| Module | Description | Path | Capability Required |
|--------|-------------|------|---------------------|
| Order Entry | Medications, labs, & imaging | `/orders` | - |
| ePrescriptions | Electronic prescriptions & formulary | `/pharmacy` | pharmacy |
| Pharmacy | Dispensing & medication tracking | `/pharmacy` | pharmacy, dispensing |
| Laboratory | Lab orders & results | `/lims` | laboratory, lims |
| Imaging (PACS) | Radiology & diagnostic imaging | `/pacs` | pacs, radiology |

### Scheduling & Registration
| Module | Description | Path |
|--------|-------------|------|
| Patient Sorting | Arrival, triage & queue assignment | `/sorting` |
| Appointments | Clinic & provider scheduling | `/appointments` |
| Appointment Scheduling | Advanced scheduling tools | `/scheduling` |
| Provider Noticeboard | Announcements & scheduling updates | `/scheduling/noticeboard` |
| Resource Calendar | Rooms, equipment & assets | `/scheduling/resources` |
| Patient Registration | New patient intake & ID | `/registration` |
| Patient Registry | Search & manage patients | `/patients` |
| Theatre Booking | Surgical scheduling | `/theatre` |
| Theatre Scheduling | Surgical suite calendar | `/scheduling/theatre` |

### Health Products & Marketplace
| Module | Description | Path |
|--------|-------------|------|
| Health Products Catalogue | Browse approved health products | `/catalogue` |
| Health Marketplace | Compare prices & order from vendors | `/marketplace` |
| Prescription Fulfillment | Bidding & vendor selection for Rx | `/fulfillment` |
| Vendor Portal | View requests & submit bids | `/vendor-portal` |

### Finance & Billing
| Module | Description | Path |
|--------|-------------|------|
| Payments | Patient billing & collections | `/payments` |
| Encounter Charges | Service & item charges | `/charges` |

### Inventory & Supply Chain
| Module | Description | Path |
|--------|-------------|------|
| Stock Management | Inventory & reordering | `/stock` |
| Consumables | Usage & administration | `/consumables` |

### Identity Services
| Module | Description | Path |
|--------|-------------|------|
| ID Services Hub | Generate, validate & recover IDs | `/id-services?tab=generate` |
| Patient PHID | Generate Patient Health IDs (MOSIP) | `/id-services?tab=generate` |
| Provider ID (Varapi) | Generate healthcare worker IDs | `/id-services?tab=generate` |
| Facility ID (Thuso) | Generate facility identifiers | `/id-services?tab=generate` |
| ID Recovery | Recover lost or forgotten IDs | `/id-services?tab=recovery` |
| ID Validation | Verify ID authenticity | `/id-services?tab=validate` |
| Batch Generation | Generate IDs in bulk | `/id-services?tab=batch` |

### HIE Registries
| Module | Description | Path |
|--------|-------------|------|
| Client Registry (MOSIP) | Master patient index & Health ID | `/client-registry` |
| Provider Registry (Varapi) | National HPR & IdP | `/hpr` |
| Facility Registry (Thuso) | GOFR health facilities | `/facility-registry` |
| Terminology Service | ICD-11, SNOMED-CT, LOINC codes | `/terminology` |
| Shared Health Record | FHIR-based patient records | `/shr` |
| National Data Repository | Aggregated facility reporting | `/ndr` |
| Product Registry | Health products catalogue | `/admin/product-registry` |
| FHIR Resources | HL7 FHIR interoperability viewer | `/admin` |

### Administration & Reports
| Module | Description | Path |
|--------|-------------|------|
| Above-Site Dashboard | District, provincial & national oversight | `/above-site` |
| Landela DMS | Document management & scanning | `/landela` |
| Reports & Analytics | Dashboards & insights | `/reports` |
| Custom Reports | Build custom reports & queries | `/reports` |
| Registry Management | Manage HIE registries | `/registry-management` |
| Odoo ERP | ERP integration | `/odoo` |
| System Admin | Users, security & settings | `/admin` |

### Clinical Tools
| Module | Description | Path |
|--------|-------------|------|
| Voice Dictation | Speech-to-text for notes | `/encounter` |
| Offline Sync | Conflict resolution & sync status | `/admin` |

### Help & Support
| Module | Description | Path |
|--------|-------------|------|
| Documentation | System guides & manuals | `/docs` |
| FAQs | Frequently asked questions | `/faqs` |
| Release Notes | What's new in this version | `/release-notes` |
| Support Ticket | Submit a support request | `/support` |

---

# 4. MY PROFESSIONAL TAB

The My Professional tab is a **role-adaptive command center** for professional practice management.

## 4.1 Sub-Tabs

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Priority alerts, at-a-glance stats, today's schedule |
| **Affiliations** | Multi-facility shift control, start/view facilities |
| **My Patients** | Global patient panel across all contexts |
| **Schedule** | Personal schedule, shifts, consults |
| **Credentials** | CPD tracker, licenses, certifications |

## 4.2 Dashboard Content

### Priority Attention Panel
- Critical results requiring sign-off
- Pending discharge summaries
- Missed callbacks and referrals

### At-a-Glance Stats (Clickable Cards)
| Stat | Description | Navigation |
|------|-------------|------------|
| Pending Results | Lab/imaging results awaiting review | `/lims` |
| Awaiting Signature | Documents needing sign-off | `/orders` |
| Referrals to Me | Incoming referral consults | `/telemedicine?tab=referrals` |
| Follow-ups Due | Scheduled patient follow-ups | `/appointments` |

### Today's Schedule
- Shift times and locations
- Virtual consult appointments
- Physical clinic sessions

### Professional Status
- License status (Active/Expired/Suspended)
- CPD points earned vs required
- Renewal timeline

### Integrations
- Landela DMS Notifications
- Professional Email Panel (MoHCC/Google/Outlook)

## 4.3 Affiliations Tab

Lists all facilities where the provider has privileges:
- Facility name and type
- Role designation (e.g., "PIC" for Practitioner-in-Charge)
- **Start Shift** button → triggers workplace selection and switches to Work tab
- **View Facility** button → navigates to operations dashboard

Also includes:
- **Virtual Practice** option for license-anchored telemedicine sessions
- **Request New Affiliation** action

## 4.4 My Patients Tab

- Searchable patient panel across all contexts
- Filter by: facility, status (active, due, critical, stable)
- Quick navigation to patient chart
- Shows: patient name, context, last seen, status badge

## 4.5 Credentials Tab

- License details with expiry tracking
- CPD cycle progress bar
- Course history and pending certifications
- Training compliance status

---

# 5. MY LIFE TAB (PERSONAL HUB)

The My Life tab functions as the **Patient Portal (PHR)** for the logged-in user—including clinical practitioners viewing their own health records.

## 5.1 Section Toggle

Two main sections:
- **My Health** (PHR modules)
- **Social Hub** (community features)

## 5.2 My Health Section - Sub-Tabs

| Tab | Component | Description |
|-----|-----------|-------------|
| **Home** | Dashboard | Quick actions, wallet balance, upcoming appointments |
| **Health ID** | HealthIdManager | QR code, Impilo ID management |
| **Appointments** | PortalAppointments | Upcoming & past appointments |
| **Timeline** | PortalHealthTimeline | Health record timeline/IPS |
| **Medications** | PortalMedications | Current & past prescriptions |
| **Wallet** | PortalWallet | Health wallet balance, transactions |
| **Privacy** | PortalConsentDashboard | Consent management |
| **Monitoring** | PortalRemoteMonitoring | Bluetooth device integration |
| **Messages** | PortalSecureMessaging | Secure provider messaging |
| **Marketplace** | PortalMarketplace | Health products shopping |
| **Wellness** | PortalWellness | Wellness goals & tracking |
| **Services** | ServiceDiscovery | Find nearby health services |
| **Queue** | PortalQueueStatus | Current queue position |
| **SOS** | EmergencySOS | Emergency contact & location |

## 5.3 Home Dashboard Contents

- **Welcome Card**: User avatar, name, Health ID
- **Quick Actions**: Book Visit, Video Call, Refill Rx, Messages
- **Health Wallet Card**: Balance, Add Funds button
- **Stats Cards**: Upcoming visits, pending refills, unread messages, communities
- **Social Hub Quick Access**: Links to timeline, communities, clubs

## 5.4 Social Hub Section

| Tab | Component | Description |
|-----|-----------|-------------|
| **Timeline** | TimelineFeed | Health-focused social feed |
| **Communities** | CommunitiesList | Support groups |
| **Clubs** | ClubsList | Wellness & fitness clubs |
| **Pages** | ProfessionalPages | Professional provider pages |
| **Fundraising** | CrowdfundingCampaigns | Health crowdfunding campaigns |

---

# 6. QUEUE MANAGEMENT SYSTEM

## 6.1 Queue Page Structure (`/queue`)

The Queue page features a **six-tab interface**:

| Tab | Component | Description |
|-----|-----------|-------------|
| **Workstation** | QueueWorkstation | Practitioner queue view |
| **Supervisor** | SupervisorDashboard | Multi-queue oversight |
| **Bookings** | BookingManager | Appointment booking |
| **Check-In** | SelfCheckInKiosk | Patient self-check-in |
| **Config** | QueueConfigManager | Queue configuration |
| **Pathways** | QueuePathwayEditor | Queue flow pathways |

## 6.2 Queue Workstation

### Layout
- **Left Panel (60%)**: Queue items by status
- **Right Panel (40%)**: Appointments panel (resizable)

### Queue Selector
- Dropdown to select active queue
- SLA target display
- Refresh and "Call Next" buttons

### Metrics Bar
- Total waiting, average wait time, SLA compliance, in-service count

### Queue Item Tabs

| Tab | Description |
|-----|-------------|
| **Waiting** | Patients waiting to be called |
| **Called** | Patients called but not yet in service |
| **In Service** | Patients currently being served |
| **Paused** | Service temporarily paused |

### Queue Item Actions

| Action | Trigger | Result |
|--------|---------|--------|
| **Call Next** | Button | Calls next priority patient |
| **Start Service** | On called patient | Creates encounter, navigates to chart |
| **Pause** | On in-service patient | Pauses service temporarily |
| **Resume** | On paused patient | Resumes service |
| **Complete** | On in-service patient | Marks service complete |
| **Transfer** | Any patient | Opens transfer dialog |
| **Escalate** | Waiting patient | Increases priority |
| **No Show** | Called patient | Marks as no-show |
| **Open Chart** | In-service patient | Opens patient encounter |

### Queue-to-Chart Automation

When **Start Service** is clicked:
1. System creates new encounter if none exists
2. Links encounter to queue item
3. Navigates to `/encounter/${encounterId}?source=queue&queueId=${queueId}`
4. Preserves queue context for return navigation

## 6.3 Appointments Panel

- Shows appointments linked to selected queue
- Filters: Today, Overdue, Upcoming
- Status indicators: Expected, Arrived, Attended, No-show
- Direct check-in action

---

# 7. EHR CLINICAL ENCOUNTER INTERFACE

## 7.1 Screen Layout Model

The EHR uses a **fixed, three-zone layout**:

```
┌─────────────────────────────────────────────────────────────┐
│                      TOP BAR (Action Layer)                  │
├─────────────────────────────────────────────┬───────────────┤
│                                             │               │
│          MAIN WORK AREA                     │  ENCOUNTER    │
│          (Focus Zone)                       │  MENU         │
│                                             │  (Right Nav)  │
│                                             │               │
└─────────────────────────────────────────────┴───────────────┘
```

## 7.2 Top Bar (Action & Status Layer)

### Left Zone
| Element | Description |
|---------|-------------|
| Back Button | Navigate to previous page |
| Home Button | Return to Module Home (`/`) |
| Impilo Logo | Brand identity |
| **Action Menu** | (Patient-gated) Queue, Beds, Pharmacy, Theatre, Payments, Handoff, Workspaces, Pathways, Consumables, Charges |

### Center Zone (Patient Context)
- **Chart Lock Badge**: "Chart Locked" with lock icon
- **Patient Name**: e.g., "Sarah M. Johnson"
- **Patient Details**: MRN • Ward • Bed
- **Allergy Alert Badge**: If allergies present
- **Close Chart Button**: Opens confirmation dialog

### Right Zone
| Element | Description |
|---------|-------------|
| Patient Search | (Patient-gated) Search patients |
| Workspace Indicator | Shows active workspace |
| AI Diagnostic Assistant | AI-powered clinical support |
| Alert Badge | Clinical alerts count |
| CDS Alert Badge | Clinical decision support alerts |
| Critical Event Button | Activate emergency protocols |
| User Menu | Profile, settings, logout |

### Top Bar Actions Menu

Clicking any action opens a **TopBarPanel** overlay:

| Action | Panel Content |
|--------|---------------|
| **Queue** | QueueManagement component |
| **Beds** | BedManagement component |
| **Pharmacy** | MedicationDispensing component |
| **Theatre Booking** | TheatreBookingSystem component |
| **Payments** | PaymentGateway component |
| **Shift Handoff** | ShiftHandoffReport component |
| **Workspaces** | Physical workspace selector (facility-filtered) |
| **Care Pathways** | Clinical pathway selector (facility-filtered) |
| **Consumables** | Encounter consumables tracker |
| **Charges** | Auto-generated encounter charges |

## 7.3 Encounter Menu (Right Navigation)

The right sidebar contains the **fixed 8-item Encounter Record** navigation:

| Menu Item | ID | Description | Icon |
|-----------|-----|-------------|------|
| Overview | `overview` | Patient summary and status | LayoutDashboard |
| Assessment | `assessment` | Clinical assessments | ClipboardCheck |
| Problems & Diagnoses | `problems` | Active problems and diagnoses | Stethoscope |
| Orders & Results | `orders` | Lab orders and results | FileText |
| Care & Management | `care` | Care plans and management | Heart |
| Consults & Referrals | `consults` | Specialist consultations | Users |
| Notes & Attachments | `notes` | Clinical notes and documents | FileEdit |
| Visit Outcome | `outcome` | Encounter disposition | CheckCircle |

**Additional Features**:
- **Patient File Button**: Opens longitudinal patient record
- **Last Saved Indicator**: Shows auto-save status
- **Active Status Indicator**: Green dot when encounter is active

### Encounter Menu Behavior
- Menu is **de-emphasized** (opacity 50%, disabled) during:
  - Active critical events
  - Active workspace overlays (except patient file)
- Clicking an item loads corresponding section in Main Work Area

## 7.4 Main Work Area

The Main Work Area displays **one view at a time** based on priority:

| Priority | Condition | View Displayed |
|----------|-----------|----------------|
| 1 | Critical event active | CriticalEventWorkspace |
| 2 | Workspace active | WorkspaceView |
| 3 | Top bar action selected | TopBarPanel |
| 4 | Default | EncounterSection (based on active menu item) |

### Encounter Section Content (Per Menu Item)

| Menu Item | Content Displayed |
|-----------|-------------------|
| **Overview** | Patient summary, vitals snapshot, active problems, allergies, current medications |
| **Assessment** | Vital signs entry, SOAP notes, clinical assessments, physical exam |
| **Problems & Diagnoses** | Problem list, ICD-11 coding, diagnosis entry, problem status |
| **Orders & Results** | Lab orders, imaging orders, medication orders, results review |
| **Care & Management** | Care plans, nursing interventions, clinical pathways, goals |
| **Consults & Referrals** | Referral builder, consultation requests, specialist reviews |
| **Notes & Attachments** | Progress notes, procedure notes, document attachments |
| **Visit Outcome** | Discharge disposition, follow-up scheduling, encounter summary |

## 7.5 Chart Access Security

When navigating to an encounter, access is governed by:

| Source | Access Justification Required? |
|--------|-------------------------------|
| `queue` | No (pre-authorized) |
| `appointment` | No (pre-authorized) |
| `worklist` | No (pre-authorized) |
| `search` | Yes |
| `emergency` | Yes |
| No source | Yes |

If justification required, user must select access reason:
- Treatment
- Payment/Operations
- Healthcare Operations
- Emergency Access (Break-the-Glass)
- Research (with notes)

All chart access is **logged for HIPAA compliance**.

---

# 8. CARE PATHWAYS & WORKSPACES

## 8.1 Physical Workspaces

Physical workspaces are **actual locations** where clinical work takes place. They are filtered by facility capabilities and level of care.

### Categories

| Category | Examples | Display |
|----------|----------|---------|
| **High Acuity** | ICU, CCU, HDU, NICU, Burn Unit | Red border, destructive styling |
| **Specialty** | Dialysis, Oncology Day, Cath Lab | Primary styling |
| **General** | Emergency Bay, Consultation Room, Procedure Room | Muted styling |

### Facility Capability Gating

Workspaces only appear if the facility has the required capability:
- ICU → requires `intensive_care` capability
- Theatre → requires `theatre` capability
- Dialysis → requires `dialysis` capability

## 8.2 Care Pathways

Care pathways are **clinical workflows** that overlay the encounter. They are also facility-filtered.

### Pathway Categories

| Category | Type | Behavior |
|----------|------|----------|
| **Emergency Protocols** | Critical Events | Takes over entire screen, activates emergency mode |
| **Treatment Workflows** | Procedural | Opens as overlay with specific steps |
| **Procedure Workflows** | Procedural | Opens as overlay with procedure steps |
| **Longitudinal Programmes** | Long-term | Reshapes encounter forms for programme-specific data |

### Emergency Protocols (Examples)

| Protocol | Description | Team Required |
|----------|-------------|---------------|
| Code Blue | Cardiac/respiratory arrest | Crash team |
| Rapid Response | Early warning deterioration | Response team |
| Trauma Activation | Major trauma | Trauma team |
| Neonatal Resuscitation | Newborn emergency | Neonatal team |
| Obstetric Emergency | Maternal emergency | OB emergency team |
| Stroke Code | Acute stroke | Stroke team |
| STEMI Code | Acute MI | Cardiac cath team |

### Treatment/Procedure Workflows (Examples)

| Workflow | Description | Duration |
|----------|-------------|----------|
| Blood Transfusion | Transfusion protocol | ~2-4 hours |
| Chemotherapy Administration | Chemo protocol | ~4-6 hours |
| ECT Protocol | Electroconvulsive therapy | ~30 min |
| Wound Care Pathway | Complex wound management | ~30-60 min |
| Minor Procedures | Minor surgical procedures | ~15-30 min |

### Longitudinal Programmes (Examples)

| Programme | Description |
|-----------|-------------|
| ANC (Antenatal Care) | Pregnancy follow-up |
| PNC (Postnatal Care) | Post-delivery care |
| ART (HIV Treatment) | Antiretroviral therapy |
| TB Treatment | Tuberculosis DOTS |
| DMCH (Diabetes/HTN) | Chronic disease management |
| Childhood Immunization | EPI programme |
| Mental Health | Psychiatric follow-up |

## 8.3 Critical Event Mode

When a critical event is activated:
1. Entire screen border turns red (4px ring)
2. `.critical-mode` CSS class applied
3. Encounter menu is de-emphasized (non-interactive)
4. CriticalEventWorkspace takes over main area
5. Timer starts
6. Team roles displayed
7. Protocol steps shown
8. Event must be terminated with outcome:
   - Stabilised
   - Admitted
   - Transferred
   - Escalated
   - Death

---

# 9. PROFILE & USER SETTINGS

## 9.1 Accessing Profile

Profile can be accessed via:
- **Header Dropdown Menu**: Click avatar → "Profile" or "Settings"
- **My Professional Tab**: Dashboard links to profile components
- **Direct Route**: `/profile`

## 9.2 Profile Tabs

| Tab | Content |
|-----|---------|
| **Identity** | Name, Provider ID, Health ID, photo |
| **Account** | Email, phone, notification preferences |
| **Security** | Password change, 2FA, active sessions |

## 9.3 Profile Components

The profile uses `useProfileRegistry` hook to integrate data from:
- Client Registry (for patient identity)
- Provider Registry (for clinical identity)
- Local profiles table (for app-specific settings)

---

# 10. KEY ROUTES REFERENCE

## 10.1 Authentication & Home
| Route | Page | Description |
|-------|------|-------------|
| `/` | ModuleHome | Three-tab home page |
| `/auth` | Auth | Login/authentication |
| `/portal` | Portal | Patient portal (clients) |
| `/above-site` | AboveSite | Oversight dashboard |

## 10.2 Clinical
| Route | Page | Description |
|-------|------|-------------|
| `/encounter/:encounterId` | EHRLayout | Clinical encounter |
| `/queue` | Queue | Queue management |
| `/beds` | Beds | Bed management |
| `/pharmacy` | Pharmacy | Medication dispensing |
| `/handoff` | Handoff | Shift handoff reports |
| `/sorting` | Sorting | Patient triage |
| `/discharge` | Discharge | Discharge management |

## 10.3 Scheduling
| Route | Page | Description |
|-------|------|-------------|
| `/appointments` | Appointments | Clinic scheduling |
| `/scheduling` | Scheduling | Advanced scheduling |
| `/scheduling/theatre` | TheatreScheduling | Surgical scheduling |
| `/scheduling/resources` | Resources | Resource calendar |
| `/scheduling/noticeboard` | Noticeboard | Provider schedules |
| `/theatre` | Theatre | Theatre booking |
| `/registration` | Registration | Patient intake |
| `/patients` | Patients | Patient registry |

## 10.4 Orders & Diagnostics
| Route | Page | Description |
|-------|------|-------------|
| `/orders` | Orders | Order entry |
| `/lims` | LIMS | Laboratory |
| `/pacs` | PACS | Imaging/radiology |

## 10.5 Finance & Inventory
| Route | Page | Description |
|-------|------|-------------|
| `/payments` | Payments | Billing & collections |
| `/charges` | Charges | Encounter charges |
| `/stock` | Stock | Inventory management |
| `/consumables` | Consumables | Consumables tracking |

## 10.6 Telemedicine & Communication
| Route | Page | Description |
|-------|------|-------------|
| `/telemedicine` | Telemedicine | Virtual care hub |
| `/telemedicine?tab=referrals` | Referrals | Referral management |
| `/telemedicine?tab=consults` | Consults | Consultations |
| `/telemedicine?tab=boards` | Boards | Case reviews |
| `/communication` | Communication | Messages, pages, calls |

## 10.7 Operations & Admin
| Route | Page | Description |
|-------|------|-------------|
| `/operations` | Operations | Facility operations |
| `/operations?tab=control-tower` | ControlTower | Real-time ops |
| `/dashboard` | Dashboard | Provider dashboard |
| `/reports` | Reports | Analytics |
| `/admin` | Admin | System administration |
| `/landela` | Landela | Document management |

## 10.8 Identity & Registries
| Route | Page | Description |
|-------|------|-------------|
| `/id-services` | IDServices | ID generation hub |
| `/client-registry` | ClientRegistry | MOSIP integration |
| `/hpr` | HPR | Provider registry (Varapi) |
| `/facility-registry` | FacilityRegistry | GOFR (Thuso) |
| `/shr` | SHR | Shared health record |
| `/ndr` | NDR | National data repository |
| `/terminology` | Terminology | Code systems |

## 10.9 Marketplace
| Route | Page | Description |
|-------|------|-------------|
| `/catalogue` | Catalogue | Health products |
| `/marketplace` | Marketplace | Vendor marketplace |
| `/fulfillment` | Fulfillment | Prescription fulfillment |
| `/vendor-portal` | VendorPortal | Vendor interface |

---

# APPENDIX A: FACILITY CAPABILITY MATRIX

The platform implements **facility-type sensitivity** that filters available modules, workspaces, and pathways based on:

1. **Level of Care**: Primary, Secondary, Tertiary, Quaternary
2. **Facility Capabilities**: Array of enabled features from `service_catalog`

### Example Capability Gating

| Capability | Enables |
|------------|---------|
| `inpatient` | Bed Management, Shift Handoff |
| `emergency_24hr` | 24hr Emergency modules |
| `theatre` | Theatre Booking, Surgical Scheduling |
| `pharmacy` | Full pharmacy module |
| `pharmacy_basic` | Basic dispensing |
| `laboratory` | LIMS module |
| `pacs` | Imaging/PACS module |
| `intensive_care` | ICU workspace |
| `dialysis` | Dialysis workspace |

---

# APPENDIX B: KEY TYPE DEFINITIONS

## Encounter Menu Items
```typescript
type EncounterMenuItem =
  | "overview"
  | "assessment"
  | "problems"
  | "orders"
  | "care"
  | "consults"
  | "notes"
  | "outcome";
```

## Top Bar Actions
```typescript
type TopBarAction = 
  | "workspaces" 
  | "pathways" 
  | "consumables" 
  | "charges" 
  | "queue" 
  | "beds" 
  | "handoff" 
  | "pharmacy"
  | "theatre"
  | "payments";
```

## Patient Context
```typescript
interface PatientContext {
  isActive: boolean;
  encounterId: string | null;
  patientId: string | null;
  patientName: string | null;
  mrn: string | null;
  accessRequest: ChartAccessRequest | null;
  lockedAt: Date | null;
  source: PatientContextSource;
}
```

---

*Document generated from reverse-engineering the Impilo EHR codebase*
