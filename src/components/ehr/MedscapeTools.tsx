import { useState, useCallback, useMemo } from "react";
import {
  Pill,
  Search,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Eye,
  Info,
  X,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Stethoscope,
  ClipboardList,
  User,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEHR } from "@/contexts/EHRContext";
import { toast } from "sonner";

// ─── Patient Context Helper ────────────────────────────────────────

function usePatientContext() {
  const { currentEncounter } = useEHR();
  const patient = currentEncounter?.patient || null;

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const dob = new Date(patient.dateOfBirth);
    const today = new Date();
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    return a;
  }, [patient?.dateOfBirth]);

  // Mock current medications for the active patient (in production, fetched from encounter/prescriptions)
  const currentMedications = useMemo(() => {
    if (!patient) return [];
    // Simulate patient's current medication list
    return ["Metformin", "Amlodipine", "Hydrochlorothiazide"];
  }, [patient]);

  // Mock recent vitals
  const recentVitals = useMemo(() => {
    if (!patient) return null;
    return {
      weight: 72,
      height: 165,
      systolicBP: 138,
      diastolicBP: 88,
      heartRate: 78,
      respiratoryRate: 18,
      temperature: 36.8,
      gcs: 15,
      serumCreatinine: 1.1,
    };
  }, [patient]);

  // Mock active conditions
  const activeConditions = useMemo(() => {
    if (!patient) return [];
    return [
      { name: "Type 2 Diabetes Mellitus", icd10: "E11" },
      { name: "Essential Hypertension", icd10: "I10" },
    ];
  }, [patient]);

  return { patient, age, currentMedications, recentVitals, activeConditions };
}

// ─── Patient Context Banner (reusable) ──────────────────────────────

