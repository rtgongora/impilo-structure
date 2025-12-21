// Impilo EHR Clinical Data Types
// Comprehensive type definitions for clinical workflows

// ============= VITALS & OBSERVATIONS =============

export interface VitalSign {
  id: string;
  type: VitalType;
  value: number;
  unit: string;
  timestamp: Date;
  recordedBy: string;
  isAbnormal?: boolean;
  trend?: "up" | "down" | "stable";
}

export type VitalType = 
  | "heart_rate" 
  | "respiratory_rate" 
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic"
  | "temperature" 
  | "spo2" 
  | "weight" 
  | "height" 
  | "muac"
  | "pain_score"
  | "gcs";

export interface VitalsSnapshot {
  heartRate?: VitalSign;
  respiratoryRate?: VitalSign;
  bloodPressure?: { systolic: VitalSign; diastolic: VitalSign };
  temperature?: VitalSign;
  spo2?: VitalSign;
  weight?: VitalSign;
  height?: VitalSign;
  muac?: VitalSign;
  painScore?: VitalSign;
  lastMeasuredTime?: Date;
}

// ============= TRIAGE =============

export type TriageCategory = "red" | "orange" | "yellow" | "green";
export type ArrivalMode = "walk-in" | "ambulance" | "referral" | "police" | "other";

export interface TriageAssessment {
  id: string;
  category: TriageCategory;
  arrivalMode: ArrivalMode;
  arrivalTime: Date;
  triageTime: Date;
  triagedBy: string;
  dangerSigns: DangerSign[];
  chiefComplaint: string;
  notes?: string;
}

export interface DangerSign {
  id: string;
  name: string;
  present: boolean;
  category: "airway" | "breathing" | "circulation" | "disability" | "exposure";
}

// ============= ALERTS =============

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = 
  | "allergy" 
  | "chronic_condition" 
  | "high_risk_pregnancy"
  | "disability"
  | "infection_control"
  | "medication"
  | "fall_risk"
  | "isolation";

export interface ClinicalAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ============= EPISODES & PATHWAYS =============

export type EpisodeType = 
  | "pregnancy" 
  | "hiv_care" 
  | "tb_treatment" 
  | "ncd_management"
  | "mental_health"
  | "chronic_wound"
  | "post_surgical";

export type PathwayType = 
  | "anc" 
  | "pnc" 
  | "hiv_chronic" 
  | "tb_treatment"
  | "diabetes"
  | "hypertension"
  | "asthma";

export interface CareEpisode {
  id: string;
  type: EpisodeType;
  name: string;
  status: "active" | "resolved" | "on_hold";
  startDate: Date;
  endDate?: Date;
  managingTeam?: string;
  notes?: string;
}

export interface EnrolledPathway {
  id: string;
  type: PathwayType;
  name: string;
  enrollmentDate: Date;
  currentPhase: string;
  nextVisitDate?: Date;
  progress: number; // 0-100
  alerts?: string[];
}

// ============= TASKS =============

export type TaskType = 
  | "lab" 
  | "imaging" 
  | "medication" 
  | "nursing" 
  | "consult" 
  | "chw" 
  | "procedure"
  | "documentation";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
export type TaskPriority = "routine" | "urgent" | "stat";

