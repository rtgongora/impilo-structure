import React, { createContext, useContext, useState, ReactNode } from "react";

// Provider context types for department/section awareness
export type ProviderRole = 
  | "physician"
  | "nurse"
  | "specialist"
  | "registrar"
  | "consultant"
  | "midwife"
  | "chw"
  | "pharmacist"
  | "radiologist"
  | "pathologist";

export type Department = 
  | "general-medicine"
  | "surgery"
  | "obstetrics-gynaecology"
  | "paediatrics"
  | "emergency"
  | "orthopaedics"
  | "cardiology"
  | "neurology"
  | "oncology"
  | "psychiatry"
  | "radiology"
  | "pathology"
  | "pharmacy"
  | "icu"
  | "theatre"
  | "outpatient";

export type FacilityLevel = "primary" | "secondary" | "tertiary" | "quaternary";

export interface ProviderProfile {
  id: string;
  name: string;
  title: string;
  role: ProviderRole;
  department: Department;
  unit?: string;
  facility: {
    id: string;
    name: string;
    level: FacilityLevel;
    district: string;
    province: string;
  };
  credentials: string[];
  specialties: string[];
  onCallStatus: boolean;
  workspaces: string[];
  teams: string[];
}

export interface WorklistItem {
  id: string;
  type: "referral-sent" | "referral-received" | "pending-response" | "pending-completion";
  patientName: string;
  patientAge: number;
  patientSex: "M" | "F";
  mrn: string;
  urgency: "routine" | "urgent" | "stat" | "emergency";
  specialty: string;
  status: ReferralStatus;
  stage: ReferralStage;
  fromFacility: string;
  fromClinician: string;
  toTarget: string;
  createdAt: Date;
  updatedAt: Date;
  waitingTime: number; // minutes
  chiefComplaint: string;
}

export type ReferralStage = 
  | "case-identified"
  | "building-package"
  | "routing"
  | "pending-acceptance"
  | "in-session"
  | "response-pending"
  | "pending-completion"
  | "closed";

export type ReferralStatus = 
  | "draft"
  | "pending"
  | "accepted"
  | "in-progress"
  | "response-submitted"
  | "completed"
  | "closed"
  | "declined"
  | "reassigned"
  | "cancelled";

interface ProviderContextValue {
  provider: ProviderProfile;
  setProvider: (provider: ProviderProfile) => void;
  worklist: WorklistItem[];
  setWorklist: (items: WorklistItem[]) => void;
  stats: DashboardStats;
}

export interface DashboardStats {
  pendingIncoming: number;
  pendingOutgoing: number;
  inSession: number;
  awaitingResponse: number;
  awaitingCompletion: number;
  completedToday: number;
  avgResponseTime: number; // minutes
  urgentCount: number;
}

const MOCK_PROVIDER: ProviderProfile = {
  id: "PRV-001",
  name: "Dr. James Mwangi",
  title: "Medical Officer",
  role: "physician",
  department: "general-medicine",
  unit: "Ward 4A",
  facility: {
    id: "FAC-001",
    name: "Parirenyatwa Group of Hospitals",
    level: "tertiary",
    district: "Harare",
    province: "Harare Metropolitan",
  },
  credentials: ["MBChB", "Dip HIV Mgt"],
  specialties: ["Internal Medicine", "HIV Medicine"],
  onCallStatus: false,
  workspaces: ["general-medicine", "hiv-clinic"],
  teams: ["ward-4a-team", "internal-medicine-on-call"],
};

