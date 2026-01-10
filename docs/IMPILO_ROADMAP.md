# Impilo Digital Health Platform - Complete Development Roadmap

## Executive Summary

This roadmap defines the full-stack implementation path for Impilo as a comprehensive Health Information Exchange (HIE) and ERP platform. **All features require production-ready implementations** with real data flows, not UI mockups. The platform encompasses clinical EHR, telemedicine, imaging, laboratory, pharmacy, billing, and enterprise operations.

**Architecture Principle**: Every module writes back to core clinical records (Encounters, Orders, Results, Charges) - no orphaned data stores.

---

## PHASE 1: FOUNDATION & CLINICAL CORE ✅ (Complete)

### 1.1 Patient Management ✅
- [x] Patient Registration with biometrics
- [x] Patient Search (⌘K global search)
- [x] Patient Profile & Demographics
- [x] MRN Generation (auto-generated)
- [x] Emergency Contact Management
- [x] Insurance Information

### 1.2 Electronic Health Records ✅
- [x] Encounter Management
- [x] Clinical Notes (SOAP format)
- [x] Assessment & Triage
- [x] Problems & Diagnoses
- [x] Vital Signs Recording & Monitoring
- [x] Patient Banner with real-time vitals
- [x] Clinical Decision Support (CDS) Alerts
- [x] Clinical Alerts System

### 1.3 Stock & Inventory ✅
- [x] Stock Items Management
- [x] Stock Locations
- [x] Stock Levels Tracking
- [x] Stock Movements (Receipt, Issue, Transfer, Adjustment, Return)
- [x] Reorder Level Alerts
- [x] Batch & Expiry Tracking

### 1.4 Consumables ✅
- [x] Consumable Usage Tracking
- [x] Encounter-linked Consumables
- [x] Automatic Stock Deduction
- [x] Cost Tracking per Encounter

### 1.5 Charges & Billing ✅
- [x] Charge Items Catalog
- [x] Encounter Charges
- [x] Tax Calculation
- [x] Discount Management
- [x] Voiding with Audit Trail

### 1.6 Beds & Queue Management ✅
- [x] Bed Management Dashboard
- [x] Ward Statistics
- [x] Patient Queue Management
- [x] Queue Statistics & Voice Announcements

### 1.7 Specialized Clinical Workspaces ✅
- [x] Resuscitation Workspace
- [x] Trauma Workspace
- [x] Theatre Workspace
- [x] Dialysis Workspace
- [x] Burns Workspace
- [x] Labour & Delivery Workspace
- [x] Neonatal Resuscitation
- [x] Chemotherapy Workspace
- [x] Radiotherapy Workspace
- [x] Poisoning Workspace
- [x] Sexual Assault Workspace
- [x] Psychotherapy Workspace
- [x] Physiotherapy Workspace
- [x] Minor Procedure Workspace
- [x] Anaesthesia Pre-Op Workspace
- [x] Teleconsultation Workspace
- [x] Virtual Care Workspace

---

## PHASE 2: ORDER & WORKFLOW SYSTEMS ✅ (Complete)

### 2.1 Order Entry System ✅
- [x] Cart-based Order Entry
- [x] Medication Orders
- [x] Lab Orders
- [x] Imaging Orders
- [x] Procedure Orders
- [x] Order Sets (Common combinations)

### 2.2 Lab Results System ✅
- [x] Lab Order Tracking
- [x] Results Display
- [x] Critical Value Alerts
- [x] Historical Results View
- [x] Status Filtering

### 2.3 Patient Timeline ✅
- [x] Chronological Event View
- [x] Event Type Filtering
- [x] Multiple Event Categories

### 2.4 Shift Handoff ✅
- [x] Handoff Report Generation
- [x] Patient Summary Cards
- [x] Pending Tasks List

### 2.5 Discharge Workflow ✅
- [x] Multi-step Discharge Process
- [x] Discharge Summary
- [x] Prescription at Discharge