export interface ClinicalTask {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

// ============= HISTORY & EXAMINATION =============

export interface ClinicalHistory {
  presentingComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: PastMedicalCondition[];
  pastSurgicalHistory: PastSurgery[];
  obsGynHistory?: ObsGynHistory;
  drugHistory: DrugHistoryItem[];
  allergies: AllergyRecord[];
  familyHistory?: FamilyHistoryItem[];
  socialHistory?: SocialHistory;
}

export interface PastMedicalCondition {
  id: string;
  condition: string;
  icdCode?: string;
  diagnosed?: Date;
  status: "active" | "resolved" | "controlled";
  notes?: string;
}

export interface PastSurgery {
  id: string;
  procedure: string;
  date?: Date;
  facility?: string;
  complications?: string;
}

export interface ObsGynHistory {
  gravida: number;
  para: number;
  abortions?: number;
  livingChildren?: number;
  lastMenstrualPeriod?: Date;
  expectedDeliveryDate?: Date;
  gestationalAge?: number; // weeks
  previousComplications?: string[];
  contraceptionHistory?: string;
}

export interface DrugHistoryItem {
  id: string;
  medication: string;
  dose: string;
  frequency: string;
  route: string;
  startDate?: Date;
  endDate?: Date;
  isCurrentlyTaking: boolean;
}

export interface AllergyRecord {
  id: string;
  allergen: string;
  type: "drug" | "food" | "environmental" | "other";
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  confirmed: boolean;
}

export interface FamilyHistoryItem {
  id: string;
  condition: string;
  relationship: string;
  notes?: string;
}

export interface SocialHistory {
  occupation?: string;
  smokingStatus: "never" | "former" | "current";
  smokingPackYears?: number;
  alcoholUse: "none" | "occasional" | "moderate" | "heavy";
  substanceUse?: string;
  livingConditions?: string;
  supportSystem?: string;
}

export interface PhysicalExamination {
  generalAppearance: GeneralAppearance;
  systems: SystemExamination[];
  additionalFindings?: string;
  examinedBy: string;
  examinedAt: Date;
}

export interface GeneralAppearance {
  alert: boolean;
  distressed: boolean;
  pale: boolean;
  jaundiced: boolean;
  cyanosed: boolean;
  dehydrated: boolean;
  oedema: boolean;
  description?: string;
}

export type ExamSystem = 
  | "cardiovascular"
  | "respiratory"
  | "abdominal"
  | "neurological"
  | "musculoskeletal"
  | "skin"
  | "ent"
  | "eye"
  | "genitourinary"
  | "psychiatric";

export interface SystemExamination {
  system: ExamSystem;
  findings: string;
  isNormal: boolean;
  abnormalities?: string[];
}

// ============= PROBLEMS & DIAGNOSES =============

export type DiagnosisCertainty = "suspected" | "provisional" | "confirmed";
export type ProblemStatus = "active" | "resolved" | "recurrence" | "remission";

export interface Problem {
  id: string;
  name: string;
  snomedCode?: string;
  onsetDate?: Date;
  resolvedDate?: Date;
  status: ProblemStatus;
  comments?: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface Diagnosis {
  id: string;
  name: string;
  icdCode?: string;
  isPrimary: boolean;
  certainty: DiagnosisCertainty;
  onsetType: "acute" | "chronic" | "recurrent";
  linkedProblemId?: string;
  notes?: string;
  diagnosedBy: string;
  diagnosedAt: Date;
}

// ============= ORDERS =============

export type OrderType = "lab" | "imaging" | "procedure" | "medication" | "referral" | "consult";
export type OrderStatus = "draft" | "pending" | "in_progress" | "completed" | "cancelled";
export type OrderPriority = "routine" | "urgent" | "stat";

export interface BaseOrder {
  id: string;
  type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  orderedBy: string;
  orderedAt: Date;
  clinicalIndication: string;
  notes?: string;
}

export interface LabOrder extends BaseOrder {
  type: "lab";
  testPanel: string;
  specimenType?: string;
  collectionTime?: Date;
  resultId?: string;
}

export interface ImagingOrder extends BaseOrder {
  type: "imaging";
  modality: "xray" | "ultrasound" | "ct" | "mri" | "fluoroscopy";
  bodyPart: string;
  contrast?: boolean;
  specialInstructions?: string;
}

export interface ProcedureOrder extends BaseOrder {
  type: "procedure";
  procedureName: string;
  site?: string;
  scheduledTime?: Date;
  consentObtained?: boolean;
}

export interface MedicationOrder extends BaseOrder {
  type: "medication";
  medication: string;
  dose: string;
  route: "oral" | "iv" | "im" | "sc" | "topical" | "inhaled" | "rectal" | "sublingual";
  frequency: string;
  duration?: string;
  startDate: Date;
  endDate?: Date;
  instructions?: string;
}

export type Order = LabOrder | ImagingOrder | ProcedureOrder | MedicationOrder;

// ============= RESULTS =============

export interface LabResult {
  id: string;
  orderId: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  isCritical: boolean;
  collectedAt: Date;
  reportedAt: Date;
  verifiedBy?: string;
}

export interface ImagingResult {
  id: string;
  orderId: string;
  modality: string;
  bodyPart: string;
  findings: string;
  impression: string;
  reportedBy: string;
  reportedAt: Date;
  images?: string[]; // URLs
}

// ============= CARE & MANAGEMENT (Inpatient) =============

export interface MedicationAdministration {
  id: string;
  medicationOrderId: string;
  medication: string;
  dose: string;
  route: string;
  scheduledTime: Date;
  administeredTime?: Date;
  administeredBy?: string;
  status: "scheduled" | "given" | "missed" | "held" | "refused";
  reasonNotGiven?: string;
  site?: string;
  notes?: string;
}

export interface FluidBalance {
  id: string;
  date: Date;
  intakeOral: number;
  intakeIV: number;
  intakeOther: number;
  outputUrine: number;
  outputStool: number;
  outputVomitus: number;
  outputDrains: number;
  netBalance: number;
  recordedBy: string;
}

export interface NursingTask {
  id: string;
  type: "vitals" | "wound_care" | "catheter_care" | "positioning" | "physiotherapy" | "feeding" | "hygiene" | "other";
  description: string;
  dueTime: Date;
  completedTime?: Date;
  completedBy?: string;
  status: "pending" | "completed" | "missed" | "deferred";
  notes?: string;
}

export interface CarePlan {
  id: string;
  goals: CareGoal[];
  interventions: CareIntervention[];
  reviewDate?: Date;
  responsibleTeam?: string;
  createdBy: string;
  createdAt: Date;
}

export interface CareGoal {
  id: string;
  description: string;
  targetDate?: Date;
  status: "active" | "achieved" | "not_achieved" | "revised";
  progress?: string;
}

export interface CareIntervention {
  id: string;
  type: "medication" | "therapy" | "nursing" | "dietary" | "counselling" | "monitoring";
  description: string;
  frequency?: string;
  responsibleCadre?: string;
  status: "planned" | "active" | "completed" | "discontinued";
}

export interface OxygenTherapy {
  id: string;
  deviceType: "nasal_cannula" | "face_mask" | "venturi_mask" | "non_rebreather" | "hfnc" | "cpap" | "bipap" | "ventilator";
  flowRate?: number; // L/min
  fio2?: number; // percentage
  startTime: Date;
  endTime?: Date;
  orderedBy: string;
  notes?: string;
}

// ============= CONSULTS & REFERRALS =============

export type ReferralStatus = "pending" | "accepted" | "completed" | "rejected" | "cancelled";
export type ConsultMode = "in_person" | "async" | "teleconsult";

export interface Referral {
  id: string;
  referringFacility: string;
  receivingFacility: string;
  receivingDepartment: string;
  reason: string;
  urgency: "routine" | "urgent" | "emergency";
  transportMode?: "ambulance" | "self" | "other";
  status: ReferralStatus;
  createdBy: string;
  createdAt: Date;
  attachments?: string[];
  response?: string;
  respondedAt?: Date;
}

export interface ConsultRequest {
  id: string;
  specialty: string;
  requestedBy: string;
  requestedAt: Date;
  caseSummary: string;
  clinicalQuestion: string;
  preferredMode: ConsultMode;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
}

export interface Teleconsultation {
  id: string;
  mode: "chat" | "audio" | "video";
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  participants: string[];
  summary?: string;
  recommendations?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

// ============= NOTES & ATTACHMENTS =============

export type NoteType = 
  | "progress" 
  | "ward_round" 
  | "emergency" 
  | "procedure" 
  | "handover" 
  | "specialist"
  | "discharge_summary";

export interface ClinicalNote {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  author: string;
  authorRole: string;
  createdAt: Date;
  signedAt?: Date;
  cosignedBy?: string;
  isAddendum?: boolean;
  parentNoteId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "pdf" | "document" | "other";
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  category?: string;
  description?: string;
}

// ============= VISIT OUTCOME =============

export type DispositionType = 
  | "discharge" 
  | "admit" 
  | "transfer" 
  | "refer" 
  | "death" 
  | "left_ama" 
  | "absconded";

export interface VisitOutcome {
  id: string;
  disposition: DispositionType;
  diagnoses: Diagnosis[];
  dischargeMedications?: MedicationOrder[];
  followUpFacility?: string;
  followUpDate?: Date;
  counsellingDone?: string[];
  chwTasks?: ClinicalTask[];
  specialInstructions?: string;
  completedBy: string;
  completedAt: Date;
}

export interface DeathRecord {
  id: string;
  timeOfDeath: Date;
  causeOfDeath: string;
  contributingFactors?: string[];
  certifiedBy: string;
  certifiedAt: Date;
}

// ============= CONSUMABLES =============

export interface Consumable {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  lotNumber?: string;
  expiryDate?: Date;
  usedAt: Date;
  usedBy: string;
  workspaceId?: string;
  procedureId?: string;
}

// ============= CHARGES =============

export type ChargeStatus = "pending" | "verified" | "billed" | "paid" | "waived";

export interface Charge {
  id: string;
  itemType: "procedure" | "medication" | "consumable" | "service" | "bed" | "lab" | "imaging";
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: ChargeStatus;
  isProgrammeCovered: boolean;
  subsidyPercentage?: number;
  createdAt: Date;
  linkedOrderId?: string;
  linkedProcedureId?: string;
}
