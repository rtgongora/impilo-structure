/**
 * Clinical Spaces Types
 * 
 * This file defines the clear distinction between:
 * 1. Physical Workspaces - Actual locations where practitioners work
 * 2. Care Pathways - Clinical workflows that can be activated from any workspace
 * 
 * Both types now include capability requirements for facility-type sensitivity
 */

import type { FacilityCapability, LevelOfCare } from "@/contexts/FacilityContext";

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
  // Facility capability requirements
  requiredCapabilities?: FacilityCapability[];  // Needs ANY of these
  minimumLevel?: LevelOfCare;                    // Minimum level of care required
}

export const PHYSICAL_WORKSPACES: PhysicalWorkspace[] = [
  // High Acuity Spaces - require specific capabilities
  { 
    id: "theatre", 
    name: "Theatre", 
    description: "Operating rooms for surgical procedures", 
    category: "high_acuity", 
    hasMonitoring: true,
    requiredCapabilities: ["theatre"],
    minimumLevel: "secondary"
  },
  { 
    id: "emergency", 
    name: "Emergency Department", 
    description: "Acute care and trauma services", 
    category: "high_acuity", 
    hasMonitoring: true,
    requiredCapabilities: ["emergency_24hr"],
    minimumLevel: "secondary"
  },
  { 
    id: "icu", 
    name: "Intensive Care Unit", 
    description: "Critical care monitoring", 
    category: "high_acuity", 
    hasMonitoring: true,
    requiredCapabilities: ["icu"],
    minimumLevel: "tertiary"
  },
  { 
    id: "labour_ward", 
    name: "Labour & Delivery Suite", 
    description: "Obstetric care and deliveries", 
    category: "high_acuity", 
    hasMonitoring: true,
    requiredCapabilities: ["maternity"],
    minimumLevel: "secondary"
  },
  
  // Specialty Spaces
  { 
    id: "dialysis_unit", 
    name: "Dialysis Unit", 
    description: "Renal replacement therapy", 
    category: "specialty", 
    hasMonitoring: true,
    requiredCapabilities: ["dialysis"],
    minimumLevel: "tertiary"
  },
  { 
    id: "physiotherapy_gym", 
    name: "Physiotherapy", 
    description: "Physical rehabilitation", 
    category: "specialty",
    requiredCapabilities: ["physiotherapy", "rehabilitation"]
  },
  { 
    id: "psychology_suite", 
    name: "Psychology Suite", 
    description: "Mental health consultations", 
    category: "specialty",
    requiredCapabilities: ["mental_health", "psychotherapy"]
  },
  { 
    id: "radiology", 
    name: "Radiology Department", 
    description: "Imaging and interventional procedures", 
    category: "specialty",
    requiredCapabilities: ["radiology", "pacs"],
    minimumLevel: "secondary"
  },
  { 
    id: "day_procedure_unit", 
    name: "Day Procedure Unit", 
    description: "Minor procedures and day cases", 
    category: "specialty"
    // No specific requirements - available at most facilities
  },
  
  // General Spaces - widely available
  { 
    id: "ward", 
    name: "Ward", 
    description: "Inpatient care areas", 
    category: "general",
    requiredCapabilities: ["inpatient"]
  },
  { 
    id: "outpatient_clinic", 
    name: "Outpatient Clinic", 
    description: "Scheduled consultations", 
    category: "general",
    requiredCapabilities: ["outpatient"]
    // Available at all levels
  },
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
  
  // Facility capability requirements
  requiredCapabilities?: FacilityCapability[];  // Needs ANY of these
  minimumLevel?: LevelOfCare;                    // Minimum level of care required
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
    requiredCapabilities: ["icu", "emergency_24hr", "inpatient"],
    minimumLevel: "secondary"
  },
  { 
    id: "rapid_response", 
    name: "Rapid Response", 
    description: "Deteriorating patient escalation",
    category: "emergency_protocol",
    teamRequired: ["Physician", "Nurse", "Respiratory"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["icu", "emergency_24hr", "inpatient"],
    minimumLevel: "secondary"
  },
  { 
    id: "trauma_activation", 
    name: "Trauma Activation", 
    description: "Major trauma response protocol",
    category: "emergency_protocol",
    teamRequired: ["Trauma Surgeon", "ED Physician", "Nurse", "Anaesthetist"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["emergency_24hr", "theatre"],
    minimumLevel: "tertiary"
  },
  { 
    id: "neonatal_resuscitation", 
    name: "Neonatal Resuscitation", 
    description: "Newborn resuscitation protocol",
    category: "emergency_protocol",
    teamRequired: ["Paediatrician", "Midwife", "Nurse"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["maternity"],
    minimumLevel: "secondary"
  },
  { 
    id: "obstetric_emergency", 
    name: "Obstetric Emergency", 
    description: "Maternal emergency response",
    category: "emergency_protocol",
    teamRequired: ["Obstetrician", "Midwife", "Anaesthetist"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["maternity"],
    minimumLevel: "secondary"
  },
  { 
    id: "stroke_code", 
    name: "Stroke Code", 
    description: "Acute stroke pathway",
    category: "emergency_protocol",
    teamRequired: ["Neurologist", "ED Physician", "Radiologist"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["emergency_24hr", "radiology"],
    minimumLevel: "tertiary"
  },
  { 
    id: "stemi_code", 
    name: "STEMI Code", 
    description: "Acute MI pathway",
    category: "emergency_protocol",
    teamRequired: ["Cardiologist", "ED Physician", "Cath Lab"],
    takesOverScreen: true,
    isEmergency: true,
    requiredCapabilities: ["emergency_24hr"],
    minimumLevel: "tertiary"
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
    requiredCapabilities: ["chemotherapy"],
    minimumLevel: "tertiary"
  },
  { 
    id: "radiotherapy", 
    name: "Radiotherapy", 
    description: "Radiation therapy session",
    category: "treatment_workflow",
    typicalDuration: "15-45 mins",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["radiotherapy"],
    minimumLevel: "quaternary"
  },
  { 
    id: "dialysis_session", 
    name: "Dialysis Session", 
    description: "Haemodialysis treatment",
    category: "treatment_workflow",
    typicalDuration: "3-4 hours",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["dialysis"],
    minimumLevel: "tertiary"
  },
  { 
    id: "physiotherapy_session", 
    name: "Physiotherapy Session", 
    description: "Physical rehabilitation",
    category: "treatment_workflow",
    typicalDuration: "30-60 mins",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["physiotherapy", "rehabilitation"]
    // Available at multiple levels
  },
  { 
    id: "psychotherapy_session", 
    name: "Psychotherapy Session", 
    description: "Mental health therapy",
    category: "treatment_workflow",
    typicalDuration: "45-60 mins",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["psychotherapy", "mental_health"]
    // Available at multiple levels
  },
  { 
    id: "burns_care", 
    name: "Burns Care", 
    description: "Burns assessment and management",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["emergency_24hr", "inpatient"],
    minimumLevel: "secondary"
  },
  { 
    id: "minor_procedure", 
    name: "Minor Procedure", 
    description: "Bedside or clinic procedure",
    category: "treatment_workflow",
    typicalDuration: "15-45 mins",
    takesOverScreen: true,
    isEmergency: false
    // Available at all levels
  },
  { 
    id: "wound_care", 
    name: "Wound Care", 
    description: "Dressing and wound management",
    category: "treatment_workflow",
    takesOverScreen: false,
    isEmergency: false
    // Available at all levels
  },

  // ===== PROCEDURE WORKFLOWS =====
  { 
    id: "surgical_procedure", 
    name: "Surgical Procedure", 
    description: "Operating theatre workflow",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["theatre"],
    minimumLevel: "secondary"
  },
  { 
    id: "labour_delivery", 
    name: "Labour & Delivery", 
    description: "Childbirth management",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["maternity"],
    minimumLevel: "secondary"
  },
  { 
    id: "endoscopy", 
    name: "Endoscopy", 
    description: "GI or bronchial scoping",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["theatre"],
    minimumLevel: "secondary"
  },
  { 
    id: "interventional_radiology", 
    name: "Interventional Radiology", 
    description: "Image-guided procedures",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["radiology", "pacs"],
    minimumLevel: "tertiary"
  },
  { 
    id: "anaesthesia_preop", 
    name: "Anaesthesia Pre-Op", 
    description: "Pre-operative assessment",
    category: "procedure_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["theatre"],
    minimumLevel: "secondary"
  },

  // ===== LONGITUDINAL PROGRAMMES =====
  { 
    id: "antenatal_care", 
    name: "Antenatal Care", 
    description: "Pregnancy monitoring programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
    requiredCapabilities: ["anc", "maternity"]
    // Available at primary level with ANC capability
  },
  { 
    id: "hiv_care", 
    name: "HIV Care", 
    description: "HIV management programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false
    // Available at all levels
  },
  { 
    id: "tb_treatment", 
    name: "TB Treatment", 
    description: "Tuberculosis management",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false
    // Available at all levels
  },
  { 
    id: "ncd_management", 
    name: "NCD Management", 
    description: "Chronic disease care",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false
    // Available at all levels
  },
  { 
    id: "immunization", 
    name: "Immunization", 
    description: "Vaccination schedules",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
    requiredCapabilities: ["immunization"]
    // Available at primary level
  },
  { 
    id: "oncology_follow_up", 
    name: "Oncology Follow-Up", 
    description: "Cancer survivorship care",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false,
    requiredCapabilities: ["chemotherapy", "radiotherapy"],
    minimumLevel: "tertiary"
  },
  { 
    id: "chronic_pain_management", 
    name: "Chronic Pain", 
    description: "Pain management programme",
    category: "longitudinal_programme",
    takesOverScreen: false,
    isEmergency: false
    // Available at multiple levels
  },

  // ===== SPECIAL EXAMINATIONS =====
  { 
    id: "sexual_assault_exam", 
    name: "Sexual Assault Examination", 
    description: "Forensic and clinical care",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false
    // Available at most facilities
  },
  { 
    id: "poisoning_overdose", 
    name: "Poisoning / Overdose", 
    description: "Toxicology management",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false,
    requiredCapabilities: ["emergency_24hr"],
    minimumLevel: "secondary"
  },
  { 
    id: "forensic_examination", 
    name: "Forensic Examination", 
    description: "Medico-legal examination",
    category: "treatment_workflow",
    takesOverScreen: true,
    isEmergency: false
    // Available at most facilities
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

// ===== CAPABILITY-FILTERED HELPERS =====
// These filter workspaces and pathways based on facility capabilities

import type { FacilityCapability as FacilityCap, LevelOfCare as LevelCare } from "@/contexts/FacilityContext";

const LEVEL_HIERARCHY: LevelOfCare[] = ['quaternary', 'tertiary', 'secondary', 'primary'];

function isAtLeastLevel(currentLevel: LevelOfCare | null, requiredLevel: LevelOfCare): boolean {
  if (!currentLevel) return true;
  const currentIndex = LEVEL_HIERARCHY.indexOf(currentLevel);
  const requiredIndex = LEVEL_HIERARCHY.indexOf(requiredLevel);
  return currentIndex <= requiredIndex; // Lower index = higher level
}

export function getAvailablePhysicalWorkspaces(
  capabilities: FacilityCap[],
  levelOfCare: LevelCare | null
): PhysicalWorkspace[] {
  return PHYSICAL_WORKSPACES.filter(ws => {
    // Check level requirement
    if (ws.minimumLevel && !isAtLeastLevel(levelOfCare, ws.minimumLevel)) {
      return false;
    }
    // Check capability requirement - need ANY of the required capabilities
    if (ws.requiredCapabilities && ws.requiredCapabilities.length > 0) {
      return ws.requiredCapabilities.some(cap => capabilities.includes(cap));
    }
    // No requirements = always available
    return true;
  });
}

export function getAvailableCarePathways(
  capabilities: FacilityCap[],
  levelOfCare: LevelCare | null
): CarePathway[] {
  return CARE_PATHWAYS.filter(pathway => {
    // Check level requirement
    if (pathway.minimumLevel && !isAtLeastLevel(levelOfCare, pathway.minimumLevel)) {
      return false;
    }
    // Check capability requirement - need ANY of the required capabilities
    if (pathway.requiredCapabilities && pathway.requiredCapabilities.length > 0) {
      return pathway.requiredCapabilities.some(cap => capabilities.includes(cap));
    }
    // No requirements = always available
    return true;
  });
}

export function getAvailableEmergencyProtocols(
  capabilities: FacilityCap[],
  levelOfCare: LevelCare | null
): CarePathway[] {
  return getAvailableCarePathways(capabilities, levelOfCare).filter(p => p.isEmergency);
}

export function getAvailableTreatmentWorkflows(
  capabilities: FacilityCap[],
  levelOfCare: LevelCare | null
): CarePathway[] {
  return getAvailableCarePathways(capabilities, levelOfCare).filter(
    p => p.category === "treatment_workflow" || p.category === "procedure_workflow"
  );
}

export function getAvailableLongitudinalProgrammes(
  capabilities: FacilityCap[],
  levelOfCare: LevelCare | null
): CarePathway[] {
  return getAvailableCarePathways(capabilities, levelOfCare).filter(
    p => p.category === "longitudinal_programme"
  );
}
