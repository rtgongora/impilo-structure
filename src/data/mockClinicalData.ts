// Mock clinical data for the Impilo EHR demo
// This provides realistic sample data for all sections

import {
  ClinicalAlert,
  CareEpisode,
  EnrolledPathway,
  ClinicalTask,
  VitalsSnapshot,
  TriageAssessment,
  ClinicalHistory,
  Problem,
  Diagnosis,
  Order,
  LabOrder,
  LabResult,
  MedicationAdministration,
  NursingTask,
  CarePlan,
  OxygenTherapy,
  FluidBalance,
  Referral,
  ConsultRequest,
  ClinicalNote,
  Charge,
} from "@/types/clinical";

// ============= VITALS =============

export const MOCK_VITALS: VitalsSnapshot = {
  heartRate: {
    id: "v1",
    type: "heart_rate",
    value: 88,
    unit: "bpm",
    timestamp: new Date("2024-12-21T08:30:00"),
    recordedBy: "Nurse Moyo",
    isAbnormal: false,
    trend: "stable"
  },
  respiratoryRate: {
    id: "v2",
    type: "respiratory_rate",
    value: 18,
    unit: "/min",
    timestamp: new Date("2024-12-21T08:30:00"),
    recordedBy: "Nurse Moyo",
    isAbnormal: false
  },
  bloodPressure: {
    systolic: {
      id: "v3",
      type: "blood_pressure_systolic",
      value: 132,
      unit: "mmHg",
      timestamp: new Date("2024-12-21T08:30:00"),
      recordedBy: "Nurse Moyo",
      isAbnormal: false
    },
    diastolic: {
      id: "v4",
      type: "blood_pressure_diastolic",
      value: 84,
      unit: "mmHg",
      timestamp: new Date("2024-12-21T08:30:00"),
      recordedBy: "Nurse Moyo",
      isAbnormal: false
    }
  },
  temperature: {
    id: "v5",
    type: "temperature",
    value: 37.2,
    unit: "°C",
    timestamp: new Date("2024-12-21T08:30:00"),
    recordedBy: "Nurse Moyo",
    isAbnormal: false
  },
  spo2: {
    id: "v6",
    type: "spo2",
    value: 97,
    unit: "%",
    timestamp: new Date("2024-12-21T08:30:00"),
    recordedBy: "Nurse Moyo",
    isAbnormal: false
  },
  lastMeasuredTime: new Date("2024-12-21T08:30:00")
};

// ============= ALERTS =============

export const MOCK_ALERTS: ClinicalAlert[] = [
  {
    id: "a1",
    type: "allergy",
    severity: "critical",
    title: "Drug Allergy: Penicillin",
    description: "Anaphylactic reaction - avoid all penicillin-class antibiotics",
    isActive: true,
    createdAt: new Date("2023-06-15")
  },
  {
    id: "a2",
    type: "allergy",
    severity: "warning",
    title: "Drug Allergy: Sulfa drugs",
    description: "Causes severe rash",
    isActive: true,
    createdAt: new Date("2023-06-15")
  },
  {
    id: "a3",
    type: "chronic_condition",
    severity: "warning",
    title: "Type 2 Diabetes Mellitus",
    description: "On metformin 500mg BD - monitor glucose",
    isActive: true,
    createdAt: new Date("2022-03-10")
  },
  {
    id: "a4",
    type: "fall_risk",
    severity: "info",
    title: "Fall Risk: Moderate",
    description: "History of falls - ensure bed rails up",
    isActive: true,
    createdAt: new Date("2024-12-19")
  }
];

// ============= EPISODES & PATHWAYS =============

export const MOCK_EPISODES: CareEpisode[] = [
  {
    id: "ep1",
    type: "ncd_management",
    name: "Type 2 Diabetes Management",
    status: "active",
    startDate: new Date("2022-03-10"),
    managingTeam: "Chronic Care Clinic",
    notes: "Well-controlled on current regimen"
  }
];

export const MOCK_PATHWAYS: EnrolledPathway[] = [
  {
    id: "pw1",
    type: "diabetes",
    name: "Diabetes Chronic Care",
    enrollmentDate: new Date("2022-03-10"),
    currentPhase: "Maintenance",
    nextVisitDate: new Date("2025-01-15"),
    progress: 80,
    alerts: ["HbA1c due next visit"]
  }
];

