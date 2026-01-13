// Patient Care Tracker Types
// Aligns with PCT specification and database schema

// ===========================================
// VISIT/EPISODE TYPES (PCT-MODEL)
// ===========================================

export type VisitType = 
  | 'outpatient'
  | 'inpatient'
  | 'emergency'
  | 'day_case'
  | 'home_care'
  | 'telehealth'
  | 'programme';

export type VisitStatus = 
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export type VisitOutcome = 
  | 'discharged_home'
  | 'discharged_care'
  | 'transferred'
  | 'admitted'
  | 'death'
  | 'lama'
  | 'absconded'
  | 'administrative_closure'
  | 'ongoing';

export interface Visit {
  id: string;
  visitNumber: string;
  patientId: string;
  visitType: VisitType;
  status: VisitStatus;
  
  // Facility context
  facilityId?: string;
  facilityName?: string;
  programmeCode?: string;
  programmeName?: string;
  
  // Timing
  startDate: string;
  endDate?: string;
  expectedDischargeDate?: string;
  
  // Outcome
  outcome?: VisitOutcome;
  outcomeDetails?: string;
  outcomeAt?: string;
  outcomeBy?: string;
  
  // Admission specific
  admissionSource?: string;
  admissionReason?: string;
  wardId?: string;
  bedId?: string;
  attendingPhysicianId?: string;
  
  // Transfer tracking
  transferredFromVisitId?: string;
  transferredToVisitId?: string;
  transferReason?: string;
  
  // Identity
  temporaryIdentityId?: string;
  identityReconciledAt?: string;
  
  // Conclusion requirements
  summaryGenerated: boolean;
  medsReconciled: boolean;
  pendingResultsAssigned: boolean;
  conclusionSignedBy?: string;
  conclusionSignedAt?: string;
  
  // Metadata
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  
  // Related data (populated on demand)
  encounters?: EncounterSummary[];
  documents?: DocumentReference[];
}

export interface EncounterSummary {
  id: string;
  encounterNumber: string;
  encounterType: string;
  status: string;
  admissionDate: string;
  dischargeDate?: string;
  chiefComplaint?: string;
  primaryDiagnosis?: string;
  sequence: number;
}

// ===========================================
// CLINICAL DOCUMENT TYPES (PCT-DOC)
// ===========================================

export type ClinicalDocumentType = 
  | 'ips'
  | 'visit_summary'
  | 'discharge_summary'
  | 'ed_summary'
  | 'transfer_summary'
  | 'referral_summary'
  | 'lab_report'
  | 'imaging_report'
  | 'procedure_note'
  | 'death_summary'
  | 'lama_summary'
  | 'operative_note'
  | 'consultation_note'
  | 'progress_note';

export type DocumentStatus = 
  | 'draft'
  | 'pending_signature'
  | 'final'
  | 'amended'
  | 'superseded'
  | 'entered_in_error';

export interface ClinicalDocument {
  id: string;
  documentNumber: string;
  documentType: ClinicalDocumentType;
  documentSubtype?: string;
  loincCode?: string;
  loincDisplay?: string;
  
  // Ownership
  patientId: string;
  visitId?: string;
  encounterId?: string;
  
  // Content
  title: string;
  status: DocumentStatus;
  version: number;
  previousVersionId?: string;
  
  // Structured content
  contentJson?: Record<string, any>;
  contentFhir?: Record<string, any>;
  
  // Rendered versions
  htmlContent?: string;
  patientFriendlyHtml?: string;
  pdfPath?: string;
  patientFriendlyPdfPath?: string;
  
  // Provenance
  authoringFacilityId?: string;
  authoringFacilityName?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  
  // Signing
  signedBy?: string;
  signedByName?: string;
  signedAt?: string;
  signatureHash?: string;
  coSigners?: CoSigner[];
  
  // Amendment
  amendmentReason?: string;
  amendedSections?: string[];
  
  // Sharing
  shareToken?: string;
  shareTokenExpiresAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface CoSigner {
  id: string;
  name: string;
  role: string;
  signedAt: string;
}

export interface DocumentReference {
  id: string;
  documentId: string;
  patientId: string;
  visitId?: string;
  encounterId?: string;
  documentType: ClinicalDocumentType;
  documentDate: string;
  facilityId?: string;
  facilityName?: string;
  title: string;
  status: DocumentStatus;
  authorName?: string;
  tags?: string[];
}

// ===========================================
// DISCHARGE SUMMARY (PCT-DOC-DS)
// ===========================================

export interface DischargeSummary {
  id: string;
  documentId: string;
  visitId: string;
  patientId: string;
  
