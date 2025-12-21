// Impilo EHR Type Definitions

export type EncounterMenuItem =
  | "overview"
  | "assessment"
  | "problems"
  | "orders"
  | "care"
  | "consults"
  | "notes"
  | "outcome";

export interface EncounterMenuItemConfig {
  id: EncounterMenuItem;
  label: string;
  description: string;
  icon: string;
}

export const ENCOUNTER_MENU_ITEMS: EncounterMenuItemConfig[] = [
  { id: "overview", label: "Overview", description: "Patient summary and status", icon: "LayoutDashboard" },
  { id: "assessment", label: "Assessment", description: "Clinical assessments", icon: "ClipboardCheck" },
  { id: "problems", label: "Problems & Diagnoses", description: "Active problems and diagnoses", icon: "Stethoscope" },
  { id: "orders", label: "Orders & Results", description: "Lab orders and results", icon: "FileText" },
  { id: "care", label: "Care & Management", description: "Care plans and management", icon: "Heart" },
  { id: "consults", label: "Consults & Referrals", description: "Specialist consultations", icon: "Users" },
  { id: "notes", label: "Notes & Attachments", description: "Clinical notes and documents", icon: "FileEdit" },
  { id: "outcome", label: "Visit Outcome", description: "Encounter disposition", icon: "CheckCircle" },
];

export type TopBarAction = "workspaces" | "pathways" | "consumables" | "charges" | "queue";

export interface TopBarActionConfig {
  id: TopBarAction;
  label: string;
  icon: string;
}

export const TOP_BAR_ACTIONS: TopBarActionConfig[] = [
  { id: "queue", label: "Queue", icon: "Users" },
  { id: "workspaces", label: "Workspaces", icon: "Boxes" },
  { id: "pathways", label: "Care Pathways", icon: "Route" },
  { id: "consumables", label: "Consumables", icon: "Package" },
  { id: "charges", label: "Charges", icon: "Receipt" },
];

export type WorkspaceStatus = "active" | "completed" | "cancelled";
export type WorkspacePhase = "start" | "execute" | "complete" | "exit";

export interface WorkspaceData {
  id: string;
  type: string;
  encounterId: string;
  startTime: Date;
  status: WorkspaceStatus;
  phase: WorkspacePhase;
  initiatingUser: string;
  location: string;
  participatingRoles: string[];
}

export type CriticalEventType = "resuscitation" | "code-blue" | "rapid-response" | "emergency";

export type CriticalEventOutcome =
  | "stabilised"
  | "admitted"
  | "transferred"
  | "escalated"
  | "death";

export interface CriticalEventData extends WorkspaceData {
  eventType: CriticalEventType;
  activatingUser: string;
  trigger: string;
  outcome?: CriticalEventOutcome;
  endTime?: Date;
  terminatingUser?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  mrn: string;
  allergies: string[];
  ward?: string;
  bed?: string;
}

export interface Encounter {
  id: string;
  patient: Patient;
  type: "inpatient" | "outpatient" | "emergency";
  status: "active" | "discharged" | "transferred";
  admissionDate: Date;
  attendingPhysician: string;
  location: string;
}

// Mock data for demo
export const MOCK_PATIENT: Patient = {
  id: "P001",
  name: "Sarah M. Johnson",
  dateOfBirth: "1985-03-15",
  gender: "female",
  mrn: "MRN-2024-001847",
  allergies: ["Penicillin", "Sulfa drugs"],
  ward: "Ward 4A",
  bed: "Bed 12",
};

export const MOCK_ENCOUNTER: Encounter = {
  id: "E001",
  patient: MOCK_PATIENT,
  type: "inpatient",
  status: "active",
  admissionDate: new Date("2024-12-19T08:30:00"),
  attendingPhysician: "Dr. James Mwangi",
  location: "Ward 4A - Medical",
};