// ============= TASKS =============

export const MOCK_TASKS: ClinicalTask[] = [
  {
    id: "t1",
    type: "lab",
    title: "FBC and U&E results pending",
    status: "pending",
    priority: "routine",
    createdBy: "Dr. Mwangi",
    createdAt: new Date("2024-12-20T10:00:00"),
    dueAt: new Date("2024-12-21T14:00:00")
  },
  {
    id: "t2",
    type: "medication",
    title: "Administer morning insulin",
    description: "Novorapid 8 units SC before breakfast",
    status: "pending",
    priority: "urgent",
    assignedTo: "Nurse Moyo",
    createdBy: "Dr. Mwangi",
    createdAt: new Date("2024-12-21T06:00:00"),
    dueAt: new Date("2024-12-21T07:30:00")
  },
  {
    id: "t3",
    type: "nursing",
    title: "4-hourly vitals due",
    status: "completed",
    priority: "routine",
    assignedTo: "Nurse Moyo",
    createdBy: "System",
    createdAt: new Date("2024-12-21T04:00:00"),
    completedAt: new Date("2024-12-21T08:30:00"),
    completedBy: "Nurse Moyo"
  },
  {
    id: "t4",
    type: "consult",
    title: "Cardiology review pending",
    description: "For pre-operative cardiac clearance",
    status: "pending",
    priority: "routine",
    createdBy: "Dr. Mwangi",
    createdAt: new Date("2024-12-20T15:00:00")
  }
];

// ============= TRIAGE =============

export const MOCK_TRIAGE: TriageAssessment = {
  id: "tr1",
  category: "yellow",
  arrivalMode: "walk-in",
  arrivalTime: new Date("2024-12-19T08:00:00"),
  triageTime: new Date("2024-12-19T08:15:00"),
  triagedBy: "Nurse Nyambe",
  chiefComplaint: "Abdominal pain and vomiting for 2 days",
  dangerSigns: [
    { id: "ds1", name: "Severe dehydration", present: false, category: "circulation" },
    { id: "ds2", name: "Altered consciousness", present: false, category: "disability" },
    { id: "ds3", name: "Severe respiratory distress", present: false, category: "breathing" }
  ],
  notes: "Patient appears uncomfortable but stable"
};

// ============= HISTORY =============

export const MOCK_HISTORY: ClinicalHistory = {
  presentingComplaint: "Abdominal pain and vomiting",
  historyOfPresentIllness: "48-year-old female presents with 2-day history of progressive epigastric pain, radiating to the right upper quadrant. Associated with nausea and 4 episodes of non-bilious vomiting. Pain worse after fatty meals. No fever, diarrhea or constipation. No hematemesis or melena.",
  pastMedicalHistory: [
    {
      id: "pmh1",
      condition: "Type 2 Diabetes Mellitus",
      diagnosed: new Date("2022-03-10"),
      status: "controlled",
      notes: "Well controlled on metformin"
    },
    {
      id: "pmh2",
      condition: "Hypertension",
      diagnosed: new Date("2020-06-15"),
      status: "controlled",
      notes: "On amlodipine 5mg daily"
    }
  ],
  pastSurgicalHistory: [
    {
      id: "psh1",
      procedure: "Appendicectomy",
      date: new Date("2010-04-20"),
      facility: "Central Hospital"
    }
  ],
  obsGynHistory: {
    gravida: 3,
    para: 2,
    livingChildren: 2,
    lastMenstrualPeriod: new Date("2024-11-28"),
    contraceptionHistory: "Tubal ligation 2019"
  },
  drugHistory: [
    {
      id: "dh1",
      medication: "Metformin",
      dose: "500mg",
      frequency: "Twice daily",
      route: "Oral",
      isCurrentlyTaking: true
    },
    {
      id: "dh2",
      medication: "Amlodipine",
      dose: "5mg",
      frequency: "Once daily",
      route: "Oral",
      isCurrentlyTaking: true
    }
  ],
  allergies: [
    {
      id: "al1",
      allergen: "Penicillin",
      type: "drug",
      reaction: "Anaphylaxis - throat swelling, hypotension",
      severity: "life_threatening",
      confirmed: true
    },
    {
      id: "al2",
      allergen: "Sulfa drugs",
      type: "drug",
      reaction: "Severe maculopapular rash",
      severity: "moderate",
      confirmed: true
    }
  ],
  socialHistory: {
    occupation: "Teacher",
    smokingStatus: "never",
    alcoholUse: "occasional"
  }
};

