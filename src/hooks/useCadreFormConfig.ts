/**
 * Cadre-Aware Form Configuration Hook
 * 
 * Determines form complexity based on:
 * 1. Clinical cadre (Doctor/Nurse/CHW)
 * 2. Visit type (Emergency/ANC/Chronic/General)
 * 3. Acuity level (Red/Orange/Yellow/Green)
 */

import { useState, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type ClinicalCadre = 'doctor' | 'specialist' | 'nurse' | 'midwife' | 'chw' | 'pharmacist' | 'lab_tech' | 'radiologist' | 'admin';
export type FormComplexity = 'comprehensive' | 'focused' | 'simplified';
export type VisitType = 'emergency' | 'anc' | 'pnc' | 'chronic' | 'general' | 'surgical' | 'pediatric' | 'psychiatric';
export type AcuityLevel = 'red' | 'orange' | 'yellow' | 'green';

// ── Dev Override State (singleton) ──────────────
let _devCadreOverride: ClinicalCadre | null = null;
let _devVisitOverride: VisitType | null = null;
let _devAcuityOverride: AcuityLevel | null = null;
let _devListeners: (() => void)[] = [];

function notifyDevListeners() {
  _devListeners.forEach(fn => fn());
}

export function setDevCadreOverride(cadre: ClinicalCadre | null) {
  _devCadreOverride = cadre;
  notifyDevListeners();
}
export function setDevVisitOverride(visit: VisitType | null) {
  _devVisitOverride = visit;
  notifyDevListeners();
}
export function setDevAcuityOverride(acuity: AcuityLevel | null) {
  _devAcuityOverride = acuity;
  notifyDevListeners();
}
export function getDevOverrides() {
  return { cadre: _devCadreOverride, visit: _devVisitOverride, acuity: _devAcuityOverride };
}
export function useDevOverrideListener() {
  const [, setTick] = useState(0);
  // Register listener on mount
  useState(() => {
    const fn = () => setTick(t => t + 1);
    _devListeners.push(fn);
    return () => { _devListeners = _devListeners.filter(l => l !== fn); };
  });
}

export interface CadreFormConfig {
  cadre: ClinicalCadre;
  complexity: FormComplexity;
  visitType: VisitType;
  acuity: AcuityLevel;
  
  // History sections visibility
  history: {
    showSOCRATES: boolean;
    showFullROS: boolean;
    showObsGyn: boolean;
    showPsychiatric: boolean;
    showFamilyHistory: boolean;
    showSocialHistory: boolean;
    showSurgicalHistory: boolean;
    showDrugHistory: boolean;
    showAllergies: boolean;
    showFunctionalStatus: boolean;
    showDangerSigns: boolean;
    showReferDecision: boolean;
    hpiFormat: 'socrates' | 'focused' | 'danger-signs-only';
    pmhFormat: 'coded-icd10' | 'checklist' | 'yes-no-screen';
  };
  
  // Exam sections visibility
  exam: {
    showFullSystemsExam: boolean;
    showGCS: boolean;
    showCranialNerves: boolean;
    showDetailedNeuro: boolean;
    showDetailedAbdo: boolean;
    showMusculoskeletal: boolean;
    showDermatological: boolean;
    showENT: boolean;
    showObstetricExam: boolean;
    showPediatricGrowth: boolean;
    showMentalStateExam: boolean;
    showFocusedAssessment: boolean;
    examFormat: 'full-systems' | 'focused-nursing' | 'danger-sign-screen';
  };
  
  // Labels and prompts
  labels: {
    historyTabLabel: string;
    examTabLabel: string;
    saveLabel: string;
    guidanceText: string;
  };
}

const CADRE_MAP: Record<string, ClinicalCadre> = {
  doctor: 'doctor',
  specialist: 'specialist',
  nurse: 'nurse',
  midwife: 'midwife',
  patient: 'chw', // fallback
  admin: 'admin',
  pharmacist: 'pharmacist',
  lab_tech: 'lab_tech',
  radiologist: 'radiologist',
  receptionist: 'admin',
};

function getCadreComplexity(cadre: ClinicalCadre, acuity: AcuityLevel): FormComplexity {
  if (cadre === 'doctor' || cadre === 'specialist') return 'comprehensive';
  if (cadre === 'nurse' || cadre === 'midwife') {
    return acuity === 'red' ? 'focused' : 'focused';
  }
  return 'simplified';
}

export function useCadreFormConfig(
  visitType: VisitType = 'general',
  acuity: AcuityLevel = 'green'
): CadreFormConfig {
  const { profile } = useAuth();
  useDevOverrideListener();
  
  const overrides = getDevOverrides();
  const effectiveVisitType = overrides.visit || visitType;
  const effectiveAcuity = overrides.acuity || acuity;
  
  const profileRole = (profile?.role as string) || 'doctor';
  const cadre: ClinicalCadre = overrides.cadre || CADRE_MAP[profileRole] || 'doctor';
  const complexity = getCadreComplexity(cadre, effectiveAcuity);
  
  const isComprehensive = complexity === 'comprehensive';
  const isFocused = complexity === 'focused';
  const isSimplified = complexity === 'simplified';
  
  const isEmergency = visitType === 'emergency';
  const isANC = visitType === 'anc' || visitType === 'pnc';
  const isPsych = visitType === 'psychiatric';
  const isPediatric = visitType === 'pediatric';
  const isHighAcuity = acuity === 'red' || acuity === 'orange';

  return {
    cadre,
    complexity,
    visitType,
    acuity,
    
    history: {
      showSOCRATES: isComprehensive,
      showFullROS: isComprehensive && !isHighAcuity,
      showObsGyn: (isComprehensive || isFocused) && (isANC || visitType === 'general'),
      showPsychiatric: isComprehensive && isPsych,
      showFamilyHistory: isComprehensive,
      showSocialHistory: isComprehensive || isFocused,
      showSurgicalHistory: isComprehensive,
      showDrugHistory: isComprehensive || isFocused,
      showAllergies: true, // always shown
      showFunctionalStatus: isComprehensive && !isEmergency,
      showDangerSigns: isFocused || isSimplified,
      showReferDecision: isSimplified,
      hpiFormat: isComprehensive ? 'socrates' : isFocused ? 'focused' : 'danger-signs-only',
      pmhFormat: isComprehensive ? 'coded-icd10' : isFocused ? 'checklist' : 'yes-no-screen',
    },
    
    exam: {
      showFullSystemsExam: isComprehensive,
      showGCS: isComprehensive || (isFocused && isHighAcuity),
      showCranialNerves: isComprehensive,
      showDetailedNeuro: isComprehensive,
      showDetailedAbdo: isComprehensive,
      showMusculoskeletal: isComprehensive,
      showDermatological: isComprehensive,
      showENT: isComprehensive,
      showObstetricExam: (isComprehensive || isFocused) && isANC,
      showPediatricGrowth: (isComprehensive || isFocused) && isPediatric,
      showMentalStateExam: isComprehensive && isPsych,
      showFocusedAssessment: isFocused || isSimplified,
      examFormat: isComprehensive ? 'full-systems' : isFocused ? 'focused-nursing' : 'danger-sign-screen',
    },
    
    labels: {
      historyTabLabel: isSimplified ? 'Screening' : isFocused ? 'Nursing Hx' : 'History',
      examTabLabel: isSimplified ? 'Check' : isFocused ? 'Assessment' : 'Exam',
      saveLabel: isSimplified ? 'Submit & Refer' : isFocused ? 'Save Assessment' : 'Save & Sign',
      guidanceText: isSimplified 
        ? 'Screen for danger signs and decide: Refer or Reassure'
        : isFocused
        ? 'Complete focused nursing assessment'
        : 'Document comprehensive clinical assessment',
    },
  };
}