### 2.6 Medication Dispensing ✅
- [x] Pharmacy Queue
- [x] 5 Rights Verification
- [x] Barcode Scanning
- [x] Dispensing Workflow

### 2.7 ePrescriptions ✅
- [x] Electronic Prescription Generation
- [x] Drug Interaction Checking
- [x] Prescription History

---

## PHASE 3: OPERATIONAL INFRASTRUCTURE 🔄 (In Progress)

### 3.1 Roster & Duty Management ✅
- [x] Shift Definitions (AM/PM/Night/On-call)
- [x] Roster Plan Creation & Publishing
- [x] Shift Assignments
- [x] Cover Request Workflow
- [x] Attendance Reconciliation
- [x] Supervisor Dashboards

### 3.2 Virtual Care Pools ✅
- [x] Pool Creation & Configuration
- [x] Provider Membership
- [x] Case Assignment & Queue
- [x] SLA Tracking
- [x] Facility-anchored & Independent Pools

### 3.3 Scheduling & Booking 📋
- [ ] Appointment Scheduling (real booking engine)
- [ ] Provider Availability Calendar (database-driven)
- [ ] Slot Management with conflict detection
- [ ] Recurring Appointments
- [ ] Wait List Management with notifications
- [ ] SMS/Email appointment confirmations

### 3.4 Theatre/Procedure Booking 📋
- [ ] Operating Room Scheduling (real-time)
- [ ] Equipment Reservation System
- [ ] Team Assignment & Notification
- [ ] Pre-operative Checklist Completion
- [ ] Theatre Utilization Analytics

### 3.5 Resource Calendar 📋
- [ ] Room Booking System
- [ ] Equipment Scheduling
- [ ] Leave Management
- [ ] On-call Schedule Generation

---

## PHASE 4: REAL-TIME COMMUNICATION 🔴 (Priority - Full Implementation)

### 4.1 Clinical Messaging ✅
- [x] Real-time Chat (Supabase Realtime)
- [x] Channel-based Messaging
- [x] Read Receipts
- [x] Typing Indicators

### 4.2 Clinical Paging System ✅
- [x] Priority-based Paging
- [x] Escalation Rules
- [x] Acknowledgment Tracking
- [x] Auto-escalation on Timeout

### 4.3 Voice Calling 🔴 (Full Implementation Required)
**Current**: UI shell with mock data
**Required**: Real peer-to-peer audio calls

```
Implementation Architecture:
┌─────────────────────────────────────────────────────┐
│                  Voice Call System                   │
├─────────────────────────────────────────────────────┤
│  WebRTC Peer Connection                             │
│  ├─ ICE Candidate Exchange (Supabase Realtime)      │
│  ├─ STUN Server (Google/Twilio)                     │
│  ├─ TURN Server (Self-hosted/Twilio)                │
│  └─ Audio-only MediaStream                          │
├─────────────────────────────────────────────────────┤
│  Signaling Layer                                    │
│  ├─ call_sessions table (offer/answer SDP)          │
│  ├─ call_ice_candidates table                       │
│  └─ Realtime subscriptions for call events          │
├─────────────────────────────────────────────────────┤
│  Call Features                                      │
│  ├─ Mute/Unmute                                     │
│  ├─ Hold/Resume                                     │
│  ├─ Call Transfer                                   │
│  ├─ Conference Calls (3+ participants)              │
│  └─ Call Recording (with consent)                   │
└─────────────────────────────────────────────────────┘
```

**Database Tables Required**:
- `call_sessions` (caller_id, callee_id, status, started_at, ended_at, recording_url)
- `call_ice_candidates` (session_id, candidate, created_at)
- `call_recordings` (session_id, storage_path, duration, consent_given)

### 4.4 Video Telemedicine 🔴 (Full Implementation Required)
**Current**: Basic WebRTC structure
**Required**: Production-grade teleconsultation

