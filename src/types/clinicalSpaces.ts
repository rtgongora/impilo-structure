/**
 * Clinical Spaces Types
 * 
 * This file defines the clear distinction between:
 * 1. Physical Workspaces - Actual locations where practitioners work
 * 2. Care Pathways - Clinical workflows that can be activated from any workspace
 */

// ============= PHYSICAL WORKSPACES =============
// These are actual physical spaces where practitioners log in and work from

export type PhysicalWorkspaceType = 
  | "theatre"
  | "emergency"
  | "icu"
  | "ward"
  | "dialysis_unit"
  | "physiotherapy_gym"
  | "psychology_suite"
  | "radiology"
  | "labour_ward"
  | "outpatient_clinic"
  | "day_procedure_unit";

export interface PhysicalWorkspace {
  id: PhysicalWorkspaceType;
  name: string;
  description: string;
  category: "high_acuity" | "specialty" | "general";
  hasMonitoring?: boolean;
  typicalCapacity?: number;
}

export const PHYSICAL_WORKSPACES: PhysicalWorkspace[] = [
  // High Acuity Spaces
  { id: "theatre", name: "Theatre", description: "Operating rooms for surgical procedures", category: "high_acuity", hasMonitoring: true },
  { id: "emergency", name: "Emergency Department", description: "Acute care and trauma services", category: "high_acuity", hasMonitoring: true },
  { id: "icu", name: "Intensive Care Unit", description: "Critical care monitoring", category: "high_acuity", hasMonitoring: true },
  { id: "labour_ward", name: "Labour & Delivery Suite", description: "Obstetric care and deliveries", category: "high_acuity", hasMonitoring: true },
  
  // Specialty Spaces
  { id: "dialysis_unit", name: "Dialysis Unit", description: "Renal replacement therapy", category: "specialty", hasMonitoring: true },
  { id: "physiotherapy_gym", name: "Physiotherapy", description: "Physical rehabilitation", category: "specialty" },
  { id: "psychology_suite", name: "Psychology Suite", description: "Mental health consultations", category: "specialty" },
  { id: "radiology", name: "Radiology Department", description: "Imaging and interventional procedures", category: "specialty" },
  { id: "day_procedure_unit", name: "Day Procedure Unit", description: "Minor procedures and day cases", category: "specialty" },
  
  // General Spaces
  { id: "ward", name: "Ward", description: "Inpatient care areas", category: "general" },
  { id: "outpatient_clinic", name: "Outpatient Clinic", description: "Scheduled consultations", category: "general" },
];

// ============= CARE PATHWAYS =============
// Clinical workflows that can be activated from any physical workspace
// These overlay on or take over the Encounter based on their type

export type CarePathwayCategory = 
  | "emergency_protocol"    // Takes over screen (Critical Event)
  | "treatment_workflow"    // Overlays on Encounter
  | "longitudinal_programme" // Reshapes Encounter content over time
  | "procedure_workflow";   // Dedicated view for specific procedure

export type CarePathwayId = 
  // Emergency Protocols (Critical Events - take over screen)
  | "code_blue"
  | "rapid_response"
  | "trauma_activation"
  | "neonatal_resuscitation"
  | "obstetric_emergency"
  | "stroke_code"
  | "stemi_code"
  
  // Treatment Workflows (overlay or dedicated view)
  | "chemotherapy"
  | "radiotherapy"
  | "dialysis_session"
  | "physiotherapy_session"
  | "psychotherapy_session"
  | "burns_care"
  | "minor_procedure"
  | "wound_care"
  
  // Procedure Workflows (dedicated view)
  | "surgical_procedure"
  | "labour_delivery"
  | "endoscopy"
  | "interventional_radiology"
  | "anaesthesia_preop"
  
  // Longitudinal Programmes (reshape Encounter)
  | "antenatal_care"
  | "hiv_care"
  | "tb_treatment"
  | "ncd_management"
  | "immunization"
  | "oncology_follow_up"
  | "chronic_pain_management"
  
  // Special Examinations (overlay)
  | "sexual_assault_exam"
  | "poisoning_overdose"
  | "forensic_examination";

export interface CarePathway {
  id: CarePathwayId;
  name: string;
  description: string;
  category: CarePathwayCategory;
  icon?: string;
  requiredRoles?: string[];
  typicalDuration?: string;
  
  // For emergency protocols
  teamRequired?: string[];
  
  // UI behavior
  takesOverScreen: boolean;  // true = dedicated view, false = overlay
  isEmergency: boolean;      // true = Critical Event override behavior
}