  // Administrative
  admissionDate: string;
  dischargeDate: string;
  facilityName?: string;
  wardName?: string;
  
  // Diagnoses
  primaryDiagnosis?: string;
  primaryDiagnosisCode?: string;
  secondaryDiagnoses: DiagnosisEntry[];
  
  // Hospital course
  hospitalCourseNarrative?: string;
  significantProcedures: ProcedureEntry[];
  
  // Medications
  dischargeMedications: MedicationEntry[];
  medicationsStopped: MedicationEntry[];
  medicationsChanged: MedicationChangeEntry[];
  medicationReconciliationBy?: string;
  medicationReconciliationAt?: string;
  
  // Results
  keyLabResults: LabResultEntry[];
  keyImagingResults: ImagingResultEntry[];
  pendingResults: PendingResultEntry[];
  pendingResultsReviewer?: string;
  pendingResultsFollowupPlan?: string;
  
  // Follow-up
  followUpAppointments: FollowUpEntry[];
  referrals: ReferralEntry[];
  patientInstructions?: string;
  warningSigns?: string;
  
  // Condition
  conditionAtDischarge?: string;
  functionalStatus?: string;
}

export interface DiagnosisEntry {
  code?: string;
  display: string;
  type: 'primary' | 'secondary' | 'comorbidity';
}

export interface ProcedureEntry {
  code?: string;
  name: string;
  date: string;
  performer?: string;
}

export interface MedicationEntry {
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
  instructions?: string;
}

export interface MedicationChangeEntry extends MedicationEntry {
  changeType: 'started' | 'stopped' | 'modified';
  reason?: string;
  previousDose?: string;
}

export interface LabResultEntry {
  testName: string;
  value: string;
  unit?: string;
  date: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
}

export interface ImagingResultEntry {
  modality: string;
  bodyPart?: string;
  date: string;
  findings?: string;
  impression?: string;
}

export interface PendingResultEntry {
  testName: string;
  orderedDate: string;
  expectedDate?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export interface FollowUpEntry {
  type: string;
  scheduledDate?: string;
  provider?: string;
  department?: string;
  instructions?: string;
}

export interface ReferralEntry {
  destination: string;
  specialty?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  status: 'pending' | 'accepted' | 'completed';
}

// ===========================================
// TRANSFER SUMMARY (PCT-DOC-TR)
// ===========================================

export interface TransferSummary {
  id: string;
  documentId: string;
  visitId: string;
  patientId: string;
  
  transferReason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  destinationFacilityId?: string;
  destinationFacilityName?: string;
  destinationDepartment?: string;
  acceptingProvider?: string;
  
  // Package references
  ipsDocumentId?: string;
  visitSummaryDocumentId?: string;
  
  // Clinical snapshot
  currentMedications: MedicationEntry[];
  allergies: string[];
  activeProblems: string[];
  recentResults: LabResultEntry[];
  recentImaging: ImagingResultEntry[];
  
  // Handover
  handoverNotes?: string;
  pendingInvestigations?: string;
  criticalInformation?: string;
  
  // Status
  acceptanceStatus: 'pending' | 'accepted' | 'declined';
  acceptedAt?: string;
  acceptedBy?: string;
  arrivalConfirmedAt?: string;
}

// ===========================================
// PATIENT CARE STATE (PCT-OPS-02)
// ===========================================

export type CareState = 
  | 'waiting'
  | 'in_service'
  | 'pending_results'
  | 'pending_disposition'
  | 'ready_discharge'
  | 'transfer_pending';

export interface PatientCareState {
  id: string;
  patientId: string;
  visitId?: string;
  encounterId?: string;
  
  // Location
  currentWorkspaceId?: string;
  currentWorkspaceName?: string;
  currentServicePoint?: string;
  facilityId?: string;
  
  // State
  careState: CareState;
  stateStartedAt: string;
  
  // Responsibility
  responsibleTeam?: string;
  responsibleProviderId?: string;
  responsibleProviderName?: string;
  
  // Next action
  nextExpectedAction?: string;
  nextActionDueAt?: string;
  actionOverdue: boolean;
  
  // Alerts
  hasStalledFlow: boolean;
  stallReason?: string;
  escalationNeeded: boolean;
  alerts: AlertEntry[];
  
