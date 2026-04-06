/**
 * Cadre-Adaptive History Form
 * 
 * Doctor/Specialist: Full SOCRATES HPI, coded ICD-10 PMH, surgical, family, social, obs/gyn, drug/allergy
 * Nurse/Midwife: Focused assessment, danger signs, ANC checklists, simplified drug/allergy
 * CHW: Danger sign screening, symptom checklist, refer-or-reassure
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, FileText, Pill, Users, Heart, Baby,
  Plus, CheckCircle2, Search, X, ShieldAlert, ArrowRight,
  Brain, Stethoscope, ClipboardCheck,
} from "lucide-react";
import { type CadreFormConfig } from "@/hooks/useCadreFormConfig";

// ── ICD-10 Coded Conditions ─────────────────────────
const ICD10_CONDITIONS = [
  { code: "E11", display: "Type 2 Diabetes Mellitus" },
  { code: "I10", display: "Essential Hypertension" },
  { code: "J45", display: "Asthma" },
  { code: "B20", display: "HIV Disease" },
  { code: "A15", display: "Respiratory Tuberculosis" },
  { code: "E78", display: "Dyslipidaemia" },
  { code: "N18", display: "Chronic Kidney Disease" },
  { code: "I25", display: "Chronic Ischaemic Heart Disease" },
  { code: "J44", display: "COPD" },
  { code: "K21", display: "GORD" },
  { code: "M06", display: "Rheumatoid Arthritis" },
  { code: "G40", display: "Epilepsy" },
  { code: "F32", display: "Major Depressive Disorder" },
  { code: "E05", display: "Thyrotoxicosis" },
  { code: "D50", display: "Iron Deficiency Anaemia" },
  { code: "I48", display: "Atrial Fibrillation" },
  { code: "I50", display: "Heart Failure" },
  { code: "E10", display: "Type 1 Diabetes Mellitus" },
  { code: "K70", display: "Alcoholic Liver Disease" },
  { code: "N40", display: "Benign Prostatic Hyperplasia" },
];

// ── Danger Signs (CHW/Nurse) ─────────────────────────
const DANGER_SIGNS_ADULT = [
  "Unable to drink or eat",
  "Repeated vomiting",
  "Convulsions / seizures",
  "Difficulty breathing",
  "Altered consciousness / confusion",
  "High fever (>39°C)",
  "Severe dehydration",
  "Chest pain at rest",
  "Sudden weakness one side",
  "Severe bleeding",
];

const DANGER_SIGNS_CHILD = [
  "Not able to breastfeed / drink",
  "Vomiting everything",
  "Convulsions",
  "Lethargy / unconscious",
  "Chest indrawing",
  "Stridor when calm",
  "Severe malnutrition (visible wasting)",
  "Severe pallor",
  "High fever (>38.5°C)",
  "Bulging fontanelle",
];

const DANGER_SIGNS_MATERNAL = [
  "Vaginal bleeding",
  "Severe headache with blurred vision",
  "Convulsions / fits",
  "Fever with inability to get out of bed",
  "Severe abdominal pain",
  "Fast or difficult breathing",
  "Foul-smelling vaginal discharge",
  "Reduced fetal movements",
  "Water breaking >12hrs without labor",
  "Swollen face/hands (sudden onset)",
];

interface HistoryEntry {
  id: string;
  type: string;
  data: Record<string, string | string[] | boolean>;
  timestamp: Date;
  enteredBy: string;
}

interface CadreHistoryFormProps {
  config: CadreFormConfig;
  onSave?: (entries: HistoryEntry[]) => void;
}

export function CadreHistoryForm({ config, onSave }: CadreHistoryFormProps) {
  const [activeTab, setActiveTab] = useState("hpi");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const addEntry = (type: string, data: Record<string, string | string[] | boolean>) => {
    setEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: new Date(),
      enteredBy: config.cadre,
    }]);
  };

  if (config.complexity === 'simplified') {
    return <CHWHistoryScreen config={config} onAddEntry={addEntry} />;
  }

  if (config.complexity === 'focused') {
    return <NursingHistoryForm config={config} onAddEntry={addEntry} />;
  }

  return <DoctorHistoryForm config={config} onAddEntry={addEntry} isAddingEntry={isAddingEntry} setIsAddingEntry={setIsAddingEntry} />;
}

// ══════════════════════════════════════════════════════
// CHW SIMPLIFIED SCREENING
// ══════════════════════════════════════════════════════
function CHWHistoryScreen({ config, onAddEntry }: { config: CadreFormConfig; onAddEntry: (type: string, data: Record<string, string | string[] | boolean>) => void }) {
  const [checkedSigns, setCheckedSigns] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [decision, setDecision] = useState<'refer' | 'reassure' | null>(null);

  const dangerSigns = config.visitType === 'anc' || config.visitType === 'pnc'
    ? DANGER_SIGNS_MATERNAL
    : config.visitType === 'pediatric'
    ? DANGER_SIGNS_CHILD
    : DANGER_SIGNS_ADULT;

  const symptomChecklist = [
    "Fever", "Cough", "Diarrhoea", "Headache", "Body pain",
    "Rash", "Sore throat", "Ear pain", "Eye problem", "Skin problem",
    "Not eating", "Weight loss", "Swelling", "Wound / injury",
  ];

  const toggleSign = (sign: string) => {
    setCheckedSigns(prev => prev.includes(sign) ? prev.filter(s => s !== sign) : [...prev, sign]);
  };

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const hasDangerSigns = checkedSigns.length > 0;

  return (
    <div className="space-y-4">
      {/* Guidance Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-base">Community Health Worker Screening</p>
              <p className="text-sm text-muted-foreground">{config.labels.guidanceText}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Signs Screening */}
      <Card className={hasDangerSigns ? "border-critical" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className={`w-6 h-6 ${hasDangerSigns ? "text-critical" : "text-warning"}`} />
            Danger Signs Screening
            {hasDangerSigns && (
              <Badge variant="destructive" className="ml-2 text-sm">{checkedSigns.length} PRESENT</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {dangerSigns.map(sign => (
              <button
                key={sign}
                onClick={() => toggleSign(sign)}
                className={`flex items-center gap-3 p-3.5 rounded-lg text-left transition-all text-base font-medium ${
                  checkedSigns.includes(sign)
                    ? "bg-critical/10 border-2 border-critical text-critical"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                }`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  checkedSigns.includes(sign) ? "border-critical bg-critical text-white" : "border-muted-foreground/30"
                }`}>
                  {checkedSigns.includes(sign) && <CheckCircle2 className="w-4 h-4" />}
                </div>
                {sign}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Symptom Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Symptom Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {symptomChecklist.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`flex items-center gap-2 p-3 rounded-lg text-left text-sm font-medium transition-all ${
                  symptoms.includes(s)
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  symptoms.includes(s) ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                }`}>
                  {symptoms.includes(s) && <CheckCircle2 className="w-3 h-3" />}
                </div>
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refer or Reassure Decision */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant={decision === 'refer' ? 'destructive' : 'outline'}
              className="h-20 text-lg font-bold flex-col gap-1"
              onClick={() => setDecision('refer')}
            >
              <ArrowRight className="w-7 h-7" />
              REFER
            </Button>
            <Button
              size="lg"
              variant={decision === 'reassure' ? 'default' : 'outline'}
              className="h-20 text-lg font-bold flex-col gap-1"
              onClick={() => setDecision('reassure')}
            >
              <CheckCircle2 className="w-7 h-7" />
              REASSURE
            </Button>
          </div>
          {hasDangerSigns && decision !== 'refer' && (
            <div className="mt-3 p-3 bg-critical/10 rounded-lg text-critical text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger signs present — referral strongly recommended
            </div>
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full h-14 text-lg font-bold" onClick={() => {
        onAddEntry('chw_screening', { dangerSigns: checkedSigns, symptoms, decision: decision || '' });
      }}>
        {config.labels.saveLabel}
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// NURSE / MIDWIFE FOCUSED ASSESSMENT
// ══════════════════════════════════════════════════════
function NursingHistoryForm({ config, onAddEntry }: { config: CadreFormConfig; onAddEntry: (type: string, data: Record<string, string | string[] | boolean>) => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});

  const update = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleCheck = (group: string, item: string) => {
    setCheckedItems(prev => {
      const current = prev[group] || [];
      return { ...prev, [group]: current.includes(item) ? current.filter(i => i !== item) : [...current, item] };
    });
  };

  const SelectField = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-muted-foreground">{label}</label>
      <select
        value={formData[field] || ''}
        onChange={e => update(field, e.target.value)}
        className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-ring"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const CheckGroup = ({ title, group, items }: { title: string; group: string; items: string[] }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-muted-foreground">{title}</label>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map(item => {
          const checked = (checkedItems[group] || []).includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleCheck(group, item)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-sm transition-all ${
                checked ? "bg-primary/10 border border-primary/30 font-medium" : "bg-muted/30 border border-transparent hover:bg-muted/60"
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                checked ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
              }`}>
                {checked && <CheckCircle2 className="w-3 h-3" />}
              </div>
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Guidance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-base">Nursing Assessment</p>
            <p className="text-sm text-muted-foreground">{config.labels.guidanceText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Presenting Complaint */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Presenting Complaint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SelectField label="Main Complaint" field="chief_complaint" options={[
            "Fever", "Cough", "Diarrhoea", "Abdominal pain", "Chest pain",
            "Headache", "Difficulty breathing", "Injury / trauma", "Skin problem",
            "Pregnancy-related", "Labour pains", "Post-delivery complaint", "Other"
          ]} />
          <SelectField label="Duration" field="duration" options={[
            "<24 hours", "1-3 days", "4-7 days", "1-2 weeks", "2-4 weeks", ">1 month"
          ]} />
          <SelectField label="Severity" field="severity" options={[
            "Mild — able to perform daily activities",
            "Moderate — limited daily activities",
            "Severe — unable to perform daily activities"
          ]} />
        </CardContent>
      </Card>

      {/* Danger Signs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Danger Sign Screen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckGroup title="" group="danger_signs" items={
            config.visitType === 'anc' || config.visitType === 'pnc' 
              ? DANGER_SIGNS_MATERNAL 
              : DANGER_SIGNS_ADULT.slice(0, 6)
          } />
        </CardContent>
      </Card>

      {/* Focused History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Focused History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckGroup title="Known Conditions" group="pmh" items={[
            "Hypertension", "Diabetes", "HIV", "TB", "Asthma/COPD",
            "Heart disease", "Epilepsy", "Mental health condition", "Cancer", "None known"
          ]} />
          <SelectField label="Currently on Medication" field="on_meds" options={["Yes — compliant", "Yes — not compliant", "No", "Unknown"]} />
          <SelectField label="Known Allergies" field="allergies" options={["NKDA", "Penicillin", "Sulfa drugs", "NSAIDs", "Other — specify"]} />
        </CardContent>
      </Card>

      {/* ANC-specific */}
      {config.history.showObsGyn && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="w-5 h-5" />
              Obstetric Quick Screen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {["Gravida", "Para", "Miscarriages", "Living Children"].map(label => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                  <input
                    type="number" min="0" max="20"
                    value={formData[label.toLowerCase()] || ''}
                    onChange={e => update(label.toLowerCase(), e.target.value)}
                    className="w-full h-10 px-3 text-center text-lg font-bold rounded-md border border-input bg-background"
                  />
                </div>
              ))}
            </div>
            <SelectField label="Last Delivery Outcome" field="last_delivery" options={[
              "Normal vaginal delivery", "Assisted delivery", "Caesarean section",
              "Stillbirth", "Miscarriage", "N/A — primigravida"
            ]} />
            <CheckGroup title="Previous Complications" group="obs_complications" items={[
              "Pre-eclampsia", "Eclampsia", "PPH", "Obstructed labour",
              "Preterm delivery", "Neonatal death", "None"
            ]} />
          </CardContent>
        </Card>
      )}

      {/* Social */}
      {config.history.showSocialHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Social Screen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SelectField label="Smoking" field="smoking" options={["Never", "Current", "Ex-smoker"]} />
            <SelectField label="Alcohol" field="alcohol" options={["None", "Social", "Heavy", "Dependent"]} />
            <SelectField label="Support System" field="support" options={["Good support", "Limited support", "No support / isolated"]} />
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full h-12 text-base font-semibold" onClick={() => {
        onAddEntry('nursing_history', { ...formData, ...checkedItems as any });
      }}>
        <CheckCircle2 className="w-5 h-5 mr-2" />
        {config.labels.saveLabel}
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DOCTOR / SPECIALIST COMPREHENSIVE HISTORY
// ══════════════════════════════════════════════════════
function DoctorHistoryForm({ config, onAddEntry, isAddingEntry, setIsAddingEntry }: {
  config: CadreFormConfig;
  onAddEntry: (type: string, data: Record<string, string | string[] | boolean>) => void;
  isAddingEntry: boolean;
  setIsAddingEntry: (v: boolean) => void;
}) {
  const [activeSection, setActiveSection] = useState("hpi");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedConditions, setSelectedConditions] = useState<typeof ICD10_CONDITIONS[number][]>([]);
  const [conditionSearch, setConditionSearch] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});
  const [savedEntries, setSavedEntries] = useState<{ section: string; data: Record<string, string>; time: Date }[]>([]);

  const update = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleCheck = (group: string, item: string) => {
    setCheckedItems(prev => {
      const current = prev[group] || [];
      return { ...prev, [group]: current.includes(item) ? current.filter(i => i !== item) : [...current, item] };
    });
  };

  const filteredConditions = ICD10_CONDITIONS.filter(c =>
    c.display.toLowerCase().includes(conditionSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(conditionSearch.toLowerCase())
  );

  const SelectField = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={formData[field] || ''}
        onChange={e => update(field, e.target.value)}
        className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-ring"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const NumberInput = ({ label, field, unit }: { label: string; field: string; unit?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={formData[field] || ''}
          onChange={e => update(field, e.target.value)}
          className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background tabular-nums"
        />
        {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
      </div>
    </div>
  );

  const saveSection = () => {
    setSavedEntries(prev => [...prev, { section: activeSection, data: { ...formData }, time: new Date() }]);
    onAddEntry(activeSection, formData);
  };

  const sections = [
    { id: "hpi", label: "HPI", icon: FileText },
    { id: "pmh", label: "PMH", icon: Heart },
    ...(config.history.showSurgicalHistory ? [{ id: "psh", label: "Surgical", icon: Stethoscope }] : []),
    ...(config.history.showFamilyHistory ? [{ id: "fhx", label: "Family", icon: Users }] : []),
    ...(config.history.showSocialHistory ? [{ id: "shx", label: "Social", icon: Users }] : []),
    ...(config.history.showObsGyn ? [{ id: "obgyn", label: "Obs/Gyn", icon: Baby }] : []),
    { id: "drugs", label: "Medications", icon: Pill },
    { id: "allergies", label: "Allergies", icon: AlertTriangle },
    ...(config.history.showFullROS ? [{ id: "ros", label: "ROS", icon: ClipboardCheck }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* New Entry Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">ICD-10 / SNOMED CT coded</Badge>
          <Badge variant="secondary" className="text-xs">{savedEntries.length} entries saved</Badge>
        </div>
        <Button onClick={() => setIsAddingEntry(!isAddingEntry)} variant={isAddingEntry ? "secondary" : "default"}>
          {isAddingEntry ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAddingEntry ? "Close" : "New History Entry"}
        </Button>
      </div>

      {isAddingEntry && (
        <>
          {/* Section Navigator */}
          <div className="flex gap-1.5 flex-wrap">
            {sections.map(s => {
              const Icon = s.icon;
              const isSaved = savedEntries.some(e => e.section === s.id);
              return (
                <Button
                  key={s.id}
                  size="sm"
                  variant={activeSection === s.id ? "default" : isSaved ? "secondary" : "outline"}
                  onClick={() => setActiveSection(s.id)}
                  className="gap-1.5"
                >
                  {isSaved ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Icon className="w-4 h-4" />}
                  {s.label}
                </Button>
              );
            })}
          </div>

          {/* HPI - SOCRATES */}
          {activeSection === "hpi" && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">History of Present Illness</CardTitle>
                  <Badge variant="outline" className="text-[10px]">SOCRATES Format</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Site" field="hpi_site" options={[
                    "Head", "Neck", "Chest", "Abdomen", "Back", "Upper limb", "Lower limb",
                    "Generalised", "Pelvic", "Flank", "Epigastric", "Retrosternal"
                  ]} />
                  <SelectField label="Onset" field="hpi_onset" options={[
                    "Sudden (<minutes)", "Acute (<hours)", "Subacute (days)", "Gradual (weeks)", "Chronic (months)"
                  ]} />
                  <SelectField label="Character" field="hpi_character" options={[
                    "Sharp", "Dull", "Burning", "Cramping", "Stabbing", "Throbbing",
                    "Pressure", "Tearing", "Colicky", "Aching"
                  ]} />
                  <SelectField label="Radiation" field="hpi_radiation" options={[
                    "None", "To arm (L)", "To arm (R)", "To back", "To jaw",
                    "To shoulder", "To groin", "To leg", "Diffuse"
                  ]} />
                  <SelectField label="Timing" field="hpi_timing" options={[
                    "Constant", "Intermittent", "Worse at night", "Worse in morning",
                    "Post-prandial", "On exertion", "At rest", "Episodic"
                  ]} />
                  <SelectField label="Severity (0-10)" field="hpi_severity" options={
                    Array.from({ length: 11 }, (_, i) => `${i}/10 — ${i <= 3 ? 'Mild' : i <= 6 ? 'Moderate' : 'Severe'}`)
                  } />
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Associated Symptoms</label>
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {["Nausea", "Vomiting", "Fever", "Chills", "Sweating", "Weight loss",
                        "Anorexia", "Fatigue", "Dyspnoea", "Palpitations", "Dizziness", "Syncope"
                      ].map(s => {
                        const checked = (checkedItems['associated'] || []).includes(s);
                        return (
                          <button key={s} onClick={() => toggleCheck('associated', s)}
                            className={`p-2 rounded text-xs font-medium transition-all ${
                              checked ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-transparent hover:bg-muted/60"
                            }`}
                          >{s}</button>
                        );
                      })}
                    </div>
                  </div>
                  <SelectField label="Exacerbating Factors" field="hpi_exacerbating" options={[
                    "Movement", "Breathing", "Eating", "Lying flat", "Coughing",
                    "Exercise", "Stress", "Cold", "Nothing specific"
                  ]} />
                  <SelectField label="Relieving Factors" field="hpi_relieving" options={[
                    "Rest", "Analgesics", "Antacids", "Sitting up", "Heat",
                    "Cold", "Food", "Nothing helps"
                  ]} />
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save HPI</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PMH - ICD-10 Coded */}
          {activeSection === "pmh" && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Past Medical History</CardTitle>
                  <Badge variant="outline" className="text-[10px]">ICD-10</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search ICD-10 conditions..."
                    value={conditionSearch}
                    onChange={e => setConditionSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-md border border-input bg-background"
                  />
                </div>
                {/* Selected conditions */}
                {selectedConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedConditions.map(c => (
                      <Badge key={c.code} variant="default" className="gap-1 pr-1">
                        <span className="font-mono text-[10px]">{c.code}</span> {c.display}
                        <button onClick={() => setSelectedConditions(prev => prev.filter(x => x.code !== c.code))}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Condition list */}
                <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
                  {filteredConditions.map(c => {
                    const selected = selectedConditions.some(s => s.code === c.code);
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          if (selected) {
                            setSelectedConditions(prev => prev.filter(x => x.code !== c.code));
                          } else {
                            setSelectedConditions(prev => [...prev, c]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                          selected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-medium">{c.display}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{c.code}</Badge>
                      </button>
                    );
                  })}
                </div>
                {/* Status per condition */}
                {selectedConditions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    {selectedConditions.map(c => (
                      <div key={c.code} className="flex items-center gap-3">
                        <span className="text-sm font-medium flex-1">{c.display}</span>
                        <select className="h-8 px-2 text-xs rounded border border-input bg-background"
                          onChange={e => update(`pmh_status_${c.code}`, e.target.value)}>
                          <option value="active">Active</option>
                          <option value="resolved">Resolved</option>
                          <option value="in_remission">In Remission</option>
                        </select>
                        <input type="number" placeholder="Year Dx" min="1950" max="2026"
                          className="w-24 h-8 px-2 text-xs rounded border border-input bg-background"
                          onChange={e => update(`pmh_year_${c.code}`, e.target.value)} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save PMH</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Surgical History */}
          {activeSection === "psh" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Past Surgical History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                    <SelectField label={`Procedure ${i}`} field={`psh_proc_${i}`} options={[
                      "", "Appendicectomy", "Cholecystectomy", "Caesarean Section", "Hernia Repair",
                      "Hysterectomy", "CABG", "Valve Replacement", "Joint Replacement",
                      "Fracture Fixation", "Laparotomy", "Thoracotomy", "Craniotomy", "Other"
                    ]} />
                    <NumberInput label="Year" field={`psh_year_${i}`} />
                    <SelectField label="Complications" field={`psh_comp_${i}`} options={[
                      "None", "Infection", "Bleeding", "DVT/PE", "Anaesthetic complication", "Other"
                    ]} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Surgical Hx</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family History */}
          {activeSection === "fhx" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Family History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { condition: "Hypertension", field: "fhx_htn" },
                  { condition: "Diabetes Mellitus", field: "fhx_dm" },
                  { condition: "Ischaemic Heart Disease", field: "fhx_ihd" },
                  { condition: "Stroke / CVA", field: "fhx_cva" },
                  { condition: "Cancer (any)", field: "fhx_ca" },
                  { condition: "Asthma / Atopy", field: "fhx_asthma" },
                  { condition: "Mental Health Disorder", field: "fhx_psych" },
                  { condition: "Tuberculosis", field: "fhx_tb" },
                  { condition: "Sickle Cell / Thalassaemia", field: "fhx_haem" },
                ].map(item => (
                  <div key={item.field} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">{item.condition}</span>
                    <div className="flex gap-2">
                      {["None", "Father", "Mother", "Sibling", "Multiple"].map(rel => (
                        <button
                          key={rel}
                          onClick={() => update(item.field, rel)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                            formData[item.field] === rel
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >{rel}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Family Hx</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social History */}
          {activeSection === "shx" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Social History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <SelectField label="Occupation" field="shx_occupation" options={[
                  "Employed", "Unemployed", "Student", "Retired", "Self-employed", "Homemaker"
                ]} />
                <SelectField label="Smoking Status" field="shx_smoking" options={[
                  "Never smoked", "Current smoker", "Ex-smoker (<1yr)", "Ex-smoker (>1yr)"
                ]} />
                {formData.shx_smoking?.includes("smoker") && (
                  <NumberInput label="Pack-Years" field="shx_pack_years" />
                )}
                <SelectField label="Alcohol Use" field="shx_alcohol" options={[
                  "None", "Social (<14 units/wk)", "Moderate (14-21 units/wk)", "Heavy (>21 units/wk)", "Dependent"
                ]} />
                <SelectField label="Recreational Drug Use" field="shx_drugs" options={[
                  "None", "Cannabis", "Cocaine", "Heroin/Opioids", "Methamphetamine", "Multiple", "Declined to answer"
                ]} />
                <SelectField label="Exercise" field="shx_exercise" options={[
                  "Sedentary", "Light (1-2x/wk)", "Moderate (3-4x/wk)", "Active (5+/wk)"
                ]} />
                <SelectField label="Diet" field="shx_diet" options={[
                  "Balanced", "Vegetarian", "Vegan", "High salt/fat", "Restricted — medical"
                ]} />
                <SelectField label="Living Situation" field="shx_living" options={[
                  "Lives alone", "With spouse/partner", "With family", "Assisted living", "Homeless", "Institution"
                ]} />
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Social Hx</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Obs/Gyn */}
          {activeSection === "obgyn" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Baby className="w-5 h-5" />
                  Obstetric & Gynaecological History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Gravida", field: "obs_gravida" },
                    { label: "Para", field: "obs_para" },
                    { label: "Abortions", field: "obs_abortions" },
                    { label: "Living Children", field: "obs_living" },
                  ].map(item => (
                    <div key={item.field} className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</label>
                      <input
                        type="number" min="0" max="20"
                        value={formData[item.field] || ''}
                        onChange={e => update(item.field, e.target.value)}
                        className="w-full h-12 px-3 text-center text-2xl font-bold rounded-md border border-input bg-background"
                      />
                    </div>
                  ))}
                </div>
                <SelectField label="Menarche Age" field="obs_menarche" options={
                  Array.from({ length: 10 }, (_, i) => `${i + 9} years`)
                } />
                <SelectField label="Menstrual Cycle" field="obs_cycle" options={[
                  "Regular (28±7 days)", "Irregular", "Amenorrhoea", "Post-menopausal", "On contraception"
                ]} />
                <SelectField label="Contraception" field="obs_contraception" options={[
                  "None", "OCP", "Injectable", "IUD/IUS", "Implant", "Condom", "Sterilised", "Natural methods"
                ]} />
                <SelectField label="Last Cervical Screening" field="obs_pap" options={[
                  "Within 1 year", "1-3 years ago", "3-5 years ago", ">5 years / Never", "Unknown"
                ]} />
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Obs/Gyn</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drug History */}
          {activeSection === "drugs" && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Pill className="w-5 h-5" />Current Medications</CardTitle>
                  <Badge variant="outline" className="text-[10px]">ATC coded</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="grid grid-cols-4 gap-2 p-2.5 bg-muted/30 rounded-lg">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Medication</label>
                      <input type="text" placeholder={`Drug ${i}`} value={formData[`drug_name_${i}`] || ''}
                        onChange={e => update(`drug_name_${i}`, e.target.value)}
                        className="w-full h-9 px-2 text-sm rounded border border-input bg-background" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Dose</label>
                      <input type="text" placeholder="e.g. 500mg" value={formData[`drug_dose_${i}`] || ''}
                        onChange={e => update(`drug_dose_${i}`, e.target.value)}
                        className="w-full h-9 px-2 text-sm rounded border border-input bg-background" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Route</label>
                      <select value={formData[`drug_route_${i}`] || ''} onChange={e => update(`drug_route_${i}`, e.target.value)}
                        className="w-full h-9 px-2 text-xs rounded border border-input bg-background">
                        <option value="">—</option>
                        <option>PO</option><option>IV</option><option>IM</option><option>SC</option>
                        <option>INH</option><option>TOP</option><option>PR</option><option>SL</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Frequency</label>
                      <select value={formData[`drug_freq_${i}`] || ''} onChange={e => update(`drug_freq_${i}`, e.target.value)}
                        className="w-full h-9 px-2 text-xs rounded border border-input bg-background">
                        <option value="">—</option>
                        <option>OD</option><option>BD</option><option>TDS</option><option>QDS</option>
                        <option>PRN</option><option>Nocte</option><option>Stat</option><option>Weekly</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Medications</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allergies */}
          {activeSection === "allergies" && (
            <Card className="border-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Allergies & Adverse Reactions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 mb-2">
                  {["NKDA", "Unable to assess", "Has allergies"].map(opt => (
                    <button key={opt} onClick={() => update('allergy_status', opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.allergy_status === opt
                          ? opt === "Has allergies" ? "bg-warning/20 border-2 border-warning text-warning" : "bg-primary/10 border-2 border-primary"
                          : "bg-muted border-2 border-transparent hover:bg-muted/80"
                      }`}
                    >{opt}</button>
                  ))}
                </div>
                {formData.allergy_status === "Has allergies" && (
                  <>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="grid grid-cols-4 gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Allergen</label>
                          <input type="text" placeholder="e.g. Penicillin" value={formData[`allergen_${i}`] || ''}
                            onChange={e => update(`allergen_${i}`, e.target.value)}
                            className="w-full h-9 px-2 text-sm rounded border border-input bg-background" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label>
                          <select value={formData[`allergen_type_${i}`] || ''} onChange={e => update(`allergen_type_${i}`, e.target.value)}
                            className="w-full h-9 px-2 text-xs rounded border border-input bg-background">
                            <option value="">—</option>
                            <option>Drug</option><option>Food</option><option>Environmental</option><option>Latex</option><option>Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Reaction</label>
                          <select value={formData[`allergen_reaction_${i}`] || ''} onChange={e => update(`allergen_reaction_${i}`, e.target.value)}
                            className="w-full h-9 px-2 text-xs rounded border border-input bg-background">
                            <option value="">—</option>
                            <option>Rash</option><option>Urticaria</option><option>Anaphylaxis</option>
                            <option>Angioedema</option><option>GI upset</option><option>Bronchospasm</option><option>Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Severity</label>
                          <select value={formData[`allergen_sev_${i}`] || ''} onChange={e => update(`allergen_sev_${i}`, e.target.value)}
                            className="w-full h-9 px-2 text-xs rounded border border-input bg-background">
                            <option value="">—</option>
                            <option>Mild</option><option>Moderate</option><option>Severe</option><option>Life-threatening</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save Allergies</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review of Systems */}
          {activeSection === "ros" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Review of Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "General", items: ["Fever", "Weight loss", "Fatigue", "Night sweats", "Appetite change"] },
                  { title: "HEENT", items: ["Headache", "Vision changes", "Hearing loss", "Sore throat", "Nasal congestion"] },
                  { title: "Cardiovascular", items: ["Chest pain", "Palpitations", "Orthopnoea", "PND", "Leg swelling"] },
                  { title: "Respiratory", items: ["Cough", "Dyspnoea", "Wheezing", "Haemoptysis", "Pleuritic pain"] },
                  { title: "GI", items: ["Nausea", "Vomiting", "Diarrhoea", "Constipation", "Abdominal pain", "Melaena"] },
                  { title: "GU", items: ["Dysuria", "Frequency", "Urgency", "Haematuria", "Incontinence"] },
                  { title: "MSK", items: ["Joint pain", "Muscle weakness", "Back pain", "Stiffness", "Swelling"] },
                  { title: "Neuro", items: ["Numbness", "Tingling", "Weakness", "Seizures", "Dizziness", "Syncope"] },
                  { title: "Psychiatric", items: ["Depression", "Anxiety", "Sleep disturbance", "Mood changes"] },
                  { title: "Skin", items: ["Rash", "Pruritus", "Lesions", "Colour changes"] },
                ].map(system => (
                  <div key={system.title} className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{system.title}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {system.items.map(item => {
                        const checked = (checkedItems[`ros_${system.title}`] || []).includes(item);
                        return (
                          <button key={item} onClick={() => toggleCheck(`ros_${system.title}`, item)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              checked ? "bg-warning/15 border border-warning/40 text-warning-foreground" : "bg-muted/40 border border-transparent hover:bg-muted/70"
                            }`}
                          >{checked ? "⚠ " : ""}{item}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveSection}><CheckCircle2 className="w-4 h-4 mr-2" />Save ROS</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Saved Entries Summary */}
      {savedEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documented History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedEntries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium capitalize">{entry.section.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
