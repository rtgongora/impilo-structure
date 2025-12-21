// Impilo EHR Workspace Type Definitions
// Detailed workspace templates and data structures

import { Consumable, VitalsSnapshot, VitalSign } from "./clinical";

// ============= BASE WORKSPACE =============

export type WorkspacePhase = "start" | "execute" | "complete" | "exit";
export type WorkspaceStatus = "active" | "completed" | "cancelled";

export interface WorkspaceHeader {
  name: string;
  patientName: string;
  patientId: string;
  startTime: Date;
  elapsedTime: number; // seconds
  status: WorkspaceStatus;
}

export interface WorkspaceBase {
  id: string;
  type: WorkspaceType;
  encounterId: string;
  phase: WorkspacePhase;
  status: WorkspaceStatus;
  header: WorkspaceHeader;
  startTime: Date;
  endTime?: Date;
  initiatingUser: string;
  terminatingUser?: string;
  location: string;
  participatingRoles: string[];
  consumablesUsed: Consumable[];
  summary?: WorkspaceSummary;
}

export interface WorkspaceSummary {
  generatedAt: Date;
  generatedBy: string;
  content: string;
  keyFindings?: string[];
  procedures?: string[];
  complications?: string[];
  outcome?: string;
}

// ============= WORKSPACE TYPES =============

export type WorkspaceType = 
  | "theatre"
  | "trauma"
  | "resuscitation"
  | "labour_delivery"
  | "dialysis"
  | "chemotherapy"
  | "minor_procedure"
  | "burns"
  | "poisoning"
  | "sexual_assault"
  | "neonatal_resus"
  | "rapid_response"
  | "code_blue"
  | "anaesthesia_preop"
  | "endoscopy"
  | "interventional_radiology"
  | "physiotherapy"
  | "psychotherapy";

// ============= THEATRE WORKSPACE =============

export interface TheatreWorkspace extends WorkspaceBase {
  type: "theatre";
  procedureRequest: ProcedureRequest;
  preOpAssessment: PreOpAssessment;
  consent: ConsentRecord;
  theatreLog: TheatreLog;
  surgicalTeam: SurgicalTeamMember[];
  anaesthesiaRecord: AnaesthesiaRecord;
  intraOpSteps: IntraOpStep[];
  specimens: SpecimenRecord[];
  implants: ImplantRecord[];
  postOpPlan: PostOpPlan;
  operativeNote?: OperativeNote;
}

export interface ProcedureRequest {
  procedureCode: string;
  procedureName: string;
  indication: string;
  priority: "elective" | "urgent" | "emergency";
  proposedDateTime?: Date;
  requiredStaff?: string[];
  requiredEquipment?: string[];
  requiredImplants?: string[];
}

export interface PreOpAssessment {
  medicalHistory: string[];
  comorbidities: string[];
  airwayAssessment: AirwayAssessment;
  functionalStatus: string;
  relevantLabs: string[];
  relevantImaging: string[];
  asaClass: 1 | 2 | 3 | 4 | 5 | 6;
  optimisationRequired?: string;
  assessedBy: string;
  assessedAt: Date;
}

export interface AirwayAssessment {
  mallampatiScore: 1 | 2 | 3 | 4;
  mouthOpening: "adequate" | "limited" | "severely_limited";
  neckMobility: "normal" | "reduced" | "fixed";
  dentition: "normal" | "poor" | "edentulous" | "difficult";
  predictedDifficulty: "easy" | "moderate" | "difficult";
  notes?: string;
}

export interface ConsentRecord {
  procedureConsent: boolean;
  anaesthesiaConsent: boolean;
  bloodProductsConsent?: boolean;
  risksExplained: string[];
  witnessName?: string;
  witnessedAt?: Date;
  documentReference?: string;
  consentedBy: string;
  consentedAt: Date;
}