// ============= PROBLEMS & DIAGNOSES =============

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: "p1",
    name: "Type 2 Diabetes Mellitus",
    snomedCode: "44054006",
    onsetDate: new Date("2022-03-10"),
    status: "active",
    comments: "Well controlled, HbA1c 6.8%",
    recordedBy: "Dr. Mwangi",
    recordedAt: new Date("2022-03-10")
  },
  {
    id: "p2",
    name: "Essential Hypertension",
    snomedCode: "59621000",
    onsetDate: new Date("2020-06-15"),
    status: "active",
    comments: "Controlled on single agent",
    recordedBy: "Dr. Mwangi",
    recordedAt: new Date("2020-06-15")
  }
];

export const MOCK_DIAGNOSES: Diagnosis[] = [
  {
    id: "d1",
    name: "Acute Cholecystitis",
    icdCode: "K81.0",
    isPrimary: true,
    certainty: "confirmed",
    onsetType: "acute",
    notes: "Confirmed on ultrasound - thickened gallbladder wall, pericholecystic fluid",
    diagnosedBy: "Dr. Mwangi",
    diagnosedAt: new Date("2024-12-19T14:00:00")
  },
  {
    id: "d2",
    name: "Cholelithiasis",
    icdCode: "K80.2",
    isPrimary: false,
    certainty: "confirmed",
    onsetType: "chronic",
    notes: "Multiple gallstones visualized on ultrasound",
    diagnosedBy: "Dr. Mwangi",
    diagnosedAt: new Date("2024-12-19T14:00:00")
  }
];

// ============= ORDERS =============

export const MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    type: "lab",
    testPanel: "Full Blood Count",
    status: "completed",
    priority: "urgent",
    orderedBy: "Dr. Mwangi",
    orderedAt: new Date("2024-12-19T09:00:00"),
    clinicalIndication: "Acute cholecystitis - assess for infection",
    resultId: "r1"
  } as LabOrder,
  {
    id: "o2",
    type: "lab",
    testPanel: "Liver Function Tests",
    status: "completed",
    priority: "urgent",
    orderedBy: "Dr. Mwangi",
    orderedAt: new Date("2024-12-19T09:00:00"),
    clinicalIndication: "RUQ pain - assess for biliary obstruction",
    resultId: "r2"
  } as LabOrder,
  {
    id: "o3",
    type: "lab",
    testPanel: "Urea & Electrolytes",
    status: "pending",
    priority: "routine",
    orderedBy: "Dr. Mwangi",
    orderedAt: new Date("2024-12-21T08:00:00"),
    clinicalIndication: "Pre-operative workup"
  } as LabOrder,
  {
    id: "o4",
    type: "imaging",
    modality: "ultrasound",
    bodyPart: "Abdomen - Hepatobiliary",
    status: "completed",
    priority: "urgent",
    orderedBy: "Dr. Mwangi",
    orderedAt: new Date("2024-12-19T09:30:00"),
    clinicalIndication: "RUQ pain, suspected cholecystitis"
  }
];

// ============= RESULTS =============

export const MOCK_LAB_RESULTS: LabResult[] = [
  {
    id: "r1",
    orderId: "o1",
    testName: "White Blood Cell Count",
    value: "14.2",
    unit: "×10⁹/L",
    referenceRange: "4.0-11.0",
    isAbnormal: true,
    isCritical: false,
    collectedAt: new Date("2024-12-19T09:30:00"),
    reportedAt: new Date("2024-12-19T12:00:00")
  },
  {
    id: "r2",
    orderId: "o1",
    testName: "Haemoglobin",
    value: "12.8",
    unit: "g/dL",
    referenceRange: "12.0-16.0",
    isAbnormal: false,
    isCritical: false,
    collectedAt: new Date("2024-12-19T09:30:00"),
    reportedAt: new Date("2024-12-19T12:00:00")
  },
  {
    id: "r3",
    orderId: "o2",
    testName: "Total Bilirubin",
    value: "28",
    unit: "μmol/L",
    referenceRange: "5-21",
    isAbnormal: true,
    isCritical: false,
    collectedAt: new Date("2024-12-19T09:30:00"),
    reportedAt: new Date("2024-12-19T13:00:00")
  },
  {
    id: "r4",
    orderId: "o2",
    testName: "ALT",
    value: "85",
    unit: "U/L",
    referenceRange: "7-56",
    isAbnormal: true,
    isCritical: false,
    collectedAt: new Date("2024-12-19T09:30:00"),
    reportedAt: new Date("2024-12-19T13:00:00")
  },
  {
    id: "r5",
    orderId: "o2",
    testName: "ALP",
    value: "156",
    unit: "U/L",
    referenceRange: "44-147",
    isAbnormal: true,
    isCritical: false,
    collectedAt: new Date("2024-12-19T09:30:00"),
    reportedAt: new Date("2024-12-19T13:00:00")
  }
];