```
Teleconsultation Architecture:
┌─────────────────────────────────────────────────────┐
│              Telemedicine Platform                   │
├─────────────────────────────────────────────────────┤
│  Video Infrastructure                               │
│  ├─ WebRTC with Simulcast (multi-quality)           │
│  ├─ Adaptive Bitrate (network-aware)                │
│  ├─ Screen Sharing                                  │
│  ├─ Picture-in-Picture                              │
│  └─ Virtual Background (optional)                   │
├─────────────────────────────────────────────────────┤
│  Clinical Integration                               │
│  ├─ Patient context visible during call             │
│  ├─ Real-time note-taking (SOAP)                    │
│  ├─ Prescription writing during call                │
│  ├─ Document/Image sharing                          │
│  └─ Referral initiation                             │
├─────────────────────────────────────────────────────┤
│  7-Stage Consultation Workflow                      │
│  1. Referral Package Building                       │
│  2. Routing & Scheduling                            │
│  3. Pre-consultation Review                         │
│  4. Waiting Room                                    │
│  5. Live Teleconsult Session                        │
│  6. Post-consult Documentation                      │
│  7. Completion Note & Follow-up                     │
├─────────────────────────────────────────────────────┤
│  Recording & Compliance                             │
│  ├─ Consent capture before recording                │
│  ├─ Encrypted storage (Supabase Storage)            │
│  ├─ Audit trail                                     │
│  └─ Retention policies                              │
└─────────────────────────────────────────────────────┘
```

**Database Tables Required**:
- `teleconsult_sessions` (referral_id, provider_id, patient_id, status, sdp_offer, sdp_answer)
- `teleconsult_ice_candidates` (session_id, candidate_data)
- `teleconsult_recordings` (session_id, storage_path, consent_timestamp)
- `teleconsult_notes` (session_id, content, created_by)

### 4.5 Push Notifications ✅
- [x] Service Worker Registration
- [x] Permission Prompting
- [x] Notification Preferences
- [x] Delivery Tracking

---

## PHASE 5: MEDICAL IMAGING (PACS) 🔴 (Full Implementation Required)

### 5.1 DICOM Viewer Implementation
**Current**: UI placeholder
**Required**: Full DICOM viewing capability

```
PACS Architecture:
┌─────────────────────────────────────────────────────┐
│                 PACS Implementation                  │
├─────────────────────────────────────────────────────┤
│  DICOM Parsing (cornerstone.js or dwv.js)           │
│  ├─ Multi-frame Support                             │
│  ├─ Windowing/Leveling                              │
│  ├─ Zoom/Pan/Rotate                                 │
│  ├─ Measurement Tools (length, angle, area)         │
│  ├─ Annotations (arrows, text, ROI)                 │
│  └─ DICOM Header Display                            │
├─────────────────────────────────────────────────────┤
│  Study Management                                   │
│  ├─ Study List with Search                          │
│  ├─ Series Navigation                               │
│  ├─ Comparison Mode (prior studies)                 │
│  ├─ Hanging Protocols                               │
│  └─ Key Image Selection                             │
├─────────────────────────────────────────────────────┤
│  Integration                                        │
│  ├─ DICOMweb (WADO-RS, STOW-RS, QIDO-RS)           │
│  ├─ Orthanc Server (self-hosted PACS)               │
│  ├─ Cloud PACS (Ambra, Sectra, Google Healthcare)   │
│  └─ Order-to-Image linking                          │
├─────────────────────────────────────────────────────┤
│  Reporting                                          │
│  ├─ Structured Reporting                            │
│  ├─ Voice Dictation Integration                     │
│  ├─ Critical Finding Alerts                         │
│  └─ Report Signing Workflow                         │
└─────────────────────────────────────────────────────┘
```

**NPM Dependencies**: `cornerstone-core`, `cornerstone-wado-image-loader`, `dicom-parser`

**Database Tables Required**:
- `imaging_studies` (patient_id, order_id, study_instance_uid, modality, study_date, status)
- `imaging_series` (study_id, series_instance_uid, series_description, num_instances)
- `imaging_instances` (series_id, sop_instance_uid, storage_path)
- `imaging_reports` (study_id, findings, impression, reported_by, signed_at)
- `imaging_annotations` (instance_id, annotation_data, created_by)