export interface TheatreLog {
  patientInRoom?: Date;
  anaesthesiaStart?: Date;
  incisionStart?: Date;
  incisionClosure?: Date;
  anaesthesiaEnd?: Date;
  outOfTheatre?: Date;
  totalTheatreTime?: number; // minutes
  totalSurgicalTime?: number; // minutes
}

export interface SurgicalTeamMember {
  role: "primary_surgeon" | "assistant" | "anaesthetist" | "scrub_nurse" | "runner" | "student";
  name: string;
  practitionerId?: string;
}

export interface AnaesthesiaRecord {
  type: "general" | "spinal" | "epidural" | "regional" | "local" | "sedation" | "combined";
  airwayDevice?: string;
  drugsAdministered: AnaesthesiaDrug[];
  ventilationParameters?: VentilationParams;
  intraOpEvents: IntraOpEvent[];
  fluidBalance: {
    inputIV: number;
    outputUrine: number;
    outputBlood: number;
  };
}

export interface AnaesthesiaDrug {
  drug: string;
  dose: string;
  route: string;
  time: Date;
}

export interface VentilationParams {
  mode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  fio2?: number;
}

export interface IntraOpEvent {
  time: Date;
  type: "hypotension" | "hypertension" | "arrhythmia" | "desaturation" | "bleeding" | "other";
  description: string;
  action: string;
}

export interface IntraOpStep {
  stepNumber: number;
  description: string;
  completedAt?: Date;
  complications?: string;
  notes?: string;
}

export interface SpecimenRecord {
  id: string;
  type: string;
  site: string;
  label: string;
  destinationLab: string;
  collectedAt: Date;
}

export interface ImplantRecord {
  id: string;
  type: string;
  manufacturer?: string;
  lotNumber?: string;
  site: string;
  insertedAt: Date;
}

export interface PostOpPlan {
  destination: "pacu" | "icu" | "hdu" | "ward";
  analgesiaPlan: string;
  antibioticsPlan?: string;
  monitoringFrequency: string;
  vteProhylaxis?: string;
  specialInstructions?: string;
}

export interface OperativeNote {
  preOpDiagnosis: string;
  postOpDiagnosis: string;
  procedurePerformed: string;
  findings: string;
  stepsSummary: string;
  estimatedBloodLoss: number;
  complications?: string;
  drains?: string;
  specimens?: string;
  postOpOrders: string;
  signedBy: string;
  signedAt: Date;
}

// ============= TRAUMA WORKSPACE =============

export interface TraumaWorkspace extends WorkspaceBase {
  type: "trauma";
  activation: TraumaActivation;
  teamRoles: TraumaTeamMember[];
  primarySurvey: PrimarySurvey;
  interventions: TraumaIntervention[];
  vitalsTrend: VitalSign[];
  secondarySurvey: SecondarySurvey;
  traumaScores: TraumaScores;
  diagnostics: TraumaDiagnostics;
  diagnosisSummary: string[];
  managementPlan: string;
  disposition: string;
}

export interface TraumaActivation {
  activationTime: Date;
  mechanism: string;
  alertedBy: string;
  prehospitalInfo?: string;
  estimatedArrival?: Date;
}

export interface TraumaTeamMember {
  role: "team_leader" | "airway" | "circulation" | "documentation" | "procedures" | "radiology";
  name: string;
  arrivedAt?: Date;
}

export interface PrimarySurvey {
  airway: {
    status: "patent" | "compromised" | "obstructed";
    intervention?: string;
    cSpineControlled: boolean;
  };
  breathing: {
    status: "adequate" | "inadequate" | "absent";
    chestExpansion: "equal" | "unequal";
    breathSounds: string;
    intervention?: string;
  };
  circulation: {
    pulsePresent: boolean;
    pulseQuality: "strong" | "weak" | "absent";
    skinColor: "normal" | "pale" | "cyanotic" | "mottled";
    capRefill: "normal" | "delayed" | "absent";
    activeHemorrhage?: string;
    intervention?: string;
  };
  disability: {
    gcs: number;
    gcsMotor: number;
    gcsVerbal: number;
    gcsEye: number;
    pupils: string;
    motorFunction: string;
  };
  exposure: {
    temperature: number;
    findings: string;
    hypothermiaPrevention: boolean;
  };
}

