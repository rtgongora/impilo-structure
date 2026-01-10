-- Seed common lab tests with LOINC codes
INSERT INTO public.lab_test_catalog (test_code, loinc_code, test_name, short_name, category, specimen_type, specimen_snomed_code, department, result_type, result_unit, ucum_unit, reference_range_low, reference_range_high, critical_low, critical_high, turnaround_time_hours, requires_fasting, collection_instructions) VALUES
-- Hematology
('CBC', '58410-2', 'Complete Blood Count with Differential', 'CBC w/Diff', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Collect in EDTA (purple top) tube'),
('HGB', '718-7', 'Hemoglobin', 'Hgb', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', 'g/dL', 'g/dL', 12.0, 17.5, 7.0, 20.0, 2, false, 'Collect in EDTA tube'),
('HCT', '4544-3', 'Hematocrit', 'Hct', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', '%', '%', 36.0, 50.0, 20.0, 60.0, 2, false, 'Collect in EDTA tube'),
('WBC', '6690-2', 'White Blood Cell Count', 'WBC', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', 'x10^9/L', '10*9/L', 4.5, 11.0, 2.0, 30.0, 2, false, 'Collect in EDTA tube'),
('PLT', '777-3', 'Platelet Count', 'Plt', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', 'x10^9/L', '10*9/L', 150, 400, 50, 1000, 2, false, 'Collect in EDTA tube'),
('RBC', '789-8', 'Red Blood Cell Count', 'RBC', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', 'x10^12/L', '10*12/L', 4.0, 5.5, 2.5, 7.0, 2, false, 'Collect in EDTA tube'),
('ESR', '30341-2', 'Erythrocyte Sedimentation Rate', 'ESR', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', 'mm/hr', 'mm/h', 0, 20, NULL, 100, 2, false, 'Collect in ESR tube'),
('RETIC', '17849-1', 'Reticulocyte Count', 'Retic', 'Hematology', 'Whole Blood', '258580003', 'Hematology', 'numeric', '%', '%', 0.5, 2.5, NULL, NULL, 4, false, 'Collect in EDTA tube'),

-- Chemistry
('BMP', '24320-4', 'Basic Metabolic Panel', 'BMP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, true, 'Fasting 8-12 hours preferred. Collect in SST (gold top) tube'),
('CMP', '24323-8', 'Comprehensive Metabolic Panel', 'CMP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, true, 'Fasting 8-12 hours required. Collect in SST tube'),
('GLU', '2345-7', 'Glucose', 'Glucose', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 70, 100, 40, 500, 2, true, 'Fasting required. Collect in gray top tube'),
('GLURANDOM', '2339-0', 'Glucose, Random', 'Glucose Random', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 70, 140, 40, 500, 2, false, 'Collect in gray top tube'),
('HBA1C', '4548-4', 'Hemoglobin A1c', 'HbA1c', 'Chemistry', 'Whole Blood', '258580003', 'Chemistry', 'numeric', '%', '%', 4.0, 5.6, NULL, 14.0, 24, false, 'Collect in EDTA tube'),
('BUN', '3094-0', 'Blood Urea Nitrogen', 'BUN', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 7, 20, 2, 100, 2, false, 'Collect in SST tube'),
('CREAT', '2160-0', 'Creatinine', 'Creat', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 0.6, 1.2, 0.3, 10.0, 2, false, 'Collect in SST tube'),
('NA', '2951-2', 'Sodium', 'Na', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mEq/L', 'meq/L', 136, 145, 120, 160, 2, false, 'Collect in SST tube'),
('K', '2823-3', 'Potassium', 'K', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mEq/L', 'meq/L', 3.5, 5.0, 2.5, 6.5, 2, false, 'Avoid hemolysis. Collect in SST tube'),
('CL', '2075-0', 'Chloride', 'Cl', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mEq/L', 'meq/L', 98, 106, 80, 120, 2, false, 'Collect in SST tube'),
('CO2', '2028-9', 'Carbon Dioxide (Bicarbonate)', 'CO2', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mEq/L', 'meq/L', 23, 29, 10, 40, 2, false, 'Collect in SST tube'),
('CA', '17861-6', 'Calcium', 'Ca', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 8.6, 10.2, 6.0, 14.0, 2, false, 'Collect in SST tube'),
('MG', '19123-9', 'Magnesium', 'Mg', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 1.7, 2.2, 1.0, 4.0, 2, false, 'Collect in SST tube'),
('PHOS', '2777-1', 'Phosphorus', 'Phos', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 2.5, 4.5, 1.0, 8.0, 2, false, 'Fasting preferred. Collect in SST tube'),

-- Liver Function
('LFT', '24325-3', 'Liver Function Panel', 'LFT', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Collect in SST tube'),
('AST', '1920-8', 'Aspartate Aminotransferase', 'AST', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/L', 'U/L', 10, 40, NULL, 1000, 2, false, 'Collect in SST tube'),
('ALT', '1742-6', 'Alanine Aminotransferase', 'ALT', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/L', 'U/L', 7, 56, NULL, 1000, 2, false, 'Collect in SST tube'),
('ALP', '6768-6', 'Alkaline Phosphatase', 'ALP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/L', 'U/L', 44, 147, NULL, 1000, 2, false, 'Collect in SST tube'),
('TBILI', '1975-2', 'Bilirubin, Total', 'T.Bili', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 0.1, 1.2, NULL, 15.0, 2, false, 'Protect from light. Collect in SST tube'),
('DBILI', '1968-7', 'Bilirubin, Direct', 'D.Bili', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 0.0, 0.3, NULL, 10.0, 2, false, 'Protect from light. Collect in SST tube'),
('ALBUMIN', '1751-7', 'Albumin', 'Alb', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'g/dL', 'g/dL', 3.5, 5.0, 2.0, NULL, 2, false, 'Collect in SST tube'),
('TP', '2885-2', 'Total Protein', 'TP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'g/dL', 'g/dL', 6.0, 8.3, 4.0, NULL, 2, false, 'Collect in SST tube'),
('GGT', '2324-2', 'Gamma-Glutamyl Transferase', 'GGT', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/L', 'U/L', 9, 48, NULL, 1000, 2, false, 'Collect in SST tube'),

-- Lipid Panel
('LIPID', '24331-1', 'Lipid Panel', 'Lipid', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, true, 'Fasting 9-12 hours required. Collect in SST tube'),
('CHOL', '2093-3', 'Cholesterol, Total', 'Chol', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', NULL, 200, NULL, 400, 2, true, 'Fasting preferred. Collect in SST tube'),
('HDL', '2085-9', 'HDL Cholesterol', 'HDL', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 40, NULL, 20, NULL, 2, true, 'Fasting preferred. Collect in SST tube'),
('LDL', '13457-7', 'LDL Cholesterol', 'LDL', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', NULL, 100, NULL, 250, 2, true, 'Fasting required. Collect in SST tube'),
('TRIG', '2571-8', 'Triglycerides', 'Trig', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', NULL, 150, NULL, 500, 2, true, 'Fasting required. Collect in SST tube'),

-- Thyroid
('TSH', '3016-3', 'Thyroid Stimulating Hormone', 'TSH', 'Endocrinology', 'Serum', '119364003', 'Chemistry', 'numeric', 'mIU/L', 'mU/L', 0.4, 4.0, 0.1, 50.0, 24, false, 'Collect in SST tube'),
('FT4', '3024-7', 'Free T4', 'FT4', 'Endocrinology', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/dL', 'ng/dL', 0.8, 1.8, 0.4, 5.0, 24, false, 'Collect in SST tube'),
('FT3', '3051-0', 'Free T3', 'FT3', 'Endocrinology', 'Serum', '119364003', 'Chemistry', 'numeric', 'pg/mL', 'pg/mL', 2.3, 4.2, 1.0, 8.0, 24, false, 'Collect in SST tube'),

-- Cardiac
('TROP', '6598-7', 'Troponin I', 'TropI', 'Cardiac', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 0.04, NULL, 0.5, 1, false, 'STAT available. Collect in SST tube'),
('BNP', '30934-4', 'B-Type Natriuretic Peptide', 'BNP', 'Cardiac', 'Plasma', '119361006', 'Chemistry', 'numeric', 'pg/mL', 'pg/mL', 0, 100, NULL, 500, 4, false, 'Collect in EDTA tube'),
('CKMB', '13969-1', 'Creatine Kinase-MB', 'CK-MB', 'Cardiac', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 5, NULL, 25, 2, false, 'Collect in SST tube'),

-- Coagulation
('PT', '5902-2', 'Prothrombin Time', 'PT', 'Coagulation', 'Plasma', '119361006', 'Hematology', 'numeric', 'seconds', 's', 11, 13.5, 8, 30, 2, false, 'Collect in blue top (citrate) tube. Fill to line'),
('INR', '6301-6', 'International Normalized Ratio', 'INR', 'Coagulation', 'Plasma', '119361006', 'Hematology', 'numeric', 'ratio', '1', 0.8, 1.2, NULL, 5.0, 2, false, 'Collect in citrate tube'),
('PTT', '3173-2', 'Partial Thromboplastin Time', 'PTT', 'Coagulation', 'Plasma', '119361006', 'Hematology', 'numeric', 'seconds', 's', 25, 35, 15, 100, 2, false, 'Collect in citrate tube'),
('DIMER', '48065-7', 'D-Dimer', 'D-Dimer', 'Coagulation', 'Plasma', '119361006', 'Hematology', 'numeric', 'ng/mL FEU', 'ng/mL', 0, 500, NULL, 5000, 4, false, 'Collect in citrate tube'),
('FIB', '3255-7', 'Fibrinogen', 'Fib', 'Coagulation', 'Plasma', '119361006', 'Hematology', 'numeric', 'mg/dL', 'mg/dL', 200, 400, 100, 700, 4, false, 'Collect in citrate tube'),

-- Urinalysis
('UA', '24356-8', 'Urinalysis Complete', 'UA', 'Urinalysis', 'Urine', '122575003', 'Urinalysis', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Clean catch midstream urine'),
('URINE-MICRO', '12235-8', 'Urinalysis Microscopic', 'UA Micro', 'Urinalysis', 'Urine', '122575003', 'Urinalysis', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Clean catch midstream urine'),
('UCR', '2161-8', 'Urine Creatinine', 'UCr', 'Urinalysis', 'Urine', '122575003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 20, 275, NULL, NULL, 4, false, '24-hour or random urine'),
('UPRO', '2888-6', 'Urine Protein', 'UPro', 'Urinalysis', 'Urine', '122575003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 0, 14, NULL, 300, 4, false, '24-hour or random urine'),
('MALB', '14957-5', 'Microalbumin, Urine', 'MAU', 'Urinalysis', 'Urine', '122575003', 'Chemistry', 'numeric', 'mg/L', 'mg/L', 0, 30, NULL, 300, 24, false, 'First morning void preferred'),

-- Microbiology
('BCULT', '600-7', 'Blood Culture', 'BCx', 'Microbiology', 'Whole Blood', '258580003', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 120, false, 'Collect 2 sets from different sites. 10mL per bottle'),
('UCULT', '630-4', 'Urine Culture', 'UCx', 'Microbiology', 'Urine', '122575003', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 48, false, 'Clean catch midstream. Refrigerate if delay'),
('SCULT', '43409-2', 'Stool Culture', 'SCx', 'Microbiology', 'Stool', '119339001', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 72, false, 'Fresh stool specimen'),
('SPUTCULT', '624-7', 'Sputum Culture', 'SputCx', 'Microbiology', 'Sputum', '119334006', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 72, false, 'Deep cough, early morning preferred'),
('WOUNDCX', '6463-4', 'Wound Culture', 'WndCx', 'Microbiology', 'Wound', '258415003', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 72, false, 'Aspirate or swab from wound'),
('CSF-CULT', '6331-3', 'CSF Culture', 'CSFCx', 'Microbiology', 'CSF', '258450006', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 72, false, 'Sterile collection by LP'),

-- Infectious Disease
('HIV', '7917-8', 'HIV 1/2 Antibody Screen', 'HIV Ab', 'Serology', 'Serum', '119364003', 'Serology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Collect in SST tube'),
('HIVVL', '20447-9', 'HIV-1 Viral Load', 'HIV VL', 'Molecular', 'Plasma', '119361006', 'Molecular', 'numeric', 'copies/mL', '1/mL', NULL, NULL, NULL, NULL, 168, false, 'Collect in EDTA tube. Process within 6 hours'),
('HIVCD4', '24467-3', 'CD4 Count', 'CD4', 'Immunology', 'Whole Blood', '258580003', 'Immunology', 'numeric', 'cells/µL', '1/uL', 500, 1500, 200, NULL, 24, false, 'Collect in EDTA tube. Process within 24 hours'),
('HBSAG', '5196-1', 'Hepatitis B Surface Antigen', 'HBsAg', 'Serology', 'Serum', '119364003', 'Serology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 24, false, 'Collect in SST tube'),
('HCVAB', '16128-1', 'Hepatitis C Antibody', 'HCV Ab', 'Serology', 'Serum', '119364003', 'Serology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 24, false, 'Collect in SST tube'),
('RPR', '20507-0', 'RPR (Syphilis Screen)', 'RPR', 'Serology', 'Serum', '119364003', 'Serology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 24, false, 'Collect in SST tube'),
('MALARIA', '32700-7', 'Malaria Smear', 'Malaria', 'Parasitology', 'Whole Blood', '258580003', 'Hematology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Collect thick and thin smear'),
('MALARIARDT', '70569-9', 'Malaria Rapid Diagnostic Test', 'Malaria RDT', 'Parasitology', 'Whole Blood', '258580003', 'Hematology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 0.5, false, 'Finger prick blood'),

-- TB
('TBAFB', '11545-1', 'AFB Smear', 'AFB', 'Microbiology', 'Sputum', '119334006', 'Microbiology', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 24, false, 'Early morning sputum x3'),
('TBCULT', '543-9', 'TB Culture', 'TB Cx', 'Microbiology', 'Sputum', '119334006', 'Microbiology', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 1344, false, 'Early morning sputum'),
('GENEXPERT', '85362-2', 'GeneXpert MTB/RIF', 'Xpert', 'Molecular', 'Sputum', '119334006', 'Molecular', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Sputum sample, 1mL minimum'),

-- Blood Bank
('ABOTYP', '882-1', 'ABO/Rh Typing', 'Type&Screen', 'Blood Bank', 'Whole Blood', '258580003', 'Blood Bank', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Collect in EDTA tube'),
('XMATCH', '897-9', 'Crossmatch', 'XM', 'Blood Bank', 'Whole Blood', '258580003', 'Blood Bank', 'text', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Collect in EDTA tube'),
('COOMBS', '1007-4', 'Direct Coombs Test', 'DAT', 'Blood Bank', 'Whole Blood', '258580003', 'Blood Bank', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Collect in EDTA tube'),
('ABSCREEN', '890-4', 'Antibody Screen', 'AbScr', 'Blood Bank', 'Serum', '119364003', 'Blood Bank', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Collect in SST tube'),

-- CSF
('CSFANA', '49588-6', 'CSF Analysis', 'CSF', 'CSF', 'CSF', '258450006', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 2, false, 'Collect by lumbar puncture'),
('CSFGLU', '2342-4', 'CSF Glucose', 'CSF Glu', 'CSF', 'CSF', '258450006', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 40, 70, 20, NULL, 2, false, 'Collect with serum glucose'),
('CSFPRO', '2880-3', 'CSF Protein', 'CSF Pro', 'CSF', 'CSF', '258450006', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 15, 45, NULL, 500, 2, false, 'Sterile collection'),

-- Tumor Markers
('PSA', '2857-1', 'Prostate Specific Antigen', 'PSA', 'Tumor Markers', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 4.0, NULL, 20.0, 24, false, 'Collect in SST tube'),
('CEA', '2039-6', 'Carcinoembryonic Antigen', 'CEA', 'Tumor Markers', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 3.0, NULL, 100, 24, false, 'Collect in SST tube'),
('AFP', '1834-1', 'Alpha-Fetoprotein', 'AFP', 'Tumor Markers', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 10, NULL, 500, 24, false, 'Collect in SST tube'),
('CA125', '10334-1', 'CA-125', 'CA125', 'Tumor Markers', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/mL', 'U/mL', 0, 35, NULL, 500, 24, false, 'Collect in SST tube'),
('CA199', '24108-3', 'CA 19-9', 'CA19-9', 'Tumor Markers', 'Serum', '119364003', 'Chemistry', 'numeric', 'U/mL', 'U/mL', 0, 37, NULL, 500, 24, false, 'Collect in SST tube'),

-- Iron Studies
('IRON', '2498-4', 'Iron, Serum', 'Fe', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'µg/dL', 'ug/dL', 60, 170, 30, 300, 4, true, 'Fasting preferred. Morning collection'),
('TIBC', '2500-7', 'Total Iron Binding Capacity', 'TIBC', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'µg/dL', 'ug/dL', 250, 370, NULL, NULL, 4, false, 'Collect in SST tube'),
('FERR', '2276-4', 'Ferritin', 'Ferr', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 12, 300, 5, 1000, 24, false, 'Collect in SST tube'),

-- Inflammatory Markers
('CRP', '1988-5', 'C-Reactive Protein', 'CRP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/L', 'mg/L', 0, 10, NULL, 200, 4, false, 'Collect in SST tube'),
('HSCRP', '30522-7', 'High-Sensitivity CRP', 'hs-CRP', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/L', 'mg/L', 0, 3, NULL, 50, 24, false, 'Collect in SST tube'),
('PROCAL', '75241-0', 'Procalcitonin', 'PCT', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 0, 0.5, NULL, 10, 4, false, 'STAT available. Collect in SST tube'),

-- Vitamins
('VITD', '1989-3', 'Vitamin D, 25-Hydroxy', 'Vit D', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 30, 100, 10, 150, 48, false, 'Collect in SST tube'),
('VITB12', '2132-9', 'Vitamin B12', 'B12', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'pg/mL', 'pg/mL', 200, 900, 150, NULL, 48, false, 'Collect in SST tube'),
('FOLATE', '2284-8', 'Folate', 'Folate', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'ng/mL', 'ng/mL', 3, 17, 2, NULL, 48, false, 'Collect in SST tube'),

-- Pregnancy
('BHCG', '21198-7', 'Beta-HCG, Quantitative', 'β-hCG', 'Chemistry', 'Serum', '119364003', 'Chemistry', 'numeric', 'mIU/mL', 'mU/mL', NULL, NULL, NULL, NULL, 4, false, 'Collect in SST tube'),
('UHCG', '2106-3', 'Urine Pregnancy Test', 'UPT', 'Urinalysis', 'Urine', '122575003', 'Urinalysis', 'categorical', NULL, NULL, NULL, NULL, NULL, NULL, 0.5, false, 'First morning void preferred'),

-- Drugs/Toxicology
('UDRUG', '19295-5', 'Urine Drug Screen', 'UDS', 'Toxicology', 'Urine', '122575003', 'Toxicology', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, 'Witnessed collection if forensic'),
('ETOH', '5643-2', 'Ethanol Level', 'EtOH', 'Toxicology', 'Serum', '119364003', 'Chemistry', 'numeric', 'mg/dL', 'mg/dL', 0, 0, 0, 300, 2, false, 'Collect in SST tube. No alcohol prep'),

-- Arterial Blood Gas
('ABG', '24336-0', 'Arterial Blood Gas', 'ABG', 'Blood Gas', 'Arterial Blood', '122554006', 'Chemistry', 'panel', NULL, NULL, NULL, NULL, NULL, NULL, 0.5, false, 'Arterial puncture. Place on ice immediately'),
('PH', '2744-1', 'pH, Blood', 'pH', 'Blood Gas', 'Arterial Blood', '122554006', 'Chemistry', 'numeric', NULL, '1', 7.35, 7.45, 7.0, 7.7, 0.5, false, 'Arterial sample on ice'),
('PCO2', '2019-8', 'pCO2', 'pCO2', 'Blood Gas', 'Arterial Blood', '122554006', 'Chemistry', 'numeric', 'mmHg', 'mm[Hg]', 35, 45, 20, 80, 0.5, false, 'Arterial sample on ice'),
('PO2', '2703-7', 'pO2', 'pO2', 'Blood Gas', 'Arterial Blood', '122554006', 'Chemistry', 'numeric', 'mmHg', 'mm[Hg]', 80, 100, 40, NULL, 0.5, false, 'Arterial sample on ice'),
('LACTATE', '2524-7', 'Lactate', 'Lac', 'Chemistry', 'Plasma', '119361006', 'Chemistry', 'numeric', 'mmol/L', 'mmol/L', 0.5, 2.2, NULL, 4.0, 1, false, 'Collect without tourniquet. Process immediately')

ON CONFLICT (test_code) DO NOTHING;