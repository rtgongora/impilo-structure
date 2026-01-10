/**
 * Patient Context Management Types
 * 
 * Aligned with global EHR standards:
 * - IHE CCOW (Clinical Context Object Workgroup) - Context synchronization
 * - HL7 FHIR Context - Patient/encounter resource management
 * - HIPAA Minimum Necessary - Access justification and audit
 * - Joint Commission Standards - Patient identification and safety
 */

// Access reasons aligned with HIPAA minimum necessary principle
export type ChartAccessReason = 
  | "treatment"           // Direct patient care (most common)
  | "care_coordination"   // Coordinating care with other providers
  | "quality_review"      // Quality assurance activities
  | "emergency"           // Emergency access (break-the-glass)
  | "patient_request"     // Patient requested their records
  | "legal"               // Legal/compliance requirement
  | "research"            // IRB-approved research (with consent)
  | "queue_assignment"    // Automatically assigned from queue
  | "scheduled_appointment"; // Pre-scheduled appointment

export interface ChartAccessRequest {
  reason: ChartAccessReason;
  encounterId: string;
  patientId: string;
  accessedAt: Date;
  accessedBy: string;
  queueItemId?: string;
  appointmentId?: string;
  justificationNotes?: string; // Required for emergency/legal access
  expiresAt?: Date; // Auto-close after timeout
}

export interface PatientContext {
  isActive: boolean;
  encounterId: string | null;
  patientId: string | null;
  patientName: string | null;
  mrn: string | null;
  accessRequest: ChartAccessRequest | null;
  lockedAt: Date | null; // When context was established
  source: PatientContextSource;
}

export type PatientContextSource = 
  | "queue"           // Selected from queue management
  | "worklist"        // Selected from provider worklist
  | "appointment"     // From scheduled appointment
  | "search"          // Direct patient search (requires justification)
  | "emergency"       // Emergency/break-the-glass
  | "handoff"         // Received via shift handoff
  | "referral"        // Incoming referral
  | "callback"        // Patient callback/follow-up
  | "none";           // No context (initial state)

// Patient identification confirmation (Joint Commission NPSG.01.01.01)
export interface PatientIdentificationCheck {
  identifiers: {
    name: boolean;
    dob: boolean;
    mrn: boolean;
  };
  confirmedAt: Date | null;
  confirmedBy: string | null;
}

// Chart access audit record
export interface ChartAccessAuditRecord {
  id: string;
  encounterId: string;
  patientId: string;
  userId: string;
  userName: string;
  accessReason: ChartAccessReason;
  justificationNotes?: string;
  accessedAt: Date;
  closedAt?: Date;
  source: PatientContextSource;
  actionsPerformed: string[];
  ipAddress?: string;
  deviceInfo?: string;
}

// Context switch validation
export interface ContextSwitchValidation {
  canSwitch: boolean;
  pendingActions: string[];
  unsavedChanges: boolean;
  requiresConfirmation: boolean;
  warningMessage?: string;
}

// Break-the-glass emergency access (IHE/HIPAA)
export interface EmergencyAccessRequest {
  patientId: string;
  reason: string;
  urgencyLevel: "critical" | "urgent";
  requestedBy: string;
  requestedAt: Date;
  supervisorNotified: boolean;
  autoExpiresAt: Date; // Emergency access has time limit
}

// Access reason display configuration
export const ACCESS_REASON_CONFIG: Record<ChartAccessReason, {
  label: string;
  description: string;
  requiresJustification: boolean;
  icon: string;
}> = {
  treatment: {
    label: "Direct Patient Care",
    description: "Providing treatment or care to this patient",
    requiresJustification: false,
    icon: "Stethoscope",
  },
  care_coordination: {
    label: "Care Coordination",
    description: "Coordinating care with other providers",
    requiresJustification: false,
    icon: "Users",
  },
  quality_review: {
    label: "Quality Review",
    description: "Quality assurance or peer review",
    requiresJustification: true,
    icon: "ClipboardCheck",
  },
  emergency: {
    label: "Emergency Access",
    description: "Urgent access without prior relationship",
    requiresJustification: true,
    icon: "AlertTriangle",
  },
  patient_request: {
    label: "Patient Request",
    description: "Patient requested access to their records",
    requiresJustification: true,
    icon: "User",
  },
  legal: {
    label: "Legal/Compliance",
    description: "Legal or regulatory requirement",
    requiresJustification: true,
    icon: "Scale",
  },
  research: {
    label: "Research",
    description: "IRB-approved research with consent",
    requiresJustification: true,
    icon: "FlaskConical",
  },
  queue_assignment: {
    label: "Queue Assignment",
    description: "Patient assigned from queue",
    requiresJustification: false,
    icon: "ListOrdered",
  },
  scheduled_appointment: {
    label: "Scheduled Appointment",
    description: "Pre-scheduled appointment",
    requiresJustification: false,
    icon: "Calendar",
  },
};