### 5.2 Radiology Workflow
- [ ] Worklist Management
- [ ] Protocol Assignment
- [ ] Technologist Interface
- [ ] Radiologist Reading Workflow
- [ ] Peer Review System

---

## PHASE 6: LABORATORY (LIMS) 🔴 (Full Implementation Required)

### 6.1 Laboratory Information System
**Current**: Basic order/result UI
**Required**: Complete LIMS functionality

```
LIMS Architecture:
┌─────────────────────────────────────────────────────┐
│                LIMS Implementation                   │
├─────────────────────────────────────────────────────┤
│  Sample Management                                  │
│  ├─ Specimen Collection (barcode generation)        │
│  ├─ Sample Tracking (chain of custody)              │
│  ├─ Aliquoting & Splitting                          │
│  ├─ Storage Location Tracking                       │
│  └─ Sample Rejection Workflow                       │
├─────────────────────────────────────────────────────┤
│  Analyzer Integration                               │
│  ├─ HL7 v2 Message Parsing                          │
│  ├─ ASTM Protocol Support                           │
│  ├─ Bi-directional Interface                        │
│  ├─ Result Auto-verification                        │
│  └─ QC Result Handling                              │
├─────────────────────────────────────────────────────┤
│  Quality Control                                    │
│  ├─ Levey-Jennings Charts                           │
│  ├─ Westgard Rules                                  │
│  ├─ Control Lot Management                          │
│  ├─ Calibration Tracking                            │
│  └─ Proficiency Testing                             │
├─────────────────────────────────────────────────────┤
│  Result Management                                  │
│  ├─ Delta Checks                                    │
│  ├─ Reflex Testing Rules                            │
│  ├─ Critical Value Notification                     │
│  ├─ Result Validation Workflow                      │
│  └─ Amended Result Tracking                         │
├─────────────────────────────────────────────────────┤
│  Reporting                                          │
│  ├─ Cumulative Reports                              │
│  ├─ Trend Analysis                                  │
│  ├─ TAT Monitoring                                  │
│  └─ Workload Statistics                             │
└─────────────────────────────────────────────────────┘
```

**Database Tables Required**:
- `lab_specimens` (order_id, specimen_id, collection_time, collector_id, status, rejection_reason)
- `lab_analyzer_results` (specimen_id, test_code, raw_value, unit, flags, received_at)
- `lab_qc_results` (lot_id, level, value, mean, sd, status)
- `lab_reference_ranges` (test_code, age_min, age_max, sex, low, high)

---

## PHASE 7: PATIENT PORTAL (Impilo Connect) 📋

### 7.1 Personal Health Record Access
- [ ] View Medical History (real encounters)
- [ ] Lab Results Access (with interpretations)
- [ ] Medication List (active/historical)
- [ ] Immunization Records
- [ ] Download Health Records (PDF generation)

### 7.2 Appointments & Scheduling
- [ ] Book Appointments Online (real-time availability)
- [ ] SMS/Email Reminders (Edge Function + SMS gateway)
- [ ] Virtual Queue Check-in
- [ ] Appointment History

### 7.3 Telehealth for Patients
- [ ] Video Consultation Booking
- [ ] WebRTC Patient Interface (simplified UI)
- [ ] Document Upload during Call
- [ ] Post-consultation Summary View

### 7.4 Prescriptions & Orders
- [ ] View Active Prescriptions
- [ ] Prescription Refill Requests
- [ ] Pharmacy Selection & Routing
- [ ] Delivery Tracking Integration

### 7.5 Health Wallet
- [ ] Wallet Balance (real transactions)
- [ ] Top-up via Mobile Money
- [ ] Payment for Services
- [ ] Transaction History

---

## PHASE 8: PAYMENTS & BILLING (MusheX) 📋

### 8.1 Payment Gateway Integration
**Required**: Real payment processing

