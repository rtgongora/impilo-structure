# Impilo Patient Journey - Complete End-to-End Documentation

## Overview

This document provides a comprehensive technical specification of the complete patient journey through the Impilo platform, covering both **Outpatient (No Admission)** and **Inpatient (With Admission)** pathways. The journey spans from initial arrival through clinical encounter, treatment, and discharge.

---

## Table of Contents

1. [Journey Overview](#journey-overview)
2. [Phase 1: Arrival & Check-In](#phase-1-arrival--check-in)
3. [Phase 2: Queue & Triage](#phase-2-queue--triage)
4. [Phase 3: Clinical Encounter](#phase-3-clinical-encounter)
5. [Phase 4: Orders & Investigations](#phase-4-orders--investigations)
6. [Phase 5: Decision Point - Admit or Discharge](#phase-5-decision-point---admit-or-discharge)
7. [Phase 6A: Outpatient Discharge](#phase-6a-outpatient-discharge)
8. [Phase 6B: Inpatient Admission](#phase-6b-inpatient-admission)
9. [Phase 7: Inpatient Care](#phase-7-inpatient-care)
10. [Phase 8: Inpatient Discharge](#phase-8-inpatient-discharge)
11. [Phase 9: Post-Discharge](#phase-9-post-discharge)
12. [Data Model & State Transitions](#data-model--state-transitions)
13. [Component Reference](#component-reference)

---

## Journey Overview

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PATIENT JOURNEY OVERVIEW                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐
  │  ARRIVE  │───▶│  QUEUE   │───▶│  TRIAGE  │───▶│ CONSULT  │───▶│ ORDERS/RESULTS   │
  │          │    │          │    │          │    │          │    │                  │
  │ Check-In │    │ Waiting  │    │ Acuity   │    │ History  │    │ Labs, Imaging    │
  │ Kiosk/   │    │ Room     │    │ Score    │    │ Exam     │    │ Procedures       │
  │ Reception│    │          │    │ Vitals   │    │ Assess   │    │                  │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┬─────────┘
                                                                           │
                                                                           ▼
                                                              ┌────────────────────────┐
                                                              │   DISPOSITION DECISION │
                                                              │                        │
                                                              │  Admit?  ──────────┐   │
                                                              │     │              │   │
                                                              │     ▼              ▼   │
                                                              │   [NO]           [YES] │
                                                              └─────┬──────────────┬───┘
                                                                    │              │
                         ┌──────────────────────────────────────────┘              │
                         ▼                                                         ▼
  ┌─────────────────────────────────────┐              ┌─────────────────────────────────────┐
  │        OUTPATIENT PATHWAY           │              │         INPATIENT PATHWAY           │
  │                                     │              │                                     │
  │  ┌─────────┐   ┌─────────────────┐  │              │  ┌─────────┐   ┌─────────────────┐  │
  │  │Prescribe│──▶│ Visit Summary   │  │              │  │ Bed     │──▶│ Ward Assignment │  │
  │  │Meds     │   │ Generation      │  │              │  │ Request │   │                 │  │
  │  └─────────┘   └────────┬────────┘  │              │  └─────────┘   └────────┬────────┘  │
  │                         │           │              │                         │           │
  │  ┌─────────────────────────────────┐│              │  ┌─────────────────────────────────┐│
  │  │ • Schedule Follow-up            ││              │  │ INPATIENT CARE                  ││
  │  │ • Print/Share Summary           ││              │  │ • Daily Rounds                  ││
  │  │ • Patient Education             ││              │  │ • Nursing Care (MAR, I/O)       ││
  │  │ • Pharmacy Pickup               ││              │  │ • Procedures                    ││
  │  └─────────────────────────────────┘│              │  │ • Consults                      ││
  │                         │           │              │  │ • Therapy                       ││
  │                         ▼           │              │  └────────────────┬────────────────┘│
  │  ┌─────────────────────────────────┐│              │                   │                 │
  │  │        DISCHARGE HOME           ││              │                   ▼                 │
  │  │                                 ││              │  ┌─────────────────────────────────┐│
  │  │  • Close Encounter              ││              │  │ DISCHARGE PLANNING              ││
  │  │  • Update Visit Status          ││              │  │ • Clearances (Medical/Finance)  ││
  │  │  • Generate IPS                 ││              │  │ • Meds Reconciliation           ││
  │  └─────────────────────────────────┘│              │  │ • Discharge Summary             ││
  │                                     │              │  │ • Pending Results Assignment    ││
  └─────────────────────────────────────┘              │  └────────────────┬────────────────┘│
                                                       │                   │                 │
                                                       │                   ▼                 │
                                                       │  ┌─────────────────────────────────┐│
                                                       │  │ VISIT CLOSURE                   ││
                                                       │  │ • Outcome Recording             ││
                                                       │  │ • Summary Signing               ││
                                                       │  │ • Follow-up Scheduling          ││
                                                       │  └─────────────────────────────────┘│
                                                       └─────────────────────────────────────┘
```

### Key Data Entities

| Entity | Purpose | Lifecycle |
|--------|---------|-----------|
| **Patient** | Demographic record linked to Client Registry | Persistent |
| **Visit** | Longitudinal episode of care (may span facilities) | Start → Outcome → Close |
| **Encounter** | Single clinical interaction within a Visit | Create → Document → Complete |
| **Queue Item** | Position in service queue | Waiting → Called → Attended → Complete |
| **Orders** | Lab, Imaging, Procedure requests | Draft → Active → Completed |
| **Admission** | Inpatient bed assignment | Admit → Ward Care → Discharge |

---

## Phase 1: Arrival & Check-In

### 1.1 Entry Points

Patients can arrive through multiple channels:

```typescript
type ArrivalChannel = 
  | 'walk_in'           // Unscheduled arrival
  | 'appointment'       // Pre-booked visit
  | 'emergency'         // Emergency presentation
  | 'referral'          // Referred from another facility
  | 'transfer'          // Transfer from another facility
  | 'birth'             // Newborn (CRVS integration)
  | 'portal_booking';   // Self-scheduled via Patient Portal
```

### 1.2 Self-Service Kiosk (`/kiosk`)

**Component:** `src/components/booking/SelfCheckInKiosk.tsx`

The kiosk provides a touch-friendly interface for patient self-check-in:

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPILO HEALTH CENTER                         │
│                     Self Check-In Kiosk                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │  📱 Scan QR     │    │  🔢 Enter Code  │                   │
│   │  (Appointment)  │    │  (Booking Ref)  │                   │
│   └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │  🆔 Impilo ID   │    │  👤 Walk-In     │                   │
│   │  (Patient Card) │    │  (New Visit)    │                   │
│   └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│   ┌─────────────────────────────────────────┐                   │
│   │  🚨 Emergency                           │                   │
│   │  (Bypass Queue - Immediate Attention)   │                   │
│   └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Kiosk Workflow:**

1. **Appointment Check-In:**
   - Scan QR code from appointment confirmation
   - System validates booking reference
   - Patient confirms details on screen
   - Queue ticket printed automatically
   - Patient directed to waiting area

2. **Walk-In Registration:**
   - Identity verification (Impilo ID, National ID, or Biometric)
   - If new patient: Quick registration form
   - Reason for visit selection
   - Queue assignment based on service type
   - Ticket printed with estimated wait time

3. **Emergency Bypass:**
   - Red button triggers immediate staff alert
   - Patient escorted to triage
   - Queue position: Priority 1

### 1.3 Reception Desk Check-In

**Components:** 
- `src/components/reception/ReceptionDashboard.tsx`
- `src/components/registration/PatientRegistrationForm.tsx`

Staff-assisted check-in for:
- Patients requiring assistance
- Complex registration scenarios
- Insurance/payment verification
- Walk-ins without ID

**Reception Workflow:**

```typescript
interface CheckInPayload {
  patientId: string;
  visitType: VisitType;
  arrivalMethod: ArrivalChannel;
  appointmentId?: string;
  chiefComplaint?: string;
  insuranceVerified?: boolean;
  emergencyContact?: EmergencyContact;
  specialNeeds?: string[];
}
```

### 1.4 Visit Creation

Upon check-in, the system creates a **Visit** record:

```typescript
// From src/types/patientCareTracker.ts
interface Visit {
  id: string;
  visitNumber: string;           // e.g., "V-2024-001234"
  patientId: string;
  visitType: VisitType;          // outpatient | inpatient | emergency | day_case
  status: VisitStatus;           // planned | active | completed | cancelled
  
  facilityId: string;
  facilityName: string;
  programmeCode?: string;        // e.g., "ANC", "HIV", "TB"
  
  startDate: string;             // Visit start timestamp
  expectedDischargeDate?: string;
  
  // Populated later
  outcome?: VisitOutcome;
  encounters?: EncounterSummary[];
}
```

**State Transition:**
```
PLANNED (appointment) → ACTIVE (check-in) → COMPLETED (discharge)
                    or
NULL (walk-in) → ACTIVE (check-in) → COMPLETED (discharge)
```

---

## Phase 2: Queue & Triage

### 2.1 Queue Assignment

**Route:** `/queue`
**Components:**
- `src/components/queue/QueueWorkstation.tsx`
- `src/components/queue/QueueItemCard.tsx`

After check-in, patients are assigned to appropriate queues:

```typescript
interface QueueAssignment {
  queueId: string;              // Target queue (e.g., "General OPD", "Antenatal")
  priority: QueuePriority;      // 1 (highest) to 5 (lowest)
  estimatedWaitTime: number;    // Minutes
  position: number;             // Position in queue
  ticketNumber: string;         // Display number (e.g., "A-042")
}

type QueuePriority = 
  | 1  // Emergency/Critical
  | 2  // Urgent
  | 3  // Semi-urgent
  | 4  // Standard
  | 5  // Non-urgent/Routine
```

### 2.2 Queue Display & Patient Tracking

**Patient-Facing Display:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    NOW SERVING                                  │
│                                                                 │
│         ┌───────────────────────────────────┐                   │
│         │           A-042                   │                   │
│         │        Room 3                     │                   │
│         └───────────────────────────────────┘                   │
│                                                                 │
│  NEXT:   A-043  │  A-044  │  A-045  │  A-046                   │
│                                                                 │
│  Average Wait: 12 minutes                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Staff Queue Workstation (6-Tab Interface):**

| Tab | Content |
|-----|---------|
| **Worklist** | Active queue items with patient cards |
| **Waiting** | Patients awaiting call |
| **In Service** | Currently being seen |
| **Completed** | Finished for today |
| **No-Show** | Missed appointments |
| **Appointments** | Today's scheduled visits |

### 2.3 Triage Process

**Component:** `src/components/ehr/sections/AssessmentSection.tsx`

For emergency and urgent cases, triage occurs before main consultation:

```typescript
interface TriageAssessment {
  triageCategory: TriageCategory;
  acuityScore: number;           // 1-5 (CTAS/ESI equivalent)
  chiefComplaint: string;
  vitalSigns: VitalSigns;
  painScore?: number;            // 0-10
  alertsIdentified: ClinicalAlert[];
  triageNurse: string;
  triageTime: string;
}

type TriageCategory = 
  | 'resuscitation'   // Immediate (< 0 min)
  | 'emergent'        // < 15 min
  | 'urgent'          // < 30 min
  | 'less_urgent'     // < 60 min
  | 'non_urgent';     // < 120 min
```

**Triage Acuity Matrix:**

| Score | Category | Response Time | Examples |
|-------|----------|---------------|----------|
| 1 | Resuscitation | Immediate | Cardiac arrest, severe trauma |
| 2 | Emergent | < 15 min | Chest pain, severe pain, altered LOC |
| 3 | Urgent | < 30 min | Moderate pain, high fever, dehydration |
| 4 | Less Urgent | < 60 min | Mild illness, minor injury |
| 5 | Non-Urgent | < 120 min | Chronic issues, refills, routine checks |

### 2.4 Queue-to-Chart Automation

When a practitioner calls a patient ("Start Service"), the system:

1. **Updates Queue Status:** `waiting` → `in_service`
2. **Creates Encounter:** If none exists for this visit
3. **Links Records:** Queue item ↔ Encounter ↔ Visit
4. **Navigates:** Provider to `/encounter/${encounterId}?source=queue&queueId=${queueId}`

```typescript
// From useQueueManagement hook
const handleStartService = async (queueItemId: string) => {
  // Create encounter if needed
  const encounter = await createEncounterForQueueItem(queueItemId);
  
  // Update queue item status
  await updateQueueItemStatus(queueItemId, 'in_service', {
    encounterId: encounter.id,
    attendedAt: new Date().toISOString(),
    attendedBy: currentUser.id
  });
  
  // Navigate to chart
  navigate(`/encounter/${encounter.id}?source=queue&queueId=${queueId}`);
};
```

---

## Phase 3: Clinical Encounter

### 3.1 Encounter Creation

**Route:** `/encounter/:encounterId`
**Components:**
- `src/pages/Encounter.tsx`
- `src/contexts/EHRContext.tsx`
- `src/components/layout/EHRLayout.tsx`

```typescript
interface Encounter {
  id: string;
  encounterNumber: string;        // e.g., "E-2024-005678"
  visitId: string;                // Parent visit
  patientId: string;
  
  encounterType: EncounterType;
  status: EncounterStatus;
  
  // Clinical context
  chiefComplaint?: string;
  primaryDiagnosis?: string;
  attendingPhysicianId: string;
  
  // Timing
  admissionDate: string;          // Encounter start
  dischargeDate?: string;         // Encounter end
  
  // Location
  facilityId: string;
  departmentId?: string;
  roomId?: string;
}

type EncounterType = 
  | 'outpatient'
  | 'inpatient' 
  | 'emergency'
  | 'observation'
  | 'day_surgery'
  | 'telehealth';

type EncounterStatus = 
  | 'planned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';
```

### 3.2 EHR Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR (Action Layer)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏠 │ Search │ Queue(12) │ Beds(45) │ Rx │ Theatre │ ... │ 🔔 │ 👤 Dr.X │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ PATIENT BANNER                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 👤 Themba Moyo │ M, 45y │ MRN: 12345 │ 🚨 Allergies(2) │ ⚠️ Diabetic │ │
│ │ Visit: V-2024-001234 │ Ward: OPD │ Provider: Dr. Nkosi                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┬─────────────────┤
│                                                           │ ENCOUNTER MENU  │
│                   MAIN WORK AREA                          │ (Right Nav)     │
│                                                           │                 │
│  ┌─────────────────────────────────────────────────────┐  │ ┌─────────────┐ │
│  │                                                     │  │ │ ● Overview  │ │
│  │                                                     │  │ │ ○ Assessment│ │
│  │             [ACTIVE SECTION CONTENT]                │  │ │ ○ Problems  │ │
│  │                                                     │  │ │ ○ Orders    │ │
│  │   Rendered based on:                                │  │ │ ○ Care      │ │
│  │   1. Critical Event (highest priority)              │  │ │ ○ Consults  │ │
│  │   2. Active Workspace                               │  │ │ ○ Notes     │ │
│  │   3. Top Bar Panel                                  │  │ │ ○ Outcome   │ │
│  │   4. Encounter Menu Section (default)               │  │ └─────────────┘ │
│  │                                                     │  │                 │
│  └─────────────────────────────────────────────────────┘  │                 │
│                                                           │                 │
└───────────────────────────────────────────────────────────┴─────────────────┘
```

### 3.3 Encounter Menu Sections (8 Fixed Items)

#### 3.3.1 Overview Section

**Component:** `src/components/ehr/sections/OverviewSection.tsx`

Dashboard view of the current encounter:

```
┌──────────────────────────────────────────────────────────────────┐
│ ENCOUNTER OVERVIEW                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ VITAL SIGNS     │  │ ACTIVE PROBLEMS │  │ ALLERGIES       │   │
│  │                 │  │                 │  │                 │   │
│  │ BP: 130/85     │  │ • Diabetes T2   │  │ 🔴 Penicillin   │   │
│  │ HR: 78 bpm     │  │ • Hypertension  │  │ 🟡 Sulfa        │   │
│  │ Temp: 37.2°C   │  │ • Obesity       │  │                 │   │
│  │ SpO2: 98%      │  │                 │  │                 │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ CURRENT MEDICATIONS                                         │ │
│  │ • Metformin 500mg BD                                       │ │
│  │ • Amlodipine 5mg OD                                        │ │
│  │ • Aspirin 75mg OD                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ RECENT RESULTS                              Pending: 2      │ │
│  │ • HbA1c: 7.2% (2024-01-15)                                 │ │
│  │ • Creatinine: 1.1 mg/dL (2024-01-15)                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ENCOUNTER TIMELINE                                          │ │
│  │ 09:15 - Checked in                                         │ │
│  │ 09:23 - Triage completed (Acuity: 4)                       │ │
│  │ 09:45 - Called by Dr. Nkosi                                │ │
│  │ 09:47 - Consultation started                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Assessment Section

**Component:** `src/components/ehr/sections/AssessmentSection.tsx`

7-tab comprehensive clinical assessment:

| Tab | Purpose | Data Captured |
|-----|---------|---------------|
| **Triage** | Initial acuity assessment | Chief complaint, acuity score, initial vitals |
| **Vitals** | Vital signs monitoring | BP, HR, RR, Temp, SpO2, Pain, Weight, Height |
| **History** | Medical history | PMH, PSH, FH, Social, Medications, Allergies |
| **Systems Review** | Review of systems | 14-system checklist with findings |
| **Physical Exam** | Examination findings | System-by-system documentation |
| **Clinical Impression** | Working diagnosis | Differential diagnoses, reasoning |
| **Risk Scores** | Validated assessments | NEWS2, MEWS, Fall Risk, Pressure Ulcer |

#### 3.3.3 Problems Section

**Component:** `src/components/ehr/sections/ProblemsSection.tsx`

```typescript
interface PatientProblem {
  id: string;
  patientId: string;
  encounterId?: string;
  
  problemCode?: string;          // ICD-10
  problemDisplay: string;
  problemType: 'diagnosis' | 'symptom' | 'condition' | 'complaint';
  
  clinicalStatus: 'active' | 'resolved' | 'inactive' | 'recurrence';
  verificationStatus: 'confirmed' | 'provisional' | 'differential' | 'refuted';
  severity?: 'mild' | 'moderate' | 'severe';
  
  isPrincipal: boolean;          // Principal diagnosis for this encounter
  isChronic: boolean;
  
  onsetDate?: string;
  abatementDate?: string;
  
  recordedBy: string;
  recordedAt: string;
}
```

**Problem List Display:**
```
┌──────────────────────────────────────────────────────────────────┐
│ PROBLEMS & DIAGNOSES                            [+ Add Problem]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACTIVE PROBLEMS                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ★ Type 2 Diabetes Mellitus (E11.9)          Principal     │  │
│  │   Onset: 2019-03-15 │ Chronic │ Confirmed                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   Essential Hypertension (I10)                             │  │
│  │   Onset: 2018-07-20 │ Chronic │ Confirmed                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   Acute Upper Respiratory Infection (J06.9)   NEW          │  │
│  │   Onset: Today │ Acute │ Provisional                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  RESOLVED PROBLEMS (3)                          [Show/Hide]      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.3.4 Orders Section

**Component:** `src/components/ehr/sections/OrdersSection.tsx`

Unified order management for all clinical orders:

```typescript
interface ClinicalOrder {
  id: string;
  orderNumber: string;
  encounterId: string;
  patientId: string;
  
  orderType: OrderType;
  orderCategory: string;         // e.g., "Chemistry", "Hematology", "CT"
  
  // Order details
  orderCode?: string;            // LOINC, CPT, etc.
  orderDisplay: string;
  quantity?: number;
  instructions?: string;
  
  // Clinical context
  reasonCode?: string;
  reasonDisplay?: string;
  priority: 'routine' | 'urgent' | 'stat' | 'asap';
  
  // Status tracking
  status: OrderStatus;
  orderedBy: string;
  orderedAt: string;
  
  // Fulfillment
  scheduledDate?: string;
  collectedAt?: string;
  resultedAt?: string;
}

type OrderType = 
  | 'laboratory'
  | 'imaging'
  | 'medication'
  | 'procedure'
  | 'referral'
  | 'diet'
  | 'nursing'
  | 'therapy';

type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';
```

**Orders Workflow:**
```
DRAFT → PENDING (signed) → ACTIVE (accepted) → COMPLETED (resulted)
                                    ↓
                              ON_HOLD (if needed)
                                    ↓
                              CANCELLED (if needed)
```

#### 3.3.5 Care Section

**Component:** `src/components/ehr/sections/CareSection.tsx`

Nursing and care management:

| Sub-Section | Purpose |
|-------------|---------|
| **MAR** | Medication Administration Record |
| **Fluid Balance** | I/O tracking, daily balance |
| **Nursing Tasks** | Care activities, assessments |
| **Care Plans** | Active care plan items |
| **Patient Education** | Teaching provided |

**MAR Display:**
```
┌──────────────────────────────────────────────────────────────────┐
│ MEDICATION ADMINISTRATION RECORD                    Date: Today  │
├──────────────────────────────────────────────────────────────────┤
│ Medication        │ 06:00 │ 08:00 │ 12:00 │ 18:00 │ 22:00       │
├───────────────────┼───────┼───────┼───────┼───────┼─────────────┤
│ Metformin 500mg   │   -   │   ✓   │   -   │   ✓   │   -         │
│ Amlodipine 5mg    │   ✓   │   -   │   -   │   -   │   -         │
│ Paracetamol 1g    │   -   │   ✓   │   -   │   ✓   │   ○         │
└──────────────────────────────────────────────────────────────────┘
✓ = Given  ○ = Due  ✗ = Held/Refused  - = Not scheduled
```

#### 3.3.6 Consults Section

**Component:** `src/components/ehr/sections/ConsultsSection.tsx`

Referrals and specialist consultations:

```typescript
interface ConsultRequest {
  id: string;
  encounterId: string;
  patientId: string;
  
  consultType: 'internal' | 'external' | 'telehealth';
  specialty: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  
  requestedBy: string;
  requestedAt: string;
  reason: string;
  clinicalQuestion?: string;
  
  status: ConsultStatus;
  assignedTo?: string;
  
  response?: {
    consultantId: string;
    responseDate: string;
    findings: string;
    recommendations: string;
  };
}

type ConsultStatus = 
  | 'requested'
  | 'accepted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
```

#### 3.3.7 Notes Section

**Component:** `src/components/ehr/sections/NotesSection.tsx`

Clinical documentation and attachments:

```typescript
interface ClinicalNote {
  id: string;
  encounterId: string;
  patientId: string;
  
  noteType: NoteType;
  templateId?: string;
  
  // Content
  title: string;
  content: string;              // Rich text / structured
  structuredData?: {
    subjective?: string;        // SOAP - S
    objective?: string;         // SOAP - O
    assessment?: string;        // SOAP - A
    plan?: string;              // SOAP - P
  };
  
  // Authorship
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  
  // Signing
  status: 'draft' | 'pending_signature' | 'signed' | 'amended';
  signedBy?: string;
  signedAt?: string;
  
  // Co-signing (for trainees)
  requiresCosign: boolean;
  cosignedBy?: string;
  cosignedAt?: string;
}

type NoteType = 
  | 'progress_note'
  | 'admission_note'
  | 'consultation_note'
  | 'procedure_note'
  | 'discharge_note'
  | 'nursing_note'
  | 'therapy_note';
```

#### 3.3.8 Outcome Section

**Component:** `src/components/ehr/sections/OutcomeSection.tsx`

Visit disposition and discharge planning:

```
┌──────────────────────────────────────────────────────────────────┐
│ VISIT OUTCOME & DISPOSITION                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DISPOSITION DECISION                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ○ Discharge Home                                          │  │
│  │  ○ Discharge to Care Facility                              │  │
│  │  ○ Admit to Inpatient                                      │  │
│  │  ○ Transfer to Another Facility                            │  │
│  │  ○ Left Against Medical Advice (DAMA)                      │  │
│  │  ○ Death                                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DISCHARGE REQUIREMENTS                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✓ Medications Reconciled                                  │  │
│  │  ✓ Patient Education Completed                             │  │
│  │  ○ Follow-up Scheduled                                     │  │
│  │  ○ Discharge Summary Signed                                │  │
│  │  ○ Pending Results Assigned                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Generate Visit Summary]  [Generate IPS]  [Complete Discharge]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Orders & Investigations

### 4.1 Order Entry Workflow

```
CLINICIAN                    SYSTEM                      DEPARTMENT
    │                           │                            │
    │  Place Order              │                            │
    ├──────────────────────────▶│                            │
    │                           │  Validate & Route          │
    │                           ├───────────────────────────▶│
    │                           │                            │
    │                           │          Accept Order      │
    │                           │◀───────────────────────────┤
    │                           │                            │
    │  Order Confirmed          │                            │
    │◀──────────────────────────┤                            │
    │                           │                            │
    │                           │         Collect Sample     │
    │                           │◀───────────────────────────┤
    │                           │                            │
    │                           │         Result Ready       │
    │                           │◀───────────────────────────┤
    │                           │                            │
    │  Result Notification      │                            │
    │◀──────────────────────────┤                            │
    │                           │                            │
    │  Review & Acknowledge     │                            │
    ├──────────────────────────▶│                            │
    │                           │                            │
```

### 4.2 Laboratory Orders

**Integration:** LIMS (Laboratory Information Management System)

```typescript
interface LabOrder extends ClinicalOrder {
  orderType: 'laboratory';
  
  specimenType?: string;         // Blood, Urine, CSF, etc.
  specimenSource?: string;       // Venous, Arterial, etc.
  collectionInstructions?: string;
  
  fastingRequired?: boolean;
  
  results?: LabResult[];
}

interface LabResult {
  id: string;
  orderId: string;
  
  testCode: string;
  testName: string;
  
  value: string | number;
  unit?: string;
  referenceRange?: string;
  
  interpretation?: 'normal' | 'abnormal' | 'critical';
  flags?: string[];              // H, L, HH, LL, etc.
  
  resultedAt: string;
  resultedBy: string;
  
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}
```

### 4.3 Imaging Orders

**Integration:** PACS (Picture Archiving and Communication System)

```typescript
interface ImagingOrder extends ClinicalOrder {
  orderType: 'imaging';
  
  modality: ImagingModality;
  bodyPart: string;
  laterality?: 'left' | 'right' | 'bilateral';
  
  contrastRequired?: boolean;
  sedationRequired?: boolean;
  
  scheduledDateTime?: string;
  
  study?: ImagingStudy;
  report?: ImagingReport;
}

type ImagingModality = 
  | 'xray'
  | 'ct'
  | 'mri'
  | 'ultrasound'
  | 'mammography'
  | 'fluoroscopy'
  | 'nuclear';
```

### 4.4 Medication Orders

**Integration:** Pharmacy System

```typescript
interface MedicationOrder extends ClinicalOrder {
  orderType: 'medication';
  
  medicationCode?: string;       // RxNorm, ATC
  medicationName: string;
  
  dose: string;
  doseUnit: string;
  route: string;                 // PO, IV, IM, SC, etc.
  frequency: string;             // OD, BD, TDS, QID, PRN
  
  duration?: string;
  refills?: number;
  
  substitutionAllowed: boolean;
  
  dispensingStatus?: 'pending' | 'dispensed' | 'partially_dispensed';
  administrations?: MedicationAdministration[];
}
```

### 4.5 Results Review & Acknowledgment

**Component:** `src/components/ehr/panels/ResultsReviewPanel.tsx`

Critical results require explicit acknowledgment:

```typescript
interface ResultAcknowledgment {
  id: string;
  resultId: string;
  orderId: string;
  patientId: string;
  
  resultType: 'laboratory' | 'imaging' | 'pathology';
  isCritical: boolean;
  isAbnormal: boolean;
  
  acknowledgedBy: string;
  acknowledgedAt: string;
  
  actionTaken?: string;
  followUpPlan?: string;
}
```

---

## Phase 5: Decision Point - Admit or Discharge

### 5.1 Disposition Assessment

At the conclusion of the clinical encounter, the provider determines disposition:

```typescript
type DispositionDecision = 
  | 'discharge_home'           // Outpatient - go home
  | 'discharge_care'           // Discharge to care facility
  | 'admit_inpatient'          // Admit to hospital ward
  | 'admit_observation'        // Observation unit (< 24h)
  | 'admit_icu'                // ICU admission
  | 'transfer_external'        // Transfer to another facility
  | 'dama'                     // Discharge Against Medical Advice
  | 'death'                    // Patient deceased
  | 'pending_results';         // Decision pending (await results)
```

### 5.2 Admission Criteria

Factors influencing admission decision:

| Factor | Consider Admission If |
|--------|----------------------|
| Clinical Severity | Unstable vitals, severe symptoms |
| Monitoring Needs | Requires frequent observation |
| Treatment Requirements | IV therapy, complex procedures |
| Social Factors | Unable to care for self at home |
| Safety Concerns | Risk of deterioration |
| Diagnostic Uncertainty | Need for extended workup |

---

## Phase 6A: Outpatient Discharge

### 6.1 Discharge Workflow (No Admission)

```
ENCOUNTER END               PHARMACY                    SCHEDULING
      │                        │                            │
      │  Prescriptions         │                            │
      ├───────────────────────▶│                            │
      │                        │  Dispense                  │
      │                        ├────────────────────────────│
      │                        │                            │
      │  Dispensing Complete   │                            │
      │◀───────────────────────┤                            │
      │                        │                            │
      │  Follow-up Request     │                            │
      ├────────────────────────────────────────────────────▶│
      │                        │                            │
      │                        │      Appointment Booked    │
      │◀────────────────────────────────────────────────────┤
      │                        │                            │
      │  Generate Summary      │                            │
      ├───────────────────────▶                             │
      │                        │                            │
      │  Close Encounter       │                            │
      ├───────────────────────▶                             │
```

### 6.2 Visit Summary Generation

**Component:** `src/components/discharge/` module

```typescript
interface VisitSummary {
  id: string;
  documentId: string;
  visitId: string;
  encounterId: string;
  
  // Visit details
  visitDate: string;
  facilityName: string;
  providerName: string;
  
  // Clinical summary
  chiefComplaint: string;
  diagnoses: DiagnosisEntry[];
  proceduresPerformed: ProcedureEntry[];
  
  // Medications
  prescriptions: MedicationEntry[];
  medicationChanges: MedicationChangeEntry[];
  
  // Instructions
  patientInstructions: string;
  warningSigns: string;
  activityRestrictions?: string;
  dietaryInstructions?: string;
  
  // Follow-up
  followUpAppointments: FollowUpEntry[];
  referrals: ReferralEntry[];
  
  // Pending items
  pendingResults: PendingResultEntry[];
  
  // Generation metadata
  generatedAt: string;
  generatedBy: string;
}
```

### 6.3 Patient Education & Instructions

Discharge education includes:

- **Diagnosis explanation** (patient-friendly language)
- **Medication instructions** (dose, timing, side effects)
- **Warning signs** (when to return/call)
- **Activity restrictions** (if any)
- **Follow-up appointments** (dates, locations)
- **Contact information** (clinic, after-hours)

### 6.4 Encounter & Visit Closure

**Outpatient Visit Closure Checklist:**

```typescript
interface OutpatientDischargeChecklist {
  prescriptionsPrinted: boolean;
  medicationsDispensed: boolean;
  patientEducationCompleted: boolean;
  followUpScheduled: boolean;
  visitSummaryGenerated: boolean;
  pendingResultsAssigned: boolean;
  
  // Optional
  referralsSent?: boolean;
  insuranceClaimFiled?: boolean;
}
```

---

## Phase 6B: Inpatient Admission

### 6.1 Admission Decision & Order

When admission is indicated:

```typescript
interface AdmissionOrder {
  id: string;
  encounterId: string;
  patientId: string;
  
  admissionType: 'elective' | 'emergency' | 'urgent';
  admissionSource: 'emergency' | 'outpatient' | 'transfer' | 'direct';
  
  requestedService: string;      // e.g., "Internal Medicine", "Surgery"
  requestedWard?: string;
  requestedBedType?: string;     // ICU, Isolation, Standard, etc.
  
  admittingDiagnosis: string;
  admissionReason: string;
  
  expectedLOS?: number;          // Expected Length of Stay (days)
  
  specialRequirements?: string[];  // Isolation, telemetry, etc.
  
  orderedBy: string;
  orderedAt: string;
  
  status: 'pending' | 'accepted' | 'assigned' | 'cancelled';
}
```

### 6.2 Bed Request & Assignment

**Component:** `src/components/ehr/panels/BedManagementPanel.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│ BED REQUEST                                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Patient: Themba Moyo (MRN: 12345)                              │
│  Admitting Service: Internal Medicine                            │
│  Diagnosis: Community Acquired Pneumonia                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Preferred Ward:        [Medical Ward - Select ▼]          │  │
│  │  Bed Type Required:     ○ Standard  ● Isolation  ○ ICU     │  │
│  │  Special Needs:         ☑ Oxygen  ☐ Telemetry  ☐ Suction   │  │
│  │  Gender Preference:     ● Male Ward  ○ Female  ○ Mixed     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  AVAILABLE BEDS                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Ward         │ Bed      │ Type      │ Status              │  │
│  ├───────────────┼──────────┼───────────┼─────────────────────┤  │
│  │  Med Ward A   │ A-12     │ Isolation │ Available           │  │
│  │  Med Ward A   │ A-15     │ Standard  │ Available           │  │
│  │  Med Ward B   │ B-03     │ Isolation │ Cleaning            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Cancel]                                        [Assign Bed]    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Admission Documentation

Upon bed assignment, required admission documentation:

```typescript
interface AdmissionNote {
  id: string;
  encounterId: string;
  noteType: 'admission_note';
  
  // Chief Complaint & HPI
  chiefComplaint: string;
  historyOfPresentIllness: string;
  
  // Background
  pastMedicalHistory: string;
  pastSurgicalHistory: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  socialHistory: string;
  
  // Review of Systems
  reviewOfSystems: Record<string, string>;
  
  // Physical Examination
  physicalExamination: Record<string, string>;
  
  // Assessment & Plan
  assessment: string;
  differentialDiagnosis: string[];
  plan: string;
  
  // Admission orders summary
  admissionOrdersSummary: string;
}
```

### 6.4 Visit Type Transition

When a patient is admitted, the Visit record updates:

```typescript
// Before admission (Outpatient encounter)
visit.visitType = 'outpatient';
visit.status = 'active';

// After admission
visit.visitType = 'inpatient';      // Updated
visit.wardId = assignedWard.id;
visit.bedId = assignedBed.id;
visit.attendingPhysicianId = admittingDoctor.id;
visit.admissionSource = 'emergency'; // or 'outpatient'
visit.admissionReason = 'Community Acquired Pneumonia';
visit.expectedDischargeDate = calculateExpectedLOS();
```

---

## Phase 7: Inpatient Care

### 7.1 Ward Management

**Route:** `/beds` (via Top Bar)
**Component:** `src/components/ehr/panels/BedManagementPanel.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│ WARD OVERVIEW - Medical Ward A                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CENSUS: 24/30 beds (80%)                                        │
│                                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ A-01   │ │ A-02   │ │ A-03   │ │ A-04   │ │ A-05   │         │
│  │ 🔴     │ │ ⚪     │ │ 🟢     │ │ 🟡     │ │ 🟢     │         │
│  │ Moyo,T │ │ EMPTY  │ │ Ndlovu │ │ Dube,S │ │ Phiri  │         │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                                  │
│  Legend: 🔴 Critical  🟡 Needs Attention  🟢 Stable  ⚪ Empty   │
│                                                                  │
│  PENDING TASKS                                                   │
│  • 3 patients due for vitals                                    │
│  • 2 patients due for medication                                │
│  • 1 patient ready for discharge                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Daily Rounds

Inpatient care involves daily clinical rounds:

```typescript
interface RoundingNote {
  id: string;
  encounterId: string;
  roundDate: string;
  
  // Interval history
  overnightEvents: string;
  patientComplaints: string;
  
  // Current status
  vitalSigns: VitalSigns;
  physicalExamFindings: string;
  
  // Review
  labReview: string;
  imagingReview: string;
  consultNotes: string;
  
  // Assessment
  currentAssessment: string;
  problemList: string[];
  
  // Plan
  planForToday: string;
  anticipatedLOS: number;
  dischargeBarriers?: string;
  
  // Discussed with
  discussedWithPatient: boolean;
  discussedWithFamily: boolean;
  familyMemberPresent?: string;
}
```

### 7.3 Nursing Care Documentation

**Component:** `src/components/ehr/sections/CareSection.tsx`

#### Medication Administration Record (MAR)

```typescript
interface MedicationAdministration {
  id: string;
  orderId: string;
  patientId: string;
  encounterId: string;
  
  medicationName: string;
  dose: string;
  route: string;
  
  scheduledTime: string;
  administeredTime?: string;
  
  status: 'scheduled' | 'given' | 'held' | 'refused' | 'not_given';
  
  // If not given
  reasonNotGiven?: string;
  
  // Administration details
  administeredBy?: string;
  witnessedBy?: string;          // For controlled substances
  site?: string;                 // Injection site
  
  patientResponse?: string;
  adverseReaction?: boolean;
  adverseReactionDetails?: string;
}
```

#### Fluid Balance (Intake/Output)

```typescript
interface FluidBalanceEntry {
  id: string;
  encounterId: string;
  patientId: string;
  
  entryType: 'intake' | 'output';
  category: FluidCategory;
  
  volume: number;                // mL
  timestamp: string;
  
  recordedBy: string;
  notes?: string;
}

type FluidCategory = 
  // Intake
  | 'oral'
  | 'iv_fluids'
  | 'iv_medications'
  | 'blood_products'
  | 'tube_feeding'
  | 'tpn'
  // Output
  | 'urine'
  | 'stool'
  | 'emesis'
  | 'drain'
  | 'blood_loss'
  | 'ng_output';
```

#### Nursing Assessments

```typescript
interface NursingAssessment {
  id: string;
  encounterId: string;
  assessmentType: NursingAssessmentType;
  
  timestamp: string;
  assessedBy: string;
  
  findings: Record<string, any>;
  score?: number;
  riskLevel?: 'low' | 'moderate' | 'high';
  
  interventionsRequired?: string[];
}

type NursingAssessmentType = 
  | 'pain_assessment'
  | 'fall_risk'
  | 'pressure_ulcer_risk'
  | 'nutritional_screening'
  | 'restraint_assessment'
  | 'skin_assessment'
  | 'neuro_check';
```

### 7.4 Procedures & Interventions

```typescript
interface InpatientProcedure {
  id: string;
  encounterId: string;
  patientId: string;
  
  procedureCode?: string;
  procedureName: string;
  procedureType: 'bedside' | 'minor' | 'major' | 'surgical';
  
  indication: string;
  consent: {
    obtained: boolean;
    obtainedBy?: string;
    obtainedAt?: string;
    documentId?: string;
  };
  
  scheduledDateTime?: string;
  performedDateTime?: string;
  
  location: string;              // Bedside, Procedure Room, OR
  
  performer: string;
  assistants?: string[];
  
  anesthesiaType?: string;
  
  findings?: string;
  complications?: string;
  specimenCollected?: boolean;
  
  postProcedureOrders?: string[];
}
```

### 7.5 Consultations

For inpatients, specialty consultations are common:

```typescript
interface InpatientConsult {
  id: string;
  encounterId: string;
  
  consultingService: string;
  consultingPhysician?: string;
  
  urgency: 'routine' | 'urgent' | 'emergent';
  
  clinicalQuestion: string;
  relevantHistory: string;
  currentManagement: string;
  
  requestedBy: string;
  requestedAt: string;
  
  // Response
  seenAt?: string;
  seenBy?: string;
  
  impression?: string;
  recommendations?: string;
  
  followUpPlan?: string;
  
  status: 'requested' | 'accepted' | 'seen' | 'completed';
}
```

### 7.6 Care Team Communication

**Shift Handoff Documentation:**

```typescript
interface ShiftHandoff {
  id: string;
  encounterId: string;
  patientId: string;
  
  handoffType: 'nursing' | 'physician';
  
  fromShift: string;             // e.g., "Day"
  toShift: string;               // e.g., "Night"
  
  timestamp: string;
  
  // SBAR Format
  situation: string;             // Current status
  background: string;            // Relevant history
  assessment: string;            // Current assessment
  recommendation: string;        // Pending tasks, concerns
  
  criticalTasks: string[];
  pendingResults: string[];
  
  handedOffBy: string;
  receivedBy: string;
}
```

---

## Phase 8: Inpatient Discharge

### 8.1 Discharge Planning

**Route:** `/discharge`
**Component:** `src/components/discharge/DischargeWorkflowPanel.tsx`

Discharge planning begins at admission:

```typescript
interface DischargePlan {
  id: string;
  visitId: string;
  patientId: string;
  
  estimatedDischargeDate?: string;
  actualDischargeDate?: string;
  
  // Barriers to discharge
  barriers: DischargeBarrier[];
  
  // Destination planning
  dischargeDestination: DischargeDestination;
  
  // Requirements
  requiresHomeHealth: boolean;
  requiresDME: boolean;           // Durable Medical Equipment
  requiresRehab: boolean;
  requiresSNF: boolean;           // Skilled Nursing Facility
  
  // Coordination
  socialWorkConsult: boolean;
  caseManagerId?: string;
  
  // Status tracking
  planStatus: 'active' | 'pending_clearance' | 'ready' | 'completed';
}

interface DischargeBarrier {
  type: string;
  description: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

type DischargeDestination = 
  | 'home'
  | 'home_with_services'
  | 'snf'                        // Skilled Nursing Facility
  | 'rehab'
  | 'ltac'                       // Long-term Acute Care
  | 'hospice'
  | 'other_facility';
```

### 8.2 Multi-Cadre Clearance

**Component:** `src/components/discharge/ClearanceChecklist.tsx`

Before discharge, multiple departments must clear the patient:

```
┌──────────────────────────────────────────────────────────────────┐
│ DISCHARGE CLEARANCE CHECKLIST                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CLINICAL CLEARANCE                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✓ Attending Physician Approval        Dr. Nkosi 10:30    │  │
│  │  ✓ Nursing Assessment Complete         Sr. Moyo 09:45     │  │
│  │  ○ Pharmacy - Meds Reconciliation      Pending            │  │
│  │  ✓ Pending Results Assigned            Dr. Nkosi 10:30    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ADMINISTRATIVE CLEARANCE                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ○ Finance Clearance                   Pending             │  │
│  │  ✓ Insurance Pre-authorization         Approved            │  │
│  │  ○ Medical Records Complete            Pending             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PATIENT READINESS                                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✓ Transport Arranged                  Family pickup       │  │
│  │  ✓ Patient Education Completed         Sr. Moyo 11:00     │  │
│  │  ○ Follow-up Appointments Scheduled    Pending             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Status: 5/8 Complete                    [Complete Discharge]    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 Medication Reconciliation

**Discharge Medication Reconciliation:**

```typescript
interface DischargeMedReconciliation {
  id: string;
  visitId: string;
  patientId: string;
  
  // Pre-admission medications
  preadmissionMeds: MedicationEntry[];
  
  // Inpatient medications
  inpatientMeds: MedicationEntry[];
  
  // Discharge medications
  dischargeMeds: MedicationEntry[];
  
  // Changes
  newMedications: MedicationEntry[];
  discontinuedMedications: MedicationEntry[];
  changedMedications: MedicationChangeEntry[];
  
  // Reconciliation details
  reconciledBy: string;
  reconciledAt: string;
  pharmacistReview?: {
    reviewedBy: string;
    reviewedAt: string;
    interventions?: string[];
  };
}
```

### 8.4 Discharge Summary Generation

**Component:** `src/components/discharge/DischargeSummaryGenerator.tsx`

```typescript
// From src/types/patientCareTracker.ts
interface DischargeSummary {
  id: string;
  documentId: string;
  visitId: string;
  patientId: string;
  
  // Administrative
  admissionDate: string;
  dischargeDate: string;
  facilityName: string;
  wardName?: string;
  attendingPhysician: string;
  
  // Diagnoses
  primaryDiagnosis: string;
  primaryDiagnosisCode?: string;
  secondaryDiagnoses: DiagnosisEntry[];
  
  // Hospital course
  hospitalCourseNarrative: string;
  significantProcedures: ProcedureEntry[];
  
  // Condition
  conditionAtAdmission: string;
  conditionAtDischarge: string;
  functionalStatus?: string;
  
  // Medications
  dischargeMedications: MedicationEntry[];
  medicationsStopped: MedicationEntry[];
  medicationsChanged: MedicationChangeEntry[];
  
  // Results
  keyLabResults: LabResultEntry[];
  keyImagingResults: ImagingResultEntry[];
  pendingResults: PendingResultEntry[];
  
  // Follow-up
  followUpAppointments: FollowUpEntry[];
  referrals: ReferralEntry[];
  
  // Instructions
  patientInstructions: string;
  warningSigns: string;
  activityRestrictions?: string;
  dietaryRestrictions?: string;
  
  // Signatures
  preparedBy: string;
  preparedAt: string;
  signedBy?: string;
  signedAt?: string;
}
```

### 8.5 Pending Results Assignment

Critical for continuity of care:

```typescript
interface PendingResultAssignment {
  id: string;
  visitId: string;
  patientId: string;
  
  resultType: 'laboratory' | 'imaging' | 'pathology';
  testName: string;
  orderedDate: string;
  expectedDate?: string;
  
  // Assignment
  assignedToProviderId: string;
  assignedToProviderName: string;
  assignedAt: string;
  
  // Follow-up plan
  followUpPlan: string;
  criticalValueProtocol: string;
  
  // Tracking
  resultReceivedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actionTaken?: string;
}
```

### 8.6 Visit Outcome Recording

**Component:** `src/components/ehr/sections/OutcomeSection.tsx`

```typescript
// From src/types/patientCareTracker.ts
type VisitOutcome = 
  | 'discharged_home'
  | 'discharged_care'
  | 'transferred'
  | 'admitted'                   // For ED → Inpatient
  | 'death'
  | 'lama'                       // Left Against Medical Advice
  | 'absconded'
  | 'administrative_closure'
  | 'ongoing';

interface VisitClosure {
  visitId: string;
  
  outcome: VisitOutcome;
  outcomeDetails?: string;
  outcomeAt: string;
  outcomeBy: string;
  
  // Closure requirements
  summaryGenerated: boolean;
  medsReconciled: boolean;
  pendingResultsAssigned: boolean;
  
  // Signature
  conclusionSignedBy: string;
  conclusionSignedAt: string;
}
```

### 8.7 Death Declaration (Special Outcome)

**Component:** `src/components/discharge/DeathDeclarationForm.tsx`

If the patient expires:

```typescript
interface DeathDeclaration {
  id: string;
  visitId: string;
  patientId: string;
  
  // Time and place
  dateOfDeath: string;
  timeOfDeath: string;
  placeOfDeath: string;
  
  // Cause of death
  immediateCause: string;
  underlyingCause?: string;
  contributingConditions?: string[];
  
  // Certification
  certifiedBy: string;
  certifiedAt: string;
  certifierRole: string;
  
  // Additional details
  mannerOfDeath: 'natural' | 'accident' | 'homicide' | 'suicide' | 'pending' | 'undetermined';
  autopsyPerformed?: boolean;
  autopsyFindings?: string;
  
  // CRVS notification
  crvsNotificationId?: string;
  crvsNotifiedAt?: string;
  
  // Family notification
  familyNotified: boolean;
  familyNotifiedAt?: string;
  familyNotifiedBy?: string;
}
```

---

## Phase 9: Post-Discharge

### 9.1 Follow-Up Scheduling

```typescript
interface FollowUpAppointment {
  id: string;
  visitId: string;              // Source visit
  patientId: string;
  
  appointmentType: string;
  specialty?: string;
  providerId?: string;
  
  scheduledDate: string;
  scheduledTime?: string;
  location?: string;
  
  reason: string;
  instructions?: string;
  
  // Scheduling metadata
  scheduledBy: string;
  scheduledAt: string;
  
  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reminderSent?: boolean;
}
```

### 9.2 Patient Portal Access

Patients can access their visit information via the Portal (`/portal`):

- **Visit Summary** (PDF download)
- **Medications** (list and instructions)
- **Appointments** (upcoming, past)
- **Results** (when released)
- **Messaging** (secure messaging with care team)

### 9.3 Continuity of Care Document (CCD)

For external sharing, the system can generate:

```typescript
interface ContinuityOfCareDocument {
  id: string;
  patientId: string;
  visitId?: string;
  
  documentType: 'ips' | 'ccd' | 'ccda';
  format: 'fhir' | 'hl7v2' | 'ccda';
  
  content: {
    patient: PatientDemographics;
    allergies: AllergyEntry[];
    problems: ProblemEntry[];
    medications: MedicationEntry[];
    immunizations: ImmunizationEntry[];
    procedures: ProcedureEntry[];
    results: ResultEntry[];
    vitalSigns: VitalSigns[];
  };
  
  generatedAt: string;
  generatedBy: string;
  
  // Sharing
  shareToken?: string;
  shareExpiry?: string;
}
```

---

## Data Model & State Transitions

### Visit State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VISIT STATE MACHINE                                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │            [PLANNED]                │
                    │   (Scheduled appointment)           │
                    └──────────────┬──────────────────────┘
                                   │
                                   │ Check-in
                                   ▼
                    ┌─────────────────────────────────────┐
    Walk-in ───────▶│            [ACTIVE]                 │
                    │   (Patient present, care ongoing)   │
                    └──────────────┬──────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐      ┌─────────────────┐      ┌─────────────┐
    │ [ON_HOLD]   │      │  [COMPLETED]    │      │ [CANCELLED] │
    │ (Temp pause)│      │  (Discharged)   │      │ (No show)   │
    └──────┬──────┘      └─────────────────┘      └─────────────┘
           │
           │ Resume
           ▼
    ┌─────────────┐
    │  [ACTIVE]   │
    └─────────────┘
```

### Encounter State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENCOUNTER STATE MACHINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     Start Service     ┌─────────────────┐
    │  [PLANNED]  │ ─────────────────────▶│  [IN_PROGRESS]  │
    │             │                       │                 │
    └─────────────┘                       └────────┬────────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
                         ▼                         ▼                         ▼
                  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
                  │  [ON_HOLD]  │          │ [COMPLETED] │          │ [CANCELLED] │
                  │             │          │             │          │             │
                  └──────┬──────┘          └─────────────┘          └─────────────┘
                         │
                         │ Resume
                         ▼
                  ┌─────────────────┐
                  │  [IN_PROGRESS]  │
                  └─────────────────┘
```

### Order State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER STATE MACHINE                                │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐      Sign      ┌─────────┐     Accept     ┌─────────┐
    │ [DRAFT] │ ──────────────▶│[PENDING]│ ──────────────▶│ [ACTIVE]│
    │         │                │         │                │         │
    └────┬────┘                └────┬────┘                └────┬────┘
         │                          │                          │
         │ Delete                   │ Cancel                   │
         ▼                          ▼                          │
    ┌─────────┐                ┌─────────┐                     │
    │[DELETED]│                │[CANCEL] │                     │
    └─────────┘                └─────────┘                     │
                                                               │
                    ┌──────────────────────────────────────────┘
                    │
                    ▼
             ┌─────────────┐
             │[ON_HOLD]    │ ◄─────────────┐
             └──────┬──────┘               │
                    │                      │
                    │ Resume               │ Hold
                    ▼                      │
             ┌─────────────┐               │
             │  [ACTIVE]   │ ──────────────┘
             └──────┬──────┘
                    │
                    │ Complete
                    ▼
             ┌─────────────┐
             │ [COMPLETED] │
             └─────────────┘
```

---

## Component Reference

### Page Components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/kiosk` | `SelfCheckInKiosk.tsx` | Patient self-service check-in |
| `/queue` | `QueueWorkstation.tsx` | Queue management for staff |
| `/encounter/:id` | `Encounter.tsx` | Clinical encounter view |
| `/discharge` | `DischargeDashboard.tsx` | Discharge workflow management |
| `/beds` | `BedManagementPanel.tsx` | Ward/bed management |

### Context Providers

| Context | Purpose |
|---------|---------|
| `EHRContext` | Patient context, encounter state, navigation |
| `ProviderContext` | Current user, shift, workspace |
| `PatientContext` | Active patient demographics, alerts |

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useQueueManagement` | Queue operations, start service |
| `usePatientProblems` | Problem list CRUD |
| `useVitalSigns` | Vital signs recording |
| `useClinicalNotes` | Note creation, signing |
| `useMedicationReconciliation` | Medication management |
| `useOrders` | Order entry, tracking |

### Type Definitions

All core types are defined in:
- `src/types/patientCareTracker.ts` - Visit, Document types
- `src/types/ehr.ts` - Encounter, Menu types
- `src/types/patientContext.ts` - Patient context types

---

## Summary

The patient journey through Impilo is a comprehensive, auditable flow from arrival to discharge:

1. **Arrival** → Check-in creates Visit record
2. **Queue** → Patient tracked, called when ready
3. **Triage** → Acuity-based prioritization
4. **Encounter** → Full clinical documentation
5. **Orders** → Labs, imaging, medications
6. **Decision** → Admit or discharge
7. **Care** → Inpatient nursing, rounds, procedures
8. **Discharge** → Clearances, summaries, follow-up
9. **Post-Visit** → Portal access, continuity documents

Every state transition is logged, every clinical action is attributed, and the complete patient journey is preserved in the longitudinal health record.
