# Impilo Telemedicine & Referral Workflows
## Complete Technical Implementation Guide

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Six Telemedicine Modes](#2-six-telemedicine-modes)
3. [Referral Package System](#3-referral-package-system)
4. [Full-Circle Workflow](#4-full-circle-workflow)
5. [Referring Facility (Facility A) Workflow](#5-referring-facility-workflow)
6. [Consulting Facility (Facility B) Workflow](#6-consulting-facility-workflow)
7. [Real-time Communication](#7-real-time-communication)
8. [Trust Layer & Security](#8-trust-layer--security)
9. [Data Structures](#9-data-structures)
10. [Hook Architecture](#10-hook-architecture)
11. [Component Reference](#11-component-reference)
12. [Database Schema](#12-database-schema)

---

## 1. Architecture Overview

### Core Design Principle
The telemedicine system implements a **Referral Package → Consultation Response** pattern across all six consultation modes. This ensures consistent clinical documentation and audit trails regardless of how the consultation is conducted.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FULL-CIRCLE TELEMEDICINE HUB                         │
│                     (FullCircleTelemedicineHub.tsx)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │    REFERRING FACILITY       │    │      CONSULTING FACILITY            │ │
│  │        (Facility A)         │    │        (Facility B/C)               │ │
│  │                             │    │                                     │ │
│  │  1. Case Identified         │    │  1. Review Package                  │ │
│  │  2. Build Referral Package  │───▶│  2. Accept/Decline/Route            │ │
│  │  3. Routing & Consent       │    │  3. Consultation Session            │ │
│  │  4. Awaiting Response       │◀───│  4. Submit Response                 │ │
│  │  5. Complete & Close        │    │  5. Complete                        │ │
│  │                             │    │                                     │ │
│  │  OutgoingReferralWorkflow   │    │  IncomingConsultWorkflow            │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Files
| File | Purpose |
|------|---------|
| `src/pages/Telemedicine.tsx` | Main route entry point |
| `src/components/ehr/consults/FullCircleTelemedicineHub.tsx` | Central orchestrator |
| `src/components/ehr/consults/OutgoingReferralWorkflow.tsx` | Facility A stages |
| `src/components/ehr/consults/IncomingConsultWorkflow.tsx` | Facility B/C stages |
| `src/types/telehealth.ts` | Type definitions |
| `src/hooks/useTeleconsultation.ts` | Session & WebRTC management |

---

## 2. Six Telemedicine Modes

### Mode Definitions

```typescript
// src/types/telehealth.ts
export type TelemedicineMode = 
  | 'async'      // Store & Forward - Specialist reviews offline
  | 'chat'       // Case-linked text conversation
  | 'audio'      // Live voice call (VOIP)
  | 'video'      // Full audio/video consultation
  | 'scheduled'  // Booked teleconsult appointment
  | 'board';     // Case review / M&M / Specialist board
```

### Mode Characteristics

| Mode | Live? | Save/Resume | Multi-Party | Use Case |
|------|-------|-------------|-------------|----------|
| `async` | No | ✅ | No | Radiology reads, pathology reviews, non-urgent |
| `chat` | Yes | ✅ | No | Quick queries, medication questions |
| `audio` | Yes | No | ✅ | Phone consultations, low-bandwidth areas |
| `video` | Yes | No | ✅ | Visual examinations, complex consultations |
| `scheduled` | Yes | No | ✅ | Planned follow-ups, specialist clinics |
| `board` | No | ✅ | ✅ | Tumor boards, M&M conferences, case reviews |

### Session Components

```
src/components/ehr/consults/sessions/
├── index.ts                      # Exports all session types
├── ChatSession.tsx               # Real-time text messaging
├── AudioCallSession.tsx          # VOIP audio-only calls
├── VideoCallSession.tsx          # Full A/V with screen share
├── ScheduledAppointmentSession.tsx # Waiting room + call
└── CaseReviewBoardSession.tsx    # Multi-participant MDT reviews
```

### Non-Live Mode Detection

```typescript
// Helper to determine if mode supports save/pause/resume
const isNonLiveMode = (mode: TelemedicineMode): boolean => {
  return mode === 'async' || mode === 'board';
};
```

---

## 3. Referral Package System

### 7-Stage ReferralBuilder

The `ReferralBuilder.tsx` component implements a structured wizard for creating referral packages:

```typescript
type ReferralStep = 
  | "letter"          // 1. Clinical referral letter
  | "patient-summary" // 2. Auto-generated patient summary
  | "visit-summary"   // 3. Auto-generated visit summary
  | "attachments"     // 4. Document attachments
  | "routing"         // 5. Target selection
  | "modality"        // 6. Telemedicine mode selection
  | "consent";        // 7. Patient consent capture

const STEPS = [
  { id: "letter", label: "Referral Letter", icon: FileText },
  { id: "patient-summary", label: "Patient Summary", icon: User },
  { id: "visit-summary", label: "Visit Summary", icon: Calendar },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "routing", label: "Routing", icon: Route },
  { id: "modality", label: "Consultation Mode", icon: Video },
  { id: "consent", label: "Consent", icon: Shield },
];
```

### Stage Details

#### Stage 1: Referral Letter
- **Urgency Level**: routine | urgent | stat | emergency
- **Presenting Problems**: Tag-based entry (add/remove)
- **Clinical Question**: Specific query for specialist
- **Letter Content**: Free-text clinical narrative

#### Stage 2: Patient Summary (Auto-Generated)
Toggle inclusion of:
- Demographics (name, age, sex, ID)
- Allergies
- Current Medications
- Problem List
- Latest Vitals

```typescript
patientSummary: {
  demographics: boolean;
  allergies: boolean;
  medications: boolean;
  problems: boolean;
  vitals: boolean;
}
```

#### Stage 3: Visit Summary (Auto-Generated)
Toggle inclusion of:
- Current Visit Details
- Recent Labs (7 days)
- Recent Imaging (30 days)
- Recent Clinical Notes

#### Stage 4: Attachments
- **Clinical Document Scanner**: Camera/file-based scanning
- **File Upload**: PDF, images, documents
- Attachment metadata: `{ id, name, type, size }`

#### Stage 5: Routing
Six target types supported:

```typescript
routingType: 
  | "practitioner"      // Specific named provider
  | "workspace"         // Clinical workspace/department
  | "on-call"           // On-call team
  | "unit"              // Hospital unit
  | "facility-service"  // Facility department
  | "pool";             // National specialist pool
```

#### Stage 6: Modality Selection
- Multi-select for acceptable modes
- Single preferred mode selection
- Scheduled time slot (for scheduled mode)

#### Stage 7: Consent
- Consent type: digital | verbal | proxy | emergency
- Token generation on consent capture
- Consent validation before submission

### Referral Package Data Structure

```typescript
// src/types/telehealth.ts
interface ReferralPackage {
  id: string;
  referralNumber: string;
  patientId: string;
  patientHID: string;
  
  clinicalNarrative: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    pastMedicalHistory: string;
    provisionalDiagnosis: string;
    interventionsDone: string;
    reasonForReferral: string;
    specificQuestions: string[];
  };
  
  supportingData: {
    problemList: string[];
    currentMedications: { name: string; dose: string; frequency: string }[];
    allergies: { allergen: string; reaction: string; severity: string }[];
    vitals: { name: string; value: string; timestamp: string }[];
    labResults: { test: string; result: string; date: string }[];
    imaging: { study: string; finding: string; date: string }[];
    attachments: { id: string; name: string; type: string; url: string }[];
  };
  
  context: {
    referringFacilityId: string;
    referringFacilityName: string;
    referringProviderId: string;
    referringProviderName: string;
    targetType: 'facility' | 'specialty' | 'provider' | 'pool' | 'on_call';
    targetId: string;
    targetName: string;
    specialty: string;
  };
  
  urgency: 'routine' | 'urgent' | 'stat' | 'emergency';
  requestedModes: TelemedicineMode[];
  preferredMode: TelemedicineMode;
  requestedTimeSlot?: string;
  
  consent: {
    status: 'obtained' | 'pending' | 'waived_emergency';
    type: 'digital' | 'verbal' | 'proxy' | 'emergency';
    timestamp: string;
    obtainedBy: string;
  };
  
  status: ReferralStatus;
  timestamps: {
    createdAt: string;
    sentAt?: string;
    acceptedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
}
```

---

## 4. Full-Circle Workflow

### Hub Views

```typescript
type HubView = 
  | "overview"          // Dashboard with stats and lists
  | "outgoing-list"     // All outgoing referrals
  | "incoming-list"     // TelehealthDashboard worklist
  | "new-outgoing"      // New referral wizard
  | "outgoing-workflow" // Existing referral detail
  | "incoming-workflow"; // Consultation workflow
```

### Dashboard Statistics

```tsx
// Displayed in overview mode
<Card>Outgoing Active: {count}</Card>
<Card>Incoming Pending: {count}</Card>
<Card>Emergency: {count}</Card>
<Card>Completed Today: {count}</Card>
```

### Role-Based Access Control

```typescript
// From useTelemedicineRoles hook
const { permissions, primaryRole, getRoleLabel } = useTelemedicineRoles();

// Permission checks
permissions.canAcceptConsultations   // Can accept incoming cases
permissions.canRouteConsultations    // Can route to other providers
permissions.canAccessPatientEHR      // Can view patient records
permissions.canManageHub             // Can configure hub settings
```

---

## 5. Referring Facility Workflow

### Stage Flow (OutgoingReferralWorkflow.tsx)

```
┌─────────────────┐
│ Stage 1: Case   │
│   Identified    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 2: Build  │◀──── ReferralBuilder (7 steps)
│   Package       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 3: Route  │◀──── Target resolution
│   Referral      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 4: Await  │◀──── Real-time updates via Supabase
│   Response      │      Can join live session if accepted
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 7: Close  │◀──── CompletionNoteForm
│   Case          │
└─────────────────┘
```

### Auto-Summary Generation

```typescript
// When entering workflow, auto-generate summaries
useEffect(() => {
  if (patientId && !summariesGenerated && !existingReferral) {
    setSummariesGenerated(true);
    
    // Generate IPS (International Patient Summary)
    generateNewIPS({ 
      trigger: 'referral',
      purpose: 'Telemedicine referral package',
      includeAttachments: true 
    });

    // Generate Visit Summary if we have an encounter
    if (encounterId) {
      generateNewVisitSummary({ 
        patientFriendly: true,
        includeProviderDetails: true,
        includeAllInvestigations: true
      });
    }
  }
}, [patientId, encounterId]);
```

### Stage 4: Awaiting Response

While waiting, the referring facility can:
- View referral summary
- Track status changes in real-time
- Join live session if consultant initiates video/audio
- Cancel referral with reason

```typescript
// Join live session when consultant accepts
const handleJoinSession = useCallback(() => {
  setIsSessionActive(true);
  setActiveMode(referralPackage?.preferredMode || "video");
}, [referralPackage?.preferredMode]);
```

---

## 6. Consulting Facility Workflow

### Stage Flow (IncomingConsultWorkflow.tsx)

```
┌─────────────────┐
│ Stage 1: Review │◀──── ReferralPackageViewer
│   Package       │      MUST review before action
└────────┬────────┘
         │
         ├──────────────────┬────────────────────┐
         ▼                  ▼                    ▼
┌─────────────────┐ ┌──────────────┐  ┌──────────────────┐
│     ACCEPT      │ │   DECLINE    │  │      ROUTE       │
└────────┬────────┘ └──────┬───────┘  └────────┬─────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────┐      Exit              Exit
│ Stage 2: EHR    │      with              with
│ Access Config   │      reason            destination
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 3: Live   │◀──── LiveSessionWorkspace OR
│   Session       │      AsyncReviewSession
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 4: Submit │◀──── ConsultationResponseBuilder
│   Response      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stage 5: Done   │
└─────────────────┘
```

### Triage Decision Actions

```typescript
type TriageDecision = 'accept' | 'decline' | 'route' | null;

// Accept - proceeds to EHR access configuration
const handleAcceptReferral = useCallback(async () => {
  if (!canAcceptCase) {
    toast.error('You do not have permission to accept consultations');
    return;
  }
  setTriageDecision('accept');
  setReferralPackage(prev => ({
    ...prev,
    status: "accepted",
    timestamps: { ...prev.timestamps, acceptedAt: new Date().toISOString() },
  }));
  setCurrentStage(2);
}, [canAcceptCase]);

// Decline - requires reason, notifies referring facility
const handleDeclineReferral = useCallback(() => {
  if (!declineReason.trim()) {
    toast.error('Please provide a reason for declining');
    return;
  }
  // Update status and exit
}, [declineReason, onComplete]);

// Route - forwards to another provider/facility
const handleRouteReferral = useCallback(() => {
  if (!routeToFacility || !routeReason.trim()) {
    toast.error('Please select a destination and provide routing reason');
    return;
  }
  // Update status and exit
}, [routeToFacility, routeReason, onComplete]);
```

### EHR Access Scope

```typescript
// Trust Layer access levels
type EHRAccessScope = 
  | 'read_summary'   // Summary only
  | 'read_full'      // Full record
  | 'read_write'     // Read + Orders/Notes
  | 'orders_only'    // Place orders only
  | 'notes_only';    // Add notes only
```

### Session Mode Selection (Stage 2)

```tsx
// Mode selection UI with live/non-live distinction
{(['async', 'board', 'video', 'audio', 'chat'] as TelemedicineMode[]).map((mode) => {
  const isNonLive = isNonLiveMode(mode);
  return (
    <Button
      variant={activeMode === mode ? "default" : "outline"}
      onClick={() => setActiveMode(mode)}
    >
      {mode === 'async' && <FileText />}
      {mode === 'board' && <Users />}
      {mode === 'video' && <Video />}
      {mode === 'audio' && <Phone />}
      {mode === 'chat' && <MessageSquare />}
      <span>{modeLabels[mode]}</span>
      {isNonLive && <span>Save & Resume</span>}
    </Button>
  );
})}
```

---

## 7. Real-time Communication

### WebRTC Implementation

```typescript
// src/hooks/useTeleconsultation.ts
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const startVideoCall = async (isInitiator: boolean) => {
  // 1. Get local media
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
  });
  setLocalStream(stream);

  // 2. Create peer connection
  const pc = new RTCPeerConnection(ICE_SERVERS);
  peerConnectionRef.current = pc;

  // 3. Add tracks
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  // 4. Handle remote stream
  pc.ontrack = (event) => {
    if (event.streams[0]) setRemoteStream(event.streams[0]);
  };

  // 5. Handle ICE candidates - stored in Supabase
  pc.onicecandidate = async (event) => {
    if (event.candidate && user?.id) {
      await supabase.from('call_ice_candidates').insert({
        session_id: session.id,
        sender_id: user.id,
        candidate_data: event.candidate.toJSON(),
      });
    }
  };

  // 6. Subscribe to signaling updates
  channelRef.current = supabase
    .channel(`teleconsult-${session.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'teleconsult_sessions',
      filter: `id=eq.${session.id}`,
    }, async (payload) => {
      // Handle SDP offer/answer exchange
    })
    .subscribe();

  // 7. Create offer (if initiator)
  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await supabase.from('teleconsult_sessions')
      .update({ sdp_offer: offer.sdp })
      .eq('id', session.id);
  }
};
```

### Media Controls

```typescript
const toggleVideo = () => {
  localStream?.getVideoTracks().forEach((track) => {
    track.enabled = !isVideoEnabled;
  });
  setIsVideoEnabled(!isVideoEnabled);
};

const toggleAudio = () => {
  localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !isAudioEnabled;
  });
  setIsAudioEnabled(!isAudioEnabled);
};

const endVideoCall = async () => {
  localStream?.getTracks().forEach((track) => track.stop());
  peerConnectionRef.current?.close();
  supabase.removeChannel(channelRef.current);
  
  await updateSession({
    session_ended_at: new Date().toISOString(),
    workflow_stage: 6,
    stage_status: 'in_progress',
  });
};
```

---

## 8. Trust Layer & Security

### Telemedicine Trust Layer Hook

```typescript
// src/hooks/useTelemedicineTrustLayer.ts
interface TrustLayerState {
  accessToken: string | null;
  scope: EHRAccessScope;
  isAccessGranted: boolean;
  expiresAt: Date | null;
  ehrActions: EHRAction[];
}

export function useTelemedicineTrustLayer(sessionId?: string) {
  // Request EHR access with consent validation
  const requestAccess = async (params: {
    patientId: string;
    referralId: string;
    grantedToProviderId: string;
    scope: EHRAccessScope;
    consentType: ConsentType;
    durationMinutes: number;
  }) => {
    // Validate consent
    // Generate scoped access token
    // Log access grant
    return accessToken;
  };

  // Revoke access when consultation completes
  const revokeAccess = (reason: string) => {
    // Invalidate token
    // Log access revocation
  };

  // Track EHR actions for audit
  const recordEHRAction = (action: EHRAction) => {
    setState(prev => ({
      ...prev,
      ehrActions: [...prev.ehrActions, action],
    }));
  };

  return {
    ...state,
    requestAccess,
    revokeAccess,
    recordEHRAction,
    getEHRActionsForResponse,
  };
}
```

### Consent Validation

```typescript
// Before EHR access is granted
const handleRequestEHRAccess = useCallback(async () => {
  if (referralPackage.consent.status !== 'obtained') {
    toast.error('Patient consent not obtained');
    return;
  }

  const token = await trustLayer.requestAccess({
    patientId,
    referralId: referralPackage.id,
    grantedToProviderId: 'current-user',
    scope: selectedAccessScope,
    consentType: referralPackage.consent.type,
    durationMinutes: 180, // 3-hour default
  });

  if (token) {
    setEhrAccessRequested(true);
    setCurrentStage(3); // Proceed to session
  }
}, [patientId, referralPackage, selectedAccessScope, trustLayer]);
```

---

## 9. Data Structures

### Consultation Response

```typescript
interface ConsultationResponse {
  referralId: string;
  consultationId: string;
  consultantProviderId: string;
  consultantFacilityId: string;
  modeUsed: TelemedicineMode;
  
  responseNote: {
    assessment: string;
    clinicalInterpretation: string;
    workingDiagnosis: string;
    diagnosisCodes: { code: string; description: string }[];
    responseToQuestions: string;
    keyFindings: string;
    impressions: string;
  };
  
  plan: {
    treatmentPlan: string;
    medications: { name: string; dose: string; frequency: string; duration: string }[];
    investigations: { type: string; name: string; instructions: string }[];
    procedures: { name: string; urgency: string; instructions: string }[];
    monitoringRequirements: string;
  };
  
  disposition: {
    type: 'continue_at_referring' | 'joint_management' | 'transfer' | 'refer_elsewhere';
    instructions: string;
  };
  
  followUp: {
    type: 'tele_follow_up' | 'in_person' | 'none';
    when: string;
    instructions: string;
    responsibleFacility: string;
    responsibleProvider?: string;
  };
  
  orders: {
    medications: any[];
    labs: any[];
    imaging: any[];
    procedures: any[];
  };
  
  documentation: {
    communicationLogRef: string;
    sessionDuration?: number;
    attachmentsUsed: string[];
    boardParticipants?: string[];
    ehrActionsPerformed?: EHRAction[];
  };
  
  status: 'draft' | 'submitted' | 'acknowledged';
  timestamps: {
    startedAt: string;
    completedAt: string;
    acknowledgedAt?: string;
  };
}
```

### Telehealth Work Item

```typescript
interface TelehealthWorkItem {
  workItemId: string;
  type: 'referral' | 'appointment' | 'emergency' | 'chat' | 'case_review';
  referralId: string;
  patientName: string;
  patientAge: number;
  patientHID: string;
  priority: 'routine' | 'urgent' | 'stat' | 'emergency';
  fromFacilityName: string;
  fromProviderName: string;
  timeWaitingMinutes: number;
  requestedModes: TelemedicineMode[];
  status: ReferralStatus;
  scheduledAt?: string;
  specialty: string;
  reason: string;
  unreadMessages?: number;
}
```

### Communication Log

```typescript
interface CommunicationLog {
  logId: string;
  referralId: string;
  type: TelemedicineMode;
  participants: string[];
  messages?: ChatMessage[];
  callMetadata?: {
    startedAt: string;
    endedAt: string;
    duration: number;
    quality: number;
    recordingPath?: string;
  };
  boardMetadata?: {
    leadReviewer: string;
    participants: { id: string; name: string; role: string }[];
    agenda: string;
    outcome: string;
  };
  startedAt: string;
  endedAt?: string;
}
```

---

## 10. Hook Architecture

### Core Hooks

| Hook | Purpose | Key Functions |
|------|---------|---------------|
| `useTeleconsultation` | Session management + WebRTC | `createSession`, `startVideoCall`, `endVideoCall`, `addNote` |
| `useTeleconsultSession` | Session state + events | `onStatusChange`, `onCallAnswered`, `onCallDeclined` |
| `useTeleconsultSessionDraft` | Save/resume for async | `saveDraft`, `loadDraft`, `autoSave` |
| `useTelemedicineRecording` | Auto-recording | `startRecording`, `stopRecording`, `pauseRecording` |
| `useTelemedicineRoles` | RBAC | `permissions`, `primaryRole`, `getRoleLabel` |
| `useTelemedicinePools` | Pool management | `pools`, `assignToPool`, `getPoolStatus` |
| `useTelemedicineTrustLayer` | Security | `requestAccess`, `revokeAccess`, `recordEHRAction` |
| `useMultiParticipantSession` | Group calls | `addParticipant`, `removeParticipant`, `promoteToHost` |
| `useReferralPackageBuilder` | Package creation | `updateDraft`, `buildPackage`, `sendPackage` |

### 7-Stage Teleconsult Hook

```typescript
// src/hooks/useTeleconsultation.ts
export const WORKFLOW_STAGES = [
  { stage: 1, name: 'Referral Package', description: 'Build referral letter and patient summary' },
  { stage: 2, name: 'Routing & Consent', description: 'Route to specialist and capture consent' },
  { stage: 3, name: 'Scheduling', description: 'Schedule teleconsult appointment' },
  { stage: 4, name: 'Waiting Room', description: 'Join virtual waiting room' },
  { stage: 5, name: 'Live Teleconsult', description: 'Video/audio consultation session' },
  { stage: 6, name: 'Documentation', description: 'Record consultation notes and recommendations' },
  { stage: 7, name: 'Completion', description: 'Finalize outcome and follow-up' },
];
```

---

## 11. Component Reference

### Main Components

```
src/components/ehr/consults/
├── index.ts                          # Public exports
├── FullCircleTelemedicineHub.tsx     # Main orchestrator
├── OutgoingReferralWorkflow.tsx      # Facility A workflow
├── IncomingConsultWorkflow.tsx       # Facility B workflow
├── ReferralBuilder.tsx               # 7-step referral wizard
├── ReferralPackageViewer.tsx         # Read-only package display
├── ReferralPackageBuilderDialog.tsx  # Dialog wrapper
├── LiveSessionWorkspace.tsx          # Video/audio/chat session
├── AsyncReviewSession.tsx            # Store & forward review
├── ConsultationResponseBuilder.tsx   # Response form
├── CompletionNote.tsx                # Case closure form
├── TelemedicineModeSelection.tsx     # Mode picker
├── TelemedicineWorkflow.tsx          # Legacy workflow
├── TelehealthDashboard.tsx           # Worklist dashboard
├── TelehealthChatSidebar.tsx         # Persistent chat panel
├── ConsultsDashboard.tsx             # EHR section dashboard
├── TeleconsultSession.tsx            # Session wrapper
├── TeleconsultStatusTracker.tsx      # Status visualization
├── VideoCallPanel.tsx                # Video UI
├── InstantCallOverlay.tsx            # Quick call overlay
├── InstantCommunicationPanel.tsx     # Quick chat panel
├── AddParticipantDialog.tsx          # Multi-party invite
└── RecordingIndicator.tsx            # Recording status
```

### Session Components

```
src/components/ehr/consults/sessions/
├── index.ts
├── ChatSession.tsx                   # Real-time messaging
├── AudioCallSession.tsx              # Voice calls
├── VideoCallSession.tsx              # Video calls
├── ScheduledAppointmentSession.tsx   # Scheduled sessions
└── CaseReviewBoardSession.tsx        # MDT case reviews
```

---

## 12. Database Schema

### Tables

```sql
-- Teleconsult Sessions
CREATE TABLE teleconsult_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id),
  patient_id UUID NOT NULL,
  requesting_provider_id UUID,
  consulting_provider_id UUID,
  session_number TEXT,
  workflow_stage INTEGER DEFAULT 1,
  stage_status TEXT DEFAULT 'pending',
  referral_summary TEXT,
  clinical_question TEXT,
  attachments JSONB,
  urgency TEXT DEFAULT 'routine',
  consent_obtained BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  waiting_room_joined_at TIMESTAMPTZ,
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  sdp_offer TEXT,
  sdp_answer TEXT,
  call_quality_rating INTEGER,
  consultation_notes TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  outcome TEXT,
  is_recorded BOOLEAN DEFAULT false,
  recording_path TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teleconsult Notes
CREATE TABLE teleconsult_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teleconsult_sessions(id),
  author_id UUID NOT NULL,
  note_type TEXT NOT NULL, -- general, subjective, objective, assessment, plan, recommendation
  content TEXT NOT NULL,
  is_shared_with_patient BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teleconsult User Roles
CREATE TABLE teleconsult_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  facility_id UUID,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teleconsult Access Tokens
CREATE TABLE teleconsult_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teleconsult_sessions(id),
  patient_id UUID NOT NULL,
  granted_to_provider_id UUID NOT NULL,
  scope TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ICE Candidates (WebRTC signaling)
CREATE TABLE call_ice_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  candidate_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Sessions: providers can see sessions they're involved in
CREATE POLICY "Providers can view own sessions" ON teleconsult_sessions
  FOR SELECT USING (
    requesting_provider_id = auth.uid() OR 
    consulting_provider_id = auth.uid()
  );

-- Notes: session participants can view notes
CREATE POLICY "Session participants can view notes" ON teleconsult_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teleconsult_sessions s
      WHERE s.id = teleconsult_notes.session_id
      AND (s.requesting_provider_id = auth.uid() OR s.consulting_provider_id = auth.uid())
    )
  );
```

---

## Summary

The Impilo telemedicine system implements a comprehensive referral-to-response workflow supporting:

1. **Six consultation modes** with appropriate UX for each (live vs. async)
2. **7-stage ReferralBuilder** for structured package creation
3. **Bidirectional workflows** for referring and consulting facilities
4. **WebRTC-based** real-time video/audio with Supabase signaling
5. **Trust Layer integration** for secure, consent-gated EHR access
6. **Multi-participant support** for case reviews and group consultations
7. **Save/resume capability** for async and board modes
8. **Comprehensive audit logging** for all clinical actions

The architecture ensures clinical documentation quality while providing flexibility in communication modes based on bandwidth, urgency, and consultation type requirements.