export const CARE_PATHWAYS: CarePathway[] = [
  // ===== EMERGENCY PROTOCOLS (Critical Events) =====
  { 
    id: "code_blue", 
    name: "Code Blue", 
    description: "Cardiac/respiratory arrest response",
    category: "emergency_protocol",
    teamRequired: ["Physician", "Nurse", "Respiratory", "Pharmacist"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "rapid_response", 
    name: "Rapid Response", 
    description: "Deteriorating patient escalation",
    category: "emergency_protocol",
    teamRequired: ["Physician", "Nurse", "Respiratory"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "trauma_activation", 
    name: "Trauma Activation", 
    description: "Major trauma response protocol",
    category: "emergency_protocol",
    teamRequired: ["Trauma Surgeon", "ED Physician", "Nurse", "Anaesthetist"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "neonatal_resuscitation", 
    name: "Neonatal Resuscitation", 
    description: "Newborn resuscitation protocol",
    category: "emergency_protocol",
    teamRequired: ["Paediatrician", "Midwife", "Nurse"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "obstetric_emergency", 
    name: "Obstetric Emergency", 
    description: "Maternal emergency response",
    category: "emergency_protocol",
    teamRequired: ["Obstetrician", "Midwife", "Anaesthetist"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "stroke_code", 
    name: "Stroke Code", 
    description: "Acute stroke pathway",
    category: "emergency_protocol",
    teamRequired: ["Neurologist", "ED Physician", "Radiologist"],
    takesOverScreen: true,
    isEmergency: true,
  },
  { 
    id: "stemi_code", 
    name: "STEMI Code", 
    description: "Acute MI pathway",
    category: "emergency_protocol",
    teamRequired: ["Cardiologist", "ED Physician", "Cath Lab"],
    takesOverScreen: true,
    isEmergency: true,
  },

  // ===== TREATMENT WORKFLOWS =====
  { 
    id: "chemotherapy", 
    name: "Chemotherapy", 
    description: "Cancer treatment administration",
    category: "treatment_workflow",
    typicalDuration: "2-6 hours",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "radiotherapy", 
    name: "Radiotherapy", 
    description: "Radiation therapy session",
    category: "treatment_workflow",
    typicalDuration: "15-45 mins",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "dialysis_session", 
    name: "Dialysis Session", 
    description: "Haemodialysis treatment",
    category: "treatment_workflow",
    typicalDuration: "3-4 hours",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "physiotherapy_session", 
    name: "Physiotherapy Session", 
    description: "Physical rehabilitation",
    category: "treatment_workflow",
    typicalDuration: "30-60 mins",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "psychotherapy_session", 
    name: "Psychotherapy Session", 
    description: "Mental health therapy",
    category: "treatment_workflow",
    typicalDuration: "45-60 mins",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "burns_care", 
    name: "Burns Care", 
    description: "Burns assessment and management",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "minor_procedure", 
    name: "Minor Procedure", 
    description: "Bedside or clinic procedure",
    category: "treatment_workflow",
    typicalDuration: "15-45 mins",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "wound_care", 
    name: "Wound Care", 
    description: "Dressing and wound management",
    category: "treatment_workflow",
    takesOverScreen: false,
    isEmergency: false,
  },

  // ===== PROCEDURE WORKFLOWS =====
  { 
    id: "surgical_procedure", 
    name: "Surgical Procedure", 
    description: "Operating theatre workflow",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "labour_delivery", 
    name: "Labour & Delivery", 
    description: "Childbirth management",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "endoscopy", 
    name: "Endoscopy", 
    description: "GI or bronchial scoping",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "interventional_radiology", 
    name: "Interventional Radiology", 
    description: "Image-guided procedures",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "anaesthesia_preop", 
    name: "Anaesthesia Pre-Op", 
    description: "Pre-operative assessment",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },

  // ===== LONGITUDINAL PROGRAMMES =====
  { 
    id: "antenatal_care", 
    name: "Antenatal Care", 
    description: "Pregnancy monitoring programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "hiv_care", 
    name: "HIV Care", 
    description: "HIV management programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "tb_treatment", 
    name: "TB Treatment", 
    description: "Tuberculosis management",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "ncd_management", 
    name: "NCD Management", 
    description: "Chronic disease care",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "immunization", 
    name: "Immunization", 
    description: "Vaccination schedules",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "oncology_follow_up", 
    name: "Oncology Follow-Up", 
    description: "Cancer survivorship care",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },
  { 
    id: "chronic_pain_management", 
    name: "Chronic Pain", 
    description: "Pain management programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
  },

  // ===== SPECIAL EXAMINATIONS =====
  { 
    id: "sexual_assault_exam", 
    name: "Sexual Assault Examination", 
    description: "Forensic and clinical care",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "poisoning_overdose", 
    name: "Poisoning / Overdose", 
    description: "Toxicology management",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
  { 
    id: "forensic_examination", 
    name: "Forensic Examination", 
    description: "Medico-legal examination",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
  },
];

// Helper functions
export function getPhysicalWorkspace(id: PhysicalWorkspaceType): PhysicalWorkspace | undefined {
  return PHYSICAL_WORKSPACES.find(ws => ws.id === id);
}

export function getCarePathway(id: CarePathwayId): CarePathway | undefined {
  return CARE_PATHWAYS.find(p => p.id === id);
}

export function getPathwaysByCategory(category: CarePathwayCategory): CarePathway[] {
  return CARE_PATHWAYS.filter(p => p.category === category);
}

export function getEmergencyProtocols(): CarePathway[] {
  return CARE_PATHWAYS.filter(p => p.isEmergency);
}

export function getTreatmentWorkflows(): CarePathway[] {
  return CARE_PATHWAYS.filter(p => p.category === "treatment_workflow" || p.category === "procedure_workflow");
}

export function getLongitudinalProgrammes(): CarePathway[] {
  return CARE_PATHWAYS.filter(p => p.category === "longitudinal_programme");
}
