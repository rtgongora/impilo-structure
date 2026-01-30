# Impilo EHR/HIE Platform
## Comprehensive Requirements Specification

**Version:** 1.0  
**Date:** January 2026  
**Classification:** Technical Requirements Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Navigation & User Experience](#3-navigation--user-experience)
4. [Identity & Access Management](#4-identity--access-management)
5. [Clinical Modules](#5-clinical-modules)
6. [Operational Modules](#6-operational-modules)
7. [Registry Infrastructure](#7-registry-infrastructure)
8. [Patient Portal & PHR](#8-patient-portal--phr)
9. [Security & Trust Layer](#9-security--trust-layer)
10. [Interoperability & Standards](#10-interoperability--standards)
11. [Technical Stack](#11-technical-stack)
12. [Module Reference Tables](#12-module-reference-tables)

---

## 1. Executive Summary

### 1.1 Platform Overview

Impilo is a comprehensive, OpenHIE-compliant Health Information Exchange (HIE) and Electronic Health Record (EHR) platform designed for the Zimbabwe healthcare context. It functions as a full Enterprise Resource Planning (ERP) system with healthcare focus, integrating clinical care, operations management, and personal health records into a unified platform.

### 1.2 Key Differentiators

| Feature | Description |
|---------|-------------|
| **Facility-Sensitive UX** | UI adapts based on facility type (clinic, hospital, specialized center) |
| **Cadre-Sensitive Design** | Interface adjusts to user role (doctor, nurse, CHW, admin) |
| **Offline-First Architecture** | Full clinical documentation capability without connectivity |
| **Multi-Tenant HIE** | Supports multiple organizations with data isolation |
| **Dual-Mode Identity** | Providers can access both as clinicians AND as patients |
| **OpenHIE Compliance** | Full alignment with international health interoperability standards |

### 1.3 Target Users

| User Type | Description | Primary Access |
|-----------|-------------|----------------|
| Regulated Practitioner | Licensed healthcare providers (doctors, nurses, pharmacists) | Provider ID + Biometric |
| Unregulated Staff | Administrative, support, clerical staff | Email + Password |
| Above-Site Manager | District/Provincial/National supervisors | Email + Jurisdiction Context |
| Patient/Client | Healthcare consumers | Portal Login (Phone/Email) |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  React 19   │  │  Vite PWA   │  │  Tailwind   │  │  shadcn/ui │ │
│  │  TypeScript │  │  Offline    │  │  CSS        │  │  Radix     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Edge       │  │  PostgreSQL │  │  Realtime   │  │  Storage   │ │
│  │  Functions  │  │  + RLS      │  │  Subs       │  │  Buckets   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     REGISTRY SERVICES (OpenHIE)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  MOSIP      │  │  iHRIS/     │  │  GOFR/      │  │  OCL       │ │
│  │  Client Reg │  │  Varapi     │  │  Thuso      │  │  Terminology│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INTEROPERABILITY LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  HAPI FHIR  │  │  NDR        │  │  PACS       │  │  LIMS      │ │
│  │  SHR        │  │  National   │  │  DICOM      │  │  Lab       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Screen Layout Model

The EHR uses a fixed, immutable three-section layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TOP BAR                                     │
│  [Action & Status Layer - Facility Context, Alerts, User Menu]      │
├─────────────────────────────────────────────────────────────┬───────┤
│                                                             │       │
│                    MAIN WORK AREA                           │ RIGHT │
│                                                             │  NAV  │
│  [Current Focus Zone - One Thing at a Time]                 │       │
│  [No Split Views - Maximum Clinical Focus]                  │ Enc.  │
│                                                             │ Menu  │
│                                                             │       │
└─────────────────────────────────────────────────────────────┴───────┘
```

**Layout Rules:**
- TOP BAR: Always visible, contains facility context, alerts, user controls
- MAIN WORK AREA: Displays one focused task at a time (no split views)
- RIGHT NAV: Encounter Menu for record navigation when in clinical context

### 2.3 Context Inheritance Model

```
Organization Context
       │
       ▼
Facility Context (selected at shift start)
       │
       ▼
Department/Ward Context
       │
       ▼
Workstation Context (physical location)
       │
       ▼
Patient Context (when chart opened)
```

**Context Detection Methods:**
1. Device fingerprinting (shared workstations)
2. IP-based detection
3. GPS geolocation
4. Manual selection (personal devices)

---

## 3. Navigation & User Experience

### 3.1 Three-Tab Navigation Model

The platform is organized into three distinct, top-level navigation spaces:

| Tab | Purpose | Gate Requirement | Scope |
|-----|---------|------------------|-------|
| **WORK** | Clinical & operational tasks | Active Shift + Facility | Facility-scoped |
| **MY PROFESSIONAL** | Practice management | Active License | Cross-facility |
| **MY LIFE** | Personal health & social | Valid Registration | Personal |

### 3.2 Module Architecture by Tab

#### TAB 1: WORK (Shift-Gated)

| Category | Module | Sub-Components | Role Access |
|----------|--------|----------------|-------------|
| **Quick Access** | EHR | Patient Search, Recent Charts | Clinical |
| | Dashboard | Facility Metrics, Worklists | All |
| | Queue | Department Queues, Waiting Lists | All |
| **Clinical Care** | Encounter | SOAP Notes, Vitals, Orders | Clinical |
| | Control Tower | Bed Management, Patient Flow | Clinical + Admin |
| | Sorting | Triage, Acuity Assessment | Clinical |
| | Discharge | Summaries, Instructions | Clinical |
| **Orders & Diagnostics** | Pharmacy | Prescriptions, Dispensing | Pharm + Clinical |
| | Lab (LIMS) | Orders, Results, Panels | Lab + Clinical |
| | Imaging (PACS) | Radiology, DICOM Viewer | Rad + Clinical |
| | Orders | Central Order Management | Clinical |
| **Scheduling** | Appointments | Booking, Slots, Waitlist | All |
| | Theatre | Surgical Scheduling | Theatre Staff |
| | Resources | Equipment, Room Booking | Admin |
| | Noticeboard | Provider Schedules | All |
| **Communication** | Messages | Secure Messaging | All |
| | Calls | Video/Audio Calls | All |
| | Pages | Clinical Paging | Clinical |
| **Inpatient** | Beds | Bed Board, Assignments | Nursing + Admin |
| | Handoff | Shift Handover | Clinical |
| **Finance** | Charges | Charge Capture | Finance + Clinical |
| | Payments | Collections, Receipts | Finance |
| | Stock | Inventory Management | Pharmacy + Admin |
| | Consumables | Usage Tracking | Clinical + Admin |
| **Administration** | Reports | Analytics, Dashboards | Admin + Management |
| | Operations | Facility Operations | Admin |
| | Above-Site | District/Provincial View | Supervisors |

#### TAB 2: MY PROFESSIONAL (License-Gated)

| Category | Module | Sub-Components | Description |
|----------|--------|----------------|-------------|
| **Dashboard** | Overview | Alerts, Tasks, Metrics | Role-adaptive summary |
| **Affiliations** | Facilities | Multi-facility management | Start/end shifts |
| | Organizations | Org memberships | Cross-org access |
| **My Patients** | Global Panel | All assigned patients | Cross-facility view |
| | Care Teams | Team assignments | Collaboration |
| **Schedule** | Calendar | Personal schedule | Appointments, shifts |
| | On-Call | On-call roster | Coverage management |
| **Credentials** | CPD Tracker | Continuing education | Points, certificates |
| | Licenses | License status | Renewal tracking |
| | Training | Impilo Fundo (LMS) | Courses, pathways |
| **Integrations** | Email | Professional email | MoHCC/Provider mail |
| | Landela DMS | Document management | Notifications |

#### TAB 3: MY LIFE (Registration-Gated)

| Category | Module | Sub-Components | Description |
|----------|--------|----------------|-------------|
| **My Health** | Timeline | Health events | Longitudinal view |
| | Medications | Active prescriptions | Refill tracking |
| | Wallet | Health payments | Transactions |
| | Consent | Privacy controls | Data sharing |
| | SOS | Emergency contacts | Crisis resources |
| **Social Hub** | Communities | Health groups | Peer support |
| | Campaigns | Crowdfunding | Medical fundraising |
| | Feed | Social timeline | Posts, updates |

### 3.3 Facility Capability Sensitivity

The UI dynamically adapts based on facility type and service catalog:

```typescript
interface FacilityCapability {
  facility_type: 'clinic' | 'hospital' | 'specialized_center';
  level_of_care: 1 | 2 | 3 | 4;
  service_catalog: string[]; // Available services
  available_workspaces: string[]; // Enabled workspaces
  care_pathways: string[]; // Supported pathways
}
```

**Example Filtering:**
- ICU Workspace → Only Level 3+ hospitals
- Theatre Booking → Only facilities with 'surgical_services'
- Chemotherapy Pathway → Only oncology centers

---

## 4. Identity & Access Management

### 4.1 Authentication Pathways

| Pathway | Risk Level | Target Users | Method |
|---------|------------|--------------|--------|
| Provider ID & Biometric | Low | Licensed clinicians | UPID + Fingerprint/Face/Iris |
| Patient Portal | Low | Healthcare consumers | Phone/Email + Password |
| Staff Email | Medium | Unregulated staff | Email + Password |
| System Maintenance | High | Platform admins | Hidden URL + Strong Auth |

**System Maintenance Access:**
- Hidden by default
- Access via: `/auth?mode=maintenance` or keyboard shortcut
- Requires elevated credentials

### 4.2 Identity Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    IDENTITY SOURCES                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  CLIENT REGISTRY │  PROVIDER REG   │  FACILITY REGISTRY          │
│  (MOSIP)         │  (iHRIS/Varapi) │  (GOFR/Thuso)               │
├─────────────────┼─────────────────┼─────────────────────────────┤
│  Health ID      │  UPID           │  Facility Code               │
│  National ID    │  License #      │  DHIS2 OU                    │
│  Demographics   │  Cadre          │  Service Catalog             │
│  Relationships  │  Affiliations   │  Hierarchy                   │
└─────────────────┴─────────────────┴─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IMPILO IDENTITY                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Composite ID = Client Registry ID + SHR ID             │    │
│  │  CPID (Clinical Pseudonym) for care context             │    │
│  │  CRID (Registry ID) for administrative context          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Session & Shift Model

```
Login
   │
   ▼
Eligibility Verification (HPR check)
   │
   ▼
Facility Selection (from authorized affiliations)
   │
   ▼
Workspace Selection (Department/Ward/Station)
   │
   ▼
Start Shift ─────────────────────────────────────────┐
   │                                                  │
   ▼                                                  │
ACTIVE SESSION                                        │
   │                                                  │
   ├── Clinical Work (facility-scoped)                │
   │                                                  │
   ├── Critical Event Override (if triggered)        │
   │                                                  │
   ▼                                                  │
End Shift                                             │
   │                                                  │
   ▼                                                  │
Handoff Reconciliation (verify no orphaned tasks) ◄──┘
```

### 4.4 Role-Based Access Control (RBAC)

**User Roles:**

| Role | Description | Clinical Access | Admin Access |
|------|-------------|-----------------|--------------|
| `user` | Basic platform access | Read-only | None |
| `clinician` | Licensed practitioner | Full clinical | None |
| `admin` | Facility administrator | View | Full |
| `registrar` | Registry management | None | Registry only |
| `hie_admin` | HIE administrator | View | Cross-facility |
| `dev_tester` | Development/testing | Bypass all | Bypass all |

**Access Gating Layers:**

| Layer | Requirement | Blocks Access To |
|-------|-------------|------------------|
| Registration | Valid UPID | All platform features |
| License | Active license | MY PROFESSIONAL tab |
| Shift | Active shift at facility | WORK tab clinical functions |

### 4.5 Professional Standing Gates

```typescript
interface ProfessionalStanding {
  has_valid_registration: boolean;  // Gate: MY LIFE
  has_active_license: boolean;      // Gate: MY PROFESSIONAL
  has_active_shift: boolean;        // Gate: WORK (clinical)
  license_expiry?: Date;
  suspension_status?: 'none' | 'pending' | 'suspended';
}
```

---

## 5. Clinical Modules

### 5.1 Encounter Management

#### 5.1.1 Visit-Anchored Model

```
PATIENT
   │
   └── VISIT (longitudinal episode)
          │
          ├── ENCOUNTER 1 (ED Triage)
          │      ├── Vital Signs
          │      ├── Triage Assessment
          │      └── Queue Assignment
          │
          ├── ENCOUNTER 2 (Physician Consult)
          │      ├── History
          │      ├── Examination
          │      ├── Clinical Notes (SOAP)
          │      ├── Orders
          │      └── Care Plan
          │
          ├── ENCOUNTER 3 (Lab/Imaging)
          │      └── Results
          │
          └── ENCOUNTER 4 (Discharge)
                 ├── Discharge Summary
                 ├── Prescriptions
                 └── Follow-up Instructions
```

#### 5.1.2 Encounter Tabs

| Tab | Purpose | Components |
|-----|---------|------------|
| **Overview** | Patient summary | Demographics, Allergies, Active Problems |
| **Notes** | Clinical documentation | SOAP Notes, History, Examination |
| **Care** | Care planning | Care Plans, Goals, Interventions |
| **Problems** | Problem list | Active/Resolved conditions, Principal Dx |
| **Review & Sign** | Finalization | Results review, Digital signature |

### 5.2 Clinical Documentation

#### 5.2.1 Vital Signs

```typescript
interface VitalSign {
  id: string;
  patient_id: string;
  encounter_id: string;
  recorded_at: Date;
  recorded_by: string;
  
  // Core vitals
  temperature?: { value: number; unit: 'C' | 'F'; site?: string };
  heart_rate?: { value: number; rhythm?: string };
  blood_pressure?: { systolic: number; diastolic: number; position?: string };
  respiratory_rate?: { value: number };
  oxygen_saturation?: { value: number; on_oxygen?: boolean; flow_rate?: number };
  
  // Extended vitals
  weight?: { value: number; unit: 'kg' | 'lb' };
  height?: { value: number; unit: 'cm' | 'in' };
  bmi?: number;
  pain_score?: { value: number; scale: 'NRS' | 'VAS' | 'FACES' };
  glasgow_coma_score?: { eye: number; verbal: number; motor: number; total: number };
}
```

#### 5.2.2 Clinical Notes (SOAP)

```typescript
interface ClinicalNote {
  id: string;
  patient_id: string;
  encounter_id: string;
  note_type: 'SOAP' | 'Progress' | 'Procedure' | 'Consult';
  
  subjective?: string;      // Chief complaint, HPI, ROS
  objective?: string;       // Physical exam, vitals, results
  assessment?: string;      // Diagnoses, clinical impression
  plan?: string;            // Treatment plan, orders, follow-up
  
  authored_by: string;
  authored_at: Date;
  co_signers?: string[];
  
  is_signed: boolean;
  signed_at?: Date;
  signed_by?: string;
  
  is_addendum: boolean;
  parent_note_id?: string;
}
```

#### 5.2.3 Problem List

```typescript
interface PatientProblem {
  id: string;
  patient_id: string;
  
  // Terminology
  code: string;              // ICD-11 code
  code_system: 'ICD-11' | 'SNOMED-CT' | 'LOCAL';
  display_name: string;
  
  // Classification
  status: 'active' | 'resolved' | 'inactive' | 'recurrence';
  is_chronic: boolean;
  is_principal_diagnosis: boolean;
  
  // Timeline
  onset_date?: Date;
  recorded_date: Date;
  abatement_date?: Date;
  
  // Clinical context
  severity?: 'mild' | 'moderate' | 'severe';
  verification_status: 'confirmed' | 'provisional' | 'differential' | 'refuted';
  
  // Authorship
  recorded_by: string;
  verified_by?: string;
}
```

#### 5.2.4 Allergies

```typescript
interface PatientAllergy {
  id: string;
  patient_id: string;
  
  // Allergen
  allergen_type: 'medication' | 'food' | 'environmental' | 'other';
  allergen_code?: string;    // RxNorm, SNOMED
  allergen_display: string;
  
  // Reaction
  reaction_type?: 'allergy' | 'intolerance' | 'adverse_reaction';
  manifestations?: string[]; // Rash, anaphylaxis, etc.
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  
  // Status
  status: 'active' | 'inactive' | 'resolved' | 'refuted';
  verification_status: 'confirmed' | 'unconfirmed' | 'entered-in-error';
  
  // Context
  onset_date?: Date;
  recorded_date: Date;
  recorded_by: string;
  verified_by?: string;
  source?: 'patient' | 'family' | 'provider' | 'external';
}
```

### 5.3 Orders Management

#### 5.3.1 Order Types

| Order Type | Target System | Workflow |
|------------|---------------|----------|
| Medication | Pharmacy | Prescribe → Verify → Dispense |
| Laboratory | LIMS | Order → Collect → Process → Result |
| Imaging | PACS | Order → Schedule → Perform → Report |
| Procedure | Theatre/Procedure | Order → Schedule → Consent → Perform |
| Consult | Referral | Order → Accept → Consult → Report |
| Diet | Dietary | Order → Prepare → Deliver |
| Activity | Nursing | Order → Implement → Document |

#### 5.3.2 Order Lifecycle

```
DRAFT
   │
   ▼
PENDING_SIGNATURE ──► SIGNED
                         │
                         ▼
               PENDING_VERIFICATION (if required)
                         │
                         ▼
                      ACTIVE
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
IN_PROGRESS         SCHEDULED            ON_HOLD
    │                    │                    │
    ▼                    ▼                    │
COMPLETED ◄──────────────┘                    │
    │                                         │
    └─────────────────────────────────────────┘
                         │
                         ▼
                    CANCELLED
```

### 5.4 Workspaces

Workspaces are specialized clinical environments that adapt the UI for specific care contexts.

#### 5.4.1 Physical Workspaces

| Workspace | Description | Facility Requirement |
|-----------|-------------|---------------------|
| Emergency | ED workflow | ED service |
| ICU | Intensive care | Level 3+ |
| Theatre | Surgical suite | Theatre service |
| Labor & Delivery | Maternity | Maternity service |
| Outpatient | Clinic workflow | Any |
| Ward | Inpatient nursing | Inpatient beds |

#### 5.4.2 Critical Event Workspaces

Triggered during emergencies, with override behavior:

```typescript
interface CriticalEvent {
  id: string;
  event_type: 'CODE_BLUE' | 'TRAUMA' | 'STROKE' | 'STEMI' | 'SEPSIS' | 'MH';
  triggered_at: Date;
  triggered_by: string;
  location: string;
  patient_id?: string;
  
  // Override behavior
  normal_nav_hidden: boolean;        // True - deemphasize normal nav
  high_contrast_mode: boolean;       // True - emergency colors
  simplified_controls: boolean;      // True - large buttons
  increased_autosave: boolean;       // True - every 30s
  requires_explicit_termination: boolean; // True - no auto-close
}
```

**Critical Event Activation Captures:**
- Event type
- Timestamp
- Triggering user
- Location (facility, ward, room)
- Trigger reason
- No confirmation dialogs (immediate activation)

### 5.5 Results Management

#### 5.5.1 Results Review Panel

```typescript
interface ResultItem {
  id: string;
  order_id: string;
  patient_id: string;
  
  result_type: 'lab' | 'imaging' | 'pathology' | 'procedure';
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  
  // Interpretation
  is_abnormal: boolean;
  is_critical: boolean;
  abnormal_flags?: string[];
  
  // Acknowledgment
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  
  // Values
  components: ResultComponent[];
}

interface ResultComponent {
  code: string;
  display: string;
  value: string | number;
  unit?: string;
  reference_range?: string;
  interpretation?: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
}
```

#### 5.5.2 Results Workflow

```
Result Received
       │
       ▼
Abnormal/Critical? ──► Yes ──► Alert Ordering Clinician
       │                              │
       No                             │
       │                              ▼
       ▼                     Review Required
       │                              │
Results Available ◄───────────────────┘
       │
       ▼
Clinician Reviews
       │
       ▼
Acknowledge Result
       │
       ▼
Document Response (if needed)
       │
       ▼
Update Care Plan
```

---

## 6. Operational Modules

### 6.1 Queue Management System (QMS)

#### 6.1.1 Queue Architecture

```typescript
interface QueueDefinition {
  id: string;
  name: string;
  department: string;
  facility_id: string;
  
  // Configuration
  queue_type: 'fifo' | 'priority' | 'appointment';
  max_capacity?: number;
  estimated_service_time: number; // minutes
  
  // Business rules
  auto_assign_enabled: boolean;
  requires_check_in: boolean;
  allows_remote_entry: boolean;
}

interface QueueItem {
  id: string;
  queue_id: string;
  patient_id: string;
  
  // Tracking
  status: 'waiting' | 'called' | 'in_service' | 'completed' | 'no_show';
  position: number;
  priority: 'stat' | 'urgent' | 'routine';
  
  // Timestamps
  entered_at: Date;
  called_at?: Date;
  service_started_at?: Date;
  service_completed_at?: Date;
  
  // Assignment
  assigned_to?: string;
  service_point?: string;
}
```

#### 6.1.2 Queue-to-Encounter Bridge

When a practitioner "Attends" a queue item:

1. Create or link an Encounter
2. Set encounter status to "in_progress"
3. Update queue item to "in_service"
4. Open clinical context for patient

#### 6.1.3 PII Protection in Queues

```typescript
interface PIIMasking {
  // Default: masked in worklists
  masked_name: string;      // "J*** D**"
  masked_mrn: string;       // "****5678"
  
  // Reveal on demand
  reveal_requested_by?: string;
  reveal_reason?: string;
  reveal_expires_at?: Date;
  
  // Audit
  reveal_logged: boolean;
}
```

### 6.2 Bed Management

#### 6.2.1 Bed States

```
AVAILABLE
    │
    ▼
RESERVED ──► CLEANING ──► AVAILABLE
    │
    ▼
OCCUPIED
    │
    ├── TRANSFER_PENDING
    │
    └── DISCHARGE_PENDING ──► CLEANING
```

#### 6.2.2 Bed Board Data

```typescript
interface Bed {
  id: string;
  ward_id: string;
  bed_number: string;
  
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'blocked';
  
  // Current occupant (if occupied)
  patient_id?: string;
  admission_date?: Date;
  attending_physician?: string;
  acuity_level?: 'low' | 'medium' | 'high' | 'critical';
  diagnosis?: string;
  
  // Reservation (if reserved)
  reserved_for?: string;
  reservation_expires?: Date;
}
```

### 6.3 Stock Management

#### 6.3.1 Inventory Model

```typescript
interface StockItem {
  id: string;
  facility_id: string;
  
  // Product
  product_code: string;
  product_name: string;
  category: string;
  
  // Quantities
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number; // on_hand - reserved
  
  // Thresholds
  reorder_level: number;
  maximum_level: number;
  
  // Tracking
  batch_number?: string;
  expiry_date?: Date;
  location?: string;
  
  // Valuation
  unit_cost: number;
  total_value: number;
}
```

#### 6.3.2 Stock Transactions

| Transaction Type | Effect on Quantity |
|-----------------|-------------------|
| Receipt | +quantity |
| Issue | -quantity |
| Transfer Out | -quantity |
| Transfer In | +quantity |
| Adjustment | ±quantity |
| Write-off | -quantity |
| Return | +quantity |

### 6.4 Consumables & Charges

#### 6.4.1 Consumable Capture

Consumables are captured ONLY within Workspaces or Critical Events:

```typescript
interface ConsumableUsage {
  id: string;
  encounter_id: string;
  workspace_id?: string;
  critical_event_id?: string;
  
  product_id: string;
  quantity: number;
  unit_of_measure: string;
  
  // Billing
  is_billable: boolean;
  charge_code?: string;
  unit_price?: number;
  total_charge?: number;
  
  // Tracking
  recorded_by: string;
  recorded_at: Date;
  verified_by?: string;
}
```

#### 6.4.2 Charge Generation

Charges are auto-generated from:
- Orders (medications, labs, imaging)
- Procedures
- Workspace activities
- Consumable usage
- Bed days

Charges are displayed as **read-only summaries** to clinicians.

### 6.5 Discharge Management

#### 6.5.1 Discharge Outcomes

| Outcome | Description | Required Documentation |
|---------|-------------|----------------------|
| Routine | Standard discharge | Discharge summary, instructions |
| DAMA | Discharged Against Medical Advice | DAMA form, witness signature |
| Transfer | Transfer to another facility | Transfer summary, referral |
| Death | Patient expired | Death summary, notification |

#### 6.5.2 Discharge Workflow

```
Discharge Initiated
        │
        ▼
Pending Clearances
        │
    ┌───┼───┬───────┬───────┐
    ▼   ▼   ▼       ▼       ▼
  Nursing  Pharmacy  Finance  Social Work
    │   │   │       │       │
    └───┴───┴───────┴───────┘
                │
                ▼
       All Clearances Complete
                │
                ▼
       Generate Discharge Summary
                │
                ▼
       Patient Education
                │
                ▼
       Complete Discharge
                │
                ▼
       Update Visit Record
                │
                ▼
       Release Bed
```

---

## 7. Registry Infrastructure

### 7.1 Client Registry

**Authority:** National Health ID Registry  
**External System:** MOSIP  
**Local Table:** `client_registry`

#### 7.1.1 Client Registry Fields

```typescript
interface ClientRegistryRecord {
  id: string;                    // Internal UUID
  health_id: string;             // Unique Health ID with Luhn check
  
  // Demographics
  given_names: string;
  family_name: string;
  date_of_birth: Date;
  sex: 'male' | 'female' | 'other' | 'unknown';
  
  // Identifiers (crosswalk)
  national_id?: string;
  passport?: string;
  facility_mrns: Record<string, string>; // facility_id -> MRN
  
  // Contact
  phone?: string;
  email?: string;
  address?: Address;
  
  // Lifecycle
  status: 'active' | 'inactive' | 'deceased' | 'merged';
  merged_into?: string;          // If merged, points to surviving record
  
  // Relationships
  relationships: Relationship[]; // e.g., mother-child
}
```

#### 7.1.2 Matching Algorithm

1. **Deterministic Match:** Exact match on National ID or Health ID
2. **Probabilistic Match:** Weighted scoring on:
   - Name (phonetic + edit distance)
   - Date of birth
   - Sex
   - Phone number
   - Address

3. **Duplicate Resolution:** Human-reviewed queue for uncertain matches

### 7.2 Provider Registry

**Authority:** Health Provider Registry (HPR)  
**External System:** iHRIS / Varapi  
**Local Table:** `health_providers`

#### 7.2.1 Provider Registry Fields

```typescript
interface HealthProvider {
  id: string;
  upid: string;                  // Unique Provider ID
  
  // Identity
  given_names: string;
  family_name: string;
  national_id?: string;
  
  // Professional
  cadre: string;                 // doctor, nurse, pharmacist, etc.
  specialties: string[];
  
  // Licensing
  licenses: ProviderLicense[];
  primary_license_id?: string;
  
  // Status
  status: 'active' | 'inactive' | 'suspended' | 'retired';
  eligibility_status: 'eligible' | 'restricted' | 'ineligible';
  
  // Affiliations
  affiliations: FacilityAffiliation[];
  
  // User link
  user_id?: string;              // Link to auth user
}

interface ProviderLicense {
  id: string;
  council_id: string;            // Regulatory council
  registration_number: string;
  issue_date: Date;
  expiry_date?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
}

interface FacilityAffiliation {
  facility_id: string;
  role: string;
  department?: string;
  start_date: Date;
  end_date?: Date;
  is_primary: boolean;
}
```

### 7.3 Facility Registry

**Authority:** Master Facility List  
**External System:** GOFR / Thuso  
**Local Table:** `facilities`

#### 7.3.1 Facility Registry Fields

```typescript
interface Facility {
  id: string;
  facility_code: string;         // National facility code
  
  // Identity
  name: string;
  short_name?: string;
  
  // Classification
  facility_type: string;
  ownership: 'public' | 'private' | 'mission' | 'ngo';
  level_of_care: 1 | 2 | 3 | 4;
  
  // Hierarchy
  parent_id?: string;
  administrative_hierarchy: {
    province: string;
    district: string;
    ward?: string;
  };
  
  // Location
  geo_coordinates?: { lat: number; lng: number };
  physical_address?: string;
  
  // Capabilities
  service_catalog: string[];     // Available services
  available_workspaces: string[];
  care_pathways: string[];
  
  // Identifiers (crosswalk)
  dhis2_ou_id?: string;
  legacy_code?: string;
  
  // Status
  status: 'active' | 'inactive' | 'closed';
}
```

### 7.4 Terminology Service

**External System:** OCL (Open Concept Lab)

#### 7.4.1 Supported Terminologies

| Code System | Use Case | Version |
|-------------|----------|---------|
| ICD-11 | Diagnoses, mortality | 2024 |
| SNOMED-CT | Clinical terms | International |
| LOINC | Lab observations | 2.77 |
| RxNorm | Medications (mapped) | Current |
| ATC | Drug classification | 2024 |
| CVX | Vaccines | Current |
| CPT | Procedures | 2024 |

---

## 8. Patient Portal & PHR

### 8.1 Portal Architecture

**Route:** `/portal`  
**Access:** Patient Login (Phone/Email + Password)

#### 8.1.1 Portal Modules

| Module | Description | Features |
|--------|-------------|----------|
| **Home** | Dashboard | Appointments, Medications, Alerts |
| **My Records** | PHR Hub | IPS, Documents, Export |
| **Appointments** | Scheduling | Book, Reschedule, Cancel |
| **Medications** | Rx Tracking | Active prescriptions, Refills |
| **Telehealth** | Virtual Care | Video, Audio, Chat |
| **Wallet** | Payments | Balance, Transactions, Pay bills |
| **Consent** | Privacy | Data sharing controls |
| **SOS** | Emergency | Contacts, Crisis resources |

### 8.2 My Records (PHR Hub)

#### 8.2.1 PHR Components

```typescript
// Components in src/components/portal/modules/phr/

export { PortalPHRHub } from "./PortalPHRHub";
export { IPSViewer } from "./IPSViewer";
export { ConditionsList } from "./ConditionsList";
export { ImmunizationRecords } from "./ImmunizationRecords";
export { AllergyList } from "./AllergyList";
export { ClinicalDocuments } from "./ClinicalDocuments";
export { HealthDataExport } from "./HealthDataExport";
```

#### 8.2.2 IPS (International Patient Summary)

HL7 FHIR R4 compliant longitudinal summary:

| Section | Content | FHIR Resource |
|---------|---------|---------------|
| Allergies | Active allergies | AllergyIntolerance |
| Medications | Current medications | MedicationStatement |
| Problems | Active conditions | Condition |
| Immunizations | Vaccination history | Immunization |
| Results | Recent lab results | Observation |
| Procedures | Significant procedures | Procedure |

#### 8.2.3 Health Data Export

| Format | Use Case | Standard |
|--------|----------|----------|
| PDF | Human-readable summary | Custom template |
| FHIR Bundle | Machine-readable exchange | HL7 FHIR R4 |
| C-CDA | Legacy interop | HL7 CDA R2 |

### 8.3 Telehealth

#### 8.3.1 Call Types

| Type | Technology | Use Case |
|------|------------|----------|
| Video | WebRTC | Full consultation |
| Audio | WebRTC | Voice-only consultation |
| Chat | Real-time messaging | Async communication |

#### 8.3.2 Session Model

```typescript
interface TelehealthSession {
  id: string;
  patient_id: string;
  provider_id: string;
  
  session_type: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  
  scheduled_start: Date;
  actual_start?: Date;
  actual_end?: Date;
  
  // Recording
  is_recorded: boolean;
  recording_consent_given: boolean;
  recording_path?: string;
  
  // Linked encounter
  encounter_id?: string;
}
```

### 8.4 Consent Management

#### 8.4.1 Consent Model

```typescript
interface ConsentRecord {
  id: string;
  patient_id: string;
  
  // Scope
  consent_type: 'data_sharing' | 'treatment' | 'research' | 'marketing';
  scope: 'all' | 'specific';
  specific_data_types?: string[];
  
  // Parties
  grantor: string;               // Patient or guardian
  grantee: string;               // Provider, facility, or system
  
  // Validity
  status: 'active' | 'revoked' | 'expired';
  granted_at: Date;
  expires_at?: Date;
  revoked_at?: Date;
  
  // Purpose
  purpose: string;
  purpose_code?: string;         // FHIR Purpose of Use
}
```

---

## 9. Security & Trust Layer

### 9.1 Trust Layer Architecture

The Trust Layer is a 4-phase security architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: IDENTITY RESOLUTION                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ID Mint "Black Box"                                     │    │
│  │  - Maps internal IDs to pseudonyms                       │    │
│  │  - CPID (Clinical Pseudonym) for care context           │    │
│  │  - CRID (Registry ID) for admin context                 │    │
│  │  - Anti-enumeration protection                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: TOKENIZATION                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Dual-IdP Model                                          │    │
│  │  - Keycloak (provider tokens)                           │    │
│  │  - eSignet (client tokens)                              │    │
│  │  - Token claims include: UPID, cadre, privileges        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3: POLICY ENFORCEMENT                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ABAC Policy Decision Point (PDP)                        │    │
│  │  - Attribute-based access control                       │    │
│  │  - Context-aware decisions                              │    │
│  │  - Real-time eligibility checks                         │    │
│  │  Policy Enforcement Point (PEP)                          │    │
│  │  - Frontend guards                                       │    │
│  │  - API middleware                                        │    │
│  │  - RLS policies                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 4: AUDIT & PROVENANCE                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Comprehensive Audit Logging                             │    │
│  │  - All access events                                     │    │
│  │  - PII reveal events                                     │    │
│  │  - Break-the-glass events                               │    │
│  │  - Consent changes                                       │    │
│  │  Immutable audit trail                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Trust Layer Services

```typescript
// src/services/trustLayer/index.ts

export { IdMintService } from './idMintService';
export { ConsentService } from './consentService';
export { PolicyService } from './policyService';
export { AuditService } from './auditService';
export { OfflineService } from './offlineService';
```

### 9.3 Identity Provider (IdP) Service

#### 9.3.1 Authorization Flow

```typescript
// From src/services/idpService.ts

interface AuthorizationResult {
  authorized: boolean;
  provider: HealthProvider | null;
  eligibility: EligibilityResponse | null;
  claims: Partial<IdPTokenClaims> | null;
  denialReasons: string[];
}

// Authorization steps:
// 1. Authenticate user (Supabase Auth)
// 2. Retrieve linked UPID (provider registry)
// 3. Call HPR Eligibility API
// 4. Evaluate policy rules
// 5. Return authorization result with claims
```

#### 9.3.2 Token Claims

```typescript
interface IdPTokenClaims {
  sub: string;              // User ID
  provider_id: string;      // UPID
  cadre: string;
  roles: string[];
  privileges: string[];
  facility_scope: string[];
  license_expiry: string | null;
  iat: number;
  exp: number;
}
```

### 9.4 Access Control

#### 9.4.1 Row Level Security (RLS)

All clinical tables implement RLS policies:

```sql
-- Example: Patients table
CREATE POLICY "providers_view_assigned_patients"
ON patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM provider_patient_assignments
    WHERE provider_id = auth.uid()
    AND patient_id = patients.id
  )
);
```

#### 9.4.2 Break-the-Glass

Emergency access override with mandatory audit:

```typescript
interface BreakTheGlassEvent {
  id: string;
  user_id: string;
  patient_id: string;
  
  reason: 'emergency' | 'continuity_of_care' | 'public_health';
  justification: string;
  
  access_granted_at: Date;
  access_expires_at: Date;
  
  // Audit
  supervisor_notified: boolean;
  review_required: boolean;
  reviewed_by?: string;
  reviewed_at?: Date;
}
```

### 9.5 PII Protection

```typescript
// usePIIProtection hook

interface PIIProtectionConfig {
  // Default masked fields
  masked_fields: ['name', 'mrn', 'dob', 'phone', 'address'];
  
  // Reveal settings
  reveal_duration: 300; // seconds
  require_reason: true;
  
  // Audit
  log_all_reveals: true;
}

// Usage in components
const { 
  getMaskedValue, 
  revealValue, 
  isRevealed 
} = usePIIProtection();
```

### 9.6 Offline Security

#### 9.6.1 Offline Trust Model

```typescript
interface OfflineSession {
  // Provisioned identity
  o_cpid: string;             // Offline Clinical Pseudonym ID
  provisioned_at: Date;
  expires_at: Date;
  
  // Cached credentials
  provider_id: string;
  facility_id: string;
  privileges: string[];
  
  // Sync queue
  pending_operations: OfflineOperation[];
  
  // Reconciliation
  reconciled: boolean;
  reconciled_at?: Date;
}
```

#### 9.6.2 Offline Reconciliation

On reconnection:
1. Validate offline session was within expiry
2. Verify provider eligibility is still valid
3. Map O-CPIDs to permanent CPIDs
4. Apply pending operations with conflict resolution
5. Audit all offline activity

---

## 10. Interoperability & Standards

### 10.1 Data Standards

| Standard | Domain | Usage |
|----------|--------|-------|
| HL7 FHIR R4 | Clinical data exchange | Primary standard |
| IPS | Patient summary | Continuity of care |
| C-CDA | Document exchange | Legacy compatibility |
| DICOM | Medical imaging | PACS integration |
| HL7 v2.x | Lab messaging | LIMS integration |

### 10.2 Code Systems

| Code System | Domain | Examples |
|-------------|--------|----------|
| ICD-11 | Diagnoses | 5A11 Hypertension |
| SNOMED-CT | Clinical terms | 38341003 Hypertension |
| LOINC | Lab observations | 2160-0 Creatinine |
| RxNorm | Medications | 197361 Amlodipine |
| ATC | Drug classification | C08CA01 Amlodipine |
| CVX | Vaccines | 207 COVID-19 vaccine |
| CPT | Procedures | 99213 Office visit |

### 10.3 Document Types

| Document | Standard | Use Case |
|----------|----------|----------|
| IPS | FHIR Bundle | Cross-border exchange |
| Discharge Summary | FHIR DocumentReference | Care transition |
| Referral | FHIR ServiceRequest | Specialist referral |
| Lab Report | FHIR DiagnosticReport | Results communication |
| Prescription | FHIR MedicationRequest | Pharmacy communication |

### 10.4 Integration Points

#### 10.4.1 External Systems

| System | Protocol | Direction |
|--------|----------|-----------|
| MOSIP | REST API | Bidirectional |
| iHRIS | REST API | Read |
| GOFR | REST API | Read |
| HAPI FHIR | FHIR R4 | Bidirectional |
| DHIS2 | REST API | Write |
| PACS | DICOM/DICOMweb | Bidirectional |
| LIMS | HL7 v2.x | Bidirectional |
| Odoo | REST API | Bidirectional |

#### 10.4.2 Integration Patterns

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Impilo     │────►│ Edge Function│────►│  External    │
│   Frontend   │     │  (Adapter)   │     │   System     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Audit Log  │
                     └──────────────┘
```

---

## 11. Technical Stack

### 11.1 Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 19.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| Tailwind CSS | Styling | 3.x |
| shadcn/ui | Component Library | Latest |
| Radix UI | Primitives | Latest |
| Framer Motion | Animations | 12.x |
| TanStack Query | Data Fetching | 5.x |
| React Router | Routing | 6.x |
| React Hook Form | Forms | 7.x |
| Zod | Validation | 3.x |

### 11.2 Backend

| Technology | Purpose | Provider |
|------------|---------|----------|
| PostgreSQL | Database | Supabase |
| Row Level Security | Access Control | Supabase |
| Edge Functions | Serverless Functions | Supabase (Deno) |
| Realtime | WebSocket Subscriptions | Supabase |
| Storage | File Storage | Supabase |
| Auth | Authentication | Supabase Auth |

### 11.3 PWA Configuration

```typescript
// vite-plugin-pwa configuration
{
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
}
```

### 11.4 Design Tokens

```css
/* Core semantic tokens from index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --critical: 0 100% 50%;
  /* ... additional tokens */
}
```

### 11.5 Typography

| Font | Use Case | Weight |
|------|----------|--------|
| Work Sans | Headings, UI | 400-700 |
| Inconsolata | Code, IDs | 400-700 |
| Lora | Long-form text | 400-700 |

---

## 12. Module Reference Tables

### 12.1 Complete Module Inventory

#### TAB 1: WORK - Clinical & Operational

| Category | Module | Route | Icon | Description | Role Access |
|----------|--------|-------|------|-------------|-------------|
| Quick Access | EHR | /encounter | FileHeart | Patient chart access | Clinical |
| Quick Access | Dashboard | /dashboard | LayoutDashboard | Facility metrics | All |
| Quick Access | Queue | /queue | Users | Department queues | All |
| Clinical Care | Control Tower | /patients | Monitor | Patient flow management | Clinical + Admin |
| Clinical Care | Sorting | /sorting | ArrowUpDown | Triage/acuity | Clinical |
| Clinical Care | Discharge | /discharge | DoorOpen | Discharge workflow | Clinical |
| Orders | Pharmacy | /pharmacy | Pill | Prescriptions, dispensing | Pharmacy + Clinical |
| Orders | Lab (LIMS) | /lims | FlaskConical | Lab orders, results | Lab + Clinical |
| Orders | Imaging (PACS) | /pacs | ScanLine | Radiology, DICOM | Radiology + Clinical |
| Orders | Orders Hub | /orders | ClipboardList | Central order view | Clinical |
| Scheduling | Appointments | /appointments | Calendar | Booking, slots | All |
| Scheduling | Theatre | /scheduling/theatre | Timer | Surgical scheduling | Theatre |
| Scheduling | Resources | /scheduling/resources | Layers | Equipment, rooms | Admin |
| Scheduling | Noticeboard | /scheduling/noticeboard | Bell | Provider schedules | All |
| Communication | Messages | /communication?tab=messages | MessageSquare | Secure messaging | All |
| Communication | Calls | /communication?tab=calls | Phone | Video/audio calls | All |
| Communication | Pages | /communication?tab=pages | BellRing | Clinical paging | Clinical |
| Inpatient | Beds | /beds | Bed | Bed board | Nursing + Admin |
| Inpatient | Handoff | /handoff | ArrowRightLeft | Shift handover | Clinical |
| Finance | Charges | /charges | DollarSign | Charge capture | Finance + Clinical |
| Finance | Payments | /payments | CreditCard | Collections | Finance |
| Finance | Stock | /stock | Package | Inventory | Pharmacy + Admin |
| Finance | Consumables | /consumables | Boxes | Usage tracking | Clinical + Admin |
| Admin | Reports | /reports | BarChart3 | Analytics | Admin + Management |
| Admin | Operations | /operations | Settings2 | Facility ops | Admin |
| Admin | Above-Site | /above-site | Globe | District/Provincial | Supervisors |
| Registry | HPR | /hpr | UserCog | Provider registry | Registry Admin |
| Registry | Facility | /facility-registry | Building2 | Facility registry | Registry Admin |
| Registry | Client | /client-registry | Users2 | Client registry | Registry Admin |
| Integration | Odoo | /odoo | Box | ERP integration | Admin |
| Integration | Telemedicine | /telemedicine | Video | Virtual care | Clinical |

#### TAB 2: MY PROFESSIONAL - Practice Management

| Category | Module | Component | Description |
|----------|--------|-----------|-------------|
| Dashboard | Overview | ProfessionalDashboard | Role-adaptive summary |
| Dashboard | Alerts | AlertsPanel | Pending items, renewals |
| Affiliations | Facilities | FacilityAffiliations | Multi-facility management |
| Affiliations | Shift Control | ShiftManager | Start/end shifts |
| My Patients | Global Panel | PatientPanel | Cross-facility patients |
| My Patients | Care Teams | CareTeamView | Team assignments |
| Schedule | Calendar | ProviderSchedule | Personal schedule |
| Schedule | On-Call | OnCallRoster | Coverage management |
| Credentials | CPD Tracker | CPDTracker | Points, activities |
| Credentials | Licenses | LicenseStatus | Renewal tracking |
| Credentials | Training | TrainingPortal | Impilo Fundo LMS |
| Integrations | Email | ProfessionalEmail | MoHCC/Provider mail |
| Integrations | DMS | LandelaIntegration | Document notifications |

#### TAB 3: MY LIFE - Personal Health Records

| Category | Module | Component | Description |
|----------|--------|-----------|-------------|
| My Health | Timeline | HealthTimeline | Longitudinal events |
| My Health | Medications | MedicationTracker | Active Rx, refills |
| My Health | Wallet | HealthWallet | Payments, balance |
| My Health | Consent | ConsentDashboard | Privacy controls |
| My Health | SOS | EmergencyHub | Crisis resources |
| Social Hub | Communities | CommunityList | Health groups |
| Social Hub | Campaigns | CrowdfundingHub | Medical fundraising |
| Social Hub | Feed | SocialFeed | Posts, updates |

### 12.2 Route Configuration

```typescript
// From src/App.tsx - Key routes

const routes = [
  // Public
  { path: "/auth", element: <Auth /> },
  { path: "/portal", element: <Portal /> },
  { path: "/kiosk", element: <Kiosk /> },
  
  // Protected - Clinical
  { path: "/", element: <ModuleHome /> },
  { path: "/encounter", element: <Encounter /> },
  { path: "/encounter/:encounterId", element: <Encounter /> },
  { path: "/queue", element: <Queue /> },
  { path: "/patients", element: <Patients /> },
  
  // Protected - Scheduling
  { path: "/appointments", element: <Appointments /> },
  { path: "/scheduling", element: <AppointmentScheduling /> },
  { path: "/scheduling/theatre", element: <TheatreScheduling /> },
  { path: "/scheduling/noticeboard", element: <ProviderNoticeboard /> },
  { path: "/scheduling/resources", element: <ResourceCalendar /> },
  
  // Protected - Operations
  { path: "/pharmacy", element: <Pharmacy /> },
  { path: "/lims", element: <LIMS /> },
  { path: "/pacs", element: <PACS /> },
  { path: "/stock", element: <Stock /> },
  
  // Protected - Admin
  { path: "/admin", element: <AdminDashboard /> },
  { path: "/above-site", element: <AboveSiteDashboard /> },
  { path: "/reports", element: <Reports /> },
  
  // Registries
  { path: "/hpr", element: <HealthProviderRegistry /> },
  { path: "/facility-registry", element: <FacilityRegistry /> },
  { path: "/client-registry", element: <ClientRegistry /> },
  
  // Shared
  { path: "/shared/:type/:token", element: <SharedSummary /> },
];
```

---

## Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| ABAC | Attribute-Based Access Control |
| CPD | Continuing Professional Development |
| CPID | Clinical Pseudonym ID |
| CRID | Client Registry ID |
| EHR | Electronic Health Record |
| HIE | Health Information Exchange |
| HPR | Health Provider Registry |
| IPS | International Patient Summary |
| MOSIP | Modular Open Source Identity Platform |
| O-CPID | Offline Clinical Pseudonym ID |
| PDP | Policy Decision Point |
| PEP | Policy Enforcement Point |
| PHR | Personal Health Record |
| PII | Personally Identifiable Information |
| QMS | Queue Management System |
| RLS | Row Level Security |
| SHR | Shared Health Record |
| UPID | Unique Provider ID |

### B. Reference Documents

- OpenHIE Architecture Specification v3.0
- HL7 FHIR R4 Implementation Guide
- IPS Implementation Guide
- Zimbabwe Health Information Strategy
- MOSIP Integration Guide
- iHRIS API Documentation

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | System | Initial reverse-engineered specification |

---

*This document was reverse-engineered from the Impilo EHR codebase and architecture memories. It represents the current implementation state as of January 2026.*