export interface TraumaIntervention {
  id: string;
  time: Date;
  type: "airway" | "breathing" | "circulation" | "medication" | "procedure";
  description: string;
  performedBy: string;
  outcome?: string;
}

export interface SecondarySurvey {
  head: { findings: string; injuries?: string[] };
  face: { findings: string; injuries?: string[] };
  neck: { findings: string; injuries?: string[] };
  chest: { findings: string; injuries?: string[] };
  abdomen: { findings: string; injuries?: string[] };
  pelvis: { findings: string; injuries?: string[] };
  spine: { findings: string; injuries?: string[] };
  extremities: { findings: string; injuries?: string[] };
  skin: { findings: string; injuries?: string[] };
  neuro: { findings: string; injuries?: string[] };
}

export interface TraumaScores {
  gcs: number;
  rts?: number; // Revised Trauma Score
  iss?: number; // Injury Severity Score
}

export interface TraumaDiagnostics {
  labsOrdered: string[];
  labResults?: string[];
  imagingOrdered: string[];
  imagingFindings?: string[];
  fast?: {
    performed: boolean;
    result: "positive" | "negative" | "equivocal";
    findings?: string;
  };
}

// ============= LABOUR & DELIVERY WORKSPACE =============

export interface LabourDeliveryWorkspace extends WorkspaceBase {
  type: "labour_delivery";
  admission: LabourAdmission;
  partograph: PartographEntry[];
  interventions: LabourIntervention[];
  delivery: DeliveryDetails;
  maternalOutcome: MaternalOutcome;
  neonatalOutcome: NeonatalOutcome;
  pncPlan: string;
}

export interface LabourAdmission {
  gravida: number;
  para: number;
  gestationalAge: number; // weeks
  membranesStatus: "intact" | "ruptured";
  timeOfRupture?: Date;
  riskFactors: string[];
  previousCaesareans?: number;
  admissionVitals: VitalsSnapshot;
  admittedBy: string;
  admittedAt: Date;
}

export interface PartographEntry {
  time: Date;
  cervicalDilation: number; // cm
  fetalHeartRate: number;
  contractionFrequency: number; // per 10 min
  contractionDuration: number; // seconds
  descent: string;
  liquor: "clear" | "meconium_thin" | "meconium_thick" | "bloody";
  moulding: 0 | 1 | 2 | 3;
  maternalPulse: number;
  maternalBP: { systolic: number; diastolic: number };
  notes?: string;
}

export interface LabourIntervention {
  time: Date;
  type: "oxytocin" | "arm" | "episiotomy" | "instrumental" | "cs" | "medication" | "other";
  description: string;
  indication: string;
  performedBy: string;
}

export interface DeliveryDetails {
  deliveryTime: Date;
  mode: "svd" | "vacuum" | "forceps" | "emergency_cs" | "elective_cs";
  presentation: string;
  placentaDelivered: boolean;
  placentaTime?: Date;
  bloodLoss: number; // ml
  perinealStatus: "intact" | "1st_degree" | "2nd_degree" | "3rd_degree" | "4th_degree" | "episiotomy";
  deliveredBy: string;
}

export interface MaternalOutcome {
  condition: "stable" | "critical";
  complications: string[];
  vitalsSummary: string;
}

export interface NeonatalOutcome {
  birthWeight: number; // grams
  sex: "male" | "female" | "ambiguous";
  apgar1: number;
  apgar5: number;
  apgar10?: number;
  resuscitationRequired: boolean;
  resuscitationDetails?: string;
  condition: "well" | "requires_nicu" | "stillbirth";
  abnormalities?: string[];
}

// ============= RESUSCITATION / CODE BLUE WORKSPACE =============

