-- Cadre category enum
CREATE TYPE public.cadre_category AS ENUM (
  'medical_officer', 'medical_specialist', 'surgical_specialist',
  'nursing', 'midwifery', 'allied_health', 'diagnostic',
  'emergency', 'dental', 'community', 'admin'
);

CREATE TYPE public.cadre_form_complexity AS ENUM ('comprehensive', 'focused', 'simplified');
CREATE TYPE public.cadre_action_permission AS ENUM ('allowed', 'supervised', 'blocked');
CREATE TYPE public.cadre_section_visibility AS ENUM ('required', 'optional', 'hidden');

-- ══════════════════════════════════════════════════
-- 1. Clinical Cadre Definitions
-- ══════════════════════════════════════════════════
CREATE TABLE public.clinical_cadre_definitions (
  cadre_code TEXT PRIMARY KEY,
  cadre_category public.cadre_category NOT NULL,
  parent_cadre_code TEXT REFERENCES public.clinical_cadre_definitions(cadre_code),
  display_name TEXT NOT NULL,
  abbreviation TEXT,
  is_surgical BOOLEAN NOT NULL DEFAULT false,
  form_complexity public.cadre_form_complexity NOT NULL DEFAULT 'focused',
  scope_of_practice JSONB NOT NULL DEFAULT '[]'::JSONB,
  specialty_exam_sections JSONB NOT NULL DEFAULT '[]'::JSONB,
  cds_capabilities JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cadre_category ON public.clinical_cadre_definitions(cadre_category);
CREATE INDEX idx_cadre_parent ON public.clinical_cadre_definitions(parent_cadre_code);

ALTER TABLE public.clinical_cadre_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cadre definitions readable by authenticated users"
  ON public.clinical_cadre_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage cadre definitions"
  ON public.clinical_cadre_definitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════
-- 2. Cadre Scope Rules
-- ══════════════════════════════════════════════════
CREATE TABLE public.cadre_scope_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadre_code TEXT NOT NULL REFERENCES public.clinical_cadre_definitions(cadre_code) ON DELETE CASCADE,
  action_code TEXT NOT NULL,
  permission public.cadre_action_permission NOT NULL DEFAULT 'blocked',
  requires_supervision_by TEXT REFERENCES public.clinical_cadre_definitions(cadre_code),
  facility_level_minimum TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cadre_code, action_code)
);

CREATE INDEX idx_scope_cadre ON public.cadre_scope_rules(cadre_code);
CREATE INDEX idx_scope_action ON public.cadre_scope_rules(action_code);

ALTER TABLE public.cadre_scope_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scope rules readable by authenticated users"
  ON public.cadre_scope_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage scope rules"
  ON public.cadre_scope_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════
-- 3. Cadre Form Sections
-- ══════════════════════════════════════════════════
CREATE TABLE public.cadre_form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadre_code TEXT NOT NULL REFERENCES public.clinical_cadre_definitions(cadre_code) ON DELETE CASCADE,
  section_code TEXT NOT NULL,
  section_label TEXT NOT NULL,
  visibility public.cadre_section_visibility NOT NULL DEFAULT 'optional',
  visit_type_filter TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cadre_code, section_code)
);

CREATE INDEX idx_form_cadre ON public.cadre_form_sections(cadre_code);
CREATE INDEX idx_form_section ON public.cadre_form_sections(section_code);

ALTER TABLE public.cadre_form_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form sections readable by authenticated users"
  ON public.cadre_form_sections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage form sections"
  ON public.cadre_form_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_cadre_definitions_updated_at
  BEFORE UPDATE ON public.clinical_cadre_definitions
  FOR EACH ROW EXECUTE FUNCTION public.suite_set_updated_at();