function PatientContextBanner({ label, items, icon }: { label: string; items: string[]; icon?: React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div className="mx-4 mb-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon || <User className="h-3.5 w-3.5 text-primary" />}
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-[10px]">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function AllergyWarningBanner({ allergies }: { allergies: string[] }) {
  if (allergies.length === 0) return null;
  return (
    <div className="mx-4 mb-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <FileWarning className="h-3.5 w-3.5 text-destructive" />
        <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Known Allergies</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {allergies.map((a) => (
          <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>
        ))}
      </div>
    </div>
  );
}

// ─── Drug Database ──────────────────────────────────────────────────

interface DrugEntry {
  name: string;
  genericName: string;
  category: string;
  schedule: string;
  route: string[];
  indication: string;
  contraindications: string[];
  sideEffects: string[];
  dosing: string;
  pregnancy: string;
  interactions: string[];
}

const drugDatabase: DrugEntry[] = [
  {
    name: "Metformin", genericName: "Metformin Hydrochloride", category: "Biguanide / Antidiabetic",
    schedule: "Prescription", route: ["Oral"],
    indication: "Type 2 diabetes mellitus; first-line agent for glycaemic control",
    contraindications: ["eGFR <30 mL/min", "Metabolic acidosis", "Severe hepatic impairment", "Acute decompensated heart failure"],
    sideEffects: ["Nausea", "Diarrhoea", "Abdominal pain", "Lactic acidosis (rare)", "Vitamin B12 deficiency"],
    dosing: "500 mg BD initially, titrate to max 1000 mg BD. Take with meals.",
    pregnancy: "Category B — Generally considered safe",
    interactions: ["Contrast dye (withhold 48h)", "Alcohol (lactic acidosis risk)", "Carbonic anhydrase inhibitors"],
  },
  {
    name: "Amlodipine", genericName: "Amlodipine Besylate", category: "Calcium Channel Blocker",
    schedule: "Prescription", route: ["Oral"],
    indication: "Hypertension, chronic stable angina, vasospastic angina",
    contraindications: ["Severe aortic stenosis", "Cardiogenic shock", "Unstable angina"],
    sideEffects: ["Peripheral oedema", "Dizziness", "Flushing", "Palpitations", "Fatigue"],
    dosing: "5 mg OD initially, max 10 mg OD",
    pregnancy: "Category C — Use only if benefit outweighs risk",
    interactions: ["Simvastatin (max 20 mg)", "CYP3A4 inhibitors", "Cyclosporine"],
  },
  {
    name: "Amoxicillin", genericName: "Amoxicillin Trihydrate", category: "Penicillin Antibiotic",
    schedule: "Prescription", route: ["Oral"],
    indication: "Bacterial infections: otitis media, pneumonia, UTI, H. pylori",
    contraindications: ["Penicillin allergy", "History of amoxicillin-associated cholestatic jaundice"],
    sideEffects: ["Rash", "Diarrhoea", "Nausea", "Candidiasis", "Anaphylaxis (rare)"],
    dosing: "250–500 mg TDS or 500–875 mg BD for 5–10 days",
    pregnancy: "Category B — Generally safe",
    interactions: ["Methotrexate (increased toxicity)", "Warfarin (increased INR)", "Oral contraceptives (reduced efficacy)"],
  },
  {
    name: "Enalapril", genericName: "Enalapril Maleate", category: "ACE Inhibitor",
    schedule: "Prescription", route: ["Oral"],
    indication: "Hypertension, heart failure, diabetic nephropathy",
    contraindications: ["Angioedema history", "Bilateral renal artery stenosis", "Pregnancy"],
    sideEffects: ["Dry cough", "Hyperkalaemia", "Dizziness", "Angioedema", "Acute kidney injury"],
    dosing: "5 mg OD initially, titrate to 20 mg BD max",
    pregnancy: "Category D — Contraindicated",
    interactions: ["Potassium-sparing diuretics", "NSAIDs", "Lithium", "Aliskiren"],
  },
  {
    name: "Omeprazole", genericName: "Omeprazole", category: "Proton Pump Inhibitor",
    schedule: "Prescription / OTC", route: ["Oral"],
    indication: "GORD, peptic ulcer disease, H. pylori eradication, ZES",
    contraindications: ["Hypersensitivity to PPIs", "Co-administration with rilpivirine"],
    sideEffects: ["Headache", "Abdominal pain", "Diarrhoea", "Hypomagnesaemia (long-term)", "C. difficile risk"],
    dosing: "20 mg OD for 4–8 weeks. Maintenance: 10–20 mg OD",
    pregnancy: "Category C — Use with caution",
    interactions: ["Clopidogrel (reduced activation)", "Methotrexate", "Diazepam", "Phenytoin"],
  },
  {
    name: "Paracetamol", genericName: "Acetaminophen", category: "Analgesic / Antipyretic",
    schedule: "OTC", route: ["Oral", "IV", "Rectal"],
    indication: "Mild-moderate pain, fever",
    contraindications: ["Severe hepatic impairment", "Active liver disease"],
    sideEffects: ["Hepatotoxicity (overdose)", "Rash (rare)", "Blood dyscrasias (rare)"],
    dosing: "500–1000 mg every 4–6h. Max 4 g/day (2 g in liver disease)",
    pregnancy: "Generally considered safe at recommended doses",
    interactions: ["Warfarin (increased INR with regular use)", "Carbamazepine", "Alcohol"],
  },
  {
    name: "Hydrochlorothiazide", genericName: "Hydrochlorothiazide", category: "Thiazide Diuretic",
    schedule: "Prescription", route: ["Oral"],
    indication: "Hypertension, oedema, heart failure",
    contraindications: ["Anuria", "Severe renal impairment", "Hypokalaemia", "Hyponatraemia"],
    sideEffects: ["Hypokalaemia", "Hyperuricaemia", "Hyperglycaemia", "Photosensitivity", "Orthostatic hypotension"],
    dosing: "12.5–25 mg OD",
    pregnancy: "Category B — Use with caution",
    interactions: ["Lithium", "Digoxin", "NSAIDs", "Corticosteroids"],
  },
  {
    name: "Salbutamol", genericName: "Salbutamol Sulphate", category: "Short-acting β2-agonist (SABA)",
    schedule: "Prescription", route: ["Inhaled", "Oral", "IV"],
    indication: "Acute bronchospasm, asthma, COPD exacerbation",
    contraindications: ["Hypersensitivity"],
    sideEffects: ["Tremor", "Tachycardia", "Hypokalaemia", "Headache", "Palpitations"],
    dosing: "Inhaler: 100–200 mcg PRN. Nebuliser: 2.5–5 mg PRN",
    pregnancy: "Category C — Use if benefit outweighs risk",
    interactions: ["Beta-blockers (antagonism)", "Diuretics (hypokalaemia)", "MAOIs"],
  },
];

// ─── Interaction Checker Severity ───────────────────────────────────

interface InteractionResult {
  drug1: string;
  drug2: string;
  severity: "contraindicated" | "serious" | "significant" | "monitor" | "minor";
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

const severityConfig = {
  contraindicated: { label: "Contraindicated", color: "bg-red-600 text-white", icon: AlertTriangle, description: "Risk outweighs benefit" },
  serious: { label: "Serious — Use Alternative", color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, description: "Avoid or use alternate drug" },
  significant: { label: "Significant — Monitor Closely", color: "bg-warning text-warning-foreground", icon: AlertCircle, description: "May require dose modification" },
  monitor: { label: "Monitor Closely", color: "bg-amber-100 text-amber-800", icon: Eye, description: "Monitor for adverse effects" },
  minor: { label: "Minor", color: "bg-muted text-muted-foreground", icon: Info, description: "Minimal clinical significance" },
};

const knownInteractions: InteractionResult[] = [
  { drug1: "Metformin", drug2: "Enalapril", severity: "monitor", mechanism: "ACE inhibitors may enhance hypoglycaemic effect", clinicalEffect: "Increased risk of hypoglycaemia", recommendation: "Monitor blood glucose more frequently when initiating or adjusting ACE inhibitor" },
  { drug1: "Enalapril", drug2: "Hydrochlorothiazide", severity: "significant", mechanism: "Additive hypotensive effect; risk of first-dose hypotension", clinicalEffect: "Excessive blood pressure reduction, dizziness, syncope", recommendation: "Start with low dose of one agent. Monitor BP closely. Consider withholding diuretic 2–3 days before starting ACE inhibitor" },
  { drug1: "Amoxicillin", drug2: "Metformin", severity: "minor", mechanism: "No significant pharmacokinetic interaction", clinicalEffect: "Minimal — may alter GI absorption slightly", recommendation: "No dose adjustment necessary. Monitor as usual" },
  { drug1: "Omeprazole", drug2: "Metformin", severity: "monitor", mechanism: "PPI-induced vitamin B12 malabsorption may compound metformin effect", clinicalEffect: "Increased risk of B12 deficiency with long-term co-use", recommendation: "Check B12 levels annually in patients on both long-term" },
  { drug1: "Salbutamol", drug2: "Hydrochlorothiazide", severity: "significant", mechanism: "Both agents can cause hypokalaemia", clinicalEffect: "Additive potassium-lowering effect; risk of arrhythmias", recommendation: "Monitor serum potassium. Consider potassium supplementation" },
  { drug1: "Metformin", drug2: "Hydrochlorothiazide", severity: "monitor", mechanism: "Thiazides may impair glucose tolerance", clinicalEffect: "Hydrochlorothiazide may reduce metformin efficacy; hyperglycaemia risk", recommendation: "Monitor HbA1c and fasting glucose. May need metformin dose adjustment" },
  { drug1: "Amlodipine", drug2: "Hydrochlorothiazide", severity: "monitor", mechanism: "Additive antihypertensive effect", clinicalEffect: "Enhanced blood pressure lowering; risk of hypotension", recommendation: "Monitor BP regularly. Common and generally well-tolerated combination" },
];

// ─── Medical Calculators ────────────────────────────────────────────

interface CalculatorDef {
  id: string;
  name: string;
  description: string;
  category: string;
  cadreFilter?: string[]; // if set, only these cadre groups see it
  fields: { label: string; unit: string; min?: number; max?: number; options?: string[]; autoFillKey?: string }[];
  calculate: (values: Record<string, number | string>) => { result: string; interpretation: string; color: string };
}

const calculators: CalculatorDef[] = [
  {
    id: "bmi", name: "BMI Calculator", description: "Body Mass Index with WHO classification", category: "General",
    fields: [
      { label: "Weight", unit: "kg", min: 1, max: 500, autoFillKey: "weight" },
      { label: "Height", unit: "cm", min: 30, max: 300, autoFillKey: "height" },
    ],
    calculate: (v) => {
      const w = Number(v["Weight"]) || 0;
      const h = (Number(v["Height"]) || 1) / 100;
      const bmi = w / (h * h);
      let interp = "Normal weight"; let color = "text-emerald-600";
      if (bmi < 18.5) { interp = "Underweight"; color = "text-amber-600"; }
      else if (bmi >= 25 && bmi < 30) { interp = "Overweight"; color = "text-amber-600"; }
      else if (bmi >= 30 && bmi < 35) { interp = "Obesity Class I"; color = "text-destructive"; }
      else if (bmi >= 35 && bmi < 40) { interp = "Obesity Class II"; color = "text-destructive"; }
      else if (bmi >= 40) { interp = "Obesity Class III (Morbid)"; color = "text-destructive"; }
      return { result: bmi.toFixed(1) + " kg/m²", interpretation: interp, color };
    },
  },
  {
    id: "egfr", name: "eGFR (CKD-EPI)", description: "Estimated glomerular filtration rate", category: "Renal",
    cadreFilter: ["comprehensive", "focused"],
    fields: [
      { label: "Serum Creatinine", unit: "mg/dL", min: 0.1, max: 30, autoFillKey: "serumCreatinine" },
      { label: "Age", unit: "years", min: 18, max: 120, autoFillKey: "age" },
      { label: "Sex", unit: "", options: ["Female", "Male"], autoFillKey: "sex" },
    ],
    calculate: (v) => {
      const cr = Number(v["Serum Creatinine"]) || 1;
      const age = Number(v["Age"]) || 40;
      const female = v["Sex"] === "Female";
      const k = female ? 0.7 : 0.9;
      const a = female ? -0.241 : -0.302;
      const s = female ? 1.012 : 1.0;
      const egfr = 142 * Math.pow(Math.min(cr / k, 1), a) * Math.pow(Math.max(cr / k, 1), -1.200) * Math.pow(0.9938, age) * s;
      let interp = "G1 — Normal (≥90)"; let color = "text-emerald-600";
      if (egfr < 15) { interp = "G5 — Kidney Failure (<15)"; color = "text-destructive"; }
      else if (egfr < 30) { interp = "G4 — Severely Decreased (15–29)"; color = "text-destructive"; }
      else if (egfr < 45) { interp = "G3b — Moderately to Severely Decreased (30–44)"; color = "text-amber-600"; }
      else if (egfr < 60) { interp = "G3a — Mildly to Moderately Decreased (45–59)"; color = "text-amber-600"; }
      else if (egfr < 90) { interp = "G2 — Mildly Decreased (60–89)"; color = "text-primary"; }
      return { result: Math.round(egfr) + " mL/min/1.73m²", interpretation: interp, color };
    },
  },
  {
    id: "wells-dvt", name: "Wells Score — DVT", description: "Clinical prediction rule for deep vein thrombosis", category: "Haematology",
    cadreFilter: ["comprehensive"],
    fields: [
      { label: "Active cancer", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Paralysis/immobilisation of lower limb", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Bedridden >3 days / surgery within 12 weeks", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Tenderness along deep venous system", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Entire leg swollen", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Calf swelling >3 cm vs other leg", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Pitting oedema in symptomatic leg", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Collateral superficial veins", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Alternative diagnosis as likely as DVT", unit: "pts", options: ["No (0)", "Yes (-2)"] },
    ],
    calculate: (v) => {
      let score = 0;
      Object.values(v).forEach((val) => { if (String(val).includes("+1")) score += 1; if (String(val).includes("-2")) score -= 2; });
      let interp = "Low probability (score <1) — DVT unlikely, consider D-dimer"; let color = "text-emerald-600";
      if (score >= 3) { interp = "High probability (≥3) — Imaging recommended"; color = "text-destructive"; }
      else if (score >= 1) { interp = "Moderate probability (1–2) — Consider D-dimer + imaging"; color = "text-amber-600"; }
      return { result: score + " points", interpretation: interp, color };
    },
  },
  {
    id: "chadsvasc", name: "CHA₂DS₂-VASc", description: "Stroke risk in atrial fibrillation", category: "Cardiology",
    cadreFilter: ["comprehensive"],
    fields: [
      { label: "Congestive heart failure", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Hypertension", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Age ≥75", unit: "pts", options: ["No (0)", "Yes (+2)"] },
      { label: "Diabetes mellitus", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Stroke/TIA/thromboembolism", unit: "pts", options: ["No (0)", "Yes (+2)"] },
      { label: "Vascular disease", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Age 65–74", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Sex category (female)", unit: "pts", options: ["Male (0)", "Female (+1)"] },
    ],
    calculate: (v) => {
      let score = 0;
      Object.values(v).forEach((val) => { const match = String(val).match(/\+(\d)/); if (match) score += parseInt(match[1]); });
      let interp = "Score 0 — Low risk, anticoagulation not recommended"; let color = "text-emerald-600";
      if (score >= 2) { interp = `Score ${score} — High risk, oral anticoagulation recommended`; color = "text-destructive"; }
      else if (score === 1) { interp = "Score 1 — Moderate risk, consider anticoagulation"; color = "text-amber-600"; }
      return { result: score + " points", interpretation: interp, color };
    },
  },
  {
    id: "qsofa", name: "qSOFA Score", description: "Quick sepsis-related organ failure assessment", category: "Critical Care",
    fields: [
      { label: "Respiratory rate ≥22/min", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Altered mentation (GCS <15)", unit: "pts", options: ["No (0)", "Yes (+1)"] },
      { label: "Systolic BP ≤100 mmHg", unit: "pts", options: ["No (0)", "Yes (+1)"] },
    ],
    calculate: (v) => {
      let score = 0;
      Object.values(v).forEach((val) => { if (String(val).includes("+1")) score += 1; });
      let interp = "qSOFA 0–1 — Low risk of poor outcome"; let color = "text-emerald-600";
      if (score >= 2) { interp = `qSOFA ${score} — High risk, assess for organ dysfunction, consider ICU`; color = "text-destructive"; }
      return { result: score + "/3", interpretation: interp, color };
    },
  },
  {
    id: "apgar", name: "APGAR Score", description: "Neonatal assessment at 1 and 5 minutes", category: "Obstetrics",
    cadreFilter: ["comprehensive", "focused"],
    fields: [
      { label: "Appearance (skin colour)", unit: "pts", options: ["Blue/pale (0)", "Body pink, extremities blue (+1)", "Completely pink (+2)"] },
      { label: "Pulse (heart rate)", unit: "pts", options: ["Absent (0)", "<100 bpm (+1)", "≥100 bpm (+2)"] },
      { label: "Grimace (reflex irritability)", unit: "pts", options: ["No response (0)", "Grimace (+1)", "Cry/active withdrawal (+2)"] },
      { label: "Activity (muscle tone)", unit: "pts", options: ["Limp (0)", "Some flexion (+1)", "Active motion (+2)"] },
      { label: "Respiration", unit: "pts", options: ["Absent (0)", "Weak/irregular (+1)", "Strong cry (+2)"] },
    ],
    calculate: (v) => {
      let score = 0;
      Object.values(v).forEach((val) => { const match = String(val).match(/\+(\d)/); if (match) score += parseInt(match[1]); });
      let interp = "7–10: Normal — routine care"; let color = "text-emerald-600";
      if (score <= 3) { interp = `${score}/10: Critically low — immediate resuscitation needed`; color = "text-destructive"; }
      else if (score <= 6) { interp = `${score}/10: Moderately depressed — stimulation and possible intervention`; color = "text-amber-600"; }
      return { result: score + "/10", interpretation: interp, color };
    },
  },
];

// ─── Conditions Database ────────────────────────────────────────────

interface ConditionCategory {
  name: string;
  conditions: { name: string; icd10: string; description: string }[];
}

const conditionCategories: ConditionCategory[] = [
  {
    name: "Cardiovascular",
    conditions: [
      { name: "Hypertension", icd10: "I10", description: "Essential (primary) hypertension" },
      { name: "Acute Coronary Syndrome", icd10: "I21", description: "STEMI, NSTEMI, unstable angina" },
      { name: "Heart Failure", icd10: "I50", description: "Congestive heart failure" },
      { name: "Atrial Fibrillation", icd10: "I48", description: "Paroxysmal, persistent, permanent AF" },
      { name: "Deep Vein Thrombosis", icd10: "I82", description: "Venous thromboembolism of deep veins" },
    ],
  },
  {
    name: "Respiratory",
    conditions: [
      { name: "Community-Acquired Pneumonia", icd10: "J18", description: "Bacterial pneumonia, unspecified" },
      { name: "Asthma", icd10: "J45", description: "Chronic airway inflammation" },
      { name: "COPD", icd10: "J44", description: "Chronic obstructive pulmonary disease" },
      { name: "Pulmonary Embolism", icd10: "I26", description: "Acute PE with or without cor pulmonale" },
      { name: "Tuberculosis", icd10: "A15", description: "Respiratory TB, bacteriologically confirmed" },
    ],
  },
  {
    name: "Endocrine",
    conditions: [
      { name: "Type 2 Diabetes Mellitus", icd10: "E11", description: "Non-insulin-dependent diabetes" },
      { name: "Type 1 Diabetes Mellitus", icd10: "E10", description: "Insulin-dependent diabetes" },
      { name: "Hypothyroidism", icd10: "E03", description: "Unspecified hypothyroidism" },
      { name: "Diabetic Ketoacidosis", icd10: "E10.1", description: "Acute metabolic emergency in diabetes" },
    ],
  },
  {
    name: "Infectious Disease",
    conditions: [
      { name: "HIV/AIDS", icd10: "B20", description: "Human immunodeficiency virus disease" },
      { name: "Malaria", icd10: "B50-54", description: "Plasmodium infection" },
      { name: "Sepsis", icd10: "A41", description: "Systemic inflammatory response to infection" },
      { name: "Meningitis", icd10: "G03", description: "Bacterial/viral meningitis" },
    ],
  },
  {
    name: "Gastroenterology",
    conditions: [
      { name: "Peptic Ulcer Disease", icd10: "K27", description: "Gastric and duodenal ulceration" },
      { name: "Acute Cholecystitis", icd10: "K81.0", description: "Inflammation of the gallbladder" },
      { name: "Acute Appendicitis", icd10: "K35", description: "Acute inflammation of the appendix" },
      { name: "Cirrhosis of Liver", icd10: "K74", description: "Fibrosis and cirrhosis of liver" },
    ],
  },
  {
    name: "Neurology",
    conditions: [
      { name: "Ischaemic Stroke", icd10: "I63", description: "Cerebral infarction" },
      { name: "Epilepsy", icd10: "G40", description: "Recurrent seizure disorder" },
      { name: "Migraine", icd10: "G43", description: "Paroxysmal headache disorder" },
    ],
  },
  {
    name: "Obstetrics & Gynaecology",
    conditions: [
      { name: "Pre-eclampsia", icd10: "O14", description: "Gestational hypertension with proteinuria" },
      { name: "Postpartum Haemorrhage", icd10: "O72", description: "Excessive bleeding after delivery" },
      { name: "Ectopic Pregnancy", icd10: "O00", description: "Pregnancy outside uterine cavity" },
    ],
  },
  {
    name: "Musculoskeletal",
    conditions: [
      { name: "Osteoarthritis", icd10: "M15-19", description: "Degenerative joint disease" },
      { name: "Rheumatoid Arthritis", icd10: "M05-06", description: "Chronic inflammatory polyarthritis" },
      { name: "Gout", icd10: "M10", description: "Crystal arthropathy due to urate deposition" },
    ],
  },
];

// ─── Main Exported Components ───────────────────────────────────────

export function DrugDatabaseSheet() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugEntry | null>(null);
  const { patient, currentMedications } = usePatientContext();

  const filtered = drugDatabase.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Flag drugs that conflict with patient allergies
  const hasAllergyConflict = (drug: DrugEntry) => {
    if (!patient?.allergies) return false;
    const allergies = patient.allergies.map(a => a.toLowerCase());
    // Check if drug category or name relates to an allergy
    if (allergies.includes("penicillin") && drug.category.toLowerCase().includes("penicillin")) return true;
    if (allergies.includes("sulfa drugs") && drug.name.toLowerCase().includes("sulfa")) return true;
    return drug.contraindications.some(c => allergies.some(a => c.toLowerCase().includes(a)));
  };

  const isCurrentMed = (drug: DrugEntry) => currentMedications.includes(drug.name);

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs shrink-0 ${open ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(true)}>
        <Pill className="w-3.5 h-3.5" />
        Drugs
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[650px] sm:max-w-[650px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 bg-primary/10 rounded-md"><Pill className="w-4 h-4 text-primary" /></div>
              Drugs, OTCs & Herbals
            </SheetTitle>
          </SheetHeader>

          {patient && (
            <div className="mt-2">
              <AllergyWarningBanner allergies={patient.allergies || []} />
              <PatientContextBanner label={`${patient.name} — Current Medications`} items={currentMedications} icon={<Pill className="h-3.5 w-3.5 text-primary" />} />
            </div>
          )}

          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search drugs, conditions, topics and more..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedDrug(null); }} className="pl-9" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {selectedDrug ? (
              <DrugMonograph drug={selectedDrug} onBack={() => setSelectedDrug(null)} isCurrentMed={isCurrentMed(selectedDrug)} hasAllergyConflict={hasAllergyConflict(selectedDrug)} />
            ) : (
              <div className="p-2">
                {filtered.map((drug) => (
                  <button key={drug.name} onClick={() => setSelectedDrug(drug)} className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted/80 transition-colors text-left">
                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", hasAllergyConflict(drug) ? "bg-destructive/10" : "bg-primary/10")}>
                      <Pill className={cn("h-4 w-4", hasAllergyConflict(drug) ? "text-destructive" : "text-primary")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{drug.name}</p>
                        {isCurrentMed(drug) && <Badge className="text-[9px] h-4 bg-emerald-100 text-emerald-700 border-0">Active Rx</Badge>}
                        {hasAllergyConflict(drug) && <Badge variant="destructive" className="text-[9px] h-4">Allergy</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{drug.genericName} — {drug.category}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{drug.schedule}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center">
                    <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">No drugs found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DrugMonograph({ drug, onBack, isCurrentMed, hasAllergyConflict }: { drug: DrugEntry; onBack: () => void; isCurrentMed: boolean; hasAllergyConflict: boolean }) {
  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs -ml-2">← Back to results</Button>

      {hasAllergyConflict && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Allergy Alert</p>
            <p className="text-xs text-destructive/80">This patient has a known allergy that may conflict with this medication. Review before prescribing.</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{drug.name}</h2>
          {isCurrentMed && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Patient is on this medication</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{drug.genericName}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{drug.category}</Badge>
          <Badge variant="outline">{drug.schedule}</Badge>
          {drug.route.map((r) => (<Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>))}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="dosing" className="text-xs">Dosing</TabsTrigger>
          <TabsTrigger value="safety" className="text-xs">Safety</TabsTrigger>
          <TabsTrigger value="interactions" className="text-xs">Interactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3 mt-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Indication</CardTitle></CardHeader><CardContent><p className="text-sm">{drug.indication}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pregnancy</CardTitle></CardHeader><CardContent><p className="text-sm">{drug.pregnancy}</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="dosing" className="mt-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dosing</CardTitle></CardHeader><CardContent><p className="text-sm">{drug.dosing}</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="safety" className="space-y-3 mt-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contraindications</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1">{drug.contraindications.map((c) => (<li key={c} className="text-sm flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />{c}</li>))}</ul></CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Side Effects</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-1.5">{drug.sideEffects.map((s) => (<Badge key={s} variant="secondary" className="text-xs">{s}</Badge>))}</div></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="interactions" className="mt-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Known Interactions</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1.5">{drug.interactions.map((i) => (<li key={i} className="text-sm flex items-start gap-2"><AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />{i}</li>))}</ul></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Interaction Checker ────────────────────────────────────────────

export function InteractionCheckerSheet() {
  const [open, setOpen] = useState(false);
  const [drugs, setDrugs] = useState<string[]>(["", ""]);
  const [results, setResults] = useState<InteractionResult[]>([]);
  const [checked, setChecked] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const { patient, currentMedications } = usePatientContext();

  const loadPatientMeds = () => {
    if (currentMedications.length > 0) {
      setDrugs([...currentMedications, ""]);
      setAutoLoaded(true);
      setChecked(false);
      setResults([]);
      toast.success(`Loaded ${currentMedications.length} active medications for ${patient?.name}`);
    }
  };

  const addDrug = () => setDrugs((d) => [...d, ""]);
  const removeDrug = (idx: number) => setDrugs((d) => d.filter((_, i) => i !== idx));
  const updateDrug = (idx: number, val: string) => { setDrugs((d) => d.map((v, i) => (i === idx ? val : v))); setChecked(false); };

  const checkInteractions = () => {
    const drugNames = drugs.filter((d) => d.trim());
    const found: InteractionResult[] = [];
    for (let i = 0; i < drugNames.length; i++) {
      for (let j = i + 1; j < drugNames.length; j++) {
        const match = knownInteractions.find(
          (ix) =>
            (ix.drug1.toLowerCase() === drugNames[i].toLowerCase() && ix.drug2.toLowerCase() === drugNames[j].toLowerCase()) ||
            (ix.drug1.toLowerCase() === drugNames[j].toLowerCase() && ix.drug2.toLowerCase() === drugNames[i].toLowerCase())
        );
        if (match) found.push(match);
      }
    }
    setResults(found);
    setChecked(true);
  };

  const clearAll = () => { setDrugs(["", ""]); setResults([]); setChecked(false); setAutoLoaded(false); };

  const getSuggestions = (query: string) => {
    if (!query || query.length < 2) return [];
    return drugDatabase.filter((d) => d.name.toLowerCase().startsWith(query.toLowerCase())).map((d) => d.name);
  };

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs shrink-0 ${open ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(true)}>
        <span className="relative flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /></svg>
          Interactions
        </span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-base">Drug Interaction Checker</SheetTitle>
            <p className="text-xs text-muted-foreground">Check interactions against this patient's active medication list</p>
          </SheetHeader>

          {patient && (
            <div className="mt-2">
              <AllergyWarningBanner allergies={patient.allergies || []} />
            </div>
          )}

          <div className="p-4 space-y-2">
            {patient && currentMedications.length > 0 && !autoLoaded && (
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5" onClick={loadPatientMeds}>
                <Sparkles className="h-3.5 w-3.5" />
                Load {patient.name}'s {currentMedications.length} active medications
              </Button>
            )}

            {autoLoaded && (
              <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Loaded from patient's active medication list. Add new drugs to check against them.
              </div>
            )}

            {drugs.map((drug, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder={`Enter medication ${idx + 1}`} value={drug} onChange={(e) => updateDrug(idx, e.target.value)} className="pl-9" list={`drug-suggestions-${idx}`} />
                  <datalist id={`drug-suggestions-${idx}`}>{getSuggestions(drug).map((s) => (<option key={s} value={s} />))}</datalist>
                </div>
                {currentMedications.includes(drug) && <Badge className="text-[9px] h-5 bg-emerald-100 text-emerald-700 border-0 shrink-0">Rx</Badge>}
                {drugs.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDrug(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={addDrug}><Plus className="h-3 w-3 mr-1" /> Add Drug</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={clearAll}>Clear All</Button>
              <div className="flex-1" />
              <Button size="sm" className="text-xs" onClick={checkInteractions} disabled={drugs.filter((d) => d.trim()).length < 2}>Check Interactions</Button>
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            {checked && results.length === 0 && (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3"><Info className="h-6 w-6 text-emerald-600" /></div>
                <p className="font-medium text-sm">No Interactions Found</p>
                <p className="text-xs text-muted-foreground mt-1">No known interactions between the entered medications</p>
              </div>
            )}
            {results.length > 0 && (
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{results.length} Interaction{results.length > 1 ? "s" : ""} Found</p>
                {results.map((r, idx) => {
                  const config = severityConfig[r.severity];
                  const Icon = config.icon;
                  return (
                    <Card key={idx}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2"><Badge className={cn("text-xs", config.color)}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge></div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Badge variant="outline">{r.drug1}</Badge><span className="text-muted-foreground">+</span><Badge variant="outline">{r.drug2}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-xs font-medium text-muted-foreground">Mechanism: </span><span>{r.mechanism}</span></div>
                          <div><span className="text-xs font-medium text-muted-foreground">Clinical Effect: </span><span>{r.clinicalEffect}</span></div>
                          <div className="bg-muted/50 rounded-md p-2.5"><span className="text-xs font-semibold">Recommendation: </span><span className="text-xs">{r.recommendation}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {!checked && (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /></svg>
                <p className="text-sm text-muted-foreground">{patient ? "Load patient's medications or enter drugs manually" : "Enter two or more medications and click \"Check Interactions\""}</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Calculators ────────────────────────────────────────────────────

export function CalculatorsSheet({ complexity }: { complexity?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedCalc, setSelectedCalc] = useState<CalculatorDef | null>(null);

  // Filter calculators based on cadre complexity
  const filteredCalcs = useMemo(() => {
    if (!complexity) return calculators;
    return calculators.filter(c => !c.cadreFilter || c.cadreFilter.includes(complexity));
  }, [complexity]);

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs shrink-0 ${open ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(true)}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
        Calculators
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[550px] sm:max-w-[550px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-base">Medical Calculators</SheetTitle>
            <p className="text-xs text-muted-foreground">Pre-filled from patient vitals where available</p>
          </SheetHeader>
          <Separator className="mt-3" />
          <ScrollArea className="flex-1">
            {selectedCalc ? (
              <CalculatorView calc={selectedCalc} onBack={() => setSelectedCalc(null)} />
            ) : (
              <div className="p-2">
                {(() => {
                  const categories = [...new Set(filteredCalcs.map((c) => c.category))];
                  return categories.map((cat) => (
                    <div key={cat} className="mb-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">{cat}</p>
                      {filteredCalcs.filter((c) => c.category === cat).map((calc) => (
                        <button key={calc.id} onClick={() => setSelectedCalc(calc)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/80 transition-colors text-left">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{calc.name}</p>
                            <p className="text-xs text-muted-foreground">{calc.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CalculatorView({ calc, onBack }: { calc: CalculatorDef; onBack: () => void }) {
  const { patient, age, recentVitals } = usePatientContext();

  // Auto-fill values from patient context
  const initialValues = useMemo(() => {
    const vals: Record<string, string> = {};
    if (!patient || !recentVitals) return vals;
    for (const field of calc.fields) {
      if (!field.autoFillKey) continue;
      switch (field.autoFillKey) {
        case "weight": vals[field.label] = String(recentVitals.weight); break;
        case "height": vals[field.label] = String(recentVitals.height); break;
        case "serumCreatinine": vals[field.label] = String(recentVitals.serumCreatinine); break;
        case "age": if (age) vals[field.label] = String(age); break;
        case "sex": vals[field.label] = patient.gender === "female" ? "Female" : "Male"; break;
      }
    }
    return vals;
  }, [patient, age, recentVitals, calc]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [result, setResult] = useState<{ result: string; interpretation: string; color: string } | null>(null);

  const hasAutoFilled = Object.keys(initialValues).length > 0;

  const handleCalculate = () => {
    const res = calc.calculate(values);
    setResult(res);
  };

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs -ml-2">← All Calculators</Button>

      <div>
        <h3 className="text-base font-bold">{calc.name}</h3>
        <p className="text-sm text-muted-foreground">{calc.description}</p>
      </div>

      {hasAutoFilled && patient && (
        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary">Pre-filled from {patient.name}'s vitals and demographics. Verify before calculating.</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          {calc.fields.map((field) => (
            <div key={field.label} className="flex items-center gap-3">
              <label className="text-sm font-medium w-48 shrink-0">{field.label}</label>
              {field.options ? (
                <select className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={values[field.label] || ""} onChange={(e) => setValues((p) => ({ ...p, [field.label]: e.target.value }))}>
                  <option value="">Select...</option>
                  {field.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Input type="number" placeholder="0" value={values[field.label] || ""} onChange={(e) => setValues((p) => ({ ...p, [field.label]: e.target.value }))} min={field.min} max={field.max} className={initialValues[field.label] ? "border-primary/30 bg-primary/5" : ""} />
                    {initialValues[field.label] && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-primary font-medium">Auto</span>}
                  </div>
                  {field.unit && <span className="text-xs text-muted-foreground w-14 shrink-0">{field.unit}</span>}
                </div>
              )}
            </div>
          ))}
          <Button className="w-full" onClick={handleCalculate}>Calculate</Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{result.result}</p>
            <p className={cn("text-sm font-medium mt-2", result.color)}>{result.interpretation}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center">Clinical calculators are for decision support only. Always verify with clinical judgment.</p>
    </div>
  );
}

// ─── Conditions Browser ─────────────────────────────────────────────

export function ConditionsBrowserSheet() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const { activeConditions } = usePatientContext();

  const allConditions = conditionCategories.flatMap((c) => c.conditions.map((cond) => ({ ...cond, categoryName: c.name })));
  const filtered = searchQuery ? allConditions.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.icd10.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  const isActiveCondition = (icd10: string) => activeConditions.some(ac => ac.icd10 === icd10);

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs shrink-0 ${open ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(true)}>
        <Stethoscope className="w-3.5 h-3.5" />
        Conditions
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[550px] sm:max-w-[550px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-base">Diseases & Conditions</SheetTitle>
            <p className="text-xs text-muted-foreground">Browse clinical conditions, ICD-10 codes & management</p>
          </SheetHeader>

          {activeConditions.length > 0 && (
            <div className="mt-2">
              <PatientContextBanner label="Patient's Active Conditions" items={activeConditions.map(c => `${c.name} (${c.icd10})`)} icon={<Stethoscope className="h-3.5 w-3.5 text-primary" />} />
            </div>
          )}

          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conditions, ICD codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {searchQuery ? (
              <div className="p-2">
                {filtered.map((c) => (
                  <button key={c.name + c.icd10} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/80 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{c.name}</p>
                        <Badge variant="outline" className="text-[10px]">{c.icd10}</Badge>
                        {isActiveCondition(c.icd10) && <Badge className="text-[9px] h-4 bg-amber-100 text-amber-700 border-0">Active Dx</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{c.categoryName}</Badge>
                  </button>
                ))}
                {filtered.length === 0 && (<div className="p-8 text-center"><p className="text-sm text-muted-foreground">No conditions match your search</p></div>)}
              </div>
            ) : (
              <div className="p-2">
                {conditionCategories.map((cat) => (
                  <div key={cat.name} className="mb-1">
                    <button onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/80 text-left">
                      <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /><span className="text-sm font-medium">{cat.name}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{cat.conditions.length} conditions</span>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedCat === cat.name && "rotate-90")} />
                      </div>
                    </button>
                    {expandedCat === cat.name && (
                      <div className="ml-6 border-l pl-3 space-y-0.5 pb-2">
                        {cat.conditions.map((cond) => (
                          <button key={cond.name} className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60 text-left">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium">{cond.name}</p>
                                {isActiveCondition(cond.icd10) && <Badge className="text-[8px] h-3.5 bg-amber-100 text-amber-700 border-0">Active</Badge>}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{cond.description}</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] shrink-0">{cond.icd10}</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Formulary ──────────────────────────────────────────────────────

export function FormularySheet() {
  const [open, setOpen] = useState(false);

  const formularyItems = [
    { name: "Essential Medicines List", category: "National", items: 423, lastUpdated: "2025" },
    { name: "Facility Formulary", category: "Local", items: 187, lastUpdated: "Current" },
    { name: "Restricted Medicines", category: "Controlled", items: 34, lastUpdated: "2025" },
    { name: "Antimicrobial Formulary", category: "Stewardship", items: 56, lastUpdated: "2025" },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs shrink-0 ${open ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(true)}>
        <ClipboardList className="w-3.5 h-3.5" />
        Formulary
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-base">Formulary</SheetTitle>
            <p className="text-xs text-muted-foreground">Essential medicines lists and facility formulary</p>
          </SheetHeader>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search formulary..." className="pl-9" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {formularyItems.map((item) => (
                <Card key={item.name} className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ClipboardList className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.items} medicines · Updated {item.lastUpdated}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
