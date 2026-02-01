# Impilo EHR Complete Journey Documentation

> **Complete technical specification of the Electronic Health Record system from entry to discharge**

---

## Table of Contents

1. [Entry Points](#1-entry-points)
2. [Provider Dashboard (No Patient Selected)](#2-provider-dashboard-no-patient-selected)
3. [Chart Access & Patient Context](#3-chart-access--patient-context)
4. [EHR Layout Architecture](#4-ehr-layout-architecture)
5. [Top Bar (Action Layer)](#5-top-bar-action-layer)
6. [Patient Banner](#6-patient-banner)
7. [Encounter Menu (Right Nav)](#7-encounter-menu-right-nav)
8. [Main Work Area](#8-main-work-area)
9. [Clinical Sections In Detail](#9-clinical-sections-in-detail)
10. [Top Bar Panels](#10-top-bar-panels)
11. [Workspaces & Critical Events](#11-workspaces--critical-events)
12. [Context & State Management](#12-context--state-management)

---

## 1. Entry Points

### How Users Reach the EHR

There are multiple pathways to access a patient's clinical record:

| Entry Point | Route | Source Parameter | Access Justification |
|-------------|-------|------------------|---------------------|
| **Queue Workstation** | `/encounter/:encounterId?source=queue` | `queue` | Pre-authorized (assigned patient) |
| **Appointments** | `/encounter/:encounterId?source=appointment` | `appointment` | Pre-authorized (scheduled visit) |
| **Worklist** | `/encounter/:encounterId?source=worklist` | `worklist` | Pre-authorized (assigned task) |
| **Patient Search** | `/encounter/:encounterId?source=search` | `search` | Requires justification |
| **Emergency Access** | `/encounter/:encounterId?source=emergency` | `emergency` | Break-glass access with audit |
| **Module Home EHR Tile** | `/encounter` (no ID) | `none` | Shows Provider Dashboard |

### Pre-Authorization Logic

```typescript
// Pre-authorized sources automatically load the chart
const isPreAuthorized = source === "queue" || source === "appointment" || source === "worklist";

// Other sources require access justification dialog
const requiresAccessJustification = source === "search" || source === "emergency" || !source;
```

---

## 2. Provider Dashboard (No Patient Selected)

**Component**: `NoPatientSelected.tsx`  
**Route**: `/encounter` (without encounter ID)

When no patient is selected, the EHR displays the **Provider Dashboard** — a clinical command center for the provider's shift.

### Dashboard Header
```
┌─────────────────────────────────────────────────────────────────┐
│ [Impilo Logo]  Clinical Workspace     [On Shift Badge]  [Home] │
└─────────────────────────────────────────────────────────────────┘
```

### Shift Status Alert
- If **not on shift**: Destructive alert with "Start Shift" button linking to `/operations`
- If **on shift**: Shows facility name, workspace, and shift start time

### Quick Stats Cards (6 Metrics)

| Stat | Color | Description |
|------|-------|-------------|
| **Seen Today** | Primary | Patients seen this shift |
| **Tasks** | Warning | Pending clinical tasks |
| **Alerts** | Destructive | Active clinical alerts |
| **Results** | Info | Lab/imaging results ready |
| **Stock** | Orange | Stock alerts (critical/low) |
| **Approvals** | Purple | Pending approval requests |

### Main Tabbed Worklist

The dashboard provides **7 tabs** for organizing clinical work:

#### Tab 1: Queues
- Lists provider's assigned queues
- Shows waiting count and average wait time per queue
- **Actions**: "Call Next" button per queue
- Clicking a queue navigates to `/queue?action=call&queue={queueId}`

#### Tab 2: Results
- Lab and imaging results requiring review
- Columns: Test name, patient, status, abnormal flag, time received
- Icons distinguish result types (lab flask, imaging, pathology/microscope)
- Abnormal results highlighted in red

#### Tab 3: Tasks
- Pending clinical tasks assigned to provider
- Task types: Lab review, prescription renewal, discharge summary, consult response
- Priority badges: routine, urgent, stat
- Due time with relative formatting

#### Tab 4: Alerts
- Critical clinical alerts requiring attention
- Types: Critical lab values, medication due, deteriorating patient
- Severity color coding (critical=red, medication=warning, escalation=orange)
- Time since alert triggered

#### Tab 5: Referrals
- Incoming and outgoing referrals
- Direction badges: Incoming, Response, Outgoing
- Specialty, patient, referring clinician, status
- Urgent referrals highlighted

#### Tab 6: Stock
- Stock alerts for critical supplies
- Levels: Critical, Warning, Out of Stock
- Item name, current quantity, reorder point
- Expiring items flagged with expiry date

#### Tab 7: Handoff
- Shift handoff items from previous shift
- Patient, ward, priority, handoff notes
- High priority items highlighted
- From clinician attribution

---

## 3. Chart Access & Patient Context

**Component**: `EHRContext.tsx`, `ChartAccessDialog.tsx`

### Patient Context Object

```typescript
interface PatientContext {
  isActive: boolean;           // True when chart is open
  encounterId: string | null;  // Current encounter ID
  patientId: string | null;    // Patient ID
  patientName: string | null;  // Display name
  mrn: string | null;          // Medical record number
  accessRequest: ChartAccessRequest | null;  // Audit trail
  lockedAt: Date | null;       // When chart was locked
  source: PatientContextSource; // How chart was accessed
}
```

### Access Request Audit

```typescript
interface ChartAccessRequest {
  reason: ChartAccessReason;     // "treatment" | "queue_assignment" | etc.
  encounterId: string;
  patientId: string;
  accessedAt: Date;
  accessedBy: string;            // Provider ID
  justificationNotes?: string;   // Free-text for break-glass
}
```

### Chart Access Flow

```
1. User navigates to /encounter/:id
2. Check source parameter
3. If pre-authorized (queue/appointment/worklist):
   └─ Auto-load encounter via loadEncounter()
4. If requires justification:
   └─ Show ChartAccessDialog
   └─ User selects reason + optional justification
   └─ On submit → loadEncounter() with access reason
5. Log chart access to audit_logs table
6. Set patient context → EHR Layout renders
```

### HIPAA-Compliant Audit Logging

Every chart access and close is logged:

```typescript
// Chart access log
await supabase.from("audit_logs").insert({
  entity_type: "patient_chart",
  entity_id: encounterId,
  action: "chart_access",
  performed_by: userId,
  metadata: {
    patient_id, access_reason, justification, source
  },
});

// Chart close log (includes duration)
await supabase.from("audit_logs").insert({
  entity_type: "patient_chart",
  action: "chart_closed",
  metadata: {
    duration_seconds: Math.floor((Date.now() - lockedAt) / 1000)
  },
});
```

---

## 4. EHR Layout Architecture

**Component**: `EHRLayout.tsx`

The EHR uses a **fixed three-zone layout** that never changes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TOP BAR (Action Layer)                        │
│  [←] [⌂] [Logo] | [Queue] [Beds] [Pharmacy] ...  | [Search] [AI] [User]│
├─────────────────────────────────────────────────────────────────────────┤
│                          PATIENT BANNER                                 │
│  [Avatar] Name • MRN • DOB • Age • Gender | [Allergies] [Alerts]       │
├────────────────────────────────────────────────────────┬────────────────┤
│                                                        │                │
│                   MAIN WORK AREA                       │  ENCOUNTER     │
│                                                        │    MENU        │
│   (Displays one thing at a time:                       │                │
│    - Clinical Section                                  │  [Overview]    │
│    - Workspace                                         │  [Assessment]  │
│    - Critical Event                                    │  [Problems]    │
│    - Top Bar Panel)                                    │  [Orders]      │
│                                                        │  [Care]        │
│                                                        │  [Consults]    │
│                                                        │  [Notes]       │
│                                                        │  [Outcome]     │
│                                                        │                │
└────────────────────────────────────────────────────────┴────────────────┘
```

### Critical Event Mode

When a critical event is active, the entire layout gets a visual indicator:

```tsx
<div className={cn(
  "h-screen flex flex-col overflow-hidden",
  isCriticalEventActive && "ring-4 ring-critical ring-inset critical-mode"
)}>
```

---

## 5. Top Bar (Action Layer)

**Component**: `TopBar.tsx`

The Top Bar provides global navigation and operational actions.

### Left Section: Navigation & Actions

| Element | Function |
|---------|----------|
| **Back Arrow** | Navigate to previous page (`navigate(-1)`) |
| **Home Icon** | Navigate to Module Home (`/`) |
| **Impilo Logo** | Branding |
| **Top Bar Actions** | Functional modules (shown only when patient active) |
| **Register** | Link to patient registration (`/registration`) |

### Top Bar Actions (10 Items)

```typescript
const TOP_BAR_ACTIONS = [
  { id: "queue", label: "Queue", icon: "Users" },
  { id: "beds", label: "Beds", icon: "Bed" },
  { id: "pharmacy", label: "Pharmacy", icon: "Pill" },
  { id: "theatre", label: "Theatre Booking", icon: "Calendar" },
  { id: "payments", label: "Payments", icon: "CreditCard" },
  { id: "handoff", label: "Shift Handoff", icon: "ClipboardCheck" },
  { id: "workspaces", label: "Workspaces", icon: "Boxes" },
  { id: "pathways", label: "Care Pathways", icon: "Route" },
  { id: "consumables", label: "Consumables", icon: "Package" },
  { id: "charges", label: "Charges", icon: "Receipt" },
];
```

Clicking a Top Bar Action opens the corresponding panel in the Main Work Area.

### Center Section: Patient Context

When a patient is active:
- **Chart Locked Badge**: Green badge indicating secure context
- **Patient Name**: Displayed prominently
- **Context Details**: MRN • Ward • Bed
- **Allergies Badge**: Warning badge if allergies present
- **Close Chart Button**: Triggers confirmation dialog

### Right Section: Clinical Tools

| Element | Function |
|---------|----------|
| **Patient Search** | Quick search within current context |
| **Active Workspace Indicator** | Shows current workspace status |
| **AI Diagnostic Assistant** | Opens AI clinical support |
| **Clinical Alerts Badge** | Alert count and quick access |
| **CDS Alert Badge** | Clinical Decision Support alerts |
| **Critical Event Button** | Activate Code Blue, Trauma, etc. |
| **User Menu** | Profile, settings, logout |

---

## 6. Patient Banner

**Component**: `PatientBanner.tsx`

Displays patient demographics and critical clinical information:

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Avatar] Sarah M. Johnson                                           │
│          MRN-2024-001847 • 15 Mar 1985 (38y) • Female               │
│                                                                     │
│ [🔴 Penicillin] [🔴 Sulfa drugs]     Ward 4A • Bed 12    Day 3 LOS │
│                                                                     │
│ [⚠️ Fall Risk] [⚠️ Isolation]        Attending: Dr. James Mwangi   │
└─────────────────────────────────────────────────────────────────────┘
```

### Banner Elements

- **Avatar**: Patient photo or gender-based placeholder
- **Name**: Full name prominently displayed
- **Identifiers**: MRN, DOB with age, gender
- **Allergies**: Red badges for each allergy
- **Location**: Ward and bed assignment
- **LOS**: Length of stay in days
- **Alerts**: Clinical flags (fall risk, isolation, etc.)
- **Attending**: Current attending physician

---

## 7. Encounter Menu (Right Nav)

**Component**: `EncounterMenu.tsx`

The Encounter Menu contains **exactly 8 fixed, non-extensible items** representing clinical record sections:

```typescript
const ENCOUNTER_MENU_ITEMS = [
  { id: "overview", label: "Overview", description: "Patient summary and status" },
  { id: "assessment", label: "Assessment", description: "Clinical assessments" },
  { id: "problems", label: "Problems & Diagnoses", description: "Active problems and diagnoses" },
  { id: "orders", label: "Orders & Results", description: "Lab orders and results" },
  { id: "care", label: "Care & Management", description: "Care plans and management" },
  { id: "consults", label: "Consults & Referrals", description: "Specialist consultations" },
  { id: "notes", label: "Notes & Attachments", description: "Clinical notes and documents" },
  { id: "outcome", label: "Visit Outcome", description: "Encounter disposition" },
];
```

### Menu Behavior

- Clicking a menu item sets `activeMenuItem` in EHRContext
- Active item is visually highlighted
- Description tooltip on hover
- Menu is always visible (no collapse)

---

## 8. Main Work Area

**Component**: `MainWorkArea.tsx`

The Main Work Area displays **one thing at a time** with animated transitions. Priority order:

```typescript
// Priority 1: Critical Event (highest)
if (activeCriticalEvent && activeCriticalEvent.status === "active") {
  return <CriticalEventWorkspace event={activeCriticalEvent} />;
}

// Priority 2: Active Workspace
if (activeWorkspace) {
  return <WorkspaceView workspace={activeWorkspace} />;
}

// Priority 3: Top Bar Panel
if (activeTopBarAction) {
  return <TopBarPanel action={activeTopBarAction} />;
}

// Default: Encounter Section
return <EncounterSection />;
```

### Animation Transitions

- **Critical Event**: Scale animation (pulse effect)
- **Workspace**: Slide from left
- **Top Bar Panel**: Slide from top
- **Encounter Section**: Fade

---

## 9. Clinical Sections In Detail

### 9.1 Overview Section

**Component**: `OverviewSection.tsx`

The patient's "at a glance" summary.

#### Content Panels

1. **Patient Banner Card**
   - Full demographics with avatar
   - Primary diagnosis with ICD code
   - Encounter type badge (Inpatient/Outpatient/Emergency)
   - Ward/Bed assignment
   - Length of stay

2. **Clinical Alerts Panel**
   - Critical alerts (red background)
   - Warning alerts (yellow background)
   - Info alerts (muted background)

3. **Allergies Alert**
   - Verified allergies with severity
   - Live database integration via `usePatientAllergies` hook

4. **Live Vitals Monitor**
   - Real-time vital signs with trend arrows
   - Heart rate, BP, SpO2, Temperature, Respiratory Rate
   - Abnormal values highlighted

5. **Active Episodes & Pathways**
   - Active care episodes (e.g., "Diabetes Management")
   - Care pathway progress bars
   - Next visit dates

6. **Pending Tasks**
   - Prioritized task list
   - Priority badges (routine, urgent, stat)
   - Due times with relative formatting

7. **Encounter Details**
   - Admission date/time
   - Attending physician
   - Location
   - Recent activity timeline

---

### 9.2 Assessment Section

**Component**: `AssessmentSection.tsx`

Comprehensive clinical assessment tools.

#### Tabs (7 Sub-Sections)

| Tab | Description | Key Features |
|-----|-------------|--------------|
| **Triage** | Initial triage assessment | Category banner (Red/Orange/Yellow/Green), Chief complaint, Danger signs screening, Arrival mode |
| **Record Vitals** | Live vitals entry | VitalsRecorder component with validation |
| **History** | Clinical history | HPI, PMH, PSH, Obs/Gyn, Drug history, Allergies, Social history |
| **Examination** | Physical exam | System-by-system examination forms (General, CVS, Resp, Abdo, Neuro) |
| **Investigations** | Lab results review | LabResultsSystem component with trending |
| **Clerking** | Clinical documentation | Template-based clerking forms adapted to cadre level |
| **Timeline** | Patient timeline | PatientTimeline component showing all events |

#### Triage Categories

```typescript
const triageColors = {
  red: { label: "Immediate", description: "Life-threatening" },
  orange: { label: "Very Urgent", description: "Serious condition" },
  yellow: { label: "Urgent", description: "Needs attention" },
  green: { label: "Standard", description: "Non-urgent" },
};
```

---

### 9.3 Problems & Diagnoses Section

**Component**: `ProblemsSection.tsx`

Manage patient's problem list and diagnoses.

#### Tabs (3 Sub-Sections)

| Tab | Description |
|-----|-------------|
| **Problem List** | Active problems with SNOMED-CT coding |
| **Diagnoses** | Working and confirmed diagnoses with ICD codes |
| **Differentials** | Differential diagnosis tracking with likelihood |

#### Problem List Features

- **Search & Filter**: By name and status
- **Status Types**: Active, Resolved, Recurrence, In Remission
- **Summary Cards**: Count per status type
- **Add Problem Dialog**: Name, SNOMED code, onset date, status, comments
- **Bulk Actions**: Link multiple problems to diagnosis
- **Inline Status Change**: Dropdown to update status

#### Diagnosis Features

- **Certainty Levels**: Suspected → Provisional → Confirmed
- **ICD-10 Coding**: Searchable code lookup
- **Primary vs Secondary**: Designation badges
- **Link to Problems**: Associate problems with diagnoses
- **Clinical Reasoning**: Free-text reasoning field

#### Differential Diagnosis

- **Likelihood Ranking**: High, Moderate, Low
- **Rule Out Tracking**: Mark differentials as ruled out with reason
- **Promote to Diagnosis**: Convert differential to working diagnosis

---

### 9.4 Orders & Results Section

**Component**: `OrdersSection.tsx`

Complete order management and results review.

#### Tabs (7 Sub-Sections)

| Tab | Description |
|-----|-------------|
| **Orders** | Active orders list with status |
| **Results** | Completed results awaiting review |
| **Results Review** | Formal results acknowledgment workflow |
| **Medications** | Medication orders (links to pharmacy) |
| **Order Entry** | New order creation wizard |
| **Order Sets** | Pre-defined order bundles |
| **Imaging** | Radiology orders and reports |

#### Order Types

- **Laboratory**: Test panels, specimen types
- **Imaging**: Modality, body part, contrast
- **Procedure**: Surgical/bedside procedures
- **Medication**: Prescription orders

#### Order Status Flow

```
Draft → Pending → In Progress → Completed
                      ↓
                  Cancelled
```

#### Results Panel

- **Abnormal Flagging**: Red highlight for abnormal values
- **Trending**: Historical graph for repeated tests
- **Critical Values**: Immediate notification
- **Acknowledge Workflow**: Require sign-off on results

---

### 9.5 Care & Management Section

**Component**: `CareSection.tsx`

Nursing care and management workflows.

#### Tabs (Inpatient-Specific + General)

| Tab | Inpatient Only | Description |
|-----|----------------|-------------|
| **Medication Administration** | ✓ | MAR with scheduled doses |
| **Med Reconciliation** | ✓ | Admission/discharge med review |
| **Fluid Balance** | ✓ | I/O tracking and net balance |
| **Nursing Tasks** | ✓ | Task list with completion tracking |
| **Nursing Care Plan** | | Goals and interventions |
| **Goals & Interventions** | | Detailed care planning |

#### Medication Administration Record (MAR)

- 24-hour grid view of scheduled medications
- Administration status: Given, Held, Refused, Missed
- PRN medications with administration history
- IV infusions with rate tracking

#### Fluid Balance

- **Intake Tracking**: Oral, IV, Other
- **Output Tracking**: Urine, Stool, Vomitus, Drains
- **Net Balance Calculation**: Color-coded positive/negative
- **Hourly/Daily Totals**: Summary cards

#### Nursing Tasks

- Task types: Vitals, wound care, feeding, positioning
- Status: Pending, Completed, Missed, Deferred
- Due time tracking
- Completion with signature

---

### 9.6 Consults & Referrals Section

**Component**: `ConsultsSection.tsx`

Telemedicine, consultations, and referrals.

#### Views

| View | Description |
|------|-------------|
| **Dashboard** | Consults overview for current patient |
| **Consultations Tab** | In-house specialty consults |
| **Referrals Tab** | External referral management |
| **Teleconsults Tab** | Virtual consultation sessions |
| **Telemedicine Hub** | Full 7-stage telemedicine workflow |

#### Referral Builder

- Specialty selection
- Urgency level
- Clinical summary
- Attachments (labs, imaging)
- Recipient selection

#### Telemedicine Modes

1. **Async (Store & Forward)**: Specialist reviews offline
2. **Chat**: Real-time messaging
3. **Audio**: Voice-only call
4. **Video**: Full A/V consultation
5. **Scheduled**: Pre-booked appointments
6. **Board (MDT)**: Multi-participant case review

---

### 9.7 Notes & Attachments Section

**Component**: `NotesSection.tsx`

Clinical documentation center.

#### Tabs (5 Sub-Sections)

| Tab | Description |
|-----|-------------|
| **Write Note** | Live SOAP note editor with auto-save |
| **SOAP Notes** | Structured SOAP documentation |
| **Progress Notes** | Free-text progress entries |
| **Ward Rounds** | Round documentation with decisions |
| **Attachments** | Document and image management |

#### SOAP Note Structure

```
┌─────────────────┬─────────────────┐
│ S (Subjective)  │ O (Objective)   │
│ Patient reports │ Exam findings   │
├─────────────────┼─────────────────┤
│ A (Assessment)  │ P (Plan)        │
│ Diagnoses       │ Treatment plan  │
└─────────────────┴─────────────────┘
```

#### Progress Note Types

- Medical Officer Note
- Nursing Note
- Physiotherapy Note
- Social Work Note
- Dietitian Note

#### Ward Rounds

- Round type: Consultant, Admission, Teaching
- Team members present
- Summary of discussion
- Decisions and action items

#### Attachments

- File categories: Imaging, Laboratory, Clinical Documents, Clinical Images, Correspondence
- Upload with drag-and-drop
- Document scanner integration
- Preview and download

---

### 9.8 Visit Outcome Section

**Component**: `OutcomeSection.tsx`

Encounter disposition and discharge planning.

#### Disposition Options (6 Types)

| Disposition | Icon | Description |
|-------------|------|-------------|
| **Discharge** | Home | Ready for discharge home |
| **Admit** | Building | Admit to inpatient ward |
| **Transfer** | Ambulance | Transfer to another facility |
| **Refer** | Send | Refer for specialist care |
| **Death** | Heart | Record patient death |
| **LAMA** | UserX | Left against medical advice |

#### Discharge Workflow

**Summary Tab:**
- Discharge diagnoses (Primary/Secondary)
- Hospital course summary
- Condition at discharge

**Medications Tab:**
- Discharge medication list
- Medication reconciliation warning
- Prescription generation

**Follow-up Tab:**
- Follow-up appointments scheduling
- CHW follow-up tasks
- Discharge instructions
- Counseling provided checklist

**Checklist Tab:**
- Medication reconciliation ✓
- Medications dispensed ✓
- Patient education ✓
- Follow-up scheduled ✓
- Transport arranged ✓
- Discharge summary signed ✓

#### Summary Generation

- **Visit Summary**: Encounter-specific document
- **Patient Summary (IPS)**: HL7 FHIR compliant longitudinal summary
- QR code generation for secure sharing

---

## 10. Top Bar Panels

**Component**: `TopBarPanel.tsx`

Each Top Bar Action opens a dedicated panel in the Main Work Area.

### Panel Types

| Action ID | Panel Content |
|-----------|---------------|
| `queue` | Queue workstation for current facility |
| `beds` | Bed board with occupancy status |
| `pharmacy` | Pharmacy queue and dispensing |
| `theatre` | Theatre booking and schedule |
| `payments` | Payment collection interface |
| `handoff` | Shift handoff tools |
| `workspaces` | Workspace selection and status |
| `pathways` | Care pathway templates |
| `consumables` | Consumable item usage tracking |
| `charges` | Charge capture for billing |

---

## 11. Workspaces & Critical Events

### Workspace System

**Component**: `WorkspaceView.tsx`

Workspaces are specialized clinical environments for specific workflows.

#### Workspace Object

```typescript
interface WorkspaceData {
  id: string;
  type: string;              // e.g., "minor-procedure", "resus"
  encounterId: string;
  startTime: Date;
  status: "active" | "completed" | "cancelled";
  phase: "start" | "execute" | "complete" | "exit";
  initiatingUser: string;
  location: string;
  participatingRoles: string[];
}
```

#### Workspace Types

- Minor Procedure Room
- Resuscitation Bay
- Triage Station
- Consultation Room
- Treatment Room
- ICU Bay
- Theatre

### Critical Event System

**Component**: `CriticalEventWorkspace.tsx`

Critical events are emergency protocols that take over the entire interface.

#### Critical Event Types

```typescript
type CriticalEventType = "resuscitation" | "code-blue" | "rapid-response" | "emergency";
```

#### Critical Event Data

```typescript
interface CriticalEventData extends WorkspaceData {
  eventType: CriticalEventType;
  activatingUser: string;
  trigger: string;              // What triggered the event
  outcome?: "stabilised" | "admitted" | "transferred" | "escalated" | "death";
  endTime?: Date;
  terminatingUser?: string;
}
```

#### Activation Flow

```
1. Click Critical Event button in Top Bar
2. Select event type (Code Blue, Trauma, etc.)
3. Confirm activation
4. CriticalEventWorkspace takes over Main Work Area
5. Interface gets red ring border (critical-mode)
6. Event timer starts
7. All other panels disabled
8. On resolution: Select outcome → Terminate event
```

---

## 12. Context & State Management

### EHR Context

**Component**: `EHRContext.tsx`

Provides all EHR state to child components.

```typescript
interface EHRContextValue {
  // Patient Context
  patientContext: PatientContext;
  hasActivePatient: boolean;
  isLoadingContext: boolean;
  contextError: string | null;
  
  // Chart Access
  openChart: (encounterId, source, reason?) => Promise<void>;
  closeChart: (returnTo?) => void;
  requiresAccessJustification: boolean;
  
  // Current Encounter
  currentEncounter: Encounter | null;
  
  // Navigation
  activeMenuItem: EncounterMenuItem;
  setActiveMenuItem: (item) => void;
  
  // Top Bar
  activeTopBarAction: TopBarAction | null;
  setActiveTopBarAction: (action) => void;
  
  // Workspaces
  activeWorkspace: WorkspaceData | null;
  openWorkspace: (type) => void;
  closeWorkspace: () => void;
  
  // Critical Events
  activeCriticalEvent: CriticalEventData | null;
  isCriticalEventActive: boolean;
  activateCriticalEvent: (type, trigger) => void;
  terminateCriticalEvent: (outcome) => void;
  
  // Supporting Panels
  isConsumablesOpen: boolean;
  isChargesOpen: boolean;
}
```

### State Hierarchy

```
EHRProvider
├── patientContext (chart access state)
├── currentEncounter (loaded encounter data)
├── activeMenuItem (current section)
├── activeTopBarAction (current panel)
├── activeWorkspace (clinical workspace)
└── activeCriticalEvent (emergency state)
```

### Display Priority

```
Critical Event (highest)
    ↓
Workspace
    ↓
Top Bar Panel
    ↓
Encounter Section (default)
```

---

## Appendix: Type Definitions

### Encounter Menu Items

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

### Top Bar Actions

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

### Patient & Encounter

```typescript
interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  mrn: string;
  allergies: string[];
  ward?: string;
  bed?: string;
}

interface Encounter {
  id: string;
  patient: Patient;
  type: "inpatient" | "outpatient" | "emergency";
  status: "active" | "discharged" | "transferred";
  admissionDate: Date;
  attendingPhysician: string;
  location: string;
}
```

---

## File Reference

| Component | File Path |
|-----------|-----------|
| EHR Layout | `src/components/layout/EHRLayout.tsx` |
| Top Bar | `src/components/layout/TopBar.tsx` |
| Main Work Area | `src/components/layout/MainWorkArea.tsx` |
| Encounter Menu | `src/components/layout/EncounterMenu.tsx` |
| Patient Banner | `src/components/ehr/PatientBanner.tsx` |
| Provider Dashboard | `src/components/ehr/NoPatientSelected.tsx` |
| EHR Context | `src/contexts/EHRContext.tsx` |
| Overview Section | `src/components/ehr/sections/OverviewSection.tsx` |
| Assessment Section | `src/components/ehr/sections/AssessmentSection.tsx` |
| Problems Section | `src/components/ehr/sections/ProblemsSection.tsx` |
| Orders Section | `src/components/ehr/sections/OrdersSection.tsx` |
| Care Section | `src/components/ehr/sections/CareSection.tsx` |
| Consults Section | `src/components/ehr/sections/ConsultsSection.tsx` |
| Notes Section | `src/components/ehr/sections/NotesSection.tsx` |
| Outcome Section | `src/components/ehr/sections/OutcomeSection.tsx` |
| Critical Event | `src/components/ehr/CriticalEventWorkspace.tsx` |
| Workspace View | `src/components/ehr/WorkspaceView.tsx` |
| Top Bar Panel | `src/components/ehr/TopBarPanel.tsx` |
| Type Definitions | `src/types/ehr.ts` |

---

*Document generated for Impilo EHR Platform*  
*Last updated: February 2026*