```
Payment Architecture:
┌─────────────────────────────────────────────────────┐
│               Payment Integration                    │
├─────────────────────────────────────────────────────┤
│  Mobile Money                                       │
│  ├─ Paynow Zimbabwe Integration                     │
│  ├─ EcoCash API                                     │
│  ├─ OneMoney API                                    │
│  └─ InnBucks API                                    │
├─────────────────────────────────────────────────────┤
│  Card Payments                                      │
│  ├─ Stripe Integration                              │
│  ├─ DPO PayGate                                     │
│  └─ PCI-DSS Compliance                              │
├─────────────────────────────────────────────────────┤
│  Bank Transfers                                     │
│  ├─ ZIPIT Integration                               │
│  ├─ RTGS Settlement                                 │
│  └─ CBZ Bank API                                    │
├─────────────────────────────────────────────────────┤
│  Virtual Wallet                                     │
│  ├─ Health Wallet (pre-paid)                        │
│  ├─ Family Wallets                                  │
│  ├─ Corporate Accounts                              │
│  └─ Subscription Billing                            │
└─────────────────────────────────────────────────────┘
```

### 8.2 Insurance Claims
- [ ] Claim Submission (real submission)
- [ ] Pre-authorization Requests
- [ ] Benefit Verification API
- [ ] Claim Status Tracking
- [ ] Settlement Reconciliation

---

## PHASE 9: AI & CLINICAL INTELLIGENCE 🔴 (Priority)

### 9.1 AI Diagnostic Assistant ✅ (Using Lovable AI)
- [x] Symptom Analysis (Gemini 3 Flash)
- [x] Differential Diagnosis Suggestions
- [x] Evidence-based Recommendations

### 9.2 Voice Dictation 📋
```
Voice Dictation Architecture:
┌─────────────────────────────────────────────────────┐
│              Voice Dictation System                  │
├─────────────────────────────────────────────────────┤
│  Speech Recognition                                 │
│  ├─ Web Speech API (browser native)                 │
│  ├─ Whisper API (OpenAI via Lovable AI)             │
│  └─ Medical Vocabulary Enhancement                  │
├─────────────────────────────────────────────────────┤
│  Transcription Pipeline                             │
│  ├─ Real-time Streaming                             │
│  ├─ Punctuation & Formatting                        │
│  ├─ Medical Term Recognition                        │
│  └─ Speaker Diarization (multi-party)               │
├─────────────────────────────────────────────────────┤
│  Integration                                        │
│  ├─ SOAP Note Auto-population                       │
│  ├─ Template-guided Dictation                       │
│  ├─ Command Recognition ("new paragraph")           │
│  └─ Review & Edit Workflow                          │
└─────────────────────────────────────────────────────┘
```

### 9.3 Document OCR 📋
- [ ] Camera Capture Integration
- [ ] Document Type Recognition
- [ ] Data Extraction (AI-powered)
- [ ] Form Auto-fill

### 9.4 Clinical Decision Support (Enhanced)
- [ ] Drug Interaction Checking (real database)
- [ ] Allergy Cross-checking
- [ ] Dosage Calculations (weight-based)
- [ ] Sepsis Early Warning (NEWS2/qSOFA)
- [ ] Clinical Pathways

---

## PHASE 10: ENTERPRISE & ANALYTICS 📋

### 10.1 Management Dashboards
- [ ] Facility-level Metrics
- [ ] District Aggregation
- [ ] Provincial/National Views
- [ ] Real-time Occupancy

### 10.2 Reporting Engine
- [ ] Custom Report Builder
- [ ] Scheduled Reports (Edge Function cron)
- [ ] Export (PDF, Excel, CSV)
- [ ] DHIS2 Integration

### 10.3 Audit & Compliance
- [ ] Full Audit Trail
- [ ] Access Logs
- [ ] Data Export for Regulators
- [ ] HIPAA/POPIA Compliance Tools

---

## PHASE 11: INTEGRATIONS 📋