export interface ResuscitationWorkspace extends WorkspaceBase {
  type: "resuscitation" | "code_blue" | "rapid_response";
  activation: ResusActivation;
  teamMembers: ResusTeamMember[];
  cprCycles: CPRCycle[];
  defibrillations: Defibrillation[];
  medications: ResusMedication[];
  rhythmChecks: RhythmCheck[];
  outcome: ResusOutcome;
  postResusCarePlan?: string;
}

export interface ResusActivation {
  activationTime: Date;
  location: string;
  activatedBy: string;
  initialRhythm?: string;
  witnessedArrest: boolean;
  bystanderCPR: boolean;
}

export interface ResusTeamMember {
  role: "team_leader" | "airway" | "chest_compressions" | "iv_access" | "medications" | "defibrillator" | "documentation";
  name: string;
  arrivedAt: Date;
}

export interface CPRCycle {
  cycleNumber: number;
  startTime: Date;
  endTime: Date;
  quality: "good" | "fair" | "poor";
  compressor: string;
  notes?: string;
}

export interface Defibrillation {
  time: Date;
  joules: number;
  shockNumber: number;
  rhythm: string;
  outcome: "rosc" | "no_change" | "other";
}

export interface ResusMedication {
  time: Date;
  drug: string;
  dose: string;
  route: string;
  givenBy: string;
}

export interface RhythmCheck {
  time: Date;
  rhythm: "vf" | "vt" | "pea" | "asystole" | "sinus" | "other";
  pulseCheck: boolean;
  pulsePresent: boolean;
  notes?: string;
}

export interface ResusOutcome {
  rosc: boolean;
  roscTime?: Date;
  totalDownTime?: number; // minutes
  finalStatus: "survived" | "ongoing" | "death";
  causeOfArrest?: string;
  terminatedBy?: string;
  terminatedAt?: Date;
  familyNotified?: boolean;
}

// ============= MINOR PROCEDURE WORKSPACE =============

export interface MinorProcedureWorkspace extends WorkspaceBase {
  type: "minor_procedure";
  procedureName: string;
  indication: string;
  preChecklist: PreProcedureChecklist;
  procedureDetails: MinorProcedureDetails;
  complications: string[];
  postProcedureOrders: string;
  patientInstructions: string;
}

export interface PreProcedureChecklist {
  consentObtained: boolean;
  allergyCheck: boolean;
  sitePrepped: boolean;
  equipmentReady: boolean;
  timeoutCompleted: boolean;
}

export interface MinorProcedureDetails {
  site: string;
  localAnaesthetic?: { drug: string; dose: string };
  technique: string;
  findings?: string;
  completedAt: Date;
  performedBy: string;
}

// ============= DIALYSIS WORKSPACE =============

export interface DialysisWorkspace extends WorkspaceBase {
  type: "dialysis";
  preAssessment: DialysisPreAssessment;
  prescription: DialysisPrescription;
  sessionLog: DialysisSessionEntry[];
  complications: DialysisComplication[];
  postSummary: DialysisPostSummary;
}

export interface DialysisPreAssessment {
  preWeight: number;
  accessSite: string;
  accessCondition: "good" | "fair" | "poor";
  symptoms: string[];
  vitals: VitalsSnapshot;
  assessedBy: string;
}

export interface DialysisPrescription {
  dialyserType: string;
  bloodFlowRate: number; // ml/min
  dialysateComposition: string;
  dialysateFlowRate: number;
  ufGoal: number; // ml
  duration: number; // hours
  anticoagulation: string;
}

export interface DialysisSessionEntry {
  time: Date;
  bloodPressure: { systolic: number; diastolic: number };
  heartRate: number;
  ufVolume: number;
  bloodFlowRate: number;
  notes?: string;
}

export interface DialysisComplication {
  time: Date;
  type: "hypotension" | "cramps" | "nausea" | "chest_pain" | "arrhythmia" | "access_problem" | "other";
  description: string;
  action: string;
}

export interface DialysisPostSummary {
  postWeight: number;
  actualUF: number;
  sessionCompleted: boolean;
  earlyTerminationReason?: string;
  postVitals: VitalsSnapshot;
}