// ============= MEDICATION ADMINISTRATION (Inpatient) =============

export const MOCK_MAR: MedicationAdministration[] = [
  {
    id: "ma1",
    medicationOrderId: "mo1",
    medication: "Metformin",
    dose: "500mg",
    route: "Oral",
    scheduledTime: new Date("2024-12-21T08:00:00"),
    administeredTime: new Date("2024-12-21T08:15:00"),
    administeredBy: "Nurse Moyo",
    status: "given",
    notes: "Given with breakfast"
  },
  {
    id: "ma2",
    medicationOrderId: "mo2",
    medication: "Ceftriaxone",
    dose: "1g",
    route: "IV",
    scheduledTime: new Date("2024-12-21T08:00:00"),
    administeredTime: new Date("2024-12-21T08:30:00"),
    administeredBy: "Nurse Moyo",
    status: "given",
    site: "Left antecubital fossa"
  },
  {
    id: "ma3",
    medicationOrderId: "mo3",
    medication: "Metronidazole",
    dose: "500mg",
    route: "IV",
    scheduledTime: new Date("2024-12-21T14:00:00"),
    status: "scheduled"
  },
  {
    id: "ma4",
    medicationOrderId: "mo4",
    medication: "Tramadol",
    dose: "50mg",
    route: "IV",
    scheduledTime: new Date("2024-12-21T06:00:00"),
    administeredTime: new Date("2024-12-21T06:10:00"),
    administeredBy: "Nurse Moyo",
    status: "given",
    notes: "For pain control"
  }
];

// ============= NURSING TASKS =============

export const MOCK_NURSING_TASKS: NursingTask[] = [
  {
    id: "nt1",
    type: "vitals",
    description: "4-hourly vital signs monitoring",
    dueTime: new Date("2024-12-21T12:00:00"),
    status: "pending"
  },
  {
    id: "nt2",
    type: "wound_care",
    description: "IV cannula site assessment",
    dueTime: new Date("2024-12-21T14:00:00"),
    status: "pending"
  },
  {
    id: "nt3",
    type: "feeding",
    description: "Encourage oral fluids - clear liquids only",
    dueTime: new Date("2024-12-21T10:00:00"),
    completedTime: new Date("2024-12-21T10:30:00"),
    completedBy: "Nurse Moyo",
    status: "completed"
  }
];

// ============= CARE PLAN =============

export const MOCK_CARE_PLAN: CarePlan = {
  id: "cp1",
  goals: [
    {
      id: "g1",
      description: "Resolve acute cholecystitis",
      targetDate: new Date("2024-12-23"),
      status: "active"
    },
    {
      id: "g2",
      description: "Optimize for laparoscopic cholecystectomy",
      targetDate: new Date("2024-12-22"),
      status: "active"
    },
    {
      id: "g3",
      description: "Maintain glycaemic control",
      status: "active"
    }
  ],
  interventions: [
    {
      id: "i1",
      type: "medication",
      description: "IV antibiotics (Ceftriaxone + Metronidazole)",
      frequency: "BD",
      responsibleCadre: "Nursing",
      status: "active"
    },
    {
      id: "i2",
      type: "monitoring",
      description: "4-hourly vital signs",
      frequency: "Q4H",
      responsibleCadre: "Nursing",
      status: "active"
    },
    {
      id: "i3",
      type: "dietary",
      description: "NPO, clear fluids only",
      responsibleCadre: "Nursing",
      status: "active"
    }
  ],
  reviewDate: new Date("2024-12-22"),
  responsibleTeam: "Surgical Team",
  createdBy: "Dr. Mwangi",
  createdAt: new Date("2024-12-19T15:00:00")
};