  // Timing
  lastActivityAt: string;
  updatedAt: string;
}

export interface AlertEntry {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

// ===========================================
// FACILITY OPERATIONS (PCT-OPS-01)
// ===========================================

export interface FacilityOperationsDashboard {
  facilityId: string;
  facilityName: string;
  arrivalsToday: number;
  sortingPending: number;
  queueBacklog: number;
  investigationsPending: number;
  readyForDischarge: number;
  transfersPending: number;
  stalledFlows: number;
}

// ===========================================
// UI CONFIGURATION
// ===========================================

export const VISIT_TYPE_CONFIG: Record<VisitType, { label: string; icon: string; color: string }> = {
  outpatient: { label: 'Outpatient', icon: 'User', color: 'blue' },
  inpatient: { label: 'Inpatient', icon: 'Bed', color: 'purple' },
  emergency: { label: 'Emergency', icon: 'AlertTriangle', color: 'red' },
  day_case: { label: 'Day Case', icon: 'Clock', color: 'orange' },
  home_care: { label: 'Home Care', icon: 'Home', color: 'green' },
  telehealth: { label: 'Telehealth', icon: 'Video', color: 'cyan' },
  programme: { label: 'Programme', icon: 'Layers', color: 'indigo' },
};

export const VISIT_STATUS_CONFIG: Record<VisitStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'gray' },
  active: { label: 'Active', color: 'green' },
  completed: { label: 'Completed', color: 'blue' },
  cancelled: { label: 'Cancelled', color: 'red' },
  on_hold: { label: 'On Hold', color: 'yellow' },
};

export const VISIT_OUTCOME_CONFIG: Record<VisitOutcome, { label: string; icon: string; color: string }> = {
  discharged_home: { label: 'Discharged Home', icon: 'Home', color: 'green' },
  discharged_care: { label: 'Discharged to Care', icon: 'Heart', color: 'blue' },
  transferred: { label: 'Transferred', icon: 'ArrowRightLeft', color: 'orange' },
  admitted: { label: 'Admitted', icon: 'Bed', color: 'purple' },
  death: { label: 'Death', icon: 'Cross', color: 'gray' },
  lama: { label: 'Left AMA', icon: 'LogOut', color: 'red' },
  absconded: { label: 'Absconded', icon: 'UserX', color: 'red' },
  administrative_closure: { label: 'Administrative Closure', icon: 'FileX', color: 'gray' },
  ongoing: { label: 'Ongoing', icon: 'Clock', color: 'blue' },
};

export const DOCUMENT_TYPE_CONFIG: Record<ClinicalDocumentType, { label: string; icon: string; color: string }> = {
  ips: { label: 'Patient Summary (IPS)', icon: 'FileHeart', color: 'purple' },
  visit_summary: { label: 'Visit Summary', icon: 'FileText', color: 'blue' },
  discharge_summary: { label: 'Discharge Summary', icon: 'FileCheck', color: 'green' },
  ed_summary: { label: 'ED Summary', icon: 'AlertTriangle', color: 'red' },
  transfer_summary: { label: 'Transfer Summary', icon: 'ArrowRightLeft', color: 'orange' },
  referral_summary: { label: 'Referral Summary', icon: 'Forward', color: 'cyan' },
  lab_report: { label: 'Lab Report', icon: 'TestTube', color: 'teal' },
  imaging_report: { label: 'Imaging Report', icon: 'Scan', color: 'indigo' },
  procedure_note: { label: 'Procedure Note', icon: 'Stethoscope', color: 'pink' },
  death_summary: { label: 'Death Summary', icon: 'FileX', color: 'gray' },
  lama_summary: { label: 'LAMA Summary', icon: 'LogOut', color: 'red' },
  operative_note: { label: 'Operative Note', icon: 'Scissors', color: 'purple' },
  consultation_note: { label: 'Consultation Note', icon: 'MessageSquare', color: 'blue' },
  progress_note: { label: 'Progress Note', icon: 'FileEdit', color: 'green' },
};

export const CARE_STATE_CONFIG: Record<CareState, { label: string; icon: string; color: string }> = {
  waiting: { label: 'Waiting', icon: 'Clock', color: 'gray' },
  in_service: { label: 'In Service', icon: 'Stethoscope', color: 'green' },
  pending_results: { label: 'Pending Results', icon: 'FlaskConical', color: 'yellow' },
  pending_disposition: { label: 'Pending Disposition', icon: 'HelpCircle', color: 'orange' },
  ready_discharge: { label: 'Ready for Discharge', icon: 'CheckCircle', color: 'blue' },
  transfer_pending: { label: 'Transfer Pending', icon: 'ArrowRightLeft', color: 'purple' },
};
