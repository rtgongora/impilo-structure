// IPS and Visit Summary Types

export type SummaryType = 'ips' | 'visit';
export type IPSSummaryType = 'ips' | 'emergency' | 'referral';
export type SummaryStatus = 'current' | 'superseded' | 'entered-in-error';
export type VisitSummaryStatus = 'draft' | 'final' | 'amended' | 'entered-in-error';
export type GenerationTrigger = 'on_demand' | 'referral' | 'transfer' | 'emergency' | 'discharge' | 'scheduled';
export type AccessLevel = 'full' | 'emergency' | 'redacted' | 'patient_friendly';
export type AccessType = 'view' | 'download' | 'share' | 'print' | 'generate' | 'qr_scan';
export type AccessVia = 'ehr' | 'portal' | 'api' | 'share_link' | 'qr_code' | 'emergency';
export type DispositionType = 'discharged' | 'admitted' | 'referred' | 'transferred' | 'left_ama' | 'deceased' | 'other';
export type RecipientType = 'provider' | 'facility' | 'patient' | 'caregiver' | 'public_link';

// IPS Section Types
export interface AllergyEntry {
  id: string;
  substance: string;
  code?: string;
  codeSystem?: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'inactive' | 'resolved';
  verifiedDate?: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  status: 'active' | 'completed' | 'stopped' | 'on-hold';
  startDate?: string;
  endDate?: string;
  adherenceNotes?: string;
}

export interface ConditionEntry {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  status: 'active' | 'resolved' | 'inactive';
  onsetDate?: string;
  severity?: string;
  category?: 'problem' | 'diagnosis' | 'condition';
}

export interface ImmunizationEntry {
  id: string;
  vaccine: string;
  code?: string;
  codeSystem?: string;
  date: string;
  status: 'completed' | 'not-done' | 'entered-in-error';
  doseNumber?: number;
  lotNumber?: string;
}

export interface ProcedureEntry {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  date: string;
  status: 'completed' | 'in-progress' | 'not-done';
  performer?: string;
  location?: string;
}

export interface DiagnosticResultEntry {
  id: string;
  testName: string;
  code?: string;
  codeSystem?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: 'normal' | 'abnormal' | 'critical';
  date: string;
}

export interface ImagingSummaryEntry {
  id: string;
  studyType: string;
  modality: string;
  bodyPart?: string;
  date: string;
  findings?: string;
  pacsLink?: string;
  reportLink?: string;
}

export interface VitalSignEntry {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
}

export interface DeviceEntry {
  id: string;
  deviceType: string;
  name: string;
  status: 'active' | 'inactive' | 'removed';
  implantDate?: string;
  udi?: string;
}

// IPS (International Patient Summary)
export interface PatientSummary {
  id: string;
  patientId: string;
  healthId?: string;
  summaryType: IPSSummaryType;
  status: SummaryStatus;
  
  // Content sections
  allergies: AllergyEntry[];
  medications: MedicationEntry[];
  conditions: ConditionEntry[];
  immunizations: ImmunizationEntry[];
  procedures: ProcedureEntry[];
  diagnosticResults: DiagnosticResultEntry[];
  imagingSummary: ImagingSummaryEntry[];
  vitalSigns: VitalSignEntry[];
  carePlans: any[];
  socialHistory?: any;
  pregnancyStatus?: any;
  devices: DeviceEntry[];
  advanceDirectives?: any;
  
  // Provenance
  sourceSystems: string[];
  authoringOrganization?: string;
  generationTrigger?: GenerationTrigger;
  dataRecencyNotes?: Record<string, string>;
  
  // Access control
  consentReference?: string;
  redactionApplied: boolean;
  redactedSections: string[];
  accessLevel: AccessLevel;
  
  // Sharing
  shareToken?: string;
  shareTokenExpiresAt?: string;
  qrCodeData?: string;
  
  // Timestamps
  generatedAt: string;
  generatedBy?: string;
  lastAccessedAt?: string;
  expiresAt?: string;
}

// Visit Summary
export interface VisitSummary {
  id: string;
  encounterId: string;
  patientId: string;
  