const MOCK_WORKLIST: WorklistItem[] = [
  {
    id: "REF-001",
    type: "referral-received",
    patientName: "John Moyo",
    patientAge: 45,
    patientSex: "M",
    mrn: "MRN-2024-003421",
    urgency: "urgent",
    specialty: "Cardiology",
    status: "pending",
    stage: "pending-acceptance",
    fromFacility: "Chitungwiza Central Hospital",
    fromClinician: "Dr. T. Ncube",
    toTarget: "Cardiology Team",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    waitingTime: 120,
    chiefComplaint: "Chest pain with ECG changes",
  },
  {
    id: "REF-002",
    type: "referral-received",
    patientName: "Mary Dube",
    patientAge: 32,
    patientSex: "F",
    mrn: "MRN-2024-004512",
    urgency: "routine",
    specialty: "Internal Medicine",
    status: "accepted",
    stage: "in-session",
    fromFacility: "Highfield Polyclinic",
    fromClinician: "Sr. M. Chikwava",
    toTarget: "Dr. J. Mwangi",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    waitingTime: 180,
    chiefComplaint: "Uncontrolled diabetes with renal impairment",
  },
  {
    id: "REF-003",
    type: "referral-sent",
    patientName: "Sarah M. Johnson",
    patientAge: 39,
    patientSex: "F",
    mrn: "MRN-2024-001847",
    urgency: "routine",
    specialty: "Nephrology",
    status: "response-submitted",
    stage: "pending-completion",
    fromFacility: "Parirenyatwa",
    fromClinician: "Dr. J. Mwangi",
    toTarget: "Nephrology Dept",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    waitingTime: 0,
    chiefComplaint: "Chronic kidney disease staging",
  },
  {
    id: "REF-004",
    type: "pending-response",
    patientName: "Peter Sibanda",
    patientAge: 58,
    patientSex: "M",
    mrn: "MRN-2024-002341",
    urgency: "stat",
    specialty: "Neurology",
    status: "in-progress",
    stage: "response-pending",
    fromFacility: "Gweru Provincial Hospital",
    fromClinician: "Dr. L. Maphosa",
    toTarget: "Dr. J. Mwangi (covering)",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    waitingTime: 60,
    chiefComplaint: "Acute stroke - decision on thrombolysis",
  },
];

const MOCK_STATS: DashboardStats = {
  pendingIncoming: 3,
  pendingOutgoing: 1,
  inSession: 2,
  awaitingResponse: 1,
  awaitingCompletion: 2,
  completedToday: 5,
  avgResponseTime: 45,
  urgentCount: 2,
};

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderProfile>(MOCK_PROVIDER);
  const [worklist, setWorklist] = useState<WorklistItem[]>(MOCK_WORKLIST);
  const [stats] = useState<DashboardStats>(MOCK_STATS);

  return (
    <ProviderContext.Provider
      value={{
        provider,
        setProvider,
        worklist,
        setWorklist,
        stats,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProviderContext must be used within a ProviderContextProvider");
  }
  return context;
}

// Helper functions
export const getDepartmentLabel = (dept: Department): string => {
  const labels: Record<Department, string> = {
    "general-medicine": "General Medicine",
    "surgery": "Surgery",
    "obstetrics-gynaecology": "Obstetrics & Gynaecology",
    "paediatrics": "Paediatrics",
    "emergency": "Emergency Department",
    "orthopaedics": "Orthopaedics",
    "cardiology": "Cardiology",
    "neurology": "Neurology",
    "oncology": "Oncology",
    "psychiatry": "Psychiatry",
    "radiology": "Radiology",
    "pathology": "Pathology",
    "pharmacy": "Pharmacy",
    "icu": "Intensive Care Unit",
    "theatre": "Theatre",
    "outpatient": "Outpatient Department",
  };
  return labels[dept] || dept;
};

export const getStageLabel = (stage: ReferralStage): string => {
  const labels: Record<ReferralStage, string> = {
    "case-identified": "Case Identified",
    "building-package": "Building Package",
    "routing": "Routing",
    "pending-acceptance": "Pending Acceptance",
    "in-session": "In Session",
    "response-pending": "Response Pending",
    "pending-completion": "Pending Completion",
    "closed": "Closed",
  };
  return labels[stage] || stage;
};

export const getStageNumber = (stage: ReferralStage): number => {
  const stageOrder: ReferralStage[] = [
    "case-identified",
    "building-package",
    "routing",
    "pending-acceptance",
    "in-session",
    "response-pending",
    "pending-completion",
    "closed",
  ];
  return stageOrder.indexOf(stage) + 1;
};
