// Telemedicine Workflow Types per Master Brief
// All 6 consultation modes share the same Referral Package → Consultation Response pattern

export type TelemedicineMode = 
  | 'async'      // Asynchronous review (store & forward) - Specialist reviews offline
  | 'chat'       // Case-linked text conversation
  | 'audio'      // Live voice call (VOIP)
  | 'video'      // Full audio/video consultation
  | 'scheduled'  // Booked teleconsult appointment
  | 'board';     // Case review / M&M / Specialist board

export type ReferralStatus = 
  | 'pending'      // Created, awaiting acceptance
  | 'accepted'     // Specialist has taken ownership
  | 'in_progress'  // Active consultation underway
  | 'completed'    // Consultation Response submitted
  | 'cancelled'    // Withdrawn with reason
  | 'declined'     // Specialist declined the referral
  | 'routed';      // Routed to another facility/provider

export type ReferralUrgency = 'routine' | 'urgent' | 'stat' | 'emergency';

export type DispositionType = 
  | 'continue_at_referring'  // Patient continues care at Facility A
  | 'joint_management'       // Shared care between facilities
  | 'transfer'               // Transfer to consulting facility
  | 'refer_elsewhere';       // Refer to another level

export type FollowUpType = 
  | 'tele_follow_up'    // Telemedicine follow-up
  | 'in_person'         // In-person follow-up
  | 'none';             // No follow-up required

export type ConsentType = 'digital' | 'verbal' | 'proxy' | 'emergency';

// Referral Package - what Facility A sends
export interface ReferralPackage {
  id: string;
  referralNumber: string;
  patientId: string;
  patientHID: string;
  
  // Clinical narrative
  clinicalNarrative: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    pastMedicalHistory: string;
    provisionalDiagnosis: string;
    interventionsDone: string;
    reasonForReferral: string;
    specificQuestions: string[];
  };
  
  // Supporting data
  supportingData: {
    problemList: string[];
    currentMedications: { name: string; dose: string; frequency: string }[];
    allergies: { allergen: string; reaction: string; severity: string }[];
    vitals: { name: string; value: string; timestamp: string }[];
    labResults: { test: string; result: string; date: string }[];
    imaging: { study: string; finding: string; date: string }[];
    attachments: { id: string; name: string; type: string; url: string }[];
  };
  
  // Context
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
  
  // Urgency and modality
  urgency: ReferralUrgency;
  requestedModes: TelemedicineMode[];
  preferredMode: TelemedicineMode;
  requestedTimeSlot?: string; // For scheduled mode
  
  // Consent
  consent: {
    status: 'obtained' | 'pending' | 'waived_emergency';
    type: ConsentType;
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

// Consultation Response - what Facility B/C returns
export interface ConsultationResponse {
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
    type: DispositionType;
    instructions: string;
  };
  
  followUp: {
    type: FollowUpType;
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
  };
  
  status: 'draft' | 'submitted' | 'acknowledged';
  timestamps: {
    startedAt: string;
    completedAt: string;
    acknowledgedAt?: string;
  };
}

// Teleconsult Encounter - links referral and communication
export interface TeleconsultEncounter {
  encounterId: string;
  referralId: string;
  patientId: string;
  initiatingFacilityId: string;
  receivingFacilityId: string;
  currentStatus: ReferralStatus;
  activeModes: TelemedicineMode[];
  communications: string[]; // LOG IDs
  createdAt: string;
  updatedAt: string;
}

// Communication Log for chat, calls and boards
export interface CommunicationLog {
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system' | 'attachment';
  attachmentUrl?: string;
}

// Worklist item for Telehealth Dashboard
export interface TelehealthWorkItem {
  workItemId: string;
  type: 'referral' | 'appointment' | 'emergency' | 'chat' | 'case_review';
  referralId: string;
  patientName: string;
  patientAge: number;
  patientHID: string;
  priority: ReferralUrgency;
  fromFacilityName: string;
  fromProviderName: string;
  timeWaitingMinutes: number;
  requestedModes: TelemedicineMode[];
  status: ReferralStatus;
  scheduledAt?: string;
  specialty: string;
  reason: string;
  unreadMessages?: number; // For chat-type items
}

// Board Session for case reviews
export interface BoardSession {
  id: string;
  referralId: string;
  leadReviewerId: string;
  participants: { id: string; name: string; role: string; joinedAt?: string }[];
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  agenda: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