// ============= BURNS WORKSPACE =============

export interface BurnsWorkspace extends WorkspaceBase {
  type: "burns";
  mechanism: string;
  tbsa: number; // Total Body Surface Area %
  burnDepth: BurnDepth[];
  inhalationInjury: boolean;
  fluidResuscitation: FluidResuscitation;
  woundCare: BurnWoundCare[];
  nutritionPlan?: string;
  infectionPrevention: string;
  referralPlan?: string;
}

export interface BurnDepth {
  area: string;
  depth: "superficial" | "superficial_partial" | "deep_partial" | "full_thickness";
  percentage: number;
}

export interface FluidResuscitation {
  formula: "parkland" | "modified_parkland" | "other";
  calculatedVolume: number; // ml
  fluidType: string;
  firstHalfTarget: number;
  secondHalfTarget: number;
  actualGiven: number;
  urineOutputTarget: number;
}

export interface BurnWoundCare {
  time: Date;
  woundDescription: string;
  debridementDone: boolean;
  dressingType: string;
  performedBy: string;
}

// ============= WORKSPACE CONFIG =============

export interface WorkspaceConfig {
  type: WorkspaceType;
  name: string;
  description: string;
  icon: string;
  category: "emergency" | "surgical" | "medical" | "specialty" | "therapy";
  requiredRoles: string[];
  sections: string[];
}

export const WORKSPACE_CONFIGS: WorkspaceConfig[] = [
  {
    type: "theatre",
    name: "Theatre / Surgery",
    description: "Full surgical procedure workspace",
    icon: "Scissors",
    category: "surgical",
    requiredRoles: ["Surgeon", "Anaesthetist", "Nurse"],
    sections: ["Request", "Pre-Op", "Consent", "Theatre Log", "Team", "Anaesthesia", "Steps", "Specimens", "Post-Op", "Operative Note"]
  },
  {
    type: "trauma",
    name: "Trauma Resuscitation",
    description: "Major trauma management",
    icon: "Ambulance",
    category: "emergency",
    requiredRoles: ["Physician", "Nurse", "Trauma Team"],
    sections: ["Activation", "Team", "Primary Survey", "Interventions", "Vitals", "Secondary Survey", "Diagnostics", "Plan"]
  },
  {
    type: "labour_delivery",
    name: "Labour & Delivery",
    description: "Childbirth management",
    icon: "Baby",
    category: "specialty",
    requiredRoles: ["Midwife", "Obstetrician"],
    sections: ["Admission", "Partograph", "Interventions", "Delivery", "Maternal", "Neonatal", "PNC"]
  },
  {
    type: "resuscitation",
    name: "Resuscitation",
    description: "Emergency resuscitation",
    icon: "HeartPulse",
    category: "emergency",
    requiredRoles: ["Physician", "Nurse", "Emergency Team"],
    sections: ["Activation", "Team", "CPR", "Defib", "Meds", "Rhythm", "Outcome"]
  },
  {
    type: "dialysis",
    name: "Dialysis Session",
    description: "Haemodialysis treatment",
    icon: "Droplets",
    category: "specialty",
    requiredRoles: ["Nephrologist", "Dialysis Nurse"],
    sections: ["Pre-Assessment", "Prescription", "Session", "Complications", "Summary"]
  },
  {
    type: "minor_procedure",
    name: "Minor Procedure",
    description: "Bedside or clinic procedures",
    icon: "Syringe",
    category: "surgical",
    requiredRoles: ["Physician", "Nurse"],
    sections: ["Indication", "Checklist", "Procedure", "Complications", "Post-Care"]
  },
  {
    type: "burns",
    name: "Burns Management",
    description: "Burns assessment and care",
    icon: "Flame",
    category: "emergency",
    requiredRoles: ["Physician", "Burns Nurse"],
    sections: ["Assessment", "TBSA", "Fluids", "Wound Care", "Nutrition", "Infection", "Referral"]
  },
];