// ============= FLUID BALANCE =============

export const MOCK_FLUID_BALANCE: FluidBalance[] = [
  {
    id: "fb1",
    date: new Date("2024-12-20"),
    intakeOral: 500,
    intakeIV: 2000,
    intakeOther: 0,
    outputUrine: 1800,
    outputStool: 0,
    outputVomitus: 200,
    outputDrains: 0,
    netBalance: 500,
    recordedBy: "Nurse Moyo"
  }
];

// ============= CONSULTS & REFERRALS =============

export const MOCK_CONSULTS: ConsultRequest[] = [
  {
    id: "c1",
    specialty: "Cardiology",
    requestedBy: "Dr. Mwangi",
    requestedAt: new Date("2024-12-20T14:00:00"),
    caseSummary: "48F with DM, HTN, planned for laparoscopic cholecystectomy",
    clinicalQuestion: "Please provide pre-operative cardiac clearance",
    preferredMode: "async",
    status: "pending"
  }
];

export const MOCK_REFERRALS: Referral[] = [];

// ============= NOTES =============

export const MOCK_NOTES: ClinicalNote[] = [
  {
    id: "n1",
    type: "progress",
    title: "Admission Note",
    content: "Patient admitted with acute cholecystitis. Started on IV antibiotics and analgesics. Plan for laparoscopic cholecystectomy once acute inflammation settles.",
    subjective: "Abdominal pain improving slightly. Still nauseous but no further vomiting.",
    objective: "Afebrile. Abdomen: soft, tender RUQ with positive Murphy's sign. Bowel sounds present.",
    assessment: "Acute cholecystitis with cholelithiasis",
    plan: "Continue IV antibiotics, NPO, analgesia PRN, surgical review for timing of cholecystectomy",
    author: "Dr. James Mwangi",
    authorRole: "Attending Physician",
    createdAt: new Date("2024-12-19T10:00:00"),
    signedAt: new Date("2024-12-19T10:30:00")
  },
  {
    id: "n2",
    type: "ward_round",
    title: "Morning Ward Round",
    content: "Day 2 post admission. Pain controlled. Tolerating clear fluids.",
    subjective: "Pain much better today. No vomiting overnight.",
    objective: "Afebrile. HR 82, BP 128/78. Abdomen less tender.",
    assessment: "Improving acute cholecystitis",
    plan: "Continue antibiotics, advance diet if tolerating. Aim for surgery tomorrow if continues to improve.",
    author: "Dr. James Mwangi",
    authorRole: "Attending Physician",
    createdAt: new Date("2024-12-20T09:00:00"),
    signedAt: new Date("2024-12-20T09:30:00")
  }
];

// ============= CHARGES =============

export const MOCK_CHARGES: Charge[] = [
  {
    id: "ch1",
    itemType: "bed",
    itemName: "General Ward Bed - Day 1",
    quantity: 1,
    unitPrice: 5000,
    totalAmount: 5000,
    status: "pending",
    isProgrammeCovered: false,
    createdAt: new Date("2024-12-19")
  },
  {
    id: "ch2",
    itemType: "bed",
    itemName: "General Ward Bed - Day 2",
    quantity: 1,
    unitPrice: 5000,
    totalAmount: 5000,
    status: "pending",
    isProgrammeCovered: false,
    createdAt: new Date("2024-12-20")
  },
  {
    id: "ch3",
    itemType: "lab",
    itemName: "Full Blood Count",
    quantity: 1,
    unitPrice: 1500,
    totalAmount: 1500,
    status: "pending",
    isProgrammeCovered: false,
    createdAt: new Date("2024-12-19"),
    linkedOrderId: "o1"
  },
  {
    id: "ch4",
    itemType: "imaging",
    itemName: "Abdominal Ultrasound",
    quantity: 1,
    unitPrice: 3500,
    totalAmount: 3500,
    status: "pending",
    isProgrammeCovered: false,
    createdAt: new Date("2024-12-19"),
    linkedOrderId: "o4"
  },
  {
    id: "ch5",
    itemType: "medication",
    itemName: "Ceftriaxone 1g IV",
    quantity: 4,
    unitPrice: 250,
    totalAmount: 1000,
    status: "pending",
    isProgrammeCovered: false,
    createdAt: new Date("2024-12-19")
  }
];