-- ══════════════════════════════════════════════════
-- 4. SEED DATA — Parent cadres
-- ══════════════════════════════════════════════════
INSERT INTO public.clinical_cadre_definitions (cadre_code, cadre_category, display_name, abbreviation, is_surgical, form_complexity, scope_of_practice, sort_order) VALUES
-- Medical Officers
('doctor', 'medical_officer', 'Medical Officer', 'MO', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","certify_death","perform_minor_procedures"]', 10),
('intern_doctor', 'medical_officer', 'Intern Doctor', 'Int', false, 'comprehensive', '["prescribe_supervised","order_labs","order_imaging","refer"]', 11),
('registrar', 'medical_officer', 'Registrar', 'Reg', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","perform_procedures"]', 12),
('consultant', 'medical_officer', 'Consultant', 'Cons', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","certify_death","perform_procedures","supervise","teach"]', 13),

-- Medical Specialists (parent)
('specialist', 'medical_specialist', 'Specialist (General)', 'Spec', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","certify_death"]', 20),

-- Surgical Specialists (parent)
('surgeon', 'surgical_specialist', 'Surgeon (General)', 'Surg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","certify_death","perform_surgery","consent_surgery"]', 30),

-- Nursing
('nurse', 'nursing', 'Professional Nurse', 'RN', false, 'focused', '["administer_medication","record_vitals","wound_care","patient_education","triage"]', 40),
('nurse_practitioner', 'nursing', 'Nurse Practitioner', 'NP', false, 'comprehensive', '["prescribe_limited","order_labs","administer_medication","record_vitals","refer","triage","patient_education"]', 41),
('enrolled_nurse', 'nursing', 'Enrolled Nurse', 'EN', false, 'focused', '["administer_medication","record_vitals","basic_care"]', 42),

-- Midwifery
('midwife', 'midwifery', 'Midwife', 'MW', false, 'focused', '["prescribe_limited","administer_medication","record_vitals","deliver_baby","anc_assessment","refer"]', 50),

-- Allied Health
('physiotherapist', 'allied_health', 'Physiotherapist', 'PT', false, 'focused', '["assess_musculoskeletal","prescribe_exercise","manual_therapy","refer"]', 60),
('occupational_therapist', 'allied_health', 'Occupational Therapist', 'OT', false, 'focused', '["assess_functional","prescribe_activity","assistive_devices","refer"]', 61),
('speech_therapist', 'allied_health', 'Speech-Language Therapist', 'SLT', false, 'focused', '["assess_speech","assess_swallowing","therapy_plan","refer"]', 62),
('dietitian', 'allied_health', 'Dietitian', 'Diet', false, 'focused', '["assess_nutrition","prescribe_diet","monitor_growth","refer"]', 63),
('psychologist', 'allied_health', 'Psychologist', 'Psych', false, 'focused', '["psychometric_testing","psychotherapy","mental_state_exam","refer"]', 64),
('social_worker', 'allied_health', 'Social Worker', 'SW', false, 'focused', '["psychosocial_assessment","counselling","safeguarding","refer","community_linkage"]', 65),
('audiologist', 'allied_health', 'Audiologist', 'Aud', false, 'focused', '["hearing_assessment","fit_hearing_aids","refer"]', 66),
('optometrist', 'allied_health', 'Optometrist', 'Opt', false, 'focused', '["eye_exam","prescribe_lenses","screen_glaucoma","refer"]', 67),
('podiatrist', 'allied_health', 'Podiatrist', 'Pod', false, 'focused', '["foot_assessment","wound_care","orthotics","refer"]', 68),
('biokinetician', 'allied_health', 'Biokinetician', 'BK', false, 'focused', '["exercise_assessment","prescribe_exercise","rehab_programme"]', 69),
('orthotist_prosthetist', 'allied_health', 'Orthotist/Prosthetist', 'O&P', false, 'focused', '["assess_mobility","fit_devices","follow_up"]', 70),
('respiratory_therapist', 'allied_health', 'Respiratory Therapist', 'RT', false, 'focused', '["ventilator_management","airway_management","pulmonary_rehab","blood_gas_analysis"]', 71),
('radiotherapist', 'allied_health', 'Radiation Therapist', 'RadTx', false, 'focused', '["administer_radiation","treatment_planning","monitor_toxicity"]', 72),

-- Diagnostic
('radiographer', 'diagnostic', 'Radiographer', 'Rad', false, 'focused', '["perform_xray","perform_ct","perform_fluoroscopy","image_quality"]', 80),
('sonographer', 'diagnostic', 'Sonographer', 'Sono', false, 'focused', '["perform_ultrasound","obstetric_scan","cardiac_echo"]', 81),
('lab_tech', 'diagnostic', 'Laboratory Technologist', 'LabTech', false, 'simplified', '["process_specimens","run_assays","quality_control","report_results"]', 82),
('pharmacist', 'diagnostic', 'Pharmacist', 'Pharm', false, 'focused', '["dispense_medication","medication_review","drug_interaction_check","patient_counselling"]', 83),
('pharmacy_tech', 'diagnostic', 'Pharmacy Technician', 'PhTech', false, 'simplified', '["dispense_medication","stock_management"]', 84),

-- Emergency
('paramedic', 'emergency', 'Paramedic', 'Medic', false, 'focused', '["administer_medication","airway_management","trauma_assessment","triage","transport"]', 90),
('emt', 'emergency', 'Emergency Medical Technician', 'EMT', false, 'simplified', '["basic_life_support","record_vitals","triage","transport"]', 91),

-- Dental
('dentist', 'dental', 'Dentist', 'Dent', false, 'comprehensive', '["prescribe","dental_exam","dental_procedures","refer"]', 100),
('dental_therapist', 'dental', 'Dental Therapist', 'DenTx', false, 'focused', '["dental_exam","basic_restorations","extractions_simple"]', 101),
('oral_hygienist', 'dental', 'Oral Hygienist', 'OH', false, 'focused', '["prophylaxis","periodontal_screen","patient_education"]', 102),

-- Community
('chw', 'community', 'Community Health Worker', 'CHW', false, 'simplified', '["screen_danger_signs","record_vitals","health_education","refer","home_visit"]', 110),
('env_health', 'community', 'Environmental Health Practitioner', 'EHP', false, 'simplified', '["inspect_premises","water_quality","disease_surveillance"]', 111),
('health_promoter', 'community', 'Health Promoter', 'HP', false, 'simplified', '["health_education","screen_danger_signs","community_mobilisation"]', 112),

-- Admin
('admin', 'admin', 'Administrator', 'Admin', false, 'simplified', '["manage_users","view_reports","manage_queue"]', 120),
('health_info_officer', 'admin', 'Health Information Officer', 'HIO', false, 'simplified', '["medical_coding","data_quality","report_generation"]', 121),
('receptionist', 'admin', 'Receptionist', 'Recep', false, 'simplified', '["register_patient","manage_queue","schedule_appointment"]', 122);

-- ══════════════════════════════════════════════════
-- 5. SEED DATA — Medical Specialist subtypes
-- ══════════════════════════════════════════════════
INSERT INTO public.clinical_cadre_definitions (cadre_code, cadre_category, parent_cadre_code, display_name, abbreviation, is_surgical, form_complexity, scope_of_practice, specialty_exam_sections, sort_order) VALUES
('cardiologist', 'medical_specialist', 'specialist', 'Cardiologist', 'Cardio', false, 'comprehensive', '["prescribe","order_labs","order_imaging","order_echo","order_ecg","admit","refer","catheterisation"]', '["cardiovascular_exam","ecg_interpretation","jvp_assessment","peripheral_pulses","heart_sounds"]', 21),
('pulmonologist', 'medical_specialist', 'specialist', 'Pulmonologist', 'Pulm', false, 'comprehensive', '["prescribe","order_labs","order_imaging","order_pfts","bronchoscopy","admit","refer"]', '["respiratory_exam","chest_auscultation","spirometry_interpretation","abg_interpretation"]', 22),
('gastroenterologist', 'medical_specialist', 'specialist', 'Gastroenterologist', 'Gastro', false, 'comprehensive', '["prescribe","order_labs","order_imaging","endoscopy","colonoscopy","admit","refer"]', '["abdominal_exam","rectal_exam","hepatomegaly_assessment","ascites_assessment"]', 23),
('nephrologist', 'medical_specialist', 'specialist', 'Nephrologist', 'Neph', false, 'comprehensive', '["prescribe","order_labs","order_imaging","dialysis_management","admit","refer"]', '["renal_exam","fluid_balance","dialysis_assessment","electrolyte_interpretation"]', 24),
('neurologist', 'medical_specialist', 'specialist', 'Neurologist', 'Neuro', false, 'comprehensive', '["prescribe","order_labs","order_imaging","order_eeg","lumbar_puncture","admit","refer"]', '["cranial_nerves","motor_exam","sensory_exam","cerebellar_exam","gcs","reflexes","gait"]', 25),
('rheumatologist', 'medical_specialist', 'specialist', 'Rheumatologist', 'Rheum', false, 'comprehensive', '["prescribe","order_labs","order_imaging","joint_injection","admit","refer"]', '["joint_exam","skin_assessment","functional_assessment","das28_score"]', 26),
('endocrinologist', 'medical_specialist', 'specialist', 'Endocrinologist', 'Endo', false, 'comprehensive', '["prescribe","order_labs","order_imaging","insulin_management","admit","refer"]', '["thyroid_exam","diabetic_foot","growth_assessment","metabolic_assessment"]', 27),
('haematologist', 'medical_specialist', 'specialist', 'Haematologist', 'Haem', false, 'comprehensive', '["prescribe","order_labs","order_imaging","bone_marrow_biopsy","transfusion_management","admit","refer"]', '["lymph_node_exam","spleen_assessment","bleeding_assessment","coagulation_screen"]', 28),
('oncologist', 'medical_specialist', 'specialist', 'Medical Oncologist', 'Onc', false, 'comprehensive', '["prescribe","order_labs","order_imaging","chemotherapy","admit","refer"]', '["lymph_node_exam","performance_status","toxicity_grading","tumour_staging"]', 29),
('infectious_disease', 'medical_specialist', 'specialist', 'Infectious Disease Specialist', 'ID', false, 'comprehensive', '["prescribe","order_labs","order_imaging","antimicrobial_stewardship","admit","refer"]', '["infection_screen","sepsis_assessment","travel_history","hiv_staging"]', 210),
('dermatologist', 'medical_specialist', 'specialist', 'Dermatologist', 'Derm', false, 'comprehensive', '["prescribe","order_labs","skin_biopsy","phototherapy","refer"]', '["skin_exam","lesion_description","dermoscopy","patch_testing"]', 211),
('allergist', 'medical_specialist', 'specialist', 'Allergist/Immunologist', 'Allerg', false, 'comprehensive', '["prescribe","order_labs","allergy_testing","immunotherapy","refer"]', '["allergy_history","skin_prick_test","anaphylaxis_assessment","immune_function"]', 212),
('geriatrician', 'medical_specialist', 'specialist', 'Geriatrician', 'Geri', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","polypharmacy_review"]', '["functional_assessment","cognitive_screen","falls_assessment","frailty_score","nutritional_screen"]', 213),
('palliative_medicine', 'medical_specialist', 'specialist', 'Palliative Medicine Specialist', 'Pall', false, 'comprehensive', '["prescribe","order_labs","symptom_management","advance_care_planning","refer"]', '["symptom_assessment","pain_score","performance_status","psychosocial_assessment"]', 214),
('neonatologist', 'medical_specialist', 'specialist', 'Neonatologist', 'Neo', false, 'comprehensive', '["prescribe","order_labs","order_imaging","ventilator_management","admit","refer"]', '["neonatal_exam","apgar_score","gestational_age","growth_parameters","reflexes_neonatal"]', 215),
('intensivist', 'medical_specialist', 'specialist', 'Intensivist / Critical Care', 'ICU', false, 'comprehensive', '["prescribe","order_labs","order_imaging","ventilator_management","central_line","admit","refer"]', '["gcs","hemodynamic_assessment","ventilator_assessment","sedation_score","organ_failure_score"]', 216),
('paediatrician', 'medical_specialist', 'specialist', 'Paediatrician', 'Paed', false, 'comprehensive', '["prescribe","order_labs","order_imaging","admit","refer","growth_monitoring"]', '["paediatric_exam","developmental_milestones","growth_chart","immunisation_review"]', 217),
('psychiatrist', 'medical_specialist', 'specialist', 'Psychiatrist', 'Psych', false, 'comprehensive', '["prescribe","order_labs","mental_health_act","admit","refer","ect"]', '["mental_state_exam","risk_assessment","cognitive_screen","substance_use_assessment"]', 218),

-- ══════════════════════════════════════════════════
-- 6. SEED DATA — Surgical Specialist subtypes
-- ══════════════════════════════════════════════════
('general_surgeon', 'surgical_specialist', 'surgeon', 'General Surgeon', 'GenSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["abdominal_exam","hernia_assessment","wound_assessment","surgical_site"]', 31),
('orthopaedic_surgeon', 'surgical_specialist', 'surgeon', 'Orthopaedic Surgeon', 'Ortho', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","fracture_management","admit","refer"]', '["musculoskeletal_exam","joint_exam","neurovascular_status","fracture_assessment","gait"]', 32),
('neurosurgeon', 'surgical_specialist', 'surgeon', 'Neurosurgeon', 'NSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["neurological_exam","gcs","cranial_nerves","spine_assessment","motor_power"]', 33),
('cardiothoracic_surgeon', 'surgical_specialist', 'surgeon', 'Cardiothoracic Surgeon', 'CTSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["cardiovascular_exam","chest_exam","sternal_wound","bypass_assessment"]', 34),
('vascular_surgeon', 'surgical_specialist', 'surgeon', 'Vascular Surgeon', 'VascSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["peripheral_pulses","abi_measurement","varicose_assessment","wound_assessment"]', 35),
('urologist', 'surgical_specialist', 'surgeon', 'Urologist', 'Uro', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","cystoscopy","admit","refer"]', '["urogenital_exam","prostate_exam","renal_angle","bladder_assessment"]', 36),
('plastic_surgeon', 'surgical_specialist', 'surgeon', 'Plastic & Reconstructive Surgeon', 'PlSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["wound_assessment","flap_assessment","burn_assessment","cosmetic_assessment"]', 37),
('paediatric_surgeon', 'surgical_specialist', 'surgeon', 'Paediatric Surgeon', 'PaedSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["paediatric_abdominal","neonatal_assessment","growth_parameters"]', 38),
('ent_surgeon', 'surgical_specialist', 'surgeon', 'ENT / ORL Surgeon', 'ENT', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","audiometry","admit","refer"]', '["ear_exam","nose_exam","throat_exam","neck_exam","hearing_assessment","voice_assessment"]', 39),
('ophthalmologist', 'surgical_specialist', 'surgeon', 'Ophthalmologist', 'Ophth', true, 'comprehensive', '["prescribe","order_labs","perform_surgery","consent_surgery","laser_therapy","refer"]', '["visual_acuity","fundoscopy","slit_lamp","intraocular_pressure","visual_fields"]', 310),
('maxillofacial_surgeon', 'surgical_specialist', 'surgeon', 'Maxillofacial Surgeon', 'MaxFac', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer"]', '["facial_exam","tmj_assessment","dental_occlusion","facial_nerve"]', 311),
('trauma_surgeon', 'surgical_specialist', 'surgeon', 'Trauma Surgeon', 'Trauma', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","admit","refer","damage_control"]', '["primary_survey","secondary_survey","fast_exam","gcs","trauma_scoring"]', 312),
('colorectal_surgeon', 'surgical_specialist', 'surgeon', 'Colorectal Surgeon', 'CRSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","colonoscopy","admit","refer"]', '["abdominal_exam","rectal_exam","stoma_assessment","perineal_exam"]', 313),
('hepatobiliary_surgeon', 'surgical_specialist', 'surgeon', 'Hepatobiliary Surgeon', 'HPBSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","ercp","admit","refer"]', '["abdominal_exam","liver_assessment","jaundice_assessment","ascites"]', 314),
('transplant_surgeon', 'surgical_specialist', 'surgeon', 'Transplant Surgeon', 'TransSurg', true, 'comprehensive', '["prescribe","order_labs","order_imaging","perform_surgery","consent_surgery","immunosuppression","admit","refer"]', '["organ_assessment","rejection_screen","immunosuppression_monitoring","infection_screen"]', 315),

-- Nursing specialties
('icu_nurse', 'nursing', 'nurse', 'ICU / Critical Care Nurse', 'ICUN', false, 'focused', '["administer_medication","record_vitals","ventilator_monitoring","hemodynamic_monitoring","triage"]', '["gcs","sedation_score","ventilator_assessment","fluid_balance"]', 43),
('theatre_nurse', 'nursing', 'nurse', 'Theatre / Perioperative Nurse', 'ThN', false, 'focused', '["administer_medication","record_vitals","surgical_count","patient_positioning","surgical_safety_checklist"]', '["surgical_site_check","safety_checklist","instrument_count"]', 44),
('emergency_nurse', 'nursing', 'nurse', 'Emergency Nurse', 'EmN', false, 'focused', '["administer_medication","record_vitals","triage","wound_care","splinting"]', '["primary_survey","triage_assessment","gcs","pain_score"]', 45),
('paediatric_nurse', 'nursing', 'nurse', 'Paediatric Nurse', 'PaedN', false, 'focused', '["administer_medication","record_vitals","growth_monitoring","immunisation","patient_education"]', '["paediatric_assessment","growth_chart","developmental_screen"]', 46),
('oncology_nurse', 'nursing', 'nurse', 'Oncology Nurse', 'OncN', false, 'focused', '["administer_medication","chemotherapy_administration","record_vitals","symptom_management"]', '["toxicity_grading","performance_status","port_assessment","mucositis_grading"]', 47),
('psychiatric_nurse', 'nursing', 'nurse', 'Psychiatric Nurse', 'PsychN', false, 'focused', '["administer_medication","record_vitals","mental_health_assessment","restraint_management","patient_education"]', '["mental_state_screen","risk_assessment","behaviour_chart","medication_compliance"]', 48),
('community_nurse', 'nursing', 'nurse', 'Community Health Nurse', 'CommN', false, 'focused', '["administer_medication","record_vitals","wound_care","health_education","home_visit","immunisation"]', '["home_environment","functional_assessment","wound_assessment","medication_compliance"]', 49),
('infection_control_nurse', 'nursing', 'nurse', 'Infection Prevention & Control Nurse', 'IPCN', false, 'focused', '["surveillance","outbreak_investigation","policy_development","training","audit"]', '["infection_screen","hand_hygiene_audit","isolation_assessment","antibiogram_review"]', 410),
('wound_care_nurse', 'nursing', 'nurse', 'Wound Care Nurse', 'WCN', false, 'focused', '["wound_assessment","wound_care","negative_pressure_therapy","patient_education"]', '["wound_measurement","wound_classification","tissue_viability","vascular_assessment"]', 411),
('advanced_midwife', 'midwifery', 'midwife', 'Advanced Midwife', 'AdvMW', false, 'focused', '["prescribe_limited","administer_medication","record_vitals","deliver_baby","anc_assessment","c_section_assist","refer"]', '["obstetric_exam","fetal_monitoring","partogram","postpartum_assessment"]', 51);