### 11.1 HIE Infrastructure
- [ ] Client Registry (MOSIP) - Health ID Issuance
- [ ] Provider Registry (Varapi/iHRIS)
- [ ] Facility Registry (Thuso/GOFR)
- [ ] Terminology Service (OCL)
- [ ] Shared Health Record (HAPI FHIR)

### 11.2 ERP Integration
- [ ] Odoo Connector (full bi-directional)
  - Finance Module Sync
  - Procurement Integration
  - HR/Payroll Link
  - Asset Management

### 11.3 External Systems
- [ ] HL7 FHIR R4 API
- [ ] National Health ID API
- [ ] MoH Reporting APIs
- [ ] Laboratory Networks (HL7 v2)
- [ ] Pharmacy Networks

---

## Implementation Priority Matrix

| Phase | Status | Priority | Complexity | Dependencies | Target |
|-------|--------|----------|------------|--------------|--------|
| Phase 1-2 | ✅ Done | - | - | - | Complete |
| Phase 3 | 🔄 Active | 🔴 High | Medium | Phase 1-2 | Q1 2025 |
| Phase 4 | 🔴 Next | 🔴 Critical | High | WebRTC, Realtime | Q1 2025 |
| Phase 5 | 📋 Planned | 🔴 High | Very High | DICOM libs | Q2 2025 |
| Phase 6 | 📋 Planned | 🟡 Medium | Very High | HL7 parsing | Q2 2025 |
| Phase 7 | 📋 Planned | 🟡 Medium | Medium | Auth, Portal | Q2 2025 |
| Phase 8 | 📋 Planned | 🟡 Medium | High | Payment APIs | Q3 2025 |
| Phase 9 | 📋 Planned | 🟡 Medium | Medium | Lovable AI | Q3 2025 |
| Phase 10 | 📋 Planned | 🟢 Low | Medium | All phases | Q4 2025 |
| Phase 11 | 📋 Planned | 🟢 Low | Very High | External APIs | Q4 2025+ |

---

## Technology Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- TanStack Query (data fetching)
- React Router (navigation)

### Backend (Lovable Cloud)
- PostgreSQL (Supabase)
- Edge Functions (Deno)
- Row Level Security (RLS)
- Realtime Subscriptions
- Storage (files, DICOM, recordings)

### Real-time Communication
- WebRTC (peer-to-peer audio/video)
- Supabase Realtime (signaling)
- STUN/TURN Servers

### Medical Standards
- DICOM (cornerstone.js)
- HL7 v2 (parsing)
- HL7 FHIR R4 (interoperability)
- ICD-10, SNOMED CT, LOINC

### AI Integration
- Lovable AI Gateway (Gemini, GPT-5)
- Web Speech API (voice)
- OCR (document processing)

### Mobile
- Progressive Web App (PWA)
- Service Worker (offline)
- Push Notifications

---

## Data Residency & Self-Hosting

For jurisdictions requiring data residency, the entire stack can be self-hosted:

```
Self-Hosted Architecture:
┌─────────────────────────────────────────────────────┐
│           Sovereign Infrastructure                   │
├─────────────────────────────────────────────────────┤
│  Frontend: nginx/Caddy (static files)               │
│  Backend: Supabase Self-Hosted (Docker/K8s)         │
│  ├─ PostgreSQL                                      │
│  ├─ GoTrue (Auth)                                   │
│  ├─ PostgREST (API)                                 │
│  ├─ Realtime                                        │
│  └─ Storage (S3-compatible)                         │
│  PACS: Orthanc (DICOM server)                       │
│  TURN: coturn (WebRTC relay)                        │
└─────────────────────────────────────────────────────┘
```

---

## Document References

1. Impilo Connect Scope Document
2. Impilo Engage - Wellness Platform
3. MusheX Payment Gateway Specification
4. CBZ Bank Partnership Proposal
5. PHID Functional Requirements (docs/PHID_Functional_Requirements.docx)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial roadmap |
| 2.0 | 2025-01-10 | Full implementation revision - all features must be production-ready |