  // Status and versioning
  status: VisitSummaryStatus;
  version: number;
  previousVersionId?: string;
  amendmentReason?: string;
  
  // Administrative
  facilityId?: string;
  facilityName?: string;
  servicePoint?: string;
  visitType?: string;
  visitStart?: string;
  visitEnd?: string;
  attendingProviders: AttendingProvider[];
  
  // Clinical
  presentingComplaint?: string;
  chiefComplaintCoded?: any;
  keyFindings?: string;
  diagnoses: DiagnosisEntry[];
  proceduresPerformed: ProcedureEntry[];
  medicationsPrescribed: MedicationEntry[];
  medicationsChanged: MedicationChangeEntry[];
  investigationsOrdered: InvestigationEntry[];
  investigationsPending: InvestigationEntry[];
  imagingPerformed: ImagingSummaryEntry[];
  allergiesVerified: AllergyEntry[];
  
  // Disposition
  disposition?: DispositionType;
  dispositionDetails?: string;
  followUpPlan?: string;
  followUpAppointments: FollowUpAppointment[];
  returnPrecautions?: string;
  referralsMade: ReferralEntry[];
  
  // Attachments
  encounterNoteLink?: string;
  labResultsLink?: string;
  imagingLink?: string;
  attachments: AttachmentEntry[];
  
  // Renderings
  providerSummaryHtml?: string;
  patientSummaryHtml?: string;
  providerSummaryPdfPath?: string;
  patientSummaryPdfPath?: string;
  
  // Signing
  signedBy?: string;
  signedAt?: string;
  coSigners: CoSigner[];
  
  // Sharing
  shareToken?: string;
  shareTokenExpiresAt?: string;
  qrCodeData?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface AttendingProvider {
  id: string;
  name: string;
  role: string;
  specialty?: string;
}

export interface DiagnosisEntry {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  type: 'primary' | 'secondary' | 'provisional';
  certainty?: 'confirmed' | 'provisional' | 'differential';
}

export interface MedicationChangeEntry extends MedicationEntry {
  changeType: 'started' | 'stopped' | 'modified' | 'continued';
  previousDose?: string;
  reason?: string;
}

export interface InvestigationEntry {
  id: string;
  name: string;
  code?: string;
  orderedAt: string;
  status: 'ordered' | 'in-progress' | 'completed' | 'cancelled';
  resultSummary?: string;
  resultLink?: string;
}

export interface FollowUpAppointment {
  id: string;
  type: string;
  scheduledDate?: string;
  provider?: string;
  department?: string;
  instructions?: string;
}

export interface ReferralEntry {
  id: string;
  destination: string;
  specialty?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  status: 'pending' | 'accepted' | 'completed';
}

export interface AttachmentEntry {
  id: string;
  type: string;
  name: string;
  url?: string;
  mimeType?: string;
}

export interface CoSigner {
  id: string;
  name: string;
  role: string;
  signedAt: string;
}

// Share Token
export interface SummaryShareToken {
  id: string;
  token: string;
  summaryType: SummaryType;
  summaryId: string;
  patientId: string;
  createdBy: string;
  createdByRole?: string;
  recipientType?: RecipientType;
  recipientIdentifier?: string;
  accessLevel: AccessLevel;
  allowedActions: string[];
  maxAccessCount?: number;
  currentAccessCount: number;
  validFrom: string;
  expiresAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  qrCodeUrl?: string;
}

// Generation options
export interface IPSGenerationOptions {
  trigger: GenerationTrigger;
  accessLevel?: AccessLevel;
  redactSections?: string[];
  includeAttachments?: boolean;
  purpose?: string;
}

export interface VisitSummaryGenerationOptions {
  includeProviderDetails?: boolean;
  patientFriendly?: boolean;
  includeAllInvestigations?: boolean;
  includePendingResults?: boolean;
}

// Share options
export interface ShareOptions {
  recipientType: RecipientType;
  recipientIdentifier?: string;
  accessLevel: AccessLevel;
  expiresInHours: number;
  maxAccessCount?: number;
  allowedActions?: string[];
  generateQR?: boolean;
}
